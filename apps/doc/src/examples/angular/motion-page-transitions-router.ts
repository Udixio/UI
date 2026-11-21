import { Component, inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { navigate, type NavigationDirection } from '@udixio/motion/page';
import { Button } from '@udixio/ui-angular';

// A service that changes the route inside a View Transition, in the direction of travel.
@Injectable({ providedIn: 'root' })
export class TransitionRouter {
  private readonly router = inject(Router);

  to(commands: string[], direction: NavigationDirection = 'forward'): Promise<void> {
    return navigate(async () => {
      await this.router.navigate(commands);
    }, { direction });
  }
}

// Forward to the next page, and back to the previous one: each button gives the direction of its link.
@Component({
  selector: 'app-pager',
  standalone: true,
  imports: [Button],
  template: `
    <udx-button size="small" label="Next page" (click)="transitions.to(['/motion/scroll'])" />
    <udx-button size="small" variant="tonal" label="Previous page" (click)="transitions.to(['/motion'], 'back')" />
  `,
})
export class Pager {
  protected readonly transitions = inject(TransitionRouter);
}
