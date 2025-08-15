// Simple Node.js + Socket.IO server for multiplayer functionality
// This would typically run separately on a server
// To run: node server.js (after installing socket.io, express, cors)

const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const cors = require("cors");

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

app.use(cors());
app.use(express.json());

// In-memory storage for rooms (use Redis/database in production)
const rooms = new Map();

// Generate random room code
function generateRoomCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// Create a new room
function createRoom(roomName, hostName, isPrivate = false) {
  const roomId = Math.random().toString(36).substring(2, 15);
  const roomCode = generateRoomCode();

  const room = {
    id: roomId,
    code: roomCode,
    name: roomName,
    hostId: null,
    players: [],
    spectators: [],
    maxPlayers: 2,
    isPrivate,
    gameState: "waiting",
    voiceRoomUrl: null,
    createdAt: new Date(),
    gameBoard: Array(6)
      .fill(null)
      .map(() => Array(7).fill(null)),
    currentPlayer: 0,
  };

  rooms.set(roomId, room);
  return room;
}

// Find room by code
function findRoomByCode(code) {
  for (const room of rooms.values()) {
    if (room.code === code) {
      return room;
    }
  }
  return null;
}

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // Create room
  socket.on("create-room", ({ roomName, playerName, isPrivate }) => {
    try {
      const room = createRoom(roomName, playerName, isPrivate);

      // Add host as first player
      const player = {
        id: socket.id,
        name: playerName,
        isHost: true,
        isReady: false,
      };

      room.players.push(player);
      room.hostId = socket.id;

      // Join socket room
      socket.join(room.id);
      socket.currentRoomId = room.id;

      socket.emit("room-created", room);
      console.log(`Room created: ${room.code} by ${playerName}`);
    } catch (error) {
      socket.emit("error", "Failed to create room");
    }
  });

  // Join room
  socket.on("join-room", ({ roomCode, playerName, asSpectator }) => {
    try {
      const room = findRoomByCode(roomCode);
      if (!room) {
        socket.emit("error", "Room not found");
        return;
      }

      if (!asSpectator && room.players.length >= room.maxPlayers) {
        socket.emit("error", "Room is full");
        return;
      }

      const participant = {
        id: socket.id,
        name: playerName,
        isHost: false,
        isReady: false,
      };

      if (asSpectator) {
        room.spectators.push(participant);
      } else {
        room.players.push(participant);
      }

      // Join socket room
      socket.join(room.id);
      socket.currentRoomId = room.id;

      // Notify room of new participant
      socket.to(room.id).emit("player-joined", participant);
      socket.emit("room-joined", room);

      console.log(
        `${playerName} joined room ${room.code} as ${
          asSpectator ? "spectator" : "player"
        }`
      );
    } catch (error) {
      socket.emit("error", "Failed to join room");
    }
  });

  // Leave room
  socket.on("leave-room", ({ roomId }) => {
    leaveRoom(socket, roomId);
  });

  // Toggle ready status
  socket.on("toggle-ready", ({ roomId }) => {
    const room = rooms.get(roomId);
    if (!room) return;

    const player = room.players.find((p) => p.id === socket.id);
    if (player) {
      player.isReady = !player.isReady;
      io.to(roomId).emit("room-update", room);
    }
  });

  // Game move
  socket.on("game-move", ({ roomId, column }) => {
    const room = rooms.get(roomId);
    if (!room || room.gameState !== "playing") return;

    const playerIndex = room.players.findIndex((p) => p.id === socket.id);
    if (playerIndex !== room.currentPlayer) return; // Not your turn

    // Validate move and update board
    const gameBoard = room.gameBoard;
    let row = -1;

    // Find the lowest available row in the column
    for (let r = 5; r >= 0; r--) {
      if (gameBoard[r][column] === null) {
        row = r;
        break;
      }
    }

    if (row === -1) return; // Column is full

    // Make the move
    gameBoard[row][column] = playerIndex;
    room.currentPlayer = (room.currentPlayer + 1) % room.players.length;

    const move = {
      playerId: socket.id,
      column,
      row,
      timestamp: new Date(),
    };

    io.to(roomId).emit("game-move", move);
    io.to(roomId).emit("room-update", room);
  });

  // Disconnect
  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
    if (socket.currentRoomId) {
      leaveRoom(socket, socket.currentRoomId);
    }
  });

  function leaveRoom(socket, roomId) {
    const room = rooms.get(roomId);
    if (!room) return;

    // Remove from players or spectators
    room.players = room.players.filter((p) => p.id !== socket.id);
    room.spectators = room.spectators.filter((s) => s.id !== socket.id);

    // If host left, assign new host
    if (room.hostId === socket.id && room.players.length > 0) {
      room.players[0].isHost = true;
      room.hostId = room.players[0].id;
    }

    // If no players left, delete room
    if (room.players.length === 0 && room.spectators.length === 0) {
      rooms.delete(roomId);
      console.log(`Room ${room.code} deleted - no participants`);
    } else {
      // Notify remaining participants
      socket.to(roomId).emit("player-left", socket.id);
      socket.to(roomId).emit("room-update", room);
    }

    socket.leave(roomId);
    socket.currentRoomId = null;
  }
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Multiplayer server running on port ${PORT}`);
});
