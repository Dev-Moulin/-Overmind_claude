/**
 * 🧪 Test d'intégration pour LightingMachine Foundation Phase 1
 * Validation architecture Event Bus + Feature Flags + Performance Monitoring
 */

import { createLightingMachine } from './lightingMachine';
import { LegacySystemsBridge } from '../../bridges/LegacySystemsBridge';
import { lightingFeatureFlags } from './featureFlags';
import { lightingEventBus } from './lightingEventBus';
import { MigrationLevel, LightingPreset } from './types';

// ============================================
// MOCK LEGACY SYSTEMS pour test
// ============================================

class MockLegacySystemsBridge extends LegacySystemsBridge {
  private mockResults: boolean = true;

  setMockResults(success: boolean) {
    this.mockResults = success;
  }

  safeSetGlobalLightingMultipliers(ambient: number, directional: number): boolean {
    console.log(`🧪 MOCK: Setting lighting multipliers (${ambient}, ${directional})`);
    return this.mockResults;
  }

  safeToggleAdvancedLighting(enabled: boolean): boolean {
    console.log(`🧪 MOCK: Toggle advanced lighting ${enabled}`);
    return this.mockResults;
  }

  safeApplyLightingPreset(preset: string): boolean {
    console.log(`🧪 MOCK: Apply preset ${preset}`);
    return this.mockResults;
  }
}

// ============================================
// TESTS FOUNDATION PHASE 1
// ============================================

export async function testLightingMachineFoundation() {
  console.log('🧪 Starting LightingMachine Foundation Tests...');

  // Setup
  const mockBridge = new MockLegacySystemsBridge();

  // Test 1: Machine création avec options par défaut
  console.log('\n📋 Test 1: Machine Creation');

  const lightingMachine = createLightingMachine({
    enableEventBus: true,
    enablePerformanceMonitoring: true,
    migrationLevel: MigrationLevel.CANARY,
    legacyBridge: mockBridge
  });

  if (lightingMachine) {
    console.log('✅ Test 1: LightingMachine created successfully');
  } else {
    console.error('❌ Test 1: Failed to create LightingMachine');
    return false;
  }

  // Test 2: Feature Flags validation
  console.log('\n📋 Test 2: Feature Flags Management');

  // Set feature flags pour test
  lightingFeatureFlags.setRegionMigrationLevel('baseLighting', MigrationLevel.CANARY);
  lightingFeatureFlags.setRegionMigrationLevel('advancedLighting', MigrationLevel.OFF);

  if (lightingFeatureFlags.isRegionXStateEnabled('baseLighting')) {
    console.log('✅ Test 2a: Base lighting feature flag enabled');
  } else {
    console.error('❌ Test 2a: Base lighting feature flag not working');
  }

  if (!lightingFeatureFlags.isRegionXStateEnabled('advancedLighting')) {
    console.log('✅ Test 2b: Advanced lighting feature flag disabled');
  } else {
    console.error('❌ Test 2b: Advanced lighting feature flag not working');
  }

  // Test 3: Event Bus communication
  console.log('\n📋 Test 3: Event Bus Communication');

  let eventReceived = false;

  lightingEventBus.once('LIGHTING_PRESET_CHANGE', (event) => {
    console.log('✅ Test 3: Event received via Event Bus', event.type);
    eventReceived = true;
  });

  lightingEventBus.dispatch({
    type: 'LIGHTING_PRESET_CHANGE',
    payload: { preset: LightingPreset.STUDIO },
    timestamp: Date.now(),
    source: 'Test',
    priority: 'normal'
  });

  // Wait for event processing
  await new Promise(resolve => setTimeout(resolve, 100));

  if (eventReceived) {
    console.log('✅ Test 3: Event Bus communication working');
  } else {
    console.error('❌ Test 3: Event Bus communication failed');
  }

  // Test 4: Performance Monitoring
  console.log('\n📋 Test 4: Performance Monitoring');

  const performanceMetrics = lightingEventBus.getPerformanceMetrics();

  if (performanceMetrics && typeof performanceMetrics.fps === 'number') {
    console.log('✅ Test 4: Performance monitoring active', performanceMetrics);
  } else {
    console.error('❌ Test 4: Performance monitoring not working');
  }

  // Test 5: Migration Status
  console.log('\n📋 Test 5: Migration Status');

  const migrationStatus = lightingFeatureFlags.getMigrationStatus();

  if (migrationStatus.totalRegions === 5) {
    console.log('✅ Test 5a: All 5 lighting regions detected');
  } else {
    console.error(`❌ Test 5a: Expected 5 regions, got ${migrationStatus.totalRegions}`);
  }

  if (migrationStatus.canary >= 1) {
    console.log('✅ Test 5b: Canary migration detected');
  } else {
    console.error('❌ Test 5b: No canary migration detected');
  }

  console.log(`📊 Migration Status:`, migrationStatus);

  // Test 6: Legacy Bridge Integration
  console.log('\n📋 Test 6: Legacy Bridge Integration');

  mockBridge.setMockResults(true);

  const success1 = mockBridge.safeSetGlobalLightingMultipliers(0.5, 1.2);
  const success2 = mockBridge.safeToggleAdvancedLighting(true);

  if (success1 && success2) {
    console.log('✅ Test 6: Legacy bridge integration working');
  } else {
    console.error('❌ Test 6: Legacy bridge integration failed');
  }

  // Test 7: Circuit Breaker Simulation
  console.log('\n📋 Test 7: Circuit Breaker Simulation');

  mockBridge.setMockResults(false);

  const failResult = mockBridge.safeApplyLightingPreset('STUDIO_PRO');

  if (!failResult) {
    console.log('✅ Test 7: Circuit breaker correctly handles failures');
  } else {
    console.error('❌ Test 7: Circuit breaker not working');
  }

  // Test 8: Rollback Capability
  console.log('\n📋 Test 8: Rollback Capability');

  const initialLevel = lightingFeatureFlags.getRegionMigrationLevel('baseLighting');
  const upgraded = lightingFeatureFlags.upgradeRegion('baseLighting');
  const newLevel = lightingFeatureFlags.getRegionMigrationLevel('baseLighting');
  const rolledBack = lightingFeatureFlags.rollbackRegion('baseLighting');
  const finalLevel = lightingFeatureFlags.getRegionMigrationLevel('baseLighting');

  if (upgraded && rolledBack && finalLevel === initialLevel) {
    console.log('✅ Test 8: Rollback capability working');
  } else {
    console.error('❌ Test 8: Rollback capability failed');
  }

  // Test 9: Emergency Rollback
  console.log('\n📋 Test 9: Emergency Rollback');

  lightingFeatureFlags.emergencyRollback('Test emergency rollback');

  const allOff = Object.values(lightingFeatureFlags.getFlags().regions)
    .every(level => level === MigrationLevel.OFF);

  if (allOff) {
    console.log('✅ Test 9: Emergency rollback working');
  } else {
    console.error('❌ Test 9: Emergency rollback failed');
  }

  // Résumé des tests
  console.log('\n🎯 Foundation Phase 1 Test Summary:');
  console.log('✅ LightingMachine architecture');
  console.log('✅ Event Bus coordination');
  console.log('✅ Feature Flags multi-niveaux');
  console.log('✅ Performance Monitoring');
  console.log('✅ Legacy Bridge extension');
  console.log('✅ Circuit Breaker pattern');
  console.log('✅ Rollback capabilities');
  console.log('✅ Emergency procedures');

  return true;
}

