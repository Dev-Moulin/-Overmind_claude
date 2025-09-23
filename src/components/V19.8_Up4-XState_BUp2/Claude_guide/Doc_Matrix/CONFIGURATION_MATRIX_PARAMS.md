# ⚙️ Configuration des Paramètres Matrix
## Système de Bras Flottants - Guide de Configuration

---

## 📐 **STRUCTURE DE CONFIGURATION**

### **Fichier Principal : `config.js`**
Ajout d'une section `matrixEffects` dans `V3_CONFIG` :

```javascript
export const V3_CONFIG = {
  // ... configuration existante ...
  
  // 🆕 SYSTÈME MATRIX FLOATING ARMS
  matrixEffects: {
    floatingArms: {
      // État général
      enabled: true,
      globalIntensity: 1.0,          // Intensité générale (0-2)
      debugMode: false,
      
      // Détection et structure
      detection: {
        armRootPatterns: [
          /^Little_\d+_Mouv$/,        // Petits bras UNIQUEMENT
          /^Arm_Little_\d+Action$/    // Cas spécial
          // NOTE: /^Bras_[LR][12]_Mouv$/ EXCLU (gros bras non concernés)
        ],
        maxChainLength: 25,           // Max bones par chaîne
        minChainLength: 2             // Min bones pour être valide
      },
      
      // Système d'inertie
      inertia: {
        enabled: true,
        position: {
          enabled: true,
          lerp: 0.12,                 // Vitesse rattrapage position (0-1)
          maxOffset: 2.0              // Distance max depuis position initiale
        },
        rotation: {
          enabled: true,
          slerp: 0.08,                // Vitesse rattrapage rotation (0-1)
          maxRotationX: 15,           // Limites rotation en degrés
          maxRotationY: 15,
          maxRotationZ: 10
        }
      },
      
      // Influence souris
      mouse: {
        enabled: true,
        influence: 0.35,              // Force influence souris (0-1)
        deadZone: 0.01,               // Zone morte anti-tremblements
        backTilt: 10,                 // Inclinaison arrière (degrés)
        backDistance: 0.8,            // Distance "derrière" la tête
        pitchFactor: 0.3,             // Influence pitch souris
        yawFactor: 0.5,               // Influence yaw souris
        smoothing: 0.15               // Lissage mouvement souris
      },
      
      // Oscillations procédurales
      waves: {
        enabled: true,
        globalAmplitude: 0.06,        // Amplitude base (radians)
        globalSpeed: 1.2,             // Vitesse base
        phaseOffsets: {
          armToArm: 0.8,              // Décalage phase entre bras
          boneInChain: 0.45           // Décalage phase dans chaîne
        },
        falloff: {
          rate: 0.82,                 // Taux atténuation (0-1)
          minAmplitude: 0.005         // Amplitude minimum
        },
        multiFreq: {
          enabled: true,
          speedX: 1.0,                // Vitesse oscillation X
          speedY: 0.8,                // Vitesse oscillation Y  
          speedZ: 0.3,                // Vitesse oscillation Z
          amplitudeY: 0.6,            // Facteur amplitude Y
          amplitudeZ: 0.3             // Facteur amplitude Z
        }
      },
      
      // Configuration pour les petits bras (seuls concernés)
      armTypes: {
        // NOTE: Configuration 'big' RETIRÉE car gros bras non concernés
        little: {
          responsiveness: 0.7,        // Réactivité optimisée pour petits bras
          amplitudeFactor: 1.4,       // Plus d'oscillation (caractéristique tentacules)
          backInfluence: 1.0,         // Influence arrière équilibrée
          priorityLevel: 1,           // Priorité maximale (seuls bras actifs)
          randomPhase: true           // Phase aléatoire individuelle
        }
        // NOTE: Pas de configuration 'big' car exclus de cette feature
      },
      
      // Performance et optimisation
      performance: {
        enableLOD: true,              // Level of Detail
        lodDistances: {
          near: 5,                    // Distance proche (toujours update)
          mid: 15,                    // Distance moyenne (50% frames)
          far: 30                     // Distance lointaine (10% frames)
        },
        updateThreshold: 0.001,       // Seuil mouvement minimum
        maxUpdateFreq: 60,            // FPS maximum pour updates
        enablePooling: true           // Pool objets temporaires
      },
      
      // Transitions et états
      transitions: {
        idleFadeTime: 0.5,            // Temps transition vers idle (sec)
        activationDelay: 0.1,         // Délai avant activation
        blendCurve: 'easeInOut',      // Courbe de transition
        matrixToIdleWeight: 0.3       // Poids animation idle en mode Matrix
      },
      
      // Effets avancés (optionnels)
      advanced: {
        perlinNoise: {
          enabled: false,             // Bruit de Perlin
          scale: 0.1,
          speed: 0.5,
          intensity: 0.02
        },
        springPhysics: {
          enabled: false,             // Simulation ressort
          stiffness: 100,
          damping: 10,
          mass: 1
        },
        collisionAvoidance: {
          enabled: false,             // Anti-collision entre bras
          radius: 0.3,
          repelForce: 0.05
        }
      }
    }
  }
}
```

