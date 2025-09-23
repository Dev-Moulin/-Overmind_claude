/**
 * 🔦 Types pour LightingMachine - Atome B3
 * Architecture hybride basée sur recherches Perplexity + Claude IA
 */

import type { LegacySystemsBridge } from '../../bridges/LegacySystemsBridge';
import type { LightingEventBus } from './lightingEventBus';

// ============================================
// FEATURE FLAGS MULTI-NIVEAUX (Claude IA)
// ============================================

export enum MigrationLevel {
  OFF = 'legacy-only',           // 0% XState
  CANARY = 'canary-5-percent',   // 5% XState
  PARTIAL = 'partial-25-percent', // 25% XState
  FULL = 'full-xstate'           // 100% XState
}

export interface MigrationState {
  level: MigrationLevel;
  rollbackCapability: boolean;
  dualWriteActive: boolean;
  performanceThreshold: number; // ms avant fallback
  rollbackOnPerformanceDegradation?: boolean;
}

// ============================================
// LIGHTING PRESETS
// ============================================

export enum LightingPreset {
  DEFAULT = 'DEFAULT',
  BRIGHT = 'BRIGHT',
  SUBTLE = 'SUBTLE',
  ATMOSPHERIC = 'ATMOSPHERIC',
  STUDIO = 'STUDIO',
  STUDIO_PLUS = 'STUDIO_PLUS',
  STUDIO_PRO = 'STUDIO_PRO',
  STUDIO_PRO_PLUS = 'STUDIO_PRO_PLUS',
  CINEMATIC = 'CINEMATIC'
}

export interface PresetConfig {
  ambient: {
    intensity: number;
    color?: number;
  };
  directional: {
    intensity: number;
    position?: [number, number, number];
    castShadow?: boolean;
  };
  advanced?: {
    enabled: boolean;
    spotIntensity?: number;
    dirIntensity?: number;
  };
  areaLights?: {
    enabled: boolean;
    intensity?: number;
  };
  lightProbes?: {
    enabled: boolean;
    intensity?: number;
  };
  hdrBoost?: {
    enabled: boolean;
    multiplier?: number;
  };
}

// ============================================
// SUBSYSTEMS STATE (5 régions parallèles)
// ============================================

export interface BaseLightingState {
  enabled: boolean;
  ambientIntensity: number;
  directionalIntensity: number;
  shadowsEnabled: boolean;
}

export interface AdvancedLightingState {
  enabled: boolean;
  spotLights: {
    count: number;
    intensity: number;
  };
  directionalLights: {
    count: number;
    intensity: number;
  };
}

export interface AreaLightsState {
  enabled: boolean;
  lights: Array<{
    id: string;
    intensity: number;
    width: number;
    height: number;
  }>;
}

export interface LightProbesState {
  enabled: boolean;
  intensity: number;
  environmentSync: boolean;
  lastUpdateTime: number;
}

export interface HDRBoostState {
  enabled: boolean;
  multiplier: number;
  metallicEnhancement: boolean;
  toneMapping: string;
}

// ============================================
// PERFORMANCE MONITORING (Consensus)
// ============================================

export interface PerformanceMetrics {
  frameTime: number;
  avgFrameTime: number;
  maxFrameTime: number;
  fps: number;
  batchEfficiency: number;
  fallbackCount: number;
  adaptiveThrottling: boolean;
}

export interface PerformanceConfig {
  targetFrameTime: number;       // 16.67ms pour 60fps
  alertThreshold: number;        // 20ms
  circuitBreakerThreshold: number; // 54fps (90%)
  batchWindowMs: number;         // 100-150ms
  maxBatchSize: number;          // Limite batch
}

// ============================================
// LAZY LOADING CONFIGURATION
// ============================================

export interface LazySubsystemConfig {
  maxLights: number;
  resolution?: number;
  distanceCulling?: number;
  requestIdleCallback?: boolean;
}

export interface LazyLightingState {
  initialized: boolean;
  loading: boolean;
  error?: string;
  config: LazySubsystemConfig;
}

// ============================================
// LIGHTING CONTEXT PRINCIPAL
// ============================================

export interface LightingContext {
  // État des 5 sous-systèmes
  baseLighting: BaseLightingState;
  advancedLighting: AdvancedLightingState;
  areaLights: AreaLightsState;
  lightProbes: LightProbesState;
  hdrBoost: HDRBoostState;

  // Lazy loading (consensus)
  lazySubsystems: {
    pointLights?: LazyLightingState;
    shadowMaps?: LazyLightingState;
    volumetric?: LazyLightingState;
  };

  // Performance monitoring (consensus)
  performance: PerformanceMetrics;
  performanceConfig: PerformanceConfig;

  // Migration state (Claude IA)
  migrationState: MigrationState;

  // Event coordination (Perplexity)
  eventBus?: LightingEventBus;

  // Legacy bridge
  legacyBridge?: LegacySystemsBridge;

  // Current preset
  currentPreset: LightingPreset;

  // Batch queue (Perplexity)
  batchQueue: Array<{
    type: string;
    params: any;
    timestamp: number;
  }>;
}

// ============================================
// EVENTS
// ============================================

