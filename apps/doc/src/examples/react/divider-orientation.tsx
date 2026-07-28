import { Divider } from '@udixio/ui-react';

export default function DividerOrientationReact() {
  return (
    <div className="flex items-center gap-4">
      <div>
        <p>Section A</p>
        <Divider />
        <p>Section B</p>
      </div>
      <Divider orientation="vertical" className="h-12" />
      <div>
        <p>Section C</p>
      </div>
    </div>
  );
}
