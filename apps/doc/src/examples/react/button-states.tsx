import { Button } from '@udixio/ui-react';

export default function ButtonStatesReact() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-3">
      <Button label="Disabled" disabled />
      <Button label="Sending" loading />
      <Button label="Rounded" shape="rounded" variant="tonal" />
      <Button label="Squared" shape="squared" variant="outlined" />
    </div>
  );
}
