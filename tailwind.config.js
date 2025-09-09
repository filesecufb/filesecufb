/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        // Professional color palette
        'blue': {
          'corporate': '#2562EB',
          'dark': '#1e40af',
        },
        // Aggressive tuning color palette
        'dark': {
          'primary': '#0a0a0a',
          'secondary': '#1a1a1a',
          'tertiary': '#2a2a2a',
        },

        'text': {
          'primary': '#ffffff',
          'secondary': '#ffffff',
          'muted': '#888888',
        }
      },


      fontFamily: {
        'primary': ['Inter', 'system-ui', 'sans-serif'],
        'heading': ['Poppins', 'Inter', 'system-ui', 'sans-serif'],
        'mono': ['Roboto Mono', 'Consolas', 'Monaco', 'monospace'],
      },
    },
  },
  plugins: [],
}
