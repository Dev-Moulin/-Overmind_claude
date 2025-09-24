/**
 * 🎨 ALERT VISUALS ACTOR - Visual Effects Patterns (Claude IA)
 * Actor isolé pour gestion des effets visuels d'alerte
 */

import { createMachine, assign } from 'xstate';
import type { AlertPattern, AlertConfig, VisualEffect, SecurityLevel } from '../securityTypes';
import * as securityGuards from '../guards';

// ================================
// MOBILE GPU TIER DETECTION
// ================================
type GPUTier = 'desktop' | 'mobile-high' | 'mobile-low';

class MobileGPUDetector {
  static detectTier(): GPUTier {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl');

    if (!gl) return 'mobile-low';

    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    const renderer = debugInfo ?
      gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : '';

    // iOS haut de gamme
    if (renderer.includes('Apple A15') || renderer.includes('Apple A16')) {
      return 'desktop'; // Performance desktop
    }

    // Android haut de gamme
    if (renderer.includes('Adreno 730') || renderer.includes('Mali-G715')) {
      return 'mobile-high';
    }

    // Mobile ou desktop standard
    if (/Mobile|Android|iPhone/i.test(navigator.userAgent)) {
      return 'mobile-low';
    }

    return 'desktop';
  }

  static getOptimalConfig(tier: GPUTier) {
    const configs = {
      'desktop': {
        maxEffects: 5,
        shaderComplexity: 'high',
        throttling: 0,
        hapticFeedback: false
      },
      'mobile-high': {
        maxEffects: 3,
        shaderComplexity: 'medium',
        throttling: 1,
        hapticFeedback: true
      },
      'mobile-low': {
        maxEffects: 1,
        shaderComplexity: 'low',
        throttling: 3,
        hapticFeedback: true
      }
    };

    return configs[tier];
  }
}

// ================================
// SECURITY HAPTICS
// ================================
class SecurityHaptics {
  static triggerThreatAlert(level: SecurityLevel) {
    if (!('vibrate' in navigator)) return;

    const patterns = {
      normal: [],
      scanning: [100, 50, 100],           // 3 vibrations courtes
      alert: [200, 100, 200, 100, 200],   // Pattern urgent
      lockdown: [500, 200, 500, 200, 500] // Vibrations longues répétées
    };

    navigator.vibrate(patterns[level]);
  }
}

// ================================
// ADVANCED SECURITY SHADERS
// ================================
export const ADVANCED_SECURITY_SHADERS = {
  // Glitch distortion pour lockdown
  distortionShader: {
    fragmentShader: `
      uniform sampler2D tDiffuse;
      uniform float distortion;
      uniform float time;
      varying vec2 vUv;

      void main() {
        vec2 uv = vUv;

        // Glitch horizontal bars
        float bar = sin(uv.y * 800.0 + time * 50.0);
        if (bar > 0.98) {
          uv.x += distortion * sin(time * 10.0);
        }

        // RGB shift
        float r = texture2D(tDiffuse, uv + vec2(distortion * 0.01, 0.0)).r;
        float g = texture2D(tDiffuse, uv).g;
        float b = texture2D(tDiffuse, uv - vec2(distortion * 0.01, 0.0)).b;

        gl_FragColor = vec4(r, g, b, 1.0);
      }
    `
  },

  // Scanner effect pour scanning
  scannerShader: {
    fragmentShader: `
      uniform sampler2D tDiffuse;
      uniform float scanLine;
      uniform float time;
      varying vec2 vUv;

      void main() {
        vec4 color = texture2D(tDiffuse, vUv);

        // Scanner line
        float line = abs(vUv.y - scanLine);
        if (line < 0.02) {
          color.rgb += vec3(0.0, 0.5, 1.0) * (1.0 - line / 0.02);
        }

        gl_FragColor = color;
      }
    `
  },

  // Chromatic aberration pour alert
  chromaticShader: {
    fragmentShader: `
      uniform sampler2D tDiffuse;
      uniform float intensity;
      uniform float time;
      varying vec2 vUv;

      void main() {
        float offset = intensity * 0.01 * sin(time);
        vec4 cr = texture2D(tDiffuse, vUv + vec2(offset, 0.0));
        vec4 cg = texture2D(tDiffuse, vUv);
        vec4 cb = texture2D(tDiffuse, vUv - vec2(offset, 0.0));
        gl_FragColor = vec4(cr.r, cg.g, cb.b, 1.0);
      }
    `
  }
};

