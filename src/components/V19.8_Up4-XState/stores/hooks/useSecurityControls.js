/**
 * 🔒 Hooks pour contrôles Security
 */
import useSceneStore from '../sceneStore.js';

export const useSecurityControls = () => {
  // États individuels
  const security = useSceneStore((state) => state.security);
  const securityState = useSceneStore((state) => state.security.state);
  const presets = useSceneStore((state) => state.security.presets);
  const transition = useSceneStore((state) => state.security.transition);
  const isTransitioning = useSceneStore((state) => state.security.transition.isTransitioning);
  const settings = useSceneStore((state) => state.security.settings);
  
  // Actions du store (stables)
  const actions = useSceneStore.getState();
  
  return {
    // États
    security,
    securityState,
    presets,
    transition,
    isTransitioning,
    settings,
    
    // Actions
    setSecurityState: actions.setSecurityState,
    triggerSecurityTransition: actions.triggerSecurityTransition,
    updateTransitionProgress: actions.updateTransitionProgress,
    setSecuritySetting: actions.setSecuritySetting,
    applySecurityPreset: actions.applySecurityPreset,
    resetSecurity: actions.resetSecurity
  };
};

export const useSecurityPresets = () => {
  const presets = useSceneStore((state) => state.security.presets);
  const currentState = useSceneStore((state) => state.security.state);
  const applyPreset = useSceneStore.getState().applySecurityPreset;
  
  return {
    presets,
    currentState,
    applyPreset,
    
    // Helpers
    getPresetDescription: (presetName) => presets[presetName]?.description || '',
    getCurrentPreset: () => presets[currentState] || null,
    isPresetActive: (presetName) => currentState === presetName
  };
};

export const useTransitionControls = () => {
  const transition = useSceneStore((state) => state.security.transition);
  const actions = useSceneStore.getState();
  
  return {
    transition,
    triggerTransition: actions.triggerSecurityTransition,
    updateProgress: actions.updateTransitionProgress,
    
    // Helpers
    isActive: transition.isTransitioning,
    progress: transition.currentProgress,
    duration: transition.duration
  };
};