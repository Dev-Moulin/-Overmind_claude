/**
 * 🎨 PBR SLICE - Phase 2
 * Centralise tous les paramètres PBR (Physically Based Rendering)
 */

/**
 * 🔥 PRESETS PBR COMPLETS: Tous les paramètres inclus pour synchronisation parfaite
 * ⚠️ Les valeurs sont des MULTIPLIERS (1 = valeur de base du preset), pas des valeurs absolues
 * Base Studio Pro+ : ambient=3.5, directional=5.0 dans PBRLightingController
 */
const PBR_PRESET_DEFINITIONS = {
  studioProPlus: {
    name: 'Studio Pro +',
    // Éclairage
    ambient: { intensity: 1.0, color: 0x404040 },
    directional: { intensity: 1.0, color: 0xffffff },
    exposure: 1.7,
    // Rendu avancé
    toneMapping: 'AgXToneMapping', // THREE.AgXToneMapping
    enableAdvancedLighting: true,
    enableAreaLights: true,
    requiresHDREnvironment: true,
    environmentIntensity: 1.1,
    // Matériaux par défaut
    defaultMaterialSettings: {
      metalness: 0.3,
      roughness: 1.0
    },
    description: 'Studio Pro optimisé - Configuration par défaut'
  },
  chromeShowcase: {
    name: 'Chrome Showcase',
    // Éclairage
    ambient: { intensity: 0.571, color: 0x404040 }, // 2.0/3.5
    directional: { intensity: 0.6, color: 0xffffff }, // 3.0/5.0
    exposure: 1.2,
    // Rendu avancé
    toneMapping: 'ACESFilmicToneMapping',
    enableAdvancedLighting: true,
    enableAreaLights: false,
    requiresHDREnvironment: true,
    environmentIntensity: 0.8,
    // Matériaux chrome
    defaultMaterialSettings: {
      metalness: 0.9,
      roughness: 0.1
    },
    description: 'Optimisé pour rendu chrome'
  },
  softStudio: {
    name: 'Soft Studio',
    // Éclairage
    ambient: { intensity: 0.429, color: 0x404040 }, // 1.5/3.5
    directional: { intensity: 0.4, color: 0xffffff }, // 2.0/5.0
    exposure: 1.0,
    // Rendu avancé
    toneMapping: 'LinearToneMapping',
    enableAdvancedLighting: false,
    enableAreaLights: true,
    requiresHDREnvironment: false,
    environmentIntensity: 0.6,
    // Matériaux doux
    defaultMaterialSettings: {
      metalness: 0.2,
      roughness: 0.8
    },
    description: 'Éclairage doux et diffus'
  },
  dramaticMood: {
    name: 'Dramatic Mood',
    // Éclairage
    ambient: { intensity: 0.229, color: 0x2a2a2a }, // 0.8/3.5
    directional: { intensity: 0.8, color: 0xffffff }, // 4.0/5.0
    exposure: 1.5,
    // Rendu avancé
    toneMapping: 'ReinhardToneMapping',
    enableAdvancedLighting: true,
    enableAreaLights: false,
    requiresHDREnvironment: true,
    environmentIntensity: 1.3,
    // Matériaux dramatiques
    defaultMaterialSettings: {
      metalness: 0.7,
      roughness: 0.3
    },
    description: 'Contraste élevé, ambiance dramatique'
  }
};

/**
 * État initial PBR basé sur configuration actuelle
 */
const INITIAL_PBR_STATE = {
  // Preset principal
  currentPreset: 'studioProPlus',
  
  // Multipliers globaux (1.0 = valeurs de base du preset Studio Pro+)
  ambientMultiplier: 1.0,
  directionalMultiplier: 1.0,
  customExposure: 1.7, // ✅ Exposure initial Studio Pro+
  
  // 🔥 NOUVEAU: Paramètres de rendu avancé
  toneMapping: 'AgXToneMapping', // THREE.AgXToneMapping
  environmentIntensity: 1.1,
  
  // Paramètres matériaux (synchronisés avec preset)
  materialSettings: {
    metalness: 0.3, // ✅ Valeur Studio Pro+ par défaut
    roughness: 1.0, // ✅ Valeur Studio Pro+ par défaut
    targetMaterials: ['Material-metal050-effet-chrome', 'Material-Metal027', 'metalgrid3']
  },
  
  // HDR Boost
  hdrBoost: {
    enabled: false,
    multiplier: 2
  },
  
  // Area Lights (synchronisé avec preset)
  areaLights: {
    enabled: true, // ✅ Studio Pro+ active les area lights
    intensity: 1,
    width: 10,
    height: 10
  },
  
  // Environment (synchronisé avec preset)
  environment: {
    enabled: true, // ✅ Studio Pro+ requiert HDR environment
    intensity: 1.1, // ✅ Valeur Studio Pro+
    rotation: 0
  },
  
  // Advanced Lighting (Three-Point) (synchronisé avec preset)
  advancedLighting: {
    enabled: true // ✅ Studio Pro+ active l'advanced lighting
  }
};

