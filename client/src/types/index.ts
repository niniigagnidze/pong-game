export interface GameState {
  ball: {
    x: number;
    y: number;
  };
  paddles: {
    player1: {
      y: number;
    };
    player2: {
      y: number;
    };
  };
  score: {
    player1: number;
    player2: number;
  };
  gameOver: boolean;
  winner?: "player1" | "player2";
}

export interface RoomJoinedData {
  roomId: string;
  player1Id: string;
  player2Id: string;
}
