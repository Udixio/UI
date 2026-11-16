import type { CurveTiming, SpringRef } from '@udixio/motion';

/** How a component moves: the motion token of its transitions, shared by every framework. */
export interface ComponentMotion {
  /** A spring token or a duration/easing pair from `@udixio/motion`. Omitted, the component's own default applies. */
  timing?: SpringRef | CurveTiming;
}
