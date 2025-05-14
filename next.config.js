/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  webpack: (config, { isServer }) => {
    // Решение проблемы с устаревшим модулем punycode
    config.resolve.fallback = {
      ...config.resolve.fallback,
      punycode: false,
    };

    return config;
  },
  // Настройка прокси для API запросов
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:8080/api/:path*',
      },
    ];
  },
};

module.exports = nextConfig;
