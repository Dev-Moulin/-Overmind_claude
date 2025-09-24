/**
 * 🔐 B5 SECURITY TYPES - Base Claude IA
 * Types complets pour SecurityMachine avec Actor Model
 */

import type { ActorRefFrom, StateFrom } from 'xstate';

// ================================
// SECURITY LEVELS
// ================================
export type SecurityLevel = 'normal' | 'scanning' | 'alert' | 'lockdown';

export type SecurityLevelConfig = {
  level: SecurityLevel;
  threshold: number;    // 0-100
  color: string;
  intensity: number;    // 0-1
  effects: string[];
  performanceMode: 'normal' | 'reduced' | 'minimal';
};

// ================================
// THREAT DETECTION
// ================================
export interface ThreatMetrics {
  webglContextLoss: number;
  memoryLeaks: number;
  shaderCompileTime: number;
  inputVelocity: number;
  networkTiming: number;
  cpuUsage: number;
  timestamp: number;
}

export interface ThreatPattern {
  id: string;
  name: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  indicators: (keyof ThreatMetrics)[];
  threshold: number;
  mitigation?: string;
}

export interface ThreatDetectionResult {
  score: number;        // 0-100
  threats: ThreatPattern[];
  metrics: ThreatMetrics;
  confidence: number;   // 0-1
  timestamp: number;
}

// ================================
// VISUAL ALERTS
// ================================
export type AlertPattern = 'flash' | 'pulse' | 'rotate' | 'distortion' | 'glitch' | 'scanner';

export interface AlertConfig {
  pattern: AlertPattern;
  color: string;
  intensity: number;    // 0-1
  duration: number;     // ms
  frequency: number;    // Hz
}

export interface VisualEffect {
  id: string;
  type: AlertPattern;
  uniforms: Record<string, any>;
  shader: {
    vertex?: string;
    fragment: string;
  };
  enabled: boolean;
}

// ================================
// PERFORMANCE ADAPTATION
// ================================
export type PerformanceMode = 'normal' | 'reduced' | 'minimal' | 'boosted';

export interface PerformanceMetrics {
  fps: number;
  frameTime: number;    // ms
  cpuUsage: number;     // %
  memoryUsage: number;  // MB
  renderCalls: number;
  triangles: number;
}

export interface PerformanceThresholds {
  fps: { min: number; target: number; };
  frameTime: { max: number; target: number; };
  cpu: { max: number; target: number; };
  memory: { max: number; target: number; };
}

// ================================
// AUDIT LOGGING
// ================================
export type AuditEventType = 'security_level_change' | 'threat_detected' | 'alert_triggered' |
  'performance_degradation' | 'system_recovery' | 'manual_override';

export interface AuditEntry {
  id: string;
  timestamp: number;
  type: AuditEventType;
  level: SecurityLevel;
  data: any;
  source: string;
  userId?: string;
}

export interface AuditFilters {
  startTime?: number;
  endTime?: number;
  levels?: SecurityLevel[];
  types?: AuditEventType[];
  source?: string;
}

// ================================
// ACTOR REFERENCES
// ================================
export type ThreatDetectorActorRef = ActorRefFrom<any>;
export type AlertVisualsActorRef = ActorRefFrom<any>;
export type AuditLoggerActorRef = ActorRefFrom<any>;

// ================================
// SECURITY MACHINE CONTEXT
// ================================
export interface SecurityContext {
  // Core State
  securityLevel: SecurityLevel;
  threatScore: number;
  isActive: boolean;

  // Actors
  threatDetector: ThreatDetectorActorRef | null;
  alertVisuals: AlertVisualsActorRef | null;
  auditLogger: AuditLoggerActorRef | null;

  // Configurations
  levelConfigs: Record<SecurityLevel, SecurityLevelConfig>;
  alertConfigs: Record<AlertPattern, AlertConfig>;
  performanceThresholds: PerformanceThresholds;

  // Runtime Data
  currentThreats: ThreatPattern[];
  activeAlerts: AlertConfig[];
  auditBuffer: AuditEntry[];

  // Performance
  performanceMode: PerformanceMode;
  metrics: PerformanceMetrics;
  circuitBreakerState: 'closed' | 'open' | 'half-open';

  // Bridges
  bridgeConnections: {
    b3Lighting: boolean;
    b4Environment: boolean;
    visualEffects: boolean;
  };

  // Settings
  adaptivePerformance: boolean;
  maxAuditEntries: number;
  threatDetectionInterval: number;
}

