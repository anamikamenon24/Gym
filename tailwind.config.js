/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        display: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        lime: { DEFAULT: '#C6FF3D', 400: '#D4FF6B', 500: '#C6FF3D', 600: '#A8E01F' },
        cyan: { DEFAULT: '#22E5FF', 400: '#5CEEFF', 500: '#22E5FF' },
        ink: { 950: '#07090C', 900: '#0B0E13', 850: '#10141B', 800: '#151A23', 700: '#1E2530' },
        bg: 'rgb(var(--bg) / <alpha-value>)',
        surface: 'rgb(var(--surface) / <alpha-value>)',
        fg: 'rgb(var(--fg) / <alpha-value>)',
        muted: 'rgb(var(--muted) / <alpha-value>)',
        line: 'rgb(var(--line) / <alpha-value>)',
        accent: 'rgb(var(--accent) / <alpha-value>)',
        accent2: 'rgb(var(--accent2) / <alpha-value>)',
      },
      boxShadow: {
        glow: '0 0 40px -8px rgba(198,255,61,0.55)',
        'glow-cyan': '0 0 40px -8px rgba(34,229,255,0.5)',
        glass: '0 8px 32px -8px rgba(0,0,0,0.45)',
      },
      backgroundImage: {
        'pulse-gradient': 'linear-gradient(110deg, #C6FF3D 0%, #6BFFB0 45%, #22E5FF 100%)',
      },
      keyframes: {
        float: { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-12px)' } },
        shimmer: { '0%': { backgroundPosition: '0% 50%' }, '100%': { backgroundPosition: '200% 50%' } },
        beat: { '0%,100%': { transform: 'scale(1)' }, '15%': { transform: 'scale(1.18)' }, '30%': { transform: 'scale(1)' }, '45%': { transform: 'scale(1.1)' } },
      },
      animation: {
        float: 'float 6s ease-in-out infinite',
        shimmer: 'shimmer 6s linear infinite',
        beat: 'beat 1.6s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
