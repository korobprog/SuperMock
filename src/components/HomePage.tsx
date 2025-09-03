'use client';

import Link from 'next/link';

const HomePage = () => {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Hero Section */}
      <section className="relative py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent">
              SuperMock
            </h1>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-8">
              Платформа для подготовки к IT-интервью с использованием 
              искусственного интеллекта и экспертных знаний
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="https://app.supermock.ru"
                target="_blank"
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-medium transition-colors"
              >
                Начать бесплатно
              </Link>
              <Link
                href="/about"
                className="border border-gray-600 hover:border-gray-500 text-white px-8 py-3 rounded-lg font-medium transition-colors"
              >
                Узнать больше
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-gray-800/50">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-6 text-blue-400">
              Возможности платформы
            </h2>
            <p className="text-lg text-gray-300 max-w-2xl mx-auto">
              10+ профессий, 6 языков, AI-анализ и инновационные тренажеры
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                title: '10+ профессий',
                description: 'Frontend, Backend, Fullstack, Mobile, DevOps, QA, UX/UI Designer, Data Analyst, Data Scientist, Product Manager',
                icon: '💼'
              },
              {
                title: '6 языков интервью',
                description: 'Проводите интервью на английском, русском, испанском, французском, немецком и китайском языках',
                icon: '🌍',
                link: '/languages'
              },
              {
                title: 'AI-анализ',
                description: 'Умный подбор кандидатов и интервьюеров по языку, технологиям, профессии и инструментам',
                icon: '🤖'
              },
              {
                title: 'Практические задания',
                description: 'Кодинг, теория, алгоритмы с AI-подсказками и прогресс-трекингом',
                icon: '⚡'
              },
              {
                title: 'Командные проекты',
                description: 'Научитесь командной работе в реальных проектах. Совместная разработка, code review и agile-методологии',
                icon: '👥'
              },
              {
                title: 'Поэтапные материалы',
                description: 'Полная библиотека материалов для обучения: основы, продвинутые темы, практические задачи',
                icon: '📚'
              }
            ].map((feature, index) => (
              <div
                key={index}
                className="bg-gray-800 rounded-xl p-6 hover:bg-gray-700 transition-all duration-300 group"
              >
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold mb-3 group-hover:text-blue-400 transition-colors">
                  {feature.title}
                </h3>
                <p className="text-gray-400 mb-4">{feature.description}</p>
                {feature.link && (
                  <Link
                    href={feature.link}
                    className="inline-block text-blue-400 hover:text-blue-300 font-medium transition-colors"
                  >
                    Узнать больше →
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-4xl font-bold mb-6">
            Готовы начать свой путь к успешной карьере?
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            Присоединяйтесь к тысячам разработчиков, которые уже используют 
            SuperMock для подготовки к интервью
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="https://app.supermock.ru"
              target="_blank"
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-medium transition-colors"
            >
              Начать бесплатно
            </Link>
            <Link
              href="/about"
              className="border border-gray-600 hover:border-gray-500 text-white px-8 py-3 rounded-lg font-medium transition-colors"
            >
              О нас
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
