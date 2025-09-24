/**
 * 🔧 SECURITY PATTERNS - Bibliothèque de patterns sécurisés (Claude IA)
 * Patterns réutilisables pour la détection et la mitigation de menaces
 */

import type {
  ThreatPattern,
  SecurityLevel,
  AlertPattern,
  PerformanceMetrics,
  ThreatMetrics
} from '../securityTypes';

// ================================
// THREAT DETECTION PATTERNS
// ================================

export const THREAT_PATTERNS: Record<string, ThreatPattern> = {
  // WebGL Context Attacks
  'webgl-context-loss': {
    id: 'webgl-context-loss',
    name: 'WebGL Context Loss Attack',
    description: 'Repeated WebGL context losses indicate potential DoS attack',
    severity: 'critical',
    indicators: ['webglContextLoss'],
    threshold: 5,
    mitigation: 'Block shader compilation, reduce rendering quality'
  },

  // Memory-based Attacks
  'memory-exhaustion': {
    id: 'memory-exhaustion',
    name: 'Memory Exhaustion Attack',
    description: 'Rapid memory consumption pattern suggesting memory bomb',
    severity: 'high',
    indicators: ['memoryLeaks', 'cpuUsage'],
    threshold: 15,
    mitigation: 'Force garbage collection, reduce visual effects'
  },

  'memory-leak-cascade': {
    id: 'memory-leak-cascade',
    name: 'Cascading Memory Leak',
    description: 'Progressive memory leak pattern over time',
    severity: 'medium',
    indicators: ['memoryLeaks'],
    threshold: 10,
    mitigation: 'Enable automatic cleanup, monitor allocation rate'
  },

  // Shader-based Attacks
  'shader-bomb': {
    id: 'shader-bomb',
    name: 'Shader Compilation Bomb',
    description: 'Overly complex shader causing compilation delays',
    severity: 'high',
    indicators: ['shaderCompileTime', 'cpuUsage'],
    threshold: 12,
    mitigation: 'Block shader compilation, fallback to simple renderer'
  },

  'shader-infinite-loop': {
    id: 'shader-infinite-loop',
    name: 'Shader Infinite Loop',
    description: 'Shader with potential infinite loop causing GPU hang',
    severity: 'critical',
    indicators: ['shaderCompileTime', 'cpuUsage'],
    threshold: 20,
    mitigation: 'Emergency shader termination, GPU reset'
  },

  // Input-based Attacks
  'input-flooding': {
    id: 'input-flooding',
    name: 'Input Event Flooding',
    description: 'Excessive input events overwhelming event loop',
    severity: 'medium',
    indicators: ['inputVelocity', 'cpuUsage'],
    threshold: 8,
    mitigation: 'Throttle input processing, implement debouncing'
  },

  'input-velocity-spike': {
    id: 'input-velocity-spike',
    name: 'Input Velocity Spike',
    description: 'Sudden spike in input velocity suggesting automation',
    severity: 'medium',
    indicators: ['inputVelocity'],
    threshold: 25,
    mitigation: 'Implement CAPTCHA-like verification'
  },

  // Network-based Attacks
  'resource-timing-attack': {
    id: 'resource-timing-attack',
    name: 'Resource Timing Attack',
    description: 'Suspicious resource loading timing patterns',
    severity: 'low',
    indicators: ['networkTiming'],
    threshold: 5,
    mitigation: 'Randomize resource loading, add artificial delays'
  },

  // Performance Degradation Patterns
  'performance-cliff': {
    id: 'performance-cliff',
    name: 'Performance Cliff',
    description: 'Sudden severe performance degradation',
    severity: 'high',
    indicators: ['cpuUsage', 'memoryLeaks'],
    threshold: 18,
    mitigation: 'Emergency performance mode, disable non-critical features'
  }
};

// ================================
// SECURITY ESCALATION PATTERNS
// ================================

