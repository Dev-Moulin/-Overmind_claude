/**
 * 🌈 BACKGROUND SLICE - Phase 2
 * Centralise tous les paramètres de background (color, transparent, environment)
 */

/**
 * État initial background basé sur configuration actuelle
 */
const INITIAL_BACKGROUND_STATE = {
  // Type de background
  type: 'color', // 'color', 'transparent', 'environment', 'gradient'
  
  // Background couleur
  color: '#1a1a1a',
  alpha: 1.0,
  
  // Background gradient
  gradient: {
    enabled: false,
    type: 'linear', // 'linear', 'radial'
    colors: ['#1a1a1a', '#333333'],
    direction: 'top-bottom', // 'top-bottom', 'left-right', 'diagonal'
    stops: [0, 1]
  },
  
  // Environment background
  environment: {
    enabled: false,
    map: null,
    intensity: 1.0,
    rotation: 0,
    blur: 0
  },
  
  // Skybox
  skybox: {
    enabled: false,
    textures: [], // 6 textures pour cube skybox
    rotation: { x: 0, y: 0, z: 0 }
  },
  
  // Post-processing background
  postProcessing: {
    vignette: {
      enabled: false,
      intensity: 0.5,
      color: '#000000'
    },
    grain: {
      enabled: false,
      intensity: 0.1,
      size: 1.0
    }
  }
};

/**
 * BACKGROUND SLICE - Actions et état
 */