export type LightingEvent =
  // Preset events
  | { type: 'APPLY_PRESET'; preset: LightingPreset }
  | { type: 'PRESET_APPLIED'; preset: LightingPreset }

  // Base lighting events
  | { type: 'ENABLE_BASE_LIGHTING' }
  | { type: 'DISABLE_BASE_LIGHTING' }
  | { type: 'UPDATE_BASE_INTENSITY'; ambient: number; directional: number }

  // Advanced lighting events
  | { type: 'ENABLE_ADVANCED_LIGHTING' }
  | { type: 'DISABLE_ADVANCED_LIGHTING' }
  | { type: 'UPDATE_ADVANCED_INTENSITIES'; spotIntensity: number; dirIntensity: number }

  // Area lights events
  | { type: 'ENABLE_AREA_LIGHTS' }
  | { type: 'DISABLE_AREA_LIGHTS' }
  | { type: 'UPDATE_AREA_INTENSITY'; intensity: number }

  // Light probes events
  | { type: 'ENABLE_LIGHT_PROBES' }
  | { type: 'DISABLE_LIGHT_PROBES' }
  | { type: 'UPDATE_PROBES_FROM_ENV' }
  | { type: 'UPDATE_PROBE_INTENSITY'; intensity: number }

  // HDR boost events
  | { type: 'ENABLE_HDR_BOOST' }
  | { type: 'DISABLE_HDR_BOOST' }
  | { type: 'UPDATE_HDR_MULTIPLIER'; multiplier: number }
  | { type: 'ENHANCE_METALLIC_MATERIALS' }

  // Performance events
  | { type: 'PERFORMANCE_ALERT'; metrics: PerformanceMetrics }
  | { type: 'ENABLE_ADAPTIVE_THROTTLING' }
  | { type: 'DISABLE_ADAPTIVE_THROTTLING' }
  | { type: 'CIRCUIT_BREAKER_TRIGGERED'; subsystem: string }

  // Migration events
  | { type: 'SET_MIGRATION_LEVEL'; level: MigrationLevel }
  | { type: 'ROLLBACK_REQUESTED'; reason: string }
  | { type: 'MIGRATION_SUCCESS'; subsystem: string }

  // Batch events
  | { type: 'BATCH_UPDATE'; updates: any[] }
  | { type: 'FLUSH_BATCH' }

  // Orchestration events
  | { type: 'ORCHESTRATE_REGIONS'; command: string; targetRegions: string[] }
  | { type: 'SYNC_ALL_REGIONS' };

// ============================================
// SERVICES INTERFACE
// ============================================

export interface LightingServices {
  // Base lighting
  initBaseLighting: (context: LightingContext) => Promise<void>;
  updateBaseLighting: (context: LightingContext, event: any) => Promise<void>;

  // Advanced lighting
  initAdvancedLighting: (context: LightingContext) => Promise<void>;
  updateAdvancedLighting: (context: LightingContext, event: any) => Promise<void>;

  // Area lights
  initAreaLights: (context: LightingContext) => Promise<void>;
  updateAreaLights: (context: LightingContext, event: any) => Promise<void>;

  // Light probes
  initLightProbes: (context: LightingContext) => Promise<void>;
  syncLightProbesWithEnvironment: (context: LightingContext) => Promise<void>;

  // HDR boost
  initHDRBoost: (context: LightingContext) => Promise<void>;
  applyHDRBoost: (context: LightingContext, event: any) => Promise<void>;

  // Performance monitoring
  performanceMonitorService: (context: LightingContext) => () => void;

  // Batch processing
  batchProcessorService: (context: LightingContext) => () => void;

  // Orchestration
  lightingOrchestratorService: (context: LightingContext) => () => void;
}

// ============================================
// GUARDS
// ============================================

export interface LightingGuards {
  canEnableSubsystem: (context: LightingContext, event: any) => boolean;
  isPerformanceAcceptable: (context: LightingContext) => boolean;
  shouldFallbackToLegacy: (context: LightingContext) => boolean;
  isMigrationLevelActive: (context: LightingContext, level: MigrationLevel) => boolean;
  hasCapacity: (context: LightingContext, subsystem: string) => boolean;
}

// ============================================
// ACTIONS
// ============================================

export interface LightingActions {
  // Logging
  logLightingChange: (context: LightingContext, event: any) => void;
  logPerformanceWarning: (context: LightingContext, event: any) => void;

  // State updates
  updateLightingIntensity: (context: LightingContext, event: any) => void;
  applyPresetConfiguration: (context: LightingContext, event: any) => void;

  // Performance
  recordPerformanceMetric: (context: LightingContext, event: any) => void;
  triggerCircuitBreaker: (context: LightingContext, event: any) => void;

  // Batch operations
  queueBatchUpdate: (context: LightingContext, event: any) => void;
  flushBatchQueue: (context: LightingContext) => void;

  // Migration
  updateMigrationLevel: (context: LightingContext, event: any) => void;
  performRollback: (context: LightingContext, event: any) => void;
}

// ============================================
// CONFIGURATION
// ============================================

export interface LightingMachineOptions {
  enableEventBus?: boolean;
  enablePerformanceMonitoring?: boolean;
  enableLazyLoading?: boolean;
  migrationLevel?: MigrationLevel;
  performanceConfig?: Partial<PerformanceConfig>;
  presets?: Record<LightingPreset, PresetConfig>;
  legacyBridge?: LegacySystemsBridge;
}

// ============================================
// EXPORTS UTILS
// ============================================

export const DEFAULT_PERFORMANCE_CONFIG: PerformanceConfig = {
  targetFrameTime: 16.67,
  alertThreshold: 20,
  circuitBreakerThreshold: 54,
  batchWindowMs: 100,
  maxBatchSize: 50
};

export const DEFAULT_MIGRATION_STATE: MigrationState = {
  level: MigrationLevel.OFF,
  rollbackCapability: true,
  dualWriteActive: false,
  performanceThreshold: 20
};