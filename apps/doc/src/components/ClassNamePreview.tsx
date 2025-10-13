import React from 'react';
import { Card } from '@udixio/ui-react';

type Props = {
  className: string;
  children: React.ReactNode;
};

export default function ClassNamePreview({ className, children }: Props) {
  return (
    <Card
      variant="filled"
      className={className + ' relative p-6 bg-surface-container'}
    >
      {children}

      <pre className="mt-4 whitespace-pre-wrap text-body-small bg-surface-container-low p-1 rounded-md w-fit">
        {className}
      </pre>
    </Card>
  );
}
