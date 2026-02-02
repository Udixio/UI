import { noCase, sentenceCase } from 'change-case';
import { Button, SideSheet } from '@udixio/ui-react';
import { useEffect, useState } from 'react';
import type { ComponentSidebarItem } from '../types/component-api';

interface ComponentSidebarProps {
  components: ComponentSidebarItem[];
  current?: string | null;
}

export const ComponentSidebar = ({
  components,
  current = null,
}: ComponentSidebarProps) => {
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
      <nav className="flex flex-col p-2 h-full overflow-y-auto custom-scrollbar">
        {Object.entries(
          components.reduce(
            (acc, component) => {
              const category = component.tags.category || 'Other';
              if (!acc[category]) acc[category] = [];
              acc[category].push(component);
              return acc;
            },
            {} as Record<string, typeof components>,
          ),
        )
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([category, items]) => (
            <div key={category} className="mb-4">
              <div className="px-4 py-2 text-label-small text-outline">
                {category}
              </div>
              <div className="flex flex-col gap-1">
                {items.map(({ slug, displayName }) => (
                  <Button
                    key={slug}
                    size="small"
                    href={`/components/${slug}/overview`}
                    className={'justify-start w-full'}
                    label={displayName || sentenceCase(noCase(slug))}
                    activated={slug === activeComponent}
                    onToggle={(value) => {
                      if (value) {
                        setActiveComponent(slug);
                      }
                    }}
                    variant={'filled'}
                  />
                ))}
              </div>
            </div>
          ))}
      </nav>
    </SideSheet>
  );
};
