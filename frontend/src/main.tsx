import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import './styles/telegram-desktop-fixes.css';
import './lib/i18n-config'; // Инициализация i18next

createRoot(document.getElementById('root')!).render(<App />);
