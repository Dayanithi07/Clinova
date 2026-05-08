/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          blue: '#2563EB',
          light: '#DBEAFE',
          cyan: '#06B6D4',
        },
        surface: {
          bg: '#F8FAFC',
          card: '#FFFFFF',
        },
        text: {
          primary: '#0F172A',
          secondary: '#64748B',
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
