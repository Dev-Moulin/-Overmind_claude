/**
 * 🎯 THREAT DETECTOR ACTOR - ML-Lite Detection (Claude IA)
 * Actor isolé pour détection menaces sans dépendances externes
 */

import { createMachine, assign } from 'xstate';
import type { ThreatMetrics, ThreatDetectionResult, ThreatPattern } from '../securityTypes';
import * as securityGuards from '../guards';

// ================================
// ML-LITE THREAT SCORER
// ================================
class ThreatScorerMLLite {
  private weights = new Float32Array([
    0.3,  // WebGL context anomalies (le plus critique)
    0.25, // Memory patterns
    0.2,  // Shader compilation timing
    0.15, // Input velocity
    0.1   // Network timing
  ]);

  private normalizeFactors = {
    webglContextLoss: 100,
    memoryLeaks: 1024,     // MB
    shaderCompileTime: 100, // ms
    inputVelocity: 1000,   // pixels/second
    networkTiming: 1000,   // ms
    cpuUsage: 100          // %
  };

  private readonly patterns: ThreatPattern[] = [
    {
      id: 'webgl-context-loss',
      name: 'WebGL Context Loss Attack',
      description: 'Repeated WebGL context losses indicate potential attack',
      severity: 'critical',
      indicators: ['webglContextLoss'],
      threshold: 5,
      mitigation: 'Block shader compilation, reduce quality'
    },
    {
      id: 'memory-exhaustion',
      name: 'Memory Exhaustion Attack',
      description: 'Rapid memory consumption pattern',
      severity: 'high',
      indicators: ['memoryLeaks', 'cpuUsage'],
      threshold: 15,
      mitigation: 'Force garbage collection, reduce effects'
    },
    {
      id: 'shader-bomb',
      name: 'Shader Compilation Bomb',
      description: 'Complex shader causing compilation delays',
      severity: 'high',
      indicators: ['shaderCompileTime', 'cpuUsage'],
      threshold: 12,
      mitigation: 'Block shader, fallback to simple renderer'
    },
    {
      id: 'input-flooding',
      name: 'Input Event Flooding',
      description: 'Excessive input events to overwhelm system',
      severity: 'medium',
      indicators: ['inputVelocity', 'cpuUsage'],
      threshold: 8,
      mitigation: 'Throttle input processing'
    }
  ];

  calculate(metrics: ThreatMetrics): ThreatDetectionResult {
    // Normalize metrics
    const normalized = {
      webglContextLoss: Math.min(metrics.webglContextLoss / this.normalizeFactors.webglContextLoss, 1),
      memoryLeaks: Math.min(metrics.memoryLeaks / this.normalizeFactors.memoryLeaks, 1),
      shaderCompileTime: Math.min(metrics.shaderCompileTime / this.normalizeFactors.shaderCompileTime, 1),
      inputVelocity: Math.min(metrics.inputVelocity / this.normalizeFactors.inputVelocity, 1),
      networkTiming: Math.min(metrics.networkTiming / this.normalizeFactors.networkTiming, 1),
      cpuUsage: Math.min(metrics.cpuUsage / this.normalizeFactors.cpuUsage, 1)
    };

    // Calculate weighted score
    const score = (
      normalized.webglContextLoss * this.weights[0] +
      normalized.memoryLeaks * this.weights[1] +
      normalized.shaderCompileTime * this.weights[2] +
      normalized.inputVelocity * this.weights[3] +
      normalized.networkTiming * this.weights[4]
    ) * 100;

    // Detect active threat patterns
    const activeThreats = this.patterns.filter(pattern => {
      const patternScore = pattern.indicators.reduce((sum, indicator) => {
        return sum + normalized[indicator];
      }, 0) / pattern.indicators.length * 100;

      return patternScore > pattern.threshold;
    });

    // Confidence based on pattern consistency
    const confidence = Math.min(
      0.5 + (activeThreats.length * 0.2) + (score / 200),
      1.0
    );

    return {
      score: Math.min(Math.round(score), 100),
      threats: activeThreats,
      metrics,
      confidence,
      timestamp: Date.now()
    };
  }

