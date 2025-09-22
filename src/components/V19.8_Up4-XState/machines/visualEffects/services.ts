// 🎨 VisualEffectsMachine Services - Services asynchrones XState
// Services pour opérations asynchrones (chargement, calculs, etc.)

import * as THREE from 'three';
import type { VisualEffectsContext } from './types';

// ============================================
// SERVICES BLOOM
// ============================================

export const enableGlobalBloom = async (context: VisualEffectsContext) => {
  console.log('🌟 Enabling global bloom...');

  // Simuler l'activation du bloom
  // Dans la vraie implémentation, on appellerait SimpleBloomSystem
  await new Promise(resolve => setTimeout(resolve, 100));

  // Si on a accès au système bloom externe
  if ((window as any).simpleBloomSystem) {
    (window as any).simpleBloomSystem.setBloomEnabled(true);
    (window as any).simpleBloomSystem.updateBloom('threshold', context.bloom.global.threshold);
    (window as any).simpleBloomSystem.updateBloom('strength', context.bloom.global.strength);
    (window as any).simpleBloomSystem.updateBloom('radius', context.bloom.global.radius);
  }

  console.log('✅ Global bloom enabled');
  return { success: true };
};

export const disableGlobalBloom = async (context: VisualEffectsContext) => {
  console.log('🌟 Disabling global bloom...');

  await new Promise(resolve => setTimeout(resolve, 100));

  if ((window as any).simpleBloomSystem) {
    (window as any).simpleBloomSystem.setBloomEnabled(false);
  }

  console.log('✅ Global bloom disabled');
  return { success: true };
};

export const updateGroupBloom = (context: VisualEffectsContext, event: any) => async () => {
  console.log(`🎭 Updating bloom for group ${event.group}...`);

  const groupConfig = context.bloom.groups[event.group as keyof typeof context.bloom.groups];
  const objects = context.objectsRegistry[event.group as keyof typeof context.objectsRegistry];

  // Appliquer les paramètres bloom aux objets du groupe
  objects.forEach((mesh) => {
    if (mesh.material && 'emissive' in mesh.material) {
      const material = mesh.material as any;
      material.emissive.setHex(groupConfig.emissiveColor);
      material.emissiveIntensity = groupConfig.emissiveIntensity;
      material.needsUpdate = true;
    }
  });

  console.log(`✅ Bloom updated for ${objects.size} objects in group ${event.group}`);
  return { success: true };
};

// ============================================
// SERVICES PBR
// ============================================

export const initializePBR = async (context: VisualEffectsContext) => {
  console.log('🎨 Initializing PBR system...');

  // Configuration du renderer pour PBR
  if (context.renderer) {
    context.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    context.renderer.toneMappingExposure = 1.0;
    context.renderer.outputColorSpace = THREE.SRGBColorSpace;

    // Activer les ombres si nécessaire
    context.renderer.shadowMap.enabled = true;
    context.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  }

  await new Promise(resolve => setTimeout(resolve, 100));

  console.log('✅ PBR system initialized');
  return { success: true };
};

export const applyGlobalPBR = async (context: VisualEffectsContext) => {
  console.log('🎨 Applying global PBR settings...');

  const { metalness, roughness, envMapIntensity } = context.pbr.global;

  // Appliquer à tous les objets
  Object.values(context.objectsRegistry).forEach(registry => {
    registry.forEach((mesh) => {
      if (mesh.material) {
        // Convertir en MeshPhysicalMaterial si nécessaire
        if (!(mesh.material instanceof THREE.MeshPhysicalMaterial)) {
          const oldMaterial = mesh.material as THREE.Material;
          mesh.material = new THREE.MeshPhysicalMaterial({
            color: (oldMaterial as any).color || 0xffffff,
            metalness,
            roughness
          });
          oldMaterial.dispose();
        } else {
          const material = mesh.material as THREE.MeshPhysicalMaterial;
          material.metalness = metalness;
          material.roughness = roughness;
          material.envMapIntensity = envMapIntensity;

          // Appliquer l'environment map si disponible
          if (context.environment.envMap) {
            material.envMap = context.environment.envMap;
          }

          material.needsUpdate = true;
        }
      }
    });
  });

  console.log('✅ Global PBR settings applied');
  return { success: true };
};

export const updateGroupPBR = (context: VisualEffectsContext, event: any) => async () => {
  console.log(`🎨 Updating PBR for group ${event.group}...`);

  const groupConfig = context.pbr.groups[event.group as keyof typeof context.pbr.groups];
  const objects = context.objectsRegistry[event.group as keyof typeof context.objectsRegistry];

  objects.forEach((mesh) => {
    if (mesh.material && mesh.material instanceof THREE.MeshPhysicalMaterial) {
      mesh.material.metalness = groupConfig.metalness;
      mesh.material.roughness = groupConfig.roughness;

      if (groupConfig.clearcoat !== undefined) {
        mesh.material.clearcoat = groupConfig.clearcoat;
      }
      if (groupConfig.transmission !== undefined) {
        mesh.material.transmission = groupConfig.transmission;
      }

      mesh.material.needsUpdate = true;
    }
  });

  console.log(`✅ PBR updated for ${objects.size} objects in group ${event.group}`);
  return { success: true };
};

// ============================================
// SERVICES ENVIRONMENT
// ============================================

