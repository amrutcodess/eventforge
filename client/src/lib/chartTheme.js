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

const channels = accentChannels();

export const chartTheme = {
  accent: `rgb(${channels})`,
  accentSoft: `rgba(${channels.replace(/\s+/g, ', ')}, 0.14)`,
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
