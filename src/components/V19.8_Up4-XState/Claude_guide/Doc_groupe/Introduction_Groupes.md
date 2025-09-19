# Introduction au Système de Groupes

## Vue d'ensemble

Le système de groupes dans notre application organise et contrôle différents éléments visuels de la scène 3D. Il existe deux types principaux de groupes :

1. **Groupes de Bloom** : Gèrent les effets lumineux du robot
2. **Groupes de Particules** : Organisent le comportement des particules

## Groupes de Bloom

### Définition
Les groupes de bloom contrôlent les éléments qui émettent de la lumière dans la scène. Ils permettent de créer des effets lumineux spectaculaires comme des halos, des lueurs et des rayonnements.

### Les 4 groupes principaux

1. **Eye Rings (Anneaux oculaires)**
   - Cercles lumineux autour de l'œil du robot
   - Effet de halo technologique
   - Couleur par défaut : vert cyan (0x00ff88)

2. **Iris**
   - Centre lumineux de l'œil
   - Point focal du regard
   - Intensité variable selon l'état

3. **Magic/Reveal Rings**
   - Anneaux magiques qui apparaissent/disparaissent
   - Effets de transition et d'animation
   - Synchronisés avec les mouvements

4. **Arms (Bras)**
   - Éléments lumineux sur les bras
   - Accentuent les mouvements
   - Créent des traînées lumineuses

## Groupes de Particules

### Définition
Les groupes de particules organisent des ensembles de particules qui se comportent collectivement selon des règles définies.

### Comportements de groupe

1. **Flock (Essaim)**
   - Les particules se déplacent ensemble
   - Simule un vol d'oiseaux ou un banc de poissons
   - Maintiennent cohésion et séparation

2. **Orbit (Orbite)**
   - Rotation autour d'un centre commun
   - Trajectoires circulaires ou elliptiques
   - Vitesse synchronisée

3. **Wander (Errance)**
   - Mouvement aléatoire mais groupé
   - Exploration collective de l'espace
   - Maintien d'une distance relative

## Importance des groupes

Les groupes permettent :
- **Organisation** : Structure claire des éléments visuels
- **Performance** : Optimisation par traitement groupé
- **Contrôle** : Ajustements par catégorie
- **Cohérence** : Comportements unifiés
- **Flexibilité** : Modifications globales faciles

## Dans l'interface

L'onglet "Groups" du Debug Panel offre :
- Contrôle de l'exposition générale
- Ajustement du bloom par groupe
- Modes de sécurité (couleurs prédéfinies)
- Visualisation de l'état des groupes

Cette organisation en groupes est fondamentale pour créer une expérience visuelle riche et contrôlée.