/**
 * PBR SLICE - Actions et état
 */
export const createPbrSlice = (set, get) => ({
  pbr: INITIAL_PBR_STATE,
  
  // === ACTIONS PBR PRESETS ===
  
  /**
   * Changer preset PBR principal ET synchroniser TOUS les paramètres vers UI
   */
  setPbrPreset: (presetName) => {
    // 🔥 CRITIQUE: Récupérer la définition du preset depuis nos définitions statiques
    const presetDef = PBR_PRESET_DEFINITIONS[presetName];
    
    if (presetDef) {
      console.log(`🎯 SYNC UI COMPLETE: Applying preset ${presetName} with ALL parameters:`, presetDef);
      
      // 🔧 CRITIQUE: Synchroniser TOUS les paramètres vers UI Zustand
      set((state) => ({
        pbr: { 
          ...state.pbr, 
          currentPreset: presetName,
          
          // 🔥 Éclairage
          ambientMultiplier: presetDef.ambient.intensity,
          directionalMultiplier: presetDef.directional.intensity,
          
          // 🔥 Rendu avancé
          toneMapping: presetDef.toneMapping,
          environmentIntensity: presetDef.environmentIntensity,
          
          // 🔥 Matériaux (synchroniser avec preset)
          materialSettings: {
            ...state.pbr.materialSettings,
            metalness: presetDef.defaultMaterialSettings.metalness,
            roughness: presetDef.defaultMaterialSettings.roughness
          },
          
          // 🔥 Area Lights
          areaLights: {
            ...state.pbr.areaLights,
            enabled: presetDef.enableAreaLights
          },
          
          // 🔥 Environment
          environment: {
            ...state.pbr.environment,
            enabled: presetDef.requiresHDREnvironment,
            intensity: presetDef.environmentIntensity
          },
          
          // 🔥 Advanced Lighting
          advancedLighting: {
            ...state.pbr.advancedLighting,
            enabled: presetDef.enableAdvancedLighting
          }
        },
        
        // 🔥 IMPORTANT: Synchroniser aussi l'exposure dans lighting
        lighting: {
          ...state.lighting,
          exposure: presetDef.exposure
        }
      }), false, `setPbrPreset:${presetName}:withCompleteUISync`);
      
      // 🔧 BACKUP: Appliquer aussi au rendu Three.js via le controller
      const pbrController = window.pbrLightingController;
      if (pbrController && pbrController.applyPreset) {
        console.log(`🎯 SYNC RENDER: Applying preset ${presetName} to Three.js`);
        pbrController.applyPreset(presetName);
      }
      
      console.log(`✅ COMPLETE SYNC: ${presetName} applied to both UI and render with ALL parameters`);
      return;
    }
    
    // 🔧 FALLBACK: Si preset inconnu, juste changer le nom
    console.warn(`⚠️ Unknown preset: ${presetName}, applying name only`);
    set((state) => ({
      pbr: { ...state.pbr, currentPreset: presetName }
    }), false, `setPbrPreset:${presetName}:nameOnly`);
  },
  
  /**
   * Appliquer preset complet avec tous ses paramètres
   */
  applyPbrPreset: (presetName, presetConfig) => set((state) => ({
    pbr: {
      ...state.pbr,
      currentPreset: presetName,
      ...presetConfig
    }
  }), false, `applyPbrPreset:${presetName}`),
  
  // === ACTIONS MULTIPLIERS ===
  
  /**
   * Modifier multiplier (ambient, directional, custom)
   */
  setPbrMultiplier: (type, value) => set((state) => ({
    pbr: { ...state.pbr, [`${type}Multiplier`]: value }
  }), false, `setPbrMultiplier:${type}:${value}`),
  
  /**
   * Batch update multipliers
   */
  setPbrMultipliers: (multipliers) => set((state) => ({
    pbr: { ...state.pbr, ...multipliers }
  }), false, `setPbrMultipliers:${Object.keys(multipliers).join(',')}`),
  
  // === ACTIONS MATERIAUX ===
  
  /**
   * Modifier paramètre matériau spécifique
   */
  setMaterialSetting: (setting, value) => set((state) => ({
    pbr: {
      ...state.pbr,
      materialSettings: { ...state.pbr.materialSettings, [setting]: value }
    }
  }), false, `setMaterialSetting:${setting}:${value}`),
  
  /**
   * Batch update matériaux
   */
  setMaterialSettings: (settings) => set((state) => ({
    pbr: {
      ...state.pbr,
      materialSettings: { ...state.pbr.materialSettings, ...settings }
    }
  }), false, `setMaterialSettings:${Object.keys(settings).join(',')}`),
  
  // === ACTIONS HDR BOOST ===
  
  /**
   * Activer/désactiver HDR Boost avec multiplier optionnel
   */
  setHdrBoost: (enabled, multiplier = null) => set((state) => ({
    pbr: {
      ...state.pbr,
      hdrBoost: {
        enabled,
        multiplier: multiplier !== null ? multiplier : state.pbr.hdrBoost.multiplier
      }
    }
  }), false, `setHdrBoost:${enabled}:${multiplier}`),
  
  /**
   * Modifier seulement le multiplier HDR
   */
  setHdrMultiplier: (multiplier) => set((state) => ({
    pbr: {
      ...state.pbr,
      hdrBoost: { ...state.pbr.hdrBoost, multiplier }
    }
  }), false, `setHdrMultiplier:${multiplier}`),
  
  // === ACTIONS AREA LIGHTS ===
  
  /**
   * Configurer area lights
   */
  setAreaLights: (enabled, config = {}) => set((state) => ({
    pbr: {
      ...state.pbr,
      areaLights: {
        ...state.pbr.areaLights,
        enabled,
        ...config
      }
    }
  }), false, `setAreaLights:${enabled}:${JSON.stringify(config)}`),
  
  // === ACTIONS ADVANCED LIGHTING ===
  
  /**
   * Toggle Advanced Lighting (Three-Point)
   */
  toggleAdvancedLighting: (enabled) => {
    const newEnabled = enabled !== undefined ? enabled : !get().pbr.advancedLighting.enabled;
    
    // 🔧 CORRECTION: Synchroniser immédiatement avec PBRLightingController
    if (window.pbrLightingController && window.pbrLightingController.toggleAdvancedLighting) {
      const actualState = window.pbrLightingController.toggleAdvancedLighting(newEnabled);
      console.log(`🌟 Advanced Lighting synchronisé: ${actualState ? 'ACTIVÉ' : 'DÉSACTIVÉ'}`);
    }
    
    return set((state) => ({
      pbr: {
        ...state.pbr,
        advancedLighting: {
          ...state.pbr.advancedLighting,
          enabled: newEnabled
        }
      }
    }), false, `toggleAdvancedLighting:${enabled}`);
  },
  
  // === ACTIONS ENVIRONMENT ===
  
  /**
   * Configurer environment
   */
  setEnvironment: (enabled, config = {}) => set((state) => ({
    pbr: {
      ...state.pbr,
      environment: {
        ...state.pbr.environment,
        enabled,
        ...config
      }
    }
  }), false, `setEnvironment:${enabled}:${JSON.stringify(config)}`),
  
  // === ACTIONS AVANCÉES ===
  
  /**
   * Reset complet PBR à l'état initial
   */
  resetPbr: () => set(() => ({
    pbr: { ...INITIAL_PBR_STATE }
  }), false, 'resetPbr'),
  
  /**
   * Obtenir configuration PBR pour export
   */
  getPbrState: () => {
    const state = get();
    return {
      pbr: state.pbr
    };
  },
  
  // === UTILITIES ===
  
  /**
   * Validation valeurs PBR
   */
  validatePbrValues: (parameter, value) => {
    const validations = {
      // 🔥 CORRIGÉ: Réduire l'amplitude pour des réglages plus fins (boost ×20/×10 appliqué après)
      ambientMultiplier: { min: 0.1, max: 3.0, type: 'number' }, // ✅ Réduit : 3.0×3.5×20=210 max (au lieu de 1750)
      directionalMultiplier: { min: 0.1, max: 2.0, type: 'number' }, // ✅ Réduit : 2.0×5×10=100 max (au lieu de 125)
      customExposure: { min: 0.4, max: 5, type: 'number' }, // ✅ Start à 0.4 pour meilleure précision
      metalness: { min: 0.3, max: 1, type: 'number' }, // ✅ Start à 0.3 pour meilleure précision
      roughness: { min: 0.3, max: 1, type: 'number' }, // ✅ Start à 0.3 pour meilleure précision
      intensity: { min: 0, max: 10, type: 'number' },
      multiplier: { min: 1, max: 10, type: 'number' }
    };
    
    const rule = validations[parameter];
    if (!rule) return value; // Paramètre non validé
    
    if (rule.type === 'number') {
      const numValue = Number(value);
      if (isNaN(numValue)) return rule.min || 0;
      return Math.max(rule.min, Math.min(rule.max, numValue));
    }
    
    return value;
  },
  
  /**
   * Vérifier si preset PBR est actif
   */
  isPbrPresetActive: (presetName) => {
    const state = get();
    return state.pbr.currentPreset === presetName;
  }
});