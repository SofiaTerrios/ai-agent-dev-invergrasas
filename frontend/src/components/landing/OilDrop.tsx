export default function OilDrop({ colors, size = 200 }: { colors: string[]; size?: number }) {
  return (
    <svg width={size} height={size * 1.4} viewBox="0 0 100 140" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id={`drop-${colors[0]}`} x1="30" y1="20" x2="80" y2="130" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor={colors[0]} />
          <stop offset="50%" stopColor={colors[1]} />
          <stop offset="100%" stopColor={colors[2]} />
        </linearGradient>
        <linearGradient id={`shine-${colors[0]}`} x1="30" y1="40" x2="50" y2="100" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="white" stopOpacity="0.5" />
          <stop offset="100%" stopColor="white" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path
        d="M50 10 C50 10 10 60 10 90 C10 113 28 130 50 130 C72 130 90 113 90 90 C90 60 50 10 50 10Z"
        fill={`url(#drop-${colors[0]})`}
      />
      <path
        d="M35 55 C35 55 25 80 25 90 C25 103 32 113 42 118"
        stroke={`url(#shine-${colors[0]})`}
        strokeWidth="8"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}
