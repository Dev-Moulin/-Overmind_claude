# 🔄 STRATÉGIE DE MIGRATION ZUSTAND → XSTATE

## 🎯 Objectif

Migration progressive et sécurisée de Zustand vers XState pour résoudre les problèmes de synchronisation bidirectionnelle du DebugPanel.

## 📊 Analyse Comparative Actuelle

### **DebugPanel V6 (Zustand Actuel)**
```javascript
// Structure actuelle
const useSceneStore = create((set, get) => ({
  // Bloom
  bloomEnabled: false,
  bloomIntensity: 0.5,
  bloomThreshold: 0.85,
  bloomRadius: 0.4,

  // PBR
  metalness: 0.0,
  roughness: 1.0,
  pbrPreset: 'default',

  // Lighting
  exposure: 1.0,
  ambientMultiplier: 1.0,
  directionalMultiplier: 1.0,
  physicallyCorrectLights: false,

  // Environment
  HDREnabled: false,
  environmentMap: null,
  backgroundType: 'color',

  // Actions
  setBloomEnabled: (enabled) => set({ bloomEnabled: enabled }),
  setBloomIntensity: (intensity) => set({ bloomIntensity: intensity }),
  // ... autres actions
}));
```

### **Problèmes Identifiés avec Zustand**

#### **1. Synchronisation Bidirectionnelle**
```javascript
// ❌ PROBLÈME: Race conditions
const BloomControls = () => {
  const { bloomEnabled, setBloomEnabled } = useSceneStore();

  // Le toggle peut créer des états intermédiaires
  const handleToggle = () => {
    setBloomEnabled(!bloomEnabled); // État 1
    // HDR pas encore activé...
    applyBloomToScene(bloomEnabled); // État 2 - CONFLIT!
  };
};
```

#### **2. Dépendances Implicites**
```javascript
// ❌ PROBLÈME: Pas de validation des prérequis
const toggleBloom = () => {
  set({ bloomEnabled: true }); // Peut être activé sans HDR
  // Résultat visuel incorrect ou crash
};
```

#### **3. Ordre des Opérations Non Garanti**
```javascript
// ❌ PROBLÈME: Ordre d'application non contrôlé
const applyPreset = (preset) => {
  set(preset); // Tous les changements en même temps
  // Bloom activé avant HDR, PBR avant environment, etc.
};
```

## 🔄 Phase de Migration

### **Phase 1: Mise en Place XState (Semaine 1-2)**

#### **1.1 Installation et Configuration**
```bash
npm install xstate @xstate/react
```

#### **1.2 Structure des Machines**
```
src/
├── machines/
│   ├── sceneMachine.js         # Machine principale
│   ├── renderSyncMachine.js    # Synchronisation rendu
│   └── validationMachine.js    # Validation dépendances
├── services/
│   ├── threeJSService.js       # Interface Three.js
│   └── assetLoaderService.js   # Chargement assets
└── hooks/
    ├── useSceneState.js        # Hook principal XState
    └── useZustandCompat.js     # Compatibilité temporaire
```

#### **1.3 Machine de Base**
```typescript
// machines/sceneMachine.js
import { createMachine, assign } from 'xstate';

const sceneMachine = createMachine({
  id: 'scene',
  initial: 'idle',
  context: {
    // Migration progressive des états Zustand
    bloomEnabled: false,
    bloomIntensity: 0.5,
    metalness: 0.0,
    HDREnabled: false,
    // ...
  },

  states: {
    idle: {
      on: {
        TOGGLE_BLOOM: {
          actions: [
            // Vérification HDR automatique
            choose([
              { cond: 'hdrRequired', actions: 'enableHDR' }
            ]),
            assign({ bloomEnabled: (ctx) => !ctx.bloomEnabled }),
            'applyBloom'
          ]
        }
      }
    }
  }
});
```

### **Phase 2: Couche de Compatibilité (Semaine 2-3)**

#### **2.1 Wrapper de Compatibilité**
```typescript
// hooks/useZustandCompat.js
export const useZustandCompat = () => {
  const [state, send] = useMachine(sceneMachine);

  // Interface compatible Zustand
  return {
    // États (lecture)
    bloomEnabled: state.context.bloomEnabled,
    bloomIntensity: state.context.bloomIntensity,
    metalness: state.context.metalness,

    // Actions (écriture avec validation)
    setBloomEnabled: (enabled) =>
      send({ type: 'SET_BLOOM_ENABLED', value: enabled }),
    setBloomIntensity: (intensity) =>
      send({ type: 'SET_BLOOM_INTENSITY', value: intensity }),
    setMetalness: (metalness) =>
      send({ type: 'SET_METALNESS', value: metalness }),

    // Nouveaux helpers XState
    isApplyingChanges: state.matches('applying'),
    hasValidationErrors: state.matches('validation.error'),
    stateMachine: state // Pour debugging
  };
};
```

