/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'sol-bg': '#F9F7F4',
        'sol-surface': '#FFFFFF',
        'sol-primary': '#C96B2E',
        'sol-primary-light': '#F5E6D8',
        'sol-text-primary': '#1A1714',
        'sol-text-secondary': '#6B6560',
        'sol-border': '#E8E3DD',
        'sol-success': '#3D7A5F',
        'sol-error': '#C0392B',
      },
      fontFamily: {
        sans: ['"DM Sans"', 'sans-serif'],
        display: ['"Fraunces"', 'serif'],
      },
      boxShadow: {
        'sol-soft': '0 4px 6px -1px rgba(26,23,20,0.08), 0 2px 4px -1px rgba(26,23,20,0.04)',
      },
      letterSpacing: {
        'tight-heading': '-0.02em',
      }
    },
  },
  plugins: [],
}
