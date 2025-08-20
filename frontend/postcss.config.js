import tailwind from 'tailwindcss';
import autoprefixer from 'autoprefixer';

export default {
  plugins: [
    tailwind({ config: './frontend/tailwind.config.ts' }),
    autoprefixer(),
  ],
};
