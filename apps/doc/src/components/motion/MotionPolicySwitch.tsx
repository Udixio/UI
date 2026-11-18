import { useEffect, useId, useState } from 'react';
import { Switch } from '@udixio/ui-react';

/** The stored choice: `reduce` when the visitor asked for reduced motion on this site, absent otherwise. */
export const MOTION_POLICY_STORAGE_KEY = 'udixio:docs:motion-policy';

const SYSTEM_QUERY = '(prefers-reduced-motion: reduce)';

function readStoredChoice(): boolean {
  try {
    return window.localStorage.getItem(MOTION_POLICY_STORAGE_KEY) === 'reduce';
  } catch {
    return false;
  }
}

function writeStoredChoice(reduce: boolean): void {
  try {
    if (reduce) window.localStorage.setItem(MOTION_POLICY_STORAGE_KEY, 'reduce');
    else window.localStorage.removeItem(MOTION_POLICY_STORAGE_KEY);
  } catch {
    // Storage may be unavailable in privacy-restricted browser contexts: the choice then lasts for the page.
  }
}

/** Sets the policy of the document: `data-motion-policy="reduce"` on `<html>`, or no attribute (the system decides). */
function applyPolicy(reduce: boolean): void {
  if (reduce) document.documentElement.setAttribute('data-motion-policy', 'reduce');
  else document.documentElement.removeAttribute('data-motion-policy');
}

// The client router replaces the attributes of <html> on each navigation, so the stored choice is put back there.
// This module stays loaded for the rest of the visit, so the choice holds on every page after the first switch.
if (typeof document !== 'undefined') {
  document.addEventListener('astro:after-swap', () => applyPolicy(readStoredChoice()));
}

type MotionPolicySwitchProps = {
  /**
   * For a toolbar: the helper text is read by screen readers but not shown, unless the system asks for reduced motion;
   * it then says so in a few words, why the switch cannot be changed.
   */
  compact?: boolean;
};

/**
 * The Reduce motion switch of the Animation section. It sets the policy of the whole documentation site. When the
 * system asks for reduced motion, it shows as on and cannot be changed: the system decides then. Several switches on
 * one page stay in step: each follows the policy written on `<html>`.
 */
export function MotionPolicySwitch({ compact = false }: MotionPolicySwitchProps) {
  const id = useId();
  const labelId = `${id}-label`;
  const helpId = `${id}-help`;
  const [reduce, setReduce] = useState(false);
  const [system, setSystem] = useState(false);

  useEffect(() => {
    const stored = readStoredChoice();
    setReduce(stored);
    applyPolicy(stored);

    const query = window.matchMedia(SYSTEM_QUERY);
    const syncSystem = () => setSystem(query.matches);
    syncSystem();
    query.addEventListener('change', syncSystem);

    // Another switch of the page, or the router putting the choice back, writes the policy on <html>: follow it.
    const root = document.documentElement;
    const observer = new MutationObserver(() => setReduce(root.getAttribute('data-motion-policy') === 'reduce'));
    observer.observe(root, { attributes: true, attributeFilter: ['data-motion-policy'] });
    return () => {
      query.removeEventListener('change', syncSystem);
      observer.disconnect();
    };
  }, []);

  const choose = (next: boolean) => {
    setReduce(next);
    writeStoredChoice(next);
    applyPolicy(next);
  };

  return (
    <div className="not-prose flex items-center gap-4">
      <div className="min-w-0">
        <span
          id={labelId}
          className={`block text-label-large text-on-surface ${system ? '' : 'cursor-pointer select-none'}`}
          onClick={() => {
            if (!system) choose(!reduce);
          }}
        >
          Reduce motion
        </span>
        <span
          id={helpId}
          className={`block text-body-small text-on-surface-variant ${compact && !system ? 'sr-only' : ''}`}
        >
          {system
            ? compact
              ? 'Set by your system.'
              : 'Your system asks for reduced motion.'
            : 'Applies to this documentation site.'}
        </span>
      </div>
      <Switch
        checked={reduce || system}
        disabled={system}
        onCheckedChange={choose}
        aria-labelledby={labelId}
        aria-describedby={helpId}
      />
    </div>
  );
}
