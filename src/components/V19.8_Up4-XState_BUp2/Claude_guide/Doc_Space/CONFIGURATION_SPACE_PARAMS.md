# ⚙️ Configuration des Paramètres Space
## Système de Flottement Spatial - Guide de Configuration

---

## 📐 **STRUCTURE DE CONFIGURATION**

### **Fichier Principal : `config.js`**
Ajout d'une section `spaceEffects` dans `V3_CONFIG` :

```javascript
export const V3_CONFIG = {
  // ... configuration existante ...
  
  // 🆕 SYSTÈME SPACE FLOATING
  spaceEffects: {
    floatingSpace: {
      // État général
      enabled: true,
      debugMode: false,
      
      // Zone d'influence sphérique
      sphere: {
        radius: window.innerWidth,  // 100% de la fenêtre - ZONE COUVRE TOUT L'ÉCRAN
        centerOffset: {           // Offset depuis position iris
          x: 0.0,
          y: 0.0, 
          z: 0.0
        }
      },
      
      // Système de répulsion
      repulsion: {
        enabled: true,
        strength: 4.0,            // Force répulsion (4.0-20.0) - VALEUR PAR DÉFAUT MODIFIÉE
        falloffPower: 1.0,        // Falloff linéaire - CHANGÉ DE 2.0 À 1.0
        // maxDistance SUPPRIMÉ - L'effet fonctionne partout dans la fenêtre
        deadZone: 0.15           // Zone morte augmentée pour stabilité
      },
      
      // Inertie et réactivité
      dynamics: {
        inertia: 0.010,           // TRÈS RÉACTIF - Changé de 0.12 à 0.010
        updateThreshold: 0.02,    // Seuil augmenté pour stabilité
        minMovement: 0.05,        // Mouvement minimum pour éviter micro-corrections
        smoothingFactor: 0.95     // Facteur de lissage pour réduire vibrations
      },
      
      // Détection du centre
      centerDetection: {
        primaryTarget: 'IRIS',    // Nom objet prioritaire
        fallbackTargets: [        // Noms de fallback
          'Anneaux_Eye_Int',
          'Eye', 
          'Head'
        ],
        useBoundingBoxFallback: true,  // Utiliser bounding box si rien trouvé
        boundingBoxYOffset: 1.0        // Offset Y pour approximer tête
      },
      
      // Performance et optimisation
      performance: {
        enabled: true,
        lodEnabled: true,         // Level of detail selon distance caméra
        lodDistance: 15.0,        // Distance LOD activation
        lodFactor: 0.5,           // Facteur réduction précision LOD
        skipFrames: 0,            // Frames à ignorer (0=chaque frame)
        mouseDeltaThreshold: 0.001 // Seuil mouvement souris minimum
      },
      
      // Debug et visualisation
      debug: {
        showSphere: true,         // Afficher sphere influence
        showRepulsionVector: true, // Afficher vecteur répulsion
        showMouseProjection: true, // Afficher projection souris 3D
        showCenterPoint: true,    // Afficher point centre
        showOffset: true,         // Afficher offset appliqué
        logPerformance: false,    // Logger temps calculs
        sphereColor: 0x00ff00,    // Couleur sphere helper
        vectorColor: 0xff0000,    // Couleur vecteur helper
        pointColor: 0x0000ff      // Couleur point helper
      }
    }
  }
}
```

---

## 🎚️ **PARAMÈTRES DÉTAILLÉS**

### **1. Zone Sphérique**

#### `sphere.radius: window.innerWidth`
- **Description :** Zone d'influence couvrant 100% de la fenêtre
- **Implémentation actuelle :** `Math.min(window.innerWidth, window.innerHeight)`
- **Impact :** L'effet fonctionne partout dans la fenêtre, peu importe la position de la souris
- **Note :** maxDistance a été supprimé pour permettre l'effet global

#### `sphere.centerOffset: {x, y, z}`
- **Description :** Décalage du centre depuis la position iris
- **Usage :** Ajuster si l'iris n'est pas au centre optimal
- **Exemple :** `{x: 0, y: 0.5, z: 0}` décale vers le haut

