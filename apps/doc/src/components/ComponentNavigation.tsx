import { kebabCase } from 'change-case';
import { Tab, Tabs } from '@udixio/ui-react';

export const ComponentNavigation = ({
  componentApi,
}: {
  componentApi: {
    id: string;
    data?: {
      frameworks?: {
        react?: { tags?: { parent?: string } };
      };
    };
  };
}) => {
  // `@parent` is authored as the component's display name (e.g. `NavigationRail`),
  // not as the route slug docgen derives from it (`navigation-rail`) — normalize
  // it the same way docgen names the generated API file.
  const parent = componentApi.data?.frameworks?.react?.tags?.parent;
  const overviewId = parent
    ? kebabCase(parent)
    : componentApi.id === 'chips'
      ? 'chip'
      : componentApi.id;

  return (
    <Tabs variant={'secondary'} className={'bg-surface-container'}>
      <Tab href={`/components/${overviewId}/overview`} label={'Overview'} />
      <Tab href={`/components/${componentApi.id}/api`} label={'Api'} />
    </Tabs>
  );
};
