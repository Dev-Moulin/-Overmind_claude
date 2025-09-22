// 🌟 useBloomMachine Hook - Atome B1
// Hook React pour intégration BloomMachine avec UI

import { useCallback, useMemo, useEffect } from 'react';
import * as THREE from 'three';
import { useMachine } from '@xstate/react';
import { bloomMachine } from './machine';
import {
  enableGlobalBloom,
  disableGlobalBloom,
  updateGroupBloom,
  applySecurityPreset,
  detectAndRegisterObjects as detectAndRegisterObjectsService,
  syncWithRenderer as syncWithRendererService,
  dispose as disposeService
} from './services';
import {
  updateGlobalParams,
  syncGlobalWithRenderer,
  updateGroupIris,
  updateGroupEyeRings,
  updateGroupRevealRings,
  updateGroupMagicRings,
  updateGroupArms,
  registerIrisObjects,
  registerEyeRingsObjects,
  registerRevealRingsObjects,
  registerMagicRingsObjects,
  registerArmsObjects,
  detectAndRegisterObjects as detectAndRegisterObjectsAction,
  syncWithFrameScheduler,
  syncWithRenderer as syncWithRendererAction,
  forceRefresh,
  notifySecurityTransition,
  dispose as disposeAction,
  logError
} from './actions';
import {
  isValidSecurityPreset,
  canEnableBloom,
  canDisableBloom,
  isValidGroup,
  hasGroupObjects,
  isValidThreshold,
  isValidStrength,
  isValidRadius,
  isValidExposure,
  isValidEmissiveColor,
  isValidEmissiveIntensity,
  hasFrameScheduler,
  hasSimpleBloomSystem,
  hasBloomControlCenter,
  canUpdateGroup,
  isPerformanceMode,
  shouldThrottleUpdates,
  hasValidModelForDetection,
  isSecurityTransitioning,
  canApplySecurityPreset,
  hasObjectsInAnyGroup,
  shouldAutoSync,
  canDispose,
  shouldLogPerformance
} from './guards';
import type {
  BloomContext,
  BloomGroupType,
  SecurityPreset,
  BloomMachineHook
} from './types';

// Configuration du hook avec services et actions
const bloomMachineWithImplementations = bloomMachine.withConfig({
  services: {
    enableGlobalBloom,
    disableGlobalBloom,
    updateGroupBloom,
    applySecurityPreset,
    detectAndRegisterObjects: detectAndRegisterObjectsService,
    syncWithRenderer: syncWithRendererService,
    dispose: disposeService
  },

  actions: {
    updateGlobalParams,
    syncGlobalWithRenderer,
    updateGroupIris,
    updateGroupEyeRings,
    updateGroupRevealRings,
    updateGroupMagicRings,
    updateGroupArms,
    registerIrisObjects,
    registerEyeRingsObjects,
    registerRevealRingsObjects,
    registerMagicRingsObjects,
    registerArmsObjects,
    detectAndRegisterObjects: detectAndRegisterObjectsAction,
    syncWithFrameScheduler,
    syncWithRenderer: syncWithRendererAction,
    forceRefresh,
    notifySecurityTransition,
    dispose: disposeAction,
    logError
  },

  guards: {
    isValidSecurityPreset,
    canEnableBloom,
    canDisableBloom,
    isValidGroup,
    hasGroupObjects,
    isValidThreshold,
    isValidStrength,
    isValidRadius,
    isValidExposure,
    isValidEmissiveColor,
    isValidEmissiveIntensity,
    hasFrameScheduler,
    hasSimpleBloomSystem,
    hasBloomControlCenter,
    canUpdateGroup,
    isPerformanceMode,
    shouldThrottleUpdates,
    hasValidModelForDetection,
    isSecurityTransitioning,
    canApplySecurityPreset,
    hasObjectsInAnyGroup,
    shouldAutoSync,
    canDispose,
    shouldLogPerformance
  }
});

