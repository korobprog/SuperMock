export const YANDEX_METRIKA_CONFIG = {
  counterId: 103986343,
  settings: {
    ssr: true,
    webvisor: true,
    clickmap: true,
    ecommerce: "dataLayer",
    accurateTrackBounce: true,
    trackLinks: true
  },
  goals: {
    // Цели для отслеживания
    CLICK_BUTTON: 'click_button',
    FORM_SUBMIT: 'form_submit',
    PAGE_VIEW: 'page_view',
    SCROLL_DEPTH: 'scroll_depth',
    TIME_ON_PAGE: 'time_on_page',
    DOWNLOAD: 'download',
    EXTERNAL_LINK: 'external_link',
    INTERNAL_LINK: 'internal_link',
    VIDEO_PLAY: 'video_play',
    VIDEO_COMPLETE: 'video_complete'
  },
  events: {
    // Пользовательские события
    USER_REGISTRATION: 'user_registration',
    USER_LOGIN: 'user_login',
    SUBSCRIPTION: 'subscription',
    PAYMENT: 'payment',
    FEATURE_USE: 'feature_use',
    LANGUAGE_CHANGE: 'language_change',
    THEME_CHANGE: 'theme_change'
  }
};

// Типы для событий
export type YandexMetrikaGoal = typeof YANDEX_METRIKA_CONFIG.goals[keyof typeof YANDEX_METRIKA_CONFIG.goals];
export type YandexMetrikaEvent = typeof YANDEX_METRIKA_CONFIG.events[keyof typeof YANDEX_METRIKA_CONFIG.events];
