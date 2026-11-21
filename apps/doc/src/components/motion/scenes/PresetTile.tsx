/**
 * One tile of the presets wall (`Presets.astro`, scene `presets.ts`): a Udixio Card in the mode of its role. A tile that
 * replays its preset is an interactive Card (one action target, Enter and Space included); the scrub tile is a Card link;
 * a loop, which runs by itself, is a plain Card. Its content (the specimen that carries the preset, then the name and
 * the verb) comes from the page and stays neutral markup: the scene animates the specimen, never the Card. The
 * `data-preset-tile` and `data-verb` hooks reach the scene's click listener, so a tile replays before the island hydrates.
 */
import type { ReactNode } from 'react';
import { Card } from '@udixio/ui-react';

type Props = {
  name: string;
  verb: string;
  role: 'button' | 'link' | 'box';
  /** Where a link tile leads. */
  href?: string;
  children?: ReactNode;
};

/**
 * The tile's own tone (one step under the specimens' highest surface, so a grey specimen still reads on it) and layout.
 * `relative` holds the Card's state layer on the tile.
 */
const tile = 'relative flex w-full min-w-0 flex-col items-start gap-3 rounded-2xl bg-surface-container-high p-4 text-start text-on-surface no-underline';

export function PresetTile({ name, verb, role, href, children }: Props) {
  const hooks = { 'data-preset-tile': name, 'data-verb': verb };
  if (role === 'link' && href) {
    return (
      <Card variant="filled" href={href} className={tile} {...hooks}>
        {children}
      </Card>
    );
  }
  return (
    <Card variant="filled" interactive={role === 'button'} className={tile} {...hooks}>
      {children}
    </Card>
  );
}
