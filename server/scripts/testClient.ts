import { io } from "socket.io-client";

const socket1 = io("http://localhost:3000");
const socket2 = io("http://localhost:3000");

let gameStarted = false;
let gameCount = 0;

socket1.on("connect", () => {
  console.log(`Client 1 connected: ${socket1.id}`);
  socket1.emit("joinGame");
});

socket1.on("waiting", () => {
  console.log("Client 1: Waiting for opponent...");
});

socket1.on("roomJoined", (data) => {
  console.log("Client 1: Room joined!", data);
});

socket1.on("gameState", (state) => {
  if (!gameStarted) {
    gameStarted = true;
    gameCount++;
    console.log(`🎮 Game ${gameCount} started!`);
  }
});

socket1.on("gameOver", (data) => {
  console.log(`🎉 GAME ${gameCount} OVER! Winner: ${data.winner}`);
  console.log(
    `Final Score: Player 1: ${data.finalScore.player1}, Player 2: ${data.finalScore.player2}`
  );

  if (gameCount < 2) {
    // Test restart functionality
    console.log("Client 1: Voting to restart...");
    socket1.emit("restartGame");
  } else {
    // End test after second game
    setTimeout(() => {
      socket1.disconnect();
      socket2.disconnect();
      process.exit(0);
    }, 2000);
  }
});

socket1.on("restartVoteUpdate", (data) => {
  console.log(
    `Client 1: Restart votes: ${data.votesReceived}/${data.votesNeeded}`
  );
});

socket1.on("restartConfirmed", () => {
  console.log("🔄 Client 1: Game restarted!");
  gameStarted = false; // Reset for new game
});

socket2.on("connect", () => {
  console.log(`Client 2 connected: ${socket2.id}`);

  setTimeout(() => {
    socket2.emit("joinGame");
  }, 1000);
});

socket2.on("roomJoined", (data) => {
  console.log("Client 2: Room joined!", data);
});

socket2.on("gameOver", (data) => {
  console.log(`🎉 Client 2 - GAME ${gameCount} OVER! Winner: ${data.winner}`);

  if (gameCount < 2) {
    // Vote to restart after a short delay
    setTimeout(() => {
      console.log("Client 2: Voting to restart...");
      socket2.emit("restartGame");
    }, 1000);
  }
});

socket2.on("restartVoteUpdate", (data) => {
  console.log(
    `Client 2: Restart votes: ${data.votesReceived}/${data.votesNeeded}`
  );
});

socket2.on("restartConfirmed", () => {
  console.log("🔄 Client 2: Game restarted!");
});

// Force quick game end for testing by making player 1 win
setTimeout(() => {
  if (gameStarted && gameCount === 1) {
    console.log("🚀 Simulating quick game end for testing...");
    // This is just for testing - in real game, scoring happens naturally
  }
}, 3000);

// Safety disconnect after 20 seconds
setTimeout(() => {
  console.log("Test timeout - disconnecting clients...");
  socket1.disconnect();
  socket2.disconnect();
  process.exit(0);
}, 20000);
