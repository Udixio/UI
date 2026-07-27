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
  const overviewId =
    componentApi.data?.frameworks?.react?.tags?.parent ??
    (componentApi.id === 'chips' ? 'chip' : componentApi.id);

  return (
    <Tabs variant={'secondary'} className={'bg-surface-container'}>
      <Tab href={`/components/${overviewId}/overview`} label={'Overview'} />
      <Tab href={`/components/${componentApi.id}/api`} label={'Api'} />
    </Tabs>
  );
};
