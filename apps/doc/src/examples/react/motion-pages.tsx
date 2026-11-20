import { navigate, type NavigationDirection } from '@udixio/motion/page';
import { Button } from '@udixio/ui-react';
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
    <div className="flex flex-wrap gap-3">
      <Button size="small" label="Next page" onClick={() => go('/motion/scroll')} />
      <Button size="small" variant="tonal" label="Previous page" onClick={() => go('/motion', 'back')} />
    </div>
  );
}
