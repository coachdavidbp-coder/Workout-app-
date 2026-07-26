// Simple inline stroke icons (currentColor).
const base = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
};

export const IconTrain = (p) => (
  <svg viewBox="0 0 24 24" {...base} {...p}>
    <path d="M6.5 6.5l11 11" />
    <rect x="1.5" y="8.5" width="4" height="7" rx="1" transform="rotate(-45 3.5 12)" />
    <rect x="18.5" y="8.5" width="4" height="7" rx="1" transform="rotate(-45 20.5 12)" />
    <path d="M4.8 9.8l1.5-1.5M17.7 17.7l1.5-1.5" />
  </svg>
);

export const IconMeals = (p) => (
  <svg viewBox="0 0 24 24" {...base} {...p}>
    <path d="M5 3v7a2 2 0 002 2h0V3M6 3v4M8 3v4M19 3c-1.5 0-2.5 2-2.5 5s1 4 2.5 4" />
    <path d="M5 12v9M19 12v9" />
  </svg>
);

export const IconWeight = (p) => (
  <svg viewBox="0 0 24 24" {...base} {...p}>
    <path d="M4 20l4-11h8l4 11z" />
    <circle cx="12" cy="6" r="2" />
    <path d="M10.5 13.5L12 11l1.5 2.5" />
  </svg>
);

export const IconMore = (p) => (
  <svg viewBox="0 0 24 24" {...base} {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 8v4l3 2" />
  </svg>
);

export const IconPlay = (p) => (
  <svg viewBox="0 0 24 24" fill="currentColor" stroke="none" {...p}>
    <path d="M7 5.5v13l11-6.5z" />
  </svg>
);

export const IconChevron = (p) => (
  <svg viewBox="0 0 24 24" {...base} {...p}>
    <path d="M6 9l6 6 6-6" />
  </svg>
);

export const IconSearch = (p) => (
  <svg viewBox="0 0 24 24" {...base} {...p}>
    <circle cx="11" cy="11" r="7" />
    <path d="M20 20l-3.5-3.5" />
  </svg>
);
