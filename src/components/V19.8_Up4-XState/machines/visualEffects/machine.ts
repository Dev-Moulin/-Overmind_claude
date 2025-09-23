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

  // Environment
  environment: {
    hdrPath: null,
    envMap: null,
    pmremGenerator: null,
    intensity: 1.0,
    background: false
  },

  // Security
  security: {
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
              actions: assign({
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
              actions: assign({
                pbr: (ctx) => ({
                  ...ctx.pbr,
                  global: { ...ctx.pbr.global, enabled: false }
                })
              })
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
    // RÉGION ENVIRONMENT
    // ====================================
    environment: {
      initial: 'unloaded',
      states: {
        unloaded: {
          on: {
            'ENV.LOAD_HDR': {
              target: 'loading',
              actions: assign({
                environment: (ctx, event) => ({
                  ...ctx.environment,
                  hdrPath: event.path
                })
              })
            }
          }
        },

        loading: {
          invoke: {
            id: 'loadHDRService',
            src: 'loadHDREnvironment',
            onDone: {
              target: 'processing',
              actions: 'storeHDRTexture'
            },
            onError: {
              target: 'error',
              actions: 'logEnvironmentError'
            }
          }
        },

        processing: {
          invoke: {
            id: 'processPMREMService',
            src: 'generatePMREM',
            onDone: {
              target: 'ready',
              actions: 'storeEnvMap'
            },
            onError: {
              target: 'error',
              actions: 'logEnvironmentError'
            }
          }
        },

        ready: {
          on: {
            'ENV.SET_INTENSITY': {
              actions: assign({
                environment: (ctx, event) => ({
                  ...ctx.environment,
                  intensity: event.intensity
                })
              })
            },
            'ENV.TOGGLE_BACKGROUND': {
              actions: assign({
                environment: (ctx) => ({
                  ...ctx.environment,
                  background: !ctx.environment.background
                })
              })
            },
            'ENV.LOAD_HDR': {
              target: 'loading',
              actions: 'disposeCurrentEnvironment'
            },
            'ENV.DISPOSE': {
              target: 'unloaded',
              actions: 'disposeCurrentEnvironment'
            }
          }
        },

        error: {
          on: {
            'ENV.LOAD_HDR': {
              target: 'loading'
            }
          }
        }
      }
    },

    // ====================================
    // RÉGION SECURITY
    // ====================================
    security: {
      initial: 'normal',
      states: {
        normal: {
          on: {
            'SECURITY.SET_PRESET': {
              target: 'transitioning',
              actions: 'startSecurityTransition'
            }
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
              actions: assign({
                security: (ctx) => ({
                  ...ctx.security,
                  isTransitioning: false
                })
              })
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
              actions: 'logLightingInit'
            }
          }
        },

        initializing: {
          invoke: {
            id: 'initLightingService',
            src: 'initBaseLighting',
            onDone: {
              target: 'partial',
              actions: assign({
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
              actions: assign({
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