  // Adaptive learning (simplified)
  updateWeights(feedback: { threatId: string; wasReal: boolean }) {
    const pattern = this.patterns.find(p => p.id === feedback.threatId);
    if (!pattern) return;

    const adjustment = feedback.wasReal ? 0.05 : -0.05;
    const indicatorIndex = pattern.indicators.map(indicator => {
      switch (indicator) {
        case 'webglContextLoss': return 0;
        case 'memoryLeaks': return 1;
        case 'shaderCompileTime': return 2;
        case 'inputVelocity': return 3;
        case 'networkTiming': return 4;
        default: return -1;
      }
    }).filter(i => i >= 0);

    indicatorIndex.forEach(i => {
      this.weights[i] = Math.max(0.05, Math.min(0.5, this.weights[i] + adjustment));
    });

    // Normalize weights to sum to 1
    const sum = this.weights.reduce((a, b) => a + b, 0);
    for (let i = 0; i < this.weights.length; i++) {
      this.weights[i] /= sum;
    }
  }
}

// ================================
// WEBGL SECURITY MONITOR
// ================================
class WebGLSecurityMonitor {
  private metricsHistory: ThreatMetrics[] = [];
  private lastContextLossCount = 0;
  private shaderCompileTimes: number[] = [];

  collectMetrics(): ThreatMetrics {
    const now = Date.now();

    // WebGL Context Loss Detection
    const canvas = document.querySelector('canvas');
    const contextLossCount = this.getContextLossCount();
    const webglContextLoss = contextLossCount - this.lastContextLossCount;
    this.lastContextLossCount = contextLossCount;

    // Memory Leak Detection
    const memoryLeaks = this.detectMemoryLeaks();

    // Shader Compilation Time (average of last 10)
    const shaderCompileTime = this.shaderCompileTimes.length > 0 ?
      this.shaderCompileTimes.reduce((a, b) => a + b, 0) / this.shaderCompileTimes.length :
      0;

    // Input Velocity (synthetic for now)
    const inputVelocity = this.calculateInputVelocity();

    // Network Timing (WebGL resource loading)
    const networkTiming = this.measureNetworkTiming();

    // CPU Usage (approximate)
    const cpuUsage = this.estimateCpuUsage();

    const metrics: ThreatMetrics = {
      webglContextLoss,
      memoryLeaks,
      shaderCompileTime,
      inputVelocity,
      networkTiming,
      cpuUsage,
      timestamp: now
    };

    // Keep history
    this.metricsHistory.push(metrics);
    if (this.metricsHistory.length > 60) { // Last 60 samples
      this.metricsHistory.shift();
    }

    return metrics;
  }

  private getContextLossCount(): number {
    // Hook into WebGL context to count losses
    return (window as any).__webglContextLosses || 0;
  }

  private detectMemoryLeaks(): number {
    if (!(performance as any).memory) return 0;

    const memory = (performance as any).memory;
    const usedMB = memory.usedJSHeapSize / (1024 * 1024);

    // Compare with history to detect rapid growth
    if (this.metricsHistory.length > 5) {
      const recentMemory = this.metricsHistory.slice(-5).map(m => m.memoryLeaks);
      const avgRecent = recentMemory.reduce((a, b) => a + b, 0) / recentMemory.length;
      const growthRate = usedMB - avgRecent;

      return Math.max(0, growthRate);
    }

    return usedMB;
  }

  private calculateInputVelocity(): number {
    // This would track mouse/touch velocity
    // Simplified implementation
    return 0;
  }

  private measureNetworkTiming(): number {
    // Measure WebGL resource loading times
    // Simplified implementation
    return 0;
  }

