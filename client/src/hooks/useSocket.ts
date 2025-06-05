import { useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";

// Singleton socket instance
let globalSocket: Socket | null = null;
let isConnecting = false;

export const useSocket = () => {
  const mountedRef = useRef(true);

  const connect = () => {
    if (globalSocket?.connected) {
      return globalSocket;
    }

    if (isConnecting) {
      return globalSocket;
    }

    if (!globalSocket) {
      isConnecting = true;
      globalSocket = io("http://localhost:3000", {
        autoConnect: false,
      });

      globalSocket.on("connect", () => {
        isConnecting = false;
        console.log("Socket connected successfully");
      });

      globalSocket.on("disconnect", (reason) => {
        isConnecting = false;
        console.log("Socket disconnected:", reason);
      });

      console.log("Socket connecting...");
      globalSocket.connect();
    }

    return globalSocket;
  };

  const disconnect = () => {
    if (globalSocket) {
      globalSocket.disconnect();
      globalSocket = null;
      isConnecting = false;
      console.log("Socket disconnected manually");
    }
  };

  const getSocket = () => globalSocket;

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
      // Don't auto-disconnect on unmount - let the socket persist
    };
  }, []);

  return {
    connect,
    disconnect,
    getSocket,
  };
};

// Export function to manually cleanup socket when needed
export const cleanupSocket = () => {
  if (globalSocket) {
    globalSocket.disconnect();
    globalSocket = null;
    isConnecting = false;
  }
};
