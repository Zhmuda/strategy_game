// Конфигурация API
const getBackendUrl = () => {
  // В продакшене используем переменную окружения, в разработке - localhost
  const envUrl = import.meta.env.VITE_BACKEND_URL
  if (envUrl) {
    console.log('✅ Using backend URL from env:', envUrl)
    return envUrl
  }
  
  // Если переменная не установлена, пытаемся определить по текущему домену
  const currentHost = window.location.hostname
  const isProduction = currentHost.includes('vercel.app') || currentHost.includes('netlify.app') || currentHost.includes('github.io')
  
  if (isProduction) {
    // В продакшене используем Render бэкенд по умолчанию
    const defaultBackend = 'https://strategy-game-pvnb.onrender.com'
    console.warn('⚠️ VITE_BACKEND_URL not set! Using default:', defaultBackend)
    console.warn('⚠️ Please set VITE_BACKEND_URL environment variable in Vercel settings!')
    return defaultBackend
  }
  
  console.log('Using default backend URL: http://localhost:8000')
  return 'http://localhost:8000'
}

const getWsUrl = () => {
  const backendUrl = getBackendUrl()
  // Заменяем http:// на ws:// и https:// на wss://
  let wsUrl
  if (backendUrl.startsWith('https://')) {
    wsUrl = backendUrl.replace('https://', 'wss://')
  } else {
    wsUrl = backendUrl.replace('http://', 'ws://')
  }
  console.log('WebSocket URL:', wsUrl)
  return wsUrl
}

export const API_URL = getBackendUrl()
export const WS_URL = getWsUrl()

