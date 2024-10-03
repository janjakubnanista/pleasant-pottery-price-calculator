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
        background: "var(--background)",
        foreground: "var(--foreground)",
        backgroundPrimary: "var(--background-primary)",
        backgroundSecondary: "var(--background-secondary)",
        textSecondary: "var(--text-secondary)",
      },
    },
  },
  plugins: [],
};
export default config;
