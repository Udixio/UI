import { describe, expect, it } from 'vitest';
import { buttonStyle } from './button.style';
import { cardStyle } from './card.style';
import { iconButtonStyle } from './icon-button.style';
import type { ButtonInterface } from '../interfaces';
import type { CardInterface } from '../interfaces';

/**
 * Characterization test locking the exact output of the class engine
 * (style config → getClassNames boundary). Guards the single-twMerge-pass
 * refactor: any drift in the resolved class strings fails here.
 */
describe('class engine characterization', () => {
  const buttonState = (extra: Partial<ButtonInterface['props']> = {}) =>
    ({
      variant: 'filled',
      size: 'medium',
      shape: 'rounded',
      ...extra,
    }) as ButtonInterface['props'] & { className?: any };

  it('button: filled medium rounded', () => {
    expect(buttonStyle(buttonState())).toMatchInlineSnapshot(`
      {
        "button": "button relative inline-flex w-fit cursor-pointer items-center justify-center group/button outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current text-title-medium px-6 py-4 gap-2 rounded-[40px] hover:shadow-1 bg-primary text-on-primary",
        "icon": "icon size-6",
        "label": "label",
        "stateLayer": "state-layer overflow-hidden",
        "touchTarget": "touch-target absolute left-1/2 top-1/2 h-12 w-full min-w-12 -translate-x-1/2 -translate-y-1/2",
      }
    `);
  });

  it('button: outlined small pressed', () => {
    expect(
      buttonStyle(
        buttonState({
          variant: 'outlined',
          size: 'small',
          isPressed: true,
        } as any),
      ),
    ).toMatchInlineSnapshot(`
      {
        "button": "button relative inline-flex w-fit cursor-pointer items-center justify-center group/button outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current text-label-large px-4 py-2.5 gap-2 rounded-[30px] border text-inverse-on-surface bg-inverse-surface border-inverse-surface",
        "icon": "icon size-5",
        "label": "label",
        "stateLayer": "state-layer overflow-hidden",
        "touchTarget": "touch-target absolute left-1/2 top-1/2 h-12 w-full min-w-12 -translate-x-1/2 -translate-y-1/2",
      }
    `);
  });

  it('button: disabled elevated large', () => {
    expect(
      buttonStyle(
        buttonState({
          variant: 'elevated',
          size: 'large',
          disabled: true,
        } as any),
      ),
    ).toMatchInlineSnapshot(`
      {
        "button": "button relative inline-flex w-fit items-center justify-center group/button outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current text-headline-small px-12 py-8 gap-3 rounded-[70px] text-on-surface/[38%] cursor-default",
        "icon": "icon size-8",
        "label": "label",
        "stateLayer": "state-layer overflow-hidden",
        "touchTarget": "touch-target absolute left-1/2 top-1/2 h-12 w-full min-w-12 -translate-x-1/2 -translate-y-1/2",
      }
    `);
  });

  it('button: user className overrides conflicting utilities at the boundary', () => {
    expect(
      buttonStyle(
        buttonState({
          className: 'bg-red-500 px-2',
        } as any),
      ).button,
    ).toMatchInlineSnapshot(`"button relative inline-flex w-fit cursor-pointer items-center justify-center group/button outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current text-title-medium py-4 gap-2 rounded-[40px] hover:shadow-1 text-on-primary bg-red-500 px-2"`);
  });

  it('button: user className function override per element', () => {
    expect(
      buttonStyle(
        buttonState({
          className: () => ({ label: 'text-red-500', button: 'bg-blue-500' }),
        } as any),
      ),
    ).toMatchInlineSnapshot(`
      {
        "button": "button relative inline-flex w-fit cursor-pointer items-center justify-center group/button outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current text-title-medium px-6 py-4 gap-2 rounded-[40px] hover:shadow-1 text-on-primary bg-blue-500",
        "icon": "icon size-6",
        "label": "label text-red-500",
        "stateLayer": "state-layer overflow-hidden",
        "touchTarget": "touch-target absolute left-1/2 top-1/2 h-12 w-full min-w-12 -translate-x-1/2 -translate-y-1/2",
      }
    `);
  });

  it('icon button: keeps container padding separate from icon size', () => {
    const styles = iconButtonStyle({
      variant: 'tonal',
      size: 'small',
      width: 'default',
      shape: 'rounded',
    } as any);

    expect(styles.iconButton).toContain('shrink-0');
    expect(styles.iconButton).toContain('p-2');
    expect(styles.icon).toContain('size-6');
    expect(styles.icon).not.toContain('p-2');
  });

  it('card: each variant, interactive', () => {
    const variants: CardInterface['props']['variant'][] = [
      'outlined',
      'elevated',
      'filled',
    ];
    const out = variants.map((variant) =>
      cardStyle({ variant, interactive: true } as any),
    );
    expect(out).toMatchInlineSnapshot(`
      [
        {
          "card": "card relative rounded-xl overflow-hidden bg-surface border border-outline-variant group/card cursor-pointer outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current",
        },
        {
          "card": "card relative rounded-xl overflow-hidden bg-surface-container-low shadow-1 group/card cursor-pointer outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current",
        },
        {
          "card": "card relative rounded-xl overflow-hidden bg-surface-container-highest group/card cursor-pointer outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current",
        },
      ]
    `);
  });
});
