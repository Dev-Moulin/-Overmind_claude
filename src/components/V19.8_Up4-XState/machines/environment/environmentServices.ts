/**
 * 🌍 B4 Environment Services
 * Services pour chargement HDR et gestion environnement
 */

import * as THREE from 'three';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';
import type {
  EnvironmentContext,
  HDRLoadResult,
  EnvironmentMapType
} from './environmentTypes';

// ====================================
// SERVICE HDR LOADING
// ====================================

/**
 * Service de chargement HDR avec cache et optimisation
 */
export const loadHDRService = (context: EnvironmentContext, event: any) => {
  return new Promise<HDRLoadResult>((resolve, reject) => {
    const startTime = performance.now();

    console.log(`🌍 Loading HDR: ${event.path}`);

    // Vérifier si déjà en cache
    if (context.cache.hdrMaps.has(event.path)) {
      const cachedTexture = context.cache.hdrMaps.get(event.path)!;
      console.log('💾 HDR found in cache');

      resolve({
        success: true,
        texture: cachedTexture,
        loadTime: performance.now() - startTime,
        memoryUsage: 0 // Déjà compté
      });
      return;
    }

    // Vérifier les ressources Three.js
    if (!context.threeJS.renderer || !context.threeJS.pmremGenerator) {
      reject(new Error('Three.js renderer or PMREMGenerator not initialized'));
      return;
    }

    // Chargeur HDR selon le format
    const loader = createHDRLoader(event.format || 'hdr');

    loader.load(
      event.path,
      (texture: THREE.DataTexture) => {
        try {
          // Générer environment map avec PMREM
          const envMap = context.threeJS.pmremGenerator!.fromEquirectangular(texture).texture;

          // Nettoyer texture originale pour économiser mémoire
          texture.dispose();

          // Configuration de l'environment map
          const finalTexture = configureEnvironmentMap(envMap, event.config || {});

          // Mise à jour cache
          updateCache(context, event.path, finalTexture);

          // Appliquer à la scène
          applyEnvironmentToScene(context, finalTexture, event.config || {});

          const loadTime = performance.now() - startTime;

          console.log(`✅ HDR loaded successfully in ${loadTime.toFixed(2)}ms`);

          resolve({
            success: true,
            texture: finalTexture,
            loadTime,
            memoryUsage: estimateTextureMemory(finalTexture)
          });

        } catch (error) {
          console.error('❌ Error processing HDR:', error);
          reject(error);
        }
      },
      (progress) => {
        const percent = (progress.loaded / progress.total) * 100;
        console.log(`⏳ HDR loading progress: ${percent.toFixed(1)}%`);
      },
      (error) => {
        console.error('❌ Error loading HDR:', error);
        reject(error);
      }
    );
  });
};

/**
 * Service de connexion au bridge B3 Lighting
 */
export const connectLightingBridgeService = (context: EnvironmentContext) => {
  return new Promise((resolve, reject) => {
    console.log('🔗 Connecting to B3 Lighting Bridge...');

    // Vérifier si le système B3 est disponible
    if (typeof window !== 'undefined' && (window as any).visualEffectsControls) {
      const lightingControls = (window as any).visualEffectsControls.lighting;

      if (lightingControls) {
        console.log('✅ B3 Lighting system found');

        // Établir connexion bidirectionnelle
        setTimeout(() => {
          resolve({
            connected: true,
            lightingSystem: lightingControls,
            capabilities: {
              intensityControl: true,
              hdrBoost: true,
              ambientSync: true
            }
          });
        }, 100); // Délai simulé pour connexion
      } else {
        reject(new Error('B3 Lighting controls not available'));
      }
    } else {
      reject(new Error('Visual Effects system not initialized'));
    }
  });
};

/**
 * Service de préchargement HDR
 */
export const preloadHDRService = (context: EnvironmentContext, event: any) => {
  return new Promise((resolve, reject) => {
    const paths = event.paths || [];
    const results: string[] = [];
    let completed = 0;

    console.log(`⏳ Preloading ${paths.length} HDR maps...`);

    if (paths.length === 0) {
      resolve({ preloaded: [] });
      return;
    }

    (paths as string[]).forEach(async (path: string, index: number) => {
      try {
        // Vérifier si déjà en cache
        if (context.cache.hdrMaps.has(path)) {
          results.push(path);
          completed++;

          if (completed === paths.length) {
            console.log(`✅ Preload complete: ${results.length}/${paths.length} maps`);
            resolve({ preloaded: results });
          }
          return;
        }

        // Charger sans appliquer à la scène
        const loader = createHDRLoader('hdr');
        loader.load(
          path,
          (texture: THREE.DataTexture) => {
            // Générer environment map
            const envMap = context.threeJS.pmremGenerator!.fromEquirectangular(texture).texture;
            texture.dispose();

            // Stocker en cache
            updateCache(context, path, envMap);
            results.push(path);
            completed++;

            console.log(`📦 Cached HDR ${index + 1}/${paths.length}: ${path}`);

            if (completed === paths.length) {
              console.log(`✅ Preload complete: ${results.length}/${paths.length} maps`);
              resolve({ preloaded: results });
            }
          },
          undefined,
          (error) => {
            console.warn(`⚠️ Failed to preload ${path}:`, error);
            completed++;

            if (completed === paths.length) {
              console.log(`✅ Preload complete: ${results.length}/${paths.length} maps`);
              resolve({ preloaded: results });
            }
          }
        );

      } catch (error) {
        console.warn(`⚠️ Error preloading ${path}:`, error);
        completed++;

        if (completed === paths.length) {
          resolve({ preloaded: results });
        }
      }
    });
  });
};

