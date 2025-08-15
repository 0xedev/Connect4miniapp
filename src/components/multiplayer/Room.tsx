import React, { useEffect } from 'react';
import styled from 'styled-components';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { 
  selectCurrentRoom, 
  selectCurrentPlayer, 
  setCurrentRoom
} from '../../store/multiplayerSlice';
import { multiplayerService } from '../../services/multiplayerService';
import { Player } from '../../types/multiplayer';

const RoomContainer = styled.div`
  display: flex;
  flex-direction: column;
  padding: 2rem;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 15px;
  margin: 2rem;
  color: white;
  max-width: 800px;
  width: 100%;
  margin: 2rem auto;
`;

const RoomHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
`;

const RoomInfo = styled.div`
  h2 {
    margin: 0;
    color: #4ecdc4;
    font-size: 2rem;
  }
  p {
    margin: 0.5rem 0;
    color: rgba(255, 255, 255, 0.8);
    font-size: 1.1rem;
  }
`;

const RoomCode = styled.div`
  background: linear-gradient(45deg, #ff6b6b, #4ecdc4);
  padding: 1rem 1.5rem;
  border-radius: 10px;
  font-weight: bold;
  font-size: 1.5rem;
  cursor: pointer;
  transition: transform 0.2s;
  
  &:hover {
    transform: scale(1.05);
  }
`;

const ParticipantsSection = styled.div`
  margin: 2rem 0;
`;

const ParticipantList = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1rem;
  margin-top: 1rem;
`;

const ParticipantCard = styled.div<{ isHost?: boolean; isCurrentPlayer?: boolean }>`
  background: ${props => 
    props.isCurrentPlayer ? 'rgba(76, 205, 196, 0.3)' : 
    props.isHost ? 'rgba(255, 107, 107, 0.3)' : 
    'rgba(255, 255, 255, 0.1)'
  };
  padding: 1.5rem;
  border-radius: 10px;
  border: ${props => 
    props.isCurrentPlayer ? '2px solid #4ecdc4' : 
    props.isHost ? '2px solid #ff6b6b' : 
    '1px solid rgba(255, 255, 255, 0.2)'
  };
  
  h4 {
    margin: 0 0 0.5rem 0;
    color: white;
    font-size: 1.2rem;
  }
  
  .status {
    font-size: 1rem;
    color: rgba(255, 255, 255, 0.8);
    margin: 0.5rem 0;
  }
  
  .role {
    font-size: 0.9rem;
    color: ${props => props.isHost ? '#ff6b6b' : '#4ecdc4'};
    font-weight: bold;
  }
`;

const GameControls = styled.div`
  display: flex;
  gap: 1rem;
  margin-top: 2rem;
  justify-content: center;
`;

const ControlButton = styled.button<{ variant?: 'primary' | 'secondary' | 'danger' }>`
  padding: 1rem 2rem;
  border: none;
  border-radius: 10px;
  color: white;
  font-weight: bold;
  font-size: 1.1rem;
  cursor: pointer;
  transition: transform 0.2s;
  
  background: ${props => {
    switch (props.variant) {
      case 'primary': return 'linear-gradient(45deg, #4ecdc4, #44a08d)';
      case 'danger': return 'linear-gradient(45deg, #ff6b6b, #ee5a52)';
      default: return 'rgba(255, 255, 255, 0.2)';
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

  useEffect(() => {
    if (!currentRoom) return;

    console.log('Setting up room event listeners for room:', currentRoom.id);

    // Set up event listeners for real-time updates
    const handleRoomUpdate = (updatedRoom: any) => {
      console.log('Room update received:', updatedRoom);
      dispatch(setCurrentRoom(updatedRoom));
    };

    const handlePlayerJoined = (player: any) => {
      console.log('Player joined:', player);
    };

    const handlePlayerLeft = (playerId: string) => {
      console.log('Player left:', playerId);
    };

    // Set up event listeners
    multiplayerService.onRoomUpdate(handleRoomUpdate);
    multiplayerService.onPlayerJoined(handlePlayerJoined);
    multiplayerService.onPlayerLeft(handlePlayerLeft);

    return () => {
      // Cleanup event listeners
      multiplayerService.removeAllListeners();
    };
  }, [currentRoom, dispatch]);

  const handleCopyRoomCode = () => {
    if (currentRoom?.code) {
      navigator.clipboard.writeText(currentRoom.code);
      alert('Room code copied to clipboard!');
    }
  };

  const isPlayerReady = (playerId: string): boolean => {
    if (!currentRoom) return false;
    const player = currentRoom.players.find((p: Player) => p.id === playerId);
    return player?.isReady || false;
  };

  const handleToggleReady = () => {
    console.log('Toggling ready status for player:', currentPlayer?.id);
    multiplayerService.toggleReady();
  };

  const handleStartGame = () => {
    if (currentPlayer?.isHost && canStartGame()) {
      onStartGame();
    }
  };

  const handleLeaveRoom = () => {
    multiplayerService.leaveRoom();
    dispatch(setCurrentRoom(null));
    onLeaveRoom();
  };

  const canStartGame = () => {
    if (!currentRoom) return false;
    const readyPlayers = currentRoom.players.filter((p: Player) => p.isReady);
    return readyPlayers.length >= 2 && readyPlayers.length === currentRoom.players.length;
  };

  if (!currentRoom) {
    return (
      <RoomContainer>
        <h2>No room data available</h2>
        <ControlButton variant="danger" onClick={onLeaveRoom}>
          Back to Lobby
        </ControlButton>
      </RoomContainer>
    );
  }

  const currentPlayerReady = currentPlayer ? isPlayerReady(currentPlayer.id) : false;

  return (
    <RoomContainer>
      <RoomHeader>
        <RoomInfo>
          <h2>{currentRoom.name}</h2>
          <p>Players: {currentRoom.players.length}/{currentRoom.maxPlayers}</p>
          <p>Spectators: {currentRoom.spectators.length}</p>
        </RoomInfo>
        <RoomCode onClick={handleCopyRoomCode} title="Click to copy">
          {currentRoom.code}
        </RoomCode>
      </RoomHeader>

      <ParticipantsSection>
        <h3>Players</h3>
        <ParticipantList>
          {currentRoom.players.map((player: Player) => (
            <ParticipantCard 
              key={player.id}
              isHost={player.isHost}
              isCurrentPlayer={player.id === currentPlayer?.id}
            >
              <h4>{player.name}</h4>
              <div className="role">
                {player.isHost ? '👑 Host' : '👤 Player'}
              </div>
              <div className="status">
                {player.isReady ? '✅ Ready' : '⏳ Not Ready'}
              </div>
            </ParticipantCard>
          ))}
        </ParticipantList>

        {currentRoom.spectators && currentRoom.spectators.length > 0 && (
          <>
            <h3 style={{ marginTop: '2rem' }}>Spectators</h3>
            <ParticipantList>
              {currentRoom.spectators.map((spectator: any) => (
                <ParticipantCard key={spectator.id}>
                  <h4>{spectator.name}</h4>
                  <div className="role">👁️ Spectator</div>
                </ParticipantCard>
              ))}
            </ParticipantList>
          </>
        )}
      </ParticipantsSection>

      <GameControls>
        {!currentPlayer?.isHost && (
          <ControlButton 
            variant={currentPlayerReady ? 'secondary' : 'primary'}
            onClick={handleToggleReady}
          >
            {currentPlayerReady ? '❌ Not Ready' : '✅ Ready'}
          </ControlButton>
        )}
        
        {currentPlayer?.isHost && (
          <ControlButton 
            variant="primary"
            onClick={handleStartGame}
            disabled={!canStartGame()}
          >
            🚀 Start Game
          </ControlButton>
        )}
        
        <ControlButton 
          variant="danger"
          onClick={handleLeaveRoom}
        >
          🚪 Leave Room
        </ControlButton>
      </GameControls>
    </RoomContainer>
  );
};

export default Room;