### **2. Répulsion**

#### `repulsion.strength: 4.0`
- **Description :** Force de base de la répulsion
- **Valeurs :** 
  - `4.0` : Valeur par défaut - effet subtil mais visible
  - `4.0-8.0` : Effet modéré
  - `8.0-15.0` : Effet prononcé
  - `15.0-20.0` : Effet très intense
- **Impact :** Distance maximale d'environ 1-2 unités 3D avec la valeur par défaut

#### `repulsion.falloffPower: 1.0`
- **Description :** Courbe d'atténuation avec la distance
- **Valeur actuelle :** `1.0` - Falloff linéaire
- **Effet :** La force diminue de façon constante et régulière avec la distance
- **Note :** Plus prévisible et uniforme que les courbes quadratiques ou cubiques

#### `repulsion.deadZone: 0.15`
- **Description :** Zone morte autour du centre (pas d'effet)
- **But :** Éviter tremblements et vibrations
- **Valeur actuelle :** `0.15` - Augmentée pour plus de stabilité
- **Note :** Zone plus large pour éliminer les glitchs observés

### **3. Dynamiques**

#### `dynamics.inertia: 0.010`
- **Description :** Vitesse de rattrapage vers position cible
- **Valeur actuelle :** `0.010` - TRÈS RÉACTIF
- **Effet :** Le modèle réagit quasi-instantanément aux mouvements de souris
- **Note :** Valeur très basse pour une réactivité maximale

#### `dynamics.updateThreshold: 0.02`
- **Description :** Seuil minimum de mouvement pour update
- **Valeur actuelle :** `0.02` - Augmenté pour éviter les micro-vibrations
- **Optimisation :** Réduit les calculs inutiles et stabilise le mouvement

#### `dynamics.minMovement: 0.05`  
- **Description :** Mouvement minimum requis pour appliquer les changements
- **But :** Éviter les micro-corrections qui causent des tremblements
- **Fonctionnement :** Si le mouvement < 0.05, appliquer un lissage supplémentaire

#### `dynamics.smoothingFactor: 0.95`
- **Description :** Facteur de lissage pour les petits mouvements
- **Application :** Multiplie l'offset actuel par 0.95 pour atténuer progressivement
- **Effet :** Stabilise le modèle quand la souris est stable

---

## 🎛️ **PRESETS PRÉDÉFINIS**

### **Preset 1: Subtil**
```javascript
const PRESET_SUBTLE = {
  sphere: { radius: 2.5 },
  repulsion: { 
    strength: 0.3,
    falloffPower: 2.0,
    deadZone: 0.08
  },
  dynamics: { 
    inertia: 0.08,
    smoothingFactor: 1.2
  }
}
```
**Usage :** Effet discret, élégant, pour présentation professionnelle

### **Preset 2: Marqué (Default)**
```javascript
const PRESET_MARKED = {
  sphere: { radius: 3.0 },
  repulsion: { 
    strength: 0.7,
    falloffPower: 2.0,
    deadZone: 0.05
  },
  dynamics: { 
    inertia: 0.12,
    smoothingFactor: 1.0
  }
}
```
**Usage :** Effet visible et immersif, équilibré

### **Preset 3: Extrême**  
```javascript
const PRESET_EXTREME = {
  sphere: { radius: 4.0 },
  repulsion: { 
    strength: 1.2,
    falloffPower: 1.8,
    deadZone: 0.03
  },
  dynamics: { 
    inertia: 0.15,
    smoothingFactor: 0.8
  }
}
```
**Usage :** Effet très prononcé, démonstration spectaculaire

### **Preset 4: Réactif**
```javascript
const PRESET_REACTIVE = {
  sphere: { radius: 2.0 },
  repulsion: { 
    strength: 0.5,
    falloffPower: 2.5,
    deadZone: 0.02
  },
  dynamics: { 
    inertia: 0.20,
    smoothingFactor: 0.9
  }
}
```
**Usage :** Très réactif à la souris, interaction dynamique

---

## 🎮 **INTERFACE DE CONTRÔLE RUNTIME**

### **Curseurs de Base (Simple)**
```javascript
// Interface minimale avec curseurs essentiels
const SimpleControls = () => (
  <div>
    <h5>🌌 Flottement Spatial</h5>
    
    {/* Force répulsion */}
    <div>
      <label>Force: {repulsionStrength.toFixed(2)}</label>
      <input
        type="range"
        min="0"
        max="2"
        step="0.05"
        value={repulsionStrength}
        onChange={(e) => setRepulsionStrength(parseFloat(e.target.value))}
      />
    </div>
    
    {/* Rayon zone */}
    <div>
      <label>Zone: {sphereRadius.toFixed(1)}</label>
      <input
        type="range"
        min="1"
        max="8"
        step="0.1"
        value={sphereRadius}
        onChange={(e) => setSphereRadius(parseFloat(e.target.value))}
      />
    </div>
    
    {/* Réactivité */}
    <div>
      <label>Réactivité: {inertia.toFixed(3)}</label>
      <input
        type="range"
        min="0.01"
        max="0.3"
        step="0.005"
        value={inertia}
        onChange={(e) => setInertia(parseFloat(e.target.value))}
      />
    </div>
  </div>
)
```

### **🎯 Nouveautés Implémentées**

#### **Boutons de Position Caméra**
Deux boutons ont remplacé l'ancien bouton ORIGINE :
- **📷 CAM 1** : Position par défaut (x: 0, y: 1.4511, z: 14.2794)
- **📷 CAM 2** : Vue éloignée (x: 0, y: 2.0779, z: 20.4477)

#### **Système Anti-Vibration Amélioré**
- Double lissage pour réduire les tremblements
- Arrondi des valeurs à 3 décimales pour éviter les fluctuations numériques
- Détection de stabilité souris avec compteur
- Atténuation progressive quand la souris est immobile

### **Interface Complète (Avancé)**
```javascript
// Interface complète pour fine-tuning expert
const AdvancedControls = () => (
  <div>
    <h5>🌌 Flottement Spatial - Avancé</h5>
    
    {/* Section Répulsion */}
    <details>
      <summary>⚡ Répulsion</summary>
      <input type="range" label="Force" min="0" max="2" step="0.01" />
      <input type="range" label="Falloff" min="1" max="4" step="0.1" />
      <input type="range" label="Zone Morte" min="0" max="0.2" step="0.005" />
    </details>
    
    {/* Section Dynamiques */}
    <details>
      <summary>🏃 Dynamiques</summary>
      <input type="range" label="Inertie" min="0.01" max="0.5" step="0.005" />
      <input type="range" label="Seuil Update" min="0.0001" max="0.01" step="0.0001" />
      <input type="range" label="Distance Max" min="1" max="20" step="0.5" />
    </details>
    
    {/* Section Zone */}
    <details>
      <summary>🌍 Zone</summary>
      <input type="range" label="Rayon" min="0.5" max="15" step="0.1" />
      <input type="number" label="Offset X" step="0.1" />
      <input type="number" label="Offset Y" step="0.1" />
      <input type="number" label="Offset Z" step="0.1" />
    </details>
    
    {/* Presets rapides */}
    <div>
      <h6>🎚️ Presets</h6>
      <button onClick={() => applyPreset('subtle')}>Subtil</button>
      <button onClick={() => applyPreset('marked')}>Marqué</button>
      <button onClick={() => applyPreset('extreme')}>Extrême</button>
      <button onClick={() => applyPreset('reactive')}>Réactif</button>
    </div>
    
    {/* Debug live */}
    <div style={{ fontSize: '8px', color: '#999', marginTop: '10px' }}>
      <strong>Debug Live:</strong><br/>
      Offset: ({currentOffset.x.toFixed(3)}, {currentOffset.y.toFixed(3)}, {currentOffset.z.toFixed(3)})<br/>
      Force Actuelle: {effectStrength.toFixed(3)}<br/>
      Temps Calcul: {updateTime.toFixed(2)}ms<br/>
      Centre Détecté: {centerDetected ? '✅' : '❌'}
    </div>
  </div>
)
```

---

## 🔧 **GUIDE DE CALIBRAGE ÉTAPE PAR ÉTAPE**

### **Étape 1: Configuration de Base**
1. **Activer le système :** `enabled: true`
2. **Activer debug :** `debugMode: true`
3. **Vérifier détection centre :** Rechercher point vert (iris)
4. **Ajuster rayon :** Commencer avec `3.0`, observer sphere verte

### **Étape 2: Calibrage Force**
1. **Démarrer faible :** `strength: 0.3`
2. **Bouger souris** autour du centre
3. **Augmenter progressivement** jusqu'à effet visible
4. **Viser :** Mouvement notable mais pas excessif

### **Étape 3: Ajustement Réactivité**
1. **Tester inertie :** Commencer avec `0.12`
2. **Si trop lent :** Augmenter vers `0.2`
3. **Si trop brusque :** Réduire vers `0.08`
4. **Objectif :** Mouvement fluide sans lag excessif

### **Étape 4: Fine-tuning Zone**
1. **Ajuster rayon** selon taille du modèle
2. **Tester falloff** (1.0=linéaire, 2.0=doux, 3.0=sharp)
3. **Régler deadZone** pour éviter tremblements centre
4. **Valider maxDistance** pour limites saines

### **Étape 5: Optimisation**
1. **Désactiver debug :** `debugMode: false`
2. **Vérifier FPS** reste stable
3. **Ajuster updateThreshold** si nécessaire
4. **Activer LOD** si performance problématique

---

## 💾 **SAUVEGARDE ET PARTAGE**

### **Export Configuration**
```javascript
// Utilitaire pour sauvegarder config actuelle
const exportCurrentConfig = (floatingSpace) => {
  const config = {
    sphere: {
      radius: floatingSpace.config.sphereRadius,
      centerOffset: { ...floatingSpace.config.centerOffset }
    },
    repulsion: {
      strength: floatingSpace.config.repulsionStrength,
      falloffPower: floatingSpace.config.falloffPower,
      deadZone: floatingSpace.config.deadZone
    },
    dynamics: {
      inertia: floatingSpace.config.inertia,
      updateThreshold: floatingSpace.config.updateThreshold
    },
    timestamp: new Date().toISOString(),
    description: "Custom floating space config"
  }
  
  // Sauvegarder dans localStorage ou fichier
  localStorage.setItem('floatingSpaceConfig', JSON.stringify(config))
  console.log('Configuration sauvegardée:', config)
}
```

### **Import Configuration**
```javascript
// Utilitaire pour charger config sauvegardée
const importConfig = (floatingSpace) => {
  const saved = localStorage.getItem('floatingSpaceConfig')
  if (saved) {
    const config = JSON.parse(saved)
    floatingSpace.setParameters(config)
    console.log('Configuration chargée:', config)
  }
}
```

---

## 🎯 **CONFIGURATIONS RECOMMANDÉES PAR USE CASE**

### **Démo/Présentation Professionnelle**
```javascript
{
  sphere: { radius: 2.8 },
  repulsion: { strength: 0.4, falloffPower: 2.2, deadZone: 0.08 },
  dynamics: { inertia: 0.09 }
}
```

### **Installation Interactive**
```javascript
{
  sphere: { radius: 3.5 },
  repulsion: { strength: 0.8, falloffPower: 1.8, deadZone: 0.03 },
  dynamics: { inertia: 0.15 }
}
```

### **Test/Développement**
```javascript
{
  sphere: { radius: 4.0 },
  repulsion: { strength: 1.0, falloffPower: 2.0, deadZone: 0.05 },
  dynamics: { inertia: 0.12 },
  debug: { showSphere: true, showRepulsionVector: true }
}
```

### **Performance Optimisée**
```javascript
{
  sphere: { radius: 2.5 },
  repulsion: { strength: 0.6, falloffPower: 2.0, deadZone: 0.06 },
  dynamics: { inertia: 0.15, updateThreshold: 0.002 },
  performance: { lodEnabled: true, skipFrames: 1 }
}
```

---

**🎯 Configuration complète avec 50+ paramètres pour contrôle total du système de flottement spatial.**

*Configuration Space Parameters v1.0 - Janvier 2025*