// 🎛️ BloomControlCenter V6 - SYSTÈME UNIFIÉ RESTAURÉ DE V5
import * as THREE from 'three';

export class BloomControlCenter {
  constructor(renderingEngine = null) {
    // ✅ COORDINATION : Injection moteur de rendu SimpleBloomSystem
    this.renderingEngine = renderingEngine;
    
    // 📊 COLLECTIONS D'OBJETS PAR TYPE
    this.objectsByType = {
      eyeRings: new Map(),     // 👁️ Anneaux_Eye_Ext/Int
      iris: new Map(),         // 🎯 IRIS
      magicRings: new Map(),   // 💍 Ring_SG1, Ring_SG2, etc.
      arms: new Map(),         // 🤖 BigArm, LittleArm, etc.
      revealRings: new Map()   // 🔮 Anneaux de révélation
    };

    // 🎨 CONFIGURATIONS PAR TYPE D'OBJET
    this.materialConfigs = {
      eyeRings: {
        emissive: 0x00ff88,      // Vert eye par défaut
        emissiveIntensity: 1.0,
        metalness: 0.8,
        roughness: 0.2
      },
      iris: {
        emissive: 0x00ff88,      // Même vert que eye rings
        emissiveIntensity: 1.0,
        metalness: 0.8,
        roughness: 0.2
      },
      magicRings: {
        emissive: 0x4488ff,      // Bleu magique
        emissiveIntensity: 1.0,
        metalness: 0.8,
        roughness: 0.2
      },
      arms: {
        emissive: 0x6666ff,      // Bleu métallique
        emissiveIntensity: 1.0,
        metalness: 0.8,
        roughness: 0.2
      },
      revealRings: {
        emissive: 0xffaa00,      // Orange révélation
        emissiveIntensity: 0.5,
        metalness: 0.8,
        roughness: 0.2
      }
    };

    // 🌟 CONFIGURATION POST-PROCESSING BLOOM - ✅ CCS: Valeurs par défaut, seront écrasées par SceneStateController
    this.postProcessConfig = {
      threshold: 0.15,   // Seuil luminance - sera synchronisé par CCS
      strength: 0.40,    // Intensité bloom - sera synchronisé par CCS  
      radius: 1.0,       // Rayon diffusion
      exposure: 1.2      // Exposition globale
    };

    // 🔒 PRESETS SÉCURITÉ COMPLETS
    this.securityPresets = {
      SAFE: {
        eyeRings: { emissive: 0x00ff88, emissiveIntensity: 0.3 },
        iris: { emissive: 0x00ff88, emissiveIntensity: 0.4 },
        magicRings: { emissive: 0x88ff88, emissiveIntensity: 0.15 },
        arms: { emissive: 0x44ff44, emissiveIntensity: 0.03 },
        revealRings: { emissive: 0x88ff88, emissiveIntensity: 0.3 }
      },
      DANGER: {
        eyeRings: { emissive: 0xff4444, emissiveIntensity: 0.8 },
        iris: { emissive: 0xff2222, emissiveIntensity: 1.0 },
        magicRings: { emissive: 0xff6666, emissiveIntensity: 0.4 },
        arms: { emissive: 0xff8888, emissiveIntensity: 0.1 },
        revealRings: { emissive: 0xff4444, emissiveIntensity: 0.6 }
      },
      WARNING: {
        eyeRings: { emissive: 0xffaa00, emissiveIntensity: 0.5 },
        iris: { emissive: 0xff8800, emissiveIntensity: 0.6 },
        magicRings: { emissive: 0xffcc44, emissiveIntensity: 0.25 },
        arms: { emissive: 0xffdd66, emissiveIntensity: 0.05 },
        revealRings: { emissive: 0xffaa00, emissiveIntensity: 0.4 }
      },
      SCANNING: {
        eyeRings: { emissive: 0x4488ff, emissiveIntensity: 0.6 },
        iris: { emissive: 0x2266ff, emissiveIntensity: 0.7 },
        magicRings: { emissive: 0x66aaff, emissiveIntensity: 0.3 },
        arms: { emissive: 0x88ccff, emissiveIntensity: 0.06 },
        revealRings: { emissive: 0x4488ff, emissiveIntensity: 0.5 }
      },
      NORMAL: {
        eyeRings: { emissive: 0xffffff, emissiveIntensity: 0.8 }, // 🔧 DOUBLÉ pour visibilité maximale
        iris: { emissive: 0xffffff, emissiveIntensity: 0.5 },     // 🔧 Blanc pur pour cohérence
        magicRings: { emissive: 0xffffff, emissiveIntensity: 0.3 }, // 🔧 AUGMENTÉ + blanc pur
        arms: { emissive: 0xffffff, emissiveIntensity: 0.1 },   // 🔧 DOUBLÉ + blanc pur
        revealRings: { emissive: 0xffffff, emissiveIntensity: 0.6 } // 🔧 AUGMENTÉ pour test
      }
    };

    // 🔄 ANIMATION ET STATE
    this.currentSecurityState = null; // Pas de preset par défaut
    this.animationTime = 0;
    this.transitionSpeed = 2.0;
    this.pulseEnabled = false;
    
  }

