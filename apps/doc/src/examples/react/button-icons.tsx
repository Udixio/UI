import { iAdd } from '@udixio/icons-rounded-400/add';
import { Button } from '@udixio/ui-react';

export default function ButtonIconsReact() {
  return (
    <div className="flex flex-wrap justify-center gap-3">
      <Button label="Add" icon={iAdd} />
      <Button label="Next" icon={iAdd} iconPosition="end" />
    </div>
  );
}
