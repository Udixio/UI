import { reflectComponentType, type Type } from '@angular/core';
import { AnchorPositioner } from './anchor-positioner/anchor-positioner';
import { BadgeSurface } from './badge/badge-surface';
import { Button } from './button/button';
import { Card } from './card/card';
import { Carousel } from './carousel/carousel';
import { CarouselItem } from './carousel/carousel-item';
import { Checkbox } from './checkbox/checkbox';
import { Chip } from './chip/chip';
import { Chips } from './chips/chips';
import { ContextMenu } from './context-menu/context-menu';
import { DatePicker } from './date-picker/date-picker';
import { Divider } from './divider/divider';
import { Fab } from './fab/fab';
import { FabMenu } from './fab-menu/fab-menu';
import { Icon } from './icon/icon';
import { IconButton } from './icon-button/icon-button';
import { Menu } from './menu/menu';
import { MenuGroup } from './menu/menu-group';
import { MenuHeadline } from './menu/menu-headline';
import { MenuItem } from './menu/menu-item';
import { NavigationRail } from './navigation-rail/navigation-rail';
import { NavigationRailItem } from './navigation-rail/navigation-rail-item';
import { ProgressIndicator } from './progress-indicator/progress-indicator';
import { Search } from './search/search';
import { SideSheet } from './side-sheet/side-sheet';
import { Slider } from './slider/slider';
import { Snackbar } from './snackbar/snackbar';
import { StateLayer } from './state-layer/state-layer';
import { Switch } from './switch/switch';
import { Tab } from './tabs/tab';
import { TabPanel } from './tabs/tab-panel';
import { TabPanels } from './tabs/tab-panels';
import { Tabs } from './tabs/tabs';
import { TextField } from './text-field/text-field';

// Every element component. Directives ([udxBadge], [udxTooltip]) are excluded on
// purpose: their host is the consumer's element, so `class` must stay native there.
const COMPONENTS: Type<unknown>[] = [
  AnchorPositioner,
  BadgeSurface,
  Button,
  Card,
  Carousel,
  CarouselItem,
  Checkbox,
  Chip,
  Chips,
  ContextMenu,
  DatePicker,
  Divider,
  Fab,
  FabMenu,
  Icon,
  IconButton,
  Menu,
  MenuGroup,
  MenuHeadline,
  MenuItem,
  NavigationRail,
  NavigationRailItem,
  ProgressIndicator,
  Search,
  SideSheet,
  Slider,
  Snackbar,
  StateLayer,
  Switch,
  Tab,
  TabPanel,
  TabPanels,
  Tabs,
  TextField,
];

describe('native class alias', () => {
  it.each(COMPONENTS.map((c) => [c.name, c] as const))(
    '%s exposes hostClass aliased as class',
    (_name, component) => {
      const mirror = reflectComponentType(component);
      expect(mirror).not.toBeNull();
      expect(mirror!.inputs).toContainEqual(
        expect.objectContaining({
          propName: 'hostClass',
          templateName: 'class',
        }),
      );
    },
  );
});
