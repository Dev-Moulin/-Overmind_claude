// 🎯 SceneStateController - Contrôleur Central de Synchronisation (CCS)
// Source unique de vérité pour tous les paramètres de la scène

import * as THREE from 'three';

export class SceneStateController {
  constructor() {
    // 🔧 État centralisé - TOUTES les valeurs de la scène
    this.state = {
      // 📸 Paramètres de rendu
      exposure: 1.7,
      toneMapping: THREE.AgXToneMapping,
      
      // 🌟 Paramètres bloom globaux
      bloom: {
        enabled: true,
        threshold: 0.15,
        strength: 0.40,
        radius: 0.40
      },
      
      // 💡 Paramètres d'éclairage
      lighting: {
        ambient: {
          color: 0x404040,
          intensity: 3.5
        },
        directional: {
          color: 0xffffff,
          intensity: 5.0,
          position: { x: 1, y: 2, z: 3 }
        }
      },
      
      // 🎨 Paramètres des matériaux par groupe
      materials: {
        global: {
          metalness: 0.3,
          roughness: 1.0
        },
        groups: {
          iris: {
            emissive: 0x00ff88,
            emissiveIntensity: 0.3,
            metalness: 0.3,
            roughness: 1.0
          },
          eyeRings: {
            emissive: 0x4488ff,
            emissiveIntensity: 0.4,
            metalness: 0.3,
            roughness: 1.0
          },
          revealRings: {
            emissive: 0xffaa00,
            emissiveIntensity: 0.5,
            metalness: 0.3,
            roughness: 1.0
          },
          arms: {
            emissive: 0x6666ff,
            emissiveIntensity: 0.1,
            metalness: 0.3,
            roughness: 1.0
          }
        }
      },
      
      // 🎭 Paramètres spécifiques par groupe bloom
      bloomGroups: {
        iris: {
          threshold: 0.3,
          strength: 0.8,
          radius: 0.4
        },
        eyeRings: {
          threshold: 0.4,
          strength: 0.6,
          radius: 0.3
        },
        revealRings: {
          threshold: 0.43,
          strength: 0.40,
          radius: 0.36
        }
      },
      
      // 🎨 Paramètres PBR
      pbr: {
        currentPreset: 'studioProPlus',
        ambientMultiplier: 1.0,
        directionalMultiplier: 1.0,
        customExposure: 1.0,
        materialSettings: {
          metalness: 0.3,
          roughness: 1.0,
          targetMaterials: ['all']
        },
        hdrBoost: {
          enabled: false,
          multiplier: 2.0
        }
      },
      
      // 🌈 Paramètres Background
      background: {
        type: 'color',
        color: '#1a1a1a'
      },
      
      // 🎯 Paramètres MSAA
      msaa: {
        enabled: false,
        samples: 1,
        fxaaEnabled: false
      },
      
      // 🎮 Preset actuel
      currentPreset: 'studioProPlus',
      
      // 🔥 HDR Boost
      hdrBoost: {
        enabled: false,
        multiplier: 2.5
      },
      
      // 🌈 Advanced lighting features
      advancedLighting: {
        enabled: true,
        areaLights: true,
        lightProbes: false
      },
      
      // 🔒 Security mode
      securityMode: 'NORMAL'
    };
    
    // 📡 Système d'événements pour notifier les changements
    this.listeners = new Map();
    
    // 🔗 Références aux systèmes à synchroniser
    this.systems = {
      renderer: null,
      scene: null, // 🔧 AJOUTÉ: Support pour scene THREE.Scene
      pbrController: null,
      pbrLightingController: null, // 🔧 AJOUTÉ: Support pour PBRLightingController
      bloomController: null,
      simpleBloom: null,
      debugPanel: null,
      particleSystem: null
    };
    
    // 📊 Historique des changements pour debug
    this.changeHistory = [];
    this.maxHistorySize = 50;
  }
  
  // 🔗 CONNEXION DES SYSTÈMES
  connectSystem(systemName, systemInstance) {
    if (this.systems[systemName] !== undefined) {
      this.systems[systemName] = systemInstance;
      console.log(`✅ CCS: ${systemName} connecté`);
      
      // Synchroniser l'état initial
      this.syncSystemWithState(systemName);
      
      // ✅ CCS: Synchronisation spéciale pour BloomControlCenter
      if (systemName === 'bloomController' && systemInstance.syncFromStateController) {
        systemInstance.syncFromStateController(this);
      }
      
      return true;
    }
    console.warn(`❌ CCS: Système inconnu: ${systemName}`);
    return false;
  }
  
