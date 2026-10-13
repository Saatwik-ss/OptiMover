"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupConnectFourSocket = setupConnectFourSocket;
const Connect4Engine_js_1 = require("../models/Connect4Engine.js");
const GameRecordService_js_1 = require("../services/GameRecordService.js");
const uuid_1 = require("uuid");
// In-memory storage for active games
const activeGames = new Map();
function setupConnectFourSocket(io, aiClient, prisma) {
    io.on("connection", (socket) => {
        console.log(`[Connect Four] User connected: ${socket.id}`);
        // Create new game
        socket.on("create-game", (payload, callback) => {
            try {
                const { playerId, gameType, vsAI } = payload;
                const { options } = payload || {};
                if (gameType !== "connect-four") {
                    callback({ error: "Invalid game type" });
                    return;
                }
                const gameId = (0, uuid_1.v4)();
                const engine = new Connect4Engine_js_1.Connect4Engine();
                const initialState = engine.initialize();
                // Apply options: who moves first
                if (options && options.whoMovesFirst === "opponent") {
                    // set starting player to 2
                    initialState.currentPlayer = 2;
                }
                else {
                    initialState.currentPlayer = 1;
                }
                const timeControl = options?.timeControl || 300;
                const game = {
                    gameId,
                    player1Id: playerId,
                    isAgainstAI: vsAI || false,
                    gameState: initialState,
                    engine,
                    options: options || null,
                    timeControl,
                    player1Time: timeControl,
                    player2Time: timeControl,
                    isTimerActive: false,
                };
                activeGames.set(gameId, game);
                socket.join(`game:${gameId}`);
                console.log(`[Connect Four] Created game ${gameId} with timeControl ${timeControl}s`);
                if (vsAI) {
                    startConnectFourTimer(game, io, prisma);
                }
                callback({
                    success: true,
                    gameId,
                    initialState: engine.serialize(game.gameState),
                    options: game.options || null,
                    player1Time: game.player1Time,
                    player2Time: game.player2Time,
                    timeControl: game.timeControl,
                });
                // Emit to all players in room
                io.to(`game:${gameId}`).emit("game-created", {
                    gameId,
                    gameState: engine.serialize(game.gameState),
                    options: game.options || null,
                    player1Time: game.player1Time,
                    player2Time: game.player2Time,
                    timeControl: game.timeControl,
                });
                // If AI starts (player 2) and it's an AI game, trigger AI move
                if (game.isAgainstAI && game.gameState.currentPlayer === 2) {
                    setTimeout(() => {
                        makeAIMove(io, game, gameId, aiClient, prisma);
                    }, 500);
                }
            }
            catch (error) {
                console.error("Error creating game:", error);
                callback({ error: "Failed to create game" });
            }
        });
        // Player makes move
        socket.on("make-move", async (payload, callback) => {
            try {
                const { gameId, playerId, column } = payload;
                const game = activeGames.get(gameId);
                if (!game) {
                    callback({ error: "Game not found" });
                    return;
                }
                // Validate it's this player's turn
                const isPlayer1 = game.player1Id === playerId;
                const isAIGame = game.isAgainstAI;
                if (isAIGame) {
                    if (!isPlayer1 || game.gameState.currentPlayer !== 1) {
                        callback({ error: "Not your turn" });
                        return;
                    }
                }
                else {
                    const expectedPlayer = game.gameState.currentPlayer === 1 ? game.player1Id : game.player2Id;
                    if (expectedPlayer !== playerId) {
                        callback({ error: "Not your turn" });
                        return;
                    }
                }
                // Validate move
                const move = { column };
                if (!game.engine.isValidMove(game.gameState, move)) {
                    callback({ error: "Invalid move: column is full" });
                    return;
                }
                // Deduct time for active player
                if (game.isTimerActive && game.lastTurnTimestamp) {
                    const now = Date.now();
                    const elapsed = (now - game.lastTurnTimestamp) / 1000;
                    game.lastTurnTimestamp = now;
                    if (game.gameState.currentPlayer === 1) {
                        game.player1Time = Math.max(0, game.player1Time - elapsed);
                    }
                    else {
                        game.player2Time = Math.max(0, game.player2Time - elapsed);
                    }
                }
                // Make move
                const result = game.engine.makeMove(game.gameState, move);
                if (!result.success) {
                    callback({ error: result.error });
                    return;
                }
                game.gameState = result.newState;
                // Check game status
                const status = game.engine.getStatus(game.gameState);
                // Broadcast move to all players
                io.to(`game:${gameId}`).emit("move-made", {
                    gameId,
                    move: { column },
                    playerId,
                    gameState: game.engine.serialize(game.gameState),
                    status,
                    player1Time: Math.ceil(game.player1Time),
                    player2Time: Math.ceil(game.player2Time),
                });
                callback({
                    success: true,
                    player1Time: Math.ceil(game.player1Time),
                    player2Time: Math.ceil(game.player2Time),
                });
                if (status.status === "finished") {
                    await finishGame(io, prisma, game, status.result);
                }
                else if (isAIGame &&
                    game.gameState.currentPlayer === 2) {
                    setTimeout(() => {
                        makeAIMove(io, game, gameId, aiClient, prisma);
                    }, 500);
                }
            }
            catch (error) {
                console.error("Error making move:", error);
                callback({ error: "Failed to make move" });
            }
        });
        // Join existing game
        socket.on("join-game", (payload, callback) => {
            try {
                const { gameId, playerId } = payload;
                const game = activeGames.get(gameId);
                if (!game) {
                    callback({ error: "Game not found" });
                    return;
                }
                if (game.isAgainstAI) {
                    callback({ error: "Cannot join AI game" });
                    return;
                }
                // Prevent player from joining their own game (both players must have different IDs)
                if (game.player1Id === playerId) {
                    callback({ error: "Cannot join your own game. Both players must have different accounts." });
                    return;
                }
                // Set as player 2
                if (!game.player2Id) {
                    game.player2Id = playerId;
                    socket.join(`game:${gameId}`);
                    startConnectFourTimer(game, io, prisma);
                    io.to(`game:${gameId}`).emit("player-joined", {
                        gameId,
                        player2Id: playerId,
                        gameState: game.engine.serialize(game.gameState),
                        options: game.options || null,
                        player1Time: Math.ceil(game.player1Time),
                        player2Time: Math.ceil(game.player2Time),
                        timeControl: game.timeControl,
                    });
                    callback({
                        success: true,
                        gameId,
                        initialState: game.engine.serialize(game.gameState),
                        options: game.options || null,
                        player1Time: Math.ceil(game.player1Time),
                        player2Time: Math.ceil(game.player2Time),
                        timeControl: game.timeControl,
                    });
                }
                else if (game.player2Id === playerId) {
                    socket.join(`game:${gameId}`);
                    callback({
                        success: true,
                        gameId,
                        initialState: game.engine.serialize(game.gameState),
                        options: game.options || null,
                        player1Time: Math.ceil(game.player1Time),
                        player2Time: Math.ceil(game.player2Time),
                        timeControl: game.timeControl,
                    });
                }
                else {
                    callback({ error: "Game is full" });
                }
            }
            catch (error) {
                console.error("Error joining game:", error);
                callback({ error: "Failed to join game" });
            }
        });
        // Resign from game
        socket.on("resign", async (payload, callback) => {
            try {
                const { gameId, playerId } = payload;
                const game = activeGames.get(gameId);
                if (!game) {
                    callback({ error: "Game not found" });
                    return;
                }
                await finishGame(io, prisma, game, "resignation", playerId);
                callback({ success: true });
            }
            catch (error) {
                console.error("Error resigning:", error);
                callback({ error: "Failed to resign" });
            }
        });
        // Offer draw in Connect Four
        socket.on("offer-draw", async (payload, callback) => {
            try {
                const { gameId, playerId } = payload;
                const game = activeGames.get(gameId);
                if (!game) {
                    callback?.({ error: "Game not found" });
                    return;
                }
                if (game.isAgainstAI) {
                    let totalPieces = 0;
                    for (const row of game.gameState.board) {
                        for (const cell of row) {
                            if (cell !== 0)
                                totalPieces++;
                        }
                    }
                    if (totalPieces >= 14) {
                        await finishGame(io, prisma, game, "draw");
                        callback?.({ success: true, accepted: true });
                    }
                    else {
                        io.to(`game:${gameId}`).emit("draw-declined", {
                            gameId,
                            message: "AI declined the draw offer as the game has just begun.",
                        });
                        callback?.({ success: true, accepted: false });
                    }
                    return;
                }
                game.drawOfferedBy = playerId;
                io.to(`game:${gameId}`).emit("draw-offered", {
                    gameId,
                    offeredBy: playerId,
                });
                callback?.({ success: true });
            }
            catch (error) {
                console.error("Error offering draw:", error);
                callback?.({ error: "Failed to offer draw" });
            }
        });
        // Respond to draw in Connect Four
        socket.on("respond-draw", async (payload, callback) => {
            try {
                const { gameId, playerId, accept } = payload;
                const game = activeGames.get(gameId);
                if (!game) {
                    callback?.({ error: "Game not found" });
                    return;
                }
                if (accept) {
                    await finishGame(io, prisma, game, "draw");
                    callback?.({ success: true });
                }
                else {
                    delete game.drawOfferedBy;
                    io.to(`game:${gameId}`).emit("draw-declined", {
                        gameId,
                        declinedBy: playerId,
                        message: "Opponent declined the draw offer.",
                    });
                    callback?.({ success: true });
                }
            }
            catch (error) {
                console.error("Error responding to draw:", error);
                callback?.({ error: "Failed to respond to draw" });
            }
        });
        socket.on("disconnect", () => {
            console.log(`[Connect Four] User disconnected: ${socket.id}`);
        });
    });
}
function startConnectFourTimer(game, io, prisma) {
    if (game.timerInterval) {
        clearInterval(game.timerInterval);
    }
    game.isTimerActive = true;
    game.lastTurnTimestamp = Date.now();
    game.timerInterval = setInterval(() => {
        if (!game.isTimerActive || !game.lastTurnTimestamp)
            return;
        const now = Date.now();
        const elapsed = (now - game.lastTurnTimestamp) / 1000;
        game.lastTurnTimestamp = now;
        if (game.gameState.currentPlayer === 1) {
            game.player1Time = Math.max(0, game.player1Time - elapsed);
            if (game.player1Time <= 0) {
                handleConnectFourTimeout(game, 1, io, prisma);
                return;
            }
        }
        else {
            game.player2Time = Math.max(0, game.player2Time - elapsed);
            if (game.player2Time <= 0) {
                handleConnectFourTimeout(game, 2, io, prisma);
                return;
            }
        }
        io.to(`game:${game.gameId}`).emit("connect-four-time-sync", {
            gameId: game.gameId,
            player1Time: Math.ceil(game.player1Time),
            player2Time: Math.ceil(game.player2Time),
            currentPlayer: game.gameState.currentPlayer,
        });
    }, 1000);
}
async function handleConnectFourTimeout(game, timedOutPlayer, io, prisma) {
    if (game.timerInterval) {
        clearInterval(game.timerInterval);
        game.timerInterval = undefined;
    }
    game.isTimerActive = false;
    const result = timedOutPlayer === 1 ? "player2_wins" : "player1_wins";
    const timedOutPlayerId = timedOutPlayer === 1 ? game.player1Id : (game.player2Id || "AI");
    io.to(`game:${game.gameId}`).emit("connect-four-time-out", {
        gameId: game.gameId,
        timedOutPlayer,
        timedOutPlayerId,
    });
    await finishGame(io, prisma, game, result, undefined, timedOutPlayerId);
}
async function finishGame(io, prisma, game, result, resignedBy, timedOutPlayerId) {
    if (game.timerInterval) {
        clearInterval(game.timerInterval);
        game.timerInterval = undefined;
    }
    game.isTimerActive = false;
    const normalized = (0, GameRecordService_js_1.normalizeConnectFourResult)(result, game.isAgainstAI, game.player1Id, resignedBy);
    const winner = normalized === "draw"
        ? null
        : normalized === "player1_wins"
            ? game.player1Id
            : normalized === "ai_wins"
                ? "AI"
                : game.player2Id || "AI";
    io.to(`game:${game.gameId}`).emit("game-ended", {
        gameId: game.gameId,
        result: normalized,
        winner,
        timedOutPlayerId,
    });
    await (0, GameRecordService_js_1.saveFinishedGame)(prisma, {
        gameId: game.gameId,
        gameType: "connect-four",
        player1Id: game.player1Id,
        player2Id: game.player2Id,
        isAgainstAI: game.isAgainstAI,
        result,
        resignedBy,
    });
    setTimeout(() => activeGames.delete(game.gameId), 60000);
}
/**
 * Make AI move
 */
