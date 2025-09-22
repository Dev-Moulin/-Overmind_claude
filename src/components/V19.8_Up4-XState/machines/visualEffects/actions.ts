// 🎨 VisualEffectsMachine Actions - Actions XState pour effets visuels
// Actions pour mise à jour du contexte et side effects

import { assign } from 'xstate';
import * as THREE from 'three';
import type {
  VisualEffectsContext,
  VisualEffectsEvent,
  VisualGroupType,
  SecurityPreset
} from './types';

// ============================================
// ACTIONS BLOOM
// ============================================

export const updateBloomGlobal = assign<VisualEffectsContext, any>({
  bloom: (ctx, event) => ({
    ...ctx.bloom,
    global: {
      ...ctx.bloom.global,
      threshold: event.threshold ?? ctx.bloom.global.threshold,
      strength: event.strength ?? ctx.bloom.global.strength,
      radius: event.radius ?? ctx.bloom.global.radius,
      exposure: event.exposure ?? ctx.bloom.global.exposure
    }
  }),
  performance: (ctx) => ({
    ...ctx.performance,
    updateCount: ctx.performance.updateCount + 1,
    lastUpdateTime: Date.now()
  })
});

export const updateBloomGroup = assign<VisualEffectsContext, any>({
  bloom: (ctx, event) => {
    const { group, ...params } = event;
    return {
      ...ctx.bloom,
      groups: {
        ...ctx.bloom.groups,
        [group]: {
          ...ctx.bloom.groups[group],
          threshold: params.threshold ?? ctx.bloom.groups[group].threshold,
          strength: params.strength ?? ctx.bloom.groups[group].strength,
          emissiveColor: params.emissiveColor ?? ctx.bloom.groups[group].emissiveColor,
          emissiveIntensity: params.emissiveIntensity ?? ctx.bloom.groups[group].emissiveIntensity
        }
      }
    };
  }
});

export const logBloomError = (ctx: VisualEffectsContext, event: any) => {
  console.error('❌ Bloom Error:', event.data);
};

// ============================================
// ACTIONS PBR
// ============================================

export const updatePBRGlobal = assign<VisualEffectsContext, any>({
  pbr: (ctx, event) => ({
    ...ctx.pbr,
    global: {
      ...ctx.pbr.global,
      metalness: event.metalness ?? ctx.pbr.global.metalness,
      roughness: event.roughness ?? ctx.pbr.global.roughness,
      envMapIntensity: event.envMapIntensity ?? ctx.pbr.global.envMapIntensity,
      clearcoat: event.clearcoat ?? ctx.pbr.global.clearcoat,
      clearcoatRoughness: event.clearcoatRoughness ?? ctx.pbr.global.clearcoatRoughness,
      transmission: event.transmission ?? ctx.pbr.global.transmission,
      ior: event.ior ?? ctx.pbr.global.ior
    }
  }),
  performance: (ctx) => ({
    ...ctx.performance,
    updateCount: ctx.performance.updateCount + 1,
    lastUpdateTime: Date.now()
  })
});

export const updatePBRGroup = assign<VisualEffectsContext, any>({
  pbr: (ctx, event) => {
    const { group, ...params } = event;
    return {
      ...ctx.pbr,
      groups: {
        ...ctx.pbr.groups,
        [group]: {
          ...ctx.pbr.groups[group],
          metalness: params.metalness ?? ctx.pbr.groups[group].metalness,
          roughness: params.roughness ?? ctx.pbr.groups[group].roughness,
          clearcoat: params.clearcoat ?? ctx.pbr.groups[group].clearcoat,
          transmission: params.transmission ?? ctx.pbr.groups[group].transmission
        }
      }
    };
  }
});

export const logPBRError = (ctx: VisualEffectsContext, event: any) => {
  console.error('❌ PBR Error:', event.data);
};

// ============================================
// ACTIONS ENVIRONMENT
// ============================================

