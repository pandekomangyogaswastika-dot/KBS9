/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: ["class"],
    content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
        extend: {
                fontFamily: {
                        display: ['"Space Grotesk"', 'Sora', 'ui-sans-serif', 'system-ui', 'sans-serif'],
                        sans: ['Sora', 'Figtree', 'ui-sans-serif', 'system-ui', 'sans-serif'],
                        hud: ['"Chakra Petch"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
                },
                borderRadius: {
                        lg: 'var(--radius)',
                        md: 'calc(var(--radius) - 2px)',
                        sm: 'calc(var(--radius) - 4px)'
                },
                colors: {
                        background: 'hsl(var(--background))',
                        foreground: 'hsl(var(--foreground))',
                        card: {
                                DEFAULT: 'hsl(var(--card))',
                                foreground: 'hsl(var(--card-foreground))'
                        },
                        popover: {
                                DEFAULT: 'hsl(var(--popover))',
                                foreground: 'hsl(var(--popover-foreground))'
                        },
                        primary: {
                                DEFAULT: 'hsl(var(--primary))',
                                foreground: 'hsl(var(--primary-foreground))'
                        },
                        secondary: {
                                DEFAULT: 'hsl(var(--secondary))',
                                foreground: 'hsl(var(--secondary-foreground))'
                        },
                        muted: {
                                DEFAULT: 'hsl(var(--muted))',
                                foreground: 'hsl(var(--muted-foreground))'
                        },
                        accent: {
                                DEFAULT: 'hsl(var(--accent))',
                                foreground: 'hsl(var(--accent-foreground))'
                        },
                        destructive: {
                                DEFAULT: 'hsl(var(--destructive))',
                                foreground: 'hsl(var(--destructive-foreground))'
                        },
                        border: 'hsl(var(--border))',
                        input: 'hsl(var(--input))',
                        ring: 'hsl(var(--ring))',
                        chart: {
                                '1': 'hsl(var(--chart-1))',
                                '2': 'hsl(var(--chart-2))',
                                '3': 'hsl(var(--chart-3))',
                                '4': 'hsl(var(--chart-4))',
                                '5': 'hsl(var(--chart-5))'
                        }
                },
                keyframes: {
                        'accordion-down': {
                                from: {
                                        height: '0'
                                },
                                to: {
                                        height: 'var(--radix-accordion-content-height)'
                                }
                        },
                        'accordion-up': {
                                from: {
                                        height: 'var(--radix-accordion-content-height)'
                                },
                                to: {
                                        height: '0'
                                }
                        }
                },
                animation: {
                        'accordion-down': 'accordion-down 0.2s ease-out',
                        'accordion-up': 'accordion-up 0.2s ease-out'
                },
                typography: ({ theme }) => ({
                        invert: {
                                css: {
                                        "--tw-prose-body":           "rgba(255,255,255,0.72)",
                                        "--tw-prose-headings":       "rgba(255,255,255,0.95)",
                                        "--tw-prose-lead":           "rgba(255,255,255,0.60)",
                                        "--tw-prose-links":          "#7C68E1",
                                        "--tw-prose-bold":           "rgba(255,255,255,0.90)",
                                        "--tw-prose-counters":       "rgba(255,255,255,0.45)",
                                        "--tw-prose-bullets":        "rgba(255,255,255,0.30)",
                                        "--tw-prose-hr":             "rgba(255,255,255,0.08)",
                                        "--tw-prose-quotes":         "rgba(255,255,255,0.85)",
                                        "--tw-prose-quote-borders":  "#7C68E1",
                                        "--tw-prose-captions":       "rgba(255,255,255,0.45)",
                                        "--tw-prose-code":           "#A78BFA",
                                        "--tw-prose-pre-code":       "rgba(255,255,255,0.85)",
                                        "--tw-prose-pre-bg":         "rgba(255,255,255,0.04)",
                                        "--tw-prose-th-borders":     "rgba(255,255,255,0.12)",
                                        "--tw-prose-td-borders":     "rgba(255,255,255,0.06)",
                                        "h1, h2, h3, h4": {
                                                "font-family": theme("fontFamily.display").join(", "),
                                                "letter-spacing": "-0.02em",
                                        },
                                        "h2": { "border-bottom": "1px solid rgba(255,255,255,0.08)", "padding-bottom": "0.5rem" },
                                        "a": { "text-decoration": "none", "font-weight": "500", "&:hover": { "opacity": "0.8" } },
                                        "code::before": { content: '""' },
                                        "code::after":  { content: '""' },
                                        "code": { "background": "rgba(255,255,255,0.06)", "padding": "0.15em 0.45em", "border-radius": "0.3rem", "font-size": "0.85em" },
                                        "blockquote p:first-of-type::before": { content: '""' },
                                        "blockquote p:last-of-type::after":   { content: '""' },
                                        "blockquote": { "border-left-width": "3px", "background": "rgba(124,104,225,0.06)", "padding": "0.75rem 1.25rem", "border-radius": "0 0.5rem 0.5rem 0" },
                                        "table": { "border-collapse": "collapse" },
                                        "th": { "background": "rgba(255,255,255,0.04)" },
                                },
                        },
                }),
        }
  },
  plugins: [
    require("tailwindcss-animate"),
    require("@tailwindcss/typography")({
      className: "prose",
    }),
  ],
};