# J3, étape 1 : thèse (accessibilité, troubles vestibulaires)

## Thèse

Le mouvement est une couche posée sur un état final déjà correct, jamais un défaut qu'on retire ensuite.

1. **Socle d'abord.** Texte, focus, `aria-*` et ordre de lecture sont écrits et testés à l'état statique. Le mouvement n'existe que sous `prefers-reduced-motion: no-preference`.
2. **La décision vit dans le cœur, pas dans le composant.** Une politique unique, résolue une fois : `matchMedia` plus un réglage du site posé en `data-motion` sur `<html>`. Chaque îlot Astro la lit seul, sans contexte partagé.
3. **Intention, pas trajectoire.** Une animation déclare entrer, sortir, mettre en valeur, boucler ou suivre le scroll. La politique choisit le rendu : trajectoire, fondu seul ou instantané.
4. **Invariants garantis par le cœur.** État DOM, focus et `aria-expanded` changent de façon synchrone. Une animation ne retarde jamais une action ni une annonce. Une sortie passe en `inert` avant de démarrer.
5. **Pause incluse dans l'API.** Tout mouvement qui boucle, dure plus de 5 s ou démarre sans action de l'utilisateur (WCAG 2.2.2) reçoit un contrôleur de pause. « Pause au survol » seul ne suffit pas : le clavier doit pouvoir la déclencher.
6. **Défaut sûr.** Parallaxe et effets liés au scroll sont désactivés par défaut et s'activent par leur nom.
7. **Pourquoi.** La désactivation composant par composant n'est faite à grande échelle, ni par les humains ni par les agents qui reproduisent le motif le plus fréquent. Un contrat unique rend l'oubli impossible ou visible.
8. **Sur les préférences du porteur.** anime.js reste au choix de J1, à une condition : la politique est au-dessus du moteur et aucune option moteur ne la contourne. Tailwind peut servir à la couche CSS (`motion-safe:` est le bon sens), mais rien n'oblige à l'utiliser : un `animate-*` nu s'applique sans condition, donc la règle reste à la charge du développeur.

## Exemples

### 1. Panneau d'aide qui s'ouvre (cas nominal, intention `reveal`)

```
état          normal                            réduit
DOM           aria-expanded=true                aria-expanded=true     (synchrone)
focus         1er champ, immédiat               1er champ, immédiat    (synchrone)
rendu         glisse 200 ms + fondu             fondu seul 120 ms      (ou instantané)
fermeture     inert au clic, hidden à la fin    idem, durée 0 possible
retour focus  déclencheur, immédiat             déclencheur, immédiat
```

En fermeture, le panneau reste visible pendant le fondu mais devient `inert` dès le clic : le clavier ne peut plus atteindre un élément qui disparaît. Test de vérification : retirer CSS et JS d'animation doit donner exactement le même état final.

### 2. Toast à fermeture automatique (contre-exemple)

Version typique : entrée animée depuis le bord, fermeture après 5 s, pause au `mouseenter` seulement.

- Clavier : le focus sur « Annuler » ne suspend pas le délai (WCAG 2.2.1 échoué).
- Le message est inséré au même instant que son animation d'entrée : l'annonce n'est pas garantie (4.1.3).
- Si le toast recouvre un champ focalisé, il le masque (2.4.11, niveau AA).

Correction imposée par le cœur : région `role="status"` présente dès le chargement, délai suspendu par focus, survol ou pause explicite, entrée en fondu sans déplacement quand la politique est réduite.

### 3. Carrousel auto-défilant, spinner, compteur (cas limites, contrat typé)

```ts
// Boucle : le contrôleur de pause est requis, pas optionnel
type LoopMotion = { intent: 'loop'; every: number; pause: PauseHandle };
// Non réductible : une raison écrite est requise
type EssentialMotion = { intent: 'progress'; essential: { reason: string } };

motion.loop({ target: slides, every: 4000 });
// erreur de build : propriété « pause » manquante
```

- Carrousel réduit : une diapositive visible, précédent et suivant accessibles.
- Spinner (essentiel, `reason` obligatoire) : réduit en icône statique avec le texte « Chargement… » et `aria-busy`.
- Compteur animé (une seule fois) : réduit, valeur finale immédiate, annoncée une fois, jamais à chaque image.
