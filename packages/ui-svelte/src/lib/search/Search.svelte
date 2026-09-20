<script module lang="ts">
  let nextSearchId = 0;
</script>

<script lang="ts">
  import {
    classNames,
    getSearchExpansionTransition,
    getSearchKeyboardTransition,
    mergeClassNames,
    searchStyle,
    type SearchInterface,
  } from '@udixio/core';
  import {
    createMenuController,
    createSearchOutsideDismissController,
    createSearchResultsTransitionController,
    type MenuController,
    type SearchResultsTransitionController,
  } from '@udixio/core/dom';
  import { iClose } from '@udixio/icons-rounded-400/close';
  import { iSearch } from '@udixio/icons-rounded-400/search';
  import Icon from '../icon/Icon.svelte';
  import StateLayer from '../state-layer/StateLayer.svelte';
  import { createControllableState } from '../utils/create-controllable-state.svelte';
  import { createStyle } from '../utils/create-style.svelte';
  import type { SvelteSearchProps } from './search.types';
  import type { HTMLInputAttributes } from 'svelte/elements';

  let {
    label,
    children,
    query = $bindable(),
    defaultQuery = '',
    expanded = $bindable(),
    defaultExpanded = false,
    onQueryChange,
    onExpandedChange,
    onSearch,
    placeholder = 'Search',
    leadingIcon,
    trailingActions,
    disabled = false,
    clearable = true,
    name,
    id,
    autoComplete = 'off',
    autoFocus = false,
    inputMode,
    maxLength,
    minLength,
    required = false,
    readOnly = false,
    spellCheck = true,
    resultsRole = 'listbox',
    resultsLabel = 'Search suggestions',
    clearLabel = 'Clear search',
    onFocus,
    onBlur,
    class: hostClass = '',
    style: hostStyle,
    classes,
    onclick,
    onkeydown,
    ...rest
  }: SvelteSearchProps = $props();

  const fallbackId = `search-${nextSearchId++}`;
  const inputId = $derived(id ?? fallbackId);
  const resultsId = $derived(`${inputId}-results`);
  const hasResults = $derived(children !== undefined);
  const resolvedLeadingIcon = $derived(leadingIcon ?? iSearch);

  const queryState = createControllableState({
    value: () => query,
    defaultValue: () => defaultQuery,
    onChange: (next) => onQueryChange?.(next),
    assign: (next) => (query = next),
    componentName: 'Search',
    stateName: 'query',
  });
  const expandedState = createControllableState({
    value: () => expanded,
    defaultValue: () => defaultExpanded,
    onChange: (next) => onExpandedChange?.(next),
    assign: (next) => (expanded = next),
    componentName: 'Search',
    stateName: 'expanded',
  });
  const resolvedQuery = $derived(queryState.current);
  const isExpanded = $derived(expandedState.current);
  let isFocused = $state(false);
  let root: HTMLDivElement | undefined = $state();
  let input: HTMLInputElement | undefined = $state();
  let results: HTMLDivElement | undefined = $state();
  let menuController: MenuController | undefined;
  let transitionController: SearchResultsTransitionController | undefined;
  let dismissController: ReturnType<typeof createSearchOutsideDismissController> | undefined;
  let pendingFocus = $state<'first' | 'last' | null>(null);
  let suppressExpandOnFocus = $state(false);

  const hasQuery = $derived(resolvedQuery.length > 0);
  const styles = createStyle(searchStyle, () => ({
    label,
    query,
    defaultQuery,
    onQueryChange,
    expanded,
    defaultExpanded,
    onExpandedChange,
    onSearch,
    placeholder,
    leadingIcon,
    disabled,
    clearable,
    name,
    id,
    autoComplete,
    autoFocus,
    inputMode,
    maxLength,
    minLength,
    required,
    readOnly,
    spellCheck,
    resultsRole,
    resultsLabel,
    clearLabel,
    onFocus,
    onBlur,
    isFocused,
    isExpanded,
    hasQuery,
    hasResults,
    className: mergeClassNames<SearchInterface>('search', classes, hostClass),
  }));

  const requestExpansion = (next: boolean) => {
    const transition = getSearchExpansionTransition({ disabled, isExpanded, nextExpanded: next });
    if (!transition.blocked) expandedState.set(transition.nextExpanded);
  };

  const closeAndRestoreFocus = () => {
    requestExpansion(false);
    suppressExpandOnFocus = true;
    queueMicrotask(() => input?.focus());
  };

  const handleInputKeydown = (event: KeyboardEvent) => {
    const transition = getSearchKeyboardTransition({ disabled, isExpanded, hasResults, key: event.key });
    if (transition.blocked) {
      event.preventDefault();
      event.stopPropagation();
      onkeydown?.(event);
      return;
    }
    if (transition.nextExpanded !== undefined) {
      event.preventDefault();
      pendingFocus = transition.focus ?? null;
      requestExpansion(transition.nextExpanded);
    } else if (transition.focus && menuController) {
      event.preventDefault();
      transition.focus === 'first' ? menuController.focusFirst() : menuController.focusLast();
    } else if (event.key === 'Enter') {
      event.preventDefault();
      onSearch?.(resolvedQuery);
    }
    onkeydown?.(event);
  };

  const handleFocus = () => {
    if (disabled) return;
    isFocused = true;
    onFocus?.();
    if (suppressExpandOnFocus) {
      suppressExpandOnFocus = false;
      return;
    }
    requestExpansion(true);
  };

  const handleInputFieldClick = (event: MouseEvent) => {
    if (disabled) return;
    const target = event.target;
    if (target instanceof Element && target.closest('button, input, a')) return;
    input?.focus();
  };

  const handleClear = () => {
    if (disabled) return;
    queryState.set('');
    input?.focus();
  };

  $effect(() => {
    if (!results || !hasResults) return;
    const current = isExpanded;
    const controller = createSearchResultsTransitionController({ element: results, open: current });
    transitionController = controller;
    return () => {
      controller.destroy();
      if (transitionController === controller) transitionController = undefined;
    };
  });

  $effect(() => {
    if (!results || !hasResults || !isExpanded || resultsRole !== 'listbox') {
      menuController?.destroy();
      menuController = undefined;
      return;
    }
    const controller = createMenuController(results, { onEscape: closeAndRestoreFocus });
    menuController = controller;
    const focus = pendingFocus;
    pendingFocus = null;
    if (focus) queueMicrotask(() => focus === 'first' ? controller.focusFirst() : controller.focusLast());
    return () => {
      controller.destroy();
      if (menuController === controller) menuController = undefined;
    };
  });

  $effect(() => {
    transitionController?.setOpen(isExpanded);
  });

  $effect(() => {
    if (!root || !hasResults || !isExpanded) {
      dismissController?.destroy();
      dismissController = undefined;
      return;
    }
    const controller = createSearchOutsideDismissController({ root, onDismiss: () => requestExpansion(false) });
    dismissController = controller;
    return () => {
      controller.destroy();
      if (dismissController === controller) dismissController = undefined;
    };
  });

  $effect(() => {
    if (!autoFocus || !input || disabled) return;
    queueMicrotask(() => { if (!disabled) input?.focus(); });
  });

  $effect(() => () => {
    menuController?.destroy();
    transitionController?.destroy();
    dismissController?.destroy();
  });
