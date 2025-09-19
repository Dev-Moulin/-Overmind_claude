// useXStateSync.js - PHASE 1 Jour 6-8
// Hook de synchronisation XState <-> Three.js
// Remplace useTempBloomSync de V19.8

import { useEffect, useCallback } from 'react';
import { useSceneMachine } from '../stores/xstate/hooks/useSceneMachine.js';
import xstateController from '../stateController/xstateStateController.js';

export const useXStateSync = (threeJsController) => {
  const sceneMachine = useSceneMachine();
  
  const {
    // State
    bloomState,
    securityState,
    animationState,
    revealRingsState,
    
    // Operations
    updateBloomValue,
    applyBloomChangeImmediately,
    setSecurityMode,
    applyBloomPreset,
    overrideSecurity,
    startAnimation,
    completeAnimation,
    setRevealRingVisibility,
    resolveRevealConflicts,
    retryLastOperation,
    
    // Status
    currentState,
    isAnimationInProgress,
    operationQueue,
    notifications,
    errorState
  } = sceneMachine;

  // Helper pour vérifier si on est opérationnel
  const isOperational = () => {
    if (typeof currentState === 'object') {
      return currentState.operational !== undefined;
    }
    return currentState === 'operational' || 
           (typeof currentState === 'string' && currentState.includes('operational'));
  };

  // === SYNC BLOOM STATE TO THREE.JS ===
  useEffect(() => {
    if (!threeJsController || !isOperational()) return;
    
    // Sync seulement les vrais groupes bloom (pas les métadonnées)
    const bloomGroups = ['iris', 'eyeRings', 'revealRings', 'magicRings', 'arms'];
    
    Object.entries(bloomState).forEach(([groupName, settings]) => {
      // Filtrer seulement les groupes bloom valides et non-null
      if (bloomGroups.includes(groupName) && settings && typeof settings === 'object') {
        if (threeJsController.bloomController && 
            settings.intensity !== undefined && 
            settings.color !== undefined && 
            settings.enabled !== undefined) {
          
          threeJsController.bloomController.updateGroup(groupName, {
            intensity: settings.intensity,
            color: settings.color,
            enabled: settings.enabled
          });
        }
      }
    });
    
    console.log('🔄 XState -> Three.js bloom sync', bloomState);
  }, [bloomState, threeJsController, currentState]);

  // === SYNC SECURITY STATE TO THREE.JS ===
  useEffect(() => {
    if (!threeJsController || !isOperational()) return;
    
    if (threeJsController.securityController) {
      threeJsController.securityController.setMode(securityState.mode);
      
      // Si security override actif, forcer l'éclairage
      const isSecurityOverride = typeof currentState === 'object' ? 
        currentState.operational === 'securityOverride' : 
        (typeof currentState === 'string' && currentState.includes('securityOverride'));
      
      if (isSecurityOverride) {
        threeJsController.securityController.forceMaxLighting();
      }
    }
    
    console.log('🔒 XState -> Three.js security sync', securityState);
  }, [securityState, currentState, threeJsController]);

  // === SYNC ANIMATION STATE TO THREE.JS ===
  useEffect(() => {
    if (!threeJsController || !isOperational()) return;
    
    if (animationState.currentAnimation && threeJsController.animationController) {
      const { type, data } = animationState.currentAnimation;
      
      // Démarre l'animation dans Three.js
      threeJsController.animationController.start(type, {
        ...data,
        onComplete: () => {
          // Notifie XState que l'animation est terminée
          xstateController.completeAnimation();
        }
      });
    }
    
    console.log('🎭 XState -> Three.js animation sync', animationState);
  }, [animationState, threeJsController, currentState]);

  // === SYNC REVEAL RINGS TO THREE.JS ===
  useEffect(() => {
    if (!threeJsController || !isOperational()) return;
    
    if (threeJsController.revealRingsController) {
      Object.entries(revealRingsState).forEach(([ringId, settings]) => {
        threeJsController.revealRingsController.setVisibility(ringId, settings.visible);
      });
    }
    
    console.log('💍 XState -> Three.js reveal rings sync', revealRingsState);
  }, [revealRingsState, threeJsController, currentState]);

  // === HANDLE THREE.JS -> XSTATE UPDATES ===
  const handleThreeJsUpdate = useCallback((updateType, data) => {
    switch (updateType) {
      case 'bloom':
        updateBloomValue(data.groupName, data.property, data.value);
        applyBloomChangeImmediately();
        break;
        
      case 'security':
        setSecurityMode(data.mode);
        break;
        
      case 'animationComplete':
        xstateController.completeAnimation();
        break;
        
      default:
        console.warn('Unknown update type from Three.js:', updateType);
    }
  }, [updateBloomValue, applyBloomChangeImmediately, setSecurityMode]);

  // === EXPOSE STATE CONTROLLER ===
  useEffect(() => {
    // Connecte le controller global avec toutes les fonctions du hook
    xstateController.init({
      // States
      bloomState,
      securityState,
      animationState,
      revealRingsState,
      currentState,
      
      // Operations
      updateBloomValue,
      applyBloomChangeImmediately,
      setSecurityMode,
      applyBloomPreset,
      overrideSecurity,
      startAnimation,
      completeAnimation,
      setRevealRingVisibility,
      resolveRevealConflicts,
      retryLastOperation,
      
      // Status
      isAnimationInProgress,
      operationQueue,
      notifications,
      errorState
    });
  }, []);  // Init seulement au mount

  return {
    // Expose le state controller pour Three.js
    stateController: xstateController,
    
    // Callback pour les updates Three.js -> XState
    handleThreeJsUpdate,
    
    // État actuel pour debug
    debugInfo: {
      currentState,
      isOperational: isOperational(),
      bloomState,
      securityState,
      animationState
    }
  };
};