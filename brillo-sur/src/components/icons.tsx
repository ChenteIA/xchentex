type IconProps = { size?: number; color?: string };

const base = (size: number) => ({
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  fill: "none",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
});

export function DropIcon({ size = 22, color = "var(--ember)" }: IconProps) {
  return (
    <svg {...base(size)} stroke={color}>
      <path d="M12 3c3 4 6 7 6 10.5A6 6 0 0 1 6 13.5C6 10 9 7 12 3z" />
    </svg>
  );
}

export function ArrowCircleIcon({ size = 18, color = "var(--ember)" }: IconProps) {
  return (
    <svg {...base(size)} stroke={color}>
      <circle cx="12" cy="12" r="9" />
      <path d="M10 8l4 4-4 4" />
    </svg>
  );
}

export function WhatsAppIcon({ size = 18, color = "#ffffff" }: IconProps) {
  return (
    <svg {...base(size)} stroke={color}>
      <path d="M21 11.5a8.4 8.4 0 0 1-12.5 7.4L3 21l2.1-5.3A8.5 8.5 0 1 1 21 11.5z" />
    </svg>
  );
}
