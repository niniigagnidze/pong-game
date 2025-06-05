import { Socket } from "socket.io";
import { PlayerIndex } from "../game/types";

interface PairingResult {
  roomId: string;
  playerIndex: PlayerIndex;
}

export class WaitingRoom {
  private static instance: WaitingRoom;
  private waitingSocket: Socket | null;
  private waitingRoomId: string | null;

  private constructor() {
    this.waitingSocket = null;
    this.waitingRoomId = null;
  }

  public static getInstance(): WaitingRoom {
    if (!WaitingRoom.instance) {
      WaitingRoom.instance = new WaitingRoom();
    }
    return WaitingRoom.instance;
  }

  public registerPlayer(socket: Socket): PairingResult {
    if (!this.waitingSocket) {
      // First player - put them in waiting
      this.waitingSocket = socket;
      this.waitingRoomId = this.generateRoomId();

      return {
        roomId: this.waitingRoomId,
        playerIndex: 1,
      };
    }

    // Second player - pair them up
    const roomId = this.waitingRoomId!;
    const firstSocket = this.waitingSocket;

    // Join both sockets to the room
    firstSocket.join(roomId);
    socket.join(roomId);

    // Clear waiting state
    this.clearWaitingState();

    // Return pairing result for second player
    return {
      roomId,
      playerIndex: 2,
    };
  }

  public removeWaitingPlayer(socket: Socket): void {
    if (this.waitingSocket?.id === socket.id) {
      this.clearWaitingState();
    }
  }

  private clearWaitingState(): void {
    this.waitingSocket = null;
    this.waitingRoomId = null;
  }

  private generateRoomId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 11);
    return `room_${timestamp}_${random}`;
  }

  public getWaitingPlayerId(): string | null {
    return this.waitingSocket?.id || null;
  }
}

export default WaitingRoom;
