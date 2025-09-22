# 🐻 **DOCUMENTATION ZUSTAND - Guide Complet 2025**

## 📋 **Table des Matières**
1. [Introduction & Philosophie](#introduction--philosophie)
2. [Installation & Setup](#installation--setup)
3. [Concepts Fondamentaux](#concepts-fondamentaux)
4. [Patterns pour Applications Complexes](#patterns-pour-applications-complexes)
5. [Middleware Avancés](#middleware-avancés)
6. [TypeScript Integration](#typescript-integration)
7. [Architecture pour Ton Projet 3D](#architecture-pour-ton-projet-3d)
8. [Migration depuis useState](#migration-depuis-usestate)
9. [Performance & Optimizations](#performance--optimizations)
10. [DevTools & Debugging](#devtools--debugging)
11. [Exemples Concrets](#exemples-concrets)

---

## 🎯 **Introduction & Philosophie**

### **Qu'est-ce que Zustand ?**
Zustand (allemand pour "état") est une librairie de gestion d'état pour React qui se distingue par sa **simplicité extrême** et sa **performance**.

### **Philosophie Core :**
- **Simple** : Plus simple que Redux, plus puissant que Context
- **Flexible** : Pas de boilerplate, pas de providers
- **Performant** : Re-renders optimaux, pas de "zombie child problem"
- **TypeScript-first** : Support natif et excellent
- **Agnostique** : Fonctionne avec ou sans React

### **Pourquoi Zustand vs autres solutions ?**

| Feature | useState | Context | Redux | **Zustand** |
|---------|----------|---------|-------|-------------|
| Simplicité | ✅ | ⚠️ | ❌ | ✅ |
| Performance | ⚠️ | ❌ | ✅ | ✅ |
| DevTools | ❌ | ❌ | ✅ | ✅ |
| Boilerplate | ✅ | ⚠️ | ❌ | ✅ |
| TypeScript | ⚠️ | ⚠️ | ⚠️ | ✅ |
| Persistance | ❌ | ❌ | 🔧 | ✅ |

---

## 🚀 **Installation & Setup**

### **Installation Basic :**
```bash
npm install zustand
# ou
yarn add zustand
# ou
pnpm add zustand
```

### **Installation avec DevTools :**
```bash
npm install zustand @redux-devtools/extension
```

### **Premier Store - Hello World :**
```javascript
// stores/counterStore.js
import { create } from 'zustand';

const useCounterStore = create((set, get) => ({
  // État
  count: 0,
  
  // Actions
  increment: () => set((state) => ({ count: state.count + 1 })),
  decrement: () => set((state) => ({ count: state.count - 1 })),
  reset: () => set({ count: 0 }),
  
  // Computed values
  getDoubleCount: () => get().count * 2,
}));

export default useCounterStore;
```

### **Utilisation dans un composant :**
```javascript
// components/Counter.jsx
import useCounterStore from '../stores/counterStore';

const Counter = () => {
  // Sélecteur spécifique (optimal)
  const count = useCounterStore((state) => state.count);
  const increment = useCounterStore((state) => state.increment);
  const reset = useCounterStore((state) => state.reset);
  
  return (
    <div>
      <h2>Count: {count}</h2>
      <button onClick={increment}>+1</button>
      <button onClick={reset}>Reset</button>
    </div>
  );
};
```

---

## 🧩 **Concepts Fondamentaux**

### **1. Anatomy d'un Store Zustand :**
```javascript
const useStore = create((set, get, api) => ({
  // STATE
  data: initialValue,
  
  // ACTIONS (mutations)
  updateData: (newData) => set({ data: newData }),
  
  // ACTIONS (avec logique)
  complexAction: async () => {
    const currentState = get();
    const result = await someAsyncOperation(currentState.data);
    set({ data: result });
  },
  
  // COMPUTED/GETTERS
  getProcessedData: () => {
    const state = get();
    return processData(state.data);
  }
}));
```

### **2. Les 3 Paramètres du Create :**

#### **`set` - Mutation de l'état :**
```javascript
// Merge (défaut)
set({ newProperty: value }); // garde les autres propriétés

// Replace
set(() => ({ onlyThisProperty: value })); // remplace tout

// Avec fonction
set((state) => ({ count: state.count + 1 }));
```

#### **`get` - Lecture de l'état actuel :**
```javascript
const myAction = () => {
  const currentState = get();
  console.log('Current count:', currentState.count);
  set({ count: currentState.count * 2 });
};
```

#### **`api` - Métafonctions :**
```javascript
const useStore = create((set, get, api) => ({
  // Subscribe à des changements
  subscribe: api.subscribe,
  
  // Destroy le store
  destroy: api.destroy,
  
  // Get state sans trigger re-render
  getState: api.getState
}));
```

### **3. Patterns de Sélection :**

#### **❌ Mauvais - Subscribe à tout :**
```javascript
// ❌ Re-render à chaque changement du store
const { count, user, settings } = useStore();
```

#### **✅ Bon - Sélecteurs granulaires :**
```javascript
// ✅ Re-render seulement si count change
const count = useStore((state) => state.count);
const increment = useStore((state) => state.increment);
```

#### **🚀 Optimal - Sélecteurs avec égalité :**
```javascript
import { shallow } from 'zustand/shallow';

// Pour les objets/arrays
const { count, user } = useStore(
  (state) => ({ count: state.count, user: state.user }),
  shallow
);
```

---

## 🏗️ **Patterns pour Applications Complexes**

### **1. Architecture en Slices (Recommandé) :**

```javascript
// stores/slices/bloomSlice.js
export const createBloomSlice = (set, get) => ({
  bloom: {
    threshold: 0.15,
    strength: 0.17,
    radius: 0.4,
    enabled: true
  },
  
  // Actions groupées
  setBloomParameter: (param, value) => set((state) => ({
    bloom: { ...state.bloom, [param]: value }
  })),
  
  setBloomThreshold: (value) => set((state) => ({
    bloom: { ...state.bloom, threshold: value }
  })),
  
  toggleBloom: () => set((state) => ({
    bloom: { ...state.bloom, enabled: !state.bloom.enabled }
  })),
  
  resetBloom: () => set((state) => ({
    bloom: { threshold: 0.15, strength: 0.17, radius: 0.4, enabled: true }
  }))
});
```

```javascript
// stores/slices/pbrSlice.js
export const createPbrSlice = (set, get) => ({
  pbr: {
    currentPreset: 'studioProPlus',
    ambientMultiplier: 1,
    directionalMultiplier: 1,
    customExposure: 1,
    materialSettings: {
      metalness: 0.3,
      roughness: 1,
      targetMaterials: ['all']
    },
    hdrBoost: {
      enabled: false,
      multiplier: 2
    }
  },
  
  setPbrPreset: (presetName) => set((state) => ({
    pbr: { ...state.pbr, currentPreset: presetName }
  })),
  
  setPbrMultiplier: (type, value) => set((state) => ({
    pbr: { ...state.pbr, [`${type}Multiplier`]: value }
  })),
  
  setMaterialSetting: (setting, value) => set((state) => ({
    pbr: {
      ...state.pbr,
      materialSettings: { ...state.pbr.materialSettings, [setting]: value }
    }
  }))
});
```

### **2. Store Principal Composé :**

```javascript
// stores/sceneStore.js
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { createBloomSlice } from './slices/bloomSlice';
import { createPbrSlice } from './slices/pbrSlice';
import { createParticleSlice } from './slices/particleSlice';

const useSceneStore = create()(
  devtools(
    persist(
      (set, get, api) => ({
        // Combine tous les slices
        ...createBloomSlice(set, get, api),
        ...createPbrSlice(set, get, api),
        ...createParticleSlice(set, get, api),
        
        // Actions globales
        applyPreset: (preset) => {
          set((state) => ({
            ...state,
            ...preset
          }));
        },
        
        resetAll: () => {
          get().resetBloom();
          get().resetPbr();
          get().resetParticles();
        },
        
        // Export de l'état complet pour debug
        exportState: () => get(),
      }),
      {
        name: 'scene-storage',
        // Partialize pour ne persister que certaines parties
        partialize: (state) => ({
          bloom: state.bloom,
          pbr: state.pbr,
          // Ne pas persister les particules (runtime only)
        })
      }
    ),
    { name: 'SceneStore' }
  )
);

export default useSceneStore;
```

### **3. Custom Hooks pour Ergonomie :**

```javascript
// hooks/useBloom.js
import useSceneStore from '../stores/sceneStore';
import { shallow } from 'zustand/shallow';

// Hook spécialisé pour le bloom
export const useBloom = () => {
  return useSceneStore(
    (state) => ({
      ...state.bloom,
      setThreshold: state.setBloomThreshold,
      setParameter: state.setBloomParameter,
      toggle: state.toggleBloom,
      reset: state.resetBloom
    }),
    shallow
  );
};

// Hook pour juste une valeur
export const useBloomThreshold = () => 
  useSceneStore((state) => state.bloom.threshold);

// Hook pour juste les actions
export const useBloomActions = () => 
  useSceneStore((state) => ({
    setThreshold: state.setBloomThreshold,
    setParameter: state.setBloomParameter,
    toggle: state.toggleBloom
  }), shallow);
```

---

## 🔧 **Middleware Avancés**

### **1. DevTools Middleware :**

```javascript
import { devtools } from 'zustand/middleware';

const useStore = create()(
  devtools(
    (set, get) => ({
      count: 0,
      increment: () => set((state) => ({ count: state.count + 1 }), false, 'increment'),
      decrement: () => set((state) => ({ count: state.count - 1 }), false, 'decrement'),
    }),
    {
      name: 'MyStore', // Nom dans DevTools
      enabled: process.env.NODE_ENV === 'development'
    }
  )
);
```

### **2. Persist Middleware :**

```javascript
import { persist } from 'zustand/middleware';

const useStore = create()(
  persist(
    (set, get) => ({
      theme: 'dark',
      userPrefs: { language: 'en' },
      toggleTheme: () => set((state) => ({ 
        theme: state.theme === 'dark' ? 'light' : 'dark' 
      }))
    }),
    {
      name: 'user-preferences', // localStorage key
      storage: {
        getItem: (name) => {
          const str = localStorage.getItem(name);
          return str ? JSON.parse(str) : null;
        },
        setItem: (name, value) => {
          localStorage.setItem(name, JSON.stringify(value));
        },
        removeItem: (name) => localStorage.removeItem(name)
      },
      partialize: (state) => ({ 
        theme: state.theme,
        userPrefs: state.userPrefs
        // Ne pas persister les actions
      })
    }
  )
);
```

### **3. Subscribe avec Sélecteurs :**

```javascript
import { subscribeWithSelector } from 'zustand/middleware';

const useStore = create()(
  subscribeWithSelector((set, get) => ({
    count: 0,
    increment: () => set((state) => ({ count: state.count + 1 }))
  }))
);

// Subscribe à une partie spécifique
const unsubscribe = useStore.subscribe(
  (state) => state.count,
  (count, previousCount) => {
    console.log('Count changed from', previousCount, 'to', count);
  },
  {
    equalityFn: (a, b) => a === b,
    fireImmediately: true
  }
);
```

### **4. Middleware Custom pour Logging :**

```javascript
const logger = (config) => (set, get, api) =>
  config(
    (...args) => {
      console.group('State Update');
      console.log('Previous state:', get());
      set(...args);
      console.log('New state:', get());
      console.groupEnd();
    },
    get,
    api
  );

const useStore = create()(
  logger((set, get) => ({
    count: 0,
    increment: () => set((state) => ({ count: state.count + 1 }))
  }))
);
```

---

## 🎨 **TypeScript Integration**

### **1. Store Typé Basique :**

```typescript
interface CounterState {
  count: number;
  increment: () => void;
  decrement: () => void;
  reset: () => void;
}

const useCounterStore = create<CounterState>()((set, get) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
  decrement: () => set((state) => ({ count: state.count - 1 })),
  reset: () => set({ count: 0 })
}));
```

### **2. Store avec Middleware Typé :**

```typescript
import { StateCreator } from 'zustand';

interface SceneState {
  bloom: {
    threshold: number;
    strength: number;
    radius: number;
  };
  setBloomParameter: (param: keyof SceneState['bloom'], value: number) => void;
}

type SceneStore = StateCreator<
  SceneState,
  [['zustand/devtools', never], ['zustand/persist', unknown]],
  [],
  SceneState
>;

const createSceneStore: SceneStore = (set, get) => ({
  bloom: {
    threshold: 0.15,
    strength: 0.17,
    radius: 0.4
  },
  
  setBloomParameter: (param, value) => set((state) => ({
    bloom: { ...state.bloom, [param]: value }
  }), false, `setBloom${param.charAt(0).toUpperCase() + param.slice(1)}`)
});

const useSceneStore = create<SceneState>()(
  devtools(
    persist(createSceneStore, {
      name: 'scene-storage'
    }),
    { name: 'SceneStore' }
  )
);
```

### **3. Types pour Slices :**

```typescript
// types/store.ts
export interface BloomSlice {
  bloom: {
    threshold: number;
    strength: number;
    radius: number;
    enabled: boolean;
  };
  setBloomParameter: (param: keyof BloomSlice['bloom'], value: number | boolean) => void;
  resetBloom: () => void;
}

export interface PbrSlice {
  pbr: {
    currentPreset: string;
    ambientMultiplier: number;
    directionalMultiplier: number;
  };
  setPbrPreset: (preset: string) => void;
  setPbrMultiplier: (type: 'ambient' | 'directional', value: number) => void;
}

export type SceneStore = BloomSlice & PbrSlice;
```

```typescript
// slices/bloomSlice.ts
import { StateCreator } from 'zustand';
import { BloomSlice, SceneStore } from '../types/store';

export const createBloomSlice: StateCreator<
  SceneStore,
  [],
  [],
  BloomSlice
> = (set, get) => ({
  bloom: {
    threshold: 0.15,
    strength: 0.17,
    radius: 0.4,
    enabled: true
  },
  
  setBloomParameter: (param, value) => set((state) => ({
    bloom: { ...state.bloom, [param]: value }
  })),
  
  resetBloom: () => set((state) => ({
    bloom: { threshold: 0.15, strength: 0.17, radius: 0.4, enabled: true }
  }))
});
```

---

## 🎮 **Architecture pour Ton Projet 3D**

### **Structure Recommandée :**

```
src/stores/
├── index.js              # Export principal
├── sceneStore.js         # Store principal
├── slices/
│   ├── bloomSlice.js     # Gestion Bloom
│   ├── pbrSlice.js       # Gestion PBR
│   ├── particleSlice.js  # Gestion Particules
│   ├── cameraSlice.js    # Gestion Caméra
│   ├── backgroundSlice.js # Gestion Background
│   └── msaaSlice.js      # Gestion MSAA
├── middleware/
│   ├── logger.js         # Logging custom
│   └── validator.js      # Validation des valeurs
└── hooks/
    ├── useBloom.js       # Hook spécialisé Bloom
    ├── usePbr.js         # Hook spécialisé PBR
    └── useScene.js       # Hook général scène
```

### **Store Principal pour Ton Projet :**

```javascript
// stores/sceneStore.js
import { create } from 'zustand';
import { devtools, persist, subscribeWithSelector } from 'zustand/middleware';
import { createBloomSlice } from './slices/bloomSlice';
import { createPbrSlice } from './slices/pbrSlice';
import { createParticleSlice } from './slices/particleSlice';
import { createCameraSlice } from './slices/cameraSlice';
import { createBackgroundSlice } from './slices/backgroundSlice';

const useSceneStore = create()(
  subscribeWithSelector(
    devtools(
      persist(
        (set, get, api) => ({
          // === SLICES ===
          ...createBloomSlice(set, get, api),
          ...createPbrSlice(set, get, api),
          ...createParticleSlice(set, get, api),
          ...createCameraSlice(set, get, api),
          ...createBackgroundSlice(set, get, api),
          
          // === METADATA ===
          metadata: {
            currentPreset: null,
            lastModified: Date.now(),
            version: '1.0.0'
          },
          
          // === GLOBAL ACTIONS ===
          applyPreset: (presetName, presetData) => {
            console.log(`🎯 Applying preset: ${presetName}`);
            
            set((state) => ({
              ...state,
              ...presetData,
              metadata: {
                ...state.metadata,
                currentPreset: presetName,
                lastModified: Date.now()
              }
            }), false, `applyPreset:${presetName}`);
          },
          
          resetAll: () => {
            const actions = get();
            actions.resetBloom();
            actions.resetPbr();
            actions.resetParticles();
            actions.resetCamera();
            actions.resetBackground();
            
            set((state) => ({
              ...state,
              metadata: {
                ...state.metadata,
                currentPreset: null,
                lastModified: Date.now()
              }
            }), false, 'resetAll');
          },
          
          // === EXPORT/IMPORT ===
          exportState: () => {
            const state = get();
            return {
              bloom: state.bloom,
              pbr: state.pbr,
              particles: state.particles,
              camera: state.camera,
              background: state.background,
              metadata: state.metadata
            };
          },
          
          importState: (importedState) => {
            set((state) => ({
              ...state,
              ...importedState,
              metadata: {
                ...state.metadata,
                lastModified: Date.now(),
                currentPreset: importedState.metadata?.currentPreset || null
              }
            }), false, 'importState');
          },
          
          // === UTILITIES ===
          getStateHash: () => {
            const state = get().exportState();
            return btoa(JSON.stringify(state)).slice(0, 8);
          }
        }),
        {
          name: 'v197-scene-storage',
          version: 1,
          partialize: (state) => ({
            bloom: state.bloom,
            pbr: state.pbr,
            camera: state.camera,
            background: state.background,
            metadata: state.metadata
            // Ne pas persister les particules (perf runtime)
          }),
          onRehydrateStorage: () => (state) => {
            console.log('🔄 Hydration complete:', state);
          }
        }
      ),
      {
        name: 'V197-SceneStore',
        enabled: process.env.NODE_ENV === 'development'
      }
    )
  )
);

export default useSceneStore;
```

### **Slice Bloom Détaillé :**

```javascript
// slices/bloomSlice.js
export const createBloomSlice = (set, get) => ({
  bloom: {
    // Global
    enabled: true,
    threshold: 0,
    strength: 0.17,
    radius: 0.4,
    
    // Groups
    groups: {
      iris: {
        threshold: 0.3,
        strength: 0.8,
        radius: 0.4,
        emissiveIntensity: 1.4
      },
      eyeRings: {
        threshold: 0.4,
        strength: 0.6,
        radius: 0.3,
        emissiveIntensity: 1.8
      },
      revealRings: {
        threshold: 0.43,
        strength: 0.4,
        radius: 0.36,
        emissiveIntensity: 0.7
      }
    }
  },
  
  // === ACTIONS GLOBALES ===
  setBloomEnabled: (enabled) => set((state) => ({
    bloom: { ...state.bloom, enabled }
  }), false, `setBloomEnabled:${enabled}`),
  
  setBloomGlobal: (param, value) => set((state) => ({
    bloom: { ...state.bloom, [param]: value }
  }), false, `setBloomGlobal:${param}:${value}`),
  
  // === ACTIONS PAR GROUPE ===
  setBloomGroup: (groupName, param, value) => set((state) => ({
    bloom: {
      ...state.bloom,
      groups: {
        ...state.bloom.groups,
        [groupName]: {
          ...state.bloom.groups[groupName],
          [param]: value
        }
      }
    }
  }), false, `setBloomGroup:${groupName}:${param}:${value}`),
  
  // === PRESETS BLOOM ===
  applyBloomPreset: (presetName) => {
    const presets = {
      subtle: {
        threshold: 0.5,
        strength: 0.1,
        radius: 0.2
      },
      normal: {
        threshold: 0.3,
        strength: 0.17,
        radius: 0.4
      },
      intense: {
        threshold: 0.1,
        strength: 0.5,
        radius: 0.8
      }
    };
    
    const preset = presets[presetName];
    if (preset) {
      set((state) => ({
        bloom: { ...state.bloom, ...preset }
      }), false, `applyBloomPreset:${presetName}`);
    }
  },
  
  resetBloom: () => set((state) => ({
    bloom: {
      enabled: true,
      threshold: 0,
      strength: 0.17,
      radius: 0.4,
      groups: {
        iris: { threshold: 0.3, strength: 0.8, radius: 0.4, emissiveIntensity: 1.4 },
        eyeRings: { threshold: 0.4, strength: 0.6, radius: 0.3, emissiveIntensity: 1.8 },
        revealRings: { threshold: 0.43, strength: 0.4, radius: 0.36, emissiveIntensity: 0.7 }
      }
    }
  }), false, 'resetBloom')
});
```

### **Hook Spécialisé pour DebugPanel :**

```javascript
// hooks/useSceneControls.js
import useSceneStore from '../stores/sceneStore';
import { shallow } from 'zustand/shallow';

export const useSceneControls = () => {
  return useSceneStore(
    (state) => ({
      // === BLOOM ===
      bloom: state.bloom,
      setBloomEnabled: state.setBloomEnabled,
      setBloomGlobal: state.setBloomGlobal,
      setBloomGroup: state.setBloomGroup,
      
      // === PBR ===
      pbr: state.pbr,
      setPbrPreset: state.setPbrPreset,
      setPbrMultiplier: state.setPbrMultiplier,
      
      // === GLOBAL ===
      applyPreset: state.applyPreset,
      resetAll: state.resetAll,
      exportState: state.exportState,
      
      // === METADATA ===
      currentPreset: state.metadata.currentPreset,
      lastModified: state.metadata.lastModified
    }),
    shallow
  );
};

// Hook optimisé pour performance - juste lecture
export const useBloomValues = () => useSceneStore((state) => state.bloom);
export const useBloomActions = () => useSceneStore((state) => ({
  setEnabled: state.setBloomEnabled,
  setGlobal: state.setBloomGlobal,
  setGroup: state.setBloomGroup
}), shallow);
```

---

## 🔄 **Migration depuis useState**

### **Avant (DebugPanel avec useState) :**

```javascript
// ❌ AVANT - États dispersés
const DebugPanel = () => {
  const [globalThreshold, setGlobalThreshold] = useState(0.15);
  const [exposureState, setExposureState] = useState(1.0);
  const [bloomValues, setBloomValues] = useState({
    iris: { strength: 0.8, radius: 0.4 }
  });
  const [pbrSettings, setPbrSettings] = useState({
    currentPreset: 'studioProPlus'
  });
  
  const handleThresholdChange = (value) => {
    setGlobalThreshold(value);
    // Puis notifier le SceneStateController
    stateController?.setBloomParameter('global', 'threshold', value);
  };
  
  return (
    <input 
      value={globalThreshold}
      onChange={(e) => handleThresholdChange(e.target.value)}
    />
  );
};
```

### **Après (DebugPanel avec Zustand) :**

```javascript
// ✅ APRÈS - Source unique de vérité
import { useSceneControls } from '../hooks/useSceneControls';

const DebugPanel = () => {
  const { 
    bloom, 
    setBloomGlobal, 
    applyPreset,
    currentPreset 
  } = useSceneControls();
  
  const handleThresholdChange = (value) => {
    // Une seule action, synchronisation automatique
    setBloomGlobal('threshold', value);
  };
  
  return (
    <div>
      <div>Current Preset: {currentPreset || 'None'}</div>
      <input 
        value={bloom.threshold}
        onChange={(e) => handleThresholdChange(e.target.value)}
      />
      <button onClick={() => applyPreset('blanc_dark', BLANC_DARK_PRESET)}>
        Apply Blanc Preset
      </button>
    </div>
  );
};
```

### **Migration Étape par Étape :**

#### **Étape 1 - Setup du Store :**
```bash
npm install zustand @redux-devtools/extension
```

#### **Étape 2 - Créer les Slices :**
```javascript
// Commencer par un slice simple
// slices/bloomSlice.js - Version minimale
export const createBloomSlice = (set, get) => ({
  bloom: {
    threshold: 0.15,
    strength: 0.17,
    radius: 0.4
  },
  
  setBloomParameter: (param, value) => set((state) => ({
    bloom: { ...state.bloom, [param]: value }
  }))
});
```

#### **Étape 3 - Remplacer useState un par un :**
```javascript
// Dans DebugPanel.jsx
// ❌ Supprimer
// const [globalThreshold, setGlobalThreshold] = useState(0.15);

// ✅ Ajouter
const threshold = useSceneStore((state) => state.bloom.threshold);
const setThreshold = useSceneStore((state) => state.setBloomParameter);
```

#### **Étape 4 - Tester & Valider :**
```javascript
// Ajouter des logs temporaires pour vérifier
useEffect(() => {
  console.log('🔍 Bloom threshold changed:', threshold);
}, [threshold]);
```

---

## ⚡ **Performance & Optimizations**

### **1. Sélecteurs Optimaux :**

```javascript
// ❌ BAD - Re-render à chaque changement
const { bloom, pbr, particles } = useSceneStore();

// ✅ GOOD - Re-render seulement si threshold change
const threshold = useSceneStore((state) => state.bloom.threshold);

// 🚀 OPTIMAL - Avec shallow pour objets
const bloomActions = useSceneStore((state) => ({
  setThreshold: state.setBloomGlobal,
  setGroup: state.setBloomGroup
}), shallow);
```

### **2. Custom Equality Functions :**

```javascript
// Pour comparer des objets complexes
const complexValue = useSceneStore(
  (state) => state.bloom.groups.iris,
  (a, b) => a.strength === b.strength && a.radius === b.radius
);
```

### **3. Computed Values :**

```javascript
// Dans le store
export const createBloomSlice = (set, get) => ({
  bloom: { /* ... */ },
  
  // Computed - calculé à la demande
  getBloomIntensity: () => {
    const { bloom } = get();
    return bloom.strength * (1 - bloom.threshold);
  },
  
  // Computed avec cache
  _cachedIntensity: null,
  _lastIntensityCalc: 0,
  
  getBloomIntensityCached: () => {
    const now = Date.now();
    const state = get();
    
    if (now - state._lastIntensityCalc > 100) { // Cache 100ms
      const intensity = state.bloom.strength * (1 - state.bloom.threshold);
      set({ 
        _cachedIntensity: intensity, 
        _lastIntensityCalc: now 
      });
      return intensity;
    }
    
    return state._cachedIntensity;
  }
});
```

### **4. Batching d'Actions :**

```javascript
// ❌ BAD - 3 re-renders
setBloomGlobal('threshold', 0.3);
setBloomGlobal('strength', 0.5);
setBloomGlobal('radius', 0.8);

// ✅ GOOD - 1 re-render
setBatchBloom: (updates) => set((state) => ({
  bloom: { ...state.bloom, ...updates }
}));

// Usage
setBatchBloom({ threshold: 0.3, strength: 0.5, radius: 0.8 });
```

---

## 🛠️ **DevTools & Debugging**

### **1. Configuration DevTools :**

```javascript
const useSceneStore = create()(
  devtools(
    (set, get) => ({ /* ... */ }),
    {
      name: 'V197-SceneStore',
      enabled: process.env.NODE_ENV === 'development',
      anonymousActionType: 'unknown',
      serialize: true
    }
  )
);
```

### **2. Actions Nommées :**

```javascript
// Ajouter des noms d'actions explicites
setBloomParameter: (param, value) => set((state) => ({
  bloom: { ...state.bloom, [param]: value }
}), false, `setBloom-${param}-${value}`), // ← Nom de l'action
```

### **3. Debug Utilities :**

```javascript
// Dans le store
export const createDebugSlice = (set, get) => ({
  _debug: {
    enabled: process.env.NODE_ENV === 'development',
    logs: []
  },
  
  _log: (action, data) => {
    if (!get()._debug.enabled) return;
    
    const entry = {
      timestamp: Date.now(),
      action,
      data,
      state: get().exportState()
    };
    
    set((state) => ({
      _debug: {
        ...state._debug,
        logs: [...state._debug.logs.slice(-99), entry] // Keep last 100
      }
    }));
    
    console.log(`🎯 ${action}:`, data);
  },
  
  getDebugLogs: () => get()._debug.logs,
  clearDebugLogs: () => set((state) => ({
    _debug: { ...state._debug, logs: [] }
  }))
});
```

### **4. Performance Monitoring :**

```javascript
// Hook pour surveiller les performances
export const useStorePerformance = () => {
  const [renderCount, setRenderCount] = useState(0);
  const [lastRender, setLastRender] = useState(Date.now());
  
  useEffect(() => {
    setRenderCount(prev => prev + 1);
    setLastRender(Date.now());
  });
  
  return { renderCount, lastRender };
};

// Dans DebugPanel
const { renderCount } = useStorePerformance();
console.log(`DebugPanel rendered ${renderCount} times`);
```

---

## 💡 **Exemples Concrets pour Ton Projet**

### **1. Application d'un Preset Complet :**

```javascript
// stores/presets.js
export const BLANC_DARK_PRESET = {
  bloom: {
    enabled: true,
    threshold: 0,
    strength: 0.17,
    radius: 0.4,
    groups: {
      iris: { threshold: 0.3, strength: 0.8, radius: 0.4 },
      eyeRings: { threshold: 0.4, strength: 0.6, radius: 0.3 },
      revealRings: { threshold: 0.43, strength: 0.4, radius: 0.36 }
    }
  },
  pbr: {
    currentPreset: 'studioProPlus',
    ambientMultiplier: 1,
    directionalMultiplier: 1,
    customExposure: 1
  },
  camera: {
    position: { x: 1.8, y: 1.4, z: 13.4 },
    fov: 85
  }
};

// Dans le composant
const { applyPreset } = useSceneControls();

const handlePresetSelect = (presetName) => {
  applyPreset(presetName, BLANC_DARK_PRESET);
  
  // Les valeurs dans le DebugPanel se mettent à jour automatiquement !
  // Plus besoin de setState manuels
};
```

### **2. Synchronisation avec SceneStateController :**

```javascript
// Hook pour synchroniser Zustand avec ton SceneStateController existant
export const useSceneStateSync = () => {
  const store = useSceneStore();
  
  useEffect(() => {
    if (!window.sceneStateController) return;
    
    // Subscribe aux changements Zustand → SceneStateController
    const unsubscribe = useSceneStore.subscribe(
      (state) => state.bloom,
      (bloom) => {
        window.sceneStateController.applyBloomSettings(bloom);
      },
      { fireImmediately: true }
    );
    
    return unsubscribe;
  }, []);
  
  // Méthode pour sync SceneStateController → Zustand
  const syncFromController = () => {
    if (!window.sceneStateController) return;
    
    const controllerState = window.sceneStateController.getState();
    store.getState().importState(controllerState);
  };
  
  return { syncFromController };
};
```

### **3. DebugPanel Refactorisé :**

```javascript
// components/DebugPanel.jsx - Version Zustand
import { useSceneControls } from '../hooks/useSceneControls';
import { PRESET_REGISTRY } from '../stores/presets';

const DebugPanel = () => {
  const {
    // État
    bloom,
    pbr,
    currentPreset,
    
    // Actions
    setBloomGlobal,
    setBloomGroup,
    setPbrPreset,
    applyPreset,
    resetAll,
    exportState
  } = useSceneControls();
  
  // ✅ Plus de useState ! Tout vient du store
  
  const handleThresholdChange = (value) => {
    setBloomGlobal('threshold', parseFloat(value));
  };
  
  const handleGroupChange = (group, param, value) => {
    setBloomGroup(group, param, parseFloat(value));
  };
  
  const handlePresetSelect = (presetKey) => {
    const preset = PRESET_REGISTRY[presetKey];
    if (preset) {
      applyPreset(presetKey, preset);
    }
  };
  
  const handleExport = () => {
    const state = exportState();
    console.log('🎯 Current state:', JSON.stringify(state, null, 2));
    
    // Ou copier dans le presse-papier
    navigator.clipboard.writeText(JSON.stringify(state, null, 2));
  };
  
  return (
    <div>
      {/* Header avec preset actuel */}
      <div style={{ marginBottom: '15px' }}>
        <strong>Preset actuel: </strong>
        {currentPreset || 'Aucun'}
        <button onClick={handleExport}>📋 Export</button>
        <button onClick={resetAll}>🔄 Reset All</button>
      </div>
      
      {/* Dropdown Presets */}
      <select onChange={(e) => handlePresetSelect(e.target.value)} value="">
        <option value="">🎯 Choisir un Preset</option>
        {Object.keys(PRESET_REGISTRY).map(key => (
          <option key={key} value={key}>
            {PRESET_REGISTRY[key].description}
          </option>
        ))}
      </select>
      
      {/* Contrôles Bloom - les valeurs viennent du store */}
      <div>
        <h4>🌟 Bloom Global</h4>
        <div>
          <label>Threshold: {bloom.threshold}</label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={bloom.threshold}
            onChange={(e) => handleThresholdChange(e.target.value)}
          />
        </div>
        
        <div>
          <label>Strength: {bloom.strength}</label>
          <input
            type="range"
            min="0"
            max="2"
            step="0.01"
            value={bloom.strength}
            onChange={(e) => setBloomGlobal('strength', parseFloat(e.target.value))}
          />
        </div>
      </div>
      
      {/* Contrôles par Groupe */}
      <div>
        <h4>👁️ Iris Controls</h4>
        <div>
          <label>Strength: {bloom.groups.iris.strength}</label>
          <input
            type="range"
            min="0"
            max="2"
            step="0.01"
            value={bloom.groups.iris.strength}
            onChange={(e) => handleGroupChange('iris', 'strength', e.target.value)}
          />
        </div>
      </div>
      
      {/* PBR Controls */}
      <div>
        <h4>🎨 PBR Settings</h4>
        <div>Current: {pbr.currentPreset}</div>
        <button onClick={() => setPbrPreset('studioProPlus')}>
          Studio Pro+
        </button>
        <button onClick={() => setPbrPreset('chromeShowcase')}>
          Chrome Showcase
        </button>
      </div>
    </div>
  );
};

export default DebugPanel;
```

---

## 🎉 **Avantages Immédiats pour Ton Projet**

### **✅ Ce que tu gagneras :**

1. **Synchronisation Parfaite** : 
   - Preset appliqué → DebugPanel mis à jour instantanément
   - Modification manuelle → Visible partout automatiquement

2. **Code Plus Propre** :
   - Suppression de ~15-20 useState dans DebugPanel
   - Plus de logique de synchronisation manuelle
   - Actions centralisées et réutilisables

3. **Debugging Amélioré** :
   - Redux DevTools avec historique complet
   - Logs d'actions avec timestamps
   - Export/Import d'état facile

4. **Performance** :
   - Re-renders optimaux
   - Sélecteurs granulaires
   - Batching automatique

5. **Extensibilité** :
   - Ajout facile de nouveaux paramètres
   - Presets complexes sans effort
   - Persistance localStorage gratuite

### **🚀 Prochaines Étapes Recommandées :**

1. **Phase 1** : Setup du store de base avec bloom + pbr
2. **Phase 2** : Migration du DebugPanel
3. **Phase 3** : Ajout des autres slices (particules, caméra)
4. **Phase 4** : Intégration des presets
5. **Phase 5** : Optimisations et DevTools

Tu veux qu'on commence par quelle phase ?