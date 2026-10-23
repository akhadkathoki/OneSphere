
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef2ff',
          100: '#e0e7ff',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
        },
        surface: '#f8fafc',
        ink: '#0f172a',
        muted: '#64748b',
      },
      boxShadow: {
        card: '0 4px 24px rgba(15, 23, 42, 0.05)',
      },
    },
  },
  plugins: [],
};
