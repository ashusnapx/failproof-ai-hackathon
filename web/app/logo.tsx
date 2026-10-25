// TruePe mark: a rupee inside a speech bubble — money moves only on a human's words.
export function Mark({ size = 48 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <rect width="64" height="64" rx="13" fill="#1a1a1a" />
      <path d="M19 9h26a9 9 0 0 1 9 9v17a9 9 0 0 1-9 9H31l-11 10 1-10h-2a9 9 0 0 1-9-9V18a9 9 0 0 1 9-9z" fill="#f6c700" />
      <path d="M22 17h20M22 24h20M27 17c10 0 10 14 0 14h-4l13 9" fill="none" stroke="#1a1a1a" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Logo({ size = 48 }: { size?: number }) {
  return (
    <span className="logo" style={{ fontSize: size * 0.75 }}>
      <Mark size={size} />
      <span>TruePe</span>
    </span>
  );
}
