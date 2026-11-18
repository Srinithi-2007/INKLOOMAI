import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        ink: '#191033',
        'ink-body': '#292344',
        'ink-muted': '#605a7e',
        primary: '#5934D3',
        brand: '#5934D3',
        accent: '#7252ED',
        deep: '#4A2EBB',
        lilac: '#B8A8E8',
        lavender: '#F5F2FF',
        soft: '#EDE9FA',
        mist: '#E4DFFC',
        'brand-50': '#F5F2FF',
        'brand-100': '#EDE9FA',
        'brand-600': '#4A2EBB',
        'violet': '#5934D3',
        'green': '#16A34A',
        'lime': '#A3E635',
        'red': '#BA1A1A',
        'danger': '#BA1A1A',
        'amber': '#E8772E',
        'mint': '#D1FAE5',
        'success': '#16A34A',
        canvas: '#FCF8FF',
        line: '#E4DFFC',
        border: '#E4DFFC',
        surface: '#F5F2FF',
        'danger-100': '#FEE2E2',
        'danger-900': '#7F1D1D',
        'green-100': '#D1FAE5',
        'green-900': '#065F46',
      },
      fontFamily: {
        heading: ['Plus Jakarta Sans', 'sans-serif'],
        display: ['Hanken Grotesk', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      fontSize: {
        '11px': '11px',
        '13px': '13px',
        '15px': '15px',
      },
      borderRadius: {
        'btn': '6px',
        'card': '12px',
        'xl': '16px',
        '2xl': '20px',
      },
      boxShadow: {
        'card': '0px 2px 12px 0px rgba(41,35,68,0.06)',
        'soft': '0px 1px 2px 0px rgba(0,0,0,0.05)',
        '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;