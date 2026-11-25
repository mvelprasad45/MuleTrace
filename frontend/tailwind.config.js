/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cyber: {
          bg: '#020909',
          card: 'rgba(5, 23, 24, 0.65)',
          cardHover: 'rgba(7, 34, 35, 0.85)',
          border: 'rgba(0, 245, 212, 0.22)',
          borderGlow: 'rgba(0, 245, 212, 0.55)',
          primary: '#00F5D4',
          primaryDark: '#00BFA5',
          teal: '#0A3A40',
          tealLight: '#0E525B',
          red: '#EF4444',
          orange: '#F97316',
          yellow: '#EAB308',
          textMuted: '#94A3B8',
          textLight: '#E2E8F0',
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace']
      },
      boxShadow: {
        'neon': '0 0 15px rgba(0, 245, 212, 0.35)',
        'neon-strong': '0 0 25px rgba(0, 245, 212, 0.65)',
        'neon-red': '0 0 15px rgba(239, 68, 68, 0.45)',
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)'
      },
      backgroundImage: {
        'cyber-grid': 'linear-gradient(to right, rgba(0, 245, 212, 0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(0, 245, 212, 0.05) 1px, transparent 1px)',
      }
    },
  },
  plugins: [],
}

