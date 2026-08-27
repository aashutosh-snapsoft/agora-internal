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
      },
      height: {
        'full-minus-20': 'calc(100% - 20px)',
        'full-minus-80': 'calc(100% - 80px)',
        'full-minus-270': 'calc(100vh - 270px)',
      },
      keyframes: {
        bounce: {
          '0%, 80%, 100%': { transform: 'scale(0)' },
          '40%': { transform: 'scale(1)' },
        },
        fadeScale: {
          '0%, 100%': { transform: 'scale(0)', opacity: '0.2' },
          '50%': { transform: 'scale(1)', opacity: '1' },
        },
      },
      animation: {
        bounce: 'bounce 1.4s infinite',
        fadeScale: 'fadeScale 1.5s infinite',
      },
    },
  },
  plugins: [],
};
export default config;
