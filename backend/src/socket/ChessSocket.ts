/**
 * Chess Socket.IO Handler
 * Manages real-time chess rooms, move validation, AI invocation, and result persistence via WebSockets.
 */

import { Socket, Server } from "socket.io";
import { PrismaClient } from "@prisma/client";
import { ChessEngine, ChessMove } from "../models/ChessEngine.js";
import AIServiceClient from "../services/AIServiceClient.js";
import { saveFinishedGame } from "../services/GameRecordService.js";
import { v4 as uuidv4 } from "uuid";

export interface ChessGameSession {
  gameId: string;
  player1Id: string;
  player2Id?: string;
  player1Username?: string;
  player2Username?: string;
  hostColor: "white" | "black";
  whitePlayerId: string;
  blackPlayerId?: string;
  isAgainstAI: boolean;
  gameState: any;
  engine: ChessEngine;
  options?: any;
  timeControl: number;
  whiteTime: number;
  blackTime: number;
  lastTurnTimestamp?: number;
  isTimerActive: boolean;
  timerInterval?: NodeJS.Timeout;
}

const activeChessGames: Map<string, ChessGameSession> = new Map();

export function setupChessSocket(
  io: Server,
  aiClient: AIServiceClient,
  prisma: PrismaClient
) {
  io.on("connection", (socket: Socket) => {
    // Create new chess game
    socket.on("create-chess-game", (payload, callback) => {
      try {
        const { playerId, username, vsAI, options } = payload || {};
        const gameId = uuidv4();
        const engine = new ChessEngine();

        const initialState = engine.initialize();

        // Options: playerColor ("white" | "black")
        const hostColor: "white" | "black" = options?.playerColor === "black" ? "black" : "white";
        const isUserWhite = hostColor === "white";

        const whitePlayerId = isUserWhite ? playerId : (vsAI ? "AI" : "");
        const blackPlayerId = isUserWhite ? (vsAI ? "AI" : undefined) : playerId;
        const timeControl = options?.timeControl || 300;

        const session: ChessGameSession = {
          gameId,
          player1Id: playerId,
          player1Username: username || "Player 1",
          hostColor,
          whitePlayerId,
          blackPlayerId,
          isAgainstAI: vsAI || false,
          gameState: initialState,
          engine,
          options: {
            ...options,
            isUserWhite,
            boardTheme: options?.boardTheme || "indigo",
            difficulty: options?.difficulty || 3,
            timeControl,
          },
          timeControl,
          whiteTime: timeControl,
          blackTime: timeControl,
          isTimerActive: false,
        };

        activeChessGames.set(gameId, session);
        socket.join(`game:chess:${gameId}`);

        console.log(`[Chess] Created game ${gameId} with hostColor ${hostColor}, timeControl ${timeControl}s`);

        if (session.isAgainstAI) {
          startChessTimer(session, io, prisma);
        }

        callback?.({
          success: true,
          gameId,
          initialState: session.gameState,
          options: session.options,
          yourColor: hostColor,
          isHost: true,
          whiteTime: session.whiteTime,
          blackTime: session.blackTime,
          timeControl: session.timeControl,
        });

        io.to(`game:chess:${gameId}`).emit("chess-game-created", {
          gameId,
          gameState: session.gameState,
          options: session.options,
          hostColor,
          whiteTime: session.whiteTime,
          blackTime: session.blackTime,
          timeControl: session.timeControl,
        });

        // If AI plays White (user chose Black in AI mode), trigger AI's first move
        if (session.isAgainstAI && !isUserWhite) {
          setTimeout(() => {
            makeAIChessMove(io, session, gameId, aiClient, prisma);
          }, 600);
        }
      } catch (error) {
        console.error("[Chess] Error creating game:", error);
        callback?.({ error: "Failed to create chess game" });
      }
    });

    // Make chess move
    socket.on("make-chess-move", async (payload, callback) => {
      try {
        const { gameId, playerId, move } = payload as {
          gameId: string;
          playerId: string;
          move: ChessMove;
        };

        const session = activeChessGames.get(gameId);
        if (!session) {
          callback?.({ error: "Chess game not found" });
          return;
        }

        const isUserWhite = session.options?.isUserWhite ?? true;
        const currentTurnColor = session.gameState.currentPlayer === 1 ? "white" : "black";

        // Turn validation
        if (session.isAgainstAI) {
          const userColor = isUserWhite ? "white" : "black";
          if (currentTurnColor !== userColor) {
            callback?.({ error: "Not your turn" });
            return;
          }
        } else {
          // In multiplayer:
          // currentPlayer === 1 means White to move.
          // currentPlayer === 2 means Black to move.
          const expectedPlayerId =
            currentTurnColor === "white" ? session.whitePlayerId : session.blackPlayerId;
          if (expectedPlayerId !== playerId) {
            callback?.({ error: "Not your turn" });
            return;
          }
        }

        // Validate and apply move
        if (!session.engine.isValidMove(session.gameState, move)) {
          callback?.({ error: "Illegal move" });
          return;
        }

        // Deduct time for active player
        if (session.isTimerActive && session.lastTurnTimestamp) {
          const now = Date.now();
          const elapsed = (now - session.lastTurnTimestamp) / 1000;
          session.lastTurnTimestamp = now;
          if (session.gameState.currentPlayer === 1) {
            session.whiteTime = Math.max(0, session.whiteTime - elapsed);
          } else {
            session.blackTime = Math.max(0, session.blackTime - elapsed);
          }
        }

        const result = session.engine.makeMove(session.gameState, move);
        if (!result.success) {
          callback?.({ error: result.error || "Move failed" });
          return;
        }

        session.gameState = result.newState!;
        const status = session.engine.getStatus(session.gameState);

        io.to(`game:chess:${gameId}`).emit("chess-move-made", {
          gameId,
          move,
          playerId,
          gameState: session.gameState,
          status,
          whiteTime: Math.ceil(session.whiteTime),
          blackTime: Math.ceil(session.blackTime),
        });

        callback?.({
          success: true,
          gameState: session.gameState,
          whiteTime: Math.ceil(session.whiteTime),
          blackTime: Math.ceil(session.blackTime),
        });

        if (status.status === "finished") {
          await finishChessGame(io, prisma, session, status.result!);
        } else if (session.isAgainstAI) {
          // Trigger AI move
          setTimeout(() => {
            makeAIChessMove(io, session, gameId, aiClient, prisma);
          }, 500);
        }
      } catch (error) {
        console.error("[Chess] Error making move:", error);
        callback?.({ error: "Failed to make move" });
      }
    });

    // Join multiplayer chess game
    socket.on("join-chess-game", (payload, callback) => {
      try {
        const { gameId, playerId, username } = payload;
        const session = activeChessGames.get(gameId);

        if (!session) {
          callback?.({ error: "Chess game not found" });
          return;
        }

        if (session.isAgainstAI) {
          callback?.({ error: "Cannot join an AI game" });
          return;
        }

        // Prevent player from joining their own game (both players must have different IDs)
        if (session.player1Id === playerId) {
          callback?.({ error: "Cannot join your own game. Both players must have different accounts." });
          return;
        }

        const guestColor: "white" | "black" = session.hostColor === "white" ? "black" : "white";

        if (!session.player2Id) {
          session.player2Id = playerId;
          session.player2Username = username || "Player 2";
          if (guestColor === "white") {
            session.whitePlayerId = playerId;
          } else {
            session.blackPlayerId = playerId;
          }

          socket.join(`game:chess:${gameId}`);

          startChessTimer(session, io, prisma);

          io.to(`game:chess:${gameId}`).emit("chess-player-joined", {
            gameId,
            player2Id: playerId,
            player2Username: session.player2Username,
            player1Username: session.player1Username,
            gameState: session.gameState,
            options: session.options,
            guestColor,
            hostColor: session.hostColor,
            whiteTime: Math.ceil(session.whiteTime),
            blackTime: Math.ceil(session.blackTime),
            timeControl: session.timeControl,
          });

          callback?.({
            success: true,
            gameId,
            initialState: session.gameState,
            options: session.options,
            yourColor: guestColor,
            isHost: false,
            player1Id: session.player1Id,
            player1Username: session.player1Username,
            whiteTime: Math.ceil(session.whiteTime),
            blackTime: Math.ceil(session.blackTime),
            timeControl: session.timeControl,
          });
        } else if (session.player2Id === playerId) {
          socket.join(`game:chess:${gameId}`);
          callback?.({
            success: true,
            gameId,
            initialState: session.gameState,
            options: session.options,
            yourColor: guestColor,
            isHost: false,
            player1Id: session.player1Id,
            player1Username: session.player1Username,
            whiteTime: Math.ceil(session.whiteTime),
            blackTime: Math.ceil(session.blackTime),
            timeControl: session.timeControl,
          });
        } else {
          callback?.({ error: "Game is already full" });
        }
      } catch (error) {
        console.error("[Chess] Error joining game:", error);
        callback?.({ error: "Failed to join game" });
      }
    });

    // Get chess game state for reconnect / refresh
    socket.on("get-chess-game", (payload, callback) => {
      try {
        const { gameId, playerId } = payload;
        const session = activeChessGames.get(gameId);

        if (!session) {
          callback?.({ error: "Chess game not found" });
          return;
        }

        socket.join(`game:chess:${gameId}`);

        const isHost = session.player1Id === playerId;
        let yourColor: "white" | "black";

        if (session.isAgainstAI) {
          yourColor = session.hostColor;
        } else if (isHost) {
          yourColor = session.hostColor;
        } else {
          yourColor = session.hostColor === "white" ? "black" : "white";
        }

        const opponentUsername = isHost
          ? (session.isAgainstAI ? "OptiMover Engine" : (session.player2Username || "Opponent"))
          : (session.player1Username || "Host");

        callback?.({
          success: true,
          gameId,
          gameState: session.gameState,
          options: session.options,
          isAgainstAI: session.isAgainstAI,
          isHost,
          yourColor,
          opponentJoined: Boolean(session.player2Id || session.isAgainstAI),
          opponentUsername,
          whiteTime: Math.ceil(session.whiteTime),
          blackTime: Math.ceil(session.blackTime),
          timeControl: session.timeControl,
          isTimerActive: session.isTimerActive,
        });
      } catch (error) {
        console.error("[Chess] Error getting game:", error);
        callback?.({ error: "Failed to get game" });
      }
    });

    // Resign from chess game
    socket.on("resign-chess", async (payload, callback) => {
      try {
        const { gameId, playerId } = payload;
        const session = activeChessGames.get(gameId);

        if (!session) {
          callback?.({ error: "Game not found" });
          return;
        }

        const isPlayer1 = session.player1Id === playerId;
        const result = isPlayer1 ? "player2_wins" : "player1_wins";

        await finishChessGame(io, prisma, session, result, playerId);
        callback?.({ success: true });
      } catch (error) {
        console.error("[Chess] Error resigning:", error);
        callback?.({ error: "Failed to resign" });
      }
    });

    // Offer draw in chess
    socket.on("offer-chess-draw", async (payload, callback) => {
      try {
        const { gameId, playerId } = payload;
        const session = activeChessGames.get(gameId);

        if (!session) {
          callback?.({ error: "Game not found" });
          return;
        }

        if (session.isAgainstAI) {
          // AI evaluates whether to accept draw
          const fen = session.gameState.fen;
          const moveCount = session.gameState.moveCount || 0;
          let aiAccepts = false;

          // AI requires at least 8 moves before agreeing to draw
          if (moveCount >= 8) {
            try {
              const aiEval = await aiClient.getChessMove(fen, 1);
              const score = typeof aiEval.eval === "number" ? aiEval.eval : 0;
              if (Math.abs(score) <= 0.8) {
                aiAccepts = true;
              }
            } catch {
              aiAccepts = true;
            }
          }

          if (aiAccepts) {
            await finishChessGame(io, prisma, session, "draw");
            callback?.({ success: true, accepted: true });
          } else {
            io.to(`game:chess:${gameId}`).emit("chess-draw-declined", {
              gameId,
              message: "AI evaluated the board and declined the draw offer.",
            });
            callback?.({ success: true, accepted: false });
          }
          return;
        }

        // Multiplayer draw offer
        (session as any).drawOfferedBy = playerId;
        io.to(`game:chess:${gameId}`).emit("chess-draw-offered", {
          gameId,
          offeredBy: playerId,
        });
        callback?.({ success: true });
      } catch (error) {
        console.error("[Chess] Error offering draw:", error);
        callback?.({ error: "Failed to offer draw" });
      }
    });

    // Respond to draw offer in chess
    socket.on("respond-chess-draw", async (payload, callback) => {
      try {
        const { gameId, playerId, accept } = payload;
        const session = activeChessGames.get(gameId);

        if (!session) {
          callback?.({ error: "Game not found" });
          return;
        }

        if (accept) {
          await finishChessGame(io, prisma, session, "draw");
          callback?.({ success: true });
        } else {
          delete (session as any).drawOfferedBy;
          io.to(`game:chess:${gameId}`).emit("chess-draw-declined", {
            gameId,
            declinedBy: playerId,
            message: "Opponent declined the draw offer.",
          });
          callback?.({ success: true });
        }
      } catch (error) {
        console.error("[Chess] Error responding to draw:", error);
        callback?.({ error: "Failed to respond to draw" });
      }
    });
  });
}

