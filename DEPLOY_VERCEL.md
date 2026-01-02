# Деплой на Vercel (Backend + Frontend)

## Вариант 1: Только Frontend на Vercel (рекомендуется)

Используйте текущую настройку:
- Backend на Render: https://strategy-game-pvnb.onrender.com
- Frontend на Vercel: https://strategy-game-4jwu.vercel.app

**Настройки Vercel:**
- Root Directory: `frontend`
- Build Command: `npm run build`
- Output Directory: `dist`
- Environment Variable: `VITE_BACKEND_URL=https://strategy-game-pvnb.onrender.com`

## Вариант 2: Backend + Frontend на Vercel

### Проблемы:
1. Vercel Serverless Functions имеют ограничение на время выполнения (10 секунд для бесплатного плана)
2. WebSocket не поддерживается напрямую в serverless функциях
3. Требуется переработка кода

### Решение:
Используйте отдельный сервис для WebSocket (например, Pusher, Ably) или оставьте backend на Render.

## Устранение проблем с пустой страницей

1. **Проверьте консоль браузера** (F12) - там должны быть ошибки
2. **Проверьте переменные окружения** в Vercel:
   - `VITE_BACKEND_URL` должна быть установлена
   - После изменения переменных нужно пересобрать проект
3. **Проверьте структуру проекта**:
   - Убедитесь, что `frontend` - это корневая папка для Vercel
   - Или установите Root Directory в настройках Vercel

## Быстрая проверка

Откройте консоль браузера и проверьте:
- Есть ли ошибки JavaScript?
- Загружаются ли файлы (Network tab)?
- Какой URL используется для API (должен быть из переменной окружения)?

## Исправление ошибки "Network Error" при создании комнаты

Если вы видите ошибку "Network Error" при создании комнаты, выполните следующие шаги:

### 1. Настройка CORS на Render (Backend)

В настройках вашего сервиса на Render добавьте переменную окружения:

**Name**: `ALLOW_ALL_ORIGINS`  
**Value**: `true`

Или добавьте конкретный домен Vercel:

**Name**: `ALLOWED_ORIGINS`  
**Value**: `https://your-vercel-domain.vercel.app,https://strategy-game-4jwu.vercel.app`

**ВАЖНО**: После добавления переменной окружения перезапустите сервис на Render.

### 2. Проверка переменных окружения на Vercel

Убедитесь, что в настройках Vercel установлена переменная:
- **Name**: `VITE_BACKEND_URL`
- **Value**: `https://strategy-game-pvnb.onrender.com` (или ваш URL бэкенда)
- **Environment**: Production, Preview, Development

После изменения переменных:
1. Перейдите в **Deployments**
2. Найдите последний деплой
3. Нажмите **Redeploy** (три точки → Redeploy)

### 3. Проверка в консоли браузера

Откройте консоль браузера (F12) и проверьте:
- Какой URL используется для API запросов (должен быть ваш бэкенд URL)
- Есть ли ошибки CORS в консоли
- Что показывает Network tab при попытке создать комнату

### 4. Тестирование API напрямую

Попробуйте открыть в браузере:
```
https://strategy-game-pvnb.onrender.com/api/test
```

Должен вернуться JSON с сообщением "Backend is working!"

Если это не работает, проблема на стороне бэкенда.






