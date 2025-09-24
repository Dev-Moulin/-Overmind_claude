/**
 * 🚌 SECURITY EVENT BUS - Extension LightingEventBus (Claude IA + Nos spécificités)
 * Bridge pour coordination B3/B4/B5 avec priority queue
 */

import { LightingEventBus, type LightingEvent } from '../../lighting/lightingEventBus';
import type { SecurityLevel, AlertPattern, PerformanceMode } from '../securityTypes';

// ================================
// SECURITY EVENT TYPES
// ================================
export type SecurityEventType =
  | 'SECURITY_LEVEL_CHANGE'
  | 'SECURITY_THREAT_DETECTED'
  | 'SECURITY_ALERT_TRIGGERED'
  | 'SECURITY_PERFORMANCE_DEGRADED'
  | 'SECURITY_BRIDGE_CONNECT'
  | 'SECURITY_COORDINATION_BATCH';

export interface SecurityEvent {
  type: SecurityEventType;
  payload: any;
  timestamp: number;
  source: 'b5-security';
  targetSystems: ('b3-lighting' | 'b4-environment' | 'visual-effects')[];
  priority: 'low' | 'normal' | 'high' | 'critical';
  securityLevel: SecurityLevel;
}

// ================================
// SECURITY COORDINATION PRESETS
// ================================
export const SECURITY_LIGHTING_PRESETS = {
  normal: {
    ambientIntensity: 1.0,
    directionalIntensity: 1.0,
    color: '#ffffff',
    pattern: 'steady'
  },
  scanning: {
    ambientIntensity: 0.8,
    directionalIntensity: 1.2,
    color: '#ffff00',
    pattern: 'pulse'
  },
  alert: {
    ambientIntensity: 0.6,
    directionalIntensity: 1.5,
    color: '#ff8800',
    pattern: 'flash'
  },
  lockdown: {
    ambientIntensity: 0.3,
    directionalIntensity: 2.0,
    color: '#ff0000',
    pattern: 'emergency'
  }
} as const;

export const SECURITY_ENVIRONMENT_CONFIG = {
  normal: {
    quality: 'auto',
    hdrBoost: 1.0,
    cacheEnabled: true
  },
  scanning: {
    quality: 'high',
    hdrBoost: 1.2,
    cacheEnabled: true
  },
  alert: {
    quality: 'medium',
    hdrBoost: 0.8,
    cacheEnabled: true
  },
  lockdown: {
    quality: 'low',
    hdrBoost: 0.5,
    cacheEnabled: false
  }
} as const;

// ================================
// PRIORITY QUEUE
// ================================
class PriorityQueue<T> {
  private items: Array<{ item: T; priority: number }> = [];

  constructor(private maxSize: number = 1000) {}

  enqueue(item: T, priority: number) {
    if (this.items.length >= this.maxSize) {
      this.items.shift(); // Remove oldest if at capacity
    }

    const queueItem = { item, priority };
    let added = false;

    // Insert in priority order (highest priority first)
    for (let i = 0; i < this.items.length; i++) {
      if (queueItem.priority > this.items[i].priority) {
        this.items.splice(i, 0, queueItem);
        added = true;
        break;
      }
    }

    if (!added) {
      this.items.push(queueItem);
    }
  }

  dequeue(): T | undefined {
    return this.items.shift()?.item;
  }

  dequeueBatch(count: number): T[] {
    const batch: T[] = [];
    for (let i = 0; i < count && this.items.length > 0; i++) {
      const item = this.dequeue();
      if (item) batch.push(item);
    }
    return batch;
  }

  peek(): T | undefined {
    return this.items[0]?.item;
  }

  size(): number {
    return this.items.length;
  }

  clear() {
    this.items = [];
  }
}