  private estimateCpuUsage(): number {
    // Estimate CPU usage based on frame timing
    const frameStart = performance.now();

    // Do a small computation to measure available CPU
    let iterations = 0;
    const maxTime = 1; // 1ms max
    while (performance.now() - frameStart < maxTime) {
      Math.random();
      iterations++;
    }

    // More iterations = more available CPU = less usage
    const normalizedIterations = Math.min(iterations / 100000, 1);
    return Math.max(0, (1 - normalizedIterations) * 100);
  }

  recordShaderCompileTime(time: number) {
    this.shaderCompileTimes.push(time);
    if (this.shaderCompileTimes.length > 10) {
      this.shaderCompileTimes.shift();
    }
  }
}

// ================================
// THREAT DETECTOR ACTOR CONTEXT
// ================================
interface ThreatDetectorContext {
  monitor: WebGLSecurityMonitor;
  scorer: ThreatScorerMLLite;
  isActive: boolean;
  detectionInterval: number;
  lastThreatScore: number;
  adaptiveLearning: boolean;
}

type ThreatDetectorEvent =
  | { type: 'START_MONITORING' }
  | { type: 'STOP_MONITORING' }
  | { type: 'TICK' }
  | { type: 'SHADER_COMPILED'; compileTime: number }
  | { type: 'FEEDBACK'; threatId: string; wasReal: boolean }
  | { type: 'SET_INTERVAL'; interval: number };

// ================================
// THREAT DETECTOR ACTOR MACHINE
// ================================
export const threatDetectorActor = createMachine(
  {
    id: 'threat-detector-actor',

    context: {
      monitor: new WebGLSecurityMonitor(),
      scorer: new ThreatScorerMLLite(),
      isActive: false,
      detectionInterval: 1000, // 1 second
      lastThreatScore: 0,
      adaptiveLearning: true
    },

    initial: 'inactive',

    states: {
      inactive: {
        on: {
          START_MONITORING: 'monitoring'
        }
      },

      monitoring: {
        entry: assign({ isActive: () => true }),
        exit: assign({ isActive: () => false }),

        invoke: {
          src: 'continuousMonitoring',
          onDone: {
            actions: 'analyzeThreat'
          },
          onError: {
            actions: 'handleError'
          }
        },

        on: {
          STOP_MONITORING: 'inactive',

          TICK: {
            actions: 'performDetection'
          },

          SHADER_COMPILED: {
            actions: 'recordShaderTime'
          },

          FEEDBACK: {
            cond: 'isAdaptiveLearningEnabled',
            actions: 'updateMLWeights'
          },

          SET_INTERVAL: {
            actions: assign({
              detectionInterval: (_, event) => (event as any).interval
            })
          }
        }
      }
    }
  },
  {
    services: {
      continuousMonitoring: (context) => (callback) => {
        const interval = setInterval(() => {
          callback({ type: 'TICK' });
        }, context.detectionInterval);

        return () => clearInterval(interval);
      }
    },


    actions: {
      performDetection: assign((context) => {
        const metrics = context.monitor.collectMetrics();
        const result = context.scorer.calculate(metrics);

        // Send detection result to parent if significant change
        if (Math.abs(result.score - context.lastThreatScore) > 5 || result.score > 25) {
          // This would send to parent security machine
          console.log('Threat detected:', result);
        }

        return {
          lastThreatScore: result.score
        };
      }),

      recordShaderTime: (context, event: ThreatDetectorEvent & { type: 'SHADER_COMPILED' }) => {
        context.monitor.recordShaderCompileTime(event.compileTime);
      },

      updateMLWeights: (context, event: ThreatDetectorEvent & { type: 'FEEDBACK' }) => {
        if (context.adaptiveLearning) {
          context.scorer.updateWeights({
            threatId: event.threatId,
            wasReal: event.wasReal
          });
        }
      },

      analyzeThreat: () => {
        // Analysis complete action
      },

      handleError: () => {
        console.error('Threat detection error');
      }
    },

    // ============================================
    // GUARDS
    // ============================================
    guards: {
      isAdaptiveLearningEnabled: securityGuards.isAdaptiveLearningEnabled
    }
  }
);