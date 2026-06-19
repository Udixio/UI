# Theme Builder — Design Spec
**Date:** 2026-06-20  
**Status:** Approved  
**Scope:** `apps/doc/src/pages/theme/builder.astro` and its component tree

---

## Context

The theme builder is the centrepiece of the Udixio UI documentation site. It lets users (internal and future clients) explore how the Material Design 3 color system works — pick a source color, watch the full HCT palette generate in real-time, and see every semantic token applied live across real components.

The previous implementation had three problems:
- The right panel used tab-switching (hidden content) instead of a natural scroll flow
- A redundant "Couleur de base" card lived inside `ThemePreviewTabs` even though `ThemePicker` already handles those controls
- The token view (`TokenGallery`) was a flat unsorted list with no semantic grouping or usage context

---

## Layout Architecture

**Left panel — sticky, max-w-lg**  
`ThemePicker`: source color picker, dark mode toggle, contrast slider, six palette accordions (Primary / Secondary / Tertiary / Error / Neutral / NeutralVariant). Already implemented; not modified.

**Right panel — flex-[2], scrollable**  
Three full-width sections stacked vertically. A floating pill nav anchors to the top of the viewport; clicking a pill smooth-scrolls to the corresponding section anchor. The active pill highlights automatically via IntersectionObserver.

```
┌─────────────────────────────────────────────────────────┐
│  LEFT (sticky)          │  RIGHT (scroll)               │
│  ThemePicker            │  ┌──── floating pill nav ───┐ │
│  ─ Source color         │  │  Aperçu · Palette · Tokens│ │
│  ─ Dark / Contrast      │  └───────────────────────────┘ │
│  ─ Palette accordions   │                               │
│                         │  §01 Aperçu                   │
│                         │  §02 Palette                  │
│                         │  §03 Tokens                   │
└─────────────────────────────────────────────────────────┘
```

---

## Section 01 — Aperçu

**Purpose:** Show the theme applied to realistic UI contexts, not just swatches.

**Contents:**
- Two phone mockups side-by-side: **Task Manager** (cards, FAB, chips) and **Chat** (message bubbles, bottom nav, avatar)
- One wider **Web Dashboard** strip below: sidebar nav + stat cards + data table row
- All mockup elements use `var(--color-*)` CSS custom properties — they reflect the live theme without any JS

**Interaction:** No controls in this section. Pure visual feedback from the left panel.

**Key layout rule:** Phone mockups use `aspect-ratio: 9/19.5` at fixed width (~240px). Dashboard strip fills full panel width.

---

## Section 02 — Palette

**Purpose:** Expose the raw palette math — the tone ramps from 0 to 100 for each color family.

**Contents:**
- Five families: Primary, Secondary, Tertiary, Neutral, NeutralVariant
- Each family is an accordion (collapsed by default except Primary)
- Inside each accordion: a horizontal strip of 13 tone stops (0, 5, 10, 20, 30, 40, 50, 60, 70, 80, 90, 95, 99, 100)
- Tone stops that map to a semantic token show a small badge (`primary`, `on-primary`, `container`, `on-container`, `fixed`, `dim`)
- Highlighted tones (the semantic ones) have a slightly taller swatch

**Data source:** `themeServiceStore` (atom<API|null>) — call `api.palettes.get(family).tone(t)` for each stop (returns ARGB; convert with `hexFromArgb()` from `@material/material-color-utilities`).

**Key UX rule:** The tone strip is not interactive. It's read-only. The editing happens in the left panel.

---

## Section 03 — Tokens

**Purpose:** Give each semantic color a name, a CSS variable, a hex value, and a one-line usage description so developers know when to reach for it.

**Contents:**
- Search input filters token names and CSS variables in real-time
- Filter chips: `Tous` / `Primary` / `Secondary` / `Tertiary` / `Surface` / `Feedback`
- Groups displayed:
  - **Primary** — primary, on-primary, primary-container, on-primary-container
  - **Secondary** — same four-token pattern
  - **Tertiary** — same four-token pattern
  - **Surface** — surface, surface-container, surface-container-high, on-surface, on-surface-variant, outline, outline-variant
  - **Feedback** — error, on-error, error-container, on-error-container, success, on-success (custom tokens)

