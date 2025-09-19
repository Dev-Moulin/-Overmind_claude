import { useMachine } from '@xstate/react';
import { sceneMachine, WORKFLOW_CONFIG } from '../machines/sceneMachine.js';
import { useColorMachine } from './useColorMachine.js';

/**
 * 🎬 SCENE MACHINE HOOK V20.0 - SIMPLIFIÉ
 * Interface unifiée minimaliste
 * Expose directement l'API couleur + gestion animations
 */
export const useSceneMachine = () => {
  const [state, send] = useMachine(sceneMachine);
  const { systemStatus, operationQueue } = state.context;
  
  // Hook couleur intégré directement
  const colorAPI = useColorMachine();
  
  // === API SYSTÈME ===
  
  /**
   * Obtenir l'état du système
   */
  const getSystemStatus = () => ({
    initialized: systemStatus.initialized,
    currentState: state.value,
    animationInProgress: systemStatus.animationInProgress || false,
    operationQueueSize: operationQueue.length
  });
  
  // === API ANIMATIONS ===
  
  /**
   * Déclencher une animation
   */
  const triggerAnimation = (animationType) => {
    const validTypes = ['bigArms', 'littleArms', 'rings'];
    if (!validTypes.includes(animationType)) {
      console.warn(`❌ Type animation invalide: ${animationType}`);
      return;
    }
    
    send({ type: 'TRIGGER_ANIMATION', animationType });
  };
  
  /**
   * Marquer animation terminée
   */
  const completeAnimation = () => {
    send({ type: 'ANIMATION_COMPLETE' });
  };
  
  // === API EXPORT ===
  
  /**
   * Exporter état complet
   */
  const exportSceneState = () => {
    send({ type: 'EXPORT_STATE' });
    
    return {
      version: '20.0',
      timestamp: Date.now(),
      system: getSystemStatus(),
      color: colorAPI.exportState(),
      config: WORKFLOW_CONFIG
    };
  };
  
  // === ÉTAT EXPOSÉ ===
  
  const currentState = state.value;
  const isReady = systemStatus.initialized;
  const isAnimationInProgress = systemStatus.animationInProgress || false;
  const hasQueuedOperations = operationQueue.length > 0;
  
  return {
    // État système
    currentState,
    isReady,
    isAnimationInProgress,
    hasQueuedOperations,
    systemStatus: getSystemStatus(),
    
    // API Couleurs complète (réexposée directement)
    ...colorAPI,
    
    // API Animations
    triggerAnimation,
    completeAnimation,
    
    // API Export
    exportSceneState,
    
    // Configuration
    config: WORKFLOW_CONFIG
  };
};