import { useState } from 'react';
import { IconButton } from '@udixio/ui-react';
import { iAdd } from '@udixio/icons-rounded-400/add';
import { iStar } from '@udixio/icons-rounded-400/star';
import { iStarFilled } from '@udixio/icons-rounded-400/filled/star';

export default function IconButtonStatesReact() {
  const [pressed, setPressed] = useState(false);

  return (
    <div className="flex flex-wrap items-center gap-3">
      <IconButton label="Add item" icon={iAdd} />
      <IconButton
        label="Favorite"
        icon={iStar}
        pressedIcon={iStarFilled}
        variant="tonal"
        toggleable
        pressed={pressed}
        onPressedChange={setPressed}
      />
      <IconButton label="Disabled action" icon={iAdd} disabled />
    </div>
  );
}
