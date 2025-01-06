/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },
        dark: {
          'bg-primary': '#111827',
          'bg-secondary': '#1f2937',
          'bg-alt': '#374151',
          'fg-primary': '#f9fafb',
          'fg-secondary': '#e5e7eb',
          'fg-alt': '#9ca3af',
          'border': '#374151',
        }
      },
      fontFamily: {
        sans: ['Inter var', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Lexend', 'sans-serif'],
      },
      spacing: {
        sidebar: '16rem',
      },
      boxShadow: {
        'soft': '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)',
        'inner-soft': 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
        'dark': '0 2px 15px -3px rgba(0, 0, 0, 0.3), 0 10px 20px -2px rgba(0, 0, 0, 0.2)',
        '3xl': '0 35px 60px -15px rgba(0, 0, 0, 0.3)',
      },
      keyframes: {
        bounce: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        fade: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(-16px)' },
          '50%': { transform: 'translateY(-24px)' },
        }
      },
      animation: {
        'letter': 'bounce 1.5s infinite ease-in-out, fade 1.5s infinite ease-in-out',
        'letter2': 'bounce 1.5s infinite ease-in-out 0.2s, fade 1.5s infinite ease-in-out 0.2s',
        'letter3': 'bounce 1.5s infinite ease-in-out 0.4s, fade 1.5s infinite ease-in-out 0.4s',
        'letter4': 'bounce 1.5s infinite ease-in-out 0.6s, fade 1.5s infinite ease-in-out 0.6s',
        'float': 'float 6s ease-in-out infinite',
      }
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
} 