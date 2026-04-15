import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        samurai: {
          red: '#C0392B',
          gold: '#F39C12',
          dark: '#1A1A2E',
          navy: '#16213E',
        },
      },
    },
  },
  plugins: [],
};

export default config;
