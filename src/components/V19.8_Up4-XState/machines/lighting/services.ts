/**
 * 🔧 Services pour LightingMachine - Base Lighting et Performance
 * Architecture hybride avec batching intelligent (Perplexity) + Circuit breaker (Claude IA)
 */

import type { LightingContext, PresetConfig } from './types';
import { LightingPreset } from './types';
import { lightingEventBus } from './lightingEventBus';
import { lightingFeatureFlags } from './featureFlags';
import { MigrationLevel } from './types';

// ============================================
// BASE LIGHTING SERVICES
// ============================================

export const initBaseLighting = async (context: LightingContext) => {
  console.log('🌞 Initializing Base Lighting...');

  // Check feature flag
  if (!lightingFeatureFlags.isRegionXStateEnabled('baseLighting')) {
    console.log('🚩 Base Lighting: XState disabled, using legacy only');
    return { success: true, legacy: true };
  }

  try {
    // Initialize performance monitoring
    const startTime = performance.now();

    // Event bus notification
    if (context.eventBus) {
      context.eventBus.dispatch({
        type: 'LIGHTING_SUBSYSTEM_TOGGLE',
        payload: { subsystem: 'baseLighting', enabled: true },
        timestamp: Date.now(),
        source: 'XState',
        priority: 'high'
      });
    }

    // Legacy bridge initialization (safe fallback)
    if (context.legacyBridge) {
      const legacyResult = context.legacyBridge.safeSetGlobalLightingMultipliers(
        context.baseLighting.ambientIntensity,
        context.baseLighting.directionalIntensity
      );

      if (!legacyResult && context.migrationState.rollbackCapability) {
        console.warn('⚠️ Base Lighting: Legacy bridge failed, staying in XState mode');
      }
    }

    // Performance check
    const initTime = performance.now() - startTime;
    if (initTime > context.performanceConfig.targetFrameTime) {
      console.warn(`⚠️ Base Lighting: Init took ${initTime.toFixed(2)}ms (target: ${context.performanceConfig.targetFrameTime}ms)`);
    }

    console.log('✅ Base Lighting initialized successfully');
    return { success: true, initTime };

  } catch (error) {
    console.error('❌ Base Lighting: Initialization failed:', error);

    // Circuit breaker - fallback to legacy
    if (context.migrationState.rollbackCapability) {
      lightingFeatureFlags.rollbackRegion('baseLighting');
      console.log('🔄 Base Lighting: Rolled back to legacy due to error');
    }

    return { success: false, error: error.message };
  }
};

export const updateBaseLightingIntensity = async (
  context: LightingContext,
  event: { ambient: number; directional: number }
) => {
  console.log(`🌞 Updating Base Lighting intensity (ambient: ${event.ambient}, directional: ${event.directional})`);

  const startTime = performance.now();

  try {
    // Update context
    context.baseLighting.ambientIntensity = event.ambient;
    context.baseLighting.directionalIntensity = event.directional;

    // Batch update pour performance (Perplexity pattern)
    const batchUpdate = {
      type: 'baseLighting',
      params: [
        { method: 'setGlobalMultipliers', params: [event.ambient, event.directional] }
      ],
      timestamp: Date.now()
    };

    context.batchQueue.push(batchUpdate);

    // Legacy bridge update
    if (context.legacyBridge) {
      const success = context.legacyBridge.safeSetGlobalLightingMultipliers(
        event.ambient,
        event.directional
      );

      if (!success) {
        console.warn('⚠️ Base Lighting: Legacy update failed');
      }
    }

    // Performance monitoring
    const updateTime = performance.now() - startTime;
    context.performance.frameTime = updateTime;

    // Adaptive throttling check (consensus)
    if (updateTime > context.performanceConfig.alertThreshold) {
      context.performance.adaptiveThrottling = true;
      console.warn(`⚠️ Performance: Frame time ${updateTime.toFixed(2)}ms, enabling throttling`);
    }

    return { success: true, updateTime };

  } catch (error) {
    console.error('❌ Base Lighting: Update failed:', error);
    return { success: false, error: error.message };
  }
};

// ============================================
// PRESET SERVICES
// ============================================

