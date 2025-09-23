/**
 * 🚩 Test Feature Flags B3 Lighting pour Phase 3-5
 * Migration complète: CANARY → PARTIAL → FULL
 */

import { lightingFeatureFlags } from './featureFlags';
import { MigrationLevel } from './types';

/**
 * Activer mode CANARY pour baseLighting (5% migration)
 */
export function activateBaseLightingCanary() {
  console.log('🚩 Activating baseLighting CANARY mode (5% migration)...');

  // Set baseLighting to CANARY level
  lightingFeatureFlags.setRegionMigrationLevel('baseLighting', MigrationLevel.CANARY);

  // Enable global features for testing
  lightingFeatureFlags.enableGlobalFeature('eventBusEnabled');
  lightingFeatureFlags.enableGlobalFeature('performanceMonitoringEnabled');
  lightingFeatureFlags.enableGlobalFeature('debugMode');
  lightingFeatureFlags.enableGlobalFeature('verboseLogging');

  // Validate activation
  const status = lightingFeatureFlags.getMigrationStatus();
  console.log('📊 Migration Status after CANARY activation:', status);

  console.log('✅ baseLighting CANARY mode activated');

  return {
    canaryActive: lightingFeatureFlags.isRegionXStateEnabled('baseLighting'),
    migrationLevel: lightingFeatureFlags.getRegionMigrationLevel('baseLighting'),
    percentage: lightingFeatureFlags.getRegionXStatePercentage('baseLighting'),
    status
  };
}

/**
 * Migration vers PARTIAL pour baseLighting (25% migration)
 */
export function migrateBaseLightingToPartial() {
  console.log('🚀 Migrating baseLighting to PARTIAL mode (25% migration)...');

  // Set baseLighting to PARTIAL level
  lightingFeatureFlags.setRegionMigrationLevel('baseLighting', MigrationLevel.PARTIAL);

  // Ensure production features are enabled
  lightingFeatureFlags.enableGlobalFeature('eventBusEnabled');
  lightingFeatureFlags.enableGlobalFeature('performanceMonitoringEnabled');
  lightingFeatureFlags.enableGlobalFeature('adaptiveThrottlingEnabled');
  lightingFeatureFlags.enableGlobalFeature('circuitBreakerEnabled');

  // Validate migration
  const status = lightingFeatureFlags.getMigrationStatus();
  console.log('📊 Migration Status after PARTIAL activation:', status);

  console.log('✅ baseLighting PARTIAL mode activated');

  return {
    partialActive: lightingFeatureFlags.isRegionXStateEnabled('baseLighting'),
    migrationLevel: lightingFeatureFlags.getRegionMigrationLevel('baseLighting'),
    percentage: lightingFeatureFlags.getRegionXStatePercentage('baseLighting'),
    status,
    productionReady: status.partial > 0 && status.canary === 0
  };
}

/**
 * Rollback baseLighting to OFF
 */
export function rollbackBaseLightingCanary() {
  console.log('🔄 Rolling back baseLighting from CANARY to OFF...');

  const success = lightingFeatureFlags.rollbackRegion('baseLighting');

  if (success) {
    console.log('✅ baseLighting rolled back successfully');
  } else {
    console.error('❌ Failed to rollback baseLighting');
  }

  return success;
}

/**
 * Test emergency rollback
 */
export function testEmergencyRollback() {
  console.log('🚨 Testing emergency rollback...');

  lightingFeatureFlags.emergencyRollback('Phase 3 test emergency procedure');

  const status = lightingFeatureFlags.getMigrationStatus();
  console.log('📊 Status after emergency rollback:', status);

  return status.off === 5; // All regions should be OFF
}

/**
 * Get current feature flags status
 */
export function getFeatureFlagsStatus() {
  const flags = lightingFeatureFlags.getFlags();
  const status = lightingFeatureFlags.getMigrationStatus();

  return {
    flags,
    status,
    baseLightingEnabled: lightingFeatureFlags.isRegionXStateEnabled('baseLighting'),
    migrationLevel: lightingFeatureFlags.getRegionMigrationLevel('baseLighting'),
    percentage: lightingFeatureFlags.getRegionXStatePercentage('baseLighting')
  };
}

/**
 * Monitoring production pour performance et stabilité
 */
