/**
 * 🌉 VISUAL EFFECTS INTEGRATION - 7ème région B5 Security (Nos spécificités)
 * Bridge pour intégrer B5 SecurityMachine dans VisualEffectsMachine
 */

import { spawn, forwardTo } from 'xstate';
import { securityMachine } from '../securityMachine';
import type { SecurityLevel, AlertPattern } from '../securityTypes';

// ================================
// SECURITY REGION INTEGRATION
// ================================
export interface SecurityIntegrationConfig {
  enabled: boolean;
  autoEscalation: boolean;
  visualEffectsOverride: boolean;
  performanceImpact: 'minimal' | 'normal' | 'high';
}

// ================================
// B5 INTEGRATION INTO VISUALEFFECTS
// ================================
export function integrateB5IntoVisualEffects(visualEffectsMachine: any) {
  return visualEffectsMachine.withConfig({
    // Ajouter B5 comme 7ème région parallèle
    states: {
      ...visualEffectsMachine.config.states,

      // 7ème région: Security
      security: {
        initial: 'inactive',

        states: {
          inactive: {
            on: {
              'SECURITY.ACTIVATE': 'active'
            }
          },

          active: {
            invoke: {
              id: 'b5-security',
              src: securityMachine,
              onDone: {
                target: 'inactive'
              },
              onError: {
                target: 'inactive',
                actions: 'handleSecurityError'
              }
            },

            entry: 'activateSecurityIntegration',
            exit: 'deactivateSecurityIntegration',

            on: {
              'SECURITY.DEACTIVATE': 'inactive',

              // Forward all security events to the spawned machine
              'SECURITY.*': {
                actions: forwardTo('b5-security')
              },

              // Handle security level changes
              'SECURITY.LEVEL_CHANGE': {
                actions: ['forwardToSecurityMachine', 'applySecurityToVisualEffects']
              },

              // Handle threats
              'SECURITY.THREAT_DETECTED': {
                actions: ['forwardToSecurityMachine', 'triggerVisualAlert']
              },

              // Handle performance
              'SECURITY.PERFORMANCE_ISSUE': {
                actions: ['forwardToSecurityMachine', 'adaptVisualEffectsPerformance']
              }
            }
          }
        }
      }
    },

    // Extended actions for security integration
    actions: {
      ...visualEffectsMachine.config.actions,

      // Security Integration Actions
      activateSecurityIntegration: (context: any, event: any) => {
        console.log('🔐 B5 Security integrated into VisualEffects');

        // Connect bridges to existing systems
        if (context.lighting) {
          // Connect to B3 Lighting
          context.securityEventBus?.connectBridge('b3-lighting');
        }

        if (context.environment) {
          // Connect to B4 Environment
          context.securityEventBus?.connectBridge('b4-environment');
        }

        // Connect to VisualEffects itself
        context.securityEventBus?.connectBridge('visual-effects');
      },

      deactivateSecurityIntegration: (context: any) => {
        console.log('🔐 B5 Security deactivated from VisualEffects');

        // Disconnect all bridges
        context.securityEventBus?.disconnectBridge('b3-lighting');
        context.securityEventBus?.disconnectBridge('b4-environment');
        context.securityEventBus?.disconnectBridge('visual-effects');
      },

      forwardToSecurityMachine: forwardTo('b5-security'),

      applySecurityToVisualEffects: (context: any, event: any) => {
        if (!event.level) return;

        const securityLevel = event.level as SecurityLevel;

        // Apply security level to Bloom
        const bloomIntensity = {
          normal: 0.4,
          scanning: 0.6,
          alert: 0.8,
          lockdown: 1.0
        }[securityLevel];

        // Apply security level to Environment
        const environmentQuality = {
          normal: 'auto',
          scanning: 'high',
          alert: 'medium',
          lockdown: 'low'
        }[securityLevel];

        // Update VisualEffects accordingly
        context.bloom.global.strength = bloomIntensity;
        context.environment.quality = environmentQuality;

        console.log(`🎨 VisualEffects adapted to security level: ${securityLevel}`);
      },

      triggerVisualAlert: (context: any, event: any) => {
        const { threat, pattern } = event;

        // Apply visual alert patterns to existing systems
        if (pattern === 'flash') {
          // Flash bloom effect
          const originalStrength = context.bloom.global.strength;
          context.bloom.global.strength = 1.0;

          setTimeout(() => {
            context.bloom.global.strength = originalStrength;
          }, 200);
        }

        if (pattern === 'pulse') {
          // Pulse environment lighting
          const pulseInterval = setInterval(() => {
            context.lighting.intensity = context.lighting.intensity === 1.0 ? 0.7 : 1.0;
          }, 500);

          setTimeout(() => clearInterval(pulseInterval), 3000);
        }

        if (pattern === 'distortion') {
          // Apply distortion to all visual groups
          Object.keys(context.bloom.groups).forEach(group => {
            const originalColor = context.bloom.groups[group].emissiveColor;
            context.bloom.groups[group].emissiveColor = 0xff0000; // Red alert

            setTimeout(() => {
              context.bloom.groups[group].emissiveColor = originalColor;
            }, 1000);
          });
        }

        console.log(`🚨 Visual alert triggered: ${pattern} for threat level ${threat?.score || 0}`);
      },

      adaptVisualEffectsPerformance: (context: any, event: any) => {
        const { mode, metrics } = event;

        switch (mode) {
          case 'minimal':
            // Disable non-critical effects
            context.bloom.global.enabled = false;
            context.pbr.global.enabled = false;
            context.environment.quality = 'low';
            break;

          case 'reduced':
            // Reduce quality but keep essential effects
            context.bloom.global.strength *= 0.5;
            context.environment.quality = 'medium';
            break;

          case 'normal':
            // Restore normal operation
            context.bloom.global.enabled = true;
            context.pbr.global.enabled = true;
            context.environment.quality = 'auto';
            break;
        }

        console.log(`⚡ VisualEffects performance adapted to: ${mode}`);
      },

      handleSecurityError: (context: any, event: any) => {
        console.error('🚨 B5 Security integration error:', event.data);

        // Fallback: disable security effects
        context.security = {
          ...context.security,
          enabled: false,
          error: event.data
        };
      }
    }
  });
}

