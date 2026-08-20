/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Brand display colors
        pink: {
          50: '#FDECF3',
          100: '#FBD3E3',
          300: '#ED3F86',
          600: '#D62A72',
          700: '#B01F5C',
        },
        sky: {
          50: '#EAF7FC',
          100: '#CDEDF8',
          300: '#73CFED',
          600: '#17708F',
          700: '#0F5A73',
        },
        amber: {
          50: '#FFF6E4',
          100: '#FFE9BF',
          300: '#FFCC6D',
          600: '#A66F00',
          700: '#7A4E00',
        },
        // Neutral scale
        ink: {
          50: '#FAFAFA',
          100: '#F2F2F2',
          200: '#E5E5E5',
          300: '#CFCFCF',
          400: '#9A9A9A',
          500: '#6B6B6B',
          700: '#2E2E2E',
          900: '#0A0A0A',
        },
      },
      fontFamily: {
        sans: ['Dana', 'Vazirmatn', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        latin: ['IBM Plex Sans', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 1px 2px rgba(10, 10, 10, 0.04), 0 4px 12px rgba(10, 10, 10, 0.06)',
        'pop': '0 8px 28px rgba(10, 10, 10, 0.10)',
      },
      borderRadius: {
        'sm': '8px',
        'md': '12px',
        'lg': '16px',
        'xl': '24px',
      },
      transitionTimingFunction: {
        'brand': 'cubic-bezier(0.2, 0.8, 0.2, 1)',
      },
      transitionDuration: {
        'brand': '200ms',
      },
    },
  },
  plugins: [],
}
