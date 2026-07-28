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
        success: "#5F6F44",
        warning: "#8C2F1D",
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        body: ["var(--font-body)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      // Named type scale — display (Space Grotesk, headers/section titles/nav),
      // body (IBM Plex Sans, everything else), caption (small/meta text).
      // Pick by role, not by how big something needs to look.
      fontSize: {
        "display-xl": ["2.5rem", { lineHeight: "1.1", letterSpacing: "-0.01em", fontWeight: "600" }],
        "display-lg": ["1.75rem", { lineHeight: "1.2", letterSpacing: "-0.01em", fontWeight: "600" }],
        display: ["1.25rem", { lineHeight: "1.3", fontWeight: "600" }],
        "display-sm": ["1.0625rem", { lineHeight: "1.35", fontWeight: "600" }],
        body: ["1rem", { lineHeight: "1.55", fontWeight: "400" }],
        "body-sm": ["0.875rem", { lineHeight: "1.5", fontWeight: "400" }],
        caption: ["0.75rem", { lineHeight: "1.4", fontWeight: "500", letterSpacing: "0.01em" }],
        data: ["0.875rem", { lineHeight: "1.4", fontWeight: "500" }],
        "data-lg": ["1.25rem", { lineHeight: "1.3", fontWeight: "500" }],
      },
      borderRadius: {
        DEFAULT: "6px",
      },
    },
  },
  plugins: [],
};
export default config;
