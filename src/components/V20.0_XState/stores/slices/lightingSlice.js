/**
 * 💡 LIGHTING SLICE - Phase 2
 * Centralise tous les paramètres d'éclairage (ambient, directional, exposure)
 */

/**
 * État initial lighting basé sur configuration actuelle
 */
const INITIAL_LIGHTING_STATE = {
  // ❌ SUPPRIMÉ: ambient/directional (doublons avec PBR multipliers)
  // Les valeurs sont maintenant dans pbrSlice avec format ×1.000
  
  // Exposition globale
  exposure: 1.0,
  
  // Tone Mapping
  toneMapping: 5, // ACESFilmicToneMapping par défaut
  
  // Ombres
  shadows: {
    enabled: true,
    type: 'PCFSoft',
    mapSize: 2048,
    bias: -0.0001,
    radius: 1,
    blurSamples: 25
  },
  
  // Fog/Brouillard
  fog: {
    enabled: false,
    type: 'linear', // 'linear' ou 'exponential'
    color: 0xcccccc,
    near: 1,
    far: 1000,
    density: 0.00025 // pour exponential fog
  },
  
  // Post-processing lighting
  postProcessing: {
    bloomIntensity: 1.0,
    colorCorrection: {
      brightness: 0,
      contrast: 0,
      saturation: 0,
      hue: 0
    }
  }
};

/**
 * LIGHTING SLICE - Actions et état
 */
export const createLightingSlice = (set, get) => ({
  lighting: INITIAL_LIGHTING_STATE,
  
  // === ACTIONS EXPOSURE ===
  
  /**
   * Modifier exposition globale
   */
  setExposure: (value) => set((state) => ({
    lighting: { ...state.lighting, exposure: value }
  }), false, `setExposure:${value}`),
  
  /**
   * Incrément/décrément exposition
   */
  adjustExposure: (delta) => set((state) => ({
    lighting: { 
      ...state.lighting, 
      exposure: Math.max(0.1, Math.min(5.0, state.lighting.exposure + delta))
    }
  }), false, `adjustExposure:${delta}`),
  
  // ❌ SUPPRIMÉ: Actions ambient light (doublons avec PBR multipliers)
  
  // ❌ SUPPRIMÉ: Actions directional light (doublons avec PBR multipliers)
  
  // === ACTIONS TONE MAPPING ===
  
  /**
   * Changer tone mapping
   */
  setToneMapping: (toneMapping) => set((state) => ({
    lighting: { ...state.lighting, toneMapping }
  }), false, `setToneMapping:${toneMapping}`),
  
  // === ACTIONS SHADOWS ===
  
  /**
   * Configurer ombres
   */
  setShadows: (enabled, config = {}) => set((state) => ({
    lighting: {
      ...state.lighting,
      shadows: {
        ...state.lighting.shadows,
        enabled,
        ...config
      }
    }
  }), false, `setShadows:${enabled}:${JSON.stringify(config)}`),
  
  /**
   * Modifier propriété shadow spécifique
   */
  setShadowProperty: (property, value) => set((state) => ({
    lighting: {
      ...state.lighting,
      shadows: { ...state.lighting.shadows, [property]: value }
    }
  }), false, `setShadowProperty:${property}:${value}`),
  
  // === ACTIONS FOG ===
  
  /**
   * Configurer brouillard
   */
  setFog: (enabled, config = {}) => set((state) => ({
    lighting: {
      ...state.lighting,
      fog: {
        ...state.lighting.fog,
        enabled,
        ...config
      }
    }
  }), false, `setFog:${enabled}:${JSON.stringify(config)}`),
  
  // === ACTIONS POST-PROCESSING ===
  
  /**
   * Modifier intensité bloom
   */
  setBloomIntensity: (intensity) => set((state) => ({
    lighting: {
      ...state.lighting,
      postProcessing: {
        ...state.lighting.postProcessing,
        bloomIntensity: intensity
      }
    }
  }), false, `setBloomIntensity:${intensity}`),
  
  /**
   * Modifier correction couleur
   */
  setColorCorrection: (property, value) => set((state) => ({
    lighting: {
      ...state.lighting,
      postProcessing: {
        ...state.lighting.postProcessing,
        colorCorrection: {
          ...state.lighting.postProcessing.colorCorrection,
          [property]: value
        }
      }
    }
  }), false, `setColorCorrection:${property}:${value}`),
  
  // === ACTIONS AVANCÉES ===
  
  /**
   * Reset lighting à l'état initial
   */
  resetLighting: () => set(() => ({
    lighting: { ...INITIAL_LIGHTING_STATE }
  }), false, 'resetLighting'),
  
  /**
   * Appliquer preset lighting
   */
  applyLightingPreset: (presetName, presetData) => {
    if (!presetData.lighting) {
      console.warn('❌ No lighting data in preset');
      return;
    }
    
    set((state) => {
      const newLighting = { ...state.lighting };
      
      // Appliquer lighting global
      if (presetData.lighting) {
        Object.assign(newLighting, presetData.lighting);
      }
      
      // ❌ SUPPRIMÉ: ambient/directional (maintenant dans pbrSlice)
      
      // Appliquer exposition si disponible
      if (presetData.exposure !== undefined) {
        newLighting.exposure = presetData.exposure;
      }
      
      return { lighting: newLighting };
    }, false, `applyLightingPreset:${presetName}`);
  },
  
  /**
   * Obtenir état lighting pour export
   */
  getLightingState: () => {
    const state = get();
    return {
      lighting: state.lighting
    };
  },
  
  // === UTILITIES ===
  
  /**
   * Validation valeurs lighting
   */
  validateLightingValues: (parameter, value) => {
    const validations = {
      exposure: { min: 0.1, max: 5.0, type: 'number' },
      intensity: { min: 0, max: 20, type: 'number' },
      color: { min: 0, max: 16777215, type: 'number' },
      position: { min: -100, max: 100, type: 'number' },
      mapSize: { min: 256, max: 4096, type: 'number', step: 256 },
      bias: { min: -0.01, max: 0.01, type: 'number' },
      near: { min: 0.1, max: 1000, type: 'number' },
      far: { min: 1, max: 10000, type: 'number' },
      density: { min: 0.0001, max: 0.01, type: 'number' }
    };
    
    const rule = validations[parameter];
    if (!rule) return value; // Paramètre non validé
    
    if (rule.type === 'number') {
      const numValue = Number(value);
      if (isNaN(numValue)) return rule.min || 0;
      
      let clampedValue = Math.max(rule.min, Math.min(rule.max, numValue));
      
      // Appliquer step si défini
      if (rule.step) {
        clampedValue = Math.round(clampedValue / rule.step) * rule.step;
      }
      
      return clampedValue;
    }
    
    return value;
  },
  
  // ❌ SUPPRIMÉ: getTotalSceneBrightness (utilisait ambient/directional supprimés)
  // Les valeurs de luminosité sont maintenant dans pbrSlice avec les multipliers
});