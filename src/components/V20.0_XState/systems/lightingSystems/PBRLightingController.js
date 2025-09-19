import * as THREE from 'three';

/**
 * PBRLightingController - Solution Hybride Option 3
 * Système de presets d'éclairage avec contrôles temps réel
 * Optimisé pour matériaux PBR importés de Blender
 */
export class PBRLightingController {
  constructor(scene, renderer, camera = null, existingLights = null) {
    this.scene = scene;
    this.renderer = renderer;
    this.camera = camera;
    this.isInitialized = false;
    
    // ✅ SAUVEGARDE ÉTAT ORIGINAL pour restauration propre
    this.originalState = {
      renderer: {
        toneMapping: renderer?.toneMapping || THREE.LinearToneMapping,
        toneMappingExposure: renderer?.toneMappingExposure || 1.0,
        shadowMapEnabled: renderer?.shadowMap?.enabled || false
      },
      lightIntensities: {} // Sera rempli lors de l'init
    };
    
    // ✅ PMREM PHASE 1C: Référence coordination environnement HDR
    this.worldEnvironmentController = null;
    this.currentEnvironmentTexture = null;
    
    // ✅ COORDINATION : Utiliser lumières existantes de useThreeScene + Three-Point Lighting
    this.lights = existingLights || {
      ambient: null,
      directional: null
    };
    
    // ✅ NOUVEAU : Three-Point Lighting System
    this.advancedLights = {
      keyLight: null,      // Lumière principale (45° angle)
      fillLight: null,     // Remplissage (côté opposé, douce)  
      rimLight: null,      // Contour (derrière, fait ressortir bords)
      enabled: false       // Toggle ON/OFF global
    };
    
    // ✅ PHASE 4A : Area Lights System (éclairage surfacique doux)
    this.areaLights = {
      mainArea: null,      // Area Light principale (fenêtre/panneau)
      fillArea: null,      // Area Light de remplissage
      enabled: false,      // Toggle ON/OFF
      intensities: {       // Contrôles individuels
        main: 2.0,
        fill: 1.0
      }
    };
    
    // ✅ PHASE 5A : Light Probes System (éclairage indirect environnemental)
    this.lightProbes = {
      probe: null,           // Light Probe principale
      cubeCamera: null,      // Caméra pour capture environnement
      cubeRenderTarget: null, // Texture cube environnement
      enabled: false,        // Toggle ON/OFF
      intensity: 1.0,        // Intensité éclairage indirect
      updateFrequency: 0     // Auto-update (0=manuel, >0=fréquence)
    };
    
    // ✅ PRESETS D'ÉCLAIRAGE - Option 3
    this.presets = {
      // ✅ COMMENTED: Autres presets gardés pour référence future
      /*
      sombre: {
        name: 'Sombre (V6 Actuel)',
        ambient: { intensity: 0.8, color: 0x404040 },
        directional: { intensity: 0.8, color: 0xffffff },
        exposure: 1.0,
        toneMapping: THREE.LinearToneMapping,
        description: 'Éclairage faible actuel V6'
      },
      normal: {
        name: 'Normal (Équilibré)',
        ambient: { intensity: 1.5, color: 0x404040 },
        directional: { intensity: 2.0, color: 0xffffff },
        exposure: 1.0,
        toneMapping: THREE.LinearToneMapping,
        description: 'Éclairage équilibré (+87%)'
      },
      lumineux: {
        name: 'Lumineux (Élevé)',
        ambient: { intensity: 2.5, color: 0x404040 },
        directional: { intensity: 3.5, color: 0xffffff },
        exposure: 1.1,
        toneMapping: THREE.ACESFilmicToneMapping,
        description: 'Éclairage lumineux (+337%)'
      },
      pbr: {
        name: 'PBR Optimisé (Blender-like)',
        ambient: { intensity: 3.0, color: 0x404040 },
        directional: { intensity: 4.5, color: 0xffffff },
        exposure: 1.2,
        toneMapping: THREE.AgXToneMapping, // ✅ PMREM: AgX moderne vs ACES
        description: 'Éclairage PBR optimisé (+462%) avec AgX HDR',
        // ✅ PMREM PHASE 1C: Support environnement HDR pour matériaux PBR
        requiresHDREnvironment: true,
        environmentIntensity: 1.0
      },
      pbrMetallic: {
        name: 'PBR+Métallique (Auto)',
        ambient: { intensity: 3.0, color: 0x404040 },
        directional: { intensity: 4.5, color: 0xffffff },
        exposure: 1.2,
        toneMapping: THREE.AgXToneMapping,
        description: 'PBR Optimisé + matériaux métalliques automatiques',
        requiresHDREnvironment: true,
        environmentIntensity: 1.0,
        // ✅ NOUVEAU: Matériaux métalliques par défaut
        defaultMaterialSettings: {
          metalness: 0.2,
          roughness: 0.8
        }
      },
      textureDetail: {
        name: 'Texture Detail (Complet)',
        ambient: { intensity: 3.0, color: 0x404040 },
        directional: { intensity: 4.5, color: 0xffffff },
        exposure: 1.2,
        toneMapping: THREE.AgXToneMapping,
        description: 'PBR + Métallique + Three-Point Lighting pour visibilité maximale',
        requiresHDREnvironment: true,
        environmentIntensity: 1.0,
        // ✅ NOUVEAU: Active automatiquement Three-Point Lighting
        enableAdvancedLighting: true,
        defaultMaterialSettings: {
          metalness: 0.2,
          roughness: 0.8
        }
      },
      // ✅ PHASE 4C : Presets spécialisés
      chromeShowcase: {
        name: 'Chrome Showcase',
        ambient: { intensity: 2.5, color: 0x404040 },
        directional: { intensity: 3.5, color: 0xffffff },
        exposure: 1.3,
        toneMapping: THREE.AgXToneMapping,
        description: 'Optimisé pour surfaces chrome ultra-réfléchissantes',
        requiresHDREnvironment: true,
        environmentIntensity: 1.2,
        enableAdvancedLighting: true,
        enableAreaLights: true, // ✅ NOUVEAU: Active Area Lights
        defaultMaterialSettings: {
          metalness: 0.9,  // Chrome quasi parfait
          roughness: 0.1   // Très lisse
        }
      },
      */
      
      // ✅ PHASE 3: Presets avancés réactivés et nouveaux
      chromeShowcase: {
        name: 'Chrome Showcase',
        ambient: { intensity: 2.5, color: 0x404040 },
        directional: { intensity: 3.5, color: 0xffffff },
        exposure: 1.3,
        toneMapping: THREE.AgXToneMapping,
        description: 'Optimisé pour surfaces chrome ultra-réfléchissantes',
        requiresHDREnvironment: true,
        environmentIntensity: 1.2,
        enableAdvancedLighting: true,
        enableAreaLights: true,
        defaultMaterialSettings: {
          metalness: 0.9,  // Chrome quasi parfait
          roughness: 0.1   // Très lisse
        }
      },
      softStudio: {
        name: 'Soft Studio',
        ambient: { intensity: 4.0, color: 0x505050 },
        directional: { intensity: 3.0, color: 0xfff8e1 }, // Lumière chaude
        exposure: 1.4,
        toneMapping: THREE.AgXToneMapping,
        description: 'Éclairage studio doux avec lumière chaude diffusée',
        requiresHDREnvironment: true,
        environmentIntensity: 0.8, // Plus subtil
        enableAdvancedLighting: true,
        enableAreaLights: true,
        defaultMaterialSettings: {
          metalness: 0.1,  // Matériaux plutôt mats
          roughness: 0.7   // Surface douce
        }
      },
      dramaticMood: {
        name: 'Dramatic Mood',
        ambient: { intensity: 1.5, color: 0x2a2a40 }, // Ambiance sombre bleutée
        directional: { intensity: 7.0, color: 0xffa500 }, // Lumière directionnelle chaude intense
        exposure: 1.8,
        toneMapping: THREE.AgXToneMapping,
        description: 'Éclairage dramatique avec contrastes forts et ambiance cinématique',
        requiresHDREnvironment: true,
        environmentIntensity: 0.5, // Très subtil pour garder le drama
        enableAdvancedLighting: true,
        enableAreaLights: false, // Pas d'area lights pour garder les ombres marquées
        defaultMaterialSettings: {
          metalness: 0.6,  // Matériaux semi-métalliques 
          roughness: 0.4   // Réflectivité marquée
        }
      },
      
      // ✅ NOUVEAU: Studio Pro + (Valeurs optimisées par défaut)
      studioProPlus: {
        name: 'Studio Pro +',
        ambient: { intensity: 3.5, color: 0x404040 },
        directional: { intensity: 5.0, color: 0xffffff },
        exposure: 1.7,
        toneMapping: THREE.AgXToneMapping,
        description: 'Studio Pro optimisé - Configuration par défaut',
        requiresHDREnvironment: true,
        environmentIntensity: 1.1,
        enableAdvancedLighting: true,
        enableAreaLights: true,
        defaultMaterialSettings: {
          metalness: 0.3,
          roughness: 1.0
        }
      },
      studioLight: {
        name: 'Studio Pro',
        ambient: { intensity: 3.5, color: 0x404040 },
        directional: { intensity: 5.0, color: 0xffffff },
        exposure: 1.7,
        toneMapping: THREE.AgXToneMapping,
        description: 'Éclairage studio professionnel - Area + Three-Point',
        requiresHDREnvironment: true,
        environmentIntensity: 1.1,
        enableAdvancedLighting: true,
        enableAreaLights: true,
        defaultMaterialSettings: {
          metalness: 0.3,
          roughness: 0.6
        }
      },
      /*
      metallicDetail: {
        name: 'Métallique Ultra',
        ambient: { intensity: 4.0, color: 0x404040 },
        directional: { intensity: 6.0, color: 0xffffff },
        exposure: 1.5,
        toneMapping: THREE.AgXToneMapping,
        description: 'Maximum visibilité pour détails métalliques complexes',
        requiresHDREnvironment: true,
        environmentIntensity: 1.3,
        enableAdvancedLighting: true,
        enableAreaLights: true,
        // ✅ PHASE 5B: HDR intensities boost
        useHDRBoost: true,
        defaultMaterialSettings: {
          metalness: 0.4,
          roughness: 0.4
        }
      }
      */
    };
    
    // ✅ ÉTAT ACTUEL - Défaut Studio Pro + pour meilleur rendu professionnel
    this.currentPreset = 'studioProPlus';
    this.customMultipliers = {
      ambient: 1.0,
      directional: 1.0
    };
    
    // ✅ POSITIONS LUMIÈRES OPTIMALES
    this.lightPositions = {
      directional: new THREE.Vector3(2, 4, 5)
    };
  }
  
