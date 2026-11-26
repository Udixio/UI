import { useStore } from '@nanostores/react';
import {
  classNames,
  Divider,
  Fab,
  IconButton,
  NavigationRail,
  NavigationRailItem,
  SideSheet,
  Switch,
  Tooltip,
} from '@udixio/ui-react';
import { iAnimation } from '@udixio/icons-rounded-400/animation';
import { iHourglass } from '@udixio/icons-rounded-400/hourglass';
import { iPalette } from '@udixio/icons-rounded-400/palette';
import { iWidgets } from '@udixio/icons-rounded-400/widgets';
import { iDarkMode } from '@udixio/icons-rounded-400/dark_mode';
import { iLightMode } from '@udixio/icons-rounded-400/light_mode';
import { iAnimationFilled } from '@udixio/icons-rounded-400/filled/animation';
import { iHourglassFilled } from '@udixio/icons-rounded-400/filled/hourglass';
import { iPaletteFilled } from '@udixio/icons-rounded-400/filled/palette';
import { iWidgetsFilled } from '@udixio/icons-rounded-400/filled/widgets';
import { iPauseCircle } from '@udixio/icons-rounded-400/pause_circle';
import { iPlayCircle } from '@udixio/icons-rounded-400/play_circle';
import { iSearch } from '@udixio/icons-rounded-400/search';
import { iMenu } from '@udixio/icons-rounded-400/menu';
import { iClose } from '@udixio/icons-rounded-400/close';
import { themeConfigStore } from '@/stores/themeConfigStore.ts';
import {
  type FocusEvent,
  type KeyboardEvent,
  type ReactElement,
  useEffect,
  useId,
  useRef,
  useState,
} from 'react';
import { MOTION_SECTIONS } from '@/lib/motion-nav';
import {
  applyMotionPolicy,
  readStoredMotionPolicy,
  setMotionPolicy,
  watchMotionPolicy,
  watchSystemReducedMotion,
} from '@/components/motion/motionPolicy';
import { DocumentationSearch } from './DocumentationSearch';
import {
  GETSTARTED_SECTIONS,
  NavSidebar,
  type NavSection,
  THEME_SECTIONS,
} from './Sidebar';

type FlyoutId = 'get-started' | 'motion' | 'components' | 'theme';

type Flyout = {
  title: string;
  sections: NavSection[];
  basePath: string;
};

/** Hover dwell before a rail item swaps the panel, so a pointer merely
 * crossing the rail does not flicker through every section. */
const OPEN_DELAY_MS = 350;
/** Grace period to cross the gap between a rail item and the panel. */
const CLOSE_DELAY_MS = 150;
/** Tailwind's `lg` breakpoint: from here on the current section stays open. */
const LARGE_BREAKPOINT_PX = 1024;
/**
 * Material 3's compact window class: below it there is no rail, but a top app bar and a modal drawer (review 6, Q2). The
 * layout and this file's classes spell it `max-[600px]` / `min-[600px]`, which is the same query.
 */
const COMPACT_QUERY = '(width < 600px)';
/** The id of the rail, which its menu button extends, and of the phone's drawer, which the top app bar's buttons open. */
const RAIL_ID = 'site-rail';
const DRAWER_ID = 'site-drawer';

/**
 * The four sections of the site, in the rail's order: the page each one opens, and its icons. `short` is the label of the
 * phone drawer's row, where the four share min(320px, 85vw): "Get started" would crowd "Animation" at 320 px.
 */
const SECTIONS: {
  id: FlyoutId;
  label: string;
  short: string;
  href: string;
  icon: typeof iHourglass;
  iconSelected: typeof iHourglass;
}[] = [
  { id: 'get-started', label: 'Get started', short: 'Start', href: '/get-started/introduction', icon: iHourglass, iconSelected: iHourglassFilled },
  { id: 'motion', label: 'Animation', short: 'Animation', href: '/motion', icon: iAnimation, iconSelected: iAnimationFilled },
  { id: 'components', label: 'Components', short: 'Components', href: '/components', icon: iWidgets, iconSelected: iWidgetsFilled },
  { id: 'theme', label: 'Themes', short: 'Themes', href: '/theme/builder', icon: iPalette, iconSelected: iPaletteFilled },
];

