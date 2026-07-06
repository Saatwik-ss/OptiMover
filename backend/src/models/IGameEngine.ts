/**
 * Game Engine Interface
 * Defines the contract for all game rule engines
 */

export interface GameState {
  board: any; // Game-specific board representation
  moveCount: number;
  lastMove: any; // Game-specific move format
  currentPlayer: number; // 1 or 2
}

export interface MoveResult {
  success: boolean;
  error?: string;
  newState?: GameState;
}

export interface GameStatus {
  status: "ongoing" | "finished" | "abandoned";
  result?: "player1_wins" | "player2_wins" | "draw";
  winner?: number;
}

export interface IGameEngine {
  /**
   * Initialize a new game
   * Returns initial game state
   */
  initialize(): GameState;

  /**
   * Create a game state from serialized data
   */
  deserialize(data: any): GameState;

  /**
   * Convert game state to serializable format
   */
  serialize(state: GameState): any;

  /**
   * Get all legal moves for current position
   */
  getLegalMoves(state: GameState): any[];

  /**
   * Make a move and return new game state
   */
  makeMove(state: GameState, move: any): MoveResult;

  /**
   * Check if player has won
   */
  checkWinner(state: GameState, player: number): boolean;

  /**
   * Get current game status
   */
  getStatus(state: GameState): GameStatus;

  /**
   * Check if board is in terminal state
   */
  isTerminal(state: GameState): boolean;

  /**
   * Validate if a move is legal
   */
  isValidMove(state: GameState, move: any): boolean;

  /**
   * Get game name for logging/debugging
   */
  getGameName(): string;
}
