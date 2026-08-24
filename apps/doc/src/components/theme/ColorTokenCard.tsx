import React, { useState } from 'react';
import type { Color } from '@udixio/theme';
import { kebabCase } from 'change-case';
import { Card, Icon } from '@udixio/ui-react';
import { iContentCopy } from '@udixio/icons-rounded-400/content_copy';
import { iContentCopyFilled } from '@udixio/icons-rounded-400/filled/content_copy';

type Props = {
  name: string;
  color: Color;
  onColor?: Color;
  onColorName?: string;
  onSelect?: (name: string, color: Color) => void;
  onHoverEnd?: () => void;
  usage?: string;
};

type TokenSwatchProps = {
  name: string;
  color: Color;
  copied: boolean;
  onCopy: (name: string, color: Color) => void;
  onSelect?: (name: string, color: Color) => void;
  onHoverEnd?: () => void;
  className?: string;
  compact?: boolean;
  textColorName?: string;
};

const TokenSwatch: React.FC<TokenSwatchProps> = ({
  name,
  color,
  copied,
  onCopy,
  onSelect,
  onHoverEnd,
  className,
  compact = false,
  textColorName,
}) => {
  const hex = color.hex ?? '';
  const tone = Math.round(color.tone);
  const cssVar = `--color-${kebabCase(name)}`;

  return (
    <button
      type="button"
      onClick={() => onCopy(name, color)}
      onMouseEnter={() => onSelect?.(name, color)}
      onMouseLeave={() => onHoverEnd?.()}
      style={{
        backgroundColor: `var(${cssVar})`,
        color: textColorName
          ? `var(--color-${kebabCase(textColorName)})`
          : tone > 60
            ? 'black'
            : 'white',
      }}
      className={`flex w-full text-left transition-opacity hover:opacity-90 ${compact ? 'flex-row items-center gap-2' : 'flex-col justify-between'} ${className ?? ''}`}
    >
      <span
        className={`text-label-medium truncate ${compact ? 'shrink-0' : ''}`}
      >
        {name}
      </span>

      <span
        className={`flex items-end justify-between gap-2 ${compact ? 'min-w-0 flex-1' : ''}`}
      >
        <span className="text-title-medium truncate">
          {copied ? 'Copied!' : hex}
        </span>

        <Icon
          icon={copied ? iContentCopyFilled : iContentCopy}
          className="size-4 shrink-0"
        />
      </span>
    </button>
  );
};

export const ColorTokenCard: React.FC<Props> = ({
  name,
  onSelect,
  color,
  onColor,
  onColorName,
  onHoverEnd,
}) => {
  const [copiedName, setCopiedName] = useState<string | null>(null);

  const handleCopy = async (tokenName: string, tokenColor: Color) => {
    try {
      await navigator.clipboard.writeText(tokenColor.hex ?? '');
      setCopiedName(tokenName);
      setTimeout(() => setCopiedName(null), 1200);
    } catch {
      // ignore
    }
  };

  const resolvedOnColorName = onColor
    ? (onColorName ?? `on${name.charAt(0).toUpperCase()}${name.slice(1)}`)
    : undefined;

  if (onColor && resolvedOnColorName) {
    return (
      <Card
        variant="outlined"
        className="grid h-[150px] grid-rows-[2fr_1fr] overflow-hidden p-0"
      >
        <TokenSwatch
          name={name}
          color={color}
          copied={copiedName === name}
          onCopy={handleCopy}
          onSelect={onSelect}
          onHoverEnd={onHoverEnd}
          className="min-h-0 px-4 py-3"
          textColorName={resolvedOnColorName}
        />
        <TokenSwatch
          name={resolvedOnColorName}
          color={onColor}
          copied={copiedName === resolvedOnColorName}
          onCopy={handleCopy}
          onSelect={onSelect}
          onHoverEnd={onHoverEnd}
          className="min-h-0 border-t border-current/20 px-3 py-2"
          compact
          textColorName={name}
        />
      </Card>
    );
  }

  return (
    <Card
      interactive
      variant="outlined"
      onClick={() => void handleCopy(name, color)}
      onMouseEnter={() => onSelect?.(name, color)}
      onMouseLeave={() => onHoverEnd?.()}
      style={{
        backgroundColor: `var(--color-${kebabCase(name)})`,
        color: Math.round(color.tone) > 60 ? 'black' : 'white',
      }}
      className="h-[110px] flex flex-col justify-between p-4"
    >
      <div className="text-label-medium truncate">{name}</div>

      <div className="flex items-end justify-between gap-2">
        <div className="text-title-medium truncate">
          {copiedName === name ? 'Copied!' : color.hex}
        </div>

        <Icon
          icon={copiedName === name ? iContentCopyFilled : iContentCopy}
          className="size-4 shrink-0"
        />
      </div>
    </Card>
  );
};
export default ColorTokenCard;