/** The section a page belongs to, i.e. the panel pinned open on it. */
export function sectionFromPathname(pathname: string | null): FlyoutId | null {
  if (!pathname) return null;
  if (/^\/components(\/|$)/.test(pathname)) return 'components';
  if (/^\/theme(\/|$)/.test(pathname)) return 'theme';
  if (/^\/motion(\/|$)/.test(pathname)) return 'motion';
  if (/^\/(get-started|agents)(\/|$)/.test(pathname)) return 'get-started';
  return null;
}

/**
 * The site's motion policy: the visitor's Reduce motion choice (`reduce`), and whether the system asks for reduced motion
 * (`system`), which then decides.
 */
function useMotionPolicy() {
  const [reduce, setReduce] = useState(false);
  const [system, setSystem] = useState(false);

  useEffect(() => {
    applyMotionPolicy(readStoredMotionPolicy());
    const stopPolicy = watchMotionPolicy(setReduce);
    const stopSystem = watchSystemReducedMotion(setSystem);
    return () => {
      stopPolicy();
      stopSystem();
    };
  }, []);

  const set = (next: boolean) => {
    setReduce(next);
    setMotionPolicy(next);
  };
  return { reduce, system, set };
}

/**
 * The tooltip of a button at the foot of the rail, opened to its right. An IconButton's own tooltip opens below it, where
 * the last button of the rail leaves no room before the bottom of the window. The button keeps its name (`label`): the
 * tooltip only shows it, so it does not describe the button again. A disabled button shows none, as an IconButton does.
 */
const RailTooltip = ({ text, disabled = false, children }: { text: string; disabled?: boolean; children: ReactElement }) => (
  <Tooltip text={text} position="right" describeTarget={false} trigger={disabled ? null : undefined}>
    {children}
  </Tooltip>
);

/**
 * The site's Reduce motion control, above the dark-mode button in the rail. It pauses every animation of the
 * documentation (WCAG 2.2.2). When the system asks for reduced motion, it shows pressed and disabled: the system decides
 * then, and a description says so, since a disabled button shows no tooltip.
 */
const MotionPolicyButton = () => {
  const helpId = useId();
  const { reduce, system, set } = useMotionPolicy();

  return (
    <>
      {/* The tooltip opens beside the rail (RailTooltip): below the button, it would leave the window. */}
      <RailTooltip text="Reduce motion" disabled={system}>
        <IconButton
          variant="outlined"
          icon={iPlayCircle}
          pressedIcon={iPauseCircle}
          label="Reduce motion"
          tooltip={false}
          toggleable
          pressed={reduce || system}
          disabled={system}
          aria-describedby={system ? helpId : undefined}
          onPressedChange={set}
        />
      </RailTooltip>
      {system && (
        <span id={helpId} className="sr-only">
          Set by your system: it asks for reduced motion.
        </span>
      )}
    </>
  );
};

/**
 * The footer of the phone's drawer: Reduce motion and the dark theme, each a Udixio Switch with its words beside it (a
 * touch screen shows no tooltip, so the rail's icon buttons would go unnamed to the eye). Reduce motion follows the rail's
 * rules: the system's request turns it on and disables it, and a description says so.
 */
