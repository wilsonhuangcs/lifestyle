// Lifestyle logomark — a bold italic "L" with heavily rounded corners.
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
        d="M 59 38 Q 60 24 74 24 L 138 24 Q 156 24 154 42 L 143 127 Q 142 139 154 139 L 198 139 Q 212 139 212 153 L 212 198 Q 212 216 194 216 L 60 216 Q 46 216 47 202 Z"
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
        d="M 59 38 Q 60 24 74 24 L 138 24 Q 156 24 154 42 L 143 127 Q 142 139 154 139 L 198 139 Q 212 139 212 153 L 212 198 Q 212 216 194 216 L 60 216 Q 46 216 47 202 Z"
        fill={f}
      />
    </svg>
  );
}

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
