import { Menu, MenuHeadline, MenuItem } from '@udixio/ui-react';

const recentDocuments = Array.from(
  { length: 10 },
  (_, index) => `Document ${index + 1}`,
);

export default function MenuLinksScrollReact() {
  return (
    <div className="flex flex-wrap items-start justify-center gap-6">
      <Menu accessibleLabel="Component documentation">
        <MenuHeadline label="Documentation" />
        <MenuItem label="Button" href="/components/button/overview" />
        <MenuItem label="Card" href="/components/card/overview" />
        <MenuItem label="Checkbox" href="/components/checkbox/overview" />
        <MenuItem label="Unavailable page" href="/unavailable" disabled />
      </Menu>

      <Menu accessibleLabel="Recent documents">
        <MenuHeadline label="Recent documents" />
        {recentDocuments.map((document) => (
          <MenuItem key={document} label={document} />
        ))}
      </Menu>
    </div>
  );
}
