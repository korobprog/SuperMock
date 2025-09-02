import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import logger from '../services/loggerService';

const router = express.Router();

/**
 * Маршрут для отображения содержимого файла payeer_2255324532.txt
 */
router.get('/payeer_2255324532.txt', (req: Request, res: Response) => {
  try {
    // Путь к файлу (можно настроить в зависимости от структуры проекта)
    const filePath = path.join(__dirname, '../../../payeer_2255324532.txt');
    
    // Проверяем существование файла
    if (!fs.existsSync(filePath)) {
      logger.warn(`Файл не найден: ${filePath}`);
      return res.status(404).json({ 
        error: 'Файл не найден',
        message: 'Файл payeer_2255324532.txt не существует на сервере'
      });
    }

    // Читаем содержимое файла
    const fileContent = fs.readFileSync(filePath, 'utf8');
    
    // Устанавливаем заголовки для отображения как текст
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Content-Disposition', 'inline');
    
    // Отправляем содержимое файла
    res.send(fileContent);
    
    logger.info(`Файл payeer_2255324532.txt успешно отправлен`);
    
  } catch (error) {
    logger.error('Ошибка при чтении файла:', error);
    res.status(500).json({ 
      error: 'Внутренняя ошибка сервера',
      message: 'Не удалось прочитать файл'
    });
  }
});

/**
 * Универсальный маршрут для отображения любых текстовых файлов
 */
router.get('/:filename', (req: Request, res: Response) => {
  try {
    const filename = req.params.filename;
    
    // Проверяем расширение файла для безопасности
    const allowedExtensions = ['.txt', '.md', '.json', '.xml', '.csv', '.log'];
    const fileExtension = path.extname(filename).toLowerCase();
    
    if (!allowedExtensions.includes(fileExtension)) {
      return res.status(400).json({ 
        error: 'Неподдерживаемый тип файла',
        message: 'Можно просматривать только текстовые файлы'
      });
    }
    
    // Путь к файлу
    const filePath = path.join(__dirname, '../../../', filename);
    
    // Проверяем существование файла
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ 
        error: 'Файл не найден',
        message: `Файл ${filename} не существует на сервере`
      });
    }

    // Читаем содержимое файла
    const fileContent = fs.readFileSync(filePath, 'utf8');
    
    // Определяем Content-Type на основе расширения
    let contentType = 'text/plain; charset=utf-8';
    if (fileExtension === '.json') contentType = 'application/json; charset=utf-8';
    else if (fileExtension === '.xml') contentType = 'application/xml; charset=utf-8';
    else if (fileExtension === '.csv') contentType = 'text/csv; charset=utf-8';
    
    // Устанавливаем заголовки
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', 'inline');
    
    // Отправляем содержимое файла
    res.send(fileContent);
    
    logger.info(`Файл ${filename} успешно отправлен`);
    
  } catch (error) {
    logger.error('Ошибка при чтении файла:', error);
    res.status(500).json({ 
      error: 'Внутренняя ошибка сервера',
      message: 'Не удалось прочитать файл'
    });
  }
});

export default router;
