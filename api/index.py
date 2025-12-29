# Vercel Serverless Function для бэкенда
# Это альтернативный вариант деплоя бэкенда на Vercel
# Требует переработки на serverless функции

from fastapi import FastAPI
from mangum import Mangum

# Импортируем приложение из основного файла
import sys
import os

# Добавляем путь к backend
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))

from main import app

# Оборачиваем для Vercel
handler = Mangum(app)

# Для локального тестирования
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

