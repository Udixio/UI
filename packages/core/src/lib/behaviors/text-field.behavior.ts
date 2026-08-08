import type { TextFieldType } from '../interfaces/text-field.interface';

/** Shared decision for whether the label floats out of the value area. */
export function resolveTextFieldFloating({
  isFocused,
  hasValue,
  type,
  isMenuOpen,
}: {
  isFocused: boolean;
  hasValue: boolean;
  type: TextFieldType;
  isMenuOpen: boolean;
}): boolean {
  return (
    isFocused ||
    hasValue ||
    type === 'date' ||
    (type === 'select' && isMenuOpen)
  );
}

/**
 * Shared decision for which trailing icon renders. An explicit `trailingIcon`
 * always wins; otherwise `date`/`select` modes fall back to their own
 * indicator. Generic so both adapters can resolve their own icon asset type
 * without this module depending on an icon package.
 */
export function resolveTextFieldTrailingIcon<T>({
  type,
  trailingIcon,
  isMenuOpen,
  dateIcon,
  menuOpenIcon,
  menuClosedIcon,
}: {
  type: TextFieldType;
  trailingIcon: T | undefined;
  isMenuOpen: boolean;
  dateIcon: T;
  menuOpenIcon: T;
  menuClosedIcon: T;
}): T | undefined {
  if (trailingIcon) return trailingIcon;
  if (type === 'date') return dateIcon;
  if (type === 'select') return isMenuOpen ? menuOpenIcon : menuClosedIcon;
  return undefined;
}

/** Parses the `type="date"` field value (`YYYY-MM-DD`) into a local `Date`, or `null`. */
export function parseTextFieldIsoDate(value: string): Date | null {
  if (!value) return null;
  const [year, month, day] = value.split('-').map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
}

/** Formats a selected date back into the field's `YYYY-MM-DD` value. */
export function formatTextFieldIsoDate(date: Date | null): string {
  return date ? date.toLocaleDateString('en-CA') : '';
}

/**
 * Masks a typed/pasted `type="date"` value into `YYYY-MM-DD`: non-digit
 * characters (typing "egrrg", pasting arbitrary text) are dropped, and
 * dashes are inserted automatically as digits accumulate, so typing plain
 * "20260807" in sequence reads back as "2026-08-07" without the user typing
 * the separators themselves -- the field is plain text, not the native
 * `type="date"` control, precisely so it can stay directly typable without
 * a competing native picker; that tradeoff only holds if typing it feels at
 * least as good as the native control's own segmented entry.
 */
export function sanitizeTextFieldDateInput(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 8);
  let masked = digits.slice(0, 4);
  if (digits.length > 4) masked += `-${digits.slice(4, 6)}`;
  if (digits.length > 6) masked += `-${digits.slice(6, 8)}`;
  return masked;
}
