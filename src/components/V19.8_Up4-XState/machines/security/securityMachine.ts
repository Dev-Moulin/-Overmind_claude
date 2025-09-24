/**
 * 🔐 B5 SECURITY MACHINE - Architecture Actor Model (Claude IA)
 * Machine principale avec Actors isolés pour éviter state explosion
 */

import { createMachine } from 'xstate';
import type {
  SecurityContext,
  SecurityEvent
} from './securityTypes';

import {
  SECURITY_LEVEL_CONFIGS,
  DEFAULT_PERFORMANCE_THRESHOLDS
} from './securityTypes';
import * as securityGuards from './guards';
import * as securityActions from './actions';

// Temporary service
const circuitBreakerService = () => () => {};

// ================================
// INITIAL CONTEXT
// ================================
const createInitialContext = (): SecurityContext => ({
  // Core State
  securityLevel: 'normal',
  threatScore: 0,
  isActive: false,

  // Actors (spawned on entry)
  threatDetector: null,
  alertVisuals: null,
  auditLogger: null,

  // Configurations
  levelConfigs: SECURITY_LEVEL_CONFIGS,
  alertConfigs: {
    flash: { pattern: 'flash', color: '#ff0000', intensity: 0.8, duration: 200, frequency: 5 },
    pulse: { pattern: 'pulse', color: '#ffaa00', intensity: 0.6, duration: 1000, frequency: 1 },
    rotate: { pattern: 'rotate', color: '#ff0000', intensity: 0.9, duration: 500, frequency: 2 },
    distortion: { pattern: 'distortion', color: '#ff0000', intensity: 1.0, duration: 300, frequency: 3 },
    glitch: { pattern: 'glitch', color: '#ff0000', intensity: 1.0, duration: 150, frequency: 8 },
    scanner: { pattern: 'scanner', color: '#00ff00', intensity: 0.7, duration: 2000, frequency: 0.5 }
  },
  performanceThresholds: DEFAULT_PERFORMANCE_THRESHOLDS,

  // Runtime Data
  currentThreats: [],
  activeAlerts: [],
  auditBuffer: [],

  // Performance
  performanceMode: 'normal',
  metrics: {
    fps: 60,
    frameTime: 16,
    cpuUsage: 5,
    memoryUsage: 128,
    renderCalls: 100,
    triangles: 50000
  },
  circuitBreakerState: 'closed',

  // Bridges
  bridgeConnections: {
    b3Lighting: false,
    b4Environment: false,
    visualEffects: false
  },

  // Settings
  adaptivePerformance: true,
  maxAuditEntries: 1000,
  threatDetectionInterval: 1000
});

