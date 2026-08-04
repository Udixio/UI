import { Tab, Tabs } from '@udixio/ui-react';
import { iHome } from '@udixio/icons-rounded-400/home';
import { iSettings } from '@udixio/icons-rounded-400/settings';
import { iPerson } from '@udixio/icons-rounded-400/person';

export default function TabsBasicReact() {
  return (
    <Tabs defaultSelectedTab={0}>
      <Tab label="Home" icon={iHome} />
      <Tab label="Settings" icon={iSettings} />
      <Tab label="Profile" icon={iPerson} />
    </Tabs>
  );
}
