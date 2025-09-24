/**
 * 🛡️ SECURITY GUARDS - XState v4 Pattern
 * Guards séparés pour compatibilité avec l'architecture du projet
 */

import type { SecurityContext, SecurityEvent, SecurityLevel } from '../securityTypes';

// ================================
// LEVEL ESCALATION GUARDS
// ================================

/**
 * Vérifie si on peut escalader le niveau de sécurité
 */
export const canEscalate = (context: SecurityContext): boolean => {
  const levels: SecurityLevel[] = ['normal', 'scanning', 'alert', 'lockdown'];
  const currentIndex = levels.indexOf(context.securityLevel);
  return currentIndex < levels.length - 1;
};

/**
 * Vérifie si on peut descendre le niveau de sécurité
 */
export const canDeescalate = (context: SecurityContext): boolean => {
  const levels: SecurityLevel[] = ['normal', 'scanning', 'alert', 'lockdown'];
  const currentIndex = levels.indexOf(context.securityLevel);
  return currentIndex > 0;
};

// ================================
// THREAT DETECTION GUARDS
// ================================

/**
 * Vérifie si une menace justifie une escalation automatique
 */
export const shouldEscalateOnThreat = (context: SecurityContext, event: SecurityEvent): boolean => {
  if (event.type !== 'THREAT_DETECTED') return false;

  const threatScore = event.threat.score;
  const currentLevel = context.securityLevel;

  return (
    (currentLevel === 'normal' && threatScore > 25) ||
    (currentLevel === 'scanning' && threatScore > 50) ||
    (currentLevel === 'alert' && threatScore > 75)
  );
};

/**
 * Vérifie si le score de menace est critique (>80)
 */
export const isThreatCritical = (context: SecurityContext, event: SecurityEvent): boolean => {
  if (event.type !== 'THREAT_DETECTED') return false;
  return event.threat.score > 80;
};

/**
 * Vérifie si on a des menaces actives
 */
export const hasActiveThreats = (context: SecurityContext): boolean => {
  return context.currentThreats.length > 0;
};

// ================================
// PERFORMANCE GUARDS
// ================================

/**
 * Vérifie si les performances sont dégradées
 */
export const hasPerformanceDegradation = (context: SecurityContext): boolean => {
  return context.metrics.cpuUsage > 20 || context.metrics.fps < 20;
};

/**
 * Vérifie si les performances sont critiques
 */
export const hasPerformanceCritical = (context: SecurityContext): boolean => {
  return context.metrics.cpuUsage > 50 || context.metrics.fps < 10;
};

/**
 * Vérifie si on doit activer le circuit breaker
 */
export const shouldOpenCircuitBreaker = (context: SecurityContext): boolean => {
  return context.metrics.fps < 15 || context.metrics.cpuUsage > 40;
};

/**
 * Vérifie si on peut fermer le circuit breaker
 */
export const canCloseCircuitBreaker = (context: SecurityContext): boolean => {
  return context.metrics.fps >= 25 && context.metrics.cpuUsage <= 30;
};

// ================================
// AUDIT GUARDS
// ================================

/**
 * Vérifie si on peut exporter l'audit (pas déjà en cours)
 */
export const canExportAudit = (context: SecurityContext): boolean => {
  // Note: cette logique sera utilisée par auditLoggerActor
  return true; // Pour l'instant, toujours autorisé
};

/**
 * Vérifie si le buffer d'audit est plein
 */
export const isAuditBufferFull = (context: SecurityContext): boolean => {
  return context.auditBuffer.length >= context.maxAuditEntries;
};

// ================================
// VISUAL EFFECTS GUARDS (pour alertVisualsActor)
// ================================

/**
 * Vérifie si on peut utiliser les effets avancés (desktop/mobile-high)
 */
export const canUseAdvancedEffects = (context: any): boolean => {
  return context.gpuTier === 'desktop' || context.gpuTier === 'mobile-high';
};

/**
 * Vérifie si on doit utiliser les effets simples (mobile-low)
 */
export const shouldUseSimpleEffects = (context: any): boolean => {
  return context.gpuTier === 'mobile-low';
};

/**
 * Vérifie si un pattern d'effet est pour les alertes critiques
 */
export const isCriticalAlertPattern = (context: any, event: any): boolean => {
  if (event.type !== 'ACTIVATE_ALERT') return false;
  return ['alert', 'lockdown', 'distortion'].includes(event.pattern);
};

// ================================
// THREAT DETECTOR GUARDS (pour threatDetectorActor)
// ================================

/**
 * Vérifie si l'apprentissage adaptatif est activé
 */
export const isAdaptiveLearningEnabled = (context: any): boolean => {
  return context.adaptiveLearning === true;
};

/**
 * Vérifie si le détecteur est actif
 */
export const isThreatDetectorActive = (context: any): boolean => {
  return context.isActive === true;
};