'use client';

import React from 'react';

const LanguagesPage = () => {
  const languageData = [
    {
      code: 'en',
      name: 'English',
      nativeName: 'Английский язык',
      flag: '🇺🇸'
    },
    {
      code: 'ru',
      name: 'Russian',
      nativeName: 'Русский язык',
      flag: '🇷🇺'
    },
    {
      code: 'es',
      name: 'Spanish',
      nativeName: 'Испанский язык',
      flag: '🇪🇸'
    },
    {
      code: 'fr',
      name: 'French',
      nativeName: 'Французский язык',
      flag: '🇫🇷'
    },
    {
      code: 'de',
      name: 'German',
      nativeName: 'Немецкий язык',
      flag: '🇩🇪'
    },
    {
      code: 'zh',
      name: 'Chinese',
      nativeName: 'Китайский язык',
      flag: '🇨🇳'
    }
  ];

  const features = [
    {
      title: 'Глобальный доступ',
      description: 'Подготовка к собеседованиям на 6 основных языках мира',
      icon: '🌍'
    },
    {
      title: 'Ваши коллеги с Вашим стеком и языком',
      description: 'Выбирай время в течение дня',
      icon: '🎯'
    },
    {
      title: 'Естественное общение',
      description: 'Комфортное общение на родном языке без языковых барьеров',
      icon: '💬'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header Section */}
      <section className="relative py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              <span className="text-white">Поддерживаемые </span>
              <span className="bg-gradient-to-r from-purple-400 to-blue-500 bg-clip-text text-transparent">
                языки
              </span>
            </h1>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Проходите собеседования на родном языке
            </p>
          </div>
        </div>
      </section>

      {/* Language Selection Cards */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {languageData.map((language, index) => (
              <div
                key={index}
                className="bg-gray-800 rounded-xl p-6 hover:bg-gray-700 transition-all duration-300 group border border-gray-700 hover:border-gray-600"
              >
                <div className="text-center mb-6">
                  <div className="text-6xl mb-4">{language.flag}</div>
                  <h3 className="text-2xl font-bold mb-2 text-white">
                    {language.name}
                  </h3>
                  <p className="text-lg text-gray-300">
                    {language.nativeName}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Highlight Section */}
      <section className="py-20 px-4 bg-gray-800/50">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-gray-800 rounded-xl p-6 hover:bg-gray-700 transition-all duration-300 group"
              >
                <div className="text-4xl mb-4 text-center">{feature.icon}</div>
                <h3 className="text-xl font-semibold mb-3 text-center text-white group-hover:text-blue-400 transition-colors">
                  {feature.title}
                </h3>
                <p className="text-gray-400 text-center">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-4xl font-bold mb-6 text-white">
            Выберите язык и начните обучение
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            Подготовьтесь к собеседованию на любом из 6 поддерживаемых языков
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="https://app.supermock.ru"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-8 py-3 rounded-lg font-medium transition-all duration-300"
            >
              Начать обучение
            </a>
            <a
              href="/about"
              className="text-blue-400 hover:text-blue-300 font-medium transition-colors flex items-center"
            >
              → Процесс обучения
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LanguagesPage;
