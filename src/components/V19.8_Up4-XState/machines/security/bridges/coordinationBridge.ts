/**
 * 🌉 COORDINATION BRIDGE B3↔B4↔B5 - Bridge complet (Nos spécificités)
 * Coordination entre LightingMachine, EnvironmentMachine et SecurityMachine
 */

import type { SecurityLevel, PerformanceMode } from '../securityTypes';
import type { LightingEventBus } from '../../lighting/lightingEventBus';
import { SecurityEventBus } from './securityEventBus';

// ================================
// COORDINATION EVENTS
// ================================
export interface CoordinationEvent {
  type: 'SYNC_SECURITY_LEVEL' | 'SYNC_PERFORMANCE_MODE' | 'EMERGENCY_OVERRIDE' | 'SYSTEM_RECOVERY';
  source: 'b3-lighting' | 'b4-environment' | 'b5-security';
  target: ('b3-lighting' | 'b4-environment' | 'b5-security')[];
  data: any;
  priority: 'low' | 'normal' | 'high' | 'critical';
  timestamp: number;
}

// ================================
// COORDINATION STATE
// ================================
interface CoordinationState {
  currentSecurityLevel: SecurityLevel;
  currentPerformanceMode: PerformanceMode;
  systemsOnline: {
    b3Lighting: boolean;
    b4Environment: boolean;
    b5Security: boolean;
  };
  syncInProgress: boolean;
  lastSyncTimestamp: number;
  emergencyMode: boolean;
}

// ================================
// COORDINATION BRIDGE CLASS
// ================================
export class CoordinationBridge {
  private state: CoordinationState = {
    currentSecurityLevel: 'normal',
    currentPerformanceMode: 'normal',
    systemsOnline: {
      b3Lighting: false,
      b4Environment: false,
      b5Security: false
    },
    syncInProgress: false,
    lastSyncTimestamp: 0,
    emergencyMode: false
  };

  private eventHistory: CoordinationEvent[] = [];
  private maxHistorySize = 1000;

  constructor(
    private b3EventBus: LightingEventBus,
    private securityEventBus: SecurityEventBus,
    private b4EnvironmentBridge?: any // Will be injected when B4 is available
  ) {
    this.setupBridgeConnections();
    this.startCoordinationLoop();
  }

  // ================================
  // BRIDGE CONNECTIONS SETUP
  // ================================
  private setupBridgeConnections() {
    // B3 Lighting → Security
    this.b3EventBus.on('LIGHTING_PRESET_CHANGE', (event) => {
      this.handleLightingChange(event);
    });

    this.b3EventBus.on('LIGHTING_PERFORMANCE_ALERT', (event) => {
      this.handlePerformanceAlert('b3-lighting', event);
    });

    // Security → B3 Lighting
    this.securityEventBus.on('security:coordinated', (event) => {
      this.handleSecurityCoordination(event);
    });

    this.securityEventBus.on('security:performance-adjustment', (event) => {
      this.handleSecurityPerformanceAdjustment(event);
    });

    // Mark systems as online
    this.state.systemsOnline.b3Lighting = true;
    this.state.systemsOnline.b5Security = true;

    console.log('🌉 CoordinationBridge: B3↔B5 connections established');
  }

  // ================================
  // EVENT HANDLERS
  // ================================
  private handleLightingChange(event: any) {
    if (this.state.syncInProgress) return;

    const coordinationEvent: CoordinationEvent = {
      type: 'SYNC_SECURITY_LEVEL',
      source: 'b3-lighting',
      target: ['b5-security'],
      data: {
        lightingPreset: event.payload.preset,
        intensity: event.payload.intensity,
        suggestedSecurityLevel: this.mapLightingToSecurityLevel(event.payload)
      },
      priority: 'normal',
      timestamp: Date.now()
    };

    this.processCoordinationEvent(coordinationEvent);
  }

  private handleSecurityCoordination(event: any) {
    if (!event.lighting || !event.environment) return;

    // Sync lighting
    if (this.state.systemsOnline.b3Lighting) {
      this.b3EventBus.emit('LIGHTING_BATCH_UPDATE', {
        type: 'LIGHTING_BATCH_UPDATE',
        payload: {
          updates: [{
            preset: this.mapSecurityToLightingPreset(event.securityLevel),
            intensity: event.lighting.ambientIntensity,
            color: event.lighting.color,
            pattern: event.lighting.pattern
          }],
          source: 'b5-security'
        },
        timestamp: Date.now(),
        source: 'b5-security'
      });
    }

    // Sync environment (when B4 is available)
    if (this.b4EnvironmentBridge && this.state.systemsOnline.b4Environment) {
      this.b4EnvironmentBridge.updateQuality(event.environment.quality);
      this.b4EnvironmentBridge.setHDRBoost(event.environment.hdrBoost);
    }

    console.log(`🔄 Coordination: Security level ${event.securityLevel} synced to B3/B4`);
  }

