"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.Connect4Engine = void 0;
class Connect4Engine {
    constructor() {
        this.ROWS = 6;
        this.COLS = 7;
        this.WINDOW_LENGTH = 4;
        this.EMPTY = 0;
        this.PLAYER1 = 1;
        this.PLAYER2 = 2;
    }
    initialize() {
        return {
            board: Array(this.ROWS)
                .fill(null)
                .map(() => Array(this.COLS).fill(this.EMPTY)),
            moveCount: 0,
            lastMove: null,
            currentPlayer: this.PLAYER1,
        };
    }
    deserialize(data) {
        return {
            board: data.board.map((row) => [...row]),
            moveCount: data.moveCount || 0,
            lastMove: data.lastMove || null,
            currentPlayer: data.currentPlayer || this.PLAYER1,
        };
    }
    serialize(state) {
        return {
            board: state.board.map((row) => [...row]),
            moveCount: state.moveCount,
            lastMove: state.lastMove,
            currentPlayer: state.currentPlayer,
        };
    }
    getLegalMoves(state) {
        const moves = [];
        for (let col = 0; col < this.COLS; col++) {
            if (state.board[0][col] === this.EMPTY) {
                moves.push({ column: col });
            }
        }
        return moves;
    }
    isValidMove(state, move) {
        const { column } = move;
        if (column < 0 || column >= this.COLS) {
            return false;
        }
        // Column is valid if top cell is empty
        return state.board[0][column] === this.EMPTY;
    }
    makeMove(state, move) {
        if (!this.isValidMove(state, move)) {
            return {
                success: false,
                error: "Invalid move: column is full or out of bounds",
            };
        }
        // Create new state
        const newState = {
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
    checkWinner(state, player) {
        // Check horizontal
        for (let row = 0; row < this.ROWS; row++) {
            for (let col = 0; col <= this.COLS - this.WINDOW_LENGTH; col++) {
                if (Array.from({ length: this.WINDOW_LENGTH }).every((_, i) => state.board[row][col + i] === player)) {
                    return true;
                }
            }
        }
        // Check vertical
        for (let col = 0; col < this.COLS; col++) {
            for (let row = 0; row <= this.ROWS - this.WINDOW_LENGTH; row++) {
                if (Array.from({ length: this.WINDOW_LENGTH }).every((_, i) => state.board[row + i][col] === player)) {
                    return true;
                }
            }
        }
        // Check diagonal (bottom-left to top-right)
        for (let row = this.WINDOW_LENGTH - 1; row < this.ROWS; row++) {
            for (let col = 0; col <= this.COLS - this.WINDOW_LENGTH; col++) {
                if (Array.from({ length: this.WINDOW_LENGTH }).every((_, i) => state.board[row - i][col + i] === player)) {
                    return true;
                }
            }
        }
        // Check diagonal (top-left to bottom-right)
        for (let row = 0; row <= this.ROWS - this.WINDOW_LENGTH; row++) {
            for (let col = 0; col <= this.COLS - this.WINDOW_LENGTH; col++) {
                if (Array.from({ length: this.WINDOW_LENGTH }).every((_, i) => state.board[row + i][col + i] === player)) {
                    return true;
                }
            }
        }
        return false;
    }
    isBoardFull(state) {
        for (let col = 0; col < this.COLS; col++) {
            if (state.board[0][col] === this.EMPTY) {
                return false;
            }
        }
        return true;
    }
    isTerminal(state) {
        if (this.checkWinner(state, this.PLAYER1))
            return true;
        if (this.checkWinner(state, this.PLAYER2))
            return true;
        if (this.isBoardFull(state))
            return true;
        return false;
    }
    getStatus(state) {
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
    getGameName() {
        return "Connect Four";
    }
    /**
     * Utility: count consecutive pieces in a direction
     */
    countConsecutive(state, startRow, startCol, player, dRow, dCol) {
        let count = 0;
        let row = startRow + dRow;
        let col = startCol + dCol;
        while (row >= 0 &&
            row < this.ROWS &&
            col >= 0 &&
            col < this.COLS &&
            state.board[row][col] === player) {
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
    evaluatePosition(state, player) {
        let score = 0;
        for (let row = 0; row < this.ROWS; row++) {
            for (let col = 0; col < this.COLS; col++) {
                if (state.board[row][col] !== player)
                    continue;
                // Check all 4 directions from this piece
                const directions = [
                    [0, 1], // horizontal
                    [1, 0], // vertical
                    [1, 1], // diagonal \
                    [1, -1], // diagonal /
                ];
                for (const [dRow, dCol] of directions) {
                    const consecutive = 1 + this.countConsecutive(state, row, col, player, dRow, dCol) +
                        this.countConsecutive(state, row, col, player, -dRow, -dCol);
                    if (consecutive === 4) {
                        score += 1000; // Win
                    }
                    else if (consecutive === 3) {
                        score += 50;
                    }
                    else if (consecutive === 2) {
                        score += 10;
                    }
                }
            }
        }
        return score;
    }
}
exports.Connect4Engine = Connect4Engine;
exports.default = new Connect4Engine();
//# sourceMappingURL=Connect4Engine.js.map