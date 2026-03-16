/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,ts}'],
  theme: {
    extend: {
      colors: {
        'dmat-navy': '#1B2838',
        'dmat-navy-light': '#2a4060',
        'dmat-red': '#C41E3A',
        'dmat-red-dark': '#A01830',
      },
      fontFamily: {
        sans: ['"Noto Sans JP"', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
