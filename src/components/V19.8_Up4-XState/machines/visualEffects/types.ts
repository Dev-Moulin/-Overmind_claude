// 🎨 VisualEffectsMachine Types - Architecture Unifiée Bloom + PBR
// Types TypeScript pour la machine XState des effets visuels

import * as THREE from 'three';
import type { LegacySystemsBridge } from '../../bridges/LegacySystemsBridge';
import type { LightingContext, LightingPreset } from '../lighting/types';
import type {
  EnvironmentContext as B4EnvironmentContext,
  EnvironmentEvent as B4EnvironmentEvent
} from '../environment/environmentTypes';

// ============================================
// TYPES PARTAGÉS
// ============================================

// 🎭 Types de groupes (partagés entre Bloom et PBR)
export type VisualGroupType = 'iris' | 'eyeRings' | 'revealRings' | 'magicRings' | 'arms';

// 🔒 Presets de sécurité (partagés)
export type SecurityPreset = 'SAFE' | 'DANGER' | 'WARNING' | 'SCANNING' | 'NORMAL';

// 📦 Registry d'objets THREE.js
export interface ObjectsRegistry {
  iris: Map<string, THREE.Mesh>;
  eyeRings: Map<string, THREE.Mesh>;
  revealRings: Map<string, THREE.Mesh>;
  magicRings: Map<string, THREE.Mesh>;
  arms: Map<string, THREE.Mesh>;
}

// ============================================
// CONTEXTE BLOOM
// ============================================

export interface BloomGlobalConfig {
  enabled: boolean;
  threshold: number;      // 0.0 - 1.0
  strength: number;       // 0.0 - 5.0
  radius: number;         // 0.0 - 2.0
  exposure: number;       // 0.1 - 10.0
}

export interface BloomGroupConfig {
  threshold: number;
  strength: number;
  radius: number;
  emissiveColor: number;      // Hex color
  emissiveIntensity: number;  // 0.0 - 10.0
}

export interface BloomContext {
  global: BloomGlobalConfig;
  groups: Record<VisualGroupType, BloomGroupConfig>;
}

// ============================================
// CONTEXTE PBR
// ============================================

export interface PBRGlobalConfig {
  enabled: boolean;
  metalness: number;          // 0.0 - 1.0
  roughness: number;          // 0.0 - 1.0
  envMapIntensity: number;    // 0.0 - 5.0
  clearcoat?: number;         // 0.0 - 1.0
  clearcoatRoughness?: number; // 0.0 - 1.0
  transmission?: number;      // 0.0 - 1.0
  ior?: number;              // 1.0 - 2.333
}

export interface PBRGroupConfig {
  metalness: number;
  roughness: number;
  clearcoat?: number;
  transmission?: number;
}

export interface PBRContext {
  global: PBRGlobalConfig;
  groups: Record<VisualGroupType, PBRGroupConfig>;
}

// ============================================
// CONTEXTE ENVIRONMENT
// ============================================

// ✅ B4 Environment Context (importé depuis environment/types)
// L'interface EnvironmentContext est maintenant la version B4 complète

// ============================================
// CONTEXTE SECURITY
// ============================================

export interface SecurityConfig {
  color: number;          // Hex color
  intensity: number;      // 0.0 - 10.0
  bloomPreset?: Partial<BloomGlobalConfig>;
  pbrPreset?: Partial<PBRGlobalConfig>;
}

// 🔐 B5 Security Context - Architecture Actor Model complète
export interface SecurityContext {
  // Legacy visual presets (compatibility)
  currentPreset: SecurityPreset | null;
  isTransitioning: boolean;
  presets: Record<SecurityPreset, SecurityConfig>;

