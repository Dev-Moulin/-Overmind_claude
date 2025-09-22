// 🔄 Migration Progressive FrameSchedulerMachine - Atome D1
// Stratégie de coexistence et migration depuis l'ancien système

import { frameSchedulerMachine } from './machine';
import { interpret } from 'xstate';

// 🎯 Feature Flag pour Migration Progressive
export const FRAME_SCHEDULER_FEATURE_FLAGS = {
  USE_XSTATE_FRAME_SCHEDULER: process.env.REACT_APP_USE_XSTATE_SCHEDULER === 'true',
  ENABLE_DUAL_MODE: process.env.REACT_APP_SCHEDULER_DUAL_MODE === 'true',
  ENABLE_PERFORMANCE_COMPARISON: process.env.REACT_APP_SCHEDULER_COMPARE === 'true',
  AUTO_FALLBACK: process.env.REACT_APP_SCHEDULER_AUTO_FALLBACK !== 'false',
  DEBUG_MIGRATION: process.env.NODE_ENV === 'development'
};

// 🔄 Gestionnaire de Migration
export class FrameSchedulerMigration {
  private xstateService: any = null;
  private legacySystem: any = null;
  private currentMode: string = 'legacy';
  private performanceComparison: any = null;
  private migrationStartTime: number | null = null;
  private fallbackCount: number = 0;
  private maxFallbackAttempts: number = 3;
  private legacyBackup: any = null;

  constructor() {
    this.initializeMigration();
  }

  // 🚀 Initialisation de la Migration
  initializeMigration() {
    if (FRAME_SCHEDULER_FEATURE_FLAGS.DEBUG_MIGRATION) {
      console.log('🔄 FrameScheduler Migration: Initializing...', {
        useXState: FRAME_SCHEDULER_FEATURE_FLAGS.USE_XSTATE_FRAME_SCHEDULER,
        dualMode: FRAME_SCHEDULER_FEATURE_FLAGS.ENABLE_DUAL_MODE,
        comparePerformance: FRAME_SCHEDULER_FEATURE_FLAGS.ENABLE_PERFORMANCE_COMPARISON
      });
    }

    // 📊 Détection du système legacy existant
    this.detectLegacySystem();

    // 🎯 Configuration du mode selon les feature flags
    if (FRAME_SCHEDULER_FEATURE_FLAGS.ENABLE_DUAL_MODE) {
      this.enableDualMode();
    } else if (FRAME_SCHEDULER_FEATURE_FLAGS.USE_XSTATE_FRAME_SCHEDULER) {
      this.enableXStateMode();
    } else {
      this.enableLegacyMode();
    }

    // 📊 Setup comparaison de performance si activée
    if (FRAME_SCHEDULER_FEATURE_FLAGS.ENABLE_PERFORMANCE_COMPARISON) {
      this.setupPerformanceComparison();
    }
  }

  // 🔍 Détection du Système Legacy
  detectLegacySystem() {
    try {
      // Recherche des patterns de l'ancien système
      const legacyIndicators = [
        () => (window as any).animationControllerRef,
        () => (window as any).eyeRotationRef,
        () => (window as any).particleSystemRef,
        () => typeof window.requestAnimationFrame !== 'undefined'
      ];

      const detectedIndicators = legacyIndicators.filter(check => {
        try {
          return check();
        } catch {
          return false;
        }
      });

      this.legacySystem = {
        detected: detectedIndicators.length > 0,
        indicators: detectedIndicators.length,
        hasRAF: typeof window.requestAnimationFrame !== 'undefined',
        hasControllers: !!((window as any).animationControllerRef || (window as any).eyeRotationRef)
      };

      if (FRAME_SCHEDULER_FEATURE_FLAGS.DEBUG_MIGRATION) {
        console.log('🔍 Legacy system detection:', this.legacySystem);
      }

    } catch (error) {
      console.warn('⚠️ Error detecting legacy system:', error);
      this.legacySystem = { detected: false, error: error.message };
    }
  }

