# Система выбора профессий и инструментов

## Обзор

Система тайм-матчинга теперь включает функционал выбора профессий и связанных с ними инструментов/технологий. Это позволяет пользователям находить более релевантные слоты для собеседований на основе их профессиональных навыков.

## Основные компоненты

### 1. Структура данных

#### База данных

- **UserTool** - модель для хранения инструментов пользователей
  - `userId` - ID пользователя
  - `profession` - профессия
  - `toolName` - название инструмента
  - `category` - категория инструмента (frameworks, languages, databases, etc.)

#### Frontend данные

- **professions-data.ts** - содержит все профессии и их инструменты
- **PROFESSIONS_DATA** - объект с данными профессий
- **TOOL_CATEGORIES** - категории инструментов

### 2. Компоненты UI

#### ToolSelector

- Компонент для выбора инструментов
- Поддерживает поиск и фильтрацию по категориям
- Валидация минимального/максимального количества
- Группировка инструментов по категориям

#### PopularCombinations

- Отображает популярные комбинации инструментов
- Позволяет быстро выбрать готовые наборы
- Показывает пересечение с уже выбранными инструментами

#### SlotsWithTools

- Отображает слоты с учетом инструментов
- Фильтрация по строгости совпадения
- Показывает score совпадения и совпадающие инструменты

#### UserToolsDisplay

- Отображение инструментов пользователя в профиле
- Возможность редактирования (для своего профиля)

### 3. API Endpoints

#### POST /api/user-tools

Сохранение инструментов пользователя

```json
{
  "userId": 123,
  "profession": "frontend",
  "tools": ["react", "typescript", "tailwind"]
}
```

#### GET /api/user-tools

Получение инструментов пользователя

```
GET /api/user-tools?userId=123&profession=frontend
```

#### GET /api/slots/with-tools

Получение слотов с учетом инструментов

```
GET /api/slots/with-tools?role=candidate&profession=frontend&tools=react,typescript&matchStrictness=partial
```

### 4. Страницы

#### /tools

Страница выбора инструментов после выбора профессии

- Отображает доступные инструменты для выбранной профессии
- Показывает популярные комбинации
- Валидация выбора (минимум 2, максимум 7)

#### /time-with-tools

Страница выбора времени с умным поиском

- Фильтрация слотов по инструментам
- Показ score совпадения
- Два режима: умный поиск и все слоты

## Логика матчинга

### Уровни строгости совпадения

1. **any** - хотя бы 1 инструмент совпадает
2. **partial** - хотя бы 2 инструмента совпадают
3. **exact** - все инструменты должны совпадать

### Расчет score совпадения

```
matchScore = количество_совпадающих_инструментов / общее_количество_инструментов_пользователя
```

### Цветовая индикация

- 🟢 80-100% - Отличное совпадение
- 🟡 60-79% - Хорошее совпадение
- 🟠 40-59% - Среднее совпадение
- 🔴 0-39% - Слабое совпадение

## Профессии и инструменты

### Frontend Developer

- **Фреймворки**: React, Vue.js, Angular, Svelte, Next.js, Nuxt.js
- **Языки**: JavaScript, TypeScript, HTML, CSS
- **Инструменты**: Webpack, Vite, ESLint, Prettier, Tailwind CSS, Bootstrap, Sass

### Backend Developer

- **Языки**: JavaScript, TypeScript, Python, Java, C#, Go, PHP, Ruby
- **Фреймворки**: Node.js, Express.js, Django, Flask, Spring Boot, .NET, Laravel, Rails
- **Базы данных**: PostgreSQL, MySQL, MongoDB, Redis, SQLite
- **Инструменты**: Docker, Git, Postman, Swagger

### Full Stack Developer

- Комбинация инструментов Frontend и Backend разработчиков

### Mobile Developer

- **Платформы**: iOS, Android
- **Языки**: Swift, Kotlin, JavaScript, TypeScript, Dart
- **Фреймворки**: React Native, Flutter, Xamarin, Ionic
- **Инструменты**: Xcode, Android Studio, Firebase

### DevOps Engineer

- **Платформы**: AWS, Azure, Google Cloud, DigitalOcean
- **Инструменты**: Docker, Kubernetes, Jenkins, GitLab CI, GitHub Actions, Terraform, Ansible
- **Мониторинг**: Prometheus, Grafana, Nginx