// ================================
// ALERT VISUALS ACTOR CONTEXT
// ================================
interface AlertVisualsContext {
  gpuTier: GPUTier;
  activeEffects: VisualEffect[];
  currentPattern: AlertPattern | null;
  intensity: number;
  color: string;
  isEnabled: boolean;
  maxEffects: number;
  shaderComplexity: string;
  hapticEnabled: boolean;
}

type AlertVisualsEvent =
  | { type: 'ACTIVATE_ALERT'; pattern: AlertPattern; config?: Partial<AlertConfig> }
  | { type: 'STOP_ALERT'; pattern?: AlertPattern }
  | { type: 'STOP_ALL_ALERTS' }
  | { type: 'SET_INTENSITY'; intensity: number }
  | { type: 'SET_COLOR'; color: string }
  | { type: 'ENABLE_HAPTICS'; enabled: boolean }
  | { type: 'SECURITY_LEVEL_CHANGED'; level: SecurityLevel };

// ================================
// ALERT VISUALS ACTOR MACHINE
// ================================
export const alertVisualsActor = createMachine(
  {
    id: 'alert-visuals-actor',

    context: {
      gpuTier: MobileGPUDetector.detectTier(),
      activeEffects: [],
      currentPattern: null,
      intensity: 0.7,
      color: '#ff0000',
      isEnabled: true,
      maxEffects: 5,
      shaderComplexity: 'high',
      hapticEnabled: false
    },

    initial: 'idle',

    entry: 'initializeGPUOptimizations',

    states: {
      idle: {
        on: {
          ACTIVATE_ALERT: [
            {
              target: 'chromatic',
              cond: 'canUseAdvancedEffects'
            },
            {
              target: 'distortion',
              cond: 'canUseAdvancedEffects'
            },
            {
              target: 'scanner',
              cond: 'canUseAdvancedEffects'
            },
            {
              target: 'simple',
              cond: 'shouldUseSimpleEffects'
            }
          ],
          SET_INTENSITY: {
            actions: 'updateIntensity'
          },
          SET_COLOR: {
            actions: 'updateColor'
          }
        }
      },

      chromatic: {
        entry: ['enableChromaticAberration', 'triggerHaptic'],
        exit: 'disableChromaticAberration',

        on: {
          STOP_ALERT: 'idle',
          STOP_ALL_ALERTS: 'idle',
          SET_INTENSITY: {
            actions: 'updateChromaticIntensity'
          }
        }
      },

      distortion: {
        entry: ['enableDistortionEffect', 'triggerHaptic'],
        exit: 'disableDistortionEffect',

        on: {
          STOP_ALERT: 'idle',
          STOP_ALL_ALERTS: 'idle',
          SET_INTENSITY: {
            actions: 'updateDistortionIntensity'
          }
        }
      },

      scanner: {
        entry: ['enableScannerEffect', 'triggerHaptic'],
        exit: 'disableScannerEffect',

        invoke: {
          src: 'scannerAnimation',
          onDone: 'idle'
        },

        on: {
          STOP_ALERT: 'idle',
          STOP_ALL_ALERTS: 'idle'
        }
      },

      simple: {
        entry: ['enableSimpleFlash', 'triggerHaptic'],
        exit: 'disableSimpleFlash',

        on: {
          STOP_ALERT: 'idle',
          STOP_ALL_ALERTS: 'idle'
        }
      }
    },

    on: {
      SECURITY_LEVEL_CHANGED: {
        actions: 'handleSecurityLevelChange'
      },
      ENABLE_HAPTICS: {
        actions: 'toggleHaptics'
      }
    }
  },
  {

    services: {
      scannerAnimation: () => (callback) => {
        let scanLine = 0;
        const interval = setInterval(() => {
          scanLine += 0.05;
          if (scanLine >= 1) {
            callback({ type: 'ANIMATION_COMPLETE' });
            clearInterval(interval);
          }
          // Update shader uniform here
        }, 16); // ~60fps

        return () => clearInterval(interval);
      }
    },

    actions: {
      initializeGPUOptimizations: assign((context) => {
        const config = MobileGPUDetector.getOptimalConfig(context.gpuTier);
        return {
          maxEffects: config.maxEffects,
          shaderComplexity: config.shaderComplexity,
          hapticEnabled: config.hapticFeedback
        };
      }),

      updateIntensity: assign({
        intensity: (_, event: AlertVisualsEvent & { type: 'SET_INTENSITY' }) => event.intensity
      }),

      updateColor: assign({
        color: (_, event: AlertVisualsEvent & { type: 'SET_COLOR' }) => event.color
      }),

      enableChromaticAberration: assign((context) => {
        const effect: VisualEffect = {
          id: 'chromatic-aberration',
          type: 'flash',
          uniforms: {
            intensity: { value: context.intensity },
            time: { value: 0 }
          },
          shader: {
            fragment: ADVANCED_SECURITY_SHADERS.chromaticShader.fragmentShader
          },
          enabled: true
        };

        return {
          activeEffects: [...context.activeEffects, effect],
          currentPattern: 'flash' as AlertPattern
        };
      }),

      disableChromaticAberration: assign((context) => ({
        activeEffects: context.activeEffects.filter(e => e.id !== 'chromatic-aberration'),
        currentPattern: null
      })),

      enableDistortionEffect: assign((context) => {
        const effect: VisualEffect = {
          id: 'distortion-glitch',
          type: 'distortion',
          uniforms: {
            distortion: { value: context.intensity },
            time: { value: 0 }
          },
          shader: {
            fragment: ADVANCED_SECURITY_SHADERS.distortionShader.fragmentShader
          },
          enabled: true
        };

        return {
          activeEffects: [...context.activeEffects, effect],
          currentPattern: 'distortion' as AlertPattern
        };
      }),

      disableDistortionEffect: assign((context) => ({
        activeEffects: context.activeEffects.filter(e => e.id !== 'distortion-glitch'),
        currentPattern: null
      })),

      enableScannerEffect: assign((context) => {
        const effect: VisualEffect = {
          id: 'scanner-line',
          type: 'scanner',
          uniforms: {
            scanLine: { value: 0 },
            time: { value: 0 }
          },
          shader: {
            fragment: ADVANCED_SECURITY_SHADERS.scannerShader.fragmentShader
          },
          enabled: true
        };

        return {
          activeEffects: [...context.activeEffects, effect],
          currentPattern: 'scanner' as AlertPattern
        };
      }),

      disableScannerEffect: assign((context) => ({
        activeEffects: context.activeEffects.filter(e => e.id !== 'scanner-line'),
        currentPattern: null
      })),

      enableSimpleFlash: assign((context) => {
        // Simple flash for low-end devices
        return {
          currentPattern: 'flash' as AlertPattern
        };
      }),

      disableSimpleFlash: assign(() => ({
        currentPattern: null
      })),

      updateChromaticIntensity: (context, event: AlertVisualsEvent & { type: 'SET_INTENSITY' }) => {
        const effect = context.activeEffects.find(e => e.id === 'chromatic-aberration');
        if (effect) {
          effect.uniforms.intensity.value = event.intensity;
        }
      },

      updateDistortionIntensity: (context, event: AlertVisualsEvent & { type: 'SET_INTENSITY' }) => {
        const effect = context.activeEffects.find(e => e.id === 'distortion-glitch');
        if (effect) {
          effect.uniforms.distortion.value = event.intensity;
        }
      },

      triggerHaptic: (context, event: AlertVisualsEvent & { type: 'SECURITY_LEVEL_CHANGED' }) => {
        if (context.hapticEnabled && event.type === 'SECURITY_LEVEL_CHANGED') {
          SecurityHaptics.triggerThreatAlert(event.level);
        }
      },

      handleSecurityLevelChange: (context, event: AlertVisualsEvent & { type: 'SECURITY_LEVEL_CHANGED' }) => {
        if (context.hapticEnabled) {
          SecurityHaptics.triggerThreatAlert(event.level);
        }
      },

      toggleHaptics: assign({
        hapticEnabled: (_, event: AlertVisualsEvent & { type: 'ENABLE_HAPTICS' }) => event.enabled
      })
    },

    // ============================================
    // GUARDS
    // ============================================
    guards: {
      canUseAdvancedEffects: securityGuards.canUseAdvancedEffects,
      shouldUseSimpleEffects: securityGuards.shouldUseSimpleEffects
    }
  }
);