  // 🎯 Mode XState Pur
  enableXStateMode() {
    if (FRAME_SCHEDULER_FEATURE_FLAGS.DEBUG_MIGRATION) {
      console.log('🎯 Enabling XState-only mode');
    }

    try {
      this.xstateService = interpret(frameSchedulerMachine as any, {
        devTools: FRAME_SCHEDULER_FEATURE_FLAGS.DEBUG_MIGRATION
      });

      this.xstateService.onTransition((state) => {
        if (FRAME_SCHEDULER_FEATURE_FLAGS.DEBUG_MIGRATION) {
          console.log('🔄 XState transition:', state.value);
        }

        // 🚨 Auto-fallback en cas d'erreur critique
        if (state.matches('error') && FRAME_SCHEDULER_FEATURE_FLAGS.AUTO_FALLBACK) {
          this.handleXStateFailure(state);
        }
      });

      this.xstateService.start();
      this.currentMode = 'xstate';
      this.migrationStartTime = performance.now();

      // 🚀 Démarrage automatique
      this.xstateService.send('START_LOOP');

      console.log('✅ XState FrameScheduler activated');

    } catch (error) {
      console.error('❌ Failed to enable XState mode:', error);
      this.fallbackToLegacy(error);
    }
  }

  // 📊 Mode Dual (XState + Legacy en parallèle)
  enableDualMode() {
    if (FRAME_SCHEDULER_FEATURE_FLAGS.DEBUG_MIGRATION) {
      console.log('📊 Enabling dual mode (XState + Legacy)');
    }

    try {
      // 🎯 Initialisation XState
      this.enableXStateMode();

      // 📊 Préservation du système legacy en parallèle
      this.preserveLegacySystem();

      this.currentMode = 'dual';

      console.log('✅ Dual mode activated');

    } catch (error) {
      console.error('❌ Failed to enable dual mode:', error);
      this.fallbackToLegacy(error);
    }
  }

  // 🔄 Mode Legacy Pur
  enableLegacyMode() {
    if (FRAME_SCHEDULER_FEATURE_FLAGS.DEBUG_MIGRATION) {
      console.log('🔄 Maintaining legacy mode');
    }

    this.currentMode = 'legacy';
    // Le système legacy continue de fonctionner normalement
    console.log('✅ Legacy mode maintained');
  }

  // 🛡️ Préservation du Système Legacy
  preserveLegacySystem() {
    try {
      // Sauvegarde des références importantes
      this.legacyBackup = {
        animationController: (window as any).animationControllerRef,
        eyeRotation: (window as any).eyeRotationRef,
        particleSystem: (window as any).particleSystemRef,
        pbrLighting: (window as any).pbrLightingController,
        bloom: (window as any).bloomSystem
      };

      if (FRAME_SCHEDULER_FEATURE_FLAGS.DEBUG_MIGRATION) {
        console.log('🛡️ Legacy system preserved:', Object.keys(this.legacyBackup));
      }

    } catch (error) {
      console.warn('⚠️ Error preserving legacy system:', error);
    }
  }

  // 🚨 Gestion d'Échec XState
  handleXStateFailure(errorState) {
    this.fallbackCount++;

    console.error(`🚨 XState failure #${this.fallbackCount}:`, {
      state: errorState.value,
      error: errorState.context.error,
      attempts: this.fallbackCount,
      maxAttempts: this.maxFallbackAttempts
    });

    if (this.fallbackCount >= this.maxFallbackAttempts) {
      console.error('🚨 Maximum fallback attempts reached, switching to legacy mode');
      this.fallbackToLegacy(new Error('Maximum XState failure attempts reached'));
    } else {
      // Tentative de récupération
      setTimeout(() => {
        if (this.xstateService) {
          this.xstateService.send('START_LOOP');
        }
      }, 1000 * this.fallbackCount); // Backoff progressif
    }
  }

  // 🔄 Fallback vers Legacy
  fallbackToLegacy(error) {
    console.warn('🔄 Falling back to legacy system:', error.message);

    try {
      // 🛑 Arrêt du service XState
      if (this.xstateService) {
        this.xstateService.stop();
        this.xstateService = null;
      }

      // 🔄 Restauration du système legacy
      this.restoreLegacySystem();

      this.currentMode = 'legacy';

      // 📊 Télémétrie de fallback
      this.reportFallback(error);

      console.log('✅ Successfully fell back to legacy system');

    } catch (fallbackError) {
      console.error('❌ Critical: Fallback to legacy failed:', fallbackError);
    }
  }

  // 🔄 Restauration du Système Legacy
  restoreLegacySystem() {
    if (this.legacyBackup) {
      try {
        // Restauration des références
        Object.entries(this.legacyBackup).forEach(([key, value]) => {
          if (value) {
            window[key] = value;
          }
        });

        if (FRAME_SCHEDULER_FEATURE_FLAGS.DEBUG_MIGRATION) {
          console.log('🔄 Legacy system restored');
        }

      } catch (error) {
        console.error('❌ Error restoring legacy system:', error);
      }
    }
  }

