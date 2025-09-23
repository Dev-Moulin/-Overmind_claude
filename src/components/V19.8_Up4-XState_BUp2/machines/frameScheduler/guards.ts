// 🔍 Guards XState pour FrameSchedulerMachine - Atome D1
// Guards de validation et de contrôle d'état pour le FrameScheduler

import { FrameSchedulerContext, FrameSchedulerEvent } from './types';

// 🚀 Guards de Démarrage et Contrôle
export const canStartLoop = (context: FrameSchedulerContext): boolean => {
  // ✅ Vérifications des prérequis pour démarrer la boucle
  const hasValidConfig = context.config.targetFPS > 0;
  const noActiveCriticalError = !context.error.hasError || context.error.errorType !== 'CRITICAL';
  const notCurrentlyRecovering = !context.recovery.isRecovering;

  const canStart = hasValidConfig && noActiveCriticalError && notCurrentlyRecovering;

  if (!canStart) {
    console.warn('🚫 Cannot start loop:', {
      hasValidConfig,
      noActiveCriticalError,
      notCurrentlyRecovering
    });
  }

  return canStart;
};

export const canRecover = (context: FrameSchedulerContext): boolean => {
  // ✅ Vérifications pour autoriser une tentative de récupération
  const hasError = context.error.hasError;
  const belowMaxAttempts = context.error.recoveryAttempts < context.error.maxRecoveryAttempts;
  const notAlreadyRecovering = !context.recovery.isRecovering;
  const timeSinceLastError = performance.now() - context.error.lastErrorTime;
  const cooldownPeriod = 1000; // 1 seconde de cooldown minimum

  const canAttemptRecovery = hasError &&
                            belowMaxAttempts &&
                            notAlreadyRecovering &&
                            timeSinceLastError > cooldownPeriod;

  if (!canAttemptRecovery) {
    console.warn('🚫 Cannot recover:', {
      hasError,
      belowMaxAttempts,
      notAlreadyRecovering,
      timeSinceLastError,
      cooldownPeriod
    });
  }

  return canAttemptRecovery;
};

export const hasReachedMaxRecoveryAttempts = (context: FrameSchedulerContext): boolean => {
  const reachedMax = context.error.recoveryAttempts >= context.error.maxRecoveryAttempts;

  if (reachedMax) {
    console.error('🚨 Maximum recovery attempts reached:', context.error.recoveryAttempts);
  }

  return reachedMax;
};

// ⚡ Guards de Performance
export const shouldAdaptFrameRate = (context: FrameSchedulerContext): boolean => {
  if (!context.config.adaptiveFrameRate) return false;

  const avgFPS = context.performance.averageFPS;
  const targetFPS = context.config.targetFPS;
  const frameCount = context.performance.frameCount;

  // 📊 Besoin d'au moins 60 frames pour une mesure fiable
  const hasEnoughSamples = frameCount >= 60;

  // 📈 Différence significative (± 15% du target)
  const performanceDeviation = Math.abs(avgFPS - targetFPS) / targetFPS;
  const significantDeviation = performanceDeviation > 0.15;

  const shouldAdapt = hasEnoughSamples && significantDeviation;

  if (shouldAdapt) {
    console.log('📊 Frame rate adaptation needed:', {
      avgFPS,
      targetFPS,
      deviation: `${(performanceDeviation * 100).toFixed(1)}%`
    });
  }

  return shouldAdapt;
};

export const isPerformanceLow = (context: FrameSchedulerContext): boolean => {
  const avgFPS = context.performance.averageFPS;
  const targetFPS = context.config.targetFPS;
  const maxFrameTime = context.performance.maxFrameTime;

  // 📉 Performance faible si:
  // - FPS moyen < 80% du target
  // - Frame time max > 33ms (équivalent à ~30 FPS)
  const lowFPS = avgFPS < targetFPS * 0.8;
  const highFrameTime = maxFrameTime > 33.33;

  const isLow = lowFPS || highFrameTime;

  if (isLow) {
    console.warn('📉 Low performance detected:', {
      avgFPS,
      targetFPS,
      maxFrameTime
    });
  }

  return isLow;
};

export const isFrameRateStable = (context: FrameSchedulerContext): boolean => {
  const frameTimes = context.performance.frameTimes;

  if (frameTimes.length < 10) return false; // Pas assez de données

  // 📊 Calcul de la variance des frame times
  const mean = frameTimes.reduce((a, b) => a + b, 0) / frameTimes.length;
  const variance = frameTimes.reduce((sum, frameTime) => {
    return sum + Math.pow(frameTime - mean, 2);
  }, 0) / frameTimes.length;

  const standardDeviation = Math.sqrt(variance);
  const coefficientOfVariation = standardDeviation / mean;

  // 📏 Frame rate stable si coefficient de variation < 20%
  const isStable = coefficientOfVariation < 0.2;

  if (!isStable) {
    console.warn('📊 Unstable frame rate:', {
      mean: mean.toFixed(2),
      standardDeviation: standardDeviation.toFixed(2),
      coefficientOfVariation: (coefficientOfVariation * 100).toFixed(1) + '%'
    });
  }

  return isStable;
};

export const isFrameTimeAcceptable = (context: FrameSchedulerContext, event: any): boolean => {
  if (event.type !== 'FRAME_TICK') return true;

  const frameTime = event.deltaTime * 1000; // Conversion en ms
  const targetFrameTime = 1000 / context.config.targetFPS;
  const maxAcceptableFrameTime = targetFrameTime * 2; // Double du target = seuil critique

  const isAcceptable = frameTime <= maxAcceptableFrameTime;

  if (!isAcceptable) {
    console.warn('⚠️ Unacceptable frame time:', {
      frameTime: frameTime.toFixed(2) + 'ms',
      target: targetFrameTime.toFixed(2) + 'ms',
      threshold: maxAcceptableFrameTime.toFixed(2) + 'ms'
    });
  }

  return isAcceptable;
};

