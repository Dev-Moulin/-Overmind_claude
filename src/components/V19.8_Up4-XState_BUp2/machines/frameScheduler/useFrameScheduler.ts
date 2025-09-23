// 🎯 Hook React pour FrameSchedulerMachine - Atome D1
// Hook d'intégration React avec monitoring et contrôles

import { useEffect, useRef, useCallback } from 'react';
import { useMachine } from '@xstate/react';
import { frameSchedulerMachine } from './machine';
import type { FrameSchedulerContext, PerformanceMetrics } from './types';

// 🎯 Interface du Hook
export interface UseFrameSchedulerReturn {
  // 📊 État et Métriques
  state: any;
  context: FrameSchedulerContext;
  isRunning: boolean;
  isPaused: boolean;
  isRecovering: boolean;
  hasError: boolean;
  performance: PerformanceMetrics;

  // 🎮 Contrôles
  start: () => void;
  stop: () => void;
  pause: () => void;
  resume: () => void;
  toggleDebugMode: () => void;
  enableStepMode: () => void;
  disableStepMode: () => void;
  stepFrame: () => void;
  resetMetrics: () => void;

  // ⚙️ Configuration
  updateConfig: (config: Partial<FrameSchedulerContext['config']>) => void;

  // 📊 Helpers
  getStateDescription: () => string;
  getPerformanceStatus: () => 'good' | 'warning' | 'critical';
  getSystemsStatus: () => Record<string, boolean>;
}

// 🎯 Hook Principal
export const useFrameScheduler = (
  autoStart: boolean = true,
  debugEnabled: boolean = false
): UseFrameSchedulerReturn => {
  const [state, send] = useMachine(frameSchedulerMachine, {
    devTools: debugEnabled || process.env.NODE_ENV === 'development'
  });

  const isInitialized = useRef(false);

  // 🚀 Auto-start si demandé
  useEffect(() => {
    if (autoStart && !isInitialized.current) {
      isInitialized.current = true;
      console.log('🚀 FrameScheduler: Auto-starting...');
      send({ type: 'START_LOOP' });
    }
  }, [autoStart, send]);

  // 🧹 Cleanup au démontage
  useEffect(() => {
    return () => {
      console.log('🧹 FrameScheduler: Cleaning up...');
      send({ type: 'STOP_LOOP' });
    };
  }, [send]);

  // 🎮 Contrôles
  const start = useCallback(() => {
    console.log('🚀 Starting frame scheduler');
    send({ type: 'START_LOOP' });
  }, [send]);

  const stop = useCallback(() => {
    console.log('🛑 Stopping frame scheduler');
    send({ type: 'STOP_LOOP' });
  }, [send]);

  const pause = useCallback(() => {
    console.log('⏸️ Pausing frame scheduler');
    send({ type: 'PAUSE_LOOP' });
  }, [send]);

  const resume = useCallback(() => {
    console.log('▶️ Resuming frame scheduler');
    send({ type: 'RESUME_LOOP' });
  }, [send]);

  const toggleDebugMode = useCallback(() => {
    console.log('🐛 Toggling debug mode');
    send({ type: 'TOGGLE_DEBUG_MODE' });
  }, [send]);

  const enableStepMode = useCallback(() => {
    console.log('👣 Enabling step mode');
    send({ type: 'ENABLE_STEP_MODE' });
  }, [send]);

  const disableStepMode = useCallback(() => {
    console.log('🏃 Disabling step mode');
    send({ type: 'DISABLE_STEP_MODE' });
  }, [send]);

  const stepFrame = useCallback(() => {
    console.log('👣 Stepping frame');
    send({ type: 'STEP_FRAME' });
  }, [send]);

  const resetMetrics = useCallback(() => {
    console.log('📊 Resetting performance metrics');
    send({ type: 'RESET_PERFORMANCE_METRICS' });
  }, [send]);

  // ⚙️ Configuration
  const updateConfig = useCallback((config: Partial<FrameSchedulerContext['config']>) => {
    console.log('⚙️ Updating configuration:', config);
    send({ type: 'UPDATE_CONFIG', config });
  }, [send]);

  // 📊 Helpers
  const getStateDescription = useCallback((): string => {
    const stateValue = state.value;

    if (typeof stateValue === 'string') {
      return stateValue;
    }

    if (typeof stateValue === 'object') {
      // État parallèle
      const mainState = Object.keys(stateValue)[0];
      const subStates = Object.values(stateValue).join(', ');
      return `${mainState} (${subStates})`;
    }

    return 'unknown';
  }, [state.value]);

  const getPerformanceStatus = useCallback((): 'good' | 'warning' | 'critical' => {
    const { performance } = state.context;
    const targetFPS = state.context.config.targetFPS;

    if (performance.averageFPS >= targetFPS * 0.9) {
      return 'good';
    } else if (performance.averageFPS >= targetFPS * 0.7) {
      return 'warning';
    } else {
      return 'critical';
    }
  }, [state.context]);

  const getSystemsStatus = useCallback((): Record<string, boolean> => {
    return state.context.systems;
  }, [state.context.systems]);

  // 📊 État Computed
  const isRunning = state.matches('running') || state.matches('debugging');
  const isPaused = state.matches('paused') || state.context.controls.isPaused;
  const isRecovering = state.matches('recovering') || state.context.recovery.isRecovering;
  const hasError = state.matches('error') || state.context.error.hasError;

  return {
    // 📊 État et Métriques
    state,
    context: state.context,
    isRunning,
    isPaused,
    isRecovering,
    hasError,
    performance: {
      ...state.context.performance,
      frameTime: state.context.performance.maxFrameTime,
      averageFrameTime: state.context.performance.frameTimes.length > 0
        ? state.context.performance.frameTimes.reduce((a: number, b: number) => a + b, 0) / state.context.performance.frameTimes.length
        : 0,
      droppedFrames: 0
    },

    // 🎮 Contrôles
    start,
    stop,
    pause,
    resume,
    toggleDebugMode,
    enableStepMode,
    disableStepMode,
    stepFrame,
    resetMetrics,

    // ⚙️ Configuration
    updateConfig,

    // 📊 Helpers
    getStateDescription,
    getPerformanceStatus,
    getSystemsStatus
  };
};

