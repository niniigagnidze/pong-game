import { Server, Socket } from "socket.io";
import { GameState, PaddleMoveEvent, Player } from "./types";

export class GameRoom {
  private players: Map<string, Player> = new Map();
  private intervalId: NodeJS.Timeout | null = null;
  private gameState: GameState;
  private roomId: string;
  private io: Server;
  private restartVotes: Set<string> = new Set();

  // Game constants
  private readonly CANVAS_WIDTH = 800;
  private readonly CANVAS_HEIGHT = 600;
  private readonly BALL_SIZE = 10;
  private readonly PADDLE_WIDTH = 10;
  private readonly PADDLE_HEIGHT = 100;
  private readonly PADDLE_SPEED = 5;
  private readonly PADDLE_MIN_Y = 0;
  private readonly PADDLE_MAX_Y = this.CANVAS_HEIGHT - this.PADDLE_HEIGHT;
  private readonly WINNING_SCORE = 5;

  // Ball physics
  private ballVelocity = {
    dx: 5,
    dy: 3,
  };

  constructor(roomId: string, io: Server) {
    this.roomId = roomId;
    this.io = io;
    this.gameState = this.initializeGameState();
  }

  private initializeGameState(): GameState {
    return {
      ball: {
        x: this.CANVAS_WIDTH / 2,
        y: this.CANVAS_HEIGHT / 2,
      },
      paddles: {
        player1: {
          y: this.CANVAS_HEIGHT / 2 - this.PADDLE_HEIGHT / 2,
        },
        player2: {
          y: this.CANVAS_HEIGHT / 2 - this.PADDLE_HEIGHT / 2,
        },
      },
      score: {
        player1: 0,
        player2: 0,
      },
      gameOver: false,
    };
  }

  public addPlayer(socket: Socket, playerIndex: 1 | 2): void {
    const player: Player = {
      socket,
      id: socket.id,
      playerIndex,
    };

    // Bind event handlers
    const paddleMoveHandler = (data: PaddleMoveEvent) => this.handlePaddleMove(socket.id, data);
    const restartGameHandler = () => this.handleRestartVote(socket.id);

    // Store handlers on the player object for later removal
    player.handlers = {
      paddleMove: paddleMoveHandler,
      restartGame: restartGameHandler,
    };

    // Add event listeners
    socket.on("paddleMove", paddleMoveHandler);
    socket.on("restartGame", restartGameHandler);

    this.players.set(socket.id, player);
    console.log(`Player ${playerIndex} added to room ${this.roomId}`);

    // Start game loop when we have 2 players
    if (this.players.size === 2) {
      this.startGameLoop();
    }
  }

  public removePlayer(socketId: string): void {
    const player = this.players.get(socketId);
    if (player) {
      // Remove event listeners using stored handlers
      if (player.handlers) {
        player.socket.off("paddleMove", player.handlers.paddleMove);
        player.socket.off("restartGame", player.handlers.restartGame);
      }

      // Remove from restart votes
      this.restartVotes.delete(socketId);

      this.players.delete(socketId);
      console.log(`Player removed from room ${this.roomId}`);

      // Stop game if any player disconnects
      this.stopGameLoop();

      // Notify remaining player
      this.players.forEach((remainingPlayer) => {
        remainingPlayer.socket.emit("playerDisconnected");
      });
    }
  }

  private handlePaddleMove(socketId: string, moveData: PaddleMoveEvent): void {
    const player = this.players.get(socketId);
    if (!player || this.gameState.gameOver) return;

    const { dir } = moveData;
    const playerKey = player.playerIndex === 1 ? "player1" : "player2";

    // Calculate new paddle position
    let newY = this.gameState.paddles[playerKey].y;

    if (dir === "up") {
      newY -= this.PADDLE_SPEED;
    } else if (dir === "down") {
      newY += this.PADDLE_SPEED;
    }

    // Clamp paddle position to valid range (0 to 500)
    newY = Math.max(this.PADDLE_MIN_Y, Math.min(this.PADDLE_MAX_Y, newY));

    // Update game state
    this.gameState.paddles[playerKey].y = newY;

    // Send immediate state update
    this.io.to(this.roomId).emit("gameState", this.gameState);

    console.log(
      `Player ${player.playerIndex} paddle moved ${dir} to y=${newY}`
    );
  }

  private handleRestartVote(socketId: string): void {
    const player = this.players.get(socketId);
    if (!player || !this.gameState.gameOver) {
      console.log(
        `Invalid restart vote from ${socketId}: game not over or player not found`
      );
      return;
    }

    // Add vote
    this.restartVotes.add(socketId);
    console.log(
      `Player ${player.playerIndex} voted to restart. Votes: ${this.restartVotes.size}/2`
    );

    // Check if both players have voted
    if (this.restartVotes.size === 2) {
      this.restartGame();
    } else {
      // Notify players about the vote status
      this.io.to(this.roomId).emit("restartVoteUpdate", {
        votesReceived: this.restartVotes.size,
        votesNeeded: 2,
      });
    }
  }