**Token card anatomy:**
```
┌──────────────────────────┐
│  [swatch — 72px tall]    │  ← background: var(--color-*)
│  token-name              │  ← contrasting text
│  --color-token-name      │  ← monospace, 65% opacity
├──────────────────────────┤
│  #RRGGBB     Usage desc  │
└──────────────────────────┘
       ↑ hover reveals [HEX] [VAR] copy buttons
```

**On-pair indicator:** Each group opens with a single line explaining the relationship (`primary → text on it: on-primary — same logic for all containers`). This teaches the MD3 mental model inline.

**Data source:** `themeServiceStore` — `api.colors.get(tokenName).getHex()` returns the resolved hex for the current mode.

---

## Floating Pill Nav

A `position: sticky; top: 16px` bar with three pills: `Aperçu`, `Palette`, `Tokens`. Each pill is an anchor link (`href="#section-apercu"` etc.). Active pill is highlighted via `IntersectionObserver` watching each section's `id`.

**Implementation:** A small self-contained `ThemeBuilderNav` React component. It subscribes to no store — purely DOM-driven via the IntersectionObserver API.

```tsx
// Rough shape — exact impl in the plan
const SECTIONS = [
  { id: 'section-apercu', label: 'Aperçu' },
  { id: 'section-palette', label: 'Palette' },
  { id: 'section-tokens', label: 'Tokens' },
];
```

---

## Component Map

```
builder.astro
├── ThemePicker              (existing, no change)
└── ThemeBuilderContent      (new wrapper, replaces ThemePreviewTabs here)
    ├── ThemeBuilderNav      (new — floating pill nav)
    ├── §01 ThemeApercu      (new — mockups)
    ├── §02 ThemePalette     (replaces old Palette tab content)
    │   └── PaletteFamilyRow (new — tone strip per family)
    └── §03 ThemeTokens      (replaces TokenGallery)
        └── TokenGroupSection (new — one per semantic group)
            └── TokenCard    (replaces ColorTokenCard)
```

`ThemePreviewTabs` is retired on the builder page. It is kept for the homepage (`index.astro`) where a simplified 3-tab view still makes sense given the limited vertical space.

---

## State & Data Flow

| Store | Used by | Purpose |
|-------|---------|---------|
| `themeConfigStore` | `ThemePicker` (write), `ThemeTokens` (read) | Source color, dark mode, contrast |
| `themeServiceStore` | `ThemePalette`, `ThemeTokens` | Resolved palette & token values |

No new stores needed. Both atoms already exist in `apps/doc/src/stores/`.

---

## What Changes vs. What Stays

| File | Action |
|------|--------|
| `apps/doc/src/pages/theme/builder.astro` | Refactor: replace `ThemePreviewTabs` with `ThemeBuilderContent` |
| `apps/doc/src/components/theme/ThemeBuilderContent.tsx` | **New** — wrapper + section anchors |
| `apps/doc/src/components/theme/ThemeBuilderNav.tsx` | **New** — floating pill nav |
| `apps/doc/src/components/theme/ThemeApercu.tsx` | **New** — mockup section |
| `apps/doc/src/components/theme/ThemePalette.tsx` | **New** — replaces old palette tab |
| `apps/doc/src/components/theme/ThemeTokens.tsx` | **New** — replaces TokenGallery on builder |
| `apps/doc/src/components/theme/TokenCard.tsx` | **New** — replaces ColorTokenCard |
| `apps/doc/src/components/theme/TokenGallery.tsx` | **Keep** — still used elsewhere (if any); otherwise retire |
| `apps/doc/src/components/theme/ThemePreviewTabs.tsx` | **Keep** — homepage only |
| `apps/doc/src/components/theme/ThemePicker.tsx` | No change |
| `apps/doc/src/components/theme/ThemeQuickEdit.tsx` | No change |

---

## Out of Scope

- Export to `config.ts` / JSON (noted for future — `serializeThemeContext()` exists in `packages/theme/src/serialize.ts` but no UI yet)
- Secondary / Tertiary palette custom source colors (currently locked to auto-generation from primary)
- Contrast accessibility checker panel

---

## Success Criteria

1. Navigating to `/theme/builder` shows the sticky left panel + scrollable right panel
2. Changing source color in `ThemePicker` updates all three sections in real-time
3. Toggling dark mode flips all tokens and mockup colors instantly
4. The floating nav highlights the active section during scroll
5. Searching in the Tokens section filters token cards without page reload
6. Hovering a token card reveals copy buttons for HEX and `var()` form
