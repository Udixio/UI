import { createStateLayerController } from '@udixio/core/dom';
import React, { useEffect, useRef } from 'react';

interface RippleEffectProps {
  triggerRef: React.RefObject<any> | React.ForwardedRef<any>;
  colorName?: string;
}

const RippleEffect: React.FC<RippleEffectProps> = ({
  colorName = 'on-surface',
  triggerRef,
}) => {
  const layerRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (typeof triggerRef === 'function') {
      return;
    }
    const trigger = triggerRef?.current;
    const layer = layerRef.current;
    if (!trigger || !layer) {
      return;
    }

    const controller = createStateLayerController({ trigger, layer });
    return () => controller.destroy();
  }, [triggerRef]);

  return (
    <span
      ref={layerRef}
      aria-hidden="true"
      className="absolute inset-0 h-full w-full pointer-events-none overflow-hidden"
      style={{
        ['--state-color' as string]: `var(--color-${colorName})`,
      }}
    />
  );
};

export default RippleEffect;
