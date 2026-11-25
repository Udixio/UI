import { useState } from 'react';
import { Button, Motion } from '@udixio/ui-react';
import '@udixio/motion/presets';

export function MotionEmphasisReact() {
  const [likes, setLikes] = useState(0);

  return (
    <div className="flex flex-col items-start gap-4">
      {/* The like button presses on each click: each new value of state replays the press. */}
      <Motion
        as={Button}
        name="press"
        state={likes}
        size="small"
        label="Like"
        onClick={() => setLikes((count) => count + 1)}
      />
      <p className="text-body-medium text-on-surface-variant">Likes: {likes}</p>
    </div>
  );
}
