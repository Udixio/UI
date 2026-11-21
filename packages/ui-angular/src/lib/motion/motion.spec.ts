import { By } from '@angular/platform-browser';
import { PLATFORM_ID, Component, type AnimationCallbackEvent } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import {
  kindOf,
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
  const pause = jest.fn();
  const destroy = jest.fn();
  const binding: MotionBinding = {
    handle: null,
    present: true,
    verb,
    kind: kindOf(verb),
    play,
    pause,
    setPresent,
    destroy: jest.fn(),
  };
  // As the core's deferred motion: the presence goes to a presence motion, the replay to an emphasis, and nothing else.
  const deferred: DeferredMotion = {
    binding,
    setPresent: (present: boolean) => (binding.kind === 'presence' ? binding.setPresent(present) : Promise.resolve<Outcome>('finished')),
    play: () => {
      if (binding.kind === 'emphasis') binding.play();
    },
    destroy,
  };
  return {
    deferred,
    binding,
    setPresent,
    play,
    pause,
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
  template: `<div data-testid="box" udxMotion="demo" [udxMotionShared]="shared"></div>`,
})
class SharedHost {
  shared: string | undefined = 'pic';
}

@Component({
  standalone: true,
  imports: [Motion],
  template: `<div data-testid="box" udxMotion="demo" [udxMotionRestoreFocus]="back"></div><button #back type="button"></button>`,
})
class RestoreFocusHost {}

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

@Component({
  standalone: true,
  imports: [Motion],
  template: `
    <div data-testid="box" udxMotion="fade reflow" [udxMotionPresent]="present"></div>
  `,
})
class ListPresenceHost {
  present = true;
}

@Component({
  standalone: true,
  imports: [Motion],
  template: `<div data-testid="box" udxMotion="fade reflow"></div>`,
})
class ListHost {}

@Component({
  standalone: true,
  imports: [Motion],
  template: `
    <div data-testid="box" udxMotion="rotate" [udxMotionPaused]="paused"></div>
  `,
})
class PausedHost {
  paused = false;
}

@Component({
  standalone: true,
  imports: [Motion],
  template: `<div data-testid="box" udxMotion="rotate" udxMotionPaused></div>`,
})
class StaticPausedHost {}

