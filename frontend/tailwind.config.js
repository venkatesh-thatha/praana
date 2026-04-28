/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        praana: {
          sage: '#8fbf6e',
          'sage-light': '#b8d99c',
          gold: '#c9a84c',
          bg: '#090b09',
          surface: '#101412',
          elevated: '#161a16',
          ivory: '#ede9e0',
          muted: '#7a7a6e',
          danger: '#d97272',
        },
      },
      fontFamily: {
        sans: ['DM Sans', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        display: ['Syne', 'DM Sans', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 1px 2px rgba(0,0,0,0.4), 0 4px 16px rgba(0,0,0,0.45), 0 20px 48px rgba(0,0,0,0.3), inset 0 1px 0 rgba(143,191,110,0.06)',
        'card-hover': '0 2px 4px rgba(0,0,0,0.4), 0 8px 32px rgba(0,0,0,0.5), 0 32px 64px rgba(0,0,0,0.3), inset 0 1px 0 rgba(143,191,110,0.08)',
        'sage-glow': '0 0 24px rgba(143, 191, 110, 0.25)',
        'gold-glow': '0 0 24px rgba(201, 168, 76, 0.3)',
        'glass': '0 8px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.04)',
        'teal-glow': '0 0 24px rgba(143, 191, 110, 0.25)',
        'red-glow': '0 0 32px rgba(217, 114, 114, 0.5)',
        'green-glow': '0 0 24px rgba(143, 191, 110, 0.25)',
        'green-glow-lg': '0 0 48px rgba(143, 191, 110, 0.3)',
      },
      animation: {
        'fade-up': 'fadeUp 0.8s ease-out both',
        'fade-up-1': 'fadeUp 0.8s ease-out 100ms both',
        'fade-up-2': 'fadeUp 0.8s ease-out 200ms both',
        'fade-up-3': 'fadeUp 0.8s ease-out 300ms both',
        'breathe': 'breathe 5s ease-in-out infinite',
        'shimmer': 'shimmer 2s infinite',
        'spin-slow': 'spin 3s linear infinite',
        'slide-up': 'fadeUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) both',
        'slide-up-1': 'fadeUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) 80ms both',
        'slide-up-2': 'fadeUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) 160ms both',
        'slide-up-3': 'fadeUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) 240ms both',
        'float': 'float 6s ease-in-out infinite',
        'float-delayed': 'float 6s ease-in-out 2s infinite',
        'ping-slow': 'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite',
        'pulse-slow': 'pulse 4s ease-in-out infinite',
        'fade-in': 'fadeUp 0.9s ease-out both',
        'fade-in-1': 'fadeUp 0.9s ease-out 120ms both',
        'fade-in-2': 'fadeUp 0.9s ease-out 240ms both',
        'fade-in-3': 'fadeUp 0.9s ease-out 360ms both',
      },
      keyframes: {
        fadeUp: {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        breathe: {
          '0%, 100%': { opacity: '0.5', transform: 'scale(1)' },
          '50%': { opacity: '1', transform: 'scale(1.06)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-14px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
      },
    },
  },
  plugins: [],
}
