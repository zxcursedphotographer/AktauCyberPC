/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: ["./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0f1020",
        panel: "#181a30",
        accent: "#7c5cff",
        hot: "#ff5c8a",
      },
      fontFamily: {
        sans: ["var(--font-scribble)", "ui-sans-serif", "system-ui", "sans-serif"],
        metal: ["var(--font-metal)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};