export function getProductionMonitoring() {
  const flags = lightingFeatureFlags.getFlags();
  const status = lightingFeatureFlags.getMigrationStatus();

  // Performance metrics
  const performanceData = {
    isEnabled: flags.performanceMonitoringEnabled,
    adaptiveThrottling: flags.adaptiveThrottlingEnabled,
    circuitBreaker: flags.circuitBreakerEnabled,
    rollbackTimeout: flags.rollbackTimeoutMs,
    rollbackOnPerformance: flags.rollbackOnPerformanceDegradation
  };

  // Migration health check
  const migrationHealth = {
    totalUsers: status.totalRegions * 100, // Simulé pour demo
    canaryUsers: status.canary * 5, // 5% par région CANARY
    partialUsers: status.partial * 25, // 25% par région PARTIAL
    fullUsers: status.full * 100, // 100% par région FULL
    overallMigrationRate: status.overallPercentage
  };

  // System health indicators
  const systemHealth = {
    featureFlagsOperational: status.totalRegions === 5,
    emergencyRollbackReady: flags.rollbackTimeoutMs < 5000,
    monitoringActive: performanceData.isEnabled,
    circuitBreakerArmed: performanceData.circuitBreaker
  };

  console.log('📊 Production Monitoring Report:', {
    timestamp: new Date().toISOString(),
    migrationStatus: status,
    performance: performanceData,
    userDistribution: migrationHealth,
    systemHealth
  });

  return {
    migrationStatus: status,
    performance: performanceData,
    userDistribution: migrationHealth,
    systemHealth,
    recommendations: getProductionRecommendations(status, performanceData)
  };
}

/**
 * Recommandations basées sur l'état actuel
 */
function getProductionRecommendations(status: any, performance: any) {
  const recommendations = [];

  if (status.canary > 0 && status.partial === 0) {
    recommendations.push('🚀 Ready to migrate from CANARY to PARTIAL (5% → 25%)');
  }

  if (status.partial > 0 && status.full === 0) {
    recommendations.push('⚡ Consider migrating to FULL (25% → 100%) after performance validation');
  }

  if (!performance.circuitBreaker) {
    recommendations.push('⚠️ Enable circuit breaker for production safety');
  }

  if (!performance.adaptiveThrottling) {
    recommendations.push('🎯 Enable adaptive throttling for better performance');
  }

  if (status.off === 5) {
    recommendations.push('🔄 All regions in legacy mode - consider starting CANARY migration');
  }

  return recommendations;
}

/**
 * Migration vers FULL pour baseLighting (100% migration) - PHASE 5
 */
export function migrateBaseLightingToFull() {
  console.log('🎉 Migration baseLighting vers mode FULL (100% migration)...');

  // Définir baseLighting au niveau FULL
  lightingFeatureFlags.setRegionMigrationLevel('baseLighting', MigrationLevel.FULL);

  // Activer toutes les fonctionnalités production pour déploiement FULL
  lightingFeatureFlags.enableGlobalFeature('eventBusEnabled');
  lightingFeatureFlags.enableGlobalFeature('performanceMonitoringEnabled');
  lightingFeatureFlags.enableGlobalFeature('adaptiveThrottlingEnabled');
  lightingFeatureFlags.enableGlobalFeature('circuitBreakerEnabled');
  lightingFeatureFlags.enableGlobalFeature('rollbackOnPerformanceDegradation');

  // Valider migration FULL
  const status = lightingFeatureFlags.getMigrationStatus();
  console.log('📊 Statut Migration après activation FULL:', status);

  console.log('✅ baseLighting mode FULL activé (100% utilisateurs)');

  return {
    fullActive: lightingFeatureFlags.isRegionXStateEnabled('baseLighting'),
    migrationLevel: lightingFeatureFlags.getRegionMigrationLevel('baseLighting'),
    percentage: lightingFeatureFlags.getRegionXStatePercentage('baseLighting'),
    status,
    legacyDecommissioned: status.full > 0 && status.partial === 0 && status.canary === 0,
    productionComplete: status.overallPercentage === 100
  };
}

/**
 * Validation de préparation pour migration FULL
 */
