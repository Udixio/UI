import { useState } from 'react';
import { Card } from '@udixio/ui-react';

export default function CardActionsReact() {
  const [message, setMessage] = useState('No action yet');

  return (
    <div className="flex w-full flex-col items-center gap-3">
      <div className="flex w-full flex-wrap gap-4">
        <Card
          href="/components/card/overview"
          variant="elevated"
          className="flex h-40 min-w-48 flex-1 items-center justify-center"
        >
          <p>Navigate to the Card page</p>
        </Card>
        <Card
          interactive
          onClick={() => setMessage('Card activated')}
          variant="filled"
          className="flex h-40 min-w-48 flex-1 items-center justify-center"
        >
          <p>Run an action</p>
        </Card>
      </div>
      <p aria-live="polite" className="text-body-medium">
        {message}
      </p>
    </div>
  );
}