#### **2.2 Migration des Composants**
```typescript
// Migration progressive des composants
const BloomControls = () => {
  // ✅ AVANT (Zustand)
  // const { bloomEnabled, setBloomEnabled } = useSceneStore();

  // ✅ APRÈS (XState avec compatibilité)
  const { bloomEnabled, setBloomEnabled, isApplyingChanges } = useZustandCompat();

  return (
    <div>
      <input
        type="checkbox"
        checked={bloomEnabled}
        onChange={(e) => setBloomEnabled(e.target.checked)}
        disabled={isApplyingChanges} // Nouveau: feedback visuel
      />
      {isApplyingChanges && <span>Applying...</span>}
    </div>
  );
};
```

### **Phase 3: Migration Complète (Semaine 3-4)**

#### **3.1 Remplacement Progressif**
```typescript
// Migration par sections
const DebugPanelXState = () => {
  const { context, actions, pipelineState } = useSceneState();

  return (
    <div>
      {/* Section Bloom - Migré */}
      <BloomControlsXState
        bloom={context.bloom}
        actions={actions.bloom}
        isApplying={pipelineState.isApplying}
      />

      {/* Section PBR - En cours de migration */}
      <PBRControlsCompat
        pbr={context.pbr}
        actions={actions.pbr}
      />

      {/* Section Lighting - Zustand legacy temporaire */}
      <LightingControlsZustand />
    </div>
  );
};
```

#### **3.2 Suppression Graduelle de Zustand**
```typescript
// Étape 1: Bloom + PBR migrés
// useSceneStore retire bloom et PBR

// Étape 2: Lighting migré
// useSceneStore retire lighting

// Étape 3: Environment migré
// useSceneStore retire environment

// Étape 4: Suppression complète
// rm useSceneStore.js
```

### **Phase 4: Optimisation (Semaine 4-5)**

#### **4.1 Machine de Synchronisation Avancée**
```typescript
const renderSyncMachine = createMachine({
  id: 'renderSync',
  initial: 'idle',
  context: {
    pendingChanges: [],
    batchTimer: null
  },

  states: {
    idle: {
      on: {
        PARAMETER_CHANGED: 'batching'
      }
    },

    batching: {
      entry: 'startBatchTimer',
      exit: 'clearBatchTimer',

      after: {
        50: 'applying' // Debounce 50ms
      },

      on: {
        PARAMETER_CHANGED: {
          actions: 'addToPendingBatch'
        }
      }
    },

    applying: {
      invoke: {
        id: 'applyBatchedChanges',
        src: 'applyChangesToThreeJS',
        onDone: 'idle',
        onError: 'error'
      }
    },

    error: {
      after: {
        1000: 'idle'
      }
    }
  }
});
```

## 🛡️ Plan de Validation

### **Tests de Non-Régression**
```typescript
// tests/migration.test.js
describe('Migration Zustand → XState', () => {
  test('Bloom toggle fonctionne identiquement', () => {
    // Test compatibilité comportement
    const zustandResult = testZustandBloomToggle();
    const xstateResult = testXStateBloomToggle();

    expect(xstateResult.finalState).toEqual(zustandResult.finalState);
  });

  test('HDR activé automatiquement avec bloom', () => {
    // Test nouvelle fonctionnalité
    const result = testXStateBloomWithHDRDependency();
    expect(result.HDREnabled).toBe(true);
  });

  test('Performance non dégradée', () => {
    // Test performance
    const zustandTime = benchmarkZustandUpdates();
    const xstateTime = benchmarkXStateUpdates();

    expect(xstateTime).toBeLessThanOrEqual(zustandTime * 1.1); // Max 10% overhead
  });
});
```

### **Monitoring de Migration**
```typescript
// utils/migrationMonitor.js
export const migrationMonitor = {
  trackZustandUsage: (componentName, action) => {
    console.warn(`🔄 ${componentName} utilise encore Zustand: ${action}`);
    // Analytics migration
  },

  trackXStateAdoption: (machineName, event) => {
    console.log(`✅ ${machineName} XState événement: ${event.type}`);
    // Suivi progression
  },

  validatePipelineOrder: (changes) => {
    const order = ['environment', 'pbr', 'lighting', 'bloom', 'msaa'];
    const appliedOrder = changes.map(c => c.category);

    if (!isValidOrder(appliedOrder, order)) {
      console.error('❌ Pipeline order violation:', appliedOrder);
    }
  }
};
```

## 📊 Métriques de Succès

### **Critères de Validation**
- ✅ **Fonctionnalité**: Tous les réglages DebugPanel fonctionnent identiquement
- ✅ **Performance**: Pas de dégradation > 10%
- ✅ **Synchronisation**: Zéro race condition détectée
- ✅ **Pipeline**: Ordre de rendu respecté à 100%
- ✅ **Debugging**: États visibles dans XState devtools

### **Timeline de Migration**
```
Semaine 1: Installation XState + Machine de base
Semaine 2: Couche compatibilité + Migration Bloom
Semaine 3: Migration PBR + Lighting
Semaine 4: Migration Environment + Suppression Zustand
Semaine 5: Optimisation + Tests finaux
```

Cette stratégie garantit une migration sans rupture, avec validation continue et amélioration progressive de la synchronisation UI/rendu.