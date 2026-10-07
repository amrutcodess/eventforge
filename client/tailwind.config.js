/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        forge: {
          obsidian: '#0B0D0C',
          dark: '#111413',
          darkCard: '#181C1A',
          darkBorder: 'rgba(255, 255, 255, 0.08)',
          glass: 'rgba(255, 255, 255, 0.03)',
          glassBorder: 'rgba(255, 255, 255, 0.12)',
          accent: '#2D4A3E',
          accentGlow: '#3B6051',
          accentLight: 'rgba(45, 74, 62, 0.25)',
          gold: '#D4AF37',
          goldGlow: 'rgba(212, 175, 55, 0.3)',
          cyan: '#00F2FE',
          bg: '#F8F9FA'
        }
      },
      fontFamily: {
        serif: ['Playfair Display', 'Fraunces', 'Georgia', 'serif'],
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['Fira Code', 'monospace']
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
        '5xl': '2.5rem'
      },
      boxShadow: {
        'forge-soft': '0 20px 40px -15px rgba(0, 0, 0, 0.5)',
        'forge-glow': '0 0 40px rgba(45, 74, 62, 0.4)',
        'gold-glow': '0 0 35px rgba(212, 175, 55, 0.35)',
        'glass-card': '0 8px 32px 0 rgba(0, 0, 0, 0.37)'
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'float-reverse': 'floatReverse 7s ease-in-out infinite',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'marquee': 'marquee 25s linear infinite',
        'glow-spin': 'glowSpin 12s linear infinite'
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
          '50%': { transform: 'translateY(-12px) rotate(1.5deg)' }
        },
        floatReverse: {
          '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
          '50%': { transform: 'translateY(12px) rotate(-1.5deg)' }
        },
        marquee: {
          '0%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-50%)' }
        },
        glowSpin: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' }
        }
      }
    },
  },
  plugins: [],
}
