/**
 * 🌍 B4 Environment Actions
 * Actions XState pour EnvironmentMachine
 */

import { assign } from 'xstate';
import type { EnvironmentContext, EnvironmentEvent } from './environmentTypes';
import * as THREE from 'three';

// ====================================
// ACTIONS HDR SYSTEM
// ====================================

export const hdrActions = {
  /**
   * Initialiser état de chargement HDR
   */
  setLoadingState: assign<EnvironmentContext, EnvironmentEvent>({
    systemState: (context) => ({
      ...context.systemState,
      loading: true,
      error: null,
      lastUpdate: Date.now()
    }),
    hdr: (context, event) => {
      if (event.type === 'HDR.LOAD') {
        return {
          ...context.hdr,
          currentMap: event.path,
          ...event.config
        };
      }
      return context.hdr;
    }
  }),

  /**
   * Succès chargement HDR
   */
  onHDRLoadSuccess: assign<EnvironmentContext, EnvironmentEvent>({
    systemState: (context) => ({
      ...context.systemState,
      loading: false,
      ready: true,
      lastUpdate: Date.now()
    }),
    performance: (context, event) => ({
      ...context.performance,
      hdrLoadTime: (event as any).data?.loadTime || 0
    }),
    threeJS: (context, event) => ({
      ...context.threeJS,
      currentEnvironment: (event as any).data?.texture || null
    }),
    cache: (context, event) => {
      const texture = (event as any).data?.texture;
      const path = context.hdr.currentMap;

      if (texture && path) {
        const newHdrMaps = new Map(context.cache.hdrMaps);
        newHdrMaps.set(path, texture);

        const newLruTracking = new Map(context.cache.lruTracking);
        newLruTracking.set(path, Date.now());

        return {
          ...context.cache,
          hdrMaps: newHdrMaps,
          lruTracking: newLruTracking,
          memoryUsage: context.cache.memoryUsage + ((event as any).data?.memoryUsage || 0)
        };
      }
      return context.cache;
    }
  }),

  /**
   * Erreur chargement HDR
   */
  onHDRLoadError: assign<EnvironmentContext, EnvironmentEvent>({
    systemState: (context, event) => ({
      ...context.systemState,
      loading: false,
      error: (event as any).data?.message || 'HDR load failed',
      ready: false
    })
  }),

  /**
   * Décharger HDR actuel
   */
  unloadHDR: assign<EnvironmentContext, EnvironmentEvent>({
    hdr: (context) => ({
      ...context.hdr,
      currentMap: null
    }),
    systemState: (context) => ({
      ...context.systemState,
      ready: false,
      lastUpdate: Date.now()
    }),
    threeJS: (context) => {
      // Nettoyer environment de la scène
      if (context.threeJS.scene) {
        context.threeJS.scene.environment = null;
        context.threeJS.scene.background = null;
      }

      return {
        ...context.threeJS,
        currentEnvironment: null
      };
    }
  }),

  /**
   * Modifier intensité HDR
   */
  setHDRIntensity: assign<EnvironmentContext, EnvironmentEvent>({
    hdr: (context, event) => ({
      ...context.hdr,
      intensity: event.type === 'HDR.SET_INTENSITY' ? event.intensity : context.hdr.intensity
    })
  }),

  /**
   * Modifier rotation HDR
   */
  setHDRRotation: assign<EnvironmentContext, EnvironmentEvent>({
    hdr: (context, event) => ({
      ...context.hdr,
      rotation: event.type === 'HDR.SET_ROTATION' ? event.rotation : context.hdr.rotation
    })
  }),

  /**
   * Basculer background HDR
   */
  toggleHDRBackground: assign<EnvironmentContext, EnvironmentEvent>({
    hdr: (context) => ({
      ...context.hdr,
      background: !context.hdr.background
    })
  })
};

// ====================================
// ACTIONS BRIDGE B3 LIGHTING
// ====================================

