import { useEffect, useRef } from "react";
import { Socket } from "socket.io-client";

interface UseKeyboardControlsProps {
  socket: Socket | null;
  playerIndex: 1 | 2 | null;
  enabled: boolean;
}

export const useKeyboardControls = ({
  socket,
  playerIndex,
  enabled,
}: UseKeyboardControlsProps) => {
  const lastEmitTimeRef = useRef(0);
  const EMIT_THROTTLE_MS = 1000 / 60; // 60 Hz

  useEffect(() => {
    if (!enabled || !socket || !playerIndex) {
      return;
    }

    const throttledEmit = (direction: "up" | "down") => {
      const now = Date.now();
      if (now - lastEmitTimeRef.current >= EMIT_THROTTLE_MS) {
        socket.emit("paddleMove", { dir: direction });
        lastEmitTimeRef.current = now;
        console.log(`Player ${playerIndex} paddle move: ${direction}`);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      // Prevent default behavior for game keys
      if (["KeyW", "KeyS", "ArrowUp", "ArrowDown"].includes(event.code)) {
        event.preventDefault();
      }

      // Player 1 controls (W/S)
      if (playerIndex === 1) {
        switch (event.code) {
          case "KeyW":
            throttledEmit("up");
            break;
          case "KeyS":
            throttledEmit("down");
            break;
        }
      }

      // Player 2 controls (Arrow keys)
      if (playerIndex === 2) {
        switch (event.code) {
          case "ArrowUp":
            throttledEmit("up");
            break;
          case "ArrowDown":
            throttledEmit("down");
            break;
        }
      }
    };

    // Add event listener to document
    document.addEventListener("keydown", handleKeyDown);
    console.log(`Keyboard controls enabled for Player ${playerIndex}`);

    // Cleanup function
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      console.log(`Keyboard controls disabled for Player ${playerIndex}`);
    };
  }, [socket, playerIndex, enabled]);
};
