import React from 'react';
import TelegramLoginButton from 'react-telegram-login';

export function TelegramLoginButtonComponent({ 
  botName, 
  onAuth, 
  className = '',
  user = null,
  onLogout = null
}) {
  
  const handleTelegramResponse = (response) => {
    console.log('🔧 TelegramLoginButton: Получен ответ от Telegram:', response);
    
    // Преобразуем ответ в нужный формат
    const telegramUser = {
      id: response.id,
      first_name: response.first_name,
      last_name: response.last_name,
      username: response.username,
      photo_url: response.photo_url,
      auth_date: response.auth_date,
      hash: response.hash
    };
    
    console.log('🔧 TelegramLoginButton: Преобразованный пользователь:', telegramUser);
    
    // Вызываем callback с данными пользователя
    onAuth(telegramUser);
  };

  // Если пользователь авторизован, показываем его профиль
  if (user) {
    return (
      <div className={`bg-white border border-gray-200 rounded-lg p-4 ${className}`}>
        <div className="flex items-center justify-between">
          {/* Левая часть - информация о пользователе */}
          <div className="flex items-center space-x-3">
            {/* Аватар пользователя */}
            <div className="w-10 h-10 rounded-full overflow-hidden bg-blue-100 flex items-center justify-center">
              {user.photo_url ? (
                <img 
                  src={user.photo_url} 
                  alt={`${user.first_name} ${user.last_name || ''}`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              )}
            </div>
            
            {/* Информация о пользователе */}
            <div className="flex flex-col">
              <span className="font-medium text-gray-900 text-sm">
                {user.first_name} {user.last_name || ''}
              </span>
              <span className="text-gray-500 text-xs">
                @{user.username || `user${user.id}`}
              </span>
              <div className="flex items-center space-x-1 mt-1">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-green-600 text-xs font-medium">онлайн</span>
              </div>
            </div>
          </div>
          
          {/* Правая часть - иконки действий */}
          <div className="flex items-center space-x-3">
            {/* Уведомления */}
            <button className="text-gray-400 hover:text-gray-600 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM4.19 4.47A19.916 19.916 0 0112 2c5.523 0 10 3.58 10 8v3l-2 2v-5c0-4.42-4.477-8-10-8s-10 3.58-10 8v5l2-2v-3c0-1.89.64-3.63 1.72-5.06z" />
              </svg>
            </button>
            
            {/* Настройки */}
            <button className="text-gray-400 hover:text-gray-600 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
            
            {/* Язык/регион */}
            <button className="text-gray-400 hover:text-gray-600 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
            
            {/* Флаг России */}
            <div className="w-5 h-3 bg-gradient-to-b from-red-500 via-blue-500 to-white rounded-sm"></div>
            
            {/* Выпадающее меню */}
            <button className="text-gray-400 hover:text-gray-600 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {/* Кнопка выхода */}
            {onLogout && (
              <button 
                onClick={onLogout}
                className="text-gray-400 hover:text-red-600 transition-colors"
                title="Выйти"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Если пользователь не авторизован, показываем кнопку авторизации
  return (
    <div className={className}>
      <div className="text-center mb-4">
        <p className="text-sm text-gray-600 mb-3">
          Нажмите кнопку ниже для авторизации через Telegram
        </p>
      </div>
      
      {/* Telegram Login Button с правильными параметрами */}
      <div className="flex justify-center">
        <TelegramLoginButton
          dataOnauth={handleTelegramResponse}
          botName={botName}
          dataSize="large"
          dataRadius="8"
          dataRequestAccess="write"
          dataUserpic="false"
          dataLang="ru"
        />
      </div>
      
      {/* Информация о безопасности */}
      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="text-center">
          <p className="text-sm text-blue-800 mb-2">
            🔐 Безопасная авторизация через Telegram
          </p>
          <p className="text-xs text-blue-600">
            Ваши данные защищены официальным API Telegram. 
            Мы не получаем доступ к вашему паролю или личным сообщениям.
          </p>
        </div>
      </div>
      
      {/* Примечание о домене и порте */}
      <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-xs text-yellow-700 text-center">
          ⚠️ <strong>Важно:</strong> Виджет работает только на зарегистрированных доменах (не localhost) 
          и требует порт 80. Для разработки используйте тестовый домен или настройте hosts файл.
        </p>
      </div>
      
      {/* Дополнительная информация о настройке */}
      <div className="mt-2 p-2 bg-gray-50 border border-gray-200 rounded-lg">
        <p className="text-xs text-gray-600 text-center">
          📝 <strong>Настройка:</strong> Зарегистрируйте домен у @BotFather и добавьте в настройки бота.
          Для локальной разработки можно использовать <code>yourdomain.local</code> в hosts файле.
        </p>
      </div>
    </div>
  );
}
