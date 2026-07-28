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
        accent: "#EC5E2A",
        ink: "#151412",
        charcoal: "#5D5D5D",
        neutral: "#C4C4C4",
        background: "#EDE7E0",
      },
    },
  },
  plugins: [],
};
export default config;
