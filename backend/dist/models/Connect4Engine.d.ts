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
    lastMove: {
        row: number;
        col: number;
    } | null;
    currentPlayer: number;
}
export interface Connect4Move {
    column: number;
}
export declare class Connect4Engine implements IGameEngine {
    readonly ROWS = 6;
    readonly COLS = 7;
    readonly WINDOW_LENGTH = 4;
    readonly EMPTY = 0;
    readonly PLAYER1 = 1;
    readonly PLAYER2 = 2;
    initialize(): Connect4State;
    deserialize(data: any): Connect4State;
    serialize(state: Connect4State): any;
    getLegalMoves(state: Connect4State): Connect4Move[];
    isValidMove(state: Connect4State, move: Connect4Move): boolean;
    makeMove(state: Connect4State, move: Connect4Move): MoveResult;
    checkWinner(state: Connect4State, player: number): boolean;
    isBoardFull(state: Connect4State): boolean;
    isTerminal(state: Connect4State): boolean;
    getStatus(state: Connect4State): GameStatus;
    getGameName(): string;
    /**
     * Utility: count consecutive pieces in a direction
     */
    private countConsecutive;
    /**
     * Utility: get a threat score for a position
     * Used for heuristic evaluation (when AI model is not available)
     */
    evaluatePosition(state: Connect4State, player: number): number;
}
declare const _default: Connect4Engine;
export default _default;
//# sourceMappingURL=Connect4Engine.d.ts.map