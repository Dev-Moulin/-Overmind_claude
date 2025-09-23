# 🏗️ ARCHITECTURE XSTATE POUR DEBUGPANEL THREE.JS

## 🎯 Vue d'ensemble

Architecture XState conçue pour remplacer Zustand et résoudre les problèmes de synchronisation bidirectionnelle du DebugPanel.

## 📊 Machines d'État Proposées

### **ConfigurationMachine** - Machine Principale
```typescript
interface SceneContext {
  // Environnement HDR
  HDREnabled: boolean;
  environmentMap: THREE.Texture | null;
  backgroundType: 'color' | 'environment' | 'gradient';

  // Bloom
  bloomEnabled: boolean;
  bloomIntensity: number;
  bloomThreshold: number;
  bloomRadius: number;

  // PBR
  metalness: number;
  roughness: number;
  pbrPreset: string;

  // Lighting
  exposure: number;
  ambientMultiplier: number;
  directionalMultiplier: number;
  physicallyCorrectLights: boolean;

  // Particles
  particlesEnabled: boolean;
  particleDensity: number;
  particleSpeed: number;

  // MSAA
  msaaEnabled: boolean;
  msaaSamples: number;
}

type SceneEvent =
  | { type: 'TOGGLE_BLOOM' }
  | { type: 'SET_BLOOM_INTENSITY'; value: number }
  | { type: 'SET_METALNESS'; value: number }
  | { type: 'APPLY_PRESET'; values: Partial<SceneContext> }
  | { type: 'LOAD_ENVIRONMENT'; hdriUrl: string }
  | { type: 'ENV_LOADED'; envMap: THREE.Texture };
```

