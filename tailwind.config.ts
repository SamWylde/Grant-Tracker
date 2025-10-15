import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}", "./lib/**/*.{js,ts,jsx,tsx}", "./content/**/*.{md,mdx}", "./ui/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        midnight: {
          50: "#f3f7ff",
          100: "#e3ecff",
          200: "#c0d3ff",
          300: "#8aa9ff",
          400: "#557dff",
          500: "#2f52f5",
          600: "#1f3ed8",
          700: "#1a34b1",
          800: "#182e8c",
          900: "#182a72",
          950: "#0d1742"
        }
      }
    }
  },
  plugins: []
};

export default config;
