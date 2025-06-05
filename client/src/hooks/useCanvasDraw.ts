import { useEffect, useRef } from "react";
import type { GameState } from "../types";

export const useCanvasDraw = (
  canvasRef: React.RefObject<HTMLCanvasElement>,
  gameState: GameState | null
) => {
  const animationFrameRef = useRef<number>();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Game constants
    const CANVAS_WIDTH = 800;
    const CANVAS_HEIGHT = 600;
    const PADDLE_WIDTH = 10;
    const PADDLE_HEIGHT = 100;
    const BALL_SIZE = 10;

    const draw = () => {
      // Clear canvas with black background
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      if (!gameState) {
        // Draw waiting message if no game state
        ctx.fillStyle = "#fff";
        ctx.font = "24px Arial";
        ctx.textAlign = "center";
        ctx.fillText(
          "Waiting for game to start...",
          CANVAS_WIDTH / 2,
          CANVAS_HEIGHT / 2
        );

        animationFrameRef.current = requestAnimationFrame(draw);
        return;
      }

      // Draw center line (dashed)
      ctx.strokeStyle = "#333";
      ctx.lineWidth = 2;
      ctx.setLineDash([10, 10]);
      ctx.beginPath();
      ctx.moveTo(CANVAS_WIDTH / 2, 0);
      ctx.lineTo(CANVAS_WIDTH / 2, CANVAS_HEIGHT);
      ctx.stroke();
      ctx.setLineDash([]); // Reset dash pattern

      // Set white color for game objects
      ctx.fillStyle = "#fff";

      // Draw Player 1 paddle (left side)
      ctx.fillRect(0, gameState.paddles.player1.y, PADDLE_WIDTH, PADDLE_HEIGHT);

      // Draw Player 2 paddle (right side)
      ctx.fillRect(
        CANVAS_WIDTH - PADDLE_WIDTH,
        gameState.paddles.player2.y,
        PADDLE_WIDTH,
        PADDLE_HEIGHT
      );

      // Draw ball
      ctx.fillRect(gameState.ball.x, gameState.ball.y, BALL_SIZE, BALL_SIZE);

      // Draw scores at top center
      ctx.font = "48px Arial";
      ctx.textAlign = "center";
      ctx.fillStyle = "#fff";

      // Player 1 score (left quarter)
      ctx.fillText(gameState.score.player1.toString(), CANVAS_WIDTH / 4, 80);

      // Player 2 score (right quarter)
      ctx.fillText(
        gameState.score.player2.toString(),
        (CANVAS_WIDTH * 3) / 4,
        80
      );

      // Draw game over overlay if applicable
      if (gameState.gameOver && gameState.winner) {
        // Semi-transparent overlay
        ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        // Winner text
        ctx.fillStyle = "#fff";
        ctx.font = "bold 36px Arial";
        ctx.textAlign = "center";

        const winnerText =
          gameState.winner === "player1" ? "Player 1 Wins!" : "Player 2 Wins!";
        ctx.fillText(winnerText, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 40);

        // Final score
        ctx.font = "24px Arial";
        const finalScore = `Final Score: ${gameState.score.player1} - ${gameState.score.player2}`;
        ctx.fillText(finalScore, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);

        // Restart instruction
        ctx.font = "18px Arial";
        ctx.fillStyle = "#ccc";
        ctx.fillText(
          "Both players must click restart to play again",
          CANVAS_WIDTH / 2,
          CANVAS_HEIGHT / 2 + 60
        );
      }

      // Continue animation loop
      animationFrameRef.current = requestAnimationFrame(draw);
    };

    // Start the animation loop
    animationFrameRef.current = requestAnimationFrame(draw);

    // Cleanup function
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [gameState]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);
};
