# Guide de l'Onglet PBR dans le Debug Panel

## Vue d'ensemble

L'onglet PBR du Debug Panel offre un contrôle complet sur l'éclairage et les matériaux de la scène 3D. Il permet d'ajuster en temps réel l'apparence visuelle du robot et de ses éléments métalliques.

## Structure de l'interface

### 1. Presets d'éclairage (9 options)

Chaque preset est optimisé pour un cas d'usage spécifique :

#### **Sombre (V6 Actuel)**
- Éclairage faible d'origine
- Ambiance sombre et mystérieuse
- Idéal pour les effets de bloom prononcés

#### **Normal (Équilibré)**
- Éclairage équilibré (+87% par rapport à V6)
- Bon compromis entre visibilité et ambiance
- Recommandé pour l'utilisation générale

#### **Lumineux (Élevé)**
- Éclairage très lumineux (+337%)
- Maximum de visibilité
- Pour examiner les détails

#### **PBR Optimisé**
- Éclairage PBR avancé (+462%)
- Utilise le tone mapping AgX HDR
- Rendu photoréaliste optimal

#### **PBR+Métallique**
- PBR avec matériaux métalliques automatiques
- Applique metalness/roughness optimaux
- Pour showcase de surfaces métalliques

#### **Texture Detail**
- PBR + système Three-Point Lighting
- Éclairage à 3 points (Key, Fill, Rim)
- Révèle tous les détails de texture

#### **Chrome Showcase**
- Optimisé pour surfaces chrome
- Utilise des Area Lights (lumières surfaciques)
- Réflexions douces et réalistes

#### **Studio Pro**
- Éclairage studio professionnel complet
- Combine tous les systèmes d'éclairage
- Pour rendus de qualité production

#### **Métallique Ultra**
- Visibilité maximale des détails métalliques
- Boost extrême de l'éclairage
- Pour debug et inspection détaillée

### 2. Contrôles en temps réel

#### **Multiplicateurs globaux**

**Lumière Ambiante (0.1 - 100.0)**
- Contrôle l'intensité de la lumière ambiante
- Affecte l'éclairage global de la scène
- Valeurs élevées = scène plus lumineuse uniformément

**Lumière Directionnelle (0.1 - 5.0)**
- Contrôle l'intensité de la lumière principale
- Simule la lumière du soleil
- Crée des ombres et du contraste

#### **Propriétés des matériaux**

**Metalness (0.0 - 1.0)**
- 0.0 = Surface non-métallique (plastique, bois)
- 1.0 = Surface 100% métallique
- Affecte la façon dont la lumière est réfléchie

**Roughness (0.0 - 1.0)**
- 0.0 = Surface parfaitement lisse (miroir)
- 1.0 = Surface très rugueuse (matte)
- Contrôle la netteté des réflexions

### 3. Presets rapides de matériaux

#### **Mat**
- Metalness: 0.2, Roughness: 0.8
- Surface mate avec peu de réflexions
- Style plastique ou caoutchouc

#### **Brossé**
- Metalness: 0.5, Roughness: 0.4
- Métal brossé semi-brillant
- Style aluminium brossé

#### **Chrome**
- Metalness: 0.9, Roughness: 0.1
- Surface chrome très réfléchissante
- Réflexions nettes et brillantes

### 4. Boutons d'action

#### **Reset V6**
- Retour aux paramètres d'origine
- Annule tous les changements
- Utile si vous vous êtes perdu dans les réglages

#### **Debug**
- Affiche les informations techniques dans la console
- Liste tous les matériaux affectés
- Montre les valeurs actuelles des paramètres

## Utilisation recommandée

1. **Pour commencer** : Essayez d'abord les presets pour trouver l'ambiance générale
2. **Affinage** : Utilisez les sliders pour ajuster finement
3. **Matériaux** : Appliquez les presets de matériaux pour changer l'aspect métallique
4. **Test** : Utilisez le bouton Debug pour vérifier les changements

## Impact sur les performances

- Les presets simples (Sombre, Normal) ont peu d'impact
- Les presets avancés (Studio Pro, Chrome Showcase) peuvent réduire les FPS
- L'activation du HDR augmente la consommation mémoire
- Les Area Lights sont plus coûteuses en calcul

## Conseils

- Pour les screenshots : utilisez "PBR Optimisé" ou "Studio Pro"
- Pour le développement : "Normal" ou "Lumineux" pour bien voir
- Pour les démos : "Chrome Showcase" impressionne toujours
- Si les FPS chutent : revenez à "Sombre" ou "Normal"