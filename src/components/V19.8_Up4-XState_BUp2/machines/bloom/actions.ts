// 🌟 BloomMachine Actions - Atome B1
// Actions XState pour la gestion bloom

import { assign } from 'xstate';
import type { BloomContext, BloomEvent, BloomGroupType } from './types';

// 🌟 Action: Update Global Parameters
export const updateGlobalParams = assign({
  global: (context: BloomContext, event: any) => ({
    ...context.global,
    threshold: event.threshold !== undefined ? event.threshold : context.global.threshold,
    strength: event.strength !== undefined ? event.strength : context.global.strength,
    radius: event.radius !== undefined ? event.radius : context.global.radius,
    exposure: event.exposure !== undefined ? event.exposure : context.global.exposure
  }),
  performance: (context: BloomContext) => ({
    ...context.performance,
    updateCount: context.performance.updateCount + 1,
    lastUpdateTime: Date.now()
  })
});

// 🔄 Action: Sync Global with Renderer
export const syncGlobalWithRenderer = (context: BloomContext, event: any) => {
  console.log('🔄 BloomMachine: Syncing global parameters with renderer...');

  // Sync with SimpleBloomSystem
  if (context.simpleBloomSystem) {
    context.simpleBloomSystem.updateBloom('threshold', context.global.threshold);
    context.simpleBloomSystem.updateBloom('strength', context.global.strength);
    context.simpleBloomSystem.updateBloom('radius', context.global.radius);
  }

  // Sync with BloomControlCenter
  if (context.bloomControlCenter) {
    context.bloomControlCenter.setBloomParameter('threshold', context.global.threshold);
    context.bloomControlCenter.setBloomParameter('strength', context.global.strength);
    context.bloomControlCenter.setBloomParameter('radius', context.global.radius);
  }

  console.log('✅ BloomMachine: Global parameters synced');
};

// 🎭 Action: Update Group Iris
export const updateGroupIris = assign({
  groups: (context: BloomContext, event: any) => ({
    ...context.groups,
    iris: {
      ...context.groups.iris,
      threshold: event.threshold !== undefined ? event.threshold : context.groups.iris.threshold,
      strength: event.strength !== undefined ? event.strength : context.groups.iris.strength,
      radius: event.radius !== undefined ? event.radius : context.groups.iris.radius,
      emissiveColor: event.emissiveColor !== undefined ? event.emissiveColor : context.groups.iris.emissiveColor,
      emissiveIntensity: event.emissiveIntensity !== undefined ? event.emissiveIntensity : context.groups.iris.emissiveIntensity
    }
  }),
  performance: (context: BloomContext) => ({
    ...context.performance,
    updateCount: context.performance.updateCount + 1,
    lastUpdateTime: Date.now()
  })
});

// 🎭 Action: Update Group EyeRings
export const updateGroupEyeRings = assign({
  groups: (context: BloomContext, event: any) => ({
    ...context.groups,
    eyeRings: {
      ...context.groups.eyeRings,
      threshold: event.threshold !== undefined ? event.threshold : context.groups.eyeRings.threshold,
      strength: event.strength !== undefined ? event.strength : context.groups.eyeRings.strength,
      radius: event.radius !== undefined ? event.radius : context.groups.eyeRings.radius,
      emissiveColor: event.emissiveColor !== undefined ? event.emissiveColor : context.groups.eyeRings.emissiveColor,
      emissiveIntensity: event.emissiveIntensity !== undefined ? event.emissiveIntensity : context.groups.eyeRings.emissiveIntensity
    }
  }),
  performance: (context: BloomContext) => ({
    ...context.performance,
    updateCount: context.performance.updateCount + 1,
    lastUpdateTime: Date.now()
  })
});

// 🎭 Action: Update Group RevealRings
export const updateGroupRevealRings = assign({
  groups: (context: BloomContext, event: any) => ({
    ...context.groups,
    revealRings: {
      ...context.groups.revealRings,
      threshold: event.threshold !== undefined ? event.threshold : context.groups.revealRings.threshold,
      strength: event.strength !== undefined ? event.strength : context.groups.revealRings.strength,
      radius: event.radius !== undefined ? event.radius : context.groups.revealRings.radius,
      emissiveColor: event.emissiveColor !== undefined ? event.emissiveColor : context.groups.revealRings.emissiveColor,
      emissiveIntensity: event.emissiveIntensity !== undefined ? event.emissiveIntensity : context.groups.revealRings.emissiveIntensity
    }
  }),
  performance: (context: BloomContext) => ({
    ...context.performance,
    updateCount: context.performance.updateCount + 1,
    lastUpdateTime: Date.now()
  })
});

// 🎭 Action: Update Group MagicRings
export const updateGroupMagicRings = assign({
  groups: (context: BloomContext, event: any) => ({
    ...context.groups,
    magicRings: {
      ...context.groups.magicRings,
      threshold: event.threshold !== undefined ? event.threshold : context.groups.magicRings.threshold,
      strength: event.strength !== undefined ? event.strength : context.groups.magicRings.strength,
      radius: event.radius !== undefined ? event.radius : context.groups.magicRings.radius,
      emissiveColor: event.emissiveColor !== undefined ? event.emissiveColor : context.groups.magicRings.emissiveColor,
      emissiveIntensity: event.emissiveIntensity !== undefined ? event.emissiveIntensity : context.groups.magicRings.emissiveIntensity
    }
  }),
  performance: (context: BloomContext) => ({
    ...context.performance,
    updateCount: context.performance.updateCount + 1,
    lastUpdateTime: Date.now()
  })
});