export const bridgeActions = {
  /**
   * Initier connexion bridge
   */
  initiateBridgeConnection: assign<EnvironmentContext, EnvironmentEvent>({
    lightingBridge: (context) => ({
      ...context.lightingBridge,
      connected: false
    }),
    systemState: (context) => ({
      ...context.systemState,
      lastUpdate: Date.now()
    })
  }),

  /**
   * Connexion bridge réussie
   */
  onBridgeConnected: assign<EnvironmentContext, EnvironmentEvent>({
    lightingBridge: (context, event) => ({
      ...context.lightingBridge,
      connected: true,
      syncEnabled: true
    }),
    systemState: (context) => ({
      ...context.systemState,
      lastUpdate: Date.now()
    })
  }),

  /**
   * Erreur connexion bridge
   */
  onBridgeConnectionError: assign<EnvironmentContext, EnvironmentEvent>({
    lightingBridge: (context) => ({
      ...context.lightingBridge,
      connected: false
    }),
    systemState: (context, event) => ({
      ...context.systemState,
      error: `Bridge connection failed: ${(event as any).data?.message || 'Unknown error'}`,
      lastUpdate: Date.now()
    })
  }),

  /**
   * Déconnecter bridge
   */
  disconnectBridge: assign<EnvironmentContext, EnvironmentEvent>({
    lightingBridge: (context) => ({
      ...context.lightingBridge,
      connected: false,
      syncEnabled: false
    })
  }),

  /**
   * Synchroniser avec B3 Lighting
   */
  syncWithLighting: assign<EnvironmentContext, EnvironmentEvent>({
    lightingBridge: (context, event) => {
      if (event.type === 'BRIDGE.SYNC' && event.lightingData) {
        return {
          ...context.lightingBridge,
          lightingIntensity: event.lightingData.intensity || context.lightingBridge.lightingIntensity,
          hdrBoost: event.lightingData.hdrBoost || context.lightingBridge.hdrBoost,
          directionalShadows: event.lightingData.shadows !== undefined
            ? event.lightingData.shadows
            : context.lightingBridge.directionalShadows
        };
      }
      return context.lightingBridge;
    },
    hdr: (context, event) => {
      // Synchroniser intensité HDR avec lighting
      if (event.type === 'BRIDGE.SYNC' && event.lightingData?.intensity) {
        return {
          ...context.hdr,
          environmentIntensity: event.lightingData.intensity * context.lightingBridge.ambientContribution
        };
      }
      return context.hdr;
    }
  }),

  /**
   * Mettre à jour contribution ambient
   */
  updateLightingContribution: assign<EnvironmentContext, EnvironmentEvent>({
    lightingBridge: (context, event) => ({
      ...context.lightingBridge,
      ambientContribution: event.type === 'BRIDGE.UPDATE_CONTRIBUTION' ? event.ambient : context.lightingBridge.ambientContribution
    })
  }),

  /**
   * Timeout connexion bridge
   */
  onBridgeTimeout: assign<EnvironmentContext, EnvironmentEvent>({
    systemState: (context) => ({
      ...context.systemState,
      error: 'Bridge connection timeout'
    })
  }),

  /**
   * Synchronisation périodique
   */
  periodicSync: (context: EnvironmentContext) => {
    // Vérifier état lighting via window global si disponible
    if (typeof window !== 'undefined' && (window as any).visualEffectsControls) {
      const lightingControls = (window as any).visualEffectsControls.lighting;

      if (lightingControls && context.lightingBridge.connected) {
        console.log('🔄 Periodic sync with B3 Lighting');

        // Ici on peut déclencher une synchronisation automatique
        // Cette action peut envoyer un événement BRIDGE.SYNC
      }
    }
  }
};

// ====================================
// ACTIONS QUALITY MANAGEMENT
// ====================================

