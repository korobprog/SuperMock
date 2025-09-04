import { useEffect } from 'react';

interface YandexMetrikaProps {
  counterId: number;
}

export const YandexMetrika: React.FC<YandexMetrikaProps> = ({ counterId }) => {
  useEffect(() => {
    // Проверяем, что Яндекс.Метрика еще не загружена
    if (window.ym) {
      return;
    }

    // Создаем функцию ym если её нет
    (window as any).ym = function() {
      (window as any).ym.a = (window as any).ym.a || [];
      (window as any).ym.a.push(arguments);
    };

    // Инициализируем счетчик
    (window as any).ym(counterId, 'init', {
      ssr: true,
      webvisor: true,
      clickmap: true,
      ecommerce: "dataLayer",
      accurateTrackBounce: true,
      trackLinks: true
    });

    // Загружаем скрипт Яндекс.Метрики
    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.async = true;
    script.src = `https://mc.yandex.ru/metrika/tag.js?id=${counterId}`;
    
    const firstScript = document.getElementsByTagName('script')[0];
    firstScript.parentNode?.insertBefore(script, firstScript);

    // Добавляем noscript для пользователей без JavaScript
    const noscript = document.createElement('noscript');
    const div = document.createElement('div');
    const img = document.createElement('img');
    img.src = `https://mc.yandex.ru/watch/${counterId}`;
    img.style.position = 'absolute';
    img.style.left = '-9999px';
    img.alt = '';
    
    div.appendChild(img);
    noscript.appendChild(div);
    document.head.appendChild(noscript);

    return () => {
      // Очистка при размонтировании
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
      if (noscript.parentNode) {
        noscript.parentNode.removeChild(noscript);
      }
    };
  }, [counterId]);

  return null; // Компонент не рендерит ничего
};
