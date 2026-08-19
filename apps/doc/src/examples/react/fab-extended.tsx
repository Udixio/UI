import { useState } from 'react';
import { Button, Fab } from '@udixio/ui-react';
import { iEdit } from '@udixio/icons-rounded-400/edit';

export default function FabExtendedReact() {
  const [extended, setExtended] = useState(true);

  return (
    <div className="flex flex-col items-end gap-6">
      <Button
        label={extended ? 'Collapse the fab' : 'Extend the fab'}
        variant="outlined"
        onClick={() => setExtended((current) => !current)}
      />
      <Fab label="Compose" icon={iEdit} extended={extended} />
    </div>
  );
}
