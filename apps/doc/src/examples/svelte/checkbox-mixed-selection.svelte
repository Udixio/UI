<script lang="ts">
  import { Checkbox } from '@udixio/ui-svelte';

  type Channel = 'email' | 'sms';

  let channels = $state<Record<Channel, boolean>>({ email: true, sms: false });
  const values = $derived(Object.values(channels));
  const allChecked = $derived(values.every(Boolean));
  const someChecked = $derived(values.some(Boolean));

  const setAll = (checked: boolean) => {
    channels = { email: checked, sms: checked };
  };

  const setChannel = (channel: Channel, checked: boolean) => {
    channels = { ...channels, [channel]: checked };
  };
</script>

<div class="flex flex-col gap-3">
  <div class="flex items-center gap-3">
    <Checkbox
      id="checkbox-svelte-notifications"
      bind:checked={() => allChecked, setAll}
      indeterminate={someChecked && !allChecked}
    />
    <label for="checkbox-svelte-notifications">Notifications</label>
  </div>
  <div class="ml-6 flex flex-col gap-3">
    <div class="flex items-center gap-3">
      <Checkbox
        id="checkbox-svelte-email"
        bind:checked={() => channels.email, (checked) => setChannel('email', checked)}
      />
      <label for="checkbox-svelte-email">Email</label>
    </div>
    <div class="flex items-center gap-3">
      <Checkbox
        id="checkbox-svelte-sms"
        bind:checked={() => channels.sms, (checked) => setChannel('sms', checked)}
      />
      <label for="checkbox-svelte-sms">SMS</label>
    </div>
  </div>
</div>