export const qualityActions = {
  /**
   * Définir niveau qualité
   */
  setQualityLevel: assign<EnvironmentContext, EnvironmentEvent>({
    quality: (context, event) => ({
      ...context.quality,
      current: event.type === 'QUALITY.SET_LEVEL' ? event.level : context.quality.current,
      adaptiveEnabled: false,
      lodLevel: getLODLevelForQuality(event.type === 'QUALITY.SET_LEVEL' ? event.level : context.quality.current)
    })
  }),

  /**
   * Activer qualité adaptive
   */
  enableAdaptiveQuality: assign<EnvironmentContext, EnvironmentEvent>({
    quality: (context) => ({
      ...context.quality,
      current: 'auto',
      adaptiveEnabled: true
    })
  }),

  /**
   * Désactiver qualité adaptive
   */
  disableAdaptiveQuality: assign<EnvironmentContext, EnvironmentEvent>({
    quality: (context) => ({
      ...context.quality,
      adaptiveEnabled: false
    })
  }),

  /**
   * Ajustement automatique qualité
   */
  autoAdjustQuality: assign<EnvironmentContext, EnvironmentEvent>({
    performance: (context, event) => {
      const newHistory = [...context.performance.adaptiveHistory];

      if (event.type === 'QUALITY.AUTO_ADJUST') {
        newHistory.push(event.targetFPS);

        // Garder seulement les 10 dernières mesures
        if (newHistory.length > 10) {
          newHistory.shift();
        }
      }

      return {
        ...context.performance,
        qualityAdjustments: context.performance.qualityAdjustments + 1,
        adaptiveHistory: newHistory
      };
    },
    quality: (context, event) => {
      if (event.type === 'QUALITY.AUTO_ADJUST' && context.quality.adaptiveEnabled) {
        const currentFPS = event.targetFPS;
        let newLevel = context.quality.current;

        // Logique ajustement adaptatif
        if (currentFPS < context.quality.minFPS) {
          // Réduire qualité
          newLevel = getNextLowerQuality(context.quality.current);
        } else if (currentFPS > context.quality.maxFPS && currentFPS > context.quality.targetFPS + 10) {
          // Augmenter qualité
          newLevel = getNextHigherQuality(context.quality.current);
        }

        return {
          ...context.quality,
          current: newLevel,
          lodLevel: getLODLevelForQuality(newLevel)
        };
      }
      return context.quality;
    }
  }),

  /**
   * Monitoring performance
   */
  monitorPerformance: (context: EnvironmentContext) => {
    // Logique monitoring FPS et ajustements
    if (context.quality.adaptiveEnabled) {
      console.log('📊 Monitoring performance for adaptive quality');
    }
  }
};

// ====================================
// ACTIONS CACHE MANAGEMENT
// ====================================

export const cacheActions = {
  /**
   * Vérifier cache HDR
   */
  checkCache: (context: EnvironmentContext, event: any) => {
    if (event.type === 'HDR.LOAD') {
      const cached = context.cache.hdrMaps.has(event.path);
      console.log(`💾 Cache ${cached ? 'hit' : 'miss'} for: ${event.path}`);
    }
  },

  /**
   * Démarrer préchargement
   */
  startPreload: assign<EnvironmentContext, EnvironmentEvent>({
    cache: (context, event) => ({
      ...context.cache,
      preloadQueue: event.type === 'CACHE.PRELOAD' ? [...event.paths] : context.cache.preloadQueue
    })
  }),

  /**
   * Préchargement terminé
   */
  onPreloadComplete: assign<EnvironmentContext, EnvironmentEvent>({
    cache: (context, event) => ({
      ...context.cache,
      preloadQueue: [],
      cacheHitRate: calculateCacheHitRate(context.cache)
    })
  }),

  /**
   * Erreur préchargement
   */
  onPreloadError: (context: EnvironmentContext, event: any) => {
    console.warn('⚠️ Preload error:', event.data);
  },

  /**
   * Nettoyer cache
   */
  clearCache: assign<EnvironmentContext, EnvironmentEvent>({
    cache: (context) => {
      // Disposer toutes les textures
      context.cache.hdrMaps.forEach(texture => {
        if (texture instanceof THREE.Texture) {
          texture.dispose();
        }
      });

      return {
        ...context.cache,
        hdrMaps: new Map(),
        lruTracking: new Map(),
        memoryUsage: 0,
        cacheHitRate: 0
      };
    }
  }),

  /**
   * Démarrer optimisation
   */
  startOptimization: (context: EnvironmentContext) => {
    console.log('⚡ Starting cache optimization...');
  },

  /**
   * Optimisation terminée
   */
  onOptimizationComplete: assign<EnvironmentContext, EnvironmentEvent>({
    cache: (context, event) => ({
      ...context.cache,
      memoryUsage: Math.max(0, context.cache.memoryUsage - ((event as any).data?.memoryFreed || 0))
    })
  }),

  /**
   * Erreur optimisation
   */
  onOptimizationError: (context: EnvironmentContext, event: any) => {
    console.warn('⚠️ Cache optimization error:', event.data);
  }
};

