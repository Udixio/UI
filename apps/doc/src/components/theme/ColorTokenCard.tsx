import React, { useState } from 'react';
import { ColorFromPalette } from '@udixio/theme';
import { kebabCase } from 'change-case';

type Props = {
  name: string;
  color: ColorFromPalette;
  onColor?: ColorFromPalette; // Unused
  onSelect?: (name: string, color: ColorFromPalette) => void;
  onHoverEnd?: () => void;
  usage?: string;
};

export const ColorTokenCard: React.FC<Props> = ({
  name,
  onSelect,
  color,
  onHoverEnd,
  usage,
}) => {
  const [copiedType, setCopiedType] = useState<'hex' | 'var' | null>(null);

  const hex = color.getHex();
  const tone = Math.round(color.getTone());
  const cssVar = `--color-${kebabCase(name)}`;
  
  const textColor = tone > 60 ? 'black' : 'white';

  const handleCopy = async (e: React.MouseEvent, type: 'hex' | 'var') => {
    e.stopPropagation();
    try {
      const textToCopy = type === 'hex' ? hex : `var(${cssVar})`;
      await navigator.clipboard.writeText(textToCopy!);
      setCopiedType(type);
      setTimeout(() => setCopiedType(null), 1200);
    } catch (e) {
      // ignore
    }
  };

  return (
    <div
      onMouseEnter={() => onSelect?.(name, color)}
      onMouseLeave={() => onHoverEnd?.()}
      style={{
        backgroundColor: `var(${cssVar})`,
        color: textColor,
      }}
      className="relative h-[110px] group flex flex-col justify-between p-4 rounded-xl border border-outline-variant transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:z-10"
    >
      <div className="flex flex-col gap-0.5">
        <div className="text-label-large font-bold tracking-wide break-words truncate" style={{ textShadow: tone > 60 ? undefined : '0 1px 2px rgb(0 0 0 / 30%)' }}>
          {name}
        </div>
        <div className="text-body-small font-mono text-[10px] break-words truncate opacity-70" style={{ textShadow: tone > 60 ? undefined : '0 1px 2px rgb(0 0 0 / 30%)' }}>
          var({cssVar})
        </div>
      </div>

      <div className="flex items-end justify-between gap-2">
        <div className="text-title-medium font-mono font-medium shrink-0" style={{ textShadow: tone > 60 ? undefined : '0 1px 2px rgb(0 0 0 / 30%)' }}>
          {copiedType === 'hex' ? 'Copied!' : hex}
        </div>
        {usage && (
          <div className="text-[9px] italic text-right leading-tight opacity-70 truncate">
            {usage}
          </div>
        )}

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
           <button
             onClick={(e) => handleCopy(e, 'hex')}
             className="text-[10px] uppercase tracking-wider font-bold px-2 py-1.5 bg-current/10 hover:bg-current/20 rounded-lg backdrop-blur-sm transition-colors border border-current/10"
             style={{ color: textColor }}
             title="Copy HEX code"
           >
             Hex
           </button>
           <button
             onClick={(e) => handleCopy(e, 'var')}
             className="text-[10px] uppercase tracking-wider font-bold px-2 py-1.5 bg-current/10 hover:bg-current/20 rounded-lg backdrop-blur-sm transition-colors border border-current/10"
             style={{ color: textColor }}
             title="Copy CSS variable"
           >
             {copiedType === 'var' ? 'Copied' : 'Var'}
           </button>
        </div>
      </div>
    </div>
  );
};
export default ColorTokenCard;