  // 🔍 DÉTECTION ET ENREGISTREMENT D'OBJETS PRÉCISE (CORRIGÉE)
  detectAndRegisterBloomObjects(model) {
    if (!model) {
      console.warn('🎛️ BloomControlCenter: Aucun modèle fourni');
      return 0;
    }

    let detectedCount = 0;
    // ✅ SUPPRIMÉ : Log de début pour réduire spam console

    model.traverse((child) => {
      if (!child.isMesh || !child.material) return;

      const name = child.name.toLowerCase();
      // ✅ SUPPRIMÉ : Log d'analyse pour chaque objet pour réduire spam console
      
      // 👁️ EYE RINGS DETECTION - PRÉCISE (anneaux_eye seulement)
      if (name.includes('anneaux_eye')) {
        this.registerObject('eyeRings', child.name, child);
        detectedCount++;
      }
      // 🎯 IRIS DETECTION  
      else if (name.includes('iris')) {
        this.registerObject('iris', child.name, child);
        detectedCount++;
      }
      // 🔮 REVEAL RINGS DETECTION - CORRECTION PATTERN
      else if (name.includes('ring_bloomarea') || name.includes('action_ring') || name.includes('bloomarea')) {
        this.registerObject('revealRings', child.name, child);
        detectedCount++;
      }
      // 💍 MAGIC RINGS DETECTION (Ring_SG pattern) - ✅ CORRECTION: SG1 rings go to revealRings pour test
      else if (name.includes('ring_ext_sg1') || name.includes('ring_int_sg1')) {
        // ✅ SUPPRIMÉ : Log de debug SG1 pour réduire spam console
        this.registerObject('revealRings', child.name, child);
        detectedCount++;
      }
      else if (name.includes('ring_sg') || (name.includes('ring') && !name.includes('eye'))) {
        this.registerObject('magicRings', child.name, child);
        detectedCount++;
      }
      // 🤖 ARMS DETECTION
      else if (name.includes('bigarm') || name.includes('littlearm') || name.includes('bras')) {
        this.registerObject('arms', child.name, child);
        detectedCount++;
      }
    });

    // 📊 Résumé détection
    console.log('📊 BloomControlCenter - Résumé détection:');
    Object.keys(this.objectsByType).forEach(type => {
      const count = this.objectsByType[type].size;
      console.log(`   • ${type}: ${count} objets`);
      if (count > 0) {
        this.objectsByType[type].forEach((obj, name) => {
          console.log(`     - ${name}`);
        });
      }
    });
    
    // 🎨 Appliquer configuration initiale
    this.applyInitialMaterials();
    
    return detectedCount;
  }

  // 📝 ENREGISTRER UN OBJET DANS UNE CATÉGORIE
  registerObject(objectType, objectName, meshObject) {
    if (!this.objectsByType[objectType]) {
      console.warn(`🎛️ BloomControlCenter: Type d'objet inconnu: ${objectType}`);
      return;
    }

    // Sauvegarder matériau original si pas déjà fait
    if (!meshObject.userData.originalMaterial) {
      meshObject.userData.originalMaterial = meshObject.material.clone();
    }

    this.objectsByType[objectType].set(objectName, meshObject);
  }