// ====================================
// ACTIONS SYSTÈME
// ====================================

export const systemActions = {
  /**
   * Initialiser système
   */
  initializeSystem: assign<EnvironmentContext, EnvironmentEvent>({
    threeJS: (context, event) => {
      if (event.type === 'SYSTEM.INIT') {
        return {
          ...context.threeJS,
          renderer: event.renderer,
          scene: event.scene,
          pmremGenerator: event.renderer ? new THREE.PMREMGenerator(event.renderer) : null
        };
      }
      return context.threeJS;
    },
    systemState: (context) => ({
      ...context.systemState,
      lastUpdate: Date.now()
    })
  }),

  /**
   * Mettre à jour métriques performance
   */
  updatePerformanceMetrics: assign<EnvironmentContext, EnvironmentEvent>({
    performance: (context, event) => {
      if (event.type === 'SYSTEM.UPDATE_PERFORMANCE') {
        return {
          ...context.performance,
          ...event.metrics
        };
      }
      return context.performance;
    }
  }),

  /**
   * Gérer erreurs système
   */
  handleSystemError: assign<EnvironmentContext, EnvironmentEvent>({
    systemState: (context, event) => ({
      ...context.systemState,
      error: event.type === 'SYSTEM.ERROR' ? event.error : 'Unknown system error',
      lastUpdate: Date.now()
    })
  }),

  /**
   * Disposer système
   */
  disposeSystem: (context: EnvironmentContext) => {
    console.log('🧹 Disposing Environment system...');

    // Nettoyer cache
    context.cache.hdrMaps.forEach(texture => {
      if (texture instanceof THREE.Texture) {
        texture.dispose();
      }
    });

    // Nettoyer PMREMGenerator
    if (context.threeJS.pmremGenerator) {
      context.threeJS.pmremGenerator.dispose();
    }

    // Nettoyer scene environment
    if (context.threeJS.scene) {
      context.threeJS.scene.environment = null;
      context.threeJS.scene.background = null;
    }
  },

  /**
   * Logger erreurs
   */
  logError: (context: EnvironmentContext, event: any) => {
    console.error('🌍 EnvironmentMachine Error:', event);
  },

  /**
   * Nettoyer erreur et charger
   */
  clearErrorAndLoad: assign<EnvironmentContext, EnvironmentEvent>({
    systemState: (context) => ({
      ...context.systemState,
      error: null
    })
  })
};

// ====================================
// UTILITAIRES
// ====================================

function getLODLevelForQuality(quality: string): number {
  switch (quality) {
    case 'high': return 1;
    case 'medium': return 0.75;
    case 'low': return 0.5;
    default: return 1;
  }
}

import type { QualityLevel } from './environmentTypes';

function getNextLowerQuality(current: QualityLevel): QualityLevel {
  switch (current) {
    case 'high': return 'medium';
    case 'medium': return 'low';
    case 'low': return 'low';
    case 'auto': return 'medium';
    default: return current;
  }
}

function getNextHigherQuality(current: QualityLevel): QualityLevel {
  switch (current) {
    case 'low': return 'medium';
    case 'medium': return 'high';
    case 'high': return 'high';
    case 'auto': return 'high';
    default: return current;
  }
}

function calculateCacheHitRate(cache: any): number {
  // Logique calcul hit rate basée sur utilisation
  const totalRequests = cache.lruTracking.size;
  const cacheSize = cache.hdrMaps.size;

  if (totalRequests === 0) return 0;
  return cacheSize / totalRequests;
}

// ====================================
// EXPORTS
// ====================================

export const environmentActions = {
  ...hdrActions,
  ...bridgeActions,
  ...qualityActions,
  ...cacheActions,
  ...systemActions
};

export default environmentActions;