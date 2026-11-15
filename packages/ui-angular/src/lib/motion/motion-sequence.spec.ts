import { Component } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import type { MotionHandle, SequenceBinding, SequenceRef } from '@udixio/motion';
import { defineSequence, sequence } from '@udixio/motion/sequence';
import { MotionSequence } from './motion-sequence';

// The core binding is replaced for the whole file; the definitions stay real.
jest.mock('@udixio/motion/sequence', () => ({
  ...jest.requireActual('@udixio/motion/sequence'),
  sequence: jest.fn(),
}));

const sequenceMock = jest.mocked(sequence);

const steps = { title: { keyframes: [{ opacity: 0 }, { opacity: 1 }] } };
defineSequence('hero', { steps });
defineSequence('outro', { steps });

/** A stand-in for one bound sequence: as the core does, a client bind plays at once and a settled bind does not. */
function fakeSequence(settled: boolean) {
  const playHandle = { cancel: jest.fn(), duration: 0 } as unknown as MotionHandle;
  let current: MotionHandle | null = null;
  const binding = {
    get handle() {
      return current;
    },
    play: jest.fn(() => {
      current = playHandle;
      return playHandle;
    }),
    destroy: jest.fn(),
  };
  if (!settled) binding.play();
  return { binding, playHandle };
}

type Fake = ReturnType<typeof fakeSequence>;
let fakes: Fake[] = [];

beforeEach(() => {
  fakes = [];
  sequenceMock.mockReset();
  sequenceMock.mockImplementation((_root, _source, options) => {
    const fake = fakeSequence(options?.settled ?? false);
    fakes.push(fake);
    return fake.binding as unknown as SequenceBinding;
  });
});

const boxOf = (root: HTMLElement): HTMLElement => {
  const box = root.querySelector<HTMLElement>('[data-testid="box"]');
  if (!box) throw new Error('the test box is not in the DOM');
  return box;
};

function directiveOf<T>(fixture: ComponentFixture<T>): MotionSequence {
  return fixture.debugElement.query(By.directive(MotionSequence)).injector.get(MotionSequence);
}

@Component({
  standalone: true,
  imports: [MotionSequence],
  template: `
    <section
      data-testid="box"
      [udxMotionSequence]="source"
      [udxMotionSequenceSettled]="settled"
    ></section>
  `,
})
class SequenceHost {
  source: SequenceRef | string = 'hero';
  settled = false;
}

describe('MotionSequence (Angular directive)', () => {
  it('binds the named sequence to its host after render, not settled by default', () => {
    const fixture = TestBed.createComponent(SequenceHost);
    fixture.detectChanges();

    expect(sequenceMock).toHaveBeenCalledTimes(1);
    expect(sequenceMock).toHaveBeenCalledWith(boxOf(fixture.nativeElement), 'hero', { settled: false });
    fixture.destroy();
  });

  it('binds settled when udxMotionSequenceSettled is set', () => {
    const fixture = TestBed.createComponent(SequenceHost);
    fixture.componentInstance.settled = true;
    fixture.detectChanges();

    expect(sequenceMock).toHaveBeenCalledWith(boxOf(fixture.nativeElement), 'hero', { settled: true });
    fixture.destroy();
  });

  it('forwards play to the binding, and handle reads its latest handle', () => {
    const fixture = TestBed.createComponent(SequenceHost);
    fixture.detectChanges();
    const hero = directiveOf(fixture);
    expect(hero.handle).toBe(fakes[0].playHandle);

    hero.play();

    expect(fakes[0].binding.play).toHaveBeenCalledTimes(2);
    fixture.destroy();
  });

  it('binds the new sequence settled, and destroys the old one, when the source changes', () => {
    const fixture = TestBed.createComponent(SequenceHost);
    fixture.detectChanges();

    fixture.componentInstance.source = 'outro';
    fixture.detectChanges();

    expect(fakes[0].binding.destroy).toHaveBeenCalledTimes(1);
    expect(sequenceMock).toHaveBeenLastCalledWith(boxOf(fixture.nativeElement), 'outro', { settled: true });
    fixture.destroy();
  });

  it('destroys the binding when the directive is destroyed', () => {
    const fixture = TestBed.createComponent(SequenceHost);
    fixture.detectChanges();

    fixture.destroy();

    expect(fakes[0].binding.destroy).toHaveBeenCalledTimes(1);
  });

  it('waits for a sequence defined after the render, then binds it settled', () => {
    const fixture = TestBed.createComponent(SequenceHost);
    fixture.componentInstance.source = 'sequence-later';
    fixture.detectChanges();

    expect(sequenceMock).not.toHaveBeenCalled();

    defineSequence('sequence-later', { steps });

    expect(sequenceMock).toHaveBeenCalledWith(
      boxOf(fixture.nativeElement),
      expect.objectContaining({ name: 'sequence-later' }),
      { settled: true },
    );
    fixture.destroy();
  });
});
