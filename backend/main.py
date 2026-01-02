from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import Dict, List, Optional
import uuid
import json
import asyncio
from datetime import datetime
from pydantic import BaseModel, ConfigDict

app = FastAPI(title="Strategy Game API")

# CORS для React фронтенда
import os

# Получаем разрешенные домены из переменных окружения или используем дефолтные
allowed_origins_env = os.getenv("ALLOWED_ORIGINS", "")
if allowed_origins_env:
    allowed_origins = [origin.strip() for origin in allowed_origins_env.split(",")]
else:
    # Дефолтные домены
    allowed_origins = [
        "http://localhost:3000",
        "http://localhost:5173",
        "https://strategy-game-4jwu.vercel.app",
    ]

# В продакшене разрешаем все origins для гибкости (можно ограничить позже)
# Для безопасности можно установить ALLOWED_ORIGINS в переменных окружения
allow_all_origins = os.getenv("ALLOW_ALL_ORIGINS", "false").lower() == "true"

if allow_all_origins:
    allowed_origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Модели данных
class Player(BaseModel):
    model_config = ConfigDict()
    
    id: str
    name: str
    resources: Dict[str, int]
    army: Dict[str, int]
    territories: List[str]
    buildings: Dict[str, int] = {}  # building_type -> quantity
    technologies: List[str] = []  # Исследованные технологии
    victory_points: int = 0  # Очки победы
    is_ready: bool = False

class GameRoom(BaseModel):
    model_config = ConfigDict()
    
    code: str
    players: Dict[str, Player]
    game_state: str  # "waiting", "playing", "finished"
    created_at: datetime
    current_turn: Optional[str] = None
    turn_number: int = 1  # Номер текущего хода
    winner: Optional[str] = None  # ID победителя
    
    def to_dict(self):
        """Конвертирует комнату в словарь с правильной сериализацией datetime"""
        data = self.model_dump()
        # Конвертируем datetime в строку ISO format
        data['created_at'] = self.created_at.isoformat()
        # Конвертируем Player объекты в словари
        data['players'] = {pid: p.model_dump() for pid, p in self.players.items()}
        # Добавляем дополнительные поля
        data['turn_number'] = self.turn_number
        data['winner'] = self.winner
        return data

# Хранилище игровых комнат
game_rooms: Dict[str, GameRoom] = {}
active_connections: Dict[str, List[WebSocket]] = {}  # room_code -> [websockets]

# Начальные ресурсы
INITIAL_RESOURCES = {
    "gold": 1000,
    "wood": 500,
    "stone": 500,
    "food": 1000
}

# Начальная армия
INITIAL_ARMY = {
    "soldiers": 10,
    "archers": 5,
    "cavalry": 3
}

def generate_room_code() -> str:
    """Генерирует уникальный код комнаты"""
    return str(uuid.uuid4())[:8].upper()

def create_player(player_id: str, name: str) -> Player:
    """Создает нового игрока"""
    return Player(
        id=player_id,
        name=name,
        resources=INITIAL_RESOURCES.copy(),
        army=INITIAL_ARMY.copy(),
        territories=[],
        buildings={},
        technologies=[],
        victory_points=0,
        is_ready=False
    )

@app.get("/")
async def root():
    return {
        "message": "Strategy Game API",
        "status": "online",
        "websocket_support": True,
        "timestamp": datetime.now().isoformat()
    }

@app.get("/api/health")
async def health_check():
    """Проверка здоровья сервера"""
    return {
        "status": "healthy",
        "websocket_support": True,
        "active_rooms": len(game_rooms),
        "active_connections": sum(len(conns) for conns in active_connections.values()),
        "timestamp": datetime.now().isoformat()
    }

@app.get("/api/test")
async def test_endpoint():
    """Тестовый endpoint для проверки связи"""
    return {
        "message": "Backend is working!",
        "api_url": "OK",
        "websocket_url": "Check connection manually",
        "timestamp": datetime.now().isoformat(),
        "test_data": {
            "rooms_count": len(game_rooms),
            "connections_count": sum(len(conns) for conns in active_connections.values())
        }
    }

