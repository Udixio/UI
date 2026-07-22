import { Button } from '@udixio/ui-react';

export default function ButtonSizesReact() {
  return (
    <div className="flex flex-wrap items-end justify-center gap-3">
      <Button label="XS" size="xSmall" />
      <Button label="S" size="small" />
      <Button label="M" size="medium" />
      <Button label="L" size="large" />
      <Button label="XL" size="xLarge" />
    </div>
  );
}