---

## 🎛️ **PARAMÈTRES DÉTAILLÉS**

### **1. Paramètres d'Inertie**

#### **Position Lerp (`inertia.position.lerp`)**
- **Valeur** : 0.05 - 0.3
- **Effet** : Vitesse de rattrapage de la position cible
- **0.05** : Très lent, flottement extrême
- **0.12** : Naturel, recommandé
- **0.3** : Rapide, moins de lag

#### **Rotation Slerp (`inertia.rotation.slerp`)**
- **Valeur** : 0.03 - 0.2
- **Effet** : Vitesse de rattrapage de l'orientation cible
- **0.03** : Très lent, comme dans l'eau
- **0.08** : Naturel pour l'espace
- **0.2** : Rapide, moins d'inertie

#### **Limites de Sécurité**
```javascript
safety: {
  maxRotationX: 15,    // Empêche cassure du rig
  maxRotationY: 15,    // En degrés
  maxRotationZ: 10,
  maxOffset: 2.0,      // Distance max depuis position initiale
  snapBackThreshold: 3.0  // Distance de "snap back" d'urgence
}
```

### **2. Influence Souris**

#### **Facteur d'Influence (`mouse.influence`)**
- **0.0** : Aucune influence souris
- **0.35** : Influence subtile (recommandé)
- **0.7** : Influence forte
- **1.0** : Suivi direct de la souris

#### **Inclinaisons**
```javascript
backTilt: 10,        // Degrés : tire les bras vers l'arrière
pitchFactor: 0.3,    // Réaction au mouvement vertical souris
yawFactor: 0.5       // Réaction au mouvement horizontal souris
```

#### **Zone Morte (`mouse.deadZone`)**
- **But** : Éviter tremblements micro-mouvements
- **0.001** : Très sensible
- **0.01** : Normal
- **0.05** : Moins sensible

### **3. Oscillations Procédurales**

#### **Amplitude Globale (`waves.globalAmplitude`)**
- **0.02** : Oscillations très subtiles
- **0.06** : Naturel pour l'espace (recommandé)
- **0.12** : Oscillations marquées
- **0.2** : Très prononcées

#### **Vitesse Globale (`waves.globalSpeed`)**
- **0.5** : Oscillations lentes, hypnotiques
- **1.2** : Naturel (recommandé)
- **2.0** : Rapides, énergiques
- **3.0** : Très rapides

#### **Décalages de Phase**
```javascript
phaseOffsets: {
  armToArm: 0.8,      // Différence phase entre bras (0-2π)
  boneInChain: 0.45   // Progression phase dans chaîne
}
```

#### **Atténuation (`waves.falloff.rate`)**
- **0.95** : Atténuation faible, oscillation jusqu'au bout
- **0.82** : Recommandé, naturel
- **0.6** : Atténuation forte, oscillation seulement à la base

### **4. Configuration des Petits Bras (Seuls concernés)**

#### **Petits Bras (`armTypes.little`) - UNIQUEMENT**
```javascript
{
  responsiveness: 0.7,     // Réactivité optimisée pour tentacules
  amplitudeFactor: 1.4,    // Plus d'oscillation (caractéristique tentacules)
  backInfluence: 1.0,      // Influence arrière équilibrée
  priorityLevel: 1,        // Priorité maximale (seuls bras actifs)
  randomPhase: true        // Chaque petit bras décalé aléatoirement
}

// NOTE: Pas de configuration pour gros bras car ils ne sont PAS concernés
```

---

## 📊 **PRESETS PRÉDÉFINIS**