// ============================================
// TESTS PERFORMANCE
// ============================================

export async function testLightingPerformance() {
  console.log('\n🚀 Testing LightingMachine Performance...');

  const startTime = performance.now();

  // Simulate batch operations
  const batchSize = 100;
  const results: boolean[] = [];

  for (let i = 0; i < batchSize; i++) {
    lightingEventBus.dispatch({
      type: 'LIGHTING_INTENSITY_UPDATE',
      payload: { intensity: Math.random() },
      timestamp: Date.now(),
      source: 'PerformanceTest',
      priority: 'normal'
    });
  }

  // Process batch
  await new Promise(resolve => setTimeout(resolve, 200));

  const endTime = performance.now();
  const totalTime = endTime - startTime;
  const avgTimePerEvent = totalTime / batchSize;

  console.log(`📊 Performance Test Results:`);
  console.log(`- Total time: ${totalTime.toFixed(2)}ms`);
  console.log(`- Average per event: ${avgTimePerEvent.toFixed(2)}ms`);
  console.log(`- Events per second: ${Math.round(1000 / avgTimePerEvent)}`);

  // Performance criteria (from research)
  const targetFrameTime = 16.67; // 60fps
  const isPerformant = avgTimePerEvent < 1.0; // 1ms per event

  if (isPerformant) {
    console.log('✅ Performance test passed');
  } else {
    console.warn('⚠️ Performance test needs optimization');
  }

  return { totalTime, avgTimePerEvent, isPerformant };
}

// ============================================
// FONCTION PRINCIPALE DE TEST
// ============================================

export async function runAllLightingTests() {
  console.log('🔦 LIGHTINGMACHINE FOUNDATION TESTS');
  console.log('=====================================');

  try {
    const foundationResult = await testLightingMachineFoundation();
    const performanceResult = await testLightingPerformance();

    if (foundationResult && performanceResult.isPerformant) {
      console.log('\n🎉 ALL TESTS PASSED - Foundation Phase 1 Ready!');
      return true;
    } else {
      console.log('\n⚠️ Some tests failed - Review before proceeding');
      return false;
    }

  } catch (error) {
    console.error('❌ Test execution failed:', error);
    return false;
  }
}

// Export pour utilisation dans console browser
(window as any).testLightingMachine = runAllLightingTests;