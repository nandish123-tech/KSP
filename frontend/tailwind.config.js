/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ksp: {
          slate: {
            50: '#F8FAFC',
            100: '#F1F5F9',
            200: '#E2E8F0',
            300: '#CBD5E1',
            400: '#94A3B8',
            700: '#334155',
            800: '#1E293B',
            900: '#0F172A',
            950: '#030712',
          },
          navy: {
            800: '#0B192C',
            900: '#060E1A',
            DEFAULT: '#0B192C'
          },
          blue: {
            50: '#EFF6FF',
            100: '#DBEAFE',
            500: '#3B82F6',
            600: '#1565C0',
            700: '#0D47A1',
            accent: '#008DDA'
          },
          status: {
            green: '#10B981',
            emerald: '#059669',
            yellow: '#F59E0B',
            amber: '#D97706',
            red: '#EF4444',
            rose: '#DC2626'
          }
        }
      },
      boxShadow: {
        'tactical': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
        'panel': '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05)',
        'glow-blue': '0 0 12px 0 rgba(0, 141, 218, 0.15)',
        'glow-red': '0 0 12px 0 rgba(239, 68, 68, 0.2)'
      },
      fontFamily: {
        sans: ['Inter', 'SF Pro Display', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace']
      }
    },
  },
  plugins: [],
}