  private handlePerformanceAlert(source: 'b3-lighting' | 'b4-environment', event: any) {
    const coordinationEvent: CoordinationEvent = {
      type: 'SYNC_PERFORMANCE_MODE',
      source,
      target: ['b5-security'],
      data: {
        performanceMetrics: event.payload,
        suggestedMode: this.calculatePerformanceMode(event.payload),
        urgency: event.payload.critical ? 'critical' : 'high'
      },
      priority: event.payload.critical ? 'critical' : 'high',
      timestamp: Date.now()
    };

    this.processCoordinationEvent(coordinationEvent);
  }

  private handleSecurityPerformanceAdjustment(event: any) {
    // Apply performance adjustments to all systems
    if (this.state.systemsOnline.b3Lighting) {
      this.b3EventBus.emit('LIGHTING_PERFORMANCE_ADJUST', {
        type: 'LIGHTING_PERFORMANCE_ADJUST',
        payload: event.lighting,
        timestamp: Date.now(),
        source: 'b5-security'
      });
    }

    if (this.b4EnvironmentBridge && this.state.systemsOnline.b4Environment) {
      this.b4EnvironmentBridge.adjustPerformance(event.environment);
    }

    console.log('⚡ Performance adjustments coordinated across systems');
  }

  // ================================
  // COORDINATION PROCESSING
  // ================================
  private processCoordinationEvent(event: CoordinationEvent) {
    // Add to history
    this.addEventToHistory(event);

    // Process based on type
    switch (event.type) {
      case 'SYNC_SECURITY_LEVEL':
        this.syncSecurityLevel(event);
        break;
      case 'SYNC_PERFORMANCE_MODE':
        this.syncPerformanceMode(event);
        break;
      case 'EMERGENCY_OVERRIDE':
        this.handleEmergencyOverride(event);
        break;
      case 'SYSTEM_RECOVERY':
        this.handleSystemRecovery(event);
        break;
    }
  }

  private syncSecurityLevel(event: CoordinationEvent) {
    if (event.data.suggestedSecurityLevel) {
      this.state.currentSecurityLevel = event.data.suggestedSecurityLevel;
      this.state.lastSyncTimestamp = Date.now();

      // Notify security system
      this.securityEventBus.enqueueSecurityEvent({
        type: 'SECURITY_LEVEL_CHANGE',
        payload: {
          level: event.data.suggestedSecurityLevel,
          source: event.source,
          reason: 'coordination'
        },
        timestamp: Date.now(),
        source: 'b5-security',
        targetSystems: ['visual-effects'],
        priority: 'high',
        securityLevel: event.data.suggestedSecurityLevel
      });
    }
  }

  private syncPerformanceMode(event: CoordinationEvent) {
    if (event.data.suggestedMode) {
      this.state.currentPerformanceMode = event.data.suggestedMode;
      this.state.lastSyncTimestamp = Date.now();

      // Notify security system about performance mode
      this.securityEventBus.enqueueSecurityEvent({
        type: 'SECURITY_PERFORMANCE_DEGRADED',
        payload: {
          mode: event.data.suggestedMode,
          metrics: event.data.performanceMetrics,
          source: event.source
        },
        timestamp: Date.now(),
        source: 'b5-security',
        targetSystems: ['b3-lighting', 'b4-environment'],
        priority: event.priority,
        securityLevel: this.state.currentSecurityLevel
      });
    }
  }

  private handleEmergencyOverride(event: CoordinationEvent) {
    this.state.emergencyMode = true;
    this.state.currentSecurityLevel = 'lockdown';

    // Emergency coordination
    const emergencyConfig = {
      lighting: {
        preset: 'EMERGENCY',
        intensity: 2.0,
        color: '#ff0000',
        pattern: 'flash'
      },
      environment: {
        quality: 'low',
        hdrBoost: 0.3,
        cacheEnabled: false
      },
      security: {
        level: 'lockdown',
        alertsEnabled: true,
        performanceMode: 'minimal'
      }
    };

    // Apply emergency configuration to all systems
    this.securityEventBus.sendSecurityAlert('lockdown', 'distortion');

    console.error('🚨 EMERGENCY OVERRIDE: All systems in lockdown mode');
  }

  private handleSystemRecovery(event: CoordinationEvent) {
    this.state.emergencyMode = false;
    this.state.currentSecurityLevel = 'normal';
    this.state.currentPerformanceMode = 'normal';

    // Recovery coordination
    this.securityEventBus.sendSecurityAlert('normal');

    console.log('🔄 SYSTEM RECOVERY: All systems restored to normal operation');
  }

