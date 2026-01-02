# Исправление ошибки "Network Error" при создании комнаты

## Проблема
- ✅ WebSocket подключен
- ❌ API показывает ошибку
- ❌ При создании комнаты: "Network Error"

## Решение

### Шаг 1: Настройка CORS на Render (Backend)

1. Откройте ваш проект на [Render.com](https://render.com)
2. Перейдите в настройки вашего сервиса (Backend)
3. Найдите раздел **Environment Variables**
4. Добавьте новую переменную:
   - **Key**: `ALLOW_ALL_ORIGINS`
   - **Value**: `true`
5. Сохраните и **перезапустите** сервис (Manual Deploy → Clear build cache & deploy)

### Шаг 2: Проверка переменных на Vercel (Frontend)

1. Откройте ваш проект на [Vercel.com](https://vercel.com)
2. Перейдите в **Settings** → **Environment Variables**
3. Убедитесь, что есть переменная:
   - **Name**: `VITE_BACKEND_URL`
   - **Value**: `https://strategy-game-pvnb.onrender.com` (или ваш URL бэкенда)
   - **Environment**: Production, Preview, Development (все отмечены)
4. Если переменной нет - добавьте её
5. Перейдите в **Deployments** → найдите последний деплой → **Redeploy**

### Шаг 3: Проверка работы

1. Откройте сайт на Vercel
2. Откройте консоль браузера (F12)
3. Попробуйте создать комнату
4. В консоли должны появиться логи:
   - `Creating room with API_URL: ...`
   - `Request URL: ...`
   - Если ошибка - будет детальная информация

### Шаг 4: Тестирование API напрямую

Откройте в браузере:
```
https://strategy-game-pvnb.onrender.com/api/test
```

Должен вернуться JSON:
```json
{
  "message": "Backend is working!",
  "api_url": "OK",
  ...
}
```

Если не работает - проблема на стороне Render, проверьте логи сервиса.

## Альтернативное решение (если не помогло)

Если проблема сохраняется, добавьте на Render переменную `ALLOWED_ORIGINS` с конкретным доменом:

**Key**: `ALLOWED_ORIGINS`  
**Value**: `https://your-vercel-domain.vercel.app,https://strategy-game-4jwu.vercel.app`

(Замените `your-vercel-domain` на ваш реальный домен Vercel)

После этого перезапустите сервис на Render.

