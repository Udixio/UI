import { describe, expect, it } from 'vitest';
import { getChipSelectionTransition } from './chip.behavior';

describe('getChipSelectionTransition', () => {
  it('toggles an enabled chip', () => expect(getChipSelectionTransition({ disabled: false, selected: false })).toEqual({ blocked: false, nextSelected: true }));
  it('blocks disabled chips', () => expect(getChipSelectionTransition({ disabled: true, selected: true })).toEqual({ blocked: true }));
});
