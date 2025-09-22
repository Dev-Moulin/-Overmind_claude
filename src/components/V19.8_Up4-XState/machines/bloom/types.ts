// 🌟 BloomMachine Types - Atome B1
// Types TypeScript pour la machine XState Bloom

import * as THREE from 'three';

export interface BloomGlobalContext {
  threshold: number;
  strength: number;
  radius: number;
  enabled: boolean;
  exposure: number;
}

export interface BloomGroupContext {
  threshold: number;
  strength: number;
  radius: number;
  objects: Map<string, THREE.Mesh>;
  emissiveColor: number;
  emissiveIntensity: number;
}

export interface BloomSecurityContext {
  currentPreset: SecurityPreset | null;
  presets: Record<SecurityPreset, SecurityConfig>;
  isTransitioning: boolean;
}

export interface BloomContext {
  // États parallèles
  global: BloomGlobalContext;

  groups: {
    iris: BloomGroupContext;
    eyeRings: BloomGroupContext;
    revealRings: BloomGroupContext;
    magicRings: BloomGroupContext;
    arms: BloomGroupContext;
  };

  security: BloomSecurityContext;

  // Services externes
  simpleBloomSystem: any; // SimpleBloomSystem instance
  bloomControlCenter: any; // BloomControlCenter instance
  frameScheduler: any; // FrameScheduler coordination

  // Performance monitoring
  performance: {
    updateCount: number;
    lastUpdateTime: number;
    averageUpdateTime: number;
  };
}

// 🔒 Security Presets
export type SecurityPreset = 'SAFE' | 'DANGER' | 'WARNING' | 'SCANNING' | 'NORMAL';

export interface SecurityConfig {
  color: number;
  intensity: number;
}

// 🎭 Group Types
export type BloomGroupType = 'iris' | 'eyeRings' | 'revealRings' | 'magicRings' | 'arms';

// 📨 Events
export type BloomEvent =
  // Global bloom events
  | { type: 'ENABLE_BLOOM' }
  | { type: 'DISABLE_BLOOM' }
  | { type: 'UPDATE_GLOBAL'; threshold?: number; strength?: number; radius?: number; exposure?: number }

  // Group bloom events
  | { type: 'UPDATE_GROUP_IRIS'; threshold?: number; strength?: number; radius?: number; emissiveColor?: number; emissiveIntensity?: number }
  | { type: 'UPDATE_GROUP_EYERINGS'; threshold?: number; strength?: number; radius?: number; emissiveColor?: number; emissiveIntensity?: number }
  | { type: 'UPDATE_GROUP_REVEALRINGS'; threshold?: number; strength?: number; radius?: number; emissiveColor?: number; emissiveIntensity?: number }
  | { type: 'UPDATE_GROUP_MAGICRINGS'; threshold?: number; strength?: number; radius?: number; emissiveColor?: number; emissiveIntensity?: number }
  | { type: 'UPDATE_GROUP_ARMS'; threshold?: number; strength?: number; radius?: number; emissiveColor?: number; emissiveIntensity?: number }

  // Object management
  | { type: 'REGISTER_OBJECTS'; group: BloomGroupType; objects: Map<string, THREE.Mesh> }
  | { type: 'DETECT_OBJECTS'; model: THREE.Group | THREE.Mesh }

  // Security events
  | { type: 'SET_SECURITY'; preset: SecurityPreset }
  | { type: 'SECURITY_TRANSITION_COMPLETE'; preset: SecurityPreset }

  // System events
  | { type: 'SYNC_WITH_FRAMESCHEDULER'; fps: number; deltaTime: number }
  | { type: 'SYNC_WITH_RENDERER' }
  | { type: 'FORCE_REFRESH' }
  | { type: 'DISPOSE' }

  // Error handling
  | { type: 'RETRY' }
  | { type: 'RESET' }
  | { type: 'ERROR'; error: Error };

// 📊 Service Data Types
export interface BloomServiceData {
  group?: BloomGroupType;
  preset?: SecurityPreset;
  bloomSystem?: any;
  controlCenter?: any;
  frameScheduler?: any;
}

// 🔧 Configuration Types
export interface BloomMachineConfig {
  // Default values
  defaultGlobal: Omit<BloomGlobalContext, 'enabled'>;
  defaultGroups: Record<BloomGroupType, Omit<BloomGroupContext, 'objects'>>;

  // Integration settings
  frameSchedulerEnabled: boolean;
  performanceMonitoring: boolean;
  autoObjectDetection: boolean;

  // Debug options
  debugMode: boolean;
  logUpdates: boolean;
}

// 🎯 Hook Return Type
export interface BloomMachineHook {
  // Current state
  state: any;
  send: (event: BloomEvent) => void;

  // Global controls
  enableBloom: () => void;
  disableBloom: () => void;
  updateGlobal: (params: Partial<Omit<BloomGlobalContext, 'enabled'>>) => void;

  // Group controls
  updateGroup: (group: BloomGroupType, params: Partial<BloomGroupContext>) => void;
  registerObjects: (group: BloomGroupType, objects: Map<string, THREE.Mesh>) => void;

  // Security controls
  setSecurity: (preset: SecurityPreset) => void;

  // Utilities
  detectObjects: (model: THREE.Group | THREE.Mesh) => void;
  syncWithRenderer: () => void;
  forceRefresh: () => void;
  dispose: () => void;

  // Status
  isEnabled: boolean;
  currentSecurity: SecurityPreset | null;
  groupCounts: Record<BloomGroupType, number>;
  performance: BloomContext['performance'];
}

// 🔄 Animation Types
export interface BloomAnimation {
  type: 'pulse' | 'fade' | 'transition';
  duration: number;
  easing?: string;
  group?: BloomGroupType;
  from?: Partial<BloomGroupContext>;
  to?: Partial<BloomGroupContext>;
}

// 📈 Performance Metrics
export interface BloomMetrics {
  globalUpdates: number;
  groupUpdates: number;
  securityTransitions: number;
  objectsManaged: number;
  averageUpdateTime: number;
  memoryUsage?: number;
}