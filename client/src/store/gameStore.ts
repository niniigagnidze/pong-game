import { create } from "zustand";
import type { GameState } from "../types";

type GameStatus =
  | "landing"
  | "waiting"
  | "playing"
  | "gameOver"
  | "awaitingRestart"
  | "opponentDisconnected";

interface GameStore {
  // State
  gameState: GameState | null;
  playerIndex: 1 | 2 | null;
  roomId: string | null;
  status: GameStatus;

  // Actions
  setGameState: (state: GameState) => void;
  setPlayerIndex: (index: 1 | 2 | null) => void;
  setRoomId: (id: string | null) => void;
  setStatus: (status: GameStatus) => void;

  // Compound actions
  joinRoom: (roomId: string, playerIndex: 1 | 2) => void;
  endGame: (winner: "player1" | "player2") => void;
  requestRestart: () => void;
  confirmRestart: (initialState: GameState) => void;
  handleDisconnect: () => void;
  reset: () => void;
}

export const useGameStore = create<GameStore>((set, get) => ({
  // Initial state
  gameState: null,
  playerIndex: null,
  roomId: null,
  status: "landing",

  // Basic setters
  setGameState: (gameState) => set({ gameState }),

  setPlayerIndex: (playerIndex) => set({ playerIndex }),

  setRoomId: (roomId) => set({ roomId }),

  setStatus: (status) => set({ status }),

  // Compound actions
  joinRoom: (roomId, playerIndex) =>
    set({
      roomId,
      playerIndex,
      status: "playing",
    }),

  endGame: (winner) =>
    set((state) => ({
      gameState: state.gameState
        ? {
            ...state.gameState,
            gameOver: true,
            winner,
          }
        : null,
      status: "gameOver",
    })),

  // New action to handle local player's restart request
  requestRestart: () => set({ status: "awaitingRestart" }),

  // New action to handle confirmation from server
  confirmRestart: (initialState) =>
    set({
      gameState: initialState,
      status: "playing",
    }),

  handleDisconnect: () => set({ status: "opponentDisconnected" }),

  reset: () =>
    set({
      gameState: null,
      playerIndex: null,
      roomId: null,
      status: "landing",
    }),
}));

// Selectors for convenience
export const useGameStatus = () => useGameStore((state) => state.status);
export const usePlayerIndex = () => useGameStore((state) => state.playerIndex);
export const useRoomId = () => useGameStore((state) => state.roomId);
export const useCurrentGameState = () =>
  useGameStore((state) => state.gameState);

// Derived state selectors
export const useIsPlayer1 = () =>
  useGameStore((state) => state.playerIndex === 1);
export const useIsPlayer2 = () =>
  useGameStore((state) => state.playerIndex === 2);
export const useIsGameOver = () =>
  useGameStore((state) => state.gameState?.gameOver ?? false);
export const useCurrentScore = () =>
  useGameStore((state) => state.gameState?.score ?? { player1: 0, player2: 0 });
export const useWinner = () => useGameStore((state) => state.gameState?.winner);
