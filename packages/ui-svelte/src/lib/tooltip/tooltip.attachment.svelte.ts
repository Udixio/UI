import { mount, unmount, untrack } from 'svelte';
import type { Attachment } from 'svelte/attachments';
import {
  mergeClassNames,
  type AnchorPositionAxis,
  tooltipStyle,
  type TooltipInteractionState,
  type TooltipInterface,
  type TooltipTriggerKind,
} from '@udixio/core';
import {
  createTooltipTransitionController,
  createTooltipTriggerController,
  type TooltipTransitionController,
} from '@udixio/core/dom';
import TooltipSurface from './TooltipSurface.svelte';
import type { SvelteTooltipSurfaceProps } from './tooltip-surface.types';
import type { SvelteTooltipProps } from './tooltip.types';

let nextTooltipId = 0;

const hasContent = (options: SvelteTooltipProps): boolean => {
  const buttons = options.buttons;
  return !!(
    options.text ||
    options.title ||
    options.content ||
    (Array.isArray(buttons) ? buttons.length > 0 : !!buttons)
  );
};

/**
 * Attaches a tooltip to the element it is placed on -- the Svelte counterpart
 * of the Angular directive. Options are read through a function so the
 * attachment survives their changes: the trigger listeners and the mounted
 * surface stay, only their inputs update.
 *
 * ```svelte
 * <Button label="Copy" {@attach tooltip(() => ({ text: 'Copy to clipboard' }))} />
 * ```
 */
export function tooltip(options: () => SvelteTooltipProps): Attachment<HTMLElement> {
  return (target) => {
    const generatedId = `tooltip-${nextTooltipId++}`;

    // Everything the surface and the controllers read is derived from the
    // options getter, inside this attachment's own effect scope.
    const resolved = $derived.by(options);
    const active = $derived(hasContent(resolved));
    const variant = $derived(resolved.variant ?? 'plain');
    const toolbarAutoAxis = $derived.by<AnchorPositionAxis | undefined>(() => {
      const orientation = target
        .closest<HTMLElement>('[data-udx-toolbar-orientation]')
        ?.getAttribute('data-udx-toolbar-orientation');
      return orientation === 'vertical'
        ? 'horizontal'
        : orientation === 'horizontal'
          ? 'vertical'
          : undefined;
    });
    const effectivePosition = $derived(
      resolved.position ??
        (toolbarAutoAxis
          ? 'auto'
          : variant === 'rich'
            ? 'bottom-right'
            : 'bottom'),
    );
    const effectiveAutoAxis = $derived(
      resolved.autoAxis ?? toolbarAutoAxis ?? 'vertical',
    );
    const resolvedId = $derived(resolved.id ?? generatedId);
    const isControlled = $derived(resolved.open !== undefined);

    let interactionState = $state<TooltipInteractionState>('hidden');
    let suppressedByPeer = $state(false);
    const resolvedState = $derived<TooltipInteractionState>(
      isControlled ? (resolved.open ? 'hovered' : 'hidden') : interactionState,
    );
    const resolvedOpen = $derived(resolvedState !== 'hidden' && !suppressedByPeer);

    const styles = $derived(
      tooltipStyle({
        variant,
        title: resolved.title,
        text: resolved.text,
        position: effectivePosition,
        trigger:
          resolved.trigger === undefined
            ? ['hover', 'focus']
            : resolved.trigger,
        describeTarget: resolved.describeTarget ?? true,
        openDelay: resolved.openDelay ?? 400,
        closeDelay: resolved.closeDelay ?? 150,
        open: resolved.open,
        defaultOpen: resolved.defaultOpen ?? false,
        id: resolved.id,
        transition: resolved.transition,
        isOpen: resolvedOpen,
        className: mergeClassNames<TooltipInterface>('toolTip', resolved.classes, resolved.class),
      }),
    );

    let triggerController: ReturnType<typeof createTooltipTriggerController> | undefined;

    // The surface's props object is reactive, so the mounted component follows
    // every change without being re-mounted.
    const surfaceProps = $state<SvelteTooltipSurfaceProps>({
      anchor: target,
      surfaceId: generatedId,
      position: 'bottom',
      autoAxis: 'vertical',
      isOpen: false,
      styles: {},
      onSurfaceHovered: (hovered) => triggerController?.setSurfaceHovered(hovered),
    });

    $effect(() => {
      surfaceProps.anchor = resolved.anchor ?? target;
      surfaceProps.surfaceId = resolvedId;
      surfaceProps.position = effectivePosition;
      surfaceProps.autoAxis = effectiveAutoAxis;
      surfaceProps.title = resolved.title;
      surfaceProps.text = resolved.text;
      surfaceProps.buttons = resolved.buttons;
      surfaceProps.content = resolved.content;
      surfaceProps.isOpen = resolvedOpen;
      surfaceProps.styles = styles;
    });

    // The surface and the trigger wiring exist only while there is something
    // to show, as in Angular: an attachment with empty options is inert.
    $effect(() => {
      if (!active) return;
      const surface = mount(TooltipSurface, { target: document.body, props: surfaceProps });
      let transitionController: TooltipTransitionController | undefined;
      let appliedOpen: boolean | undefined;

      const controller = createTooltipTriggerController({
        target,
        tooltipId: untrack(() => resolvedId),
        triggers: () => {
          const value = untrack(() => resolved.trigger);
          if (value === undefined) return ['hover', 'focus'];
          const list = Array.isArray(value) ? value : [value];
          return list.filter((item): item is TooltipTriggerKind => item != null);
        },
        openDelay: () => untrack(() => resolved.openDelay) ?? 400,
        closeDelay: () => untrack(() => resolved.closeDelay) ?? 150,
        describeTarget: () => untrack(() => resolved.describeTarget) ?? true,
        isControlled: () => untrack(() => isControlled),
        onStateChange: (next, suppressed) => {
          if (!untrack(() => isControlled)) interactionState = next;
          suppressedByPeer = suppressed;
          untrack(() => resolved.onOpenChange)?.(next !== 'hidden');
        },
      });
      triggerController = controller;
      if (untrack(() => resolved.defaultOpen) && !untrack(() => isControlled)) {
        interactionState = 'hovered';
      }

      // Mirror the resolved state back into the machine: controlled, this is
      // how it learns the owner's answer; uncontrolled it echoes its own.
      $effect(() => {
        controller.setControlledState(resolvedState);
      });

      $effect(() => {
        const element = surface.getSurfaceElement();
        if (!element) return;
        const created = createTooltipTransitionController({
          element,
          transition: untrack(() => resolved.transition),
        });
        transitionController = created;
        appliedOpen = untrack(() => resolvedOpen);
        created.setOpen(appliedOpen, true);
        return () => {
          created.destroy();
          if (transitionController === created) transitionController = undefined;
        };
      });

      $effect(() => {
        if (!transitionController || resolvedOpen === appliedOpen) return;
        appliedOpen = resolvedOpen;
        transitionController.setOpen(resolvedOpen);
      });

      return () => {
        controller.destroy();
        if (triggerController === controller) triggerController = undefined;
        unmount(surface);
      };
    });
  };
}
