const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const { RateLimiterMemory } = require('rate-limiter-flexible');
const cron = require('node-cron');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const app = express();
const server = http.createServer(app);

// Security middleware
app.use(helmet());
app.use(compression());

// CORS configuration for production
const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS ? 
    process.env.ALLOWED_ORIGINS.split(',') : 
    ['http://localhost:3000', 'https://4tune.vercel.app'],
  methods: ['GET', 'POST'],
  credentials: true
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});

app.use(limiter);

// Socket.IO rate limiter
const socketRateLimiter = new RateLimiterMemory({
  points: 10, // Number of points
  duration: 1, // Per second
});

// Socket.IO setup with production settings
const io = socketIo(server, {
  cors: corsOptions,
  transports: ['websocket', 'polling'],
  pingTimeout: 60000,
  pingInterval: 25000,
  maxHttpBufferSize: 1e6, // 1MB
  allowEIO3: true
});

// In-memory storage (use Redis in production for scaling)
const rooms = new Map();
const userSessions = new Map();

// Room cleanup - remove empty rooms every 5 minutes
cron.schedule('*/5 * * * *', () => {
  const now = Date.now();
  for (const [roomId, room] of rooms.entries()) {
    // Remove rooms that are empty for more than 30 minutes
    if (room.players.length === 0 && room.spectators.length === 0) {
      const timeSinceEmpty = now - (room.lastActivity || room.createdAt);
      if (timeSinceEmpty > 30 * 60 * 1000) { // 30 minutes
        rooms.delete(roomId);
        console.log(`Cleaned up empty room: ${room.code}`);
      }
    }
  }
});

// Utility functions
function generateRoomCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function createRoom(roomName, hostName, isPrivate = false) {
  const roomId = uuidv4();
  const roomCode = generateRoomCode();
  
  // Ensure unique room code
  while ([...rooms.values()].some(r => r.code === roomCode)) {
    roomCode = generateRoomCode();
  }
  
  const room = {
    id: roomId,
    code: roomCode,
    name: roomName,
    hostId: null,
    players: [],
    spectators: [],
    maxPlayers: 2,
    isPrivate,
    gameState: 'waiting',
    voiceRoomUrl: null,
    createdAt: Date.now(),
    lastActivity: Date.now(),
    gameBoard: Array(6).fill(null).map(() => Array(7).fill(null)),
    currentPlayer: 0,
    gameHistory: [],
    connectionCount: 0
  };
  
  rooms.set(roomId, room);
  return room;
}

function findRoomByCode(code) {
  for (const room of rooms.values()) {
    if (room.code === code) {
      return room;
    }
  }
  return null;
}

function updateRoomActivity(roomId) {
  const room = rooms.get(roomId);
  if (room) {
    room.lastActivity = Date.now();
  }
}

function validateMove(room, column, playerId) {
  if (!room || room.gameState !== 'playing') return false;
  if (column < 0 || column > 6) return false;
  
  const playerIndex = room.players.findIndex(p => p.id === playerId);
  if (playerIndex !== room.currentPlayer) return false;
  
  // Check if column has space
  return room.gameBoard[0][column] === null;
}

function checkWin(board, row, col, player) {
  const directions = [
    [0, 1], [1, 0], [1, 1], [1, -1]
  ];
  
  for (const [dx, dy] of directions) {
    let count = 1;
    
    // Check positive direction
    for (let i = 1; i < 4; i++) {
      const newRow = row + dx * i;
      const newCol = col + dy * i;
      if (newRow >= 0 && newRow < 6 && newCol >= 0 && newCol < 7 && 
          board[newRow][newCol] === player) {
        count++;
      } else {
        break;
      }
    }
    
    // Check negative direction
    for (let i = 1; i < 4; i++) {
      const newRow = row - dx * i;
      const newCol = col - dy * i;
      if (newRow >= 0 && newRow < 6 && newCol >= 0 && newCol < 7 && 
          board[newRow][newCol] === player) {
        count++;
      } else {
        break;
      }
    }
    
    if (count >= 4) return true;
  }
  
  return false;
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    rooms: rooms.size,
    connections: io.engine.clientsCount
  });
});

