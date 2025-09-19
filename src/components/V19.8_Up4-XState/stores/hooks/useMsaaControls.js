/**
 * 🎨 Hooks pour contrôles MSAA
 */
import useSceneStore from '../sceneStore.js';

export const useMsaaControls = () => {
  // États individuels
  const msaa = useSceneStore((state) => state.msaa);
  const enabled = useSceneStore((state) => state.msaa.enabled);
  const samples = useSceneStore((state) => state.msaa.samples);
  const fxaa = useSceneStore((state) => state.msaa.fxaa);
  const adaptiveSampling = useSceneStore((state) => state.msaa.adaptiveSampling);
  const currentQuality = useSceneStore((state) => state.msaa.currentQuality);
  const stats = useSceneStore((state) => state.msaa.stats);
  
  // Actions du store (stables)
  const actions = useSceneStore.getState();
  
  return {
    // États
    msaa,
    enabled,
    samples,
    fxaa,
    adaptiveSampling,
    currentQuality,
    stats,
    
    // Actions principales
    setMsaaEnabled: actions.setMsaaEnabled,
    setMsaaSamples: actions.setMsaaSamples,
    setFxaaEnabled: actions.setFxaaEnabled,
    setFxaaProperty: actions.setFxaaProperty,
    setAdaptiveSampling: actions.setAdaptiveSampling,
    setQualityPreset: actions.setQualityPreset,
    updateMsaaStats: actions.updateMsaaStats,
    resetMsaa: actions.resetMsaa
  };
};

export const useFxaaControls = () => {
  const fxaa = useSceneStore((state) => state.msaa.fxaa);
  const actions = useSceneStore.getState();
  
  return {
    fxaa,
    setEnabled: actions.setFxaaEnabled,
    setProperty: actions.setFxaaProperty,
    
    // Helpers
    isEnabled: fxaa.enabled,
    threshold: fxaa.threshold,
    iterations: fxaa.iterations
  };
};

export const useMsaaStats = () => {
  const stats = useSceneStore((state) => state.msaa.stats);
  const updateStats = useSceneStore.getState().updateMsaaStats;
  
  return {
    stats,
    updateStats,
    
    // Helpers
    currentFPS: stats.currentFPS,
    renderTime: stats.renderTime,
    gpuLoad: stats.gpuLoad,
    
    // Performance status
    getPerformanceStatus: () => {
      if (stats.currentFPS >= 58) return 'excellent';
      if (stats.currentFPS >= 45) return 'good';
      if (stats.currentFPS >= 30) return 'average';
      return 'poor';
    },
    
    getPerformanceColor: () => {
      const status = stats.currentFPS >= 58 ? 'excellent' :
                    stats.currentFPS >= 45 ? 'good' :
                    stats.currentFPS >= 30 ? 'average' : 'poor';
      
      const colors = {
        excellent: '#00ff88',
        good: '#88ff00',
        average: '#ffaa00',
        poor: '#ff4444'
      };
      
      return colors[status];
    }
  };
};