import { Divider } from '@udixio/ui-react';

export default function DividerSpacingReact() {
  return (
    <div className="space-y-6">
      <div>
        <p className="mb-2">Tight spacing</p>
        <Divider className="my-1" />
      </div>
      <div>
        <p className="mb-2">Wide spacing</p>
        <Divider className="my-6" />
      </div>
      <div className="flex items-center gap-4">
        <span>Left</span>
        <Divider orientation="vertical" className="h-8" />
        <span>Right</span>
      </div>
    </div>
  );
}
