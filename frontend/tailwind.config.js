/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Theme colors using CSS variables - use these in your components!
        'theme': {
          'bg': {
            'primary': 'var(--color-bg-primary)',
            'secondary': 'var(--color-bg-secondary)',
            'tertiary': 'var(--color-bg-tertiary)',
          },
          'text': {
            'primary': 'var(--color-text-primary)',
            'secondary': 'var(--color-text-secondary)',
            'tertiary': 'var(--color-text-tertiary)',
          },
          'border': {
            DEFAULT: 'var(--color-border)',
            'light': 'var(--color-border-light)',
          },
          'accent': {
            'primary': 'var(--color-accent-primary)',
            'secondary': 'var(--color-accent-secondary)',
          },
          'link': {
            DEFAULT: 'var(--color-link)',
            'hover': 'var(--color-link-hover)',
          },
        },
      },
      backgroundColor: {
        'theme-btn-primary': 'var(--color-btn-primary-bg)',
        'theme-btn-primary-hover': 'var(--color-btn-primary-hover)',
        'theme-btn-secondary': 'var(--color-btn-secondary-bg)',
        'theme-btn-secondary-hover': 'var(--color-btn-secondary-hover)',
      },
      textColor: {
        'theme-btn-primary': 'var(--color-btn-primary-text)',
        'theme-btn-secondary': 'var(--color-btn-secondary-text)',
      },
    },
  },
  plugins: [],
}
