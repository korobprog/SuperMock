'use client';

import { useState } from 'react';

interface TeamMember {
  name: string;
  role: string;
  description: string;
  avatar: string;
}

interface Milestone {
  year: string;
  title: string;
  description: string;
}

const About = () => {
  const [activeTab, setActiveTab] = useState('mission');

  const teamMembers: TeamMember[] = [
    {
      name: 'Алексей Петров',
      role: 'CEO & Основатель',
      description: '10+ лет опыта в IT-рекрутинге и разработке HR-технологий',
      avatar: '/media/logo_main.png'
    },
    {
      name: 'Мария Сидорова',
      role: 'CTO',
      description: 'Эксперт по AI и машинному обучению, бывший технический директор в крупных IT-компаниях',
      avatar: '/media/logo_main.png'
    },
    {
      name: 'Дмитрий Козлов',
      role: 'Head of Product',
      description: 'Специалист по UX/UI и продуктовой стратегии с опытом в EdTech',
      avatar: '/media/logo_main.png'
    },
    {
      name: 'Анна Волкова',
      role: 'Lead Developer',
      description: 'Full-stack разработчик с экспертизой в создании масштабируемых платформ',
      avatar: '/media/logo_main.png'
    }
  ];

  const milestones: Milestone[] = [
    {
      year: '2023',
      title: 'Основание проекта',
      description: 'Идея создания платформы для подготовки к IT-интервью'
    },
    {
      year: '2024',
      title: 'MVP запуск',
      description: 'Первая версия платформы с базовым функционалом'
    },
    {
      year: '2024',
      title: 'AI интеграция',
      description: 'Добавление искусственного интеллекта для анализа интервью'
    },
    {
      year: '2025',
      title: 'Международная экспансия',
      description: 'Поддержка 6 языков и выход на международные рынки'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Hero Section */}
      <section className="relative py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent">
              О нас
            </h1>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Мы создаем будущее IT-рекрутинга, объединяя искусственный интеллект 
              с человеческим опытом для подготовки лучших специалистов
            </p>
          </div>
        </div>
      </section>

      {/* Navigation Tabs */}
      <section className="py-8 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-wrap justify-center gap-2 mb-12">
            {[
              { id: 'mission', label: 'Миссия' },
              { id: 'team', label: 'Команда' },
              { id: 'story', label: 'История' },
              { id: 'values', label: 'Ценности' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-3 rounded-lg font-medium transition-all duration-300 ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Content Sections */}
      <section className="py-12 px-4">
        <div className="container mx-auto max-w-6xl">
          {/* Mission Tab */}
          {activeTab === 'mission' && (
            <div className="space-y-12">
              <div className="grid md:grid-cols-2 gap-12 items-center">
                <div>
                  <h2 className="text-4xl font-bold mb-6 text-blue-400">
                    Наша миссия
                  </h2>
                  <p className="text-lg text-gray-300 mb-6">
                    Демократизировать доступ к качественной подготовке к IT-интервью, 
                    используя передовые технологии искусственного интеллекта и 
                    экспертные знания индустрии.
                  </p>
                  <p className="text-lg text-gray-300 mb-6">
                    Мы верим, что каждый талантливый разработчик заслуживает 
                    равных возможностей для успешной карьеры в технологической сфере.
                  </p>
                  <div className="grid grid-cols-2 gap-6 mt-8">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-blue-400 mb-2">10+</div>
                      <div className="text-gray-400">Профессий</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-purple-400 mb-2">6</div>
                      <div className="text-gray-400">Языков</div>
                    </div>
                  </div>
                </div>
                <div className="bg-gradient-to-br from-blue-600/20 to-purple-600/20 rounded-2xl p-8">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-4">
                      <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
                      <span className="text-lg">AI-анализ интервью</span>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="w-3 h-3 bg-purple-400 rounded-full"></div>
                      <span className="text-lg">Персонализированное обучение</span>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                      <span className="text-lg">Практические задания</span>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                      <span className="text-lg">Командные проекты</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Team Tab */}
          {activeTab === 'team' && (
            <div className="space-y-12">
              <div className="text-center mb-12">
                <h2 className="text-4xl font-bold mb-6 text-blue-400">
                  Наша команда
                </h2>
                <p className="text-lg text-gray-300 max-w-2xl mx-auto">
                  Эксперты в области IT-рекрутинга, искусственного интеллекта и 
                  разработки программного обеспечения
                </p>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                {teamMembers.map((member, index) => (
                  <div
                    key={index}
                    className="bg-gray-800 rounded-xl p-6 hover:bg-gray-700 transition-all duration-300 group"
                  >
                    <div className="text-center">
                      <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-blue-400 to-purple-600 p-1">
                        <div className="w-full h-full rounded-full bg-gray-800 flex items-center justify-center">
                          <img
                            src={member.avatar}
                            alt={member.name}
                            className="w-16 h-16 rounded-full object-cover"
                          />
                        </div>
                      </div>
                      <h3 className="text-xl font-semibold mb-2 group-hover:text-blue-400 transition-colors">
                        {member.name}
                      </h3>
                      <p className="text-blue-400 font-medium mb-3">{member.role}</p>
                      <p className="text-gray-400 text-sm">{member.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Story Tab */}
          {activeTab === 'story' && (
            <div className="space-y-12">
              <div className="text-center mb-12">
                <h2 className="text-4xl font-bold mb-6 text-blue-400">
                  Наша история
                </h2>
                <p className="text-lg text-gray-300 max-w-2xl mx-auto">
                  От идеи до ведущей платформы подготовки к IT-интервью
                </p>
              </div>
              <div className="relative">
                <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-400 to-purple-600"></div>
                <div className="space-y-12">
                  {milestones.map((milestone, index) => (
                    <div key={index} className="relative flex items-start">
                      <div className="absolute left-6 w-4 h-4 bg-blue-400 rounded-full border-4 border-gray-900"></div>
                      <div className="ml-16 bg-gray-800 rounded-xl p-6 flex-1">
                        <div className="flex items-center mb-4">
                          <span className="text-2xl font-bold text-blue-400 mr-4">
                            {milestone.year}
                          </span>
                          <h3 className="text-xl font-semibold">{milestone.title}</h3>
                        </div>
                        <p className="text-gray-300">{milestone.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Values Tab */}
          {activeTab === 'values' && (
            <div className="space-y-12">
              <div className="text-center mb-12">
                <h2 className="text-4xl font-bold mb-6 text-blue-400">
                  Наши ценности
                </h2>
                <p className="text-lg text-gray-300 max-w-2xl mx-auto">
                  Принципы, которые направляют нашу работу и развитие
                </p>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {[
                  {
                    title: 'Инновации',
                    description: 'Постоянно исследуем новые технологии и подходы для улучшения качества обучения',
                    icon: '🚀'
                  },
                  {
                    title: 'Качество',
                    description: 'Стремимся к высочайшему качеству во всех аспектах нашей платформы',
                    icon: '⭐'
                  },
                  {
                    title: 'Доступность',
                    description: 'Делаем качественное образование доступным для всех талантливых разработчиков',
                    icon: '🌍'
                  },
                  {
                    title: 'Сообщество',
                    description: 'Создаем поддерживающее сообщество профессионалов и энтузиастов',
                    icon: '🤝'
                  },
                  {
                    title: 'Прозрачность',
                    description: 'Открыто делимся нашими процессами и результатами с пользователями',
                    icon: '🔍'
                  },
                  {
                    title: 'Развитие',
                    description: 'Поощряем постоянное обучение и профессиональный рост',
                    icon: '📈'
                  }
                ].map((value, index) => (
                  <div
                    key={index}
                    className="bg-gray-800 rounded-xl p-6 hover:bg-gray-700 transition-all duration-300 group"
                  >
                    <div className="text-4xl mb-4">{value.icon}</div>
                    <h3 className="text-xl font-semibold mb-3 group-hover:text-blue-400 transition-colors">
                      {value.title}
                    </h3>
                    <p className="text-gray-400">{value.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-blue-600/10 to-purple-600/10">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-4xl font-bold mb-6">
            Готовы начать свой путь к успешной карьере?
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            Присоединяйтесь к тысячам разработчиков, которые уже используют 
            SuperMock для подготовки к интервью
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-medium transition-colors">
              Начать бесплатно
            </button>
            <button className="border border-gray-600 hover:border-gray-500 text-white px-8 py-3 rounded-lg font-medium transition-colors">
              Узнать больше
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;
