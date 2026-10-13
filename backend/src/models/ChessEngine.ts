/**
 * Chess Game Engine
 * Implements game rules, FEN serialization, legal moves, castling, en passant, promotion, and check/checkmate detection using chess.js.
 */

import { Chess, Square, PieceSymbol } from "chess.js";
import { IGameEngine, GameState, MoveResult, GameStatus } from "./IGameEngine.js";

export interface ChessMove {
  from: string; // e.g. "e2"
  to: string; // e.g. "e4"
  promotion?: string; // e.g. "q", "r", "b", "n"
}

export interface ChessState extends GameState {
  fen: string;
  board: ({ type: string; color: "w" | "b" } | null)[][];
  moveCount: number;
  lastMove: ChessMove | null;
  currentPlayer: number; // 1 for White, 2 for Black
  isCheck: boolean;
  isCheckmate: boolean;
  isDraw: boolean;
  history: string[]; // SAN list
}

export class ChessEngine implements IGameEngine {
  private chess: Chess;

  constructor(fen?: string) {
    this.chess = new Chess(fen);
  }

  initialize(): ChessState {
    this.chess = new Chess();
    return this.exportState(null);
  }

  deserialize(data: any): ChessState {
    const fen = data.fen || (new Chess()).fen();
    this.chess = new Chess(fen);
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

  serialize(state: ChessState): any {
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

  getLegalMoves(state: ChessState): ChessMove[] {
    const c = new Chess(state.fen);
    const moves = c.moves({ verbose: true });
    return moves.map((m) => ({
      from: m.from,
      to: m.to,
      promotion: m.promotion,
    }));
  }

  isValidMove(state: ChessState, move: ChessMove): boolean {
    const c = new Chess(state.fen);
    try {
      const legalMoves = c.moves({ verbose: true });
      const isPromo = legalMoves.some(
        (m) => m.from === move.from && m.to === move.to && m.promotion
      );
      const res = c.move({
        from: move.from as Square,
        to: move.to as Square,
        promotion: move.promotion
          ? (move.promotion as PieceSymbol)
          : isPromo
            ? "q"
            : undefined,
      });
      return res !== null;
    } catch {
      return false;
    }
  }

  makeMove(state: ChessState, move: ChessMove): MoveResult {
    const c = new Chess(state.fen);
    try {
      const legalMoves = c.moves({ verbose: true });
      const isPromo = legalMoves.some(
        (m) => m.from === move.from && m.to === move.to && m.promotion
      );
      const res = c.move({
        from: move.from as Square,
        to: move.to as Square,
        promotion: move.promotion
          ? (move.promotion as PieceSymbol)
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

      const newState: ChessState = {
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
    } catch (e: any) {
      return {
        success: false,
        error: e?.message || "Illegal move",
      };
    }
  }

  checkWinner(state: ChessState, player: number): boolean {
    const c = new Chess(state.fen);
    if (!c.isCheckmate()) return false;
    // If checkmate and turn is Black ('b'), White (player 1) won
    if (c.turn() === "b" && player === 1) return true;
    // If checkmate and turn is White ('w'), Black (player 2) won
    if (c.turn() === "w" && player === 2) return true;
    return false;
  }

  isTerminal(state: ChessState): boolean {
    const c = new Chess(state.fen);
    return c.isGameOver();
  }

  getStatus(state: ChessState): GameStatus {
    const c = new Chess(state.fen);
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

  getGameName(): string {
    return "Chess";
  }

  private exportState(lastMove: ChessMove | null): ChessState {
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

export default new ChessEngine();
