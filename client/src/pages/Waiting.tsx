import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import DisconnectOverlay from "../components/DisconnectOverlay";
import { useSocket } from "../hooks/useSocket";
import { useGameStatus, useGameStore } from "../store/gameStore";
import type { RoomJoinedData } from "../types";

const Waiting = () => {
  const navigate = useNavigate();
  const { getSocket } = useSocket();
  const { joinRoom, handleDisconnect, setStatus } = useGameStore();
  const status = useGameStatus();
  const listenersSetRef = useRef(false);

  useEffect(() => {
    const socket = getSocket();

    if (!socket || !socket.connected) {
      // If no socket connection, redirect to landing
      console.log("No socket connection, redirecting to landing");
      setStatus("landing");
      navigate("/");
      return;
    }

    // If not in waiting status, redirect
    if (status !== "waiting") {
      navigate("/");
      return;
    }

    // Prevent duplicate listeners
    if (listenersSetRef.current) return;
    listenersSetRef.current = true;

    const handleWaiting = () => {
      console.log("Waiting for another player...");
    };

    const handleRoomJoined = (data: RoomJoinedData) => {
      console.log("Room joined:", data);

      // Determine player index based on socket ID
      const socket = getSocket();
      const playerIndex = socket?.id === data.player1Id ? 1 : 2;

      joinRoom(data.roomId, playerIndex);
      navigate("/game");
    };

    const handlePlayerDisconnected = () => {
      console.log("Opponent disconnected during waiting, updating status.");
      handleDisconnect();
    };

    // Set up event listeners
    socket.on("waiting", handleWaiting);
    socket.on("roomJoined", handleRoomJoined);
    socket.on("playerDisconnected", handlePlayerDisconnected);

    console.log("Waiting page: Socket listeners set up");

    // Cleanup function
    return () => {
      if (socket) {
        socket.off("waiting", handleWaiting);
        socket.off("roomJoined", handleRoomJoined);
        socket.off("playerDisconnected", handlePlayerDisconnected);
      }
      listenersSetRef.current = false;
      console.log("Waiting page: Socket listeners cleaned up");
    };
  }, [navigate, getSocket, joinRoom, setStatus, status, handleDisconnect]);

  if (status !== "waiting") {
    return <DisconnectOverlay />;
  }

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
          fontSize: "2.5rem",
          marginBottom: "2rem",
          textAlign: "center",
        }}
      >
        🔍 Finding Opponent
      </h1>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "1rem",
          marginBottom: "2rem",
        }}
      >
        <div
          style={{
            width: "40px",
            height: "40px",
            border: "4px solid #f3f3f3",
            borderTop: "4px solid #4CAF50",
            borderRadius: "50%",
            animation: "spin 1s linear infinite",
          }}
        />
        <p
          style={{
            fontSize: "1.3rem",
          }}
        >
          Waiting for another player to join...
        </p>
      </div>

      <p
        style={{
          fontSize: "1rem",
          color: "#888",
          textAlign: "center",
        }}
      >
        You'll be automatically matched when someone else joins!
      </p>

      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
};

export default Waiting;
