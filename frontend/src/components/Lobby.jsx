import React, { useState } from 'react'
import axios from 'axios'
import './Lobby.css'
import { API_URL } from '../config'

function Lobby({ onCreateRoom, onJoinRoom }) {
  const [playerName, setPlayerName] = useState('')
  const [joinCode, setJoinCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleCreateRoom = async (e) => {
    e.preventDefault()
    if (!playerName.trim()) {
      setError('Введите имя игрока')
      return
    }

    setLoading(true)
    setError('')

    try {
      console.log('Creating room with API_URL:', API_URL)
      console.log('Player name:', playerName)
      
      const url = `${API_URL}/api/create-room?player_name=${encodeURIComponent(playerName)}`
      console.log('Request URL:', url)
      console.log('API_URL from config:', API_URL)
      console.log('Environment VITE_BACKEND_URL:', import.meta.env.VITE_BACKEND_URL)
      
      const response = await axios.post(url, null, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        timeout: 10000, // 10 секунд таймаут
        withCredentials: false, // Отключаем credentials для избежания CORS проблем
        validateStatus: (status) => status < 500, // Принимаем все статусы кроме 5xx
      })
      
      console.log('Room created successfully:', response.data)
      onCreateRoom(response.data.room_code, response.data.player_id, playerName)
    } catch (err) {
      console.error('Error creating room:', err)
      console.error('Error details:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
        url: err.config?.url,
      })
      
      let errorMessage = 'Ошибка при создании комнаты: '
      if (err.response) {
        // Сервер ответил, но с ошибкой
        errorMessage += err.response.data?.detail || err.response.data?.message || `HTTP ${err.response.status}`
      } else if (err.request) {
        // Запрос отправлен, но ответа нет
        errorMessage += 'Нет ответа от сервера. Проверьте подключение к интернету и URL бэкенда.'
      } else {
        // Ошибка при настройке запроса
        errorMessage += err.message || 'Неизвестная ошибка'
      }
      
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleJoinRoom = async (e) => {
    e.preventDefault()
    if (!playerName.trim() || !joinCode.trim()) {
      setError('Введите имя и код комнаты')
      return
    }

    setLoading(true)
    setError('')

    try {
      console.log('Joining room with API_URL:', API_URL)
      const url = `${API_URL}/api/join-room?room_code=${encodeURIComponent(joinCode.toUpperCase())}&player_name=${encodeURIComponent(playerName)}`
      console.log('Request URL:', url)
      
      const response = await axios.post(url, null, {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 10000, // 10 секунд таймаут
      })
      
      console.log('Joined room successfully:', response.data)
      // Используем код комнаты из запроса или из ответа
      const roomCode = response.data.room?.code || joinCode.toUpperCase()
      onJoinRoom(roomCode, response.data.player_id, playerName)
    } catch (err) {
      console.error('Error joining room:', err)
      console.error('Error details:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
        url: err.config?.url,
      })
      
      let errorMessage = 'Ошибка при присоединении: '
      if (err.response) {
        errorMessage += err.response.data?.detail || err.response.data?.message || `HTTP ${err.response.status}`
      } else if (err.request) {
        errorMessage += 'Нет ответа от сервера. Проверьте подключение к интернету и URL бэкенда.'
      } else {
        errorMessage += err.message || 'Неизвестная ошибка'
      }
      
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="lobby">
      <div className="lobby-container">
        <h1>⚔️ Военно-Экономическая Стратегия</h1>
        
        <div className="lobby-forms">
          <div className="lobby-section">
            <h2>Создать комнату</h2>
            <form onSubmit={handleCreateRoom}>
              <input
                type="text"
                placeholder="Ваше имя"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                disabled={loading}
              />
              <button type="submit" disabled={loading}>
                {loading ? 'Создание...' : 'Создать комнату'}
              </button>
            </form>
          </div>

          <div className="divider">или</div>

          <div className="lobby-section">
            <h2>Присоединиться к комнате</h2>
            <form onSubmit={handleJoinRoom}>
              <input
                type="text"
                placeholder="Ваше имя"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                disabled={loading}
              />
              <input
                type="text"
                placeholder="Код комнаты"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                disabled={loading}
                maxLength={8}
              />
              <button type="submit" disabled={loading}>
                {loading ? 'Присоединение...' : 'Присоединиться'}
              </button>
            </form>
          </div>
        </div>

        {error && <div className="error-message">{error}</div>}
      </div>
    </div>
  )
}

export default Lobby

