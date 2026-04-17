import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eaecf0",
          100: "#c9d0db",
          200: "#9aaabb",
          300: "#6b8499",
          400: "#456277",
          500: "#1e3a6e",
          600: "#162D5A",
          700: "#0f2040",
          800: "#162D5A",
          900: "#080f18",
        },
      },
    },
  },
  plugins: [],
};

export default config;