  /**
   * ✅ PMREM PHASE 1C: Initialisation coordination avec WorldEnvironmentController
   */
  initializeEnvironmentCoordination(worldEnvironmentController) {
    this.worldEnvironmentController = worldEnvironmentController;
    
    // Synchroniser environnement actuel si disponible
    if (this.worldEnvironmentController) {
      const currentTheme = this.worldEnvironmentController.getCurrentTheme();
      this.currentEnvironmentTexture = currentTheme.environmentTexture;
    }
    
    return true;
  }
  
  /**
   * Initialise le système d'éclairage PBR
   */
  init() {
    try {
      this.createLights();
      this.applyPreset('studioProPlus'); // Démarrer avec Studio Pro + optimisé
      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error('❌ Erreur initialisation PBRLightingController:', error);
      return false;
    }
  }
  
  /**
   * Configure les lumières (existantes ou nouvelles)
   */
  createLights() {
    // ✅ COORDINATION : Si lumières déjà fournies, les utiliser
    if (this.lights.ambient && this.lights.directional) {
      // ✅ SAUVEGARDER intensités originales
      this.originalState.lightIntensities.ambient = this.lights.ambient.intensity;
      this.originalState.lightIntensities.directional = this.lights.directional.intensity;
      return;
    }
    
    // ✅ FALLBACK : CHERCHER LES LUMIÈRES EXISTANTES si pas fournies
    this.scene.traverse((child) => {
      if (child.isAmbientLight && !this.lights.ambient) {
        this.lights.ambient = child;
      }
      if (child.isDirectionalLight && !this.lights.directional) {
        this.lights.directional = child;
      }
    });
    
    // ✅ CRÉER SEULEMENT SI ELLES N'EXISTENT PAS
    if (!this.lights.ambient) {
      this.lights.ambient = new THREE.AmbientLight(0x404040, 0.8);
      this.lights.ambient.name = 'PBR_AmbientLight';
      this.scene.add(this.lights.ambient);
    }
    
    if (!this.lights.directional) {
      this.lights.directional = new THREE.DirectionalLight(0xffffff, 0.8);
      this.lights.directional.name = 'PBR_DirectionalLight';
      this.lights.directional.position.copy(this.lightPositions.directional);
      this.lights.directional.castShadow = false; // Performance
      this.scene.add(this.lights.directional);
    }
    
    // ✅ SAUVEGARDER intensités originales après création
    this.originalState.lightIntensities.ambient = this.lights.ambient.intensity;
    this.originalState.lightIntensities.directional = this.lights.directional.intensity;
    
  }
  
