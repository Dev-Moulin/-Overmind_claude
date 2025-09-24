/**
 * 🔧 THREAT ANALYSIS SERVICE - Circuit Breaker + Performance (Claude IA)
 * Services pour analyse de menaces et protection circuit breaker
 */

import type { PerformanceMetrics, CircuitBreakerConfig } from '../securityTypes';

// ================================
// PERFORMANCE CIRCUIT BREAKER
// ================================
export class SecurityCircuitBreaker {
  private state: 'closed' | 'open' | 'half-open' = 'closed';
  private failureCount = 0;
  private lastFailureTime = 0;
  private successCount = 0;

  constructor(private config: CircuitBreakerConfig) {}

  async execute<T>(fn: () => Promise<T> | T): Promise<T> {
    if (this.state === 'open') {
      if (Date.now() - this.lastFailureTime > this.config.resetTimeout) {
        this.state = 'half-open';
        this.successCount = 0;
      } else {
        throw new Error('Circuit breaker is OPEN');
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  check(metrics: PerformanceMetrics): 'NORMAL' | 'REDUCE' | 'MINIMAL' {
    const { maxCpu, maxMemory, minFps } = this.config.performanceThreshold;

    if (metrics.cpuUsage > maxCpu || metrics.fps < minFps || metrics.memoryUsage > maxMemory) {
      if (metrics.cpuUsage > maxCpu * 1.5 || metrics.fps < minFps * 0.5) {
        return 'MINIMAL';
      }
      return 'REDUCE';
    }

    return 'NORMAL';
  }

  private onSuccess() {
    this.failureCount = 0;
    if (this.state === 'half-open') {
      this.successCount++;
      if (this.successCount >= 3) {
        this.state = 'closed';
      }
    }
  }

  private onFailure() {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.failureCount >= this.config.failureThreshold) {
      this.state = 'open';
    }
  }

  getState() {
    return {
      state: this.state,
      failureCount: this.failureCount,
      lastFailureTime: this.lastFailureTime,
      successCount: this.successCount
    };
  }
}

// ================================
// ADAPTIVE THROTTLER
// ================================
export class AdaptiveThrottler {
  private lastExecution = 0;
  private currentInterval = 16; // Start at 60fps
  private readonly minInterval = 16; // 60fps max
  private readonly maxInterval = 100; // 10fps min
  private performanceHistory: number[] = [];

  throttle<T extends (...args: any[]) => any>(
    fn: T,
    metrics: PerformanceMetrics
  ): T {
    return ((...args: any[]) => {
      const now = Date.now();

      if (now - this.lastExecution < this.currentInterval) {
        return; // Skip execution
      }

      this.adaptInterval(metrics);
      this.lastExecution = now;

      return fn(...args);
    }) as T;
  }

  private adaptInterval(metrics: PerformanceMetrics) {
    // Track performance history
    this.performanceHistory.push(metrics.frameTime);
    if (this.performanceHistory.length > 10) {
      this.performanceHistory.shift();
    }

    const avgFrameTime = this.performanceHistory.reduce((a, b) => a + b, 0) / this.performanceHistory.length;

    // Adapt interval based on performance
    if (avgFrameTime > 20) { // Slower than 50fps
      this.currentInterval = Math.min(this.currentInterval * 1.2, this.maxInterval);
    } else if (avgFrameTime < 16) { // Faster than 60fps
      this.currentInterval = Math.max(this.currentInterval * 0.9, this.minInterval);
    }
  }

  getCurrentInterval() {
    return this.currentInterval;
  }
}

// ================================
// WEBGL MONITOR SERVICE
// ================================
export class WebGLMonitorService {
  private contextLossCount = 0;
  private shaderCompileTimes: number[] = [];
  private memoryUsageHistory: number[] = [];

  monitor(renderer: any): () => void {
    const gl = renderer.getContext();

    // Hook shader compilation
    const originalCompileShader = gl.compileShader.bind(gl);
    gl.compileShader = (shader: WebGLShader) => {
      const start = performance.now();
      const result = originalCompileShader(shader);
      const compileTime = performance.now() - start;

      this.recordShaderCompileTime(compileTime);

      if (compileTime > 100) { // > 100ms is suspicious
        console.warn('Slow shader compilation detected:', compileTime);
      }

      return result;
    };

    // Monitor context loss
    const canvas = renderer.domElement;
    const onContextLost = (event: Event) => {
      this.contextLossCount++;
      console.warn('WebGL context lost:', this.contextLossCount);
      event.preventDefault();
    };

    const onContextRestored = () => {
      console.log('WebGL context restored');
    };

    canvas.addEventListener('webglcontextlost', onContextLost);
    canvas.addEventListener('webglcontextrestored', onContextRestored);

    // Memory monitoring
    const memoryInterval = setInterval(() => {
      this.trackMemoryUsage();
    }, 5000);

    // Cleanup function
    return () => {
      canvas.removeEventListener('webglcontextlost', onContextLost);
      canvas.removeEventListener('webglcontextrestored', onContextRestored);
      clearInterval(memoryInterval);

      // Restore original shader compilation
      gl.compileShader = originalCompileShader;
    };
  }

  private recordShaderCompileTime(time: number) {
    this.shaderCompileTimes.push(time);
    if (this.shaderCompileTimes.length > 20) {
      this.shaderCompileTimes.shift();
    }
  }

  private trackMemoryUsage() {
    if ((performance as any).memory) {
      const memory = (performance as any).memory;
      const usedMB = memory.usedJSHeapSize / (1024 * 1024);

      this.memoryUsageHistory.push(usedMB);
      if (this.memoryUsageHistory.length > 60) { // Keep 5 minutes of history
        this.memoryUsageHistory.shift();
      }
    }
  }

  getMetrics() {
    const avgShaderTime = this.shaderCompileTimes.length > 0 ?
      this.shaderCompileTimes.reduce((a, b) => a + b, 0) / this.shaderCompileTimes.length :
      0;

    const currentMemory = this.memoryUsageHistory[this.memoryUsageHistory.length - 1] || 0;

    // Detect memory leaks (rapid growth)
    let memoryGrowthRate = 0;
    if (this.memoryUsageHistory.length >= 10) {
      const recent = this.memoryUsageHistory.slice(-5);
      const older = this.memoryUsageHistory.slice(-10, -5);
      const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
      const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;
      memoryGrowthRate = recentAvg - olderAvg;
    }

    return {
      contextLossCount: this.contextLossCount,
      avgShaderCompileTime: avgShaderTime,
      currentMemoryUsage: currentMemory,
      memoryGrowthRate,
      shaderCompileHistory: [...this.shaderCompileTimes],
      memoryHistory: [...this.memoryUsageHistory]
    };
  }
}

// ================================
// CIRCUIT BREAKER SERVICE (for XState)
// ================================
export const circuitBreakerService = () => (callback: any) => {
  const config: CircuitBreakerConfig = {
    failureThreshold: 5,
    resetTimeout: 10000, // 10 seconds
    monitoringPeriod: 1000, // 1 second
    performanceThreshold: {
      maxCpu: 15,
      maxMemory: 512,
      minFps: 30
    }
  };

  const circuitBreaker = new SecurityCircuitBreaker(config);
  const throttler = new AdaptiveThrottler();

  const monitor = () => {
    const metrics: PerformanceMetrics = {
      fps: 60, // Would be measured from actual render loop
      frameTime: 16,
      cpuUsage: 5,
      memoryUsage: 128,
      renderCalls: 100,
      triangles: 50000
    };

    const status = circuitBreaker.check(metrics);

    if (status !== 'NORMAL') {
      callback({
        type: 'PERFORMANCE_DEGRADED',
        metrics,
        recommendation: status
      });
    }
  };

  const interval = setInterval(monitor, config.monitoringPeriod);

  return () => {
    clearInterval(interval);
  };
};

// ================================
// DEFAULT CONFIGURATIONS
// ================================
export const DEFAULT_CIRCUIT_BREAKER_CONFIG: CircuitBreakerConfig = {
  failureThreshold: 3,
  resetTimeout: 5000,
  monitoringPeriod: 1000,
  performanceThreshold: {
    maxCpu: 10,
    maxMemory: 256,
    minFps: 45
  }
};