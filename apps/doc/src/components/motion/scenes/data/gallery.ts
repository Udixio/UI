/**
 * The six thumbnails of the "Morph one into another" scene. Each has a shape of the Material 3 family (`shapePath` in
 * `lib/m3-shapes.ts`, computed at build time), a role, a sentence for its detail, and its theme colours: a container
 * colour and its `on-` colour, which the detail takes over when it opens.
 */

export type GalleryRole = 'primary' | 'secondary' | 'tertiary' | 'neutral';

export type GalleryItem = {
  name: string;
  role: GalleryRole;
  /** The shape's lobes, depth and phase, as `shapePath` takes them. */
  shape: { n: number; d: number; phi: number };
  /** One sentence, shown in the detail in the `on-` colour. */
  text: string;
  /** The container and `on-` colours, as theme token classes. */
  colours: string;
};

export const GALLERY_ITEMS: GalleryItem[] = [
  {
    name: 'Cookie',
    role: 'primary',
    shape: { n: 9, d: 0.12, phi: 0 },
    text: 'A soft lobed shape, for an action that is friendly.',
    colours: 'bg-primary-container text-on-primary-container',
  },
  {
    name: 'Flower',
    role: 'tertiary',
    shape: { n: 8, d: 0.22, phi: 0 },
    text: 'Eight petals, for a choice that opens out.',
    colours: 'bg-tertiary-container text-on-tertiary-container',
  },
  {
    name: 'Clover',
    role: 'secondary',
    shape: { n: 4, d: 0.3, phi: 0 },
    text: 'Four lobes, for a choice among a few.',
    colours: 'bg-secondary-container text-on-secondary-container',
  },
  {
    name: 'Sunny',
    role: 'primary',
    shape: { n: 12, d: 0.08, phi: 0 },
    text: 'Shallow rays, for something to notice.',
    colours: 'bg-primary text-on-primary',
  },
  {
    name: 'Burst',
    role: 'tertiary',
    shape: { n: 16, d: 0.16, phi: 0 },
    text: 'Sharp points, for an alert that needs attention.',
    colours: 'bg-tertiary text-on-tertiary',
  },
  {
    name: 'Circle',
    role: 'neutral',
    shape: { n: 0, d: 0, phi: 0 },
    text: 'The plain shape, to hold everything else.',
    colours: 'bg-surface-container-highest text-on-surface',
  },
];

/** The filters of the tab bar on a need page, in order, with their label. */
export const GALLERY_FILTERS: { role: GalleryRole | 'all'; label: string }[] = [
  { role: 'all', label: 'All' },
  { role: 'primary', label: 'Primary' },
  { role: 'secondary', label: 'Secondary' },
  { role: 'tertiary', label: 'Tertiary' },
  { role: 'neutral', label: 'Neutral' },
];
