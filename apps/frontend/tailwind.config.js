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
        // New Infection Colors
        artifact: {
          cyan: "#00ffff",
          purple: "#8e59c3",
          void: "#1a0033"
        }
      },
      keyframes: {
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        'spin-slow': {
          from: { transform: 'rotate(0deg)' },
          to: { transform: 'rotate(360deg)' },
        }
      },
      animation: {
        'shimmer': 'shimmer 2s infinite',
        'spin-slow': 'spin-slow 8s linear infinite',
      },
      fontFamily: {
        display: ["'Raleway'", "sans-serif"],
        body: ["'Inter'", "sans-serif"],
        segment: ['"Share Tech Mono"', 'monospace'],
        lcd: ['"DSEG7Classic"', 'monospace'],
      }
    }
  },
  plugins: []
}