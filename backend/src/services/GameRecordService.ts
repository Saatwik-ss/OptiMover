/**
 * Persists finished games and updates per-user statistics.
 */
import { PrismaClient } from "@prisma/client";
import { prisma } from "..";

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







const k1 = 32; // K-factor for player 1
async function calculateElo(
  rating1: number,
  rating2: number,
  result: "player1_wins" | "player2_wins" | "draw"
) {
  const expected1 =
    1 / (1 + Math.pow(10, (rating2 - rating1) / 400));

  const expected2 = 1 - expected1;

  let score1 = 0;
  let score2 = 0;

  switch (result) {
    case "player1_wins":
      score1 = 1;
      score2 = 0;
      break;
    case "player2_wins":
      score1 = 0;
      score2 = 1;
      break;
    case "draw":
      score1 = 0.5;
      score2 = 0.5;
      break;
  }

  return {
    player1: Math.round(rating1 + k1 * (score1 - expected1)),
    player2: Math.round(rating2 + k1 * (score2 - expected2)),
  };
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


async function updateElo(
  prisma: PrismaClient,
  player1Id: string,
  player2Id: string,
  gameType: string,
  result: "player1_wins" | "player2_wins" | "draw"
) {
  const [p1, p2] = await Promise.all([
    prisma.userStats.findFirst({
      where: { userId: player1Id, gameType },
    }),
    prisma.userStats.findFirst({
      where: { userId: player2Id, gameType },
    }),
  ]);

  if (!p1 || !p2) return;

  const ratings = await calculateElo(
    p1.eloRating,
    p2.eloRating,
    result
  );

  await prisma.$transaction([
    prisma.userStats.update({
      where: { id: p1.id },
      data: { eloRating: ratings.player1 },
    }),
    prisma.userStats.update({
      where: { id: p2.id },
      data: { eloRating: ratings.player2 },
    }),
  ]);
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


    if (!input.isAgainstAI && input.player2Id) {
        await updateElo(
            prisma,
            input.player1Id,
            input.player2Id,
            input.gameType,
            result as "player1_wins" | "player2_wins" | "draw"
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
