/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        cactus: { green: "#2E7D32", sand: "#EDC9AF", sunset: "#FF7043", sky: "#4FC3F7" }
      },
      fontFamily: {
        display: ["'Raleway'", "sans-serif"],
        body: ["'Inter'", "sans-serif"]
      }
    }
  },
  plugins: []
}
