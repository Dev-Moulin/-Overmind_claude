/**
 * 🌍 B4 Environment Machine - Machine XState principale
 * 6ème région parallèle pour gestion HDR et environnement avancé
 */

import { createMachine, assign } from 'xstate';
import type {
  EnvironmentContext,
  EnvironmentEvent,
  HDRConfig,
  QualityLevel
} from './environmentTypes';
import * as THREE from 'three';

// ====================================
// CONTEXTE INITIAL
// ====================================

const initialContext: EnvironmentContext = {
  // Configuration HDR
  hdr: {
    currentMap: null,
    intensity: 1.0,
    rotation: 0,
    background: false,
    environmentIntensity: 1.0,
    format: 'hdr'
  },

  // Bridge vers B3 Lighting
  lightingBridge: {
    connected: false,
    lightingIntensity: 1.0,
    ambientContribution: 0.8,
    directionalShadows: true,
    hdrBoost: false,
    syncEnabled: false
  },

  // Gestion qualité
  quality: {
    current: 'auto',
    lodLevel: 1,
    adaptiveEnabled: true,
    targetFPS: 60,
    minFPS: 30,
    maxFPS: 120,
    adaptiveThreshold: 10
  },

  // Cache système
  cache: {
    hdrMaps: new Map(),
    preloadQueue: [],
    memoryUsage: 0,
    maxCacheSize: 512, // MB
    compressionEnabled: true,
    lruTracking: new Map()
  },

  // Performance monitoring
  performance: {
    hdrLoadTime: 0,
    renderTime: 0,
    frameTime: 16.67,
    loadTime: 0,
    fps: 60,
    memoryPressure: 0,
    memoryUsage: 0,
    adaptiveHistory: [],
    cacheHitRate: 0,
    qualityAdjustments: 0
  },

  // État système
  systemState: {
    loading: false,
    error: null,
    ready: false,
    lastUpdate: 0
  },

  // Intégration Three.js
  threeJS: {
    renderer: null,
    scene: null,
    pmremGenerator: null,
    currentEnvironment: null,
    envMap: null
  }
};

// ====================================
// MACHINE ENVIRONMENT B4
// ====================================

