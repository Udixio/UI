import { sentenceCase } from 'change-case';
import { Button } from '@udixio/ui-react';

export const ComponentSidebar = ({
  components,
}: {
  components: { slug: string }[];
}) => {
  return (
    <nav className="flex flex-col  p-4 bg-surface-container">
      {components.map(({ slug }) => (
        <Button
          label={sentenceCase(slug)}
          onToggle={() => console.log('click')}
          variant="elevated"
        />
      ))}
      {/*href={'/components/' + kebabCase(id)}*/}
    </nav>
  );
};
