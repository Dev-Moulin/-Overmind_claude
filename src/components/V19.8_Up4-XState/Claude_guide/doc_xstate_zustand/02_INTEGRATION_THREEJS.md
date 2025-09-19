# 🎮 INTÉGRATION XSTATE AVEC THREE.JS + PMNDRS/POSTPROCESSING

## 🎯 Objectif

Intégration directe des machines XState avec le pipeline de rendu Three.js et pmndrs/postprocessing, basée sur les recherches approfondies sur l'ordre optimal des réglages.

## 🔄 Ordre de Rendu Optimal (Recherché et Validé)

### **Pipeline de Rendu Recommandé**
```
1. Environment/HDR → 2. PBR Materials → 3. Lighting → 4. Bloom → 5. MSAA
```

Cette séquence élimine les conflits et garantit la cohérence visuelle.

## 🏗️ Architecture d'Intégration

### **1. Service Principal ThreeJS**

```typescript
// services/threeJSService.js
import { interpret } from 'xstate';
import { sceneMachine } from '../machines/sceneMachine';
import { renderSyncMachine } from '../machines/renderSyncMachine';

class ThreeJSService {
  constructor(scene, renderer, composer) {
    this.scene = scene;
    this.renderer = renderer;
    this.composer = composer;

    // Services XState
    this.sceneService = interpret(sceneMachine);
    this.syncService = interpret(renderSyncMachine);

    // Pipeline state
    this.pipelineState = {
      environmentLoaded: false,
      pbrMaterialsReady: false,
      lightingConfigured: false,
      bloomConfigured: false,
      msaaEnabled: false
    };

    this.init();
  }

  init() {
    // Écouter les changements XState
    this.sceneService.onTransition((state) => {
      this.handleSceneStateChange(state);
    });

    this.syncService.onTransition((state) => {
      this.handleSyncStateChange(state);
    });

    // Démarrer les services
    this.sceneService.start();
    this.syncService.start();
  }

  handleSceneStateChange(state) {
    const { context } = state;

    // Appliquer les changements selon l'ordre du pipeline
    this.applyPipelineChanges(context);
  }

  async applyPipelineChanges(context) {
    try {
      // 1. Environment/HDR (priorité 1)
      if (context.HDREnabled && !this.pipelineState.environmentLoaded) {
        await this.setupHDREnvironment(context);
      }

      // 2. PBR Materials (priorité 2)
      if (this.pipelineState.environmentLoaded) {
        await this.updatePBRMaterials(context);
      }

      // 3. Lighting (priorité 3)
      if (this.pipelineState.pbrMaterialsReady) {
        await this.updateLighting(context);
      }

      // 4. Bloom (priorité 4)
      if (this.pipelineState.lightingConfigured) {
        await this.updateBloomEffect(context);
      }

      // 5. MSAA (priorité 5)
      if (this.pipelineState.bloomConfigured) {
        await this.updateMSAA(context);
      }

    } catch (error) {
      console.error('❌ Erreur pipeline:', error);
      this.sceneService.send({ type: 'PIPELINE_ERROR', error });
    }
  }
}
```

### **2. Implémentation des Étapes du Pipeline**

