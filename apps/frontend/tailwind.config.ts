import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      boxShadow: {
        soft: '0 30px 60px rgba(15, 23, 42, 0.08)',
      },
      colors: {
        brand: {
          50: '#eef6ff',
          100: '#d9e8ff',
          500: '#2563eb',
          600: '#1d4ed8'
        }
      }
    }
  },
  plugins: []
};

export default config;
