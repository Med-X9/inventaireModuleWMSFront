/** @type {import('tailwindcss').Config} */
const plugin = require('tailwindcss/plugin');
const { palette } = require('./src/theme/colors');

const rotateX = plugin(function ({ addUtilities }) {
  addUtilities({ '.rotate-y-180': { transform: 'rotateY(180deg)' } });
});

module.exports = {
  content: ['./index.html','./src/**/*.{vue,js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    container: { center: true },
    extend: {
      colors: palette,
      // … le reste (fontFamily, spacing, typography, etc.)
      fontFamily: {
        nunito: ['Nunito', 'sans-serif'],
    },
    spacing: {
        4.5: '18px',
    },
    boxShadow: {
        '3xl': '0 2px 2px rgb(224 230 237 / 46%), 1px 6px 7px rgb(224 230 237 / 46%)',
    },
    typography: ({ theme }) => ({
        DEFAULT: {
            css: {
                '--tw-prose-invert-headings': theme('colors.white.dark'),
                '--tw-prose-invert-links': theme('colors.white.dark'),
                h1: { fontSize: '40px', marginBottom: '0.5rem', marginTop: 0 },
                h2: { fontSize: '32px', marginBottom: '0.5rem', marginTop: 0 },
                h3: { fontSize: '28px', marginBottom: '0.5rem', marginTop: 0 },
                h4: { fontSize: '24px', marginBottom: '0.5rem', marginTop: 0 },
                h5: { fontSize: '20px', marginBottom: '0.5rem', marginTop: 0 },
                h6: { fontSize: '16px', marginBottom: '0.5rem', marginTop: 0 },
                p: { marginBottom: '0.5rem' },
                li: { margin: 0 },
                img: { margin: 0 },
            },
        },
    }),
    }
  },
  plugins: [
    require('@tailwindcss/forms')({ strategy: 'class' }),
    require('@tailwindcss/typography'),
    rotateX,
  ],
}
