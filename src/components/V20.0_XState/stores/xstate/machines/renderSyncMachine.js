import { createMachine, assign, spawn } from 'xstate';

/**
 * 🔄 RENDER SYNC MACHINE - Synchronisation bloom/PBR/lighting/background
 * Machine XState pour gérer les interdépendances et conflits entre systèmes de rendu
 */

// Configurations de conflits connus
const CONFLICT_RULES = {
  bloom: {
    // Bloom devient invisible avec ces conditions
    invisibleConditions: [
      { background: { brightness: { min: 0.8 } }, lighting: { exposure: { max: 0.5 } } },
      { pbr: { metalness: { min: 0.9 }, roughness: { min: 0.8 } } }
    ],
    // Bloom conflictuel avec PBR
    pbrConflicts: [
      { metalness: { min: 0.8 }, emissiveIntensity: { min: 0.5 }, message: "⚠️ Metalness élevé + bloom émissive = conflit visuel" }
    ]
  },
  lighting: {
    // Exposition trop basse cache les détails
    lowExposureThreshold: 0.3,
    // Exposition trop haute brûle les couleurs
    highExposureThreshold: 3.0
  },
  background: {
    // Backgrounds clairs masquent le bloom
    brightThreshold: 0.7,
    // Backgrounds sombres nécessitent plus de lumière
    darkThreshold: 0.2
  }
};

// État initial de la machine
const INITIAL_CONTEXT = {
  // États des systèmes
  systems: {
    bloom: {
      enabled: true,
      threshold: 0.15,
      strength: 0.4,
      radius: 0.4,
      emissiveIntensity: 0.6
    },
    pbr: {
      metalness: 0.3,
      roughness: 1.0,
      ambientMultiplier: 1.0,
      directionalMultiplier: 1.0
    },
    lighting: {
      exposure: 1.0,
      ambientIntensity: 3.5,
      directionalIntensity: 5.0
    },
    background: {
      type: 'color',
      color: '#1a1a1a',
      brightness: 0.1
    }
  },

  // Conflits détectés
  conflicts: [],

  // Checkpoints sauvegardés
  checkpoints: [],
  currentCheckpoint: null,

  // Configuration de validation
  validationEnabled: true,
  autoResolve: false,

  // Logs et notifications
  logs: [],
  notifications: []
};

/**
 * Machine XState principale
 */
