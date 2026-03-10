import React, { useState } from 'react';
import { ColorFromPalette } from '@udixio/theme';
import { kebabCase } from 'change-case';

type Props = {
  name: string;
  color: ColorFromPalette;
  onColor: ColorFromPalette;
  onSelect?: (name: string, color: ColorFromPalette) => void; // triggered on hover start (for tone highlight)
  onHoverEnd?: () => void; // triggered on hover end (for tone highlight)
};

export const ColorTokenCard: React.FC<Props> = ({
  name,
  onSelect,
  onColor,
  color,
  onHoverEnd,
}) => {
  const [copied, setCopied] = useState(false);
  const [inverted, setInverted] = useState(false);

  const base = kebabCase(name).replace(/^--color-/, '');
  const isOn = base.includes('on-');
  const bgBase = (isOn ? base.replace(/^on-/, '') : base).replace(
    'inverse-',
    '',
  );

  // Preview: when inverted, swap bg/fg to preview that token color
  let bg = inverted ? `var(--color-on-${bgBase})` : `var(--color-${bgBase})`;
  let fg = inverted ? `var(--color-${bgBase})` : `var(--color-on-${bgBase})`;
  if (base.includes('inverse')) {
    bg = inverted
      ? `var(--color-inverse-on-${bgBase})`
      : `var(--color-inverse-${bgBase})`;
    fg = inverted
      ? `var(--color-inverse-${bgBase})`
      : `var(--color-inverse-on-${bgBase})`;
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(color);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch (e) {
      // ignore
    }
  };

  return (
    <div
      onMouseEnter={() => {
        onSelect?.(name, color);
      }}
      onMouseLeave={() => {
        onHoverEnd?.();
      }}
      style={{
        background: bg,
        color: fg,
      }}
      className="relative h-full min-h-[100px] group cursor-pointer flex flex-col justify-between p-4 rounded-xl border border-outline-variant/50 transition-all duration-200 hover:shadow-md hover:scale-[1.02]"
      title={
        inverted
          ? 'Inversé: aperçu avec la clé on'
          : 'Aperçu de base: survolez pour mettre en évidence la tone correspondante'
      }
    >
      <div className="flex flex-col gap-1">
        <div className="text-label-large font-medium tracking-wide break-words">
          {name}
        </div>
        <div className="text-body-small opacity-80 font-mono text-xs">
          Tone: {inverted ? 'on-key' : Math.round(color.getTone())}
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pt-2">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setInverted((v) => !v);
          }}
          className="text-xs font-medium px-2.5 py-1.5 rounded-md border border-current/20 hover:bg-current/10 transition-colors"
          title={
            inverted
              ? "Désactiver l'inversion (afficher la clé de base)"
              : 'Inverser (afficher la clé on)'
          }
        >
          {inverted ? 'Reset' : 'Invert'}
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleCopy();
          }}
          className="text-xs font-medium px-2.5 py-1.5 rounded-md border border-current/20 hover:bg-current/10 transition-colors"
          title={
            inverted ? 'Copier le nom du token on' : 'Copier le nom du token'
          }
        >
          {copied ? 'Copié!' : inverted ? 'Copier “on”' : 'Copier'}
        </button>
      </div>
    </div>
  );
};

export default ColorTokenCard;
