import type { Config } from 'tailwindcss';

// Minimal-premium palette: white surfaces, near-black primary, indigo accent,
// hairline borders. Legacy names (pink/yellow) remapped to muted modern values.
const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        paper: '#FFFFFF',
        canvas: '#FAFAFA',
        ink: '#111827',
        slate: '#6B7280',
        line: '#E5E7EB',
        accent: '#4F46E5',
        accentSoft: '#EEF2FF',
        yellow: '#F59E0B',
        yellowSoft: '#FEF3C7',
        pink: '#4F46E5',
        pinkSoft: '#EEF2FF',
        green: '#059669',
        greenSoft: '#ECFDF5',
        red: '#DC2626',
        redSoft: '#FEF2F2'
      },
      fontFamily: {
        display: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        body: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'monospace']
      },
      boxShadow: {
        offset: '0 1px 3px rgba(17,24,39,0.08), 0 1px 2px rgba(17,24,39,0.04)',
        offsetSm: '0 1px 2px rgba(17,24,39,0.06)',
        card: '0 1px 3px rgba(17,24,39,0.06)',
        lift: '0 8px 24px rgba(17,24,39,0.10)'
      }
    }
  },
  plugins: []
};

export default config;
