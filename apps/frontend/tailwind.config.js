const { heroui } = require('@heroui/react');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,jsx,ts,tsx}',
    './src/index.html',
    // '../../node_modules/@heroui/react/dist/**/*.{js,mjs}',
    './../../node_modules/@heroui/react/dist/**/*.{js,mjs}',
    './../../node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {},
  },
  darkMode: 'class',
  plugins: [heroui()],
};
