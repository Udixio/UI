import { useState } from 'react';
import { Button } from '@udixio/ui-react';

export default function ButtonActionsReact() {
  const [message, setMessage] = useState('No action yet');

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex flex-wrap justify-center gap-3">
        <Button label="Run action" onClick={() => setMessage('Action run')} />
        <Button
          label="Button documentation"
          href="/docs/components/button"
          aria-current="page"
          variant="outlined"
        />
      </div>
      <p aria-live="polite" className="text-body-medium">
        {message}
      </p>
    </div>
  );
}
