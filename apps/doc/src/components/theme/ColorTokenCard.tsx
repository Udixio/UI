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
      className="h-full group cursor-pointer flex flex-col gap-3 p-4 rounded-lg border border-outline-variant bg-surface-container transition-all duration-300 hover:scale-[1.01]"
      title={
        inverted
          ? 'Inversé: aperçu avec la clé on'
          : 'Aperçu de base: survolez pour mettre en évidence la tone correspondante'
      }
    >
      <div className="min-w-0 flex-1">
        <div className="text-label-large">{name}</div>
        <div className="text-body-small ">
          Tone:{' '}
          {inverted
            ? 'Affichage de la clé on (inversé)'
            : Math.round(color.getTone())}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setInverted((v) => !v);
          }}
          className="opacity-80 group-hover:opacity-100 text-xs px-2 py-1 rounded border border-outline-variant/40 hover:bg-surface-container-high"
          title={
            inverted
              ? "Désactiver l'inversion (afficher la clé de base)"
              : 'Inverser (afficher la clé on)'
          }
        >
          {inverted ? 'Désinverser' : 'Inverser'}
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleCopy();
          }}
          className="opacity-80 group-hover:opacity-100 text-xs px-2 py-1 rounded border border-outline-variant/40"
          title={
            inverted ? 'Copier le nom du token on' : 'Copier le nom du token'
          }
        >
          {copied ? 'Copié' : inverted ? 'Copier “on”' : 'Copier'}
        </button>
      </div>
    </div>
  );
};

export default ColorTokenCard;
