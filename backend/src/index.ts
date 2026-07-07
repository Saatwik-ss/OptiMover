/**
 * Board Game Platform - Backend Server
 * Express + Socket.IO + Prisma
 */

import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";

// Load environment variables
dotenv.config();

// Import socket handlers
import { setupConnectFourSocket } from "./socket/ConnectFourSocket.js";

// 2. Fixed to match 'AIServiceClient' + added .js
import AIServiceClient from "./services/AIServiceClient.js";

// Initialize
const app = express();
const httpServer = createServer(app);
const prisma = new PrismaClient();
const aiClient = new AIServiceClient(process.env.AI_SERVICE_URL || "http://localhost:8000");

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

// Socket.IO setup
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || "*",
    methods: ["GET", "POST"],
    credentials: true,
  },
  transports: ["websocket", "polling"],
});

// Initialize game socket handlers
setupConnectFourSocket(io, aiClient);

// ==================== REST API Routes ====================

// Health check
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// AI Service health
app.get("/api/ai-health", async (req, res) => {
  try {
    const healthy = await aiClient.healthCheck();
    res.json({
      status: healthy ? "healthy" : "unhealthy",
      connected: healthy,
    });
  } catch (error) {
    res.status(500).json({
      status: "unhealthy",
      error: String(error),
    });
  }
});

// ==================== User Routes ====================

// Create user (registration)
app.post("/api/users/register", async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Validate input
    if (!username || !email || !password) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // TODO: Hash password before storing
    // const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        username,
        email,
        password, // In production, use hashed password
      },
    });

    res.json({
      success: true,
      userId: user.id,
      username: user.username,
    });
  } catch (error: any) {
    if (error.code === "P2002") {
      return res.status(409).json({ error: "Username or email already exists" });
    }
    res.status(500).json({ error: String(error) });
  }
});

// Get user profile
app.get("/api/users/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        email: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

// ==================== Game Routes ====================

// Get game history for user
app.get("/api/games/user/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    const games = await prisma.game.findMany({
      where: {
        OR: [{ player1Id: userId }, { player2Id: userId }],
      },
      select: {
        id: true,
        gameType: true,
        status: true,
        result: true,
        player1Id: true,
        player2Id: true,
        isAgainstAI: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    res.json(games);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

// Save game result
app.post("/api/games/result", async (req, res) => {
  try {
    const { gameId, player1Id, player2Id, gameType, result } = req.body;

    const game = await prisma.game.create({
      data: {
        id: gameId,
        gameType,
        result,
        status: "finished",
        player1Id,
        player2Id,
      },
    });

    res.json({ success: true, gameId: game.id });
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

// ==================== Statistics Routes ====================

// Get user statistics
app.get("/api/stats/:userId/:gameType", async (req, res) => {
  try {
    const { userId, gameType } = req.params;

    const stats = await prisma.userStats.findUnique({
      where: {
        userId_gameType: {
          userId,
          gameType,
        },
      },
    });

    if (!stats) {
      return res.status(404).json({ error: "No statistics found" });
    }

    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

// ==================== Error Handling ====================

app.use((req, res) => {
  res.status(404).json({ error: "Not found" });
});

// ==================== Startup ====================

const PORT = process.env.PORT || 4000;

httpServer.listen(PORT, async () => {
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║  🎮 Board Game Platform - Backend Server                     ║
║  Running on http://localhost:${PORT}                          
║                                                              ║
║  📊 API:  http://localhost:${PORT}/api                       
║  🔌 WS:   ws://localhost:${PORT}                             
╚══════════════════════════════════════════════════════════════╝
  `);

  // Test AI service connection
  try {
    const aiHealthy = await aiClient.healthCheck();
    console.log(`✅ AI Service: ${aiHealthy ? "Connected" : "Disconnected"}`);
  } catch (error) {
    console.log("⚠️  AI Service: Not available");
  }

  // Test database connection
  try {
    await prisma.$queryRaw`SELECT 1`;
    console.log(`✅ Database: Connected`);
  } catch (error) {
    console.log("❌ Database: Failed to connect");
  }
});

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("\n🛑 Shutting down...");
  await prisma.$disconnect();
  httpServer.close();
  process.exit(0);
});

export { app, httpServer, io, prisma };