### QA Engineer

- **Тестирование**: Selenium, Cypress, Playwright, Jest, PyTest, JUnit, Postman, JMeter
- **Языки**: Python, JavaScript, Java, SQL
- **Инструменты**: Jira, TestRail, Git, Docker

### UI/UX Designer

- **Дизайн**: Figma, Sketch, Adobe XD, Photoshop, Illustrator, InVision, Principle, Framer
- **Инструменты**: Miro, Notion, Slack, Zeplin

### Data Analyst

- **Языки**: SQL, Python, R
- **Инструменты**: Excel, Tableau, Power BI, Jupyter, Pandas, NumPy, Matplotlib, Seaborn
- **Аналитика**: Google Analytics, Mixpanel

### Data Scientist

- **Языки**: Python, R, SQL
- **ML/AI**: TensorFlow, PyTorch, Scikit-learn, Keras, OpenCV, NLTK, spaCy
- **Инструменты**: Jupyter, Google Colab, Pandas, NumPy, Matplotlib, Seaborn, Plotly, MLflow

### Product Manager

- **Инструменты**: Jira, Confluence, Notion, Slack, Figma, Miro, Trello, Asana
- **Аналитика**: Google Analytics, Mixpanel, Amplitude, Hotjar

## Популярные комбинации

Каждая профессия имеет предустановленные популярные комбинации инструментов:

### Frontend

- React + TypeScript + Tailwind CSS
- Vue.js + JavaScript + Bootstrap
- Angular + TypeScript + Sass
- Next.js + TypeScript + Tailwind CSS

### Backend

- Node.js + Express + PostgreSQL
- Python + Django + PostgreSQL
- Java + Spring Boot + MySQL
- C# + .NET + SQL Server

### Mobile

- iOS + Swift + Xcode
- Android + Kotlin + Android Studio
- React Native + JavaScript + Firebase
- Flutter + Dart + Firebase

## Использование

### 1. Выбор профессии

Пользователь выбирает профессию на странице `/profession`

### 2. Выбор инструментов

На странице `/tools` пользователь:

- Видит доступные инструменты для выбранной профессии
- Может выбрать популярные комбинации
- Выбирает минимум 2, максимум 7 инструментов

### 3. Умный поиск слотов

На странице `/time-with-tools`:

- Система фильтрует слоты по выбранным инструментам
- Показывает score совпадения
- Позволяет настроить строгость фильтрации

### 4. Редактирование профиля

В профиле пользователь может:

- Просматривать свои инструменты
- Редактировать выбор инструментов
- Видеть инструменты других пользователей

## Технические детали

### Миграция базы данных

```sql
-- Создание таблицы user_tools
CREATE TABLE "user_tools" (
    "id" SERIAL NOT NULL,
    "user_id" TEXT NOT NULL,
    "profession" TEXT NOT NULL,
    "tool_name" TEXT NOT NULL,
    "category" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "user_tools_pkey" PRIMARY KEY ("id")
);

-- Индексы для оптимизации
CREATE INDEX "user_tools_user_id_profession_idx" ON "user_tools"("user_id", "profession");
CREATE INDEX "user_tools_tool_name_profession_idx" ON "user_tools"("tool_name", "profession");
```

### Store обновления

Добавлены новые поля в Zustand store:

- `selectedTools: string[]` - выбранные инструменты
- `setSelectedTools: (tools: string[]) => void` - функция установки инструментов

### API интеграция

Все API функции поддерживают работу с инструментами:

- `apiSaveUserTools` - сохранение инструментов
- `apiGetUserTools` - получение инструментов
- `apiGetSlotsWithTools` - получение слотов с фильтрацией

## Будущие улучшения

1. **Статистика использования** - показ популярности инструментов
2. **Рекомендации** - AI-рекомендации инструментов на основе выбора
3. **Группировка по уровням** - junior/middle/senior инструменты
4. **Интеграция с GitHub** - автоматическое определение инструментов из репозиториев
5. **Уведомления** - уведомления о новых инструментах в профессии
6. **Экспорт/импорт** - возможность экспорта набора инструментов
7. **Версионирование** - поддержка версий инструментов (React 17, React 18)
8. **Географическая фильтрация** - поиск по регионам с определенными технологиями
