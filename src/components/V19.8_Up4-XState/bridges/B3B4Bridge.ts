/**
 * 🌉 Bridge B3 Lighting ↔ B4 Environment - Pont de synchronisation complet
 * Synchronisation bidirectionnelle entre B3 LightingMachine et B4 EnvironmentMachine
 */

import type { LightingContext, LightingEvent } from '../machines/lighting/types';
import type { EnvironmentContext, EnvironmentEvent } from '../machines/environment/environmentTypes';
import type { VisualEffectsContext } from '../machines/visualEffects/types';

// ====================================
// INTERFACES BRIDGE B3 ↔ B4
// ====================================

/**
 * État du pont B3-B4
 */
export interface B3B4BridgeState {
  connected: boolean;
  syncEnabled: boolean;
  lastSyncTime: number;
  syncErrors: number;
  bidirectionalMode: boolean;
}

/**
 * Configuration du pont
 */
export interface B3B4BridgeConfig {
  // Synchronisation
  autoSync: boolean;
  syncInterval: number; // ms
  maxRetries: number;

  // Mapping des données
  lightingContribution: number; // Contribution B3 vers B4 HDR (0.0-1.0)
  environmentFeedback: number;  // Feedback B4 vers B3 intensity (0.0-1.0)

  // Optimisation
  enableThrottling: boolean;
  throttleDelay: number; // ms
  enableBatching: boolean;
}

/**
 * Données de synchronisation B3 → B4
 */
export interface B3ToB4SyncData {
  // Éclairage de base
  ambientIntensity: number;
  directionalIntensity: number;
  shadowsEnabled: boolean;

  // HDR Boost
  hdrBoostEnabled: boolean;
  hdrMultiplier: number;
  toneMapping: string;

  // Performance
  performanceLevel: 'low' | 'medium' | 'high';
  adaptiveEnabled: boolean;
}

/**
 * Données de synchronisation B4 → B3
 */
export interface B4ToB3SyncData {
  // Environnement HDR
  hdrIntensity: number;
  environmentReady: boolean;
  backgroundEnabled: boolean;

  // Performance
  renderTime: number;
  memoryPressure: number;
  qualityLevel: 'auto' | 'high' | 'medium' | 'low';

  // Cache
  cacheHitRate: number;
  memoryUsage: number;
}

// ====================================
// CLASSE PRINCIPALE BRIDGE B3-B4
// ====================================

export class B3B4Bridge {
  private state: B3B4BridgeState;
  private config: B3B4BridgeConfig;
  private throttleTimeout: NodeJS.Timeout | null = null;
  private batchQueue: Array<() => void> = [];
  private batchTimeout: NodeJS.Timeout | null = null;

  // Callbacks pour communication avec les machines
  private b3UpdateCallback?: (event: LightingEvent) => void;
  private b4UpdateCallback?: (event: EnvironmentEvent) => void;

  constructor(config: Partial<B3B4BridgeConfig> = {}) {
    this.config = {
      autoSync: true,
      syncInterval: 1000,
      maxRetries: 3,
      lightingContribution: 0.8,
      environmentFeedback: 0.6,
      enableThrottling: true,
      throttleDelay: 100,
      enableBatching: true,
      ...config
    };

    this.state = {
      connected: false,
      syncEnabled: false,
      lastSyncTime: 0,
      syncErrors: 0,
      bidirectionalMode: true
    };

    console.log('🌉 B3B4Bridge initialisé avec config:', this.config);
  }

  // ====================================
  // CONNEXION ET ÉTAT
  // ====================================