// ================================
// SECURITY MACHINE (ACTOR MODEL)
// ================================
export const securityMachine = createMachine(
  {
    id: 'b5-security-machine',

    context: createInitialContext(),

    initial: 'inactive',

    states: {
      inactive: {
        on: {
          ACTIVATE: {
            target: 'operational',
            actions: ['activate', 'spawnActors']
          }
        }
      },

      operational: {
        type: 'parallel',

        entry: [
          'spawnActors'
        ],

        on: {
          DEACTIVATE: {
            target: 'inactive',
            actions: 'deactivate'
          },

          // Security Level Management
          SET_SECURITY_LEVEL: {
            actions: ['setSecurityLevel', 'addAuditEntry']
          },

          ESCALATE_SECURITY: {
            cond: 'canEscalate',
            actions: ['escalateSecurityLevel', 'addAuditEntry']
          },

          DEESCALATE_SECURITY: {
            cond: 'canDeescalate',
            actions: ['deescalateSecurityLevel', 'addAuditEntry']
          },

          // Threat Management
          THREAT_DETECTED: [
            {
              cond: 'shouldEscalateOnThreat',
              actions: [
                'updateThreatScore',
                'escalateSecurityLevel',
                'forwardToAlertVisuals',
                'forwardToAuditLogger',
                'addAuditEntry'
              ]
            },
            {
              actions: [
                'updateThreatScore',
                'forwardToAlertVisuals',
                'forwardToAuditLogger',
                'addAuditEntry'
              ]
            }
          ],

          THREAT_CLEARED: {
            actions: ['clearThreat', 'addAuditEntry']
          },

          // Alert Management
          TRIGGER_ALERT: {
            actions: [
              'addActiveAlert',
              'forwardToAlertVisuals',
              'addAuditEntry'
            ]
          },

          STOP_ALERTS: {
            actions: [
              'clearAlerts',
              'forwardToAlertVisuals'
            ]
          },

          // Performance Management
          PERFORMANCE_DEGRADED: [
            {
              cond: 'hasPerformanceDegradation',
              actions: [
                'updatePerformanceMetrics',
                'setPerformanceMode',
                'openCircuitBreaker',
                'addAuditEntry'
              ]
            },
            {
              actions: [
                'updatePerformanceMetrics',
                'setPerformanceMode',
                'addAuditEntry'
              ]
            }
          ],

          PERFORMANCE_RECOVERED: {
            actions: [
              'updatePerformanceMetrics',
              'closeCircuitBreaker',
              'addAuditEntry'
            ]
          },

          // Bridge Management
          BRIDGE_CONNECT: {
            actions: ['connectBridge', 'addAuditEntry']
          },

          BRIDGE_DISCONNECT: {
            actions: ['disconnectBridge', 'addAuditEntry']
          },

          // Audit
          AUDIT_EVENT: {
            actions: 'addAuditEntry'
          }
        },

        states: {
          // Circuit Breaker State
          circuitBreaker: {
            initial: 'closed',
            states: {
              closed: {
                on: {
                  CIRCUIT_BREAKER_OPEN: 'open'
                }
              },
              open: {
                after: {
                  5000: 'half-open' // 5 second timeout
                }
              },
              'half-open': {
                on: {
                  CIRCUIT_BREAKER_CLOSE: 'closed',
                  CIRCUIT_BREAKER_OPEN: 'open'
                }
              }
            }
          },

          // Monitoring State
          monitoring: {
            initial: 'active',
            states: {
              active: {
                invoke: {
                  src: 'circuitBreakerService',
                  onDone: {
                    actions: 'forwardToThreatDetector'
                  },
                  onError: {
                    actions: 'openCircuitBreaker'
                  }
                }
              }
            }
          }
        }
      }
    }
  },
  {

    actions: {
      // Actions d'initialisation
      spawnActors: securityActions.spawnActors,
      activate: securityActions.activate,
      deactivate: securityActions.deactivate,

      // Actions de gestion des niveaux
      setSecurityLevel: securityActions.setSecurityLevel,
      escalateSecurityLevel: securityActions.escalateSecurityLevel,
      deescalateSecurityLevel: securityActions.deescalateSecurityLevel,

      // Actions de gestion des menaces
      updateThreatScore: securityActions.updateThreatScore,
      clearThreat: securityActions.clearThreat,

      // Actions de gestion des alertes
      addActiveAlert: securityActions.addActiveAlert,
      clearAlerts: securityActions.clearAlerts,

      // Actions de performance
      updatePerformanceMetrics: securityActions.updatePerformanceMetrics,
      setPerformanceMode: securityActions.setPerformanceMode,

      // Actions circuit breaker
      openCircuitBreaker: securityActions.openCircuitBreaker,
      closeCircuitBreaker: securityActions.closeCircuitBreaker,

      // Actions d'audit
      addAuditEntry: securityActions.addAuditEntry,

      // Actions de bridge
      connectBridge: securityActions.connectBridge,
      disconnectBridge: securityActions.disconnectBridge,

      // Actions de forwarding
      forwardToAlertVisuals: securityActions.forwardToAlertVisuals,
      forwardToAuditLogger: securityActions.forwardToAuditLogger,
      forwardToThreatDetector: securityActions.forwardToThreatDetector
    },

    services: {
      circuitBreakerService
    },

    // ============================================
    // GUARDS
    // ============================================
    guards: {
      // Level Escalation Guards
      canEscalate: securityGuards.canEscalate,
      canDeescalate: securityGuards.canDeescalate,

      // Threat Detection Guards
      shouldEscalateOnThreat: securityGuards.shouldEscalateOnThreat,

      // Performance Guards
      hasPerformanceDegradation: securityGuards.hasPerformanceDegradation
    }
  }
);