```typescript
// Pipeline Step 1: Environment/HDR
async setupHDREnvironment(context) {
  if (!context.HDREnabled) return;

  console.log('🌅 1. Configuration Environment/HDR');

  // Reconfigurer le renderer pour HDR
  this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
  this.renderer.toneMappingExposure = context.exposure;
  this.renderer.outputColorSpace = THREE.LinearSRGBColorSpace;

  // Reconfigurer le composer avec HalfFloat
  const newComposer = new EffectComposer(this.renderer, {
    frameBufferType: THREE.HalfFloatType
  });

  // Transférer les passes existantes
  this.composer.passes.forEach(pass => {
    newComposer.addPass(pass);
  });

  this.composer = newComposer;

  // Charger l'environment map si spécifiée
  if (context.environmentMapUrl) {
    await this.loadEnvironmentMap(context.environmentMapUrl);
  }

  this.pipelineState.environmentLoaded = true;
  console.log('✅ Environment/HDR configuré');
}

// Pipeline Step 2: PBR Materials
async updatePBRMaterials(context) {
  console.log('🔮 2. Mise à jour PBR Materials');

  this.scene.traverse((object) => {
    if (object.material && object.material.isMeshStandardMaterial) {
      // Appliquer les paramètres PBR
      object.material.metalness = context.metalness;
      object.material.roughness = context.roughness;

      // Environment map si disponible
      if (this.scene.environment) {
        object.material.envMap = this.scene.environment;
        object.material.envMapIntensity = context.envMapIntensity || 1.0;
      }

      object.material.needsUpdate = true;
    }
  });

  this.pipelineState.pbrMaterialsReady = true;
  console.log('✅ PBR Materials mis à jour');
}

// Pipeline Step 3: Lighting
async updateLighting(context) {
  console.log('💡 3. Configuration Lighting');

  // Physically correct lights
  this.renderer.physicallyCorrectLights = context.physicallyCorrectLights;

  // Mise à jour des lumières existantes
  this.scene.traverse((object) => {
    if (object.isLight) {
      if (object.isAmbientLight) {
        object.intensity = context.ambientMultiplier;
      } else if (object.isDirectionalLight) {
        object.intensity = context.directionalMultiplier;
      }
    }
  });

  this.pipelineState.lightingConfigured = true;
  console.log('✅ Lighting configuré');
}

// Pipeline Step 4: Bloom Effect
async updateBloomEffect(context) {
  console.log('✨ 4. Configuration Bloom Effect');

  if (context.bloomEnabled) {
    // Vérifier que HDR est activé (prerequis)
    if (!this.pipelineState.environmentLoaded) {
      console.warn('⚠️ HDR requis pour Bloom, activation automatique');
      await this.setupHDREnvironment({ ...context, HDREnabled: true });
    }

    // Configurer ou mettre à jour l'effet bloom
    if (!this.bloomPass) {
      const bloomEffect = new BloomEffect({
        intensity: context.bloomIntensity,
        luminanceThreshold: context.bloomThreshold,
        luminanceSmoothing: context.bloomRadius
      });

      this.bloomPass = new EffectPass(this.camera, bloomEffect);
      this.composer.addPass(this.bloomPass, this.composer.passes.length - 1);
    } else {
      // Mettre à jour les paramètres existants
      const bloomEffect = this.bloomPass.effects[0];
      bloomEffect.intensity = context.bloomIntensity;
      bloomEffect.luminanceThreshold = context.bloomThreshold;
      bloomEffect.luminanceSmoothing = context.bloomRadius;
    }
  } else {
    // Désactiver bloom
    if (this.bloomPass) {
      this.composer.removePass(this.bloomPass);
      this.bloomPass = null;
    }
  }

  this.pipelineState.bloomConfigured = true;
  console.log('✅ Bloom Effect configuré');
}

// Pipeline Step 5: MSAA
async updateMSAA(context) {
  console.log('🔧 5. Configuration MSAA');

  if (context.msaaEnabled && this.isWebGL2Supported()) {
    // Vérifier compatibilité WebGL2
    const samples = Math.min(context.msaaSamples, this.getMaxSamples());

    // Reconfigurer le composer avec MSAA
    const msaaComposer = new EffectComposer(this.renderer, {
      frameBufferType: THREE.HalfFloatType,
      multisampling: samples
    });

    // Transférer toutes les passes
    this.composer.passes.forEach(pass => {
      msaaComposer.addPass(pass);
    });

    this.composer = msaaComposer;
    console.log(`✅ MSAA x${samples} activé`);
  } else {
    // Désactiver MSAA si nécessaire
    if (this.composer.multisampling > 0) {
      const noMsaaComposer = new EffectComposer(this.renderer, {
        frameBufferType: THREE.HalfFloatType
      });

      this.composer.passes.forEach(pass => {
        noMsaaComposer.addPass(pass);
      });

      this.composer = noMsaaComposer;
    }
  }

  this.pipelineState.msaaEnabled = context.msaaEnabled;
  console.log('✅ MSAA configuré');
}
```

### **3. Synchronisation Bidirectionnelle**

