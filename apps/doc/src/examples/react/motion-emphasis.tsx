import { useState } from 'react';
import { useMotion } from '@udixio/ui-react';
import '@udixio/motion/presets';

export function MotionEmphasisReact() {
  const [code, setCode] = useState('');
  const [invalid, setInvalid] = useState(false);
  // An emphasis replays with play(): the shake when the code is refused, the press on each check.
  const field = useMotion('shake');
  const check = useMotion('press');

  const submit = () => {
    check.play();
    setInvalid(code !== '1234');
    if (code !== '1234') field.play();
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
