// tailwind.config.js
/** @type {import('tailwindcss').Config} */
const plugin = require('tailwindcss/plugin');

const rotateX = plugin(function ({ addUtilities }) {
  addUtilities({ '.rotate-y-180': { transform: 'rotateY(180deg)' } });
});

module.exports = {
  content: ['./index.html','./src/**/*.{vue,js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    container: { center: true },
    extend: {
      colors: {
        primary:   { DEFAULT: '#FFCC11', light: '#FFF3C7', 'dark-light': 'rgba(67,97,238,.15)', 600: '#e0ac06' },
        secondary: { DEFAULT: '#595959', light: '#f1f5f9', 'dark-light': 'rgb(128 93 202 / 15%)', 50: '#f8fafc' },
        success:   { DEFAULT: '#22c55e', light: '#ddf5f0', 'dark-light': 'rgba(0,171,85,.15)' },
        danger:    { DEFAULT: '#ef4444', light: '#fff5f5', 'dark-light': 'rgba(231,81,90,.15)' },
        warning:   { DEFAULT: '#f59e0b', light: '#fff9ed', 'dark-light': 'rgba(226,160,63,.15)' },
        info:      { DEFAULT: '#3b82f6', light: '#e7f7ff', 'dark-light': 'rgba(33,150,243,.15)' },
        dark:      { DEFAULT: '#3b3f5c', light: '#eaeaec', 'dark-light': 'rgba(59,63,92,.15)' },
        black:     { DEFAULT: '#0e1726', light: '#e3e4eb', 'dark-light': 'rgba(14,23,38,.15)' },
        'dark-bg':    '#1b2e4b',   
        'dark-border':'#253b5c',
        white:     { DEFAULT: '#ffffff', light: '#e0e6ed', dark: '#888ea8' },
      },
      fontFamily: { nunito: ['Nunito', 'sans-serif'] },
      spacing:    { 4.5: '18px' },
      boxShadow:  { '3xl': '0 2px 2px rgb(224 230 237 / 46%), 1px 6px 7px rgb(224 230 237 / 46%)' },
      typography: ({ theme }) => ({
        DEFAULT: {
          css: {
            '--tw-prose-invert-headings': theme('colors.white.dark'),
            '--tw-prose-invert-links':    theme('colors.white.dark'),
            h1: { fontSize: '40px', margin: '0 0 .5rem' },
            h2: { fontSize: '32px', margin: '0 0 .5rem' },
            h3: { fontSize: '28px', margin: '0 0 .5rem' },
            h4: { fontSize: '24px', margin: '0 0 .5rem' },
            h5: { fontSize: '20px', margin: '0 0 .5rem' },
            h6: { fontSize: '16px', margin: '0 0 .5rem' },
            p:  { marginBottom: '.5rem' },
            li: { margin: 0 },
            img:{ margin: 0 },
          },
        },
        accentColor: theme => ({
          primary:   theme('colors.primary.DEFAULT'),
          secondary: theme('colors.secondary.DEFAULT'),
        }),
      }),
    },
  },
  plugins: [
    require('@tailwindcss/forms')({ strategy: 'class' }),  
    require('@tailwindcss/typography'),
    // Exposer les variables CSS
    function ({ addBase, theme }) {
      addBase({
        ':root': {
          '--color-primary':   theme('colors.primary.DEFAULT'),
          '--color-secondary': theme('colors.secondary.DEFAULT'),
          '--color-success':   theme('colors.success.DEFAULT'),
          '--color-danger':    theme('colors.danger.DEFAULT'),
          '--color-warning':   theme('colors.warning.DEFAULT'),
          '--color-info':      theme('colors.info.DEFAULT'),
        },
      });
    },  
    rotateX,
  ],
};
