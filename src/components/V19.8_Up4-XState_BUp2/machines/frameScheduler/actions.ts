// 🎯 Actions XState pour FrameSchedulerMachine - Atome D1
// Actions de gestion des états et des transitions du FrameScheduler

import { assign } from 'xstate';
import { FrameSchedulerContext, FrameSchedulerEvent, PerformanceMetrics } from './types';
import { systemUpdateService } from './services';

// 🚀 Actions d'Initialisation
export const initializeClock = assign<FrameSchedulerContext>({
  deltaTime: 0,
  lastFrameTime: () => performance.now(),
  currentTime: () => performance.now(),
  performance: (context) => ({
    ...context.performance,
    frameCount: 0,
    frameTimes: [],
    lastFPSUpdate: performance.now()
  }),
  error: (context) => ({
    ...context.error,
    hasError: false,
    errorType: null,
    errorMessage: null
  })
});

// ⏱️ Actions de Mise à Jour du Timing
export const updateDeltaTime = assign<FrameSchedulerContext, any>({
  deltaTime: (context, event) => event.deltaTime,
  lastFrameTime: (context) => context.currentTime,
  currentTime: (context, event) => event.timestamp,
  performance: (context) => ({
    ...context.performance,
    frameCount: context.performance.frameCount + 1
  })
});

// 📊 Actions de Mise à Jour des Métriques
export const updatePerformanceMetrics = assign<FrameSchedulerContext, any>({
  performance: (context, event) => {
    if (event.type === 'PERFORMANCE_UPDATE' && event.metrics) {
      const { metrics } = event;

      // 📈 Calcul de la moyenne FPS sur plusieurs mesures
      const fpsHistory = [...context.performance.frameTimes.slice(-10), metrics.fps];
      const averageFPS = fpsHistory.reduce((a, b) => a + b, 0) / fpsHistory.length;

      return {
        ...context.performance,
        fps: metrics.fps,
        averageFPS: Math.round(averageFPS),
        frameCount: metrics.frameCount,
        lastFPSUpdate: performance.now(),
        frameTimes: fpsHistory,
        maxFrameTime: Math.max(context.performance.maxFrameTime, metrics.maxFrameTime),
        minFrameTime: Math.min(context.performance.minFrameTime, metrics.minFrameTime)
      };
    }
    return context.performance;
  }
});

// 🎯 Action de Mise à Jour de Tous les Systèmes
export const updateAllSystems = (context: FrameSchedulerContext, event: any) => {
  if (event.type === 'FRAME_TICK') {
    const { updateSystems } = systemUpdateService(context);

    try {
      updateSystems(event.deltaTime);

      // 📡 Télémétrie de succès
      if ((window as any).__frameSchedulerTelemetry) {
        (window as any).__frameSchedulerTelemetry({
          type: 'systems_updated',
          deltaTime: event.deltaTime,
          timestamp: event.timestamp,
          enabledSystems: Object.keys(context.systems).filter(key => context.systems[key])
        });
      }
    } catch (error) {
      console.error('❌ FrameScheduler: Error updating systems:', error);

      // 🚨 Génération d'un événement d'erreur
      const errorEvent = {
        type: 'ERROR_OCCURRED',
        error: {
          type: 'SYSTEM_UPDATE_ERROR',
          message: error.message,
          timestamp: performance.now()
        }
      };

      // Note: Dans un vrai contexte XState, on utiliserait sendParent ou un autre mécanisme
      console.warn('Would send error event:', errorEvent);
    }
  }
};

// 🎬 Actions Spécifiques par Système
export const updateAnimationSystems = (context: FrameSchedulerContext, event: any) => {
  if (context.systems.animation && (window as any).animationControllerRef?.current) {
    try {
      (window as any).animationControllerRef.current.update(event.deltaTime);
    } catch (error) {
      console.error('❌ Animation system error:', error);
    }
  }
};

export const updatePhysicsSystems = (context: FrameSchedulerContext, _event: any) => {
  if (context.systems.physics) {
    try {
      // Mise à jour des systèmes physiques
      // À implémenter selon les besoins spécifiques
    } catch (error) {
      console.error('❌ Physics system error:', error);
    }
  }
};

export const updateParticleSystems = (context: FrameSchedulerContext, event: any) => {
  if (context.systems.particles && (window as any).particleSystemRef?.current) {
    try {
      (window as any).particleSystemRef.current.update(event.deltaTime);
    } catch (error) {
      console.error('❌ Particle system error:', error);
    }
  }
};

export const updateLightingSystems = (context: FrameSchedulerContext, _event: any) => {
  if (context.systems.lighting && (window as any).pbrLightingController) {
    try {
      // Mise à jour des systèmes d'éclairage
      // À implémenter selon les besoins spécifiques
    } catch (error) {
      console.error('❌ Lighting system error:', error);
    }
  }
};

export const updateEffectsSystems = (context: FrameSchedulerContext, _event: any) => {
  if (context.systems.effects && (window as any).bloomSystem) {
    try {
      // Mise à jour des systèmes d'effets
      // À implémenter selon les besoins spécifiques
    } catch (error) {
      console.error('❌ Effects system error:', error);
    }
  }
};

export const updateRenderSystems = (context: FrameSchedulerContext, _event: any) => {
  if (context.systems.render && (window as any).renderer) {
    try {
      // Le rendu principal est généralement géré par React Three Fiber
      // Ici on peut ajouter des post-processings ou des optimisations
    } catch (error) {
      console.error('❌ Render system error:', error);
    }
  }
};

