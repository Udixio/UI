import { kebabCase, noCase, sentenceCase } from 'change-case';
import { Button } from '@udixio/ui-react';
import { useState } from 'react';

export const ComponentSidebar = ({
  components,
}: {
  components: { slug: string }[];
}) => {
  const [activeComponent, setActiveComponent] = useState<null | string>(null);
  return (
    <nav className="sticky top-0 flex flex-col  p-4 bg-surface-container h-screen overflow-auto">
      {components.map(({ slug }) => (
        <Button
          href={'/components/' + kebabCase(slug)}
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
