/**
 * 🌍 B4 Environment Machine Types
 * Types et interfaces pour système Environment HDR
 */

import * as THREE from 'three';

// ====================================
// TYPES ENVIRONNEMENT
// ====================================

export type EnvironmentMapType = 'hdr' | 'exr' | 'cube' | 'equirectangular';

export type QualityLevel = 'auto' | 'high' | 'medium' | 'low';

export type EnvironmentState = 'idle' | 'loading' | 'ready' | 'error';

export type LightingBridgeState = 'disconnected' | 'connecting' | 'connected' | 'synchronized';

// ====================================
// INTERFACES PRINCIPALES
// ====================================

/**
 * Configuration HDR Environment
 */
export interface HDRConfig {
  currentMap: string | null;
  intensity: number;
  rotation: number;
  background: boolean;
  environmentIntensity: number;
  format: EnvironmentMapType;
}

/**
 * Bridge vers B3 Lighting
 */
export interface LightingBridge {
  connected: boolean;
  lightingIntensity: number;
  ambientContribution: number;
  directionalShadows: boolean;
  hdrBoost: boolean;
  syncEnabled: boolean;
}

/**
 * Gestion qualité adaptive
 */
export interface QualityConfig {
  current: QualityLevel;
  lodLevel: number;
  adaptiveEnabled: boolean;
  targetFPS: number;
  minFPS: number;
  maxFPS: number;
  adaptiveThreshold: number;
}

/**
 * Cache HDR intelligent
 */
export interface EnvironmentCache {
  hdrMaps: Map<string, THREE.Texture>;
  preloadQueue: string[];
  memoryUsage: number;
  maxCacheSize: number;
  compressionEnabled: boolean;
  lruTracking: Map<string, number>;
}

/**
 * Monitoring performance Environment
 */
export interface EnvironmentPerformance {
  hdrLoadTime: number;
  renderTime: number;
  frameTime: number;
  loadTime: number;
  fps: number;
  memoryPressure: number;
  memoryUsage: number;
  adaptiveHistory: number[];
  cacheHitRate: number;
  qualityAdjustments: number;
}

// ====================================
// CONTEXTE PRINCIPAL
// ====================================

/**
 * Contexte complet EnvironmentMachine
 */
export interface EnvironmentContext {
  // Configuration HDR
  hdr: HDRConfig;

  // Bridge vers B3 Lighting
  lightingBridge: LightingBridge;

  // Gestion qualité
  quality: QualityConfig;

  // Cache système
  cache: EnvironmentCache;

  // Performance monitoring
  performance: EnvironmentPerformance;

  // État système
  systemState: {
    loading: boolean;
    error: string | null;
    ready: boolean;
    lastUpdate: number;
  };

  // Intégration Three.js
  threeJS: {
    renderer: THREE.WebGLRenderer | null;
    scene: THREE.Scene | null;
    pmremGenerator: THREE.PMREMGenerator | null;
    currentEnvironment: THREE.Texture | null;
    envMap: THREE.Texture | null;
  };
}

// ====================================
// ÉVÉNEMENTS ENVIRONMENT
// ====================================

export type EnvironmentEvent =
  // HDR Loading
  | { type: 'HDR.LOAD'; path: string; config?: Partial<HDRConfig> }
  | { type: 'HDR.UNLOAD' }
  | { type: 'HDR.SET_INTENSITY'; intensity: number }
  | { type: 'HDR.SET_ROTATION'; rotation: number }
  | { type: 'HDR.TOGGLE_BACKGROUND' }

  // Quality Management
  | { type: 'QUALITY.SET_LEVEL'; level: QualityLevel }
  | { type: 'QUALITY.ENABLE_ADAPTIVE' }
  | { type: 'QUALITY.DISABLE_ADAPTIVE' }
  | { type: 'QUALITY.AUTO_ADJUST'; targetFPS: number }

  // Bridge B3 Lighting
  | { type: 'BRIDGE.CONNECT' }
  | { type: 'BRIDGE.DISCONNECT' }
  | { type: 'BRIDGE.SYNC'; lightingData: any }
  | { type: 'BRIDGE.UPDATE_CONTRIBUTION'; ambient: number }

  // Cache Management
  | { type: 'CACHE.PRELOAD'; paths: string[] }
  | { type: 'CACHE.CLEAR' }
  | { type: 'CACHE.OPTIMIZE' }
  | { type: 'CACHE.SET_SIZE'; maxSize: number }

  // System Events
  | { type: 'SYSTEM.INIT'; renderer: THREE.WebGLRenderer; scene: THREE.Scene }
  | { type: 'SYSTEM.UPDATE_PERFORMANCE'; metrics: Partial<EnvironmentPerformance> }
  | { type: 'SYSTEM.ERROR'; error: string }
  | { type: 'SYSTEM.DISPOSE' };

