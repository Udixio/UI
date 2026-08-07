import { Button, Tooltip } from '@udixio/ui-react';

export default function TooltipBasicReact() {
  return (
    <div className="flex flex-wrap items-center gap-6 p-8">
      <Tooltip text="Copy to clipboard">
        <Button label="Hover me" />
      </Tooltip>
      <Tooltip text="Opens on click" trigger="click">
        <Button label="Click me" />
      </Tooltip>
      <Tooltip text="Top placement" position="top">
        <Button label="Top" />
      </Tooltip>
    </div>
  );
}
