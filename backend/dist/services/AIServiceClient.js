"use strict";
/**
 * AI Service Client
 * HTTP client for communicating with Python FastAPI AI service
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AIServiceClient = void 0;
const axios_1 = __importDefault(require("axios"));
class AIServiceClient {
    constructor(baseURL = "http://localhost:8000") {
        this.baseURL = baseURL;
        this.client = axios_1.default.create({
            baseURL,
            timeout: 30000,
            headers: {
                "Content-Type": "application/json",
            },
        });
    }
    /**
     * Get AI's move for Connect Four
     */
    async getConnectFourMove(board, options) {
        try {
            const response = await this.client.post("/api/games/connect-four/move", {
                board,
                options: options || {},
            });
            return response.data;
        }
        catch (error) {
            throw this.handleError(error, "Failed to get AI move");
        }
    }
    /**
     * Get AI's move for Chess
     */
    async getChessMove(fen, difficulty = 3) {
        try {
            const response = await this.client.post("/api/games/chess/move", {
                fen,
                difficulty,
            });
            return response.data;
        }
        catch (error) {
            throw this.handleError(error, "Failed to get AI chess move");
        }
    }
    /**
     * Analyze a board position
     */
    async analyzePosition(board, perspective = 1) {
        try {
            const response = await this.client.post("/api/games/connect-four/analyze", {
                board,
                perspective,
            });
            return response.data;
        }
        catch (error) {
            throw this.handleError(error, "Failed to analyze position");
        }
    }
    /**
     * Get game state (winner, draw, ongoing)
     */
    async getGameState(board) {
        try {
            const response = await this.client.post("/api/games/connect-four/state", {
                board,
            });
            return response.data;
        }
        catch (error) {
            throw this.handleError(error, "Failed to get game state");
        }
    }
    /**
     * Test if AI service is healthy
     */
    async healthCheck() {
        try {
            const response = await this.client.get("/health");
            return response.status === 200;
        }
        catch (error) {
            console.error("AI Service health check failed:", error);
            return false;
        }
    }
    /**
     * Test model inference
     */
    async testInference() {
        try {
            const response = await this.client.get("/api/games/connect-four/test");
            return response.data;
        }
        catch (error) {
            throw this.handleError(error, "Inference test failed");
        }
    }
    /**
     * Error handler
     */
    handleError(error, message) {
        if (axios_1.default.isAxiosError(error)) {
            const status = error.response?.status;
            const detail = error.response?.data?.detail || error.message;
            if (status === 400) {
                return new Error(`Bad request: ${detail}`);
            }
            else if (status === 500) {
                return new Error(`AI service error: ${detail}`);
            }
            else if (error.code === "ECONNREFUSED") {
                return new Error("AI service is not available. Is it running?");
            }
            else {
                return new Error(`${message}: ${detail}`);
            }
        }
        return new Error(message);
    }
    /**
     * Set API key if needed
     */
    setAuthToken(token) {
        this.client.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    }
    /**
     * Update base URL
     */
    setBaseURL(baseURL) {
        this.baseURL = baseURL;
        this.client.defaults.baseURL = baseURL;
    }
}
exports.AIServiceClient = AIServiceClient;
exports.default = AIServiceClient;
//# sourceMappingURL=AIServiceClient.js.map