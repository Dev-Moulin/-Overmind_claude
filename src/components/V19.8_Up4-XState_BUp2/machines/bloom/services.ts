// 🌟 BloomMachine Services - Atome B1
// Services XState pour interactions avec SimpleBloomSystem

import * as THREE from 'three';
import type { BloomContext, BloomServiceData, SecurityPreset, BloomGroupType } from './types';

// 🌟 Service: Enable Global Bloom
export const enableGlobalBloom = (context: BloomContext, event: any): Promise<void> => {
  return new Promise((resolve, reject) => {
    try {
      console.log('🌟 BloomMachine: Enabling global bloom...');

      if (context.simpleBloomSystem) {
        // Utiliser API SimpleBloomSystem
        context.simpleBloomSystem.setBloomEnabled(true);

        // Sync des paramètres globaux
        context.simpleBloomSystem.updateBloom('threshold', context.global.threshold);
        context.simpleBloomSystem.updateBloom('strength', context.global.strength);
        context.simpleBloomSystem.updateBloom('radius', context.global.radius);

        console.log('✅ BloomMachine: Global bloom enabled');
        resolve();
      } else {
        console.warn('⚠️ BloomMachine: SimpleBloomSystem not available');
        reject(new Error('SimpleBloomSystem not available'));
      }
    } catch (error) {
      console.error('❌ BloomMachine: Error enabling global bloom:', error);
      reject(error);
    }
  });
};

// 🌟 Service: Disable Global Bloom
export const disableGlobalBloom = (context: BloomContext, event: any): Promise<void> => {
  return new Promise((resolve, reject) => {
    try {
      console.log('🌟 BloomMachine: Disabling global bloom...');

      if (context.simpleBloomSystem) {
        context.simpleBloomSystem.setBloomEnabled(false);
        console.log('✅ BloomMachine: Global bloom disabled');
        resolve();
      } else {
        console.warn('⚠️ BloomMachine: SimpleBloomSystem not available');
        resolve(); // Ne pas échouer si le système n'est pas disponible
      }
    } catch (error) {
      console.error('❌ BloomMachine: Error disabling global bloom:', error);
      reject(error);
    }
  });
};

// 🎭 Service: Update Group Bloom
export const updateGroupBloom = (context: BloomContext, event: any): Promise<void> => {
  return new Promise((resolve, reject) => {
    try {
      const { group } = event.data as { group: BloomGroupType };
      console.log(`🎭 BloomMachine: Updating group bloom for ${group}...`);

      if (!context.groups[group]) {
        reject(new Error(`Unknown group: ${group}`));
        return;
      }

      const groupConfig = context.groups[group];

      // Sync avec SimpleBloomSystem si disponible
      if (context.simpleBloomSystem) {
        // Update bloom parameters (global pour l'instant, selective bloom plus tard)
        context.simpleBloomSystem.updateBloom('threshold', groupConfig.threshold);
        context.simpleBloomSystem.updateBloom('strength', groupConfig.strength);
        context.simpleBloomSystem.updateBloom('radius', groupConfig.radius);

        // Update group materials
        context.simpleBloomSystem.updateGroup(group, {
          emissiveColor: groupConfig.emissiveColor,
          emissiveIntensity: groupConfig.emissiveIntensity
        });
      }

      // Sync avec BloomControlCenter si disponible
      if (context.bloomControlCenter) {
        context.bloomControlCenter.setObjectTypeProperty(group, 'emissive', groupConfig.emissiveColor);
        context.bloomControlCenter.setObjectTypeProperty(group, 'emissiveIntensity', groupConfig.emissiveIntensity);

        // Update bloom parameters pour ce groupe
        context.bloomControlCenter.setBloomParameter('threshold', groupConfig.threshold, group);
        context.bloomControlCenter.setBloomParameter('strength', groupConfig.strength, group);
        context.bloomControlCenter.setBloomParameter('radius', groupConfig.radius, group);
      }

      console.log(`✅ BloomMachine: Group ${group} updated successfully`);
      resolve();
    } catch (error) {
      console.error('❌ BloomMachine: Error updating group bloom:', error);
      reject(error);
    }
  });
};

// 🔒 Service: Apply Security Preset
export const applySecurityPreset = (context: BloomContext, event: any): Promise<{ preset: SecurityPreset }> => {
  return new Promise((resolve, reject) => {
    try {
      const { preset } = event as { preset: SecurityPreset };
      console.log(`🔒 BloomMachine: Applying security preset ${preset}...`);

      if (!context.security.presets[preset]) {
        reject(new Error(`Unknown security preset: ${preset}`));
        return;
      }

      const presetConfig = context.security.presets[preset];

      // Apply via SimpleBloomSystem
      if (context.simpleBloomSystem) {
        context.simpleBloomSystem.setSecurityMode(preset);
      }

      // Apply via BloomControlCenter
      if (context.bloomControlCenter) {
        context.bloomControlCenter.setSecurityState(preset);
      }

      // Mise à jour des groupes principaux avec les couleurs de sécurité
      const mainGroups: BloomGroupType[] = ['iris', 'eyeRings'];

      mainGroups.forEach(group => {
        if (context.groups[group]) {
          // Update context (sera fait via assign dans la machine)
          // context.groups[group].emissiveColor = presetConfig.color;
          // context.groups[group].emissiveIntensity = presetConfig.intensity;

          // Apply immediately via systems
          if (context.simpleBloomSystem) {
            context.simpleBloomSystem.updateGroup(group, {
              emissiveColor: presetConfig.color,
              emissiveIntensity: presetConfig.intensity
            });
          }
        }
      });

      console.log(`✅ BloomMachine: Security preset ${preset} applied successfully`);
      resolve({ preset });
    } catch (error) {
      console.error('❌ BloomMachine: Error applying security preset:', error);
      reject(error);
    }
  });
};

