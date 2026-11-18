import { Component } from '@angular/core';
import { defineMotion } from '@udixio/motion';
import { Motion } from '@udixio/ui-angular';

// A motion names its timing by token: a spring, or a curve of a duration and an easing.
defineMotion('panel-in', {
  verb: 'appear',
  keyframes: [
    { opacity: 0, y: 24 },
    { opacity: 1, y: 0 },
  ],
  timing: 'spring.fast.spatial',
});

@Component({
  selector: 'docs-motion-tokens-angular',
  standalone: true,
  imports: [Motion],
  template: `
    <div udxMotion="panel-in">Moves</div>
  `,
})
export class MotionTokensAngular {}
