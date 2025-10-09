import { Tab, Tabs } from '@udixio/ui-react';

export const ComponentNavigation = ({
  componentApi,
}: {
  componentApi: { id: string };
}) => {
  return (
    <Tabs variant={'secondary'} className={'bg-surface-container'}>
      <Tab
        href={`/components/${componentApi.id}/overview`}
        label={'Overview'}
      />
      <Tab href={`/components/${componentApi.id}/api`} label={'Api'} />
    </Tabs>
  );
};
