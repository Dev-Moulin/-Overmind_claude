# 🔄 CONVERSION DES SLICES ZUSTAND VERS XSTATE

## 🎯 Objectif

Guide détaillé pour convertir chaque slice Zustand existant vers les machines XState correspondantes, avec mapping 1:1 des fonctionnalités.

## 📊 Analyse des Slices Existants

### **Slice Bloom (Zustand)**
```javascript
// stores/slices/bloomSlice.js (AVANT)
const createBloomSlice = (set, get) => ({
  // État
  bloomEnabled: false,
  bloomIntensity: 0.5,
  bloomThreshold: 0.85,
  bloomRadius: 0.4,

  // Actions
  setBloomEnabled: (enabled) => set({ bloomEnabled: enabled }),
  setBloomIntensity: (intensity) => set({ bloomIntensity: intensity }),
  setBloomThreshold: (threshold) => set({ bloomThreshold: threshold }),
  setBloomRadius: (radius) => set({ bloomRadius: radius }),

  // Actions composées
  toggleBloom: () => set((state) => ({ bloomEnabled: !state.bloomEnabled })),
  resetBloomToDefaults: () => set({
    bloomEnabled: false,
    bloomIntensity: 0.5,
    bloomThreshold: 0.85,
    bloomRadius: 0.4
  })
});
```

### **Machine Bloom (XState)**
```typescript
// machines/bloomMachine.js (APRÈS)
import { createMachine, assign } from 'xstate';

const bloomMachine = createMachine({
  id: 'bloom',
  initial: 'disabled',

  context: {
    intensity: 0.5,
    threshold: 0.85,
    radius: 0.4,
    // État dérivé
    isHDRRequired: false,
    lastUpdateTime: 0
  },

  states: {
    disabled: {
      entry: 'clearBloomEffect',

      on: {
        ENABLE: {
          target: 'validating',
          actions: assign({ lastUpdateTime: () => Date.now() })
        },

        // Paramètres modifiables même en mode disabled
        SET_INTENSITY: {
          actions: assign({ intensity: (_, event) => event.value })
        },
        SET_THRESHOLD: {
          actions: assign({ threshold: (_, event) => event.value })
        },
        SET_RADIUS: {
          actions: assign({ radius: (_, event) => event.value })
        }
      }
    },

    validating: {
      always: [
        // Vérifier prérequis HDR
        {
          target: 'requiring_hdr',
          cond: 'hdrRequired'
        },
        {
          target: 'enabled'
        }
      ]
    },

    requiring_hdr: {
      entry: 'requestHDRActivation',

      on: {
        HDR_ACTIVATED: 'enabled',
        HDR_FAILED: 'disabled'
      }
    },

    enabled: {
      entry: ['applyBloomEffect', 'logBloomActivation'],

      on: {
        DISABLE: {
          target: 'disabled',
          actions: 'clearBloomEffect'
        },

        SET_INTENSITY: {
          actions: [
            assign({ intensity: (_, event) => event.value }),
            'updateBloomEffect'
          ]
        },

        SET_THRESHOLD: {
          actions: [
            assign({ threshold: (_, event) => event.value }),
            'updateBloomEffect'
          ]
        },

        SET_RADIUS: {
          actions: [
            assign({ radius: (_, event) => event.value }),
            'updateBloomEffect'
          ]
        },

        RESET_TO_DEFAULTS: {
          actions: [
            assign({
              intensity: 0.5,
              threshold: 0.85,
              radius: 0.4
            }),
            'updateBloomEffect'
          ]
        }
      }
    }
  }
}, {
  guards: {
    hdrRequired: (context, event, { state }) => {
      // Vérifier si HDR est nécessaire et disponible
      return !state.context.HDREnabled; // Référence au contexte parent
    }
  },

  actions: {
    applyBloomEffect: (context) => {
      console.log('✨ Activation Bloom:', context);
      // Logique Three.js d'activation
    },

    updateBloomEffect: (context) => {
      console.log('🔧 Mise à jour Bloom:', {
        intensity: context.intensity,
        threshold: context.threshold,
        radius: context.radius
      });
      // Logique Three.js de mise à jour
    },

    clearBloomEffect: () => {
      console.log('🚫 Désactivation Bloom');
      // Logique Three.js de désactivation
    },

    requestHDRActivation: () => {
      console.log('🌅 Demande activation HDR pour Bloom');
      // Événement vers machine parent
    },

    logBloomActivation: (context) => {
      console.log('📊 Bloom activé:', {
        intensity: context.intensity,
        timestamp: context.lastUpdateTime
      });
    }
  }
});
```