@app.post("/api/create-room")
async def create_room(player_name: str):
    """Создает новую игровую комнату"""
    room_code = generate_room_code()
    player_id = str(uuid.uuid4())
    
    player = create_player(player_id, player_name)
    
    room = GameRoom(
        code=room_code,
        players={player_id: player},
        game_state="waiting",
        created_at=datetime.now(),
        current_turn=player_id
    )
    
    game_rooms[room_code] = room
    active_connections[room_code] = []
    
    return {
        "room_code": room_code,
        "player_id": player_id,
        "room": room.to_dict()
    }

@app.get("/api/room/{room_code}")
async def get_room(room_code: str):
    """Получает информацию о комнате"""
    if room_code not in game_rooms:
        raise HTTPException(status_code=404, detail="Room not found")
    
    room = game_rooms[room_code]
    return {
        "code": room.code,
        "players": {pid: p.model_dump() for pid, p in room.players.items()},
        "game_state": room.game_state,
        "player_count": len(room.players)
    }

@app.post("/api/join-room")
async def join_room(room_code: str, player_name: str):
    """Присоединяется к комнате по коду"""
    if room_code not in game_rooms:
        raise HTTPException(status_code=404, detail="Room not found")
    
    room = game_rooms[room_code]
    
    if room.game_state != "waiting":
        raise HTTPException(status_code=400, detail="Game already started")
    
    if len(room.players) >= 4:  # Максимум 4 игрока
        raise HTTPException(status_code=400, detail="Room is full")
    
    player_id = str(uuid.uuid4())
    player = create_player(player_id, player_name)
    room.players[player_id] = player
    
    return {
        "room_code": room_code,
        "player_id": player_id,
        "room": room.to_dict()
    }

async def broadcast_to_room(room_code: str, message: dict):
    """Отправляет сообщение всем подключенным клиентам в комнате"""
    if room_code in active_connections:
        disconnected = []
        for connection in active_connections[room_code]:
            try:
                await connection.send_json(message)
            except:
                disconnected.append(connection)
        
        # Удаляем отключенные соединения
        for conn in disconnected:
            active_connections[room_code].remove(conn)

@app.websocket("/ws/test/test")
async def websocket_test(websocket: WebSocket):
    """Тестовый WebSocket endpoint для проверки поддержки"""
    try:
        await websocket.accept()
        await websocket.send_json({"message": "WebSocket test successful", "status": "ok"})
        await websocket.close(code=1000, reason="Test complete")
    except Exception as e:
        print(f"WebSocket test error: {e}")

@app.websocket("/ws/{room_code}/{player_id}")
async def websocket_endpoint(websocket: WebSocket, room_code: str, player_id: str):
    """WebSocket endpoint для игрового взаимодействия"""
    await websocket.accept()
    
    # Разрешаем тестовое подключение
    if room_code == "test" and player_id == "test":
        await websocket.send_json({"message": "Test connection successful"})
        await websocket.close(code=1000)
        return
    
    if room_code not in game_rooms:
        await websocket.close(code=1008, reason="Room not found")
        return
    
    if player_id not in game_rooms[room_code].players:
        await websocket.close(code=1008, reason="Player not in room")
        return
    
    # Добавляем соединение
    if room_code not in active_connections:
        active_connections[room_code] = []
    active_connections[room_code].append(websocket)
    
    room = game_rooms[room_code]
    
    # Отправляем текущее состояние комнаты
    await websocket.send_json({
        "type": "room_state",
        "room": room.to_dict()
    })
    
    # Уведомляем других игроков о подключении
    await broadcast_to_room(room_code, {
        "type": "player_joined",
        "player_id": player_id,
        "room": room.to_dict()
    })
    
    try:
        while True:
            data = await websocket.receive_json()
            message_type = data.get("type")
            
            if message_type == "player_ready":
                # Игрок готов к игре
                room.players[player_id].is_ready = data.get("ready", False)
                await broadcast_to_room(room_code, {
                    "type": "player_ready_update",
                    "player_id": player_id,
                    "ready": room.players[player_id].is_ready,
                    "room": room.to_dict()
                })
                
                # Проверяем, все ли готовы
                all_ready = all(p.is_ready for p in room.players.values())
                if all_ready and len(room.players) >= 2:
                    room.game_state = "playing"
                    await broadcast_to_room(room_code, {
                        "type": "game_start",
                        "room": room.to_dict()
                    })
            
            elif message_type == "game_action":
                # Игровое действие (строительство, атака, и т.д.)
                action = data.get("action")
                await handle_game_action(room_code, player_id, action, websocket)
            
            elif message_type == "end_turn":
                # Завершение хода
                await handle_end_turn(room_code, player_id, websocket)
            
    except WebSocketDisconnect:
        active_connections[room_code].remove(websocket)
        await broadcast_to_room(room_code, {
            "type": "player_disconnected",
            "player_id": player_id,
            "room": room.to_dict()
        })

