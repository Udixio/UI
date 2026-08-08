import { useState } from 'react';
import { IconButton } from '@udixio/ui-react';
import { iStar } from '@udixio/icons-rounded-400/star';
import { iStarFilled } from '@udixio/icons-rounded-400/filled/star';

export default function IconButtonToggleReact() {
  const [pressed, setPressed] = useState(false);

  return (
    <div className="flex flex-wrap items-center gap-3">
      <IconButton
        label="Favorite (uncontrolled)"
        icon={iStar}
        pressedIcon={iStarFilled}
        variant="tonal"
        toggleable
        defaultPressed
      />
      <IconButton
        label="Favorite (controlled)"
        icon={iStar}
        pressedIcon={iStarFilled}
        variant="tonal"
        toggleable
        pressed={pressed}
        onPressedChange={setPressed}
      />
    </div>
  );
}
