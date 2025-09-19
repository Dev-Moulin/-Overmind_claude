# Architecture Technique du Système de Groupes

## Vue d'ensemble

Le système de groupes est composé de plusieurs couches qui gèrent différents types d'objets groupés dans la scène 3D.

## Composants principaux

### 1. BloomControlCenter

**Localisation** : `/systems/effects/BloomControlCenter.js`

**Rôle** : Chef d'orchestre intelligent pour la gestion des groupes bloom

**Structure de données** :
```javascript
class BloomControlCenter {
  objectsByType = {
    eyeRings: new Map(),     // Anneaux oculaires
    iris: new Map(),         // Iris de l'œil
    magicRings: new Map(),   // Anneaux magiques
    arms: new Map()          // Éléments des bras
  };
  
  materialConfigs = {
    eyeRings: {
      emissive: 0x00ff88,       // Couleur émissive
      emissiveIntensity: 1.0,   // Intensité de l'émission
      metalness: 0.8,           // Propriété PBR
      roughness: 0.2            // Propriété PBR
    }
    // ... autres configs
  };
}
```

**Méthodes principales** :
- `addToBloom(object, type)` : Ajoute un objet à un groupe
- `updateGroupIntensity(groupName, intensity)` : Met à jour l'intensité d'un groupe
- `applySecurityMode(mode)` : Applique un mode de sécurité
- `getObjectsByType(type)` : Récupère les objets d'un type donné

### 2. SimpleBloomSystem

**Localisation** : `/systems/effects/SimpleBloomSystem.js`

**Rôle** : Moteur de rendu post-processing pour les effets bloom

**Pipeline de rendu** :
1. **Passe normale** : Rendu de la scène sans bloom
2. **Passe bloom** : Rendu uniquement des objets lumineux
3. **Composition** : Mélange des deux passes

**Configuration technique** :
```javascript
{
  bloomStrength: 1.5,      // Force du bloom
  bloomRadius: 0.4,        // Rayon de diffusion
  bloomThreshold: 0.85     // Seuil de luminosité
}
```

### 3. ParticleSystemV2

**Localisation** : `/systems/particles/ParticleSystemV2.js`

**Rôle** : Gestion des groupes de particules avec comportements collectifs

**Système de groupement** :
```javascript
class ParticleGroup {
  constructor(particles) {
    this.particles = particles;
    this.center = new THREE.Vector3();
    this.velocity = new THREE.Vector3();
    this.behavior = 'flock'; // 'flock', 'orbit', 'wander'
    this.mass = particles.length;
  }
}
```

**Comportements de groupe** :
- **Flock** : Simulation d'essaim (séparation, alignement, cohésion)
- **Orbit** : Rotation collective autour d'un centre
- **Wander** : Déplacement aléatoire groupé

## Interface utilisateur

### 1. Onglet Groups dans DebugPanel

**Localisation** : `/components/DebugPanel.jsx` (section groups)

**Éléments d'interface** :
```javascript
// Modes de sécurité
const securityModes = ['safe', 'neutral', 'warning', 'alert', 'processing'];

// Contrôles bloom par groupe
const bloomGroups = ['iris', 'eyeRings', 'revealRings'];

// Slider d'exposition globale
const exposureControl = { min: 0.1, max: 3.0, step: 0.1 };
```

### 2. Callbacks et événements
```javascript
const handleSecurityModeChange = (mode) => {
  if (bloomControlCenter) {
    bloomControlCenter.applySecurityMode(mode);
    // Coordination avec PBR si nécessaire
  }
};

const handleBloomIntensityChange = (group, value) => {
  if (bloomControlCenter) {
    bloomControlCenter.updateGroupIntensity(group, value);
    // Mise à jour temps réel
  }
};
```

## Détection et classification

### 1. Détection automatique des objets bloom

**Dans BloomControlCenter** :
```javascript
detectBloomObjects(scene) {
  scene.traverse((object) => {
    if (object.material) {
      // Analyse du nom du matériau
      if (this.isEyeRingMaterial(object.material.name)) {
        this.addToBloom(object, 'eyeRings');
      }
      // ... autres classifications
    }
  });
}

isEyeRingMaterial(materialName) {
  const eyeRingPatterns = [
    'Eye_Rings_MATERIAL',
    'tron-grid-eye',
    'ring_glow'
  ];
  return eyeRingPatterns.some(pattern => 
    materialName.includes(pattern)
  );
}
```

### 2. Classification des particules

**Dans ParticleSystemV2** :
```javascript
formGroups() {
  // Algorithme de clustering spatial
  const groups = this.spatialClustering(this.particles, this.groupRadius);
  
  // Attribution des comportements
  groups.forEach(group => {
    group.behavior = this.determineBehavior(group);
  });
  
  return groups;
}

determineBehavior(group) {
  // Logique basée sur la position, vitesse, densité
  if (group.density > 0.8) return 'flock';
  if (group.isNearCenter()) return 'orbit';
  return 'wander';
}
```

## Coordination inter-systèmes

### 1. Injection de dépendances

**Dans V3Scene.jsx** :
```javascript
// Création des systèmes
const bloomControlCenter = new BloomControlCenter();
const simpleBloomSystem = new SimpleBloomSystem();
const pbrLightingController = new PBRLightingController();

// Injection des dépendances
bloomControlCenter.setBloomSystem(simpleBloomSystem);
pbrLightingController.setBloomController(bloomControlCenter);
```

### 2. Communication événementielle

```javascript
// BloomControlCenter émet des événements
bloomControlCenter.on('groupUpdated', (groupName, config) => {
  // PBRLightingController peut réagir
  pbrLightingController.adaptToBloomChange(groupName, config);
});

// Mise à jour synchronisée
securityModeChanged.subscribe((mode) => {
  bloomControlCenter.applySecurityMode(mode);
  pbrLightingController.adjustForSecurityMode(mode);
});
```

## Performance et optimisations

### 1. Mise en cache intelligente

```javascript
// Cache des configurations matériaux
const materialConfigCache = new Map();

// Cache des groupes formés
const groupCache = {
  particles: new WeakMap(),
  lastUpdate: 0,
  ttl: 1000 // 1 seconde
};
```

### 2. Updating sélectif

```javascript
updateGroups() {
  // Mise à jour uniquement si nécessaire
  if (this.needsUpdate()) {
    this.recomputeGroups();
    this.needsUpdateFlag = false;
  }
  
  // Mise à jour légère pour l'animation
  this.updateGroupPositions();
}
```

### 3. LOD (Level of Detail)

```javascript
// Réduction de la complexité selon la distance
updateGroupLOD(camera) {
  this.groups.forEach(group => {
    const distance = group.center.distanceTo(camera.position);
    group.lod = distance > 100 ? 'low' : 'high';
  });
}
```

## Extensibilité

Le système est conçu pour être facilement étendu :

1. **Nouveaux types de groupes** : Ajout dans `objectsByType`
2. **Nouveaux comportements** : Extension de `ParticleBehaviors`
3. **Nouvelles classifications** : Ajout de patterns de détection
4. **Nouveaux effets** : Extension du pipeline de post-processing

Cette architecture modulaire permet d'ajouter facilement de nouvelles fonctionnalités tout en maintenant les performances et la lisibilité du code.