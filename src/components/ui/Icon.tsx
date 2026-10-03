/** Minimal inline icon set (24×24, stroke-based) — avoids pulling in an icon library. */
const PATHS = {
  menu: "M4 6h16M4 12h16M4 18h16",
  close: "M6 6l12 12M18 6L6 18",
  sun: "M12 4V2m0 20v-2m8-8h2M2 12h2m13.66-5.66l1.41-1.41M4.93 19.07l1.41-1.41m0-11.32L4.93 4.93m14.14 14.14l-1.41-1.41M12 17a5 5 0 100-10 5 5 0 000 10z",
  moon: "M21 12.8A9 9 0 1111.2 3a7 7 0 009.8 9.8z",
  monitor: "M3 5h18v11H3zM8 20h8M12 16v4",
  home: "M3 11l9-7 9 7v9a1 1 0 01-1 1h-5v-6H9v6H4a1 1 0 01-1-1z",
  book: "M4 5a2 2 0 012-2h13v16H6a2 2 0 00-2 2zM4 5v16M19 19v2H6",
  practice: "M9 11l3 3 8-8M20 12v7a2 2 0 01-2 2H6a2 2 0 01-2-2V5a2 2 0 012-2h9",
  exam: "M9 3h6v3H9zM7 5H5v16h14V5h-2M8 11h8M8 15h5",
  case: "M4 7h16v12H4zM9 7V5h6v2M4 12h16",
  review: "M4 4v6h6M20 20v-6h-6M5.6 15A8 8 0 0019 13M18.4 9A8 8 0 005 11",
  cards: "M3 7h13v13H3zM8 4h13v13",
  search: "M11 18a7 7 0 100-14 7 7 0 000 14zM21 21l-5-5",
  tool: "M14.7 6.3a4 4 0 00-5.4 5.4L3 18v3h3l6.3-6.3a4 4 0 005.4-5.4l-2.5 2.5-2.4-.6-.6-2.4z",
  chevronRight: "M9 6l6 6-6 6",
  flag: "M5 21V4h11l-2 4 2 4H5",
  clock: "M12 21a9 9 0 100-18 9 9 0 000 18zM12 7v5l3 2",
  grid: "M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z",
  route: "M6 19a2 2 0 100-4 2 2 0 000 4zM18 9a2 2 0 100-4 2 2 0 000 4zM8 17h6a3 3 0 000-6h-4a3 3 0 010-6h6",
} as const;

export type IconName = keyof typeof PATHS;

export function Icon({ name, className = "h-5 w-5" }: { name: IconName; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <path d={PATHS[name]} />
    </svg>
  );
}
