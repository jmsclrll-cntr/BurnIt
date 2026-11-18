/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
      colors: {
        brand: {
          deep: '#14006A',
          primary: '#3641C9',
          light: '#8A9CF7',
          offwhite: '#F7F7F7',
          dark: '#0F0F0F',
        },
      },
    },
  },
  plugins: [],
}