// ================================
// SECURITY VISUAL EFFECTS PRESETS
// ================================
export const SECURITY_VISUAL_PRESETS = {
  normal: {
    bloom: {
      strength: 0.4,
      threshold: 0.15,
      color: 0x00ff00
    },
    environment: {
      quality: 'auto',
      hdrBoost: 1.0
    },
    lighting: {
      intensity: 1.0,
      color: 0xffffff
    }
  },

  scanning: {
    bloom: {
      strength: 0.6,
      threshold: 0.12,
      color: 0xffff00
    },
    environment: {
      quality: 'high',
      hdrBoost: 1.2
    },
    lighting: {
      intensity: 1.2,
      color: 0xffffcc
    }
  },

  alert: {
    bloom: {
      strength: 0.8,
      threshold: 0.10,
      color: 0xff8800
    },
    environment: {
      quality: 'medium',
      hdrBoost: 0.8
    },
    lighting: {
      intensity: 1.5,
      color: 0xffcc88
    }
  },

  lockdown: {
    bloom: {
      strength: 1.0,
      threshold: 0.05,
      color: 0xff0000
    },
    environment: {
      quality: 'low',
      hdrBoost: 0.5
    },
    lighting: {
      intensity: 2.0,
      color: 0xff4444
    }
  }
} as const;

// ================================
// HELPER: GET ENHANCED VISUAL EFFECTS MACHINE
// ================================
export function getEnhancedVisualEffectsMachine(originalMachine: any) {
  const enhancedMachine = integrateB5IntoVisualEffects(originalMachine);

  console.log('🎨 VisualEffectsMachine enhanced with B5 Security (7th region)');

  return enhancedMachine;
}