### **Preset 1 : Matrix Classique**
```javascript
export const MATRIX_CLASSIC_PRESET = {
  globalIntensity: 1.0,
  inertia: { position: { lerp: 0.08 }, rotation: { slerp: 0.05 } },
  mouse: { influence: 0.4, backTilt: 12, backDistance: 1.0 },
  waves: { globalAmplitude: 0.05, globalSpeed: 1.0, falloff: { rate: 0.85 } }
}
```

### **Preset 2 : Espace Flottant**
```javascript
export const SPACE_FLOATING_PRESET = {
  globalIntensity: 1.2,
  inertia: { position: { lerp: 0.06 }, rotation: { slerp: 0.04 } },
  mouse: { influence: 0.3, backTilt: 8, backDistance: 1.2 },
  waves: { globalAmplitude: 0.08, globalSpeed: 0.8, falloff: { rate: 0.8 } }
}
```

### **Preset 3 : Aquatique**
```javascript
export const UNDERWATER_PRESET = {
  globalIntensity: 0.8,
  inertia: { position: { lerp: 0.04 }, rotation: { slerp: 0.03 } },
  mouse: { influence: 0.25, backTilt: 5, backDistance: 0.6 },
  waves: { globalAmplitude: 0.12, globalSpeed: 0.6, falloff: { rate: 0.9 } }
}
```

### **Preset 4 : Réactif/Nerveux**
```javascript
export const REACTIVE_PRESET = {
  globalIntensity: 1.3,
  inertia: { position: { lerp: 0.18 }, rotation: { slerp: 0.12 } },
  mouse: { influence: 0.6, backTilt: 15, backDistance: 0.8 },
  waves: { globalAmplitude: 0.04, globalSpeed: 1.8, falloff: { rate: 0.75 } }
}
```

---

## 🎮 **INTERFACE DE CONTRÔLE RUNTIME**

### **API de Contrôle Dynamique**
```javascript
// Dans useFloatingArms hook
const setParameters = useCallback((newParams) => {
  // Merge avec config existante
  configRef.current = {
    ...configRef.current,
    ...newParams
  }
  
  // Validation des valeurs
  validateConfig(configRef.current)
  
  // Trigger re-calculs si nécessaire
  if (needsRecalculation(newParams)) {
    reinitializeSystem()
  }
}, [])

// Utilisation
floatingArms.setParameters({
  globalIntensity: 1.5,
  'inertia.position.lerp': 0.15,
  'mouse.influence': 0.4
})
```

### **Panel de Debug Runtime**
```javascript
const MatrixDebugPanel = ({ floatingArms }) => {
  return (
    <div className="matrix-debug-panel">
      <h3>Matrix Floating Arms</h3>
      
      <div className="control-group">
        <label>Global Intensity</label>
        <input 
          type="range" 
          min="0" max="2" step="0.1"
          value={floatingArms.config.globalIntensity}
          onChange={(e) => floatingArms.setParameters({
            globalIntensity: parseFloat(e.target.value)
          })}
        />
      </div>
      
      <div className="control-group">
        <label>Position Lerp</label>
        <input 
          type="range" 
          min="0.02" max="0.3" step="0.01"
          value={floatingArms.config.inertia.position.lerp}
          onChange={(e) => floatingArms.setParameters({
            'inertia.position.lerp': parseFloat(e.target.value)
          })}
        />
      </div>
      
      <div className="control-group">
        <label>Mouse Influence</label>
        <input 
          type="range" 
          min="0" max="1" step="0.05"
          value={floatingArms.config.mouse.influence}
          onChange={(e) => floatingArms.setParameters({
            'mouse.influence': parseFloat(e.target.value)
          })}
        />
      </div>
      
      <div className="presets">
        <button onClick={() => floatingArms.loadPreset(MATRIX_CLASSIC_PRESET)}>
          Matrix Classic
        </button>
        <button onClick={() => floatingArms.loadPreset(SPACE_FLOATING_PRESET)}>
          Space Float
        </button>
        <button onClick={() => floatingArms.loadPreset(UNDERWATER_PRESET)}>
          Underwater
        </button>
        <button onClick={() => floatingArms.loadPreset(REACTIVE_PRESET)}>
          Reactive
        </button>
      </div>
      
      <div className="metrics">
        <p>Active Little Arms: {floatingArms.debug.activeArms}</p>
        <p>Total Bones: {floatingArms.debug.totalBones}</p>
        <p>Update Time: {floatingArms.debug.updateTime.toFixed(2)}ms</p>
        <p>FPS Impact: {floatingArms.debug.fpsImpact}%</p>
      </div>
    </div>
  )
}
```

