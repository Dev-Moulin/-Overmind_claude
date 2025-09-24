// 🎨 VisualEffectsMachine - Machine XState Unifiée Bloom + PBR
// Architecture parallèle pour effets visuels coordonnés

import { createMachine, assign } from 'xstate';
import type {
  VisualEffectsContext,
  VisualEffectsEvent,
  VisualGroupType,
  SecurityPreset,
  BloomGlobalConfig,
  PBRGlobalConfig
} from './types';
import { LightingPreset, DEFAULT_PERFORMANCE_CONFIG, DEFAULT_MIGRATION_STATE, MigrationLevel } from '../lighting/types';
import { environmentMachine } from '../environment/environmentMachine';
import * as actions from './actions';
import * as services from './services';

// ============================================
// CONTEXTE INITIAL
// ============================================

const initialContext: VisualEffectsContext = {
  // Registre partagé d'objets
  objectsRegistry: {
    iris: new Map(),
    eyeRings: new Map(),
    revealRings: new Map(),
    magicRings: new Map(),
    arms: new Map()
  },

  // Configuration Bloom
  bloom: {
    global: {
      enabled: false,
      threshold: 0.15,
      strength: 0.40,
      radius: 0.40,
      exposure: 1.0
    },
    groups: {
      iris: { threshold: 0.15, strength: 0.8, radius: 0.4, emissiveColor: 0x00ff88, emissiveIntensity: 1.0 },
      eyeRings: { threshold: 0.20, strength: 0.6, radius: 0.3, emissiveColor: 0x0088ff, emissiveIntensity: 0.8 },
      revealRings: { threshold: 0.25, strength: 0.4, radius: 0.36, emissiveColor: 0xff8800, emissiveIntensity: 0.6 },
      magicRings: { threshold: 0.30, strength: 0.7, radius: 0.5, emissiveColor: 0xff00ff, emissiveIntensity: 0.9 },
      arms: { threshold: 0.35, strength: 0.5, radius: 0.3, emissiveColor: 0xffffff, emissiveIntensity: 0.5 }
    }
  },

  // Configuration PBR
  pbr: {
    global: {
      enabled: false,
      metalness: 0.8,
      roughness: 0.2,
      envMapIntensity: 1.0,
      clearcoat: 0.0,
      clearcoatRoughness: 0.0,
      transmission: 0.0,
      ior: 1.5
    },
    groups: {
      iris: { metalness: 0.9, roughness: 0.1 },
      eyeRings: { metalness: 0.7, roughness: 0.3 },
      revealRings: { metalness: 0.6, roughness: 0.4 },
      magicRings: { metalness: 0.85, roughness: 0.15 },
      arms: { metalness: 0.95, roughness: 0.05 }
    }
  },

  // ✅ B4 Environment (contexte B4 intégré)
  environment: {
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
      maxCacheSize: 512,
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
  },

  // ✅ B5 Security - Architecture Actor Model complète
  security: {
    // Legacy compatibility
    currentPreset: null,
    isTransitioning: false,
    presets: {
      SAFE: {
        color: 0x00ff00,
        intensity: 0.3,
        bloomPreset: { strength: 0.2 },
        pbrPreset: { metalness: 0.3, roughness: 0.7 }
      },
      DANGER: {
        color: 0xff0000,
        intensity: 1.0,
        bloomPreset: { strength: 0.8 },
        pbrPreset: { metalness: 0.9, roughness: 0.1 }
      },
      WARNING: {
        color: 0xffaa00,
        intensity: 0.6,
        bloomPreset: { strength: 0.5 },
        pbrPreset: { metalness: 0.6, roughness: 0.4 }
      },
      SCANNING: {
        color: 0x00ffff,
        intensity: 0.7,
        bloomPreset: { strength: 0.6 },
        pbrPreset: { metalness: 0.7, roughness: 0.3 }
      },
      NORMAL: {
        color: 0xffffff,
        intensity: 0.4,
        bloomPreset: { strength: 0.4 },
        pbrPreset: { metalness: 0.5, roughness: 0.5 }
      }
    },

    // ✅ NOUVEAU: B5 Security Actor Model intégré
    securityMachine: {
      isActive: false,
      securityLevel: 'normal',
      threatScore: 0,
      currentThreats: [],

      // Bridge connections
      bridgeConnections: {
        b3Lighting: false,
        b4Environment: false,
        visualEffects: true // Auto-connecté à VisualEffects
      },

      // Performance monitoring
      circuitBreakerState: 'closed',
      performanceMode: 'normal',

      // Visual alerts
      activeAlerts: []
    }
  },

  // ✅ NOUVEAU: Lighting (B3)
  lighting: {
    // 5 sous-systèmes parallèles
    baseLighting: {
      enabled: false,
      ambientIntensity: 0.4,
      directionalIntensity: 1.0,
      shadowsEnabled: false
    },
    advancedLighting: {
      enabled: false,
      spotLights: { count: 0, intensity: 1.0 },
      directionalLights: { count: 0, intensity: 1.0 }
    },
    areaLights: {
      enabled: false,
      lights: []
    },
    lightProbes: {
      enabled: false,
      intensity: 1.0,
      environmentSync: false,
      lastUpdateTime: 0
    },
    hdrBoost: {
      enabled: false,
      multiplier: 1.0,
      metallicEnhancement: false,
      toneMapping: 'ACESFilmic'
    },

    // Lazy loading
    lazySubsystems: {
      pointLights: {
        initialized: false,
        loading: false,
        config: { maxLights: 100 }
      },
      shadowMaps: {
        initialized: false,
        loading: false,
        config: { maxLights: 50, resolution: 1024 }
      }
    },

    // Performance monitoring (consensus)
    performance: {
      frameTime: 0,
      avgFrameTime: 0,
      maxFrameTime: 0,
      fps: 60,
      batchEfficiency: 1.0,
      fallbackCount: 0,
      adaptiveThrottling: false
    },
    performanceConfig: DEFAULT_PERFORMANCE_CONFIG,

    // Migration state (Claude IA)
    migrationState: { ...DEFAULT_MIGRATION_STATE, level: MigrationLevel.OFF },

    // Current state
    currentPreset: LightingPreset.DEFAULT,
    batchQueue: []
  },

  // Systèmes externes
  renderer: null,
  scene: null,
  camera: null,

  // Performance
  performance: {
    fps: 60,
    frameTime: 16.67,
    updateCount: 0,
    lastUpdateTime: Date.now()
  }
};