export interface UseBloomMachineOptions {
  // Systèmes externes à injecter
  simpleBloomSystem?: any;
  bloomControlCenter?: any;
  frameScheduler?: any;

  // Configuration
  autoStart?: boolean;
  enablePerformanceMonitoring?: boolean;
  debugMode?: boolean;

  // Callbacks
  onStateChange?: (state: any) => void;
  onError?: (error: Error) => void;
}

export const useBloomMachine = (options: UseBloomMachineOptions = {}): BloomMachineHook => {
  const {
    simpleBloomSystem,
    bloomControlCenter,
    frameScheduler,
    autoStart = false,
    enablePerformanceMonitoring = true,
    debugMode = false,
    onStateChange,
    onError
  } = options;

  // Machine avec systèmes injectés
  const machineWithContext = useMemo(() => {
    return bloomMachineWithImplementations.withContext({
      ...bloomMachineWithImplementations.context,
      simpleBloomSystem,
      bloomControlCenter,
      frameScheduler,
      performance: {
        updateCount: 0,
        lastUpdateTime: Date.now(),
        averageUpdateTime: 0
      }
    });
  }, [simpleBloomSystem, bloomControlCenter, frameScheduler]);

  const [state, send, service] = useMachine(machineWithContext, {
    devTools: debugMode
  });

  // Callbacks optimisés
  const enableBloom = useCallback(() => {
    console.log('🌟 useBloomMachine: Enabling bloom...');
    send({ type: 'ENABLE_BLOOM' });
  }, [send]);

  const disableBloom = useCallback(() => {
    console.log('🌟 useBloomMachine: Disabling bloom...');
    send({ type: 'DISABLE_BLOOM' });
  }, [send]);

  const updateGlobal = useCallback((params: Partial<BloomContext['global']>) => {
    console.log('🌟 useBloomMachine: Updating global parameters...', params);
    send({ type: 'UPDATE_GLOBAL', ...params });
  }, [send]);

  const updateGroup = useCallback((group: BloomGroupType, params: Partial<BloomContext['groups'][BloomGroupType]>) => {
    console.log(`🎭 useBloomMachine: Updating group ${group}...`, params);

    const eventTypeMap = {
      iris: 'UPDATE_GROUP_IRIS',
      eyeRings: 'UPDATE_GROUP_EYERINGS',
      revealRings: 'UPDATE_GROUP_REVEALRINGS',
      magicRings: 'UPDATE_GROUP_MAGICRINGS',
      arms: 'UPDATE_GROUP_ARMS'
    };

    const eventType = eventTypeMap[group];
    if (eventType) {
      send({ type: eventType, ...params });
    } else {
      console.warn(`⚠️ useBloomMachine: Unknown group ${group}`);
    }
  }, [send]);

  const registerObjects = useCallback((group: BloomGroupType, objects: Map<string, THREE.Mesh>) => {
    console.log(`🔍 useBloomMachine: Registering ${objects.size} objects for group ${group}`);
    send({ type: 'REGISTER_OBJECTS', group, objects });
  }, [send]);

  const setSecurity = useCallback((preset: SecurityPreset) => {
    console.log(`🔒 useBloomMachine: Setting security to ${preset}`);
    send({ type: 'SET_SECURITY', preset });
  }, [send]);

  const detectObjects = useCallback((model: THREE.Group | THREE.Mesh) => {
    console.log('🔍 useBloomMachine: Detecting objects...');
    send({ type: 'DETECT_OBJECTS', model });
  }, [send]);

  const syncWithRenderer = useCallback(() => {
    console.log('🔄 useBloomMachine: Syncing with renderer...');
    send({ type: 'SYNC_WITH_RENDERER' });
  }, [send]);

  const forceRefresh = useCallback(() => {
    console.log('🔥 useBloomMachine: Force refresh...');
    send({ type: 'FORCE_REFRESH' });
  }, [send]);

  const dispose = useCallback(() => {
    console.log('🧹 useBloomMachine: Disposing...');
    send({ type: 'DISPOSE' });
  }, [send]);

  // État dérivé optimisé
  const derivedState = useMemo(() => {
    const context = state.context as BloomContext;

    return {
      // États principaux
      isEnabled: context.global?.enabled || false,
      currentSecurity: context.security?.currentPreset || null,
      isSecurityTransitioning: context.security?.isTransitioning || false,

      // Compteurs objets par groupe
      groupCounts: {
        iris: context.groups?.iris?.objects?.size || 0,
        eyeRings: context.groups?.eyeRings?.objects?.size || 0,
        revealRings: context.groups?.revealRings?.objects?.size || 0,
        magicRings: context.groups?.magicRings?.objects?.size || 0,
        arms: context.groups?.arms?.objects?.size || 0
      },

      // Performance metrics
      performance: context.performance || {
        updateCount: 0,
        lastUpdateTime: 0,
        averageUpdateTime: 0
      },

      // États des systèmes
      systems: {
        hasSimpleBloomSystem: context.simpleBloomSystem !== null,
        hasBloomControlCenter: context.bloomControlCenter !== null,
        hasFrameScheduler: context.frameScheduler !== null
      },

      // États machine (gestion des états parallèles)
      globalState: typeof state.value === 'object' && state.value.global ? state.value.global : 'disabled',
      securityState: typeof state.value === 'object' && state.value.security ? state.value.security : 'normal',
      groupsStates: {
        iris: typeof state.value === 'object' && state.value.groups && typeof state.value.groups === 'object' && state.value.groups.iris ? state.value.groups.iris : 'idle',
        eyeRings: typeof state.value === 'object' && state.value.groups && typeof state.value.groups === 'object' && state.value.groups.eyeRings ? state.value.groups.eyeRings : 'idle',
        revealRings: typeof state.value === 'object' && state.value.groups && typeof state.value.groups === 'object' && state.value.groups.revealRings ? state.value.groups.revealRings : 'idle',
        magicRings: typeof state.value === 'object' && state.value.groups && typeof state.value.groups === 'object' && state.value.groups.magicRings ? state.value.groups.magicRings : 'idle',
        arms: typeof state.value === 'object' && state.value.groups && typeof state.value.groups === 'object' && state.value.groups.arms ? state.value.groups.arms : 'idle'
      }
    };
  }, [state]);

  // Callbacks d'événements
  useEffect(() => {
    if (onStateChange) {
      onStateChange(state);
    }
  }, [state, onStateChange]);

  // Gestion des erreurs
  useEffect(() => {
    const subscription = service.subscribe({
      error: (error) => {
        console.error('❌ BloomMachine Error:', error);
        if (onError) {
          onError(error);
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [service, onError]);

  // Auto-start si demandé
  useEffect(() => {
    if (autoStart && !derivedState.isEnabled) {
      enableBloom();
    }
  }, [autoStart, derivedState.isEnabled, enableBloom]);

  // Performance monitoring
  useEffect(() => {
    if (enablePerformanceMonitoring && frameScheduler) {
      const interval = setInterval(() => {
        send({
          type: 'SYNC_WITH_FRAMESCHEDULER',
          fps: frameScheduler.performance?.fps || 60,
          deltaTime: 16.67 // Default 60fps
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [enablePerformanceMonitoring, frameScheduler, send]);

  return {
    // État
    state,
    send,

    // Contrôles globaux
    enableBloom,
    disableBloom,
    updateGlobal,

    // Contrôles groupes
    updateGroup,
    registerObjects,

    // Contrôles sécurité
    setSecurity,

    // Utilitaires
    detectObjects,
    syncWithRenderer,
    forceRefresh,
    dispose,

    // État dérivé
    ...derivedState
  };
};

export default useBloomMachine;