  // 🎨 APPLIQUER MATÉRIAUX INITIAUX
  applyInitialMaterials() {
    Object.keys(this.objectsByType).forEach(objectType => {
      // ✅ CORRECTION : Utiliser configs spécifiques si disponibles
      let config = this.materialConfigs[objectType];
      
      // Configuration spéciale pour revealRings
      if (objectType === 'revealRings') {
        config = {
          emissive: 0xffaa00,      // Orange pour reveal
          emissiveIntensity: 0.5,
          metalness: 0.8,
          roughness: 0.2
        };
      }
      
      if (config) {
        this.objectsByType[objectType].forEach((meshObject) => {
          this.updateObjectMaterial(meshObject, config);
        });
      }
    });

    // ✅ COORDINATION : Synchroniser avec SimpleBloomSystem si disponible
    if (this.renderingEngine) {
      this.syncGroupsWithRenderingEngine();
    }
  }

  // 🔧 METTRE À JOUR MATÉRIAU D'UN OBJET
  updateObjectMaterial(meshObject, materialConfig) {
    if (!meshObject.material) return;

    Object.keys(materialConfig).forEach(property => {
      const value = materialConfig[property];
      
      if (property === 'emissive') {
        if (!meshObject.material.emissive) {
          meshObject.material.emissive = new THREE.Color();
        }
        // 🔧 CORRIGÉ: Gérer à la fois les valeurs hex numériques ET les chaînes hex
        if (typeof value === 'string') {
          // Gérer les chaînes hex comme '#ff4444' ou 'ff4444'
          meshObject.material.emissive.set(value);
        } else {
          // Gérer les valeurs hex numériques comme 0xff4444
          meshObject.material.emissive.setHex(value);
        }
      } else if (meshObject.material[property] !== undefined) {
        meshObject.material[property] = value;
      }
    });

    meshObject.material.needsUpdate = true;
  }

  // 🔧 MODIFIER PROPRIÉTÉ D'UN TYPE D'OBJET
  setObjectTypeProperty(objectType, property, value) {
    // ✅ SUPPRIMÉ : Log pour réduire spam console
    
    if (!this.objectsByType[objectType]) {
      console.warn(`🔧 Type d'objet inconnu: ${objectType}`);
      return;
    }

    // 🎯 CORRECTION PRINCIPALE : Préserver mode sécurité actuel
    const currentSecurityPreset = this.securityPresets[this.currentSecurityState];
    const securityConfig = currentSecurityPreset && currentSecurityPreset[objectType];
    
    this.objectsByType[objectType].forEach((meshObject) => {
      if (property === 'emissive') {
        if (!meshObject.material.emissive) {
          meshObject.material.emissive = new THREE.Color();
        }
        // 🔧 CORRIGÉ: Gérer à la fois les valeurs hex numériques ET les chaînes hex
        if (typeof value === 'string') {
          // Gérer les chaînes hex comme '#ff4444' ou 'ff4444'
          meshObject.material.emissive.set(value);
        } else {
          // Gérer les valeurs hex numériques comme 0xff4444
          meshObject.material.emissive.setHex(value);
        }
      } else if (meshObject.material && meshObject.material[property] !== undefined) {
        meshObject.material[property] = value;
        
        // 🛡️ IMPORTANT : Réappliquer couleur de sécurité après changement d'intensité
        if (property === 'emissiveIntensity' && securityConfig && securityConfig.emissive) {
          if (!meshObject.material.emissive) {
            meshObject.material.emissive = new THREE.Color();
          }
          meshObject.material.emissive.setHex(securityConfig.emissive);
          // ✅ SUPPRIMÉ : Log pour réduire spam console
        }
      }
      
      // ✅ CORRECTION : Toujours marquer needsUpdate
      if (meshObject.material) {
        meshObject.material.needsUpdate = true;
      }
    });

  }

