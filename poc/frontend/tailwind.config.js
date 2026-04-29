/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        steel: {
          50: "#f6f7f9",
          100: "#eceef2",
          200: "#d5dae3",
          300: "#b1b9c9",
          400: "#8693aa",
          500: "#677591",
          600: "#525e78",
          700: "#444d62",
          800: "#3a4253",
          900: "#333947",
          950: "#22252e",
        },
        molten: {
          50: "#fff7ed",
          100: "#ffedd4",
          200: "#ffd6a8",
          300: "#ffb870",
          400: "#ff8f37",
          500: "#fe6f0f",
          600: "#ef5505",
          700: "#c63d07",
          800: "#9d310e",
          900: "#7e2b0f",
          950: "#441205",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
    },
  },
  plugins: [],
};
