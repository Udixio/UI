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

  /** Notifie toute modification de la liste (remove, toggle, etc.) */
  onItemsChange?: (next: ChipItem[]) => void;

  /**
   * Hook appelé lorsqu'un nouvel item est créé (par clic dans la zone vide en variant="input").
   * Retournez des props supplémentaires à fusionner dans l'item créé (ex: icône, disabled, variant...).
   */
  onCreate?: (ctx: { id: ChipItem['id'] }) => Partial<ChipItem> | void;

  /** Notifié immédiatement au démarrage de la création (après insertion dans la liste). */
  onCreateStart?: (item: ChipItem) => void;

  /** Notifié quand l'édition de création est validée (label non vide). */
  onCreateCommit?: (item: ChipItem) => void;

  /** Notifié quand la création est annulée (ou label vide). */
  onCreateCancel?: (id: ChipItem['id']) => void;
};

type Elements = ['chips'];

export type ChipsInterface = ActionOrLink<Props> & {
  elements: Elements;
  states: {};
};
