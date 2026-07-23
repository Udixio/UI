import { Button, Card } from '@udixio/ui-react';

export default function CardCompositionReact() {
  return (
    <Card variant="filled" className="w-full max-w-96">
      <img
        className="h-40 w-full object-cover"
        src="https://picsum.photos/640/240"
        alt=""
      />
      <div className="space-y-2 p-4">
        <p className="text-title-medium">Project Aurora</p>
        <p className="text-body-medium text-on-surface-variant">
          Last updated 2 days ago
        </p>
        <div className="flex gap-2 pt-2">
          <Button label="Open" size="small" variant="filled" />
          <Button
            label="Share"
            size="small"
            variant="text"
            edgeAligned={false}
          />
        </div>
      </div>
    </Card>
  );
}