export const ESCALATION_PATTERNS = {
  normal: {
    level: 'normal' as SecurityLevel,
    thresholds: {
      threatScore: 0,
      maxConcurrentThreats: 0,
      performanceThreshold: 90 // 90% performance minimum
    },
    allowedOperations: ['all'],
    restrictions: [],
    visualAlerts: []
  },

  scanning: {
    level: 'scanning' as SecurityLevel,
    thresholds: {
      threatScore: 10,
      maxConcurrentThreats: 1,
      performanceThreshold: 80
    },
    allowedOperations: ['basic-rendering', 'user-input', 'network-limited'],
    restrictions: ['complex-shaders', 'high-memory-operations'],
    visualAlerts: ['scanner'] as AlertPattern[]
  },

  alert: {
    level: 'alert' as SecurityLevel,
    thresholds: {
      threatScore: 25,
      maxConcurrentThreats: 3,
      performanceThreshold: 60
    },
    allowedOperations: ['essential-rendering', 'user-input-throttled'],
    restrictions: ['shader-compilation', 'memory-intensive', 'network-requests'],
    visualAlerts: ['flash', 'pulse'] as AlertPattern[]
  },

  lockdown: {
    level: 'lockdown' as SecurityLevel,
    thresholds: {
      threatScore: 50,
      maxConcurrentThreats: 5,
      performanceThreshold: 30
    },
    allowedOperations: ['emergency-rendering-only'],
    restrictions: ['all-non-essential'],
    visualAlerts: ['distortion', 'glitch', 'rotate'] as AlertPattern[]
  }
};

// ================================
// PERFORMANCE PROTECTION PATTERNS
// ================================

export const PERFORMANCE_PATTERNS = {
  // Circuit Breaker Patterns
  circuitBreaker: {
    closedState: {
      failureThreshold: 5,
      timeWindow: 60000, // 1 minute
      monitoringInterval: 1000
    },
    openState: {
      timeout: 30000, // 30 seconds before half-open
      fallbackBehavior: 'minimal-rendering'
    },
    halfOpenState: {
      testRequests: 3,
      successThreshold: 2
    }
  },

  // Adaptive Performance Patterns
  adaptiveThrottling: {
    minimal: {
      targetFPS: 15,
      maxEffects: 0,
      shaderQuality: 'off',
      throttleInputs: 5
    },
    reduced: {
      targetFPS: 30,
      maxEffects: 1,
      shaderQuality: 'low',
      throttleInputs: 2
    },
    normal: {
      targetFPS: 60,
      maxEffects: 5,
      shaderQuality: 'high',
      throttleInputs: 0
    }
  },

  // Memory Management Patterns
  memoryManagement: {
    garbageCollection: {
      lowMemoryThreshold: 0.8, // 80% of available memory
      aggressiveCleanupThreshold: 0.9, // 90% of available memory
      cleanupInterval: 10000 // 10 seconds
    },
    resourcePooling: {
      maxCachedShaders: 20,
      maxCachedTextures: 50,
      maxCachedGeometries: 30
    }
  }
};

// ================================
// ALERT VISUAL PATTERNS
// ================================

export const VISUAL_ALERT_PATTERNS = {
  flash: {
    pattern: 'flash' as AlertPattern,
    duration: 200,
    frequency: 5,
    intensity: 0.8,
    color: '#ff0000',
    description: 'Rapid flashing for immediate attention'
  },

  pulse: {
    pattern: 'pulse' as AlertPattern,
    duration: 1000,
    frequency: 1,
    intensity: 0.6,
    color: '#ffaa00',
    description: 'Smooth pulsing for moderate alerts'
  },

  rotate: {
    pattern: 'rotate' as AlertPattern,
    duration: 500,
    frequency: 2,
    intensity: 0.9,
    color: '#ff0000',
    description: 'Rotation effect for critical alerts'
  },

  distortion: {
    pattern: 'distortion' as AlertPattern,
    duration: 300,
    frequency: 3,
    intensity: 1.0,
    color: '#ff0000',
    description: 'Distortion glitch for severe threats'
  },

  glitch: {
    pattern: 'glitch' as AlertPattern,
    duration: 150,
    frequency: 8,
    intensity: 1.0,
    color: '#ff0000',
    description: 'Digital glitch for system compromise'
  },

  scanner: {
    pattern: 'scanner' as AlertPattern,
    duration: 2000,
    frequency: 0.5,
    intensity: 0.7,
    color: '#00ff00',
    description: 'Scanning line for monitoring mode'
  }
};

