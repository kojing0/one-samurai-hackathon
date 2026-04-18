import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        one: {
          red:    '#E31937',
          dark:   '#0A0A0A',
          card:   '#111111',
          border: '#222222',
          muted:  '#888888',
        },
        // 後方互換
        samurai: {
          red:  '#E31937',
          gold: '#FFD700',
          dark: '#0A0A0A',
          navy: '#111111',
        },
      },
    },
  },
  plugins: [],
};

export default config;
