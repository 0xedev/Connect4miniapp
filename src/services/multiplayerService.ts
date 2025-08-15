import { io, Socket } from "socket.io-client";
import { GameRoom, Player, Spectator, GameMove } from "../types/multiplayer";

class MultiplayerService {
  private socket: Socket | null = null;
  private currentRoom: string | null = null;

  // Initialize connection to the Socket.IO server
  connect(serverUrl?: string): Promise<void> {
    const defaultUrl =
      process.env.REACT_APP_BACKEND_URL ||
      (process.env.NODE_ENV === "production"
        ? "https://your-backend.railway.app"
        : "http://localhost:3001");

    const url = serverUrl || defaultUrl;
    return new Promise((resolve, reject) => {
      try {
        this.socket = io(url, {
          transports: ["websocket", "polling"],
        });

        this.socket.on("connect", () => {
          console.log("Connected to multiplayer server");
          resolve();
        });

        this.socket.on("connect_error", (error: any) => {
          console.error("Connection error:", error);
          reject(error);
        });

        this.socket.on("disconnect", () => {
          console.log("Disconnected from multiplayer server");
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  // Create a new game room
  createRoom(
    roomName: string,
    playerName: string,
    isPrivate: boolean = false
  ): Promise<GameRoom> {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        reject(new Error("Not connected to server"));
        return;
      }

      this.socket.emit("create-room", {
        roomName,
        playerName,
        isPrivate,
      });

      this.socket.once("room-created", (room: GameRoom) => {
        this.currentRoom = room.id;
        resolve(room);
      });

      this.socket.once("error", (error: string) => {
        reject(new Error(error));
      });
    });
  }

  // Join an existing room using room code
  joinRoom(
    roomCode: string,
    playerName: string,
    asSpectator: boolean = false
  ): Promise<GameRoom> {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        reject(new Error("Not connected to server"));
        return;
      }

      this.socket.emit("join-room", {
        roomCode,
        playerName,
        asSpectator,
      });

      this.socket.once("room-joined", (room: GameRoom) => {
        this.currentRoom = room.id;
        resolve(room);
      });

      this.socket.once("error", (error: string) => {
        reject(new Error(error));
      });
    });
  }

  // Leave current room
  leaveRoom(): void {
    if (this.socket && this.currentRoom) {
      this.socket.emit("leave-room", { roomId: this.currentRoom });
      this.currentRoom = null;
    }
  }

  // Send game move
  sendMove(column: number): void {
    if (this.socket && this.currentRoom) {
      this.socket.emit("game-move", {
        roomId: this.currentRoom,
        column,
      });
    }
  }

  // Toggle ready status
  toggleReady(): void {
    if (this.socket && this.currentRoom) {
      this.socket.emit("toggle-ready", { roomId: this.currentRoom });
    }
  }

  // Event listeners
  onRoomUpdate(callback: (room: GameRoom) => void): void {
    this.socket?.on("room-update", callback);
  }

  onGameMove(callback: (move: GameMove) => void): void {
    this.socket?.on("game-move", callback);
  }

  onPlayerJoined(callback: (player: Player | Spectator) => void): void {
    this.socket?.on("player-joined", callback);
  }

  onPlayerLeft(callback: (playerId: string) => void): void {
    this.socket?.on("player-left", callback);
  }

  onGameStarted(callback: () => void): void {
    this.socket?.on("game-started", callback);
  }

  onGameEnded(callback: (winnerId?: string) => void): void {
    this.socket?.on("game-ended", callback);
  }

  onError(callback: (error: string) => void): void {
    this.socket?.on("error", callback);
  }

  // Clean up event listeners
  removeAllListeners(): void {
    this.socket?.removeAllListeners();
  }

  // Disconnect from server
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.currentRoom = null;
    }
  }

  // Get connection status
  isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

export const multiplayerService = new MultiplayerService();