  // ✅ NOUVEAU: B5 Security Actor Model
  securityMachine: {
    isActive: boolean;
    securityLevel: 'normal' | 'scanning' | 'alert' | 'lockdown';
    threatScore: number;
    currentThreats: Array<{
      id: string;
      type: string;
      severity: string;
      timestamp: number;
    }>;

    // Bridge connections
    bridgeConnections: {
      b3Lighting: boolean;
      b4Environment: boolean;
      visualEffects: boolean;
    };

    // Performance monitoring
    circuitBreakerState: 'closed' | 'open' | 'half-open';
    performanceMode: 'normal' | 'reduced' | 'minimal';

    // Visual alerts
    activeAlerts: Array<{
      pattern: 'flash' | 'pulse' | 'rotate' | 'distortion' | 'glitch' | 'scanner';
      color: string;
      intensity: number;
    }>;
  };
}

// ============================================
// CONTEXTE PRINCIPAL
// ============================================

export interface VisualEffectsContext {
  // Registre partagé d'objets
  objectsRegistry: ObjectsRegistry;

  // Contextes des régions
  bloom: BloomContext;
  pbr: PBRContext;
  environment: B4EnvironmentContext;
  security: SecurityContext;

  // ✅ NOUVEAU: Région lighting (B3)
  lighting: LightingContext;

  // Systèmes externes
  renderer: THREE.WebGLRenderer | null;
  scene: THREE.Scene | null;
  camera: THREE.Camera | null;

  // ✅ AJOUT: Bridge pour connexion legacy systems
  legacyBridge?: LegacySystemsBridge;

  // Performance
  performance: {
    fps: number;
    frameTime: number;
    updateCount: number;
    lastUpdateTime: number;
  };
}

// ============================================
// ÉVÉNEMENTS
// ============================================

// 🌟 Événements Bloom
export type BloomEvent =
  | { type: 'BLOOM.ENABLE' }
  | { type: 'BLOOM.DISABLE' }
  | { type: 'BLOOM.UPDATE_GLOBAL'; threshold?: number; strength?: number; radius?: number; exposure?: number }
  | { type: 'BLOOM.UPDATE_GROUP'; group: VisualGroupType; threshold?: number; strength?: number; emissiveColor?: number; emissiveIntensity?: number };

// 🎨 Événements PBR
export type PBREvent =
  | { type: 'PBR.ENABLE' }
  | { type: 'PBR.DISABLE' }
  | { type: 'PBR.UPDATE_GLOBAL'; metalness?: number; roughness?: number; envMapIntensity?: number }
  | { type: 'PBR.UPDATE_GROUP'; group: VisualGroupType; metalness?: number; roughness?: number };

// 🌍 Événements Environment (B4 - importés depuis environment/types)
// Les événements Environment utilisent maintenant la définition B4 complète

// 🔒 Événements Security - B5 Architecture complète
export type SecurityEvent =
  // Legacy compatibility events
  | { type: 'SECURITY.SET_PRESET'; preset: SecurityPreset }
  | { type: 'SECURITY.TRANSITION_START' }
  | { type: 'SECURITY.TRANSITION_COMPLETE' }

  // ✅ NOUVEAU: B5 Security Actor Model events
  | { type: 'B5_SECURITY.ACTIVATE' }
  | { type: 'B5_SECURITY.DEACTIVATE' }
  | { type: 'B5_SECURITY.SET_LEVEL'; level: 'normal' | 'scanning' | 'alert' | 'lockdown' }
  | { type: 'B5_SECURITY.ESCALATE' }
  | { type: 'B5_SECURITY.DEESCALATE' }
  | { type: 'B5_SECURITY.THREAT_DETECTED'; threat: { score: number; threats: any[] } }
  | { type: 'B5_SECURITY.THREAT_CLEARED'; threatId: string }
  | { type: 'B5_SECURITY.TRIGGER_ALERT'; pattern: 'flash' | 'pulse' | 'rotate' | 'distortion' | 'glitch' | 'scanner'; config?: any }
  | { type: 'B5_SECURITY.STOP_ALERTS' }
  | { type: 'B5_SECURITY.PERFORMANCE_DEGRADED'; metrics: any }
  | { type: 'B5_SECURITY.PERFORMANCE_RECOVERED' }
  | { type: 'B5_SECURITY.BRIDGE_CONNECT'; system: 'b3-lighting' | 'b4-environment' | 'visual-effects' }
  | { type: 'B5_SECURITY.BRIDGE_DISCONNECT'; system: 'b3-lighting' | 'b4-environment' | 'visual-effects' };

