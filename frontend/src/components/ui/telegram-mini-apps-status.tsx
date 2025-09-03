import React, { useState, useEffect } from 'react';
import { useAppStore } from '@/lib/store';

export function TelegramMiniAppsStatus() {
  const [webAppData, setWebAppData] = useState<any>(null);
  const [isInTelegramMiniApps, setIsInTelegramMiniApps] = useState(false);
  const { telegramUser, userId } = useAppStore();

  useEffect(() => {
    const checkTelegramMiniApps = () => {
      if (window.Telegram?.WebApp) {
        const tg = window.Telegram.WebApp;
        setIsInTelegramMiniApps(true);
        
        setWebAppData({
          initData: tg.initData,
          initDataUnsafe: tg.initDataUnsafe,
          version: tg.version,
          platform: tg.platform,
          colorScheme: tg.colorScheme,
          ready: tg.ready,
          isExpanded: tg.isExpanded,
          viewportHeight: tg.viewportHeight,
          viewportStableHeight: tg.viewportStableHeight,
        });
      } else {
        setIsInTelegramMiniApps(false);
      }
    };

    checkTelegramMiniApps();
  }, []);

  if (!isInTelegramMiniApps) {
    return null;
  }

  return (
    <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
      <h3 className="text-sm font-medium text-yellow-800 mb-2">
        🔧 Статус Telegram Mini Apps
      </h3>
      
      <div className="space-y-2 text-xs">
        <div>
          <strong>В Telegram Mini Apps:</strong> ✅ Да
        </div>
        
        <div>
          <strong>Версия:</strong> {webAppData?.version || 'Неизвестно'}
        </div>
        
        <div>
          <strong>Платформа:</strong> {webAppData?.platform || 'Неизвестно'}
        </div>
        
        <div>
          <strong>Готов:</strong> {webAppData?.ready ? '✅ Да' : '❌ Нет'}
        </div>
        
        <div>
          <strong>Развернут:</strong> {webAppData?.isExpanded ? '✅ Да' : '❌ Нет'}
        </div>
        
        <div>
          <strong>initData:</strong> {webAppData?.initData ? '✅ Есть' : '❌ Нет'}
        </div>
        
        <div>
          <strong>initDataUnsafe.user:</strong> {webAppData?.initDataUnsafe?.user ? '✅ Есть' : '❌ Нет'}
        </div>
        
        <div>
          <strong>telegramUser в store:</strong> {telegramUser ? '✅ Есть' : '❌ Нет'}
        </div>
        
        <div>
          <strong>userId в store:</strong> {userId ? `✅ ${userId}` : '❌ Нет'}
        </div>
        
        {webAppData?.initDataUnsafe?.user && (
          <div className="mt-2 p-2 bg-green-100 rounded">
            <strong>Данные пользователя Telegram:</strong>
            <pre className="text-xs mt-1">
              {JSON.stringify(webAppData.initDataUnsafe.user, null, 2)}
            </pre>
          </div>
        )}
        
        {webAppData?.initData && (
          <div className="mt-2 p-2 bg-blue-100 rounded">
            <strong>initData (первые 100 символов):</strong>
            <div className="text-xs mt-1 font-mono break-all">
              {webAppData.initData.substring(0, 100)}...
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
