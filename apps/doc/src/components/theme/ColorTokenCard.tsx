import React, { useState } from 'react';
import { ColorFromPalette } from '@udixio/theme';
import { kebabCase } from 'change-case';

type Props = {
  name: string;
  color: ColorFromPalette;
  onColor?: ColorFromPalette; // Unused
  onSelect?: (name: string, color: ColorFromPalette) => void;
  onHoverEnd?: () => void;
};

export const ColorTokenCard: React.FC<Props> = ({
  name,
  onSelect,
  color,
  onHoverEnd,
}) => {
  const [copiedType, setCopiedType] = useState<'hex' | 'var' | null>(null);

  const hex = color.getHex();
  const tone = Math.round(color.getTone());
  const cssVar = `--color-${kebabCase(name)}`;
  
  // Decide text color based on tone (light tone -> dark text, dark tone -> light text)
  const textColor = tone > 60 ? '#1f1f1f' : '#ffffff';
  const secondaryTextColor = tone > 60 ? '#4b4b4b' : '#d4d4d4';

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
      className="relative h-[110px] group flex flex-col justify-between p-4 rounded-xl border border-outline-variant/20 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:z-10"
    >
      <div className="flex flex-col gap-0.5">
        <div className="text-label-large font-bold tracking-wide break-words truncate" style={{ textShadow: tone > 60 ? 'none' : '0 1px 2px rgba(0,0,0,0.3)' }}>
          {name}
        </div>
        <div className="text-body-small font-mono text-[10px] break-words truncate" style={{ color: secondaryTextColor, textShadow: tone > 60 ? 'none' : '0 1px 2px rgba(0,0,0,0.3)' }}>
          var({cssVar})
        </div>
      </div>

      <div className="flex items-end justify-between">
        <div className="text-title-medium font-mono font-medium" style={{ textShadow: tone > 60 ? 'none' : '0 1px 2px rgba(0,0,0,0.3)' }}>
          {copiedType === 'hex' ? 'Copied!' : hex}
        </div>
        
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
           <button
             onClick={(e) => handleCopy(e, 'hex')}
             className="text-[10px] uppercase tracking-wider font-bold px-2 py-1.5 bg-black/10 hover:bg-black/20 rounded-lg backdrop-blur-sm transition-colors border border-white/10"
             style={{ color: textColor }}
             title="Copy HEX code"
           >
             Hex
           </button>
           <button
             onClick={(e) => handleCopy(e, 'var')}
             className="text-[10px] uppercase tracking-wider font-bold px-2 py-1.5 bg-black/10 hover:bg-black/20 rounded-lg backdrop-blur-sm transition-colors border border-white/10"
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
