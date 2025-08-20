import { chromium } from '@playwright/test';

async function testPlaywright() {
  console.log('🚀 Тестируем Playwright MCP...');
  
  try {
    // Попробуем запустить браузер (используем системный chromium)
    const browser = await chromium.launch({ 
      headless: false,
      executablePath: '/snap/bin/chromium', // путь к системному chromium
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    console.log('✅ Браузер успешно запущен!');
    
    const page = await browser.newPage();
    console.log('✅ Новая страница создана!');
    
    // Перейдем на ваш проект
    await page.goto('http://localhost:5173/');
    console.log('✅ Перешли на http://localhost:5173/');
    
    // Сделаем скриншот
    await page.screenshot({ path: 'test-screenshot.png' });
    console.log('✅ Скриншот сохранен как test-screenshot.png');
    
    await browser.close();
    console.log('✅ Браузер закрыт!');
    
  } catch (error) {
    console.error('❌ Ошибка при тестировании Playwright:', error.message);
    
    if (error.message.includes('executable')) {
      console.log('💡 Нужно установить браузеры: npx playwright install');
    }
  }
}

testPlaywright();