// 🔦 Événements Lighting (B3)
export type LightingEvent =
  | { type: 'LIGHTING.ENABLE_BASE' }
  | { type: 'LIGHTING.DISABLE_BASE' }
  | { type: 'LIGHTING.APPLY_PRESET'; preset: LightingPreset }
  | { type: 'LIGHTING.UPDATE_INTENSITY'; ambient: number; directional: number }
  | { type: 'LIGHTING.ENABLE_ADVANCED' }
  | { type: 'LIGHTING.DISABLE_ADVANCED' }
  | { type: 'LIGHTING.ENABLE_AREA' }
  | { type: 'LIGHTING.ENABLE_PROBES' }
  | { type: 'LIGHTING.ENABLE_HDR_BOOST' };

// 📦 Événements Objects
export type ObjectEvent =
  | { type: 'OBJECTS.REGISTER'; group: VisualGroupType; objects: Map<string, THREE.Mesh> }
  | { type: 'OBJECTS.UNREGISTER'; group: VisualGroupType; objectIds: string[] }
  | { type: 'OBJECTS.DETECT'; model: THREE.Group | THREE.Mesh }
  | { type: 'OBJECTS.CLEAR'; group?: VisualGroupType };

// 🔧 Événements System
export type SystemEvent =
  | { type: 'SYSTEM.INIT'; renderer: THREE.WebGLRenderer; scene: THREE.Scene; camera: THREE.Camera }
  | { type: 'SYSTEM.UPDATE_CONTEXT'; renderer?: THREE.WebGLRenderer | null; scene?: THREE.Scene | null; camera?: THREE.Camera | null }
  | { type: 'SYSTEM.UPDATE_PERFORMANCE'; fps: number; frameTime: number }
  | { type: 'SYSTEM.SYNC' }
  | { type: 'SYSTEM.DISPOSE' }
  | { type: 'SYSTEM.ERROR'; error: Error };

// Legacy Environment Events (compatibilité)
export type LegacyEnvironmentEvent =
  | { type: 'ENV.LOAD_HDR'; path: string; config?: any }
  | { type: 'ENV.UNLOAD_HDR' }
  | { type: 'ENV.SET_INTENSITY'; intensity: number };

// Type union de tous les événements
export type VisualEffectsEvent =
  | BloomEvent
  | PBREvent
  | B4EnvironmentEvent
  | SecurityEvent
  | LightingEvent
  | ObjectEvent
  | SystemEvent
  | LegacyEnvironmentEvent;

// ============================================
// ÉTATS MACHINE
// ============================================

// États pour chaque région
export interface VisualEffectsStates {
  bloom: 'disabled' | 'enabling' | 'enabled' | 'disabling' | 'error';
  pbr: 'idle' | 'initializing' | 'active' | 'updating' | 'error';
  environment: 'unloaded' | 'loading' | 'processing' | 'ready' | 'error';
  security: 'normal' | 'transitioning' | 'applied';
  lighting: 'uninitialized' | 'initializing' | 'partial' | 'active' | 'error';
}

// ============================================
// HOOK RETURN TYPE
// ============================================

export interface VisualEffectsHook {
  // État et contexte
  state: any;
  context: VisualEffectsContext;
  send: (event: VisualEffectsEvent) => void;

  // Contrôles Bloom
  bloom: {
    enable: () => void;
    disable: () => void;
    updateGlobal: (params: Partial<BloomGlobalConfig>) => void;
    updateGroup: (group: VisualGroupType, params: Partial<BloomGroupConfig>) => void;
    isEnabled: boolean;
  };

