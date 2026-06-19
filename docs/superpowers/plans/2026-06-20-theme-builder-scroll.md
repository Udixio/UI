# Theme Builder — Scroll Layout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the tab-switching layout in `builder.astro` with a scroll-based 3-section layout (Aperçu / Palette / Tokens) anchored by a floating pill nav.

**Architecture:** Five new React components slot into a wrapper (`ThemeBuilderContent`) that replaces `ThemePreviewTabs` on the builder page only. Existing components (`PaletteToneRow`, `ColorTokenCard`, `ThemePreviewTabs`) are kept unchanged except for one backward-compatible prop addition to `ColorTokenCard`.

**Tech Stack:** React 18, Astro, nanostores (`themeServiceStore`, `themeConfigStore`), Tailwind CSS (MD3 semantic tokens), `@udixio/theme` (`API`, `ColorFromPalette`, `ColorAlias`), `@material/material-color-utilities` (`hexFromArgb`), `@udixio/icons-rounded-400/*`, `motion/react`.

## Global Constraints

- All Tailwind classes use MD3 semantic tokens (`text-on-surface`, `bg-primary-container`, etc.) — never raw hex or arbitrary Tailwind colors
- Icon imports follow the pattern `import { iIconName } from '@udixio/icons-rounded-400/icon_name_snake_case'`
- Store imports always from `@/stores/themeConfigStore.ts`
- No `client:*` directives in component files — only in `.astro` pages
- Dev server: `pnpm --filter apps-doc dev` (runs at `http://localhost:4321`)
- TypeScript check: `pnpm --filter apps-doc build` (Astro + tsc — expected output: `dist/` with no errors)

---

## File Map

| Action | Path | Responsibility |
|--------|------|----------------|
| Modify | `apps/doc/src/components/theme/ColorTokenCard.tsx` | Add optional `usage?: string` prop (shown in footer) |
| Create | `apps/doc/src/components/theme/ThemeBuilderNav.tsx` | Sticky floating pill nav, IntersectionObserver active state |
| Create | `apps/doc/src/components/theme/ThemeApercu.tsx` | Section 01 — phone mockups + web dashboard strip |
| Create | `apps/doc/src/components/theme/ThemePalette.tsx` | Section 02 — tone ramps per palette family |
| Create | `apps/doc/src/components/theme/ThemeTokens.tsx` | Section 03 — semantic token groups with usage labels |
| Create | `apps/doc/src/components/theme/ThemeBuilderContent.tsx` | Scroll wrapper composing nav + 3 sections |
| Modify | `apps/doc/src/pages/theme/builder.astro` | Swap `ThemePreviewTabs` for `ThemeBuilderContent` |

---

### Task 1: Add `usage` prop to `ColorTokenCard`

**Files:**
- Modify: `apps/doc/src/components/theme/ColorTokenCard.tsx`

**Interfaces:**
- Produces: `ColorTokenCard` now accepts an optional `usage?: string` prop displayed as italic text in the footer alongside the hex value

- [ ] **Step 1: Open the file and locate the Props type**

Read `apps/doc/src/components/theme/ColorTokenCard.tsx`. The `Props` type is at the top:

```tsx
type Props = {
  name: string;
  color: ColorFromPalette;
  onColor?: ColorFromPalette;
  onSelect?: (name: string, color: ColorFromPalette) => void;
  onHoverEnd?: () => void;
};
```

- [ ] **Step 2: Add `usage` to Props and destructure it**

In `ColorTokenCard.tsx`, replace the `Props` type and the function signature:

```tsx
type Props = {
  name: string;
  color: ColorFromPalette;
  onColor?: ColorFromPalette;
  onSelect?: (name: string, color: ColorFromPalette) => void;
  onHoverEnd?: () => void;
  usage?: string;
};

export const ColorTokenCard: React.FC<Props> = ({
  name,
  onSelect,
  color,
  onHoverEnd,
  usage,
}) => {
```

- [ ] **Step 3: Render `usage` in the footer**

In `ColorTokenCard.tsx`, find the footer `<div>` that contains the hex value:

```tsx
<div className="flex items-end justify-between">
  <div className="text-title-medium font-mono font-medium" style={{ textShadow: tone > 60 ? 'none' : '0 1px 2px rgba(0,0,0,0.3)' }}>
    {copiedType === 'hex' ? 'Copied!' : hex}
  </div>
```

