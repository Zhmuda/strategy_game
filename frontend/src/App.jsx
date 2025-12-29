import React, { useState, useEffect } from 'react'
import Lobby from './components/Lobby'
import GameRoom from './components/GameRoom'
import './App.css'
import { API_URL, WS_URL } from './config'

function App() {
  const [gameState, setGameState] = useState('lobby') // 'lobby', 'room', 'game'
  const [roomCode, setRoomCode] = useState(null)
  const [playerId, setPlayerId] = useState(null)
  const [playerName, setPlayerName] = useState('')
  const [error, setError] = useState(null)
  const [connectionStatus, setConnectionStatus] = useState({
    api: 'checking',
    websocket: 'not_tested',
    backendUrl: API_URL
  })

  useEffect(() => {
    // Проверка подключения к бэкенду
    console.log('App mounted, API_URL:', API_URL)
    
    // Проверка API
    fetch(`${API_URL}/api/test`)
      .then(res => res.json())
      .then(data => {
        console.log('Backend connection OK:', data)
        setConnectionStatus(prev => ({ ...prev, api: 'connected', backendData: data }))
        setError(null)
      })
      .catch(err => {
        console.error('Backend connection failed:', err)
        setConnectionStatus(prev => ({ ...prev, api: 'failed', error: err.message }))
        setError(`Не удалось подключиться к серверу: ${API_URL}. Проверьте настройки.`)
      })

    // Проверка WebSocket
    testWebSocket()
  }, [])

  const testWebSocket = () => {
    console.log('Testing WebSocket connection to:', WS_URL)
    
    try {
      const testWs = new WebSocket(`${WS_URL}/ws/test/test`)
      
      testWs.onopen = () => {
        console.log('✅ WebSocket connection successful!')
        setConnectionStatus(prev => ({ ...prev, websocket: 'connected' }))
        testWs.close()
      }
      
      testWs.onerror = (error) => {
        console.error('❌ WebSocket connection failed:', error)
        setConnectionStatus(prev => ({ ...prev, websocket: 'failed' }))
      }
      
      testWs.onclose = (event) => {
        if (event.code !== 1000 && event.code !== 1001) {
          console.warn('⚠️ WebSocket closed with code:', event.code, event.reason)
          setConnectionStatus(prev => {
            if (prev.websocket === 'not_tested' || prev.websocket === 'checking') {
              return { ...prev, websocket: 'failed', wsError: `Code: ${event.code} - ${event.reason || 'Connection closed'}` }
            }
            return prev
          })
        } else if (event.code === 1000) {
          // Нормальное закрытие после теста
          console.log('✅ WebSocket test completed successfully')
        }
      }
      
      // Таймаут для теста
      setTimeout(() => {
        if (testWs.readyState === WebSocket.CONNECTING || testWs.readyState === WebSocket.OPEN) {
          if (testWs.readyState === WebSocket.CONNECTING) {
            testWs.close()
            setConnectionStatus(prev => ({ 
              ...prev, 
              websocket: 'timeout',
              wsError: 'Connection timeout - WebSocket may not be supported on this server'
            }))
          }
        }
      }, 5000)
    } catch (err) {
      console.error('WebSocket test error:', err)
      setConnectionStatus(prev => ({ ...prev, websocket: 'error', wsError: err.message }))
    }
  }

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
      {/* Панель диагностики подключения */}
      <div style={{
        position: 'fixed',
        top: '10px',
        right: '10px',
        background: 'rgba(0,0,0,0.8)',
        color: 'white',
        padding: '10px 15px',
        borderRadius: '8px',
        fontSize: '12px',
        zIndex: 10000,
        minWidth: '250px',
        fontFamily: 'monospace'
      }}>
        <div style={{ marginBottom: '8px', fontWeight: 'bold' }}>🔌 Статус подключения</div>
        <div style={{ marginBottom: '5px' }}>
          API: <span style={{ color: connectionStatus.api === 'connected' ? '#4caf50' : connectionStatus.api === 'failed' ? '#f44336' : '#ff9800' }}>
            {connectionStatus.api === 'connected' ? '✅ Подключено' : 
             connectionStatus.api === 'failed' ? '❌ Ошибка' : '⏳ Проверка...'}
          </span>
        </div>
        <div style={{ marginBottom: '5px' }}>
          WebSocket: <span style={{ color: connectionStatus.websocket === 'connected' ? '#4caf50' : 
                                      connectionStatus.websocket === 'failed' || connectionStatus.websocket === 'timeout' ? '#f44336' : '#ff9800' }}>
            {connectionStatus.websocket === 'connected' ? '✅ Подключено' : 
             connectionStatus.websocket === 'failed' ? '❌ Ошибка' :
             connectionStatus.websocket === 'timeout' ? '⏱️ Таймаут' :
             connectionStatus.websocket === 'error' ? '❌ Ошибка' : '⏳ Проверка...'}
          </span>
        </div>
        {connectionStatus.wsError && (
          <div style={{ fontSize: '10px', color: '#ff9800', marginTop: '5px' }}>
            {connectionStatus.wsError}
          </div>
        )}
        <div style={{ fontSize: '10px', color: '#999', marginTop: '8px', borderTop: '1px solid #444', paddingTop: '5px' }}>
          Backend: {connectionStatus.backendUrl}
        </div>
        {connectionStatus.backendData && (
          <div style={{ fontSize: '10px', color: '#4caf50', marginTop: '5px' }}>
            Комнат: {connectionStatus.backendData.test_data?.rooms_count || 0}
          </div>
        )}
        <button 
          onClick={() => {
            setConnectionStatus({ api: 'checking', websocket: 'not_tested', backendUrl: API_URL })
            window.location.reload()
          }}
          style={{
            marginTop: '8px',
            padding: '4px 8px',
            fontSize: '10px',
            background: '#667eea',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          🔄 Обновить
        </button>
      </div>

      {error && (
        <div style={{ 
          padding: '20px', 
          textAlign: 'center', 
          background: '#ffebee', 
          color: '#c62828',
          margin: '20px',
          borderRadius: '8px'
        }}>
          <h2>⚠️ Ошибка подключения</h2>
          <p>{error}</p>
          <div style={{ marginTop: '15px', fontSize: '14px', background: 'white', padding: '10px', borderRadius: '4px' }}>
            <strong>Диагностика:</strong><br/>
            API URL: {API_URL}<br/>
            Статус API: {connectionStatus.api}<br/>
            Статус WebSocket: {connectionStatus.websocket}
          </div>
          <button 
            onClick={() => window.location.reload()}
            style={{
              marginTop: '15px',
              padding: '10px 20px',
              background: '#667eea',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            Перезагрузить
          </button>
        </div>
      )}

      {!error && (
        <>
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
        </>
      )}
    </div>
  )
}

export default App


