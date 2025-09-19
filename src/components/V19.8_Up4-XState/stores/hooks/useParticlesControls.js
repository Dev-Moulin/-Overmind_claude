/**
 * 🎨 Hooks pour contrôles Particles
 */
import useSceneStore from '../sceneStore.js';

export const useParticlesControls = () => {
  // États individuels pour éviter re-renders
  const particles = useSceneStore((state) => state.particles);
  const enabled = useSceneStore((state) => state.particles.enabled);
  const count = useSceneStore((state) => state.particles.count);
  const size = useSceneStore((state) => state.particles.size);
  const color = useSceneStore((state) => state.particles.color);
  
  // Arcs
  const arcs = useSceneStore((state) => state.particles.arcs);
  const arcsEnabled = useSceneStore((state) => state.particles.arcs.enabled);
  
  // Animation
  const animation = useSceneStore((state) => state.particles.animation);
  
  // Actions du store (stables, pas de re-render)
  const actions = useSceneStore.getState();
  
  return {
    // États
    particles,
    enabled,
    count,
    size,
    color,
    arcs,
    arcsEnabled,
    animation,
    
    // Actions principales
    setParticlesEnabled: actions.setParticlesEnabled,
    setParticlesCount: actions.setParticlesCount,
    setParticlesColor: actions.setParticlesColor,
    setArcsEnabled: actions.setArcsEnabled,
    setArcsProperty: actions.setArcsProperty,
    setAnimationProperty: actions.setAnimationProperty,
    resetParticles: actions.resetParticles
  };
};

export const useArcsControls = () => {
  const arcs = useSceneStore((state) => state.particles.arcs);
  const actions = useSceneStore.getState();
  
  return {
    arcs,
    setEnabled: actions.setArcsEnabled,
    setProperty: actions.setArcsProperty
  };
};