import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import {
  setCurrentRoom,
  setCurrentPlayer,
  setConnected,
  setError,
  selectCurrentRoom,
  selectIsConnected,
  selectMultiplayerError,
} from "../../store/multiplayerSlice";
import { multiplayerService } from "../../services/multiplayerService";
import { voiceChatService } from "../../services/voiceChatService";
import { Player } from "../../types/multiplayer";
import { v4 as uuidv4 } from "uuid";

const LobbyContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 2rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  min-height: 100vh;
  color: white;
`;

const LobbyCard = styled.div`
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  padding: 2rem;
  margin: 1rem;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.18);
  max-width: 500px;
  width: 100%;
`;

const Title = styled.h1`
  text-align: center;
  margin-bottom: 2rem;
  font-size: 2.5rem;
  background: linear-gradient(45deg, #ff6b6b, #4ecdc4);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
`;

const Input = styled.input`
  width: 100%;
  padding: 1rem;
  margin: 0.5rem 0;
  border: none;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.2);
  color: white;
  font-size: 1rem;

  &::placeholder {
    color: rgba(255, 255, 255, 0.7);
  }

  &:focus {
    outline: none;
    background: rgba(255, 255, 255, 0.3);
  }
`;

const Button = styled.button`
  width: 100%;
  padding: 1rem;
  margin: 0.5rem 0;
  border: none;
  border-radius: 10px;
  background: linear-gradient(45deg, #ff6b6b, #4ecdc4);
  color: white;
  font-size: 1rem;
  font-weight: bold;
  cursor: pointer;
  transition: transform 0.2s;

  &:hover {
    transform: translateY(-2px);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
`;

const ErrorMessage = styled.div`
  background: rgba(255, 107, 107, 0.2);
  border: 1px solid #ff6b6b;
  border-radius: 10px;
  padding: 1rem;
  margin: 1rem 0;
  text-align: center;
  color: #ff6b6b;
`;

const ConnectionStatus = styled.div<{ connected: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1rem;

  &::before {
    content: "";
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: ${(props) => (props.connected ? "#4ecdc4" : "#ff6b6b")};
    margin-right: 0.5rem;
  }
`;

interface LobbyProps {
  onRoomJoined: () => void;
}

export const Lobby: React.FC<LobbyProps> = ({ onRoomJoined }) => {
  const dispatch = useAppDispatch();
  const currentRoom = useAppSelector(selectCurrentRoom);
  const isConnected = useAppSelector(selectIsConnected);
  const error = useAppSelector(selectMultiplayerError);

  const [playerName, setPlayerName] = useState("");
  const [roomName, setRoomName] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<"create" | "join" | null>(null);

  useEffect(() => {
    // Initialize connection to multiplayer server
    const initializeConnection = async () => {
      try {
        await multiplayerService.connect();
        dispatch(setConnected(true));

        // Set up event listeners
        multiplayerService.onRoomUpdate((room) => {
          dispatch(setCurrentRoom(room));
        });

        multiplayerService.onError((error) => {
          dispatch(setError(error));
        });
      } catch (error) {
        console.error("Failed to connect to multiplayer server:", error);
        dispatch(setError("Failed to connect to multiplayer server"));
      }
    };

    initializeConnection();

    return () => {
      multiplayerService.removeAllListeners();
    };
  }, [dispatch]);

  const handleCreateRoom = async () => {
    if (!playerName.trim() || !roomName.trim()) {
      dispatch(setError("Please enter both player name and room name"));
      return;
    }

    setIsLoading(true);
    try {
      const room = await multiplayerService.createRoom(roomName, playerName);

      // Create player object
      const player: Player = {
        id: uuidv4(),
        name: playerName,
        isHost: true,
        isReady: false,
      };

      dispatch(setCurrentPlayer(player));
      dispatch(setCurrentRoom(room));

      // Initialize voice chat room
      const voiceRoomUrl = await voiceChatService.createRoom();

      // Update room with voice chat URL (this would be sent to server in real implementation)
      console.log("Voice room created:", voiceRoomUrl);

      onRoomJoined();
    } catch (error) {
      dispatch(
        setError(
          error instanceof Error ? error.message : "Failed to create room"
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinRoom = async (asSpectator: boolean = false) => {
    if (!playerName.trim() || !roomCode.trim()) {
      dispatch(setError("Please enter both player name and room code"));
      return;
    }

    setIsLoading(true);
    try {
      const room = await multiplayerService.joinRoom(
        roomCode,
        playerName,
        asSpectator
      );

      // Create player object
      const player: Player = {
        id: uuidv4(),
        name: playerName,
        isHost: false,
        isReady: false,
      };

      dispatch(setCurrentPlayer(player));
      dispatch(setCurrentRoom(room));

      // Join voice chat if room has it
      if (room.voiceRoomUrl) {
        await voiceChatService.joinRoom(room.voiceRoomUrl);
      }

      onRoomJoined();
    } catch (error) {
      dispatch(
        setError(error instanceof Error ? error.message : "Failed to join room")
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (currentRoom) {
    return null; // Don't render lobby if already in a room
  }

  return (
    <LobbyContainer>
      <Title>Connect 4 Multiplayer</Title>

      <LobbyCard>
        <ConnectionStatus connected={isConnected}>
          {isConnected ? "Connected to server" : "Connecting..."}
        </ConnectionStatus>

        {error && <ErrorMessage>{error}</ErrorMessage>}

        <Input
          type="text"
          placeholder="Enter your name"
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value)}
          disabled={isLoading || !isConnected}
        />

        {!mode && (
          <>
            <Button
              onClick={() => setMode("create")}
              disabled={isLoading || !isConnected}
            >
              Create New Room
            </Button>
            <Button
              onClick={() => setMode("join")}
              disabled={isLoading || !isConnected}
            >
              Join Existing Room
            </Button>
          </>
        )}

        {mode === "create" && (
          <>
            <Input
              type="text"
              placeholder="Room name"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              disabled={isLoading}
            />
            <Button
              onClick={handleCreateRoom}
              disabled={isLoading || !playerName.trim() || !roomName.trim()}
            >
              {isLoading ? "Creating..." : "Create Room"}
            </Button>
            <Button
              onClick={() => setMode(null)}
              disabled={isLoading}
              style={{ background: "rgba(255, 255, 255, 0.2)" }}
            >
              Back
            </Button>
          </>
        )}

        {mode === "join" && (
          <>
            <Input
              type="text"
              placeholder="Room code (e.g., ABC123)"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
              disabled={isLoading}
            />
            <Button
              onClick={() => handleJoinRoom(false)}
              disabled={isLoading || !playerName.trim() || !roomCode.trim()}
            >
              {isLoading ? "Joining..." : "Join as Player"}
            </Button>
            <Button
              onClick={() => handleJoinRoom(true)}
              disabled={isLoading || !playerName.trim() || !roomCode.trim()}
              style={{ background: "rgba(255, 255, 255, 0.2)" }}
            >
              {isLoading ? "Joining..." : "Join as Spectator"}
            </Button>
            <Button
              onClick={() => setMode(null)}
              disabled={isLoading}
              style={{ background: "rgba(255, 255, 255, 0.2)" }}
            >
              Back
            </Button>
          </>
        )}
      </LobbyCard>
    </LobbyContainer>
  );
};

export default Lobby;