  // 🔒 CHANGER ÉTAT DE SÉCURITÉ - MÉTHODE PRINCIPALE
  setSecurityState(newState) {
    if (!this.securityPresets[newState]) {
      console.warn(`🔒 État de sécurité inconnu: ${newState}`);
      return;
    }

    this.currentSecurityState = newState;
    const preset = this.securityPresets[newState];

    // ✅ Appliquer preset à tous les types d'objets
    Object.keys(preset).forEach(objectType => {
      const config = preset[objectType];
      
      this.objectsByType[objectType].forEach((meshObject) => {
        // 🔧 CORRECTION CRITIQUE: S'assurer que le matériau supporte l'émissif
        if (meshObject.material && !meshObject.material.emissive) {
          meshObject.material.emissive = new THREE.Color(0x000000);
        }
        
        // 🔧 FORCER la visibilité des émissifs
        if (meshObject.material) {
          // Augmenter l'intensité émissive pour la sécurité
          // 🔧 BOOST SPÉCIAL pour NORMAL qui a des valeurs trop faibles
          const boostFactor = this.currentSecurityState === 'NORMAL' ? 10 : 5;
          const boostedConfig = {
            ...this.materialConfigs[objectType],
            ...config,
            emissiveIntensity: config.emissiveIntensity * boostFactor // 🔥 BOOST x10 pour NORMAL, x5 pour les autres
          };
          
          this.updateObjectMaterial(meshObject, boostedConfig);
        }
      });
    });

    // 🔧 FORCER le rafraîchissement des matériaux et du rendu
    // Parcourir tous les objets pour forcer needsUpdate
    Object.values(this.objectsByType).forEach(objects => {
      objects.forEach(meshObject => {
        if (meshObject.material) {
          meshObject.material.needsUpdate = true;
          // Forcer aussi la mise à jour de la géométrie si nécessaire
          if (meshObject.geometry && meshObject.geometry.attributes) {
            meshObject.geometry.attributes.position.needsUpdate = true;
          }
        }
      });
    });

    // 🔧 NOUVEAU: Déclencher un événement pour forcer le rendu
    if (window.renderer) {
      window.renderer.render(window.scene, window.camera);
    }

    // 🔧 FORCER le rafraîchissement complet du système bloom
    // Problème identifié : le changement de couleur ne force pas la mise à jour des matériaux
    if (window.sceneStateController && window.sceneStateController.systems.simpleBloom) {
      const bloomSystem = window.sceneStateController.systems.simpleBloom;
      
      // 🔥 SOLUTION : Forcer la reconstruction complète du bloom pass
      if (bloomSystem.bloomPass && bloomSystem.bloomPass.dispose) {
        // Ne pas disposer, mais forcer la recompilation des shaders
        bloomSystem.bloomPass.needsSwap = true;
      }
      
      // 🔥 FORCER le recalcul des uniformes du shader bloom
      if (bloomSystem.bloomPass && bloomSystem.bloomPass.uniforms) {
        Object.keys(bloomSystem.bloomPass.uniforms).forEach(key => {
          if (bloomSystem.bloomPass.uniforms[key]) {
            bloomSystem.bloomPass.uniforms[key].needsUpdate = true;
          }
        });
      }
      
      // 🔥 FORCER la mise à jour immédiate du threshold pour déclencher le recalcul
      const currentThreshold = bloomSystem.bloomPass.threshold;
      bloomSystem.bloomPass.threshold = 0.001; // Force très bas
      setTimeout(() => {
        bloomSystem.bloomPass.threshold = currentThreshold;
        // Double force après 10ms pour s'assurer
        setTimeout(() => {
          if (window.renderer && window.scene && window.camera) {
            window.renderer.render(window.scene, window.camera);
          }
        }, 10);
      }, 5);
    }

    // 🔥 APPELER la méthode de forçage complet
    this.forceCompleteRefresh();
    
    console.log(`🔒 Security state changed to ${newState} - materials forced to update`);
  }
  