// ================================
// EVENTS
// ================================
export type SecurityEvent =
  | { type: 'ACTIVATE'; config?: Partial<SecurityContext> }
  | { type: 'DEACTIVATE' }
  | { type: 'SET_SECURITY_LEVEL'; level: SecurityLevel }
  | { type: 'ESCALATE_SECURITY' }
  | { type: 'DEESCALATE_SECURITY' }
  | { type: 'THREAT_DETECTED'; threat: ThreatDetectionResult }
  | { type: 'THREAT_CLEARED'; threatId: string }
  | { type: 'TRIGGER_ALERT'; pattern: AlertPattern; config?: Partial<AlertConfig> }
  | { type: 'STOP_ALERTS' }
  | { type: 'PERFORMANCE_DEGRADED'; metrics: PerformanceMetrics }
  | { type: 'PERFORMANCE_RECOVERED'; metrics: PerformanceMetrics }
  | { type: 'CIRCUIT_BREAKER_OPEN' }
  | { type: 'CIRCUIT_BREAKER_CLOSE' }
  | { type: 'AUDIT_EVENT'; entry: Omit<AuditEntry, 'id' | 'timestamp'> }
  | { type: 'EXPORT_AUDIT'; format: 'json' | 'csv'; filters?: AuditFilters }
  | { type: 'BRIDGE_CONNECT'; system: keyof SecurityContext['bridgeConnections'] }
  | { type: 'BRIDGE_DISCONNECT'; system: keyof SecurityContext['bridgeConnections'] }
  | { type: 'UPDATE_CONFIG'; config: Partial<SecurityContext> };

// ================================
// SECURITY MACHINE STATE
// ================================
export type SecurityState = StateFrom<any>; // Will be properly typed when machine is created

// ================================
// HOOKS AND UTILITIES
// ================================
export interface SecurityHookReturn {
  // State
  state: SecurityState;
  context: SecurityContext;
  send: (event: any) => void;

  // Actions
  setSecurityLevel: (level: SecurityLevel) => void;
  escalate: () => void;
  deescalate: () => void;
  activate: () => void;
  deactivate: () => void;

  // Threats
  reportThreat: (threat: Partial<ThreatDetectionResult>) => void;
  clearThreat: (threatId: string) => void;

  // Alerts
  triggerAlert: (pattern: AlertPattern, config?: Partial<AlertConfig>) => void;
  stopAlerts: () => void;

  // Performance
  setPerformanceMode: (mode: PerformanceMode) => void;
  enableAdaptivePerformance: (enabled: boolean) => void;

  // Audit
  exportAudit: (format: 'json' | 'csv', filters?: AuditFilters) => void;

  // Computed
  isScanning: boolean;
  hasActiveThreats: boolean;
  hasActiveAlerts: boolean;
  isLockdown: boolean;
  currentThreatLevel: number;
}

// ================================
// CIRCUIT BREAKER
// ================================
export interface CircuitBreakerConfig {
  failureThreshold: number;
  resetTimeout: number;
  monitoringPeriod: number;
  performanceThreshold: {
    maxCpu: number;
    maxMemory: number;
    minFps: number;
  };
}

// ================================
// ML-LITE SCORER
// ================================
export interface MLLiteConfig {
  weights: Record<keyof ThreatMetrics, number>;
  normalizeFactors: Record<keyof ThreatMetrics, number>;
  learningRate: number;
  adaptationEnabled: boolean;
}

// ================================
// PRESETS AND CONSTANTS
// ================================
export const SECURITY_LEVEL_CONFIGS: Record<SecurityLevel, SecurityLevelConfig> = {
  normal: {
    level: 'normal',
    threshold: 0,
    color: '#00ff00',
    intensity: 0.3,
    effects: [],
    performanceMode: 'normal'
  },
  scanning: {
    level: 'scanning',
    threshold: 25,
    color: '#ffff00',
    intensity: 0.5,
    effects: ['pulse'],
    performanceMode: 'normal'
  },
  alert: {
    level: 'alert',
    threshold: 50,
    color: '#ff8800',
    intensity: 0.7,
    effects: ['flash', 'pulse'],
    performanceMode: 'reduced'
  },
  lockdown: {
    level: 'lockdown',
    threshold: 75,
    color: '#ff0000',
    intensity: 1.0,
    effects: ['flash', 'pulse', 'rotate', 'distortion'],
    performanceMode: 'minimal'
  }
};

export const DEFAULT_PERFORMANCE_THRESHOLDS: PerformanceThresholds = {
  fps: { min: 30, target: 60 },
  frameTime: { max: 33, target: 16 },
  cpu: { max: 15, target: 5 },
  memory: { max: 512, target: 256 }
};