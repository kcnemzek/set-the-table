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
          50: "#e6eef7",
          100: "#ccddf0",
          200: "#99bbe0",
          300: "#6699d1",
          400: "#3377c1",
          500: "#0055b2",
          600: "#003B82",
          700: "#002d67",
          800: "#001f4d",
          900: "#001133",
        },
      },
    },
  },
  plugins: [],
};

export default config;
