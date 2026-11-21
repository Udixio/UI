import { Component, signal } from '@angular/core';
import { defineMotion } from '@udixio/motion';
import { Button, Motion } from '@udixio/ui-angular';

defineMotion('pop', {
  verb: 'appear',
  keyframes: [{ opacity: 0, scale: 0.9 }, { opacity: 1, scale: 1 }],
});
@Component({
  selector: 'app-saved',
  imports: [Button, Motion],
  template: `<udx-button label="Toggle" (click)="open.set(!open())" />
    @if (open()) { <p udxMotion="pop">Saved to your library</p> }`,
})
export class Saved { open = signal(true); }
