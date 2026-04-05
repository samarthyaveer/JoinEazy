/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Geist Sans"', '"Satoshi"', '"Work Sans"', "ui-sans-serif"],
        display: ['"Caudex"', '"Palatino Linotype"', '"Book Antiqua"', "serif"],
        mono: [
          '"Geist Mono"',
          '"JetBrains Mono"',
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "monospace",
        ],
      },
      fontSize: {
        hero: [
          "56px",
          { lineHeight: "1.05", fontWeight: "700", letterSpacing: "-0.035em" },
        ],
        page: [
          "44px",
          { lineHeight: "1.1", fontWeight: "700", letterSpacing: "-0.03em" },
        ],
        section: [
          "22px",
          { lineHeight: "1.3", fontWeight: "600", letterSpacing: "-0.02em" },
        ],
        body: ["15px", { lineHeight: "1.6", fontWeight: "400" }],
        meta: ["13px", { lineHeight: "1.5", fontWeight: "400" }],
        label: [
          "11px",
          { lineHeight: "1.4", fontWeight: "500", letterSpacing: "0.06em" },
        ],
      },
      colors: {
        /* Surface tokens */
        surface: {
          DEFAULT: "rgb(var(--color-surface) / <alpha-value>)",
          raised: "rgb(var(--color-surface-raised) / <alpha-value>)",
          overlay: "rgb(var(--color-surface-overlay) / <alpha-value>)",
          hover: "rgb(var(--color-surface-hover) / <alpha-value>)",
          border: "rgb(var(--color-border) / <alpha-value>)",
        },
        accent: {
          DEFAULT: "rgb(var(--color-accent) / <alpha-value>)",
          hover: "rgb(var(--color-accent-hover) / <alpha-value>)",
          light: "rgb(var(--color-accent) / 0.08)",
          muted: "rgb(var(--color-accent) / 0.15)",
          text: "rgb(var(--color-accent) / <alpha-value>)",
        },
        text: {
          primary: "rgb(var(--color-text-primary) / <alpha-value>)",
          secondary: "rgb(var(--color-text-secondary) / <alpha-value>)",
          tertiary: "rgb(var(--color-text-tertiary) / <alpha-value>)",
          inverse: "rgb(var(--color-text-inverse) / <alpha-value>)",
        },
        border: {
          DEFAULT: "rgb(var(--color-border) / 0.08)",
          subtle: "rgb(var(--color-border-subtle) / 0.06)",
          strong: "rgb(var(--color-border-strong) / 0.14)",
        },
        semantic: {
          success: "rgb(var(--color-semantic-success) / <alpha-value>)",
          warning: "rgb(var(--color-semantic-warning) / <alpha-value>)",
          danger: "rgb(var(--color-semantic-danger) / <alpha-value>)",
        },
      },
      spacing: {
        18: "4.5rem",
      },
      borderRadius: {
        card: "16px",
      },
      maxWidth: {
        page: "1200px",
      },
      boxShadow: {
        dock: "0 0 0 1px rgba(0,0,0,0.04), 0 8px 40px rgba(0,0,0,0.08), 0 2px 12px rgba(0,0,0,0.04)",
        card: "0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02)",
        "card-hover": "0 4px 24px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04)",
        glow: "0 0 24px rgba(0,85,255,0.12), 0 0 8px rgba(0,85,255,0.06)",
        modal:
          "0 0 0 1px rgba(0,0,0,0.04), 0 24px 80px rgba(0,0,0,0.12), 0 8px 24px rgba(0,0,0,0.06)",
        input: "0 1px 2px rgba(0,0,0,0.04)",
        button: "0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)",
      },
      animation: {
        "fade-in": "fadeIn 0.4s ease-out",
        "slide-up": "slideUp 0.4s ease-out",
        "pulse-subtle": "pulseSubtle 2s ease-in-out infinite",
        float: "float 6s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        pulseSubtle: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.6" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" },
        },
      },
    },
  },
  plugins: [],
};
