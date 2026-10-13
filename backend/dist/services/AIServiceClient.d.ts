/**
 * AI Service Client
 * HTTP client for communicating with Python FastAPI AI service
 */
export interface AIMove {
    move: number;
    confidence?: number;
    analysis?: Record<number, number>;
}
export interface AIChessMove {
    move: string;
    from: string;
    to: string;
    promotion?: string;
    eval?: number;
}
export interface PositionAnalysis {
    win_probability: number;
    valid_moves: number[];
    move_scores: Record<number, number>;
}
export interface GameState {
    status: "ongoing" | "human_wins" | "ai_wins" | "draw";
    is_full: boolean;
    last_move?: [number, number];
}
export declare class AIServiceClient {
    private client;
    private baseURL;
    constructor(baseURL?: string);
    /**
     * Get AI's move for Connect Four
     */
    getConnectFourMove(board: number[][], options?: Record<string, any>): Promise<AIMove>;
    /**
     * Get AI's move for Chess
     */
    getChessMove(fen: string, difficulty?: number): Promise<AIChessMove>;
    /**
     * Analyze a board position
     */
    analyzePosition(board: number[][], perspective?: number): Promise<PositionAnalysis>;
    /**
     * Get game state (winner, draw, ongoing)
     */
    getGameState(board: number[][]): Promise<GameState>;
    /**
     * Test if AI service is healthy
     */
    healthCheck(): Promise<boolean>;
    /**
     * Test model inference
     */
    testInference(): Promise<any>;
    /**
     * Error handler
     */
    private handleError;
    /**
     * Set API key if needed
     */
    setAuthToken(token: string): void;
    /**
     * Update base URL
     */
    setBaseURL(baseURL: string): void;
}
export default AIServiceClient;
//# sourceMappingURL=AIServiceClient.d.ts.map