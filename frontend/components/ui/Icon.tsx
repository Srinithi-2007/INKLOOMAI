import type { SVGProps } from "react";

export type IconName =
  | "arrow-right"
  | "check"
  | "compass"
  | "eye"
  | "eye-off"
  | "sparkles"
  | "users"
  | "shield"
  | "mail"
  | "user"
  | "lock"
  | "globe"
  | "briefcase"
  | "pen"
  | "x"
  | "menu"
  | "refresh"
  | "bell"
  | "paperclip"
  | "bar-chart"
  | "download"
  | "trash";

const paths: Record<IconName, string> = {
  "arrow-right": "M5 12h14M13 6l6 6-6 6",
  check: "M5 12l4 4 10-10",
  compass: "M12 2a10 10 0 100 20 10 10 0 000-20zm4 6-2.5 6.5L9 17l2.5-6.5L15 8z",
  eye: "M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12zm10 3a3 3 0 100-6 3 3 0 000 6z",
  "eye-off": "M3 3l18 18M10.6 6.1A10 10 0 0112 6c6.5 0 10 6 10 6a17 17 0 01-3.3 3.9M6.6 6.6A17 17 0 002 12s3.5 6 10 6a10 10 0 005.4-1.6M9.9 9.9a3 3 0 004.2 4.2",
  sparkles: "M12 3l1.8 4.6L18 9.5l-4.2 1.9L12 16l-1.8-4.6L6 9.5l4.2-1.9zM19 15l.9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9z",
  users: "M16 11a4 4 0 10-8 0 4 4 0 008 0zM4 21a8 8 0 0116 0",
  shield: "M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z",
  mail: "M4 5h16v14H4zM4 6l8 7 8-7",
  user: "M12 12a4 4 0 100-8 4 4 0 000 8zM4 21a8 8 0 0116 0",
  lock: "M6 11h12v9H6zM8 11V8a4 4 0 118 0v3",
  globe: "M12 2a10 10 0 100 20 10 10 0 000-20zM2 12h20M12 2a15 15 0 010 20M12 2a15 15 0 000 20",
  briefcase: "M3 7h18v12H3zM9 7V4h6v3",
  pen: "M4 20h4L19 9l-4-4L4 16zM14 6l4 4",
  x: "M6 6l12 12M18 6L6 18",
  menu: "M4 6h16M4 12h16M4 18h16",
  refresh: "M21 12a9 9 0 00-9-9 9.75 9.75 0 00-6.74 2.74L3 8m0 0V3m0 5h5M3 12a9 9 0 009 9 9.75 9.75 0 006.74-2.74L21 16m0 0v5m0-5h-5",
  bell: "M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0",
  paperclip: "M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48",
  "bar-chart": "M18 20V10M12 20V4M6 20v-6",
  download: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3",
  trash: "M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2",
};

type Props = SVGProps<SVGSVGElement> & { name: IconName; size?: number };

export default function Icon({ name, size = 16, className, ...rest }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
      {...rest}
    >
      <path d={paths[name]} />
    </svg>
  );
}