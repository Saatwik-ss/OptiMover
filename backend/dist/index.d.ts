/**
 * Board Game Platform - Backend Server
 * Express + Socket.IO + Prisma
 */
import { Server } from "socket.io";
import { PrismaClient } from "@prisma/client";
declare const app: import("express-serve-static-core").Express;
declare const httpServer: import("http").Server<typeof import("http").IncomingMessage, typeof import("http").ServerResponse>;
declare const prisma: PrismaClient<import(".prisma/client").Prisma.PrismaClientOptions, never, import("@prisma/client/runtime/library.js").DefaultArgs>;
declare const io: Server<import("socket.io").DefaultEventsMap, import("socket.io").DefaultEventsMap, import("socket.io").DefaultEventsMap, any>;
export { app, httpServer, io, prisma };
//# sourceMappingURL=index.d.ts.map