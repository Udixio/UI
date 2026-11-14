import { Component, type AnimationCallbackEvent } from '@angular/core';
import { By } from '@angular/platform-browser';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import {
  motionWhenDefined,
  type DeferredMotion,
  type MotionBinding,
} from '@udixio/motion';
import { Motion } from './motion';

// The core binding is replaced for the whole file; everything else of
// `@udixio/motion` stays real.
jest.mock('@udixio/motion', () => ({
  ...jest.requireActual('@udixio/motion'),
  motionWhenDefined: jest.fn(),
}));

const motionWhenDefinedMock = jest.mocked(motionWhenDefined);

type Outcome = 'finished' | 'cancelled';

/**
 * A deferred motion whose exit stays pending until the test settles it, so
 * the directive can be observed while it waits for the removal to be allowed.
 */
function fakeMotion(verb: MotionBinding['verb'] = 'disappear') {
  let settle!: (outcome: Outcome) => void;
  const exit = new Promise<Outcome>(resolve => {
    settle = resolve;
  });
  const setPresent = jest.fn((_present: boolean) => exit);
  const play = jest.fn();
  const destroy = jest.fn();
  const binding: MotionBinding = {
    handle: null,
    present: true,
    verb,
    play,
    setPresent,
    destroy: jest.fn(),
  };
  const deferred: DeferredMotion = { binding, destroy };
  return {
    deferred,
    binding,
    setPresent,
    play,
    destroy,
    finishExit: (outcome: Outcome = 'finished') => settle(outcome),
  };
}

/** Lets the promise callbacks of the current turn run. */
const flushPromises = async () => {
  for (let turn = 0; turn < 3; turn++) await Promise.resolve();
};

const boxOf = (root: HTMLElement): HTMLElement => {
  const box = root.querySelector<HTMLElement>('[data-testid="box"]');
  if (!box) throw new Error('the test box is not in the DOM');
  return box;
};

const countCallsWith = (mock: jest.Mock, value: unknown) =>
  mock.mock.calls.filter(([arg]) => arg === value).length;

function motionOf<T>(fixture: ComponentFixture<T>): Motion {
  return fixture.debugElement.query(By.directive(Motion)).injector.get(Motion);
}

type LeavingMotion = { leave(event: AnimationCallbackEvent): void };

/**
 * Calls the directive's leave handler the way Angular does, and returns the
 * spy standing for `animationComplete`.
 *
 * The leave tests call `leave` directly, because jsdom has no Web Animations
 * API (`getAnimations`): Angular 21 skips every `animate.leave` listener under
 * Jest and never calls it. The removal Angular performs is covered by the
 * documentation demo's browser test.
 */
function leave(motion: Motion, target: HTMLElement) {
  const animationComplete = jest.fn();
  (motion as unknown as LeavingMotion).leave({ target, animationComplete });
  return animationComplete;
}

beforeEach(() => {
  motionWhenDefinedMock.mockReset();
});

@Component({
  standalone: true,
  imports: [Motion],
  template: `
    <div
      data-testid="box"
      [udxMotion]="source"
      [udxMotionSettled]="settled"
    ></div>
  `,
})
class BindHost {
  source = 'demo';
  settled = false;
}

@Component({
  standalone: true,
  imports: [Motion],
  template: `<div data-testid="box" udxMotion="demo"></div>`,
})
class StaticHost {}

@Component({
  standalone: true,
  imports: [Motion],
  template: `<div data-testid="box" udxMotion="demo" udxMotionPresent="false"></div>`,
})
class StaticAbsentHost {}

@Component({
  standalone: true,
  imports: [Motion],
  template: `
    <div data-testid="box" udxMotion="demo" [udxMotionPresent]="present"></div>
  `,
})
class PresenceHost {
  present = true;
}

@Component({
  standalone: true,
  imports: [Motion],
  template: `
    <button data-testid="box" udxMotion="press" [udxMotionState]="count"></button>
  `,
})
class StateHost {
  count = 0;
}

