# 🧪 Local Multiplayer Testing Guide

## Current Status ✅
- ✅ Backend server running on http://localhost:3001
- ✅ Frontend running on http://localhost:3000
- ✅ TypeScript errors resolved
- ✅ Room component fixed

## Testing Steps

### 1. **Basic Connection Test**
1. Open http://localhost:3000
2. Click "Multiplayer Rooms"
3. Check browser console for connection logs

### 2. **Room Creation Test**
1. Enter your name (e.g., "Player1")
2. Click "Create New Room"
3. Enter room name (e.g., "Test Room")
4. Click "Create Room"
5. You should see:
   - Room code displayed (e.g., "ABC123")
   - Your name in the players list
   - "Host" label
   - Ready button

### 3. **Room Joining Test**
1. **Open a new browser tab/window** (or incognito)
2. Go to http://localhost:3000
3. Click "Multiplayer Rooms"
4. Enter different name (e.g., "Player2")
5. Click "Join Existing Room"
6. Enter the room code from step 2
7. Click "Join as Player"

### 4. **Real-time Sync Test**
**This is what we're testing to fix the sync issues:**

#### Expected Behavior:
- When Player2 joins, Player1 should immediately see Player2 in their room
- When Player2 clicks "Ready", Player1 should see Player2's status change to "✅ Ready"
- When both players are ready, Host should see "🚀 Start Game" button enabled

#### Check Browser Console:
Both browser windows should show:
```
Connected to multiplayer server
Setting up room event listeners for room: [room-id]
Room update received: [room-data]
Player joined: [player-data]
```

### 5. **Debugging Steps**

If sync isn't working:

1. **Check Backend Logs** (Terminal 1):
   - Should show "User connected: [socket-id]"
   - Should show "Room created: [code] by [name]"
   - Should show "[name] joined room [code]"

2. **Check Frontend Console** (Both tabs):
   - Should show "Connected to multiplayer server"
   - Should show event logs when actions happen

3. **Check Network Tab**:
   - Look for WebSocket connection to `ws://localhost:3001`
   - Should show Socket.IO events being sent/received

### 6. **Common Issues & Solutions**

**Issue**: "Room not found" error
- **Solution**: Make sure backend is running and room code is correct

**Issue**: Players not seeing each other
- **Solution**: Check browser console for Socket.IO connection errors

**Issue**: Ready status not syncing
- **Solution**: Check if `toggle-ready` events are being sent in network tab

**Issue**: Connection refused
- **Solution**: Restart backend server

### 7. **Test Scenarios**

#### Scenario A: Happy Path
1. Player1 creates room
2. Player2 joins
3. Both players see each other
4. Player2 clicks ready
5. Player1 sees Player2 as ready
6. Host can start game

#### Scenario B: Leave/Rejoin
1. Player2 leaves room
2. Player1 should see Player2 disappear
3. Player2 rejoins with same code
4. Both should see each other again

#### Scenario C: Host Transfer
1. Host (Player1) leaves
2. Player2 should become new host
3. Player2 should see "Start Game" button

## Current Architecture

```
Frontend (React)          Backend (Node.js + Socket.IO)
├── Lobby Component   ──→  ├── Room Management
├── Room Component    ──→  ├── Player State Sync
└── Services          ──→  └── Real-time Events
    ├── multiplayerService.ts
    └── Redux Store
```

## Next Steps After Testing

1. **If sync works**: Deploy to production (Railway + Vercel)
2. **If sync fails**: Debug event listeners and Socket.IO connection
3. **Add features**: Voice chat, game moves, spectator mode

---

## Quick Commands

```bash
# Restart backend
cd backend && npm start

# Restart frontend  
npm start

# Check backend health
curl http://localhost:3001/health

# View backend stats
curl http://localhost:3001/stats
```

**Ready to test! 🚀**

Open two browser windows and try creating/joining a room!
