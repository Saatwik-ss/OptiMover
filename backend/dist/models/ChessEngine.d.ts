/**
 * Chess Game Engine
 * Implements game rules, FEN serialization, legal moves, castling, en passant, promotion, and check/checkmate detection using chess.js.
 */
import { IGameEngine, GameState, MoveResult, GameStatus } from "./IGameEngine.js";
export interface ChessMove {
    from: string;
    to: string;
    promotion?: string;
}
export interface ChessState extends GameState {
    fen: string;
    board: ({
        type: string;
        color: "w" | "b";
    } | null)[][];
    moveCount: number;
    lastMove: ChessMove | null;
    currentPlayer: number;
    isCheck: boolean;
    isCheckmate: boolean;
    isDraw: boolean;
    history: string[];
}
export declare class ChessEngine implements IGameEngine {
    private chess;
    constructor(fen?: string);
    initialize(): ChessState;
    deserialize(data: any): ChessState;
    serialize(state: ChessState): any;
    getLegalMoves(state: ChessState): ChessMove[];
    isValidMove(state: ChessState, move: ChessMove): boolean;
    makeMove(state: ChessState, move: ChessMove): MoveResult;
    checkWinner(state: ChessState, player: number): boolean;
    isTerminal(state: ChessState): boolean;
    getStatus(state: ChessState): GameStatus;
    getGameName(): string;
    private exportState;
}
declare const _default: ChessEngine;
export default _default;
//# sourceMappingURL=ChessEngine.d.ts.map