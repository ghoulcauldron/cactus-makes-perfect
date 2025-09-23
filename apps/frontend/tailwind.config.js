/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        cactus: { green: "#2E7D32", sand: "#EDC9AF", sunset: "#FF7043", sky: "#4FC3F7" },
        neon: '#ff49c3',
        tangerine: '#f5a623',
        graphite: '#2e2e2e',
        pewter: '#4a4a4a',
        ':root': {
          neon: '#ff49c3',
        },
      },
      fontFamily: {
        display: ["'Raleway'", "sans-serif"],
        body: ["'Inter'", "sans-serif"],
        segment: ['"Share Tech Mono"', 'monospace'],
        lcd: ['"LCD14"', 'monospace'],
      }
    }
  },
  plugins: []
}
