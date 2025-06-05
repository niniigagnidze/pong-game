import { Socket } from "socket.io";

export interface Vector2D {
  x: number;
  y: number;
}

export interface Paddle {
  y: number;
}

export interface Score {
  player1: number;
  player2: number;
}

export interface GameState {
  ball: Vector2D;
  paddles: {
    player1: Paddle;
    player2: Paddle;
  };
  score: Score;
  gameOver: boolean;
  winner?: PlayerType;
}

export type PlayerType = "player1" | "player2";
export type PlayerIndex = 1 | 2;
export type MovementDirection = "up" | "down";

export interface EventHandlers {
  paddleMove: (data: PaddleMoveEvent) => void;
  restartGame: () => void;
}

export interface Player {
  socket: Socket;
  id: string;
  playerIndex: PlayerIndex;
  handlers?: EventHandlers;
}

export interface PaddleMoveEvent {
  dir: MovementDirection;
}

export interface GameRoomEvents {
  paddleMove: (data: PaddleMoveEvent) => void;
  restartGame: () => void;
  disconnect: () => void;
}

export interface RoomJoinedData {
  roomId: string;
  player1Id: string;
  player2Id: string;
}