  /**
   * ✅ PMREM PHASE 1C: Applique un preset d'éclairage avec environnement HDR coordonné
   */
  applyPreset(presetName) {
    if (!this.presets[presetName]) {
      console.warn(`❌ Preset "${presetName}" non trouvé`);
      return false;
    }
    
    const preset = this.presets[presetName];
    this.currentPreset = presetName;
    
    // ✅ APPLIQUER INTENSITÉS DE BASE
    if (this.lights.ambient) {
      this.lights.ambient.intensity = preset.ambient.intensity;
      this.lights.ambient.color.setHex(preset.ambient.color);
    }
    
    if (this.lights.directional) {
      this.lights.directional.intensity = preset.directional.intensity;
      this.lights.directional.color.setHex(preset.directional.color);
    }
    
    // ✅ APPLIQUER TONE MAPPING & EXPOSURE
    this.renderer.toneMapping = preset.toneMapping;
    this.renderer.toneMappingExposure = preset.exposure;
    
    // ✅ PMREM PHASE 1C: Coordination environnement HDR pour preset PBR
    if (preset.requiresHDREnvironment && this.worldEnvironmentController) {
      const currentTheme = this.worldEnvironmentController.getCurrentTheme();
      if (currentTheme.hasHDREnvironment) {
        this.currentEnvironmentTexture = currentTheme.environmentTexture;
      } else {
        console.warn('⚠️ Preset PBR requiert HDR mais environnement non disponible');
      }
    }
    
    // ✅ PMREM PHASE 1C: Forcer mise à jour matériaux PBR avec nouvel environnement
    if (preset.requiresHDREnvironment) {
      this.updatePBRMaterialsForHDR();
    }
    
    // ✅ NOUVEAU: Activer Three-Point Lighting si requis par le preset
    if (preset.enableAdvancedLighting) {
      this.toggleAdvancedLighting(true);
    } else if (this.advancedLights.enabled && !preset.enableAdvancedLighting) {
      // Désactiver si autre preset sans Advanced Lighting
      this.toggleAdvancedLighting(false);
    }
    
    // ✅ PHASE 4C: Activer Area Lights si requis par le preset
    if (preset.enableAreaLights) {
      this.toggleAreaLights(true);
    } else if (this.areaLights.enabled && !preset.enableAreaLights) {
      // Désactiver si autre preset sans Area Lights
      this.toggleAreaLights(false);
    }
    
    // ✅ PHASE 5B: HDR Boost désactivé - Géré par DebugPanel pour éviter conflits
    // if (preset.useHDRBoost) {
    //   this.applyHDRBoost(true);
    //   this.enhanceMetallicMaterials();
    // }
    
    const _toneMappingName = preset.toneMapping === THREE.AgXToneMapping ? 'AgX' :
                           preset.toneMapping === THREE.ACESFilmicToneMapping ? 'ACES' : 'Linear';
    
    
    return true;
  }
  
  /**
   * ✅ PMREM PHASE 1C: Mise à jour matériaux PBR pour environnement HDR
   */
  updatePBRMaterialsForHDR() {
    if (!this.scene) return;
    
    let updatedMaterials = 0;
    
    this.scene.traverse((child) => {
      if (child.material) {
        const materials = Array.isArray(child.material) ? child.material : [child.material];
        
        materials.forEach(material => {
          // Cibler matériaux PBR (MeshStandardMaterial, MeshPhysicalMaterial)
          if (material.isMeshStandardMaterial || material.isMeshPhysicalMaterial) {
            
            // ✅ SOLUTION MATÉRIAUX NOIRS : Forcer needsUpdate avec environnement HDR
            material.needsUpdate = true;
            
            // Si matériau métallique, s'assurer que roughness n'est pas à 0 (causait problèmes)
            if (material.metalness > 0.5 && material.roughness < 0.01) {
              material.roughness = 0.05; // Minimum pour éviter artefacts
            }
            
            updatedMaterials++;
          }
        });
      }
    });
    
    if (updatedMaterials > 0) {
      // Materials updated
    }
  }
  
  /**
   * Ajuste les multipliers globaux temps réel
   * 🔧 CORRECTION PBR: Les curseurs agissent maintenant comme % du preset (pas de double multiplication)
   */
  setGlobalMultipliers(ambientMult = 1.0, directionalMult = 1.0) {
    this.customMultipliers.ambient = ambientMult;
    this.customMultipliers.directional = directionalMult;
    
    // ✅ SOLUTION PRESET + CURSEURS : Les multipliers modifient directement les valeurs preset
    const preset = this.presets[this.currentPreset];
    
    if (this.lights.ambient) {
      // 🎯 PRESET × CURSEUR : Pas de boost supplémentaire
      // Exemple: Studio Pro+ (3.5) × curseur (1.8) = 6.3 (correct et prévisible)
      this.lights.ambient.intensity = preset.ambient.intensity * ambientMult;
      console.log(`🎯 PBR: Ambient intensity set to ${this.lights.ambient.intensity} (preset: ${preset.ambient.intensity} × curseur: ${ambientMult})`);
    }
    
    if (this.lights.directional) {
      // 🎯 PRESET × CURSEUR : Contrôle linéaire prévisible
      // Exemple: Studio Pro+ (5.0) × curseur (1.2) = 6.0 (augmentation contrôlée)
      this.lights.directional.intensity = preset.directional.intensity * directionalMult;
      console.log(`🎯 PBR: Directional intensity set to ${this.lights.directional.intensity} (preset: ${preset.directional.intensity} × curseur: ${directionalMult})`);
    }
    
  }
  