Replace that entire `<div className="flex items-end justify-between">` block with:

```tsx
<div className="flex items-end justify-between gap-2">
  <div className="text-title-medium font-mono font-medium shrink-0" style={{ textShadow: tone > 60 ? 'none' : '0 1px 2px rgba(0,0,0,0.3)' }}>
    {copiedType === 'hex' ? 'Copied!' : hex}
  </div>
  {usage && (
    <div className="text-[9px] italic text-right leading-tight opacity-70 truncate" style={{ color: secondaryTextColor }}>
      {usage}
    </div>
  )}
```

- [ ] **Step 4: Verify TypeScript passes**

```bash
pnpm --filter apps-doc build
```

Expected: build completes with no TypeScript errors. `ColorTokenCard` callers that don't pass `usage` are unaffected (prop is optional).

- [ ] **Step 5: Commit**

```bash
git -C /path/to/repo add apps/doc/src/components/theme/ColorTokenCard.tsx
git -C /path/to/repo commit -m "feat: add optional usage prop to ColorTokenCard"
```

---

### Task 2: `ThemeBuilderNav` — Floating pill nav

**Files:**
- Create: `apps/doc/src/components/theme/ThemeBuilderNav.tsx`

**Interfaces:**
- Consumes: DOM IDs `section-apercu`, `section-palette`, `section-tokens` (set by `ThemeBuilderContent` in Task 5)
- Produces: `<ThemeBuilderNav />` — zero props, self-contained

- [ ] **Step 1: Create the file**

Create `apps/doc/src/components/theme/ThemeBuilderNav.tsx`:

```tsx
import React, { useEffect, useState } from 'react';

const SECTIONS = [
  { id: 'section-apercu', label: 'Aperçu' },
  { id: 'section-palette', label: 'Palette' },
  { id: 'section-tokens', label: 'Tokens' },
] as const;

export const ThemeBuilderNav: React.FC = () => {
  const [active, setActive] = useState<string>(SECTIONS[0].id);

  useEffect(() => {
    const observers: IntersectionObserver[] = [];
    SECTIONS.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (!el) return;
      const obs = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) setActive(id);
        },
        { threshold: 0.2, rootMargin: '0px 0px -55% 0px' },
      );
      obs.observe(el);
      observers.push(obs);
    });
    return () => observers.forEach((obs) => obs.disconnect());
  }, []);

  const handleClick = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="sticky top-4 z-10 flex justify-center mb-6 pointer-events-none">
      <div className="inline-flex items-center gap-1 p-1 rounded-full bg-surface-container border border-outline-variant/40 shadow-md backdrop-blur-sm pointer-events-auto">
        {SECTIONS.map(({ id, label }) => (
          <a
            key={id}
            href={`#${id}`}
            onClick={(e) => handleClick(e, id)}
            className={`px-4 py-1.5 rounded-full text-label-large transition-all duration-200 no-underline ${
              active === id
                ? 'bg-primary text-on-primary shadow-sm'
                : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high'
            }`}
          >
            {label}
          </a>
        ))}
      </div>
    </div>
  );
};
```

- [ ] **Step 2: Verify TypeScript**

```bash
pnpm --filter apps-doc build
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add apps/doc/src/components/theme/ThemeBuilderNav.tsx
git commit -m "feat: add ThemeBuilderNav floating pill nav"
```

---

### Task 3: `ThemeApercu` — Section 01 mockups

**Files:**
- Create: `apps/doc/src/components/theme/ThemeApercu.tsx`

**Interfaces:**
- Consumes: nothing (pure JSX, no stores)
- Produces: `<ThemeApercu />` — zero props. All colors via CSS custom properties so they react to the live theme automatically.

- [ ] **Step 1: Create the file**

Create `apps/doc/src/components/theme/ThemeApercu.tsx`:

```tsx
import React from 'react';
import { Card, Checkbox, IconButton } from '@udixio/ui-react';
import { iSearch } from '@udixio/icons-rounded-400/search';
import { iSend } from '@udixio/icons-rounded-400/send';

