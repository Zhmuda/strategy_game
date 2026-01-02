#!/bin/bash

# Скрипт для деплоя бэкенда на Render
# Требует установленного Render CLI: https://render.com/docs/cli

echo "🚀 Deploying backend to Render..."

cd backend

# Проверка наличия Render CLI
if ! command -v render &> /dev/null; then
    echo "❌ Render CLI not found."
    echo "Install from: https://render.com/docs/cli"
    exit 1
fi

# Деплой
echo "🚀 Deploying..."
render deploy

echo "✅ Deployment complete!"






