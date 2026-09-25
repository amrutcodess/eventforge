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
          dark: '#0F1715',
          darkCard: '#16221D',
          darkBorder: '#23342D',
          bg: '#F8F9FA',
          warmGrey: '#F4F4F0',
          accent: '#2D4A3E',
          accentHover: '#21392E',
          accentLight: '#E8F1EC',
          gold: '#D4AF37',
          muted: '#6B7280'
        }
      },
      fontFamily: {
        serif: ['Playfair Display', 'Fraunces', 'Georgia', 'serif'],
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif']
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem'
      },
      boxShadow: {
        'forge-soft': '0 20px 40px -15px rgba(15, 23, 21, 0.07)',
        'forge-glow': '0 0 30px rgba(45, 74, 62, 0.25)',
        'forge-card': '0 10px 30px -5px rgba(0, 0, 0, 0.04)'
      }
    },
  },
  plugins: [],
}
