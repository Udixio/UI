import React, { useState } from 'react';
import type { Color } from '@udixio/theme';
import { kebabCase } from 'change-case';
import { Card, Icon } from '@udixio/ui-react';
import { iContentCopy } from '@udixio/icons-rounded-400/content_copy';
import { iContentCopyFilled } from '@udixio/icons-rounded-400/filled/content_copy';

type Props = {
  name: string;
  color: Color;
  onColor?: Color; // Unused
  onSelect?: (name: string, color: Color) => void;
  onHoverEnd?: () => void;
  usage?: string;
};

export const ColorTokenCard: React.FC<Props> = ({
  name,
  onSelect,
  color,
  onHoverEnd,
}) => {
  const [copied, setCopied] = useState(false);

  const hex = color.hex;
  const tone = Math.round(color.tone);
  const cssVar = `--color-${kebabCase(name)}`;

  const textColor = tone > 60 ? 'black' : 'white';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(hex!);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch (e) {
      // ignore
    }
  };

  return (
    <Card
      interactive
      variant="outlined"
      onClick={handleCopy}
      onMouseEnter={() => onSelect?.(name, color)}
      onMouseLeave={() => onHoverEnd?.()}
      style={{
        backgroundColor: `var(${cssVar})`,
        color: textColor,
      }}
      className="h-[110px] flex flex-col justify-between p-4"
    >
      <div className="text-label-medium truncate">{name}</div>

      <div className="flex items-end justify-between gap-2">
        <div className="text-title-medium truncate">
          {copied ? 'Copied!' : hex}
        </div>

        <Icon
          icon={copied ? iContentCopyFilled : iContentCopy}
          className="size-4 shrink-0"
        />
      </div>
    </Card>
  );
};
export default ColorTokenCard;
