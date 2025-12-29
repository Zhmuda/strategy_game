#!/bin/bash

# Скрипт для деплоя фронтенда на Vercel
# Требует установленного Vercel CLI: npm i -g vercel

set -e  # Остановка при ошибке

echo "🚀 Deploying frontend to Vercel..."

cd frontend

# Проверка наличия Vercel CLI
if ! command -v vercel &> /dev/null; then
    echo "📦 Vercel CLI not found. Installing..."
    npm install -g vercel
fi

# Проверка авторизации
if ! vercel whoami &> /dev/null; then
    echo "🔐 Not logged in to Vercel. Please login..."
    vercel login
fi

# Проверка переменных окружения
if [ -z "$VITE_BACKEND_URL" ]; then
    echo "⚠️  VITE_BACKEND_URL not set. Using default..."
    export VITE_BACKEND_URL="https://strategy-game-pvnb.onrender.com"
fi

# Сборка проекта
echo "📦 Building project with VITE_BACKEND_URL=$VITE_BACKEND_URL..."
npm install
VITE_BACKEND_URL=$VITE_BACKEND_URL npm run build

# Деплой
echo "🚀 Deploying to Vercel..."
vercel --prod --yes

echo "✅ Deployment complete!"
echo "🌐 Your app should be live now!"

