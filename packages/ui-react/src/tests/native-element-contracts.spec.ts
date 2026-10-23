import { iAdd } from '@udixio/icons-rounded-400/add';
import { iHome } from '@udixio/icons-rounded-400/home';
import { describe, expect, it } from 'vitest';
import type { ReactCardProps } from '../lib/components/Card';
import type { ReactChipProps } from '../lib/components/Chip';
import type { ReactFabProps } from '../lib/components/Fab';
import type { ReactIconButtonProps } from '../lib/components/IconButton';
import type { ReactMenuItemProps } from '../lib/components/MenuItem';
import type { ReactNavigationRailItemProps } from '../lib/components/NavigationRailItem';
import type { ReactTabProps } from '../lib/components/Tab';

const fabAction = { label: 'Save', icon: iAdd, form: 'checkout' } satisfies ReactFabProps;
const iconButtonAction = { label: 'Save', icon: iAdd, form: 'checkout' } satisfies ReactIconButtonProps;
const chipAction = { label: 'Filter', form: 'filters' } satisfies ReactChipProps;
const menuItemAction = { label: 'Save', form: 'menu-form' } satisfies ReactMenuItemProps;
const navigationRailItemAction = {
  label: 'Home',
  icon: iHome,
  iconSelected: iHome,
  form: 'navigation-form',
} satisfies ReactNavigationRailItemProps;
const tabAction = { label: 'Overview', form: 'tabs-form' } satisfies ReactTabProps;
const cardLink = { href: '/report', download: 'report.pdf' } satisfies ReactCardProps;

const chipLinkWithButtonAttribute = { label: 'Filter', href: '/filters', form: 'filters' };
// @ts-expect-error `form` is only valid for action buttons.
const typedChipLinkWithButtonAttribute: ReactChipProps = chipLinkWithButtonAttribute;
const menuItemLinkWithButtonAttribute = { label: 'Docs', href: '/docs', form: 'menu-form' };
// @ts-expect-error `form` is only valid for action buttons.
const typedMenuItemLinkWithButtonAttribute: ReactMenuItemProps = menuItemLinkWithButtonAttribute;
const navigationRailItemLinkWithButtonAttribute = {
  label: 'Docs',
  icon: iHome,
  iconSelected: iHome,
  href: '/docs',
  form: 'navigation-form',
};
// @ts-expect-error `form` is only valid for action buttons.
const typedNavigationRailItemLinkWithButtonAttribute: ReactNavigationRailItemProps = navigationRailItemLinkWithButtonAttribute;
const tabLinkWithButtonAttribute = { label: 'Docs', href: '/docs', form: 'tabs-form' };
// @ts-expect-error `form` is only valid for action buttons.
const typedTabLinkWithButtonAttribute: ReactTabProps = tabLinkWithButtonAttribute;

void fabAction;
void iconButtonAction;
void chipAction;
void menuItemAction;
void navigationRailItemAction;
void tabAction;
void cardLink;
void typedChipLinkWithButtonAttribute;
void typedMenuItemLinkWithButtonAttribute;
void typedNavigationRailItemLinkWithButtonAttribute;
void typedTabLinkWithButtonAttribute;

describe('native element contracts', () => {
  it('keeps button-only attributes on the action branch', () => {
    expect(true).toBe(true);
  });
});
