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

      <div
        style={{ wordSpacing: '1rem' }}
        className="mt-4 text-body-small bg-surface-container-low p-1 rounded-md w-fit flex flex-wrap gap-2"
      >
        {className.split(' ').map((c, i) => (
          <span key={i} className="inline-block">
            {c}
          </span>
        ))}
      </div>
    </Card>
  );
}
