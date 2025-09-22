# Introduction au PBR (Physically Based Rendering)

## Qu'est-ce que le PBR ?

Le **PBR (Physically Based Rendering)** est une approche de rendu 3D qui simule la façon dont la lumière interagit avec les surfaces dans le monde réel. Contrairement aux techniques de rendu traditionnelles, le PBR utilise des modèles mathématiques basés sur la physique pour produire des résultats plus réalistes et cohérents.

## Principes fondamentaux du PBR

### 1. Conservation de l'énergie
La lumière réfléchie ne peut jamais être plus intense que la lumière reçue. Un objet ne peut pas émettre plus de lumière qu'il n'en reçoit.

### 2. Propriétés des matériaux
Le PBR utilise principalement deux paramètres pour définir les surfaces :
- **Metalness (Métal)** : Définit si une surface est métallique (1.0) ou non-métallique (0.0)
- **Roughness (Rugosité)** : Définit si une surface est rugueuse (1.0) ou lisse (0.0)

### 3. Types de réflexion
- **Réflexion diffuse** : Lumière dispersée dans toutes les directions (surfaces mates)
- **Réflexion spéculaire** : Lumière réfléchie dans une direction précise (surfaces brillantes)

## Avantages du PBR

1. **Cohérence** : Les matériaux restent réalistes sous différents éclairages
2. **Prévisibilité** : Les artistes peuvent créer des matériaux qui se comportent de manière logique
3. **Interopérabilité** : Les matériaux PBR peuvent être échangés entre différents logiciels 3D
4. **Réalisme** : Rendu plus proche de la réalité physique

## Dans notre application

Notre système PBR gère :
- L'éclairage ambiant et directionnel
- Les matériaux métalliques avec différents niveaux de metalness/roughness
- Les environnements HDR pour des réflexions réalistes
- L'intégration avec le système de bloom pour les effets lumineux

Le PBR est essentiel pour donner à notre robot et aux éléments 3D un aspect professionnel et réaliste.