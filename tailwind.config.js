/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        kumpas: {
          blue: '#0457d6',
          sky: '#00a6ff',
          yellow: '#f8c400',
          amber: '#ff8a00',
          red: '#e91f23',
          green: '#10a84a',
          charcoal: '#2b2e29',
          paper: '#fff8df',
        },
      },
      boxShadow: {
        glowBlue: '0 0 44px rgba(0, 166, 255, 0.62)',
        glowYellow: '0 0 46px rgba(248, 196, 0, 0.62)',
        glowRed: '0 0 44px rgba(233, 31, 35, 0.54)',
      },
    },
  },
  plugins: [],
};
