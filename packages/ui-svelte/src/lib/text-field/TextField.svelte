<script module lang="ts">
  let nextTextFieldId = 0;
</script>

<script lang="ts">
  import {
    addDays,
    addMonthsClamped,
    datePickerStyle,
    formatMonthLabel,
    formatTextFieldIsoDate,
    getCalendarWeeks,
    getDaySelectionState,
    getYearRange,
    getStartOfWeek,
    getWeekDayLabels,
    classNames,
    mergeClassNames,
    parseTextFieldIsoDate,
    resolveTextFieldFloating,
    resolveTextFieldTrailingIcon,
    sanitizeTextFieldDateInput,
    textFieldStyle,
    type Icon as IconType,
    type TextFieldInterface,
  } from '@udixio/core';
  import {
    createTextFieldLabelController,
    createMonthTransitionController,
    createTextareaAutosizeController,
    type MonthTransitionController,
    type TextFieldLabelController,
    type TextareaAutosizeController,
  } from '@udixio/core/dom';
  import { iCalendarToday } from '@udixio/icons-rounded-400/calendar_today';
  import { iCheck } from '@udixio/icons-rounded-400/check';
  import { iChevronLeft } from '@udixio/icons-rounded-400/chevron_left';
  import { iChevronRight } from '@udixio/icons-rounded-400/chevron_right';
  import { iError } from '@udixio/icons-rounded-400/error';
  import { iKeyboardArrowDown } from '@udixio/icons-rounded-400/keyboard_arrow_down';
  import { iKeyboardArrowUp } from '@udixio/icons-rounded-400/keyboard_arrow_up';
  import AnchorPositioner from '../anchor-positioner/AnchorPositioner.svelte';
  import Button from '../button/Button.svelte';
  import Icon from '../icon/Icon.svelte';
  import { createControllableState } from '../utils/create-controllable-state.svelte';
  import { createStyle } from '../utils/create-style.svelte';
  import type { SvelteTextFieldProps } from './text-field.types';

  let {
    label,
    variant = 'filled',
    type = 'text',
    multiline = false,
    value = $bindable(),
    defaultValue,
    disabled = false,
    name,
    id,
    placeholder,
    autoComplete = 'on',
    autoFocus = false,
    leadingIcon,
    trailingIcon,
    suffix,
    supportingText,
    errorText,
    showSupportingText,
    options = [],
    mask,
    onChange,
    onFocus,
    onBlur,
    onfocus,
    onblur,
    min,
    max,
    step,
    class: hostClass = '',
    style: hostStyle,
    classes,
    ...rest
  }: SvelteTextFieldProps = $props();

  const fallbackId = `text-field-${nextTextFieldId++}`;
  const resolvedId = $derived(id ?? fallbackId);
  const helperTextId = $derived(`${resolvedId}-helper`);

  const valueState = createControllableState({
    value: () => value,
    defaultValue: () => defaultValue ?? '',
    onChange: (next) => onChange?.(next),
    assign: (next) => (value = next),
    componentName: 'TextField',
    stateName: 'value',
  });
  const resolvedValue = $derived(valueState.current);

  let fieldRoot: HTMLDivElement | undefined = $state();
  let legend: HTMLLegendElement | undefined = $state();
  let control: HTMLInputElement | HTMLTextAreaElement | undefined = $state();
  let datePickerPopup: HTMLDivElement | undefined = $state();
  let menuPopup: HTMLDivElement | undefined = $state();
  let dateGrid: HTMLDivElement | undefined = $state();

  let isFocused = $state(false);
  let showDatePicker = $state(false);
  let showMenu = $state(false);
  let tempDate = $state<Date | null>(null);
  let viewDate = $state(new Date());
  let focusedDate = $state(new Date());
  let viewMode = $state<'day' | 'year'>('day');
  let yearsContainer: HTMLDivElement | undefined = $state();
  let weeksContainer: HTMLDivElement | undefined = $state();
  let monthTransitionController: MonthTransitionController | undefined = $state.raw();
  let previousViewDate: Date | undefined;
  let shouldFocusDate = false;

  const valueForDate = (nextValue: string) => parseTextFieldIsoDate(nextValue);

  const hasError = $derived(!!errorText?.length);
  const showErrorIcon = $derived(!isFocused && hasError);
  const hasSupportingText = $derived(
    showSupportingText ?? (hasError || !!supportingText?.length),
  );
  const supportingMessage = $derived(
    errorText?.length ? errorText : supportingText?.length ? supportingText : '\u00a0',
  );
  const isDateInput = $derived(type === 'date');
  const isSelectInput = $derived(type === 'select');
  const displayValue = $derived.by(() => {
    if (!isSelectInput) return resolvedValue;
    const selected = options.find(
      (option) => String(option.value) === String(resolvedValue),
    );
    return selected?.label ?? resolvedValue;
  });
  const effectiveMask = $derived(
    mask ?? (isDateInput ? sanitizeTextFieldDateInput : undefined),
  );
  const effectiveTrailingIcon = $derived(
    resolveTextFieldTrailingIcon<IconType>({
      type,
      trailingIcon,
      isMenuOpen: showMenu,
      dateIcon: iCalendarToday,
      menuOpenIcon: iKeyboardArrowUp,
      menuClosedIcon: iKeyboardArrowDown,
    }),
  );
  const isFloating = $derived(
    resolveTextFieldFloating({
      isFocused,
      hasValue: displayValue.length > 0,
      type,
      isMenuOpen: showMenu,
    }),
  );
  const inputSpecialClass = $derived(
    isSelectInput ? 'cursor-pointer selection:bg-transparent' : '',
  );

  const styles = createStyle(textFieldStyle, () => ({
    label,
    variant,
    type,
    multiline,
    value,
    defaultValue,
    onChange,
    disabled,
    name,
    id: resolvedId,
    placeholder,
    autoComplete,
    autoFocus,
    onFocus,
    onBlur,
    leadingIcon,
    trailingIcon,
    suffix,
    supportingText,
    errorText,
    showSupportingText,
    options,
    mask,
    showErrorIcon,
    isFocused,
    isFloating,
    hasSupportingText,
    className: mergeClassNames<TextFieldInterface>('textField', classes, hostClass),
  }));

  const dateStyles = createStyle(
    datePickerStyle,
    () =>
      ({
        mode: 'single',
        value: tempDate,
        defaultValue: null,
        onChange: undefined,
        minDate: undefined,
        maxDate: undefined,
        shouldDisableDate: undefined,
        locale: 'default',
        weekStartDay: 0,
        hasSelected: tempDate !== null,
        className: 'datePicker',
      }) as Parameters<typeof datePickerStyle>[0],
  );

  let labelController: TextFieldLabelController | undefined;
  let isFirstLabelUpdate = true;
  $effect(() => {
    const root = legend;
    if (!root) return;
    const created = createTextFieldLabelController({ root });
    labelController = created;
    isFirstLabelUpdate = true;
    return () => {
      created.destroy();
      if (labelController === created) labelController = undefined;
    };
  });

  $effect(() => {
    void isFloating;
    void variant;
    if (isFirstLabelUpdate) {
      isFirstLabelUpdate = false;
      return;
    }
    labelController?.update();
  });

  let autosizeController: TextareaAutosizeController | undefined;
  $effect(() => {
    if (!multiline || !control || !(control instanceof HTMLTextAreaElement)) return;
    const created = createTextareaAutosizeController({ textarea: control });
    autosizeController = created;
    return () => {
      created.destroy();
      if (autosizeController === created) autosizeController = undefined;
    };
  });

  $effect(() => {
    void displayValue;
    autosizeController?.update();
  });

  $effect(() => {
    const shouldFocus = autoFocus && !disabled && !isSelectInput;
    if (!shouldFocus || !control) return;
    const frame = window.requestAnimationFrame(() => {
      if (control && !disabled && !isFocused) {
        control.focus({ preventScroll: true });
      }
    });
    return () => window.cancelAnimationFrame(frame);
  });

  $effect(() => {
    if (!shouldFocusDate || !dateGrid) return;
    shouldFocusDate = false;
    const wanted = focusedDate.toDateString();
    const frame = window.requestAnimationFrame(() => {
      const day = Array.from(dateGrid?.querySelectorAll<HTMLButtonElement>('[data-date]') ?? [])
        .find((candidate) => candidate.dataset.date === wanted);
      day?.focus();
    });
    return () => window.cancelAnimationFrame(frame);
  });

  $effect(() => {
    const root = weeksContainer;
    if (!root) return;

    const created = createMonthTransitionController({ container: root });
    monthTransitionController = created;
    return () => {
      created.destroy();
      if (monthTransitionController === created) monthTransitionController = undefined;
    };
  });

  $effect(() => {
    const current = viewDate;
    const previous = previousViewDate;
    previousViewDate = current;
    const direction =
      previous === undefined || current.getTime() === previous.getTime()
        ? 0
        : current > previous
          ? 1
          : -1;
    monthTransitionController?.play(direction);
  });

  $effect(() => {
    if (viewMode !== 'year' || !yearsContainer) return;
    const frame = window.requestAnimationFrame(() => {
      yearsContainer
        ?.querySelector<HTMLElement>('[data-selected="true"]')
        ?.scrollIntoView({ block: 'center' });
    });
    return () => window.cancelAnimationFrame(frame);
  });

  $effect(() => {
    if (!showDatePicker) return;
    const isInside = (target: Node | null) =>
      !!target && (!!fieldRoot?.contains(target) || !!datePickerPopup?.contains(target));
    const handlePointerDown = (event: PointerEvent) => {
      if (!datePickerPopup?.contains(event.target as Node) && !fieldRoot?.contains(event.target as Node)) {
        closeDatePicker();
      }
    };
    const handleFocusIn = (event: FocusEvent) => {
      if (!isInside(event.target as Node)) closeDatePicker();
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeDatePicker();
    };
    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('focusin', handleFocusIn);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('focusin', handleFocusIn);
      document.removeEventListener('keydown', handleKeyDown);
    };
  });

  $effect(() => {
    if (!showMenu) return;
    const handleOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (fieldRoot?.contains(target) || menuPopup?.contains(target)) return;
      closeMenu();
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  });

  const setFieldFocused = (next: boolean) => {
    if (isFocused === next) return;
    isFocused = next;
    if (next) {
      onFocus?.();
    } else {
      onBlur?.();
    }
  };

  const handleInput = (event: Event) => {
    const target = event.currentTarget as HTMLInputElement | HTMLTextAreaElement;
    if (disabled) {
      target.value = displayValue;
      return;
    }
    const next = effectiveMask ? effectiveMask(target.value) : target.value;
    valueState.set(next);
    if (value === undefined) {
      target.value = next;
      return;
    }
    const selected = isSelectInput
      ? options.find((option) => String(option.value) === String(value))
      : undefined;
    target.value = selected?.label ?? value;
  };

  const handleControlFocus = (event: FocusEvent) => {
    if (!isSelectInput) setFieldFocused(true);
    onfocus?.(event);
  };

  const handleControlBlur = (event: FocusEvent) => {
    if (!isSelectInput) setFieldFocused(false);
    onblur?.(event);
  };

  const handleFieldClick = () => {
    if (disabled) return;
    if (isSelectInput) {
      if (showMenu) closeMenu();
      else openMenu();
      return;
    }
    if (control && !isFocused) control.focus({ preventScroll: true });
  };

  const openDatePicker = () => {
    if (disabled) return;
    const parsed = valueForDate(resolvedValue);
    const anchor = parsed ?? new Date();
    tempDate = parsed;
    focusedDate = parsed ?? anchor;
    viewDate = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
    showMenu = false;
    showDatePicker = true;
    setFieldFocused(true);
  };

  const closeDatePicker = () => {
    if (!showDatePicker) return;
    showDatePicker = false;
    setFieldFocused(false);
  };

  const handleDateConfirm = () => {
    valueState.set(formatTextFieldIsoDate(tempDate));
    closeDatePicker();
  };

  const handleDateDayClick = (date: Date) => {
    tempDate = date;
    focusedDate = date;
  };

  const handleYearSelect = (year: number) => {
    const nextViewDate = new Date(year, viewDate.getMonth(), 1);
    viewDate = nextViewDate;
    focusedDate = nextViewDate;
    shouldFocusDate = true;
    viewMode = 'day';
  };

  const handleDateDayKeyDown = (event: KeyboardEvent, date: Date) => {
    let next: Date | undefined;
    if (event.key === 'ArrowLeft') next = addDays(date, -1);
    else if (event.key === 'ArrowRight') next = addDays(date, 1);
    else if (event.key === 'ArrowUp') next = addDays(date, -7);
    else if (event.key === 'ArrowDown') next = addDays(date, 7);
    else if (event.key === 'Home') next = getStartOfWeek(date, 0);
    else if (event.key === 'End') next = addDays(getStartOfWeek(date, 0), 6);
    else if (event.key === 'PageUp') next = addMonthsClamped(date, event.shiftKey ? -12 : -1);
    else if (event.key === 'PageDown') next = addMonthsClamped(date, event.shiftKey ? 12 : 1);
    if (!next) return;
    event.preventDefault();
    focusedDate = next;
    if (next.getMonth() !== viewDate.getMonth() || next.getFullYear() !== viewDate.getFullYear()) {
      viewDate = new Date(next.getFullYear(), next.getMonth(), 1);
    }
    shouldFocusDate = true;
  };

  const openMenu = () => {
    if (disabled) return;
    showDatePicker = false;
    showMenu = true;
    setFieldFocused(true);
  };

  const closeMenu = () => {
    if (!showMenu) return;
    showMenu = false;
    setFieldFocused(false);
  };

  const handleSelectOption = (optionValue: string | number, optionDisabled = false) => {
    if (optionDisabled) return;
    valueState.set(String(optionValue));
    closeMenu();
  };

  const handleTrailingClick = (event: MouseEvent) => {
    event.stopPropagation();
    if (isDateInput) {
      if (showDatePicker) closeDatePicker();
      else openDatePicker();
    } else if (isSelectInput) {
      if (showMenu) closeMenu();
      else openMenu();
    }
  };

  const dateWeeks = $derived(getCalendarWeeks(viewDate, 0));
  const dateWeekDayLabels = $derived(getWeekDayLabels('default', 0));
  const dateMonthLabel = $derived(formatMonthLabel(viewDate, 'default'));
  const dateYears = $derived(getYearRange(new Date().getFullYear()));

  const isToday = (date: Date) => {
    const today = new Date();
    return (
      today.getFullYear() === date.getFullYear() &&
      today.getMonth() === date.getMonth() &&
      today.getDate() === date.getDate()
    );
  };

  const dateDayClass = (date: Date) => {
    const selected = getDaySelectionState('single', tempDate, date).isSelected;
    const today = isToday(date);
    return classNames(dateStyles.current['dayButton'], 'p-0', {
      'bg-primary text-on-primary': selected,
      'border border-primary': today && !selected,
      'text-on-surface': !selected && !today,
    });
  };
