// 🎯 FrameSchedulerMachine - Atome D1 de la Refactorisation XState
// Machine d'état principale pour la gestion du render loop à 60fps

import { createMachine, assign } from 'xstate';
import {
  FrameSchedulerContext,
  FrameSchedulerEvent,
  FrameSchedulerServices,
  defaultFrameSchedulerConfig,
  defaultPerformanceMetrics,
  defaultErrorState
} from './types';

// Import des services
import {
  frameLoopService,
  performanceMonitorService,
  recoveryService,
  contextRecoveryService,
  telemetryService
} from './services';

// Import des actions
import {
  initializeClock,
  updateDeltaTime,
  updatePerformanceMetrics,
  updateAllSystems,
  updateAnimationSystems,
  updatePhysicsSystems,
  updateParticleSystems,
  updateLightingSystems,
  updateEffectsSystems,
  updateRenderSystems,
  resetPerformanceMetrics,
  toggleDebugMode,
  enableStepMode,
  disableStepMode,
  logError,
  startRecovery,
  updateRecoveryProgress,
  completeRecovery,
  failRecovery,
  handleContextLost,
  handleContextRestored,
  sendTelemetry,
  updateAdaptiveFrameRate,
  pauseLoop,
  resumeLoop,
  stepFrame,
  updateConfig
} from './actions';

// Import des guards
import {
  canStartLoop,
  canRecover,
  hasReachedMaxRecoveryAttempts,
  shouldAdaptFrameRate,
  isPerformanceLow,
  isFrameRateStable,
  isFrameTimeAcceptable,
  isDebugModeEnabled,
  isStepModeEnabled,
  isPaused,
  canStepFrame,
  hasWebGLContext,
  isWebGLContextLost,
  hasValidConfiguration,
  hasActiveSystemsEnabled,
  areSystemsResponsive,
  isCriticalError,
  isRecoverableError,
  isRecoveryInProgress,
  isRecoveryComplete,
  hasRecoveryTimedOut
} from './guards';

// 🎯 Contexte Initial
const initialContext: FrameSchedulerContext = {
  // ⏱️ Timing
  deltaTime: 0,
  lastFrameTime: 0,
  currentTime: 0,

  // 📊 Performance
  performance: defaultPerformanceMetrics,

  // 🎯 Systèmes (tous activés par défaut)
  systems: {
    animation: true,
    physics: true,
    particles: true,
    lighting: true,
    effects: true,
    render: true,
    eyeRotation: true,
    environment: true
  },

  // ⚙️ Configuration
  config: defaultFrameSchedulerConfig,

  // 🚨 Erreur
  error: defaultErrorState,

  // 🔄 Récupération
  recovery: {
    isRecovering: false,
    recoveryStartTime: 0,
    recoveryProgress: 0,
    backupPerformance: null
  },

  // 🎮 Contrôles
  controls: {
    isPaused: false,
    debugMode: false,
    stepMode: false,
    frameStep: false
  }
};

// 🎯 Machine d'État FrameScheduler
export const frameSchedulerMachine = createMachine<
  FrameSchedulerContext,
  FrameSchedulerEvent