---

## 🔧 **GUIDE DE CALIBRAGE**

### **Étape 1 : Réglages de Base**
1. **Commencer avec un preset** (Matrix Classic recommandé)
2. **Ajuster `globalIntensity`** pour l'effet général voulu
3. **Tester avec mouvement souris lent puis rapide**

### **Étape 2 : Fine-Tuning Inertie**
1. **Si trop lent** → augmenter `lerp` et `slerp`
2. **Si trop nerveux** → diminuer `lerp` et `slerp`
3. **Si instable** → vérifier limites de sécurité

### **Étape 3 : Ajustement Souris**
1. **Influence trop faible** → augmenter `mouse.influence`
2. **Trop réactif** → augmenter `mouse.deadZone`
3. **Effet arrière insuffisant** → augmenter `backTilt` et `backDistance`

### **Étape 4 : Oscillations**
1. **Pas assez de mouvement** → augmenter `waves.globalAmplitude`
2. **Trop monotone** → diminuer `waves.falloff.rate`
3. **Trop rapide** → diminuer `waves.globalSpeed`

### **Étape 5 : Variation entre Petits Bras**
1. **Pas assez de variété** → activer `randomPhase` sur petits bras
2. **Mouvements trop uniformes** → ajuster `amplitudeFactor` individuellement
3. **Performance** → vérifier `priorityLevel` (devrait être 1)

---

## ⚡ **OPTIMISATION DES PARAMÈTRES**

### **Pour Performance Maximale**
```javascript
const PERFORMANCE_OPTIMIZED = {
  performance: {
    enableLOD: true,
    updateThreshold: 0.005,      // Moins d'updates
    maxUpdateFreq: 45            // 45 FPS au lieu de 60
  },
  waves: {
    falloff: { rate: 0.7 }       // Plus d'atténuation = moins de calculs
  },
  armTypes: {
    little: { priorityLevel: 2 } // Légère baisse si nécessaire
  }
}
```

### **Pour Qualité Maximale**
```javascript
const QUALITY_OPTIMIZED = {
  performance: {
    enableLOD: false,            // Désactiver LOD
    updateThreshold: 0.0001,     // Updates très fins
    maxUpdateFreq: 120           // 120 FPS si possible
  },
  advanced: {
    perlinNoise: { enabled: true }, // Activer bruit
    springPhysics: { enabled: true } // Activer physique
  }
}
```

---

## 📋 **VALIDATION DES PARAMÈTRES**

### **Fonction de Validation**
```javascript
function validateMatrixConfig(config) {
  const errors = []
  
  // Vérifications de base
  if (config.globalIntensity < 0 || config.globalIntensity > 3) {
    errors.push('globalIntensity doit être entre 0 et 3')
  }
  
  if (config.inertia.position.lerp <= 0 || config.inertia.position.lerp > 1) {
    errors.push('position.lerp doit être entre 0 et 1')
  }
  
  if (config.mouse.influence < 0 || config.mouse.influence > 1) {
    errors.push('mouse.influence doit être entre 0 et 1')
  }
  
  // Cohérence entre paramètres
  if (config.inertia.position.lerp > config.inertia.rotation.slerp * 3) {
    errors.push('position.lerp ne devrait pas être >3x rotation.slerp')
  }
  
  return errors
}
```

### **Auto-Correction**
```javascript
function autoCorrectConfig(config) {
  // Clamping automatique
  config.globalIntensity = THREE.MathUtils.clamp(config.globalIntensity, 0, 3)
  config.inertia.position.lerp = THREE.MathUtils.clamp(config.inertia.position.lerp, 0.001, 1)
  config.mouse.influence = THREE.MathUtils.clamp(config.mouse.influence, 0, 1)
  
  // Corrections cohérence
  if (config.waves.falloff.rate >= 1) {
    config.waves.falloff.rate = 0.99 // Éviter division par 0
  }
  
  return config
}
```

---

**🎯 Configuration Matrix Complète**  
**📊 Documentation des 50+ paramètres configurables**  
**🎛️ Interface runtime + presets prêts à l'emploi**

*Guide de configuration - Version 1.0 - Prêt pour implémentation*