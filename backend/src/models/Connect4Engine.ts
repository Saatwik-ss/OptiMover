/**
 * Connect Four Game Engine
 * Implements game rules for Connect Four
 *
 * Board representation:
 * - 6 rows × 7 columns (0-indexed)
 * - 0: empty, 1: player 1, 2: player 2
 * - Rows: 0 (top) to 5 (bottom)
 * - Columns: 0 (left) to 6 (right)
 */

import { IGameEngine, GameState, MoveResult, GameStatus } from "./IGameEngine";

export interface Connect4State extends GameState {
  board: number[][];
  moveCount: number;
  lastMove: { row: number; col: number } | null;
  currentPlayer: number; // 1 or 2
}

export interface Connect4Move {
  column: number;
}

export class Connect4Engine implements IGameEngine {
  readonly ROWS = 6;
  readonly COLS = 7;
  readonly WINDOW_LENGTH = 4;

  readonly EMPTY = 0;
  readonly PLAYER1 = 1;
  readonly PLAYER2 = 2;

  initialize(): Connect4State {
    return {
      board: Array(this.ROWS)
        .fill(null)
        .map(() => Array(this.COLS).fill(this.EMPTY)),
      moveCount: 0,
      lastMove: null,
      currentPlayer: this.PLAYER1,
    };
  }

  deserialize(data: any): Connect4State {
    return {
      board: data.board.map((row: any) => [...row]),
      moveCount: data.moveCount || 0,
      lastMove: data.lastMove || null,
      currentPlayer: data.currentPlayer || this.PLAYER1,
    };
  }

  serialize(state: Connect4State): any {
    return {
      board: state.board.map((row) => [...row]),
      moveCount: state.moveCount,
      lastMove: state.lastMove,
      currentPlayer: state.currentPlayer,
    };
  }

  getLegalMoves(state: Connect4State): Connect4Move[] {
    const moves: Connect4Move[] = [];
    for (let col = 0; col < this.COLS; col++) {
      if (state.board[0][col] === this.EMPTY) {
        moves.push({ column: col });
      }
    }
    return moves;
  }

  isValidMove(state: Connect4State, move: Connect4Move): boolean {
    const { column } = move;
    if (column < 0 || column >= this.COLS) {
      return false;
    }
    // Column is valid if top cell is empty
    return state.board[0][column] === this.EMPTY;
  }

  makeMove(state: Connect4State, move: Connect4Move): MoveResult {
    if (!this.isValidMove(state, move)) {
      return {
        success: false,
        error: "Invalid move: column is full or out of bounds",
      };
    }

    // Create new state
    const newState: Connect4State = {
      board: state.board.map((row) => [...row]),
      moveCount: state.moveCount + 1,
      lastMove: null,
      currentPlayer: state.currentPlayer === this.PLAYER1 ? this.PLAYER2 : this.PLAYER1,
    };

    // Find lowest empty row in column
    const { column } = move;
    for (let row = this.ROWS - 1; row >= 0; row--) {
      if (newState.board[row][column] === this.EMPTY) {
        newState.board[row][column] = state.currentPlayer;
        newState.lastMove = { row, col: column };
        break;
      }
    }

    return {
      success: true,
      newState,
    };
  }

  checkWinner(state: Connect4State, player: number): boolean {
    // Check horizontal
    for (let row = 0; row < this.ROWS; row++) {
      for (let col = 0; col <= this.COLS - this.WINDOW_LENGTH; col++) {
        if (
          Array.from({ length: this.WINDOW_LENGTH }).every(
            (_, i) => state.board[row][col + i] === player
          )
        ) {
          return true;
        }
      }
    }

    // Check vertical
    for (let col = 0; col < this.COLS; col++) {
      for (let row = 0; row <= this.ROWS - this.WINDOW_LENGTH; row++) {
        if (
          Array.from({ length: this.WINDOW_LENGTH }).every(
            (_, i) => state.board[row + i][col] === player
          )
        ) {
          return true;
        }
      }
    }

    // Check diagonal (bottom-left to top-right)
    for (let row = this.WINDOW_LENGTH - 1; row < this.ROWS; row++) {
      for (let col = 0; col <= this.COLS - this.WINDOW_LENGTH; col++) {
        if (
          Array.from({ length: this.WINDOW_LENGTH }).every(
            (_, i) => state.board[row - i][col + i] === player
          )
        ) {
          return true;
        }
      }
    }

    // Check diagonal (top-left to bottom-right)
    for (let row = 0; row <= this.ROWS - this.WINDOW_LENGTH; row++) {
      for (let col = 0; col <= this.COLS - this.WINDOW_LENGTH; col++) {
        if (
          Array.from({ length: this.WINDOW_LENGTH }).every(
            (_, i) => state.board[row + i][col + i] === player
          )
        ) {
          return true;
        }
      }
    }

    return false;
  }

  isBoardFull(state: Connect4State): boolean {
    for (let col = 0; col < this.COLS; col++) {
      if (state.board[0][col] === this.EMPTY) {
        return false;
      }
    }
    return true;
  }

  isTerminal(state: Connect4State): boolean {
    if (this.checkWinner(state, this.PLAYER1)) return true;
    if (this.checkWinner(state, this.PLAYER2)) return true;
    if (this.isBoardFull(state)) return true;
    return false;
  }

  getStatus(state: Connect4State): GameStatus {
    if (this.checkWinner(state, this.PLAYER1)) {
      return {
        status: "finished",
        result: "player1_wins",
        winner: 1,
      };
    }
    if (this.checkWinner(state, this.PLAYER2)) {
      return {
        status: "finished",
        result: "player2_wins",
        winner: 2,
      };
    }
    if (this.isBoardFull(state)) {
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
    return "Connect Four";
  }

  /**
   * Utility: count consecutive pieces in a direction
   */
  private countConsecutive(
    state: Connect4State,
    startRow: number,
    startCol: number,
    player: number,
    dRow: number,
    dCol: number
  ): number {
    let count = 0;
    let row = startRow + dRow;
    let col = startCol + dCol;

    while (
      row >= 0 &&
      row < this.ROWS &&
      col >= 0 &&
      col < this.COLS &&
      state.board[row][col] === player
    ) {
      count++;
      row += dRow;
      col += dCol;
    }

    return count;
  }

  /**
   * Utility: get a threat score for a position
   * Used for heuristic evaluation (when AI model is not available)
   */
  evaluatePosition(state: Connect4State, player: number): number {
    let score = 0;

    for (let row = 0; row < this.ROWS; row++) {
      for (let col = 0; col < this.COLS; col++) {
        if (state.board[row][col] !== player) continue;

        // Check all 4 directions from this piece
        const directions = [
          [0, 1], // horizontal
          [1, 0], // vertical
          [1, 1], // diagonal \
          [1, -1], // diagonal /
        ];

        for (const [dRow, dCol] of directions) {
          const consecutive =
            1 + this.countConsecutive(state, row, col, player, dRow, dCol) +
            this.countConsecutive(state, row, col, player, -dRow, -dCol);

          if (consecutive === 4) {
            score += 1000; // Win
          } else if (consecutive === 3) {
            score += 50;
          } else if (consecutive === 2) {
            score += 10;
          }
        }
      }
    }

    return score;
  }
}

export default new Connect4Engine();