>({
  id: 'frameScheduler',
  initial: 'idle',
  context: initialContext,

  // 🔄 États Principaux
  states: {
    // 💤 État Inactif
    idle: {
      entry: ['initializeClock', 'sendTelemetry'],

      on: {
        START_LOOP: {
          target: 'running',
          cond: 'canStartLoop'
        },

        UPDATE_CONFIG: {
          actions: ['updateConfig']
        },

        TOGGLE_DEBUG_MODE: {
          actions: ['toggleDebugMode']
        }
      }
    },

    // 🏃 État Actif - Boucle de Rendu
    running: {
      type: 'parallel',

      entry: ['sendTelemetry'],

      // 🔄 Services Parallèles
      invoke: [
        {
          id: 'frameLoop',
          src: frameLoopService
        },
        {
          id: 'performanceMonitor',
          src: performanceMonitorService
        },
        {
          id: 'telemetry',
          src: telemetryService
        }
      ],

      // 🎯 Gestion des Événements Globaux
      on: {
        STOP_LOOP: 'idle',

        PAUSE_LOOP: 'paused',

        ERROR_OCCURRED: [
          {
            target: 'error',
            cond: 'isCriticalError',
            actions: ['logError']
          },
          {
            target: 'recovering',
            cond: 'isRecoverableError',
            actions: ['logError']
          },
          {
            actions: ['logError'] // Log non-critical errors but continue
          }
        ],

        WEBGL_CONTEXT_LOST: {
          target: 'contextLost',
          actions: ['handleContextLost']
        },

        TOGGLE_DEBUG_MODE: {
          actions: ['toggleDebugMode']
        },

        ENABLE_STEP_MODE: {
          target: 'debugging',
          actions: ['enableStepMode']
        },

        UPDATE_CONFIG: {
          actions: ['updateConfig']
        }
      },

      // 🎯 États Parallèles
      states: {
        // ⏱️ Gestion du Timing
        timing: {
          initial: 'tracking',

          states: {
            tracking: {
              on: {
                FRAME_TICK: {
                  actions: ['updateDeltaTime', 'sendTelemetry']
                }
              }
            }
          }
        },

        // 🎯 Mise à Jour des Systèmes
        systemUpdates: {
          initial: 'updating',

          states: {
            updating: {
              on: {
                FRAME_TICK: [
                  {
                    cond: 'isFrameTimeAcceptable',
                    actions: ['updateAllSystems']
                  },
                  {
                    // Frame time trop élevé, essayer la récupération
                    target: '#frameScheduler.recovering',
                    actions: ['logError']
                  }
                ]
              }
            }
          }
        },

        // 📊 Monitoring des Performances
        performanceMonitoring: {
          initial: 'monitoring',

          states: {
            monitoring: {
              on: {
                PERFORMANCE_UPDATE: {
                  actions: ['updatePerformanceMetrics', 'sendTelemetry']
                }
              },

              // 🔄 Vérification périodique pour adaptation
              after: {
                5000: {
                  cond: 'shouldAdaptFrameRate',
                  actions: ['updateAdaptiveFrameRate']
                }
              }
            }
          }
        }
      }
    },

    // ⏸️ État Pause
    paused: {
      entry: ['pauseLoop', 'sendTelemetry'],

      on: {
        RESUME_LOOP: {
          target: 'running',
          actions: ['resumeLoop']
        },

        STOP_LOOP: 'idle',

        TOGGLE_DEBUG_MODE: {
          actions: ['toggleDebugMode']
        }
      }
    },

    // 🐛 État Debug (Step Mode)
    debugging: {
      entry: ['pauseLoop', 'sendTelemetry'],

      on: {
        STEP_FRAME: {
          cond: 'canStepFrame',
          actions: ['stepFrame', 'updateAllSystems']
        },

        DISABLE_STEP_MODE: {
          target: 'running',
          actions: ['disableStepMode', 'resumeLoop']
        },

        STOP_LOOP: 'idle'
      }
    },

    // 🔄 État Récupération
    recovering: {
      entry: ['startRecovery', 'sendTelemetry'],

      invoke: {
        id: 'recovery',
        src: recoveryService,

        onDone: {
          target: 'running',
          actions: ['completeRecovery']
        },

        onError: [
          {
            target: 'error',
            cond: 'hasReachedMaxRecoveryAttempts',
            actions: ['failRecovery']
          },
          {
            target: 'recovering',
            actions: ['logError']
          }
        ]
      },

      on: {
        RECOVERY_PROGRESS: {
          actions: ['updateRecoveryProgress']
        },

        STOP_LOOP: 'idle'
      },

      // ⏰ Timeout de récupération
      after: {
        10000: {
          target: 'error',
          actions: ['failRecovery']
        }
      }
    },

    // 🎮 État Contexte WebGL Perdu
    contextLost: {
      entry: ['handleContextLost', 'sendTelemetry'],

      invoke: {
        id: 'contextRecovery',
        src: contextRecoveryService,

        onDone: {
          target: 'running',
          actions: ['handleContextRestored']
        },

        onError: {
          target: 'error'
        }
      },

      on: {
        WEBGL_CONTEXT_RESTORED: {
          target: 'running',
          actions: ['handleContextRestored']
        },

        STOP_LOOP: 'idle'
      },

      // ⏰ Timeout de récupération du contexte
      after: {
        30000: {
          target: 'error',
          actions: ['failRecovery']
        }
      }
    },

    // ❌ État d'Erreur Critique
    error: {
      entry: ['sendTelemetry'],

      on: {
        START_LOOP: [
          {
            target: 'recovering',
            cond: 'canRecover'
          },
          {
            target: 'idle',
            actions: ['resetPerformanceMetrics']
          }
        ],

        RESET_PERFORMANCE_METRICS: {
          target: 'idle',
          actions: ['resetPerformanceMetrics']
        }
      },

      // 🔄 Auto-récupération après délai
      after: {
        5000: {
          target: 'recovering',
          cond: 'canRecover'
        }
      }
    }
  }
}, {
  // 🔧 Configuration des Actions
  actions: {
    initializeClock,
    updateDeltaTime,
    updatePerformanceMetrics,
    updateAllSystems,
    updateAnimationSystems,
    updatePhysicsSystems,
    updateParticleSystems,
    updateLightingSystems,
    updateEffectsSystems,
    updateRenderSystems,
    resetPerformanceMetrics,
    toggleDebugMode,
    enableStepMode,
    disableStepMode,
    logError,
    startRecovery,
    updateRecoveryProgress,
    completeRecovery,
    failRecovery,
    handleContextLost,
    handleContextRestored,
    sendTelemetry,
    updateAdaptiveFrameRate,
    pauseLoop,
    resumeLoop,
    stepFrame,
    updateConfig
  },

  // 🔍 Configuration des Guards
  guards: {
    canStartLoop,
    canRecover,
    hasReachedMaxRecoveryAttempts,
    shouldAdaptFrameRate,
    isPerformanceLow,
    isFrameRateStable,
    isFrameTimeAcceptable,
    isDebugModeEnabled,
    isStepModeEnabled,
    isPaused,
    canStepFrame,
    hasWebGLContext,
    isWebGLContextLost,
    hasValidConfiguration,
    hasActiveSystemsEnabled,
    areSystemsResponsive,
    isCriticalError,
    isRecoverableError,
    isRecoveryInProgress,
    isRecoveryComplete,
    hasRecoveryTimedOut
  }
});

export default frameSchedulerMachine;