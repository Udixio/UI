import { Button } from '@udixio/ui-react';

export default function ButtonVariantsReact() {
  return (
    <div className="flex flex-wrap justify-center gap-3">
      <Button label="Filled" variant="filled" />
      <Button label="Elevated" variant="elevated" />
      <Button label="Tonal" variant="tonal" />
      <Button label="Outlined" variant="outlined" />
      <Button label="Text" variant="text" />
    </div>
  );
}
