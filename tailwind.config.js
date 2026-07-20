/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef4ff',
          100: '#d9e6ff',
          200: '#bcd3ff',
          300: '#8eb6ff',
          400: '#598eff',
          500: '#3366ff',
          600: '#1f47f5',
          700: '#1836e1',
          800: '#1a2fb6',
          900: '#1c2e8f',
          950: '#151d57',
        },
        /**
         * Semantic status tokens — use these instead of raw hex in components.
         * Every value is verified >= 4.5:1 (WCAG AA) against white text.
         */
        status: {
          pending: '#b45309', // 5.02:1 — waiting on student/agency action
          progress: '#1d4ed8', // 6.70:1 — actively moving forward
          review: '#6d28d9', // 7.10:1 — under assessment by a third party
          success: '#15803d', // 5.02:1 — positive milestone reached
          danger: '#b91c1c', // 6.47:1 — rejected / blocked
          neutral: '#475569', // 7.58:1 — dormant / no action
          info: '#0e7490', // 5.36:1 — newly created / informational
          total: '#1836e1', // 7.91:1 — summary tiles (brand-700)
        },
      },
      fontFamily: {
        sans: ['"Open Sans"', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
