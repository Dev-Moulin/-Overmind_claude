/**
 * 🎯 USE SECURITY HOOK - React Hook complet (Claude IA)
 * Hook React principal pour B5 SecurityMachine
 */

import { useActor } from '@xstate/react';
import { interpret } from 'xstate';
import { useMemo } from 'react';
import type {
  SecurityHookReturn,
  SecurityLevel,
  AlertPattern,
  AlertConfig,
  AuditFilters,
  PerformanceMode,
  ThreatDetectionResult
} from '../securityTypes';

import { securityMachine } from '../securityMachine';

// Create actor instance
const securityActor = interpret(securityMachine);

// ================================
// SECURITY HOOK IMPLEMENTATION
// ================================
export function useSecurity(): SecurityHookReturn {
  const [state, send] = useActor(securityActor);

  // Computed values
  const computed = useMemo(() => ({
    isScanning: state.context.securityLevel === 'scanning',
    hasActiveThreats: state.context.currentThreats.length > 0,
    hasActiveAlerts: state.context.activeAlerts.length > 0,
    isLockdown: state.context.securityLevel === 'lockdown',
    currentThreatLevel: state.context.threatScore
  }), [state.context]);

  // Actions
  const actions = useMemo(() => ({
    // Security Level Management
    setSecurityLevel: (level: SecurityLevel) => {
      send({ type: 'SET_SECURITY_LEVEL', level });
    },

    escalate: () => {
      send({ type: 'ESCALATE_SECURITY' });
    },

    deescalate: () => {
      send({ type: 'DEESCALATE_SECURITY' });
    },

    activate: () => {
      send({ type: 'ACTIVATE' });
    },

    deactivate: () => {
      send({ type: 'DEACTIVATE' });
    },

    // Threat Management
    reportThreat: (threat: Partial<ThreatDetectionResult>) => {
      send({
        type: 'THREAT_DETECTED',
        threat: {
          score: threat.score || 0,
          threats: threat.threats || [],
          metrics: threat.metrics || {
            webglContextLoss: 0,
            memoryLeaks: 0,
            shaderCompileTime: 0,
            inputVelocity: 0,
            networkTiming: 0,
            cpuUsage: 0,
            timestamp: Date.now()
          },
          confidence: threat.confidence || 0.5,
          timestamp: threat.timestamp || Date.now()
        }
      });
    },

    clearThreat: (threatId: string) => {
      send({ type: 'THREAT_CLEARED', threatId });
    },

    // Alert Management
    triggerAlert: (pattern: AlertPattern, config?: Partial<AlertConfig>) => {
      send({ type: 'TRIGGER_ALERT', pattern, config });
    },

    stopAlerts: () => {
      send({ type: 'STOP_ALERTS' });
    },

    // Performance Management
    setPerformanceMode: (mode: PerformanceMode) => {
      send({
        type: 'UPDATE_CONFIG',
        config: { performanceMode: mode }
      });
    },

    enableAdaptivePerformance: (enabled: boolean) => {
      send({
        type: 'UPDATE_CONFIG',
        config: { adaptivePerformance: enabled }
      });
    },

    // Audit Management
    exportAudit: (format: 'json' | 'csv', filters?: AuditFilters) => {
      send({ type: 'EXPORT_AUDIT', format, filters });
    }
  }), [send]);

  return {
    // State and Context
    state,
    context: state.context,
    send,

    // Actions
    ...actions,

    // Computed Values
    ...computed
  };
}

// ================================
// SECURITY MONITORING HOOK
// ================================
export function useSecurityMonitoring() {
  const security = useSecurity();

  const startMonitoring = () => {
    if (!security.state.matches('operational')) {
      security.activate();
    }
  };

  const stopMonitoring = () => {
    if (security.state.matches('operational')) {
      security.deactivate();
    }
  };

  const getSecurityStatus = () => ({
    level: security.context.securityLevel,
    threatScore: security.context.threatScore,
    isActive: security.context.isActive,
    bridgeConnections: security.context.bridgeConnections,
    performanceMode: security.context.performanceMode,
    circuitBreakerState: security.context.circuitBreakerState
  });

  const getAuditStats = () => ({
    totalEntries: security.context.auditBuffer.length,
    maxEntries: security.context.maxAuditEntries,
    activeThreats: security.context.currentThreats.length,
    activeAlerts: security.context.activeAlerts.length
  });

  return {
    ...security,
    startMonitoring,
    stopMonitoring,
    getSecurityStatus,
    getAuditStats
  };
}

// ================================
// SECURITY ALERTS HOOK
// ================================
export function useSecurityAlerts() {
  const security = useSecurity();

  const flashAlert = (duration: number = 1000) => {
    security.triggerAlert('flash', { duration });
    setTimeout(() => security.stopAlerts(), duration);
  };

  const pulseAlert = (duration: number = 2000) => {
    security.triggerAlert('pulse', { duration });
    setTimeout(() => security.stopAlerts(), duration);
  };

  const emergencyAlert = () => {
    security.setSecurityLevel('lockdown');
    security.triggerAlert('distortion', { intensity: 1.0 });
  };

  const scanningMode = () => {
    security.setSecurityLevel('scanning');
    security.triggerAlert('scanner', { duration: 3000 });
  };

  return {
    context: security.context,
    state: security.state,
    flashAlert,
    pulseAlert,
    emergencyAlert,
    scanningMode,
    stopAlerts: security.stopAlerts,
    currentAlerts: security.context.activeAlerts,
    hasActiveAlerts: security.hasActiveAlerts
  };
}

// ================================
// SECURITY PERFORMANCE HOOK
// ================================
export function useSecurityPerformance() {
  const security = useSecurity();

  const reportPerformanceIssue = (metrics: {
    fps: number;
    frameTime: number;
    cpuUsage: number;
    memoryUsage: number;
  }) => {
    security.send({
      type: 'PERFORMANCE_DEGRADED',
      metrics: {
        ...metrics,
        renderCalls: 0,
        triangles: 0
      }
    });
  };

  const reportPerformanceRecovery = (metrics: {
    fps: number;
    frameTime: number;
    cpuUsage: number;
    memoryUsage: number;
  }) => {
    security.send({
      type: 'PERFORMANCE_RECOVERED',
      metrics: {
        ...metrics,
        renderCalls: 0,
        triangles: 0
      }
    });
  };

  const setPerformanceMode = (mode: PerformanceMode) => {
    security.setPerformanceMode(mode);
  };

  const toggleAdaptivePerformance = () => {
    const current = security.context.adaptivePerformance;
    security.enableAdaptivePerformance(!current);
  };

  return {
    performanceMode: security.context.performanceMode,
    adaptivePerformance: security.context.adaptivePerformance,
    circuitBreakerState: security.context.circuitBreakerState,
    currentMetrics: security.context.metrics,
    reportPerformanceIssue,
    reportPerformanceRecovery,
    setPerformanceMode,
    toggleAdaptivePerformance
  };
}