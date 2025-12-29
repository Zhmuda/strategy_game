import React, { useState, useEffect } from 'react'
import Lobby from './components/Lobby'
import GameRoom from './components/GameRoom'
import './App.css'
import { API_URL } from './config'

function App() {
  const [gameState, setGameState] = useState('lobby') // 'lobby', 'room', 'game'
  const [roomCode, setRoomCode] = useState(null)
  const [playerId, setPlayerId] = useState(null)
  const [playerName, setPlayerName] = useState('')
  const [error, setError] = useState(null)

  useEffect(() => {
    // Проверка подключения к бэкенду
    console.log('App mounted, API_URL:', API_URL)
    fetch(`${API_URL}/`)
      .then(res => res.json())
      .then(data => {
        console.log('Backend connection OK:', data)
        setError(null)
      })
      .catch(err => {
        console.error('Backend connection failed:', err)
        setError(`Не удалось подключиться к серверу: ${API_URL}. Проверьте настройки.`)
      })
  }, [])

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

  if (error) {
    return (
      <div className="App" style={{ padding: '20px', textAlign: 'center' }}>
        <h1>⚠️ Ошибка подключения</h1>
        <p>{error}</p>
        <p style={{ fontSize: '12px', color: '#666', marginTop: '20px' }}>
          API URL: {API_URL}
        </p>
        <button onClick={() => window.location.reload()}>Перезагрузить</button>
      </div>
    )
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