  /**
   * Obtient les informations du preset actuel
   */
  getCurrentPresetInfo() {
    return {
      name: this.currentPreset,
      preset: this.presets[this.currentPreset],
      multipliers: this.customMultipliers,
      finalIntensities: {
        ambient: this.lights.ambient?.intensity || 0,
        directional: this.lights.directional?.intensity || 0
      }
    };
  }
  
  /**
   * Liste tous les presets disponibles
   */
  getAvailablePresets() {
    return Object.keys(this.presets).map(key => ({
      key,
      name: this.presets[key].name,
      description: this.presets[key].description
    }));
  }
  
  /**
   * Ajuste l'exposure en temps réel
   */
  setExposure(value) {
    const clampedValue = Math.max(0.1, Math.min(3.0, value));
    this.renderer.toneMappingExposure = clampedValue;
  }
  
  /**
   * Change le tone mapping
   */
  setToneMapping(mapping) {
    const mappings = {
      'linear': THREE.LinearToneMapping,
      'aces': THREE.ACESFilmicToneMapping,
      'reinhard': THREE.ReinhardToneMapping
    };
    
    if (mappings[mapping]) {
      this.renderer.toneMapping = mappings[mapping];
    }
  }
  
  /**
   * ✅ NOUVEAU : Crée le système Three-Point Lighting
   */
  createThreePointLighting() {
    if (!this.scene) {
      console.warn('❌ Three-Point Lighting: Scene non disponible');
      return false;
    }

    try {
      // 1. Key Light (Principale) - 45° angle, blanc, forte
      this.advancedLights.keyLight = new THREE.DirectionalLight(0xffffff, 0.8);
      this.advancedLights.keyLight.position.set(5, 8, 5);
      this.advancedLights.keyLight.name = 'ADV_KeyLight';
      this.advancedLights.keyLight.castShadow = false; // Performance
      
      // 2. Fill Light (Remplissage) - Côté opposé, bleuté, douce
      this.advancedLights.fillLight = new THREE.DirectionalLight(0x88aaff, 0.3);
      this.advancedLights.fillLight.position.set(-3, 5, -3);
      this.advancedLights.fillLight.name = 'ADV_FillLight';
      this.advancedLights.fillLight.castShadow = false;
      
      // 3. Rim Light (Contour) - Derrière, fait ressortir les bords
      this.advancedLights.rimLight = new THREE.DirectionalLight(0xffffff, 0.5);
      this.advancedLights.rimLight.position.set(0, 3, -8);
      this.advancedLights.rimLight.name = 'ADV_RimLight';
      this.advancedLights.rimLight.castShadow = false;
      
      return true;
      
    } catch (error) {
      console.error('❌ Erreur création Three-Point Lighting:', error);
      return false;
    }
  }
  
  /**
   * ✅ NOUVEAU : Active/Désactive le Three-Point Lighting
   */
  toggleAdvancedLighting(enabled = null) {
    if (!this.advancedLights.keyLight) {
      this.createThreePointLighting();
    }
    
    const newState = enabled !== null ? enabled : !this.advancedLights.enabled;
    this.advancedLights.enabled = newState;
    
    if (newState) {
      // Activer - Ajouter à la scène
      this.scene.add(this.advancedLights.keyLight);
      this.scene.add(this.advancedLights.fillLight);
      this.scene.add(this.advancedLights.rimLight);
    } else {
      // Désactiver - Retirer de la scène
      this.scene.remove(this.advancedLights.keyLight);
      this.scene.remove(this.advancedLights.fillLight);
      this.scene.remove(this.advancedLights.rimLight);
    }
    
    return newState;
  }
  
  /**
   * ✅ NOUVEAU : Ajuste l'intensité des lumières avancées
   */
  setAdvancedLightingIntensities(keyIntensity = 0.8, fillIntensity = 0.3, rimIntensity = 0.5) {
    if (!this.advancedLights.keyLight) return false;
    
    this.advancedLights.keyLight.intensity = keyIntensity;
    this.advancedLights.fillLight.intensity = fillIntensity;
    this.advancedLights.rimLight.intensity = rimIntensity;
    
    return true;
  }

  /**
   * ✅ PHASE 4A : Crée le système Area Lights (éclairage surfacique)
   */
  createAreaLights() {
    if (!this.scene) {
      console.warn('❌ Area Lights: Scene non disponible');
      return false;
    }

    try {
      // Vérifier si RectAreaLight est disponible
      if (!THREE.RectAreaLight) {
        console.warn('❌ RectAreaLight non disponible - Chargement requis');
        return false;
      }

      // 1. Main Area Light (Principale) - Simule fenêtre/panneau LED
      this.areaLights.mainArea = new THREE.RectAreaLight(0xffffff, this.areaLights.intensities.main, 6, 4);
      this.areaLights.mainArea.position.set(8, 6, 2);
      this.areaLights.mainArea.lookAt(0, 0, 0);
      this.areaLights.mainArea.name = 'AREA_MainLight';

      // 2. Fill Area Light (Remplissage) - Plus petite, côté opposé
      this.areaLights.fillArea = new THREE.RectAreaLight(0x88aaff, this.areaLights.intensities.fill, 4, 3);
      this.areaLights.fillArea.position.set(-6, 4, -2);
      this.areaLights.fillArea.lookAt(0, 0, 0);
      this.areaLights.fillArea.name = 'AREA_FillLight';

      return true;

    } catch (error) {
      console.error('❌ Erreur création Area Lights:', error);
      return false;
    }
  }

  /**
   * ✅ PHASE 4A : Active/Désactive les Area Lights
   */
  toggleAreaLights(enabled = null) {
    if (!this.areaLights.mainArea) {
      if (!this.createAreaLights()) {
        console.warn('❌ Impossible de créer Area Lights');
        return false;
      }
    }

    const newState = enabled !== null ? enabled : !this.areaLights.enabled;
    this.areaLights.enabled = newState;

    if (newState) {
      // Activer - Ajouter à la scène
      this.scene.add(this.areaLights.mainArea);
      this.scene.add(this.areaLights.fillArea);
    } else {
      // Désactiver - Retirer de la scène
      this.scene.remove(this.areaLights.mainArea);
      this.scene.remove(this.areaLights.fillArea);
    }

    return newState;
  }

