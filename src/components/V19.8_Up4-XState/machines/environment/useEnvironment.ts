/**
 * 🌍 useEnvironment Hook B4 - Hook React pour EnvironmentMachine B4
 * Hook React complet pour gestion HDR et environnement avancé
 */

import { useCallback, useMemo, useEffect, useRef } from 'react';
import { useMachine } from '@xstate/react';
import * as THREE from 'three';
import { environmentMachine } from './environmentMachine';
import { environmentServices } from './environmentServices';
import type {
  EnvironmentContext,
  EnvironmentHook,
  EnvironmentOptions,
  QualityLevel,
  EnvironmentPreset
} from './environmentTypes';
import { ENVIRONMENT_PRESETS } from './environmentTypes';
// Import des tests pour exposition automatique
import './productionTests';

// ====================================
// OPTIONS HOOK B4 ENVIRONMENT
// ====================================

export interface UseEnvironmentOptions extends EnvironmentOptions {
  // Systèmes Three.js
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
  onHDRLoaded?: (path: string, texture: THREE.Texture) => void;
  onQualityChange?: (level: QualityLevel) => void;
}

// ====================================
// HOOK PRINCIPAL B4 ENVIRONMENT
// ====================================

export const useEnvironment = (options: UseEnvironmentOptions = {}): EnvironmentHook => {
  const {
    renderer,
    scene,
    camera,
    autoInit = false,
    enablePerformanceMonitoring = true,
    debugMode = false,
    defaultPreset,
    enableCache = true,
    enableAdaptiveQuality = true,
    maxCacheSize = 512,
    targetFPS = 60,
    enableBridge = true,
    onStateChange,
    onError,
    onHDRLoaded,
    onQualityChange
  } = options;

  // ====================================
  // MACHINE B4 ENVIRONMENT
  // ====================================

  const [state, send, service] = useMachine(
    environmentMachine.withConfig({
      services: environmentServices
    }),
    {
      context: {
        ...environmentMachine.context,
        // Configuration utilisateur
        quality: {
          ...environmentMachine.context.quality,
          adaptiveEnabled: enableAdaptiveQuality,
          targetFPS: targetFPS
        },
        cache: {
          ...environmentMachine.context.cache,
          maxCacheSize: maxCacheSize * 1024 * 1024, // Convertir MB en bytes
          compressionEnabled: enableCache
        },
        lightingBridge: {
          ...environmentMachine.context.lightingBridge,
          syncEnabled: enableBridge
        }
      },
      devTools: debugMode
    }
  );

  const context = state.context as EnvironmentContext;

  // ====================================
  // INITIALISATION THREE.JS
  // ====================================

  useEffect(() => {
    if (renderer && scene) {
      console.log('🌍 Initializing B4 Environment system...');

      send({
        type: 'SYSTEM.INIT',
        renderer,
        scene
      });

      // Auto-load preset par défaut si spécifié
      if (autoInit && defaultPreset && ENVIRONMENT_PRESETS[defaultPreset]) {
        const preset = ENVIRONMENT_PRESETS[defaultPreset];
        console.log(`🌍 Auto-loading preset: ${preset.name}`);

        send({
          type: 'HDR.LOAD',
          path: preset.hdrPath,
          config: {
            intensity: preset.intensity,
            rotation: preset.rotation,
            background: preset.background
          }
        });
      }
    }
  }, [renderer, scene, send, autoInit, defaultPreset]);

  // ====================================
  // CONTRÔLES HDR
  // ====================================

  const hdrControls = useMemo(() => ({
    load: useCallback((path: string, config?: any) => {
      console.log(`🌍 Loading HDR: ${path}`);
      send({
        type: 'HDR.LOAD',
        path,
        config
      });
    }, [send]),

    unload: useCallback(() => {
      console.log('🌍 Unloading HDR');
      send({ type: 'HDR.UNLOAD' });
    }, [send]),

    setIntensity: useCallback((intensity: number) => {
      console.log(`🌍 Setting HDR intensity: ${intensity}`);
      send({
        type: 'HDR.SET_INTENSITY',
        intensity
      });
    }, [send]),

    setRotation: useCallback((rotation: number) => {
      console.log(`🌍 Setting HDR rotation: ${rotation}°`);
      send({
        type: 'HDR.SET_ROTATION',
        rotation
      });
    }, [send]),

    toggleBackground: useCallback(() => {
      console.log('🌍 Toggling HDR background');
      send({ type: 'HDR.TOGGLE_BACKGROUND' });
    }, [send])
  }), [send]);

  // ====================================
  // CONTRÔLES QUALITÉ
  // ====================================

  const qualityControls = useMemo(() => ({
    setLevel: useCallback((level: QualityLevel) => {
      console.log(`🌍 Setting quality level: ${level}`);
      send({
        type: 'QUALITY.SET_LEVEL',
        level
      });
      onQualityChange?.(level);
    }, [send, onQualityChange]),

    enableAdaptive: useCallback(() => {
      console.log('🌍 Enabling adaptive quality');
      send({ type: 'QUALITY.ENABLE_ADAPTIVE' });
    }, [send]),

    disableAdaptive: useCallback(() => {
      console.log('🌍 Disabling adaptive quality');
      send({ type: 'QUALITY.DISABLE_ADAPTIVE' });
    }, [send]),

    autoAdjust: useCallback((targetFPS: number) => {
      send({
        type: 'QUALITY.AUTO_ADJUST',
        targetFPS
      });
    }, [send])
  }), [send, onQualityChange]);

  // ====================================
  // CONTRÔLES BRIDGE B3
  // ====================================

  const bridgeControls = useMemo(() => ({
    connect: useCallback(() => {
      console.log('🔗 Connecting to B3 Lighting Bridge...');
      send({ type: 'BRIDGE.CONNECT' });
    }, [send]),

    disconnect: useCallback(() => {
      console.log('🔗 Disconnecting B3 Lighting Bridge');
      send({ type: 'BRIDGE.DISCONNECT' });
    }, [send]),

    sync: useCallback((lightingData: any) => {
      send({
        type: 'BRIDGE.SYNC',
        lightingData
      });
    }, [send]),

    updateContribution: useCallback((ambient: number) => {
      send({
        type: 'BRIDGE.UPDATE_CONTRIBUTION',
        ambient
      });
    }, [send])
  }), [send]);

  // ====================================
  // CONTRÔLES CACHE
  // ====================================

  const cacheControls = useMemo(() => ({
    preload: useCallback((paths: string[]) => {
      console.log(`🌍 Preloading ${paths.length} HDR maps...`);
      send({
        type: 'CACHE.PRELOAD',
        paths
      });
    }, [send]),

    clear: useCallback(() => {
      console.log('🧹 Clearing HDR cache');
      send({ type: 'CACHE.CLEAR' });
    }, [send]),

    optimize: useCallback(() => {
      console.log('⚡ Optimizing HDR cache');
      send({ type: 'CACHE.OPTIMIZE' });
    }, [send]),

    setMaxSize: useCallback((maxSize: number) => {
      send({
        type: 'CACHE.SET_SIZE',
        maxSize: maxSize * 1024 * 1024 // MB to bytes
      });
    }, [send])
  }), [send]);

  // ====================================
  // PRESETS ENVIRONMENT
  // ====================================

  const presetControls = useMemo(() => ({
    apply: useCallback((presetName: string) => {
      const preset = ENVIRONMENT_PRESETS[presetName];
      if (!preset) {
        console.warn(`🌍 Unknown preset: ${presetName}`);
        return;
      }

      console.log(`🌍 Applying preset: ${preset.name}`);

      // Charger HDR du preset
      send({
        type: 'HDR.LOAD',
        path: preset.hdrPath,
        config: {
          intensity: preset.intensity,
          rotation: preset.rotation,
          background: preset.background
        }
      });

      // Appliquer qualité
      send({
        type: 'QUALITY.SET_LEVEL',
        level: preset.quality
      });

      // Appliquer contribution lighting
      send({
        type: 'BRIDGE.UPDATE_CONTRIBUTION',
        ambient: preset.lightingContribution
      });
    }, [send]),

    list: useCallback(() => {
      return Object.keys(ENVIRONMENT_PRESETS);
    }, []),

    get: useCallback((presetName: string): EnvironmentPreset | undefined => {
      return ENVIRONMENT_PRESETS[presetName];
    }, [])
  }), [send]);

  // ====================================
  // MONITORING PERFORMANCE
  // ====================================

  const performanceMonitoringRef = useRef<number | null>(null);

  useEffect(() => {
    if (!enablePerformanceMonitoring) {
      return;
    }

    let frameCount = 0;
    let lastTime = performance.now();

    const updatePerformance = () => {
      const now = performance.now();
      frameCount++;

      if (frameCount % 60 === 0) { // Mesure toutes les 60 frames
        const deltaTime = now - lastTime;
        const fps = (60 * 1000) / deltaTime;
        const frameTime = deltaTime / 60;

        send({
          type: 'SYSTEM.UPDATE_PERFORMANCE',
          metrics: {
            renderTime: frameTime,
            memoryPressure: (performance as any).memory?.usedJSHeapSize || 0
          }
        });

        // Auto-ajustement qualité si activé
        if (context.quality.adaptiveEnabled) {
          qualityControls.autoAdjust(fps);
        }

        lastTime = now;
      }

      performanceMonitoringRef.current = requestAnimationFrame(updatePerformance);
    };

    performanceMonitoringRef.current = requestAnimationFrame(updatePerformance);

    return () => {
      if (performanceMonitoringRef.current !== null) {
        cancelAnimationFrame(performanceMonitoringRef.current);
      }
    };
  }, [enablePerformanceMonitoring, send, context.quality.adaptiveEnabled, qualityControls]);

  // ====================================
  // CALLBACKS UTILISATEUR
  // ====================================

  const prevStateRef = useRef<any>(null);

  useEffect(() => {
    if (onStateChange) {
      const currentStateValue = JSON.stringify(state.value);
      const prevStateValue = JSON.stringify(prevStateRef.current?.value);

      if (currentStateValue !== prevStateValue) {
        onStateChange(state);
        prevStateRef.current = state;
      }
    }
  }, [state, onStateChange]);

  useEffect(() => {
    const subscription = service.subscribe({
      error: (error) => {
        console.error('🌍 Environment Error:', error);
        onError?.(error);
      }
    });

    return () => subscription.unsubscribe();
  }, [service, onError]);

  // Callback HDR chargé
  useEffect(() => {
    if (onHDRLoaded && context.systemState.ready && context.hdr.currentMap && context.threeJS.currentEnvironment) {
      onHDRLoaded(context.hdr.currentMap, context.threeJS.currentEnvironment);
    }
  }, [context.systemState.ready, context.hdr.currentMap, context.threeJS.currentEnvironment, onHDRLoaded]);

  // ====================================
  // SYSTEM CONTROLS
  // ====================================

  const systemControls = useMemo(() => ({
    dispose: useCallback(() => {
      console.log('🧹 Disposing B4 Environment system');
      send({ type: 'SYSTEM.DISPOSE' });
    }, [send]),

    getStats: useCallback(() => {
      return {
        cacheSize: context.cache.hdrMaps.size,
        memoryUsage: context.cache.memoryUsage,
        qualityLevel: context.quality.current,
        bridgeConnected: context.lightingBridge.connected,
        isReady: context.systemState.ready,
        isLoading: context.systemState.loading,
        hasError: !!context.systemState.error,
        lastUpdate: context.systemState.lastUpdate
      };
    }, [context])
  }), [send, context]);

  // ====================================
  // RETURN HOOK COMPLET
  // ====================================

  return useMemo(() => ({
    // État et contexte
    state,
    context,
    send,

    // Contrôles HDR
    loadHDR: hdrControls.load,
    unloadHDR: hdrControls.unload,
    setIntensity: hdrControls.setIntensity,
    setRotation: hdrControls.setRotation,
    toggleBackground: hdrControls.toggleBackground,

    // Gestion qualité
    setQualityLevel: qualityControls.setLevel,
    enableAdaptiveQuality: qualityControls.enableAdaptive,
    disableAdaptiveQuality: qualityControls.disableAdaptive,

    // Bridge B3
    connectBridge: bridgeControls.connect,
    disconnectBridge: bridgeControls.disconnect,

    // Presets
    applyPreset: presetControls.apply,

    // Cache
    cache: cacheControls,

    // System
    dispose: systemControls.dispose,
    getStats: systemControls.getStats,

    // État système
    isReady: context.systemState.ready,
    isLoading: context.systemState.loading,
    hasError: !!context.systemState.error,

    // Données contextuelles
    currentHDR: context.hdr.currentMap,
    quality: context.quality.current,
    bridgeConnected: context.lightingBridge.connected,
    cacheStats: {
      size: context.cache.hdrMaps.size,
      memoryUsage: context.cache.memoryUsage,
      hitRate: context.performance.cacheHitRate
    }
  }), [
    state,
    context,
    send,
    hdrControls,
    qualityControls,
    bridgeControls,
    presetControls,
    cacheControls,
    systemControls
  ]);
};

export default useEnvironment;