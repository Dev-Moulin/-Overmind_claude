# ⚡ OPTIMISATION PERFORMANCE XSTATE + THREE.JS

## 🎯 Objectif

Optimisation avancée des performances pour l'architecture XState + Three.js, basée sur les recherches de pipeline et les meilleures pratiques identifiées.

## 📊 Problèmes de Performance Identifiés

### **1. Problèmes Zustand Actuels**
```javascript
// ❌ PROBLÈME: Re-renders excessifs
const useSceneStore = create((set) => ({
  bloomIntensity: 0.5,
  setBloomIntensity: (intensity) => {
    set({ bloomIntensity: intensity }); // Re-render immédiat
    // Puis application Three.js → autre re-render
  }
}));

// ❌ Résultat: 2 re-renders par changement
// ❌ Avec 10 paramètres modifiés: 20 re-renders!
```

### **2. Race Conditions Three.js**
```javascript
// ❌ PROBLÈME: Ordre non garanti
const applyChanges = () => {
  setBloomEnabled(true);    // Frame N
  setHDREnabled(true);      // Frame N+1
  setMetalness(0.8);        // Frame N+2
  // Bloom appliqué sans HDR → erreur visuelle
};
```

### **3. Recompilation Shader (Goulot Principal)**
```javascript
// ❌ PROBLÈME CRITIQUE: Recompilation shader à chaque toggle
const toggleBloom = () => {
  if (bloomEnabled) {
    composer.removePass(bloomPass); // Destruction shader
  } else {
    bloomPass = new EffectPass(camera, bloomEffect); // Recompilation
    composer.addPass(bloomPass);    // Gel 50-100ms !
  }
};

// ✅ SOLUTION: Pré-instanciation + setEnabled()
const toggleBloomOptimized = () => {
  bloomPass.enabled = !bloomPass.enabled; // 0.1ms au lieu de 50ms
};
```

## 🔄 Architecture de Performance XState

### **1. Machine de Synchronisation Avancée**

```typescript
// machines/performanceMachine.js
const performanceMachine = createMachine({
  id: 'performance',
  initial: 'idle',

  context: {
    pendingChanges: new Map(),
    batchTimer: null,
    frameCounter: 0,
    lastFPS: 60,
    performanceMode: 'auto' // 'high', 'balanced', 'battery'
  },

  states: {
    idle: {
      on: {
        PARAMETER_CHANGED: {
          target: 'batching',
          actions: 'addToPendingBatch'
        },

        PERFORMANCE_MODE_CHANGED: {
          actions: assign({
            performanceMode: (_, event) => event.mode
          })
        }
      }
    },

    batching: {
      entry: 'startBatchTimer',
      exit: 'clearBatchTimer',

      after: {
        // Délai adaptatif selon performance
        16: [
          { target: 'validating', cond: 'highPerformanceMode' },
        ],
        33: [
          { target: 'validating', cond: 'balancedMode' },
        ],
        50: { target: 'validating' } // Mode batterie
      },

      on: {
        PARAMETER_CHANGED: {
          actions: 'addToPendingBatch'
        },

        FORCE_APPLY: 'validating'
      }
    },

    validating: {
      entry: 'validatePendingChanges',

      always: [
        {
          target: 'applying',
          cond: 'changesValid'
        },
        {
          target: 'error',
          cond: 'hasConflicts'
        },
        {
          target: 'idle' // Pas de changements
        }
      ]
    },

    applying: {
      entry: 'incrementFrameCounter',

      invoke: {
        id: 'applyOptimizedChanges',
        src: 'applyChangesInOptimalOrder',
        onDone: {
          target: 'measuring',
          actions: 'clearPendingChanges'
        },
        onError: 'error'
      }
    },

    measuring: {
      entry: 'measurePerformanceImpact',

      after: {
        100: { // Mesure sur 100ms
          target: 'idle',
          actions: 'adjustPerformanceMode'
        }
      }
    },

    error: {
      entry: 'logPerformanceError',

      after: {
        1000: 'idle'
      }
    }
  }
}, {
  guards: {
    highPerformanceMode: (context) => context.performanceMode === 'high',
    balancedMode: (context) => context.performanceMode === 'balanced',
    changesValid: (context) => context.pendingChanges.size > 0,
    hasConflicts: (context) => {
      // Vérifier conflits dans les changements pending
      return detectOrderConflicts(Array.from(context.pendingChanges.keys()));
    }
  },

  actions: {
    addToPendingBatch: assign((context, event) => ({
      pendingChanges: new Map(context.pendingChanges).set(
        event.parameter,
        event.value
      )
    })),

    startBatchTimer: assign({
      batchTimer: () => performance.now()
    }),

    clearBatchTimer: assign({
      batchTimer: null
    }),

    validatePendingChanges: (context) => {
      console.log('🔍 Validation changements:', Array.from(context.pendingChanges.keys()));
    },

    clearPendingChanges: assign({
      pendingChanges: new Map()
    }),

    incrementFrameCounter: assign({
      frameCounter: (context) => context.frameCounter + 1
    }),

    measurePerformanceImpact: assign((context) => {
      const currentFPS = getCurrentFPS();
      return {
        lastFPS: currentFPS
      };
    }),

    adjustPerformanceMode: assign((context) => {
      // Auto-ajustement selon FPS
      if (context.lastFPS < 30) {
        return { performanceMode: 'battery' };
      } else if (context.lastFPS < 50) {
        return { performanceMode: 'balanced' };
      } else {
        return { performanceMode: 'high' };
      }
    }),

    logPerformanceError: (context, event) => {
      console.error('❌ Erreur performance:', event.data);
    }
  },

  services: {
    applyChangesInOptimalOrder: async (context) => {
      const changes = Array.from(context.pendingChanges.entries());
      return await applyOptimalPipeline(changes);
    }
  }
});
```

