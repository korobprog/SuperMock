// Полифил для global, чтобы исправить ошибку "ReferenceError: global is not defined"
if (typeof global === 'undefined') {
  window.global = window;
}

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import App from './App';

// Добавим отладочный лог для проверки загрузки
console.log('main.tsx загружен');

createRoot(document.getElementById('root') as HTMLElement).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>
);
