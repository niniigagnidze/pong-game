import { useNavigate } from "react-router-dom";
import { useGameStatus, useGameStore } from "../store/gameStore";
import "../styles/DisconnectOverlay.css";

const DisconnectOverlay = () => {
  const navigate = useNavigate();
  const status = useGameStatus();
  const { reset } = useGameStore();

  const handleReturnToMenu = () => {
    reset();
    navigate("/");
  };

  if (status !== "opponentDisconnected") {
    return null;
  }

  return (
    <div className="disconnect-overlay">
      <h1>Connection Lost</h1>
      <p>Other player disconnected. Game ended.</p>
      <button onClick={handleReturnToMenu}>
        Return to Menu
      </button>
    </div>
  );
};

export default DisconnectOverlay;
