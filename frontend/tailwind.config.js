/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        praana: {
          teal: '#0d9488',
          'teal-light': '#14b8a6',
          dark: '#0f172a',
          darker: '#080f1e',
          amber: '#d97706',
          light: '#f0fdfa',
        },
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
