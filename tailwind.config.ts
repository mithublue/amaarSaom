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
        // Serene Islamic Theme
        primary: {
          DEFAULT: '#10B981', // Emerald 500
          900: '#064E3B', // Emerald 900
          800: '#065F46', // Emerald 800
          700: '#047857', // Emerald 700
          600: '#059669', // Emerald 600
          500: '#10B981', // Emerald 500
          400: '#34D399', // Emerald 400
          300: '#6EE7B7', // Emerald 300
          200: '#A7F3D0', // Emerald 200
          100: '#D1FAE5', // Emerald 100
          50: '#ECFDF5',  // Emerald 50
        },
        secondary: {
          DEFAULT: '#F59E0B', // Amber 500
          900: '#78350F', // Amber 900
          800: '#92400E', // Amber 800
          700: '#B45309', // Amber 700
          600: '#D97706', // Amber 600
          500: '#F59E0B', // Amber 500
          400: '#FBBF24', // Amber 400
          300: '#FCD34D', // Amber 300
          200: '#FDE68A', // Amber 200
          100: '#FEF3C7', // Amber 100
          50: '#FFFBEB',  // Amber 50
        },
        accent: {
          DEFAULT: '#D97706', // Gold (Secondary 600)
          700: '#B45309',
          600: '#D97706',
          500: '#F59E0B',
          400: '#FBBF24',
          300: '#FCD34D',
          200: '#FDE68A',
          100: '#FEF3C7',
        },
        background: {
          dark: '#022C22',   // Deep Forest Green
          darker: '#064E3B', // Dark Emerald
          card: '#065F46',   // Emerald 800
          light: '#F0FDF4',  // Light Green Tint
        },
        text: {
          primary: '#F1F5F9',
          secondary: '#CBD5E1',
          muted: '#94A3B8',
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
        'glass': '0 8px 32px rgba(0, 0, 0, 0.2)',
        'glow': '0 0 20px rgba(99, 102, 241, 0.5)',
      },
      backdropBlur: {
        'glass': '10px',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'slide-down': 'slideDown 0.5s ease-out',
        'glow-pulse': 'glowPulse 2s ease-in-out infinite',
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
        slideDown: {
          '0%': { transform: 'translateY(-20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        glowPulse: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(99, 102, 241, 0.5)' },
          '50%': { boxShadow: '0 0 40px rgba(99, 102, 241, 0.8)' },
        },
      },
      maxWidth: {
        'mobile-app': '480px',
      },
    },
  },
  plugins: [],
} satisfies Config;
