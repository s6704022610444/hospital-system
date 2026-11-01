import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        olive: {
          50: "#f4f6f1",
          100: "#e6ece0",
          200: "#cfdbc3",
          300: "#aec29d",
          400: "#8ca677",
          500: "#68864f",
          600: "#546e3d",
          700: "#415531",
          800: "#36452a",
          900: "#2d3a24",
          950: "#161f11",
        },
        hospital: {
          50: "#f4f6f1",
          100: "#e6ece0",
          500: "#68864f",
          600: "#546e3d",
          700: "#415531",
          900: "#2d3a24",
        },
      },
    },
  },
  plugins: [],
};
export default config;