// 🎮 Guards de Contrôle
export const isDebugModeEnabled = (context: FrameSchedulerContext): boolean => {
  return context.controls.debugMode;
};

export const isStepModeEnabled = (context: FrameSchedulerContext): boolean => {
  return context.controls.stepMode;
};

export const isPaused = (context: FrameSchedulerContext): boolean => {
  return context.controls.isPaused;
};

export const canStepFrame = (context: FrameSchedulerContext): boolean => {
  return context.controls.stepMode && context.controls.isPaused;
};

// 🌐 Guards WebGL
export const hasWebGLContext = (): boolean => {
  try {
    const renderer = (window as any).renderer;
    const context = renderer?.getContext();

    const hasContext = !!(renderer && context && !context.isContextLost());

    if (!hasContext) {
      console.warn('🎮 WebGL context not available or lost');
    }

    return hasContext;
  } catch (error) {
    console.error('❌ Error checking WebGL context:', error);
    return false;
  }
};

export const isWebGLContextLost = (): boolean => {
  try {
    const renderer = (window as any).renderer;
    const context = renderer?.getContext();

    return !!(context && context.isContextLost());
  } catch (error) {
    return false;
  }
};

// 🔧 Guards de Configuration
export const hasValidConfiguration = (context: FrameSchedulerContext): boolean => {
  const config = context.config;

  const validTargetFPS = config.targetFPS > 0 && config.targetFPS <= 120;
  const validUpdateInterval = config.performanceUpdateInterval > 0;
  const validFrameHistory = config.maxFrameTimeHistory > 0;

  const isValid = validTargetFPS && validUpdateInterval && validFrameHistory;

  if (!isValid) {
    console.error('❌ Invalid configuration:', {
      targetFPS: config.targetFPS,
      updateInterval: config.performanceUpdateInterval,
      frameHistory: config.maxFrameTimeHistory
    });
  }

  return isValid;
};

// 📊 Guards de Système
export const hasActiveSystemsEnabled = (context: FrameSchedulerContext): boolean => {
  const systems = context.systems;
  const activeSystems = Object.values(systems).filter(Boolean);

  const hasActive = activeSystems.length > 0;

  if (!hasActive) {
    console.warn('⚠️ No active systems enabled');
  }

  return hasActive;
};

export const areSystemsResponsive = (): boolean => {
  try {
    // 🔍 Vérification rapide de la responsivité des systèmes
    const checks = [
      { name: 'animationController', ref: (window as any).animationControllerRef?.current },
      { name: 'eyeRotation', ref: (window as any).eyeRotationRef?.current },
      { name: 'particleSystem', ref: (window as any).particleSystemRef?.current }
    ];

    const responsiveCount = checks.filter(check => {
      if (!check.ref) return true; // Considéré comme OK si non initialisé

      // Test basique de responsivité
      try {
        return typeof check.ref === 'object' && check.ref !== null;
      } catch (error) {
        console.warn(`System ${check.name} not responsive:`, error);
        return false;
      }
    }).length;

    const allResponsive = responsiveCount === checks.length;

    if (!allResponsive) {
      console.warn(`⚠️ ${checks.length - responsiveCount} systems not responsive`);
    }

    return allResponsive;
  } catch (error) {
    console.error('❌ Error checking system responsiveness:', error);
    return false;
  }
};

// 🚨 Guards d'Erreur
export const isCriticalError = (context: FrameSchedulerContext, event: any): boolean => {
  if (event.type !== 'ERROR_OCCURRED') return false;

  const criticalErrorTypes = [
    'WEBGL_CONTEXT_LOST',
    'MEMORY_EXHAUSTED',
    'SYSTEM_FAILURE',
    'CRITICAL_PERFORMANCE_DEGRADATION'
  ];

  const isCritical = criticalErrorTypes.includes(event.error.type);

  if (isCritical) {
    console.error('🚨 Critical error detected:', event.error);
  }

  return isCritical;
};

export const isRecoverableError = (context: FrameSchedulerContext, event: any): boolean => {
  if (event.type !== 'ERROR_OCCURRED') return false;

  const recoverableErrorTypes = [
    'FRAME_TIMEOUT',
    'SYSTEM_UPDATE_ERROR',
    'PERFORMANCE_DEGRADATION',
    'TEMPORARY_RESOURCE_UNAVAILABLE'
  ];

  return recoverableErrorTypes.includes(event.error.type);
};

// 🔄 Guards de Récupération
export const isRecoveryInProgress = (context: FrameSchedulerContext): boolean => {
  return context.recovery.isRecovering;
};

export const isRecoveryComplete = (context: FrameSchedulerContext): boolean => {
  return context.recovery.recoveryProgress >= 1;
};

export const hasRecoveryTimedOut = (context: FrameSchedulerContext): boolean => {
  if (!context.recovery.isRecovering) return false;

  const recoveryDuration = performance.now() - context.recovery.recoveryStartTime;
  const maxRecoveryTime = 5000; // 5 secondes maximum

  const timedOut = recoveryDuration > maxRecoveryTime;

  if (timedOut) {
    console.error('⏰ Recovery timed out after', recoveryDuration, 'ms');
  }

  return timedOut;
};