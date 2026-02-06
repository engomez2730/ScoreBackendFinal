# Real-Time Events Documentation

All stat and game updates now broadcast real-time events via Socket.IO.

## Socket.IO Connection

```javascript
import io from 'socket.io-client';

const socket = io('http://localhost:4000', {
  auth: {
    token: 'YOUR_JWT_TOKEN_HERE'
  }
});

// Join a specific game room to receive updates
socket.emit('joinGame', gameId);
```

## Real-Time Events

### Stats Events

Listen for `statsUpdated` event when any player stat changes:

```javascript
socket.on('statsUpdated', (data) => {
  console.log('Stats updated:', data);
  // data structure:
  // {
  //   gameId: 3,
  //   playerId: 2,
  //   stats: { ...playerStats },
  //   statType: 'offensiveRebounds' | 'rebounds' | 'assists' | 'steals' | 'blocks' | 'shots' | 'turnovers' | 'fouls' | 'multiple' | 'minutes' | 'plusMinus',
  //   timestamp: '2026-02-06T...'
  // }
  
  // Update your UI with the new stats
  updatePlayerStatsInUI(data.playerId, data.stats);
});
```

### Score Events

```javascript
socket.on('scoreUpdated', (data) => {
  console.log('Score updated:', data);
  // { gameId, homeScore, awayScore, timestamp }
  updateScoreboardUI(data.homeScore, data.awayScore);
});
```

### Game State Events

```javascript
// Full game update
socket.on('gameUpdated', (data) => {
  console.log('Game fully updated:', data);
  // { gameId, homeScore, awayScore, currentQuarter, quarterTime, gameTime, playerStats, timestamp }
});

// Quarter changes
socket.on('quarterChanged', (data) => {
  console.log('Quarter changed:', data);
  // { gameId, currentQuarter, isOvertime, timestamp }
});
```

### Time Events

```javascript
socket.on('timeUpdated', (data) => {
  // { gameId, gameTime, timestamp }
  updateGameClock(data.gameTime);
});

socket.on('clockReset', (data) => {
  // { gameId, gameTime: 0, timestamp }
  resetGameClock();
});

socket.on('quarterTimeUpdated', (data) => {
  // { gameId, quarterTime, timestamp }
  updateQuarterClock(data.quarterTime);
});
```

### Substitution Events

```javascript
socket.on('substitutionMade', (data) => {
  console.log('Substitution:', data);
  // { gameId, playerInId, playerOutId, gameTime, timestamp }
  updateLineup(data.playerInId, data.playerOutId);
});
```

### Player Lineup Events

```javascript
socket.on('startersSet', (data) => {
  // { gameId, homeStarters: [ids], awayStarters: [ids], timestamp }
  setStartingLineup(data);
});

socket.on('activePlayersUpdated', (data) => {
  // { gameId, team: 'home' | 'away', playerIds: [ids], timestamp }
  updateActivePlayers(data.team, data.playerIds);
});
```

### User Connection Events

```javascript
socket.on('userJoined', (data) => {
  // { user: { id, nombre, email, rol }, socketId }
  console.log(`${data.user.nombre} joined the game`);
});
```

## Complete Example for Game Stats Page

```javascript
import io from 'socket.io-client';
import { useEffect, useState } from 'react';

function GameStatsPage({ gameId, authToken }) {
  const [gameStats, setGameStats] = useState(null);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    // Connect to Socket.IO
    const newSocket = io('http://localhost:4000', {
      auth: { token: authToken }
    });

    // Join game room
    newSocket.emit('joinGame', gameId);

    // Listen for stats updates
    newSocket.on('statsUpdated', (data) => {
      if (data.gameId === gameId) {
        setGameStats(prev => ({
          ...prev,
          players: prev.players.map(p => 
            p.playerId === data.playerId 
              ? { ...p, ...data.stats }
              : p
          )
        }));
      }
    });

    // Listen for score updates
    newSocket.on('scoreUpdated', (data) => {
      if (data.gameId === gameId) {
        setGameStats(prev => ({
          ...prev,
          homeScore: data.homeScore,
          awayScore: data.awayScore
        }));
      }
    });

    // Listen for substitutions
    newSocket.on('substitutionMade', (data) => {
      if (data.gameId === gameId) {
        console.log('Substitution made:', data);
        // Refresh active players or update UI
      }
    });

    setSocket(newSocket);

    // Cleanup on unmount
    return () => {
      newSocket.disconnect();
    };
  }, [gameId, authToken]);

  return (
    <div>
      {/* Your stats UI that updates automatically */}
    </div>
  );
}
```

## Event Summary

| Endpoint | Emits Event | Event Name | Data |
|----------|-------------|------------|------|
| `POST /record-offensive-rebound` | ✅ | `statsUpdated` | stats, playerId, statType: 'offensiveRebounds' |
| `POST /record-rebound` | ✅ | `statsUpdated` | stats, playerId, statType: 'rebounds' |
| `POST /record-assist` | ✅ | `statsUpdated` | stats, playerId, statType: 'assists' |
| `POST /record-steal` | ✅ | `statsUpdated` | stats, playerId, statType: 'steals' |
| `POST /record-block` | ✅ | `statsUpdated` | stats, playerId, statType: 'blocks' |
| `POST /record-shot` | ✅ | `statsUpdated` | stats, playerId, statType: 'shots', shotType, made |
| `POST /record-turnover` | ✅ | `statsUpdated` | stats, playerId, statType: 'turnovers' |
| `POST /record-personal-foul` | ✅ | `statsUpdated` | stats, playerId, statType: 'fouls' |
| `PUT /score` | ✅ | `scoreUpdated` | gameId, homeScore, awayScore |
| `PUT /player-stats` | ✅ | `statsUpdated` | stats, playerId, statType: 'multiple' |
| `PUT /player-minutes` | ✅ | `statsUpdated` | stats, statType: 'minutes' |
| `PUT /player-plusminus` | ✅ | `statsUpdated` | stats, statType: 'plusMinus' |
| `PUT /full-update` | ✅ | `gameUpdated` | Full game state |
| `POST /substitution` | ✅ | `substitutionMade` | playerInId, playerOutId, gameTime |
| `POST /set-starters` | ✅ | `startersSet` | homeStarters, awayStarters |
| `PUT /active-players/home` | ✅ | `activePlayersUpdated` | team: 'home', playerIds |
| `PUT /active-players/away` | ✅ | `activePlayersUpdated` | team: 'away', playerIds |
| `POST /next-quarter` | ✅ | `quarterChanged` | currentQuarter, isOvertime |
| `PUT /time` | ✅ | `timeUpdated` | gameTime |
| `POST /reset-time` | ✅ | `clockReset` | gameTime: 0 |
| `PUT /quarter-time` | ✅ | `quarterTimeUpdated` | quarterTime |

## Notes

- All events include a `timestamp` field
- All events include the `gameId`
- Clients must join the game room with `socket.emit('joinGame', gameId)` to receive updates
- Authentication is optional but recommended for security
- Events are only sent to clients in the same game room