### **RenderSyncMachine** - Synchronisation Rendu
```typescript
interface SyncContext {
  pendingChanges: Array<keyof SceneContext>;
  batchUpdateTimer: number | null;
  lastUpdateTime: number;
}

const renderSyncMachine = createMachine({
  id: 'renderSync',
  initial: 'idle',
  states: {
    idle: {
      on: {
        PARAMETER_CHANGED: 'batching'
      }
    },
    batching: {
      after: {
        50: 'applying' // Debounce 50ms
      },
      on: {
        PARAMETER_CHANGED: {
          actions: 'addToPendingChanges'
        }
      }
    },
    applying: {
      invoke: {
        id: 'applyChanges',
        src: 'applyChangesToScene',
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

### **ValidationMachine** - Validation des Dépendances
```typescript
const validationMachine = createMachine({
  id: 'validation',
  initial: 'checking',
  states: {
    checking: {
      always: [
        { target: 'hdr_required', cond: 'bloomEnabledButNoHDR' },
        { target: 'environment_required', cond: 'metallicButNoEnvironment' },
        { target: 'valid' }
      ]
    },
    hdr_required: {
      entry: 'enableHDR',
      always: 'checking'
    },
    environment_required: {
      entry: 'loadDefaultEnvironment',
      always: 'checking'
    },
    valid: {
      type: 'final'
    }
  }
});
```

## 🛡️ Guards (Conditions)

### **Guards de Dépendances**
```typescript
const guards = {
  // HDR requis pour bloom
  hdrRequiredForBloom: (context: SceneContext) => {
    return context.bloomEnabled && !context.HDREnabled;
  },

  // Environment requis pour metalness
  environmentRequiredForMetalness: (context: SceneContext) => {
    return context.metalness > 0.1 && !context.environmentMap;
  },

  // Physically correct lights requis pour PBR
  physicalLightsRequired: (context: SceneContext) => {
    return (context.metalness > 0 || context.roughness < 1) &&
           !context.physicallyCorrectLights;
  },

  // MSAA compatible avec WebGL2
  msaaSupported: () => {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2');
    return gl !== null;
  }
};
```

### **Guards de Performance**
```typescript
const performanceGuards = {
  // Limiter bloom si performance faible
  bloomAllowed: (context: SceneContext) => {
    return performance.now() - lastFrameTime < 16.67; // 60fps
  },

  // Limiter particules selon GPU
  particlesAllowed: (context: SceneContext) => {
    const gpu = navigator.gpu; // WebGPU detection
    return gpu || context.particleDensity < 0.5;
  }
};
```

## ⚡ Actions XState

### **Actions de Contexte**
```typescript
const actions = {
  // Mise à jour contexte bloom
  updateBloom: assign((context, event) => ({
    bloomEnabled: event.enabled ?? context.bloomEnabled,
    bloomIntensity: event.intensity ?? context.bloomIntensity,
    bloomThreshold: event.threshold ?? context.bloomThreshold,
    bloomRadius: event.radius ?? context.bloomRadius
  })),

  // Mise à jour contexte PBR
  updatePBR: assign((context, event) => ({
    metalness: event.metalness ?? context.metalness,
    roughness: event.roughness ?? context.roughness,
    pbrPreset: event.preset ?? context.pbrPreset
  })),

  // Application preset complet
  applyPreset: assign((context, event) => ({
    ...context,
    ...event.values
  }))
};
```

### **Actions Three.js**
```typescript
const threeActions = {
  // Activer HDR
  enableHDR: (context: SceneContext) => {
    if (!composer) return;

    // Recréer composer avec HalfFloat
    const newComposer = new EffectComposer(renderer, {
      frameBufferType: THREE.HalfFloatType
    });

    // Transférer les passes existantes
    composer.passes.forEach(pass => newComposer.addPass(pass));
    composer = newComposer;

    // Désactiver tone mapping renderer
    renderer.toneMapping = THREE.NoToneMapping;

    console.log('✅ HDR activé avec HalfFloat buffer');
  },

  // Appliquer effet bloom
  applyBloom: (context: SceneContext) => {
    if (!bloomEffect) return;

    bloomEffect.intensity = context.bloomIntensity;
    bloomEffect.luminanceThreshold = context.bloomThreshold;
    bloomEffect.luminanceSmoothing = context.bloomRadius;

    // Ajouter/retirer du composer
    if (context.bloomEnabled && !bloomPass) {
      bloomPass = new EffectPass(camera, bloomEffect);
      composer.addPass(bloomPass, composer.passes.length - 1);
    } else if (!context.bloomEnabled && bloomPass) {
      composer.removePass(bloomPass);
      bloomPass = null;
    }
  },

  // Appliquer matériaux PBR
  applyPBRMaterials: (context: SceneContext) => {
    scene.traverse((object) => {
      if (object.material && object.material.isMeshStandardMaterial) {
        object.material.metalness = context.metalness;
        object.material.roughness = context.roughness;
        object.material.needsUpdate = true;
      }
    });
  },

  // Charger environnement HDR
  loadEnvironment: (context: SceneContext, event) => {
    if (!event.hdriUrl) return;

    const loader = new RGBELoader();
    loader.load(event.hdriUrl, (texture) => {
      const pmrem = new THREE.PMREMGenerator(renderer);
      const envMap = pmrem.fromEquirectangular(texture).texture;

      scene.environment = envMap;
      scene.background = envMap;

      // Notifier chargement terminé
      sceneService.send({ type: 'ENV_LOADED', envMap });

      texture.dispose();
      pmrem.dispose();
    });
  }
};
```

## 🔄 Configuration Machine Principale

```typescript
const sceneMachine = createMachine<SceneContext, SceneEvent>({
  id: 'scene',
  initial: 'idle',
  context: {
    HDREnabled: false,
    environmentMap: null,
    backgroundType: 'color',
    bloomEnabled: false,
    bloomIntensity: 0.5,
    bloomThreshold: 0.85,
    bloomRadius: 0.4,
    metalness: 0.0,
    roughness: 1.0,
    pbrPreset: 'default',
    exposure: 1.0,
    ambientMultiplier: 1.0,
    directionalMultiplier: 1.0,
    physicallyCorrectLights: false,
    particlesEnabled: false,
    particleDensity: 0.5,
    particleSpeed: 1.0,
    msaaEnabled: false,
    msaaSamples: 4
  },

  states: {
    idle: {
      on: {
        TOGGLE_BLOOM: {
          actions: [
            // Vérifier et activer HDR si nécessaire
            choose([
              { cond: 'hdrRequiredForBloom', actions: 'enableHDR' }
            ]),
            // Mettre à jour contexte
            assign({ bloomEnabled: (ctx) => !ctx.bloomEnabled }),
            // Appliquer à la scène
            'applyBloom'
          ]
        },

        SET_BLOOM_INTENSITY: {
          cond: (ctx) => ctx.bloomEnabled,
          actions: [
            assign({ bloomIntensity: (_, event) => event.value }),
            'applyBloom'
          ]
        },

        SET_METALNESS: {
          actions: [
            // Vérifier environnement requis
            choose([
              {
                cond: 'environmentRequiredForMetalness',
                actions: 'loadDefaultEnvironment'
              }
            ]),
            assign({ metalness: (_, event) => event.value }),
            'applyPBRMaterials'
          ]
        },

        APPLY_PRESET: {
          actions: [
            'applyPreset',
            'enableHDR',
            'applyBloom',
            'applyPBRMaterials',
            'loadEnvironment'
          ]
        },

        LOAD_ENVIRONMENT: {
          target: 'loading_environment',
          actions: 'loadEnvironment'
        }
      }
    },

    loading_environment: {
      on: {
        ENV_LOADED: {
          target: 'idle',
          actions: assign({
            environmentMap: (_, event) => event.envMap,
            HDREnabled: true
          })
        }
      }
    }
  }
}, {
  guards,
  actions: { ...actions, ...threeActions }
});
```

## 📈 Avantages de cette Architecture

### **1. Synchronisation Garantie**
- Transitions atomiques (pas d'états intermédiaires)
- Ordre des opérations explicite via guards
- Pas de race conditions

### **2. Dépendances Explicites**
- HDR automatiquement activé si bloom requis
- Environment automatiquement chargé si metalness > 0
- Validation des prérequis à chaque transition

### **3. Debugging Facilité**
- États visibles via XState devtools
- Historique des transitions
- Guards et actions tracées

### **4. Performance Optimisée**
- Batching automatique des changements
- Debounce intégré via états transitoires
- Actions groupées par transition

## 🔗 Intégration React

```typescript
// Hook principal
export const useSceneState = () => {
  const [state, send] = useMachine(sceneMachine);

  return {
    // État actuel
    context: state.context,
    isLoading: state.matches('loading_environment'),

    // Actions
    toggleBloom: () => send({ type: 'TOGGLE_BLOOM' }),
    setBloomIntensity: (value: number) =>
      send({ type: 'SET_BLOOM_INTENSITY', value }),
    setMetalness: (value: number) =>
      send({ type: 'SET_METALNESS', value }),
    applyPreset: (values: Partial<SceneContext>) =>
      send({ type: 'APPLY_PRESET', values }),

    // État machine pour debug
    stateMachine: state
  };
};

// Dans le composant UI
const BloomControls = () => {
  const { context, toggleBloom, setBloomIntensity } = useSceneState();

  return (
    <div>
      <input
        type="checkbox"
        checked={context.bloomEnabled}
        onChange={toggleBloom}
      />
      <input
        type="range"
        min="0"
        max="3"
        step="0.1"
        value={context.bloomIntensity}
        onChange={(e) => setBloomIntensity(Number(e.target.value))}
        disabled={!context.bloomEnabled}
      />
    </div>
  );
};
```

Cette architecture XState garantit une synchronisation parfaite entre l'UI et la scène Three.js, avec des dépendances explicites et des performances optimisées.