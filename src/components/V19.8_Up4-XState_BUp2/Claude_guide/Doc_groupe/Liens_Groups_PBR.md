# Liens entre Groupes et Système PBR

## Vue d'ensemble

Les systèmes de Groupes et PBR sont étroitement liés et travaillent ensemble pour créer le rendu final. Cette documentation explique leurs interactions et dépendances.

## Architecture de coordination

### 1. Hiérarchie des systèmes

```
Scene 3D
├── PBRLightingController (Éclairage et matériaux)
├── BloomControlCenter (Gestion des groupes bloom)
├── SimpleBloomSystem (Post-processing)
└── ParticleSystemV2 (Groupes de particules)
```

### 2. Communication inter-systèmes

Les systèmes communiquent via :
- **Injection de dépendances** : Les systèmes se passent des références
- **Events** : Notifications de changements d'état
- **Shared State** : État partagé via React Context

## Interactions principales

### 1. PBR → Groupes Bloom

Le système PBR affecte les groupes de plusieurs façons :

#### Détection des matériaux bloom
```javascript
// PBRLightingController détecte les matériaux qui doivent briller
isBloomMaterial(materialName) {
  const bloomMaterials = [
    'Eye_Rings_MATERIAL',
    'anneaux-magic',
    'reveal_rings',
    'tron-grid-eye'
  ];
  return bloomMaterials.includes(materialName);
}
```

#### Mode Anti-Flash HDR
Quand un preset PBR active le HDR, il peut booster le bloom :
```javascript
enableAntiFlashHDRMode(bloomSystem) {
  // Boost × 5 pour les éléments avec bloom
  // Empêche la surexposition des métaux
}
```

### 2. Groupes → PBR

Les groupes influencent le PBR :

#### Modes de sécurité
Les couleurs des modes (Safe, Alert, etc.) modifient :
- La couleur émissive des matériaux
- L'intensité de base du bloom
- La teinte de l'éclairage ambiant

#### Valeurs de bloom
Les intensités de bloom par groupe affectent :
- La perception de la rugosité (roughness)
- L'intensité apparente du metalness
- Le contraste global de la scène

### 3. Coordination des presets

Certains presets PBR sont optimisés pour certains groupes :

#### **PBR Optimisé + Bloom élevé**
- Meilleur rendu des halos lumineux
- HDR améliore les transitions de couleur
- Tone mapping AgX préserve les détails

#### **Chrome Showcase + Eye Rings**
- Les Area Lights créent des reflets dans les anneaux
- Le metalness élevé amplifie l'effet chrome
- Les réflexions interagissent avec le bloom

#### **Studio Pro + Tous les groupes**
- Éclairage complexe révèle chaque groupe
- Balance optimale bloom/éclairage
- Rendu cinématographique

## Flux de données typique

1. **Changement de preset PBR**
   ```
   User → DebugPanel → PBRLightingController
                    ↓
   Mise à jour lumières + matériaux
                    ↓
   BloomControlCenter (ajustements auto)
   ```

2. **Changement de mode de sécurité**
   ```
   User → DebugPanel → BloomControlCenter
                    ↓
   Changement couleurs émissives
                    ↓
   PBRLightingController (adaptation éclairage)
   ```

3. **Ajustement bloom groupe**
   ```
   User → Slider bloom → BloomControlCenter
                      ↓
   Mise à jour intensité groupe
                      ↓
   SimpleBloomSystem (rendu post-process)
   ```

## Optimisations croisées

### 1. Détection intelligente
- PBR détecte automatiquement les objets avec bloom
- Évite d'appliquer des effets contradictoires
- Optimise les performances

### 2. Compensation automatique
- Bloom élevé → PBR réduit l'exposition
- Metalness élevé → Bloom ajusté pour éviter surexposition
- HDR actif → Bloom normalisé différemment

### 3. Presets coordonnés
Certaines combinaisons sont pré-optimisées :
- Safe + Normal = Rendu équilibré standard
- Alert + PBR Optimisé = Urgence cinématographique
- Processing + Chrome = Tech futuriste

## Stratégie de coordination

Le fichier `COORDINATION_BLOOM_STRATEGY.md` définit :

### Principes
1. **Séparation des responsabilités** : Chaque système a son domaine
2. **Communication minimale** : Éviter les dépendances circulaires
3. **Performance first** : Optimiser les interactions

### Rôles
- **BloomControlCenter** : Chef d'orchestre (décisions intelligentes)
- **SimpleBloomSystem** : Exécutant (rendu efficace)
- **PBRLightingController** : Coordinateur lumière/matériaux

## Exemples pratiques

### Pour un effet "œil brillant"
1. Groups : Bloom Iris à 8.0
2. PBR : Preset "PBR Optimisé"
3. Résultat : Œil hypnotique avec halo HDR

### Pour un robot "chrome"
1. Groups : Mode Neutral, bloom modéré
2. PBR : Preset "Chrome Showcase"
3. Résultat : Robot métallique bleuté réfléchissant

### Pour une alerte dramatique
1. Groups : Mode Alert, tous blooms à 5.0+
2. PBR : Preset "Studio Pro" 
3. Résultat : Robot rouge éclatant, très visible

## Conseils d'intégration

1. **Testez les combinaisons** : Certains couples groups/PBR fonctionnent mieux
2. **Surveillez les performances** : Bloom + PBR avancé = impact FPS
3. **Pensez cohérence** : Alignez l'ambiance groups/PBR
4. **Utilisez les presets** : Ils sont pré-optimisés pour l'interaction