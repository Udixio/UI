import { describe, expect, it } from 'vitest';
import {
  resolveTooltipInteraction,
  type TooltipInteractionState,
  type TooltipTriggerKind,
} from './tooltip.behavior.js';

function context(
  state: TooltipInteractionState,
  triggers: TooltipTriggerKind[] = ['hover', 'focus'],
  isSurfaceHovered = false,
) {
  return { state, triggers, isSurfaceHovered };
}

describe('resolveTooltipInteraction', () => {
  it('opens to hovered on pointer enter when hidden and hover is enabled', () => {
    expect(
      resolveTooltipInteraction(context('hidden'), 'pointerEnter'),
    ).toBe('hovered');
  });

  it('ignores pointer enter when hover is not an enabled trigger', () => {
    expect(
      resolveTooltipInteraction(context('hidden', ['focus']), 'pointerEnter'),
    ).toBeNull();
  });

  it('does not downgrade a higher-priority state on pointer enter', () => {
    expect(resolveTooltipInteraction(context('clicked'), 'pointerEnter')).toBeNull();
    expect(resolveTooltipInteraction(context('focused'), 'pointerEnter')).toBeNull();
  });

  it('closes on pointer leave from hovered', () => {
    expect(resolveTooltipInteraction(context('hovered'), 'pointerLeave')).toBe(
      'hidden',
    );
  });

  it('keeps focus open through a pointer leave', () => {
    expect(resolveTooltipInteraction(context('focused'), 'pointerLeave')).toBeNull();
  });

  it('keeps clicked open through a pointer leave', () => {
    expect(resolveTooltipInteraction(context('clicked'), 'pointerLeave')).toBeNull();
  });

  it('does not close on pointer leave while the surface itself is hovered', () => {
    expect(
      resolveTooltipInteraction(context('hovered', ['hover', 'focus'], true), 'pointerLeave'),
    ).toBeNull();
  });

  it('opens to focused on focus when focus is enabled', () => {
    expect(resolveTooltipInteraction(context('hidden'), 'focus')).toBe('focused');
  });

  it('ignores focus when focus is not an enabled trigger', () => {
    expect(resolveTooltipInteraction(context('hidden', ['hover']), 'focus')).toBeNull();
  });

  it('closes on blur from focused', () => {
    expect(resolveTooltipInteraction(context('focused'), 'blur')).toBe('hidden');
  });

  it('keeps clicked open through a blur', () => {
    expect(resolveTooltipInteraction(context('clicked'), 'blur')).toBeNull();
  });

  it('demotes to hovered on blur when the surface is hovered and hover is enabled', () => {
    expect(
      resolveTooltipInteraction(context('focused', ['hover', 'focus'], true), 'blur'),
    ).toBe('hovered');
  });

  it('toggles clicked open and closed on click', () => {
    expect(
      resolveTooltipInteraction(context('hidden', ['click']), 'click'),
    ).toBe('clicked');
    expect(
      resolveTooltipInteraction(context('clicked', ['click']), 'click'),
    ).toBe('hidden');
  });

  it('ignores click when click is not an enabled trigger', () => {
    expect(resolveTooltipInteraction(context('hidden'), 'click')).toBeNull();
  });

  it('closes from any open state on escape and is a no-op when already hidden', () => {
    expect(resolveTooltipInteraction(context('hovered'), 'escape')).toBe('hidden');
    expect(resolveTooltipInteraction(context('clicked'), 'escape')).toBe('hidden');
    expect(resolveTooltipInteraction(context('hidden'), 'escape')).toBeNull();
  });

  it('closes on surface leave only while hovered from a hover trigger', () => {
    expect(resolveTooltipInteraction(context('hovered'), 'surfaceLeave')).toBe(
      'hidden',
    );
    expect(resolveTooltipInteraction(context('focused'), 'surfaceLeave')).toBeNull();
    expect(
      resolveTooltipInteraction(context('hovered', ['click']), 'surfaceLeave'),
    ).toBeNull();
  });
});
