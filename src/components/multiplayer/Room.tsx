import React, { useEffect, useState } from "react";
import styled from "styled-components";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import {
  selectCurrentRoom,
  selectCurrentPlayer,
  selectVoiceChat,
  updateVoiceChat,
  setCurrentRoom,
} from "../../store/multiplayerSlice";
import { multiplayerService } from "../../services/multiplayerService";
import { voiceChatService } from "../../services/voiceChatService";

const RoomContainer = styled.div`
  display: flex;
  flex-direction: column;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 15px;
  margin: 1rem;
  color: white;
`;

const RoomHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
`;

const RoomInfo = styled.div`
  h2 {
    margin: 0;
    color: #4ecdc4;
  }
  p {
    margin: 0.5rem 0;
    color: rgba(255, 255, 255, 0.8);
  }
`;

const RoomCode = styled.div`
  background: linear-gradient(45deg, #ff6b6b, #4ecdc4);
  padding: 0.5rem 1rem;
  border-radius: 10px;
  font-weight: bold;
  font-size: 1.2rem;
  cursor: pointer;
  transition: transform 0.2s;

  &:hover {
    transform: scale(1.05);
  }
`;

const ParticipantsSection = styled.div`
  margin: 1rem 0;
`;

const ParticipantList = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;
  margin-top: 1rem;
`;

const ParticipantCard = styled.div<{
  isHost?: boolean;
  isCurrentPlayer?: boolean;
}>`
  background: ${(props) =>
    props.isCurrentPlayer
      ? "rgba(76, 205, 196, 0.3)"
      : props.isHost
      ? "rgba(255, 107, 107, 0.3)"
      : "rgba(255, 255, 255, 0.1)"};
  padding: 1rem;
  border-radius: 10px;
  border: ${(props) =>
    props.isCurrentPlayer
      ? "2px solid #4ecdc4"
      : props.isHost
      ? "2px solid #ff6b6b"
      : "1px solid rgba(255, 255, 255, 0.2)"};

  h4 {
    margin: 0 0 0.5rem 0;
    color: white;
  }

  .status {
    font-size: 0.9rem;
    color: rgba(255, 255, 255, 0.8);
  }

  .role {
    font-size: 0.8rem;
    color: ${(props) => (props.isHost ? "#ff6b6b" : "#4ecdc4")};
    font-weight: bold;
  }
`;

const VoiceChatControls = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  margin: 1rem 0;
  padding: 1rem;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 10px;
`;

const VoiceButton = styled.button<{ active?: boolean }>`
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 8px;
  background: ${(props) =>
    props.active ? "#4ecdc4" : "rgba(255, 255, 255, 0.2)"};
  color: white;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: ${(props) =>
      props.active ? "#45b7b8" : "rgba(255, 255, 255, 0.3)"};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const GameControls = styled.div`
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
`;

const ControlButton = styled.button<{
  variant?: "primary" | "secondary" | "danger";
}>`
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 10px;
  color: white;
  font-weight: bold;
  cursor: pointer;
  transition: transform 0.2s;

  background: ${(props) => {
    switch (props.variant) {
      case "primary":
        return "linear-gradient(45deg, #4ecdc4, #44a08d)";
      case "danger":
        return "linear-gradient(45deg, #ff6b6b, #ee5a52)";
      default:
        return "rgba(255, 255, 255, 0.2)";
    }
  }};

  &:hover {
    transform: translateY(-2px);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
`;

interface RoomProps {
  onStartGame: () => void;
  onLeaveRoom: () => void;
}

export const Room: React.FC<RoomProps> = ({ onStartGame, onLeaveRoom }) => {
  const dispatch = useAppDispatch();
  const currentRoom = useAppSelector(selectCurrentRoom);
  const currentPlayer = useAppSelector(selectCurrentPlayer);
  const voiceChat = useAppSelector(selectVoiceChat);

  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Initialize voice chat
    const initializeVoiceChat = async () => {
      try {
        await voiceChatService.initialize();

        if (currentRoom?.voiceRoomUrl) {
          await voiceChatService.joinRoom(currentRoom.voiceRoomUrl);
          dispatch(
            updateVoiceChat({
              isEnabled: true,
              isConnected: true,
            })
          );
        }

        // Set up voice chat event listeners
        voiceChatService.onParticipantJoined(() => {
          dispatch(
            updateVoiceChat({
              participantCount: voiceChatService.getParticipantCount(),
            })
          );
        });

        voiceChatService.onParticipantLeft(() => {
          dispatch(
            updateVoiceChat({
              participantCount: voiceChatService.getParticipantCount(),
            })
          );
        });
      } catch (error) {
        console.error("Failed to initialize voice chat:", error);
      }
    };

    if (currentRoom) {
      initializeVoiceChat();
    }

    return () => {
      // Cleanup voice chat when leaving room
      voiceChatService.leaveRoom();
    };
  }, [currentRoom, dispatch]);

  const handleCopyRoomCode = () => {
    if (currentRoom?.code) {
      navigator.clipboard.writeText(currentRoom.code);
      // You could show a toast notification here
      alert("Room code copied to clipboard!");
    }
  };

  const handleToggleMic = () => {
    const newMutedState = voiceChatService.toggleMicrophone();
    dispatch(updateVoiceChat({ isMuted: !newMutedState }));
  };

  const handleToggleReady = () => {
    multiplayerService.toggleReady();
    setIsReady(!isReady);
  };

  const handleStartGame = () => {
    // Only host can start the game
    if (currentPlayer?.isHost && canStartGame()) {
      onStartGame();
    }
  };

  const handleLeaveRoom = () => {
    multiplayerService.leaveRoom();
    voiceChatService.leaveRoom();
    dispatch(setCurrentRoom(null));
    onLeaveRoom();
  };

  const canStartGame = () => {
    if (!currentRoom) return false;
    const readyPlayers = currentRoom.players.filter((p) => p.isReady);
    return (
      readyPlayers.length >= 2 &&
      readyPlayers.length === currentRoom.players.length
    );
  };

  if (!currentRoom) {
    return null;
  }

  return (
    <RoomContainer>
      <RoomHeader>
        <RoomInfo>
          <h2>{currentRoom.name}</h2>
          <p>
            Players: {currentRoom.players.length}/{currentRoom.maxPlayers}
          </p>
          <p>Spectators: {currentRoom.spectators.length}</p>
        </RoomInfo>
        <RoomCode onClick={handleCopyRoomCode} title="Click to copy">
          {currentRoom.code}
        </RoomCode>
      </RoomHeader>

      <VoiceChatControls>
        <span>Voice Chat ({voiceChat.participantCount} connected)</span>
        <VoiceButton
          active={!voiceChat.isMuted}
          onClick={handleToggleMic}
          disabled={!voiceChat.isConnected}
        >
          {voiceChat.isMuted ? "🔇 Unmute" : "🎤 Mute"}
        </VoiceButton>
        <span style={{ fontSize: "0.9rem", color: "rgba(255, 255, 255, 0.7)" }}>
          {voiceChat.isConnected ? "Connected" : "Connecting..."}
        </span>
      </VoiceChatControls>

      <ParticipantsSection>
        <h3>Players</h3>
        <ParticipantList>
          {currentRoom.players.map((player) => (
            <ParticipantCard
              key={player.id}
              isHost={player.isHost}
              isCurrentPlayer={player.id === currentPlayer?.id}
            >
              <h4>{player.name}</h4>
              <div className="role">{player.isHost ? "Host" : "Player"}</div>
              <div className="status">
                {player.isReady ? "✅ Ready" : "⏳ Not Ready"}
              </div>
            </ParticipantCard>
          ))}
        </ParticipantList>

        {currentRoom.spectators.length > 0 && (
          <>
            <h3 style={{ marginTop: "2rem" }}>Spectators</h3>
            <ParticipantList>
              {currentRoom.spectators.map((spectator) => (
                <ParticipantCard key={spectator.id}>
                  <h4>{spectator.name}</h4>
                  <div className="role">Spectator</div>
                </ParticipantCard>
              ))}
            </ParticipantList>
          </>
        )}
      </ParticipantsSection>

      <GameControls>
        {!currentPlayer?.isHost && (
          <ControlButton
            variant={isReady ? "secondary" : "primary"}
            onClick={handleToggleReady}
          >
            {isReady ? "Not Ready" : "Ready"}
          </ControlButton>
        )}

        {currentPlayer?.isHost && (
          <ControlButton
            variant="primary"
            onClick={handleStartGame}
            disabled={!canStartGame()}
          >
            Start Game
          </ControlButton>
        )}

        <ControlButton variant="danger" onClick={handleLeaveRoom}>
          Leave Room
        </ControlButton>
      </GameControls>
    </RoomContainer>
  );
};

export default Room;
