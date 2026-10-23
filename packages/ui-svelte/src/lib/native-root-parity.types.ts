import { iAdd } from '@udixio/icons-rounded-400/add';
import { iHome } from '@udixio/icons-rounded-400/home';
import type { SvelteCardProps } from './card/card.types';
import type { SvelteChipProps } from './chip/chip.types';
import type { SvelteFabProps } from './fab/fab.types';
import type { SvelteIconButtonProps } from './icon-button/icon-button.types';
import type { SvelteMenuItemProps } from './menu/menu-item.types';
import type { SvelteNavigationRailItemProps } from './navigation-rail/navigation-rail-item.types';
import type { SvelteTabProps } from './tabs/tab.types';

const fabAction = { label: 'Save', icon: iAdd, form: 'checkout' } satisfies SvelteFabProps;
const iconButtonAction = { label: 'Save', icon: iAdd, form: 'checkout' } satisfies SvelteIconButtonProps;
const chipAction = { label: 'Filter', form: 'filters' } satisfies SvelteChipProps;
const menuItemAction = { label: 'Save', form: 'menu-form' } satisfies SvelteMenuItemProps;
const navigationRailItemAction = {
  label: 'Home',
  icon: iHome,
  iconSelected: iHome,
  form: 'navigation-form',
} satisfies SvelteNavigationRailItemProps;
const tabAction = { label: 'Overview', form: 'tabs-form' } satisfies SvelteTabProps;
const cardLink = { href: '/report', download: 'report.pdf' } satisfies SvelteCardProps;

const fabLinkWithButtonAttribute = { label: 'Docs', icon: iAdd, href: '/docs', form: 'checkout' };
// @ts-expect-error `form` is only valid for action buttons.
const typedFabLinkWithButtonAttribute: SvelteFabProps = fabLinkWithButtonAttribute;
const iconButtonLinkWithButtonAttribute = { label: 'Docs', icon: iAdd, href: '/docs', form: 'checkout' };
// @ts-expect-error `form` is only valid for action buttons.
const typedIconButtonLinkWithButtonAttribute: SvelteIconButtonProps = iconButtonLinkWithButtonAttribute;
const chipLinkWithButtonAttribute = { label: 'Filter', href: '/filters', form: 'filters' };
// @ts-expect-error `form` is only valid for action buttons.
const typedChipLinkWithButtonAttribute: SvelteChipProps = chipLinkWithButtonAttribute;
const menuItemLinkWithButtonAttribute = { label: 'Docs', href: '/docs', form: 'menu-form' };
// @ts-expect-error `form` is only valid for action buttons.
const typedMenuItemLinkWithButtonAttribute: SvelteMenuItemProps = menuItemLinkWithButtonAttribute;
const navigationRailItemLinkWithButtonAttribute = {
  label: 'Docs',
  icon: iHome,
  iconSelected: iHome,
  href: '/docs',
  form: 'navigation-form',
};
// @ts-expect-error `form` is only valid for action buttons.
const typedNavigationRailItemLinkWithButtonAttribute: SvelteNavigationRailItemProps = navigationRailItemLinkWithButtonAttribute;
const tabLinkWithButtonAttribute = { label: 'Docs', href: '/docs', form: 'tabs-form' };
// @ts-expect-error `form` is only valid for action buttons.
const typedTabLinkWithButtonAttribute: SvelteTabProps = tabLinkWithButtonAttribute;

void fabAction;
void iconButtonAction;
void chipAction;
void menuItemAction;
void navigationRailItemAction;
void tabAction;
void cardLink;
void typedFabLinkWithButtonAttribute;
void typedIconButtonLinkWithButtonAttribute;
void typedChipLinkWithButtonAttribute;
void typedMenuItemLinkWithButtonAttribute;
void typedNavigationRailItemLinkWithButtonAttribute;
void typedTabLinkWithButtonAttribute;
