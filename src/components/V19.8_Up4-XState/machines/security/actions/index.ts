// 🛡️ Actions XState pour SecurityMachine - Atome B5
// Actions de gestion des états et des transitions du système de sécurité

import { assign, spawn, forwardTo } from 'xstate';
import type {
  SecurityContext,
  SecurityEvent,
  SecurityLevel,
  PerformanceMode,
  AuditEntry,
  AuditEventType
} from '../securityTypes';

// Import des actors (seront mis à jour quand les vrais actors seront intégrés)
const threatDetectorActor = { id: 'threat-detector-placeholder' };
const alertVisualsActor = { id: 'alert-visuals-placeholder' };
const auditLoggerActor = { id: 'audit-logger-placeholder' };

// ================================
// ACTIONS D'INITIALISATION
// ================================

/**
 * Lance les acteurs isolés pour éviter l'explosion d'états
 */
export const spawnActors = assign<SecurityContext>({
  threatDetector: () => spawn(threatDetectorActor as any, 'threatDetector'),
  alertVisuals: () => spawn(alertVisualsActor as any, 'alertVisuals'),
  auditLogger: () => spawn(auditLoggerActor as any, 'auditLogger')
});

/**
 * Active le système de sécurité
 */
export const activate = assign<SecurityContext>({
  isActive: () => true
});

/**
 * Désactive le système de sécurité
 */
export const deactivate = assign<SecurityContext>({
  isActive: () => false
});

// ================================
// ACTIONS DE GESTION DES NIVEAUX
// ================================

/**
 * Définit le niveau de sécurité manuellement
 */
export const setSecurityLevel = assign<SecurityContext, SecurityEvent>({
  securityLevel: (context, event) => {
    if (event.type === 'SET_SECURITY_LEVEL') {
      return (event as any).level;
    }
    return 'normal';
  },
  performanceMode: (context, event) => {
    if (event.type === 'SET_SECURITY_LEVEL') {
      return context.levelConfigs[(event as any).level].performanceMode as PerformanceMode;
    }
    return 'normal';
  }
});

/**
 * Escalade automatique du niveau de sécurité
 */
export const escalateSecurityLevel = assign<SecurityContext>({
  securityLevel: (context) => {
    const levels: SecurityLevel[] = ['normal', 'scanning', 'alert', 'lockdown'];
    const currentIndex = levels.indexOf(context.securityLevel);
    return levels[Math.min(currentIndex + 1, levels.length - 1)];
  }
});

/**
 * Descente du niveau de sécurité
 */
export const deescalateSecurityLevel = assign<SecurityContext>({
  securityLevel: (context) => {
    const levels: SecurityLevel[] = ['normal', 'scanning', 'alert', 'lockdown'];
    const currentIndex = levels.indexOf(context.securityLevel);
    return levels[Math.max(currentIndex - 1, 0)];
  }
});

// ================================
// ACTIONS DE GESTION DES MENACES
// ================================

/**
 * Met à jour le score de menace et ajoute les nouvelles menaces
 */
export const updateThreatScore = assign<SecurityContext, SecurityEvent>({
  threatScore: (context, event) => {
    if (event.type === 'THREAT_DETECTED') {
      return (event as any).threat.score;
    }
    return 0;
  },
  currentThreats: (context, event) => {
    if (event.type === 'THREAT_DETECTED') {
      return [...context.currentThreats, ...(event as any).threat.threats];
    }
    return context.currentThreats;
  }
});

/**
 * Supprime une menace spécifique
 */
export const clearThreat = assign<SecurityContext, SecurityEvent>({
  currentThreats: (context, event) => {
    if (event.type === 'THREAT_CLEARED') {
      return context.currentThreats.filter(threat => threat.id !== (event as any).threatId);
    }
    return context.currentThreats;
  }
});

// ================================
// ACTIONS DE GESTION DES ALERTES
// ================================

/**
 * Ajoute une nouvelle alerte active
 */
