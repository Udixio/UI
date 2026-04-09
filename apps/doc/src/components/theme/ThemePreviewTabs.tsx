import React from 'react';
import {
  Button,
  Card,
  Checkbox,
  Divider,
  IconButton,
  Switch,
  Tab,
  TabGroup,
  TabPanel,
  TabPanels,
  Tabs,
  TextField,
} from '@udixio/ui-react';
import { TokenGallery } from './TokenGallery';
import {
  faDisplay,
  faLayerGroup,
  faPalette,
  faPaperPlane,
  faSearch,
} from '@fortawesome/free-solid-svg-icons';

export const ThemePreviewTabs = () => {
  return (
    <TabGroup defaultTab={0}>
      <Tabs
        variant="secondary"
        className="mb-4 bg-transparent border-b border-outline-variant rounded-none"
      >
        <Tab label="Preview" icon={faDisplay as any} />
        <Tab label="Colors" icon={faPalette as any} />
        <Tab label="Components" icon={faLayerGroup as any} />
      </Tabs>
      <TabPanels>
        <TabPanel>
          <div className="p-4 flex gap-8 flex-col lg:flex-row flex-wrap justify-center relative items-center py-8 relative">
            {/* Mobile View 1 (Todo List) */}
            <div className="absolute inset-0 z-50 " />

            <div className="w-[320px] h-[640px] rounded-[2rem] border-8 border-outline shadow-xl overflow-hidden bg-surface flex flex-col relative">
              <div className="h-6 w-full bg-surface-container flex items-center justify-between px-4 text-[10px] text-on-surface-variant font-medium shrink-0">
                <span>9:41</span>
                <div className="flex gap-1">
                  <span>📶</span>
                  <span>🔋</span>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto bg-surface-container-lowest p-4 space-y-4">
                <div className="flex items-center justify-between mt-2 mb-6">
                  <div>
                    <h3 className=" text-headline-small text-on-surface">
                      My Tasks
                    </h3>
                    <p className="text-body-small text-on-surface-variant">
                      5 pending tasks
                    </p>
                  </div>
                  <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-on-primary  text-title-large">
                    A
                  </div>
                </div>

                <Card variant={'filled'} className={'bg-surface-container'}>
                  <div className="p-4 space-y-3">
                    <h3 className="text-label-large text-primary">Work</h3>
                    <div className="space-y-3">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <Checkbox defaultChecked />
                        <span className="text-body-medium text-on-surface line-through opacity-70">
                          Review PR #102
                        </span>
                      </label>
                      <label className="flex items-center gap-3 cursor-pointer">
                        <Checkbox />
                        <span className="text-body-medium text-on-surface">
                          Draft design doc
                        </span>
                      </label>
                    </div>
                  </div>
                </Card>

                <Card variant={'filled'} className={'bg-surface-container'}>
                  <div className="p-4 space-y-3">
                    <h3 className="text-label-large  text-secondary">
                      Personal
                    </h3>
                    <div className="space-y-3">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <Checkbox />
                        <span className="text-body-medium text-on-surface">
                          Call the dentist
                        </span>
                      </label>
                    </div>
                  </div>
                </Card>

                <Card variant={'filled'} className={'bg-surface-container'}>
                  <div className="p-4 space-y-3">
                    <h3 className="text-label-large text-tertiary">
                      Groceries
                    </h3>
                    <div className="space-y-3">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <Checkbox defaultChecked />
                        <span className="text-body-medium text-on-surface line-through opacity-70">
                          Milk & Eggs
                        </span>
                      </label>
                      <label className="flex items-center gap-3 cursor-pointer">
                        <Checkbox />
                        <span className="text-body-medium text-on-surface">
                          Coffee beans
                        </span>
                      </label>
                    </div>
                  </div>
                </Card>
              </div>
            </div>

            {/* Mobile View 2 (Messages & Chat) */}
            <div className="w-[320px] h-[640px] rounded-[2rem] border-8 border-outline shadow-xl overflow-hidden bg-surface flex flex-col relative">
              <div className="h-6 w-full bg-surface flex items-center justify-between px-4 text-[10px] text-on-surface-variant font-medium shrink-0">
                <span>9:41</span>
                <div className="flex gap-1">
                  <span>📶</span>
                  <span>🔋</span>
                </div>
              </div>
              <div className="h-14 bg-surface-container flex items-center justify-between px-4 border-b border-outline-variant/30 shrink-0">
                <h3 className="text-label-large text-on-surface">Chat</h3>
                <IconButton
                  icon={faSearch as any}
                  variant="standard"
                  label="Search"
                />
              </div>
              <div className="flex-1 overflow-y-auto divide-y divide-outline-variant/50 bg-surface">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className="p-4 hover:bg-surface-container-low transition-colors cursor-pointer flex gap-3 items-start"
                  >
                    <div className="h-10 w-10 rounded-full bg-secondary-container flex items-center justify-center text-on-secondary-container flex-shrink-0 mt-1">
                      {i}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-baseline mb-1">
                        <h4 className="text-title-small">Team Update #{i}</h4>
                        <span className="text-label-small text-on-surface-variant">
                          10:4{i} AM
                        </span>
                      </div>
                      <p className="text-body-small text-on-surface-variant line-clamp-2">
                        Lorem ipsum dolor sit amet, consectetur adipiscing.
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-3 bg-surface-container-lowest border-t border-outline-variant/30 shrink-0">
                <div className="flex gap-2 items-center">
                  <input
                    type="text"
                    placeholder="Message..."
                    className="flex-1 bg-surface-container-high border-none outline-none text-on-surface placeholder:text-on-surface-variant text-body-medium px-4 py-2.5 rounded-full"
                  />
                  <IconButton
                    size={'small'}
                    icon={faPaperPlane}
                    variant="filled"
                    label="Send"
                  />
                </div>
              </div>
            </div>
          </div>
        </TabPanel>

        <TabPanel>
          <Card
            variant="filled"
            className="space-y-4 p-8 bg-surface-container w-full"
          >
            <h2 className="text-lg font-semibold">Catalog of colors</h2>
            <TokenGallery />
          </Card>
        </TabPanel>
        <TabPanel>
          <div className="space-y-8 p-4">
            <section>
              <h2 className="text-title-large mb-3">Buttons</h2>
              <div className="flex flex-wrap gap-3">
                <Button>Primary</Button>
                <Button variant="tonal">Tonal</Button>
                <Button variant="outlined">Outlined</Button>
                <Button variant="text">Text</Button>
                <Button disabled>Disabled</Button>
              </div>
            </section>

            <Divider />

            <section>
              <h2 className="text-title-large mb-3">TextFields</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <TextField label="Email" name="email" placeholder="Email" />
                <TextField
                  name="password"
                  label="Password"
                  placeholder="Password"
                  type="password"
                />
                <div className="flex items-center gap-3">
                  <Switch defaultChecked />
                  <span className="text-sm text-on-surface-variant">
                    Enable notifications
                  </span>
                </div>
              </div>
            </section>

            <Divider />

            <section>
              <h2 className="text-title-large mb-3">Cards</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <Card>
                  <div className="p-4 space-y-2">
                    <h3 className="font-semibold">Hand-picked Theme</h3>
                    <p className="text-sm text-on-surface-variant">
                      Copy and paste this theme token set to get started
                      quickly.
                    </p>
                    <div className="flex gap-2">
                      <Button size="small">Use theme</Button>
                      <Button size="small" variant="outlined">
                        Copy tokens
                      </Button>
                    </div>
                  </div>
                </Card>
                <Card>
                  <div className="p-4 space-y-2">
                    <h3 className="font-semibold">Live Preview</h3>
                    <p className="text-sm text-on-surface-variant">
                      Interact with components to see color ramps.
                    </p>
                    <div className="flex gap-2">
                      <Button size="small" variant="text">
                        Secondary
                      </Button>
                      <Button size="small" variant="tonal">
                        Tonal
                      </Button>
                    </div>
                  </div>
                </Card>
              </div>
            </section>
          </div>
        </TabPanel>
      </TabPanels>
    </TabGroup>
  );
};
