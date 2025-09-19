// 🔍 DebugManager V5 - Debug minimal pour bloom effects
export class DebugManager {
  constructor(animationController) {
    this.controller = animationController;
  }

  // Health check simplifié
  healthCheck() {
    const issues = [];
    
    if (!this.controller.mixer) issues.push("Mixer non initialisé");
    if (!this.controller.model) issues.push("Modèle non chargé");
    if (this.controller.actions.size === 0) issues.push("Aucune animation chargée");
    if (this.controller.poseActions.size === 0) issues.push("Aucune animation de pose détectée");
    
    const invalidWeights = Array.from(this.controller.actions.values()).filter(action => {
      const weight = action.getEffectiveWeight();
      return isNaN(weight) || weight < 0 || weight > 1;
    });
    
    if (invalidWeights.length > 0) {
      issues.push(`${invalidWeights.length} actions avec poids invalides`);
    }
    
    return {
      isHealthy: issues.length === 0,
      issues: issues
    };
  }

  // Stats simplifiées pour UI
  getDetailedStats() {
    return {
      system: {
        fadeDuration: this.controller.fadeDuration,
        timeScale: this.controller.timeScale,
        isTransitioning: this.controller.isTransitioning
      },
      animations: {
        total: this.controller.actions.size,
        permanent: {
          count: this.controller.permanentActions.size,
          running: Array.from(this.controller.permanentActions.values()).filter(a => a.isRunning()).length
        },
        poses: {
          count: this.controller.poseActions.size,
          running: Array.from(this.controller.poseActions.values()).filter(a => a.isRunning()).length
        },
        rings: {
          count: this.controller.ringActions.size,
          running: Array.from(this.controller.ringActions.values()).filter(a => a.isRunning()).length
        }
      },
      performance: {
        mixerTime: this.controller.mixer ? this.controller.mixer.time.toFixed(2) : 0,
        activeActions: Array.from(this.controller.actions.values()).filter(a => a.isRunning()).length
      }
    };
  }

  // Diagnostic complet (sur demande uniquement)
  runFullDiagnostic() {
    const diagnostic = {
      timestamp: Date.now(),
      health: this.healthCheck(),
      detailed: this.getDetailedStats(),
      memory: {
        actionsCount: this.controller.actions.size,
        permanentCount: this.controller.permanentActions.size,
        poseCount: this.controller.poseActions.size,
        ringCount: this.controller.ringActions.size
      }
    };
    
    return diagnostic;
  }

  // Debug sur demande (plus d'auto-debug)
  forceDebugReport() {
    console.log("\n🔍 === RAPPORT DEBUG V5 ===");
    
    const stats = this.getDetailedStats();
    console.log("📊 Stats animations:", stats.animations);
    console.log("⚙️ Système:", stats.system);
    console.log("📈 Performance:", stats.performance);
    
    const health = this.healthCheck();
    if (!health.isHealthy) {
      console.warn("⚠️ Problèmes détectés:", health.issues);
    } else {
      console.log("✅ Système sain");
    }
    
    console.log("=== FIN RAPPORT DEBUG V5 ===\n");
    
    return this.runFullDiagnostic();
  }
}