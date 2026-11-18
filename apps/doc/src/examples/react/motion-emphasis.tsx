import { useState } from 'react';
import { useMotion } from '@udixio/ui-react';
import '@udixio/motion/presets';

export function MotionEmphasisReact() {
  const [code, setCode] = useState('');
  const [checks, setChecks] = useState(0);
  const [refusals, setRefusals] = useState(0);
  const [invalid, setInvalid] = useState(false);
  // The shake replays when `state` changes.
  const field = useMotion('shake', {
    state: refusals,
  });
  // The press replays on each click.
  const check = useMotion('press', {
    state: checks,
  });

  const submit = () => {
    setChecks((value) => value + 1);
    setInvalid(code !== '1234');
    if (code !== '1234') setRefusals((value) => value + 1);
  };

  return (
    <div className="flex flex-col items-start gap-4">
      <input
        ref={field.ref}
        value={code}
        aria-invalid={invalid}
        onChange={(event) => setCode(event.target.value)}
        onKeyDown={(event) => event.key === 'Enter' && submit()}
        className="rounded-xl border border-outline bg-surface-container-lowest px-4 py-2 text-on-surface"
      />
      <button
        ref={check.ref}
        type="button"
        onClick={submit}
        className="rounded-full bg-primary px-6 py-2.5 text-label-large text-on-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-on-surface"
      >
        Check
      </button>
    </div>
  );
}