export const createBackgroundSlice = (set, get) => ({
  background: INITIAL_BACKGROUND_STATE,
  
  // === ACTIONS TYPE BACKGROUND ===
  
  /**
   * Changer type de background
   */
  setBackgroundType: (type) => set((state) => ({
    background: { ...state.background, type }
  }), false, `setBackgroundType:${type}`),
  
  // === ACTIONS BACKGROUND COULEUR ===
  
  /**
   * Modifier couleur background
   */
  setBackgroundColor: (color) => set((state) => ({
    background: { ...state.background, color }
  }), false, `setBackgroundColor:${color}`),
  
  /**
   * Modifier alpha background
   */
  setBackgroundAlpha: (alpha) => set((state) => ({
    background: { 
      ...state.background, 
      alpha: Math.max(0, Math.min(1, alpha))
    }
  }), false, `setBackgroundAlpha:${alpha}`),
  
  /**
   * Set couleur avec alpha en une fois
   */
  setBackgroundColorAlpha: (color, alpha) => set((state) => ({
    background: { 
      ...state.background, 
      color,
      alpha: Math.max(0, Math.min(1, alpha))
    }
  }), false, `setBackgroundColorAlpha:${color}:${alpha}`),
  
  // === ACTIONS GRADIENT ===
  
  /**
   * Configurer gradient
   */
  setGradient: (enabled, config = {}) => set((state) => ({
    background: {
      ...state.background,
      gradient: {
        ...state.background.gradient,
        enabled,
        ...config
      }
    }
  }), false, `setGradient:${enabled}:${JSON.stringify(config)}`),
  
  /**
   * Modifier couleurs gradient
   */
  setGradientColors: (colors) => set((state) => ({
    background: {
      ...state.background,
      gradient: {
        ...state.background.gradient,
        colors
      }
    }
  }), false, `setGradientColors:${colors.join(',')}`),
  
  /**
   * Modifier direction gradient
   */
  setGradientDirection: (direction) => set((state) => ({
    background: {
      ...state.background,
      gradient: {
        ...state.background.gradient,
        direction
      }
    }
  }), false, `setGradientDirection:${direction}`),
  
  // === ACTIONS ENVIRONMENT ===
  
  /**
   * Configurer environment background
   */
  setEnvironment: (enabled, config = {}) => set((state) => ({
    background: {
      ...state.background,
      environment: {
        ...state.background.environment,
        enabled,
        ...config
      }
    }
  }), false, `setEnvironment:${enabled}:${JSON.stringify(config)}`),
  
  /**
   * Modifier intensité environment
   */
  setEnvironmentIntensity: (intensity) => set((state) => ({
    background: {
      ...state.background,
      environment: {
        ...state.background.environment,
        intensity
      }
    }
  }), false, `setEnvironmentIntensity:${intensity}`),
  
  /**
   * Modifier rotation environment
   */
  setEnvironmentRotation: (rotation) => set((state) => ({
    background: {
      ...state.background,
      environment: {
        ...state.background.environment,
        rotation
      }
    }
  }), false, `setEnvironmentRotation:${rotation}`),
  
  // === ACTIONS SKYBOX ===
  
  /**
   * Configurer skybox
   */
  setSkybox: (enabled, config = {}) => set((state) => ({
    background: {
      ...state.background,
      skybox: {
        ...state.background.skybox,
        enabled,
        ...config
      }
    }
  }), false, `setSkybox:${enabled}:${JSON.stringify(config)}`),
  
  /**
   * Modifier rotation skybox
   */
  setSkyboxRotation: (axis, value) => set((state) => ({
    background: {
      ...state.background,
      skybox: {
        ...state.background.skybox,
        rotation: {
          ...state.background.skybox.rotation,
          [axis]: value
        }
      }
    }
  }), false, `setSkyboxRotation:${axis}:${value}`),
  
  // === ACTIONS POST-PROCESSING ===
  
  /**
   * Configurer vignette
   */
  setVignette: (enabled, config = {}) => set((state) => ({
    background: {
      ...state.background,
      postProcessing: {
        ...state.background.postProcessing,
        vignette: {
          ...state.background.postProcessing.vignette,
          enabled,
          ...config
        }
      }
    }
  }), false, `setVignette:${enabled}:${JSON.stringify(config)}`),
  
  /**
   * Configurer grain
   */
  setGrain: (enabled, config = {}) => set((state) => ({
    background: {
      ...state.background,
      postProcessing: {
        ...state.background.postProcessing,
        grain: {
          ...state.background.postProcessing.grain,
          enabled,
          ...config
        }
      }
    }
  }), false, `setGrain:${enabled}:${JSON.stringify(config)}`),
  
  // === ACTIONS AVANCÉES ===
  
  /**
   * Reset background à l'état initial
   */
  resetBackground: () => set(() => ({
    background: { ...INITIAL_BACKGROUND_STATE }
  }), false, 'resetBackground'),
  
  /**
   * Appliquer preset background
   */
  applyBackgroundPreset: (presetName, presetData) => {
    if (!presetData.background) {
      console.warn('❌ No background data in preset');
      return;
    }
    
    set((state) => ({
      background: {
        ...state.background,
        ...presetData.background
      }
    }), false, `applyBackgroundPreset:${presetName}`);
  },
  
  /**
   * Créer preset background depuis état actuel
   */
  createBackgroundPreset: (presetName) => {
    const state = get();
    const preset = {
      name: presetName,
      timestamp: Date.now(),
      background: { ...state.background }
    };
    
    console.log(`📸 Background preset created: ${presetName}`, preset);
    return preset;
  },
  
  /**
   * Obtenir état background pour export
   */
  getBackgroundState: () => {
    const state = get();
    return {
      background: state.background
    };
  },
  
  // === UTILITIES ===
  
  /**
   * Validation valeurs background
   */
  validateBackgroundValues: (parameter, value) => {
    const validations = {
      alpha: { min: 0, max: 1, type: 'number' },
      intensity: { min: 0, max: 5, type: 'number' },
      rotation: { min: 0, max: 360, type: 'number' },
      blur: { min: 0, max: 1, type: 'number' },
      size: { min: 0.1, max: 10, type: 'number' }
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
   * Vérifier si background est transparent
   */
  isBackgroundTransparent: () => {
    const state = get();
    return state.background.type === 'transparent' || state.background.alpha < 1;
  },
  
  /**
   * Obtenir couleur background effective
   */
  getEffectiveBackgroundColor: () => {
    const state = get();
    const bg = state.background;
    
    switch (bg.type) {
      case 'color':
        return bg.color;
      case 'transparent':
        return 'transparent';
      case 'gradient':
        return bg.gradient.enabled ? bg.gradient.colors[0] : bg.color;
      case 'environment':
        return bg.environment.enabled ? 'environment' : bg.color;
      default:
        return bg.color;
    }
  },
  
  /**
   * Générer CSS background pour preview
   */
  generateCssBackground: () => {
    const state = get();
    const bg = state.background;
    
    switch (bg.type) {
      case 'color':
        return `rgba(${hexToRgb(bg.color)}, ${bg.alpha})`;
        
      case 'transparent':
        return 'transparent';
        
      case 'gradient': {
        if (!bg.gradient.enabled) return bg.color;
        
        const direction = bg.gradient.direction === 'top-bottom' ? 'to bottom' :
                         bg.gradient.direction === 'left-right' ? 'to right' : 
                         'to bottom right';
        
        return `linear-gradient(${direction}, ${bg.gradient.colors.join(', ')})`;
      }
        
      default:
        return bg.color;
    }
  }
});

// Helper function
function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? 
    `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : 
    '26, 26, 26'; // fallback
}