const DrawerSettings = ({
  isDark,
  onDarkChange,
}: {
  isDark: boolean;
  onDarkChange: (dark: boolean) => void;
}) => {
  const id = useId();
  const { reduce, system, set } = useMotionPolicy();
  const row = 'flex min-h-12 items-center justify-between gap-4 ps-2 text-body-large text-on-surface';

  return (
    <div className="flex flex-col border-t border-outline-variant px-4 py-2">
      <div className={row}>
        <span id={`${id}-motion`}>Reduce motion</span>
        <Switch
          aria-labelledby={`${id}-motion`}
          aria-describedby={system ? `${id}-system` : undefined}
          checked={reduce || system}
          disabled={system}
          onCheckedChange={set}
        />
      </div>
      {system && (
        <p id={`${id}-system`} className="-mt-1 mb-1 ps-2 text-body-small text-on-surface-variant">
          Set by your system: it asks for reduced motion.
        </p>
      )}
      <div className={row}>
        <span id={`${id}-dark`}>Dark theme</span>
        <Switch aria-labelledby={`${id}-dark`} checked={isDark} onCheckedChange={onDarkChange} />
      </div>
    </div>
  );
};

export type NavigationProps = {
  /** "Components" flyout sections, computed from the content collections. */
  componentSections: NavSection[];
  /** Server-rendered pathname, so the pinned panel is open on first paint. */
  pathname: string;
};

