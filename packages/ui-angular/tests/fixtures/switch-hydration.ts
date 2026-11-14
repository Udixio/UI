import '@angular/compiler';
import { Component } from '@angular/core';
import { Switch } from '../../src/lib/switch/switch';

@Component({
  selector: 'switch-hydration-fixture',
  standalone: true,
  imports: [Switch],
  template: `<udx-switch aria-label="Hydrated switch" defaultChecked />`,
})
export class SwitchHydrationFixture {}
