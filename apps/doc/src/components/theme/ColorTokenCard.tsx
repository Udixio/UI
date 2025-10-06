import React, { useState } from 'react';

type Props = {
  name: string; // CSS variable name, e.g. --color-primary
  onSelect?: (name: string) => void; // triggered on hover start
  onHoverEnd?: () => void; // triggered on hover end
};

export const ColorTokenCard: React.FC<Props> = ({ name, onSelect, onHoverEnd }) => {
  const [copied, setCopied] = useState(false);

  const base = name.replace(/^--color-/, '');
  const isOn = base.startsWith('on-');
  const bgBase = isOn ? base.replace(/^on-/, '') : base;
  const bg = `var(--color-${bgBase})`;
  const on = `var(--color-on-${bgBase})`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(name);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch (e) {
      // ignore
    }
  };

  return (
    <div
      onMouseEnter={() => onSelect?.(name)}
      onMouseLeave={() => onHoverEnd?.()}
      style={{
        background: isOn ? bg : `var(${name})`,
        color: on,
      }}
      className="group cursor-pointer flex items-center gap-3 p-4 rounded-lg border border-outline-variant bg-surface-container transition-all duration-300 hover:scale-[1.01]"
      title="Survoler pour mettre en évidence la tone correspondante"
    >
      <div className="min-w-0 flex-1">
        <div className="text-label-large">{base}</div>
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation();
          handleCopy();
        }}
        className="opacity-70 group-hover:opacity-100 text-xs px-2 py-1 rounded border border-outline-variant/40"
        title="Copier le nom du token"
      >
        {copied ? 'Copié' : 'Copier'}
      </button>
    </div>
  );
};

export default ColorTokenCard;
