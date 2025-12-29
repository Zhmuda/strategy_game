# Инструкция по настройке Vercel

## Проблема: Пустая белая страница

Если вы видите пустую страницу, выполните следующие шаги:

## Шаг 1: Настройка Root Directory

В настройках проекта Vercel:
1. Перейдите в **Settings** → **General**
2. Найдите **Root Directory**
3. Установите: `frontend`
4. Сохраните

## Шаг 2: Настройка Build Settings

В **Settings** → **Build & Development Settings**:

- **Framework Preset**: Vite
- **Build Command**: `npm run build` (или оставьте пустым, Vercel определит автоматически)
- **Output Directory**: `dist`
- **Install Command**: `npm install`

## Шаг 3: Переменные окружения

В **Settings** → **Environment Variables**:

Добавьте:
- **Name**: `VITE_BACKEND_URL`
- **Value**: `https://strategy-game-pvnb.onrender.com`
- **Environment**: Production, Preview, Development (отметьте все)

**ВАЖНО**: После добавления переменной окружения:
1. Перейдите в **Deployments**
2. Найдите последний деплой
3. Нажмите **Redeploy** (три точки → Redeploy)

## Шаг 4: Проверка

1. Откройте сайт: https://strategy-game-4jwu.vercel.app
2. Откройте консоль браузера (F12)
3. Проверьте:
   - Есть ли ошибки в Console?
   - В Network tab - загружаются ли файлы?
   - Какой URL используется для API? (должен быть `https://strategy-game-pvnb.onrender.com`)

## Альтернатива: Деплой из папки frontend

Если проблемы продолжаются:

1. В настройках Vercel установите **Root Directory**: `frontend`
2. Или создайте отдельный репозиторий только с папкой `frontend`
3. Подключите этот репозиторий к Vercel

## Отладка

Если страница все еще пустая:

1. **Проверьте консоль браузера** - там должны быть ошибки
2. **Проверьте Network tab** - загружаются ли JS файлы?
3. **Проверьте переменные окружения** - они должны быть видны в логах сборки
4. **Проверьте логи деплоя** в Vercel Dashboard

## Быстрое решение

Если ничего не помогает:

1. Удалите проект в Vercel
2. Создайте новый проект
3. Подключите репозиторий
4. **Сразу установите Root Directory**: `frontend`
5. Добавьте переменную окружения `VITE_BACKEND_URL`
6. Деплойте