export const storeHDRTexture = assign<VisualEffectsContext, any>({
  environment: (ctx, event) => ({
    ...ctx.environment,
    // La texture HDR sera dans event.data
    // Elle sera traitée par generatePMREM
  })
});

export const storeEnvMap = assign<VisualEffectsContext, any>({
  environment: (ctx, event) => ({
    ...ctx.environment,
    envMap: event.data.envMap,
    pmremGenerator: event.data.pmremGenerator
  })
});

export const disposeCurrentEnvironment = (ctx: VisualEffectsContext) => {
  // Nettoyer les ressources HDR
  if (ctx.environment.envMap) {
    ctx.environment.envMap.dispose();
  }
  if (ctx.environment.pmremGenerator) {
    ctx.environment.pmremGenerator.dispose();
  }
  console.log('🧹 Environment disposed');
};

export const logEnvironmentError = (ctx: VisualEffectsContext, event: any) => {
  console.error('❌ Environment Error:', event.data);
};

// ============================================
// ACTIONS SECURITY
// ============================================

export const startSecurityTransition = assign<VisualEffectsContext, any>({
  security: (ctx, event) => ({
    ...ctx.security,
    currentPreset: event.preset,
    isTransitioning: true
  })
});

export const completeSecurityTransition = assign<VisualEffectsContext, any>({
  security: (ctx, event) => {
    const preset = ctx.security.currentPreset as SecurityPreset;
    const config = ctx.security.presets[preset];

    // Appliquer automatiquement les presets bloom et PBR
    return {
      ...ctx.security,
      isTransitioning: false
    };
  },
  // Mise à jour coordonnée Bloom
  bloom: (ctx) => {
    const preset = ctx.security.currentPreset as SecurityPreset;
    const config = ctx.security.presets[preset];

    if (config?.bloomPreset) {
      return {
        ...ctx.bloom,
        global: {
          ...ctx.bloom.global,
          ...config.bloomPreset
        }
      };
    }
    return ctx.bloom;
  },
  // Mise à jour coordonnée PBR
  pbr: (ctx) => {
    const preset = ctx.security.currentPreset as SecurityPreset;
    const config = ctx.security.presets[preset];

    if (config?.pbrPreset) {
      return {
        ...ctx.pbr,
        global: {
          ...ctx.pbr.global,
          ...config.pbrPreset
        }
      };
    }
    return ctx.pbr;
  }
});

export const logSecurityError = (ctx: VisualEffectsContext, event: any) => {
  console.error('❌ Security Error:', event.data);
};

// ============================================
// ACTIONS OBJECTS
// ============================================

export const registerObjects = assign<VisualEffectsContext, any>({
  objectsRegistry: (ctx, event) => {
    const { group, objects } = event;
    const registry = { ...ctx.objectsRegistry };

    // Fusionner les nouveaux objets avec les existants
    objects.forEach((mesh: THREE.Mesh, id: string) => {
      registry[group].set(id, mesh);
    });

    console.log(`✅ Registered ${objects.size} objects in group ${group}`);
    return registry;
  }
});

export const unregisterObjects = assign<VisualEffectsContext, any>({
  objectsRegistry: (ctx, event) => {
    const { group, objectIds } = event;
    const registry = { ...ctx.objectsRegistry };

    objectIds.forEach((id: string) => {
      registry[group].delete(id);
    });

    console.log(`🗑️ Unregistered ${objectIds.length} objects from group ${group}`);
    return registry;
  }
});

