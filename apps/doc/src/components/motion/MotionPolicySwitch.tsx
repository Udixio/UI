import { useEffect, useId, useState } from 'react';
import { Switch } from '@udixio/ui-react';
import {
  applyMotionPolicy,
  readStoredMotionPolicy,
  setMotionPolicy,
  watchMotionPolicy,
  watchSystemReducedMotion,
} from './motionPolicy';

type MotionPolicySwitchProps = {
  /**
   * For a toolbar: the helper text is read by screen readers but not shown, unless the system asks for reduced motion;
   * it then says so in a few words, why the switch cannot be changed.
   */
  compact?: boolean;
};

/**
 * A Reduce motion switch for the policy of the whole documentation site (`motionPolicy.ts`). When the system asks for
 * reduced motion, it shows as on and cannot be changed: the system decides then. Several switches on one page stay in
 * step: each follows the policy written on `<html>`. The site's own control is the rail button (`Navigation.tsx`); this
 * switch stays only while the Hero still renders it.
 */
export function MotionPolicySwitch({ compact = false }: MotionPolicySwitchProps) {
  const id = useId();
  const labelId = `${id}-label`;
  const helpId = `${id}-help`;
  const [reduce, setReduce] = useState(false);
  const [system, setSystem] = useState(false);

  useEffect(() => {
    applyMotionPolicy(readStoredMotionPolicy());
    const stopPolicy = watchMotionPolicy(setReduce);
    const stopSystem = watchSystemReducedMotion(setSystem);
    return () => {
      stopPolicy();
      stopSystem();
    };
  }, []);

  const choose = (next: boolean) => {
    setReduce(next);
    setMotionPolicy(next);
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
