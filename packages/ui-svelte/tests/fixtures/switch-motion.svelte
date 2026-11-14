<script lang="ts">
  import Switch from '../../src/lib/switch/Switch.svelte';
  const state = window as unknown as { changes: boolean[]; events: [string, boolean, boolean][] };
  const key = (event: KeyboardEvent) => state.events.push([event.key, (event.target as HTMLElement).getAttribute("role") === "switch", event.target === event.currentTarget]);
  const record = (value: boolean) => state.changes.push(value);
</script>
<Switch aria-label="Enabled" onCheckedChange={record} onkeydown={key} />
<Switch aria-label="Disabled" disabled onCheckedChange={record} />
