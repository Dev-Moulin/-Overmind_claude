// 🎯 PRESETS SYSTÈME - Configuration par mode sécurité + thème
// Basé sur la capture de paramètres du système DebugPanel

/**
 * Presets par défaut pour chaque mode de sécurité + type de background
 * Générés à partir des configurations optimales utilisateur
 */

// ⚪ PRESET BLANC (capturé le 2025-09-11)
export const BLANC_DARK_PRESET = {
  name: "blanc_dark",
  description: "Mode Blanc (Normal) - Thème sombre",
  securityMode: "NORMAL",
  timestamp: "2025-09-11T06:41:10.016Z",
  
  // Format attendu par SceneStateController
  exposure: 1,
  toneMapping: 5, // ACESFilmicToneMapping
  
  // Éclairage
  ambient: {
    color: 4210752,
    intensity: 3.5
  },
  directional: {
    color: 16777215,
    intensity: 5
  },
  
  // Matériaux par défaut
  defaultMaterialSettings: {
    metalness: 0.3,
    roughness: 1
  },
  
  bloom: {
    enabled: true,
    threshold: 0,
    strength: 0.17,
    radius: 0.4
  },
  
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
      strength: 0.4,
      radius: 0.36
    }
  },
  
  materials: {
    global: {
      metalness: 0.3,
      roughness: 1
    },
    groups: {
      iris: {
        emissive: 65416,
        emissiveIntensity: 1.4,
        metalness: 0.3,
        roughness: 1
      },
      eyeRings: {
        emissive: 4491519,
        emissiveIntensity: 1.8,
        metalness: 0.3,
        roughness: 1
      },
      revealRings: {
        emissive: 16755200,
        emissiveIntensity: 0.7,
        metalness: 0.3,
        roughness: 1
      },
      arms: {
        emissive: 6711039,
        emissiveIntensity: 0.1,
        metalness: 0.3,
        roughness: 1
      }
    }
  },
  
  lighting: {
    ambient: {
      color: 4210752,
      intensity: 3.5
    },
    directional: {
      color: 16777215,
      intensity: 5,
      position: {
        x: 1,
        y: 2,
        z: 3
      }
    }
  },
  
  pbr: {
    currentPreset: "studioProPlus",
    ambientMultiplier: 1,
    directionalMultiplier: 1,
    customExposure: 1,
    materialSettings: {
      metalness: 0.3,
      roughness: 1,
      targetMaterials: ["all"]
    },
    hdrBoost: {
      enabled: false,
      multiplier: 2
    }
  },
  
  background: {
    type: "color",
    color: "#1a1a1a"
  },
  
  msaa: {
    enabled: false,
    samples: 1,
    fxaaEnabled: false
  },
  
  camera: {
    position: {
      x: 1.8043229534702847,
      y: 1.445590380609543,
      z: 13.43785565233522
    },
    rotation: {
      x: -0.10716385207767735,
      y: 0.1327166463209013,
      z: 0.01423428548229494
    },
    fov: 85,
    zoom: 1
  },
  
  particles: {
    enabled: true,
    particleCount: 400,
    particleColor: 16777215,
    connectionDistance: 5.49358900066983,
    connectionColor: 16777215,
    connectionWidth: 12,
    arcs: {
      enabled: true,
      count: 15,
      intensity: 5,
      frequency: 0.016,
      colorMode: "security",
      color: 43775
    },
    mouseRepulsion: {
      enabled: true,
      radius: 3,
      force: 0.05
    },
    visibilityUpdateFrequency: 3
  }
};

// 📋 REGISTRY DES PRESETS
export const PRESET_REGISTRY = {
  'blanc_dark': BLANC_DARK_PRESET
};

/**
 * Obtenir un preset par mode de sécurité et type de background
 * @param {string} securityMode - SAFE, DANGER, WARNING, SCANNING, NORMAL
 * @param {string} backgroundType - color, transparent, etc.
 * @param {string} theme - light, dark, medium, tech, neutral
 * @returns {Object|null} Preset trouvé ou null
 */
export function getPresetByMode(securityMode, backgroundType = 'color', theme = 'neutral') {
  const presetKey = `${securityMode}_${backgroundType}_${theme}`;
  return PRESET_REGISTRY[presetKey] || null;
}

/**
 * Appliquer un preset à tous les systèmes
 * @param {Object} preset - Preset à appliquer
 * @param {Object} handlers - Handlers des systèmes (onColorBloomChange, etc.)
 */
export function applyPreset(preset, handlers) {
  if (!preset) return false;
  
  try {
    // Appliquer paramètres Groupes
    if (preset.groups && handlers.onColorBloomChange) {
      // Global threshold
      handlers.onColorBloomChange('global', 'threshold', preset.groups.globalThreshold);
      
      // Exposure
      if (handlers.setExposure) {
        handlers.setExposure(preset.groups.exposure);
      }
      
      // Bloom values pour chaque groupe
      Object.entries(preset.groups.bloomValues).forEach(([groupName, values]) => {
        Object.entries(values).forEach(([param, value]) => {
          handlers.onColorBloomChange(groupName, param, value);
        });
      });
    }
    
    // Appliquer paramètres PBR
    if (preset.pbr && handlers.pbrLightingController) {
      const controller = handlers.pbrLightingController;
      
      // Preset PBR
      controller.applyPreset(preset.pbr.currentPreset);
      
      // HDR Boost
      if (preset.pbr.hdrBoost) {
        controller.applyHDRBoost(preset.pbr.hdrBoost.enabled);
        controller.setHDRBoostMultiplier(preset.pbr.hdrBoost.multiplier);
      }
    }
    
    // Appliquer paramètres Background
    if (preset.background && handlers.setBackground) {
      handlers.setBackground(preset.background.type, preset.background.color);
    }
    
    // Appliquer paramètres MSAA
    if (preset.msaa && handlers.bloomSystem) {
      const system = handlers.bloomSystem;
      system.setMSAAEnabled?.(preset.msaa.enabled);
      system.updateMSAASamples?.(preset.msaa.samples);
      system.setFXAAEnabled?.(preset.msaa.fxaaEnabled);
    }
    
    return true;
  } catch (error) {
    console.error('❌ Erreur application preset:', error);
    return false;
  }
}

/**
 * Obtenir la liste des presets disponibles
 * @returns {Array} Liste des presets avec infos
 */
export function getAvailablePresets() {
  return Object.values(PRESET_REGISTRY).map(preset => ({
    key: preset.name,
    name: preset.name,
    description: preset.description,
    securityMode: preset.securityMode,
    isTemplate: preset.name.includes('TEMPLATE')
  }));
}