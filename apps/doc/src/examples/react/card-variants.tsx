import { Card } from '@udixio/ui-react';

export default function CardVariantsReact() {
  return (
    <div className="flex w-full flex-wrap gap-4">
      <Card className="flex h-40 min-w-48 flex-1 items-center justify-center">
        <p>Outlined</p>
      </Card>
      <Card
        variant="elevated"
        className="flex h-40 min-w-48 flex-1 items-center justify-center"
      >
        <p>Elevated</p>
      </Card>
      <Card
        variant="filled"
        className="flex h-40 min-w-48 flex-1 items-center justify-center"
      >
        <p>Filled</p>
      </Card>
    </div>
  );
}