  // 📊 Setup Comparaison de Performance
  setupPerformanceComparison() {
    this.performanceComparison = {
      xstate: {
        frameCount: 0,
        totalFrameTime: 0,
        errors: 0,
        recoveries: 0
      },
      legacy: {
        frameCount: 0,
        totalFrameTime: 0,
        errors: 0
      },
      startTime: performance.now()
    };

    // 📊 Monitoring périodique
    setInterval(() => {
      this.reportPerformanceComparison();
    }, 10000); // Rapport toutes les 10 secondes

    if (FRAME_SCHEDULER_FEATURE_FLAGS.DEBUG_MIGRATION) {
      console.log('📊 Performance comparison enabled');
    }
  }

  // 📊 Rapport de Comparaison
  reportPerformanceComparison() {
    if (!this.performanceComparison) return;

    const duration = performance.now() - this.performanceComparison.startTime;
    const xstate = this.performanceComparison.xstate;
    const legacy = this.performanceComparison.legacy;

    const report = {
      duration: duration / 1000, // en secondes
      xstate: {
        fps: xstate.frameCount / (duration / 1000),
        avgFrameTime: xstate.frameCount > 0 ? xstate.totalFrameTime / xstate.frameCount : 0,
        errorRate: xstate.errors / Math.max(xstate.frameCount, 1),
        recoveryRate: xstate.recoveries / Math.max(xstate.errors, 1)
      },
      legacy: {
        fps: legacy.frameCount / (duration / 1000),
        avgFrameTime: legacy.frameCount > 0 ? legacy.totalFrameTime / legacy.frameCount : 0,
        errorRate: legacy.errors / Math.max(legacy.frameCount, 1)
      }
    };

    console.log('📊 Performance Comparison Report:', report);

    // 🎯 Recommandation automatique
    if (report.xstate.fps > report.legacy.fps * 1.1 && report.xstate.errorRate < 0.01) {
      console.log('✅ Recommendation: XState system performing better');
    } else if (report.legacy.fps > report.xstate.fps * 1.1 || report.xstate.errorRate > 0.05) {
      console.log('⚠️ Recommendation: Consider staying with legacy system');
    }
  }

  // 📡 Rapport de Fallback
  reportFallback(error) {
    const report = {
      timestamp: new Date().toISOString(),
      error: error.message,
      fallbackCount: this.fallbackCount,
      migrationDuration: this.migrationStartTime ? performance.now() - this.migrationStartTime : null,
      legacySystemAvailable: !!this.legacySystem?.detected,
      userAgent: navigator.userAgent
    };

    console.warn('📡 Fallback Report:', report);

    // Ici on pourrait envoyer à un service de télémétrie
    // sendTelemetry('frameScheduler.fallback', report);
  }

  // 🔍 API Publique pour Monitoring
  getStatus() {
    return {
      currentMode: this.currentMode,
      xstateActive: !!this.xstateService && this.xstateService.status === 1,
      legacyDetected: this.legacySystem?.detected,
      fallbackCount: this.fallbackCount,
      migrationDuration: this.migrationStartTime ? performance.now() - this.migrationStartTime : null,
      performanceComparison: this.performanceComparison
    };
  }

  // 🎮 Contrôles Manuels
  switchToXState() {
    if (this.currentMode !== 'xstate') {
      console.log('🎯 Manual switch to XState mode');
      this.enableXStateMode();
    }
  }

  switchToLegacy() {
    if (this.currentMode !== 'legacy') {
      console.log('🔄 Manual switch to legacy mode');
      this.fallbackToLegacy(new Error('Manual switch to legacy'));
    }
  }

  // 🧹 Nettoyage
  cleanup() {
    if (this.xstateService) {
      this.xstateService.stop();
    }

    if (FRAME_SCHEDULER_FEATURE_FLAGS.DEBUG_MIGRATION) {
      console.log('🧹 FrameScheduler migration cleaned up');
    }
  }
}

// 🌍 Instance Globale
let migrationManager = null;

export const getFrameSchedulerMigration = () => {
  if (!migrationManager) {
    migrationManager = new FrameSchedulerMigration();
  }
  return migrationManager;
};

// 🎯 Helper pour Hook React
export const useMigrationStatus = () => {
  const manager = getFrameSchedulerMigration();
  return manager.getStatus();
};