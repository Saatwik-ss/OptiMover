"use strict";
/**
 * Board Game Platform - Backend Server
 * Express + Socket.IO + Prisma
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = exports.io = exports.httpServer = exports.app = void 0;
const express_1 = __importDefault(require("express"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const client_1 = require("@prisma/client");
// Load environment variables
dotenv_1.default.config();
// Import socket handlers
const ConnectFourSocket_js_1 = require("./socket/ConnectFourSocket.js");
// 2. Fixed to match 'AIServiceClient' + added .js
const AIServiceClient_js_1 = __importDefault(require("./services/AIServiceClient.js"));
const GameRecordService_js_1 = require("./services/GameRecordService.js");
// Initialize
const app = (0, express_1.default)();
exports.app = app;
const httpServer = (0, http_1.createServer)(app);
exports.httpServer = httpServer;
const prisma = new client_1.PrismaClient();
exports.prisma = prisma;
const aiClient = new AIServiceClient_js_1.default(process.env.AI_SERVICE_URL || "http://localhost:8000");
// Middleware
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// Request logging
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
    next();
});
// Socket.IO setup
const io = new socket_io_1.Server(httpServer, {
    cors: {
        origin: process.env.FRONTEND_URL || "*",
        methods: ["GET", "POST"],
        credentials: true,
    },
    transports: ["websocket", "polling"],
});
exports.io = io;
// Initialize game socket handlers
(0, ConnectFourSocket_js_1.setupConnectFourSocket)(io, aiClient, prisma);
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
    }
    catch (error) {
        res.status(500).json({
            status: "unhealthy",
            error: String(error),
        });
    }
});
// ==================== User Routes ====================
// Login (demo — plain-text password check)
app.post("/api/auth/login", async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            return res.status(400).json({ error: "Missing username or password" });
        }
        const user = await prisma.user.findUnique({ where: { username } });
        if (!user || user.password !== password) {
            return res.status(401).json({ error: "Invalid username or password" });
        }
        res.json({
            id: user.id,
            username: user.username,
            email: user.email,
        });
    }
    catch (error) {
        res.status(500).json({ error: String(error) });
    }
});
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
            id: user.id,
            username: user.username,
            email: user.email,
        });
    }
    catch (error) {
        if (error.code === "P2002") {
            return res.status(409).json({ error: "Username or email already exists" });
        }
        res.status(500).json({ error: String(error) });
    }
});
// Alias for registration
app.post("/api/auth/register", async (req, res) => {
    try {
        const { username, email, password } = req.body;
        if (!username || !email || !password) {
            return res.status(400).json({ error: "Missing required fields" });
        }
        const user = await prisma.user.create({
            data: { username, email, password },
        });
        res.json({
            id: user.id,
            username: user.username,
            email: user.email,
        });
    }
    catch (error) {
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
    }
    catch (error) {
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
    }
    catch (error) {
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
                isAgainstAI: req.body.isAgainstAI ?? false,
            },
        });
        res.json({ success: true, gameId: game.id });
    }
    catch (error) {
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
            return res.json({
                gamesPlayed: 0,
                gamesWon: 0,
                gamesLost: 0,
                gamesDraw: 0,
                winRate: 0,
                eloRating: 1200,
            });
        }
        res.json(stats);
    }
    catch (error) {
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
    }
    catch (error) {
        console.log("⚠️  AI Service: Not available");
    }
    // Test database connection
    try {
        await prisma.$queryRaw `SELECT 1`;
        console.log(`✅ Database: Connected`);
        await (0, GameRecordService_js_1.ensureDemoUser)(prisma);
        console.log(`✅ Demo user: player1 / demo`);
    }
    catch (error) {
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
//# sourceMappingURL=index.js.map