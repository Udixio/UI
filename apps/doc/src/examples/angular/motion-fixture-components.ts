// Test fixture (tests/components-box.browser.test.mjs): Udixio components that take a motion with no wrapper box. Not a documentation example.
import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { Button, Card, ContextMenu, MenuItem, Motion, Snackbar, TextField } from '@udixio/ui-angular';
import '@udixio/motion/presets';

@Component({
  selector: 'docs-motion-fixture-components-angular',
  standalone: true,
  imports: [Button, Card, ContextMenu, MenuItem, Motion, Snackbar, TextField],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="grid gap-8" data-fixture="angular">
      <!-- udxMotion on the host: it has no box, so the press moves the Button's own <button>, then its <a> once it is a link. -->
      <div class="flex flex-wrap items-center gap-4" data-fixture-part="press">
        <udx-button
          udxMotion="press"
          [udxMotionState]="saves()"
          size="small"
          [href]="linked() ? '#fixture-link' : undefined"
          [label]="saves() === 0 ? 'Save' : 'Saved ' + saves() + '×'"
          (click)="saves.update((value) => value + 1)"
        />
        <udx-button size="small" variant="text" [label]="linked() ? 'Make it a button' : 'Make it a link'" (click)="linked.update((value) => !value)" />
      </div>
      <!-- The entry and the exit play on the Card's root. -->
      <div class="flex flex-col items-start gap-4" data-fixture-part="appear">
        <udx-button size="small" variant="tonal" [label]="shown() ? 'Hide the card' : 'Show the card'" (click)="shown.update((value) => !value)" />
        @if (shown()) {
          <udx-card udxMotion="slide" variant="elevated" class="w-full max-w-xs p-4">
            <p class="text-title-medium text-on-surface">Weekly report</p>
            <p class="mt-1 text-body-medium text-on-surface-variant">Ready to share.</p>
          </udx-card>
        }
      </div>
      <!-- Closed from the server HTML on: the host is hidden, and the Card's root moves. -->
      <div class="flex flex-col items-start gap-4" data-fixture-part="closed">
        <udx-button size="small" variant="tonal" [label]="open() ? 'Close the details' : 'Open the details'" (click)="open.update((value) => !value)" />
        <udx-card udxMotion="slide" [udxMotionPresent]="open()" variant="filled" class="w-full max-w-xs p-4">
          <p class="text-title-medium text-on-surface" data-fixture-details>Delivery details</p>
          <p class="mt-1 text-body-medium text-on-surface-variant">Ships in two days.</p>
        </udx-card>
      </div>
      <!-- The shake moves the field's root, not its input. -->
      <form (submit)="check($event)" class="flex flex-col items-start gap-4" data-fixture-part="shake">
        <udx-text-field
          udxMotion="shake"
          [udxMotionState]="refusals()"
          label="Code"
          [value]="code()"
          (valueChange)="code.set($event)"
          [errorText]="invalid() ? 'Not this code' : null"
        />
        <udx-button type="submit" size="small" variant="outlined" label="Check" />
      </form>
      <!-- Step B: the Snackbar holds its presence, so "fade" is ignored (development names Snackbar); the "press" plays. -->
      <div class="flex flex-col items-start gap-4" data-fixture-part="refused">
        <div class="flex flex-wrap gap-2">
          <udx-button size="small" variant="tonal" [label]="notified() ? 'Dismiss' : 'Notify'" (click)="notified.update((value) => !value)" />
          <udx-button size="small" variant="text" label="Pulse" (click)="pulses.update((value) => value + 1)" />
        </div>
        <udx-snackbar
          udxMotion="fade press"
          [udxMotionState]="pulses()"
          [open]="notified()"
          (openChange)="notified.set($event)"
          message="Draft saved"
        />
        <p class="text-body-small text-on-surface-variant">
          Development: <code>"fade" ignored: Snackbar already holds a presence on this element</code>.
        </p>
        <!-- Step E: the menu is in the top layer and the trigger is the author's: the host has no box to give. -->
        <udx-context-menu udxMotion="press" accessibleLabel="Draft actions">
          <udx-button contextMenuTrigger size="small" variant="outlined" label="Right-click me" />
          <udx-menu-item label="Rename" />
        </udx-context-menu>
        <p class="text-body-small text-on-surface-variant">
          Development: <code>"press" ignored: … has no box to give (data-motion-box="none")</code>.
        </p>
      </div>
    </div>
  `,
})
export class MotionFixtureComponentsAngular {
  protected readonly saves = signal(0);
  protected readonly linked = signal(false);
  protected readonly shown = signal(true);
  // Closed in the server HTML: the details must not show before the page hydrates.
  protected readonly open = signal(false);
  protected readonly code = signal('');
  // Each new value of a count replays its emphasis.
  protected readonly refusals = signal(0);
  protected readonly notified = signal(true);
  protected readonly pulses = signal(0);
  protected readonly invalid = computed(() => this.refusals() > 0 && this.code() !== '1234');

  protected check(event: Event): void {
    event.preventDefault();
    if (this.code() !== '1234') this.refusals.update((value) => value + 1);
  }
}