async def handle_game_action(room_code: str, player_id: str, action: dict, websocket: WebSocket):
    """Обрабатывает игровые действия"""
    room = game_rooms[room_code]
    player = room.players[player_id]
    
    action_type = action.get("type")
    
    if action_type == "build":
        # Строительство здания
        building_type = action.get("building_type")
        cost = get_building_cost(building_type)
        
        if can_afford(player.resources, cost):
            # Вычитаем ресурсы
            for resource, amount in cost.items():
                player.resources[resource] -= amount
            
            # Добавляем эффект здания
            apply_building_effect(player, building_type)
            
            # Увеличиваем счетчик зданий
            player.buildings[building_type] = player.buildings.get(building_type, 0) + 1
            
            await broadcast_to_room(room_code, {
                "type": "action_result",
                "player_id": player_id,
                "action": action,
                "success": True,
                "room": room.to_dict()
            })
        else:
            await websocket.send_json({
                "type": "action_result",
                "success": False,
                "error": "Not enough resources"
            })
    
    elif action_type == "train_army":
        # Обучение армии
        unit_type = action.get("unit_type")
        quantity = action.get("quantity", 1)
        cost = get_unit_cost(unit_type, quantity)
        
        if can_afford(player.resources, cost):
            for resource, amount in cost.items():
                player.resources[resource] -= amount
            
            player.army[unit_type] = player.army.get(unit_type, 0) + quantity
            
            await broadcast_to_room(room_code, {
                "type": "action_result",
                "player_id": player_id,
                "action": action,
                "success": True,
                "room": room.to_dict()
            })
        else:
            await websocket.send_json({
                "type": "action_result",
                "success": False,
                "error": "Not enough resources"
            })
    
    elif action_type == "attack":
        # Атака на другого игрока
        target_player_id = action.get("target_player_id")
        if target_player_id in room.players:
            await handle_attack(room_code, player_id, target_player_id, action, websocket)
    
    elif action_type == "research":
        # Исследование технологии
        tech_type = action.get("tech_type")
        await handle_research(room_code, player_id, tech_type, websocket)
    
    elif action_type == "trade":
        # Торговля с другим игроком
        target_player_id = action.get("target_player_id")
        trade_offer = action.get("trade_offer")  # {resource: amount}
        trade_request = action.get("trade_request")  # {resource: amount}
        await handle_trade(room_code, player_id, target_player_id, trade_offer, trade_request, websocket)

