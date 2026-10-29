/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        stand: {
          header: '#1e293b',
          grid: '#334155',
          unassigned: '#fef08a', // Amber/yellow row like in reference
          rowEven: '#0f172a',
          rowOdd: '#1e293b',
          currentTime: '#facc15' // Scrubber line yellow
        },
        flight: {
          blue: '#38bdf8',
          green: '#22c55e',
          purple: '#818cf8',
          red: '#ef4444',
          orange: '#f97316'
        }
      },
      fontFamily: {
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace']
      }
    },
  },
  plugins: [],
}
