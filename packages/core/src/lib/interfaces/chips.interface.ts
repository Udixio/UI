import type { Icon } from '../icon';

// Ce que Chips a besoin de connaître pour (re)construire un Chip
export type ChipItem = {
  label: string;
  icon?: Icon;
  activated?: boolean;
  disabled?: boolean;
  variant?: 'outlined' | 'elevated';
  href?: string;
};

type ChipsVariant = 'input';

type Props = {
  /** Style du conteneur de chips */
  variant?: ChipsVariant;

  /** Active/masse un comportement de container (si utile) */
  scrollable?: boolean;

  draggable?: boolean; // optionnel

  /** Mode contrôlé: la source de vérité */
  items?: ChipItem[];

  /** Notifie toute modification de la liste (remove, toggle, etc.) */
  onItemsChange?: (next: ChipItem[]) => void;
};

type Elements = ['chips'];

export interface ChipsInterface {
  type: 'div';
  props: Props;
  // Pas d'état d'interaction. `object` (et non `Record<string, never>`) car ce
  // dernier rend la signature de style insatisfiable dans l'intersection.
  states: object;
  elements: Elements;
}
