/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#df5e26',
          light:   '#eb7440',
          dark:    '#b24a18',
          amber:   '#e5b869',
        },
        dark: {
          DEFAULT: '#0d0b0a',
          800: '#1a1715',
          700: '#252120',
          600: '#2f2b2a',
          500: '#3a3634',
        },
        cream: '#f5ede4',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Outfit', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
