/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#0a0a0f",
        card: "#12121a",
        border: "rgba(255, 255, 255, 0.06)",
        primary: "#F2385A",
        secondary: "#F5A623",
        success: "#00E676",
        text: "#e2e8f0",
        muted: "#64748b"
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      keyframes: {
        shimmer: { to: { 'background-position': '200% center' } },
      },
      animation: {
        shimmer: 'shimmer 5s linear infinite',
      },
    },
  },
  plugins: [],
}