export const renderSyncMachine = createMachine({
  id: 'renderSync',
  initial: 'idle',
  context: INITIAL_CONTEXT,

  states: {
    idle: {
      on: {
        UPDATE_BLOOM: {
          target: 'validating',
          actions: 'updateBloomParams'
        },
        UPDATE_PBR: {
          target: 'validating',
          actions: 'updatePbrParams'
        },
        UPDATE_LIGHTING: {
          target: 'validating',
          actions: 'updateLightingParams'
        },
        UPDATE_BACKGROUND: {
          target: 'validating',
          actions: 'updateBackgroundParams'
        },
        SAVE_CHECKPOINT: {
          actions: 'saveCheckpoint'
        },
        RESTORE_CHECKPOINT: {
          actions: 'restoreCheckpoint',
          target: 'validating'
        }
      }
    },

    validating: {
      entry: 'detectConflicts',
      always: [
        {
          target: 'conflictDetected',
          cond: 'hasConflicts'
        },
        {
          target: 'synchronized',
          cond: 'noConflicts'
        }
      ]
    },

    conflictDetected: {
      entry: ['logConflicts', 'notifyConflicts'],
      on: {
        AUTO_RESOLVE: {
          target: 'resolving',
          cond: 'canAutoResolve'
        },
        MANUAL_RESOLVE: {
          target: 'resolving',
          actions: 'applyManualResolution'
        },
        IGNORE: {
          target: 'synchronized'
        },
        ROLLBACK: {
          target: 'idle',
          actions: 'rollbackToLastCheckpoint'
        }
      }
    },

    resolving: {
      entry: 'resolveConflicts',
      on: {
        RESOLUTION_SUCCESS: {
          target: 'synchronized',
          actions: 'clearConflicts'
        },
        RESOLUTION_FAILED: {
          target: 'conflictDetected'
        }
      }
    },

    synchronized: {
      entry: ['applyChanges', 'logSuccess'],
      always: {
        target: 'idle'
      }
    }
  },

  on: {
    // Événements globaux
    TOGGLE_VALIDATION: {
      actions: 'toggleValidation'
    },
    TOGGLE_AUTO_RESOLVE: {
      actions: 'toggleAutoResolve'
    },
    CLEAR_LOGS: {
      actions: 'clearLogs'
    }
  }
}, {
  actions: {
    // === UPDATE ACTIONS ===
    updateBloomParams: assign({
      systems: (context, event) => ({
        ...context.systems,
        bloom: { ...context.systems.bloom, ...event.params }
      })
    }),

    updatePbrParams: assign({
      systems: (context, event) => ({
        ...context.systems,
        pbr: { ...context.systems.pbr, ...event.params }
      })
    }),

    updateLightingParams: assign({
      systems: (context, event) => ({
        ...context.systems,
        lighting: { ...context.systems.lighting, ...event.params }
      })
    }),

    updateBackgroundParams: assign({
      systems: (context, event) => {
        const newBackground = { ...context.systems.background, ...event.params };
        // Calculer la luminosité du background
        newBackground.brightness = calculateBackgroundBrightness(newBackground);
        return {
          ...context.systems,
          background: newBackground
        };
      }
    }),

    // === CONFLICT DETECTION ===
    detectConflicts: assign({
      conflicts: (context) => {
        if (!context.validationEnabled) return [];

        const conflicts = [];
        const { bloom, pbr, lighting, background } = context.systems;

        // Vérifier si bloom devient invisible
        if (bloom.enabled) {
          // Conflict: Background trop clair + exposition faible
          if (background.brightness > CONFLICT_RULES.background.brightThreshold &&
              lighting.exposure < 1.0) {
            conflicts.push({
              type: 'bloom_invisible',
              severity: 'high',
              message: '⚠️ Bloom invisible avec ce background clair et exposition faible',
              suggestion: 'Réduire lighting exposure ou assombrir background',
              systems: ['bloom', 'background', 'lighting']
            });
          }

          // Conflict: PBR metalness/roughness élevés
          if (pbr.metalness > 0.8 && bloom.emissiveIntensity > 0.5) {
            conflicts.push({
              type: 'pbr_bloom_conflict',
              severity: 'medium',
              message: '⚠️ Metalness élevé + bloom émissive = conflit visuel',
              suggestion: 'Réduire metalness ou emissiveIntensity',
              systems: ['pbr', 'bloom']
            });
          }
        }

        // Vérifier exposition extrême
        if (lighting.exposure < CONFLICT_RULES.lighting.lowExposureThreshold) {
          conflicts.push({
            type: 'low_exposure',
            severity: 'low',
            message: '💡 Exposition très basse, détails peuvent être perdus',
            suggestion: 'Augmenter exposure au-dessus de 0.3',
            systems: ['lighting']
          });
        }

        if (lighting.exposure > CONFLICT_RULES.lighting.highExposureThreshold) {
          conflicts.push({
            type: 'high_exposure',
            severity: 'medium',
            message: '🔆 Exposition très haute, couleurs peuvent être brûlées',
            suggestion: 'Réduire exposure en-dessous de 3.0',
            systems: ['lighting']
          });
        }

        // Vérifier background sombre avec peu de lumière
        if (background.brightness < CONFLICT_RULES.background.darkThreshold &&
            lighting.ambientIntensity * pbr.ambientMultiplier < 2.0) {
          conflicts.push({
            type: 'dark_scene',
            severity: 'low',
            message: '🌑 Scène très sombre, objets peu visibles',
            suggestion: 'Augmenter ambient light ou éclaircir background',
            systems: ['background', 'lighting', 'pbr']
          });
        }

        return conflicts;
      }
    }),

    // === CONFLICT RESOLUTION ===
    resolveConflicts: assign({
      systems: (context) => {
        if (!context.autoResolve || context.conflicts.length === 0) {
          return context.systems;
        }

        const newSystems = { ...context.systems };

        // Résolution automatique basée sur les types de conflits
        context.conflicts.forEach(conflict => {
          switch (conflict.type) {
            case 'bloom_invisible':
              // Augmenter l'intensité du bloom et l'exposition
              newSystems.bloom.strength = Math.min(1.0, newSystems.bloom.strength * 1.5);
              newSystems.lighting.exposure = Math.min(2.0, newSystems.lighting.exposure * 1.2);
              break;

            case 'pbr_bloom_conflict':
              // Réduire metalness pour permettre plus de bloom
              newSystems.pbr.metalness = Math.max(0.3, newSystems.pbr.metalness * 0.7);
              break;

            case 'low_exposure':
              // Augmenter l'exposition minimale
              newSystems.lighting.exposure = Math.max(0.5, newSystems.lighting.exposure);
              break;

            case 'high_exposure':
              // Réduire l'exposition maximale
              newSystems.lighting.exposure = Math.min(2.5, newSystems.lighting.exposure);
              break;

            case 'dark_scene':
              // Augmenter la lumière ambiante
              newSystems.pbr.ambientMultiplier = Math.min(2.0, newSystems.pbr.ambientMultiplier * 1.3);
              break;
          }
        });

        return newSystems;
      }
    }),

    applyManualResolution: assign({
      systems: (context, event) => ({
        ...context.systems,
        ...event.resolution
      })
    }),

    // === CHECKPOINT MANAGEMENT ===
    saveCheckpoint: assign({
      checkpoints: (context, event) => {
        const checkpoint = {
          id: Date.now(),
          name: event.name || `Checkpoint ${new Date().toLocaleTimeString()}`,
          systems: JSON.parse(JSON.stringify(context.systems)),
          timestamp: Date.now()
        };

        // Sauvegarder dans localStorage
        const checkpoints = [...context.checkpoints, checkpoint].slice(-10); // Garder les 10 derniers
        localStorage.setItem('renderSyncCheckpoints', JSON.stringify(checkpoints));

        return checkpoints;
      },
      currentCheckpoint: (context) => context.checkpoints.length
    }),

    restoreCheckpoint: assign({
      systems: (context, event) => {
        const checkpoint = event.checkpointId
          ? context.checkpoints.find(cp => cp.id === event.checkpointId)
          : context.checkpoints[context.checkpoints.length - 1];

        if (checkpoint) {
          console.log(`✅ Restored checkpoint: ${checkpoint.name}`);
          return checkpoint.systems;
        }

        return context.systems;
      }
    }),

    rollbackToLastCheckpoint: assign({
      systems: (context) => {
        const lastCheckpoint = context.checkpoints[context.checkpoints.length - 1];
        if (lastCheckpoint) {
          console.log(`↩️ Rolling back to: ${lastCheckpoint.name}`);
          return lastCheckpoint.systems;
        }
        return context.systems;
      }
    }),

    // === LOGGING & NOTIFICATIONS ===
    logConflicts: assign({
      logs: (context) => {
        const logEntries = context.conflicts.map(conflict => ({
          timestamp: Date.now(),
          type: 'conflict',
          message: conflict.message,
          severity: conflict.severity,
          data: conflict
        }));

        // Logger dans la console
        logEntries.forEach(log => {
          const emoji = log.severity === 'high' ? '🔴' : log.severity === 'medium' ? '🟡' : '🔵';
          console.log(`${emoji} [RenderSync] ${log.message}`);
          if (log.data.suggestion) {
            console.log(`   💡 Suggestion: ${log.data.suggestion}`);
          }
        });

        return [...context.logs, ...logEntries].slice(-50); // Garder les 50 derniers logs
      }
    }),

    notifyConflicts: assign({
      notifications: (context) => {
        const notifications = context.conflicts
          .filter(c => c.severity !== 'low')
          .map(conflict => ({
            id: Date.now() + Math.random(),
            type: conflict.severity,
            message: conflict.message,
            suggestion: conflict.suggestion,
            timestamp: Date.now()
          }));

        // Dispatcher des événements pour l'UI
        notifications.forEach(notif => {
          window.dispatchEvent(new CustomEvent('renderSyncNotification', { detail: notif }));
        });

        return [...context.notifications, ...notifications].slice(-10);
      }
    }),

    logSuccess: assign({
      logs: (context) => {
        const log = {
          timestamp: Date.now(),
          type: 'success',
          message: '✅ Synchronisation réussie',
          data: { systems: context.systems }
        };

        console.log(`[RenderSync] ${log.message}`);
        return [...context.logs, log].slice(-50);
      }
    }),

    // === UTILITY ACTIONS ===
    applyChanges: (context) => {
      // Dispatcher un événement global avec les nouveaux paramètres
      window.dispatchEvent(new CustomEvent('renderSyncUpdate', {
        detail: { systems: context.systems }
      }));
    },

    clearConflicts: assign({
      conflicts: []
    }),

    clearLogs: assign({
      logs: [],
      notifications: []
    }),

    toggleValidation: assign({
      validationEnabled: (context) => !context.validationEnabled
    }),

    toggleAutoResolve: assign({
      autoResolve: (context) => !context.autoResolve
    })
  },

  guards: {
    hasConflicts: (context) => context.conflicts.length > 0,
    noConflicts: (context) => context.conflicts.length === 0,
    canAutoResolve: (context) => context.autoResolve
  }
});

