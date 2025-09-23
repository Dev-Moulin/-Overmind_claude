/**
 * 🚩 Feature Flags Multi-niveaux pour LightingMachine Migration
 * Basé sur recherche Claude IA : Migration progressive avec Feature Flags granulaires
 */

import { MigrationLevel } from './types';

export interface RegionFeatureFlags {
  baseLighting: MigrationLevel;
  advancedLighting: MigrationLevel;
  areaLights: MigrationLevel;
  lightProbes: MigrationLevel;
  hdrBoost: MigrationLevel;
}

export interface GlobalFeatureFlags {
  // Migration par région
  regions: RegionFeatureFlags;

  // Features globales
  eventBusEnabled: boolean;
  performanceMonitoringEnabled: boolean;
  adaptiveThrottlingEnabled: boolean;
  circuitBreakerEnabled: boolean;

  // Rollback configuration
  rollbackTimeoutMs: number;
  rollbackOnPerformanceDegradation: boolean;

  // A/B Testing
  abTestingEnabled: boolean;
  abTestPercentage: number;

  // Debug & Development
  debugMode: boolean;
  verboseLogging: boolean;
  performanceTracing: boolean;
}

/**
 * Manager pour Feature Flags avec persistence et validation
 */
export class LightingFeatureFlagsManager {
  private static instance: LightingFeatureFlagsManager;
  private flags: GlobalFeatureFlags;
  private listeners: Array<(flags: GlobalFeatureFlags) => void> = [];

  private constructor() {
    this.flags = this.getDefaultFlags();
    this.loadFromStorage();
  }

  static getInstance(): LightingFeatureFlagsManager {
    if (!LightingFeatureFlagsManager.instance) {
      LightingFeatureFlagsManager.instance = new LightingFeatureFlagsManager();
    }
    return LightingFeatureFlagsManager.instance;
  }

  /**
   * Flags par défaut - Configuration sécurisée
   */
  private getDefaultFlags(): GlobalFeatureFlags {
    return {
      regions: {
        baseLighting: MigrationLevel.OFF,
        advancedLighting: MigrationLevel.OFF,
        areaLights: MigrationLevel.OFF,
        lightProbes: MigrationLevel.OFF,
        hdrBoost: MigrationLevel.OFF
      },
      eventBusEnabled: false,
      performanceMonitoringEnabled: true,
      adaptiveThrottlingEnabled: true,
      circuitBreakerEnabled: true,
      rollbackTimeoutMs: 2000,
      rollbackOnPerformanceDegradation: true,
      abTestingEnabled: false,
      abTestPercentage: 5,
      debugMode: false,
      verboseLogging: false,
      performanceTracing: false
    };
  }