### **Slice PBR (Zustand)**
```javascript
// stores/slices/pbrSlice.js (AVANT)
const createPBRSlice = (set, get) => ({
  // État
  metalness: 0.0,
  roughness: 1.0,
  pbrPreset: 'default',
  envMapIntensity: 1.0,

  // Actions
  setMetalness: (metalness) => set({ metalness }),
  setRoughness: (roughness) => set({ roughness }),
  setPBRPreset: (preset) => {
    const presets = {
      metal: { metalness: 1.0, roughness: 0.1 },
      plastic: { metalness: 0.0, roughness: 0.8 },
      glass: { metalness: 0.0, roughness: 0.0 },
      default: { metalness: 0.0, roughness: 1.0 }
    };
    set({ ...presets[preset], pbrPreset: preset });
  },
  setEnvMapIntensity: (intensity) => set({ envMapIntensity: intensity })
});
```

### **Machine PBR (XState)**
```typescript
// machines/pbrMachine.js (APRÈS)
const pbrMachine = createMachine({
  id: 'pbr',
  initial: 'idle',

  context: {
    metalness: 0.0,
    roughness: 1.0,
    preset: 'default',
    envMapIntensity: 1.0,
    environmentMapLoaded: false
  },

  states: {
    idle: {
      on: {
        SET_METALNESS: {
          target: 'updating',
          actions: assign({ metalness: (_, event) => event.value })
        },

        SET_ROUGHNESS: {
          target: 'updating',
          actions: assign({ roughness: (_, event) => event.value })
        },

        APPLY_PRESET: {
          target: 'applying_preset',
          actions: assign({ preset: (_, event) => event.preset })
        },

        SET_ENVMAP_INTENSITY: {
          target: 'updating',
          actions: assign({ envMapIntensity: (_, event) => event.value })
        }
      }
    },

    applying_preset: {
      entry: 'applyPresetValues',

      always: {
        target: 'updating'
      }
    },

    updating: {
      always: [
        {
          target: 'requiring_environment',
          cond: 'environmentMapRequired'
        },
        {
          target: 'applying'
        }
      ]
    },

    requiring_environment: {
      entry: 'requestEnvironmentMap',

      on: {
        ENVIRONMENT_LOADED: {
          target: 'applying',
          actions: assign({ environmentMapLoaded: true })
        }
      }
    },

    applying: {
      invoke: {
        id: 'applyPBRChanges',
        src: 'applyPBRMaterials',
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
}, {
  guards: {
    environmentMapRequired: (context) => {
      return (context.metalness > 0.1 || context.roughness < 0.9) &&
             !context.environmentMapLoaded;
    }
  },

  actions: {
    applyPresetValues: assign((context, event) => {
      const presets = {
        metal: { metalness: 1.0, roughness: 0.1 },
        plastic: { metalness: 0.0, roughness: 0.8 },
        glass: { metalness: 0.0, roughness: 0.0 },
        default: { metalness: 0.0, roughness: 1.0 }
      };

      return {
        ...context,
        ...presets[event.preset]
      };
    }),

    requestEnvironmentMap: () => {
      console.log('🌍 Demande environment map pour PBR');
    }
  },

  services: {
    applyPBRMaterials: async (context) => {
      console.log('🔮 Application matériaux PBR:', context);
      // Logique Three.js
      return context;
    }
  }
});
```

## 🔄 Machine Composite Principale

### **Orchestration des Machines**
```typescript
// machines/sceneMachine.js
const sceneMachine = createMachine({
  id: 'scene',
  type: 'parallel',

  states: {
    bloom: {
      invoke: {
        id: 'bloomMachine',
        src: bloomMachine
      }
    },

    pbr: {
      invoke: {
        id: 'pbrMachine',
        src: pbrMachine
      }
    },

    environment: {
      initial: 'unloaded',

      states: {
        unloaded: {
          on: {
            LOAD_ENVIRONMENT: 'loading'
          }
        },

        loading: {
          invoke: {
            id: 'loadEnvironment',
            src: 'loadEnvironmentMap',
            onDone: {
              target: 'loaded',
              actions: [
                assign({ environmentMap: (_, event) => event.data }),
                // Notifier les autres machines
                send({ type: 'ENVIRONMENT_LOADED' }, { to: 'bloomMachine' }),
                send({ type: 'ENVIRONMENT_LOADED' }, { to: 'pbrMachine' })
              ]
            },
            onError: 'error'
          }
        },

        loaded: {
          on: {
            LOAD_ENVIRONMENT: 'loading'
          }
        },

        error: {
          after: {
            2000: 'unloaded'
          }
        }
      }
    }
  }
});
```

