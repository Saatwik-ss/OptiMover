/**
 * Connect Four Socket.IO Handler
 * Manages real-time game state and move validation via WebSockets
 */
import { Server } from "socket.io";
import { PrismaClient } from "@prisma/client";
import { Connect4Engine } from "../models/Connect4Engine.js";
import AIServiceClient from "../services/AIServiceClient.js";
export interface ConnectFourGame {
    gameId: string;
    player1Id: string;
    player2Id?: string;
    isAgainstAI: boolean;
    gameState: any;
    engine: Connect4Engine;
    options?: any;
    timeControl: number;
    player1Time: number;
    player2Time: number;
    lastTurnTimestamp?: number;
    isTimerActive: boolean;
    timerInterval?: NodeJS.Timeout;
}
export declare function setupConnectFourSocket(io: Server, aiClient: AIServiceClient, prisma: PrismaClient): void;
//# sourceMappingURL=ConnectFourSocket.d.ts.map