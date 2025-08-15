import React, { useState } from "react";
import styled from "styled-components";
import { useAppSelector } from "../store/hooks";
import { selectCurrentRoom } from "../store/multiplayerSlice";
import Lobby from "../components/multiplayer/Lobby";
import Room from "../components/multiplayer/Room";
import { useNavigate } from "react-router-dom";

const MultiplayerContainer = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  flex-direction: column;
`;

const BackButton = styled.button`
  position: absolute;
  top: 1rem;
  left: 1rem;
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.2);
  color: white;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: rgba(255, 255, 255, 0.3);
    transform: translateY(-2px);
  }
`;

export const Multiplayer: React.FC = () => {
  const navigate = useNavigate();
  const currentRoom = useAppSelector(selectCurrentRoom);
  const [showRoom, setShowRoom] = useState(false);

  const handleRoomJoined = () => {
    setShowRoom(true);
  };

  const handleStartGame = () => {
    // Navigate to the game page with multiplayer mode
    navigate("/game?mode=multiplayer");
  };

  const handleLeaveRoom = () => {
    setShowRoom(false);
  };

  const handleBackToMenu = () => {
    navigate("/");
  };

  return (
    <MultiplayerContainer>
      <BackButton onClick={handleBackToMenu}>← Back to Menu</BackButton>

      {!showRoom && !currentRoom && <Lobby onRoomJoined={handleRoomJoined} />}

      {(showRoom || currentRoom) && (
        <Room onStartGame={handleStartGame} onLeaveRoom={handleLeaveRoom} />
      )}
    </MultiplayerContainer>
  );
};

export default Multiplayer;
