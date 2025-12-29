# Инструкции по деплою

## Backend (Render)

1. Подключите репозиторий к Render
2. Настройки:
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `python main.py` или `uvicorn main:app --host 0.0.0.0 --port $PORT`
   - **Environment Variables**:
     - `ALLOWED_ORIGINS`: `https://strategy-game-4jwu.vercel.app,http://localhost:3000,http://localhost:5173`

## Frontend (Vercel)

1. Подключите репозиторий к Vercel
2. Настройки:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Environment Variables**:
     - `VITE_BACKEND_URL`: `https://strategy-game-pvnb.onrender.com`

## Проверка

После деплоя проверьте:
- Backend доступен: https://strategy-game-pvnb.onrender.com/
- Frontend использует правильный URL бэкенда
- CORS настроен правильно
- WebSocket использует wss:// для HTTPS

