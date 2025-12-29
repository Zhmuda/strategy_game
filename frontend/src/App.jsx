import React, { useState, useEffect } from 'react'
import Lobby from './components/Lobby'
import GameRoom from './components/GameRoom'
import './App.css'

console.log('App.jsx loading...')

// Импорт конфигурации
import { API_URL, WS_URL } from './config'
console.log('Config imported:', { API_URL, WS_URL })

function App() {
  console.log('App component rendering...')
  console.log('API_URL:', API_URL, 'WS_URL:', WS_URL)
  
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
    // Проверка подключения к бэкенду (не блокируем рендеринг)
    console.log('App mounted, API_URL:', API_URL)
    
    // Устанавливаем начальный статус без ошибки, чтобы приложение загрузилось
    setConnectionStatus(prev => ({ ...prev, api: 'checking', backendUrl: API_URL }))
    
    // Проверка API с таймаутом
    const apiTimeout = setTimeout(() => {
      setConnectionStatus(prev => {
        if (prev.api === 'checking') {
          return { ...prev, api: 'timeout' }
        }
        return prev
      })
    }, 10000) // 10 секунд таймаут
    
    // Используем AbortController для совместимости
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 8000)
    
    fetch(`${API_URL}/api/test`, { 
      signal: controller.signal
    })
      .then(res => {
        clearTimeout(timeoutId)
        clearTimeout(apiTimeout)
        return res.json()
      })
      .then(data => {
        console.log('Backend connection OK:', data)
        setConnectionStatus(prev => ({ ...prev, api: 'connected', backendData: data }))
        setError(null)
      })
      .catch(err => {
        clearTimeout(timeoutId)
        clearTimeout(apiTimeout)
        console.error('Backend connection failed:', err)
        if (err.name === 'AbortError') {
          setConnectionStatus(prev => ({ ...prev, api: 'timeout' }))
        } else {
          setConnectionStatus(prev => ({ ...prev, api: 'failed', error: err.message }))
        }
        // Не устанавливаем error, чтобы приложение все равно работало
      })

    // Проверка WebSocket (не блокируем рендеринг)
    setTimeout(() => {
      testWebSocket()
    }, 1000) // Запускаем через секунду после загрузки
    
    return () => {
      clearTimeout(timeoutId)
      clearTimeout(apiTimeout)
      controller.abort()
    }
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
      {/* Панель диагностики подключения - показываем только если не подключено */}
      {(connectionStatus.api !== 'connected' || connectionStatus.websocket !== 'connected') && (
      <div style={{
        position: 'fixed',
        top: '10px',
        right: '10px',
        background: 'rgba(0,0,0,0.85)',
        color: 'white',
        padding: '10px 15px',
        borderRadius: '8px',
        fontSize: '12px',
        zIndex: 10000,
        minWidth: '250px',
        fontFamily: 'monospace',
        boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
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
      )}

      {/* Всегда показываем интерфейс, даже если есть ошибки подключения */}
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
      
      {/* Показываем предупреждение, если есть проблемы с подключением, но не блокируем интерфейс */}
      {error && (
        <div style={{
          position: 'fixed',
          bottom: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: '#ff9800',
          color: 'white',
          padding: '15px 25px',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          zIndex: 10001,
          maxWidth: '90%',
          textAlign: 'center'
        }}>
          <strong>⚠️ Проблема с подключением к серверу</strong>
          <p style={{ margin: '5px 0 0 0', fontSize: '14px' }}>{error}</p>
          <button 
            onClick={() => {
              setError(null)
            }}
            style={{
              marginTop: '10px',
              padding: '5px 15px',
              background: 'white',
              color: '#ff9800',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Закрыть
          </button>
        </div>
      )}
    </div>
  )
}

export default App