export const applyLightingPreset = async (
  context: LightingContext,
  event: { preset: LightingPreset }
) => {
  console.log(`🎨 Applying lighting preset: ${event.preset}`);

  const startTime = performance.now();

  try {
    // Get preset configuration
    const presetConfig = getLightingPresetConfig(event.preset);
    if (!presetConfig) {
      throw new Error(`Unknown preset: ${event.preset}`);
    }

    // Event bus orchestration (Perplexity pattern)
    if (context.eventBus) {
      context.eventBus.dispatch({
        type: 'LIGHTING_PRESET_CHANGE',
        payload: { preset: event.preset, config: presetConfig },
        timestamp: Date.now(),
        source: 'XState',
        targetRegions: ['baseLighting', 'advancedLighting', 'areaLights', 'lightProbes', 'hdrBoost'],
        priority: 'high'
      });
    }

    // Batch all preset changes (performance optimization)
    const batchUpdates = [];

    // Base lighting updates
    if (presetConfig.ambient || presetConfig.directional) {
      batchUpdates.push({
        method: 'setGlobalMultipliers',
        params: [
          presetConfig.ambient?.intensity || context.baseLighting.ambientIntensity,
          presetConfig.directional?.intensity || context.baseLighting.directionalIntensity
        ]
      });
    }

    // Advanced lighting updates
    if (presetConfig.advanced?.enabled) {
      batchUpdates.push({
        method: 'toggleAdvancedLighting',
        params: [true]
      });

      if (presetConfig.advanced.spotIntensity || presetConfig.advanced.dirIntensity) {
        batchUpdates.push({
          method: 'setAdvancedIntensities',
          params: [presetConfig.advanced.spotIntensity || 1.0, presetConfig.advanced.dirIntensity || 1.0]
        });
      }
    }

    // Area lights updates
    if (presetConfig.areaLights?.enabled) {
      batchUpdates.push({ method: 'toggleAreaLights', params: [true] });
    }

    // Light probes updates
    if (presetConfig.lightProbes?.enabled) {
      batchUpdates.push({ method: 'toggleLightProbes', params: [true] });
    }

    // HDR boost updates
    if (presetConfig.hdrBoost?.enabled) {
      batchUpdates.push({ method: 'applyHDRBoost', params: [] });
    }

    // Execute batch via legacy bridge
    if (context.legacyBridge && batchUpdates.length > 0) {
      const results = context.legacyBridge.safeBatchLightingUpdates(batchUpdates);
      const successCount = results.filter(r => r).length;

      console.log(`🔄 Preset batch executed: ${successCount}/${batchUpdates.length} successful`);
    }

    // Update context
    context.currentPreset = event.preset;

    // Performance check
    const applyTime = performance.now() - startTime;
    if (applyTime > context.performanceConfig.alertThreshold) {
      console.warn(`⚠️ Preset application took ${applyTime.toFixed(2)}ms`);
    }

    console.log(`✅ Lighting preset '${event.preset}' applied successfully`);
    return { success: true, preset: event.preset, applyTime };

  } catch (error) {
    console.error(`❌ Error applying preset '${event.preset}':`, error);
    return { success: false, error: error.message };
  }
};

// ============================================
// ADVANCED LIGHTING SERVICES
// ============================================

export const initAdvancedLighting = async (context: LightingContext) => {
  console.log('🔧 Initializing Advanced Lighting...');

  if (!lightingFeatureFlags.isRegionXStateEnabled('advancedLighting')) {
    console.log('🚩 Advanced Lighting: XState disabled, using legacy only');
    return { success: true, legacy: true };
  }

  try {
    // Enable advanced lighting via bridge
    if (context.legacyBridge) {
      const success = context.legacyBridge.safeToggleAdvancedLighting(true);
      if (!success) {
        throw new Error('Failed to enable advanced lighting via bridge');
      }
    }

    // Update context
    context.advancedLighting.enabled = true;

    console.log('✅ Advanced Lighting initialized');
    return { success: true };

  } catch (error) {
    console.error('❌ Advanced Lighting: Initialization failed:', error);

    // Rollback on failure
    if (context.migrationState.rollbackCapability) {
      lightingFeatureFlags.rollbackRegion('advancedLighting');
    }

    return { success: false, error: error.message };
  }
};

// ============================================
// PERFORMANCE MONITORING SERVICE
// ============================================

export const createPerformanceMonitorService = (context: LightingContext) => {
  return () => {
    console.log('📊 Starting Performance Monitor Service...');

    const monitorInterval = setInterval(() => {
      // Update performance metrics
      const now = performance.now();
      const frameTime = context.performance.frameTime;

      // Calculate FPS
      const fps = frameTime > 0 ? Math.round(1000 / frameTime) : 60;
      context.performance.fps = fps;

      // Circuit breaker check (Claude IA pattern)
      if (fps < context.performanceConfig.circuitBreakerThreshold) {
        console.warn(`🚨 Performance: FPS dropped to ${fps}, triggering circuit breaker`);

        // Emergency rollback if performance is too degraded
        if (context.migrationState.rollbackOnPerformanceDegradation !== false) {
          lightingFeatureFlags.emergencyRollback(`Performance degraded: ${fps}fps`);
        }

        // Trigger event
        if (context.eventBus) {
          context.eventBus.dispatch({
            type: 'LIGHTING_PERFORMANCE_ALERT',
            payload: { fps, frameTime },
            timestamp: Date.now(),
            source: 'PerformanceMonitor',
            priority: 'critical'
          });
        }
      }

      // Log performance metrics (if debug enabled)
      if (lightingFeatureFlags.getFlags().verboseLogging) {
        console.log(`📊 Performance: ${fps}fps, ${frameTime.toFixed(2)}ms frame time`);
      }

    }, 1000); // Check every second

    // Cleanup function
    return () => {
      clearInterval(monitorInterval);
      console.log('📊 Performance Monitor Service stopped');
    };
  };
};