```typescript
// hooks/useThreeJSSync.js
export const useThreeJSSync = (sceneRef, rendererRef, composerRef) => {
  const [sceneService] = useState(() =>
    interpret(sceneMachine.withConfig({
      services: {
        applyChangesToScene: async (context) => {
          if (!sceneRef.current) return;

          const service = new ThreeJSService(
            sceneRef.current,
            rendererRef.current,
            composerRef.current
          );

          await service.applyPipelineChanges(context);
          return context;
        }
      }
    }))
  );

  useEffect(() => {
    sceneService.start();
    return () => sceneService.stop();
  }, []);

  // Interface pour les composants UI
  return {
    state: useSelector(sceneService, state => state),
    context: useSelector(sceneService, state => state.context),

    // Actions disponibles
    actions: {
      toggleBloom: () => sceneService.send({ type: 'TOGGLE_BLOOM' }),
      setBloomIntensity: (value) =>
        sceneService.send({ type: 'SET_BLOOM_INTENSITY', value }),
      setMetalness: (value) =>
        sceneService.send({ type: 'SET_METALNESS', value }),
      setRoughness: (value) =>
        sceneService.send({ type: 'SET_ROUGHNESS', value }),
      applyPreset: (preset) =>
        sceneService.send({ type: 'APPLY_PRESET', values: preset }),
      loadEnvironment: (hdriUrl) =>
        sceneService.send({ type: 'LOAD_ENVIRONMENT', hdriUrl })
    },

    // État du pipeline
    pipelineState: useSelector(sceneService, state => ({
      isApplying: state.matches('applying'),
      isLoading: state.matches('loading_environment'),
      hasError: state.matches('error'),
      pendingChanges: state.context.pendingChanges || []
    }))
  };
};
```

### **4. Pré-instanciation des Passes (Performance Critique)**

```typescript
// services/effectPassManager.js
export class EffectPassManager {
  constructor(renderer, camera, scene) {
    this.renderer = renderer;
    this.camera = camera;
    this.scene = scene;

    // Pré-instancier TOUS les effets pour éviter recompilation shader
    this.effects = this.createAllEffects();
    this.passes = this.createAllPasses();

    // Composer principal
    this.composer = new EffectComposer(renderer);
    this.setupBasePipeline();
  }

  createAllEffects() {
    return {
      bloom: new BloomEffect({
        intensity: 0.5,
        luminanceThreshold: 0.85,
        luminanceSmoothing: 0.4
      }),

      ssao: new SSAOEffect(this.camera, this.scene, {
        distanceThreshold: 1.0,
        rangeThreshold: 0.5,
        samples: 32
      }),

      chromaticAberration: new ChromaticAberrationEffect({
        offset: new Vector2(0.001, 0.001)
      }),

      // Autres effets pré-instanciés...
    };
  }

  createAllPasses() {
    return {
      render: new RenderPass(this.scene, this.camera),

      // Passes d'effets avec tous les effets pré-créés
      bloom: new EffectPass(this.camera, this.effects.bloom),
      ssao: new EffectPass(this.camera, this.effects.ssao),
      chromatic: new EffectPass(this.camera, this.effects.chromaticAberration),

      // Pass final toujours actif
      copy: new ShaderPass(CopyShader)
    };
  }

  setupBasePipeline() {
    // Ajouter TOUTES les passes, désactivées par défaut
    this.composer.addPass(this.passes.render);

    // Effets désactivés par défaut
    this.passes.bloom.enabled = false;
    this.passes.ssao.enabled = false;
    this.passes.chromatic.enabled = false;

    this.composer.addPass(this.passes.bloom);
    this.composer.addPass(this.passes.ssao);
    this.composer.addPass(this.passes.chromatic);

    // Pass final toujours rendu à l'écran
    this.passes.copy.renderToScreen = true;
    this.composer.addPass(this.passes.copy);
  }

  // Actions XState pour activation/désactivation SANS recompilation
  enableBloom(intensity = 0.5, threshold = 0.85, radius = 0.4) {
    this.effects.bloom.intensity = intensity;
    this.effects.bloom.luminanceThreshold = threshold;
    this.effects.bloom.luminanceSmoothing = radius;

    // ✅ CRITIQUE: setEnabled() au lieu de addPass/removePass
    this.passes.bloom.enabled = true;

    console.log('✅ Bloom activé sans recompilation shader');
  }

  disableBloom() {
    this.passes.bloom.enabled = false;
    console.log('✅ Bloom désactivé sans recompilation shader');
  }

  updateBloomParams(intensity, threshold, radius) {
    if (this.passes.bloom.enabled) {
      this.effects.bloom.intensity = intensity;
      this.effects.bloom.luminanceThreshold = threshold;
      this.effects.bloom.luminanceSmoothing = radius;
    }
  }

  // Gestion HDR avec recréation contrôlée
  enableHDR() {
    // Seule exception: HDR nécessite recréation composer
    const oldComposer = this.composer;

    this.composer = new EffectComposer(this.renderer, {
      frameBufferType: THREE.HalfFloatType // HDR
    });

    // Transférer les passes existantes
    oldComposer.passes.forEach(pass => {
      this.composer.addPass(pass);
    });

    // Nettoyage
    oldComposer.dispose();

    console.log('✅ HDR activé avec nouvelle FrameBuffer');
  }
}
```

