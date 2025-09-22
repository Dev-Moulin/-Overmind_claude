# Architecture Technique du Système PBR

## Vue d'ensemble

Le système PBR est composé de plusieurs éléments interconnectés qui travaillent ensemble pour créer un rendu réaliste.

## Composants principaux

### 1. PBRLightingController

**Localisation** : `/systems/lightingSystems/PBRLightingController.js`

**Responsabilités** :
- Gestion des presets d'éclairage
- Contrôle des lumières (ambient, directional, point, area)
- Application des propriétés PBR aux matériaux
- Coordination avec les systèmes HDR et Bloom

**Structure des presets** :
```javascript
{
  name: 'pbr',
  label: 'PBR Optimisé',
  ambient: {
    color: 0x404040,
    intensity: 4.25,
    intensityMultiplier: 2.5
  },
  directional: {
    color: 0xffffff,
    intensity: 5.375,
    intensityMultiplier: 1.25
  },
  pbr: {
    enabled: true,
    toneMapping: 'AgX',
    requiresHDREnvironment: true
  }
}
```

### 2. Interface Debug Panel

**Localisation** : `/components/DebugPanel.jsx`

**Éléments de l'onglet PBR** :
- Sélecteur de presets
- Sliders pour multiplicateurs
- Contrôles metalness/roughness
- Boutons preset matériaux
- Actions (Reset, Debug)

### 3. Système de lumières

#### Types de lumières gérées :

**AmbientLight**
- Éclairage global uniforme
- Pas d'ombres
- Base de l'éclairage

**DirectionalLight**
- Simule le soleil
- Crée des ombres
- Direction fixe

**PointLight** (Three-Point System)
- Key Light : Lumière principale
- Fill Light : Remplissage des ombres
- Rim Light : Contour/silhouette

**RectAreaLight**
- Lumière surfacique douce
- Simule fenêtres/softboxes
- Réflexions réalistes

### 4. Matériaux cibles

Le système PBR modifie spécifiquement ces matériaux :
- `Material-metal050-effet-chrome`
- `Material-Metal027`
- `metalgrid3`

Ces matériaux sont identifiés et modifiés dynamiquement lors des changements de preset.

### 5. Intégration HDR

**WorldEnvironmentController** fournit :
- Environnements HDR pour réflexions
- PMREM (Prefiltered Radiance Environment Maps)
- Coordination de l'intensité environnementale

### 6. Système Anti-Flash

**Problème résolu** : Les matériaux métalliques peuvent "flasher" sous certains éclairages

**Solution** :
```javascript
enableAntiFlashHDRMode() {
  // Boost HDR pour éléments bloom
  // Normalise autres éléments
  // Empêche surexposition
}
```

## Flux de données

1. **Utilisateur** sélectionne un preset dans Debug Panel
2. **DebugPanel** appelle `handlePresetChange()`
3. **PBRLightingController** :
   - Charge la configuration du preset
   - Met à jour les lumières
   - Applique les propriétés aux matériaux
   - Coordonne avec HDR si nécessaire
4. **Three.js** re-rend la scène avec nouveaux paramètres

## État et persistance

L'état PBR est maintenu dans React :
```javascript
const [pbrState, setPbrState] = useState({
  currentPreset: 'sombre',
  ambientMultiplier: 1.0,
  directionalMultiplier: 1.0,
  customExposure: 1.0,
  metalness: 0.8,
  roughness: 0.2
});
```

## Optimisations

1. **Mise à jour sélective** : Seuls les matériaux concernés sont modifiés
2. **Cache des configurations** : Les presets sont pré-calculés
3. **Throttling** : Les sliders utilisent un debounce pour limiter les updates
4. **Lazy loading** : Les systèmes avancés (Area Lights) ne sont créés qu'au besoin

## Points d'extension

Le système est conçu pour être extensible :
- Ajout de nouveaux presets dans `LIGHTING_PRESETS`
- Nouveaux types de lumières via `createAdvancedLighting()`
- Matériaux custom via `targetMaterials` array
- Intégration de nouveaux effets post-processing