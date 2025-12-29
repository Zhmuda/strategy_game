# Strategy Game Backend

Бэкенд для мультиплеерной военно-экономической стратегии.

## Установка

```bash
pip install -r requirements.txt
```

## Запуск

```bash
python main.py
```

Или с uvicorn:

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

## API Endpoints

- `POST /api/create-room` - Создать комнату
- `GET /api/room/{room_code}` - Получить информацию о комнате
- `POST /api/join-room` - Присоединиться к комнате
- `WS /ws/{room_code}/{player_id}` - WebSocket для игрового взаимодействия


