// 🎯 Types XState pour FrameSchedulerMachine - Atome D1
// Définitions TypeScript complètes pour le premier atome de la refactorisation

export interface FrameSchedulerContext {
  // 🕰️ Timing et Performance
  deltaTime: number;
  lastFrameTime: number;
  currentTime: number;

  // 📊 Métriques de Performance
  performance: {
    fps: number;
    averageFPS: number;
    frameCount: number;
    lastFPSUpdate: number;
    frameTimes: number[];
    maxFrameTime: number;
    minFrameTime: number;
  };

  // 🎯 Systèmes à Mettre à Jour
  systems: {
    animation: boolean;
    physics: boolean;
    particles: boolean;
    lighting: boolean;
    effects: boolean;
    render: boolean;
    eyeRotation: boolean;
    environment: boolean;
  };

  // ⚙️ Configuration
  config: {
    targetFPS: number;
    enablePerformanceMonitoring: boolean;
    maxFrameTimeHistory: number;
    performanceUpdateInterval: number;
    adaptiveFrameRate: boolean;
  };

  // 🚨 Gestion d'Erreur
  error: {
    hasError: boolean;
    errorType: string | null;
    errorMessage: string | null;
    errorCount: number;
    lastErrorTime: number;
    recoveryAttempts: number;
    maxRecoveryAttempts: number;
  };

  // 🔄 État de Récupération
  recovery: {
    isRecovering: boolean;
    recoveryStartTime: number;
    recoveryProgress: number;
    backupPerformance: any;
  };

  // 🎮 Contrôles
  controls: {
    isPaused: boolean;
    debugMode: boolean;
    stepMode: boolean;
    frameStep: boolean;
  };
}

export type FrameSchedulerEvent =
  | { type: 'START_LOOP' }
  | { type: 'STOP_LOOP' }
  | { type: 'PAUSE_LOOP' }
  | { type: 'RESUME_LOOP' }
  | { type: 'FRAME_TICK'; deltaTime: number; timestamp: number }
  | { type: 'UPDATE_SYSTEMS'; systems: string[] }
  | { type: 'PERFORMANCE_UPDATE'; metrics: any }
  | { type: 'ERROR_OCCURRED'; error: { type: string; message: string; timestamp: number } }
  | { type: 'RECOVERY_STARTED' }
  | { type: 'RECOVERY_PROGRESS'; progress: number }
  | { type: 'RECOVERY_COMPLETED' }
  | { type: 'RECOVERY_FAILED' }
  | { type: 'TOGGLE_DEBUG_MODE' }
  | { type: 'ENABLE_STEP_MODE' }
  | { type: 'DISABLE_STEP_MODE' }
  | { type: 'STEP_FRAME' }
  | { type: 'UPDATE_CONFIG'; config: Partial<FrameSchedulerContext['config']> }
  | { type: 'RESET_PERFORMANCE_METRICS' }
  | { type: 'WEBGL_CONTEXT_LOST' }
  | { type: 'WEBGL_CONTEXT_RESTORED' };

export interface FrameSchedulerServices {
  frameLoopService: {
    data: void;
    events: FrameSchedulerEvent;
  };

  performanceMonitorService: {
    data: void;
    events: FrameSchedulerEvent;
  };

  recoveryService: {
    data: { success: boolean; recoveredSystems: string[] };
    events: FrameSchedulerEvent;
  };

  contextRecoveryService: {
    data: { success: boolean; context: any };
    events: FrameSchedulerEvent;
  };
}

export interface FrameSchedulerActions {
  // 📊 Actions de Mise à Jour
  updateDeltaTime: (deltaTime: number, timestamp: number) => void;
  updatePerformanceMetrics: (deltaTime: number) => void;
  updateAllSystems: (deltaTime: number) => void;

  // 🎯 Actions Systèmes Spécifiques
  updateAnimationSystems: (deltaTime: number) => void;
  updatePhysicsSystems: (deltaTime: number) => void;
  updateParticleSystems: (deltaTime: number) => void;
  updateLightingSystems: (deltaTime: number) => void;
  updateEffectsSystems: (deltaTime: number) => void;
  updateRenderSystems: (deltaTime: number) => void;

  // 🔧 Actions de Configuration
  initializeClock: () => void;
  resetPerformanceMetrics: () => void;
  toggleDebugMode: () => void;
  enableStepMode: () => void;
  disableStepMode: () => void;

  // 🚨 Actions d'Erreur et Récupération
  logError: (error: any) => void;
  startRecovery: () => void;
  updateRecoveryProgress: (progress: number) => void;
  completeRecovery: () => void;
  failRecovery: () => void;

  // 🎮 Actions WebGL
  handleContextLost: () => void;
  handleContextRestored: () => void;

  // 📈 Actions Monitoring
  sendTelemetry: (data: any) => void;
  updateAdaptiveFrameRate: () => void;
}

export interface FrameSchedulerGuards {
  // 🔍 Guards de Validation
  canStartLoop: (context: FrameSchedulerContext) => boolean;
  canRecover: (context: FrameSchedulerContext) => boolean;
  shouldAdaptFrameRate: (context: FrameSchedulerContext) => boolean;
  isPerformanceLow: (context: FrameSchedulerContext) => boolean;
  hasReachedMaxRecoveryAttempts: (context: FrameSchedulerContext) => boolean;

  // ⚡ Guards de Performance
  isFrameRateStable: (context: FrameSchedulerContext) => boolean;
  isFrameTimeAcceptable: (context: FrameSchedulerContext, event: any) => boolean;

  // 🎮 Guards de Contrôle
  isDebugModeEnabled: (context: FrameSchedulerContext) => boolean;
  isStepModeEnabled: (context: FrameSchedulerContext) => boolean;
  isPaused: (context: FrameSchedulerContext) => boolean;
}

// 📊 Interface pour les Métriques de Performance
export interface PerformanceMetrics {
  fps: number;
  averageFPS: number;
  frameTime: number;
  averageFrameTime: number;
  maxFrameTime: number;
  minFrameTime: number;
  frameCount: number;
  droppedFrames: number;
  memoryUsage?: {
    used: number;
    total: number;
    geometries: number;
    textures: number;
  };
}

// 🎯 Interface pour les Systèmes
export interface SystemUpdateInfo {
  name: string;
  enabled: boolean;
  lastUpdateTime: number;
  updateDuration: number;
  updateCount: number;
  hasError: boolean;
  errorMessage?: string;
}

// 🔄 Interface pour la Récupération
export interface RecoveryInfo {
  startTime: number;
  endTime?: number;
  success: boolean;
  recoveredSystems: string[];
  failedSystems: string[];
  errorDetails: any[];
}

// ⚙️ Configuration par Défaut
export const defaultFrameSchedulerConfig = {
  targetFPS: 60,
  enablePerformanceMonitoring: true,
  maxFrameTimeHistory: 60,
  performanceUpdateInterval: 1000,
  adaptiveFrameRate: true,
} as const;

// 📊 Métriques par Défaut
export const defaultPerformanceMetrics = {
  fps: 0,
  averageFPS: 0,
  frameCount: 0,
  lastFPSUpdate: 0,
  frameTimes: [] as number[],
  maxFrameTime: 0,
  minFrameTime: Infinity,
};

// 🚨 Erreur par Défaut
export const defaultErrorState = {
  hasError: false,
  errorType: null,
  errorMessage: null,
  errorCount: 0,
  lastErrorTime: 0,
  recoveryAttempts: 0,
  maxRecoveryAttempts: 3,
} as const;