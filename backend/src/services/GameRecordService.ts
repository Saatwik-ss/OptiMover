/**
 * Persists finished games and updates per-user statistics.
 */
import { PrismaClient } from "@prisma/client";

const savedGameIds = new Set<string>();

export interface SaveGameInput {
  gameId: string;
  gameType: string;
  player1Id: string;
  player2Id?: string | null;
  isAgainstAI: boolean;
  result: string;
  resignedBy?: string;
}

export function normalizeConnectFourResult(
  result: string,
  isAgainstAI: boolean,
  player1Id: string,
  resignedBy?: string
): string {
  if (result === "resignation" && resignedBy) {
    if (isAgainstAI) {
      return resignedBy === player1Id ? "ai_wins" : "player1_wins";
    }
    return resignedBy === player1Id ? "player2_wins" : "player1_wins";
  }

  if (isAgainstAI && result === "player2_wins") {
    return "ai_wins";
  }

  return result;
}

function outcomeForUser(
  result: string,
  isPlayer1: boolean
): "won" | "lost" | "draw" {
  if (result === "draw") return "draw";
  if (result === "player1_wins") return isPlayer1 ? "won" : "lost";
  if (result === "player2_wins") return isPlayer1 ? "lost" : "won";
  if (result === "ai_wins") return "lost";
  return "lost";
}

async function updateUserStats(
  prisma: PrismaClient,
  userId: string,
  gameType: string,
  result: string,
  isPlayer1: boolean
) {
  const outcome = outcomeForUser(result, isPlayer1);

  const existing = await prisma.userStats.findFirst({
    where: { userId, gameType },
  });

  const gamesPlayed = (existing?.gamesPlayed ?? 0) + 1;
  const gamesWon = (existing?.gamesWon ?? 0) + (outcome === "won" ? 1 : 0);
  const gamesLost = (existing?.gamesLost ?? 0) + (outcome === "lost" ? 1 : 0);
  const gamesDraw = (existing?.gamesDraw ?? 0) + (outcome === "draw" ? 1 : 0);
  const winRate = gamesPlayed > 0 ? (gamesWon / gamesPlayed) * 100 : 0;

  if (existing) {
    await prisma.userStats.update({
      where: { id: existing.id },
      data: { gamesPlayed, gamesWon, gamesLost, gamesDraw, winRate },
    });
    return;
  }

  await prisma.userStats.create({
    data: {
      userId,
      gameType,
      gamesPlayed,
      gamesWon,
      gamesLost,
      gamesDraw,
      winRate,
    },
  });
}

export async function saveFinishedGame(
  prisma: PrismaClient,
  input: SaveGameInput
) {
  if (savedGameIds.has(input.gameId)) {
    return;
  }

  const result = normalizeConnectFourResult(
    input.result,
    input.isAgainstAI,
    input.player1Id,
    input.resignedBy
  );

  try {
    await prisma.game.upsert({
      where: { id: input.gameId },
      create: {
        id: input.gameId,
        gameType: input.gameType,
        status: "finished",
        result,
        player1Id: input.player1Id,
        player2Id: input.player2Id ?? null,
        isAgainstAI: input.isAgainstAI,
      },
      update: {
        status: "finished",
        result,
      },
    });

    savedGameIds.add(input.gameId);

    await updateUserStats(prisma, input.player1Id, input.gameType, result, true);

    if (input.player2Id && !input.isAgainstAI) {
      await updateUserStats(
        prisma,
        input.player2Id,
        input.gameType,
        result,
        false
      );
    }

    console.log(
      `[GameRecord] Saved game ${input.gameId} — result: ${result}`
    );
  } catch (error) {
    console.error("[GameRecord] Failed to save game:", error);
  }
}

export async function ensureDemoUser(prisma: PrismaClient) {
  await prisma.user.upsert({
    where: { username: "player1" },
    create: {
      username: "player1",
      email: "player1@example.com",
      password: "demo",
    },
    update: {},
  });
}
