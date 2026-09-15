// Native design tokens mirroring the web's minimal-premium system.
export const colors = {
  paper: '#FFFFFF',
  canvas: '#FAFAFA',
  ink: '#111827',
  slate: '#6B7280',
  line: '#E5E7EB',
  accent: '#4F46E5',
  accentSoft: '#EEF2FF',
  green: '#059669',
  greenSoft: '#ECFDF5',
  yellow: '#F59E0B',
  yellowSoft: '#FEF3C7',
  red: '#DC2626',
  white: '#FFFFFF'
};

export const radius = { sm: 8, md: 12, lg: 16, xl: 20, pill: 999 };
export const space = (n: number) => n * 4;

// Space-Mono-like monospace for numbers (system monospace on device).
export const mono = 'monospace';

export function inr(n: unknown): string {
  const v = Number(n ?? 0);
  return `₹${v.toLocaleString('en-IN')}`;
}