function startChessTimer(session: ChessGameSession, io: Server, prisma: PrismaClient) {
  if (session.timerInterval) {
    clearInterval(session.timerInterval);
  }
  session.isTimerActive = true;
  session.lastTurnTimestamp = Date.now();

  session.timerInterval = setInterval(() => {
    if (!session.isTimerActive || !session.lastTurnTimestamp) return;

    const now = Date.now();
    const elapsed = (now - session.lastTurnTimestamp) / 1000;
    session.lastTurnTimestamp = now;

    if (session.gameState.currentPlayer === 1) {
      session.whiteTime = Math.max(0, session.whiteTime - elapsed);
      if (session.whiteTime <= 0) {
        handleChessTimeout(session, "white", io, prisma);
        return;
      }
    } else {
      session.blackTime = Math.max(0, session.blackTime - elapsed);
      if (session.blackTime <= 0) {
        handleChessTimeout(session, "black", io, prisma);
        return;
      }
    }

    io.to(`game:chess:${session.gameId}`).emit("chess-time-sync", {
      gameId: session.gameId,
      whiteTime: Math.ceil(session.whiteTime),
      blackTime: Math.ceil(session.blackTime),
      activeTurn: session.gameState.currentPlayer === 1 ? "white" : "black",
    });
  }, 1000);
}

