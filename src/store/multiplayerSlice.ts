import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import {
  MultiplayerGameState,
  GameRoom,
  Player,
  VoiceChat,
} from "../types/multiplayer";

const initialState: MultiplayerGameState = {
  currentRoom: null,
  currentPlayer: null,
  voiceChat: {
    isEnabled: false,
    isMuted: true,
    isConnected: false,
    participantCount: 0,
  },
  isConnected: false,
  error: null,
};

const multiplayerSlice = createSlice({
  name: "multiplayer",
  initialState,
  reducers: {
    setConnected: (state, action: PayloadAction<boolean>) => {
      state.isConnected = action.payload;
      if (!action.payload) {
        state.currentRoom = null;
        state.currentPlayer = null;
      }
    },
    setCurrentRoom: (state, action: PayloadAction<GameRoom | null>) => {
      state.currentRoom = action.payload;
    },
    setCurrentPlayer: (state, action: PayloadAction<Player | null>) => {
      state.currentPlayer = action.payload;
    },
    updateRoom: (state, action: PayloadAction<Partial<GameRoom>>) => {
      if (state.currentRoom) {
        state.currentRoom = { ...state.currentRoom, ...action.payload };
      }
    },
    addPlayer: (state, action: PayloadAction<Player>) => {
      if (state.currentRoom) {
        const existingPlayerIndex = state.currentRoom.players.findIndex(
          (p) => p.id === action.payload.id
        );
        if (existingPlayerIndex >= 0) {
          state.currentRoom.players[existingPlayerIndex] = action.payload;
        } else {
          state.currentRoom.players.push(action.payload);
        }
      }
    },
    removePlayer: (state, action: PayloadAction<string>) => {
      if (state.currentRoom) {
        state.currentRoom.players = state.currentRoom.players.filter(
          (p) => p.id !== action.payload
        );
        state.currentRoom.spectators = state.currentRoom.spectators.filter(
          (s) => s.id !== action.payload
        );
      }
    },
    updateVoiceChat: (state, action: PayloadAction<Partial<VoiceChat>>) => {
      state.voiceChat = { ...state.voiceChat, ...action.payload };
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    resetMultiplayer: (state) => {
      return initialState;
    },
  },
});

export const {
  setConnected,
  setCurrentRoom,
  setCurrentPlayer,
  updateRoom,
  addPlayer,
  removePlayer,
  updateVoiceChat,
  setError,
  clearError,
  resetMultiplayer,
} = multiplayerSlice.actions;

// Selectors
export const selectCurrentRoom = (state: {
  multiplayer: MultiplayerGameState;
}) => state.multiplayer.currentRoom;

export const selectCurrentPlayer = (state: {
  multiplayer: MultiplayerGameState;
}) => state.multiplayer.currentPlayer;

export const selectVoiceChat = (state: { multiplayer: MultiplayerGameState }) =>
  state.multiplayer.voiceChat;

export const selectIsConnected = (state: {
  multiplayer: MultiplayerGameState;
}) => state.multiplayer.isConnected;

export const selectMultiplayerError = (state: {
  multiplayer: MultiplayerGameState;
}) => state.multiplayer.error;

export default multiplayerSlice.reducer;
