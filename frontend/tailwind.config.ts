import type { Config } from 'tailwindcss'

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        // Upgrades the default font to Inter (if installed) or a premium system stack
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Menlo', 'Monaco', 'monospace'],
      },
      animation: {
        'bounce': 'bounce 1s infinite',
        'pulse': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        // Added this for smooth entry animations (like dropdowns or alerts)
        'fade-in': 'fadeIn 0.3s ease-out forwards', 
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        }
      },
      boxShadow: {
        // Refined, softer shadows for the glassmorphic cards
        'xl': '0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 8px 10px -6px rgba(0, 0, 0, 0.3)',
        '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.4)',
        'glow': '0 0 20px rgba(99, 102, 241, 0.15)', // Custom shadow for primary buttons
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
} satisfies Config