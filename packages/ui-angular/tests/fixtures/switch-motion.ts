import '@angular/compiler';
import { Component } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { Switch } from '../../src/lib/switch/switch';
const state = window as unknown as {
  changes: boolean[];
  events: [string, boolean, boolean][];
  dispose: () => void;
};
state.changes = [];
state.events = [];
@Component({
  selector: 'switch-motion-fixture',
  standalone: true,
  imports: [Switch],
  template: `<udx-switch
      aria-label="Enabled"
      (checkedChange)="record($event)"
      (keydown)="key($event)"
    /><udx-switch
      aria-label="Disabled"
      disabled
      (checkedChange)="record($event)"
    />`,
})
class SwitchMotionFixture {
  key(event: KeyboardEvent) {
    state.events.push([
      event.key,
      (event.target as HTMLElement).getAttribute('role') === 'switch',
      event.target === event.currentTarget,
    ]);
  }
  record(value: boolean) {
    state.changes.push(value);
  }
}
bootstrapApplication(SwitchMotionFixture).then((app) => {
  state.dispose = () => app.destroy();
});