export function validateFullMigrationReadiness() {
  console.log('🔍 Validation de la préparation pour migration FULL...');

  const status = lightingFeatureFlags.getMigrationStatus();
  const flags = lightingFeatureFlags.getFlags();

  const readinessChecks = {
    // État pré-requis
    currentlyPartial: status.partial > 0,
    noCanaryActive: status.canary === 0,
    systemStable: status.totalRegions === 5,

    // Fonctionnalités techniques
    performanceMonitoringActive: flags.performanceMonitoringEnabled,
    circuitBreakerEnabled: flags.circuitBreakerEnabled,
    rollbackCapable: flags.rollbackTimeoutMs < 5000,

    // Vérifications sécurité
    emergencySystemReady: flags.rollbackOnPerformanceDegradation
  };

  const ready = Object.values(readinessChecks).every(check => check === true);

  console.log('✅ Préparation Migration FULL:', {
    ready,
    checks: readinessChecks,
    recommendation: ready ? 'PROCEDER_VERS_FULL' : 'CORRIGER_PROBLEMES_DABORD'
  });

  return {
    ready,
    checks: readinessChecks,
    issues: Object.entries(readinessChecks)
      .filter(([_, passed]) => !passed)
      .map(([check, _]) => check)
  };
}

/**
 * Monitoring production avancé pour déploiement FULL
 */
export function getFullProductionMonitoring() {
  const flags = lightingFeatureFlags.getFlags();
  const status = lightingFeatureFlags.getMigrationStatus();

  // Métriques performance FULL
  const performanceData = {
    isEnabled: flags.performanceMonitoringEnabled,
    adaptiveThrottling: flags.adaptiveThrottlingEnabled,
    circuitBreaker: flags.circuitBreakerEnabled,
    rollbackTimeout: flags.rollbackTimeoutMs,
    rollbackOnPerformance: flags.rollbackOnPerformanceDegradation,
    emergencyMode: flags.debugMode // Utiliser debugMode comme proxy emergency
  };

  // Distribution utilisateurs FULL
  const userDistribution = {
    totalUsers: status.totalRegions * 100,
    fullUsers: status.full * 100, // 100% par région FULL
    partialUsers: status.partial * 25, // 25% par région PARTIAL (legacy)
    canaryUsers: status.canary * 5, // 5% par région CANARY (legacy)
    legacyUsers: status.off * 100, // 100% par région OFF (legacy)
    migrationComplete: status.full === 5, // Toutes les régions en FULL
    overallMigrationRate: status.overallPercentage
  };

  // Santé système FULL
  const systemHealth = {
    featureFlagsOperational: status.totalRegions === 5,
    emergencyRollbackReady: flags.rollbackTimeoutMs < 5000,
    monitoringActive: performanceData.isEnabled,
    circuitBreakersActive: performanceData.circuitBreaker,
    overallHealth: calculateSystemHealth(status, performanceData),
    legacySystemsDecommissioned: status.off === 0 && status.canary === 0
  };

  // Statut décommissioning legacy
  const legacyDecommissioning = {
    canaryDecommissioned: status.canary === 0,
    partialDecommissioned: status.partial === 0,
    offlineDecommissioned: status.off === 0,
    fullDecommissioningComplete: status.off === 0 && status.canary === 0 && status.partial === 0,
    legacySystemsRemaining: status.totalRegions - status.full
  };

  console.log('📊 Rapport Monitoring Production FULL:', {
    timestamp: new Date().toISOString(),
    migrationStatus: status,
    performance: performanceData,
    userDistribution,
    systemHealth,
    legacyDecommissioning
  });

  return {
    migrationStatus: status,
    performance: performanceData,
    userDistribution,
    systemHealth,
    legacyDecommissioning,
    recommendations: getFullProductionRecommendations(status, performanceData)
  };
}

/**
 * Calcul santé système global
 */
function calculateSystemHealth(status: any, performance: any): number {
  let healthScore = 0;

  // Complétude migration (40%)
  healthScore += (status.overallPercentage / 100) * 40;

  // Stabilité système (30%)
  if (performance.circuitBreaker) healthScore += 15;
  if (performance.adaptiveThrottling) healthScore += 15;

  // Préparation performance (20%)
  if (performance.isEnabled) healthScore += 10;
  if (performance.rollbackOnPerformance) healthScore += 10;

  // Capacités urgence (10%)
  if (performance.rollbackTimeout < 5000) healthScore += 10;

  return Math.round(healthScore);
}

/**
 * Recommandations pour production FULL
 */
