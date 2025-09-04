import React, { useState } from 'react';
import { Button } from './button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card';
import { Input } from './input';
import { Label } from './label';
import { Alert, AlertDescription } from './alert';
import { CheckCircle, AlertCircle, Loader2, Send } from 'lucide-react';

interface TelegramAuthFormData {
  id: string;
  first_name: string;
  last_name: string;
  username: string;
  photo_url: string;
  auth_date: string;
  hash: string;
}

/**
 * Форма для тестирования отправки данных авторизации на сервер
 */
export function TelegramAuthForm() {
  const [formData, setFormData] = useState<TelegramAuthFormData>({
    id: '123456789',
    first_name: 'Test',
    last_name: 'User',
    username: 'testuser',
    photo_url: '',
    auth_date: Math.floor(Date.now() / 1000).toString(),
    hash: 'test_hash_for_development'
  });

  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    data?: any;
  } | null>(null);

  const handleInputChange = (field: keyof TelegramAuthFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setResult(null);

    try {
      console.log('🔧 Отправляем данные на сервер:', formData);

      // Отправляем данные на сервер
      const response = await fetch('/api/telegram-auth-callback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          id: parseInt(formData.id),
          auth_date: parseInt(formData.auth_date)
        }),
      });

      const responseData = await response.json();
      console.log('📡 Ответ сервера:', responseData);

      if (response.ok) {
        setResult({
          success: true,
          message: 'Данные успешно отправлены на сервер!',
          data: responseData
        });
      } else {
        setResult({
          success: false,
          message: `Ошибка сервера: ${response.status} - ${responseData.message || 'Неизвестная ошибка'}`,
          data: responseData
        });
      }

    } catch (error) {
      console.error('❌ Ошибка при отправке:', error);
      setResult({
        success: false,
        message: `Ошибка сети: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const generateTestData = () => {
    const testId = Math.floor(Math.random() * 1000000000);
    const testHash = `test_hash_${Date.now()}`;
    
    setFormData({
      id: testId.toString(),
      first_name: `Test${testId % 100}`,
      last_name: `User${testId % 100}`,
      username: `testuser${testId % 100}`,
      photo_url: '',
      auth_date: Math.floor(Date.now() / 1000).toString(),
      hash: testHash
    });
  };

  const clearForm = () => {
    setFormData({
      id: '',
      first_name: '',
      last_name: '',
      username: '',
      photo_url: '',
      auth_date: Math.floor(Date.now() / 1000).toString(),
      hash: ''
    });
    setResult(null);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Send className="h-5 w-5" />
          Тест отправки данных авторизации
        </CardTitle>
        <CardDescription>
          Отправьте тестовые данные на сервер для проверки работы API
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="id">Telegram ID *</Label>
              <Input
                id="id"
                type="number"
                value={formData.id}
                onChange={(e) => handleInputChange('id', e.target.value)}
                placeholder="123456789"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="first_name">Имя *</Label>
              <Input
                id="first_name"
                type="text"
                value={formData.first_name}
                onChange={(e) => handleInputChange('first_name', e.target.value)}
                placeholder="Иван"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="last_name">Фамилия</Label>
              <Input
                id="last_name"
                type="text"
                value={formData.last_name}
                onChange={(e) => handleInputChange('last_name', e.target.value)}
                placeholder="Иванов"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                value={formData.username}
                onChange={(e) => handleInputChange('username', e.target.value)}
                placeholder="ivanov"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="photo_url">URL фото</Label>
              <Input
                id="photo_url"
                type="url"
                value={formData.photo_url}
                onChange={(e) => handleInputChange('photo_url', e.target.value)}
                placeholder="https://example.com/photo.jpg"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="auth_date">Дата авторизации *</Label>
              <Input
                id="auth_date"
                type="number"
                value={formData.auth_date}
                onChange={(e) => handleInputChange('auth_date', e.target.value)}
                placeholder="1234567890"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="hash">Hash *</Label>
              <Input
                id="hash"
                type="text"
                value={formData.hash}
                onChange={(e) => handleInputChange('hash', e.target.value)}
                placeholder="abc123hash"
                required
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button type="submit" disabled={isLoading} className="flex items-center gap-2">
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Отправка...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Отправить на сервер
                </>
              )}
            </Button>
            
            <Button 
              type="button" 
              variant="outline" 
              onClick={generateTestData}
              className="flex items-center gap-2"
            >
              Генерировать тестовые данные
            </Button>
            
            <Button 
              type="button" 
              variant="outline" 
              onClick={clearForm}
              className="flex items-center gap-2"
            >
              Очистить форму
            </Button>
          </div>
        </form>

        {/* Результат отправки */}
        {result && (
          <Alert variant={result.success ? "default" : "destructive"}>
            {result.success ? (
              <CheckCircle className="h-4 w-4" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}
            <AlertDescription>
              <div className="space-y-2">
                <p className="font-medium">{result.message}</p>
                {result.data && (
                  <details className="text-sm">
                    <summary className="cursor-pointer hover:underline">
                      Детали ответа
                    </summary>
                    <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto">
                      {JSON.stringify(result.data, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Информация о форме */}
        <div className="text-xs text-gray-500 space-y-1">
          <p><strong>Важно:</strong> Поля с * обязательны для заполнения</p>
          <p><strong>Hash:</strong> В продакшене должен быть валидным HMAC-SHA256</p>
          <p><strong>Дата:</strong> Unix timestamp в секундах</p>
          <p><strong>ID:</strong> Должен быть числом</p>
        </div>
      </CardContent>
    </Card>
  );
}

export default TelegramAuthForm;