async function handleChessTimeout(
  session: ChessGameSession,
  timedOutColor: "white" | "black",
  io: Server,
  prisma: PrismaClient
) {
  if (session.timerInterval) {
    clearInterval(session.timerInterval);
    session.timerInterval = undefined;
  }
  session.isTimerActive = false;

  const timedOutPlayerId = timedOutColor === "white" ? session.whitePlayerId : session.blackPlayerId;
  const result = timedOutColor === "white" ? "player2_wins" : "player1_wins";

  io.to(`game:chess:${session.gameId}`).emit("chess-time-out", {
    gameId: session.gameId,
    timedOutColor,
    timedOutPlayerId,
  });

  await finishChessGame(io, prisma, session, result, undefined, timedOutPlayerId);
}

async function finishChessGame(
  io: Server,
  prisma: PrismaClient,
  session: ChessGameSession,
  result: string,
  resignedBy?: string,
  timedOutPlayerId?: string
) {
  if (session.timerInterval) {
    clearInterval(session.timerInterval);
    session.timerInterval = undefined;
  }
  session.isTimerActive = false;

  let normalizedResult = result;
  let winner: string | null = null;
  const isUserWhite = session.options?.isUserWhite ?? true;

  if (result === "draw") {
    normalizedResult = "draw";
    winner = null;
  } else if (resignedBy) {
    if (session.isAgainstAI) {
      normalizedResult = "ai_wins";
      winner = "AI";
    } else {
      normalizedResult = resignedBy === session.player1Id ? "player2_wins" : "player1_wins";
      winner = normalizedResult === "player1_wins" ? session.player1Id : (session.player2Id || "AI");
    }
  } else if (session.isAgainstAI) {
    // Engine result: player1_wins means White won; player2_wins means Black won
    if (result === "player1_wins") {
      normalizedResult = isUserWhite ? "player1_wins" : "ai_wins";
      winner = isUserWhite ? session.player1Id : "AI";
    } else if (result === "player2_wins") {
      normalizedResult = isUserWhite ? "ai_wins" : "player1_wins";
      winner = isUserWhite ? "AI" : session.player1Id;
    }
  } else {
    // Multiplayer outcome:
    // Engine result: player1_wins means White won; player2_wins means Black won.
    if (result === "player1_wins") {
      winner = session.whitePlayerId;
      normalizedResult = winner === session.player1Id ? "player1_wins" : "player2_wins";
    } else if (result === "player2_wins") {
      winner = session.blackPlayerId || session.player2Id || "Player 2";
      normalizedResult = winner === session.player1Id ? "player1_wins" : "player2_wins";
    } else {
      normalizedResult = result;
      winner = null;
    }
  }

  io.to(`game:chess:${session.gameId}`).emit("chess-game-ended", {
    gameId: session.gameId,
    result: normalizedResult,
    winner,
    resignedBy,
    timedOutPlayerId,
  });

  await saveFinishedGame(prisma, {
    gameId: session.gameId,
    gameType: "chess",
    player1Id: session.player1Id,
    player2Id: session.player2Id,
    isAgainstAI: session.isAgainstAI,
    result: normalizedResult,
    resignedBy,
  });

  setTimeout(() => activeChessGames.delete(session.gameId), 60000);
}