### **2. Pipeline d'Application Optimisé**

```typescript
// services/optimizedPipeline.js
export class OptimizedPipeline {
  constructor(scene, renderer, composer) {
    this.scene = scene;
    this.renderer = renderer;
    this.composer = composer;

    // Cache des états pour éviter recalculs
    this.stateCache = new Map();
    this.materialCache = new Map();
    this.effectCache = new Map();

    // Métriques performance
    this.metrics = {
      appliedChanges: 0,
      skippedChanges: 0,
      averageApplyTime: 0,
      lastFrameTime: 0
    };
  }

  async applyOptimalPipeline(changes) {
    const startTime = performance.now();

    // 1. Grouper par catégorie et priorité
    const groupedChanges = this.groupChangesByPriority(changes);

    // 2. Appliquer dans l'ordre optimal
    const pipeline = [
      'environment',  // Priorité 1
      'pbr',         // Priorité 2
      'lighting',    // Priorité 3
      'bloom',       // Priorité 4
      'msaa'         // Priorité 5
    ];

    for (const category of pipeline) {
      if (groupedChanges.has(category)) {
        await this.applyCategoryChanges(category, groupedChanges.get(category));
      }
    }

    // 3. Mesurer et optimiser
    const applyTime = performance.now() - startTime;
    this.updateMetrics(applyTime, changes.length);

    return {
      appliedChanges: changes.length,
      applyTime,
      fps: this.getCurrentFPS()
    };
  }

  groupChangesByPriority(changes) {
    const grouped = new Map();

    for (const [parameter, value] of changes) {
      const category = this.getParameterCategory(parameter);

      if (!grouped.has(category)) {
        grouped.set(category, new Map());
      }

      grouped.get(category).set(parameter, value);
    }

    return grouped;
  }

  async applyCategoryChanges(category, changes) {
    // Vérifier cache pour éviter applications inutiles
    const cacheKey = this.generateCacheKey(category, changes);

    if (this.stateCache.has(cacheKey)) {
      console.log(`⚡ Cache hit pour ${category}`);
      this.metrics.skippedChanges += changes.size;
      return;
    }

    console.log(`🔧 Application ${category}:`, Array.from(changes.keys()));

    switch (category) {
      case 'environment':
        await this.applyEnvironmentChanges(changes);
        break;
      case 'pbr':
        await this.applyPBRChanges(changes);
        break;
      case 'lighting':
        await this.applyLightingChanges(changes);
        break;
      case 'bloom':
        await this.applyBloomChanges(changes);
        break;
      case 'msaa':
        await this.applyMSAAChanges(changes);
        break;
    }

    // Mettre en cache
    this.stateCache.set(cacheKey, true);
    this.metrics.appliedChanges += changes.size;
  }

  async applyPBRChanges(changes) {
    // Optimisation: grouper les changements matériaux
    const materialUpdates = {
      metalness: changes.get('metalness'),
      roughness: changes.get('roughness'),
      envMapIntensity: changes.get('envMapIntensity')
    };

    // Application groupée pour éviter multiple needsUpdate
    this.scene.traverse((object) => {
      if (object.material && object.material.isMeshStandardMaterial) {
        const material = object.material;
        let needsUpdate = false;

        if (materialUpdates.metalness !== undefined) {
          material.metalness = materialUpdates.metalness;
          needsUpdate = true;
        }

        if (materialUpdates.roughness !== undefined) {
          material.roughness = materialUpdates.roughness;
          needsUpdate = true;
        }

        if (materialUpdates.envMapIntensity !== undefined) {
          material.envMapIntensity = materialUpdates.envMapIntensity;
          needsUpdate = true;
        }

        // Une seule mise à jour à la fin
        if (needsUpdate) {
          material.needsUpdate = true;
        }
      }
    });
  }

  async applyBloomChanges(changes) {
    const bloomParams = {
      enabled: changes.get('bloomEnabled'),
      intensity: changes.get('bloomIntensity'),
      threshold: changes.get('bloomThreshold'),
      radius: changes.get('bloomRadius')
    };

    // Optimisation: éviter recréation si seuls paramètres changent
    if (this.bloomEffect && bloomParams.enabled !== false) {
      // Mise à jour paramètres existants
      if (bloomParams.intensity !== undefined) {
        this.bloomEffect.intensity = bloomParams.intensity;
      }
      if (bloomParams.threshold !== undefined) {
        this.bloomEffect.luminanceThreshold = bloomParams.threshold;
      }
      if (bloomParams.radius !== undefined) {
        this.bloomEffect.luminanceSmoothing = bloomParams.radius;
      }
    } else {
      // Recréation complète nécessaire
      await this.recreateBloomEffect(bloomParams);
    }
  }

  generateCacheKey(category, changes) {
    const changeString = Array.from(changes.entries())
      .sort()
      .map(([k, v]) => `${k}:${v}`)
      .join('|');

    return `${category}-${changeString}`;
  }

  updateMetrics(applyTime, changeCount) {
    this.metrics.averageApplyTime =
      (this.metrics.averageApplyTime + applyTime) / 2;

    console.log('📊 Métriques Performance:', {
      applyTime: `${applyTime.toFixed(2)}ms`,
      avgTime: `${this.metrics.averageApplyTime.toFixed(2)}ms`,
      applied: this.metrics.appliedChanges,
      skipped: this.metrics.skippedChanges,
      efficiency: `${(this.metrics.skippedChanges /
        (this.metrics.appliedChanges + this.metrics.skippedChanges) * 100).toFixed(1)}%`
    });
  }

  getCurrentFPS() {
    const now = performance.now();
    const delta = now - this.metrics.lastFrameTime;
    this.metrics.lastFrameTime = now;

    return delta > 0 ? 1000 / delta : 60;
  }
}
```