// === HELPER FUNCTIONS ===

/**
 * Calculer la luminosité d'un background
 */
function calculateBackgroundBrightness(background) {
  if (background.type === 'transparent') return 0;
  if (background.type === 'color') {
    // Convertir hex en luminosité
    const hex = background.color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16) / 255;
    const g = parseInt(hex.substr(2, 2), 16) / 255;
    const b = parseInt(hex.substr(4, 2), 16) / 255;
    // Formule de luminosité perçue
    return 0.299 * r + 0.587 * g + 0.114 * b;
  }
  return 0.5; // Défaut pour autres types
}

/**
 * Service pour gérer la machine
 */
export class RenderSyncService {
  constructor() {
    this.machine = renderSyncMachine;
    this.service = null;
    this.loadCheckpoints();
  }

  start() {
    if (this.service) return;

    const { interpret } = require('xstate');
    this.service = interpret(this.machine)
      .onTransition((state) => {
        console.log(`[RenderSync] State: ${state.value}`);
      })
      .start();

    // Écouter les changements du store Zustand
    this.setupStoreListeners();

    return this.service;
  }

  stop() {
    if (this.service) {
      this.service.stop();
      this.service = null;
    }
  }

  send(event) {
    if (this.service) {
      this.service.send(event);
    }
  }

