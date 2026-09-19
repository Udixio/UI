<script lang="ts">
  import { TextField } from '@udixio/ui-svelte';

  function maskFrenchPhone(raw: string): string {
    const hasPlus = raw.trimStart().startsWith('+');
    let digits = raw.replace(/\D/g, '');
    if (!hasPlus && !digits.startsWith('0')) {
      return digits.slice(0, 10).match(/.{1,2}/g)?.join(' ') ?? '';
    }
    if (!hasPlus) digits = `33${digits.slice(1)}`;
    digits = digits.slice(0, 11);
    const subscriber = digits.slice(2);
    const groups = [
      digits.slice(0, 2),
      subscriber.slice(0, 1),
      ...(subscriber.slice(1).match(/.{1,2}/g) ?? []),
    ].filter(Boolean);
    return `+${groups.join(' ')}`;
  }
</script>

<TextField label="Phone" mask={maskFrenchPhone} />
