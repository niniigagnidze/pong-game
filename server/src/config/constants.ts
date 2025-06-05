export const SERVER_CONFIG = {
  PORT: 3000,
  CORS: {
    origin: "*",
    methods: ["GET", "POST"] as string[],
  },
} as const;

export const GAME_CONFIG = {
  CANVAS: {
    WIDTH: 800,
    HEIGHT: 600,
  },
  PADDLE: {
    WIDTH: 10,
    HEIGHT: 100,
    SPEED: 5,
  },
  BALL: {
    SIZE: 10,
    INITIAL_SPEED: 5,
    SPEED_INCREMENT: 0.2,
    MAX_SPEED: 15,
  },
  SCORE: {
    WIN_SCORE: 5,
  },
} as const; 