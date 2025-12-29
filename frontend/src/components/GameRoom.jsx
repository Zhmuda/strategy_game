import React, { useState, useEffect, useRef } from 'react'
import './GameRoom.css'

const API_URL = 'http://localhost:8000'
const WS_URL = 'ws://localhost:8000'

function GameRoom({ roomCode, playerId, playerName, onGameStart, onBackToLobby }) {
  const [room, setRoom] = useState(null)
  const [players, setPlayers] = useState({})
  const [gameState, setGameState] = useState('waiting')
  const [isReady, setIsReady] = useState(false)
  const [currentTurn, setCurrentTurn] = useState(null)
  const [myPlayer, setMyPlayer] = useState(null)
  const [actionType, setActionType] = useState(null)
  const [selectedBuilding, setSelectedBuilding] = useState(null)
  const [selectedUnit, setSelectedUnit] = useState(null)
  const [unitQuantity, setUnitQuantity] = useState(1)
  const [gameLog, setGameLog] = useState([])
  const [activeTab, setActiveTab] = useState('game') // 'game', 'rules', 'trade'
  const [tradeTarget, setTradeTarget] = useState(null)
  const [tradeOffer, setTradeOffer] = useState({ gold: 0, wood: 0, stone: 0, food: 0 })
  const [tradeRequest, setTradeRequest] = useState({ gold: 0, wood: 0, stone: 0, food: 0 })
  const wsRef = useRef(null)

  useEffect(() => {
    // Подключение к WebSocket
    const ws = new WebSocket(`${WS_URL}/ws/${roomCode}/${playerId}`)
    wsRef.current = ws

    ws.onopen = () => {
      console.log('WebSocket connected')
    }

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data)
      handleWebSocketMessage(message)
    }

    ws.onerror = (error) => {
      console.error('WebSocket error:', error)
    }

    ws.onclose = () => {
      console.log('WebSocket disconnected')
    }

    return () => {
      ws.close()
    }
  }, [roomCode, playerId])

  const addLogMessage = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString()
    setGameLog(prev => [{ message, type, timestamp }, ...prev].slice(0, 50)) // Новые сверху, храним последние 50
  }

  const handleWebSocketMessage = (message) => {
    switch (message.type) {
      case 'room_state':
        updateRoomState(message.room)
        break
      case 'player_joined':
        updateRoomState(message.room)
        const joinedPlayer = message.room.players[message.player_id]
        if (joinedPlayer) {
          addLogMessage(`${joinedPlayer.name} присоединился к игре`, 'info')
        }
        break
      case 'player_ready_update':
        updateRoomState(message.room)
        const readyPlayer = message.room.players[message.player_id]
        if (readyPlayer) {
          addLogMessage(
            `${readyPlayer.name} ${message.ready ? 'готов' : 'не готов'}`,
            message.ready ? 'success' : 'info'
          )
        }
        break
      case 'game_start':
        updateRoomState(message.room)
        setGameState('playing')
        addLogMessage('Игра началась!', 'success')
        onGameStart()
        break
      case 'action_result':
        updateRoomState(message.room)
        if (message.success) {
          const actionPlayer = message.room.players[message.player_id]
          const action = message.action
          if (action.type === 'build') {
            addLogMessage(
              `${actionPlayer?.name || 'Игрок'} построил ${getBuildingName(action.building_type)}`,
              'success'
            )
          } else if (action.type === 'train_army') {
            addLogMessage(
              `${actionPlayer?.name || 'Игрок'} обучил ${action.quantity} ${getUnitName(action.unit_type)}`,
              'success'
            )
          } else if (action.type === 'research') {
            addLogMessage(
              `${actionPlayer?.name || 'Игрок'} исследовал ${getTechName(action.tech_type)}`,
              'success'
            )
          }
        }
        break
      case 'battle_result':
        updateRoomState(message.room)
        const attacker = message.room.players[message.attacker_id]
        const defender = message.room.players[message.defender_id]
        const details = message.battle_details || {}
        
        if (message.result === 'attacker_wins') {
          let battleMsg = `⚔️ ${attacker?.name || 'Игрок'} победил ${defender?.name || 'Игрока'}!\n`
          
          // Потери атакующего
          if (details.attacker_losses) {
            const losses = Object.entries(details.attacker_losses)
              .filter(([_, count]) => count > 0)
              .map(([type, count]) => `${getUnitName(type)}: ${count}`)
              .join(', ')
            if (losses) battleMsg += `Потери атакующего: ${losses}\n`
          }
          
          // Потери защитника
          if (details.defender_losses) {
            const losses = Object.entries(details.defender_losses)
              .filter(([_, count]) => count > 0)
              .map(([type, count]) => `${getUnitName(type)}: ${count}`)
              .join(', ')
            if (losses) battleMsg += `Потери защитника: ${losses}\n`
          }
          
          // Добыча
          if (details.loot) {
            const lootItems = []
            if (details.loot.gold > 0) lootItems.push(`💰${details.loot.gold}`)
            if (details.loot.wood > 0) lootItems.push(`🪵${details.loot.wood}`)
            if (details.loot.stone > 0) lootItems.push(`🪨${details.loot.stone}`)
            if (details.loot.food > 0) lootItems.push(`🌾${details.loot.food}`)
            if (lootItems.length > 0) battleMsg += `Захвачено: ${lootItems.join(' ')}`
          }
          
          addLogMessage(battleMsg.trim(), 'battle')
        } else {
          let battleMsg = `🛡️ ${defender?.name || 'Игрок'} отбил атаку ${attacker?.name || 'Игрока'}!\n`
          
          // Потери атакующего
          if (details.attacker_losses) {
            const losses = Object.entries(details.attacker_losses)
              .filter(([_, count]) => count > 0)
              .map(([type, count]) => `${getUnitName(type)}: ${count}`)
              .join(', ')
            if (losses) battleMsg += `Потери атакующего: ${losses}\n`
          }
          
          // Потери защитника
          if (details.defender_losses) {
            const losses = Object.entries(details.defender_losses)
              .filter(([_, count]) => count > 0)
              .map(([type, count]) => `${getUnitName(type)}: ${count}`)
              .join(', ')
            if (losses) battleMsg += `Потери защитника: ${losses}`
          }
          
          addLogMessage(battleMsg.trim(), 'battle')
        }
        break
      case 'trade_completed':
        updateRoomState(message.room)
        const trader = message.room.players[message.player_id]
        const target = message.room.players[message.target_player_id]
        const offer = Object.entries(message.trade_offer || {})
          .filter(([_, count]) => count > 0)
          .map(([res, count]) => `${getResourceIcon(res)}${count}`)
          .join(' ')
        const request = Object.entries(message.trade_request || {})
          .filter(([_, count]) => count > 0)
          .map(([res, count]) => `${getResourceIcon(res)}${count}`)
          .join(' ')
        addLogMessage(
          `🤝 ${trader?.name || 'Игрок'} обменял ${offer} на ${request} с ${target?.name || 'игроком'}`,
          'info'
        )
        break
      case 'game_finished':
        updateRoomState(message.room)
        setGameState('finished')
        addLogMessage(`🏆 ${message.winner_name} победил! Игра завершена!`, 'success')
        break
      case 'turn_ended':
        updateRoomState(message.room)
        const nextPlayer = message.room.players[message.next_turn]
        const turnNum = message.turn_number || 1
        addLogMessage(`Ход ${turnNum} переходит к ${nextPlayer?.name || 'игроку'}`, 'info')
        setCurrentTurn(message.next_turn)
        break
      case 'player_disconnected':
        updateRoomState(message.room)
        const disconnectedPlayer = message.room.players[message.player_id]
        if (disconnectedPlayer) {
          addLogMessage(`${disconnectedPlayer.name} покинул игру`, 'warning')
        }
        break
      default:
        console.log('Unknown message type:', message.type)
    }
  }

  const getBuildingName = (type) => {
    const names = {
      'barracks': 'Казармы',
      'farm': 'Ферму',
      'mine': 'Шахту',
      'wall': 'Стену'
    }
    return names[type] || type
  }

  const getUnitName = (type) => {
    const names = {
      'soldiers': 'солдат',
      'archers': 'лучников',
      'cavalry': 'кавалерию'
    }
    return names[type] || type
  }

  const getBuildingIcon = (type) => {
    const icons = {
      'barracks': '🏰',
      'farm': '🚜',
      'mine': '⛏️',
      'wall': '🧱'
    }
    return icons[type] || '🏗️'
  }

  const getTechName = (type) => {
    const names = {
      'military_tactics': 'Военная тактика',
      'advanced_construction': 'Продвинутое строительство',
      'trade_routes': 'Торговые пути',
      'fortification': 'Укрепления'
    }
    return names[type] || type
  }

  const getResourceIcon = (type) => {
    const icons = {
      'gold': '💰',
      'wood': '🪵',
      'stone': '🪨',
      'food': '🌾'
    }
    return icons[type] || type
  }

  const handleTrade = () => {
    if (!tradeTarget) return
    
    // Проверяем, что есть что-то для обмена
    const hasOffer = Object.values(tradeOffer).some(v => v > 0)
    const hasRequest = Object.values(tradeRequest).some(v => v > 0)
    
    if (!hasOffer || !hasRequest) {
      addLogMessage('Укажите ресурсы для обмена', 'warning')
      return
    }
    
    sendGameAction({
      type: 'trade',
      target_player_id: tradeTarget,
      trade_offer: tradeOffer,
      trade_request: tradeRequest
    })
    
    addLogMessage(`Предложение торговли отправлено ${players[tradeTarget]?.name}`, 'info')
    setTradeOffer({ gold: 0, wood: 0, stone: 0, food: 0 })
    setTradeRequest({ gold: 0, wood: 0, stone: 0, food: 0 })
    setTradeTarget(null)
    setActionType(null)
  }

  const handleResearch = (techType) => {
    sendGameAction({
      type: 'research',
      tech_type: techType
    })
    addLogMessage(`Исследование ${getTechName(techType)}...`, 'info')
    setActionType(null)
  }

  const updateRoomState = (roomData) => {
    setRoom(roomData)
    setPlayers(roomData.players)
    setGameState(roomData.game_state)
    setCurrentTurn(roomData.current_turn)
    
    if (roomData.players[playerId]) {
      setMyPlayer(roomData.players[playerId])
      setIsReady(roomData.players[playerId].is_ready)
    }
  }

  const handleReadyToggle = () => {
    const newReadyState = !isReady
    setIsReady(newReadyState)
    
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'player_ready',
        ready: newReadyState
      }))
    }
  }

  const sendGameAction = (action) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'game_action',
        action: action
      }))
    }
  }

  const handleBuild = (buildingType) => {
    sendGameAction({
      type: 'build',
      building_type: buildingType
    })
    addLogMessage(`Строительство ${getBuildingName(buildingType)}...`, 'info')
    setActionType(null)
  }

  const handleTrainArmy = () => {
    if (!selectedUnit) return
    
    sendGameAction({
      type: 'train_army',
      unit_type: selectedUnit,
      quantity: unitQuantity
    })
    addLogMessage(`Обучение ${unitQuantity} ${getUnitName(selectedUnit)}...`, 'info')
    setActionType(null)
    setSelectedUnit(null)
    setUnitQuantity(1)
  }

  const handleAttack = (targetPlayerId) => {
    const target = players[targetPlayerId]
    sendGameAction({
      type: 'attack',
      target_player_id: targetPlayerId
    })
    addLogMessage(`Атака на ${target?.name || 'игрока'}...`, 'battle')
    setActionType(null)
  }

  const handleEndTurn = () => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'end_turn'
      }))
    }
  }

  const isMyTurn = currentTurn === playerId

  if (!myPlayer) {
    return <div>Загрузка...</div>
  }

  return (
    <div className="game-room">
      <div className="game-header">
        <div className="room-info">
          <div>
            <h2>Комната: {roomCode}</h2>
            <button 
              onClick={() => {
                navigator.clipboard.writeText(roomCode)
                addLogMessage('Код комнаты скопирован!', 'success')
              }}
              className="copy-button"
              title="Копировать код комнаты"
            >
              📋 Копировать код
            </button>
          </div>
          <button onClick={onBackToLobby} className="back-button">Выйти</button>
        </div>
        {gameState === 'waiting' && (
          <div className="ready-section">
            <button
              onClick={handleReadyToggle}
              className={isReady ? 'ready-button ready' : 'ready-button'}
            >
              {isReady ? '✓ Готов' : 'Готов'}
            </button>
            <p>Ожидание других игроков... ({Object.keys(players).length}/4)</p>
          </div>
        )}
        {gameState === 'playing' && (
          <div className="turn-indicator">
            {isMyTurn ? (
              <span className="your-turn">Ваш ход!</span>
            ) : (
              <span>Ход игрока: {players[currentTurn]?.name || '...'}</span>
            )}
          </div>
        )}
      </div>

      {gameState === 'playing' && (
        <div className="tabs">
          <button 
            className={activeTab === 'game' ? 'tab active' : 'tab'}
            onClick={() => setActiveTab('game')}
          >
            🎮 Игра
          </button>
          <button 
            className={activeTab === 'trade' ? 'tab active' : 'tab'}
            onClick={() => setActiveTab('trade')}
          >
            🤝 Торговля
          </button>
          <button 
            className={activeTab === 'rules' ? 'tab active' : 'tab'}
            onClick={() => setActiveTab('rules')}
          >
            📖 Правила
          </button>
        </div>
      )}

      {gameState === 'playing' && activeTab === 'game' && (
        <div className="game-content">
          <div className="game-main">
            <div className="player-panel">
            <h3>Ваши ресурсы</h3>
            <div className="resources">
              <div className="resource">💰 Золото: {myPlayer.resources.gold}</div>
              <div className="resource">🪵 Дерево: {myPlayer.resources.wood}</div>
              <div className="resource">🪨 Камень: {myPlayer.resources.stone}</div>
              <div className="resource">🌾 Еда: {myPlayer.resources.food}</div>
            </div>

            <h3>Ваша армия</h3>
            <div className="army">
              <div className="unit">⚔️ Солдаты: {myPlayer.army.soldiers}</div>
              <div className="unit">🏹 Лучники: {myPlayer.army.archers}</div>
              <div className="unit">🐴 Кавалерия: {myPlayer.army.cavalry}</div>
            </div>

            {myPlayer.buildings && Object.keys(myPlayer.buildings).length > 0 && (
              <>
                <h3>Ваши здания</h3>
                <div className="buildings">
                  {Object.entries(myPlayer.buildings).map(([type, count]) => (
                    <div key={type} className="building">
                      {getBuildingIcon(type)} {getBuildingName(type)}: {count}
                    </div>
                  ))}
                </div>
              </>
            )}

            {myPlayer.technologies && myPlayer.technologies.length > 0 && (
              <>
                <h3>Исследованные технологии</h3>
                <div className="technologies">
                  {myPlayer.technologies.map((tech) => (
                    <div key={tech} className="technology">
                      🔬 {getTechName(tech)}
                    </div>
                  ))}
                </div>
              </>
            )}

            <div className="victory-points">
              <h3>🏆 Очки победы: {myPlayer.victory_points || 0}</h3>
            </div>

            {isMyTurn && (
              <div className="actions">
                <h3>Действия</h3>
                <div className="action-buttons">
                  <button onClick={() => setActionType('build')}>🏗️ Строить</button>
                  <button onClick={() => setActionType('train')}>⚔️ Обучить армию</button>
                  <button onClick={() => setActionType('research')}>🔬 Исследовать</button>
                  <button onClick={() => setActionType('attack')}>⚔️ Атаковать</button>
                  <button onClick={handleEndTurn} className="end-turn">✅ Завершить ход</button>
                </div>

                {actionType === 'build' && (
                  <div className="action-menu">
                    <h4>Выберите здание:</h4>
                    <button onClick={() => handleBuild('barracks')}>Казармы (100 дерева, 50 камня, 200 золота)</button>
                    <button onClick={() => handleBuild('farm')}>Ферма (50 дерева, 100 золота)</button>
                    <button onClick={() => handleBuild('mine')}>Шахта (100 камня, 150 золота)</button>
                    <button onClick={() => handleBuild('wall')}>Стена (200 камня, 100 дерева)</button>
                    <button onClick={() => setActionType(null)}>Отмена</button>
                  </div>
                )}

                {actionType === 'train' && (
                  <div className="action-menu">
                    <h4>Обучить армию:</h4>
                    <select value={selectedUnit} onChange={(e) => setSelectedUnit(e.target.value)}>
                      <option value="">Выберите юнит</option>
                      <option value="soldiers">Солдаты (50 золота, 20 еды)</option>
                      <option value="archers">Лучники (75 золота, 30 дерева, 15 еды)</option>
                      <option value="cavalry">Кавалерия (150 золота, 50 еды)</option>
                    </select>
                    <input
                      type="number"
                      min="1"
                      value={unitQuantity}
                      onChange={(e) => setUnitQuantity(parseInt(e.target.value) || 1)}
                      placeholder="Количество"
                    />
                    <button onClick={handleTrainArmy} disabled={!selectedUnit}>Обучить</button>
                    <button onClick={() => setActionType(null)}>Отмена</button>
                  </div>
                )}

                {actionType === 'attack' && (
                  <div className="action-menu">
                    <h4>Выберите цель:</h4>
                    {Object.entries(players).map(([pid, player]) => {
                      if (pid === playerId) return null
                      return (
                        <button key={pid} onClick={() => handleAttack(pid)}>
                          Атаковать {player.name}
                        </button>
                      )
                    })}
                    <button onClick={() => setActionType(null)}>Отмена</button>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="game-log">
            <h3>📜 Лог событий</h3>
            <div className="log-messages">
              {gameLog.map((log, index) => (
                <div key={index} className={`log-message log-${log.type}`}>
                  <span className="log-time">{log.timestamp}</span>
                  <span className="log-text">{log.message}</span>
                </div>
              ))}
              {gameLog.length === 0 && (
                <div className="log-empty">Событий пока нет</div>
              )}
            </div>
          </div>
          </div>

          <div className="players-list">
            <h3>Игроки</h3>
            {Object.entries(players).map(([pid, player]) => (
              <div key={pid} className={`player-card ${pid === currentTurn ? 'active-turn' : ''}`}>
                <div className="player-header">
                  <h4>{player.name} {pid === playerId && '(Вы)'}</h4>
                  <div className="player-victory-points">🏆 {player.victory_points || 0}</div>
                </div>
                {pid === playerId ? (
                  <>
                    <div className="player-resources">
                      <div>💰 {player.resources.gold}</div>
                      <div>🪵 {player.resources.wood}</div>
                      <div>🪨 {player.resources.stone}</div>
                      <div>🌾 {player.resources.food}</div>
                    </div>
                    <div className="player-army">
                      <div>⚔️ {player.army.soldiers}</div>
                      <div>🏹 {player.army.archers}</div>
                      <div>🐴 {player.army.cavalry}</div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="player-resources hidden">
                      <div>💰 ???</div>
                      <div>🪵 ???</div>
                      <div>🪨 ???</div>
                      <div>🌾 ???</div>
                    </div>
                    <div className="player-army">
                      <div>⚔️ {player.army.soldiers}</div>
                      <div>🏹 {player.army.archers}</div>
                      <div>🐴 {player.army.cavalry}</div>
                    </div>
                  </>
                )}
                {player.buildings && Object.keys(player.buildings).length > 0 && (
                  <div className="player-buildings">
                    <strong>Здания:</strong>
                    {Object.entries(player.buildings).map(([type, count]) => (
                      <span key={type} className="building-badge">
                        {getBuildingIcon(type)} {count}
                      </span>
                    ))}
                  </div>
                )}
                {player.technologies && player.technologies.length > 0 && (
                  <div className="player-tech">
                    <strong>Технологии:</strong> {player.technologies.length}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {gameState === 'waiting' && (
        <div className="waiting-room">
          <h3>Игроки в комнате:</h3>
          <div className="players-waiting">
            {Object.entries(players).map(([pid, player]) => (
              <div key={pid} className="waiting-player">
                <span>{player.name}</span>
                {player.is_ready && <span className="ready-badge">✓</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {gameState === 'finished' && room?.winner && (
        <div className="victory-screen">
          <h2>🏆 Игра завершена!</h2>
          <div className="winner">
            <h3>Победитель: {room.players[room.winner]?.name}</h3>
            <p>Очки победы: {room.players[room.winner]?.victory_points || 0}</p>
            <button onClick={onBackToLobby} className="back-button">Вернуться в лобби</button>
          </div>
        </div>
      )}
    </div>
  )
}

export default GameRoom