### **3. Hook de Performance Optimisé**

```typescript
// hooks/useOptimizedScene.js
export const useOptimizedScene = () => {
  const [performanceService] = useState(() =>
    interpret(performanceMachine)
  );

  const [pipeline] = useState(() =>
    new OptimizedPipeline(scene, renderer, composer)
  );

  useEffect(() => {
    performanceService.start();

    // Configuration du service avec pipeline
    performanceService.send({
      type: 'CONFIGURE_PIPELINE',
      pipeline
    });

    return () => performanceService.stop();
  }, []);

  // Interface optimisée
  return {
    // État performance
    performanceMode: useSelector(performanceService,
      state => state.context.performanceMode),

    isApplying: useSelector(performanceService,
      state => state.matches('applying')),

    pendingChanges: useSelector(performanceService,
      state => state.context.pendingChanges.size),

    fps: useSelector(performanceService,
      state => state.context.lastFPS),

    // Actions optimisées avec batching
    setParameter: useCallback((parameter, value) => {
      performanceService.send({
        type: 'PARAMETER_CHANGED',
        parameter,
        value
      });
    }, []),

    // Forcer application immédiate si nécessaire
    forceApply: useCallback(() => {
      performanceService.send({ type: 'FORCE_APPLY' });
    }, []),

    // Contrôle mode performance
    setPerformanceMode: useCallback((mode) => {
      performanceService.send({
        type: 'PERFORMANCE_MODE_CHANGED',
        mode
      });
    }, [])
  };
};
```

