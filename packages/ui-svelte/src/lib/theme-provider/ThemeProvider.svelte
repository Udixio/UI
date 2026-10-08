<script lang="ts">
  import {
    createDynamicThemeWorker,
    createDynamicThemeWorkerMessage,
    DynamicThemeRuntime,
    TailwindPlugin,
  } from '@udixio/tailwind';
  import { untrack } from 'svelte';
  import type { SvelteThemeProviderProps } from './theme-provider.types';

  let {
    config,
    throttleDelay = 100,
    onLoad,
    loadTheme = false,
    initialCss,
    children,
  }: SvelteThemeProviderProps = $props();

  let outputCss = $state<string | null>(untrack(() => initialCss ?? null));
  let runtime: DynamicThemeRuntime | null = null;

  $effect(() => {
    const initial = untrack(() => ({ config, throttleDelay, loadTheme, onLoad }));
    const controller = new DynamicThemeRuntime({
      config: initial.config,
      throttleDelay: initial.throttleDelay,
      loadTheme: initial.loadTheme,
      createWorker: createDynamicThemeWorker,
      createWorkerMessage: createDynamicThemeWorkerMessage,
      getCss: (api) =>
        api.plugins.getPlugin(TailwindPlugin).getInstance().outputCss,
      onCss: (css) => (outputCss = css),
      onLoad: initial.onLoad,
    });

    runtime = controller;
    controller.start();

    return () => {
      controller.destroy();
      if (runtime === controller) runtime = null;
    };
  });

  $effect(() => {
    runtime?.update(config, throttleDelay);
  });

  $effect(() => {
    runtime?.setOnLoad(onLoad);
  });
</script>

<svelte:head>
  {@html outputCss ? '<style>' + outputCss + '</style>' : ''}
</svelte:head>

{@render children?.()}
