import { noCase, sentenceCase } from 'change-case';
import { Button, SideSheet } from '@udixio/ui-react';
import { useEffect, useState } from 'react';

export const ComponentSidebar = ({
  components,
  current = null,
}: {
  components: { slug: string }[];
  current: string | null;
}) => {
  const [activeComponent, setActiveComponent] = useState<null | string>(
    current,
  );

  useEffect(() => {
    setActiveComponent(current);
  }, [current]);

  return (
    <SideSheet
      position={'left'}
      className={'bg-surface-container'}
      title={'Components'}
    >
      <nav className="flex flex-col  p-4">
        {components.map(({ slug }) => (
          <Button
            size="small"
            href={`/components/${slug}/overview`}
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
    </SideSheet>
  );
};
