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
      const response = await axios.post(`${API_URL}/api/create-room`, null, {
        params: { player_name: playerName }
      })
      onCreateRoom(response.data.room_code, response.data.player_id, playerName)
    } catch (err) {
      setError('Ошибка при создании комнаты: ' + (err.response?.data?.detail || err.message))
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
      const response = await axios.post(`${API_URL}/api/join-room`, null, {
        params: {
          room_code: joinCode.toUpperCase(),
          player_name: playerName
        }
      })
      // Используем код комнаты из запроса или из ответа
      const roomCode = response.data.room?.code || joinCode.toUpperCase()
      onJoinRoom(roomCode, response.data.player_id, playerName)
    } catch (err) {
      setError('Ошибка при присоединении: ' + (err.response?.data?.detail || err.message))
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