export const loadHDREnvironment = (context: VisualEffectsContext, event: any) => async () => {
  console.log(`🌍 Loading HDR environment: ${event.path}...`);

  // Dynamiquement importer RGBELoader si nécessaire
  const { RGBELoader } = await import('three/addons/loaders/RGBELoader.js');

  const loader = new RGBELoader();

  try {
    const texture = await new Promise<THREE.Texture>((resolve, reject) => {
      loader.load(
        event.path,
        (texture) => {
          texture.mapping = THREE.EquirectangularReflectionMapping;
          resolve(texture);
        },
        undefined,
        reject
      );
    });

    console.log('✅ HDR environment loaded');
    return { texture };
  } catch (error) {
    console.error('❌ Failed to load HDR:', error);
    throw error;
  }
};

export const generatePMREM = (context: VisualEffectsContext, event: any) => async () => {
  console.log('🌍 Generating PMREM...');

  if (!context.renderer) {
    throw new Error('Renderer not initialized');
  }

  const pmremGenerator = new THREE.PMREMGenerator(context.renderer);
  pmremGenerator.compileEquirectangularShader();

  const envMap = pmremGenerator.fromEquirectangular(event.data.texture).texture;

  // Nettoyer la texture HDR originale
  event.data.texture.dispose();

  console.log('✅ PMREM generated');
  return { envMap, pmremGenerator };
};

// ============================================
// SERVICES SECURITY
// ============================================

export const applySecurityPreset = async (
  context: VisualEffectsContext,
  event: any
) => {
  const preset = context.security.currentPreset;
  if (!preset) {
    throw new Error('No security preset selected');
  }

  console.log(`🔒 Applying security preset: ${preset}...`);

  const config = context.security.presets[preset];

  // Animation de transition (simulée)
  const transitionDuration = 500; // ms
  const steps = 20;
  const stepDelay = transitionDuration / steps;

  for (let i = 0; i <= steps; i++) {
    const progress = i / steps;

    // Interpoler les valeurs
    if (config.bloomPreset && (window as any).simpleBloomSystem) {
      const bloomSystem = (window as any).simpleBloomSystem;

      if (config.bloomPreset.strength !== undefined) {
        const currentStrength = context.bloom.global.strength;
        const targetStrength = config.bloomPreset.strength;
        const interpolatedStrength = currentStrength + (targetStrength - currentStrength) * progress;
        bloomSystem.updateBloom('strength', interpolatedStrength);
      }
    }

    // Appliquer la couleur aux objets iris (effet visuel de sécurité)
    context.objectsRegistry.iris.forEach((mesh) => {
      if (mesh.material && 'emissive' in mesh.material) {
        const material = mesh.material as any;
        material.emissive.setHex(config.color);
        material.emissiveIntensity = config.intensity * progress;
      }
    });

    await new Promise(resolve => setTimeout(resolve, stepDelay));
  }

  console.log(`✅ Security preset ${preset} applied`);
  return { success: true };
};

// ============================================
// SERVICES OBJECTS
// ============================================

export const detectAndRegisterObjects = (context: VisualEffectsContext, event: any) => async () => {
  console.log('🔍 Detecting and registering objects...');

  const detected = {
    iris: [] as THREE.Mesh[],
    eyeRings: [] as THREE.Mesh[],
    revealRings: [] as THREE.Mesh[],
    magicRings: [] as THREE.Mesh[],
    arms: [] as THREE.Mesh[]
  };

  // Parcourir récursivement le modèle
  event.model.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      const name = child.name.toLowerCase();

      if (name.includes('iris')) {
        detected.iris.push(child);
      } else if (name.includes('anneaux_eye') || name.includes('eye_ring')) {
        detected.eyeRings.push(child);
      } else if (name.includes('anneaux_reveal') || name.includes('reveal')) {
        detected.revealRings.push(child);
      } else if (name.includes('ring_sg') || name.includes('magic')) {
        detected.magicRings.push(child);
      } else if (name.includes('arm') || name.includes('bras')) {
        detected.arms.push(child);
      }
    }
  });

  // Enregistrer les objets détectés
  Object.entries(detected).forEach(([group, meshes]) => {
    const registry = context.objectsRegistry[group as keyof typeof context.objectsRegistry];
    meshes.forEach(mesh => {
      registry.set(mesh.uuid, mesh);
    });
  });

  const total = Object.values(detected).reduce((sum, arr) => sum + arr.length, 0);
  console.log(`✅ Detected and registered ${total} objects`);

  return { detected };
};

// ============================================
// SERVICES SYSTEM
// ============================================

export const syncWithRenderer = async (context: VisualEffectsContext) => {
  console.log('🔄 Syncing with renderer...');

  if (!context.renderer || !context.scene || !context.camera) {
    throw new Error('System not initialized');
  }

  // Forcer un rendu
  context.renderer.render(context.scene, context.camera);

  // Mettre à jour les métriques de performance
  const info = context.renderer.info;
  console.log('📊 Renderer info:', {
    geometries: info.memory.geometries,
    textures: info.memory.textures,
    calls: info.render.calls,
    triangles: info.render.triangles
  });

  return { success: true };
};

export const dispose = async (context: VisualEffectsContext) => {
  console.log('🧹 Disposing all resources...');

  // Nettoyer l'environnement
  if (context.environment.envMap) {
    context.environment.envMap.dispose();
  }
  if (context.environment.pmremGenerator) {
    context.environment.pmremGenerator.dispose();
  }

  // Nettoyer les matériaux des objets
  Object.values(context.objectsRegistry).forEach(registry => {
    registry.forEach((mesh) => {
      if (mesh.material) {
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach(mat => mat.dispose());
        } else {
          mesh.material.dispose();
        }
      }
      if (mesh.geometry) {
        mesh.geometry.dispose();
      }
    });
    registry.clear();
  });

  console.log('✅ All resources disposed');
  return { success: true };
};