  getState() {
    return this.service?.getSnapshot();
  }

  loadCheckpoints() {
    try {
      const saved = localStorage.getItem('renderSyncCheckpoints');
      if (saved) {
        const checkpoints = JSON.parse(saved);
        console.log(`📚 Loaded ${checkpoints.length} checkpoints from localStorage`);
        return checkpoints;
      }
    } catch (error) {
      console.error('Failed to load checkpoints:', error);
    }
    return [];
  }

  setupStoreListeners() {
    // S'abonner aux changements du store Zustand
    if (window.useSceneStore) {
      const unsubscribe = window.useSceneStore.subscribe(
        (state) => {
          // Synchroniser les changements vers la machine XState
          this.send({
            type: 'UPDATE_BLOOM',
            params: state.bloom
          });
          this.send({
            type: 'UPDATE_PBR',
            params: state.pbr
          });
          this.send({
            type: 'UPDATE_LIGHTING',
            params: state.lighting
          });
          this.send({
            type: 'UPDATE_BACKGROUND',
            params: state.background
          });
        }
      );

      return unsubscribe;
    }
  }
}

// Créer et exporter une instance globale
export const renderSyncService = new RenderSyncService();

// Auto-start si dans un environnement browser
if (typeof window !== 'undefined') {
  window.renderSyncService = renderSyncService;
  // Démarrer automatiquement après un court délai
  setTimeout(() => {
    console.log('🚀 Starting RenderSync Service...');
    renderSyncService.start();
  }, 1000);
}