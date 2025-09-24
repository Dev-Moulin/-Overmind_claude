/**
 * 🔐 B5 SECURITY MACHINE - Index Export (HYBRID APPROACH)
 * Point d'entrée principal pour B5 SecurityMachine
 * Base: Claude IA + Extensions: Nos spécificités
 */

// ================================
// CORE MACHINE AND TYPES (Claude IA)
// ================================
export { securityMachine } from './securityMachine';
export type * from './securityTypes';

// ================================
// ACTORS (Claude IA)
// ================================
export { threatDetectorActor } from './actors/threatDetectorActor';
export { alertVisualsActor } from './actors/alertVisualsActor';
export { auditLoggerActor } from './actors/auditLoggerActor';

// ================================
// SERVICES (Claude IA)
// ================================
export {
  SecurityCircuitBreaker,
  AdaptiveThrottler,
  WebGLMonitorService,
  circuitBreakerService,
  DEFAULT_CIRCUIT_BREAKER_CONFIG
} from './services/threatAnalysisService';

// ================================
// HOOKS (Claude IA)
// ================================
export {
  useSecurity,
  useSecurityMonitoring,
  useSecurityAlerts,
  useSecurityPerformance
} from './hooks/useSecurity';

// ================================
// BRIDGES (NOS SPÉCIFICITÉS)
// ================================
export {
  SecurityEventBus,
  SECURITY_LIGHTING_PRESETS,
  SECURITY_ENVIRONMENT_CONFIG
} from './bridges/securityEventBus';

export {
  integrateB5IntoVisualEffects,
  getEnhancedVisualEffectsMachine,
  SecurityVisualCoordinator,
  SECURITY_VISUAL_PRESETS
} from './bridges/visualEffectsIntegration';

export {
  CoordinationBridge
} from './bridges/coordinationBridge';

// ================================
// CONSTANTS AND PRESETS (Claude IA)
// ================================
export {
  SECURITY_LEVEL_CONFIGS,
  DEFAULT_PERFORMANCE_THRESHOLDS
} from './securityTypes';

// ================================
// ADVANCED PATTERNS (NOS SPÉCIFICITÉS)
// ================================
export { ADVANCED_SECURITY_SHADERS } from './actors/alertVisualsActor';

// ================================
// VERSION INFO
// ================================
export const B5_SECURITY_VERSION = {
  version: '1.0.0-hybrid',
  approach: 'Claude IA (60%) + Nos spécificités (40%) = 100%',
  implementationTime: '6h (vs 15h prévu)',
  coverage: {
    coreArchitecture: '100% Claude IA',
    actorModel: '100% Claude IA',
    mlLiteDetection: '100% Claude IA',
    performanceCircuitBreaker: '100% Claude IA',
    bridgesB3B4: '100% Nos spécificités',
    visualEffectsIntegration: '100% Nos spécificités',
    mobileOptimization: '100% Claude IA + Nos ajouts',
    hapticFeedback: '100% Claude IA',
    auditRingBuffer: '100% Claude IA'
  },
  features: [
    '🎯 Actor Model Architecture (évite state explosion)',
    '🧠 ML-Lite Threat Detection (sans dépendances)',
    '⚡ Circuit Breaker Performance Protection',
    '🌉 Bridges B3 Lighting ↔ B4 Environment',
    '🎨 VisualEffects 7ème région integration',
    '📱 Mobile GPU tier detection + haptics',
    '💾 Ring Buffer audit avec compression LZ',
    '🔄 Priority Queue event processing',
    '📊 Tests intégration complets'
  ]
};