import { Component, signal } from '@angular/core';
import { Motion } from '@udixio/ui-angular';
import '@udixio/motion/presets';

// The panel is a component of its own. Its element is in its own template, so the @if below does not wait for its exit:
// udxMotion goes on the panel's host element, in this template, and Angular keeps the host until the exit has played.
@Component({
  selector: 'docs-panel',
  template: `<p>Saved to your library</p>`,
})
export class Panel {}

@Component({
  imports: [Motion, Panel],
  template: `
    <button type="button" (click)="open.set(!open())">Toggle the panel</button>
    @if (open()) {
      <docs-panel udxMotion="fade" />
    }
  `,
})
export class Page {
  protected readonly open = signal(true);
}