  // 🔥 NOUVELLE MÉTHODE: Forcer le recalcul complet après changement de couleur
  forceCompleteRefresh() {
    console.log('🔥 BloomControlCenter: Forcing complete refresh after color change');
    
    // Forcer needsUpdate sur TOUS les matériaux avec reset émissif
    Object.values(this.objectsByType).forEach(objects => {
      objects.forEach(meshObject => {
        if (meshObject.material && meshObject.material.emissive) {
          const currentEmissive = meshObject.material.emissive.clone();
          const currentIntensity = meshObject.material.emissiveIntensity || 0;
          
          // Reset temporaire puis restore pour forcer le recalcul
          meshObject.material.emissive.setRGB(0, 0, 0);
          meshObject.material.emissiveIntensity = 0;
          meshObject.material.needsUpdate = true;
          
          setTimeout(() => {
            meshObject.material.emissive.copy(currentEmissive);
            meshObject.material.emissiveIntensity = currentIntensity;
            meshObject.material.needsUpdate = true;
            
            // Force aussi la mise à jour de la géométrie
            if (meshObject.geometry && meshObject.geometry.attributes) {
              Object.values(meshObject.geometry.attributes).forEach(attr => {
                if (attr.needsUpdate !== undefined) {
                  attr.needsUpdate = true;
                }
              });
            }
          }, 10);
        }
      });
    });
  }

  // 🌟 API POST-PROCESSING (pour connexion future)
  setPostProcessParameter(parameter, value) {
    if (this.postProcessConfig[parameter] !== undefined) {
      this.postProcessConfig[parameter] = value;
    } else if (parameter.startsWith('reveal_')) {
      // ✅ NOUVEAU : Paramètres spécifiques pour reveal rings
      const realParam = parameter.replace('reveal_', '');
      if (!this.revealPostProcessConfig) {
        this.revealPostProcessConfig = {
          threshold: 0.3,
          strength: 1.5,
          radius: 1.0
        };
      }
      
      if (this.revealPostProcessConfig[realParam] !== undefined) {
        this.revealPostProcessConfig[realParam] = value;
      }
    }
  }

  // ✅ CCS: Synchronisation depuis SceneStateController
  syncFromStateController(stateController) {
    if (!stateController || !stateController.state) return;
    
    const bloomState = stateController.state.bloom;
    if (bloomState) {
      // ✅ SUPPRIMÉ : Log de sync CCS pour réduire spam console
      
      // Synchroniser les paramètres bloom globaux
      this.postProcessConfig.threshold = bloomState.threshold;
      this.postProcessConfig.strength = bloomState.strength;
      this.postProcessConfig.radius = bloomState.radius;
      
      // Propager vers le moteur de rendu
      if (this.renderingEngine && this.renderingEngine.updateBloom) {
        this.renderingEngine.updateBloom('threshold', bloomState.threshold);
        this.renderingEngine.updateBloom('strength', bloomState.strength);
        this.renderingEngine.updateBloom('radius', bloomState.radius);
      }
    }
  }

  // 🔄 UPDATE (pour animations futures)
  update(deltaTime) {
    this.animationTime += deltaTime;
    
    if (this.pulseEnabled && this.currentSecurityState === 'SCANNING') {
      this.updatePulseEffect();
    }
  }

  // 💫 EFFET PULSE (préparé pour le futur)
  updatePulseEffect() {
    const pulseIntensity = Math.sin(this.animationTime * 3) * 0.2 + 0.5;
    
    // Appliquer pulsation aux eye rings et iris en mode SCANNING
    if (this.currentSecurityState === 'SCANNING') {
      const baseIntensity = this.securityPresets.SCANNING.eyeRings.emissiveIntensity;
      this.setObjectTypeProperty('eyeRings', 'emissiveIntensity', baseIntensity * pulseIntensity);
      this.setObjectTypeProperty('iris', 'emissiveIntensity', baseIntensity * pulseIntensity);
    }
  }

  // 📊 INFORMATIONS DEBUG
  getObjectsInfo() {
    const info = {};
    Object.keys(this.objectsByType).forEach(type => {
      info[type] = {
        count: this.objectsByType[type].size,
        objects: Array.from(this.objectsByType[type].keys())
      };
    });
    return info;
  }