async function makeAIChessMove(
  io: Server,
  session: ChessGameSession,
  gameId: string,
  aiClient: AIServiceClient,
  prisma: PrismaClient
) {
  try {
    const fen = session.gameState.fen;
    const difficulty = session.options?.difficulty || 3;

    const aiResponse = await aiClient.getChessMove(fen, difficulty);

    const move: ChessMove = {
      from: aiResponse.from,
      to: aiResponse.to,
      promotion: aiResponse.promotion || undefined,
    };

    if (!session.engine.isValidMove(session.gameState, move)) {
      console.error("[Chess AI] Illegal move returned:", aiResponse);
      return;
    }

    if (session.isTimerActive && session.lastTurnTimestamp) {
      const now = Date.now();
      const elapsed = (now - session.lastTurnTimestamp) / 1000;
      session.lastTurnTimestamp = now;
      if (session.gameState.currentPlayer === 1) {
        session.whiteTime = Math.max(0, session.whiteTime - elapsed);
      } else {
        session.blackTime = Math.max(0, session.blackTime - elapsed);
      }
    }

    const result = session.engine.makeMove(session.gameState, move);
    if (!result.success) {
      console.error("[Chess AI] Move error:", result.error);
      return;
    }

    session.gameState = result.newState!;
    const status = session.engine.getStatus(session.gameState);

    io.to(`game:chess:${gameId}`).emit("chess-move-made", {
      gameId,
      move,
      playerId: "AI",
      gameState: session.gameState,
      status,
      eval: aiResponse.eval,
      whiteTime: Math.ceil(session.whiteTime),
      blackTime: Math.ceil(session.blackTime),
    });

    if (status.status === "finished") {
      await finishChessGame(io, prisma, session, status.result!);
    }
  } catch (error) {
    console.error("[Chess AI] Inference failed:", error);
    io.to(`game:chess:${gameId}`).emit("chess-ai-error", {
      gameId,
      error: "Chess AI service is currently unavailable",
    });
  }
}
