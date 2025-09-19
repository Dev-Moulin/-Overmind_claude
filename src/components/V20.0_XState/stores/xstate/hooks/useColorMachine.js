import { useMachine } from '@xstate/react';
import { colorStateMachine } from '../machines/colorStateMachine.js';

/**
 * 🎨 COLOR MACHINE HOOK V20.0 - SIMPLIFIÉ
 * API pour interaction avec la state machine couleurs simplifiée
 * 1 couleur globale → 3 intensités → bloom global
 */
export const useColorMachine = () => {
  const [state, send] = useMachine(colorStateMachine);
  const { globalColor, intensities, bloomGlobal, history, historyIndex } = state.context;
  
  // === API COULEUR GLOBALE ===
  
  /**
   * Modifier la couleur globale
   */
  const setGlobalColor = (color) => {
    send({ 
      type: 'SET_GLOBAL_COLOR', 
      color: typeof color === 'string' ? color : `#${color.toString(16).padStart(6, '0')}`
    });
  };
  
  // === API INTENSITÉS ===
  
  /**
   * Modifier l'intensité d'un élément (iris, eyeRings, reveal)
   */
  const setIntensity = (element, value) => {
    if (!['iris', 'eyeRings', 'reveal'].includes(element)) {
      console.warn(`❌ Élément inconnu: ${element}`);
      return;
    }
    
    send({ 
      type: 'SET_INTENSITY', 
      element, 
      value: Number(value)
    });
  };
  
  // === API BLOOM GLOBAL ===
  
  /**
   * Modifier un paramètre bloom global
   */
  const setBloomParam = (param, value) => {
    if (!['threshold', 'strength', 'radius'].includes(param)) {
      console.warn(`❌ Paramètre bloom inconnu: ${param}`);
      return;
    }
    
    send({ 
      type: 'SET_BLOOM_PARAM', 
      param, 
      value: Number(value)
    });
  };
  
  /**
   * Activer/désactiver bloom
   */
  const toggleBloom = () => {
    send({ type: 'TOGGLE_BLOOM' });
  };
  
  // === API HISTORIQUE ===
  
  /**
   * Annuler la dernière action
   */
  const undo = () => {
    send({ type: 'UNDO' });
  };
  
  /**
   * Refaire la dernière action annulée
   */
  const redo = () => {
    send({ type: 'REDO' });
  };
  
  /**
   * Reset aux valeurs par défaut
   */
  const resetToDefaults = () => {
    send({ type: 'RESET_TO_DEFAULTS' });
  };
  
  // === GETTERS ===
  
  /**
   * Obtenir état pour export/sauvegarde
   */
  const exportState = () => ({
    globalColor,
    intensities: { ...intensities },
    bloomGlobal: { ...bloomGlobal },
    timestamp: Date.now(),
    version: '20.0'
  });
  
  /**
   * Vérifier si une action est possible
   */
  const canPerformAction = (actionType) => {
    switch (actionType) {
      case 'undo':
        return historyIndex > 0;
      case 'redo':
        return historyIndex < history.length - 1;
      default:
        return true;
    }
  };
  
  // === ÉTAT ET STATUTS ===
  
  const currentState = state.value;
  const isUpdating = state.matches('updating');
  const syncNeeded = state.context.syncNeeded;
  
  // Statistiques utiles
  const stats = {
    historySize: history.length,
    currentHistoryIndex: historyIndex,
    canUndo: historyIndex > 0,
    canRedo: historyIndex < history.length - 1,
    bloomEnabled: bloomGlobal.enabled
  };
  
  return {
    // État
    globalColor,
    intensities,
    bloomGlobal,
    currentState,
    isUpdating,
    syncNeeded,
    stats,
    
    // Actions couleur
    setGlobalColor,
    
    // Actions intensités
    setIntensity,
    
    // Actions bloom
    setBloomParam,
    toggleBloom,
    
    // Actions historique
    undo,
    redo,
    resetToDefaults,
    
    // Utilitaires
    exportState,
    canPerformAction
  };
};