  /**
   * Connecter le bridge aux machines B3 et B4
   */
  connect(
    b3UpdateCallback: (event: LightingEvent) => void,
    b4UpdateCallback: (event: EnvironmentEvent) => void
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.b3UpdateCallback = b3UpdateCallback;
        this.b4UpdateCallback = b4UpdateCallback;

        this.state.connected = true;
        this.state.syncEnabled = this.config.autoSync;
        this.state.lastSyncTime = Date.now();

        console.log('🌉 B3B4Bridge connecté - Pont B3 ↔ B4 actif');
        resolve();
      } catch (error) {
        this.state.syncErrors++;
        console.error('🌉 Erreur connexion B3B4Bridge:', error);
        reject(error);
      }
    });
  }

  /**
   * Déconnecter le bridge
   */
  disconnect(): void {
    this.state.connected = false;
    this.state.syncEnabled = false;

    if (this.throttleTimeout) {
      clearTimeout(this.throttleTimeout);
      this.throttleTimeout = null;
    }

    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
      this.batchTimeout = null;
    }

    this.batchQueue = [];
    console.log('🌉 B3B4Bridge déconnecté');
  }

  /**
   * État actuel du bridge
   */
  getState(): B3B4BridgeState {
    return { ...this.state };
  }

  // ====================================
  // SYNCHRONISATION B3 → B4
  // ====================================

  /**
   * Synchroniser données B3 Lighting vers B4 Environment
   */
  syncB3ToB4(lightingContext: LightingContext): void {
    if (!this.state.connected || !this.state.syncEnabled) {
      return;
    }

    const syncData: B3ToB4SyncData = this.extractB3Data(lightingContext);

    if (this.config.enableThrottling) {
      this.throttledB3ToB4Sync(syncData);
    } else {
      this.executeB3ToB4Sync(syncData);
    }
  }

  /**
   * Extraction des données B3 pour synchronisation
   */
  private extractB3Data(lightingContext: LightingContext): B3ToB4SyncData {
    return {
      ambientIntensity: lightingContext.baseLighting.ambientIntensity,
      directionalIntensity: lightingContext.baseLighting.directionalIntensity,
      shadowsEnabled: lightingContext.baseLighting.shadowsEnabled,
      hdrBoostEnabled: lightingContext.hdrBoost.enabled,
      hdrMultiplier: lightingContext.hdrBoost.multiplier,
      toneMapping: lightingContext.hdrBoost.toneMapping,
      performanceLevel: this.mapPerformanceLevel(lightingContext.performance.fps),
      adaptiveEnabled: lightingContext.performance.adaptiveThrottling
    };
  }

  /**
   * Synchronisation throttled B3 → B4
   */
  private throttledB3ToB4Sync(syncData: B3ToB4SyncData): void {
    if (this.throttleTimeout) {
      clearTimeout(this.throttleTimeout);
    }

    this.throttleTimeout = setTimeout(() => {
      this.executeB3ToB4Sync(syncData);
    }, this.config.throttleDelay);
  }

  /**
   * Exécution de la synchronisation B3 → B4
   */
  private executeB3ToB4Sync(syncData: B3ToB4SyncData): void {
    try {
      // Calculer intensité HDR basée sur B3
      const hdrIntensity = this.calculateHDRIntensity(syncData);

      // Événement B4: Mise à jour intensité HDR
      this.sendToB4({
        type: 'HDR.SET_INTENSITY',
        intensity: hdrIntensity
      });

      // Événement B4: Synchronisation qualité
      if (syncData.performanceLevel !== 'high') {
        this.sendToB4({
          type: 'QUALITY.SET_LEVEL',
          level: syncData.performanceLevel
        });
      }

      // Événement B4: Bridge sync complet
      this.sendToB4({
        type: 'BRIDGE.SYNC',
        lightingData: {
          intensity: syncData.ambientIntensity * this.config.lightingContribution,
          hdrBoost: syncData.hdrBoostEnabled,
          shadows: syncData.shadowsEnabled
        }
      });

      this.state.lastSyncTime = Date.now();
      console.log('🌉 B3 → B4 sync réussi:', syncData);

    } catch (error) {
      this.state.syncErrors++;
      console.error('🌉 Erreur sync B3 → B4:', error);
    }
  }

  // ====================================
  // SYNCHRONISATION B4 → B3
  // ====================================

  /**
   * Synchroniser données B4 Environment vers B3 Lighting
   */
  syncB4ToB3(environmentContext: EnvironmentContext): void {
    if (!this.state.connected || !this.state.syncEnabled || !this.state.bidirectionalMode) {
      return;
    }

    const syncData: B4ToB3SyncData = this.extractB4Data(environmentContext);

    if (this.config.enableBatching) {
      this.batchedB4ToB3Sync(syncData);
    } else {
      this.executeB4ToB3Sync(syncData);
    }
  }

  /**
   * Extraction des données B4 pour synchronisation
   */
  private extractB4Data(environmentContext: EnvironmentContext): B4ToB3SyncData {
    return {
      hdrIntensity: environmentContext.hdr.intensity,
      environmentReady: environmentContext.systemState.ready,
      backgroundEnabled: environmentContext.hdr.background,
      renderTime: environmentContext.performance.renderTime,
      memoryPressure: environmentContext.performance.memoryPressure,
      qualityLevel: environmentContext.quality.current,
      cacheHitRate: environmentContext.performance.cacheHitRate,
      memoryUsage: environmentContext.cache.memoryUsage
    };
  }

  /**
   * Synchronisation batchée B4 → B3
   */
  private batchedB4ToB3Sync(syncData: B4ToB3SyncData): void {
    this.batchQueue.push(() => this.executeB4ToB3Sync(syncData));

    if (!this.batchTimeout) {
      this.batchTimeout = setTimeout(() => {
        this.flushBatchQueue();
      }, 50); // Batch toutes les 50ms
    }
  }

  /**
   * Vider la queue batch B4 → B3
   */
  private flushBatchQueue(): void {
    const operations = [...this.batchQueue];
    this.batchQueue = [];
    this.batchTimeout = null;

    // Exécuter toutes les opérations batchées
    operations.forEach(op => op());
  }

  /**
   * Exécution de la synchronisation B4 → B3
   */
  private executeB4ToB3Sync(syncData: B4ToB3SyncData): void {
    try {
      // Feedback HDR vers intensité lighting B3
      if (syncData.environmentReady && syncData.hdrIntensity > 0) {
        const lightingIntensity = syncData.hdrIntensity * this.config.environmentFeedback;

        this.sendToB3({
          type: 'UPDATE_BASE_INTENSITY',
          ambient: lightingIntensity,
          directional: lightingIntensity * 1.2
        });
      }

      // Ajustement performance B3 basé sur B4
      if (syncData.renderTime > 20) { // > 20ms = problème performance
        this.sendToB3({
          type: 'ENABLE_BASE_LIGHTING', // Réduire à base seulement
        });
      }

      console.log('🌉 B4 → B3 sync réussi:', syncData);

    } catch (error) {
      this.state.syncErrors++;
      console.error('🌉 Erreur sync B4 → B3:', error);
    }
  }

  // ====================================
  // UTILITAIRES
  // ====================================

  /**
   * Calcul intensité HDR basée sur B3
   */
  private calculateHDRIntensity(b3Data: B3ToB4SyncData): number {
    let intensity = b3Data.ambientIntensity * this.config.lightingContribution;

    // Boost si HDR activé en B3
    if (b3Data.hdrBoostEnabled) {
      intensity *= b3Data.hdrMultiplier;
    }

    // Ajustement performance
    if (b3Data.performanceLevel === 'low') {
      intensity *= 0.7;
    } else if (b3Data.performanceLevel === 'high') {
      intensity *= 1.3;
    }

    return Math.max(0.1, Math.min(5.0, intensity));
  }

  /**
   * Mapping niveau performance
   */
  private mapPerformanceLevel(fps: number): 'low' | 'medium' | 'high' {
    if (fps < 30) return 'low';
    if (fps < 50) return 'medium';
    return 'high';
  }

  /**
   * Envoyer événement vers B3
   */
  private sendToB3(event: LightingEvent): void {
    if (this.b3UpdateCallback) {
      this.b3UpdateCallback(event);
    }
  }

  /**
   * Envoyer événement vers B4
   */
  private sendToB4(event: EnvironmentEvent): void {
    if (this.b4UpdateCallback) {
      this.b4UpdateCallback(event);
    }
  }

  // ====================================
  // CONFIGURATION DYNAMIQUE
  // ====================================

  /**
   * Mettre à jour configuration
   */
  updateConfig(newConfig: Partial<B3B4BridgeConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log('🌉 B3B4Bridge config mise à jour:', this.config);
  }

  /**
   * Activer/désactiver mode bidirectionnel
   */
  setBidirectionalMode(enabled: boolean): void {
    this.state.bidirectionalMode = enabled;
    console.log(`🌉 Mode bidirectionnel ${enabled ? 'activé' : 'désactivé'}`);
  }

  /**
   * Activer/désactiver synchronisation
   */
  setSyncEnabled(enabled: boolean): void {
    this.state.syncEnabled = enabled;
    console.log(`🌉 Synchronisation ${enabled ? 'activée' : 'désactivée'}`);
  }
}