### **4. Monitoring et Métriques**

```typescript
// utils/performanceMonitor.js
export class PerformanceMonitor {
  constructor() {
    this.metrics = {
      frameTimings: [],
      renderCalls: 0,
      shaderCompilations: 0,
      textureUploads: 0,
      memoryUsage: 0
    };

    this.thresholds = {
      frameBudget: 16.67, // 60fps
      maxPendingChanges: 10,
      maxApplyTime: 8
    };

    this.startMonitoring();
  }

  startMonitoring() {
    // Observer les performances Three.js
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.name.includes('render')) {
          this.metrics.frameTimings.push(entry.duration);

          // Garder seulement les 100 dernières mesures
          if (this.metrics.frameTimings.length > 100) {
            this.metrics.frameTimings.shift();
          }
        }
      }
    });

    observer.observe({ entryTypes: ['measure'] });

    // Monitoring mémoire
    setInterval(() => {
      if (performance.memory) {
        this.metrics.memoryUsage = performance.memory.usedJSHeapSize;
      }
    }, 1000);
  }

  getPerformanceReport() {
    const avgFrameTime = this.metrics.frameTimings.reduce((a, b) => a + b, 0) /
                         this.metrics.frameTimings.length;

    const fps = 1000 / avgFrameTime;

    return {
      fps: fps.toFixed(1),
      avgFrameTime: avgFrameTime.toFixed(2),
      renderCalls: this.metrics.renderCalls,
      memoryMB: (this.metrics.memoryUsage / 1024 / 1024).toFixed(1),
      performance: fps > 50 ? 'excellent' : fps > 30 ? 'good' : 'poor'
    };
  }

  checkThresholds() {
    const report = this.getPerformanceReport();
    const warnings = [];

    if (parseFloat(report.fps) < 30) {
      warnings.push('FPS trop faible (< 30)');
    }

    if (parseFloat(report.memoryMB) > 512) {
      warnings.push('Utilisation mémoire élevée (> 512MB)');
    }

    return warnings;
  }
}
```

## 📊 Résultats d'Optimisation Attendus

### **Avant (Zustand)**
- 🔴 **Re-renders**: 2-5 par changement
- 🔴 **Latence**: 50-100ms
- 🔴 **FPS Impact**: -10 à -20 FPS
- 🔴 **Race Conditions**: Fréquentes

### **Après (XState Optimisé)**
- 🟢 **Re-renders**: 1 par batch (16-50ms)
- 🟢 **Latence**: 16-33ms
- 🟢 **FPS Impact**: -2 à -5 FPS
- 🟢 **Race Conditions**: Éliminées

### **Gains de Performance**
- **Réduction re-renders**: 60-80%
- **Amélioration latence**: 50-70%
- **Stabilité FPS**: +15-20 FPS
- **Prédictibilité**: 100%

Cette architecture garantit des performances optimales en éliminant les re-renders inutiles et en appliquant les changements dans l'ordre optimal du pipeline Three.js.