// 🎨 VisualEffectsMachine avec Configuration Complète
// Machine XState configurée avec services, actions et guards

import { visualEffectsMachine } from './machine';
import * as services from './services';
import * as actions from './actions';
import * as guards from './guards';

// Configuration complète de la machine
export const visualEffectsMachineWithConfig = visualEffectsMachine.withConfig({
  services: {
    // Services Bloom
    enableGlobalBloom: services.enableGlobalBloom,
    disableGlobalBloom: services.disableGlobalBloom,
    updateGroupBloom: services.updateGroupBloom,

    // Services PBR
    initializePBR: services.initializePBR,
    applyGlobalPBR: services.applyGlobalPBR,
    updateGroupPBR: services.updateGroupPBR,

    // Services Environment
    loadHDREnvironment: services.loadHDREnvironment,
    generatePMREM: services.generatePMREM,

    // Services Security
    applySecurityPreset: services.applySecurityPreset,

    // Services Objects & System
    detectAndRegisterObjects: services.detectAndRegisterObjects,
    syncWithRenderer: services.syncWithRenderer,
    dispose: services.dispose
  },

  actions: {
    // Actions Bloom
    updateBloomGlobal: actions.updateBloomGlobal,
    updateBloomGroup: actions.updateBloomGroup,
    logBloomError: actions.logBloomError,

    // Actions PBR
    updatePBRGlobal: actions.updatePBRGlobal,
    updatePBRGroup: actions.updatePBRGroup,
    logPBRError: actions.logPBRError,

    // Actions Environment
    storeHDRTexture: actions.storeHDRTexture,
    storeEnvMap: actions.storeEnvMap,
    disposeCurrentEnvironment: actions.disposeCurrentEnvironment,
    logEnvironmentError: actions.logEnvironmentError,

    // Actions Security
    startSecurityTransition: actions.startSecurityTransition,
    completeSecurityTransition: actions.completeSecurityTransition,
    logSecurityError: actions.logSecurityError,

    // Actions Objects
    registerObjects: actions.registerObjects,
    unregisterObjects: actions.unregisterObjects,
    detectAndRegisterObjects: actions.detectAndRegisterObjects,
    clearObjects: actions.clearObjects,

    // Actions System
    initializeSystem: actions.initializeSystem,
    updateSystemContext: actions.updateSystemContext,
    updatePerformanceMetrics: actions.updatePerformanceMetrics,
    syncAllSystems: actions.syncAllSystems,
    disposeAllResources: actions.disposeAllResources,
    logSystemError: actions.logSystemError
  },

  guards: {
    // Guards Bloom
    canEnableBloom: guards.canEnableBloom,

    // Guards PBR
    canEnablePBR: guards.canEnablePBR,

    // Guards Environment
    canLoadHDR: guards.canLoadHDR,
    isEnvironmentReady: guards.isEnvironmentReady,

    // Guards Security
    canApplySecurityPreset: guards.canApplySecurityPreset,
    isSecurityTransitioning: guards.isSecurityTransitioning,

    // Guards Objects
    hasObjectsInGroup: guards.hasObjectsInGroup,
    hasAnyObjects: guards.hasAnyObjects,
    isValidGroup: guards.isValidGroup,

    // Guards System
    isSystemInitialized: guards.isSystemInitialized,
    hasRenderer: guards.hasRenderer,
    hasScene: guards.hasScene,
    hasCamera: guards.hasCamera,

    // Guards Performance
    isPerformanceAcceptable: guards.isPerformanceAcceptable,
    shouldThrottleUpdates: guards.shouldThrottleUpdates,
    canUpdate: guards.canUpdate,

    // Guards Composites
    canEnableVisualEffects: guards.canEnableVisualEffects,
    shouldAutoSync: guards.shouldAutoSync,
    canDispose: guards.canDispose
  }
});

export default visualEffectsMachineWithConfig;