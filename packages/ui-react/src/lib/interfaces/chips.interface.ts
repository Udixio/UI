import { ActionOrLink } from '../utils';
import type { Icon } from '../icon';

// Ce que Chips a besoin de connaître pour (re)construire un Chip
export type ChipItem = {
  id: string | number; // clé stable
  label: string;
  icon?: Icon;
  activated?: boolean;
  disabled?: boolean;
  variant?: 'outlined' | 'elevated';
  href?: string; // si tu utilises ActionOrLink côté Chip
  draggable?: boolean; // optionnel
};

type ChipsVariant = 'input';

type Props = {
  /** Style du conteneur de chips */
  variant?: ChipsVariant;

  /** Active/masse un comportement de container (si utile) */
  scrollable?: boolean;

  /** Mode contrôlé: la source de vérité */
  items?: ChipItem[];

  /** Mode non contrôlé: valeur initiale */
  defaultItems?: ChipItem[];

  /** Notifie toute modification de la liste (remove, toggle, etc.) */
  onItemsChange?: (next: ChipItem[]) => void;
};

type Elements = ['chips'];

export type ChipsInterface = ActionOrLink<Props> & {
  elements: Elements;
  states: {};
};
