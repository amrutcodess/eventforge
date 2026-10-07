/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // ═══ The accent is a single swappable source. ═══
        // Channels live on :root in index.css, so every accent surface — including the
        // Recharts series, which fades through getComputedStyle — moves together.
        accent: {
          DEFAULT: 'rgb(var(--accent) / <alpha-value>)',
          hover: 'rgb(var(--accent-hover) / <alpha-value>)',
          deep: 'rgb(var(--accent-deep) / <alpha-value>)',
          alt: 'rgb(var(--accent-alt) / <alpha-value>)',
        },

        // Neutrals — cool zinc, one accent hue, no second colour anywhere.
        canvas: '#fafafa',
        surface: { DEFAULT: '#ffffff', muted: '#f4f4f5' },
        night: { DEFAULT: '#09090b', raised: '#18181b', line: '#27272a', muted: '#a1a1aa' },
        ink: { DEFAULT: '#09090b', muted: '#71717b' },
        line: { DEFAULT: '#e4e4e7', strong: '#d4d4d8' },

        // Status. `info` is deliberately neutral zinc, not blue: the reference has one
        // accent and no second hue, and a blue badge reintroduces the rainbow.
        success: { DEFAULT: '#15803d', soft: '#f0fdf4' },
        // `.light` is the variant to use for status text sitting on a dark surface —
        // the DEFAULT tones are tuned for light backgrounds and fall below 4.5:1 on `night`.
        warning: { DEFAULT: '#b45309', soft: '#fffbeb', light: '#fcd34d' },
        danger: { DEFAULT: '#b91c1c', soft: '#fef2f2', light: '#fca5a5' },
        info: { DEFAULT: '#3f3f46', soft: '#f4f4f5' },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        // Caps-only, weight 400, and it wants generous tracking to read as "tracking-wide".
        // Used on at most two headings per public page and one metric per dashboard.
        display: ['"Bebas Neue"', 'Impact', 'sans-serif'],
      },
      fontSize: {
        // The reference's literal hero is clamp(6rem,16vw,13rem) — that floors at 96px,
        // and a condensed word at 96px is ~550px wide, which overflows a 375px phone.
        // This floors at 48px instead.
        'hero': ['clamp(3rem, 11vw, 9rem)', { lineHeight: '0.88', letterSpacing: '0.005em' }],
        'display': ['clamp(2.5rem, 7vw, 5rem)', { lineHeight: '0.9' }],
        'h2': ['2.25rem', { lineHeight: '1.1', letterSpacing: '-0.025em' }],
        'h2-lg': ['3rem', { lineHeight: '1.05', letterSpacing: '-0.025em' }],
        'h3': ['1.5rem', { lineHeight: '1.25', letterSpacing: '-0.02em' }],
        'body-lg': ['1.125rem', { lineHeight: '1.65' }],
        'body': ['1rem', { lineHeight: '1.65' }],
        'body-sm': ['0.875rem', { lineHeight: '1.6' }],
        'eyebrow': ['0.6875rem', { lineHeight: '1', letterSpacing: '0.3em' }],
        'caps-btn': ['0.75rem', { lineHeight: '1', letterSpacing: '0.25em' }],
      },
      borderRadius: {
        none: '0',
        sm: '0.375rem',
        md: '0.5rem',
        lg: '1rem',
        full: '9999px',
      },
      boxShadow: {
        // The only shadow in the system. Separation comes from background alternation
        // and hairlines, not elevation.
        menu: '0 8px 24px rgba(9, 9, 11, 0.12)',
      },
      keyframes: {
        'fade-in': { from: { opacity: '0' }, to: { opacity: '1' } },
        'rise-in': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'none' }
        }
      },
      animation: {
        // `animate-fade-in` was applied in four modals and never defined — a silent
        // no-op. It is real now.
        'fade-in': 'fade-in 160ms cubic-bezier(0.22, 1, 0.36, 1) both',
        'rise-in': 'rise-in 220ms cubic-bezier(0.22, 1, 0.36, 1) both',
      },
    },
  },
  plugins: [],
}
