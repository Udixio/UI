<script lang="ts">
  import {
    addDays,
    addMonthsClamped,
    buttonStyle,
    classNames,
    datePickerStyle,
    formatMonthLabel,
    getCalendarWeeks,
    getDaySelectionState,
    getStartOfWeek,
    getWeekDayLabels,
    getYearRange,
    isDateDisabled,
    mergeClassNames,
    resolveDatePickerSelection,
    type ButtonVariant,
    type DatePickerInterface,
    type DatePickerValue,
    type DateRange,
  } from '@udixio/core';
  import { createMonthTransitionController, type MonthTransitionController } from '@udixio/core/dom';
  import { iChevronLeft } from '@udixio/icons-rounded-400/chevron_left';
  import { iChevronRight } from '@udixio/icons-rounded-400/chevron_right';
  import { iKeyboardArrowDown } from '@udixio/icons-rounded-400/keyboard_arrow_down';
  import Button from '../button/Button.svelte';
  import Icon from '../icon/Icon.svelte';
  import IconButton from '../icon-button/IconButton.svelte';
  import { createControllableState } from '../utils/create-controllable-state.svelte';
  import { createStyle } from '../utils/create-style.svelte';
  import { untrack } from 'svelte';
  import type { SvelteDatePickerProps } from './date-picker.types';

  const extractAnchorDate = (value: DatePickerValue | undefined): Date | null => {
    if (value instanceof Date) return value;
    if (Array.isArray(value) && value[0]) return value[0];
    return null;
  };
  const today = (date: Date) => {
    const now = new Date();
    return now.getFullYear() === date.getFullYear() && now.getMonth() === date.getMonth() && now.getDate() === date.getDate();
  };

  let {
    mode = 'single',
    value = $bindable(),
    defaultValue = null,
    minDate,
    maxDate,
    shouldDisableDate,
    locale = 'default',
    weekStartDay = 0,
    onChange,
    class: hostClass = '',
    style: hostStyle,
    classes,
    ...rest
  }: SvelteDatePickerProps = $props();

  const anchor = extractAnchorDate(untrack(() => value)) ?? extractAnchorDate(untrack(() => defaultValue)) ?? new Date();
  let viewDate = $state(new Date(anchor.getFullYear(), anchor.getMonth(), 1));
  let focusedDate = $state(anchor);
  let viewMode = $state<'day' | 'year'>('day');
  let shouldFocusDay = false;
  let grid: HTMLDivElement | undefined = $state();
  let yearsContainer: HTMLDivElement | undefined = $state();
  let weeksContainer: HTMLDivElement | undefined = $state();
  let monthController: MonthTransitionController | undefined;
  let previousViewDate = $state<Date | undefined>(undefined);

  const valueState = createControllableState<DatePickerValue>({
    value: () => value,
    defaultValue: () => defaultValue,
    onChange: (next) => onChange?.(next),
    assign: (next) => (value = next),
    componentName: 'DatePicker',
    stateName: 'value',
  });
  const resolvedValue = $derived(valueState.current);
  const hasSelected = $derived(resolvedValue !== null);
  const weeks = $derived(getCalendarWeeks(viewDate, weekStartDay));
  const weekDayLabels = $derived(getWeekDayLabels(locale, weekStartDay));
  const monthLabel = $derived(formatMonthLabel(viewDate, locale));
  const years = getYearRange(new Date().getFullYear());
  const styles = createStyle(datePickerStyle, () => ({
    mode,
    value,
    defaultValue,
    minDate,
    maxDate,
    shouldDisableDate,
    locale,
    weekStartDay,
    hasSelected,
    className: mergeClassNames<DatePickerInterface>('datePicker', classes, hostClass),
  }) as Parameters<typeof datePickerStyle>[0]);

  $effect(() => {
    if (!weeksContainer) return;
    const created = createMonthTransitionController({ container: weeksContainer });
    monthController = created;
    return () => {
      created.destroy();
      if (monthController === created) monthController = undefined;
    };
  });

  $effect(() => {
    const previous = previousViewDate;
    previousViewDate = viewDate;
    const direction = !previous || viewDate.getTime() === previous.getTime() ? 0 : (viewDate > previous ? 1 : -1);
    monthController?.play(direction);
  });

  $effect(() => {
    if (viewMode !== 'year' || !yearsContainer) return;
    yearsContainer.querySelector<HTMLElement>('[data-selected="true"]')?.scrollIntoView({ block: 'center' });
  });

  $effect(() => {
    if (!shouldFocusDay || !grid) return;
    shouldFocusDay = false;
    const key = focusedDate.toDateString();
    requestAnimationFrame(() => grid?.querySelector<HTMLButtonElement>(`[data-date="${key}"]`)?.focus());
  });

  $effect(() => () => monthController?.destroy());

  const goToDate = (next: Date) => {
    shouldFocusDay = true;
    focusedDate = next;
    if (next.getFullYear() !== viewDate.getFullYear() || next.getMonth() !== viewDate.getMonth()) {
      viewDate = new Date(next.getFullYear(), next.getMonth(), 1);
    }
  };
  const selectDate = (date: Date) => {
    if (isDateDisabled(date, { minDate, maxDate, shouldDisableDate })) return;
    goToDate(date);
    valueState.set(resolveDatePickerSelection(mode, resolvedValue, date));
  };
  const dayKeydown = (event: KeyboardEvent, date: Date) => {
    let next: Date | undefined;
    if (event.key === 'ArrowLeft') next = addDays(date, -1);
    else if (event.key === 'ArrowRight') next = addDays(date, 1);
    else if (event.key === 'ArrowUp') next = addDays(date, -7);
    else if (event.key === 'ArrowDown') next = addDays(date, 7);
    else if (event.key === 'Home') next = getStartOfWeek(date, weekStartDay);
    else if (event.key === 'End') next = addDays(getStartOfWeek(date, weekStartDay), 6);
    else if (event.key === 'PageUp') next = addMonthsClamped(date, event.shiftKey ? -12 : -1);
    else if (event.key === 'PageDown') next = addMonthsClamped(date, event.shiftKey ? 12 : 1);
    else return;
    event.preventDefault();
    goToDate(next);
  };
  const dayClasses = (date: Date, selected: boolean, inRange: boolean, start: boolean, end: boolean) => {
    const range = resolvedValue as DateRange | null;
    return classNames(
      styles.current['dayCell'],
      inRange && 'bg-primary/20',
      start && range?.[1] && 'bg-gradient-to-r from-transparent to-primary/20',
      end && range?.[0] && 'bg-gradient-to-l from-transparent to-primary/20',
    );
  };
  const dayButtonClasses = (date: Date, selected: boolean, isTodayDate: boolean, disabledDay: boolean) => {
    const variant: ButtonVariant = selected ? 'filled' : isTodayDate ? 'outlined' : 'text';
    return buttonStyle({
      type: 'button', variant, size: 'small', icon: undefined, iconPosition: 'start', disabled: false,
      edgeAligned: true, loading: false, shape: 'rounded', shapeFeedback: 'none', stateColor: undefined,
      transition: undefined, toggleable: false, pressed: undefined, defaultPressed: false,
      label: String(date.getDate()), isPressed: false,
      className: () => ({
        button: classNames(styles.current['dayButton'], 'p-0', { 'text-on-surface': !selected && !isTodayDate, 'opacity-50': disabledDay }),
        stateLayer: classNames({ '!bg-transparent': disabledDay }),
      }),
    });
  };
