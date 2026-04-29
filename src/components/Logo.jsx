// Lifestyle logomark — a chunky, forward-leaning L with a curved heel.
// Drawn as a single closed path on a 240×240 grid so it scales cleanly to 16×16.
// `gradient` accepts: false (solid `fill`), "light" (dark→gray for light bg),
// or "dark" (white→gray for dark bg).

let _gradId = 0;
const nextId = () => `lsg-${++_gradId}`;

export function Mark({ size = 24, fill = 'currentColor', gradient = false }) {
  const id = gradient ? nextId() : null;
  const stops = gradient === 'dark'
    ? { from: '#FFFFFF', to: '#7A7A72' }
    : gradient === 'light'
      ? { from: '#0A0A09', to: '#7A7A72' }
      : null;
  const f = id ? `url(#${id})` : fill;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 240 240"
      fill="none"
      aria-label="Lifestyle"
      role="img"
    >
      {stops && (
        <defs>
          <linearGradient id={id} x1="20%" y1="0%" x2="80%" y2="100%">
            <stop offset="0%" stopColor={stops.from} />
            <stop offset="100%" stopColor={stops.to} />
          </linearGradient>
        </defs>
      )}
      <path
        d="M 92 36 L 148 36 Q 156 36 154 44 L 130 138 Q 128 146 136 146 L 196 146 Q 204 146 204 154 L 204 196 Q 204 204 196 204 L 60 204 Q 44 204 48 188 L 88 44 Q 90 36 92 36 Z"
        fill={f}
      />
    </svg>
  );
}

export function MarkCut({ size = 24, fill = 'currentColor', gradient = false }) {
  const id = gradient ? nextId() : null;
  const stops = gradient === 'dark'
    ? { from: '#FFFFFF', to: '#7A7A72' }
    : gradient === 'light'
      ? { from: '#0A0A09', to: '#7A7A72' }
      : null;
  const f = id ? `url(#${id})` : fill;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 240 240"
      fill="none"
      aria-label="Lifestyle"
      role="img"
    >
      {stops && (
        <defs>
          <linearGradient id={id} x1="20%" y1="0%" x2="80%" y2="100%">
            <stop offset="0%" stopColor={stops.from} />
            <stop offset="100%" stopColor={stops.to} />
          </linearGradient>
        </defs>
      )}
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M 92 36 L 148 36 Q 156 36 154 44 L 130 138 Q 128 146 136 146 L 196 146 Q 204 146 204 154 L 204 196 Q 204 204 196 204 L 60 204 Q 44 204 48 188 L 88 44 Q 90 36 92 36 Z M 110 96 Q 134 100 130 124 Q 126 144 100 142 Q 84 140 88 124 Z"
        fill={f}
      />
    </svg>
  );
}

// Mark + "Lifestyle" lockup. Inter 600 at -4.5% tracking per the brand spec.
export function Wordmark({ size = 28, dark = false, gap = 10 }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap }}>
      <Mark size={size} gradient={dark ? 'dark' : 'light'} />
      <span
        style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: size * 0.72,
          fontWeight: 600,
          letterSpacing: '-0.045em',
          color: dark ? '#F5F4F0' : '#0A0A09',
          lineHeight: 1,
        }}
      >
        Lifestyle
      </span>
    </span>
  );
}
