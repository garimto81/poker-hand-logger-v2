/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        poker: {
          green: '#0D5D3D',
          'green-light': '#127D51',
          'green-dark': '#0A4B30',
          red: '#DC2626',
          gold: '#FBB040',
          chip: {
            white: '#FFFFFF',
            red: '#DC2626',
            blue: '#2563EB',
            green: '#16A34A',
            black: '#000000'
          }
        }
      }
    },
  },
  plugins: [],
}
