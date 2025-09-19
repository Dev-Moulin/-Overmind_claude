/**
 * 🔒 Security Slice - État du système de sécurité et transitions
 */
export const createSecuritySlice = (set, get) => ({
  security: {
    // État de sécurité actuel - NULL = pas de preset appliqué, valeurs Zustand d'origine
    state: null,
    
    // Presets de sécurité - COULEURS UNIQUEMENT
    presets: {
      SAFE: { color: "#00ff88", description: "🟢 Vert (Sécurisé)" },
      DANGER: { color: "#ff4444", description: "🔴 Rouge (Danger)" },
      WARNING: { color: "#ffaa00", description: "🟡 Orange (Alerte)" },
      SCANNING: { color: "#4488ff", description: "🔵 Bleu (Scan)" },
      NORMAL: { color: "#ffffff", description: "⚪ Blanc (Normal)" }
    },
    
    // Transition
    transition: {
      isTransitioning: false,
      duration: 1000,
      easing: 'easeInOut',
      currentProgress: 0
    },
    
    // Settings
    settings: {
      autoTransition: false,
      transitionInterval: 5000,
      glitchEffect: true,
      warningFlash: true
    }
  },
  
  // === ACTIONS SECURITY ===
  setSecurityState: (state) => set((prevState) => ({
    security: { 
      ...prevState.security, 
      state,
      transition: {
        ...prevState.security.transition,
        isTransitioning: false
      }
    },
    metadata: {
      ...prevState.metadata,
      securityState: state,
      lastModified: Date.now()
    }
  }), false, `setSecurityState:${state}`),
  
  triggerSecurityTransition: (fromState, toState, duration = 1000) => set((state) => ({
    security: {
      ...state.security,
      transition: {
        ...state.security.transition,
        isTransitioning: true,
        duration,
        currentProgress: 0
      }
    },
    metadata: {
      ...state.metadata,
      isTransitioning: true
    }
  }), false, `triggerSecurityTransition:${fromState}→${toState}`),
  
  updateTransitionProgress: (progress) => set((state) => ({
    security: {
      ...state.security,
      transition: {
        ...state.security.transition,
        currentProgress: progress,
        isTransitioning: progress < 1
      }
    },
    metadata: {
      ...state.metadata,
      isTransitioning: progress < 1
    }
  }), false, `updateTransitionProgress:${progress}`),
  
  setSecuritySetting: (setting, value) => set((state) => ({
    security: {
      ...state.security,
      settings: { ...state.security.settings, [setting]: value }
    }
  }), false, `setSecuritySetting:${setting}:${value}`),
  
  applySecurityPreset: (presetName) => {
    const preset = get().security.presets[presetName];
    if (!preset) return;
    
    set((state) => ({
      security: {
        ...state.security,
        state: presetName
      },
      // Appliquer SEULEMENT les couleurs au bloom - PAS les intensités
      bloom: {
        ...state.bloom,
        groups: {
          ...state.bloom.groups,
          iris: { 
            ...state.bloom.groups.iris, 
            emissive: preset.color
          },
          eyeRings: { 
            ...state.bloom.groups.eyeRings, 
            emissive: preset.color
          },
          revealRings: { 
            ...state.bloom.groups.revealRings, 
            emissive: preset.color
          },
          arms: { 
            ...state.bloom.groups.arms, 
            emissive: preset.color
          }
        }
      },
      metadata: {
        ...state.metadata,
        securityState: presetName,
        lastModified: Date.now()
      }
    }), false, `applySecurityPreset:${presetName}`);
  },
  
  resetSecurity: () => set((state) => ({
    security: {
      state: null, // Pas de preset par défaut
      presets: state.security.presets, // Garder les presets
      transition: {
        isTransitioning: false,
        duration: 1000,
        easing: 'easeInOut',
        currentProgress: 0
      },
      settings: {
        autoTransition: false,
        transitionInterval: 5000,
        glitchEffect: true,
        warningFlash: true
      }
    },
    metadata: {
      ...state.metadata,
      securityState: null,
      isTransitioning: false
    }
  }), false, 'resetSecurity')
});