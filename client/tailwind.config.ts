import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        base: '#0B0705',
        surface: '#15100C',
        raised: '#1F1710',
        line: '#3A2A1E',
        primary: {
          DEFAULT: '#FF6B1A',
          hover: '#FF8238',
          press: '#E55A0F',
          soft: 'rgba(255,107,26,0.12)',
        },
        onprimary: '#140A04',
        parchment: {
          DEFAULT: '#E9D8B4',
          dark: '#CDB88C',
        },
        ink: '#2B1E12',
        t1: '#F5EDE0',
        t2: '#BFB2A0',
        t3: '#8A7C6B',
        success: {
          DEFAULT: '#2FA866',
          bg: '#0F2A1F',
        },
        danger: {
          DEFAULT: '#E0382F',
          bg: '#2A0F0D',
        },
        warning: '#F5A524',
        hint: {
          DEFAULT: '#F3D9A6',
        },
        string: {
          red: '#C0392B',
        },
        s1: '#FF6B1A',
        s2: '#6FA8DC',
        s3: '#E9D8B4',
        s4: '#D98BA0',
        s5: '#5FB8A8',
      },
      fontFamily: {
        display: ['"Bebas Neue"', 'Impact', 'sans-serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
        hand: ['Caveat', 'cursive'],
        type: ['"Special Elite"', 'monospace'],
      },
      borderRadius: {
        card: '12px',
        btn: '8px',
        paper: '4px',
      },
      boxShadow: {
        panel: '0 8px 32px rgba(0,0,0,.6)',
        selected: '0 0 24px rgba(255,107,26,.35)',
      },
    },
  },
  plugins: [],
} satisfies Config;
