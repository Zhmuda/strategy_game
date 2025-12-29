# Настройка автоматического деплоя через GitHub Actions

## Шаг 1: Получение Vercel токенов

1. Перейдите на https://vercel.com/account/tokens
2. Создайте новый токен
3. Скопируйте токен

4. Перейдите в настройки проекта Vercel
5. Найдите **General** → **Project ID** - скопируйте
6. Найдите **General** → **Team ID** (или **Org ID**) - скопируйте

## Шаг 2: Получение Render API ключа

1. Перейдите на https://dashboard.render.com/
2. Перейдите в **Account Settings** → **API Keys**
3. Создайте новый API ключ
4. Скопируйте ключ

5. Найдите ваш сервис на Render
6. В настройках сервиса найдите **Service ID** - скопируйте

## Шаг 3: Добавление секретов в GitHub

1. Перейдите в ваш репозиторий на GitHub
2. Перейдите в **Settings** → **Secrets and variables** → **Actions**
3. Добавьте следующие секреты:

### Для Vercel:
- `VERCEL_TOKEN` - токен из шага 1
- `VERCEL_ORG_ID` - Team/Org ID из шага 1
- `VERCEL_PROJECT_ID` - Project ID из шага 1
- `VITE_BACKEND_URL` - `https://strategy-game-pvnb.onrender.com`

### Для Render:
- `RENDER_API_KEY` - API ключ из шага 2
- `RENDER_SERVICE_ID` - Service ID из шага 2

## Шаг 4: Активация

После добавления всех секретов:
1. Сделайте commit и push в main ветку
2. GitHub Actions автоматически запустится
3. Проверьте статус в **Actions** tab

## Альтернатива: Ручной деплой через скрипты

Если GitHub Actions не подходит, используйте скрипты из папки `scripts/`