  /**
   * Charger flags depuis localStorage
   */
  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem('lightingFeatureFlags');
      if (stored) {
        const parsedFlags = JSON.parse(stored);
        this.flags = { ...this.flags, ...parsedFlags };
        console.log('🚩 FeatureFlags: Loaded from storage', this.flags);
      }
    } catch (error) {
      console.warn('⚠️ FeatureFlags: Error loading from storage, using defaults');
    }
  }

  /**
   * Sauvegarder flags dans localStorage
   */
  private saveToStorage(): void {
    try {
      localStorage.setItem('lightingFeatureFlags', JSON.stringify(this.flags));
      console.log('💾 FeatureFlags: Saved to storage');
    } catch (error) {
      console.error('❌ FeatureFlags: Error saving to storage:', error);
    }
  }

  /**
   * Get current flags
   */
  getFlags(): GlobalFeatureFlags {
    return { ...this.flags };
  }

  /**
   * Get migration level pour une région spécifique
   */
  getRegionMigrationLevel(region: keyof RegionFeatureFlags): MigrationLevel {
    return this.flags.regions[region];
  }

  /**
   * Check if région est enabled pour XState
   */
  isRegionXStateEnabled(region: keyof RegionFeatureFlags): boolean {
    const level = this.getRegionMigrationLevel(region);
    return level !== MigrationLevel.OFF;
  }

  /**
   * Check if région est en Full XState
   */
  isRegionFullXState(region: keyof RegionFeatureFlags): boolean {
    return this.getRegionMigrationLevel(region) === MigrationLevel.FULL;
  }

  /**
   * Get pourcentage XState pour une région
   */
  getRegionXStatePercentage(region: keyof RegionFeatureFlags): number {
    switch (this.getRegionMigrationLevel(region)) {
      case MigrationLevel.OFF:
        return 0;
      case MigrationLevel.CANARY:
        return 5;
      case MigrationLevel.PARTIAL:
        return 25;
      case MigrationLevel.FULL:
        return 100;
      default:
        return 0;
    }
  }

  /**
   * Set migration level pour une région
   */
  setRegionMigrationLevel(region: keyof RegionFeatureFlags, level: MigrationLevel): void {
    console.log(`🚩 FeatureFlags: Setting ${region} to ${level}`);

    this.flags.regions[region] = level;
    this.saveToStorage();
    this.notifyListeners();
  }

  /**
   * Upgrade région au niveau suivant
   */
  upgradeRegion(region: keyof RegionFeatureFlags): boolean {
    const currentLevel = this.getRegionMigrationLevel(region);
    let nextLevel: MigrationLevel;

    switch (currentLevel) {
      case MigrationLevel.OFF:
        nextLevel = MigrationLevel.CANARY;
        break;
      case MigrationLevel.CANARY:
        nextLevel = MigrationLevel.PARTIAL;
        break;
      case MigrationLevel.PARTIAL:
        nextLevel = MigrationLevel.FULL;
        break;
      case MigrationLevel.FULL:
        console.log(`🚩 FeatureFlags: ${region} already at FULL level`);
        return false;
      default:
        return false;
    }

    this.setRegionMigrationLevel(region, nextLevel);
    console.log(`⬆️ FeatureFlags: Upgraded ${region} from ${currentLevel} to ${nextLevel}`);
    return true;
  }

  /**
   * Rollback région au niveau précédent
   */
  rollbackRegion(region: keyof RegionFeatureFlags): boolean {
    const currentLevel = this.getRegionMigrationLevel(region);
    let previousLevel: MigrationLevel;

    switch (currentLevel) {
      case MigrationLevel.FULL:
        previousLevel = MigrationLevel.PARTIAL;
        break;
      case MigrationLevel.PARTIAL:
        previousLevel = MigrationLevel.CANARY;
        break;
      case MigrationLevel.CANARY:
        previousLevel = MigrationLevel.OFF;
        break;
      case MigrationLevel.OFF:
        console.log(`🚩 FeatureFlags: ${region} already at OFF level`);
        return false;
      default:
        return false;
    }

    this.setRegionMigrationLevel(region, previousLevel);
    console.log(`⬇️ FeatureFlags: Rolled back ${region} from ${currentLevel} to ${previousLevel}`);
    return true;
  }

  /**
   * Enable feature globale
   */
  enableGlobalFeature(feature: keyof Omit<GlobalFeatureFlags, 'regions'>): void {
    if (typeof this.flags[feature] === 'boolean') {
      (this.flags[feature] as boolean) = true;
      this.saveToStorage();
      this.notifyListeners();
      console.log(`🚩 FeatureFlags: Enabled ${feature}`);
    }
  }

  /**
   * Disable feature globale
   */
  disableGlobalFeature(feature: keyof Omit<GlobalFeatureFlags, 'regions'>): void {
    if (typeof this.flags[feature] === 'boolean') {
      (this.flags[feature] as boolean) = false;
      this.saveToStorage();
      this.notifyListeners();
      console.log(`🚩 FeatureFlags: Disabled ${feature}`);
    }
  }

  /**
   * Emergency rollback - Toutes les régions à OFF
   */
  emergencyRollback(reason: string): void {
    console.error(`🚨 FeatureFlags: EMERGENCY ROLLBACK - ${reason}`);

    const regions = Object.keys(this.flags.regions) as Array<keyof RegionFeatureFlags>;
    regions.forEach(region => {
      this.flags.regions[region] = MigrationLevel.OFF;
    });

    this.saveToStorage();
    this.notifyListeners();

    // Log pour monitoring
    console.error('🚨 All lighting regions rolled back to legacy mode');
  }

  /**
   * Get migration status overview
   */
  getMigrationStatus() {
    const regions = Object.keys(this.flags.regions) as Array<keyof RegionFeatureFlags>;
    const status = {
      totalRegions: regions.length,
      off: 0,
      canary: 0,
      partial: 0,
      full: 0,
      overallPercentage: 0
    };

    let totalPercentage = 0;

    regions.forEach(region => {
      const level = this.getRegionMigrationLevel(region);
      const percentage = this.getRegionXStatePercentage(region);

      switch (level) {
        case MigrationLevel.OFF:
          status.off++;
          break;
        case MigrationLevel.CANARY:
          status.canary++;
          break;
        case MigrationLevel.PARTIAL:
          status.partial++;
          break;
        case MigrationLevel.FULL:
          status.full++;
          break;
      }

      totalPercentage += percentage;
    });

    status.overallPercentage = Math.round(totalPercentage / regions.length);

    return status;
  }

  /**
   * Should use XState based on A/B testing
   */
  shouldUseXStateForUser(): boolean {
    if (!this.flags.abTestingEnabled) {
      return true; // Follow migration levels
    }

    // Simple hash-based A/B testing
    const userId = this.getUserId();
    const hash = this.simpleHash(userId);
    const percentage = hash % 100;

    return percentage < this.flags.abTestPercentage;
  }

  /**
   * Subscribe to flag changes
   */
  subscribe(callback: (flags: GlobalFeatureFlags) => void): () => void {
    this.listeners.push(callback);

    return () => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * Notify all listeners of flag changes
   */
  private notifyListeners(): void {
    this.listeners.forEach(callback => {
      try {
        callback(this.getFlags());
      } catch (error) {
        console.error('❌ FeatureFlags: Error notifying listener:', error);
      }
    });
  }

  /**
   * Get or generate user ID for A/B testing
   */
  private getUserId(): string {
    let userId = localStorage.getItem('lightingUserId');
    if (!userId) {
      userId = Math.random().toString(36).substring(2, 15);
      localStorage.setItem('lightingUserId', userId);
    }
    return userId;
  }

  /**
   * Simple hash function for A/B testing
   */
  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  /**
   * Export flags pour debugging
   */
  exportFlags(): string {
    return JSON.stringify(this.flags, null, 2);
  }

  /**
   * Import flags depuis JSON
   */
  importFlags(flagsJson: string): boolean {
    try {
      const newFlags = JSON.parse(flagsJson);
      this.flags = { ...this.getDefaultFlags(), ...newFlags };
      this.saveToStorage();
      this.notifyListeners();
      console.log('✅ FeatureFlags: Imported successfully');
      return true;
    } catch (error) {
      console.error('❌ FeatureFlags: Error importing flags:', error);
      return false;
    }
  }
}

// Export singleton instance
export const lightingFeatureFlags = LightingFeatureFlagsManager.getInstance();

// Helper hooks pour React components
export const useLightingFeatureFlags = () => {
  const manager = LightingFeatureFlagsManager.getInstance();
  return {
    flags: manager.getFlags(),
    isRegionXStateEnabled: (region: keyof RegionFeatureFlags) => manager.isRegionXStateEnabled(region),
    setRegionLevel: (region: keyof RegionFeatureFlags, level: MigrationLevel) =>
      manager.setRegionMigrationLevel(region, level),
    upgradeRegion: (region: keyof RegionFeatureFlags) => manager.upgradeRegion(region),
    rollbackRegion: (region: keyof RegionFeatureFlags) => manager.rollbackRegion(region),
    getMigrationStatus: () => manager.getMigrationStatus(),
    emergencyRollback: (reason: string) => manager.emergencyRollback(reason)
  };
};