// ================================
// SECURITY COORDINATION UTILITIES
// ================================
export const SecurityVisualCoordinator = {
  applySecurityLevel: (context: any, level: SecurityLevel) => {
    const preset = SECURITY_VISUAL_PRESETS[level];

    // Apply to all visual systems
    if (context.bloom) {
      Object.assign(context.bloom.global, preset.bloom);
    }

    if (context.environment) {
      Object.assign(context.environment, preset.environment);
    }

    if (context.lighting) {
      Object.assign(context.lighting, preset.lighting);
    }

    return preset;
  },

  triggerAlert: (context: any, pattern: AlertPattern, duration: number = 2000) => {
    const alertId = `security-alert-${Date.now()}`;

    switch (pattern) {
      case 'flash':
        return SecurityVisualCoordinator.flashEffect(context, duration);
      case 'pulse':
        return SecurityVisualCoordinator.pulseEffect(context, duration);
      case 'distortion':
        return SecurityVisualCoordinator.distortionEffect(context, duration);
      case 'glitch':
        return SecurityVisualCoordinator.glitchEffect(context, duration);
      case 'scanner':
        return SecurityVisualCoordinator.scannerEffect(context, duration);
      default:
        console.warn('Unknown alert pattern:', pattern);
        return null;
    }
  },

  flashEffect: (context: any, duration: number) => {
    const flashInterval = setInterval(() => {
      // Toggle high intensity bloom
      const isFlash = context.bloom?.global?.strength > 0.8;
      if (context.bloom) {
        context.bloom.global.strength = isFlash ? 0.2 : 1.0;
      }
    }, 100);

    setTimeout(() => clearInterval(flashInterval), duration);
    return flashInterval;
  },

  pulseEffect: (context: any, duration: number) => {
    const startTime = Date.now();
    const pulseInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pulse = Math.sin(elapsed / 200) * 0.3 + 0.7; // 0.4 to 1.0

      if (context.bloom) {
        context.bloom.global.strength = pulse;
      }
    }, 16);

    setTimeout(() => clearInterval(pulseInterval), duration);
    return pulseInterval;
  },

  distortionEffect: (context: any, duration: number) => {
    // Apply red emergency colors
    const originalColors = {};

    if (context.bloom?.groups) {
      Object.keys(context.bloom.groups).forEach(group => {
        originalColors[group] = context.bloom.groups[group].emissiveColor;
        context.bloom.groups[group].emissiveColor = 0xff0000;
      });
    }

    setTimeout(() => {
      // Restore original colors
      if (context.bloom?.groups) {
        Object.keys(originalColors).forEach(group => {
          context.bloom.groups[group].emissiveColor = originalColors[group];
        });
      }
    }, duration);
  },

  glitchEffect: (context: any, duration: number) => {
    const glitchInterval = setInterval(() => {
      // Random intensity spikes
      if (context.bloom && Math.random() > 0.7) {
        context.bloom.global.strength = Math.random() * 1.5;
      }
    }, 50);

    setTimeout(() => clearInterval(glitchInterval), duration);
    return glitchInterval;
  },

  scannerEffect: (context: any, duration: number) => {
    // Sweep effect across bloom groups
    const groups = Object.keys(context.bloom?.groups || {});
    let currentIndex = 0;

    const scanInterval = setInterval(() => {
      // Reset all groups
      groups.forEach(group => {
        if (context.bloom?.groups?.[group]) {
          context.bloom.groups[group].strength = 0.2;
        }
      });

      // Highlight current group
      const currentGroup = groups[currentIndex];
      if (context.bloom?.groups?.[currentGroup]) {
        context.bloom.groups[currentGroup].strength = 1.0;
      }

      currentIndex = (currentIndex + 1) % groups.length;
    }, 200);

    setTimeout(() => {
      clearInterval(scanInterval);
      // Restore normal strengths
      groups.forEach(group => {
        if (context.bloom?.groups?.[group]) {
          context.bloom.groups[group].strength = 0.4;
        }
      });
    }, duration);

    return scanInterval;
  }
};