/**
 * 🚌 Lighting Event Bus - Coordination centralisée pour LightingMachine
 * Basé sur recherche Perplexity : Pattern Event Bus pour coordination cross-region
 */

import { EventEmitter } from 'events';

export type LightingEventType =
  | 'LIGHTING_PRESET_CHANGE'
  | 'LIGHTING_INTENSITY_UPDATE'
  | 'LIGHTING_SUBSYSTEM_TOGGLE'
  | 'LIGHTING_PERFORMANCE_ALERT'
  | 'LIGHTING_BATCH_UPDATE'
  | 'LIGHTING_ROLLBACK_REQUEST';

export interface LightingEvent {
  type: LightingEventType;
  payload: any;
  timestamp: number;
  source: string;
  targetRegions?: string[];
  priority?: 'low' | 'normal' | 'high' | 'critical';
}

export interface BatchedUpdate {
  region: string;
  updates: LightingEvent[];
  frameDeadline: number;
}

/**
 * Event Bus centralisé pour coordination des 5 sous-systèmes lighting
 * Implémente batching intelligent et priorisation
 */
export class LightingEventBus extends EventEmitter {
  private static instance: LightingEventBus;
  private batchQueue: Map<string, LightingEvent[]> = new Map();
  private isProcessingBatch = false;
  private frameId: number | null = null;
  private performanceMonitor: PerformanceMonitor;

  private constructor() {
    super();
    this.setMaxListeners(20); // 5 regions * 4 event types
    this.performanceMonitor = new PerformanceMonitor();
  }

  static getInstance(): LightingEventBus {
    if (!LightingEventBus.instance) {
      LightingEventBus.instance = new LightingEventBus();
    }
    return LightingEventBus.instance;
  }

  /**
   * Dispatch event avec batching intelligent
   * Consensus Perplexity + Claude IA : requestAnimationFrame batching
   */
  dispatch(event: LightingEvent): void {
    // Performance monitoring
    const frameTime = this.performanceMonitor.getFrameTime();

    // Circuit breaker si performance dégradée (Claude IA)
    if (frameTime > 17 && event.priority !== 'critical') {
      console.warn(`⚠️ EventBus: Performance degraded (${frameTime}ms), deferring event`);
      this.deferEvent(event);
      return;
    }

    // Batching par région (Perplexity)
    if (event.targetRegions) {
      event.targetRegions.forEach(region => {
        if (!this.batchQueue.has(region)) {
          this.batchQueue.set(region, []);
        }
        this.batchQueue.get(region)!.push(event);
      });
    } else {
      // Broadcast to all regions
      this.emit('broadcast', event);
    }

    // Schedule batch processing
    this.scheduleBatchProcessing();
  }

  /**
   * Batch processing avec requestAnimationFrame
   * Optimisation consensus : 100-150ms windows (Perplexity)
   */
  private scheduleBatchProcessing(): void {
    if (this.isProcessingBatch || this.frameId !== null) {
      return;
    }

    this.frameId = requestAnimationFrame(() => {
      this.processBatch();
      this.frameId = null;
    });
  }

  /**
   * Process batched updates par priorité
   * Order: critical > high > normal > low
   */
  private processBatch(): void {
    if (this.batchQueue.size === 0) return;

    this.isProcessingBatch = true;
    const startTime = performance.now();

    // Group by priority (Perplexity recommendation)
    const priorityGroups = this.groupByPriority();

    // Process in priority order
    for (const [priority, events] of priorityGroups) {
      // Check frame budget (16.67ms target)
      const elapsed = performance.now() - startTime;
      if (elapsed > 12 && priority !== 'critical') {
        // Defer lower priority events to next frame
        this.deferEvents(events);
        break;
      }

      // Process events for this priority
      events.forEach(event => {
        this.emit(event.type, event);
      });
    }

    this.batchQueue.clear();
    this.isProcessingBatch = false;

    // Update performance metrics
    const frameTime = performance.now() - startTime;
    this.performanceMonitor.recordFrame(frameTime);
  }

  /**
   * Group events by priority for ordered processing
   */
  private groupByPriority(): Map<string, LightingEvent[]> {
    const groups = new Map<string, LightingEvent[]>();
    const priorities = ['critical', 'high', 'normal', 'low'];

    priorities.forEach(priority => {
      groups.set(priority, []);
    });

    this.batchQueue.forEach(events => {
      events.forEach(event => {
        const priority = event.priority || 'normal';
        groups.get(priority)!.push(event);
      });
    });

    return groups;
  }

  /**
   * Defer event to next frame cycle
   */
  private deferEvent(event: LightingEvent): void {
    setTimeout(() => this.dispatch(event), 0);
  }

  /**
   * Defer multiple events
   */
  private deferEvents(events: LightingEvent[]): void {
    events.forEach(event => this.deferEvent(event));
  }

  /**
   * Subscribe to specific region events
   */
  subscribeToRegion(region: string, callback: (event: LightingEvent) => void): void {
    this.on(`region:${region}`, callback);
  }

  /**
   * Unsubscribe from region events
   */
  unsubscribeFromRegion(region: string, callback: (event: LightingEvent) => void): void {
    this.off(`region:${region}`, callback);
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics() {
    return this.performanceMonitor.getMetrics();
  }

  /**
   * Cleanup
   */
  dispose(): void {
    if (this.frameId !== null) {
      cancelAnimationFrame(this.frameId);
    }
    this.removeAllListeners();
    this.batchQueue.clear();
  }
}

/**
 * Performance Monitor pour adaptive throttling
 * Consensus : Monitoring temps réel critique
 */
class PerformanceMonitor {
  private frameTimings: number[] = [];
  private maxSamples = 60; // 1 second at 60fps

  recordFrame(frameTime: number): void {
    this.frameTimings.push(frameTime);
    if (this.frameTimings.length > this.maxSamples) {
      this.frameTimings.shift();
    }
  }

  getFrameTime(): number {
    if (this.frameTimings.length === 0) return 0;
    const sum = this.frameTimings.reduce((a, b) => a + b, 0);
    return sum / this.frameTimings.length;
  }

  getMetrics() {
    const avgFrameTime = this.getFrameTime();
    const maxFrameTime = Math.max(...this.frameTimings);
    const fps = avgFrameTime > 0 ? Math.round(1000 / avgFrameTime) : 60;

    return {
      avgFrameTime,
      maxFrameTime,
      fps,
      isPerformant: avgFrameTime < 16.67,
      samples: this.frameTimings.length
    };
  }
}

// Export singleton instance
export const lightingEventBus = LightingEventBus.getInstance();