// ================================
// MITIGATION STRATEGIES
// ================================

export const MITIGATION_STRATEGIES = {
  // Immediate Response Strategies
  immediate: {
    'block-shader-compilation': {
      description: 'Prevent new shader compilation',
      implementation: 'Set shader compilation flag to false',
      cost: 'low',
      effectiveness: 'high'
    },
    'throttle-input-processing': {
      description: 'Reduce input event processing rate',
      implementation: 'Implement input debouncing/throttling',
      cost: 'low',
      effectiveness: 'medium'
    },
    'force-garbage-collection': {
      description: 'Trigger immediate memory cleanup',
      implementation: 'Call gc() if available, cleanup caches',
      cost: 'medium',
      effectiveness: 'medium'
    }
  },

  // Progressive Strategies
  progressive: {
    'reduce-visual-quality': {
      description: 'Progressively reduce rendering quality',
      implementation: 'Lower resolution, disable effects',
      cost: 'low',
      effectiveness: 'high'
    },
    'disable-non-critical-features': {
      description: 'Turn off secondary features',
      implementation: 'Disable animations, advanced lighting',
      cost: 'medium',
      effectiveness: 'medium'
    },
    'emergency-minimal-mode': {
      description: 'Switch to absolute minimum functionality',
      implementation: 'Basic rendering only, no effects',
      cost: 'high',
      effectiveness: 'very-high'
    }
  },

  // Recovery Strategies
  recovery: {
    'gradual-feature-restoration': {
      description: 'Slowly re-enable features after threat clear',
      implementation: 'Incremental feature activation',
      cost: 'low',
      effectiveness: 'high'
    },
    'adaptive-threshold-adjustment': {
      description: 'Adjust detection thresholds based on experience',
      implementation: 'ML-lite weight updates',
      cost: 'low',
      effectiveness: 'medium'
    }
  }
};

// ================================
// PATTERN UTILITIES
// ================================

export class SecurityPatternMatcher {
  static matchThreatPattern(metrics: ThreatMetrics): ThreatPattern[] {
    return Object.values(THREAT_PATTERNS).filter(pattern => {
      const patternScore = pattern.indicators.reduce((score, indicator) => {
        const value = metrics[indicator] || 0;
        return score + value;
      }, 0) / pattern.indicators.length;

      return patternScore > pattern.threshold;
    });
  }

  static getEscalationLevel(threatScore: number, activeThreats: number): SecurityLevel {
    const patterns = Object.values(ESCALATION_PATTERNS);

    for (let i = patterns.length - 1; i >= 0; i--) {
      const pattern = patterns[i];
      if (threatScore >= pattern.thresholds.threatScore &&
          activeThreats >= pattern.thresholds.maxConcurrentThreats) {
        return pattern.level;
      }
    }

    return 'normal';
  }

  static getRecommendedMitigation(pattern: ThreatPattern, severity: SecurityLevel): string[] {
    const strategies = [];

    if (severity === 'lockdown') {
      strategies.push(...Object.keys(MITIGATION_STRATEGIES.immediate));
      strategies.push(...Object.keys(MITIGATION_STRATEGIES.progressive));
    } else if (severity === 'alert') {
      strategies.push(...Object.keys(MITIGATION_STRATEGIES.immediate));
    } else if (severity === 'scanning') {
      strategies.push('throttle-input-processing');
    }

    return strategies;
  }

  static getVisualAlertConfig(level: SecurityLevel): AlertPattern[] {
    const escalation = ESCALATION_PATTERNS[level];
    return escalation ? escalation.visualAlerts : [];
  }
}

// ================================
// EXPORTS
// ================================
// Les patterns sont déjà exportés avec leur déclaration