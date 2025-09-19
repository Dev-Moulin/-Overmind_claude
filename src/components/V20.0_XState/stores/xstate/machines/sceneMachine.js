import { createMachine, spawn, assign } from 'xstate';
import { colorStateMachine } from './colorStateMachine.js';

/**
 * 🎬 SCENE STATE MACHINE V20.0 - SIMPLIFIÉ
 * Orchestrateur minimaliste pour la nouvelle architecture
 * Gère uniquement la coordination Color → Bloom → Lighting → Animation
 */

const WORKFLOW_CONFIG = {
  // Pipeline simplifié
  renderPipeline: ['color', 'bloom', 'lighting', 'animation'],
  
  // Configuration systems
  systems: {
    bloom: {
      global: { threshold: 0.15, strength: 0.4, radius: 0.4, enabled: true }
    },
    lighting: {
      ambient: { color: 0xffffff, intensity: 0.8 },
      directional: { color: 0xffffff, intensity: 0.8, position: { x: 1, y: 2, z: 3 } },
      exposure: 1.0
    },
    animation: {
      bigArms: ['Bras_L1_Mouv', 'Bras_L2_Mouv', 'Bras_R1_Mouv', 'Bras_R2_Mouv'],
      littleArms: ['Little_1_Mouv', 'Little_2_Mouv', 'Little_3_Mouv'],
      rings: ['Action_Ring', 'Ring_BloomArea_1Action_Ring']
    }
  }
};

/**
 * SCENE STATE MACHINE - Version simplifiée
 */
export const sceneMachine = createMachine({
  id: 'sceneV20',
  initial: 'initializing',
  
  context: {
    // Acteur couleur uniquement
    colorActor: null,
    
    // État système
    systemStatus: {
      initialized: false,
      lastError: null
    },
    
    // File d'opérations différées (pendant animations)
    operationQueue: [],
    
    // Configuration
    config: { ...WORKFLOW_CONFIG },
    
    // Métadonnées
    version: '20.0',
    lastUpdate: null
  },
  
  states: {
    initializing: {
      entry: 'initializeSystem',
      always: {
        target: 'operational',
        cond: 'isInitialized'
      }
    },
    
    operational: {
      initial: 'idle',
      entry: 'notifySystemReady',
      
      states: {
        idle: {
          on: {
            // Commandes couleurs → colorActor
            'COLOR.*': {
              actions: 'forwardToColorActor'
            },
            
            // Commandes animation
            TRIGGER_ANIMATION: {
              target: 'animationInProgress',
              actions: 'startAnimation'
            },
            
            // Export état global
            EXPORT_STATE: {
              actions: 'exportCompleteState'
            }
          }
        },
        
        animationInProgress: {
          entry: 'markAnimationStarted',
          
          on: {
            ANIMATION_COMPLETE: {
              target: 'idle',
              actions: 'processQueuedOperations'
            },
            
            // Différer opérations couleur pendant animation
            'COLOR.*': {
              actions: 'deferOperation'
            }
          }
        }
      }
    }
  }
}, {
  actions: {
    // === INITIALISATION ===
    initializeSystem: assign({
      colorActor: () => spawn(colorStateMachine, 'colorActor'),
      systemStatus: () => ({
        initialized: true,
        lastError: null
      }),
      lastUpdate: () => Date.now()
    }),
    
    notifySystemReady: () => {
      console.log('✅ Scene Machine V20.0 - Ready');
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('sceneSystemReady'));
      }
    },
    
    // === GESTION COULEURS ===
    forwardToColorActor: (context, event) => {
      if (context.colorActor) {
        const colorEvent = {
          ...event,
          type: event.type.replace('COLOR.', '')
        };
        context.colorActor.send(colorEvent);
      }
    },
    
    // === GESTION ANIMATIONS ===
    startAnimation: (context, event) => {
      console.log(`🎭 Starting animation: ${event.animationType}`);
    },
    
    markAnimationStarted: assign({
      systemStatus: (context) => ({
        ...context.systemStatus,
        animationInProgress: true
      })
    }),
    
    deferOperation: assign({
      operationQueue: (context, event) => [
        ...context.operationQueue,
        { ...event, deferredAt: Date.now() }
      ]
    }),
    
    processQueuedOperations: assign({
      operationQueue: (context) => {
        // Traiter les opérations différées
        context.operationQueue.forEach(op => {
          console.log(`⚡ Processing deferred: ${op.type}`);
          if (op.type.startsWith('COLOR.') && context.colorActor) {
            context.colorActor.send({
              ...op,
              type: op.type.replace('COLOR.', '')
            });
          }
        });
        return [];
      },
      systemStatus: (context) => ({
        ...context.systemStatus,
        animationInProgress: false
      })
    }),
    
    // === EXPORT ===
    exportCompleteState: (context) => {
      const state = {
        version: context.version,
        colorState: context.colorActor?.getSnapshot?.(),
        config: context.config,
        exportedAt: new Date().toISOString()
      };
      
      console.log('📤 State exported:', state);
      return state;
    }
  },
  
  guards: {
    isInitialized: (context) => context.systemStatus.initialized
  }
});

export { WORKFLOW_CONFIG };