  // ================================
  // COORDINATION LOOP
  // ================================
  private startCoordinationLoop() {
    // Process coordination every 2 seconds
    setInterval(() => {
      this.processCoordinationTick();
    }, 2000);
  }

  private processCoordinationTick() {
    // Check system health
    const systemsHealth = this.checkSystemsHealth();

    // Process pending coordination if needed
    if (!this.state.syncInProgress && systemsHealth.needsCoordination) {
      this.performCoordinationSync();
    }

    // Cleanup old events
    this.cleanupEventHistory();
  }

  private checkSystemsHealth() {
    const now = Date.now();
    const timeSinceLastSync = now - this.state.lastSyncTimestamp;

    return {
      needsCoordination: timeSinceLastSync > 30000, // 30 seconds
      systemsOnline: this.state.systemsOnline,
      emergencyMode: this.state.emergencyMode
    };
  }

  private performCoordinationSync() {
    this.state.syncInProgress = true;

    // Sync current states across systems
    const syncEvent: CoordinationEvent = {
      type: 'SYNC_SECURITY_LEVEL',
      source: 'b5-security',
      target: ['b3-lighting', 'b4-environment'],
      data: {
        currentSecurityLevel: this.state.currentSecurityLevel,
        currentPerformanceMode: this.state.currentPerformanceMode,
        timestamp: Date.now()
      },
      priority: 'normal',
      timestamp: Date.now()
    };

    this.processCoordinationEvent(syncEvent);

    setTimeout(() => {
      this.state.syncInProgress = false;
    }, 1000);
  }

  // ================================
  // UTILITIES
  // ================================
  private mapLightingToSecurityLevel(lightingData: any): SecurityLevel {
    const intensity = lightingData.intensity || 1.0;

    if (intensity > 1.8) return 'lockdown';
    if (intensity > 1.4) return 'alert';
    if (intensity > 1.1) return 'scanning';
    return 'normal';
  }

  private mapSecurityToLightingPreset(securityLevel: SecurityLevel): string {
    return {
      normal: 'DEFAULT',
      scanning: 'DRAMATIC',
      alert: 'ALERT',
      lockdown: 'EMERGENCY'
    }[securityLevel] || 'DEFAULT';
  }

  private calculatePerformanceMode(metrics: any): PerformanceMode {
    const fps = metrics.fps || 60;
    const frameTime = metrics.frameTime || 16;

    if (fps < 25 || frameTime > 40) return 'minimal';
    if (fps < 40 || frameTime > 25) return 'reduced';
    return 'normal';
  }

  private addEventToHistory(event: CoordinationEvent) {
    this.eventHistory.push(event);
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory.shift();
    }
  }

  private cleanupEventHistory() {
    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    this.eventHistory = this.eventHistory.filter(
      event => event.timestamp > oneHourAgo
    );
  }

  // ================================
  // PUBLIC API
  // ================================
  public triggerEmergency(reason: string) {
    const emergencyEvent: CoordinationEvent = {
      type: 'EMERGENCY_OVERRIDE',
      source: 'b5-security',
      target: ['b3-lighting', 'b4-environment'],
      data: { reason, triggeredAt: Date.now() },
      priority: 'critical',
      timestamp: Date.now()
    };

    this.processCoordinationEvent(emergencyEvent);
  }

  public triggerRecovery() {
    const recoveryEvent: CoordinationEvent = {
      type: 'SYSTEM_RECOVERY',
      source: 'b5-security',
      target: ['b3-lighting', 'b4-environment'],
      data: { recoveredAt: Date.now() },
      priority: 'high',
      timestamp: Date.now()
    };

    this.processCoordinationEvent(recoveryEvent);
  }

  public getCoordinationState() {
    return {
      ...this.state,
      eventHistory: this.eventHistory.slice(-10), // Last 10 events
      stats: {
        totalEvents: this.eventHistory.length,
        systemsOnlineCount: Object.values(this.state.systemsOnline).filter(Boolean).length,
        uptime: Date.now() - this.state.lastSyncTimestamp
      }
    };
  }

  public connectB4Environment(bridge: any) {
    this.b4EnvironmentBridge = bridge;
    this.state.systemsOnline.b4Environment = true;
    console.log('🌉 CoordinationBridge: B4 Environment connected');
  }

  public disconnectSystem(system: keyof CoordinationState['systemsOnline']) {
    this.state.systemsOnline[system] = false;
    console.log(`🌉 CoordinationBridge: ${system} disconnected`);
  }
}