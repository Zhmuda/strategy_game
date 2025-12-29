import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

// Обработка ошибок рендеринга
try {
  const root = ReactDOM.createRoot(document.getElementById('root'))
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  )
} catch (error) {
  console.error('Failed to render app:', error)
  document.getElementById('root').innerHTML = `
    <div style="padding: 20px; text-align: center;">
      <h1>Ошибка загрузки приложения</h1>
      <p>${error.message}</p>
      <p style="font-size: 12px; color: #666;">Проверьте консоль браузера для деталей</p>
    </div>
  `
}


