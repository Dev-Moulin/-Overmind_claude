// 🌟 useBloomMachine Hook - Atome B1 (ADAPTÉ POUR COMPATIBILITÉ)
// Hook React pour intégration BloomMachine avec UI
// ⚠️ LEGACY: Ce hook est maintenant un proxy vers useVisualEffects

import { useCallback, useMemo, useEffect } from 'react';
import * as THREE from 'three';
import { useVisualEffects } from '../visualEffects/useVisualEffects';
import type { UseVisualEffectsOptions } from '../visualEffects/useVisualEffects';
import type {
  VisualGroupType as BloomGroupType,
  SecurityPreset,
  VisualEffectsHook
} from '../visualEffects/types';

// ============================================
// COMPATIBILITÉ AVEC L'ANCIENNE API
// ============================================

// Mapping des options pour compatibilité
export interface UseBloomMachineOptions {
  // Systèmes externes (mappés vers useVisualEffects)
  simpleBloomSystem?: any;
  bloomControlCenter?: any;
  frameScheduler?: any;
  renderer?: THREE.WebGLRenderer;
  scene?: THREE.Scene;
  camera?: THREE.Camera;

  // Configuration
  autoStart?: boolean;
  enablePerformanceMonitoring?: boolean;
  debugMode?: boolean;

  // Callbacks
  onStateChange?: (state: any) => void;
  onError?: (error: Error) => void;
}

// Interface de retour adaptée
export interface BloomMachineHook {
  // État (proxy vers visualEffects.bloom)
  state: {
    value: string;
    context: {
      global: any;
      groups: any;
    };
  };
  send: (event: any) => void;

  // Contrôles bloom (proxy)
  enableBloom: () => void;
  disableBloom: () => void;
  updateGlobal: (params: any) => void;
  updateGroup: (group: BloomGroupType, params: any) => void;
  registerObjects: (group: BloomGroupType, objects: Map<string, THREE.Mesh>) => void;
  setSecurity: (preset: SecurityPreset) => void;
  detectObjects: (model: THREE.Group | THREE.Mesh) => void;
  syncWithRenderer: () => void;
  forceRefresh: () => void;
  dispose: () => void;

  // État dérivé (proxy)
  isEnabled: boolean;
  currentSecurity: SecurityPreset | null;
  isSecurityTransitioning: boolean;
  groupCounts: Record<BloomGroupType, number>;
  performance: any;
}

export const useBloomMachine = (options: UseBloomMachineOptions = {}): BloomMachineHook => {
  // ⚠️ AVERTISSEMENT DE COMPATIBILITÉ
  if (process.env.NODE_ENV === 'development') {
    console.warn('🔄 useBloomMachine is now a compatibility layer. Consider migrating to useVisualEffects for full functionality.');
  }
  const {
    simpleBloomSystem,
    bloomControlCenter,
    frameScheduler,
    renderer,
    scene,
    camera,
    autoStart = false,
    enablePerformanceMonitoring = true,
    debugMode = false,
    onStateChange,
    onError
  } = options;

  // Utiliser useVisualEffects en interne
  const visualEffects = useVisualEffects({
    renderer,
    scene,
    camera,
    autoInit: autoStart,
    enablePerformanceMonitoring,
    debugMode,
    onStateChange,
    onError
  });

  // État proxy pour compatibilité
  const bloomState = useMemo(() => ({
    value: typeof visualEffects.state.value === 'object' && visualEffects.state.value.bloom
      ? visualEffects.state.value.bloom
      : 'disabled',
    context: {
      global: visualEffects.context.bloom.global,
      groups: visualEffects.context.bloom.groups
    }
  }), [visualEffects.state.value, visualEffects.context.bloom]);

  // Proxy callbacks vers visualEffects
  const enableBloom = useCallback(() => {
    console.log('🌟 useBloomMachine (proxy): Enabling bloom...');
    visualEffects.bloom.enable();
  }, [visualEffects.bloom]);

  const disableBloom = useCallback(() => {
    console.log('🌟 useBloomMachine (proxy): Disabling bloom...');
    visualEffects.bloom.disable();
  }, [visualEffects.bloom]);

  const updateGlobal = useCallback((params: any) => {
    console.log('🌟 useBloomMachine (proxy): Updating global parameters...', params);
    visualEffects.bloom.updateGlobal(params);
  }, [visualEffects.bloom]);

  const updateGroup = useCallback((group: BloomGroupType, params: any) => {
    console.log(`🎭 useBloomMachine (proxy): Updating group ${group}...`, params);
    visualEffects.bloom.updateGroup(group, params);
  }, [visualEffects.bloom]);

  const registerObjects = useCallback((group: BloomGroupType, objects: Map<string, THREE.Mesh>) => {
    console.log(`🔍 useBloomMachine (proxy): Registering ${objects.size} objects for group ${group}`);
    visualEffects.objects.register(group, objects);
  }, [visualEffects.objects]);

  const setSecurity = useCallback((preset: SecurityPreset) => {
    console.log(`🔒 useBloomMachine (proxy): Setting security to ${preset}`);
    visualEffects.security.setPreset(preset);
  }, [visualEffects.security]);

  const detectObjects = useCallback((model: THREE.Group | THREE.Mesh) => {
    console.log('🔍 useBloomMachine (proxy): Detecting objects...');
    visualEffects.objects.detect(model);
  }, [visualEffects.objects]);

  const syncWithRenderer = useCallback(() => {
    console.log('🔄 useBloomMachine (proxy): Syncing with renderer...');
    visualEffects.send({ type: 'SYSTEM.SYNC' });
  }, [visualEffects.send]);

  const forceRefresh = useCallback(() => {
    console.log('🔥 useBloomMachine (proxy): Force refresh...');
    visualEffects.send({ type: 'SYSTEM.SYNC' });
  }, [visualEffects.send]);

  const dispose = useCallback(() => {
    console.log('🧹 useBloomMachine (proxy): Disposing...');
    visualEffects.dispose();
  }, [visualEffects.dispose]);

  // État dérivé proxy
  const derivedState = useMemo(() => ({
    // États principaux (proxy vers visualEffects)
    isEnabled: visualEffects.bloom.isEnabled,
    currentSecurity: visualEffects.security.currentPreset,
    isSecurityTransitioning: visualEffects.security.isTransitioning,

    // Compteurs objets (proxy)
    groupCounts: visualEffects.objects.counts,

    // Performance (proxy)
    performance: visualEffects.performance
  }), [visualEffects]);

  // Auto-start si demandé (proxy)
  useEffect(() => {
    if (autoStart && !derivedState.isEnabled) {
      enableBloom();
    }
  }, [autoStart, derivedState.isEnabled, enableBloom]);

  return {
    // État (proxy compatible)
    state: bloomState,
    send: visualEffects.send,

    // Contrôles bloom (proxy)
    enableBloom,
    disableBloom,
    updateGlobal,
    updateGroup,
    registerObjects,
    setSecurity,
    detectObjects,
    syncWithRenderer,
    forceRefresh,
    dispose,

    // État dérivé (proxy)
    ...derivedState
  };
};

export default useBloomMachine;