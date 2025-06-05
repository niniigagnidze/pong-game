import { Server, Socket } from "socket.io";
import { GameRoom } from "./GameRoom";

export class GameManager {
  private static instance: GameManager;
  private rooms: Map<string, GameRoom>;
  private io!: Server;

  private constructor() {
    this.rooms = new Map();
  }

  public static getInstance(): GameManager {
    if (!GameManager.instance) {
      GameManager.instance = new GameManager();
    }
    return GameManager.instance;
  }

  public setIO(io: Server): void {
    this.io = io;
  }

  public createRoom(roomId: string): GameRoom {
    if (this.rooms.has(roomId)) {
      throw new Error(`Room ${roomId} already exists`);
    }
    const room = new GameRoom(roomId, this.io);
    this.rooms.set(roomId, room);
    return room;
  }

  public getRoom(roomId: string): GameRoom | undefined {
    return this.rooms.get(roomId);
  }

  public removeRoom(roomId: string): void {
    const room = this.rooms.get(roomId);
    if (room) {
      // Stop any ongoing game activities
      room.removePlayer(room.getRoomId());
      this.rooms.delete(roomId);
      console.log(`Room ${roomId} removed`);
    }
  }

  public handlePlayerDisconnect(socket: Socket): void {
    for (const [roomId, room] of this.rooms.entries()) {
      const playerCount = room.getPlayerCount();
      room.removePlayer(socket.id);
      
      // If player was removed and room is now empty
      if (room.getPlayerCount() < playerCount) {
        if (room.getPlayerCount() === 0) {
          this.removeRoom(roomId);
        }
        // Player was found and removed, no need to check other rooms
        break;
      }
    }
  }

  public getRoomCount(): number {
    return this.rooms.size;
  }
}