  /**
   * ✅ PHASE 4A : Ajuste l'intensité des Area Lights
   */
  setAreaLightIntensities(mainIntensity = 2.0, fillIntensity = 1.0) {
    if (!this.areaLights.mainArea) return false;

    this.areaLights.intensities.main = mainIntensity;
    this.areaLights.intensities.fill = fillIntensity;
    
    this.areaLights.mainArea.intensity = mainIntensity;
    this.areaLights.fillArea.intensity = fillIntensity;

    return true;
  }

  /**
   * ✅ PHASE 5A : Crée le système Light Probes (éclairage indirect)
   */
  createLightProbes() {
    if (!this.scene) {
      console.warn('❌ Light Probes: Scene non disponible');
      return false;
    }

    try {
      // 1. Créer Light Probe
      this.lightProbes.probe = new THREE.LightProbe();
      this.lightProbes.probe.name = 'ENV_LightProbe';

      // 2. Créer cube render target pour capture environnement
      this.lightProbes.cubeRenderTarget = new THREE.WebGLCubeRenderTarget(256, {
        format: THREE.RGBFormat,
        generateMipmaps: true,
        minFilter: THREE.LinearMipmapLinearFilter
      });

      // 3. Créer cube camera pour capture 360°
      this.lightProbes.cubeCamera = new THREE.CubeCamera(0.1, 100, this.lightProbes.cubeRenderTarget);
      this.lightProbes.cubeCamera.position.set(0, 0, 0); // Centre du robot

      return true;

    } catch (error) {
      console.error('❌ Erreur création Light Probes:', error);
      return false;
    }
  }

  /**
   * ✅ PHASE 5A : Active/Désactive les Light Probes
   */
  toggleLightProbes(enabled = null) {
    if (!this.lightProbes.probe) {
      if (!this.createLightProbes()) {
        console.warn('❌ Impossible de créer Light Probes');
        return false;
      }
    }

    const newState = enabled !== null ? enabled : !this.lightProbes.enabled;
    this.lightProbes.enabled = newState;

    if (newState) {
      // Activer - Capturer environnement et ajouter à la scène
      this.updateLightProbesFromEnvironment();
      this.scene.add(this.lightProbes.probe);
    } else {
      // Désactiver - Retirer de la scène
      this.scene.remove(this.lightProbes.probe);
    }

    return newState;
  }

  /**
   * ✅ PHASE 5A : Met à jour Light Probes depuis l'environnement
   */
  updateLightProbesFromEnvironment() {
    if (!this.lightProbes.probe || !this.renderer) {
      return false;
    }

    try {
      // Capturer environnement 360° depuis position robot
      this.lightProbes.cubeCamera.update(this.renderer, this.scene);

      // Générer Light Probe depuis capture
      this.lightProbes.probe.copy(
        THREE.LightProbeGenerator.fromCubeRenderTarget(
          this.renderer, 
          this.lightProbes.cubeRenderTarget
        )
      );

      // Appliquer intensité
      this.lightProbes.probe.intensity = this.lightProbes.intensity;

      return true;

    } catch (error) {
      console.error('❌ Erreur mise à jour Light Probes:', error);
      return false;
    }
  }

  /**
   * ✅ PHASE 5A : Ajuste l'intensité des Light Probes
   */
  setLightProbeIntensity(intensity = 1.0) {
    if (!this.lightProbes.probe) return false;

    this.lightProbes.intensity = intensity;
    this.lightProbes.probe.intensity = intensity;

    return true;
  }

  /**
   * ✅ PHASE 5B : HDR Boost désactivé - Géré par DebugPanel pour éviter double application
   * @deprecated Utiliser le système HDR Boost du DebugPanel à la place
   */
  applyHDRBoost() {
    // ✅ SUPPRIMÉ : Warning pour réduire spam console
    return false;
    
    /* CODE DÉSACTIVÉ POUR ÉVITER CONFLITS :
    if (!this.renderer) {
      console.warn('❌ HDR Boost: Renderer non disponible');
      return false;
    }

    if (enabled) {
      // Boost HDR - Intensités > 1.0 pour haute dynamique
      if (this.lights.ambient) {
        this.lights.ambient.intensity *= 1.5; // +50%
      }
      if (this.lights.directional) {
        this.lights.directional.intensity *= 2.0; // +100%
      }
      
      // Three-Point Lighting boost
      if (this.advancedLights.enabled && this.advancedLights.keyLight) {
        this.advancedLights.keyLight.intensity *= 1.8;
        this.advancedLights.fillLight.intensity *= 1.6;
        this.advancedLights.rimLight.intensity *= 2.2; // Rim très boosté
      }
      
      // Area Lights boost
      if (this.areaLights.enabled && this.areaLights.mainArea) {
        this.areaLights.mainArea.intensity *= 1.7;
        this.areaLights.fillArea.intensity *= 1.5;
      }
      
      // HDR Tone Mapping adaptatif
      this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
      this.renderer.toneMappingExposure = 0.6; // Réduire exposition pour compenser
      
      return true;
      
    } else {
      // Restaurer intensités normales (appliquer preset actuel)
      this.applyPreset(this.currentPreset);
      return false;
    }
    */
  }

  /**
   * ✅ PHASE 5B : Boost spécifique pour matériaux métalliques
   */
  enhanceMetallicMaterials() {
    if (!this.scene) return false;

    let enhancedCount = 0;
    
    this.scene.traverse((child) => {
      if (child.material) {
        const materials = Array.isArray(child.material) ? child.material : [child.material];
        
        materials.forEach(material => {
          if (material.isMeshStandardMaterial || material.isMeshPhysicalMaterial) {
            
            // Boost pour matériaux métalliques
            if (material.metalness > 0.5) {
              // Augmenter reflectivité
              material.envMapIntensity = Math.min(2.0, material.envMapIntensity * 1.5);
              
              // Ajuster roughness pour plus de brillance
              material.roughness = Math.max(0.05, material.roughness * 0.8);
              
              material.needsUpdate = true;
              enhancedCount++;
            }
          }
        });
      }
    });
    
    if (enhancedCount > 0) {
      // Enhanced materials processed
    }
    return enhancedCount > 0;
  }
  
