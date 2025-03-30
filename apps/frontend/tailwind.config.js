/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./src/index.html",
    // Add paths to HeroUI components
    "../../node_modules/@heroui/react/dist/**/*.{js,mjs}",
  ],
  theme: {
    extend: {},
  },
  darkMode: "class",
  plugins: [],
}