async function makeAIMove(io, game, gameId, aiClient, prisma) {
    try {
        const boardData = game.gameState.board;
        // Get AI move from service
        const aiMoveResponse = await aiClient.getConnectFourMove(boardData, game.options || undefined);
        const column = aiMoveResponse.move;
        // Validate and make move
        const move = { column };
        if (!game.engine.isValidMove(game.gameState, move)) {
            console.error("[AI] Invalid move returned:", column);
            return;
        }
        if (game.isTimerActive && game.lastTurnTimestamp) {
            const now = Date.now();
            const elapsed = (now - game.lastTurnTimestamp) / 1000;
            game.lastTurnTimestamp = now;
            if (game.gameState.currentPlayer === 1) {
                game.player1Time = Math.max(0, game.player1Time - elapsed);
            }
            else {
                game.player2Time = Math.max(0, game.player2Time - elapsed);
            }
        }
        const result = game.engine.makeMove(game.gameState, move);
        if (!result.success) {
            console.error("[AI] Move failed:", result.error);
            return;
        }
        game.gameState = result.newState;
        const status = game.engine.getStatus(game.gameState);
        // Broadcast AI move
        io.to(`game:${gameId}`).emit("move-made", {
            gameId,
            move: { column },
            playerId: "AI",
            gameState: game.engine.serialize(game.gameState),
            status,
            player1Time: Math.ceil(game.player1Time),
            player2Time: Math.ceil(game.player2Time),
        });
        if (status.status === "finished") {
            await finishGame(io, prisma, game, status.result);
        }
    }
    catch (error) {
        console.error("[AI] Error getting move:", error);
        io.to(`game:${gameId}`).emit("ai-error", {
            gameId,
            error: "AI service unavailable",
        });
    }
}
//# sourceMappingURL=ConnectFourSocket.js.map