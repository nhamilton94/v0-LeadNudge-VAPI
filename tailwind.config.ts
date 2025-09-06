import type { Config } from "tailwindcss"

const config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
    "*.{js,ts,jsx,tsx,mdx}",
  ],
  safelist: [
    // Primary color with all variants and states
    {
      pattern: /^(text|bg|border|ring|fill|stroke)-(primary)(-foreground)?$/,
      variants: ["hover", "focus", "active", "disabled", "data-[state=open]", "data-[active=true]"],
    },
    {
      pattern: /^(text|bg|border|ring|fill|stroke)-(primary)\/\d+$/,
    },
    // Other theme colors that might be used
    {
      pattern: /^(text|bg|border|ring|fill|stroke)-(secondary|accent|muted|card|popover|destructive)(-foreground)?$/,
      variants: ["hover", "focus", "active", "disabled"],
    },
    // Ensure button variants are included
    "bg-primary",
    "text-primary-foreground",
    "hover:bg-primary/90",
    // Explicitly include any classes that might be used in components
    "bg-primary/10",
    "bg-primary/20",
    "text-primary",
    "border-primary",
    "ring-primary",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config

export default config
