/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        serif: ['Merriweather', 'serif'],
        display: ['Cinzel', 'serif'],
      },
      colors: {
        paper: 'var(--color-paper)',
        surface: 'var(--color-surface)',
        ink: 'var(--color-ink)',
        gold: 'var(--color-gold)',
        stone: 'var(--color-stone)',
        clay: 'var(--color-clay)'
      }
    },
  },
  plugins: [],
}

