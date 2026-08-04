import { Tab, TabGroup, TabPanel, TabPanels, Tabs } from '@udixio/ui-react';

export default function TabsPanelsReact() {
  return (
    <TabGroup defaultSelectedTab={0}>
      <Tabs>
        <Tab label="Profile" />
        <Tab label="Settings" />
        <Tab label="Notifications" />
      </Tabs>
      <TabPanels>
        <TabPanel>
          <div className="p-4">
            <h3 className="text-title-medium">Profile</h3>
            <p className="text-body-medium text-on-surface-variant">
              This is the profile panel content.
            </p>
          </div>
        </TabPanel>
        <TabPanel>
          <div className="p-4">
            <h3 className="text-title-medium">Settings</h3>
            <p className="text-body-medium text-on-surface-variant">
              Configure your preferences here.
            </p>
          </div>
        </TabPanel>
        <TabPanel>
          <div className="p-4">
            <h3 className="text-title-medium">Notifications</h3>
            <p className="text-body-medium text-on-surface-variant">
              Manage your notification settings.
            </p>
          </div>
        </TabPanel>
      </TabPanels>
    </TabGroup>
  );
}