  // 📡 GESTION DES ÉVÉNEMENTS
  addEventListener(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);
  }
  
  removeEventListener(event, callback) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).delete(callback);
    }
  }
  
  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`❌ CCS: Erreur émission événement ${event}:`, error);
        }
      });
    }
  }
  
  // 🔧 MÉTHODES DE MODIFICATION D'ÉTAT
  
  // Exposure
  setExposure(value) {
    const oldValue = this.state.exposure;
    this.state.exposure = Math.max(0.1, Math.min(3.0, value));
    
    if (oldValue !== this.state.exposure) {
      this.logChange('exposure', oldValue, this.state.exposure);
      this.syncExposure();
      this.emit('exposureChanged', this.state.exposure);
    }
  }
  
  // Tone Mapping
  setToneMapping(toneMapping) {
    const oldValue = this.state.toneMapping;
    this.state.toneMapping = toneMapping;
    
    if (oldValue !== toneMapping) {
      this.logChange('toneMapping', oldValue, toneMapping);
      this.syncToneMapping();
      this.emit('toneMappingChanged', toneMapping);
    }
  }
  
  // 🌈 Background
  setBackground(type, color = null) {
    const oldBackground = { ...this.state.background };
    this.state.background.type = type;
    if (color !== null) {
      this.state.background.color = color;
    }
    
    this.logChange('background', oldBackground, this.state.background);
    this.syncBackground();
    this.emit('backgroundChanged', this.state.background);
  }
  
  // Bloom Global
  setBloomParameter(param, value) {
    if (this.state.bloom[param] !== undefined) {
      const oldValue = this.state.bloom[param];
      this.state.bloom[param] = value;
      
      this.logChange(`bloom.${param}`, oldValue, value);
      this.syncBloomParameter(param, value);
      this.emit('bloomChanged', { param, value });
    }
  }
  
  // Bloom Enabled/Disabled - CRITICAL FOR ZUSTAND CHECKBOX
  setBloomEnabled(enabled) {
    const oldValue = this.state.bloom.enabled;
    this.state.bloom.enabled = enabled;
    
    this.logChange('bloom.enabled', oldValue, enabled);
    
    // Synchroniser avec tous les systèmes bloom
    if (this.systems.simpleBloom) {
      if (this.systems.simpleBloom.setBloomEnabled) {
        this.systems.simpleBloom.setBloomEnabled(enabled);
        console.log(`✅ CCS: SimpleBloom.setBloomEnabled(${enabled}) called`);
      } else if (this.systems.simpleBloom.isEnabled !== undefined) {
        this.systems.simpleBloom.isEnabled = enabled;
        console.log(`✅ CCS: SimpleBloom.isEnabled property set to ${enabled}`);
      } else {
        console.warn(`❌ CCS: SimpleBloom has no setBloomEnabled method or isEnabled property`);
      }
    }
    
    if (this.systems.bloomController) {
      if (this.systems.bloomController.setEnabled) {
        this.systems.bloomController.setEnabled(enabled);
        console.log(`✅ CCS: BloomController enabled set to ${enabled}`);
      } else if (this.systems.bloomController.enabled !== undefined) {
        this.systems.bloomController.enabled = enabled;
        console.log(`✅ CCS: BloomController enabled property set to ${enabled}`);
      }
    }
    
    this.emit('bloomEnabledChanged', { enabled });
    console.log(`🎯 CCS: Bloom globally ${enabled ? 'ENABLED' : 'DISABLED'}`);
  }
  
  // Bloom par groupe
  setGroupBloomParameter(group, param, value) {
    if (this.state.bloomGroups[group] && this.state.bloomGroups[group][param] !== undefined) {
      const oldValue = this.state.bloomGroups[group][param];
      this.state.bloomGroups[group][param] = value;
      
      this.logChange(`bloomGroups.${group}.${param}`, oldValue, value);
      this.syncGroupBloom(group);
      this.emit('groupBloomChanged', { group, param, value });
    }
  }
  
  // Matériaux
  setMaterialParameter(group, param, value) {
    if (group === 'global') {
      const oldValue = this.state.materials.global[param];
      this.state.materials.global[param] = value;
      
      this.logChange(`materials.global.${param}`, oldValue, value);
      this.syncGlobalMaterials();
      this.emit('globalMaterialChanged', { param, value });
    } else if (this.state.materials.groups[group]) {
      const oldValue = this.state.materials.groups[group][param];
      this.state.materials.groups[group][param] = value;
      
      this.logChange(`materials.${group}.${param}`, oldValue, value);
      this.syncGroupMaterial(group);
      this.emit('groupMaterialChanged', { group, param, value });
    }
  }
  
  // Éclairage
  setLightingParameter(lightType, param, value) {
    if (this.state.lighting[lightType] && this.state.lighting[lightType][param] !== undefined) {
      const oldValue = this.state.lighting[lightType][param];
      this.state.lighting[lightType][param] = value;
      
      this.logChange(`lighting.${lightType}.${param}`, oldValue, value);
      this.syncLighting();
      this.emit('lightingChanged', { lightType, param, value });
    }
  }
  
  // HDR Boost
  setHDRBoost(enabled, multiplier = null) {
    const oldState = { ...this.state.hdrBoost };
    this.state.hdrBoost.enabled = enabled;
    if (multiplier !== null) {
      this.state.hdrBoost.multiplier = multiplier;
    }
    
    this.logChange('hdrBoost', oldState, this.state.hdrBoost);
    this.syncHDRBoost();
    this.emit('hdrBoostChanged', this.state.hdrBoost);
  }
  
  // 🎨 PBR Parameters
  setPBRParameter(param, value) {
    if (this.state.pbr[param] !== undefined) {
      const oldValue = this.state.pbr[param];
      this.state.pbr[param] = value;
      
      this.logChange(`pbr.${param}`, oldValue, value);
      this.syncPBR();
      this.emit('pbrChanged', { param, value });
    }
  }
  
  setPBRMaterialSetting(param, value) {
    if (this.state.pbr.materialSettings[param] !== undefined) {
      const oldValue = this.state.pbr.materialSettings[param];
      this.state.pbr.materialSettings[param] = value;
      
      this.logChange(`pbr.materialSettings.${param}`, oldValue, value);
      this.syncPBR();
      this.emit('pbrMaterialChanged', { param, value });
    }
  }
  
  setPBRHDRBoost(enabled, multiplier = null) {
    const oldState = { ...this.state.pbr.hdrBoost };
    this.state.pbr.hdrBoost.enabled = enabled;
    if (multiplier !== null) {
      this.state.pbr.hdrBoost.multiplier = multiplier;
    }
    
    this.logChange('pbr.hdrBoost', oldState, this.state.pbr.hdrBoost);
    this.syncPBR();
    this.emit('pbrHdrBoostChanged', this.state.pbr.hdrBoost);
  }
  
  // 🎯 MSAA Parameters
  setMSAA(enabled, samples = null, fxaaEnabled = null) {
    const oldState = { ...this.state.msaa };
    this.state.msaa.enabled = enabled;
    if (samples !== null) {
      this.state.msaa.samples = samples;
    }
    if (fxaaEnabled !== null) {
      this.state.msaa.fxaaEnabled = fxaaEnabled;
    }
    
    this.logChange('msaa', oldState, this.state.msaa);
    this.syncMSAA();
    this.emit('msaaChanged', this.state.msaa);
  }
  
  // Security Mode
  setSecurityMode(mode) {
    // ✅ SUPPRIMÉ : Log pour réduire spam console
    
    const oldMode = this.state.securityMode;
    this.state.securityMode = mode;
    
    if (oldMode !== mode) {
      this.logChange('securityMode', oldMode, mode);
      // ✅ SUPPRIMÉ : Log pour réduire spam console
      this.syncSecurityMode();
      this.emit('securityModeChanged', mode);
    } else {
      console.log(`ℹ️  CCS: Mode identique ${mode}, pas de sync nécessaire`);
    }
  }
  
  // Preset
  applyPreset(presetName, presetData) {
    const oldPreset = this.state.currentPreset;
    this.state.currentPreset = presetName;
    
    // Appliquer toutes les valeurs du preset
    if (presetData.exposure !== undefined) {
      this.setExposure(presetData.exposure);
    }
    if (presetData.toneMapping !== undefined) {
      this.setToneMapping(presetData.toneMapping);
    }
    if (presetData.ambient) {
      this.setLightingParameter('ambient', 'intensity', presetData.ambient.intensity);
      this.setLightingParameter('ambient', 'color', presetData.ambient.color);
    }
    if (presetData.directional) {
      this.setLightingParameter('directional', 'intensity', presetData.directional.intensity);
      this.setLightingParameter('directional', 'color', presetData.directional.color);
    }
    if (presetData.defaultMaterialSettings) {
      this.setMaterialParameter('global', 'metalness', presetData.defaultMaterialSettings.metalness);
      this.setMaterialParameter('global', 'roughness', presetData.defaultMaterialSettings.roughness);
    }
    if (presetData.enableAdvancedLighting !== undefined) {
      this.state.advancedLighting.enabled = presetData.enableAdvancedLighting;
    }
    if (presetData.enableAreaLights !== undefined) {
      this.state.advancedLighting.areaLights = presetData.enableAreaLights;
    }
    
    this.logChange('preset', oldPreset, presetName);
    this.emit('presetChanged', { name: presetName, data: presetData });
  }
  
  // 🔄 MÉTHODES DE SYNCHRONISATION
  
  syncExposure() {
    if (this.systems.renderer) {
      this.systems.renderer.toneMappingExposure = this.state.exposure;
    }
  }
  
  syncToneMapping() {
    if (this.systems.renderer) {
      this.systems.renderer.toneMapping = this.state.toneMapping;
      // Forcer la recompilation des matériaux
      if (this.systems.renderer.scene) {
        this.systems.renderer.scene.traverse((child) => {
          if (child.material) {
            child.material.needsUpdate = true;
          }
        });
      }
    }
  }
  
  // 💡 NOUVELLE: Synchronisation Lighting
  syncLighting() {
    console.log('💡 CCS: Syncing Lighting...', {
      ambient: this.state.lighting?.ambient,
      directional: this.state.lighting?.directional,
      hasRenderer: !!this.systems.renderer,
      hasScene: !!(this.systems.scene || (this.systems.renderer && this.systems.renderer.scene))
    });
    
    if (this.systems.renderer && (this.systems.scene || this.systems.renderer.scene)) {
      const scene = this.systems.scene || this.systems.renderer.scene;
      
      // Chercher les lumières existantes dans la scène
      let ambientLight = null;
      let directionalLight = null;
      
      scene.traverse((child) => {
        if (child.isAmbientLight) {
          ambientLight = child;
        } else if (child.isDirectionalLight) {
          directionalLight = child;
        }
      });
      
      // Synchroniser Ambient Light
      if (this.state.lighting?.ambient && ambientLight) {
        console.log(`🎯 CCS: Setting ambient light:`, this.state.lighting.ambient);
        ambientLight.intensity = this.state.lighting.ambient.intensity;
        ambientLight.color.setHex(this.state.lighting.ambient.color);
      }
      
      // Synchroniser Directional Light
      if (this.state.lighting?.directional && directionalLight) {
        console.log(`🎯 CCS: Setting directional light:`, this.state.lighting.directional);
        directionalLight.intensity = this.state.lighting.directional.intensity;
        directionalLight.color.setHex(this.state.lighting.directional.color);
      }
      
    } else {
      console.warn('❌ CCS: No renderer or scene available for lighting sync');
    }
  }
  
  syncBackground() {
    // 🔧 CORRECTION: Utiliser { type, color } au lieu de { type, value }
    const { type, color } = this.state.background;
    
    console.log('🌈 CCS: Syncing Background...', {
      type,
      color,
      hasRenderer: !!this.systems.renderer,
      hasScene: !!(this.systems.scene || (this.systems.renderer && this.systems.renderer.scene))
    });
    
    if (this.systems.renderer && (this.systems.scene || this.systems.renderer.scene)) {
      const scene = this.systems.scene || this.systems.renderer.scene;
      switch (type) {
        case 'color':
          console.log(`🎯 CCS: Setting scene background color: ${color}`);
          scene.background = new THREE.Color(color);
          break;
        case 'transparent':
          console.log(`🎯 CCS: Setting scene background to transparent`);
          scene.background = null;
          break;
        case 'gradient':
          console.log(`🎯 CCS: Gradient background not yet implemented, using color: ${color}`);
          scene.background = new THREE.Color(color);
          break;
        case 'environment':
          console.log(`🎯 CCS: Environment background not yet implemented, using color: ${color}`);
          scene.background = new THREE.Color(color);
          break;
        default:
          console.warn(`❌ CCS: Type de background inconnu: ${type}`);
      }
    } else {
      console.warn('❌ CCS: No renderer or scene available for background sync', {
        renderer: this.systems.renderer,
        scene: this.systems.scene || this.systems.renderer?.scene
      });
    }
  }
  
  syncBloomParameter(param, value) {
    // ✅ CCS: Synchroniser vers SimpleBloomSystem
    if (this.systems.simpleBloom) {
      this.systems.simpleBloom.updateBloom(param, value);
    }
    
    // ✅ CCS: Synchroniser vers BloomControlCenter 
    if (this.systems.bloomController) {
      if (param === 'threshold' || param === 'strength' || param === 'radius') {
        this.systems.bloomController.postProcessConfig[param] = value;
        // ✅ SUPPRIMÉ : Log de sync bloom pour réduire spam console
        
        // Propager vers le moteur de rendu
        if (this.systems.bloomController.renderingEngine && this.systems.bloomController.renderingEngine.updateBloom) {
          this.systems.bloomController.renderingEngine.updateBloom(param, value);
        }
      }
    }
  }
  
  syncGroupBloom(group) {
    // ✅ ARCHITECTURE SIMPLIFIÉE : Ne plus envoyer threshold/strength/radius par groupe
    // UnrealBloomPass supporte seulement des paramètres globaux
    console.log(`🔧 Group bloom sync for ${group} - SKIPPED (global bloom only)`);
  }
  
  syncGroupMaterial(group) {
    if (this.systems.bloomController) {
      const settings = this.state.materials.groups[group];
      
      // ✅ RÉDUCTION LOGS : Diagnostic seulement si nécessaire
      const objectCount = this.systems.bloomController.objectsByType?.[group]?.size || 0;
      if (objectCount > 0) {
        console.log(`🔧 Syncing ${group}: ${objectCount} objects`);
      }
      
      Object.entries(settings).forEach(([param, value]) => {
        this.systems.bloomController.setObjectTypeProperty(group, param, value);
      });
      
      // 🚨 DIAGNOSTIC CRITIQUE: Vérifier les VRAIES valeurs Three.js matériaux
      if (objectCount > 0) {
        setTimeout(() => {
          let realValues = [];
          if (this.systems.bloomController.objectsByType?.[group]) {
            this.systems.bloomController.objectsByType[group].forEach((meshObject, name) => {
              if (meshObject.material) {
                const intensity = meshObject.material.emissiveIntensity || 0;
                const emissiveHex = meshObject.material.emissive?.getHex() || 0;
                const visible = meshObject.visible;
                realValues.push(`${name}: intensity=${intensity}, color=${emissiveHex.toString(16)}, visible=${visible}`);
              }
            });
          }
          if (realValues.length > 0) {
            console.log(`🚨 REAL THREE.JS VALUES ${group}:`, realValues);
          }
        }, 50);
      }
      
      // 🔧 CORRECTION CRITIQUE: Forcer la recompilation des shaders bloom après changement emissive
      if (this.systems.bloomController.renderingEngine && this.systems.bloomController.renderingEngine.forceBloomRecompilation) {
        console.log('🔧 Forcing bloom luminance pass recompilation after emissive materials update');
        this.systems.bloomController.renderingEngine.forceBloomRecompilation();
      } else {
        console.log('🔧 Fallback: Using threshold update to force bloom recompilation');
        if (this.systems.bloomController.renderingEngine && this.systems.bloomController.renderingEngine.updateBloom) {
          const currentThreshold = this.state.bloom.threshold;
          this.systems.bloomController.renderingEngine.updateBloom('threshold', currentThreshold);
        }
      }
      
      // 🔍 DIAGNOSTIC RENDU: Forcer plusieurs rendus pour s'assurer
      if (this.systems.renderer && this.systems.scene && this.systems.camera) {
        console.log(`🔍 DIAGNOSTIC: Forçant 3 rendus consécutifs pour ${group}`);
        for (let i = 0; i < 3; i++) {
          setTimeout(() => {
            if (this.systems.renderer && this.systems.scene && this.systems.camera) {
              this.systems.renderer.render(this.systems.scene, this.systems.camera);
              console.log(`🔍 Rendu forcé ${i+1}/3 pour ${group} effectué`);
            }
          }, i * 50);
        }
      }
    }
  }
  
  syncGlobalMaterials() {
    // Appliquer à tous les groupes
    Object.keys(this.state.materials.groups).forEach(group => {
      this.syncGroupMaterial(group);
    });
  }
  
  syncLighting() {
    if (this.systems.pbrController) {
      const { ambient, directional } = this.state.lighting;
      
      // Synchroniser avec PBRLightingController
      if (this.systems.pbrController.updateLighting) {
        this.systems.pbrController.updateLighting({
          ambient: { intensity: ambient.intensity, color: ambient.color },
          directional: { intensity: directional.intensity, color: directional.color }
        });
      }
    }
  }
  
  syncHDRBoost() {
    if (this.systems.bloomController && this.state.hdrBoost.enabled) {
      // Appliquer le multiplier HDR aux intensités émissives
      Object.entries(this.state.materials.groups).forEach(([group, settings]) => {
        const boostedIntensity = settings.emissiveIntensity * this.state.hdrBoost.multiplier;
        this.systems.bloomController.setObjectTypeProperty(group, 'emissiveIntensity', boostedIntensity);
      });
    } else if (this.systems.bloomController) {
      // Restaurer les intensités normales
      Object.entries(this.state.materials.groups).forEach(([group, settings]) => {
        this.systems.bloomController.setObjectTypeProperty(group, 'emissiveIntensity', settings.emissiveIntensity);
      });
    }
  }
  
  syncSecurityMode() {
    // ✅ SUPPRIMÉ : Log pour réduire spam console
    
    // Propager le mode sécurité à tous les systèmes concernés
    if (this.systems.bloomController) {
      // ✅ SUPPRIMÉ : Log pour réduire spam console
      this.systems.bloomController.setSecurityState(this.state.securityMode);
    } else {
      console.warn(`❌ CCS: bloomController non connecté`);
    }
    
    if (this.systems.simpleBloom) {
      // ✅ SUPPRIMÉ : Log pour réduire spam console
      this.systems.simpleBloom.setSecurityMode(this.state.securityMode);
    }
    // ✅ SUPPRIMÉ : Warning inutile pendant l'initialisation
    
    if (this.systems.particleSystem) {
      // ✅ SUPPRIMÉ : Log pour réduire spam console
      this.systems.particleSystem.setSecurityMode(this.state.securityMode);
    }
    // ✅ SUPPRIMÉ : Warning inutile pendant l'initialisation
  }
  
  // 🎨 Synchronisation PBR
  syncPBR() {
    // 🔧 CORRECTION: Utiliser pbrLightingController au lieu de pbrController
    const pbrController = this.systems.pbrLightingController || this.systems.pbrController;
    
    if (pbrController) {
      console.log('🎨 CCS: Syncing PBR to PBRLightingController...', {
        currentPreset: this.state.pbr.currentPreset,
        ambientMultiplier: this.state.pbr.ambientMultiplier,
        directionalMultiplier: this.state.pbr.directionalMultiplier,
        hdrBoost: this.state.pbr.hdrBoost
      });
      
      // Synchroniser preset PBR
      if (this.state.pbr.currentPreset && pbrController.applyPreset) {
        console.log(`🎯 CCS: Applying PBR preset: ${this.state.pbr.currentPreset}`);
        pbrController.applyPreset(this.state.pbr.currentPreset);
      }
      
      // Synchroniser multipliers
      if (pbrController.setGlobalMultipliers) {
        console.log(`🎯 CCS: Setting multipliers: ambient=${this.state.pbr.ambientMultiplier}, directional=${this.state.pbr.directionalMultiplier}`);
        pbrController.setGlobalMultipliers(
          this.state.pbr.ambientMultiplier,
          this.state.pbr.directionalMultiplier
        );
      }
      
      // Synchroniser HDR Boost - 🔧 CORRECTION: applyHDRBoost() retourne toujours false
      if (this.state.pbr.hdrBoost && pbrController.setHDRBoostMultiplier) {
        console.log(`🎯 CCS: Setting HDR boost: enabled=${this.state.pbr.hdrBoost.enabled}, multiplier=${this.state.pbr.hdrBoost.multiplier}`);
        if (this.state.pbr.hdrBoost.enabled) {
          pbrController.setHDRBoostMultiplier(this.state.pbr.hdrBoost.multiplier);
        } else {
          pbrController.setHDRBoostMultiplier(1.0); // Reset to baseline when disabled
        }
      }
      
      // Synchroniser custom exposure
      if (this.state.pbr.customExposure && pbrController.setCustomExposure) {
        console.log(`🎯 CCS: Setting custom exposure: ${this.state.pbr.customExposure}`);
        pbrController.setCustomExposure(this.state.pbr.customExposure);
      }
    } else {
      console.warn('❌ CCS: No PBR controller available for sync', {
        pbrController: this.systems.pbrController,
        pbrLightingController: this.systems.pbrLightingController
      });
    }
  }
  
  // 🎯 Synchronisation MSAA  
  syncMSAA() {
    if (this.systems.simpleBloom) {
      this.systems.simpleBloom.setMSAAEnabled?.(this.state.msaa.enabled);
      this.systems.simpleBloom.updateMSAASamples?.(this.state.msaa.samples);
      this.systems.simpleBloom.setFXAAEnabled?.(this.state.msaa.fxaaEnabled);
    }
  }
  
  syncSystemWithState(systemName) {
    // Synchroniser un système spécifique avec l'état actuel
    switch (systemName) {
      case 'renderer':
        this.syncExposure();
        this.syncToneMapping();
        // ✅ CORRECTION : Ne sync background que si scene disponible
        if (this.systems.scene) {
          this.syncBackground();
        }
        break;
      case 'simpleBloom':
        Object.entries(this.state.bloom).forEach(([param, value]) => {
          if (param !== 'enabled') {
            this.syncBloomParameter(param, value);
          }
        });
        this.syncSecurityMode();
        break;
      case 'bloomController':
        Object.keys(this.state.bloomGroups).forEach(group => {
          this.syncGroupBloom(group);
          this.syncGroupMaterial(group);
        });
        this.syncSecurityMode();
        break;
      case 'pbrController':
      case 'pbrLightingController':
        this.syncPBR();
        this.syncLighting();
        break;
      case 'particleSystem':
        this.syncSecurityMode();
        break;
    }
  }
  
  // 📊 UTILITAIRES
  
  logChange(property, oldValue, newValue) {
    const change = {
      timestamp: Date.now(),
      property,
      oldValue,
      newValue
    };
    
    this.changeHistory.unshift(change);
    if (this.changeHistory.length > this.maxHistorySize) {
      this.changeHistory.pop();
    }
  }
  
  getState() {
    return JSON.parse(JSON.stringify(this.state));
  }
  
  getChangeHistory() {
    return [...this.changeHistory];
  }
  
  // 🔄 Reset complet ou partiel
  reset(partial = null) {
    if (!partial) {
      // Reset complet aux valeurs par défaut
      this.state = this.constructor.prototype.constructor().state;
      this.syncAllSystems();
      this.emit('reset', { type: 'full' });
    } else {
      // Reset partiel
      switch (partial) {
        case 'bloom':
          this.state.bloom = {
            enabled: true,
            threshold: 0.15,
            strength: 0.40,
            radius: 0.40
          };
          this.syncAllBloom();
          break;
        case 'materials':
          // Restaurer matériaux par défaut
          break;
      }
      this.emit('reset', { type: partial });
    }
  }
  
  syncAllSystems() {
    Object.keys(this.systems).forEach(systemName => {
      if (this.systems[systemName]) {
        this.syncSystemWithState(systemName);
      }
    });
  }
  
  syncAllBloom() {
    Object.entries(this.state.bloom).forEach(([param, value]) => {
      if (param !== 'enabled') {
        this.syncBloomParameter(param, value);
      }
    });
    Object.keys(this.state.bloomGroups).forEach(group => {
      this.syncGroupBloom(group);
    });
  }
  
  // 📊 Status pour debug
  getStatus() {
    return {
      state: this.getState(),
      connectedSystems: Object.entries(this.systems)
        .filter(([, system]) => system !== null)
        .map(([name]) => name),
      listeners: Array.from(this.listeners.keys()),
      historySize: this.changeHistory.length,
      lastChange: this.changeHistory[0] || null
    };
  }
}