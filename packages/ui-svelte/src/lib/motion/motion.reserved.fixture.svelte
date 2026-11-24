<script lang="ts">
  // Steps B and E (review 5, Q3): a component holds the kinds it animates, and a ContextMenu has no box to give.
  import ContextMenu from '../context-menu/ContextMenu.svelte';
  import MenuItem from '../menu/MenuItem.svelte';
  import SideSheet from '../side-sheet/SideSheet.svelte';
  import Snackbar from '../snackbar/Snackbar.svelte';
  import { motion } from './motion.attachment.svelte';
</script>

<Snackbar data-testid="snackbar" message="Saved" {@attach motion('fade press')} />
<SideSheet data-testid="sheet" title="Filters" {@attach motion('fade')}>Body</SideSheet>
<ContextMenu data-testid="context" accessibleLabel="Document actions" {@attach motion('press')}>
  {#snippet trigger()}<button type="button">Document</button>{/snippet}
  <MenuItem label="Rename" />
</ContextMenu>