// 🎯 Hook Lightweight pour Métriques Seules
export const useFrameSchedulerMetrics = () => {
  const { performance, getPerformanceStatus, isRunning } = useFrameScheduler(false);

  return {
    fps: performance.fps,
    averageFPS: performance.averageFPS,
    frameCount: performance.frameCount,
    maxFrameTime: performance.maxFrameTime,
    minFrameTime: performance.minFrameTime,
    status: getPerformanceStatus(),
    isRunning
  };
};

// 🎯 Hook pour Contrôles Simples
export const useFrameSchedulerControls = () => {
  const {
    isRunning,
    isPaused,
    start,
    stop,
    pause,
    resume,
    toggleDebugMode
  } = useFrameScheduler(false);

  return {
    isRunning,
    isPaused,
    start,
    stop,
    pause,
    resume,
    toggleDebugMode
  };
};

// 🎯 Hook pour Debug/Dev
export const useFrameSchedulerDebug = () => {
  const {
    state,
    context,
    isRunning,
    isRecovering,
    hasError,
    enableStepMode,
    disableStepMode,
    stepFrame,
    resetMetrics,
    getStateDescription,
    getSystemsStatus
  } = useFrameScheduler(false, true);

  return {
    // 📊 Debug Info
    currentState: getStateDescription(),
    stateValue: state.value,
    context,
    isRunning,
    isRecovering,
    hasError,
    errorDetails: context.error,
    recoveryInfo: context.recovery,
    systemsStatus: getSystemsStatus(),

    // 🎮 Debug Controls
    enableStepMode,
    disableStepMode,
    stepFrame,
    resetMetrics,

    // 📊 State Machine Info
    canTransition: (event: string) => state.can(event),
    nextEvents: state.nextEvents,
    hasTag: (tag: string) => state.hasTag && state.hasTag(tag)
  };
};

export default useFrameScheduler;