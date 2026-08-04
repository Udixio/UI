import { useState } from 'react';
import { Tab, Tabs } from '@udixio/ui-react';

export default function TabsControlledReact() {
  const [tab, setTab] = useState(0);
  return (
    <Tabs selectedTab={tab} onSelectedTabChange={setTab} scrollable>
      <Tab label="Overview" />
      <Tab label="Activity" />
      <Tab label="Settings" />
      <Tab label="Billing" />
      <Tab label="Advanced" />
    </Tabs>
  );
}