@Component({
  standalone: true,
  imports: [Motion],
  template: `<div data-testid="box" udxMotion="demo" hidden></div>`,
})
class AuthorHiddenHost {}

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
        { present: true, development: true },
      );
      fixture.destroy();
    });

    it('leaves an element the server marked present to the core, which binds it settled: no entry replays on hydration', () => {
      const motion = fakeMotion();
      motionWhenDefinedMock.mockReturnValue(motion.deferred);
      const fixture = TestBed.createComponent(BindHost);
      boxOf(fixture.nativeElement).setAttribute('data-presence', 'present');
      fixture.detectChanges();

      expect(motionWhenDefinedMock).toHaveBeenCalledWith(boxOf(fixture.nativeElement), 'demo', { present: true, development: true });
      expect(motionWhenDefinedMock.mock.calls[0][2]).not.toHaveProperty('settled', true);
      fixture.destroy();
    });

    it('marks a present element on the server, and leaves an absent one unmarked', async () => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({ providers: [{ provide: PLATFORM_ID, useValue: 'server' }] });
      const motion = fakeMotion();
      motionWhenDefinedMock.mockReturnValue(motion.deferred);
      const present = TestBed.createComponent(PresenceHost);
      present.detectChanges();
      expect(boxOf(present.nativeElement).getAttribute('data-presence')).toBe('present');
      present.destroy();

      const absent = TestBed.createComponent(PresenceHost);
      absent.componentInstance.present = false;
      absent.detectChanges();
      expect(boxOf(absent.nativeElement).hasAttribute('data-presence')).toBe(false);
      absent.destroy();
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
        { present: true, settled: true, development: true },
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
        { present: true, settled: true, development: true },
      );
      fixture.destroy();
    });

    it('binds each name of a list to the host, with the same options', () => {
      const fade = fakeMotion('appear');
      const reflow = fakeMotion('layout');
      motionWhenDefinedMock
        .mockReturnValueOnce(fade.deferred)
        .mockReturnValueOnce(reflow.deferred);
      const fixture = TestBed.createComponent(ListHost);
      fixture.detectChanges();

      const box = boxOf(fixture.nativeElement);
      expect(motionWhenDefinedMock).toHaveBeenCalledTimes(2);
      expect(motionWhenDefinedMock).toHaveBeenNthCalledWith(1, box, 'fade', {
        present: true,
        development: true,
      });
      expect(motionWhenDefinedMock).toHaveBeenNthCalledWith(2, box, 'reflow', {
        present: true,
        development: true,
      });
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
        { present: false, development: true },
      );
      fixture.destroy();
    });

    it('gives the shared identity to the binding', () => {
      const motion = fakeMotion('layout');
      motionWhenDefinedMock.mockReturnValue(motion.deferred);
      const fixture = TestBed.createComponent(SharedHost);
      fixture.detectChanges();

      expect(motionWhenDefinedMock).toHaveBeenCalledWith(
        boxOf(fixture.nativeElement),
        'demo',
        { present: true, shared: 'pic', development: true },
      );
      fixture.destroy();
    });

    it('passes udxMotionRestoreFocus to the binding', () => {
      const motion = fakeMotion();
      motionWhenDefinedMock.mockReturnValue(motion.deferred);
      const fixture = TestBed.createComponent(RestoreFocusHost);
      fixture.detectChanges();

      const back = fixture.nativeElement.querySelector('button');
      expect(motionWhenDefinedMock).toHaveBeenCalledWith(
        boxOf(fixture.nativeElement),
        'demo',
        expect.objectContaining({ restoreFocus: back }),
      );
      fixture.destroy();
    });

    it('rebinds once, as settled, when udxMotionShared changes', () => {
      const first = fakeMotion('layout');
      const second = fakeMotion('layout');
      motionWhenDefinedMock
        .mockReturnValueOnce(first.deferred)
        .mockReturnValueOnce(second.deferred);
      const fixture = TestBed.createComponent(SharedHost);
      fixture.detectChanges();

      fixture.componentInstance.shared = 'frame';
      fixture.detectChanges();

      expect(first.destroy).toHaveBeenCalledTimes(1);
      expect(motionWhenDefinedMock).toHaveBeenCalledTimes(2);
      expect(motionWhenDefinedMock).toHaveBeenLastCalledWith(
        boxOf(fixture.nativeElement),
        'demo',
        { present: true, settled: true, shared: 'frame', development: true },
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

    it('keeps the host in the DOM when udxMotionPresent turns false: displayed while its exit plays, then hidden', async () => {
      const motion = fakeMotion('appear');
      motionWhenDefinedMock.mockReturnValue(motion.deferred);
      const fixture = TestBed.createComponent(PresenceHost);
      fixture.detectChanges();
      const box = boxOf(fixture.nativeElement);
      expect(box.hidden).toBe(false);

      fixture.componentInstance.present = false;
      fixture.detectChanges();
      expect(motion.setPresent).toHaveBeenLastCalledWith(false);
      expect(box.hidden).toBe(true);
      // The exit plays on a host still displayed: its own display is held inline until the exit has finished.
      expect(box.style.getPropertyPriority('display')).toBe('important');

      motion.finishExit('finished');
      await flushPromises();
      expect(box.isConnected).toBe(true);
      expect(box.hidden).toBe(true);
      expect(box.style.display).toBe('');
      fixture.destroy();
    });

    it('shows a hidden host again with its entry when udxMotionPresent turns true', () => {
      const motion = fakeMotion('appear');
      motionWhenDefinedMock.mockReturnValue(motion.deferred);
      const fixture = TestBed.createComponent(PresenceHost);
      fixture.componentInstance.present = false;
      fixture.detectChanges();
      const box = boxOf(fixture.nativeElement);
      expect(box.hidden).toBe(true);

      fixture.componentInstance.present = true;
      fixture.detectChanges();
      expect(box.hidden).toBe(false);
      expect(motion.setPresent).toHaveBeenLastCalledWith(true);
      expect(motionWhenDefinedMock).toHaveBeenCalledTimes(1);
      fixture.destroy();
    });

    it('renders a host absent from the start hidden, on the server too, with no exit', () => {
      const motion = fakeMotion('appear');
      motionWhenDefinedMock.mockReturnValue(motion.deferred);
      const client = TestBed.createComponent(StaticAbsentHost);
      client.detectChanges();
      expect(boxOf(client.nativeElement).hidden).toBe(true);
      expect(boxOf(client.nativeElement).style.display).toBe('');
      client.destroy();

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({ providers: [{ provide: PLATFORM_ID, useValue: 'server' }] });
      const server = TestBed.createComponent(PresenceHost);
      server.componentInstance.present = false;
      server.detectChanges();
      expect(boxOf(server.nativeElement).hidden).toBe(true);
      server.destroy();
    });

    it('leaves the host\'s hidden to the author while udxMotionPresent is not false', () => {
      const motion = fakeMotion('appear');
      motionWhenDefinedMock.mockReturnValue(motion.deferred);
      const fixture = TestBed.createComponent(AuthorHiddenHost);
      fixture.detectChanges();

      expect(boxOf(fixture.nativeElement).hidden).toBe(true);
      fixture.destroy();
    });

    it('never sets the presence of a layout motion when udxMotionPresent changes', () => {
      const motion = fakeMotion('layout');
      motionWhenDefinedMock.mockReturnValue(motion.deferred);
      const fixture = TestBed.createComponent(PresenceHost);
      fixture.detectChanges();

      fixture.componentInstance.present = false;
      fixture.detectChanges();

      expect(motion.setPresent).not.toHaveBeenCalled();
      expect(boxOf(fixture.nativeElement).isConnected).toBe(true);
      fixture.destroy();
    });

    it('follows udxMotionPresent on the presence motion of a list, and leaves its layout alone', () => {
      const appear = fakeMotion('appear');
      const reflow = fakeMotion('layout');
      motionWhenDefinedMock
        .mockReturnValueOnce(appear.deferred)
        .mockReturnValueOnce(reflow.deferred);
      const fixture = TestBed.createComponent(ListPresenceHost);
      fixture.detectChanges();
      expect(motionWhenDefinedMock).toHaveBeenCalledTimes(2);

      fixture.componentInstance.present = false;
      fixture.detectChanges();

      expect(appear.setPresent).toHaveBeenLastCalledWith(false);
      expect(reflow.setPresent).not.toHaveBeenCalled();
      expect(boxOf(fixture.nativeElement).isConnected).toBe(true);
      fixture.destroy();
    });

    it('hands a presence set before its motion is defined to that motion, which keeps it for the definition', () => {
      // The name is not defined: the deferred motion has no binding yet, and keeps what it is asked.
      const pending = { binding: undefined, setPresent: jest.fn(() => Promise.resolve<Outcome>('finished')), play: jest.fn(), destroy: jest.fn() };
      motionWhenDefinedMock.mockReturnValue(pending as unknown as DeferredMotion);
      const fixture = TestBed.createComponent(PresenceHost);
      fixture.detectChanges();

      fixture.componentInstance.present = false;
      fixture.detectChanges();

      expect(pending.setPresent).toHaveBeenLastCalledWith(false);
      expect(boxOf(fixture.nativeElement).isConnected).toBe(true);
      fixture.destroy();
    });

    it('hands a replay asked before its emphasis is defined to that motion, which plays it once defined', () => {
      const pending = { binding: undefined, setPresent: jest.fn(() => Promise.resolve<Outcome>('finished')), play: jest.fn(), destroy: jest.fn() };
      motionWhenDefinedMock.mockReturnValue(pending as unknown as DeferredMotion);
      const fixture = TestBed.createComponent(StateHost);
      fixture.detectChanges();

      fixture.componentInstance.count = 1;
      fixture.detectChanges();

      expect(pending.play).toHaveBeenCalledTimes(1);
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

    it('releases the binding while the element is still in the page, and lets it leave only after', () => {
      const order: string[] = [];
      let box: HTMLElement | undefined;
      let connectedAtRelease: boolean | undefined;
      const destroy = jest.fn(() => {
        connectedAtRelease = box?.isConnected;
        order.push('release');
      });
      motionWhenDefinedMock.mockReturnValue({
        binding: undefined,
        setPresent: jest.fn(() => Promise.resolve<'finished' | 'cancelled'>('finished')),
        play: jest.fn(),
        destroy,
      });
      const fixture = TestBed.createComponent(StaticHost);
      fixture.detectChanges();
      box = boxOf(fixture.nativeElement);
      // Angular removes the element once `animationComplete` has been called: the removal is simulated by the call.
      const animationComplete = jest.fn(() => {
        order.push('leave');
        box?.remove();
      });
      (motionOf(fixture) as unknown as LeavingMotion).leave({ target: box, animationComplete });

      expect(order).toEqual(['release', 'leave']);
      expect(connectedAtRelease).toBe(true);
    });

    it('completes the removal at once when there is no binding to play an exit', () => {
      const destroy = jest.fn();
      motionWhenDefinedMock.mockReturnValue({
        binding: undefined,
        setPresent: jest.fn(() => Promise.resolve<'finished' | 'cancelled'>('finished')),
        play: jest.fn(),
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

    it('completes a layout at once, since it has no presence to exit', () => {
      const motion = fakeMotion('layout');
      motionWhenDefinedMock.mockReturnValue(motion.deferred);
      const fixture = TestBed.createComponent(StaticHost);
      fixture.detectChanges();

      const animationComplete = leave(
        motionOf(fixture),
        boxOf(fixture.nativeElement),
      );

      expect(animationComplete).toHaveBeenCalledTimes(1);
      expect(motion.setPresent).not.toHaveBeenCalled();
      expect(motion.destroy).toHaveBeenCalledTimes(1);
    });

    it('waits for the presence exit of a list, then releases every binding', async () => {
      const appear = fakeMotion('appear');
      const reflow = fakeMotion('layout');
      motionWhenDefinedMock
        .mockReturnValueOnce(appear.deferred)
        .mockReturnValueOnce(reflow.deferred);
      const fixture = TestBed.createComponent(ListHost);
      fixture.detectChanges();

      const animationComplete = leave(
        motionOf(fixture),
        boxOf(fixture.nativeElement),
      );

      expect(appear.setPresent).toHaveBeenLastCalledWith(false);
      expect(reflow.setPresent).not.toHaveBeenCalled();
      await flushPromises();
      expect(animationComplete).not.toHaveBeenCalled();
      expect(appear.destroy).not.toHaveBeenCalled();
      expect(reflow.destroy).not.toHaveBeenCalled();

      appear.finishExit('finished');
      await flushPromises();

      expect(animationComplete).toHaveBeenCalledTimes(1);
      expect(appear.destroy).toHaveBeenCalledTimes(1);
      expect(reflow.destroy).toHaveBeenCalledTimes(1);
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

  describe('loop pausing', () => {
    it('pauses a loop bound with udxMotionPaused set, once, and never plays it', () => {
      const loop = fakeMotion('loop');
      motionWhenDefinedMock.mockReturnValue(loop.deferred);
      const fixture = TestBed.createComponent(StaticPausedHost);
      fixture.detectChanges();

      expect(loop.pause).toHaveBeenCalledTimes(1);
      expect(loop.play).not.toHaveBeenCalled();
      fixture.destroy();
    });

    it('pauses the loop when udxMotionPaused turns true and plays it when it turns false, without binding again', () => {
      const loop = fakeMotion('loop');
      motionWhenDefinedMock.mockReturnValue(loop.deferred);
      const fixture = TestBed.createComponent(PausedHost);
      fixture.detectChanges();
      expect(loop.pause).not.toHaveBeenCalled();

      fixture.componentInstance.paused = true;
      fixture.detectChanges();
      expect(loop.pause).toHaveBeenCalledTimes(1);

      fixture.componentInstance.paused = false;
      fixture.detectChanges();
      expect(loop.play).toHaveBeenCalledTimes(1);
      expect(loop.pause).toHaveBeenCalledTimes(1);
      expect(motionWhenDefinedMock).toHaveBeenCalledTimes(1);
      fixture.destroy();
    });

    it('ignores udxMotionPaused on a motion without a loop: nothing is called', () => {
      const fade = fakeMotion('appear');
      motionWhenDefinedMock.mockReturnValue(fade.deferred);
      const fixture = TestBed.createComponent(PausedHost);
      fixture.detectChanges();

      fixture.componentInstance.paused = true;
      fixture.detectChanges();
      fixture.componentInstance.paused = false;
      fixture.detectChanges();

      expect(fade.pause).not.toHaveBeenCalled();
      expect(fade.play).not.toHaveBeenCalled();
      fixture.destroy();
    });
  });
});
