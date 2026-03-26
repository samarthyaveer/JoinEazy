/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"DM Sans"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        brand: {
          50:  '#ECFDF5',
          100: '#D1FAE5',
          200: '#A7F3D0',
          300: '#6EE7B7',
          400: '#34D399',
          500: '#10B981',
          600: '#059669',
          700: '#047857',
          800: '#065F46',
          900: '#064E3B',
        },
        surface: {
          primary:   '#FAFAFA',
          secondary: '#FFFFFF',
          tertiary:  '#F4F4F5',
          hover:     '#F0F0F2',
        },
        border: {
          DEFAULT: '#E4E4E7',
          strong:  '#D4D4D8',
        },
        text: {
          primary:   '#18181B',
          secondary: '#71717A',
          tertiary:  '#A1A1AA',
          inverse:   '#FFFFFF',
        },
        status: {
          success:  '#10B981',
          warning:  '#F59E0B',
          danger:   '#EF4444',
          info:     '#3B82F6',
        },
      },
    },
  },
  plugins: [],
}