export const ThemeApercu: React.FC = () => {
  return (
    <div className="space-y-8 p-6">

      {/* ── Phone mockups ── */}
      <div className="flex gap-8 flex-wrap justify-center items-start">

        {/* Task Manager */}
        <div className="w-[280px] h-[580px] rounded-[2rem] border-8 border-outline shadow-xl overflow-hidden bg-surface flex flex-col shrink-0">
          <div className="h-6 w-full bg-surface-container flex items-center justify-between px-4 text-[10px] text-on-surface-variant font-medium shrink-0">
            <span>9:41</span>
            <div className="flex gap-1"><span>▲▲▲</span><span>▐▌</span></div>
          </div>
          <div className="flex-1 overflow-y-auto bg-surface-container-lowest p-4 space-y-4">
            <div className="flex items-center justify-between mt-2 mb-6">
              <div>
                <h3 className="text-headline-small text-on-surface">My Tasks</h3>
                <p className="text-body-small text-on-surface-variant">5 pending tasks</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-on-primary text-title-large font-bold">A</div>
            </div>
            {[
              { label: 'Work', color: 'text-primary', items: ['Review PR #102', 'Draft design doc'], checked: [true, false] },
              { label: 'Personal', color: 'text-secondary', items: ['Call the dentist'], checked: [false] },
              { label: 'Groceries', color: 'text-tertiary', items: ['Milk & Eggs', 'Coffee beans'], checked: [true, false] },
            ].map(({ label, color, items, checked }) => (
              <Card key={label} variant="filled" className="bg-surface-container">
                <div className="p-4 space-y-3">
                  <h3 className={`text-label-large ${color}`}>{label}</h3>
                  {items.map((item, i) => (
                    <label key={item} className="flex items-center gap-3 cursor-pointer">
                      <Checkbox defaultChecked={checked[i]} />
                      <span className={`text-body-medium text-on-surface ${checked[i] ? 'line-through opacity-70' : ''}`}>{item}</span>
                    </label>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Chat */}
        <div className="w-[280px] h-[580px] rounded-[2rem] border-8 border-outline shadow-xl overflow-hidden bg-surface flex flex-col shrink-0">
          <div className="h-6 w-full bg-surface flex items-center justify-between px-4 text-[10px] text-on-surface-variant font-medium shrink-0">
            <span>9:41</span>
            <div className="flex gap-1"><span>▲▲▲</span><span>▐▌</span></div>
          </div>
          <div className="h-14 bg-surface-container flex items-center justify-between px-4 border-b border-outline-variant/30 shrink-0">
            <h3 className="text-label-large text-on-surface">Chat</h3>
            <IconButton icon={iSearch} variant="standard" label="Search" />
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-outline-variant/50 bg-surface">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="p-4 hover:bg-surface-container-low transition-colors cursor-pointer flex gap-3 items-start">
                <div className="h-10 w-10 rounded-full bg-secondary-container flex items-center justify-center text-on-secondary-container shrink-0">{i}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline mb-1">
                    <h4 className="text-title-small truncate">Team #{i}</h4>
                    <span className="text-label-small text-on-surface-variant shrink-0 ml-2">10:4{i}</span>
                  </div>
                  <p className="text-body-small text-on-surface-variant line-clamp-2">Lorem ipsum dolor sit amet, consectetur adipiscing.</p>
                </div>
              </div>
            ))}
          </div>
          <div className="p-3 bg-surface-container-lowest border-t border-outline-variant/30 shrink-0">
            <div className="flex gap-2 items-center">
              <input
                type="text"
                placeholder="Message..."
                className="flex-1 bg-surface-container-high border-none outline-none text-on-surface placeholder:text-on-surface-variant text-body-medium px-4 py-2.5 rounded-full"
              />
              <IconButton size="small" icon={iSend} variant="filled" label="Send" />
            </div>
          </div>
        </div>
      </div>

      {/* ── Web Dashboard strip ── */}
      <div className="w-full rounded-2xl border border-outline-variant/30 overflow-hidden bg-surface-container flex">
        {/* Sidebar */}
        <div className="w-44 bg-surface-container-high border-r border-outline-variant/30 p-4 flex flex-col gap-1 shrink-0">
          <div className="text-label-small text-on-surface-variant uppercase tracking-widest mb-3">Dashboard</div>
          {['Overview', 'Analytics', 'Reports', 'Settings'].map((item, i) => (
            <div
              key={item}
              className={`px-3 py-2 rounded-lg text-body-medium cursor-pointer transition-colors ${
                i === 0
                  ? 'bg-secondary-container text-on-secondary-container font-medium'
                  : 'text-on-surface-variant hover:bg-surface-container'
              }`}
            >
              {item}
            </div>
          ))}
        </div>
        {/* Content */}
        <div className="flex-1 p-5 space-y-4 min-w-0">
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Users', value: '12,430', cls: 'bg-primary-container text-on-primary-container' },
              { label: 'Revenue', value: '$48,210', cls: 'bg-secondary-container text-on-secondary-container' },
              { label: 'Growth', value: '+18.4%', cls: 'bg-tertiary-container text-on-tertiary-container' },
            ].map(({ label, value, cls }) => (
              <div key={label} className={`rounded-xl p-4 ${cls}`}>
                <div className="text-label-small opacity-70">{label}</div>
                <div className="text-headline-small font-bold">{value}</div>
              </div>
            ))}
          </div>
          <div className="rounded-xl border border-outline-variant/30 overflow-hidden">
            <div className="bg-surface-container-high px-4 py-2 text-label-medium text-on-surface-variant">Recent Activity</div>
            {['Deploy v2.4.1', 'New user signed up', 'Report generated'].map((item, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3 border-t border-outline-variant/20 hover:bg-surface-container-low transition-colors">
                <div className="w-2 h-2 rounded-full bg-primary shrink-0" />
                <span className="text-body-medium text-on-surface flex-1">{item}</span>
                <span className="text-label-small text-on-surface-variant">{i + 1}h ago</span>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
};
```

- [ ] **Step 2: Verify TypeScript**

```bash
pnpm --filter apps-doc build
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add apps/doc/src/components/theme/ThemeApercu.tsx
git commit -m "feat: add ThemeApercu section with phone mockups and dashboard"
```

---

### Task 4: `ThemePalette` — Section 02 tone ramps

**Files:**
- Create: `apps/doc/src/components/theme/ThemePalette.tsx`

**Interfaces:**
- Consumes: `themeServiceStore` (atom<API|null>), `themeConfigStore` (for re-render trigger), `PaletteToneRow` component
- Produces: `<ThemePalette />` — zero props

- [ ] **Step 1: Create the file**

Create `apps/doc/src/components/theme/ThemePalette.tsx`:

```tsx
import React, { useState } from 'react';
import { useStore } from '@nanostores/react';
import { themeConfigStore, themeServiceStore } from '@/stores/themeConfigStore.ts';
import PaletteToneRow from './PaletteToneRow';
import { Icon } from '@udixio/ui-react';
import { iKeyboardArrowDown } from '@udixio/icons-rounded-400/keyboard_arrow_down';
import { iKeyboardArrowUp } from '@udixio/icons-rounded-400/keyboard_arrow_up';

const FAMILIES = [
  { key: 'Primary', label: 'Primary', desc: 'Brand principal — boutons, FAB, actions clés' },
  { key: 'Secondary', label: 'Secondary', desc: 'Complémentaire — chips, filtres, actions secondaires' },
  { key: 'Tertiary', label: 'Tertiary', desc: 'Accent — highlights contrastés, éléments décoratifs' },
  { key: 'Neutral', label: 'Neutral', desc: 'Surfaces et textes principaux' },
  { key: 'NeutralVariant', label: 'Neutral Variant', desc: 'Bordures, diviseurs, textes atténués' },
] as const;

export const ThemePalette: React.FC = () => {
  const $api = useStore(themeServiceStore);
  useStore(themeConfigStore);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({ Primary: true });

  const toggle = (key: string) =>
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));

  return (
    <div className="space-y-3 p-6">
      {FAMILIES.map(({ key, label, desc }) => (
        <div key={key} className="rounded-2xl border border-outline-variant/30 overflow-hidden">
          <button
            type="button"
            onClick={() => toggle(key)}
            className="w-full flex items-center justify-between p-4 bg-surface-container hover:bg-surface-container-high transition-colors text-left"
          >
            <div className="flex items-baseline gap-3 min-w-0">
              <span className="text-title-medium font-bold text-on-surface shrink-0">{label}</span>
              <span className="text-body-small text-on-surface-variant truncate">{desc}</span>
            </div>
            <Icon icon={expanded[key] ? iKeyboardArrowUp : iKeyboardArrowDown} className="text-on-surface-variant shrink-0 ml-2" />
          </button>
          {expanded[key] && (
            <div className="p-4 bg-surface-container-lowest border-t border-outline-variant/20">
              <PaletteToneRow api={$api} group={key} highlighted={null} />
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
```

- [ ] **Step 2: Verify TypeScript**

```bash
pnpm --filter apps-doc build
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add apps/doc/src/components/theme/ThemePalette.tsx
git commit -m "feat: add ThemePalette section with tone ramps per family"
```

---

### Task 5: `ThemeTokens` — Section 03 semantic tokens

**Files:**
- Create: `apps/doc/src/components/theme/ThemeTokens.tsx`

**Interfaces:**
- Consumes: `themeServiceStore` (atom<API|null>), `themeConfigStore` (re-render trigger), `ColorTokenCard` (with `usage` prop from Task 1), `ColorAlias` and `ColorFromPalette` from `@udixio/theme`
- Produces: `<ThemeTokens />` — zero props

- [ ] **Step 1: Create the file**

Create `apps/doc/src/components/theme/ThemeTokens.tsx`:

```tsx
import React, { useMemo, useState } from 'react';
import { useStore } from '@nanostores/react';
import { themeConfigStore, themeServiceStore } from '@/stores/themeConfigStore.ts';
import { ColorAlias, ColorFromPalette } from '@udixio/theme';
import ColorTokenCard from './ColorTokenCard';

type TokenDef = { name: string; usage: string };
type GroupDef = { key: string; label: string; hint: string; tokens: TokenDef[] };

const GROUPS: GroupDef[] = [
  {
    key: 'primary',
    label: 'Primary',
    hint: 'primary → texte sur lui : on-primary  ·  même logique pour container',
    tokens: [
      { name: 'primary', usage: 'Boutons CTA, FAB' },
      { name: 'onPrimary', usage: 'Texte sur primary' },
      { name: 'primaryContainer', usage: 'Chips, badges sélectionnés' },
      { name: 'onPrimaryContainer', usage: 'Texte dans container' },
    ],
  },
  {
    key: 'secondary',
    label: 'Secondary',
    hint: 'secondary → texte sur lui : on-secondary',
    tokens: [
      { name: 'secondary', usage: 'Actions secondaires, filtres' },
      { name: 'onSecondary', usage: 'Texte sur secondary' },
      { name: 'secondaryContainer', usage: 'Chips non sélectionnés' },
      { name: 'onSecondaryContainer', usage: 'Texte dans container' },
    ],
  },
  {
    key: 'tertiary',
    label: 'Tertiary',
    hint: 'tertiary → texte sur lui : on-tertiary',
    tokens: [
      { name: 'tertiary', usage: 'Accents, highlights' },
      { name: 'onTertiary', usage: 'Texte sur tertiary' },
      { name: 'tertiaryContainer', usage: 'Badges décoratifs' },
      { name: 'onTertiaryContainer', usage: 'Texte dans container' },
    ],
  },
  {
    key: 'surface',
    label: 'Surface',
    hint: 'surface = fond  ·  on-surface = texte principal',
    tokens: [
      { name: 'surface', usage: 'Fond principal des écrans' },
      { name: 'surfaceContainer', usage: 'Cartes, modales' },
      { name: 'surfaceContainerHigh', usage: 'Inputs, sidebars' },
      { name: 'onSurface', usage: 'Texte principal' },
      { name: 'onSurfaceVariant', usage: 'Texte secondaire, placeholders' },
      { name: 'outline', usage: 'Bordures visibles' },
      { name: 'outlineVariant', usage: 'Bordures subtiles, diviseurs' },
    ],
  },
  {
    key: 'feedback',
    label: 'Feedback',
    hint: 'error pour invalide  ·  success pour confirmation',
    tokens: [
      { name: 'error', usage: 'Champs invalides, alertes' },
      { name: 'onError', usage: 'Texte sur error' },
      { name: 'errorContainer', usage: 'Fond messages d\'erreur' },
      { name: 'onErrorContainer', usage: 'Texte dans error container' },
    ],
  },
];

const ALL_KEYS = ['all', ...GROUPS.map((g) => g.key)];
const CHIP_LABELS: Record<string, string> = {
  all: 'Tous',
  primary: 'Primary',
  secondary: 'Secondary',
  tertiary: 'Tertiary',
  surface: 'Surface',
  feedback: 'Feedback',
};

export const ThemeTokens: React.FC = () => {
  const $api = useStore(themeServiceStore);
  useStore(themeConfigStore);
  const [query, setQuery] = useState('');
  const [activeGroup, setActiveGroup] = useState('all');

  const colorMap = useMemo(() => {
    if (!$api) return new Map<string, ColorFromPalette>();
    const map = new Map<string, ColorFromPalette>();
    for (const [name, color] of $api.colors.getAll()) {
      const resolved = color instanceof ColorAlias ? color.color() : color;
      if (resolved instanceof ColorFromPalette) {
        map.set(name, resolved);
      }
    }
    return map;
  }, [$api]);

  const q = query.trim().toLowerCase();

  const visibleGroups = GROUPS.filter((g) => activeGroup === 'all' || g.key === activeGroup);

  return (
    <div className="space-y-6 p-6">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <input
          type="search"
          placeholder="Rechercher un token…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-1 max-w-xs bg-surface-container border border-outline-variant/40 rounded-xl px-4 py-2 text-body-medium text-on-surface placeholder:text-on-surface-variant outline-none focus:border-primary transition-colors"
        />
        <div className="flex gap-2 flex-wrap">
          {ALL_KEYS.map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setActiveGroup(key)}
              className={`px-3 py-1.5 rounded-full text-label-large transition-all border ${
                activeGroup === key
                  ? 'bg-primary-container text-on-primary-container border-primary/30'
                  : 'text-on-surface-variant border-outline-variant/40 hover:bg-surface-container-high'
              }`}
            >
              {CHIP_LABELS[key]}
            </button>
          ))}
        </div>
      </div>

      {/* Groups */}
      {visibleGroups.map((group) => {
        const tokens = group.tokens.filter((t) => {
          if (!q) return true;
          return t.name.toLowerCase().includes(q) || `--color-${t.name.toLowerCase().replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase()}`.includes(q);
        });
        if (tokens.length === 0) return null;

        return (
          <div key={group.key}>
            {/* Group header */}
            <div className="flex items-center gap-3 mb-3">
              <span className="text-label-large font-bold text-on-surface uppercase tracking-wider">{group.label}</span>
              <div className="flex-1 h-px bg-outline-variant/30" />
            </div>
            <p className="text-body-small text-on-surface-variant mb-3 font-mono">{group.hint}</p>

            {/* Token grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {tokens.map((t) => {
                const color = colorMap.get(t.name);
                if (!color) return null;
                return (
                  <ColorTokenCard
                    key={t.name}
                    name={t.name}
                    color={color}
                    usage={t.usage}
                  />
                );
              })}
            </div>
          </div>
        );
      })}

      {visibleGroups.every((g) =>
        g.tokens.filter((t) => !q || t.name.toLowerCase().includes(q)).length === 0,
      ) && (
        <div className="text-center py-12 text-on-surface-variant text-body-large">
          Aucun token trouvé pour « {query} »
        </div>
      )}
    </div>
  );
};
```

- [ ] **Step 2: Verify TypeScript**

```bash
pnpm --filter apps-doc build
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add apps/doc/src/components/theme/ThemeTokens.tsx
git commit -m "feat: add ThemeTokens section with semantic groups and usage labels"
```

---

### Task 6: `ThemeBuilderContent` — Scroll wrapper

**Files:**
- Create: `apps/doc/src/components/theme/ThemeBuilderContent.tsx`

**Interfaces:**
- Consumes: `ThemeBuilderNav`, `ThemeApercu`, `ThemePalette`, `ThemeTokens`
- Produces: `<ThemeBuilderContent />` — zero props. Renders the floating nav + three `<section>` elements with IDs matching `SECTIONS` in `ThemeBuilderNav`.

- [ ] **Step 1: Create the file**

Create `apps/doc/src/components/theme/ThemeBuilderContent.tsx`:

```tsx
import React from 'react';
import { ThemeBuilderNav } from './ThemeBuilderNav';
import { ThemeApercu } from './ThemeApercu';
import { ThemePalette } from './ThemePalette';
import { ThemeTokens } from './ThemeTokens';

const SectionHeader: React.FC<{ eyebrow: string; title: string; desc: string }> = ({
  eyebrow,
  title,
  desc,
}) => (
  <div className="px-6 pt-8 pb-2">
    <div className="flex items-baseline gap-3 mb-1">
      <span className="text-label-small font-bold tracking-widest uppercase text-on-surface-variant">{eyebrow}</span>
      <h2 className="text-headline-small font-bold text-on-surface">{title}</h2>
    </div>
    <p className="text-body-medium text-on-surface-variant">{desc}</p>
    <div className="mt-4 h-px bg-outline-variant/30" />
  </div>
);

export const ThemeBuilderContent: React.FC = () => {
  return (
    <div className="flex flex-col w-full">
      <ThemeBuilderNav />

      <section id="section-apercu" className="scroll-mt-20">
        <SectionHeader
          eyebrow="01 —"
          title="Aperçu"
          desc="Le thème appliqué sur des interfaces réelles. Modifie la couleur à gauche pour voir l'impact en direct."
        />
        <ThemeApercu />
      </section>

      <section id="section-palette" className="scroll-mt-20">
        <SectionHeader
          eyebrow="02 —"
          title="Palette"
          desc="Rampes de tons HCT 0 → 100 pour chaque famille de couleurs. La mécanique qui génère tout."
        />
        <ThemePalette />
      </section>

      <section id="section-tokens" className="scroll-mt-20">
        <SectionHeader
          eyebrow="03 —"
          title="Tokens"
          desc="Chaque token sait à quoi il sert. Hover → copie HEX ou var()."
        />
        <ThemeTokens />
      </section>
    </div>
  );
};
```

- [ ] **Step 2: Verify TypeScript**

```bash
pnpm --filter apps-doc build
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add apps/doc/src/components/theme/ThemeBuilderContent.tsx
git commit -m "feat: add ThemeBuilderContent scroll wrapper"
```

---

### Task 7: Wire `builder.astro`

**Files:**
- Modify: `apps/doc/src/pages/theme/builder.astro`

**Interfaces:**
- Consumes: `ThemeBuilderContent` (from Task 6)
- Produces: `/theme/builder` page renders the new scroll layout

- [ ] **Step 1: Update the import**

In `apps/doc/src/pages/theme/builder.astro`, replace:

```astro
import { ThemePreviewTabs } from '@/components/theme/ThemePreviewTabs';
```

with:

```astro
import { ThemeBuilderContent } from '@/components/theme/ThemeBuilderContent';
```

- [ ] **Step 2: Replace the component in JSX**

In the same file, the right panel currently reads:

```astro
<div class="flex-[2]">
  <ThemePreviewTabs client:load />
</div>
```

Replace with:

```astro
<div class="flex-[2] overflow-y-auto h-screen">
  <ThemeBuilderContent client:load />
</div>
```

The `overflow-y-auto h-screen` makes the right panel independently scrollable while the left `ThemePicker` stays sticky. The scroll container is the right div, not the page body — this is what enables the sticky left + scrollable right split.

- [ ] **Step 3: Verify the full build**

```bash
pnpm --filter apps-doc build
```

Expected: build completes with no TypeScript or Astro errors. `dist/theme/builder/index.html` is present.

- [ ] **Step 4: Smoke test in the browser**

Start dev server:

```bash
pnpm --filter apps-doc dev
```

Open `http://localhost:4321/theme/builder`. Verify:

1. Left panel (`ThemePicker`) stays sticky while right panel scrolls
2. Floating pill nav appears below the top of the right panel
3. Clicking "Palette" smoothly scrolls to Section 02
4. Clicking "Tokens" smoothly scrolls to Section 03
5. Active pill updates while scrolling through sections
6. Changing source color in `ThemePicker` updates phone mockups and token cards in real-time
7. Toggling dark mode flips all colors instantly
8. Token search filters cards within the active group

- [ ] **Step 5: Commit**

```bash
git add apps/doc/src/pages/theme/builder.astro
git commit -m "feat: wire ThemeBuilderContent into builder page"
```
