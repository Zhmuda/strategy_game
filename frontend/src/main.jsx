import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

console.log('main.jsx loaded')

// Обработка ошибок рендеринга
try {
  const rootElement = document.getElementById('root')
  if (!rootElement) {
    throw new Error('Root element not found')
  }
  
  console.log('Root element found, creating React root...')
  const root = ReactDOM.createRoot(rootElement)
  
  console.log('Rendering App component...')
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  )
  console.log('App rendered successfully')
} catch (error) {
  console.error('Failed to render app:', error)
  const rootElement = document.getElementById('root')
  if (rootElement) {
    rootElement.innerHTML = `
      <div style="padding: 20px; text-align: center; background: #ffebee; color: #c62828; border-radius: 8px; margin: 20px;">
        <h1>❌ Ошибка загрузки приложения</h1>
        <p><strong>${error.message}</strong></p>
        <p style="font-size: 12px; color: #666; margin-top: 15px;">
          Проверьте консоль браузера (F12) для деталей<br/>
          Убедитесь, что все файлы загружены правильно
        </p>
        <button onclick="window.location.reload()" style="margin-top: 15px; padding: 10px 20px; background: #667eea; color: white; border: none; border-radius: 6px; cursor: pointer;">
          🔄 Перезагрузить
        </button>
      </div>
    `
  }
}