// 🔧 Actions de Configuration
export const resetPerformanceMetrics = assign<FrameSchedulerContext>({
  performance: (context) => ({
    fps: 0,
    averageFPS: 0,
    frameCount: 0,
    lastFPSUpdate: performance.now(),
    frameTimes: [],
    maxFrameTime: 0,
    minFrameTime: Infinity
  })
});

export const toggleDebugMode = assign<FrameSchedulerContext>({
  controls: (context) => ({
    ...context.controls,
    debugMode: !context.controls.debugMode
  })
});

export const enableStepMode = assign<FrameSchedulerContext>({
  controls: (context) => ({
    ...context.controls,
    stepMode: true,
    isPaused: true
  })
});

export const disableStepMode = assign<FrameSchedulerContext>({
  controls: (context) => ({
    ...context.controls,
    stepMode: false,
    frameStep: false
  })
});

// 🚨 Actions de Gestion d'Erreur
export const logError = assign<FrameSchedulerContext, any>({
  error: (context, event) => {
    if (event.type === 'ERROR_OCCURRED') {
      console.error('🚨 FrameScheduler Error:', event.error);

      return {
        ...context.error,
        hasError: true,
        errorType: event.error.type,
        errorMessage: event.error.message,
        errorCount: context.error.errorCount + 1,
        lastErrorTime: event.error.timestamp
      };
    }
    return context.error;
  }
});

export const startRecovery = assign<FrameSchedulerContext>({
  recovery: (context) => ({
    ...context.recovery,
    isRecovering: true,
    recoveryStartTime: performance.now(),
    recoveryProgress: 0
  }),
  error: (context) => ({
    ...context.error,
    recoveryAttempts: context.error.recoveryAttempts + 1
  })
});

export const updateRecoveryProgress = assign<FrameSchedulerContext, any>({
  recovery: (context, event) => ({
    ...context.recovery,
    recoveryProgress: event.progress || 0
  })
});

export const completeRecovery = assign<FrameSchedulerContext>({
  recovery: (context) => ({
    ...context.recovery,
    isRecovering: false,
    recoveryProgress: 1
  }),
  error: (context) => ({
    ...context.error,
    hasError: false,
    errorType: null,
    errorMessage: null
  })
});

export const failRecovery = assign<FrameSchedulerContext>({
  recovery: (context) => ({
    ...context.recovery,
    isRecovering: false,
    recoveryProgress: 0
  }),
  error: (context) => ({
    ...context.error,
    hasError: true,
    errorType: 'RECOVERY_FAILED',
    errorMessage: 'Recovery process failed after maximum attempts'
  })
});

// 🎮 Actions WebGL
export const handleContextLost = assign<FrameSchedulerContext>({
  error: (context) => ({
    ...context.error,
    hasError: true,
    errorType: 'WEBGL_CONTEXT_LOST',
    errorMessage: 'WebGL context has been lost',
    lastErrorTime: performance.now()
  }),
  controls: (context) => ({
    ...context.controls,
    isPaused: true
  })
});

export const handleContextRestored = assign<FrameSchedulerContext>({
  error: (context) => ({
    ...context.error,
    hasError: false,
    errorType: null,
    errorMessage: null
  }),
  controls: (context) => ({
    ...context.controls,
    isPaused: false
  })
});

// 📡 Actions de Télémétrie
export const sendTelemetry = (context: FrameSchedulerContext, event: any) => {
  if ((window as any).__frameSchedulerTelemetry) {
    (window as any).__frameSchedulerTelemetry({
      type: 'frame_scheduler_event',
      eventType: event.type,
      context: {
        fps: context.performance.fps,
        averageFPS: context.performance.averageFPS,
        frameCount: context.performance.frameCount,
        hasError: context.error.hasError,
        isRecovering: context.recovery.isRecovering,
        debugMode: context.controls.debugMode
      },
      timestamp: performance.now()
    });
  }
};

// 📈 Actions de Frame Rate Adaptatif
export const updateAdaptiveFrameRate = assign<FrameSchedulerContext>({
  config: (context) => {
    if (!context.config.adaptiveFrameRate) return context.config;

    // 📊 Analyse des performances
    const avgFPS = context.performance.averageFPS;
    const targetFPS = context.config.targetFPS;

    let newTargetFPS = targetFPS;

    // 📉 Si les performances sont faibles, réduire le target FPS
    if (avgFPS < targetFPS * 0.8) {
      newTargetFPS = Math.max(30, targetFPS - 10);
      console.log(`📉 Adaptive frame rate: Reducing target from ${targetFPS} to ${newTargetFPS} FPS`);
    }
    // 📈 Si les performances sont bonnes, augmenter le target FPS
    else if (avgFPS > targetFPS * 1.1 && targetFPS < 60) {
      newTargetFPS = Math.min(60, targetFPS + 5);
      console.log(`📈 Adaptive frame rate: Increasing target from ${targetFPS} to ${newTargetFPS} FPS`);
    }

    return {
      ...context.config,
      targetFPS: newTargetFPS
    };
  }
});

// 🎮 Actions de Contrôle
export const pauseLoop = assign<FrameSchedulerContext>({
  controls: (context) => ({
    ...context.controls,
    isPaused: true
  })
});

export const resumeLoop = assign<FrameSchedulerContext>({
  controls: (context) => ({
    ...context.controls,
    isPaused: false
  })
});

export const stepFrame = assign<FrameSchedulerContext>({
  controls: (context) => ({
    ...context.controls,
    frameStep: true
  })
});

// 📊 Action de Mise à Jour de Configuration
export const updateConfig = assign<FrameSchedulerContext, any>({
  config: (context, event) => {
    if (event.type === 'UPDATE_CONFIG') {
      return {
        ...context.config,
        ...event.config
      };
    }
    return context.config;
  }
});