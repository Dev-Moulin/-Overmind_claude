/**
 * 🚀 TEMPORARY SYSTEMS SYNC HOOK - Phase 3 Complete
 * Hook temporaire pour synchroniser Zustand → Tous les systèmes Three.js
 */

import { useEffect } from 'react';
import useSceneStore from '../stores/sceneStore.js';

/**
 * Hook temporaire pour synchroniser Zustand → systèmes Three.js
 * Attend que les contrôleurs soient initialisés
 */
export const useTempBloomSync = (systemsInitialized = false) => {
  useEffect(() => {
    if (!systemsInitialized) {
      console.log('⏳ Waiting for systems to initialize...');
      return;
    }
    
    console.log('🔄 Setting up IMMEDIATE Zustand → Three.js sync...');
    
    // 🚀 OPTIMISÉ: Synchronisation IMMÉDIATE sans setTimeout
    console.log('🔄 Setting up Zustand subscription...');
    
    // 🔥 NOUVEAU: Forcer reset révélation rings au démarrage (problème localStorage)
    const forceResetRevealRings = useSceneStore.getState().forceResetRevealRings;
    if (forceResetRevealRings) {
      forceResetRevealRings();
      console.log('🔧 Reveal rings forcé à false au démarrage');
    }

    // 🔥 NOUVEAU: Synchronisation initiale forcée avec état correct
    const performInitialSync = () => {
        const currentState = useSceneStore.getState();
        const revealRingsVisible = currentState.bloom?.groups?.revealRings?.forceVisible;
        
        console.log('🚀 Performing initial forced sync...', {
          zustandRevealRingsVisible: revealRingsVisible,
          hasRevealationSystem: !!window.revelationSystem,
          revelationSystemMethods: window.revelationSystem ? Object.getOwnPropertyNames(window.revelationSystem).filter(m => typeof window.revelationSystem[m] === 'function') : []
        });
        
        const revelationSystem = window.revelationSystem;
        
        if (revelationSystem && revelationSystem.setForceShowAll) {
          // 🔧 CRITIQUE: TOUJOURS synchroniser l'état, même si false
          console.log(`🔓 Initial sync reveal rings visibility: ${revealRingsVisible} (forcing consistent state)`);
          
          // 🔥 NOUVEAU: Vérifier l'état actuel du revelationSystem pour détecter désynchronisation
          const currentRevealationState = revelationSystem.forceShowAll;
          console.log(`🔍 State comparison:`, {
            zustandState: revealRingsVisible,
            revelationSystemState: currentRevealationState,
            needsSync: revealRingsVisible !== currentRevealationState
          });
          
          // 🔧 FORCER la synchronisation même si les états semblent identiques
          revelationSystem.setForceShowAll(revealRingsVisible);
          
          // 🔧 DOUBLE VÉRIFICATION après sync
          setTimeout(() => {
            const newRevealationState = revelationSystem.forceShowAll;
            console.log(`🔍 Post-sync verification:`, {
              zustandState: revealRingsVisible,
              revelationSystemState: newRevealationState,
              syncSuccessful: revealRingsVisible === newRevealationState
            });
            
            // Si toujours désynchronisé, forcer encore
            if (revealRingsVisible !== newRevealationState) {
              console.warn(`⚠️ Still desynchronized, forcing again...`);
              revelationSystem.setForceShowAll(revealRingsVisible);
            }
          }, 50);
          
          // 🔧 NOUVEAU: Forcer aussi une synchronisation bloom complète pour éviter les conflits
          const sceneController = window.sceneStateController || window.stateController;
          if (sceneController && sceneController.setMaterialParameter) {
            const bloomState = currentState.bloom;
            if (bloomState && bloomState.groups) {
              Object.entries(bloomState.groups).forEach(([groupName, groupSettings]) => {
                if (groupSettings.emissive !== undefined) {
                  sceneController.setMaterialParameter(groupName, 'emissive', groupSettings.emissive);
                }
                if (groupSettings.emissiveIntensity !== undefined) {
                  sceneController.setMaterialParameter(groupName, 'emissiveIntensity', groupSettings.emissiveIntensity);
                }
              });
            }
          }
          
          // 🔧 Forcer la mise à jour visuelle immédiate
          if (window.renderer && window.scene && window.camera) {
            window.renderer.render(window.scene, window.camera);
          }
          
          console.log(`✅ Initial complete sync performed: revealRings=${revealRingsVisible}`);
        } else {
          console.warn(`❌ RevealationSystem not available for initial sync`, {
            hasRevealationSystem: !!revelationSystem,
            availableMethods: revelationSystem ? Object.getOwnPropertyNames(revelationSystem).filter(m => typeof revelationSystem[m] === 'function') : []
          });
        }
      };
      
      // 🚀 OPTIMISÉ: Sync initiale IMMÉDIATE, pas de retry multiples
      performInitialSync();
      
      // Subscribe aux changements bloom globaux - CORRECT ZUSTAND V5 API
      const unsubscribeGlobal = useSceneStore.subscribe(
        // Callback: fonction appelée à chaque changement d'état
        (state, previousState) => {
          // Récupérer les contrôleurs une seule fois
          const sceneController = window.sceneStateController || window.stateController;
          const bloomController = window.bloomControlCenter;
          
          if (!sceneController) {
            console.warn('❌ No scene controller available for sync');
            return;
          }
          
          // === SYNCHRONISATION BLOOM ===
          const bloom = state.bloom;
          const previousBloom = previousState?.bloom;
          
          // 🚀 OPTIMISÉ: Comparaison directe au lieu de JSON.stringify (beaucoup plus rapide)
          const bloomChanged = !previousBloom || 
            bloom.enabled !== previousBloom.enabled ||
            bloom.threshold !== previousBloom.threshold ||
            bloom.strength !== previousBloom.strength ||
            bloom.radius !== previousBloom.radius;
          
          if (bloomChanged) {
            console.log('🌟 Bloom state changed, syncing to Three.js systems...', {
              threshold: bloom.threshold,
              strength: bloom.strength,
              enabled: bloom.enabled,
              previous: {
                threshold: previousBloom?.threshold,
                strength: previousBloom?.strength
              }
            });
            
            // Récupérer les contrôleurs via les refs globales
            const sceneController = window.sceneStateController || window.stateController;
            const bloomController = window.bloomControlCenter;
            
            if (sceneController) {
              // Utiliser SceneStateController si disponible
              console.log('📡 Using SceneStateController for sync', {
                hasSetBloomParameter: !!sceneController.setBloomParameter,
                hasSetGroupBloomParameter: !!sceneController.setGroupBloomParameter,
                controllerType: sceneController.constructor?.name,
                // 🔍 DIAGNOSTIC : Vérifier les connexions système
                hasSimpleBloom: !!sceneController.systems?.simpleBloom,
                hasBloomController: !!sceneController.systems?.bloomController,
                systemsCount: sceneController.systems ? Object.keys(sceneController.systems).length : 0
              });
              
              // Sync bloom enabled first - CRITICAL FOR CHECKBOX
              if (sceneController.setBloomEnabled) {
                console.log(`🎯 Syncing bloom enabled: ${bloom.enabled}`);
                sceneController.setBloomEnabled(bloom.enabled);
              }
              
              // Sync bloom global parameters - CORRECT METHOD NAME
              if (sceneController.setBloomParameter) {
                console.log(`🎯 Syncing threshold: ${bloom.threshold}`);
                sceneController.setBloomParameter('threshold', bloom.threshold);
                
                console.log(`🎯 Syncing strength: ${bloom.strength}`);
                sceneController.setBloomParameter('strength', bloom.strength);
                
                console.log(`🎯 Syncing radius: ${bloom.radius}`);
                sceneController.setBloomParameter('radius', bloom.radius);
              } else {
                console.warn('❌ setBloomParameter method not available on controller');
              }
              
              // Sync bloom groups - ONLY emissive properties, NOT bloom parameters
              // ⚠️ IMPORTANT: UnrealBloomPass has only ONE global threshold/strength/radius
              // Group-specific threshold/strength/radius would overwrite the global values!
              if (sceneController.setMaterialParameter) {
                Object.entries(bloom.groups).forEach(([groupName, groupSettings]) => {
                  console.log(`🎯 Syncing ${groupName} emissive properties:`, {
                    emissive: groupSettings.emissive,
                    emissiveIntensity: groupSettings.emissiveIntensity
                  });
                  
                  // ONLY sync emissive properties - bloom parameters are global
                  if (groupSettings.emissive !== undefined) {
                    sceneController.setMaterialParameter(groupName, 'emissive', groupSettings.emissive);
                  }
                  if (groupSettings.emissiveIntensity !== undefined) {
                    sceneController.setMaterialParameter(groupName, 'emissiveIntensity', groupSettings.emissiveIntensity);
                  }
                  
                  // 🔥 SPÉCIAL: Mise à jour IMMÉDIATE du RevealationSystem pour les revealRings
                  if (groupName === 'revealRings' && window.revelationSystem?.forceUpdateBloomMaterials) {
                    console.log('🔄 Forcing IMMEDIATE RevealationSystem material update for revealRings');
                    window.revelationSystem.forceUpdateBloomMaterials();
                  }
                });
              } else {
                console.warn('❌ setMaterialParameter method not available on controller');
              }
              
            } else if (bloomController) {
              // Fallback direct BloomController
              console.log('📡 Using direct BloomController for sync');
              
              // Sync bloom enabled
              if (bloomController.setBloomEnabled) {
                console.log(`🎯 Syncing bloom enabled via BloomController: ${bloom.enabled}`);
                bloomController.setBloomEnabled(bloom.enabled);
              }
              
              bloomController.setGlobalThreshold?.(bloom.threshold);
              bloomController.setGlobalStrength?.(bloom.strength);
              bloomController.setGlobalRadius?.(bloom.radius);
              
            } else {
              console.warn('❌ No bloom controller available for sync');
            }
          }
          
          // === SYNCHRONISATION PBR ===
          const pbr = state.pbr;
          const previousPbr = previousState?.pbr;
          
          // 🚀 OPTIMISÉ: Comparaison directe au lieu de JSON.stringify
          const pbrChanged = !previousPbr ||
            pbr.currentPreset !== previousPbr.currentPreset ||
            pbr.ambientMultiplier !== previousPbr.ambientMultiplier ||
            pbr.directionalMultiplier !== previousPbr.directionalMultiplier ||
            pbr.hdrBoost.enabled !== previousPbr.hdrBoost?.enabled ||
            pbr.hdrBoost.multiplier !== previousPbr.hdrBoost?.multiplier ||
            pbr.materialSettings.metalness !== previousPbr.materialSettings?.metalness ||
            pbr.materialSettings.roughness !== previousPbr.materialSettings?.roughness;
          
          if (pbrChanged) {
            console.log('🎨 PBR state changed, syncing IMMEDIATELY to SceneStateController...', {
              currentPreset: pbr.currentPreset,
              ambientMultiplier: pbr.ambientMultiplier,
              directionalMultiplier: pbr.directionalMultiplier,
              materialSettings: pbr.materialSettings,
              hdrBoost: pbr.hdrBoost
            });
            
            // 🔍 DIAGNOSTIC: Vérifier méthodes disponibles
            if (!sceneController) {
              console.error('❌ PBR SYNC: No sceneController available!');
              return;
            }
            
            if (!sceneController.setPBRParameter) {
              console.error('❌ PBR SYNC: setPBRParameter method missing!', {
                availableMethods: Object.getOwnPropertyNames(sceneController).filter(name => typeof sceneController[name] === 'function')
              });
              return;
            }
            
            // Sync PBR preset
            if (pbr.currentPreset !== previousPbr?.currentPreset) {
              console.log(`🎯 Syncing PBR preset: ${pbr.currentPreset}`);
              try {
                sceneController.setPBRParameter('currentPreset', pbr.currentPreset);
                console.log(`✅ PBR preset synced successfully`);
              } catch (error) {
                console.error('❌ PBR preset sync failed:', error);
              }
            }
            
            // Sync multipliers (avec throttling des logs)
            if (pbr.ambientMultiplier !== previousPbr?.ambientMultiplier) {
              if (!pbr._logSpamThrottle) console.log(`🎯 Syncing ambient multiplier: ${pbr.ambientMultiplier}`);
              try {
                sceneController.setPBRParameter('ambientMultiplier', pbr.ambientMultiplier);
                if (!pbr._logSpamThrottle) console.log(`✅ Ambient multiplier synced successfully`);
              } catch (error) {
                console.error('❌ Ambient multiplier sync failed:', error);
              }
            }
            
            if (pbr.directionalMultiplier !== previousPbr?.directionalMultiplier) {
              if (!pbr._logSpamThrottle) console.log(`🎯 Syncing directional multiplier: ${pbr.directionalMultiplier}`);
              try {
                sceneController.setPBRParameter('directionalMultiplier', pbr.directionalMultiplier);
                if (!pbr._logSpamThrottle) console.log(`✅ Directional multiplier synced successfully`);
              } catch (error) {
                console.error('❌ Directional multiplier sync failed:', error);
              }
            }
            
            // Sync HDR Boost
            if (sceneController.setPBRHDRBoost && (
              pbr.hdrBoost.enabled !== previousPbr?.hdrBoost?.enabled ||
              pbr.hdrBoost.multiplier !== previousPbr?.hdrBoost?.multiplier
            )) {
              console.log(`🎯 Syncing HDR boost: enabled=${pbr.hdrBoost.enabled}, multiplier=${pbr.hdrBoost.multiplier}`);
              try {
                sceneController.setPBRHDRBoost(pbr.hdrBoost.enabled, pbr.hdrBoost.multiplier);
                console.log(`✅ HDR boost synced successfully`);
              } catch (error) {
                console.error('❌ HDR boost sync failed:', error);
              }
            }
            
            // 🔧 NOUVEAU: Sync matériaux PBR (metalness, roughness) - CRITIQUE MANQUANT !
            if (pbr.materialSettings && (
              pbr.materialSettings.metalness !== previousPbr?.materialSettings?.metalness ||
              pbr.materialSettings.roughness !== previousPbr?.materialSettings?.roughness
            )) {
              console.log('🎨 Material settings changed, syncing IMMEDIATELY to Three.js...', {
                metalness: pbr.materialSettings.metalness,
                roughness: pbr.materialSettings.roughness,
                targetMaterials: pbr.materialSettings.targetMaterials
              });
              
              // Appliquer aux matériaux Three.js (même logique que handleMaterialProperty)
              if (window.scene && pbr.materialSettings.targetMaterials) {
                let appliedCount = 0;
                const appliedMaterials = [];
                
                window.scene.traverse((child) => {
                  if (child.isMesh && child.material) {
                    const material = Array.isArray(child.material) ? child.material[0] : child.material;
                    const materialName = material.name || '';
                    
                    // Vérifier si c'est un matériau ciblé
                    const shouldApply = pbr.materialSettings.targetMaterials && (
                      pbr.materialSettings.targetMaterials.includes('all') ||
                      pbr.materialSettings.targetMaterials.some(targetMat => 
                        materialName.includes(targetMat) || materialName === targetMat
                      )
                    );
                    
                    if (shouldApply) {
                      let materialUpdated = false;
                      
                      // Sync metalness
                      if (material.metalness !== undefined && pbr.materialSettings.metalness !== previousPbr?.materialSettings?.metalness) {
                        material.metalness = pbr.materialSettings.metalness;
                        materialUpdated = true;
                      }
                      
                      // Sync roughness
                      if (material.roughness !== undefined && pbr.materialSettings.roughness !== previousPbr?.materialSettings?.roughness) {
                        material.roughness = pbr.materialSettings.roughness;
                        materialUpdated = true;
                      }
                      
                      if (materialUpdated) {
                        material.needsUpdate = true;
                        appliedCount++;
                        appliedMaterials.push(materialName);
                      }
                    }
                  }
                });
                
                if (appliedCount > 0) {
                  console.log(`🎨 Materials synced IMMEDIATELY: ${appliedCount} matériaux mis à jour:`, appliedMaterials);
                }
              }
            }
          }
          
          // === SYNCHRONISATION LIGHTING ===
          const lighting = state.lighting;
          const previousLighting = previousState?.lighting;
          
          // 🚀 OPTIMISÉ: Comparaison directe avec vérifications safety
          const lightingChanged = !previousLighting ||
            lighting.exposure !== previousLighting.exposure ||
            lighting.ambient?.intensity !== previousLighting.ambient?.intensity ||
            lighting.ambient?.color !== previousLighting.ambient?.color ||
            lighting.directional?.intensity !== previousLighting.directional?.intensity ||
            lighting.directional?.color !== previousLighting.directional?.color;
          
          if (lightingChanged) {
            console.log('💡 Lighting state changed, syncing to SceneStateController...', {
              exposure: lighting.exposure,
              ambient: lighting.ambient,
              directional: lighting.directional
            });
            
            // Sync exposure
            if (sceneController.setExposure && lighting.exposure !== previousLighting?.exposure) {
              console.log(`🎯 Syncing exposure: ${lighting.exposure}`);
              sceneController.setExposure(lighting.exposure);
            }
            
            // Sync ambient light
            if (sceneController.setLightingParameter && lighting.ambient && (
              lighting.ambient.intensity !== previousLighting?.ambient?.intensity ||
              lighting.ambient.color !== previousLighting?.ambient?.color
            )) {
              console.log(`🎯 Syncing ambient light:`, lighting.ambient);
              sceneController.setLightingParameter('ambient', 'intensity', lighting.ambient.intensity);
              sceneController.setLightingParameter('ambient', 'color', lighting.ambient.color);
            }
            
            // Sync directional light
            if (sceneController.setLightingParameter && lighting.directional && (
              lighting.directional.intensity !== previousLighting?.directional?.intensity ||
              lighting.directional.color !== previousLighting?.directional?.color
            )) {
              console.log(`🎯 Syncing directional light:`, lighting.directional);
              sceneController.setLightingParameter('directional', 'intensity', lighting.directional.intensity);
              sceneController.setLightingParameter('directional', 'color', lighting.directional.color);
            }
          }
          
          // === SYNCHRONISATION BACKGROUND ===
          const background = state.background;
          const previousBackground = previousState?.background;
          
          // 🔍 DIAGNOSTIC BACKGROUND: Log toujours pour debug
          console.log('🔍 BACKGROUND DIAGNOSTIC:', {
            hasBackgroundState: !!background,
            hasPreviousBackgroundState: !!previousBackground,
            hasSceneController: !!sceneController,
            hasSetBackground: !!(sceneController && sceneController.setBackground),
            currentType: background?.type,
            previousType: previousBackground?.type,
            currentColor: background?.color,
            backgroundChanged: JSON.stringify(background) !== JSON.stringify(previousBackground),
            backgroundStateKeys: background ? Object.keys(background) : null,
            backgroundData: background
          });
          
          if (JSON.stringify(background) !== JSON.stringify(previousBackground)) {
            console.log('🌈 Background state changed, syncing to SceneStateController...', {
              type: background.type,
              color: background.color,
              alpha: background.alpha,
              gradient: background.gradient,
              environment: background.environment
            });
            
            // 🔍 DIAGNOSTIC: Vérifier méthodes disponibles
            if (!sceneController) {
              console.error('❌ BACKGROUND SYNC: No sceneController available!');
              return;
            }
            
            if (!sceneController.setBackground) {
              console.error('❌ BACKGROUND SYNC: setBackground method missing!', {
                availableMethods: Object.getOwnPropertyNames(sceneController).filter(name => typeof sceneController[name] === 'function')
              });
              return;
            }
            
            // Sync background using the main setBackground method
            console.log(`🎯 Syncing background: type=${background.type}, color=${background.color}, alpha=${background.alpha}`);
            
            try {
              // Pass all relevant data based on type
              let backgroundData = background.color;
              
              if (background.type === 'gradient' && background.gradient.enabled) {
                // For gradient, pass gradient config as data
                backgroundData = {
                  colors: background.gradient.colors,
                  direction: background.gradient.direction,
                  type: background.gradient.type
                };
                console.log('🔍 Using gradient data:', backgroundData);
              } else if (background.type === 'environment' && background.environment.enabled) {
                // For environment, pass environment config
                backgroundData = {
                  intensity: background.environment.intensity,
                  rotation: background.environment.rotation,
                  blur: background.environment.blur
                };
                console.log('🔍 Using environment data:', backgroundData);
              } else {
                console.log('🔍 Using color data:', backgroundData);
              }
              
              // Call setBackground with type, data, and alpha
              sceneController.setBackground(background.type, backgroundData, background.alpha);
              
              console.log('✅ Background synced to SceneStateController successfully');
            } catch (error) {
              console.error('❌ Background sync failed:', error);
            }
            
            // Note: If specific methods become available later, we can use them:
            // - setBackgroundColor(color)
            // - setBackgroundAlpha(alpha) 
            // - setBackgroundGradient(enabled, config)
            // - setBackgroundEnvironment(enabled, config)
          } else {
            console.log('🔍 Background state unchanged, no sync needed');
          }
          
          // === SYNCHRONISATION PARTICLES ===
          const particles = state.particles;
          const previousParticles = previousState?.particles;
          
          if (JSON.stringify(particles) !== JSON.stringify(previousParticles)) {
            console.log('🎨 Particles state changed, syncing to SceneStateController...', {
              enabled: particles.enabled,
              count: particles.count,
              color: particles.color,
              arcs: particles.arcs
            });
            
            // Sync particles main properties
            if (sceneController.setParticleParameter) {
              if (particles.enabled !== previousParticles?.enabled) {
                console.log(`🎯 Syncing particles enabled: ${particles.enabled}`);
                sceneController.setParticleParameter('enabled', particles.enabled);
              }
              
              if (particles.count !== previousParticles?.count) {
                console.log(`🎯 Syncing particles count: ${particles.count}`);
                sceneController.setParticleParameter('count', particles.count);
              }
              
              if (particles.color !== previousParticles?.color) {
                console.log(`🎯 Syncing particles color: ${particles.color}`);
                sceneController.setParticleParameter('color', particles.color);
              }
            }
            
            // Sync electric arcs
            if (sceneController.setArcsParameter && JSON.stringify(particles.arcs) !== JSON.stringify(previousParticles?.arcs)) {
              console.log(`🎯 Syncing arcs:`, particles.arcs);
              sceneController.setArcsParameter('enabled', particles.arcs.enabled);
              sceneController.setArcsParameter('intensity', particles.arcs.intensity);
              sceneController.setArcsParameter('connectionDistance', particles.arcs.connectionDistance);
              sceneController.setArcsParameter('count', particles.arcs.count);
            }
          }
          
          // === SYNCHRONISATION REVEAL RINGS VISIBILITÉ ===
          const revealRingsVisible = bloom.groups?.revealRings?.forceVisible;
          const previousRevealRingsVisible = previousBloom?.groups?.revealRings?.forceVisible;
          
          // 🔧 NOUVEAU: Synchronisation séparée pour éviter les effets de bord
          if (revealRingsVisible !== previousRevealRingsVisible) {
            console.log(`🔓 ISOLATED: Syncing reveal rings visibility ONLY: ${revealRingsVisible} (was: ${previousRevealRingsVisible})`);
            
            // Récupérer revelationSystem depuis la référence globale
            const revelationSystem = window.revelationSystem;
            
            if (revelationSystem && revelationSystem.setForceShowAll) {
              // 🔥 CRITICAL: Synchroniser immédiatement sans délai
              revelationSystem.setForceShowAll(revealRingsVisible);
              console.log(`✅ ISOLATED: Reveal rings visibility synced to RevealationSystem - NO OTHER GROUPS AFFECTED`);
              
              // 🔧 IMPORTANT: Ne PAS toucher aux autres groupes bloom - seulement visibility
              // Ne pas synchroniser emissive ou intensities ici pour éviter les conflits
              
              // 🔧 Force le rendu immédiat ET delayed pour s'assurer de la visibilité
              if (window.renderer && window.scene && window.camera) {
                // Rendu immédiat
                window.renderer.render(window.scene, window.camera);
                // Rendu delayed pour s'assurer que les changements sont pris en compte
                setTimeout(() => {
                  window.renderer.render(window.scene, window.camera);
                }, 16); // Un frame à 60fps
              }
              
              // 🔥 CRITICAL: STOPPER complètement la synchronisation pour cette mise à jour
              // Return early pour éviter les effets de bord sur iris/eyeRings
              console.log(`🛑 ISOLATED: Stopping bloom sync to prevent side effects`);
              return; // Arrêter ici pour cette mise à jour spécifique
            } else {
              console.warn(`❌ RevealationSystem not available for isolated sync`, {
                hasRevealationSystem: !!revelationSystem,
                hasSetForceShowAll: !!(revelationSystem && revelationSystem.setForceShowAll),
                windowKeys: Object.keys(window).filter(k => k.toLowerCase().includes('reveal')),
                availableMethods: revelationSystem ? Object.getOwnPropertyNames(revelationSystem).filter(name => typeof revelationSystem[name] === 'function') : []
              });
            }
          }
          
          // === SYNCHRONISATION SECURITY ===
          const security = state.security;
          const previousSecurity = previousState?.security;
          
          if (JSON.stringify(security) !== JSON.stringify(previousSecurity)) {
            console.log('🔒 Security state changed, syncing to SceneStateController...', {
              state: security.state,
              isTransitioning: security.transition.isTransitioning
            });
            
            // 🔥 CORRECTION CRITIQUE: Utiliser la BONNE méthode
            if (sceneController.setSecurityMode && security.state !== previousSecurity?.state) {
              console.log(`🎯 Syncing security MODE: ${security.state}`);
              sceneController.setSecurityMode(security.state);
            }
            
            // 🔥 BACKUP: Appeler aussi BloomControlCenter directement si disponible
            if (bloomController && bloomController.setSecurityState && security.state !== previousSecurity?.state) {
              console.log(`🎯 DIRECT: Syncing security state to BloomControlCenter: ${security.state}`);
              bloomController.setSecurityState(security.state);
            }
            
            // Sync transition state
            if (sceneController.setTransitionState && security.transition.isTransitioning !== previousSecurity?.transition.isTransitioning) {
              console.log(`🎯 Syncing transition state: ${security.transition.isTransitioning}`);
              sceneController.setTransitionState(security.transition.isTransitioning);
            }
          }
          
          // === SYNCHRONISATION MSAA ===
          const msaa = state.msaa;
          const previousMsaa = previousState?.msaa;
          
          if (JSON.stringify(msaa) !== JSON.stringify(previousMsaa)) {
            console.log('🎨 MSAA state changed, syncing to SceneStateController...', {
              enabled: msaa.enabled,
              samples: msaa.samples,
              fxaa: msaa.fxaa,
              currentQuality: msaa.currentQuality
            });
            
            // Sync MSAA properties
            if (sceneController.setMSAAParameter) {
              if (msaa.enabled !== previousMsaa?.enabled) {
                console.log(`🎯 Syncing MSAA enabled: ${msaa.enabled}`);
                sceneController.setMSAAParameter('enabled', msaa.enabled);
              }
              
              if (msaa.samples !== previousMsaa?.samples) {
                console.log(`🎯 Syncing MSAA samples: ${msaa.samples}`);
                sceneController.setMSAAParameter('samples', msaa.samples);
              }
              
              if (JSON.stringify(msaa.fxaa) !== JSON.stringify(previousMsaa?.fxaa)) {
                console.log(`🎯 Syncing FXAA:`, msaa.fxaa);
                sceneController.setMSAAParameter('fxaaEnabled', msaa.fxaa.enabled);
                sceneController.setMSAAParameter('fxaaThreshold', msaa.fxaa.threshold);
              }
            }
          }
        }
      );
      
      console.log('✅ Temporary sync hook initialized with controllers ready');
      
      // Return cleanup function
      window.tempSyncCleanup = () => {
        unsubscribeGlobal();
        console.log('🧹 Temporary sync hook cleaned up');
      };
      
    // 🚀 OPTIMISÉ: Plus besoin d'attendre, synchronisation immédiate
    
    // Cleanup function pour l'useEffect
    return () => {
      if (window.tempSyncCleanup) {
        window.tempSyncCleanup();
        delete window.tempSyncCleanup;
      }
    };
  }, [systemsInitialized]);
};