// ====================================
// TYPES SUPPLÉMENTAIRES
// ====================================

/**
 * Types pour services HDR
 */
export interface HDRLoadResult {
  texture: THREE.Texture;
  memoryUsage: number;
  loadTime: number;
}

// EnvironmentMapType déjà défini plus haut

/**
 * Options pour hook useEnvironment
 */
export interface UseEnvironmentOptions extends EnvironmentOptions {
  // Systèmes Three.js
  renderer?: THREE.WebGLRenderer;
  scene?: THREE.Scene;
  camera?: THREE.Camera;

  // Configuration
  autoInit?: boolean;
  enablePerformanceMonitoring?: boolean;
  debugMode?: boolean;

  // Callbacks
  onStateChange?: (state: any) => void;
  onError?: (error: Error) => void;
  onHDRLoaded?: (path: string, texture: THREE.Texture) => void;
  onQualityChange?: (level: QualityLevel) => void;
}

// ====================================
// CONFIGURATION PRESETS
// ====================================

/**
 * Presets Environment prédéfinis
 */
export interface EnvironmentPreset {
  name: string;
  hdrPath: string;
  intensity: number;
  rotation: number;
  background: boolean;
  quality: QualityLevel;
  lightingContribution: number;
}

export const ENVIRONMENT_PRESETS: Record<string, EnvironmentPreset> = {
  STUDIO: {
    name: 'Studio',
    hdrPath: '/hdri/studio.hdr',
    intensity: 1.0,
    rotation: 0,
    background: false,
    quality: 'high',
    lightingContribution: 0.8
  },

  OUTDOOR: {
    name: 'Outdoor',
    hdrPath: '/hdri/outdoor_day.hdr',
    intensity: 1.2,
    rotation: 0,
    background: true,
    quality: 'high',
    lightingContribution: 1.0
  },

  NIGHT: {
    name: 'Night',
    hdrPath: '/hdri/night_city.hdr',
    intensity: 0.6,
    rotation: 180,
    background: true,
    quality: 'medium',
    lightingContribution: 0.4
  },

  PERFORMANCE: {
    name: 'Performance',
    hdrPath: '/hdri/simple.hdr',
    intensity: 0.8,
    rotation: 0,
    background: false,
    quality: 'low',
    lightingContribution: 0.6
  }
};

// ====================================
// UTILITAIRES TYPES
// ====================================

/**
 * Options d'initialisation Environment
 */
export interface EnvironmentOptions {
  autoLoad?: boolean;
  defaultPreset?: string;
  enableCache?: boolean;
  enableAdaptiveQuality?: boolean;
  maxCacheSize?: number;
  targetFPS?: number;
  enableBridge?: boolean;
}

/**
 * Résultat chargement HDR
 */
export interface HDRLoadResult {
  success: boolean;
  texture: THREE.Texture | null;
  loadTime: number;
  memoryUsage: number;
  error?: string;
}

/**
 * Interface Hook Environment pour React
 */
export interface EnvironmentHook {
  // État
  state: any;
  context: EnvironmentContext;

  // Actions HDR
  loadHDR: (path: string, config?: Partial<HDRConfig>) => void;
  unloadHDR: () => void;
  setIntensity: (intensity: number) => void;
  setRotation: (rotation: number) => void;

  // Gestion qualité
  setQualityLevel: (level: QualityLevel) => void;
  enableAdaptiveQuality: () => void;
  disableAdaptiveQuality: () => void;

  // Bridge B3
  connectBridge: () => void;
  disconnectBridge: () => void;

  // Presets
  applyPreset: (presetName: string) => void;

  // État système
  isReady: boolean;
  isLoading: boolean;
  hasError: boolean;
}

export default EnvironmentContext;