// 🎭 Action: Update Group Arms
export const updateGroupArms = assign({
  groups: (context: BloomContext, event: any) => ({
    ...context.groups,
    arms: {
      ...context.groups.arms,
      threshold: event.threshold !== undefined ? event.threshold : context.groups.arms.threshold,
      strength: event.strength !== undefined ? event.strength : context.groups.arms.strength,
      radius: event.radius !== undefined ? event.radius : context.groups.arms.radius,
      emissiveColor: event.emissiveColor !== undefined ? event.emissiveColor : context.groups.arms.emissiveColor,
      emissiveIntensity: event.emissiveIntensity !== undefined ? event.emissiveIntensity : context.groups.arms.emissiveIntensity
    }
  }),
  performance: (context: BloomContext) => ({
    ...context.performance,
    updateCount: context.performance.updateCount + 1,
    lastUpdateTime: Date.now()
  })
});

// 🔍 Action: Register Objects for Groups
export const registerIrisObjects = assign({
  groups: (context: BloomContext, event: any) => ({
    ...context.groups,
    iris: {
      ...context.groups.iris,
      objects: event.objects || context.groups.iris.objects
    }
  })
});

export const registerEyeRingsObjects = assign({
  groups: (context: BloomContext, event: any) => ({
    ...context.groups,
    eyeRings: {
      ...context.groups.eyeRings,
      objects: event.objects || context.groups.eyeRings.objects
    }
  })
});

export const registerRevealRingsObjects = assign({
  groups: (context: BloomContext, event: any) => ({
    ...context.groups,
    revealRings: {
      ...context.groups.revealRings,
      objects: event.objects || context.groups.revealRings.objects
    }
  })
});

export const registerMagicRingsObjects = assign({
  groups: (context: BloomContext, event: any) => ({
    ...context.groups,
    magicRings: {
      ...context.groups.magicRings,
      objects: event.objects || context.groups.magicRings.objects
    }
  })
});

export const registerArmsObjects = assign({
  groups: (context: BloomContext, event: any) => ({
    ...context.groups,
    arms: {
      ...context.groups.arms,
      objects: event.objects || context.groups.arms.objects
    }
  })
});

// 🔍 Action: Detect and Register Objects
export const detectAndRegisterObjects = (context: BloomContext, event: any) => {
  console.log('🔍 BloomMachine: Detecting and registering objects...');

  if (!event.model) {
    console.warn('⚠️ BloomMachine: No model provided for object detection');
    return;
  }

  // Cette action déclenche le service detectAndRegisterObjects
  // La logique complète est dans services.ts
  console.log('🔍 BloomMachine: Object detection delegated to service');
};

// ⏱️ Action: Sync with FrameScheduler
export const syncWithFrameScheduler = assign({
  performance: (context: BloomContext, event: any) => {
    const now = Date.now();
    const deltaTime = now - context.performance.lastUpdateTime;

    return {
      ...context.performance,
      lastUpdateTime: now,
      averageUpdateTime: (context.performance.averageUpdateTime + deltaTime) / 2
    };
  }
});

// 🔄 Action: Sync with Renderer
export const syncWithRenderer = (context: BloomContext, event: any) => {
  console.log('🔄 BloomMachine: Syncing with renderer...');

  // Sync exposure
  if (context.simpleBloomSystem && context.simpleBloomSystem.syncExposure) {
    context.simpleBloomSystem.syncExposure();
  }

  // Force refresh
  if (context.bloomControlCenter && context.bloomControlCenter.syncWithRenderingEngine) {
    context.bloomControlCenter.syncWithRenderingEngine();
  }

  console.log('✅ BloomMachine: Renderer sync completed');
};

// 🔥 Action: Force Refresh
export const forceRefresh = (context: BloomContext, event: any) => {
  console.log('🔥 BloomMachine: Force refresh...');

  // Force refresh via BloomControlCenter
  if (context.bloomControlCenter && context.bloomControlCenter.forceCompleteRefresh) {
    context.bloomControlCenter.forceCompleteRefresh();
  }

  // Force renderer update
  if (typeof window !== 'undefined' && (window as any).renderer && (window as any).scene && (window as any).camera) {
    (window as any).renderer.render((window as any).scene, (window as any).camera);
  }

  console.log('✅ BloomMachine: Force refresh completed');
};

// 🔒 Action: Notify Security Transition
export const notifySecurityTransition = (context: BloomContext, event: any) => {
  const preset = event.data?.preset || context.security.currentPreset;
  console.log(`🔒 BloomMachine: Security transition to ${preset} completed`);

  // Emit event si nécessaire (pour integration externe)
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('bloomSecurityChanged', {
      detail: { preset, timestamp: Date.now() }
    }));
  }
};

// 🧹 Action: Dispose
export const dispose = (context: BloomContext, event: any) => {
  console.log('🧹 BloomMachine: Disposing resources...');

  // Clear object maps
  Object.values(context.groups).forEach(group => {
    group.objects.clear();
  });

  // Reset performance metrics
  context.performance.updateCount = 0;
  context.performance.lastUpdateTime = 0;
  context.performance.averageUpdateTime = 0;

  console.log('✅ BloomMachine: Resources disposed');
};

// ❌ Action: Log Error
export const logError = (context: BloomContext, event: any) => {
  console.error('❌ BloomMachine Error:', event.error);

  // Log vers système de monitoring si disponible
  if (context.frameScheduler && context.frameScheduler.logError) {
    context.frameScheduler.logError('BloomMachine', event.error);
  }
};