  // 📊 INFORMATIONS CONFIG DEBUG
  getConfigInfo() {
    return {
      securityState: this.currentSecurityState,
      postProcessConfig: this.postProcessConfig,
      revealPostProcessConfig: this.revealPostProcessConfig || null,
      objectGroups: {
        iris: this.objectsByType.iris.size,
        eyeRings: this.objectsByType.eyeRings.size,
        magicRings: this.objectsByType.magicRings.size,
        arms: this.objectsByType.arms.size
      },
      renderingEngine: this.renderingEngine ? 'Connected' : 'Not Connected'
    };
  }

  // ✅ COORDINATION : Interface unifiée bloom pour V3Scene avec support groupes
  setBloomParameter(param, value, groupName = null) {
    if (this.renderingEngine && this.renderingEngine.updateBloom) {
      if (groupName) {
        // ✅ NOUVEAU : Paramètres spécifiques par groupe
        
        // Stocker la valeur pour ce groupe spécifiquement
        if (!this.groupBloomSettings) {
          this.groupBloomSettings = {
            iris: { threshold: 0.3, strength: 0.8, radius: 0.4 },
            eyeRings: { threshold: 0.4, strength: 0.6, radius: 0.3 }, 
            revealRings: { threshold: 0.43, strength: 0.80, radius: 0.36 },
            magicRings: { threshold: 0.3, strength: 0.6, radius: 0.3 },
            arms: { threshold: 0.5, strength: 0.4, radius: 0.2 }
          };
        }
        
        if (this.groupBloomSettings[groupName]) {
          this.groupBloomSettings[groupName][param] = value;
          // Pour l'instant, appliquer au système global (limitation technique)
          // TODO: Implémenter le selective bloom plus tard
          this.renderingEngine.updateBloom(param, value);
        }
      } else {
        // ✅ ANCIEN : Paramètre global (threshold, etc.)
        this.renderingEngine.updateBloom(param, value);
      }
      return true;
    } else {
      console.warn(`⚠️ BloomControlCenter: Aucun moteur de rendu connecté pour ${param}=${value}`);
      return false;
    }
  }
  
  // ✅ NOUVEAU : Obtenir les paramètres d'un groupe
  getGroupBloomSettings(groupName) {
    if (!this.groupBloomSettings || !this.groupBloomSettings[groupName]) {
      return { threshold: 0.3, strength: 0.8, radius: 0.4 }; // Valeurs par défaut
    }
    return this.groupBloomSettings[groupName];
  }

  // ✅ COORDINATION : Synchroniser objets bloom vers moteur de rendu
  syncWithRenderingEngine() {
    if (!this.renderingEngine) return;
    
    // ✅ CORRECTION : Utiliser les méthodes qui existent dans SimpleBloomSystem
    // Synchroniser les groupes d'objets
    this.syncGroupsWithRenderingEngine();
  }
  
  // ✅ NOUVEAU : Synchroniser groupes avec SimpleBloomSystem
  syncGroupsWithRenderingEngine() {
    if (!this.renderingEngine) return;
    
    // Enregistrer les objets dans SimpleBloomSystem par groupe
    Object.keys(this.objectsByType).forEach(groupName => {
      this.objectsByType[groupName].forEach((meshObject) => {
        if (this.renderingEngine.addToGroup) {
          this.renderingEngine.addToGroup(meshObject, groupName);
        }
      });
    });
  }

  // ✅ HELPER : Récupérer tous objets bloom pour synchronisation
  getAllBloomObjects() {
    const allObjects = {};
    Object.keys(this.objectsByType).forEach(type => {
      this.objectsByType[type].forEach((object, name) => {
        allObjects[`${type}.${name}`] = object;
      });
    });
    return allObjects;
  }

  // 🔄 RESET VERS MATÉRIAUX ORIGINAUX
  resetToOriginalMaterials() {
    Object.values(this.objectsByType).forEach(objectMap => {
      objectMap.forEach((meshObject) => {
        if (meshObject.userData.originalMaterial) {
          meshObject.material = meshObject.userData.originalMaterial.clone();
        }
      });
    });
    
  }

  // 🗑️ NETTOYAGE
  dispose() {
    this.resetToOriginalMaterials();
    
    Object.keys(this.objectsByType).forEach(type => {
      this.objectsByType[type].clear();
    });
    
  }
}