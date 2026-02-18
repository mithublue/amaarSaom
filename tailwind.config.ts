import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Premium Islamic Green Theme
        primary: {
          DEFAULT: '#10B981', // Emerald 500 (Keep for legacy refs, but prefer 700/800 for main)
          950: '#022C22', // Deepest Green
          900: '#064E3B', // Deep Green
          800: '#065F46', // Rich Green
          700: '#047857', // Jewel Green
          600: '#059669', // Emerald
          500: '#10B981', // Standard
          400: '#34D399', // Bright
          300: '#6EE7B7', // Light
          200: '#A7F3D0', // Pale
          100: '#D1FAE5', // Mint
          50: '#ECFDF5',  // Ice
        },
        // Gold/Amber Accents
        accent: {
          DEFAULT: '#F59E0B', // Amber 500
          900: '#78350F',
          800: '#92400E',
          700: '#B45309',
          600: '#D97706',
          500: '#F59E0B', // Gold
          400: '#FBBF24', // Bright Gold
          300: '#FCD34D',
          200: '#FDE68A',
          100: '#FEF3C7',
          50: '#FFFBEB',
        },
        background: {
          default: '#022C22', // Very Dark Green (Body)
          paper: '#064E3B',   // Deep Green (Cards)
          lighter: '#065F46', // Highlighted Cards
        },
        text: {
          primary: '#FFFFFF',    // White
          secondary: '#D1FAE5',  // Mint/Pale Green
          muted: '#6EE7B7',      // Soft Green
          inverted: '#064E3B',   // Deep Green (for text on Gold strings)
        },
      },
      fontFamily: {
        sans: ['Inter', 'Roboto', 'sans-serif'],
        heading: ['Poppins', 'Montserrat', 'sans-serif'],
        arabic: ['"Noto Naskh Arabic"', 'Amiri', 'serif'],
        bangla: ['"Hind Siliguri"', '"Noto Sans Bengali"', 'sans-serif'],
      },
      borderRadius: {
        'app': '16px',
        'app-lg': '24px',
      },
      boxShadow: {
        'glass': '0 8px 32px rgba(0, 0, 0, 0.3)',
        'glow': '0 0 20px rgba(16, 185, 129, 0.3)',
        'gold-glow': '0 0 15px rgba(245, 158, 11, 0.3)',
      },
      backgroundImage: {
        'islamic-pattern': "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2310B981' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'float': 'float 3s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
