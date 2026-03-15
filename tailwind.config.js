/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'sans-serif'],
      },
      colors: {
        'primary': 'hsl(var(--primary))',
        'primary-focus': 'hsl(var(--primary-focus))',
        'primary-content': 'hsl(var(--primary-content))',
        'secondary': 'hsl(var(--secondary))',
        'secondary-focus': 'hsl(var(--secondary-focus))',
        'secondary-content': 'hsl(var(--secondary-content))',
        'accent': 'hsl(var(--accent))',
        'accent-focus': 'hsl(var(--accent-focus))',
        'accent-content': 'hsl(var(--accent-content))',
        'neutral': 'hsl(var(--neutral))',
        'neutral-focus': 'hsl(var(--neutral-focus))',
        'neutral-content': 'hsl(var(--neutral-content))',
        'base-100': 'hsl(var(--base-100))',
        'base-200': 'hsl(var(--base-200))',
        'base-300': 'hsl(var(--base-300))',
        'base-content': 'hsl(var(--base-content))',
        'success': 'hsl(var(--success))',
        'danger': 'hsl(var(--danger))',
      },
    },
  },
  plugins: [],
}