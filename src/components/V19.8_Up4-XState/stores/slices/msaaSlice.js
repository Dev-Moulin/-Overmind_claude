/**
 * 🎨 MSAA Slice - État du Multi-Sample Anti-Aliasing
 */
export const createMsaaSlice = (set, get) => ({
  msaa: {
    // État MSAA
    enabled: false,
    samples: 2, // 2, 4, 8
    
    // FXAA (Fast Approximate Anti-Aliasing)
    fxaa: {
      enabled: false,
      threshold: 0.063,
      iterations: 12
    },
    
    // Performance
    adaptiveSampling: true,
    targetFPS: 60,
    currentQuality: 'high', // 'low', 'medium', 'high', 'ultra'
    
    // Stats
    stats: {
      currentFPS: 60,
      renderTime: 16.67,
      gpuLoad: 50
    }
  },
  
  // === ACTIONS MSAA ===
  setMsaaEnabled: (enabled) => set((state) => ({
    msaa: { ...state.msaa, enabled }
  }), false, `setMsaaEnabled:${enabled}`),
  
  setMsaaSamples: (samples) => {
    // Valider les échantillons (doit être 2, 4 ou 8)
    const validSamples = [2, 4, 8];
    const clampedSamples = validSamples.includes(samples) ? samples : 2;
    
    set((state) => ({
      msaa: { ...state.msaa, samples: clampedSamples }
    }), false, `setMsaaSamples:${clampedSamples}`);
  },
  
  setFxaaEnabled: (enabled) => set((state) => ({
    msaa: {
      ...state.msaa,
      fxaa: { ...state.msaa.fxaa, enabled }
    }
  }), false, `setFxaaEnabled:${enabled}`),
  
  setFxaaProperty: (property, value) => set((state) => ({
    msaa: {
      ...state.msaa,
      fxaa: { ...state.msaa.fxaa, [property]: value }
    }
  }), false, `setFxaaProperty:${property}:${value}`),
  
  setAdaptiveSampling: (enabled) => set((state) => ({
    msaa: { ...state.msaa, adaptiveSampling: enabled }
  }), false, `setAdaptiveSampling:${enabled}`),
  
  updateMsaaStats: (stats) => set((state) => ({
    msaa: {
      ...state.msaa,
      stats: { ...state.msaa.stats, ...stats }
    }
  }), false, 'updateMsaaStats'),
  
  setQualityPreset: (quality) => {
    const presets = {
      low: { samples: 2, fxaa: false, adaptiveSampling: true },
      medium: { samples: 4, fxaa: false, adaptiveSampling: true },
      high: { samples: 4, fxaa: true, adaptiveSampling: false },
      ultra: { samples: 8, fxaa: true, adaptiveSampling: false }
    };
    
    const preset = presets[quality] || presets.high;
    
    set((state) => ({
      msaa: {
        ...state.msaa,
        samples: preset.samples,
        fxaa: {
          ...state.msaa.fxaa,
          enabled: preset.fxaa
        },
        adaptiveSampling: preset.adaptiveSampling,
        currentQuality: quality
      }
    }), false, `setQualityPreset:${quality}`);
  },
  
  resetMsaa: () => set((state) => ({
    msaa: {
      enabled: false,
      samples: 2,
      fxaa: {
        enabled: false,
        threshold: 0.063,
        iterations: 12
      },
      adaptiveSampling: true,
      targetFPS: 60,
      currentQuality: 'high',
      stats: {
        currentFPS: 60,
        renderTime: 16.67,
        gpuLoad: 50
      }
    }
  }), false, 'resetMsaa')
});