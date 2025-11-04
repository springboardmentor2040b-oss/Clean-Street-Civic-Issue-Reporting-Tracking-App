/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      maxWidth: {
        md: '31rem', // widen md container to match design (was 28rem)
      },
      fontFamily: {
        display: ['"Playfair Display"', 'serif'],
        sans: ['Inter', 'system-ui', 'Avenir', 'Helvetica', 'Arial', 'sans-serif'],
      },
      colors: {
        brand: {
          50: '#eef6ff',
          100: '#d6e9ff',
          200: '#aed3ff',
          300: '#7eb7ff',
          400: '#4e98ff',
          500: '#2b78f2',
          600: '#185fcb',
          700: '#144ca1',
          800: '#133f82',
          900: '#122f5f',
        },
      },
      boxShadow: {
        soft: '0 10px 25px rgba(0,0,0,0.08)'
      }
    },
  },
  plugins: [],
}