function getFullProductionRecommendations(status: any, performance: any) {
  const recommendations = [];

  if (status.full === 5) {
    recommendations.push('🎉 MIGRATION COMPLETE - 100% utilisateurs sur XState');
    recommendations.push('🌍 Prêt pour Intégration B4 Environment');
  }

  if (status.full > 0 && status.full < 5) {
    recommendations.push(`⚡ Migration FULL partielle (${status.full}/5 régions) - continuer déploiement`);
  }

  if (status.partial > 0 && status.full === 0) {
    recommendations.push('🚀 Prêt à migrer de PARTIAL vers FULL (25% → 100%)');
  }

  if (!performance.circuitBreaker) {
    recommendations.push('🔴 CRITIQUE: Activer circuit breaker pour production FULL');
  }

  if (!performance.rollbackOnPerformance) {
    recommendations.push('⚠️ Activer rollback performance pour sécurité');
  }

  if (status.off > 0) {
    recommendations.push(`🗑️ Décommissionner ${status.off} régions legacy`);
  }

  return recommendations;
}

/**
 * Rollback urgence partiel (FULL → PARTIAL)
 */
export function emergencyPartialRollback(reason: string = 'Rollback urgence') {
  console.log(`🚨 URGENCE: Rollback de FULL vers PARTIAL - ${reason}`);

  // Rollback vers PARTIAL pour sécurité
  lightingFeatureFlags.setRegionMigrationLevel('baseLighting', MigrationLevel.PARTIAL);

  // Activer monitoring urgence
  lightingFeatureFlags.enableGlobalFeature('debugMode');
  lightingFeatureFlags.enableGlobalFeature('verboseLogging');

  const status = lightingFeatureFlags.getMigrationStatus();
  console.log('📊 Statut après rollback urgence partiel:', status);

  return {
    success: status.partial > 0 && status.full === 0,
    status,
    reason,
    timestamp: new Date().toISOString()
  };
}

/**
 * Réactivation urgence legacy (tout vers OFF)
 */
export function emergencyLegacyReactivation(reason: string = 'Échec système critique') {
  console.log(`🚨 URGENCE CRITIQUE: Réactivation tous systèmes legacy - ${reason}`);

  lightingFeatureFlags.emergencyRollback(reason);
  const success = true; // emergencyRollback retourne void

  const status = lightingFeatureFlags.getMigrationStatus();
  console.log('📊 Statut après réactivation urgence legacy:', status);

  return {
    success: success && status.off === 5,
    status,
    reason,
    timestamp: new Date().toISOString()
  };
}

/**
 * Diagnostic complet système pour production FULL
 */
export function getFullSystemDiagnostic() {
  const flags = lightingFeatureFlags.getFlags();
  const status = lightingFeatureFlags.getMigrationStatus();
  const monitoring = getFullProductionMonitoring();

  return {
    timestamp: new Date().toISOString(),
    systemStatus: {
      migrationLevel: status.overallPercentage,
      healthScore: monitoring.systemHealth.overallHealth,
      criticalIssues: monitoring.recommendations.filter(r => r.includes('🔴')),
      warnings: monitoring.recommendations.filter(r => r.includes('⚠️'))
    },
    featureFlags: flags,
    migrationStatus: status,
    performance: monitoring.performance,
    userDistribution: monitoring.userDistribution,
    legacyDecommissioning: monitoring.legacyDecommissioning,
    recommendations: monitoring.recommendations
  };
}

// Export functions to window for browser testing
if (typeof window !== 'undefined') {
  (window as any).lightingFeatureFlagsTest = {
    // Fonctions Phase 3-4
    activateCanary: activateBaseLightingCanary,
    migrateToPartial: migrateBaseLightingToPartial,
    rollbackCanary: rollbackBaseLightingCanary,
    emergencyRollback: testEmergencyRollback,
    getStatus: getFeatureFlagsStatus,
    getProductionMonitoring: getProductionMonitoring,

    // Fonctions Phase 5 migration FULL
    migrateToFull: migrateBaseLightingToFull,
    validateFullMigrationReadiness: validateFullMigrationReadiness,
    getFullProductionMonitoring: getFullProductionMonitoring,

    // Procédures urgence
    emergencyPartialRollback: emergencyPartialRollback,
    emergencyLegacyReactivation: emergencyLegacyReactivation,
    getFullSystemDiagnostic: getFullSystemDiagnostic,

    // Accès flags core
    flags: lightingFeatureFlags
  };
}