### **5. Gestion des Assets Asynchrones**

```typescript
// services/assetLoader.js
export class AssetLoaderService {
  constructor() {
    this.loadingCache = new Map();
    this.loadedAssets = new Map();
  }

  async loadEnvironmentMap(hdriUrl) {
    // Cache des chargements
    if (this.loadingCache.has(hdriUrl)) {
      return this.loadingCache.get(hdriUrl);
    }

    if (this.loadedAssets.has(hdriUrl)) {
      return this.loadedAssets.get(hdriUrl);
    }

    // Nouveau chargement
    const loadPromise = this._loadHDRI(hdriUrl);
    this.loadingCache.set(hdriUrl, loadPromise);

    try {
      const envMap = await loadPromise;
      this.loadedAssets.set(hdriUrl, envMap);
      this.loadingCache.delete(hdriUrl);
      return envMap;
    } catch (error) {
      this.loadingCache.delete(hdriUrl);
      throw error;
    }
  }

  async _loadHDRI(hdriUrl) {
    return new Promise((resolve, reject) => {
      const loader = new RGBELoader();
      loader.load(
        hdriUrl,
        (texture) => {
          const pmrem = new THREE.PMREMGenerator(renderer);
          const envMap = pmrem.fromEquirectangular(texture).texture;

          texture.dispose();
          pmrem.dispose();

          resolve(envMap);
        },
        undefined,
        reject
      );
    });
  }
}
```

### **6. Validation des Dépendances en Temps Réel**

```typescript
// guards/dependencyGuards.js
export const createDependencyGuards = (threeJSService) => ({
  // HDR requis pour bloom
  hdrRequiredForBloom: (context) => {
    return context.bloomEnabled && !threeJSService.pipelineState.environmentLoaded;
  },

  // Environment map requis pour PBR réaliste
  environmentRequiredForPBR: (context) => {
    return (context.metalness > 0.1 || context.roughness < 0.9) &&
           !threeJSService.scene.environment;
  },

  // WebGL2 requis pour MSAA
  webgl2RequiredForMSAA: (context) => {
    return context.msaaEnabled && !threeJSService.isWebGL2Supported();
  },

  // Performance guard pour bloom haute intensité
  performanceAllowsBloom: (context) => {
    const fps = threeJSService.getCurrentFPS();
    return !context.bloomEnabled || fps > 45 || context.bloomIntensity < 2.0;
  }
});
```

## 🔥 Avantages de cette Intégration

### **1. Ordre Garanti**
- Pipeline respecté à chaque changement
- Pas de conflits entre effets
- Synchronisation automatique

### **2. Performance Optimisée**
- Batching des changements via RenderSyncMachine
- Cache des assets HDRI
- Validation des prérequis avant application

### **3. Debugging Avancé**
- État du pipeline visible dans XState devtools
- Traçabilité complète des transitions
- Validation des dépendances en temps réel

### **4. Maintenance Facilitée**
- Logique de rendu centralisée
- Testable unitairement
- Documentation automatique via machines XState

Cette architecture garantit une synchronisation parfaite entre l'UI et le rendu Three.js, en respectant l'ordre optimal des réglages découvert par la recherche approfondie.