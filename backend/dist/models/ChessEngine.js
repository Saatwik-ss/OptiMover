"use strict";
/**
 * Chess Game Engine
 * Implements game rules, FEN serialization, legal moves, castling, en passant, promotion, and check/checkmate detection using chess.js.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChessEngine = void 0;
const chess_js_1 = require("chess.js");
class ChessEngine {
    constructor(fen) {
        this.chess = new chess_js_1.Chess(fen);
    }
    initialize() {
        this.chess = new chess_js_1.Chess();
        return this.exportState(null);
    }
    deserialize(data) {
        const fen = data.fen || (new chess_js_1.Chess()).fen();
        this.chess = new chess_js_1.Chess(fen);
        return {
            fen: this.chess.fen(),
            board: this.chess.board(),
            moveCount: data.moveCount || 0,
            lastMove: data.lastMove || null,
            currentPlayer: this.chess.turn() === "w" ? 1 : 2,
            isCheck: this.chess.inCheck(),
            isCheckmate: this.chess.isCheckmate(),
            isDraw: this.chess.isDraw(),
            history: data.history || this.chess.history(),
        };
    }
    serialize(state) {
        return {
            fen: state.fen,
            board: state.board,
            moveCount: state.moveCount,
            lastMove: state.lastMove,
            currentPlayer: state.currentPlayer,
            isCheck: state.isCheck,
            isCheckmate: state.isCheckmate,
            isDraw: state.isDraw,
            history: state.history,
        };
    }
    getLegalMoves(state) {
        const c = new chess_js_1.Chess(state.fen);
        const moves = c.moves({ verbose: true });
        return moves.map((m) => ({
            from: m.from,
            to: m.to,
            promotion: m.promotion,
        }));
    }
    isValidMove(state, move) {
        const c = new chess_js_1.Chess(state.fen);
        try {
            const legalMoves = c.moves({ verbose: true });
            const isPromo = legalMoves.some((m) => m.from === move.from && m.to === move.to && m.promotion);
            const res = c.move({
                from: move.from,
                to: move.to,
                promotion: move.promotion
                    ? move.promotion
                    : isPromo
                        ? "q"
                        : undefined,
            });
            return res !== null;
        }
        catch {
            return false;
        }
    }
    makeMove(state, move) {
        const c = new chess_js_1.Chess(state.fen);
        try {
            const legalMoves = c.moves({ verbose: true });
            const isPromo = legalMoves.some((m) => m.from === move.from && m.to === move.to && m.promotion);
            const res = c.move({
                from: move.from,
                to: move.to,
                promotion: move.promotion
                    ? move.promotion
                    : isPromo
                        ? "q"
                        : undefined,
            });
            if (!res) {
                return {
                    success: false,
                    error: "Invalid chess move",
                };
            }
            const newState = {
                fen: c.fen(),
                board: c.board(),
                moveCount: state.moveCount + 1,
                lastMove: {
                    from: res.from,
                    to: res.to,
                    promotion: res.promotion,
                },
                currentPlayer: c.turn() === "w" ? 1 : 2,
                isCheck: c.inCheck(),
                isCheckmate: c.isCheckmate(),
                isDraw: c.isDraw(),
                history: [...(state.history || []), res.san],
            };
            return {
                success: true,
                newState,
            };
        }
        catch (e) {
            return {
                success: false,
                error: e?.message || "Illegal move",
            };
        }
    }
    checkWinner(state, player) {
        const c = new chess_js_1.Chess(state.fen);
        if (!c.isCheckmate())
            return false;
        // If checkmate and turn is Black ('b'), White (player 1) won
        if (c.turn() === "b" && player === 1)
            return true;
        // If checkmate and turn is White ('w'), Black (player 2) won
        if (c.turn() === "w" && player === 2)
            return true;
        return false;
    }
    isTerminal(state) {
        const c = new chess_js_1.Chess(state.fen);
        return c.isGameOver();
    }
    getStatus(state) {
        const c = new chess_js_1.Chess(state.fen);
        if (c.isCheckmate()) {
            const winner = c.turn() === "b" ? 1 : 2;
            return {
                status: "finished",
                result: winner === 1 ? "player1_wins" : "player2_wins",
                winner,
            };
        }
        if (c.isDraw()) {
            return {
                status: "finished",
                result: "draw",
            };
        }
        return {
            status: "ongoing",
        };
    }
    getGameName() {
        return "Chess";
    }
    exportState(lastMove) {
        return {
            fen: this.chess.fen(),
            board: this.chess.board(),
            moveCount: this.chess.history().length,
            lastMove,
            currentPlayer: this.chess.turn() === "w" ? 1 : 2,
            isCheck: this.chess.inCheck(),
            isCheckmate: this.chess.isCheckmate(),
            isDraw: this.chess.isDraw(),
            history: this.chess.history(),
        };
    }
}
exports.ChessEngine = ChessEngine;
exports.default = new ChessEngine();
//# sourceMappingURL=ChessEngine.js.map