<script lang="ts">
  import Button from './Button.svelte';
  import type { SvelteButtonProps } from './button.types';

  const submitButtonProps = {
    label: 'Submit checkout',
    type: 'submit',
    form: 'checkout-form',
  } satisfies SvelteButtonProps;

  const linkWithButtonAttribute = {
    label: 'Checkout link',
    href: '/checkout',
    form: 'checkout-form',
  };

  // @ts-expect-error `form` is only valid for action buttons.
  const typedLinkWithButtonAttribute: SvelteButtonProps = linkWithButtonAttribute;

  void submitButtonProps;
  void linkWithButtonAttribute;
  void typedLinkWithButtonAttribute;
</script>

<Button {...submitButtonProps} />