// ================================
// SECURITY EVENT BUS (COMPOSITION)
// ================================
export class SecurityEventBus {
  private static securityInstance: SecurityEventBus;
  private lightingEventBus: LightingEventBus;
  private securityQueues = {
    critical: new PriorityQueue<SecurityEvent>(100),
    high: new PriorityQueue<SecurityEvent>(200),
    normal: new PriorityQueue<SecurityEvent>(500),
    low: new PriorityQueue<SecurityEvent>(1000)
  };

  private bridgedSystems = new Set<string>();
  private coordinationEnabled = true;

  constructor(existingB3Bus?: LightingEventBus) {
    this.lightingEventBus = existingB3Bus || LightingEventBus.getInstance();

    if (existingB3Bus) {
      this.bridgeWith(existingB3Bus);
    }

    // Setup security-specific event handling
    this.setupSecurityHandlers();
  }

  // Delegate methods to LightingEventBus
  on(event: string, listener: (...args: any[]) => void) {
    this.lightingEventBus.on(event, listener);
  }

  emit(event: string, ...args: any[]) {
    return this.lightingEventBus.emit(event, ...args);
  }

  off(event: string, listener: (...args: any[]) => void) {
    this.lightingEventBus.off(event, listener);
  }

  static getInstance(existingB3Bus?: LightingEventBus): SecurityEventBus {
    if (!SecurityEventBus.securityInstance) {
      SecurityEventBus.securityInstance = new SecurityEventBus(existingB3Bus);
    }
    return SecurityEventBus.securityInstance;
  }

  // ================================
  // BRIDGE WITH EXISTING B3 EVENTBUS
  // ================================
  private bridgeWith(b3EventBus: LightingEventBus) {
    // Forward relevant lighting events to security
    b3EventBus.on('LIGHTING_PERFORMANCE_ALERT', (event: LightingEvent) => {
      this.emit('security:performance', {
        type: 'SECURITY_PERFORMANCE_DEGRADED',
        source: 'b3-lighting',
        data: event.payload
      });
    });

    // Forward security events to lighting
    this.on('security:coordinated', (data: any) => {
      if (data.lighting) {
        b3EventBus.emit('LIGHTING_BATCH_UPDATE', {
          type: 'LIGHTING_BATCH_UPDATE',
          payload: {
            updates: [data.lighting],
            source: 'b5-security'
          },
          timestamp: Date.now(),
          source: 'b5-security'
        });
      }
    });

    this.bridgedSystems.add('b3-lighting');
  }

  // ================================
  // SECURITY ALERT COORDINATION
  // ================================
  sendSecurityAlert(level: SecurityLevel, pattern?: AlertPattern) {
    if (!this.coordinationEnabled) return;

    // Create coordinated batch for B3 + B4
    const batch = {
      lighting: {
        ...SECURITY_LIGHTING_PRESETS[level],
        pattern: pattern || SECURITY_LIGHTING_PRESETS[level].pattern
      },
      environment: SECURITY_ENVIRONMENT_CONFIG[level],
      timestamp: Date.now(),
      securityLevel: level
    };

    // Emit coordinated event
    this.emit('security:coordinated', batch);

    // Also emit to specific systems
    if (this.bridgedSystems.has('b3-lighting')) {
      this.emit('lighting:security-override', {
        type: 'LIGHTING_SECURITY_OVERRIDE',
        level,
        config: batch.lighting
      });
    }

    if (this.bridgedSystems.has('b4-environment')) {
      this.emit('environment:security-override', {
        type: 'ENVIRONMENT_SECURITY_OVERRIDE',
        level,
        config: batch.environment
      });
    }

    return batch;
  }

  // ================================
  // PRIORITY QUEUE PROCESSING
  // ================================
  enqueueSecurityEvent(event: SecurityEvent) {
    const priorityValue = this.getPriorityValue(event.priority);
    this.securityQueues[event.priority].enqueue(event, priorityValue);

    // Process immediately if critical
    if (event.priority === 'critical') {
      this.processCriticalQueue();
    }
  }

