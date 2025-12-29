import React, { useState } from 'react'
import Lobby from './components/Lobby'
import GameRoom from './components/GameRoom'
import './App.css'

function App() {
  const [gameState, setGameState] = useState('lobby') // 'lobby', 'room', 'game'
  const [roomCode, setRoomCode] = useState(null)
  const [playerId, setPlayerId] = useState(null)
  const [playerName, setPlayerName] = useState('')

  const handleCreateRoom = (code, id, name) => {
    setRoomCode(code)
    setPlayerId(id)
    setPlayerName(name)
    setGameState('room')
  }

  const handleJoinRoom = (code, id, name) => {
    setRoomCode(code)
    setPlayerId(id)
    setPlayerName(name)
    setGameState('room')
  }

  const handleGameStart = () => {
    setGameState('game')
  }

  const handleBackToLobby = () => {
    setGameState('lobby')
    setRoomCode(null)
    setPlayerId(null)
  }

  return (
    <div className="App">
      {gameState === 'lobby' && (
        <Lobby
          onCreateRoom={handleCreateRoom}
          onJoinRoom={handleJoinRoom}
        />
      )}
      {(gameState === 'room' || gameState === 'game') && (
        <GameRoom
          roomCode={roomCode}
          playerId={playerId}
          playerName={playerName}
          onGameStart={handleGameStart}
          onBackToLobby={handleBackToLobby}
        />
      )}
    </div>
  )
}

export default App


