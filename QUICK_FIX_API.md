# Быстрое исправление ошибки API

## Проблема
- ✅ WebSocket подключен
- ❌ API показывает ошибку
- ❌ "Нет ответа от сервера" при создании комнаты

## Решение (выполните по порядку)

### 1. Проверьте консоль браузера (F12)

Откройте консоль и найдите:
- `API_URL value: ...` - какой URL используется
- `Environment VITE_BACKEND_URL: ...` - установлена ли переменная

**Если видите `http://localhost:8000`** - переменная окружения не установлена!

### 2. Установите переменную окружения на Vercel

1. Откройте [Vercel Dashboard](https://vercel.com/dashboard)
2. Выберите ваш проект
3. **Settings** → **Environment Variables**
4. Добавьте:
   - **Key**: `VITE_BACKEND_URL`
   - **Value**: `https://strategy-game-pvnb.onrender.com`
   - **Environment**: ✅ Production, ✅ Preview, ✅ Development
5. Сохраните
6. **Deployments** → последний деплой → **Redeploy** (три точки → Redeploy)

### 3. Настройте CORS на Render

1. Откройте [Render Dashboard](https://dashboard.render.com)
2. Выберите ваш сервис (Backend)
3. **Environment** → **Environment Variables**
4. Добавьте:
   - **Key**: `ALLOW_ALL_ORIGINS`
   - **Value**: `true`
5. Сохраните
6. **Manual Deploy** → **Clear build cache & deploy**

### 4. Проверьте работу API напрямую

Откройте в браузере:
```
https://strategy-game-pvnb.onrender.com/api/test
```

Должен вернуться JSON. Если не работает - проблема на Render.

### 5. Проверьте логи

**На Vercel:**
- **Deployments** → выберите деплой → **Functions** → проверьте логи

**На Render:**
- **Logs** → проверьте, есть ли ошибки CORS или другие

## Автоматическое исправление

Код теперь автоматически использует `https://strategy-game-pvnb.onrender.com` если переменная не установлена, но **лучше установить переменную правильно**!

## Если не помогло

1. Откройте консоль браузера (F12)
2. Попробуйте создать комнату
3. Скопируйте все логи из консоли
4. Проверьте Network tab - какой запрос отправляется и какой ответ приходит

