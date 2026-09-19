<script lang="ts">
  import { dividerStyle, mergeClassNames, type DividerInterface } from '@udixio/core';
  import { createStyle } from '../utils/create-style.svelte';
  import type { SvelteDividerProps } from './divider.types';

  let {
    orientation = 'horizontal',
    class: hostClass = '',
    classes,
    ...rest
  }: SvelteDividerProps = $props();

  const styles = createStyle(dividerStyle, () => ({
    orientation,
    className: mergeClassNames<DividerInterface>('divider', classes, hostClass),
  }));
</script>

<hr
  class={styles.current['divider']}
  aria-orientation={orientation === 'vertical' ? 'vertical' : undefined}
  {...rest}
/>
