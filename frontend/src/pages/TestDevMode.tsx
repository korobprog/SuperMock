import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAppStore } from '@/lib/store';
import { getDemoToolsForProfession } from '@/lib/dev-api-fallback';

export function TestDevMode() {
  const [testResults, setTestResults] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const userId = useAppStore((s) => s.userId);
  const profession = useAppStore((s) => s.profession);

  const addResult = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const runTests = async () => {
    setIsLoading(true);
    setTestResults([]);

    // Тест 1: Проверка dev режима
    addResult('🔍 Проверка dev режима...');
    if (import.meta.env.DEV) {
      addResult('✅ Dev режим активен');
    } else {
      addResult('❌ Dev режим не активен');
    }

    // Тест 2: Проверка userId
    addResult('🔍 Проверка userId...');
    if (userId) {
      addResult(`✅ userId: ${userId}`);
    } else {
      addResult('❌ userId не установлен');
    }

    // Тест 3: Проверка профессии
    addResult('🔍 Проверка профессии...');
    if (profession) {
      addResult(`✅ Профессия: ${profession}`);
    } else {
      addResult('❌ Профессия не установлена');
    }

    // Тест 4: Проверка демо инструментов
    addResult('🔍 Проверка демо инструментов...');
    const demoTools = getDemoToolsForProfession(profession);
    addResult(`✅ Демо инструменты: ${demoTools.join(', ')}`);

    // Тест 5: Проверка backend
    addResult('🔍 Проверка backend...');
    try {
      const response = await fetch('http://localhost:3000/api/health');
      if (response.ok) {
        addResult('✅ Backend доступен');
      } else {
        addResult('❌ Backend недоступен');
      }
    } catch (error) {
      addResult('✅ Backend недоступен (ожидаемо в dev режиме)');
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-telegram-light-gray p-4">
      <div className="max-w-4xl mx-auto pt-16 sm:pt-20">
        <Card>
          <CardHeader>
            <CardTitle>🧪 Тест Dev режима</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex gap-2">
                <Button onClick={runTests} disabled={isLoading}>
                  {isLoading ? 'Запуск тестов...' : 'Запустить тесты'}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setTestResults([])}
                >
                  Очистить
                </Button>
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-semibold">Результаты тестов:</h3>
                <div className="bg-muted p-4 rounded-lg max-h-96 overflow-y-auto">
                  {testResults.length === 0 ? (
                    <p className="text-muted-foreground">Нажмите "Запустить тесты" для начала</p>
                  ) : (
                    <div className="space-y-1">
                      {testResults.map((result, index) => (
                        <div key={index} className="text-sm font-mono">
                          {result}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-semibold">Текущее состояние:</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge variant={import.meta.env.DEV ? "default" : "secondary"}>
                        {import.meta.env.DEV ? "DEV" : "PROD"}
                      </Badge>
                      <span>Режим</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={userId ? "default" : "secondary"}>
                        {userId ? "✅" : "❌"}
                      </Badge>
                      <span>User ID: {userId || 'не установлен'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={profession ? "default" : "secondary"}>
                        {profession ? "✅" : "❌"}
                      </Badge>
                      <span>Профессия: {profession || 'не выбрана'}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-sm">
                      <strong>Демо инструменты:</strong>
                      <div className="mt-1">
                        {getDemoToolsForProfession(profession).map((tool, index) => (
                          <Badge key={index} variant="outline" className="mr-1 mb-1">
                            {tool}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