export const addActiveAlert = assign<SecurityContext, SecurityEvent>({
  activeAlerts: (context, event) => {
    if (event.type === 'TRIGGER_ALERT') {
      const alertConfig = context.alertConfigs[(event as any).pattern];
      const customConfig = (event as any).config || {};
      return [...context.activeAlerts, { ...alertConfig, ...customConfig }];
    }
    return context.activeAlerts;
  }
});

/**
 * Supprime toutes les alertes actives
 */
export const clearAlerts = assign<SecurityContext>({
  activeAlerts: () => []
});

// ================================
// ACTIONS DE PERFORMANCE
// ================================

/**
 * Met à jour les métriques de performance
 */
export const updatePerformanceMetrics = assign<SecurityContext, SecurityEvent>({
  metrics: (context, event) => {
    if (event.type === 'PERFORMANCE_DEGRADED' || event.type === 'PERFORMANCE_RECOVERED') {
      return (event as any).metrics;
    }
    return {
      fps: 60,
      frameTime: 16,
      cpuUsage: 5,
      memoryUsage: 128,
      renderCalls: 100,
      triangles: 50000
    };
  }
});

/**
 * Définit le mode de performance selon les métriques
 */
export const setPerformanceMode = assign<SecurityContext, SecurityEvent>({
  performanceMode: (context, event) => {
    if (event.type === 'PERFORMANCE_DEGRADED') {
      return (event as any).metrics.fps < 30 ? 'minimal' :
             (event as any).metrics.fps < 45 ? 'reduced' : 'normal';
    }
    return 'normal';
  }
});

// ================================
// ACTIONS CIRCUIT BREAKER
// ================================

/**
 * Ouvre le circuit breaker (protection activée)
 */
export const openCircuitBreaker = assign<SecurityContext>({
  circuitBreakerState: () => 'open'
});

/**
 * Ferme le circuit breaker (protection désactivée)
 */
export const closeCircuitBreaker = assign<SecurityContext>({
  circuitBreakerState: () => 'closed'
});

// ================================
// ACTIONS D'AUDIT
// ================================

/**
 * Ajoute une entrée dans le journal d'audit
 */
export const addAuditEntry = assign<SecurityContext, SecurityEvent>({
  auditBuffer: (context, event) => {
    let entry: AuditEntry;
    if (event.type === 'AUDIT_EVENT') {
      entry = {
        ...(event as any).entry,
        id: crypto.randomUUID(),
        timestamp: Date.now()
      };
    } else {
      entry = {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        type: 'security_level_change' as const,
        level: context.securityLevel,
        data: { event: event.type },
        source: 'securityMachine'
      };
    }

    const buffer = [...context.auditBuffer, entry];
    return buffer.slice(-context.maxAuditEntries);
  }
});

// ================================
// ACTIONS DE BRIDGE
// ================================

/**
 * Connecte un système via bridge
 */
export const connectBridge = assign<SecurityContext, SecurityEvent>({
  bridgeConnections: (context, event) => {
    if (event.type === 'BRIDGE_CONNECT') {
      return {
        ...context.bridgeConnections,
        [(event as any).system]: true
      };
    }
    return context.bridgeConnections;
  }
});

/**
 * Déconnecte un système via bridge
 */
export const disconnectBridge = assign<SecurityContext, SecurityEvent>({
  bridgeConnections: (context, event) => {
    if (event.type === 'BRIDGE_DISCONNECT') {
      return {
        ...context.bridgeConnections,
        [(event as any).system]: false
      };
    }
    return context.bridgeConnections;
  }
});

// ================================
// ACTIONS DE FORWARDING
// ================================

/**
 * Transfère un événement vers l'acteur d'alertes visuelles
 */
export const forwardToAlertVisuals = forwardTo('alertVisuals');

/**
 * Transfère un événement vers l'acteur d'audit
 */
export const forwardToAuditLogger = forwardTo('auditLogger');

/**
 * Transfère un événement vers l'acteur de détection de menaces
 */
export const forwardToThreatDetector = forwardTo('threatDetector');