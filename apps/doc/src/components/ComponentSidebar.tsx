import { noCase, sentenceCase } from 'change-case';
import { Button } from '@udixio/ui-react';
import { useEffect, useState } from 'react';

export const ComponentSidebar = ({
  components,
  current = null,
}: {
  components: { slug: string }[];
  current : string | null
}) => {
  const [activeComponent, setActiveComponent] = useState<null | string>(current);

  useEffect(() => {
    setActiveComponent(current)
  }, [current]);

  return (
    <nav className="sticky top-0 flex flex-col  p-4 bg-surface-container h-screen overflow-auto">
      {components.map(({ slug }) => (
        <Button
          href={'/components/' + slug}
          className={'justify-start'}
          label={sentenceCase(noCase(slug))}
          onToggle={(value) => {
            if (value) {
              setActiveComponent(slug);
            }
          }}
          activated={slug === activeComponent}
          variant="filled"
        />
      ))}
    </nav>
  );
};
