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
          50: '#f0f7ff',
          100: '#e0effe',
          200: '#bbdffc',
          300: '#7cc2fa',
          400: '#38a3f6',
          500: '#0e87e3',
          600: '#026abf',
          700: '#03549c',
          800: '#074880',
          900: '#0c3d6b',
          950: '#082747',
        }
      }
    },
  },
  plugins: [],
}
