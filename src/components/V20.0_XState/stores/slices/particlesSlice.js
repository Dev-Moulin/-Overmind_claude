/**
 * 🎨 Particles Slice - État des systèmes de particules
 */
export const createParticlesSlice = (set, get) => ({
  particles: {
    // Système de particules principal
    enabled: true,
    count: 800,
    size: 0.3,
    color: '#00ffff',
    
    // Arcs électriques
    arcs: {
      enabled: true,
      count: 3,
      intensity: 0.8,
      connectionDistance: 100,
      color: '#00ffff',
      speed: 1.0
    },
    
    // Animation
    animation: {
      speed: 1.0,
      turbulence: 0.5,
      spread: 50
    }
  },
  
  // === ACTIONS PARTICLES ===
  setParticlesEnabled: (enabled) => set((state) => ({
    particles: { ...state.particles, enabled }
  }), false, `setParticlesEnabled:${enabled}`),
  
  setParticlesCount: (count) => set((state) => ({
    particles: { ...state.particles, count }
  }), false, `setParticlesCount:${count}`),
  
  setParticlesColor: (color) => set((state) => ({
    particles: { ...state.particles, color }
  }), false, `setParticlesColor:${color}`),
  
  setArcsEnabled: (enabled) => set((state) => ({
    particles: {
      ...state.particles,
      arcs: { ...state.particles.arcs, enabled }
    }
  }), false, `setArcsEnabled:${enabled}`),
  
  setArcsProperty: (property, value) => set((state) => ({
    particles: {
      ...state.particles,
      arcs: { ...state.particles.arcs, [property]: value }
    }
  }), false, `setArcsProperty:${property}:${value}`),
  
  setAnimationProperty: (property, value) => set((state) => ({
    particles: {
      ...state.particles,
      animation: { ...state.particles.animation, [property]: value }
    }
  }), false, `setAnimationProperty:${property}:${value}`),
  
  resetParticles: () => set((state) => ({
    particles: {
      enabled: true,
      count: 800,
      size: 0.3,
      color: '#00ffff',
      arcs: {
        enabled: true,
        count: 3,
        intensity: 0.8,
        connectionDistance: 100,
        color: '#00ffff',
        speed: 1.0
      },
      animation: {
        speed: 1.0,
        turbulence: 0.5,
        spread: 50
      }
    }
  }), false, 'resetParticles')
});