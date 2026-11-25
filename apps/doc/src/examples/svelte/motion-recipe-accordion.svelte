<script lang="ts">
  import '@udixio/motion/presets';
  import { iKeyboardArrowDown } from '@udixio/icons-rounded-400/keyboard_arrow_down';
  import { Button, motion } from '@udixio/ui-svelte';

  const QUESTIONS = [
    { question: 'Can I return an order?', answer: 'Yes, within 30 days.' },
    { question: 'How long does delivery take?', answer: 'Two to four working days.' },
    { question: 'Do you ship abroad?', answer: 'Across the European Union.' },
  ];

  // The question is a full-width text button; its chevron turns while the answer is open.
  const TRIGGER = 'w-full justify-between gap-4 rounded-2xl px-4 py-3 text-left text-title-small text-on-surface';
  const CHEVRON = 'transition-[rotate] duration-200 motion-reduce:transition-none';

  // One answer open at a time: opening one closes the other.
  let expanded = $state<number | null>(null);
  const id = $props.id();

  function toggle(index: number) {
    expanded = expanded === index ? null : index;
  }
</script>

<!-- reflow on each item: the items below glide to their new place as an answer opens or closes. -->
<ul class="flex min-h-70 w-full max-w-96 flex-col gap-2 max-sm:min-h-80">
  {#each QUESTIONS as { question, answer }, index (question)}
    {@const open = expanded === index}
    <li {@attach motion('reflow')} class="rounded-2xl bg-surface-container">
      <h3>
        <Button
          id="{id}-q{index}"
          variant="text"
          size="small"
          label={question}
          icon={iKeyboardArrowDown}
          iconPosition="end"
          aria-expanded={open}
          aria-controls="{id}-a{index}"
          onclick={() => toggle(index)}
          classes={{ button: TRIGGER, icon: open ? `${CHEVRON} rotate-180` : CHEVRON }}
        />
      </h3>
      <!-- Every answer stays in the DOM, so the server HTML holds it. `present` plays the entry and the exit; the server
        runs no attachment, so the answer also carries hidden. -->
      <div
        id="{id}-a{index}"
        role="region"
        aria-labelledby="{id}-q{index}"
        hidden={!open}
        {@attach motion('fade', () => ({ present: open }))}
        class="px-4 pb-4 text-body-medium text-on-surface-variant"
      >
        {answer}
      </div>
    </li>
  {/each}
</ul>
