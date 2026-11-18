import { navigate, type NavigationDirection } from '@udixio/motion/page';
import { useNavigate } from 'react-router';

// A hook that changes the route inside a View Transition, in the direction of travel.
export function useTransitionNavigate() {
  const router = useNavigate();
  return (to: string, direction: NavigationDirection = 'forward') =>
    navigate(() => router(to), { direction });
}

// Back: the same hook, with the direction set to back.
export function Pager() {
  const go = useTransitionNavigate();
  return (
    <div className="flex gap-3">
      <button type="button" onClick={() => go('/motion/scroll')}>Next page</button>
      <button type="button" onClick={() => go('/motion', 'back')}>Previous page</button>
    </div>
  );
}
