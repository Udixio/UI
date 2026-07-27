import { useState } from 'react';
import { Chip } from '@udixio/ui-react';

export default function ChipInputReact() {
  const [tags, setTags] = useState(['React', 'TypeScript', 'Angular']);

  return (
    <div className="flex flex-wrap gap-2">
      {tags.map((tag) => (
        <Chip
          key={tag}
          label={tag}
          onRemove={() =>
            setTags((current) => current.filter((item) => item !== tag))
          }
        />
      ))}
    </div>
  );
}
