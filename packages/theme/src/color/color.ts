/**
 * Point d'entrée historique des couleurs.
 *
 * Les implémentations sont séparées par stratégie ; ce fichier conserve le
 * chemin d'import existant (`./color`) et ré-exporte toute l'API couleur.
 */
export * from './color.base';
export * from './color.types';
export * from './color.from-hex';
export * from './color.alias';
export * from './color.from-palette';
