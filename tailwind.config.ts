import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{js,ts,jsx,tsx,mdx}",
		"./components/**/*.{js,ts,jsx,tsx,mdx}",
		"./app/**/*.{js,ts,jsx,tsx,mdx}",
	],
	theme: {
		extend: {
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
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			keyframes: {
				shake: {
					'0%, 100%': { transform: 'rotate(0deg) scale(1)' },
					// First shake
					'10%': { transform: 'rotate(-3deg) translateX(-4px) scale(1.05)' },
					'20%': { transform: 'rotate(3deg) translateX(4px) scale(1.05)' },
					'30%': { transform: 'rotate(0deg) translateX(0) scale(1.05)' },
					// Small pause
					'35%': { transform: 'rotate(0deg) scale(1.05)' },
					// Second shake
					'45%': { transform: 'rotate(-3deg) translateX(-4px) scale(1.05)' },
					'55%': { transform: 'rotate(3deg) translateX(4px) scale(1.05)' },
					'65%': { transform: 'rotate(0deg) translateX(0) scale(1.05)' },
					// Small pause
					'70%': { transform: 'rotate(0deg) scale(1.05)' },
					// Third shake
					'80%': { transform: 'rotate(-3deg) translateX(-4px) scale(1.05)' },
					'90%': { transform: 'rotate(3deg) translateX(4px) scale(1.05)' },
					'95%': { transform: 'rotate(0deg) translateX(0) scale(1.05)' },
				}
			},
			animation: {
				shake: 'shake 0.8s cubic-bezier(.36,.07,.19,.97) both'
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