  // Contrôles PBR
  pbr: {
    enable: () => void;
    disable: () => void;
    updateGlobal: (params: Partial<PBRGlobalConfig>) => void;
    updateGroup: (group: VisualGroupType, params: Partial<PBRGroupConfig>) => void;
    isActive: boolean;
  };

  // Contrôles Environment (B4)
  environment: {
    loadHDR: (path: string, config?: any) => void;
    unloadHDR: () => void;
    setIntensity: (intensity: number) => void;
    setRotation: (rotation: number) => void;
    toggleBackground: () => void;
    setQualityLevel: (level: 'auto' | 'high' | 'medium' | 'low') => void;
    enableAdaptiveQuality: () => void;
    connectBridge: () => void;
    disconnectBridge: () => void;
    applyPreset: (presetName: string) => void;
    isReady: boolean;
    isLoading: boolean;
    hasError: boolean;
  };

  // Contrôles Security
  security: {
    setPreset: (preset: SecurityPreset) => void;
    currentPreset: SecurityPreset | null;
    isTransitioning: boolean;
  };

  // ✅ NOUVEAU: Contrôles Lighting (B3)
  lighting: {
    enableBase: () => void;
    disableBase: () => void;
    applyPreset: (preset: LightingPreset) => void;
    updateIntensity: (ambient: number, directional: number) => void;
    enableAdvanced: () => void;
    enableArea: () => void;
    enableProbes: () => void;
    enableHDRBoost: () => void;
    currentPreset: LightingPreset | null;
    isActive: boolean;
  };

  // Gestion objets
  objects: {
    register: (group: VisualGroupType, objects: Map<string, THREE.Mesh>) => void;
    unregister: (group: VisualGroupType, objectIds: string[]) => void;
    detect: (model: THREE.Group | THREE.Mesh) => void;
    clear: (group?: VisualGroupType) => void;
    counts: Record<VisualGroupType, number>;
  };

  // Utilitaires
  performance: VisualEffectsContext['performance'];
  dispose: () => void;
}

// ============================================
// EVENT MAPS (Type Safety)
// ============================================

export enum BloomEventType {
  ENABLE = 'BLOOM.ENABLE',
  DISABLE = 'BLOOM.DISABLE',
  UPDATE_GLOBAL = 'BLOOM.UPDATE_GLOBAL',
  UPDATE_GROUP = 'BLOOM.UPDATE_GROUP'
}

export enum PBREventType {
  ENABLE = 'PBR.ENABLE',
  DISABLE = 'PBR.DISABLE',
  UPDATE_GLOBAL = 'PBR.UPDATE_GLOBAL',
  UPDATE_GROUP = 'PBR.UPDATE_GROUP'
}

export enum SecurityEventType {
  SET_PRESET = 'SECURITY.SET_PRESET',
  TRANSITION_START = 'SECURITY.TRANSITION_START',
  TRANSITION_COMPLETE = 'SECURITY.TRANSITION_COMPLETE'
}

// ============================================
// CONFIGURATION
// ============================================

export interface VisualEffectsConfig {
  // Valeurs par défaut
  defaultBloom: Partial<BloomContext>;
  defaultPBR: Partial<PBRContext>;
  defaultSecurity: Record<SecurityPreset, SecurityConfig>;

  // Options
  enablePerformanceMonitoring: boolean;
  autoDetectObjects: boolean;
  debugMode: boolean;
}

// ============================================
// OPTIONS POUR HOOK
// ============================================

export interface VisualEffectsOptions {
  // Configuration
  initialContext?: Partial<VisualEffectsContext>;
  enablePerformanceMonitoring?: boolean;
  debugMode?: boolean;

  // ✅ AJOUT: Injection optionnelle du bridge
  legacyBridge?: LegacySystemsBridge;
}