  private getPriorityValue(priority: SecurityEvent['priority']): number {
    return {
      critical: 100,
      high: 75,
      normal: 50,
      low: 25
    }[priority];
  }

  private processCriticalQueue() {
    const criticalEvents = this.securityQueues.critical.dequeueBatch(10);
    criticalEvents.forEach(event => this.processSecurityEvent(event));
  }

  processBatch(priority: 'critical' | 'high' | 'normal' | 'low') {
    const batchSize = priority === 'critical' ? 10 :
                     priority === 'high' ? 25 :
                     priority === 'normal' ? 50 : 100;

    const batch = this.securityQueues[priority].dequeueBatch(batchSize);

    if (batch.length > 0) {
      this.emit('security:batch', {
        priority,
        events: batch,
        timestamp: Date.now()
      });

      // Process each event
      batch.forEach(event => this.processSecurityEvent(event));
    }

    return batch.length;
  }

  // ================================
  // EVENT PROCESSING
  // ================================
  private processSecurityEvent(event: SecurityEvent) {
    switch (event.type) {
      case 'SECURITY_LEVEL_CHANGE':
        this.sendSecurityAlert(event.securityLevel);
        break;

      case 'SECURITY_THREAT_DETECTED':
        if (event.payload.score > 75) {
          this.sendSecurityAlert('lockdown', 'distortion');
        } else if (event.payload.score > 50) {
          this.sendSecurityAlert('alert', 'flash');
        }
        break;

      case 'SECURITY_PERFORMANCE_DEGRADED':
        this.adjustPerformanceCoordination(event.payload.mode);
        break;

      default:
        console.warn('Unknown security event type:', event.type);
    }
  }

  private adjustPerformanceCoordination(mode: PerformanceMode) {
    const adjustments = {
      minimal: {
        lighting: { ambientIntensity: 0.2, directionalIntensity: 0.5 },
        environment: { quality: 'low', hdrBoost: 0.3 }
      },
      reduced: {
        lighting: { ambientIntensity: 0.6, directionalIntensity: 0.8 },
        environment: { quality: 'medium', hdrBoost: 0.7 }
      },
      normal: {
        lighting: { ambientIntensity: 1.0, directionalIntensity: 1.0 },
        environment: { quality: 'auto', hdrBoost: 1.0 }
      }
    };

    const adjustment = adjustments[mode] || adjustments.normal;
    this.emit('security:performance-adjustment', adjustment);
  }

  // ================================
  // SETUP AND UTILITIES
  // ================================
  private setupSecurityHandlers() {
    // Auto-processing for different priorities
    setInterval(() => this.processBatch('high'), 1000);      // Every 1s
    setInterval(() => this.processBatch('normal'), 2000);    // Every 2s
    setInterval(() => this.processBatch('low'), 5000);       // Every 5s
  }

  // ================================
  // PUBLIC API
  // ================================
  connectBridge(system: 'b3-lighting' | 'b4-environment' | 'visual-effects') {
    this.bridgedSystems.add(system);
    this.emit(`${system}:connected`, { timestamp: Date.now() });
  }

  disconnectBridge(system: 'b3-lighting' | 'b4-environment' | 'visual-effects') {
    this.bridgedSystems.delete(system);
    this.emit(`${system}:disconnected`, { timestamp: Date.now() });
  }

  enableCoordination() {
    this.coordinationEnabled = true;
  }

  disableCoordination() {
    this.coordinationEnabled = false;
  }

  getQueueStats() {
    return {
      critical: this.securityQueues.critical.size(),
      high: this.securityQueues.high.size(),
      normal: this.securityQueues.normal.size(),
      low: this.securityQueues.low.size(),
      bridgedSystems: Array.from(this.bridgedSystems),
      coordinationEnabled: this.coordinationEnabled
    };
  }

  clearQueues() {
    Object.values(this.securityQueues).forEach(queue => queue.clear());
  }
}