</script>

<div
  {...rest}
  bind:this={root}
  class={styles.current['search']}
  style={hostStyle}
  aria-label={label}
  role="search"
  onclick={onclick}
  onkeydown={(event) => { if (resultsRole === 'dialog' && event.key === 'Escape' && isExpanded && event.target !== input) { event.preventDefault(); event.stopPropagation(); closeAndRestoreFocus(); } }}
>
  <div class={styles.current['container']}>
    <div class={styles.current['inputField']} role="presentation" onclick={handleInputFieldClick}>
      <StateLayer class={styles.current['stateLayer']} colorName="on-surface" stateClassName="state-ripple-group-[search-input]" />
      <span class={styles.current['leadingIcon']} aria-hidden="true"><Icon icon={resolvedLeadingIcon} class="size-6" /></span>
      <input
        bind:this={input}
        id={inputId}
        class={classNames(styles.current['input'])}
        type="search"
        role={hasResults ? 'combobox' : 'searchbox'}
        aria-label={label}
        aria-autocomplete={hasResults ? 'list' : undefined}
        aria-controls={hasResults ? resultsId : undefined}
        aria-expanded={hasResults ? isExpanded : undefined}
        aria-haspopup={hasResults && resultsRole === 'dialog' ? 'dialog' : undefined}
        name={name}
        value={resolvedQuery}
        placeholder={placeholder}
        autocomplete={autoComplete as HTMLInputAttributes['autocomplete']}
        inputmode={inputMode}
        maxlength={maxLength}
        minlength={minLength}
        required={required}
        readonly={readOnly}
        spellcheck={spellCheck}
        disabled={disabled}
        oninput={(event) => { if (!disabled) queryState.set((event.currentTarget as HTMLInputElement).value); }}
        onfocus={handleFocus}
        onblur={() => { isFocused = false; onBlur?.(); }}
        onkeydown={handleInputKeydown}
      />
      {#if (clearable && hasQuery) || trailingActions}
        <div class={styles.current['trailingActions']}>
          {#if clearable && hasQuery}
            <button type="button" class={styles.current['clearButton']} aria-label={clearLabel} disabled={disabled} onclick={handleClear}>
              <StateLayer class={styles.current['stateLayer']} colorName="on-surface" stateClassName="state-ripple-group-[search-clear]" />
              <Icon icon={iClose} class="size-6" />
            </button>
          {/if}
          {#if trailingActions}{@render trailingActions()}{/if}
        </div>
      {/if}
    </div>
    {#if hasResults}
      <div
        bind:this={results}
        id={resultsId}
        class={styles.current['results']}
        role={resultsRole}
        aria-label={resultsLabel}
        aria-hidden={!isExpanded}
        inert={!isExpanded}
        style="height: 0; opacity: 0"
      >
        {@render children?.()}
      </div>
    {/if}
  </div>
</div>
