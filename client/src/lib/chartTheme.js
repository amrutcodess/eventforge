// Recharts cannot read Tailwind's theme, so the palette is mirrored here as JS. The
// accent is read from the CSS custom property rather than hardcoded, so re-hueing the
// app in index.css also re-hues the charts — a hardcoded hex would silently survive.
const accentChannels = () => {
  if (typeof window === 'undefined') return '192 0 60';
  const raw = getComputedStyle(document.documentElement)
    .getPropertyValue('--accent')
    .trim();
  return raw || '192 0 60';
};

// Getters rather than plain values. The custom property is only guaranteed to be
// readable once the stylesheet has been applied, and that ordering is not something we
// control: Vite applies its stylesheet at runtime in dev, so a value read at module load
// fell through to the hardcoded fallback and the charts silently kept the OLD hue while
// every other accent surface re-hued. Reading per access removes that ordering dependency
// and makes the "change --accent and nothing else" claim actually true.
export const chartTheme = {
  get accent() {
    // Comma-separated on purpose: this string is handed to Recharts, which writes it to an
    // SVG presentation attribute. Space-separated rgb() is valid CSS Color 4, but the comma
    // form is what presentation attributes are universally parsed for.
    return `rgb(${accentChannels().replace(/\s+/g, ', ')})`;
  },
  get accentSoft() {
    return `rgba(${accentChannels().replace(/\s+/g, ', ')}, 0.14)`;
  },
  grid: '#e4e4e7',
  axis: '#71717b',
  seriesMuted: '#a1a1aa',
  tooltipBg: '#ffffff',
  tooltipBorder: '#e4e4e7',
  tooltipText: '#09090b',
};

export const chartTooltipStyle = {
  backgroundColor: chartTheme.tooltipBg,
  border: `1px solid ${chartTheme.tooltipBorder}`,
  borderRadius: 8,
  boxShadow: '0 8px 24px rgba(9, 9, 11, 0.12)',
  color: chartTheme.tooltipText,
  fontSize: 12,
};
