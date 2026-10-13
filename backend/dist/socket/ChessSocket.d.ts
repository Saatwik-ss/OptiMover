/**
 * Chess Socket.IO Handler
 * Manages real-time chess rooms, move validation, AI invocation, and result persistence via WebSockets.
 */
import { Server } from "socket.io";
import { PrismaClient } from "@prisma/client";
import { ChessEngine } from "../models/ChessEngine.js";
import AIServiceClient from "../services/AIServiceClient.js";
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
export declare function setupChessSocket(io: Server, aiClient: AIServiceClient, prisma: PrismaClient): void;
//# sourceMappingURL=ChessSocket.d.ts.map