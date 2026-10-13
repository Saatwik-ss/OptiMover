/**
 * Persists finished games and updates per-user statistics.
 */
import { PrismaClient } from "@prisma/client";
export interface SaveGameInput {
    gameId: string;
    gameType: string;
    player1Id: string;
    player2Id?: string | null;
    isAgainstAI: boolean;
    result: string;
    resignedBy?: string;
}
export declare function normalizeConnectFourResult(result: string, isAgainstAI: boolean, player1Id: string, resignedBy?: string): string;
export declare function saveFinishedGame(prisma: PrismaClient, input: SaveGameInput): Promise<void>;
export declare function ensureDemoUser(prisma: PrismaClient): Promise<void>;
//# sourceMappingURL=GameRecordService.d.ts.map