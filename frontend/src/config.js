// Конфигурация API
const getBackendUrl = () => {
  // В продакшене используем переменную окружения, в разработке - localhost
  const envUrl = import.meta.env.VITE_BACKEND_URL
  if (envUrl) {
    console.log('Using backend URL from env:', envUrl)
    return envUrl
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

