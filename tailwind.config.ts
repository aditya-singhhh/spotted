import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        paper: '#FFFCF4',
        ink: '#14171A',
        slate: '#6E7278',
        yellow: '#FFD23F',
        yellowSoft: '#FFF3CE',
        pink: '#FF4D6A',
        pinkSoft: '#FFE3E9',
        green: '#149A63',
        greenSoft: '#DEFBEE',
        red: '#E23B3B',
        redSoft: '#FCE3E3'
      },
      fontFamily: {
        display: ['"Bricolage Grotesque"', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
        mono: ['"Space Mono"', 'monospace']
      },
      boxShadow: {
        offset: '5px 5px 0px rgba(20,23,26,1)',
        offsetSm: '3px 3px 0px rgba(20,23,26,1)'
      }
    }
  },
  plugins: []
};

export default config;
