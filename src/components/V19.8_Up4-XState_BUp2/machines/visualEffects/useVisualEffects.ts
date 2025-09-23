// 🎨 useVisualEffects Hook - Hook React principal pour effets visuels
// Hook React unifié pour BloomMachine + PBRMachine + Environment + Security

import { useCallback, useMemo, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useMachine } from '@xstate/react';
import { visualEffectsMachineWithConfig } from './machineWithConfig';
import type {
  VisualEffectsContext,
  VisualEffectsHook,
  VisualGroupType,
  SecurityPreset,
  BloomGlobalConfig,
  PBRGlobalConfig,
  BloomGroupConfig,
  PBRGroupConfig
} from './types';

// Options de configuration du hook
export interface UseVisualEffectsOptions {
  // Systèmes externes
  renderer?: THREE.WebGLRenderer;
  scene?: THREE.Scene;
  camera?: THREE.Camera;

  // Configuration
  autoInit?: boolean;
  enablePerformanceMonitoring?: boolean;
  debugMode?: boolean;

  // Callbacks
  onStateChange?: (state: any) => void;
  onError?: (error: Error) => void;
}

export const useVisualEffects = (options: UseVisualEffectsOptions = {}): VisualEffectsHook => {
  const {
    renderer,
    scene,
    camera,
    autoInit = false,
    enablePerformanceMonitoring = true,
    debugMode = false,
    onStateChange,
    onError
  } = options;

  // ✅ CORRECTION: Machine statique - Ne change jamais
  const [state, send, service] = useMachine(visualEffectsMachineWithConfig, {
    devTools: debugMode
  });

  // ✅ CORRECTION: Mise à jour du contexte par événement, pas par machine recreation
  useEffect(() => {
    if (renderer || scene || camera) {
      send({
        type: 'SYSTEM.UPDATE_CONTEXT',
        renderer: renderer || null,
        scene: scene || null,
        camera: camera || null
      });
    }
  }, [renderer, scene, camera, send]);

  const context = state.context as VisualEffectsContext;

  // ====================================
  // CONTRÔLES BLOOM
  // ====================================

  const bloomControls = useMemo(() => ({
    enable: () => {
      console.log('🌟 useVisualEffects: Enabling bloom...');
      send({ type: 'BLOOM.ENABLE' });
    },

    disable: () => {
      console.log('🌟 useVisualEffects: Disabling bloom...');
      send({ type: 'BLOOM.DISABLE' });
    },

    updateGlobal: (params: Partial<BloomGlobalConfig>) => {
      console.log('🌟 useVisualEffects: Updating global bloom...', params);
      send({ type: 'BLOOM.UPDATE_GLOBAL', ...params });
    },

    updateGroup: (group: VisualGroupType, params: Partial<BloomGroupConfig>) => {
      console.log(`🎭 useVisualEffects: Updating bloom group ${group}...`, params);
      send({ type: 'BLOOM.UPDATE_GROUP', group, ...params });
    },

    isEnabled: context.bloom.global.enabled
  }), [send, context.bloom.global.enabled]);

  // ====================================
  // CONTRÔLES PBR
  // ====================================

  const pbrControls = useMemo(() => ({
    enable: () => {
      console.log('🎨 useVisualEffects: Enabling PBR...');
      send({ type: 'PBR.ENABLE' });
    },

    disable: () => {
      console.log('🎨 useVisualEffects: Disabling PBR...');
      send({ type: 'PBR.DISABLE' });
    },

    updateGlobal: (params: Partial<PBRGlobalConfig>) => {
      console.log('🎨 useVisualEffects: Updating global PBR...', params);
      send({ type: 'PBR.UPDATE_GLOBAL', ...params });
    },

    updateGroup: (group: VisualGroupType, params: Partial<PBRGroupConfig>) => {
      console.log(`🎨 useVisualEffects: Updating PBR group ${group}...`, params);
      send({ type: 'PBR.UPDATE_GROUP', group, ...params });
    },

    isActive: context.pbr.global.enabled
  }), [send, context.pbr.global.enabled]);

  // ====================================
  // CONTRÔLES ENVIRONMENT
  // ====================================

  const environmentControls = useMemo(() => ({
    loadHDR: (path: string) => {
      console.log('🌍 useVisualEffects: Loading HDR environment...', path);
      send({ type: 'ENV.LOAD_HDR', path });
    },

    setIntensity: (intensity: number) => {
      console.log('🌍 useVisualEffects: Setting environment intensity...', intensity);
      send({ type: 'ENV.SET_INTENSITY', intensity });
    },

    toggleBackground: () => {
      console.log('🌍 useVisualEffects: Toggling environment background...');
      send({ type: 'ENV.TOGGLE_BACKGROUND' });
    },

    isReady: typeof state.value === 'object' && state.value.environment === 'ready'
  }), [send, state.value]);

  // ====================================
  // CONTRÔLES SECURITY
  // ====================================

  const securityControls = useMemo(() => ({
    setPreset: (preset: SecurityPreset) => {
      console.log(`🔒 useVisualEffects: Setting security preset to ${preset}...`);
      send({ type: 'SECURITY.SET_PRESET', preset });
    },

    currentPreset: context.security.currentPreset,
    isTransitioning: context.security.isTransitioning
  }), [send, context.security.currentPreset, context.security.isTransitioning]);

  // ====================================
  // GESTION OBJETS
  // ====================================

  // Counts séparé pour éviter hook dans hook
  const objectsCounts = useMemo(() => ({
    iris: context.objectsRegistry.iris.size,
    eyeRings: context.objectsRegistry.eyeRings.size,
    revealRings: context.objectsRegistry.revealRings.size,
    magicRings: context.objectsRegistry.magicRings.size,
    arms: context.objectsRegistry.arms.size
  }), [context.objectsRegistry]);

  const objectsControls = useMemo(() => ({
    register: (group: VisualGroupType, objects: Map<string, THREE.Mesh>) => {
      console.log(`🔍 useVisualEffects: Registering ${objects.size} objects for group ${group}`);
      send({ type: 'OBJECTS.REGISTER', group, objects });
    },

    unregister: (group: VisualGroupType, objectIds: string[]) => {
      console.log(`🗑️ useVisualEffects: Unregistering ${objectIds.length} objects from group ${group}`);
      send({ type: 'OBJECTS.UNREGISTER', group, objectIds });
    },

    detect: (model: THREE.Group | THREE.Mesh) => {
      console.log('🔍 useVisualEffects: Detecting objects in model...');
      send({ type: 'OBJECTS.DETECT', model });
    },

    clear: (group?: VisualGroupType) => {
      console.log(`🧹 useVisualEffects: Clearing objects${group ? ` from group ${group}` : ' from all groups'}...`);
      send({ type: 'OBJECTS.CLEAR', group });
    },

    counts: objectsCounts
  }), [send, objectsCounts]);

  // ====================================
  // CALLBACKS SYSTÈME
  // ====================================

  const dispose = useCallback(() => {
    console.log('🧹 useVisualEffects: Disposing all resources...');
    send({ type: 'SYSTEM.DISPOSE' });
  }, [send]);

  // ====================================
  // EFFETS
  // ====================================

  // Initialization automatique
  useEffect(() => {
    if (autoInit && renderer && scene && camera) {
      send({ type: 'SYSTEM.INIT', renderer, scene, camera });
    }
  }, [autoInit, renderer, scene, camera, send]);

  // Callback de changement d'état (avec détection de changement réel)
  const prevStateRef = useRef<any>(null);
  useEffect(() => {
    if (onStateChange) {
      // Éviter les appels répétitifs si l'état n'a pas vraiment changé
      const currentStateValue = JSON.stringify(state.value);
      const prevStateValue = JSON.stringify(prevStateRef.current?.value);

      if (currentStateValue !== prevStateValue) {
        onStateChange(state);
        prevStateRef.current = state;
      }
    }
  }, [state, onStateChange]);

  // Gestion des erreurs
  useEffect(() => {
    const subscription = service.subscribe({
      error: (error) => {
        console.error('❌ VisualEffects Error:', error);
        if (onError) {
          onError(error);
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [service, onError]);

  // Performance monitoring
  useEffect(() => {
    if (!enablePerformanceMonitoring) {
      return; // Retourne undefined explicitement
    }

    let animationId: number | null = null;

    const updatePerformance = () => {
      const now = performance.now();
      const frameTime = now - context.performance.lastUpdateTime;
      const fps = frameTime > 0 ? 1000 / frameTime : 60;

      send({
        type: 'SYSTEM.UPDATE_PERFORMANCE',
        fps: Math.round(fps),
        frameTime: Math.round(frameTime * 100) / 100
      });

      animationId = requestAnimationFrame(updatePerformance);
    };

    animationId = requestAnimationFrame(updatePerformance);

    return () => {
      if (animationId !== null) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [enablePerformanceMonitoring, send, context.performance.lastUpdateTime]);

  // ====================================
  // RETURN HOOK
  // ====================================

  return {
    // État et contexte
    state,
    context,
    send,

    // Contrôles par domaine
    bloom: bloomControls,
    pbr: pbrControls,
    environment: environmentControls,
    security: securityControls,
    objects: objectsControls,

    // Performance et utilitaires
    performance: context.performance,
    dispose
  };
};

export default useVisualEffects;