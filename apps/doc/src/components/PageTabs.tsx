import { Tab, Tabs } from '@udixio/ui-react';

/**
 * The tab header of a feature's page (framework-urls spec §2.10): one link per tab, drawn as the component pages' header.
 * The selected tab is read from the pathname the server rendered, never from the window, so the island hydrates as it was
 * drawn; a trailing slash of the pathname is ignored.
 */
export const PageTabs = ({
  tabs,
  pathname,
  label,
}: {
  /** The tabs of the feature, in order: each label and the address of its page in the reader's framework. */
  tabs: readonly { label: string; href: string }[];
  /** The address of the page, as the server received it. */
  pathname: string;
  /** The name of the tab list, for assistive technology. */
  label: string;
}) => {
  const current = pathname.replace(/\/+$/, '');
  const selected = Math.max(
    0,
    tabs.findIndex((tab) => tab.href === current),
  );
  return (
    <Tabs
      variant={'secondary'}
      className={'bg-surface-container'}
      selectedTab={selected}
      aria-label={label}
      data-page-tabs
    >
      {tabs.map((tab) => (
        <Tab key={tab.href} href={tab.href} label={tab.label} />
      ))}
    </Tabs>
  );
};
