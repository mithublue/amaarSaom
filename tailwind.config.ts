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
        // Ramadan Theme Colors
        primary: {
          DEFAULT: '#6366F1',
          900: '#312E81',
          800: '#3730A3',
          700: '#4338CA',
          600: '#4F46E5',
          500: '#6366F1',
          400: '#818CF8',
          300: '#A5B4FC',
          200: '#C7D2FE',
          100: '#E0E7FF',
        },
        secondary: {
          DEFAULT: '#F59E0B',
          900: '#78350F',
          800: '#92400E',
          700: '#B45309',
          600: '#D97706',
          500: '#F59E0B',
          400: '#FBBF24',
          300: '#FCD34D',
          200: '#FDE68A',
          100: '#FEF3C7',
        },
        accent: {
          DEFAULT: '#14B8A6',
          700: '#0F766E',
          600: '#0D9488',
          500: '#14B8A6',
          400: '#2DD4BF',
          300: '#5EEAD4',
          200: '#99F6E4',
          100: '#CCFBF1',
        },
        background: {
          dark: '#0F172A',
          darker: '#020617',
          card: '#1E293B',
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
