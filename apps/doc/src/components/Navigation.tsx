import { useStore } from '@nanostores/react';
import {
  classNames,
  Divider,
  Fab,
  IconButton,
  NavigationRail,
  NavigationRailItem,
  SideSheet,
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
import { iSearch } from '@udixio/icons-rounded-400/search';
import { themeConfigStore } from '@/stores/themeConfigStore.ts';
import {
  type FocusEvent,
  type KeyboardEvent,
  useEffect,
  useRef,
  useState,
} from 'react';
import { DocumentationSearch } from './DocumentationSearch';
import {
  GETSTARTED_SECTIONS,
  NavSidebar,
  type NavSection,
  THEME_SECTIONS,
} from './Sidebar';

type FlyoutId = 'get-started' | 'components' | 'theme';

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

/** The section a page belongs to, i.e. the panel pinned open on it. */
export function sectionFromPathname(pathname: string | null): FlyoutId | null {
  if (!pathname) return null;
  if (/^\/components(\/|$)/.test(pathname)) return 'components';
  if (/^\/theme(\/|$)/.test(pathname)) return 'theme';
  if (/^\/(get-started|agents)(\/|$)/.test(pathname)) return 'get-started';
  return null;
}

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
  const config = useStore(themeConfigStore);
  const isDark = config.isDark ?? false;
  const flyouts: Record<FlyoutId, Flyout> = {
    'get-started': {
      title: 'Get started',
      sections: GETSTARTED_SECTIONS,
      basePath: '/get-started',
    },
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
  // width until the SideSheet's Motion controller collapses it after
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
    components: 2,
    theme: 3,
  };
  const selectedRailItem =
    pathname === '/animations' ? 1 : pinnedId ? RAIL_INDEX[pinnedId] : -1;

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

  return (
    <>
      <div
        ref={rootRef}
        className="relative flex h-full"
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
          footer={
            <IconButton
              variant="outlined"
              icon={iLightMode}
              pressedIcon={iDarkMode}
              label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              toggleable
              pressed={!isDark}
              onPressedChange={(isLight) => toggleDarkMode(!isLight)}
            />
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
          <NavigationRailItem
            href={'/get-started/introduction'}
            icon={iHourglass}
            iconSelected={iHourglassFilled}
            {...previewProps('get-started')}
          >
            Get started
          </NavigationRailItem>
          <NavigationRailItem
            href={'/animations'}
            icon={iAnimation}
            iconSelected={iAnimationFilled}
            onMouseEnter={endPreview}
            onFocus={endPreview}
          >
            animations
          </NavigationRailItem>
          <NavigationRailItem
            href={'/components'}
            icon={iWidgets}
            iconSelected={iWidgetsFilled}
            {...previewProps('components')}
          >
            Components
          </NavigationRailItem>
          <NavigationRailItem
            href={'/theme/builder'}
            icon={iPalette}
            iconSelected={iPaletteFilled}
            {...previewProps('theme')}
          >
            Themes
          </NavigationRailItem>
        </NavigationRail>
        <Divider orientation="vertical" />
        {/* In flow: part of the row, pushes the content. Preview only: out
            of flow, overlays the content instead of shifting it. */}
        <div
          className={classNames('h-full', {
            'absolute left-full top-0': !inFlow,
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
