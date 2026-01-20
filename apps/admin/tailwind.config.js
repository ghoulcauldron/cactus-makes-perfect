/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        surface: "#080808",
        primary: "#E0E0E0",
        success: "#00FF41",
        warning: "#FFB000",
      },
      fontFamily: {
        mono: ["VT323", "Courier Prime", "monospace"],
      },
    },
  },
  plugins: [],
};