import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Motion } from '@udixio/ui-angular';
import '@udixio/motion/presets';

// The first item has its text directly in the moving element, so a layout move stretches the text with the box.
// The second wraps the text in a span, which keeps its shape: the layout corrects the span, not the text.
@Component({
  selector: 'docs-motion-troubleshooting-stretched-angular',
  standalone: true,
  imports: [Motion],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ul>
      <li udxMotion="reflow">One</li>
      <li udxMotion="reflow"><span>One</span></li>
    </ul>
  `,
})
export class MotionTroubleshootingStretchedAngular {}
