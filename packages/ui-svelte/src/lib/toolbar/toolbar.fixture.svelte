<script lang="ts">
  import { iAdd } from '@udixio/icons-rounded-400/add';
  import IconButton from '../icon-button/IconButton.svelte';
  import Toolbar from './Toolbar.svelte';
  import type { SvelteToolbarProps } from './toolbar.types';

  let { ...toolbar }: Omit<SvelteToolbarProps, 'children'> = $props();
</script>

<Toolbar {...toolbar}>
  <IconButton label="Add" icon={iAdd} tooltip={false} />
</Toolbar>