// ============================================
// BATCH PROCESSOR SERVICE
// ============================================

export const createBatchProcessorService = (context: LightingContext) => {
  return () => {
    console.log('🔄 Starting Batch Processor Service...');

    const processBatch = () => {
      if (context.batchQueue.length === 0) return;

      const startTime = performance.now();
      const batchSize = Math.min(context.batchQueue.length, context.performanceConfig.maxBatchSize);
      const batchToProcess = context.batchQueue.splice(0, batchSize);

      console.log(`🔄 Processing batch of ${batchToProcess.length} updates...`);

      // Group by type pour optimisation
      const grouped = batchToProcess.reduce((acc, update) => {
        if (!acc[update.type]) acc[update.type] = [];
        acc[update.type].push(update);
        return acc;
      }, {} as Record<string, any[]>);

      // Process each group
      Object.entries(grouped).forEach(([type, updates]) => {
        console.log(`🔄 Processing ${updates.length} updates for ${type}`);
        // Implementation spécifique par type
      });

      // Performance tracking
      const processTime = performance.now() - startTime;
      context.performance.batchEfficiency = batchToProcess.length / processTime;

      console.log(`✅ Batch processed in ${processTime.toFixed(2)}ms`);
    };

    // Process batch every frame
    const processLoop = () => {
      processBatch();
      requestAnimationFrame(processLoop);
    };

    requestAnimationFrame(processLoop);

    // Cleanup function
    return () => {
      console.log('🔄 Batch Processor Service stopped');
    };
  };
};

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Get preset configuration
 */
export const getLightingPresetConfig = (preset: LightingPreset): PresetConfig | null => {
  const presets: Record<LightingPreset, PresetConfig> = {
    [LightingPreset.DEFAULT]: {
      ambient: { intensity: 0.4 },
      directional: { intensity: 1.0, castShadow: false }
    },
    [LightingPreset.BRIGHT]: {
      ambient: { intensity: 0.8 },
      directional: { intensity: 1.5, castShadow: true }
    },
    [LightingPreset.SUBTLE]: {
      ambient: { intensity: 0.2 },
      directional: { intensity: 0.6, castShadow: false }
    },
    [LightingPreset.ATMOSPHERIC]: {
      ambient: { intensity: 0.3 },
      directional: { intensity: 0.8, castShadow: true },
      hdrBoost: { enabled: true, multiplier: 1.2 }
    },
    [LightingPreset.STUDIO]: {
      ambient: { intensity: 0.5 },
      directional: { intensity: 1.2, castShadow: true },
      advanced: { enabled: true, spotIntensity: 0.8, dirIntensity: 1.0 }
    },
    [LightingPreset.STUDIO_PLUS]: {
      ambient: { intensity: 0.6 },
      directional: { intensity: 1.4, castShadow: true },
      advanced: { enabled: true, spotIntensity: 1.0, dirIntensity: 1.2 },
      areaLights: { enabled: true, intensity: 0.8 }
    },
    [LightingPreset.STUDIO_PRO]: {
      ambient: { intensity: 3.5 },
      directional: { intensity: 5.0, castShadow: true },
      advanced: { enabled: true, spotIntensity: 1.2, dirIntensity: 1.5 },
      areaLights: { enabled: true, intensity: 1.0 },
      lightProbes: { enabled: true, intensity: 1.0 }
    },
    [LightingPreset.STUDIO_PRO_PLUS]: {
      ambient: { intensity: 3.5 },
      directional: { intensity: 5.0, castShadow: true },
      advanced: { enabled: true, spotIntensity: 1.5, dirIntensity: 2.0 },
      areaLights: { enabled: true, intensity: 1.2 },
      lightProbes: { enabled: true, intensity: 1.0 },
      hdrBoost: { enabled: true, multiplier: 2.0 }
    },
    [LightingPreset.CINEMATIC]: {
      ambient: { intensity: 0.1 },
      directional: { intensity: 2.0, castShadow: true },
      advanced: { enabled: true, spotIntensity: 1.8, dirIntensity: 1.0 },
      hdrBoost: { enabled: true, multiplier: 1.8 }
    }
  };

  return presets[preset] || null;
};

/**
 * Check if performance allows operation
 */
export const isPerformanceAcceptable = (context: LightingContext): boolean => {
  return context.performance.frameTime <= context.performanceConfig.alertThreshold;
};

/**
 * Should fallback to legacy based on performance/flags
 */
export const shouldFallbackToLegacy = (context: LightingContext): boolean => {
  if (!context.migrationState.rollbackCapability) return false;

  // Performance-based fallback
  if (context.performance.frameTime > context.migrationState.performanceThreshold) {
    return true;
  }

  // Circuit breaker fallback
  if (context.performance.fps < context.performanceConfig.circuitBreakerThreshold) {
    return true;
  }

  return false;
};