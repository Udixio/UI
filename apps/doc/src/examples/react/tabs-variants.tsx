import { Tab, Tabs } from '@udixio/ui-react';

export default function TabsVariantsReact() {
  return (
    <div className="space-y-2 w-full">
      <Tabs variant="primary" defaultSelectedTab={0}>
        <Tab label="One" />
        <Tab label="Two" />
      </Tabs>
      <Tabs variant="secondary" defaultSelectedTab={0}>
        <Tab label="One" />
        <Tab label="Two" />
      </Tabs>
    </div>
  );
}