// 🔍 Service: Detect and Register Objects
export const detectAndRegisterObjects = (context: BloomContext, event: any): Promise<{ detected: number }> => {
  return new Promise((resolve, reject) => {
    try {
      const { model } = event as { model: THREE.Group | THREE.Mesh };
      console.log('🔍 BloomMachine: Detecting and registering bloom objects...');

      let detectedCount = 0;
      const objectsByGroup: Record<BloomGroupType, THREE.Mesh[]> = {
        iris: [],
        eyeRings: [],
        revealRings: [],
        magicRings: [],
        arms: []
      };

      // Traverse et détection (logique inspirée de BloomControlCenter)
      model.traverse((child) => {
        if (!(child as any).isMesh || !(child as any).material) return;

        const name = child.name.toLowerCase();
        const meshChild = child as THREE.Mesh;

        // Detection patterns
        if (name.includes('iris')) {
          objectsByGroup.iris.push(meshChild);
          detectedCount++;
        } else if (name.includes('anneaux_eye')) {
          objectsByGroup.eyeRings.push(meshChild);
          detectedCount++;
        } else if (name.includes('ring_bloomarea') || name.includes('action_ring') || name.includes('bloomarea')) {
          objectsByGroup.revealRings.push(meshChild);
          detectedCount++;
        } else if (name.includes('ring_ext_sg1') || name.includes('ring_int_sg1')) {
          objectsByGroup.revealRings.push(meshChild); // SG1 vers revealRings
          detectedCount++;
        } else if (name.includes('ring_sg') || (name.includes('ring') && !name.includes('eye'))) {
          objectsByGroup.magicRings.push(meshChild);
          detectedCount++;
        } else if (name.includes('bigarm') || name.includes('littlearm') || name.includes('bras')) {
          objectsByGroup.arms.push(meshChild);
          detectedCount++;
        }
      });

      // Enregistrer dans les systèmes
      Object.entries(objectsByGroup).forEach(([groupName, objects]) => {
        const group = groupName as BloomGroupType;

        objects.forEach((mesh, index) => {
          const objectKey = `${mesh.name}_${index}`;

          // Add to context (sera fait via assign dans l'action)
          // context.groups[group].objects.set(objectKey, mesh);

          // Register in SimpleBloomSystem
          if (context.simpleBloomSystem) {
            context.simpleBloomSystem.addToGroup(mesh, group);
          }

          // Register in BloomControlCenter
          if (context.bloomControlCenter) {
            context.bloomControlCenter.registerObject(group, objectKey, mesh);
          }
        });
      });

      console.log(`✅ BloomMachine: Detected and registered ${detectedCount} bloom objects`);
      console.log('📊 BloomMachine - Detection summary:');
      Object.entries(objectsByGroup).forEach(([group, objects]) => {
        console.log(`   • ${group}: ${objects.length} objects`);
      });

      resolve({ detected: detectedCount });
    } catch (error) {
      console.error('❌ BloomMachine: Error detecting objects:', error);
      reject(error);
    }
  });
};

// ⏱️ Service: Frame Loop Integration (si nécessaire pour animations)
export const frameLoop = (context: BloomContext): ((callback: any) => () => void) => {
  return (callback) => {
    let animationId: number;
    let lastTime = 0;

    const tick = (time: number) => {
      const deltaTime = time - lastTime;
      lastTime = time;

      // Sync avec FrameScheduler si disponible
      if (context.frameScheduler) {
        const fps = context.frameScheduler.performance?.fps || 60;

        callback({
          type: 'SYNC_WITH_FRAMESCHEDULER',
          fps,
          deltaTime,
          time
        });
      }

      animationId = requestAnimationFrame(tick);
    };

    animationId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(animationId);
    };
  };
};

// 🔄 Service: Sync avec Renderer
export const syncWithRenderer = (context: BloomContext): Promise<void> => {
  return new Promise((resolve) => {
    try {
      console.log('🔄 BloomMachine: Syncing with renderer...');

      // Sync exposure
      if (context.simpleBloomSystem && context.simpleBloomSystem.syncExposure) {
        context.simpleBloomSystem.syncExposure();
      }

      // Force refresh si nécessaire
      if (context.bloomControlCenter && context.bloomControlCenter.syncWithRenderingEngine) {
        context.bloomControlCenter.syncWithRenderingEngine();
      }

      console.log('✅ BloomMachine: Renderer sync completed');
      resolve();
    } catch (error) {
      console.error('❌ BloomMachine: Error syncing with renderer:', error);
      resolve(); // Ne pas échouer la machine pour une erreur de sync
    }
  });
};

// 🧹 Service: Dispose/Cleanup
export const dispose = (context: BloomContext): Promise<void> => {
  return new Promise((resolve) => {
    try {
      console.log('🧹 BloomMachine: Disposing resources...');

      // Clear object maps
      Object.values(context.groups).forEach(group => {
        group.objects.clear();
      });

      // Dispose BloomControlCenter
      if (context.bloomControlCenter && context.bloomControlCenter.dispose) {
        context.bloomControlCenter.dispose();
      }

      // Dispose SimpleBloomSystem
      if (context.simpleBloomSystem && context.simpleBloomSystem.dispose) {
        context.simpleBloomSystem.dispose();
      }

      console.log('✅ BloomMachine: Resources disposed successfully');
      resolve();
    } catch (error) {
      console.error('❌ BloomMachine: Error during disposal:', error);
      resolve(); // Toujours résoudre le cleanup
    }
  });
};