/**
 * Service d'optimisation cache
 */
export const optimizeCacheService = (context: EnvironmentContext) => {
  return new Promise((resolve) => {
    console.log('⚡ Optimizing HDR cache...');

    const cache = context.cache;
    let memoryFreed = 0;
    let optimized = 0;

    // LRU cleanup si dépassement mémoire
    if (cache.memoryUsage > cache.maxCacheSize * 1024 * 1024) {
      const sorted = Array.from(cache.lruTracking.entries())
        .sort((a, b) => a[1] - b[1]); // Plus ancien en premier

      const toRemove = Math.ceil(sorted.length * 0.3); // Supprimer 30%

      for (let i = 0; i < toRemove && i < sorted.length; i++) {
        const [path] = sorted[i];
        const texture = cache.hdrMaps.get(path);

        if (texture) {
          texture.dispose();
          cache.hdrMaps.delete(path);
          cache.lruTracking.delete(path);
          memoryFreed += estimateTextureMemory(texture);
          optimized++;
        }
      }
    }

    // Compression des textures restantes
    cache.hdrMaps.forEach((texture, path) => {
      if (texture instanceof THREE.Texture) {
        // Optimisations texture (format, mipmap, etc.)
        optimizeTexture(texture);
      }
    });

    console.log(`✅ Cache optimization complete: ${optimized} maps removed, ${(memoryFreed / 1024 / 1024).toFixed(2)}MB freed`);

    resolve({
      optimized: true,
      mapsRemoved: optimized,
      memoryFreed,
      currentCacheSize: cache.hdrMaps.size
    });
  });
};

// ====================================
// UTILITAIRES HDR
// ====================================

/**
 * Créer le loader approprié selon le format
 */
function createHDRLoader(format: EnvironmentMapType): THREE.Loader {
  switch (format) {
    case 'hdr':
    case 'exr':
      return new RGBELoader();
    default:
      return new RGBELoader();
  }
}

/**
 * Configurer l'environment map
 */
function configureEnvironmentMap(texture: THREE.Texture, config: any): THREE.Texture {
  // Configuration de base
  texture.mapping = THREE.EquirectangularReflectionMapping;

  // Intensité
  if (config.intensity !== undefined) {
    // L'intensité sera appliquée via le material ou scene.environment
  }

  // Format optimisé pour performance
  if (config.format) {
    texture.format = getTextureFormat(config.format);
  }

  return texture;
}

/**
 * Appliquer environment à la scène
 */
function applyEnvironmentToScene(context: EnvironmentContext, texture: THREE.Texture, config: any) {
  if (!context.threeJS.scene) return;

  const scene = context.threeJS.scene;

  // Environment mapping
  scene.environment = texture;

  // Background si activé
  if (config.background !== false) {
    scene.background = texture;
  }

  // Rotation
  if (config.rotation) {
    texture.rotation = config.rotation * Math.PI / 180;
  }

  console.log('🌍 Environment applied to scene');
}

/**
 * Mettre à jour le cache
 */
function updateCache(context: EnvironmentContext, path: string, texture: THREE.Texture) {
  const cache = context.cache;

  // Stocker texture
  cache.hdrMaps.set(path, texture);

  // Tracker LRU
  cache.lruTracking.set(path, Date.now());

  // Mettre à jour utilisation mémoire
  cache.memoryUsage += estimateTextureMemory(texture);

  console.log(`💾 Cached HDR: ${path} (${cache.hdrMaps.size} total)`);
}

/**
 * Estimer utilisation mémoire texture
 */
function estimateTextureMemory(texture: THREE.Texture): number {
  if (!texture.image) return 0;

  const width = texture.image.width || 1024;
  const height = texture.image.height || 512;
  const bytesPerPixel = 12; // HDR RGBE approximation

  return width * height * bytesPerPixel;
}

/**
 * Optimiser texture pour performance
 */
function optimizeTexture(texture: THREE.Texture) {
  // Générer mipmaps si approprié
  if (!texture.generateMipmaps && texture.minFilter !== THREE.NearestFilter) {
    texture.generateMipmaps = true;
  }

  // Format optimal
  if (texture.format === THREE.RGBAFormat) {
    // Garder format HDR pour quality
  }

  texture.needsUpdate = true;
}

/**
 * Obtenir format texture optimal
 */
function getTextureFormat(format: string): THREE.PixelFormat {
  switch (format) {
    case 'rgba':
      return THREE.RGBAFormat;
    case 'rgb':
      return THREE.RGBFormat;
    default:
      return THREE.RGBAFormat;
  }
}

// ====================================
// EXPORTS
// ====================================

export const environmentServices = {
  loadHDRService,
  connectLightingBridgeService,
  preloadHDRService,
  optimizeCacheService
};

export default environmentServices;