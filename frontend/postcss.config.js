import tailwind from 'tailwindcss';
import autoprefixer from 'autoprefixer';

export default {
  plugins: [
    tailwind({ config: './tailwind.config.ts' }),
    autoprefixer(),
  ],
};