async def handle_attack(room_code: str, attacker_id: str, defender_id: str, action: dict, websocket: WebSocket):
    """Обрабатывает атаку с улучшенной боевой системой"""
    import random
    room = game_rooms[room_code]
    attacker = room.players[attacker_id]
    defender = room.players[defender_id]
    
    # Расчет силы армии с учетом типов юнитов
    attacker_power = (
        attacker.army.get("soldiers", 0) * 1.0 +
        attacker.army.get("archers", 0) * 1.2 +
        attacker.army.get("cavalry", 0) * 1.5
    )
    
    defender_power = (
        defender.army.get("soldiers", 0) * 1.0 +
        defender.army.get("archers", 0) * 1.2 +
        defender.army.get("cavalry", 0) * 1.5
    )
    
    # Бонус от стен
    wall_bonus = defender.buildings.get("wall", 0) * 0.2
    defender_power *= (1 + wall_bonus)
    
    # Случайный фактор
    attacker_roll = random.randint(1, 100)
    defender_roll = random.randint(1, 100)
    
    attacker_total = attacker_power + attacker_roll
    defender_total = defender_power + defender_roll
    
    # Детальные результаты боя
    battle_details = {
        "attacker_power": round(attacker_power, 1),
        "defender_power": round(defender_power, 1),
        "attacker_roll": attacker_roll,
        "defender_roll": defender_roll,
        "attacker_total": round(attacker_total, 1),
        "defender_total": round(defender_total, 1)
    }
    
    # Сохраняем начальные значения для подсчета потерь
    attacker_initial_army = attacker.army.copy()
    defender_initial_army = defender.army.copy()
    
    if attacker_total > defender_total:
        # Атакующий побеждает
        damage_ratio = (attacker_total - defender_total) / attacker_total
        total_defender_units = sum(defender.army.values())
        damage = max(1, int(total_defender_units * damage_ratio * 0.3))
        
        # Распределяем урон по юнитам защитника
        defender_losses = {}
        for unit_type in defender.army:
            if defender.army[unit_type] > 0:
                unit_damage = min(damage, defender.army[unit_type])
                defender.army[unit_type] -= unit_damage
                defender_losses[unit_type] = unit_damage
                damage -= unit_damage
                if damage <= 0:
                    break
        
        # Небольшие потери атакующего
        attacker_losses = {}
        attacker_damage = max(1, int(sum(attacker.army.values()) * 0.1))
        for unit_type in attacker.army:
            if attacker.army[unit_type] > 0 and attacker_damage > 0:
                unit_damage = min(attacker_damage, attacker.army[unit_type] // 10)
                attacker.army[unit_type] -= unit_damage
                attacker_losses[unit_type] = unit_damage
                attacker_damage -= unit_damage
        
        # Захват ресурсов (10% от ресурсов защитника)
        loot_gold = int(defender.resources.get("gold", 0) * 0.1)
        loot_wood = int(defender.resources.get("wood", 0) * 0.1)
        loot_stone = int(defender.resources.get("stone", 0) * 0.1)
        loot_food = int(defender.resources.get("food", 0) * 0.1)
        
        attacker.resources["gold"] += loot_gold
        attacker.resources["wood"] += loot_wood
        attacker.resources["stone"] += loot_stone
        attacker.resources["food"] += loot_food
        
        defender.resources["gold"] = max(0, defender.resources["gold"] - loot_gold)
        defender.resources["wood"] = max(0, defender.resources["wood"] - loot_wood)
        defender.resources["stone"] = max(0, defender.resources["stone"] - loot_stone)
        defender.resources["food"] = max(0, defender.resources["food"] - loot_food)
        
        # Очки победы за успешную атаку
        attacker.victory_points += 1
        
        result = "attacker_wins"
        battle_details["loot"] = {"gold": loot_gold, "wood": loot_wood, "stone": loot_stone, "food": loot_food}
        battle_details["attacker_losses"] = attacker_losses
        battle_details["defender_losses"] = defender_losses
    else:
        # Защитник побеждает
        damage_ratio = (defender_total - attacker_total) / defender_total
        total_attacker_units = sum(attacker.army.values())
        damage = max(1, int(total_attacker_units * damage_ratio * 0.2))
        
        # Распределяем урон по юнитам атакующего
        attacker_losses = {}
        for unit_type in attacker.army:
            if attacker.army[unit_type] > 0:
                unit_damage = min(damage, attacker.army[unit_type])
                attacker.army[unit_type] -= unit_damage
                attacker_losses[unit_type] = unit_damage
                damage -= unit_damage
                if damage <= 0:
                    break
        
        # Небольшие потери защитника
        defender_losses = {}
        defender_damage = max(1, int(sum(defender.army.values()) * 0.05))
        for unit_type in defender.army:
            if defender.army[unit_type] > 0 and defender_damage > 0:
                unit_damage = min(defender_damage, defender.army[unit_type] // 20)
                defender.army[unit_type] -= unit_damage
                defender_losses[unit_type] = unit_damage
                defender_damage -= unit_damage
        
        # Очки победы за успешную защиту
        defender.victory_points += 1
        
        result = "defender_wins"
        battle_details["attacker_losses"] = attacker_losses
        battle_details["defender_losses"] = defender_losses
    
    # Проверка условий победы
    await check_victory_conditions(room_code)
    
    await broadcast_to_room(room_code, {
        "type": "battle_result",
        "attacker_id": attacker_id,
        "defender_id": defender_id,
        "result": result,
        "battle_details": battle_details,
        "room": room.to_dict()
    })

async def handle_research(room_code: str, player_id: str, tech_type: str, websocket: WebSocket):
    """Обрабатывает исследование технологии"""
    room = game_rooms[room_code]
    player = room.players[player_id]
    
    # Проверяем, не исследована ли уже технология
    if tech_type in player.technologies:
        await websocket.send_json({
            "type": "action_result",
            "success": False,
            "error": "Технология уже исследована"
        })
        return
    
    # Стоимость исследований
    tech_costs = {
        "military_tactics": {"gold": 300, "food": 100},
        "advanced_construction": {"gold": 250, "wood": 150, "stone": 150},
        "trade_routes": {"gold": 200, "wood": 100},
        "fortification": {"gold": 400, "stone": 200}
    }
    
    cost = tech_costs.get(tech_type, {})
    if not cost:
        await websocket.send_json({
            "type": "action_result",
            "success": False,
            "error": "Неизвестная технология"
        })
        return
    
    if can_afford(player.resources, cost):
        # Вычитаем ресурсы
        for resource, amount in cost.items():
            player.resources[resource] -= amount
        
        # Добавляем технологию
        player.technologies.append(tech_type)
        player.victory_points += 2  # Очки за исследование
        
        await broadcast_to_room(room_code, {
            "type": "action_result",
            "player_id": player_id,
            "action": {"type": "research", "tech_type": tech_type},
            "success": True,
            "room": room.to_dict()
        })
        
        await check_victory_conditions(room_code)
    else:
        await websocket.send_json({
            "type": "action_result",
            "success": False,
            "error": "Недостаточно ресурсов"
        })

async def handle_trade(room_code: str, player_id: str, target_player_id: str, trade_offer: dict, trade_request: dict, websocket: WebSocket):
    """Обрабатывает торговлю между игроками"""
    room = game_rooms[room_code]
    
    if target_player_id not in room.players:
        await websocket.send_json({
            "type": "action_result",
            "success": False,
            "error": "Игрок не найден"
        })
        return
    
    player = room.players[player_id]
    target = room.players[target_player_id]
    
    # Проверяем, что у игрока есть ресурсы для обмена
    if not can_afford(player.resources, trade_offer):
        await websocket.send_json({
            "type": "action_result",
            "success": False,
            "error": "Недостаточно ресурсов для обмена"
        })
        return
    
    # Проверяем, что у цели есть ресурсы для обмена
    if not can_afford(target.resources, trade_request):
        await websocket.send_json({
            "type": "action_result",
            "success": False,
            "error": "У соперника недостаточно ресурсов"
        })
        return
    
    # Выполняем обмен
    for resource, amount in trade_offer.items():
        player.resources[resource] -= amount
        target.resources[resource] = target.resources.get(resource, 0) + amount
    
    for resource, amount in trade_request.items():
        target.resources[resource] -= amount
        player.resources[resource] = player.resources.get(resource, 0) + amount
    
    await broadcast_to_room(room_code, {
        "type": "trade_completed",
        "player_id": player_id,
        "target_player_id": target_player_id,
        "trade_offer": trade_offer,
        "trade_request": trade_request,
        "room": room.to_dict()
    })

async def handle_end_turn(room_code: str, player_id: str, websocket: WebSocket):
    """Обрабатывает завершение хода"""
    room = game_rooms[room_code]
    
    # Передаем ход следующему игроку
    player_ids = list(room.players.keys())
    current_index = player_ids.index(player_id)
    next_index = (current_index + 1) % len(player_ids)
    next_player_id = player_ids[next_index]
    
    room.current_turn = next_player_id
    
    # Увеличиваем номер хода, если вернулись к первому игроку
    if next_index == 0:
        room.turn_number += 1
    
    # Начисляем ресурсы за ход
    for player in room.players.values():
        base_gold = 50
        base_wood = 25
        base_stone = 25
        base_food = 50
        
        # Бонусы от зданий
        mine_bonus = player.buildings.get("mine", 0) * 25
        farm_bonus = player.buildings.get("farm", 0) * 30
        
        # Бонусы от технологий
        if "trade_routes" in player.technologies:
            base_gold += 25
        if "military_tactics" in player.technologies:
            # Военная тактика дает небольшой бонус к ресурсам
            base_food += 10
        
        player.resources["gold"] += base_gold + mine_bonus
        player.resources["wood"] += base_wood
        player.resources["stone"] += base_stone
        player.resources["food"] += base_food + farm_bonus
    
    # Проверяем условия победы в конце хода
    await check_victory_conditions(room_code)
    
    await broadcast_to_room(room_code, {
        "type": "turn_ended",
        "next_turn": next_player_id,
        "turn_number": room.turn_number,
        "room": room.to_dict()
    })
    
    # Если игра завершена, отправляем сообщение о победе
    if room.game_state == "finished" and room.winner:
        await broadcast_to_room(room_code, {
            "type": "game_finished",
            "winner_id": room.winner,
            "winner_name": room.players[room.winner].name,
            "room": room.to_dict()
        })
    
    await broadcast_to_room(room_code, {
        "type": "turn_ended",
        "next_turn": next_player_id,
        "room": room.to_dict()
    })

async def check_victory_conditions(room_code: str):
    """Проверяет условия победы"""
    room = game_rooms[room_code]
    
    # Условия победы:
    # 1. 10 очков победы
    # 2. Уничтожение всех вражеских армий
    # 3. 20 очков победы (альтернативная победа)
    
    for player_id, player in room.players.items():
        # Проверка по очкам победы
        if player.victory_points >= 10:
            room.game_state = "finished"
            room.winner = player_id
            return
        
        # Проверка по уничтожению армий
        all_others_defeated = all(
            sum(other.army.values()) == 0 
            for other_id, other in room.players.items() 
            if other_id != player_id
        )
        if all_others_defeated and sum(player.army.values()) > 0:
            room.game_state = "finished"
            room.winner = player_id
            return

def can_afford(resources: Dict[str, int], cost: Dict[str, int]) -> bool:
    """Проверяет, достаточно ли ресурсов"""
    return all(resources.get(resource, 0) >= amount for resource, amount in cost.items())

def get_building_cost(building_type: str) -> Dict[str, int]:
    """Возвращает стоимость здания"""
    costs = {
        "barracks": {"wood": 100, "stone": 50, "gold": 200},
        "farm": {"wood": 50, "gold": 100},
        "mine": {"stone": 100, "gold": 150},
        "wall": {"stone": 200, "wood": 100}
    }
    return costs.get(building_type, {})

def get_unit_cost(unit_type: str, quantity: int) -> Dict[str, int]:
    """Возвращает стоимость юнита"""
    costs_per_unit = {
        "soldiers": {"gold": 50, "food": 20},
        "archers": {"gold": 75, "wood": 30, "food": 15},
        "cavalry": {"gold": 150, "food": 50}
    }
    unit_cost = costs_per_unit.get(unit_type, {})
    return {k: v * quantity for k, v in unit_cost.items()}

def apply_building_effect(player: Player, building_type: str):
    """Применяет эффект здания"""
    effects = {
        "barracks": lambda p: None,  # Увеличивает скорость обучения
        "farm": lambda p: p.resources.update({"food": p.resources.get("food", 0) + 100}),
        "mine": lambda p: p.resources.update({"gold": p.resources.get("gold", 0) + 50})
    }
    if building_type in effects:
        effects[building_type](player)

if __name__ == "__main__":
    import uvicorn
    import os
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)

