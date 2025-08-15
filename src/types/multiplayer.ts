// Types for multiplayer functionality

export interface Player {
  id: string;
  name: string;
  avatar?: string;
  farcasterUser?: any;
  isHost: boolean;
  isReady: boolean;
}

export interface Spectator {
  id: string;
  name: string;
  avatar?: string;
  farcasterUser?: any;
}

export interface GameRoom {
  id: string;
  code: string;
  name: string;
  hostId: string;
  players: Player[];
  spectators: Spectator[];
  maxPlayers: number;
  isPrivate: boolean;
  gameState: "waiting" | "starting" | "playing" | "finished";
  voiceRoomUrl?: string;
  createdAt: Date;
}

export interface GameMove {
  playerId: string;
  column: number;
  timestamp: Date;
}

export interface VoiceChat {
  isEnabled: boolean;
  isMuted: boolean;
  isConnected: boolean;
  participantCount: number;
}

export interface MultiplayerGameState {
  currentRoom: GameRoom | null;
  currentPlayer: Player | null;
  voiceChat: VoiceChat;
  isConnected: boolean;
  error: string | null;
}
