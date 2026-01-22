import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        "deep-blue": "#003366",
        "emerald-green": "#2ECC71",
        "bitcoin-orange": "#F7931A",
        "slate-grey": "#333333",
        "electric-purple": "#673AB7",
        "charity-red": "#E74C3C",
      },
    },
  },
  plugins: [],
};

export default config;