export const environmentMachine = createMachine<EnvironmentContext, EnvironmentEvent>({
  id: 'environmentMachine',
  type: 'parallel',
  context: initialContext,
  predictableActionArguments: true,

  states: {
    // ====================================
    // RÉGION HDR LOADING
    // ====================================
    hdrSystem: {
      initial: 'idle',
      states: {
        idle: {
          on: {
            'HDR.LOAD': {
              target: 'loading',
              actions: 'setLoadingState'
            },
            'SYSTEM.INIT': {
              actions: 'initializeThreeJS'
            }
          }
        },

        loading: {
          invoke: {
            id: 'loadHDR',
            src: 'loadHDRService',
            onDone: {
              target: 'ready',
              actions: 'onHDRLoadSuccess'
            },
            onError: {
              target: 'error',
              actions: 'onHDRLoadError'
            }
          },
          on: {
            'HDR.LOAD': {
              target: 'loading', // Nouveau chargement
              actions: 'setLoadingState'
            }
          }
        },

        ready: {
          on: {
            'HDR.LOAD': {
              target: 'loading',
              actions: 'setLoadingState'
            },
            'HDR.UNLOAD': {
              target: 'idle',
              actions: 'unloadHDR'
            },
            'HDR.SET_INTENSITY': {
              actions: 'setHDRIntensity'
            },
            'HDR.SET_ROTATION': {
              actions: 'setHDRRotation'
            },
            'HDR.TOGGLE_BACKGROUND': {
              actions: 'toggleHDRBackground'
            }
          }
        },

        error: {
          on: {
            'HDR.LOAD': {
              target: 'loading',
              actions: 'clearErrorAndLoad'
            },
            'SYSTEM.ERROR': {
              actions: 'logError'
            }
          }
        }
      }
    },

    // ====================================
    // RÉGION BRIDGE B3 LIGHTING
    // ====================================
    lightingBridge: {
      initial: 'disconnected',
      states: {
        disconnected: {
          on: {
            'BRIDGE.CONNECT': {
              target: 'connecting',
              actions: 'initiateBridgeConnection'
            }
          }
        },

        connecting: {
          invoke: {
            id: 'connectBridge',
            src: 'connectLightingBridgeService',
            onDone: {
              target: 'connected',
              actions: 'onBridgeConnected'
            },
            onError: {
              target: 'disconnected',
              actions: 'onBridgeConnectionError'
            }
          },
          after: {
            5000: {
              target: 'disconnected',
              actions: 'onBridgeTimeout'
            }
          }
        },

        connected: {
          on: {
            'BRIDGE.DISCONNECT': {
              target: 'disconnected',
              actions: 'disconnectBridge'
            },
            'BRIDGE.SYNC': {
              target: 'synchronized',
              actions: 'syncWithLighting'
            },
            'BRIDGE.UPDATE_CONTRIBUTION': {
              actions: 'updateLightingContribution'
            }
          }
        },

        synchronized: {
          on: {
            'BRIDGE.DISCONNECT': {
              target: 'disconnected',
              actions: 'disconnectBridge'
            },
            'BRIDGE.SYNC': {
              actions: 'syncWithLighting'
            },
            'BRIDGE.UPDATE_CONTRIBUTION': {
              actions: 'updateLightingContribution'
            }
          },
          // Auto-sync périodique
          after: {
            1000: {
              target: 'synchronized',
              actions: 'periodicSync'
            }
          }
        }
      }
    },

    // ====================================
    // RÉGION QUALITY MANAGEMENT
    // ====================================
    qualityManager: {
      initial: 'auto',
      states: {
        auto: {
          on: {
            'QUALITY.SET_LEVEL': [
              {
                target: 'high',
                cond: (_, event) => event.level === 'high',
                actions: 'setQualityLevel'
              },
              {
                target: 'medium',
                cond: (_, event) => event.level === 'medium',
                actions: 'setQualityLevel'
              },
              {
                target: 'low',
                cond: (_, event) => event.level === 'low',
                actions: 'setQualityLevel'
              }
            ],
            'QUALITY.AUTO_ADJUST': {
              actions: 'autoAdjustQuality'
            },
            'QUALITY.DISABLE_ADAPTIVE': {
              actions: 'disableAdaptiveQuality'
            }
          },
          // Monitoring automatique FPS
          after: {
            2000: {
              target: 'auto',
              actions: 'monitorPerformance'
            }
          }
        },

        high: {
          on: {
            'QUALITY.SET_LEVEL': [
              {
                target: 'auto',
                cond: (_, event) => event.level === 'auto',
                actions: 'enableAdaptiveQuality'
              },
              {
                target: 'medium',
                cond: (_, event) => event.level === 'medium',
                actions: 'setQualityLevel'
              },
              {
                target: 'low',
                cond: (_, event) => event.level === 'low',
                actions: 'setQualityLevel'
              }
            ],
            'QUALITY.ENABLE_ADAPTIVE': {
              target: 'auto',
              actions: 'enableAdaptiveQuality'
            }
          }
        },

        medium: {
          on: {
            'QUALITY.SET_LEVEL': [
              {
                target: 'auto',
                cond: (_, event) => event.level === 'auto',
                actions: 'enableAdaptiveQuality'
              },
              {
                target: 'high',
                cond: (_, event) => event.level === 'high',
                actions: 'setQualityLevel'
              },
              {
                target: 'low',
                cond: (_, event) => event.level === 'low',
                actions: 'setQualityLevel'
              }
            ],
            'QUALITY.ENABLE_ADAPTIVE': {
              target: 'auto',
              actions: 'enableAdaptiveQuality'
            }
          }
        },

        low: {
          on: {
            'QUALITY.SET_LEVEL': [
              {
                target: 'auto',
                cond: (_, event) => event.level === 'auto',
                actions: 'enableAdaptiveQuality'
              },
              {
                target: 'high',
                cond: (_, event) => event.level === 'high',
                actions: 'setQualityLevel'
              },
              {
                target: 'medium',
                cond: (_, event) => event.level === 'medium',
                actions: 'setQualityLevel'
              }
            ],
            'QUALITY.ENABLE_ADAPTIVE': {
              target: 'auto',
              actions: 'enableAdaptiveQuality'
            }
          }
        }
      }
    },

    // ====================================
    // RÉGION CACHE MANAGEMENT
    // ====================================
    cacheManager: {
      initial: 'idle',
      states: {
        idle: {
          on: {
            'CACHE.PRELOAD': {
              target: 'preloading',
              actions: 'startPreload'
            },
            'HDR.LOAD': {
              actions: 'checkCache'
            },
            'CACHE.OPTIMIZE': {
              target: 'optimizing',
              actions: 'startOptimization'
            }
          }
        },

        preloading: {
          invoke: {
            id: 'preloadHDR',
            src: 'preloadHDRService',
            onDone: {
              target: 'cached',
              actions: 'onPreloadComplete'
            },
            onError: {
              target: 'idle',
              actions: 'onPreloadError'
            }
          }
        },

        cached: {
          on: {
            'CACHE.PRELOAD': {
              target: 'preloading',
              actions: 'startPreload'
            },
            'CACHE.CLEAR': {
              target: 'idle',
              actions: 'clearCache'
            },
            'CACHE.OPTIMIZE': {
              target: 'optimizing',
              actions: 'startOptimization'
            }
          }
        },

        optimizing: {
          invoke: {
            id: 'optimizeCache',
            src: 'optimizeCacheService',
            onDone: {
              target: 'cached',
              actions: 'onOptimizationComplete'
            },
            onError: {
              target: 'cached',
              actions: 'onOptimizationError'
            }
          }
        }
      }
    }
  },

  // ====================================
  // ÉVÉNEMENTS GLOBAUX
  // ====================================
  on: {
    'SYSTEM.INIT': {
      actions: 'initializeSystem'
    },
    'SYSTEM.UPDATE_PERFORMANCE': {
      actions: 'updatePerformanceMetrics'
    },
    'SYSTEM.DISPOSE': {
      actions: 'disposeSystem'
    },
    'SYSTEM.ERROR': {
      actions: 'handleSystemError'
    }
  }
}, {
  // ====================================
  // CONFIGURATION ACTIONS/SERVICES
  // ====================================
  actions: {
    // HDR Actions
    setLoadingState: assign({
      systemState: (context, event) => ({
        ...context.systemState,
        loading: true,
        error: null
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

    onHDRLoadSuccess: assign({
      systemState: (context) => ({
        ...context.systemState,
        loading: false,
        ready: true,
        lastUpdate: Date.now()
      }),
      performance: (context, event: any) => ({
        ...context.performance,
        hdrLoadTime: event.data?.loadTime || 0
      })
    }),

    onHDRLoadError: assign({
      systemState: (context, event: any) => ({
        ...context.systemState,
        loading: false,
        error: event.data?.message || 'HDR load failed',
        ready: false
      })
    }),

    unloadHDR: assign({
      hdr: (context) => ({
        ...context.hdr,
        currentMap: null
      }),
      systemState: (context) => ({
        ...context.systemState,
        ready: false
      }),
      threeJS: (context) => ({
        ...context.threeJS,
        currentEnvironment: null
      })
    }),

    setHDRIntensity: assign({
      hdr: (context, event) => ({
        ...context.hdr,
        intensity: event.type === 'HDR.SET_INTENSITY' ? event.intensity : context.hdr.intensity
      })
    }),

    setHDRRotation: assign({
      hdr: (context, event) => ({
        ...context.hdr,
        rotation: event.type === 'HDR.SET_ROTATION' ? event.rotation : context.hdr.rotation
      })
    }),

    toggleHDRBackground: assign({
      hdr: (context) => ({
        ...context.hdr,
        background: !context.hdr.background
      })
    }),

    // Bridge Actions
    initiateBridgeConnection: assign({
      lightingBridge: (context) => ({
        ...context.lightingBridge,
        connected: false
      })
    }),

    onBridgeConnected: assign({
      lightingBridge: (context) => ({
        ...context.lightingBridge,
        connected: true,
        syncEnabled: true
      })
    }),

    onBridgeConnectionError: assign({
      lightingBridge: (context) => ({
        ...context.lightingBridge,
        connected: false
      }),
      systemState: (context, event: any) => ({
        ...context.systemState,
        error: `Bridge connection failed: ${event.data?.message || 'Unknown error'}`
      })
    }),

    disconnectBridge: assign({
      lightingBridge: (context) => ({
        ...context.lightingBridge,
        connected: false,
        syncEnabled: false
      })
    }),

    syncWithLighting: assign({
      lightingBridge: (context, event) => {
        if (event.type === 'BRIDGE.SYNC' && event.lightingData) {
          return {
            ...context.lightingBridge,
            lightingIntensity: event.lightingData.intensity || context.lightingBridge.lightingIntensity,
            hdrBoost: event.lightingData.hdrBoost || context.lightingBridge.hdrBoost
          };
        }
        return context.lightingBridge;
      }
    }),

    // Quality Actions
    setQualityLevel: assign({
      quality: (context, event) => ({
        ...context.quality,
        current: event.type === 'QUALITY.SET_LEVEL' ? event.level : context.quality.current,
        adaptiveEnabled: false
      })
    }),

    enableAdaptiveQuality: assign({
      quality: (context) => ({
        ...context.quality,
        current: 'auto',
        adaptiveEnabled: true
      })
    }),

    autoAdjustQuality: assign({
      performance: (context, event) => ({
        ...context.performance,
        qualityAdjustments: context.performance.qualityAdjustments + 1
      })
    }),

    // System Actions
    initializeSystem: assign({
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

    updatePerformanceMetrics: assign({
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

    handleSystemError: assign({
      systemState: (context, event) => ({
        ...context.systemState,
        error: event.type === 'SYSTEM.ERROR' ? event.error : 'Unknown system error'
      })
    }),

    // Actions par défaut
    logError: (context, event) => {
      console.error('🌍 EnvironmentMachine Error:', event);
    },

    clearErrorAndLoad: assign({
      systemState: (context) => ({
        ...context.systemState,
        error: null
      })
    }),

    // Placeholder actions
    initializeThreeJS: () => console.log('🌍 Initializing Three.js integration...'),
    periodicSync: () => console.log('🔄 Periodic bridge sync...'),
    monitorPerformance: () => console.log('📊 Performance monitoring...'),
    checkCache: () => console.log('💾 Checking cache...'),
    startPreload: () => console.log('⏳ Starting preload...'),
    onPreloadComplete: () => console.log('✅ Preload complete'),
    onPreloadError: () => console.log('❌ Preload error'),
    clearCache: () => console.log('🧹 Clearing cache'),
    startOptimization: () => console.log('⚡ Starting optimization...'),
    onOptimizationComplete: () => console.log('✅ Optimization complete'),
    onOptimizationError: () => console.log('❌ Optimization error'),
    disposeSystem: () => console.log('🧹 Disposing system...'),
    updateLightingContribution: () => console.log('🔆 Updating lighting contribution'),
    onBridgeTimeout: () => console.log('⏰ Bridge connection timeout'),
    disableAdaptiveQuality: () => console.log('📉 Adaptive quality disabled')
  },

  services: {
    // Services sera implémenté dans environmentServices.ts
    loadHDRService: () => Promise.resolve({ loadTime: 250 }),
    connectLightingBridgeService: () => Promise.resolve({ connected: true }),
    preloadHDRService: () => Promise.resolve({ preloaded: [] }),
    optimizeCacheService: () => Promise.resolve({ optimized: true })
  }
});

export default environmentMachine;