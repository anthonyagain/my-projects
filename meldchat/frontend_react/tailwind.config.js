/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{html,js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        'mc-green': {
          300: '#21752c',
          400: '#1c6325',
          500: '#17541f',
          600: '#103b15',
          700: '#081f0b',
        },
      }
    },
  },
  plugins: [],
}
