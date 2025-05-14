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
};

module.exports = nextConfig;
