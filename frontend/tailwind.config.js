/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Token brand Inixindo Bandung.
        primary: { DEFAULT: '#143564', hover: '#0D2547' },
        secondary: '#005081',
        accent: '#5CAAD5',
        danger: '#EA2339',
        success: '#1F9254',
        ink: '#1A1A1A',
        muted: '#6B7280',
        subtle: '#F5F7FA',
      },
      fontFamily: {
        sans: ['Poppins', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