  /**
   * ✅ NOUVEAU : HDR Boost avec multiplicateur précis (résout problème d'accumulation)
   */
  setHDRBoostMultiplier(multiplier = 1.0) {
    if (!this.renderer || !this.scene) {
      console.warn('❌ HDR Boost Multiplier: Renderer ou Scene non disponible');
      return false;
    }
    
    // Stocker le multiplicateur pour éviter accumulation
    this.currentHDRMultiplier = multiplier;
    
    // Parcourir tous les matériaux avec émission
    let _boostedMaterials = 0;
    this.scene.traverse((child) => {
      if (child.isMesh && child.material) {
        const materials = Array.isArray(child.material) ? child.material : [child.material];
        
        materials.forEach(material => {
          const materialName = material.name || '';
          
          // Appliquer boost HDR sur matériaux émissifs
          if (this.isBloomMaterial(materialName)) {
            // Calculer nouvelle intensité basée sur multiplier
            const baseIntensity = material.userData?.originalEmissiveIntensity || material.emissiveIntensity || 1.0;
            
            // Sauvegarder valeur originale si première fois
            if (!material.userData?.originalEmissiveIntensity) {
              material.userData = material.userData || {};
              material.userData.originalEmissiveIntensity = baseIntensity;
            }
            
            // Appliquer multiplier
            material.emissiveIntensity = baseIntensity * multiplier;
            material.toneMapped = multiplier > 1.0 ? false : true; // HDR si > 1.0
            material.needsUpdate = true;
            
            _boostedMaterials++;
          }
        });
      }
    });
    
    // Ajuster tone mapping selon multiplier
    if (multiplier > 2.0) {
      this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
      this.renderer.toneMappingExposure = Math.max(0.4, 1.2 - (multiplier * 0.2));
    } else {
      this.renderer.toneMapping = THREE.AgXToneMapping;
      this.renderer.toneMappingExposure = 1.2;
    }
    
    return true;
  }

  /**
   * ✅ PHASE 5C : Active Shadow Maps améliorés (optionnel)
   */
  enableEnhancedShadows(enabled = true) {
    if (!this.renderer) {
      console.warn('❌ Enhanced Shadows: Renderer non disponible');
      return false;
    }

    if (enabled) {
      // Activer shadows sur renderer
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = THREE.PCFSoftShadowMap; // Ombres douces
      
      // Améliorer qualité des ombres sur lumières directionnelles
      const lights = [this.lights.directional, this.advancedLights.keyLight, this.advancedLights.fillLight];
      
      lights.forEach(light => {
        if (light) {
          light.castShadow = true;
          light.shadow.mapSize.width = 2048;  // Haute résolution
          light.shadow.mapSize.height = 2048;
          light.shadow.camera.near = 0.5;
          light.shadow.camera.far = 50;
          
          // Directional shadow camera bounds
          if (light.isDirectionalLight) {
            light.shadow.camera.left = -10;
            light.shadow.camera.right = 10;
            light.shadow.camera.top = 10;
            light.shadow.camera.bottom = -10;
          }
          
          // Shadow bias pour éviter acné
          light.shadow.bias = -0.0001;
        }
      });
      
      return true;
      
    } else {
      // Désactiver shadows
      this.renderer.shadowMap.enabled = false;
      return false;
    }
  }

  /**
   * Nettoie les ressources - NE SUPPRIME PAS les lumières existantes
   */
  dispose() {
    // ✅ ON NE SUPPRIME PAS les lumières de la scène car elles peuvent être partagées
    // On se contente de remettre les références à null
    if (this.lights.ambient && this.lights.ambient.name === 'PBR_AmbientLight') {
      // Seulement si c'est une lumière qu'on a créée nous-mêmes
      this.scene.remove(this.lights.ambient);
    }
    this.lights.ambient = null;
    
    if (this.lights.directional && this.lights.directional.name === 'PBR_DirectionalLight') {
      // Seulement si c'est une lumière qu'on a créée nous-mêmes
      this.scene.remove(this.lights.directional);
    }
    this.lights.directional = null;
    
    // ✅ NOUVEAU : Nettoyer les lumières avancées
    if (this.advancedLights.enabled) {
      this.toggleAdvancedLighting(false);
    }
    this.advancedLights.keyLight = null;
    this.advancedLights.fillLight = null;
    this.advancedLights.rimLight = null;
    
    // ✅ PHASE 4A : Nettoyer les Area Lights
    if (this.areaLights.enabled) {
      this.toggleAreaLights(false);
    }
    this.areaLights.mainArea = null;
    this.areaLights.fillArea = null;
    
    // ✅ PHASE 5A : Nettoyer les Light Probes
    if (this.lightProbes.enabled) {
      this.toggleLightProbes(false);
    }
    if (this.lightProbes.cubeRenderTarget) {
      this.lightProbes.cubeRenderTarget.dispose();
    }
    this.lightProbes.probe = null;
    this.lightProbes.cubeCamera = null;
    this.lightProbes.cubeRenderTarget = null;
    
    this.isInitialized = false;
  }
  
  /**
   * ✅ PMREM PHASE 1C: Forcer synchronisation environnement (si changement thème externe)
   */
  synchronizeEnvironment() {
    if (this.worldEnvironmentController) {
      const currentTheme = this.worldEnvironmentController.getCurrentTheme();
      this.currentEnvironmentTexture = currentTheme.environmentTexture;
      
      // Si preset PBR actif, remettre à jour matériaux
      if (this.presets[this.currentPreset]?.requiresHDREnvironment) {
        this.updatePBRMaterialsForHDR();
      }
      
    }
  }
  
  /**
   * 🛡️ ANTI-FLASH SYSTEM - Résolution des flashs lumineux sur bras métalliques animés
   * Problème: Effets de flash même avec metalness=0, roughness=1, lumière faible
   * Causes identifiées: Shadow updates, Z-fighting, vertex normals, antialiasing
   */
  
  /**
   * ✅ FIX 1: Force la mise à jour des vertex normals pendant animation
   */
  forceVertexNormalsUpdate() {
    if (!this.scene) return false;
    
    let updatedGeometries = 0;
    
    this.scene.traverse((child) => {
      if (child.isMesh && child.geometry) {
        // Forcer recalcul des normales pour géométries animées
        if (child.geometry.isBufferGeometry) {
          child.geometry.computeVertexNormals();
          updatedGeometries++;
        }
      }
    });
    
    return updatedGeometries > 0;
  }
  
