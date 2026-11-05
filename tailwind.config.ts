import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: { 950: "#0A1428", 900: "#0F1E3D", 800: "#16294F", 700: "#1E3A6E" },
        accent: { DEFAULT: "#3B6FE0", soft: "#EAF0FD", ring: "#9DB8F2" },
        surface: { DEFAULT: "#FFFFFF", muted: "#F6F8FC", line: "#E4E9F2" },
        ink: { DEFAULT: "#0F1E3D", soft: "#5B6B87", faint: "#8A97AD" },
        status: {
          green: "#1F9D61", yellow: "#C98A0B", red: "#D64545", blue: "#3B6FE0", gray: "#7A869A",
        },
      },
      fontFamily: { sans: ["var(--font-sans)", "system-ui", "sans-serif"] },
      borderRadius: { xl: "0.875rem", "2xl": "1.125rem" },
      boxShadow: {
        card: "0 1px 2px rgba(15,30,61,0.04), 0 1px 3px rgba(15,30,61,0.06)",
        pop: "0 8px 30px rgba(15,30,61,0.12)",
      },
      keyframes: {
        shimmer: { "100%": { transform: "translateX(100%)" } },
        toastIn: { from: { opacity: "0", transform: "translateY(8px)" }, to: { opacity: "1", transform: "none" } },
      },
      animation: { toastIn: "toastIn .18s ease-out" },
    },
  },
  plugins: [],
};
export default config;
