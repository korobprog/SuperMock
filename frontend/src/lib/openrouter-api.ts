export interface OpenRouterModel {
  id: string;
  name: string;
  description: string;
  pricing: {
    prompt: string;
    completion: string;
  };
  context_length: number;
}

export interface OpenRouterRequest {
  model: string;
  messages: {
    role: 'system' | 'user' | 'assistant';
    content: string;
  }[];
  max_tokens?: number;
  temperature?: number;
}

export interface OpenRouterResponse {
  choices: {
    message: {
      content: string;
      role: string;
    };
    finish_reason: string;
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

// Бесплатные модели для собеседований
export const RECOMMENDED_MODELS: OpenRouterModel[] = [
  {
    id: 'meta-llama/llama-3.1-8b-instruct',
    name: 'Llama 3.1 8B Instruct',
    description: 'Отличная бесплатная модель от Meta',
    pricing: { prompt: 'Free', completion: 'Free' },
    context_length: 128000,
  },
  {
    id: 'meta-llama/llama-3.1-70b-instruct',
    name: 'Llama 3.1 70B Instruct',
    description: 'Мощная бесплатная модель с высоким качеством',
    pricing: { prompt: 'Free', completion: 'Free' },
    context_length: 128000,
  },
  {
    id: 'mistralai/mistral-7b-instruct',
    name: 'Mistral 7B Instruct',
    description: 'Быстрая бесплатная модель от Mistral AI',
    pricing: { prompt: 'Free', completion: 'Free' },
    context_length: 32768,
  },
  {
    id: 'qwen/qwen-2.5-7b-instruct',
    name: 'Qwen 2.5 7B Instruct',
    description: 'Современная бесплатная модель от Alibaba',
    pricing: { prompt: 'Free', completion: 'Free' },
    context_length: 131072,
  },
  {
    id: 'microsoft/phi-3-medium-128k-instruct',
    name: 'Phi-3 Medium 128K',
    description: 'Компактная бесплатная модель от Microsoft',
    pricing: { prompt: 'Free', completion: 'Free' },
    context_length: 128000,
  },
];

export class OpenRouterAPI {
  private apiKey: string;
  private baseUrl = 'https://openrouter.ai/api/v1';

  constructor(apiKey: string) {
    this.apiKey = (apiKey || '').trim();

    // Validate API key format
    if (!this.apiKey) {
      throw new Error('API ключ не может быть пустым');
    }

    if (!this.apiKey.startsWith('sk-or-')) {
      throw new Error(
        'Неверный формат API ключа. Ключ должен начинаться с "sk-or-"'
      );
    }

    if (this.apiKey.length < 20) {
      throw new Error('API ключ слишком короткий');
    }
  }

  async generateQuestions(
    profession: string,
    systemPrompt: string,
    userPrompt: string,
    model: string = 'meta-llama/llama-3.1-8b-instruct',
    count: number = 10,
    level: string = 'middle'
  ): Promise<string[]> {
    try {
      const formattedPrompt = userPrompt
        .replace('{count}', count.toString())
        .replace('{level}', level);

      const response = await this.makeRequest({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: formattedPrompt },
        ],
        max_tokens: 2000,
        temperature: 0.7,
      });

      const content = response.choices[0]?.message?.content || '';

      // Парсим ответ - разделяем по строкам и очищаем
      const questions = content
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line.length > 0 && !line.match(/^\d+\.?\s*/)) // убираем нумерацию
        .slice(0, count);

      return questions;
    } catch (error) {
      console.error('Error generating questions:', error);
      throw new Error(
        'Не удалось сгенерировать вопросы. Проверьте API ключ и подключение к интернету.'
      );
    }
  }

  async generateCodingTask(
    profession: string,
    systemPrompt: string,
    taskPrompt: string,
    model: string = 'meta-llama/llama-3.1-8b-instruct',
    level: string = 'middle'
  ): Promise<string> {
    try {
      const formattedPrompt = taskPrompt.replace('{level}', level);

      const response = await this.makeRequest({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: formattedPrompt },
        ],
        max_tokens: 1500,
        temperature: 0.7,
      });

      return response.choices[0]?.message?.content || '';
    } catch (error) {
      console.error('Error generating coding task:', error);
      throw new Error(
        'Не удалось сгенерировать задачу. Проверьте API ключ и подключение к интернету.'
      );
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      console.log('Testing OpenRouter API connection...');
      await this.makeRequest({
        model: 'meta-llama/llama-3.1-8b-instruct',
        messages: [{ role: 'user', content: 'Test connection' }],
        max_tokens: 10,
      });
      console.log('OpenRouter API connection successful');
      return true;
    } catch (error) {
      console.error('OpenRouter API connection test failed:', error);
      return false;
    }
  }

  private async makeRequest(
    request: OpenRouterRequest
  ): Promise<OpenRouterResponse> {
    console.log('Making OpenRouter API request:', {
      url: `${this.baseUrl}/chat/completions`,
      model: request.model,
      hasApiKey: !!this.apiKey,
      apiKeyPrefix: this.apiKey.substring(0, 10) + '...',
      apiKeyLength: this.apiKey.length,
    });

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
        'HTTP-Referer': window.location.origin,
        'X-Title': 'Super Mock Telegram',
      },
      body: JSON.stringify(request),
    });

    console.log('OpenRouter API response:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      console.error('OpenRouter API error details:', errorData);

      const errorMessage =
        errorData?.error?.message ||
        `HTTP ${response.status}: ${response.statusText}`;

      // Provide more specific error messages
      if (response.status === 401) {
        throw new Error(
          'Неверный API ключ OpenRouter. Проверьте ключ в настройках профиля.'
        );
      } else if (response.status === 403) {
        throw new Error('Доступ запрещен. Проверьте настройки API ключа.');
      } else if (response.status === 429) {
        throw new Error('Превышен лимит запросов. Попробуйте позже.');
      } else if (response.status >= 500) {
        throw new Error('Ошибка сервера OpenRouter. Попробуйте позже.');
      } else {
        throw new Error(errorMessage);
      }
    }

    return response.json();
  }
}

// Утилитарные функции
export function validateApiKey(apiKey: string): boolean {
  const k = (apiKey || '').trim();
  return k.startsWith('sk-or-') && k.length > 20;
}

export function formatModelPrice(model: OpenRouterModel): string {
  if (model.pricing.prompt === 'Free') {
    return 'Бесплатно';
  }
  return `${model.pricing.prompt}/1M токенов`;
}

export function getRecommendedModel(
  budget: 'free' | 'budget' | 'premium'
): string {
  switch (budget) {
    case 'free':
      return 'meta-llama/llama-3.1-8b-instruct';
    case 'budget':
      return 'meta-llama/llama-3.1-70b-instruct';
    case 'premium':
      return 'qwen/qwen-2.5-7b-instruct';
    default:
      return 'meta-llama/llama-3.1-8b-instruct';
  }
}