  /**
   * ✅ FIX 2: Configure renderer avec logarithmic depth buffer (anti Z-fighting)
   */
  enableLogarithmicDepthBuffer(enabled = true) {
    if (!this.renderer) return false;
    
    // Note: Nécessite recréation du renderer en pratique
    // Ici on configure les paramètres optimaux
    if (enabled) {
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5)); // Limiter pixel ratio
      this.renderer.sortObjects = true; // Tri des objets pour depth
      
      // Ajuster near/far planes pour réduire Z-fighting (si caméra disponible)
      if (this.camera && this.camera.isPerspectiveCamera) {
        this.camera.near = Math.max(this.camera.near, 0.1);
        this.camera.far = Math.min(this.camera.far, 1000);
        this.camera.updateProjectionMatrix();
      } else if (!this.camera) {
        console.warn('⚠️ Caméra non fournie - Optimisations Z-fighting limitées');
      }
      
    }
    
    return true;
  }
  
  /**
   * ✅ FIX 3: Désactive temporairement les ombres pour isoler le problème
   */
  toggleShadowsForDebugging(enabled = false) {
    if (!this.renderer) return false;
    
    const originalShadowMapEnabled = this.renderer.shadowMap.enabled;
    this.renderer.shadowMap.enabled = enabled;
    
    // Désactiver castShadow et receiveShadow sur tous les objets
    this.scene.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = enabled;
        child.receiveShadow = enabled;
      }
      if (child.isLight) {
        child.castShadow = enabled;
      }
    });
    
    return { enabled, wasEnabled: originalShadowMapEnabled };
  }
  
  /**
   * ✅ FIX 4: Configure shadow bias pour éliminer artifacts
   */
  optimizeShadowBias() {
    if (!this.scene) return false;
    
    let shadowLights = 0;
    
    this.scene.traverse((child) => {
      if (child.isLight && child.shadow) {
        // Ajuster bias vers zéro pour réduire artifacts
        child.shadow.bias = -0.001;
        child.shadow.normalBias = 0.01;
        
        // Optimiser shadow camera planes
        if (child.shadow.camera) {
          child.shadow.camera.near = 0.1;
          child.shadow.camera.far = 100;
          child.shadow.camera.updateProjectionMatrix();
        }
        
        shadowLights++;
      }
    });
    
    return shadowLights > 0;
  }
  
  /**
   * ✅ FIX 5: Mode Debug Anti-Flash - Désactive toutes sources potentielles
   */
  enableDebugAntiFlashMode() {
    
    const results = {
      shadowsDisabled: false,
      vertexNormalsUpdated: false,
      depthBufferOptimized: false,
      shadowBiasOptimized: false,
      renderingSimplified: false
    };
    
    // 1. Désactiver ombres complètement
    results.shadowsDisabled = this.toggleShadowsForDebugging(false);
    
    // 2. Force vertex normals update
    results.vertexNormalsUpdated = this.forceVertexNormalsUpdate();
    
    // 3. Optimiser depth buffer
    results.depthBufferOptimized = this.enableLogarithmicDepthBuffer(true);
    
    // 4. Optimiser shadow bias (même si désactivées)
    results.shadowBiasOptimized = this.optimizeShadowBias();
    
    // 5. Simplifier rendu - Désactiver features complexes temporairement
    if (this.advancedLights.enabled) {
      this.toggleAdvancedLighting(false);
    }
    if (this.areaLights.enabled) {
      this.toggleAreaLights(false);
    }
    if (this.lightProbes.enabled) {
      this.toggleLightProbes(false);
    }
    results.renderingSimplified = true;
    
    // 6. Appliquer tone mapping le plus simple
    if (this.renderer) {
      this.renderer.toneMapping = THREE.LinearToneMapping;
      this.renderer.toneMappingExposure = 1.0;
    }
    
    
    return results;
  }
  
  /**
   * ✅ NOUVEAU : Restaure l'état original complet
   */
  restoreOriginalState() {
    if (!this.originalState) {
      console.warn('⚠️ Pas d\'état original sauvegardé');
      return false;
    }
    
    // Restaurer renderer
    if (this.renderer && this.originalState.renderer) {
      this.renderer.toneMapping = this.originalState.renderer.toneMapping;
      this.renderer.toneMappingExposure = this.originalState.renderer.toneMappingExposure;
      this.renderer.shadowMap.enabled = this.originalState.renderer.shadowMapEnabled;
    }
    
    // Restaurer intensités lumières originales
    if (this.originalState.lightIntensities.ambient !== undefined && this.lights.ambient) {
      this.lights.ambient.intensity = this.originalState.lightIntensities.ambient;
    }
    if (this.originalState.lightIntensities.directional !== undefined && this.lights.directional) {
      this.lights.directional.intensity = this.originalState.lightIntensities.directional;
    }
    
    return true;
  }

  /**
   * ✅ FIX 6: Restaure la configuration normale après debug (amélioré)
   */
  disableDebugAntiFlashMode() {
    // Utiliser la restauration propre au lieu de forcer des valeurs
    this.restoreOriginalState();
    
    // Réappliquer le preset actuel pour cohérence
    this.applyPreset(this.currentPreset);
    
    // Note: Ne pas forcer l'activation des systèmes - laisser le preset décider
    
  }
  
  /**
   * 🌟 SOLUTION DÉFINITIVE : Mode Anti-Flash HDR
   * Principe: Threshold bas (0.17) + HDR boost sur anneaux seulement
   */
  enableAntiFlashHDRMode(bloomSystem = null) {
    if (!this.scene) {
      console.warn('❌ Anti-Flash HDR: Scene non disponible');
      return false;
    }
    
    
    const results = {
      bloomThresholdSet: false,
      hdrRingsBoost: 0,
      armsNormalized: 0,
      bodyNormalized: 0
    };
    
    // 1️⃣ CONFIGURATION BLOOM : Threshold 0.17 (textures visibles, pas de flash)
    if (bloomSystem) {
      bloomSystem.setThreshold(0.17);
      results.bloomThresholdSet = true;
    }
    
    // 2️⃣ PARCOURIR TOUS LES OBJETS
    this.scene.traverse((child) => {
      if (child.isMesh && child.material) {
        const materials = Array.isArray(child.material) ? child.material : [child.material];
        
        materials.forEach(material => {
          const materialName = material.name || '';
          
          // ✅ ÉLÉMENTS AVEC BLOOM (anneaux/iris) → HDR BOOST
          if (this.isBloomMaterial(materialName)) {
            // HDR Colors pour forcer bloom malgré threshold bas
            if (material.emissive) {
              const currentColor = material.emissive.clone();
              material.emissive = currentColor;
              material.emissiveIntensity = Math.max(material.emissiveIntensity * 5.0, 3.0); // × 5 minimum 3
            } else {
              material.emissive = new THREE.Color(0.2, 0.2, 0.2);
              material.emissiveIntensity = 3.0;
            }
            
            // CRUCIAL: Désactiver tone mapping pour HDR
            material.toneMapped = false;
            material.needsUpdate = true;
            
            results.hdrRingsBoost++;
          }
          
          // ❌ ÉLÉMENTS SANS BLOOM (bras/corps) → NORMALISATION
          else if (this.isArmMaterial(materialName) || this.isBodyMaterial(materialName)) {
            // S'assurer qu'ils n'émettent pas (pas de bloom)
            material.emissiveIntensity = 0;
            material.toneMapped = true; // Tone mapping normal
            material.needsUpdate = true;
            
            if (this.isArmMaterial(materialName)) {
              results.armsNormalized++;
            } else {
              results.bodyNormalized++;
            }
          }
        });
      }
    });
    
    // 3️⃣ AJUSTER ÉCLAIRAGE GLOBAL POUR COMPENSER
    if (this.lights.ambient) {
      this.lights.ambient.intensity *= 1.2; // +20% ambient pour compenser
    }
    
    
    return results;
  }
  
  /**
   * 🔍 Identifie les matériaux de bloom (anneaux/iris)
   */
  isBloomMaterial(materialName) {
    const bloomMaterials = [
      // Anneaux magiques
      'BloomRing_1', 'BloomRing_2', 'BloomRing_3', 'BloomRing_4',
      'BloomRing_5', 'BloomRing_6', 'BloomRing_7', 'BloomRing_8',
      'BloomRing_9', 'BloomRing_10', 'BloomRing_11', 'BloomRing_12',
      'BloomRing_13', 'BloomRing_14', 'BloomRing_15', 'BloomRing_16',
      // Anneaux chrome/métal œil
      'Material-metal050-effet-chrome',
      'Material-Metal027',
      // Iris
      'iris', 'Iris',
      // Matériaux émissifs
      'alien-metal025-orange'
    ];
    
    return bloomMaterials.some(bloom => 
      materialName.includes(bloom) || materialName === bloom
    );
  }
  
  /**
   * 🦾 Identifie les matériaux de bras (problématiques flashs)
   */
  isArmMaterial(materialName) {
    const armMaterials = [
      'Material.003',  // Big Arms
      'metalgrid3'     // Little Arms (aussi dans anneaux mais contexte différent)
    ];
    
    return armMaterials.some(arm => 
      materialName.includes(arm) || materialName === arm
    );
  }
  
  /**
   * 🤖 Identifie les matériaux de corps
   */
  isBodyMaterial(materialName) {
    const bodyMaterials = [
      'alien-panels',
      'Material.001',
      'Material.002',
      'Material.004',
      'Material.005'
    ];
    
    return bodyMaterials.some(body => 
      materialName.includes(body) || materialName === body
    );
  }
  
  /**
   * 🔄 Restaure configuration normale
   */
  disableAntiFlashHDRMode(bloomSystem = null) {
    if (!this.scene) return false;
    
    
    // Restaurer threshold bloom normal
    if (bloomSystem) {
      bloomSystem.setThreshold(0.3);
    }
    
    // Restaurer matériaux
    let _restoredMaterials = 0;
    this.scene.traverse((child) => {
      if (child.isMesh && child.material) {
        const materials = Array.isArray(child.material) ? child.material : [child.material];
        
        materials.forEach(material => {
          if (this.isBloomMaterial(material.name)) {
            // Restaurer valeurs bloom normales
            material.emissiveIntensity = Math.min(material.emissiveIntensity / 5.0, 1.0);
            material.toneMapped = true;
            material.needsUpdate = true;
            _restoredMaterials++;
          }
        });
      }
    });
    
    // Restaurer éclairage
    if (this.lights.ambient) {
      this.lights.ambient.intensity /= 1.2;
    }
    
    return true;
  }

  /**
   * ✅ PRESET ANTI-FLASH: Configuration step-by-step pour identifier la cause
   */
  runAntiFlashDiagnostic() {
    
    const steps = [];
    
    // ÉTAPE 1: Test sans ombres
    const shadowResult = this.toggleShadowsForDebugging(false);
    steps.push({ step: 1, action: 'Ombres désactivées', result: shadowResult });
    
    return {
      steps,
      nextAction: 'Testez l\'animation et dites-moi si les flashs persistent. Ensuite on passera à l\'étape 2.'
    };
  }

  /**
   * Informations de débogage
   */
  getDebugInfo() {
    return {
      initialized: this.isInitialized,
      currentPreset: this.currentPreset,
      multipliers: this.customMultipliers,
      lightIntensities: {
        ambient: this.lights.ambient?.intensity || 0,
        directional: this.lights.directional?.intensity || 0
      },
      renderer: {
        toneMapping: this.renderer.toneMapping,
        exposure: this.renderer.toneMappingExposure,
        shadowMapEnabled: this.renderer.shadowMap?.enabled || false
      },
      // ✅ NOUVEAU PMREM : Info coordination HDR
      pmrem: {
        environmentCoordination: !!this.worldEnvironmentController,
        currentEnvironmentTexture: !!this.currentEnvironmentTexture,
        environmentRequired: this.presets[this.currentPreset]?.requiresHDREnvironment || false
      },
      // ✅ NOUVEAU ANTI-FLASH : Info debug
      antiFlash: {
        shadowsEnabled: this.renderer?.shadowMap?.enabled || false,
        pixelRatio: this.renderer?.getPixelRatio() || 1,
        sortObjects: this.renderer?.sortObjects || false
      }
    };
  }
}