## 🛠️ Hooks de Conversion

### **Hook de Compatibilité Bloom**
```typescript
// hooks/useBloomCompat.js
export const useBloomCompat = () => {
  const [state, send] = useMachine(bloomMachine);

  // Interface compatible Zustand
  return {
    // États (lecture)
    bloomEnabled: state.matches('enabled'),
    bloomIntensity: state.context.intensity,
    bloomThreshold: state.context.threshold,
    bloomRadius: state.context.radius,

    // Actions (compatible Zustand)
    setBloomEnabled: (enabled) =>
      send({ type: enabled ? 'ENABLE' : 'DISABLE' }),

    setBloomIntensity: (intensity) =>
      send({ type: 'SET_INTENSITY', value: intensity }),

    setBloomThreshold: (threshold) =>
      send({ type: 'SET_THRESHOLD', value: threshold }),

    setBloomRadius: (radius) =>
      send({ type: 'SET_RADIUS', value: radius }),

    toggleBloom: () =>
      send({ type: state.matches('enabled') ? 'DISABLE' : 'ENABLE' }),

    resetBloomToDefaults: () =>
      send({ type: 'RESET_TO_DEFAULTS' }),

    // Nouvelles capacités XState
    isValidating: state.matches('validating'),
    isRequiringHDR: state.matches('requiring_hdr'),
    hasErrors: state.matches('error'),

    // Debug
    stateMachine: state
  };
};
```

### **Hook de Conversion PBR**
```typescript
// hooks/usePBRCompat.js
export const usePBRCompat = () => {
  const [state, send] = useMachine(pbrMachine);

  return {
    // États Zustand compatibles
    metalness: state.context.metalness,
    roughness: state.context.roughness,
    pbrPreset: state.context.preset,
    envMapIntensity: state.context.envMapIntensity,

    // Actions Zustand compatibles
    setMetalness: (metalness) =>
      send({ type: 'SET_METALNESS', value: metalness }),

    setRoughness: (roughness) =>
      send({ type: 'SET_ROUGHNESS', value: roughness }),

    setPBRPreset: (preset) =>
      send({ type: 'APPLY_PRESET', preset }),

    setEnvMapIntensity: (intensity) =>
      send({ type: 'SET_ENVMAP_INTENSITY', value: intensity }),

    // Nouveaux états XState
    isUpdating: state.matches('updating'),
    isApplyingPreset: state.matches('applying_preset'),
    isRequiringEnvironment: state.matches('requiring_environment'),
    isApplying: state.matches('applying'),

    // Debug
    machineState: state.value,
    context: state.context
  };
};
```

## 📋 Checklist de Conversion

### **Pour Chaque Slice Zustand**
- [ ] **Analyser l'état** - Identifier toutes les propriétés
- [ ] **Lister les actions** - Mapper chaque fonction
- [ ] **Identifier les dépendances** - Trouver les prérequis
- [ ] **Créer la machine XState** - Avec états et transitions
- [ ] **Implémenter les guards** - Pour les validations
- [ ] **Créer les actions** - Pour les effets de bord
- [ ] **Tester la compatibilité** - Hook de transition
- [ ] **Migrer les composants** - Remplacement progressif
- [ ] **Supprimer l'ancien slice** - Nettoyage final

### **Validation de Conversion**
```typescript
// tests/sliceConversion.test.js
describe('Conversion Slice → Machine', () => {
  test('Bloom: comportement identique', () => {
    const zustandState = { bloomEnabled: false };
    const xstateState = bloomMachine.initialState;

    expect(xstateState.matches('disabled')).toBe(!zustandState.bloomEnabled);
  });

  test('PBR: presets identiques', () => {
    const zustandPreset = { metalness: 1.0, roughness: 0.1 };
    const xstateResult = applyPreset('metal');

    expect(xstateResult.context.metalness).toBe(zustandPreset.metalness);
    expect(xstateResult.context.roughness).toBe(zustandPreset.roughness);
  });
});
```

Cette approche garantit une conversion 1:1 des fonctionnalités Zustand vers XState, avec amélioration de la gestion des dépendances et de la synchronisation.