describe('Motion (Angular directive)', () => {
  describe('binding', () => {
    it('binds the named motion to its host, present and not settled by default', () => {
      const motion = fakeMotion();
      motionWhenDefinedMock.mockReturnValue(motion.deferred);
      const fixture = TestBed.createComponent(BindHost);
      fixture.detectChanges();

      expect(motionWhenDefinedMock).toHaveBeenCalledWith(
        boxOf(fixture.nativeElement),
        'demo',
        { present: true, settled: false },
      );
      fixture.destroy();
    });

    it('binds as settled when udxMotionSettled is set', () => {
      const motion = fakeMotion();
      motionWhenDefinedMock.mockReturnValue(motion.deferred);
      const fixture = TestBed.createComponent(BindHost);
      fixture.componentInstance.settled = true;
      fixture.detectChanges();

      expect(motionWhenDefinedMock).toHaveBeenCalledWith(
        boxOf(fixture.nativeElement),
        'demo',
        { present: true, settled: true },
      );
      fixture.destroy();
    });

    it('rebinds, as settled, when udxMotion names another motion', () => {
      const first = fakeMotion();
      const second = fakeMotion();
      motionWhenDefinedMock
        .mockReturnValueOnce(first.deferred)
        .mockReturnValueOnce(second.deferred);
      const fixture = TestBed.createComponent(BindHost);
      fixture.detectChanges();

      fixture.componentInstance.source = 'other';
      fixture.detectChanges();

      expect(first.destroy).toHaveBeenCalledTimes(1);
      expect(motionWhenDefinedMock).toHaveBeenLastCalledWith(
        boxOf(fixture.nativeElement),
        'other',
        { present: true, settled: true },
      );
      fixture.destroy();
    });

    it('reads a static udxMotionPresent="false" as absent', () => {
      const motion = fakeMotion();
      motionWhenDefinedMock.mockReturnValue(motion.deferred);
      const fixture = TestBed.createComponent(StaticAbsentHost);
      fixture.detectChanges();

      expect(motionWhenDefinedMock).toHaveBeenCalledWith(
        boxOf(fixture.nativeElement),
        'demo',
        { present: false, settled: false },
      );
      fixture.destroy();
    });
  });

  describe('presence and emphasis', () => {
    it('follows udxMotionPresent for a node kept in the DOM', () => {
      const motion = fakeMotion('appear');
      motionWhenDefinedMock.mockReturnValue(motion.deferred);
      const fixture = TestBed.createComponent(PresenceHost);
      fixture.detectChanges();

      fixture.componentInstance.present = false;
      fixture.detectChanges();
      expect(motion.setPresent).toHaveBeenLastCalledWith(false);

      fixture.componentInstance.present = true;
      fixture.detectChanges();

      expect(motion.setPresent).toHaveBeenLastCalledWith(true);
      expect(boxOf(fixture.nativeElement).isConnected).toBe(true);
      fixture.destroy();
    });

    it('replays an emphasis once when udxMotionState changes', () => {
      const motion = fakeMotion('emphasize');
      motionWhenDefinedMock.mockReturnValue(motion.deferred);
      const fixture = TestBed.createComponent(StateHost);
      fixture.detectChanges();
      expect(motion.play).not.toHaveBeenCalled();

      fixture.componentInstance.count = 1;
      fixture.detectChanges();

      expect(motion.play).toHaveBeenCalledTimes(1);
      fixture.destroy();
    });
  });

  describe('leave and destroy', () => {
    // Timers are faked: the directive releases the binding in a macrotask
    // after `ngOnDestroy`, and the tests decide when that macrotask runs.
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('plays the exit through the presence binding, and releases the binding once it settles', async () => {
      const motion = fakeMotion();
      motionWhenDefinedMock.mockReturnValue(motion.deferred);
      const fixture = TestBed.createComponent(StaticHost);
      fixture.detectChanges();

      const animationComplete = leave(
        motionOf(fixture),
        boxOf(fixture.nativeElement),
      );

      expect(countCallsWith(motion.setPresent, false)).toBe(1);
      expect(motion.setPresent).toHaveBeenLastCalledWith(false);
      await flushPromises();
      expect(animationComplete).not.toHaveBeenCalled();
      expect(motion.destroy).not.toHaveBeenCalled();

      motion.finishExit('finished');
      await flushPromises();

      expect(animationComplete).toHaveBeenCalledTimes(1);
      expect(motion.destroy).toHaveBeenCalledTimes(1);
    });

    it('keeps the binding while the exit plays when the directive is destroyed first, as Angular orders it', async () => {
      const motion = fakeMotion();
      motionWhenDefinedMock.mockReturnValue(motion.deferred);
      const fixture = TestBed.createComponent(StaticHost);
      fixture.detectChanges();
      const motionDirective = motionOf(fixture);
      const box = boxOf(fixture.nativeElement);

      motionDirective.ngOnDestroy();
      const animationComplete = leave(motionDirective, box);
      jest.runAllTimers();
      await flushPromises();

      expect(animationComplete).not.toHaveBeenCalled();
      expect(motion.destroy).not.toHaveBeenCalled();

      motion.finishExit('finished');
      await flushPromises();

      expect(animationComplete).toHaveBeenCalledTimes(1);
      expect(motion.destroy).toHaveBeenCalledTimes(1);
    });

    it('keeps the binding while the exit plays when the leave comes before the destroy', async () => {
      const motion = fakeMotion();
      motionWhenDefinedMock.mockReturnValue(motion.deferred);
      const fixture = TestBed.createComponent(StaticHost);
      fixture.detectChanges();
      const motionDirective = motionOf(fixture);

      const animationComplete = leave(
        motionDirective,
        boxOf(fixture.nativeElement),
      );
      motionDirective.ngOnDestroy();
      jest.runAllTimers();
      await flushPromises();

      expect(motion.destroy).not.toHaveBeenCalled();

      motion.finishExit('finished');
      await flushPromises();

      expect(animationComplete).toHaveBeenCalledTimes(1);
      expect(motion.destroy).toHaveBeenCalledTimes(1);
    });

    it('completes the removal at once when there is no binding to play an exit', () => {
      const destroy = jest.fn();
      motionWhenDefinedMock.mockReturnValue({
        binding: undefined,
        destroy,
      });
      const fixture = TestBed.createComponent(StaticHost);
      fixture.detectChanges();

      const animationComplete = leave(
        motionOf(fixture),
        boxOf(fixture.nativeElement),
      );

      expect(animationComplete).toHaveBeenCalledTimes(1);
      expect(destroy).toHaveBeenCalledTimes(1);
    });

    it('destroys the binding once the directive is destroyed, without a leave', async () => {
      const motion = fakeMotion('appear');
      motionWhenDefinedMock.mockReturnValue(motion.deferred);
      const fixture = TestBed.createComponent(PresenceHost);
      fixture.detectChanges();
      fixture.componentInstance.present = false;
      fixture.detectChanges();
      expect(motion.setPresent).toHaveBeenLastCalledWith(false);

      expect(() => fixture.destroy()).not.toThrow();
      expect(motion.destroy).not.toHaveBeenCalled();

      jest.runAllTimers();
      expect(motion.destroy).toHaveBeenCalledTimes(1);

      // The presence exit settles after the destroy: nothing runs again.
      expect(() => motion.finishExit('finished')).not.toThrow();
      await flushPromises();
      expect(motion.destroy).toHaveBeenCalledTimes(1);
    });

    it('completes an emphasis at once, since it has no exit to wait for', () => {
      const motion = fakeMotion('emphasize');
      motionWhenDefinedMock.mockReturnValue(motion.deferred);
      const fixture = TestBed.createComponent(StaticHost);
      fixture.detectChanges();

      const animationComplete = leave(
        motionOf(fixture),
        boxOf(fixture.nativeElement),
      );

      expect(animationComplete).toHaveBeenCalledTimes(1);
      expect(motion.setPresent).not.toHaveBeenCalled();
    });
  });
});
