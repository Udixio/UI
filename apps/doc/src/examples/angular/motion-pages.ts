import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { navigate, type NavigationDirection } from '@udixio/motion/page';

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