export const Navigation = ({
  componentSections,
  pathname: initialPathname,
}: NavigationProps) => {
  const config = useStore(themeConfigStore, { ssr: 'initial' });
  const isDark = config.isDark ?? false;
  const flyouts: Record<FlyoutId, Flyout> = {
    'get-started': {
      title: 'Get started',
      sections: GETSTARTED_SECTIONS,
      basePath: '/get-started',
    },
    motion: { title: 'Animation', sections: MOTION_SECTIONS, basePath: '/motion' },
    components: {
      title: 'Components',
      sections: componentSections,
      basePath: '/components',
    },
    theme: { title: 'Theme', sections: THEME_SECTIONS, basePath: '/theme' },
  };

  // The island persists across view transitions, so the pathname is tracked
  // here rather than re-read from props.
  const [pathname, setPathname] = useState(initialPathname);
  useEffect(() => {
    const sync = () => setPathname(window.location.pathname);
    document.addEventListener('astro:page-load', sync);
    return () => document.removeEventListener('astro:page-load', sync);
  }, []);

  // Below the `lg` breakpoint the panel is preview-only: nothing stays
  // pinned, and whatever opens overlays the content. Server markup assumes
  // a large screen; `max-lg:hidden` on the wrapper covers the first paint.
  const [isLarge, setIsLarge] = useState(true);
  useEffect(() => {
    const query = window.matchMedia(`(min-width: ${LARGE_BREAKPOINT_PX}px)`);
    const sync = () => setIsLarge(query.matches);
    sync();
    query.addEventListener('change', sync);
    return () => query.removeEventListener('change', sync);
  }, []);

  // Below 600 px (the compact window class) there is no rail: a top app bar opens a modal drawer instead. Server markup
  // has both, and CSS shows the one that fits; the drawer itself is rendered on a compact screen only.
  const [isCompact, setIsCompact] = useState(false);
  useEffect(() => {
    const query = window.matchMedia(COMPACT_QUERY);
    const sync = () => setIsCompact(query.matches);
    sync();
    query.addEventListener('change', sync);
    return () => query.removeEventListener('change', sync);
  }, []);

  // The drawer shows the site's navigation or the search, as the button that opened it asks; it keeps what it showed
  // while it closes. A client-side navigation replaces the body, and the drawer's portal with it: the drawer is mounted
  // again on each page (`swaps`), into the new body.
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerView, setDrawerView] = useState<'nav' | 'search'>('nav');
  const [swaps, setSwaps] = useState(0);
  const openDrawer = (view: 'nav' | 'search', button: HTMLElement) => {
    // WebKit does not focus a button on click: the drawer gives the focus back to what had it when it opened.
    button.focus();
    setDrawerView(view);
    setDrawerOpen(true);
  };
  useEffect(() => {
    if (!isCompact) setDrawerOpen(false);
  }, [isCompact]);
  // The SideSheet moves the focus to its first focusable element, the drawer's close button. The menu opens on where the
  // visitor is instead: its list is scrolled so that the current page is in the middle of it (on a page at the bottom of the
  // menu, it would be out of view, under the footer), and the focus is on that page; without one, on the current section,
  // or the first. The search field takes the focus itself (DocumentationSearch). This effect runs after the SideSheet's,
  // which is its child. The drawer's content keeps its width while the drawer opens (see below), so what is measured here
  // is where the page will be.
  useEffect(() => {
    if (!drawerOpen || drawerView !== 'nav') return;
    const drawer = document.getElementById(DRAWER_ID);
    const current =
      drawer?.querySelector<HTMLElement>('[data-drawer-pages] a[aria-current="page"]') ??
      drawer?.querySelector<HTMLElement>('[data-drawer-sections] a[aria-current]') ??
      drawer?.querySelector<HTMLElement>('[data-drawer-sections] a[href]');
    const list = drawer?.querySelector<HTMLElement>('[data-drawer-list]');
    if (!current || !list) return;
    const view = list.getBoundingClientRect();
    const box = current.getBoundingClientRect();
    list.scrollTop += box.top - view.top - (view.height - box.height) / 2;
    current.focus({ preventScroll: true });
  }, [drawerOpen, drawerView]);
  useEffect(() => {
    const close = () => setDrawerOpen(false);
    const remount = () => setSwaps((count) => count + 1);
    document.addEventListener('astro:before-preparation', close);
    document.addEventListener('astro:after-swap', remount);
    return () => {
      document.removeEventListener('astro:before-preparation', close);
      document.removeEventListener('astro:after-swap', remount);
    };
  }, []);

  // One panel, several layers deciding what it shows (first wins):
  // - `hoverId`: a section (or the search) previewed from the rail, until
  //   the pointer or focus leaves;
  // - `searchOpen`: the documentation search, kept open by a click on the
  //   Fab (a second click, Escape, or picking a result closes it) or by
  //   focusing its input;
  // - `pinnedId`: the current page's section, always open on large screens
  //   or while the burger menu is open.
  // Search and the pinned section sit in the row and push the content like
  // a regular sidebar; a preview on top of nothing overlays it instead.
  // The rail's burger menu extends it; while it is open, the current
  // section stays visible on any screen size.
  const pinnedId = sectionFromPathname(pathname);
  const [menuOpen, setMenuOpen] = useState(false);
  const [hoverId, setHoverId] = useState<FlyoutId | 'search' | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const pinnedOpen = (isLarge || menuOpen) && pinnedId !== null;
  const inFlow = isLarge && (searchOpen || pinnedOpen);
  const open = hoverId !== null || searchOpen || pinnedOpen;
  // Remember the last shown content so the panel keeps it while it slides
  // shut instead of blanking out.
  type Shown = { kind: 'search' } | { kind: 'nav'; id: FlyoutId };
  const lastShown = useRef<Shown>({
    kind: 'nav',
    id: pinnedId ?? 'get-started',
  });
  const shown: Shown = hoverId
    ? hoverId === 'search'
      ? { kind: 'search' }
      : { kind: 'nav', id: hoverId }
    : searchOpen
      ? { kind: 'search' }
      : pinnedOpen
        ? { kind: 'nav', id: pinnedId }
        : lastShown.current;
  lastShown.current = shown;

  // Server markup has no inline width, so a closed panel would flash at full
  // width until the SideSheet's `@udixio/motion` controller collapses it after
  // hydration; keep it invisible until then.
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);

  const openTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  const cancelTimers = () => {
    if (openTimer.current) clearTimeout(openTimer.current);
    if (closeTimer.current) clearTimeout(closeTimer.current);
    openTimer.current = closeTimer.current = null;
  };

  const preview = (id: FlyoutId | 'search') => {
    cancelTimers();
    setHoverId(id);
  };

  // Mouse previews wait for a dwell; keyboard focus previews immediately.
  const schedulePreview = (id: FlyoutId | 'search') => {
    cancelTimers();
    openTimer.current = setTimeout(() => preview(id), OPEN_DELAY_MS);
  };

  const endPreview = () => {
    cancelTimers();
    setHoverId(null);
  };

  const scheduleEndPreview = () => {
    cancelTimers();
    closeTimer.current = setTimeout(endPreview, CLOSE_DELAY_MS);
  };

  const toggleSearch = () => {
    endPreview();
    setSearchOpen((current) => !current);
  };

  useEffect(() => cancelTimers, []);

  // A navigation ends any preview and search; the pinned panel follows the
  // new page.
  useEffect(() => {
    const reset = () => {
      endPreview();
      setSearchOpen(false);
    };
    document.addEventListener('astro:after-swap', reset);
    return () => document.removeEventListener('astro:after-swap', reset);
  }, []);

  const previewProps = (id: FlyoutId | 'search') => ({
    onMouseEnter: () => schedulePreview(id),
    onMouseLeave: () => {
      if (openTimer.current) clearTimeout(openTimer.current);
      openTimer.current = null;
    },
    onFocus: () => preview(id),
  });

  const handleBlur = (event: FocusEvent<HTMLDivElement>) => {
    if (!rootRef.current?.contains(event.relatedTarget as Node | null)) {
      endPreview();
    }
  };

  // Escape backs out of a preview first, then of the search.
  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'Escape') return;
    if (hoverId) endPreview();
    else if (searchOpen) setSearchOpen(false);
  };

  const flyout = shown.kind === 'nav' ? flyouts[shown.id] : null;
  const panelTitle = flyout?.title ?? 'Search documentation';

  // Rail selection follows the page rather than the last click, since links
  // inside the panel navigate too. Indexes match the item order below; -1
  // (not null, which would hand control back to the rail) selects nothing.
  const RAIL_INDEX: Record<FlyoutId, number> = {
    'get-started': 0,
    motion: 1,
    components: 2,
    theme: 3,
  };
  const selectedRailItem = pinnedId ? RAIL_INDEX[pinnedId] : -1;

  useEffect(() => {
    if (typeof document === 'undefined') return;

    const isActuallyDark = document.body.classList.contains('dark');
    if (isActuallyDark !== isDark) {
      themeConfigStore.set({
        ...themeConfigStore.get(),
        isDark: isActuallyDark,
      });
    }
  }, []);

  const toggleDarkMode = (value: boolean) => {
    themeConfigStore.set({ ...themeConfigStore.get(), isDark: value });
    document.body.classList.toggle('dark', value);
  };

  // The rail's menu button extends the rail. NavigationRail gives no way to pass attributes to it or to the rail, so they
  // are set here: the button says whether the rail is extended (`aria-expanded`), and which element it extends.
  useEffect(() => {
    const rail = rootRef.current?.firstElementChild;
    const button = rail?.querySelector('button');
    if (!rail || !button) return;
    rail.id = RAIL_ID;
    button.setAttribute('aria-expanded', String(menuOpen));
    button.setAttribute('aria-controls', RAIL_ID);
  }, [menuOpen]);

  const section = pinnedId ? SECTIONS.find(({ id }) => id === pinnedId) : undefined;
  const sectionFlyout = pinnedId ? flyouts[pinnedId] : undefined;

  return (
    <>
      {/*
        The top app bar of a compact screen: the menu, the section, the search. Without JavaScript nothing could open the
        drawer, so the rail stays instead (the layout keeps the column then).
      */}
      <div className="flex h-16 w-full items-center gap-1 bg-surface-dim px-1 min-[600px]:hidden [@media(scripting:none)]:hidden">
        <IconButton
          icon={iMenu}
          label="Menu"
          aria-expanded={drawerOpen && drawerView === 'nav'}
          aria-controls={DRAWER_ID}
          onClick={(event) => openDrawer('nav', event.currentTarget)}
        />
        <p className="min-w-0 flex-1 truncate ps-1 text-title-large text-on-surface">
          {section?.label ?? 'Udixio UI'}
        </p>
        <IconButton
          icon={iSearch}
          label="Search"
          aria-expanded={drawerOpen && drawerView === 'search'}
          aria-controls={DRAWER_ID}
          onClick={(event) => openDrawer('search', event.currentTarget)}
        />
      </div>
      {isCompact && (
        <SideSheet
          key={swaps}
          id={DRAWER_ID}
          variant="modal"
          position="left"
          aria-label={drawerView === 'search' ? 'Search documentation' : 'Site menu'}
          open={drawerOpen}
          onOpenChange={setDrawerOpen}
          // min(320px, 85vw): the scrim stays in view beside it, to tap it closed. The SideSheet's own header is hidden: its
          // close button would be named "Close" only, and the drawer's header below names what it closes. The content keeps
          // the drawer's full width while the drawer opens (its width grows from 0), so nothing reflows: it is uncovered.
          className="w-[min(320px,85vw)] max-w-none bg-surface-container-low [&_.content]:overflow-x-hidden [&_.header]:hidden"
        >
          <div className="flex h-full w-[min(320px,85vw)] flex-col">
            {/*
              A touch screen has no Escape key (review 7, Q4): the header shows a close button, which gives the focus back to
              the top app bar's button, as Escape and the scrim do (the SideSheet restores it).
            */}
            <div className="flex h-16 shrink-0 items-center justify-between gap-2 ps-6 pe-3">
              <p className="truncate text-title-small text-on-surface-variant">
                {drawerView === 'nav' ? 'Udixio UI' : 'Search'}
              </p>
              <IconButton
                icon={iClose}
                label={drawerView === 'nav' ? 'Close menu' : 'Close search'}
                onClick={() => setDrawerOpen(false)}
              />
            </div>
            <div data-drawer-list className="min-h-0 flex-1 overflow-y-auto custom-scrollbar">
              {drawerView === 'nav' ? (
                <>
                  {/*
                    First the four sections of the site, on one row as in a navigation bar (review 7, Q4): an icon over a
                    short label, the current one marked as the rail marks it. Each takes its label's width, and the row
                    spreads them: "Components" is wider than a quarter of the narrowest drawer.
                  */}
                  <nav
                    aria-label="Site sections"
                    data-drawer-sections
                    className="flex justify-between px-2 pb-2"
                  >
                    {SECTIONS.map(({ id, short, href, icon, iconSelected }) => (
                      <NavigationRailItem
                        key={id}
                        href={href}
                        icon={icon}
                        iconSelected={iconSelected}
                        selected={id === pinnedId}
                        className={{ navigationRailItem: 'min-w-12', container: 'mx-auto px-3' }}
                      >
                        {short}
                      </NavigationRailItem>
                    ))}
                  </nav>
                  {/* Then the pages of the current section, at full width. */}
                  {sectionFlyout && (
                    <div data-drawer-pages className="border-t border-outline-variant pt-2">
                      <NavSidebar
                        sections={sectionFlyout.sections}
                        basePath={sectionFlyout.basePath}
                        pathname={pathname}
                        label={`${sectionFlyout.title} documentation`}
                      />
                    </div>
                  )}
                </>
              ) : (
                <DocumentationSearch
                  open={drawerOpen && drawerView === 'search'}
                  onClose={() => setDrawerOpen(false)}
                />
              )}
            </div>
            {drawerView === 'nav' && <DrawerSettings isDark={isDark} onDarkChange={toggleDarkMode} />}
          </div>
        </SideSheet>
      )}
      <div
        ref={rootRef}
        className="relative flex h-full max-[600px]:[@media(scripting:enabled)]:hidden"
        onMouseLeave={scheduleEndPreview}
        onMouseEnter={() => {
          if (closeTimer.current) clearTimeout(closeTimer.current);
          closeTimer.current = null;
        }}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
      >
        <NavigationRail
          className="bg-surface-dim"
          selectedItem={selectedRailItem}
          extended={menuOpen}
          onExtendedChange={setMenuOpen}
          // `aria-expanded` tells whether the rail is extended (set above): the name stays the same.
          menu={{
            closed: { icon: iMenu, label: 'Menu' },
            opened: { icon: iClose, label: 'Menu' },
          }}
          footer={
            <div className="flex flex-col gap-2">
              <MotionPolicyButton />
              <RailTooltip text={isDark ? 'Switch to light mode' : 'Switch to dark mode'}>
                <IconButton
                  variant="outlined"
                  icon={iLightMode}
                  pressedIcon={iDarkMode}
                  label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
                  tooltip={false}
                  toggleable
                  pressed={!isDark}
                  onPressedChange={(isLight) => toggleDarkMode(!isLight)}
                />
              </RailTooltip>
            </div>
          }
        >
          <Fab
            variant="tertiary"
            icon={iSearch}
            label="Search"
            type="button"
            aria-expanded={searchOpen}
            onClick={toggleSearch}
            {...previewProps('search')}
          />
          {SECTIONS.map(({ id, label, href, icon, iconSelected }) => (
            <NavigationRailItem
              key={id}
              href={href}
              icon={icon}
              iconSelected={iconSelected}
              {...previewProps(id)}
            >
              {label}
            </NavigationRailItem>
          ))}
        </NavigationRail>
        <Divider orientation="vertical" />
        {/* In flow: part of the row, pushes the content. Preview only: out
            of flow, overlays the content instead of shifting it, and takes
            no more than the room the rail leaves in the window (100% is the
            rail's width here): on a phone, the extended rail and the panel
            would otherwise make the page scroll sideways. */}
        <div
          className={classNames('h-full', {
            'absolute left-full top-0 max-w-[calc(100vw-100%)]': !inFlow,
            invisible: !hydrated && !open,
            'max-lg:hidden': !hoverId && !searchOpen && !menuOpen,
          })}
        >
          <SideSheet
            position="left"
            // The title scrolls with the content instead of sitting in a
            // fixed header, and there is nothing to close by hand, so the
            // SideSheet's header (title + close button) is hidden outright.
            // Its own divider is dropped too: it would run straight through
            // the rounded corners.
            className={classNames(
              'rounded-r-3xl bg-surface-dim [&_.header]:hidden',
              {
                'w-64': shown.kind !== 'search',
                'w-96 max-w-none': shown.kind === 'search',
                // Out of flow, the panel narrows with its wrapper.
                'max-w-full': !inFlow,
              },
            )}
            aria-label={panelTitle}
            divider={false}
            open={open}
          >
            <div className="h-full overflow-y-auto custom-scrollbar">
              <p className="p-4 text-title-large text-on-surface-variant">
                {panelTitle}
              </p>
              {/* Both stay mounted so a preview hovering over the search does
                not drop the query or the input's focus. */}
              {flyout && (
                <NavSidebar
                  sections={flyout.sections}
                  basePath={flyout.basePath}
                  pathname={pathname}
                  label={`${flyout.title} documentation`}
                />
              )}
              {/* Typing into a previewed search keeps it open once the pointer
                leaves. */}
              <div
                hidden={shown.kind !== 'search'}
                onFocus={() => setSearchOpen(true)}
              >
                <DocumentationSearch
                  open={searchOpen}
                  onClose={() => setSearchOpen(false)}
                />
              </div>
            </div>
          </SideSheet>
        </div>
      </div>
    </>
  );
};
