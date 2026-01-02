#!/bin/bash

# Универсальный скрипт настройки и деплоя

echo "🎮 Strategy Game Deployment Setup"
echo "=================================="

# Проверка зависимостей
echo "📋 Checking dependencies..."

if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js first."
    exit 1
fi

if ! command -v python3 &> /dev/null; then
    echo "❌ Python not found. Please install Python first."
    exit 1
fi

# Установка Vercel CLI
echo "📦 Installing Vercel CLI..."
npm install -g vercel

# Настройка переменных окружения
echo "⚙️  Setting up environment variables..."

# Создание .env файла для фронтенда
if [ ! -f "frontend/.env" ]; then
    echo "Creating frontend/.env..."
    cat > frontend/.env << EOF
VITE_BACKEND_URL=https://strategy-game-pvnb.onrender.com
EOF
    echo "✅ Created frontend/.env"
else
    echo "⚠️  frontend/.env already exists"
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. For Vercel: Run 'bash scripts/deploy-vercel.sh'"
echo "2. For Render: Run 'bash scripts/deploy-render.sh'"
echo "3. Or use GitHub Actions (see .github/workflows/setup-vercel.md)"






