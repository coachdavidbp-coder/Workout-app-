# US VS THEM — design brief

Paste this into a fresh Claude conversation before asking for any design work.
It gives Claude everything it needs to produce something that drops straight
into this app instead of something that has to be rebuilt.

Everything below is copied from the real code, not invented. If a value here
ever disagrees with `src/styles.css`, the stylesheet wins.

---

## The app in one paragraph

US VS THEM is a college-football training app for one athlete. It runs as a
web app installed to the iPhone home screen — a React PWA, portrait only, dark
by default. The tone is a stadium tunnel before kickoff: black and deep blue,
brushed chrome, electric blue lightning. Confident, not cute. No pastels, no
rounded friendly mascots, no emoji as decoration.

## Stack and constraints

- React 18 + Vite. Plain CSS with custom properties — no Tailwind, no CSS-in-JS.
- Installed PWA, so **everything must work offline**. Nothing may load from a
  CDN at runtime: no external fonts, scripts, stylesheets or images.
- Motion is hand-written canvas or CSS. Lottie is available for small
  celebratory moments (`lottie-web`, already installed).
- Target is a 390 × 844 iPhone screen. Design portrait first.
- Dark is the default and the one that matters. A light theme exists.
- Respect `prefers-reduced-motion` — always offer a still fallback.

## Colours

Grounds
- App background `#01060F`, painted as a gradient:
  `linear-gradient(178deg, #000 0%, #000 26%, #061530 62%, #0B2E63 100%)`
- Raised background / sheets `#04101F`

Surfaces are frosted glass, not solid fills
- Card `rgba(255,255,255,0.065)` with `backdrop-filter: blur(14px) saturate(1.3)`
- Inset row `rgba(255,255,255,0.035)`
- Border `rgba(255,255,255,0.14)`
- Lit top edge `rgba(255,255,255,0.22)`

Accent — electric blue
- `#4C8DFF` primary, `#7CAEFF` highlight
- Glow `rgba(76,141,255,0.45)`, text on accent `#06122B`

Semantic — these are meanings, not decoration
- `#35C26B` good / done / goal hit
- `#FF5A5F` personal records, alerts
- `#FFC24C` warnings
- `#35D0C0` water and secondary metrics

Text
- Primary `#ECF1FB`, secondary `#B9C3DA`, muted `#8792AD`

Splash-only chrome palette (the VS intro)
- Chrome `#D8DDE6`, gunmetal `#23272F`, splash black `#05070F`, bolt `#3D8BFF`

## Type

- Display: **Archivo Variable** — headings, numbers, buttons, uppercase labels.
  Heavy weights (700–800), tight tracking on headings, wide tracking
  (0.1–0.2em) on small uppercase labels.
- Body: **Inter Variable**.
- Any figure that lines up in a column uses `font-variant-numeric: tabular-nums`.

## Shape and spacing

- Radii: 8px small, 16px cards, 22px large surfaces, 100px pills.
- Cards sit on the gradient with a lit top edge; they do not use drop shadows
  to separate, they use translucency.

## Screens

Home, Train, Run, Nutrition, Prep, Progress, You — plus Login, Onboarding, and
two plan builders. Bottom tab bar, fixed.

---

## What to ask for

Say what you want and which of these you want back. Ask for **one** format —
mixing them creates work.

**1. A Lottie animation** (badges, celebrations, loaders, icons)
> "Design a Lottie animation for X, in the US VS THEM style above. Give me
> Bodymovin JSON, 200×200, 60fps, under 2 seconds, shapes only — no images, no
> expressions, no text layers. Output the raw JSON."

Drop the file into `src/data/lottie/` and it works. Files downloaded from
LottieFiles work the same way.

**2. A screen or component mock**
> "Design the X screen for US VS THEM using the tokens above. Give me a single
> self-contained HTML file, 390×844, inline CSS, no external requests."

**3. A change to something that exists**
Screenshot it, paste the screenshot, and say what's wrong. This is the fastest
route by a distance.

## What to hand back to me

Whatever comes out — JSON, an HTML mock, or just a screenshot you like. I'll
wire it into the real app, check it on a real screen, and show you a preview
before anything ships.

## Things to tell it not to do

- No CDN links, Google Fonts, or remote images — the CSP blocks them and the
  app must work offline.
- No new UI framework or component library.
- No light-mode-first designs.
- No emoji used as iconography.
- Don't invent brand colours; use the palette above.
