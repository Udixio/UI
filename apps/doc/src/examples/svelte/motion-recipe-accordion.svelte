<script lang="ts">
  import '@udixio/motion/presets';
  import { iKeyboardArrowDown } from '@udixio/icons-rounded-400/keyboard_arrow_down';
  import { Icon } from '@udixio/ui-svelte';

  const QUESTIONS = [
    { question: 'Can I return an order?', answer: 'Yes, within 30 days.' },
    { question: 'How long does delivery take?', answer: 'Two to four working days.' },
    { question: 'Do you ship abroad?', answer: 'Across the European Union.' },
  ];

  // connectMotion() runs once in your app (see Getting started): it plays the motion named in data-motion each time
  // `hidden` changes. Every answer stays in the DOM, so it is in the server HTML and a search engine reads it.
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
    <li data-motion="reflow" class="rounded-2xl bg-surface-container">
      <h3>
        <button
          type="button"
          id="{id}-q{index}"
          aria-expanded={open}
          aria-controls="{id}-a{index}"
          onclick={() => toggle(index)}
          class="flex w-full items-center justify-between gap-4 rounded-2xl px-4 py-3 text-left text-title-small text-on-surface focus-visible:outline-2 focus-visible:outline-primary"
        >
          {question}
          <span aria-hidden="true" class={['flex transition-[rotate] duration-200 motion-reduce:transition-none', open && 'rotate-180']}>
            <Icon icon={iKeyboardArrowDown} />
          </span>
        </button>
      </h3>
      <!-- Setting hidden plays the exit, then hides the answer; removing it plays the entry. -->
      <div
        id="{id}-a{index}"
        role="region"
        aria-labelledby="{id}-q{index}"
        data-motion="fade"
        hidden={!open}
        class="px-4 pb-4 text-body-medium text-on-surface-variant"
      >
        {answer}
      </div>
    </li>
  {/each}
</ul>