// Stats endpoint
app.get('/stats', (req, res) => {
  const roomStats = {
    totalRooms: rooms.size,
    activeGames: [...rooms.values()].filter(r => r.gameState === 'playing').length,
    totalPlayers: [...rooms.values()].reduce((sum, r) => sum + r.players.length, 0),
    totalSpectators: [...rooms.values()].reduce((sum, r) => sum + r.spectators.length, 0)
  };
  
  res.json({
    ...roomStats,
    connections: io.engine.clientsCount,
    uptime: process.uptime(),
    memory: process.memoryUsage()
  });
});

// Socket.IO connection handling
io.on('connection', async (socket) => {
  console.log(`User connected: ${socket.id}`);
  
  // Rate limiting for socket events
  socket.use(async (packet, next) => {
    try {
      await socketRateLimiter.consume(socket.handshake.address);
      next();
    } catch (rejRes) {
      socket.emit('error', 'Rate limit exceeded');
    }
  });
  
  // Store user session
  userSessions.set(socket.id, {
    connectedAt: Date.now(),
    currentRoomId: null,
    ipAddress: socket.handshake.address
  });
  
  // Create room
  socket.on('create-room', ({ roomName, playerName, isPrivate }) => {
    try {
      if (!roomName || !playerName || roomName.length > 50 || playerName.length > 30) {
        socket.emit('error', 'Invalid room name or player name');
        return;
      }
      
      const room = createRoom(roomName, playerName, isPrivate);
      
      const player = {
        id: socket.id,
        name: playerName,
        isHost: true,
        isReady: false,
        joinedAt: Date.now()
      };
      
      room.players.push(player);
      room.hostId = socket.id;
      room.connectionCount++;
      
      socket.join(room.id);
      userSessions.get(socket.id).currentRoomId = room.id;
      
      socket.emit('room-created', room);
      
      console.log(`Room created: ${room.code} by ${playerName} (${socket.id})`);
    } catch (error) {
      console.error('Error creating room:', error);
      socket.emit('error', 'Failed to create room');
    }
  });
  
  // Join room
  socket.on('join-room', ({ roomCode, playerName, asSpectator }) => {
    try {
      if (!roomCode || !playerName || roomCode.length > 10 || playerName.length > 30) {
        socket.emit('error', 'Invalid room code or player name');
        return;
      }
      
      const room = findRoomByCode(roomCode.toUpperCase());
      if (!room) {
        socket.emit('error', 'Room not found');
        return;
      }
      
      if (!asSpectator && room.players.length >= room.maxPlayers) {
        socket.emit('error', 'Room is full');
        return;
      }
      
      // Check if user is already in the room
      const existingPlayer = room.players.find(p => p.id === socket.id);
      const existingSpectator = room.spectators.find(s => s.id === socket.id);
      
      if (existingPlayer || existingSpectator) {
        socket.emit('error', 'You are already in this room');
        return;
      }
      
      const participant = {
        id: socket.id,
        name: playerName,
        isHost: false,
        isReady: false,
        joinedAt: Date.now()
      };
      
      if (asSpectator) {
        room.spectators.push(participant);
      } else {
        room.players.push(participant);
      }
      
      room.connectionCount++;
      updateRoomActivity(room.id);
      
      socket.join(room.id);
      userSessions.get(socket.id).currentRoomId = room.id;
      
      socket.to(room.id).emit('player-joined', participant);
      socket.emit('room-joined', room);
      
      console.log(`${playerName} joined room ${room.code} as ${asSpectator ? 'spectator' : 'player'}`);
    } catch (error) {
      console.error('Error joining room:', error);
      socket.emit('error', 'Failed to join room');
    }
  });
  
  // Leave room
  socket.on('leave-room', ({ roomId }) => {
    leaveRoom(socket, roomId);
  });
  
  // Toggle ready status
  socket.on('toggle-ready', ({ roomId }) => {
    try {
      const room = rooms.get(roomId);
      if (!room) return;
      
      const player = room.players.find(p => p.id === socket.id);
      if (player && !player.isHost) {
        player.isReady = !player.isReady;
        updateRoomActivity(roomId);
        io.to(roomId).emit('room-update', room);
      }
    } catch (error) {
      console.error('Error toggling ready:', error);
    }
  });
  
  // Start game
  socket.on('start-game', ({ roomId }) => {
    try {
      const room = rooms.get(roomId);
      if (!room || room.hostId !== socket.id) return;
      
      const readyPlayers = room.players.filter(p => p.isReady || p.isHost);
      if (readyPlayers.length >= 2 && readyPlayers.length === room.players.length) {
        room.gameState = 'playing';
        room.currentPlayer = 0;
        room.gameBoard = Array(6).fill(null).map(() => Array(7).fill(null));
        updateRoomActivity(roomId);
        
        io.to(roomId).emit('game-started', room);
        console.log(`Game started in room ${room.code}`);
      }
    } catch (error) {
      console.error('Error starting game:', error);
    }
  });
  
  // Game move
  socket.on('game-move', ({ roomId, column }) => {
    try {
      const room = rooms.get(roomId);
      if (!validateMove(room, column, socket.id)) return;
      
      const playerIndex = room.players.findIndex(p => p.id === socket.id);
      const gameBoard = room.gameBoard;
      
      // Find the lowest available row
      let row = -1;
      for (let r = 5; r >= 0; r--) {
        if (gameBoard[r][column] === null) {
          row = r;
          break;
        }
      }
      
      if (row === -1) return; // Column is full
      
      // Make the move
      gameBoard[row][column] = playerIndex;
      
      const move = {
        playerId: socket.id,
        playerName: room.players[playerIndex].name,
        column,
        row,
        timestamp: Date.now(),
      };
      
      room.gameHistory.push(move);
      
      // Check for win
      const hasWon = checkWin(gameBoard, row, column, playerIndex);
      
      if (hasWon) {
        room.gameState = 'finished';
        io.to(roomId).emit('game-won', {
          winner: room.players[playerIndex],
          move
        });
      } else {
        // Check for draw
        const isFull = gameBoard[0].every(cell => cell !== null);
        if (isFull) {
          room.gameState = 'finished';
          io.to(roomId).emit('game-draw', { move });
        } else {
          // Next player's turn
          room.currentPlayer = (room.currentPlayer + 1) % room.players.length;
        }
      }
      
      updateRoomActivity(roomId);
      io.to(roomId).emit('game-move', move);
      io.to(roomId).emit('room-update', room);
      
    } catch (error) {
      console.error('Error handling game move:', error);
    }
  });
  
  // Disconnect
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
    
    const session = userSessions.get(socket.id);
    if (session && session.currentRoomId) {
      leaveRoom(socket, session.currentRoomId);
    }
    
    userSessions.delete(socket.id);
  });
  
  function leaveRoom(socket, roomId) {
    try {
      const room = rooms.get(roomId);
      if (!room) return;
      
      // Remove from players or spectators
      const playerIndex = room.players.findIndex(p => p.id === socket.id);
      const spectatorIndex = room.spectators.findIndex(s => s.id === socket.id);
      
      if (playerIndex >= 0) {
        room.players.splice(playerIndex, 1);
      }
      if (spectatorIndex >= 0) {
        room.spectators.splice(spectatorIndex, 1);
      }
      
      room.connectionCount = Math.max(0, room.connectionCount - 1);
      
      // If host left, assign new host
      if (room.hostId === socket.id && room.players.length > 0) {
        room.players[0].isHost = true;
        room.hostId = room.players[0].id;
      }
      
      updateRoomActivity(roomId);
      
      // If no players left, delete room after delay
      if (room.players.length === 0 && room.spectators.length === 0) {
        setTimeout(() => {
          if (rooms.has(roomId)) {
            const currentRoom = rooms.get(roomId);
            if (currentRoom.players.length === 0 && currentRoom.spectators.length === 0) {
              rooms.delete(roomId);
              console.log(`Room ${room.code} deleted - no participants`);
            }
          }
        }, 30000); // 30 second delay
      } else {
        // Notify remaining participants
        socket.to(roomId).emit('player-left', socket.id);
        socket.to(roomId).emit('room-update', room);
      }
      
      socket.leave(roomId);
      const session = userSessions.get(socket.id);
      if (session) {
        session.currentRoomId = null;
      }
      
    } catch (error) {
      console.error('Error leaving room:', error);
    }
  }
});

// Error handling
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🚀 Multiplayer server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`📈 Stats: http://localhost:${PORT}/stats`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
