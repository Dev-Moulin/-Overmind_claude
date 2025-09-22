// 🎯 FrameSchedulerMachine - Point d'Entrée Principal
// Export centralisé pour le premier atome de la refactorisation XState

export { frameSchedulerMachine as default } from './machine';
export { frameSchedulerMachine } from './machine';

// Types
export type {
  FrameSchedulerContext,
  FrameSchedulerEvent,
  FrameSchedulerServices,
  FrameSchedulerActions,
  FrameSchedulerGuards,
  PerformanceMetrics,
  SystemUpdateInfo,
  RecoveryInfo
} from './types';

export {
  defaultFrameSchedulerConfig,
  defaultPerformanceMetrics,
  defaultErrorState
} from './types';

// Services
export {
  frameLoopService,
  performanceMonitorService,
  recoveryService,
  contextRecoveryService,
  telemetryService,
  systemUpdateService
} from './services';

// Actions
export {
  initializeClock,
  updateDeltaTime,
  updatePerformanceMetrics,
  updateAllSystems,
  resetPerformanceMetrics,
  toggleDebugMode,
  enableStepMode,
  disableStepMode,
  logError,
  startRecovery,
  completeRecovery,
  handleContextLost,
  handleContextRestored,
  sendTelemetry,
  updateAdaptiveFrameRate
} from './actions';

// Guards
export {
  canStartLoop,
  canRecover,
  isPerformanceLow,
  isFrameRateStable,
  isDebugModeEnabled,
  isStepModeEnabled,
  hasWebGLContext,
  isWebGLContextLost,
  isCriticalError,
  isRecoverableError
} from './guards';