  private restartGame(): void {
    console.log(`Restarting game in room ${this.roomId}`);

    // Clear restart votes
    this.restartVotes.clear();

    // Reset game state
    this.gameState = this.initializeGameState();

    // Reset ball velocity
    this.ballVelocity.dx = 5;
    this.ballVelocity.dy = 3;

    // Emit restart confirmation
    this.io.to(this.roomId).emit("restartConfirmed");

    // Resume game loop
    this.startGameLoop();

    // Send initial game state
    this.io.to(this.roomId).emit("gameState", this.gameState);
  }

  private startGameLoop(): void {
    // Don't start if already running
    if (this.intervalId) return;

    console.log(`Starting game loop for room ${this.roomId}`);

    this.intervalId = setInterval(() => {
      this.tick();
    }, 16); // 60 FPS (1000ms / 60 ≈ 16ms)
  }

  private stopGameLoop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log(`Game loop stopped for room ${this.roomId}`);
    }
  }

  private tick(): void {
    if (this.gameState.gameOver) return;

    // Update ball position
    this.gameState.ball.x += this.ballVelocity.dx;
    this.gameState.ball.y += this.ballVelocity.dy;

    // Wall collision (top/bottom)
    if (
      this.gameState.ball.y <= 0 ||
      this.gameState.ball.y >= this.CANVAS_HEIGHT - this.BALL_SIZE
    ) {
      this.ballVelocity.dy = -this.ballVelocity.dy;
      // Keep ball in bounds
      this.gameState.ball.y = Math.max(
        0,
        Math.min(this.CANVAS_HEIGHT - this.BALL_SIZE, this.gameState.ball.y)
      );
    }

    // Paddle collision detection
    this.checkPaddleCollisions();

    // Scoring (ball goes off left/right edges)
    if (this.gameState.ball.x < 0) {
      // Player 2 scores
      this.gameState.score.player2++;
      console.log(
        `Player 2 scores! Score: ${this.gameState.score.player1}-${this.gameState.score.player2}`
      );
      this.resetBall("player2");
    } else if (this.gameState.ball.x > this.CANVAS_WIDTH) {
      // Player 1 scores
      this.gameState.score.player1++;
      console.log(
        `Player 1 scores! Score: ${this.gameState.score.player1}-${this.gameState.score.player2}`
      );
      this.resetBall("player1");
    }

    // Check for game over
    if (this.gameState.score.player1 >= this.WINNING_SCORE) {
      this.endGame("player1");
    } else if (this.gameState.score.player2 >= this.WINNING_SCORE) {
      this.endGame("player2");
    }

    // Emit game state to all players in the room
    this.io.to(this.roomId).emit("gameState", this.gameState);
  }

  private checkPaddleCollisions(): void {
    const ball = this.gameState.ball;
    const paddles = this.gameState.paddles;

    // Player 1 paddle (left side)
    if (
      ball.x <= this.PADDLE_WIDTH &&
      ball.x >= 0 &&
      ball.y >= paddles.player1.y &&
      ball.y <= paddles.player1.y + this.PADDLE_HEIGHT &&
      this.ballVelocity.dx < 0
    ) {
      this.ballVelocity.dx = -this.ballVelocity.dx;
      // Increase speed by 5%
      this.ballVelocity.dx *= 1.05;
      this.ballVelocity.dy *= 1.05;
      // Keep ball from getting stuck in paddle
      ball.x = this.PADDLE_WIDTH;
      console.log("Player 1 paddle hit! Ball speed increased.");
    }

    // Player 2 paddle (right side)
    if (
      ball.x >= this.CANVAS_WIDTH - this.PADDLE_WIDTH - this.BALL_SIZE &&
      ball.x <= this.CANVAS_WIDTH &&
      ball.y >= paddles.player2.y &&
      ball.y <= paddles.player2.y + this.PADDLE_HEIGHT &&
      this.ballVelocity.dx > 0
    ) {
      this.ballVelocity.dx = -this.ballVelocity.dx;
      // Increase speed by 5%
      this.ballVelocity.dx *= 1.05;
      this.ballVelocity.dy *= 1.05;
      // Keep ball from getting stuck in paddle
      ball.x = this.CANVAS_WIDTH - this.PADDLE_WIDTH - this.BALL_SIZE;
      console.log("Player 2 paddle hit! Ball speed increased.");
    }
  }

  private resetBall(scorer: "player1" | "player2"): void {
    // Reset ball to center
    this.gameState.ball.x = this.CANVAS_WIDTH / 2;
    this.gameState.ball.y = this.CANVAS_HEIGHT / 2;

    // Reset ball speed
    const baseSpeed = 5;
    this.ballVelocity.dx = scorer === "player1" ? baseSpeed : -baseSpeed;
    this.ballVelocity.dy = (Math.random() - 0.5) * 6; // Random vertical direction
  }

  private endGame(winner: "player1" | "player2"): void {
    this.gameState.gameOver = true;
    this.gameState.winner = winner;

    console.log(
      `Game over! ${winner} wins with score ${this.gameState.score.player1}-${this.gameState.score.player2}`
    );

    // Stop the game loop
    this.stopGameLoop();

    // Emit game over event
    this.io.to(this.roomId).emit("gameOver", {
      winner,
      finalScore: this.gameState.score,
    });
  }

  public getPlayerCount(): number {
    return this.players.size;
  }

  public getRoomId(): string {
    return this.roomId;
  }
}
