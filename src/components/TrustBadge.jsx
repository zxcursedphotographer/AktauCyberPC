const T = [
  ["Под наблюдением", "#ef4444"],
  ["Низкое доверие", "#f97316"],
  ["Среднее доверие", "#eab308"],
  ["Высокое доверие", "#22c55e"],
  ["Полное доверие", "#06b6d4"],
];

export const trustInfo = (s) => T[Math.min(4, Math.floor((Math.max(1, s) - 1) / 20))];

const P = "M12 2 21 5.5V12c0 5-4 8.5-9 10-5-1.5-9-5-9-10V5.5Z";

export default function TrustBadge({ score = 50, size = 64, label = false }) {
  const safeScore = Math.min(100, Math.max(1, score));
  const [text, color] = trustInfo(safeScore);
  const id = `sh-${safeScore}-${size}`;
  const y = 22 - 20 * (safeScore / 100);

  return (
    <span
      className="inline-flex items-center gap-2"
      title={`Траст-фактор: ${safeScore}/100 · ${text}`}
    >
      <svg width={size} height={size} viewBox="0 0 24 24">
        <defs>
          <clipPath id={id}>
            <rect x="0" y={y} width="24" height="24" />
          </clipPath>
        </defs>
        <path d={P} fill="none" stroke={color} strokeWidth="1.5" />
        <path d={P} fill={color} fillOpacity=".85" clipPath={`url(#${id})`} />
        <text
          x="12"
          y="14.5"
          textAnchor="middle"
          fontSize="7"
          fontWeight="700"
          fill="#fff"
        >
          {safeScore}
        </text>
      </svg>
      {label && (
        <span className="text-sm">
          <b style={{ color }}>{text}</b>
          <br />
          {safeScore}% доверия
        </span>
      )}
    </span>
  );
}