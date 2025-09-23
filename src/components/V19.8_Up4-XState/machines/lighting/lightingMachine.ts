/**
 * 🔦 LightingMachine - Atome B3 avec architecture hybride
 * Combine Event Bus (Perplexity) + Feature Flags (Claude IA) + Performance Monitoring (Consensus)
 */

import { createMachine, assign } from 'xstate';
import type {
  LightingContext,
  LightingEvent,
  LightingMachineOptions
} from './types';
import {
  MigrationLevel,
  DEFAULT_PERFORMANCE_CONFIG,
  DEFAULT_MIGRATION_STATE
} from './types';
import {
  initBaseLighting,
  updateBaseLightingIntensity,
  applyLightingPreset,
  initAdvancedLighting,
  createPerformanceMonitorService,
  createBatchProcessorService,
  isPerformanceAcceptable
} from './services';
import { lightingEventBus } from './lightingEventBus';
import { lightingFeatureFlags } from './featureFlags';

/**
 * Machine d'état pour le système d'éclairage
 * Architecture parallèle avec 5 sous-systèmes + monitoring
 */
export const createLightingMachine = (options: LightingMachineOptions = {}) => {

  const initialContext: LightingContext = {
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
    performanceConfig: { ...DEFAULT_PERFORMANCE_CONFIG, ...options.performanceConfig },

    // Migration state (Claude IA)
    migrationState: { ...DEFAULT_MIGRATION_STATE, level: options.migrationLevel || MigrationLevel.OFF },

    // Event bus (Perplexity)
    eventBus: options.enableEventBus ? lightingEventBus : undefined,

    // Legacy bridge
    legacyBridge: options.legacyBridge,

    // Current state
    currentPreset: options.presets ? Object.keys(options.presets)[0] as any : 'DEFAULT',
    batchQueue: []
  };

  return createMachine<LightingContext, LightingEvent>({
    id: 'lightingMachine',
    type: 'parallel',
    context: initialContext,

    states: {
      // ============================================
      // ORCHESTRATOR CENTRALISÉ (Perplexity)
      // ============================================
      orchestrator: {
        initial: 'idle',
        states: {
          idle: {
            on: {
              ORCHESTRATE_REGIONS: {
                target: 'orchestrating',
                actions: 'logOrchestrationStart'
              }
            }
          },
          orchestrating: {
            invoke: {
              id: 'lightingOrchestrator',
              src: 'lightingOrchestratorService',
              onDone: 'idle',
              onError: {
                target: 'idle',
                actions: 'logOrchestrationError'
              }
            },
            on: {
              SYNC_ALL_REGIONS: {
                actions: 'syncAllRegions'
              }
            }
          }
        }
      },

      // ============================================
      // BASE LIGHTING (3-point lighting)
      // ============================================
      baseLighting: {
        initial: 'uninitialized',
        states: {
          uninitialized: {
            on: {
              ENABLE_BASE_LIGHTING: [
                {
                  target: 'enabling',
                  cond: 'canEnableBaseLighting'
                },
                {
                  target: 'legacyFallback',
                  actions: 'logBaseLightingFallback'
                }
              ]
            }
          },
          enabling: {
            invoke: {
              id: 'initBaseLighting',
              src: 'initBaseLighting',
              onDone: {
                target: 'enabled',
                actions: assign({
                  baseLighting: (context, event) => ({
                    ...context.baseLighting,
                    enabled: true
                  })
                })
              },
              onError: {
                target: 'error',
                actions: 'logBaseLightingError'
              }
            }
          },
          enabled: {
            on: {
              UPDATE_BASE_INTENSITY: {
                actions: 'updateBaseLightingIntensity',
                internal: true // Éviter re-entry (Claude IA)
              },
              APPLY_PRESET: {
                actions: 'applyBaseLightingPreset',
                internal: true
              },
              DISABLE_BASE_LIGHTING: {
                target: 'disabled'
              }
            }
          },
          disabled: {
            on: {
              ENABLE_BASE_LIGHTING: 'enabling'
            }
          },
          legacyFallback: {
            on: {
              ENABLE_BASE_LIGHTING: 'enabling'
            }
          },
          error: {
            on: {
              ENABLE_BASE_LIGHTING: 'enabling'
            }
          }
        }
      },

      // ============================================
      // ADVANCED LIGHTING (multiple lights)
      // ============================================
      advancedLighting: {
        initial: 'uninitialized',
        states: {
          uninitialized: {
            on: {
              ENABLE_ADVANCED_LIGHTING: [
                {
                  target: 'enabling',
                  cond: 'canEnableAdvancedLighting'
                },
                {
                  target: 'legacyFallback'
                }
              ]
            }
          },
          enabling: {
            invoke: {
              id: 'initAdvancedLighting',
              src: 'initAdvancedLighting',
              onDone: 'enabled',
              onError: 'error'
            }
          },
          enabled: {
            on: {
              UPDATE_ADVANCED_INTENSITIES: {
                actions: 'updateAdvancedIntensities',
                internal: true
              },
              DISABLE_ADVANCED_LIGHTING: 'disabled'
            }
          },
          disabled: {
            on: {
              ENABLE_ADVANCED_LIGHTING: 'enabling'
            }
          },
          legacyFallback: {},
          error: {
            on: {
              ENABLE_ADVANCED_LIGHTING: 'enabling'
            }
          }
        }
      },

      // ============================================
      // AREA LIGHTS (soft lighting)
      // ============================================
      areaLights: {
        initial: 'uninitialized',
        states: {
          uninitialized: {
            on: {
              ENABLE_AREA_LIGHTS: 'enabling'
            }
          },
          enabling: {
            invoke: {
              id: 'initAreaLights',
              src: 'initAreaLights',
              onDone: 'enabled',
              onError: 'error'
            }
          },
          enabled: {
            on: {
              UPDATE_AREA_INTENSITY: {
                actions: 'updateAreaIntensity',
                internal: true
              },
              DISABLE_AREA_LIGHTS: 'disabled'
            }
          },
          disabled: {
            on: {
              ENABLE_AREA_LIGHTS: 'enabling'
            }
          },
          error: {}
        }
      },

      // ============================================
      // LIGHT PROBES (environment)
      // ============================================
      lightProbes: {
        initial: 'uninitialized',
        states: {
          uninitialized: {
            on: {
              ENABLE_LIGHT_PROBES: 'enabling'
            }
          },
          enabling: {
            invoke: {
              id: 'initLightProbes',
              src: 'initLightProbes',
              onDone: 'enabled',
              onError: 'error'
            }
          },
          enabled: {
            on: {
              UPDATE_PROBES_FROM_ENV: {
                actions: 'updateProbesFromEnvironment',
                internal: true
              },
              UPDATE_PROBE_INTENSITY: {
                actions: 'updateProbeIntensity',
                internal: true
              },
              DISABLE_LIGHT_PROBES: 'disabled'
            }
          },
          disabled: {
            on: {
              ENABLE_LIGHT_PROBES: 'enabling'
            }
          },
          error: {}
        }
      },

      // ============================================
      // HDR BOOST (tone mapping)
      // ============================================
      hdrBoost: {
        initial: 'uninitialized',
        states: {
          uninitialized: {
            on: {
              ENABLE_HDR_BOOST: 'enabling'
            }
          },
          enabling: {
            invoke: {
              id: 'initHDRBoost',
              src: 'initHDRBoost',
              onDone: 'enabled',
              onError: 'error'
            }
          },
          enabled: {
            on: {
              UPDATE_HDR_MULTIPLIER: {
                actions: 'updateHDRMultiplier',
                internal: true
              },
              ENHANCE_METALLIC_MATERIALS: {
                actions: 'enhanceMetallicMaterials',
                internal: true
              },
              DISABLE_HDR_BOOST: 'disabled'
            }
          },
          disabled: {
            on: {
              ENABLE_HDR_BOOST: 'enabling'
            }
          },
          error: {}
        }
      },

      // ============================================
      // PERFORMANCE MONITOR (Consensus)
      // ============================================
      performanceMonitor: {
        initial: 'monitoring',
        states: {
          monitoring: {
            invoke: {
              id: 'performanceMonitorService',
              src: 'performanceMonitorService'
            },
            on: {
              PERFORMANCE_ALERT: {
                target: 'alerting',
                actions: 'handlePerformanceAlert'
              }
            }
          },
          alerting: {
            after: {
              2000: 'monitoring' // Return to monitoring after 2s
            },
            on: {
              CIRCUIT_BREAKER_TRIGGERED: {
                actions: 'triggerCircuitBreaker'
              }
            }
          }
        }
      },

      // ============================================
      // BATCH PROCESSOR (Perplexity)
      // ============================================
      batchProcessor: {
        initial: 'processing',
        states: {
          processing: {
            invoke: {
              id: 'batchProcessorService',
              src: 'batchProcessorService'
            },
            on: {
              BATCH_UPDATE: {
                actions: 'queueBatchUpdate'
              },
              FLUSH_BATCH: {
                actions: 'flushBatchQueue'
              }
            }
          }
        }
      }
    },

    // ============================================
    // ÉVÉNEMENTS GLOBAUX
    // ============================================
    on: {
      APPLY_PRESET: {
        actions: 'applyLightingPreset'
      },
      SET_MIGRATION_LEVEL: {
        actions: 'updateMigrationLevel'
      },
      ROLLBACK_REQUESTED: {
        actions: 'performRollback'
      }
    }
  }, {
    // ============================================
    // SERVICES
    // ============================================
    services: {
      initBaseLighting,
      initAdvancedLighting,
      initAreaLights: async () => ({ success: true }),
      initLightProbes: async () => ({ success: true }),
      initHDRBoost: async () => ({ success: true }),
      performanceMonitorService: createPerformanceMonitorService,
      batchProcessorService: createBatchProcessorService,
      lightingOrchestratorService: (context) => () => {
        console.log('🎭 Lighting Orchestrator Service started');
        return () => console.log('🎭 Lighting Orchestrator Service stopped');
      }
    },

    // ============================================
    // GUARDS
    // ============================================
    guards: {
      canEnableBaseLighting: (context) => {
        return lightingFeatureFlags.isRegionXStateEnabled('baseLighting') &&
               isPerformanceAcceptable(context);
      },
      canEnableAdvancedLighting: (context) => {
        return lightingFeatureFlags.isRegionXStateEnabled('advancedLighting') &&
               isPerformanceAcceptable(context);
      }
    },

    // ============================================
    // ACTIONS
    // ============================================
    actions: {
      // Logging
      logOrchestrationStart: () => console.log('🎭 Starting region orchestration...'),
      logOrchestrationError: (_, event) => console.error('❌ Orchestration error:', event),
      logBaseLightingFallback: () => console.log('🔄 Base lighting falling back to legacy'),
      logBaseLightingError: (_, event) => console.error('❌ Base lighting error:', event),

      // Base lighting actions
      updateBaseLightingIntensity: assign({
        baseLighting: (context, event: any) => ({
          ...context.baseLighting,
          ambientIntensity: event.ambient,
          directionalIntensity: event.directional
        })
      }),

      // Preset actions
      applyLightingPreset: async (context, event: any) => {
        await applyLightingPreset(context, event);
      },

      // Performance actions
      handlePerformanceAlert: assign({
        performance: (context, event: any) => ({
          ...context.performance,
          ...event.metrics
        })
      }),


      triggerCircuitBreaker: (_, event: any) => {
        console.error(`🚨 Circuit breaker triggered for ${event.subsystem}`);
        // Implement fallback logic
      },

      // Batch actions
      queueBatchUpdate: assign({
        batchQueue: (context, event: any) => [...context.batchQueue, event.update]
      }),

      flushBatchQueue: assign({
        batchQueue: () => []
      }),

      // Migration actions
      updateMigrationLevel: assign({
        migrationState: (context, event: any) => ({
          ...context.migrationState,
          level: event.level
        })
      }),

      performRollback: (_, event: any) => {
        console.log(`🔄 Performing rollback: ${event.reason}`);
        lightingFeatureFlags.emergencyRollback(event.reason);
      },

      // Region orchestration
      syncAllRegions: (context) => {
        console.log('🔄 Syncing all lighting regions...');
        if (context.eventBus) {
          context.eventBus.dispatch({
            type: 'LIGHTING_BATCH_UPDATE',
            payload: { action: 'sync' },
            timestamp: Date.now(),
            source: 'Orchestrator',
            priority: 'high'
          });
        }
      },

      // Placeholder actions for other subsystems
      updateAdvancedIntensities: () => console.log('🔧 Updating advanced intensities...'),
      updateAreaIntensity: () => console.log('🖼️ Updating area intensity...'),
      updateProbesFromEnvironment: () => console.log('🌐 Updating probes from environment...'),
      updateProbeIntensity: () => console.log('🌐 Updating probe intensity...'),
      updateHDRMultiplier: () => console.log('🎛️ Updating HDR multiplier...'),
      enhanceMetallicMaterials: () => console.log('🎛️ Enhancing metallic materials...')
    }
  });
};