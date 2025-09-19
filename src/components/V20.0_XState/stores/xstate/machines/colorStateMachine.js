import { createMachine, assign } from 'xstate';

/**
 * 🎨 COLOR STATE MACHINE V20.0 - SIMPLIFIÉ
 * 1 couleur globale → 3 intensités (iris, eyeRings, reveal) → bloom global
 */

// Configuration de départ
const INITIAL_COLOR = '#00ff88';
const INITIAL_INTENSITY = 0.5;

/**
 * COLOR STATE MACHINE - Version simplifiée
 */
export const colorStateMachine = createMachine({
  id: 'colorV20',
  initial: 'idle',
  
  context: {
    // UNE couleur globale pour tout
    globalColor: INITIAL_COLOR,
    
    // Intensités individuelles pour 3 éléments
    intensities: {
      iris: INITIAL_INTENSITY,
      eyeRings: INITIAL_INTENSITY,
      reveal: INITIAL_INTENSITY
    },
    
    // Paramètres bloom globaux
    bloomGlobal: {
      threshold: 0.15,
      strength: 0.4,
      radius: 0.4,
      enabled: true
    },
    
    // Historique pour undo/redo
    history: [],
    historyIndex: -1,
    maxHistory: 20,
    
    // Métadonnées
    lastModified: null,
    syncNeeded: false
  },
  
  states: {
    idle: {
      on: {
        // === ACTIONS COULEUR ===
        SET_GLOBAL_COLOR: {
          target: 'updating',
          actions: 'setGlobalColor'
        },
        
        // === ACTIONS INTENSITÉS ===
        SET_INTENSITY: {
          target: 'updating',
          actions: 'setIntensity'
        },
        
        // === ACTIONS BLOOM GLOBAL ===
        SET_BLOOM_PARAM: {
          target: 'updating',
          actions: 'setBloomParam'
        },
        
        TOGGLE_BLOOM: {
          target: 'updating',
          actions: 'toggleBloom'
        },
        
        // === ACTIONS HISTORIQUE ===
        UNDO: {
          target: 'updating',
          actions: 'undoLastAction',
          cond: 'canUndo'
        },
        
        REDO: {
          target: 'updating',
          actions: 'redoLastAction',
          cond: 'canRedo'
        },
        
        // === RESET ===
        RESET_TO_DEFAULTS: {
          target: 'updating',
          actions: 'resetToDefaults'
        }
      }
    },
    
    updating: {
      entry: ['recordHistory', 'markSyncNeeded'],
      always: {
        target: 'idle',
        actions: 'notifyUpdate'
      }
    }
  }
}, {
  actions: {
    // === ACTION COULEUR GLOBALE ===
    setGlobalColor: assign({
      globalColor: (context, event) => event.color,
      lastModified: () => Date.now()
    }),
    
    // === ACTION INTENSITÉS ===
    setIntensity: assign({
      intensities: (context, event) => ({
        ...context.intensities,
        [event.element]: Math.max(0, Math.min(2, event.value))
      }),
      lastModified: () => Date.now()
    }),
    
    // === ACTIONS BLOOM ===
    setBloomParam: assign({
      bloomGlobal: (context, event) => ({
        ...context.bloomGlobal,
        [event.param]: event.value
      }),
      lastModified: () => Date.now()
    }),
    
    toggleBloom: assign({
      bloomGlobal: (context) => ({
        ...context.bloomGlobal,
        enabled: !context.bloomGlobal.enabled
      }),
      lastModified: () => Date.now()
    }),
    
    // === ACTION RESET ===
    resetToDefaults: assign({
      globalColor: () => INITIAL_COLOR,
      intensities: () => ({
        iris: INITIAL_INTENSITY,
        eyeRings: INITIAL_INTENSITY,
        reveal: INITIAL_INTENSITY
      }),
      bloomGlobal: () => ({
        threshold: 0.15,
        strength: 0.4,
        radius: 0.4,
        enabled: true
      }),
      lastModified: () => Date.now()
    }),
    
    // === ACTIONS HISTORIQUE ===
    recordHistory: assign({
      history: (context) => {
        const newEntry = {
          globalColor: context.globalColor,
          intensities: { ...context.intensities },
          bloomGlobal: { ...context.bloomGlobal },
          timestamp: Date.now()
        };
        
        const newHistory = [...context.history];
        
        // Supprimer les entrées après l'index actuel
        if (context.historyIndex < newHistory.length - 1) {
          newHistory.splice(context.historyIndex + 1);
        }
        
        newHistory.push(newEntry);
        
        // Limiter la taille de l'historique
        if (newHistory.length > context.maxHistory) {
          newHistory.shift();
        }
        
        return newHistory;
      },
      historyIndex: (context) => Math.min(context.historyIndex + 1, context.maxHistory - 1)
    }),
    
    undoLastAction: assign({
      globalColor: (context) => {
        const prevIndex = context.historyIndex - 1;
        if (prevIndex >= 0 && context.history[prevIndex]) {
          return context.history[prevIndex].globalColor;
        }
        return context.globalColor;
      },
      intensities: (context) => {
        const prevIndex = context.historyIndex - 1;
        if (prevIndex >= 0 && context.history[prevIndex]) {
          return { ...context.history[prevIndex].intensities };
        }
        return context.intensities;
      },
      bloomGlobal: (context) => {
        const prevIndex = context.historyIndex - 1;
        if (prevIndex >= 0 && context.history[prevIndex]) {
          return { ...context.history[prevIndex].bloomGlobal };
        }
        return context.bloomGlobal;
      },
      historyIndex: (context) => Math.max(0, context.historyIndex - 1)
    }),
    
    redoLastAction: assign({
      globalColor: (context) => {
        const nextIndex = context.historyIndex + 1;
        if (nextIndex < context.history.length && context.history[nextIndex]) {
          return context.history[nextIndex].globalColor;
        }
        return context.globalColor;
      },
      intensities: (context) => {
        const nextIndex = context.historyIndex + 1;
        if (nextIndex < context.history.length && context.history[nextIndex]) {
          return { ...context.history[nextIndex].intensities };
        }
        return context.intensities;
      },
      bloomGlobal: (context) => {
        const nextIndex = context.historyIndex + 1;
        if (nextIndex < context.history.length && context.history[nextIndex]) {
          return { ...context.history[nextIndex].bloomGlobal };
        }
        return context.bloomGlobal;
      },
      historyIndex: (context) => Math.min(context.history.length - 1, context.historyIndex + 1)
    }),
    
    // === ACTIONS SYSTÈME ===
    markSyncNeeded: assign({
      syncNeeded: true
    }),
    
    notifyUpdate: () => {
      // Émettre événement pour les systèmes externes
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('colorStateUpdate', {
          detail: { timestamp: Date.now() }
        }));
      }
    }
  },
  
  guards: {
    canUndo: (context) => context.historyIndex > 0,
    canRedo: (context) => context.historyIndex < context.history.length - 1
  }
});