</script>

<div bind:this={fieldRoot} {...rest} class={styles.current['textField']} style={hostStyle}>
  <fieldset role="presentation" class={styles.current['content']} onclick={handleFieldClick}>
    <div class={styles.current['stateLayer']}></div>

    {#if leadingIcon}
      <div class={styles.current['leadingIcon']}>
        <Icon icon={leadingIcon} class="w-5 h-5" />
      </div>
    {/if}

    <legend bind:this={legend} aria-hidden="true" class={styles.current['legend']}>
      <span class="inline-flex -translate-y-1/2 opacity-0">{label}</span>
    </legend>

    <div class="flex-1 relative">
      <label for={resolvedId} class={styles.current['label']}>{label}</label>

      {#if multiline}
        <textarea
          bind:this={control}
          id={resolvedId}
          name={name}
          value={displayValue}
          class={classNames(styles.current['input'], inputSpecialClass)}
          placeholder={isFocused ? (placeholder ?? '') : ''}
          disabled={disabled}
          autocomplete={autoComplete as never}
          aria-invalid={hasError || undefined}
          aria-describedby={hasSupportingText ? helperTextId : undefined}
          oninput={handleInput}
          onfocus={handleControlFocus}
          onblur={handleControlBlur}
        ></textarea>
      {:else}
        <input
          {...rest}
          bind:this={control}
          id={resolvedId}
          name={name}
          type={isSelectInput || isDateInput ? 'text' : type}
          readonly={isSelectInput}
          value={displayValue}
          class={classNames(styles.current['input'], inputSpecialClass)}
          placeholder={isFocused ? (placeholder ?? (isDateInput ? 'YYYY-MM-DD' : '')) : ''}
          disabled={disabled}
          autocomplete={autoComplete as never}
          inputmode={isDateInput ? 'numeric' : undefined}
          maxlength={isDateInput ? 10 : undefined}
          min={min}
          max={max}
          step={step}
          aria-invalid={hasError || undefined}
          aria-describedby={hasSupportingText ? helperTextId : undefined}
          oninput={handleInput}
          onfocus={handleControlFocus}
          onblur={handleControlBlur}
        />
      {/if}
    </div>

    <div class={styles.current['activeIndicator']}></div>

    {#if !showErrorIcon}
      {#if effectiveTrailingIcon}
        {#if isDateInput || isSelectInput}
          <button
            type="button"
            disabled={disabled}
            aria-label={isDateInput ? 'Choose date' : 'Show options'}
            aria-expanded={isDateInput ? showDatePicker : showMenu}
            class={classNames(styles.current['trailingIcon'], 'cursor-pointer')}
            onclick={handleTrailingClick}
          >
            <span class="flex items-center justify-center w-full h-full">
              <Icon icon={effectiveTrailingIcon} class="h-5" />
            </span>
          </button>
        {:else}
          <div class={styles.current['trailingIcon']}>
            <div class="flex items-center justify-center w-full h-full">
              <Icon icon={effectiveTrailingIcon} class="h-5" />
            </div>
          </div>
        {/if}
      {:else if suffix}
        <span class={styles.current['suffix']}>{suffix}</span>
      {/if}
    {:else}
      <div class={classNames(styles.current['trailingIcon'], { 'absolute right-0': !effectiveTrailingIcon })}>
        <Icon icon={iError} class="h-5 text-error" />
      </div>
    {/if}
  </fieldset>

  {#if hasSupportingText}
    <p class={styles.current['supportingText']} id={helperTextId}>{supportingMessage}</p>
  {/if}
</div>

{#if showDatePicker}
  <AnchorPositioner anchor={fieldRoot!} position="bottom">
    <div
      bind:this={datePickerPopup}
      class="z-50 shadow-xl rounded-[28px] bg-surface-container-high overflow-hidden"
    >
      <div class={dateStyles.current['datePicker']}>
        <div class={dateStyles.current['header']}>
          <Button
            variant="text"
            edgeAligned={false}
            size="small"
            label={viewMode === 'day' ? dateMonthLabel : String(viewDate.getFullYear())}
            icon={iKeyboardArrowDown}
            iconPosition="end"
            aria-live="polite"
            aria-label={viewMode === 'day' ? 'Choose year' : 'Choose month'}
            class={classNames(dateStyles.current['monthLabel'], 'hover:bg-surface-container-highest')}
            onclick={() => (viewMode = viewMode === 'day' ? 'year' : 'day')}
          />
          {#if viewMode === 'day'}
            <div class={dateStyles.current['monthNav']}>
              <button
                type="button"
                aria-label="Previous month"
                class="w-10 h-10 rounded-full flex items-center justify-center"
                onclick={() => {
                  viewDate = addMonthsClamped(viewDate, -1);
                  focusedDate = viewDate;
                  shouldFocusDate = true;
                }}
              ><Icon icon={iChevronLeft} class="w-5 h-5" /></button>
              <button
                type="button"
                aria-label="Next month"
                class="w-10 h-10 rounded-full flex items-center justify-center"
                onclick={() => {
                  viewDate = addMonthsClamped(viewDate, 1);
                  focusedDate = viewDate;
                  shouldFocusDate = true;
                }}
              ><Icon icon={iChevronRight} class="w-5 h-5" /></button>
            </div>
          {/if}
        </div>

        {#if viewMode === 'year'}
          <div bind:this={yearsContainer} class="h-[280px] overflow-y-auto grid grid-cols-3 gap-2 p-2 scrollbar-hide">
            {#each dateYears as year (year)}
              <Button
                size="small"
                variant={year === viewDate.getFullYear() ? 'filled' : 'text'}
                edgeAligned={false}
                data-selected={year === viewDate.getFullYear()}
                class={classNames('!w-full', year !== viewDate.getFullYear() && 'text-on-surface')}
                label={String(year)}
                onclick={() => handleYearSelect(year)}
              />
            {/each}
          </div>
        {:else}
          <div bind:this={dateGrid} role="grid" aria-label={dateMonthLabel} class="flex flex-col gap-y-2">
            <div role="row" class={dateStyles.current['weekDays']}>
              {#each dateWeekDayLabels as day, index (index)}
                <div role="columnheader" class={dateStyles.current['weekDay']}>{day}</div>
              {/each}
            </div>
            <div bind:this={weeksContainer} role="rowgroup">
              {#each dateWeeks as week, weekIndex (weekIndex)}
                <div role="row" class={dateStyles.current['daysGrid']}>
                  {#each week as day (day.date.getTime())}
                    {#if !day.isCurrentMonth}
                      <div role="gridcell" aria-hidden="true" class={dateStyles.current['dayCell']}></div>
                    {:else}
                      {@const selected = getDaySelectionState('single', tempDate, day.date).isSelected}
                      {@const today = isToday(day.date)}
                      <div role="gridcell" aria-selected={selected} class={dateStyles.current['dayCell']}>
                        <button
                          type="button"
                          class={dateDayClass(day.date)}
                          tabindex={focusedDate.toDateString() === day.date.toDateString() ? 0 : -1}
                          aria-current={today ? 'date' : undefined}
                          data-date={day.date.toDateString()}
                          onclick={() => handleDateDayClick(day.date)}
                          onkeydown={(event) => handleDateDayKeyDown(event, day.date)}
                        >{day.date.getDate()}</button>
                      </div>
                    {/if}
                  {/each}
                </div>
              {/each}
            </div>
          </div>
        {/if}
      </div>
      <div class="flex justify-end gap-2 p-4 pt-0">
        <Button variant="text" size="small" label="Cancel" onclick={closeDatePicker} />
        <Button variant="filled" size="small" label="OK" onclick={handleDateConfirm} />
      </div>
    </div>
  </AnchorPositioner>
{/if}

{#if showMenu}
  <AnchorPositioner anchor={fieldRoot!} position="bottom">
    <div bind:this={menuPopup} class="z-50 min-w-[112px] max-w-[280px] max-h-[300px] overflow-y-auto flex flex-col bg-surface-container py-0.5 shadow-2 px-1 rounded-2xl" role="listbox" aria-label={label || 'Options'}>
      {#each options as option, index (`${option.type ?? 'option'}:${String(option.value)}:${index}`)}
        {#if option.type === 'divider'}
          <div role="separator" class="my-1 h-px bg-outline-variant"></div>
        {:else if option.type === 'headline'}
          {#if option.label}
            <div class="px-3 py-2 text-label-small text-on-surface-variant">{option.label}</div>
          {/if}
        {:else}
          {@const selected = String(option.value) === String(resolvedValue)}
          <button
            type="button"
            role="option"
            aria-selected={selected}
            aria-disabled={option.disabled || undefined}
            disabled={option.disabled}
            class={classNames(
              'group/menu-item relative text-start overflow-hidden flex items-center h-12 px-3 cursor-pointer outline-none select-none shrink-0 text-label-large transition-colors duration-200 rounded-xl text-on-surface',
              selected && !option.disabled && 'bg-secondary-container text-on-secondary-container',
              option.disabled && 'opacity-38 pointer-events-none',
            )}
            onclick={() => handleSelectOption(option.value, option.disabled)}
          >
            {#if selected || option.leadingIcon}
              <span class="mr-3 w-6 h-6 flex items-center justify-center menu-item-icon">
                <Icon icon={selected ? iCheck : option.leadingIcon!} class="w-6 h-6" />
              </span>
            {/if}
            <span class="flex-1 truncate">{option.label ?? String(option.value)}</span>
            {#if option.trailingIcon}
              <span class="ml-3 w-6 h-6 flex items-center justify-center"><Icon icon={option.trailingIcon} class="w-6 h-6" /></span>
            {/if}
          </button>
        {/if}
      {/each}
    </div>
  </AnchorPositioner>
{/if}
