import type {
  ChipInterface,
  ChipProps,
  ClassNameComponent,
  ElementClasses,
} from '@udixio/core';
import type { HTMLAttributes } from 'svelte/elements';
import type { Snippet } from 'svelte';

type ForwardedAttributes = Omit<
  HTMLAttributes<HTMLElement>,
  | keyof ChipProps
  | 'class'
  | 'children'
  | 'style'
  | 'contenteditable'
  | 'draggable'
  | 'onclick'
  | 'onfocus'
  | 'onblur'
  | 'onkeydown'
  | 'ondblclick'
  | 'ondragstart'
  | 'ondragend'
>;

/**
 * A compact action, link, editable value, or selectable option.
 *
 * @status beta
 * @category Action
 * @devx
 * - `selected` is bindable; `defaultSelected` initializes uncontrolled usage.
 * - `editable` enables inline label editing and `onEditCommit` receives the trimmed value.
 * @a11y
 * - Uses native button or link semantics and exposes `aria-pressed` only in selection mode.
 * - Backspace and Delete request removal when `onRemove` is provided.
 * @limitations
 * - Edit-on-focus starts after a one-second delay; double-click, Enter, and F2 start it directly.
 */
export interface SvelteChipProps extends ChipProps, ForwardedAttributes {
  /** String class merged onto the root element. */
  class?: string;
  /** Inline style merged onto the root element. */
  style?: string;
  /** State-aware classes for the component's internal elements. */
  classes?: ElementClasses<ChipInterface> | ClassNameComponent<ChipInterface>;
  /** String or snippet content used instead of `label`. */
  children?: Snippet;
  /** Bindable selected state. */
  selected?: boolean;
  /** Notifies an accepted selected-state transition. */
  onSelectedChange?: (selected: boolean) => void;
  /** Called when editing starts. */
  onEditStart?: () => void;
  /** Called with the normalized label when editing is committed. */
  onEditCommit?: (nextLabel: string) => void;
  /** Called when editing is cancelled. */
  onEditCancel?: () => void;
  /** Called for every editable label change. */
  onChange?: (nextLabel: string) => void;
  /** Called when the trailing remove action is activated. */
  onRemove?: () => void;
  /** Native click handler. */
  onclick?: (event: MouseEvent & { currentTarget: EventTarget & (HTMLButtonElement | HTMLAnchorElement) }) => void;
  /** Native focus handler. */
  onfocus?: (event: FocusEvent) => void;
  /** Native blur handler. */
  onblur?: (event: FocusEvent) => void;
  /** Native key handler. */
  onkeydown?: (event: KeyboardEvent) => void;
  /** Native double-click handler. */
  ondblclick?: (event: MouseEvent) => void;
  /** Native drag-start handler. */
  ondragstart?: (event: DragEvent) => void;
  /** Native drag-end handler. */
  ondragend?: (event: DragEvent) => void;
}
