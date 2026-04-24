/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // Enables dark mode based on a class applied to the HTML tag
  theme: {
    extend: {
      colors: {
        dark: {
          bg: '#121212',
          surface: '#1E1E1E',
          border: '#333333',
          text: '#E0E0E0',
          primary: '#BB86FC'
        }
      }
    },
  },
  plugins: [],
}