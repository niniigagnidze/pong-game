import { useSocket } from "../hooks/useSocket";
import {
  useCurrentGameState,
  useGameStatus,
  useGameStore,
  useWinner,
} from "../store/gameStore";
import "../styles/GameOverOverlay.css";

const GameOverOverlay = () => {
  const { getSocket } = useSocket();
  const status = useGameStatus();
  const gameState = useCurrentGameState();
  const winner = useWinner();
  const { requestRestart } = useGameStore();

  const handleRestartClick = () => {
    const socket = getSocket();
    if (socket) {
      socket.emit("restartGame");
      requestRestart(); // Update local status to 'awaitingRestart'
    }
  };

  if (status !== "gameOver" && status !== "awaitingRestart") {
    return null;
  }

  const winnerName = winner === "player1" ? "Player 1" : "Player 2";
  const finalScore =
    winner === "player1"
      ? `${gameState?.score.player1} – ${gameState?.score.player2}`
      : `${gameState?.score.player2} – ${gameState?.score.player1}`;

  return (
    <div className="game-over-overlay">
      {status === "gameOver" && (
        <>
          <h1>{winnerName} Wins!</h1>
          <p>Final Score: {finalScore}</p>
          <button onClick={handleRestartClick}>
            Restart Game
          </button>
        </>
      )}

      {status === "awaitingRestart" && (
        <>
          <h2>Waiting for opponent...</h2>
          <p className="waiting-text">
            The game will restart when both players agree.
          </p>
        </>
      )}
    </div>
  );
};

export default GameOverOverlay;