// ============================================
// MACHINE PRINCIPALE
// ============================================

export const visualEffectsMachine = createMachine<VisualEffectsContext, VisualEffectsEvent>({
  id: 'visualEffects',
  type: 'parallel',
  context: initialContext,
  predictableActionArguments: true,

  states: {
    // ====================================
    // RÉGION BLOOM
    // ====================================
    bloom: {
      initial: 'disabled',
      states: {
        disabled: {
          on: {
            'BLOOM.ENABLE': {
              target: 'enabling',
              cond: 'canEnableBloom'
            }
          }
        },

        enabling: {
          invoke: {
            id: 'enableBloomService',
            src: 'enableGlobalBloom',
            onDone: {
              target: 'enabled',
              actions: assign({
                bloom: (ctx) => ({
                  ...ctx.bloom,
                  global: { ...ctx.bloom.global, enabled: true }
                })
              })
            },
            onError: {
              target: 'error',
              actions: 'logBloomError'
            }
          }
        },

        enabled: {
          on: {
            'BLOOM.DISABLE': {
              target: 'disabling'
            },
            'BLOOM.UPDATE_GLOBAL': {
              actions: 'updateBloomGlobal'
            },
            'BLOOM.UPDATE_GROUP': {
              actions: 'updateBloomGroup'
            }
          }
        },

        disabling: {
          invoke: {
            id: 'disableBloomService',
            src: 'disableGlobalBloom',
            onDone: {
              target: 'disabled',
              actions: assign({
                bloom: (ctx) => ({
                  ...ctx.bloom,
                  global: { ...ctx.bloom.global, enabled: false }
                })
              })
            },
            onError: {
              target: 'error',
              actions: 'logBloomError'
            }
          }
        },

        error: {
          on: {
            'BLOOM.ENABLE': {
              target: 'enabling'
            }
          }
        }
      }
    },

    // ====================================
    // RÉGION PBR
    // ====================================
    pbr: {
      initial: 'idle',
      states: {
        idle: {
          on: {
            'PBR.ENABLE': {
              target: 'initializing',
              cond: 'canEnablePBR'
            }
          }
        },

        initializing: {
          invoke: {
            id: 'initPBRService',
            src: 'initializePBR',
            onDone: {
              target: 'active',
              actions: assign<VisualEffectsContext, any>({
                pbr: (ctx) => ({
                  ...ctx.pbr,
                  global: { ...ctx.pbr.global, enabled: true }
                })
              })
            },
            onError: {
              target: 'error',
              actions: 'logPBRError'
            }
          }
        },

        active: {
          on: {
            'PBR.DISABLE': {
              target: 'idle',
              actions: 'updatePBRGlobal'
            },
            'PBR.UPDATE_GLOBAL': {
              target: 'updating',
              actions: 'updatePBRGlobal'
            },
            'PBR.UPDATE_GROUP': {
              actions: 'updatePBRGroup'
            }
          }
        },

        updating: {
          invoke: {
            id: 'updatePBRService',
            src: 'applyGlobalPBR',
            onDone: {
              target: 'active'
            },
            onError: {
              target: 'error',
              actions: 'logPBRError'
            }
          }
        },

        error: {
          on: {
            'PBR.ENABLE': {
              target: 'initializing'
            }
          }
        }
      }
    },

    // ====================================
    // RÉGION B4 ENVIRONMENT (6ème région complète)
    // ====================================
    environment: {
      invoke: {
        id: 'b4-environment-machine',
        src: environmentMachine,
        data: (context: VisualEffectsContext) => ({
          // Transmission du contexte B4 Environment complet
          ...context.environment,
          // Injection des objets Three.js du contexte parent
          threeJS: {
            ...context.environment.threeJS,
            renderer: context.renderer,
            scene: context.scene
          }
        })
      },
      // Gestion des événements B4 Environment
      on: {
        // Événements HDR (conversion legacy ENV.* -> HDR.*)
        'ENV.LOAD_HDR': {
          actions: (context, event) => {
            console.log('🌍 [Legacy] ENV.LOAD_HDR converti vers HDR.LOAD pour B4');
            // Forward vers la machine B4 via HDR.LOAD
          }
        },

        // Événements HDR natifs B4
        'HDR.LOAD': {
          actions: (context, event) => {
            console.log('🌍 HDR.LOAD transmis à B4 Environment');
          }
        },
        'HDR.UNLOAD': {
          actions: (context, event) => {
            console.log('🌍 HDR.UNLOAD transmis à B4 Environment');
          }
        },
        'HDR.SET_INTENSITY': {
          actions: (context, event) => {
            console.log('🌍 HDR.SET_INTENSITY transmis à B4 Environment');
          }
        },
        'HDR.SET_ROTATION': {
          actions: (context, event) => {
            console.log('🌍 HDR.SET_ROTATION transmis à B4 Environment');
          }
        },
        'HDR.TOGGLE_BACKGROUND': {
          actions: (context, event) => {
            console.log('🌍 HDR.TOGGLE_BACKGROUND transmis à B4 Environment');
          }
        },

        // Événements Quality B4
        'QUALITY.SET_LEVEL': {
          actions: (context, event) => {
            console.log('🌍 QUALITY.SET_LEVEL transmis à B4 Environment');
          }
        },
        'QUALITY.ENABLE_ADAPTIVE': {
          actions: (context, event) => {
            console.log('🌍 QUALITY.ENABLE_ADAPTIVE transmis à B4 Environment');
          }
        },
        'QUALITY.DISABLE_ADAPTIVE': {
          actions: (context, event) => {
            console.log('🌍 QUALITY.DISABLE_ADAPTIVE transmis à B4 Environment');
          }
        },
        'QUALITY.AUTO_ADJUST': {
          actions: (context, event) => {
            console.log('🌍 QUALITY.AUTO_ADJUST transmis à B4 Environment');
          }
        },

        // Événements Bridge B3 ↔ B4
        'BRIDGE.CONNECT': {
          actions: (context, event) => {
            console.log('🔗 BRIDGE.CONNECT transmis à B4 Environment');
          }
        },
        'BRIDGE.DISCONNECT': {
          actions: (context, event) => {
            console.log('🔗 BRIDGE.DISCONNECT transmis à B4 Environment');
          }
        },
        'BRIDGE.SYNC': {
          actions: (context, event) => {
            console.log('🔄 BRIDGE.SYNC transmis à B4 Environment');
          }
        },
        'BRIDGE.UPDATE_CONTRIBUTION': {
          actions: (context, event) => {
            console.log('🔗 BRIDGE.UPDATE_CONTRIBUTION transmis à B4 Environment');
          }
        },

        // Événements Cache B4
        'CACHE.PRELOAD': {
          actions: (context, event) => {
            console.log('💾 CACHE.PRELOAD transmis à B4 Environment');
          }
        },
        'CACHE.CLEAR': {
          actions: (context, event) => {
            console.log('🧹 CACHE.CLEAR transmis à B4 Environment');
          }
        },
        'CACHE.OPTIMIZE': {
          actions: (context, event) => {
            console.log('⚡ CACHE.OPTIMIZE transmis à B4 Environment');
          }
        },
        'CACHE.SET_SIZE': {
          actions: (context, event) => {
            console.log('💾 CACHE.SET_SIZE transmis à B4 Environment');
          }
        }
      }
    },

    // ====================================
    // RÉGION B5 SECURITY - Architecture Actor Model complète
    // ====================================
    security: {
      initial: 'inactive',
      states: {
        // Legacy compatibility state
        normal: {
          on: {
            'SECURITY.SET_PRESET': {
              target: 'transitioning',
              actions: 'startSecurityTransition'
            },
            'B5_SECURITY.ACTIVATE': 'b5_active'
          }
        },

        transitioning: {
          invoke: {
            id: 'securityTransitionService',
            src: 'applySecurityPreset',
            onDone: {
              target: 'applied',
              actions: 'completeSecurityTransition'
            },
            onError: {
              target: 'normal',
              actions: 'logSecurityError'
            }
          },
          on: {
            'B5_SECURITY.ACTIVATE': {
              target: 'b5_active',
              actions: assign<VisualEffectsContext, any>({
                security: (ctx) => ({
                  ...ctx.security,
                  securityMachine: {
                    ...ctx.security.securityMachine,
                    isActive: true
                  }
                })
              })
            }
          }
        },

        applied: {
          on: {
            'SECURITY.SET_PRESET': {
              target: 'transitioning',
              actions: 'startSecurityTransition'
            },
            'SECURITY.TRANSITION_COMPLETE': {
              target: 'normal',
              actions: assign<VisualEffectsContext, any>({
                security: (ctx) => ({
                  ...ctx.security,
                  isTransitioning: false
                })
              })
            },
            'B5_SECURITY.ACTIVATE': 'b5_active'
          }
        },

        // ✅ NOUVEAU: États B5 Security Actor Model
        inactive: {
          on: {
            'B5_SECURITY.ACTIVATE': {
              target: 'b5_active',
              actions: assign<VisualEffectsContext, any>({
                security: (ctx) => ({
                  ...ctx.security,
                  securityMachine: {
                    ...ctx.security.securityMachine,
                    isActive: true
                  }
                })
              })
            },
            'SECURITY.SET_PRESET': {
              target: 'transitioning',
              actions: 'startSecurityTransition'
            }
          }
        },

        b5_active: {
          type: 'parallel',
          on: {
            'B5_SECURITY.DEACTIVATE': {
              target: 'inactive',
              actions: assign<VisualEffectsContext, any>({
                security: (ctx) => ({
                  ...ctx.security,
                  securityMachine: {
                    ...ctx.security.securityMachine,
                    isActive: false,
                    securityLevel: 'normal',
                    threatScore: 0,
                    currentThreats: [],
                    activeAlerts: []
                  }
                })
              })
            }
          },

          states: {
            // Niveau de sécurité
            securityLevel: {
              initial: 'normal',
              states: {
                normal: {
                  on: {
                    'B5_SECURITY.SET_LEVEL': [
                      {
                        target: 'scanning',
                        cond: (ctx, event) => event.level === 'scanning',
                        actions: ['updateSecurityLevel', 'escalateSecurityAcrossRegions']
                      },
                      {
                        target: 'alert',
                        cond: (ctx, event) => event.level === 'alert',
                        actions: ['updateSecurityLevel', 'escalateSecurityAcrossRegions']
                      },
                      {
                        target: 'lockdown',
                        cond: (ctx, event) => event.level === 'lockdown',
                        actions: ['updateSecurityLevel', 'escalateSecurityAcrossRegions']
                      }
                    ],
                    'B5_SECURITY.ESCALATE': {
                      target: 'scanning',
                      actions: assign<VisualEffectsContext, any>({
                        security: (ctx) => ({
                          ...ctx.security,
                          securityMachine: {
                            ...ctx.security.securityMachine,
                            securityLevel: 'scanning'
                          }
                        })
                      })
                    }
                  }
                },
                scanning: {
                  on: {
                    'B5_SECURITY.ESCALATE': {
                      target: 'alert',
                      actions: assign<VisualEffectsContext, any>({
                        security: (ctx) => ({
                          ...ctx.security,
                          securityMachine: {
                            ...ctx.security.securityMachine,
                            securityLevel: 'alert'
                          }
                        })
                      })
                    },
                    'B5_SECURITY.DEESCALATE': {
                      target: 'normal',
                      actions: assign<VisualEffectsContext, any>({
                        security: (ctx) => ({
                          ...ctx.security,
                          securityMachine: {
                            ...ctx.security.securityMachine,
                            securityLevel: 'normal'
                          }
                        })
                      })
                    },
                    'B5_SECURITY.SET_LEVEL': [
                      {
                        target: 'normal',
                        cond: (ctx, event) => event.level === 'normal',
                        actions: ['updateSecurityLevel', 'escalateSecurityAcrossRegions']
                      },
                      {
                        target: 'alert',
                        cond: (ctx, event) => event.level === 'alert',
                        actions: ['updateSecurityLevel', 'escalateSecurityAcrossRegions']
                      },
                      {
                        target: 'lockdown',
                        cond: (ctx, event) => event.level === 'lockdown',
                        actions: ['updateSecurityLevel', 'escalateSecurityAcrossRegions']
                      }
                    ]
                  }
                },
                alert: {
                  on: {
                    'B5_SECURITY.ESCALATE': {
                      target: 'lockdown',
                      actions: assign<VisualEffectsContext, any>({
                        security: (ctx) => ({
                          ...ctx.security,
                          securityMachine: {
                            ...ctx.security.securityMachine,
                            securityLevel: 'lockdown'
                          }
                        })
                      })
                    },
                    'B5_SECURITY.DEESCALATE': {
                      target: 'scanning',
                      actions: assign<VisualEffectsContext, any>({
                        security: (ctx) => ({
                          ...ctx.security,
                          securityMachine: {
                            ...ctx.security.securityMachine,
                            securityLevel: 'scanning'
                          }
                        })
                      })
                    },
                    'B5_SECURITY.SET_LEVEL': [
                      {
                        target: 'normal',
                        cond: (ctx, event) => event.level === 'normal',
                        actions: ['updateSecurityLevel', 'escalateSecurityAcrossRegions']
                      },
                      {
                        target: 'scanning',
                        cond: (ctx, event) => event.level === 'scanning',
                        actions: ['updateSecurityLevel', 'escalateSecurityAcrossRegions']
                      },
                      {
                        target: 'lockdown',
                        cond: (ctx, event) => event.level === 'lockdown',
                        actions: ['updateSecurityLevel', 'escalateSecurityAcrossRegions']
                      }
                    ]
                  }
                },
                lockdown: {
                  on: {
                    'B5_SECURITY.DEESCALATE': {
                      target: 'alert',
                      actions: assign<VisualEffectsContext, any>({
                        security: (ctx) => ({
                          ...ctx.security,
                          securityMachine: {
                            ...ctx.security.securityMachine,
                            securityLevel: 'alert'
                          }
                        })
                      })
                    },
                    'B5_SECURITY.SET_LEVEL': [
                      {
                        target: 'normal',
                        cond: (ctx, event) => event.level === 'normal',
                        actions: ['updateSecurityLevel', 'escalateSecurityAcrossRegions']
                      },
                      {
                        target: 'scanning',
                        cond: (ctx, event) => event.level === 'scanning',
                        actions: ['updateSecurityLevel', 'escalateSecurityAcrossRegions']
                      },
                      {
                        target: 'alert',
                        cond: (ctx, event) => event.level === 'alert',
                        actions: ['updateSecurityLevel', 'escalateSecurityAcrossRegions']
                      }
                    ]
                  }
                }
              }
            },

            // Gestion des menaces
            threatManagement: {
              initial: 'monitoring',
              states: {
                monitoring: {
                  on: {
                    'B5_SECURITY.THREAT_DETECTED': {
                      actions: 'handleThreatDetected'
                    },
                    'B5_SECURITY.THREAT_CLEARED': {
                      actions: 'handleThreatCleared'
                    }
                  }
                }
              }
            },

            // Gestion des alertes visuelles
            alertsManagement: {
              initial: 'idle',
              states: {
                idle: {
                  on: {
                    'B5_SECURITY.TRIGGER_ALERT': {
                      target: 'alerting',
                      actions: 'startVisualAlert'
                    }
                  }
                },
                alerting: {
                  on: {
                    'B5_SECURITY.STOP_ALERTS': {
                      target: 'idle',
                      actions: 'stopAllAlerts'
                    },
                    'B5_SECURITY.TRIGGER_ALERT': {
                      actions: 'addVisualAlert'
                    }
                  }
                }
              }
            },

            // Gestion des bridges
            bridgeManagement: {
              initial: 'disconnected',
              states: {
                disconnected: {
                  on: {
                    'B5_SECURITY.BRIDGE_CONNECT': {
                      target: 'connected',
                      actions: 'connectBridge'
                    }
                  }
                },
                connected: {
                  on: {
                    'B5_SECURITY.BRIDGE_DISCONNECT': {
                      target: 'disconnected',
                      actions: 'disconnectBridge'
                    },
                    'B5_SECURITY.BRIDGE_CONNECT': {
                      actions: 'connectBridge'
                    }
                  }
                }
              }
            },

            // Monitoring performance
            performanceMonitoring: {
              initial: 'normal',
              states: {
                normal: {
                  on: {
                    'B5_SECURITY.PERFORMANCE_DEGRADED': {
                      target: 'degraded',
                      actions: 'handlePerformanceDegradation'
                    }
                  }
                },
                degraded: {
                  on: {
                    'B5_SECURITY.PERFORMANCE_RECOVERED': {
                      target: 'normal',
                      actions: 'handlePerformanceRecovery'
                    }
                  }
                }
              }
            }
          }
        }
      }
    },

    // ====================================
    // RÉGION LIGHTING (B3)
    // ====================================
    lighting: {
      initial: 'uninitialized',
      states: {
        uninitialized: {
          on: {
            'LIGHTING.ENABLE_BASE': {
              target: 'initializing',
              actions: ['logLightingInit', 'notifySecurityB3Connection']
            }
          }
        },

        initializing: {
          invoke: {
            id: 'initLightingService',
            src: 'initBaseLighting',
            onDone: {
              target: 'partial',
              actions: assign<VisualEffectsContext, any>({
                lighting: (ctx) => ({
                  ...ctx.lighting,
                  baseLighting: { ...ctx.lighting.baseLighting, enabled: true }
                })
              })
            },
            onError: {
              target: 'error',
              actions: 'logLightingError'
            }
          }
        },

        partial: {
          on: {
            'LIGHTING.APPLY_PRESET': {
              actions: 'applyLightingPreset'
            },
            'LIGHTING.UPDATE_INTENSITY': {
              actions: 'updateLightingIntensity'
            },
            'LIGHTING.ENABLE_ADVANCED': {
              target: 'active',
              actions: 'enableAdvancedLighting'
            },
            'LIGHTING.DISABLE_BASE': {
              target: 'uninitialized',
              actions: assign<VisualEffectsContext, any>({
                lighting: (ctx) => ({
                  ...ctx.lighting,
                  baseLighting: { ...ctx.lighting.baseLighting, enabled: false }
                })
              })
            }
          }
        },

        active: {
          on: {
            'LIGHTING.APPLY_PRESET': {
              actions: 'applyLightingPreset'
            },
            'LIGHTING.UPDATE_INTENSITY': {
              actions: 'updateLightingIntensity'
            },
            'LIGHTING.ENABLE_AREA': {
              actions: 'enableAreaLights'
            },
            'LIGHTING.ENABLE_PROBES': {
              actions: 'enableLightProbes'
            },
            'LIGHTING.ENABLE_HDR_BOOST': {
              actions: 'enableHDRBoost'
            },
            'LIGHTING.DISABLE_ADVANCED': {
              target: 'partial',
              actions: 'disableAdvancedLighting'
            }
          }
        },

        error: {
          on: {
            'LIGHTING.ENABLE_BASE': {
              target: 'initializing'
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
    // Gestion des objets
    'OBJECTS.REGISTER': {
      actions: 'registerObjects'
    },
    'OBJECTS.UNREGISTER': {
      actions: 'unregisterObjects'
    },
    'OBJECTS.DETECT': {
      actions: 'detectAndRegisterObjects'
    },
    'OBJECTS.CLEAR': {
      actions: 'clearObjects'
    },

    // Système
    'SYSTEM.INIT': {
      actions: 'initializeSystem'
    },
    'SYSTEM.UPDATE_CONTEXT': {
      actions: 'updateSystemContext'
    },
    'SYSTEM.UPDATE_PERFORMANCE': {
      actions: 'updatePerformanceMetrics'
    },
    'SYSTEM.SYNC': {
      actions: 'syncAllSystems'
    },
    'SYSTEM.DISPOSE': {
      actions: 'disposeAllResources'
    },
    'SYSTEM.ERROR': {
      actions: 'logSystemError'
    }
  }
}, {
  actions: {
    logLightingInit: actions.logLightingInit,
    logLightingError: actions.logLightingError,
    applyLightingPreset: actions.applyLightingPreset,
    updateLightingIntensity: actions.updateLightingIntensity,
    enableAdvancedLighting: actions.enableAdvancedLighting,
    enableAreaLights: actions.enableAreaLights,
    enableLightProbes: actions.enableLightProbes,
    enableHDRBoost: actions.enableHDRBoost
  },
  services: {
    initBaseLighting: services.initBaseLighting
  }
});

// ============================================
// EXPORT HELPERS
// ============================================

// Helper pour créer le contexte initial avec des valeurs custom
export const createVisualEffectsContext = (
  overrides?: Partial<VisualEffectsContext>
): VisualEffectsContext => {
  return {
    ...initialContext,
    ...overrides
  };
};

// Helper pour vérifier l'état d'une région
export const isRegionInState = (
  state: any,
  region: 'bloom' | 'pbr' | 'environment' | 'security' | 'lighting',
  expectedState: string
): boolean => {
  return state.matches({ [region]: expectedState });
};

// Helper pour obtenir le contexte d'un groupe spécifique
export const getGroupContext = (
  context: VisualEffectsContext,
  group: VisualGroupType
) => {
  return {
    objects: context.objectsRegistry[group],
    bloom: context.bloom.groups[group],
    pbr: context.pbr.groups[group]
  };
};