</script>

<div {...rest} class={styles.current['datePicker']} style={hostStyle}>
  <div class={styles.current['header']}>
    <Button variant="text" size="small" aria-live="polite" onclick={() => { viewMode = viewMode === 'day' ? 'year' : 'day'; }}>
      <span class="mr-2">{viewMode === 'day' ? monthLabel : viewDate.getFullYear()}</span>
      <Icon icon={iKeyboardArrowDown} class={`w-3 h-3 transition-transform duration-200 ${viewMode === 'year' ? 'rotate-180' : ''}`} />
    </Button>
    {#if viewMode === 'day'}
      <div class={styles.current['monthNav']}>
        <IconButton size="xSmall" shapeFeedback="none" onclick={() => { viewDate = addMonthsClamped(viewDate, -1); }} icon={iChevronLeft} label="Previous month" />
        <IconButton size="xSmall" shapeFeedback="none" onclick={() => { viewDate = addMonthsClamped(viewDate, 1); }} icon={iChevronRight} label="Next month" />
      </div>
    {/if}
  </div>

  {#if viewMode === 'year'}
    <div bind:this={yearsContainer} class="h-[280px] overflow-y-auto grid grid-cols-3 gap-2 p-2 scrollbar-hide">
      {#each years as year (year)}
        <Button
          size="small"
          variant={year === viewDate.getFullYear() ? 'filled' : 'text'}
          data-selected={year === viewDate.getFullYear()}
          class="!w-full"
          label={String(year)}
          onclick={() => { viewDate = new Date(year, viewDate.getMonth(), 1); viewMode = 'day'; }}
        />
      {/each}
    </div>
  {:else}
    <div bind:this={grid} role="grid" aria-label={monthLabel} class="flex flex-col gap-y-2">
      <div role="row" class={styles.current['weekDays']}>
        {#each weekDayLabels as day, index (index)}<div role="columnheader" class={styles.current['weekDay']}>{day}</div>{/each}
      </div>
      <div role="rowgroup" bind:this={weeksContainer}>
        {#each weeks as week, weekIndex (weekIndex)}
          <div role="row" class={styles.current['daysGrid']}>
            {#each week as day (day.date.getTime())}
              {#if !day.isCurrentMonth}
                <div role="gridcell" aria-hidden="true" class={styles.current['dayCell']}></div>
              {:else}
                {@const selection = getDaySelectionState(mode, resolvedValue, day.date)}
                {@const isTodayDate = today(day.date)}
                {@const disabledDay = isDateDisabled(day.date, { minDate, maxDate, shouldDisableDate })}
                {@const focusTarget = day.date.toDateString() === focusedDate.toDateString()}
                <div role="gridcell" aria-selected={selection.isSelected} class={dayClasses(day.date, selection.isSelected, selection.isInRange, selection.isStart, selection.isEnd)}>
                  <Button
                    classes={dayButtonClasses(day.date, selection.isSelected, isTodayDate, disabledDay)}
                    size="small"
                    shapeFeedback="none"
                    variant={selection.isSelected ? 'filled' : isTodayDate ? 'outlined' : 'text'}
                    label={String(day.date.getDate())}
                    data-date={day.date.toDateString()}
                    tabindex={focusTarget ? 0 : -1}
                    aria-current={isTodayDate ? 'date' : undefined}
                    aria-disabled={disabledDay || undefined}
                    onclick={() => selectDate(day.date)}
                    onkeydown={(event) => dayKeydown(event, day.date)}
                  />
                </div>
              {/if}
            {/each}
          </div>
        {/each}
      </div>
    </div>
  {/if}
</div>
