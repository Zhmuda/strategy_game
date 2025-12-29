# Военно-Экономическая Стратегия

Онлайн мультиплеерная военно-экономическая стратегия с системой приглашений по коду.

## Технологии

- **Backend**: Python, FastAPI, WebSockets
- **Frontend**: React, Vite

## Установка и запуск

### Backend

```bash
cd backend
pip install -r requirements.txt
python main.py
```

Backend будет доступен на `http://localhost:8000`

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend будет доступен на `http://localhost:3000`

**Важно**: Для работы в локальной разработке создайте файл `.env` в папке `frontend`:
```
VITE_BACKEND_URL=http://localhost:8000
```

## Деплой

### Backend (Render)

1. Подключите репозиторий к Render
2. Настройки:
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `python main.py`
   - **Environment Variables**:
     - `ALLOWED_ORIGINS`: `https://strategy-game-4jwu.vercel.app,http://localhost:3000,http://localhost:5173`

### Frontend (Vercel)

1. Подключите репозиторий к Vercel
2. Настройки:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Environment Variables**:
     - `VITE_BACKEND_URL`: `https://strategy-game-pvnb.onrender.com`

## Как играть

1. Запустите backend и frontend
2. Откройте браузер на `http://localhost:3000`
3. Создайте комнату или присоединитесь по коду
4. Дождитесь готовности всех игроков (минимум 2)
5. Игра начинается автоматически!

## Игровая механика

- **Ресурсы**: Золото, Дерево, Камень, Еда
- **Армия**: Солдаты, Лучники, Кавалерия
- **Здания**: Казармы, Фермы, Шахты, Стены
- **Технологии**: Военная тактика, Продвинутое строительство, Торговые пути, Укрепления
- **Действия**: Строительство, обучение армии, исследования, атака, торговля

## API

- `POST /api/create-room` - Создать комнату
- `GET /api/room/{room_code}` - Получить информацию о комнате
- `POST /api/join-room` - Присоединиться к комнате
- `WS /ws/{room_code}/{player_id}` - WebSocket для игрового взаимодействия


