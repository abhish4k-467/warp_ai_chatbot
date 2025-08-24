/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif']
      },
      colors: {
        glass: 'rgba(255,255,255,0.08)'
      },
      backdropBlur: {
        xs: '2px'
      },
      keyframes: {
        fadeIn: { '0%': { opacity: 0 }, '100%': { opacity: 1 } },
        pop: { '0%': { transform: 'scale(.96)', opacity:0 }, '100%': { transform: 'scale(1)', opacity:1 } },
        starFall: {
          '0%': { transform: 'translateY(-10vh)', opacity: 0 },
          '10%': { opacity: 1 },
          '90%': { opacity: 1 },
          '100%': { transform: 'translateY(110vh)', opacity: 0 }
        }
      },
      animation: {
        fadeIn: 'fadeIn .6s ease forwards',
        pop: 'pop .4s cubic-bezier(.4,.8,.4,1) forwards',
        starFall: 'starFall 5s linear infinite'
      }
    }
  },
  plugins: []
};
