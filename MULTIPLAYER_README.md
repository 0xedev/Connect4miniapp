# Connect 4 Multiplayer Setup

This implementation adds multiplayer functionality with voice chat to your Connect 4 game.

## Features

- **Real-time Multiplayer**: Players can create and join game rooms using room codes
- **Voice Chat**: Integrated voice chat using Daily.co WebRTC
- **Spectator Mode**: Users can join rooms as spectators to watch games
- **Room Management**: Host controls, ready status, and automatic room cleanup

## Setup Instructions

### 1. Frontend Dependencies

The required dependencies have been installed:

- `socket.io-client` - For real-time communication
- `@daily-co/daily-js` - For voice chat functionality
- `uuid` - For generating unique IDs

### 2. Backend Server Setup

1. Install server dependencies:

```bash
# In the project root directory
npm install express socket.io cors
# Or copy the server-package.json and rename it
cp server-package.json package-server.json
cd server && npm install
```

2. Start the multiplayer server:

```bash
node server.js
```

The server will run on port 3001.

### 3. Daily.co Voice Chat Setup (Optional)

For production voice chat, you'll need a Daily.co account:

1. Sign up at [Daily.co](https://daily.co)
2. Get your API key
3. Update the `voiceChatService.ts` to use real Daily.co room creation:

```javascript
// In voiceChatService.ts, replace the createRoom method:
async createRoom(): Promise<string> {
  const response = await fetch('https://api.daily.co/v1/rooms', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer YOUR_DAILY_API_KEY`
    },
    body: JSON.stringify({
      properties: {
        start_audio_off: true,
        start_video_off: true,
      }
    })
  });
  const room = await response.json();
  return room.url;
}
```

### 4. Usage

1. Start the backend server: `node server.js`
2. Start the React app: `npm start`
3. Navigate to the main menu and click "Multiplayer Rooms"
4. Create a room or join an existing room with a room code
5. Players can use voice chat and play in real-time

## How It Works

### Room Creation Flow

1. User creates a room with a name
2. Server generates a unique room code (e.g., ABC123)
3. Voice chat room is created (optional)
4. Room appears in the lobby with the generated code

### Joining Flow

1. User enters room code and their name
2. Chooses to join as player or spectator
3. Joins the voice chat automatically
4. Can see other participants and chat/play

### Game Flow

1. Host starts the game when all players are ready
2. Players take turns making moves
3. Voice chat continues throughout the game
4. Spectators can watch and participate in voice chat

## File Structure

```
src/
├── components/multiplayer/
│   ├── Lobby.tsx          # Room creation and joining UI
│   └── Room.tsx           # Room management and participants
├── pages/
│   └── Multiplayer.tsx    # Main multiplayer page
├── services/
│   ├── multiplayerService.ts  # Socket.IO client service
│   └── voiceChatService.ts    # Daily.co voice chat service
├── store/
│   └── multiplayerSlice.ts    # Redux state management
└── types/
    └── multiplayer.ts         # TypeScript interfaces
```

## Next Steps

1. **ERC-20 Betting**: Add wallet integration (MetaMask) and smart contracts
2. **Tournament Mode**: Implement bracket-style tournaments
3. **Enhanced Voice Features**: Add push-to-talk, voice indicators
4. **Persistent Rooms**: Use a database instead of in-memory storage
5. **Room Discovery**: Add public room browsing
6. **Mobile Optimization**: Improve mobile voice chat experience

## Troubleshooting

- **Connection Issues**: Make sure the server is running on port 3001
- **Voice Chat Not Working**: Check browser permissions for microphone access
- **Room Not Found**: Verify the room code is correct and the server is running