export const detectAndRegisterObjects = (ctx: VisualEffectsContext, event: any) => {
  const { model } = event;
  const detectedCounts = {
    iris: 0,
    eyeRings: 0,
    revealRings: 0,
    magicRings: 0,
    arms: 0
  };

  // Parcourir le modèle pour détecter les objets
  model.traverse((child: THREE.Object3D) => {
    if (child instanceof THREE.Mesh) {
      const name = child.name.toLowerCase();

      // Détection par nom
      if (name.includes('iris')) {
        ctx.objectsRegistry.iris.set(child.uuid, child);
        detectedCounts.iris++;
      } else if (name.includes('anneaux_eye') || name.includes('eye_ring')) {
        ctx.objectsRegistry.eyeRings.set(child.uuid, child);
        detectedCounts.eyeRings++;
      } else if (name.includes('anneaux_reveal') || name.includes('reveal')) {
        ctx.objectsRegistry.revealRings.set(child.uuid, child);
        detectedCounts.revealRings++;
      } else if (name.includes('ring_sg') || name.includes('magic')) {
        ctx.objectsRegistry.magicRings.set(child.uuid, child);
        detectedCounts.magicRings++;
      } else if (name.includes('arm') || name.includes('bras')) {
        ctx.objectsRegistry.arms.set(child.uuid, child);
        detectedCounts.arms++;
      }
    }
  });

  console.log('🔍 Objects detected:', detectedCounts);
};

export const clearObjects = assign<VisualEffectsContext, any>({
  objectsRegistry: (ctx, event) => {
    const { group } = event;

    if (group) {
      // Clear specific group
      return {
        ...ctx.objectsRegistry,
        [group]: new Map()
      };
    } else {
      // Clear all groups
      return {
        iris: new Map(),
        eyeRings: new Map(),
        revealRings: new Map(),
        magicRings: new Map(),
        arms: new Map()
      };
    }
  }
});

// ============================================
// ACTIONS SYSTEM
// ============================================

export const initializeSystem = assign<VisualEffectsContext, any>({
  renderer: (ctx, event) => event.renderer,
  scene: (ctx, event) => event.scene,
  camera: (ctx, event) => event.camera
});

// ✅ NOUVELLE ACTION: Update context sans recréer la machine
export const updateSystemContext = assign<VisualEffectsContext, any>({
  renderer: (ctx, event) => event.renderer ?? ctx.renderer,
  scene: (ctx, event) => event.scene ?? ctx.scene,
  camera: (ctx, event) => event.camera ?? ctx.camera
});

export const updatePerformanceMetrics = assign<VisualEffectsContext, any>({
  performance: (ctx, event) => ({
    ...ctx.performance,
    fps: event.fps,
    frameTime: event.frameTime,
    lastUpdateTime: Date.now()
  })
});

export const syncAllSystems = (ctx: VisualEffectsContext) => {
  console.log('🔄 Syncing all visual effects systems...');

  // Synchroniser Bloom avec les objets
  if (ctx.bloom.global.enabled) {
    ctx.objectsRegistry.iris.forEach((mesh) => {
      if (mesh.material && 'emissive' in mesh.material) {
        (mesh.material as any).emissive.setHex(ctx.bloom.groups.iris.emissiveColor);
        (mesh.material as any).emissiveIntensity = ctx.bloom.groups.iris.emissiveIntensity;
      }
    });
  }

  // Synchroniser PBR avec les objets
  if (ctx.pbr.global.enabled) {
    ctx.objectsRegistry.iris.forEach((mesh) => {
      if (mesh.material && 'metalness' in mesh.material) {
        (mesh.material as any).metalness = ctx.pbr.groups.iris.metalness;
        (mesh.material as any).roughness = ctx.pbr.groups.iris.roughness;
      }
    });
  }

  console.log('✅ Systems synced');
};

export const disposeAllResources = (ctx: VisualEffectsContext) => {
  console.log('🧹 Disposing all visual effects resources...');

  // Nettoyer l'environnement
  if (ctx.environment.envMap) {
    ctx.environment.envMap.dispose();
  }
  if (ctx.environment.pmremGenerator) {
    ctx.environment.pmremGenerator.dispose();
  }

  // Clear tous les registres d'objets
  ctx.objectsRegistry.iris.clear();
  ctx.objectsRegistry.eyeRings.clear();
  ctx.objectsRegistry.revealRings.clear();
  ctx.objectsRegistry.magicRings.clear();
  ctx.objectsRegistry.arms.clear();

  console.log('✅ All resources disposed');
};

export const logSystemError = (ctx: VisualEffectsContext, event: any) => {
  console.error('❌ System Error:', event.error);
};