// ====================================
// INSTANCE SINGLETON
// ====================================

// Instance singleton du bridge B3-B4
export const b3b4Bridge = new B3B4Bridge();

// ====================================
// HELPER FUNCTIONS
// ====================================

/**
 * Initialiser le bridge avec contexte VisualEffects
 */
export const initializeB3B4Bridge = (
  context: VisualEffectsContext,
  sendB3Event: (event: LightingEvent) => void,
  sendB4Event: (event: EnvironmentEvent) => void
): Promise<void> => {
  console.log('🌉 Initialisation du bridge B3-B4...');

  return b3b4Bridge.connect(sendB3Event, sendB4Event).then(() => {
    console.log('🌉 Bridge B3-B4 initialisé avec succès');

    // Synchronisation initiale
    b3b4Bridge.syncB3ToB4(context.lighting);
    b3b4Bridge.syncB4ToB3(context.environment);
  });
};

/**
 * Auto-sync périodique B3 ↔ B4
 */
export const startAutoSync = (
  getB3Context: () => LightingContext,
  getB4Context: () => EnvironmentContext,
  interval: number = 2000
): NodeJS.Timeout => {
  console.log(`🌉 Auto-sync B3 ↔ B4 démarré (${interval}ms)`);

  return setInterval(() => {
    const b3Context = getB3Context();
    const b4Context = getB4Context();

    b3b4Bridge.syncB3ToB4(b3Context);
    b3b4Bridge.syncB4ToB3(b4Context);
  }, interval);
};

export default B3B4Bridge;