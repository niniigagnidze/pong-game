import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSocket } from "../hooks/useSocket";
import { useGameStore } from "../store/gameStore";

const Landing = () => {
  const navigate = useNavigate();
  const { connect } = useSocket();
  const { setStatus, reset } = useGameStore();
  const [isConnecting, setIsConnecting] = useState(false);

  const handleJoinGame = () => {
    if (isConnecting) return;

    // Reset any previous game state
    reset();

    setIsConnecting(true);
    const socket = connect();

    const handleConnect = () => {
      console.log("Connected to server");
      setIsConnecting(false);

      // Join the game
      socket.emit("joinGame");
      setStatus("waiting");

      // Navigate to waiting screen
      navigate("/waiting");
    };

    const handleConnectError = (error: any) => {
      console.error("Connection error:", error);
      setIsConnecting(false);
      alert("Failed to connect to server. Please try again.");
    };

    // Remove any existing listeners first
    socket.off("connect", handleConnect);
    socket.off("connect_error", handleConnectError);

    // Add new listeners
    socket.on("connect", handleConnect);
    socket.on("connect_error", handleConnectError);

    // If already connected, trigger immediately
    if (socket.connected) {
      handleConnect();
    }
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        backgroundColor: "#1a1a1a",
        color: "white",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <h1
        style={{
          fontSize: "3rem",
          marginBottom: "2rem",
          textAlign: "center",
        }}
      >
        🏓 Multiplayer Pong
      </h1>

      <p
        style={{
          fontSize: "1.2rem",
          marginBottom: "3rem",
          textAlign: "center",
          maxWidth: "600px",
          lineHeight: "1.6",
        }}
      >
        Challenge another player in real-time Pong! First to 5 points wins.
      </p>

      <button
        onClick={handleJoinGame}
        disabled={isConnecting}
        style={{
          fontSize: "1.5rem",
          padding: "1rem 2rem",
          backgroundColor: isConnecting ? "#666" : "#4CAF50",
          color: "white",
          border: "none",
          borderRadius: "8px",
          cursor: isConnecting ? "not-allowed" : "pointer",
          transition: "background-color 0.3s",
        }}
        onMouseOver={(e) => {
          if (!isConnecting) {
            e.currentTarget.style.backgroundColor = "#45a049";
          }
        }}
        onMouseOut={(e) => {
          if (!isConnecting) {
            e.currentTarget.style.backgroundColor = "#4CAF50";
          }
        }}
      >
        {isConnecting ? "Connecting..." : "Join Game"}
      </button>
    </div>
  );
};

export default Landing;
