export default function Logo() {
  return (
    <svg width="32" height="32" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#D4A017" />
          <stop offset="100%" stopColor="#0F6E2E" />
        </linearGradient>
      </defs>
      
      {/* Oil drop shape */}
      <path
        d="M50 10 C50 10 20 50 20 75 C20 90 33 100 50 100 C67 100 80 90 80 75 C80 50 50 10 50 10Z"
        fill="url(#logoGradient)"
      />
      
      {/* Shine effect */}
      <path
        d="M40 35 C40 35 35 55 35 70 C35 82 40 92 50 95"
        stroke="white"
        strokeWidth="4"
        strokeOpacity="0.3"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}
