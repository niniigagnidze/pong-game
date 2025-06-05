import cors from "cors";
import express, { Request, Response } from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { GameManager } from "./game/GameManager";
import WaitingRoom from "./rooms/WaitingRoom";
import { SERVER_CONFIG } from "./config/constants";
import { RoomJoinedData } from "./game/types";

// Initialize Express app
const app = express();
const { PORT } = SERVER_CONFIG;

// Middleware setup
app.use(cors());
app.use(express.json());

// Health check route
app.get("/health", (_req: Request, res: Response) => {
  res.status(200).send({ status: "ok" });
});

// Create HTTP server
const httpServer = createServer(app);

// Create Socket.IO server
const io = new Server(httpServer, {
  cors: SERVER_CONFIG.CORS,
});

// Initialize game services
const waitingRoom = WaitingRoom.getInstance();
const gameManager = GameManager.getInstance();
gameManager.setIO(io);

// Socket.IO connection handling
io.on("connection", (socket) => {
  console.log(`Socket connected: ${socket.id}`);

  socket.on("joinGame", () => {
    try {
      const result = waitingRoom.registerPlayer(socket);

      if (result.playerIndex === 1) {
        // First player - waiting for opponent
        socket.emit("waiting");
        console.log(`Player 1 waiting in room ${result.roomId}`);
        return;
      }

      // Second player - create game room and start
      const roomId = result.roomId;
      const gameRoom = gameManager.createRoom(roomId);

      // Get both player sockets from the room
      const roomSockets = Array.from(io.sockets.adapter.rooms.get(roomId) || []);
      if (roomSockets.length !== 2) {
        throw new Error(`Expected 2 players in room ${roomId}, found ${roomSockets.length}`);
      }

      const player1Socket = io.sockets.sockets.get(roomSockets[0]);
      const player2Socket = socket;

      if (!player1Socket) {
        throw new Error(`Player 1 socket not found in room ${roomId}`);
      }

      // Add players to game room
      gameRoom.addPlayer(player1Socket, 1);
      gameRoom.addPlayer(player2Socket, 2);

      // Notify both players that room is ready
      const roomData: RoomJoinedData = {
        roomId,
        player1Id: roomSockets[0],
        player2Id: socket.id,
      };

      io.to(roomId).emit("roomJoined", roomData);
      console.log(`Game room ${roomId} created and started`);

    } catch (error) {
      console.error("Error in joinGame:", error);
      socket.emit("error", { message: "Failed to join game" });
    }
  });

  socket.on("disconnect", () => {
    console.log(`Socket disconnected: ${socket.id}`);
    
    // Cleanup player state
    waitingRoom.removeWaitingPlayer(socket);
    gameManager.handlePlayerDisconnect(socket);
  });
});

// Error handling
process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
});

// Start server
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

