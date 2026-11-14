<script lang="ts">
  import ProgressIndicator from '../../src/lib/progress-indicator/ProgressIndicator.svelte';
</script>

<span id="progress-name">Loading</span>
<ProgressIndicator variant="linear-indeterminate" value={100} aria-labelledby="progress-name" aria-valuenow={100} />
<ProgressIndicator variant="circular-indeterminate" value={100} aria-label="Loading circle" aria-valuenow={100} />
