<script lang="ts">
  import SplitButton from './SplitButton.svelte';

  let open = $state(false);
  let guardedOpen = $state(true);
  let lastAction = $state('None');

  const actions = [
    { id: 'copy', label: 'Save a copy' },
    { id: 'share', label: 'Share', href: '/share' },
  ];
</script>

<SplitButton
  label="Save"
  menuLabel="More save options"
  {actions}
  bind:open
  onActionSelect={(action) => (lastAction = action.label)}
/>
<output data-testid="bound-open">{open ? 'open' : 'closed'}</output>
<output data-testid="last-action">{lastAction}</output>

<SplitButton
  label="Guarded save"
  menuLabel="More guarded save options"
  {actions}
  bind:open={() => guardedOpen, (_next) => {}}
/>
<output data-testid="guarded-open">{guardedOpen ? 'open' : 'closed'}</output>
