/**
 * 🎛️ useDebugPanelControls - Hook principal Phase 2
 * Remplace TOUS les useState du DebugPanel par accès Zustand centralisé
 */

import useSceneStore from '../sceneStore.js';
import { shallow } from 'zustand/shallow';

/**
 * Hook principal pour DebugPanel - Remplace tous les useState
 * 
 * AVANT Phase 2 (10+ useState dans DebugPanel):
 * - const [activeTab, setActiveTab] = useState('groups');
 * - const [exposure, setExposureState] = useState(1.7);
 * - const [globalThreshold, setGlobalThreshold] = useState(0.15);
 * - const [pbrSettings, setPbrSettings] = useState({...});
 * - etc.
 * 
 * APRÈS Phase 2 (1 hook Zustand):
 * - const { activeTab, setActiveTab, exposure, setExposure, ... } = useDebugPanelControls();
 */
export const useDebugPanelControls = () => {
  // Approche simplifiée : sélectionner uniquement les données nécessaires
  const activeTab = useSceneStore((state) => state.metadata.activeTab);
  const showDebug = useSceneStore((state) => state.metadata.showDebug);
  const isCollapsed = useSceneStore((state) => state.metadata.isCollapsed);
  const securityState = useSceneStore((state) => state.metadata.securityState);
  
  // Bloom state
  const bloom = useSceneStore((state) => state.bloom);
  const threshold = useSceneStore((state) => state.bloom.threshold);
  const strength = useSceneStore((state) => state.bloom.strength);
  const radius = useSceneStore((state) => state.bloom.radius);
  const bloomEnabled = useSceneStore((state) => state.bloom.enabled);
  
  // Actions (these don't change, so safe to get once)
  const actions = useSceneStore.getState();
  
  return {
    // UI State
    activeTab,
    showDebug,
    isCollapsed,
    securityState,
    
    // Bloom State
    bloom,
    threshold,
    strength,
    radius,
    bloomEnabled,
    
    // Actions (stable references)
    setActiveTab: actions.setActiveTab,
    setDebugVisibility: actions.setDebugVisibility,
    toggleDebugVisibility: actions.toggleDebugVisibility,
    toggleCollapsed: actions.toggleCollapsed,
    setBloomEnabled: actions.setBloomEnabled,
    setBloomGlobal: actions.setBloomGlobal,
    setBloomGroup: actions.setBloomGroup,
    resetBloom: actions.resetBloom,
    
    // Simple computed values (recalculated each time but stable)
    version: useSceneStore.getState().metadata.version,
    migrationPhase: useSceneStore.getState().metadata.migrationPhase
  };
};

// Simplified hooks for specific tabs to avoid infinite loops

/**
 * Hook optimisé pour onglet Bloom uniquement
 * Utilisé quand seuls les contrôles bloom sont nécessaires
 */
export const useBloomTabControls = () => useSceneStore((state) => ({
  bloom: state.bloom,
  setBloomEnabled: state.setBloomEnabled,
  setBloomGlobal: state.setBloomGlobal,
  setBloomGroup: state.setBloomGroup,
  resetBloom: state.resetBloom,
  
  // Valeurs directes pour performance
  threshold: state.bloom.threshold,
  strength: state.bloom.strength,
  radius: state.bloom.radius,
  enabled: state.bloom.enabled,
  
  // Groupes
  groups: state.bloom.groups
}), shallow);

/**
 * Hook optimisé pour onglet PBR uniquement - FIXED INFINITE LOOPS
 */
export const usePbrTabControls = () => {
  // Individual selectors to avoid infinite loops
  const pbr = useSceneStore((state) => state.pbr);
  const currentPreset = useSceneStore((state) => state.pbr.currentPreset);
  const ambientMultiplier = useSceneStore((state) => state.pbr.ambientMultiplier);
  const directionalMultiplier = useSceneStore((state) => state.pbr.directionalMultiplier);
  const hdrBoost = useSceneStore((state) => state.pbr.hdrBoost);
  const materialSettings = useSceneStore((state) => state.pbr.materialSettings);
  
  // Actions (stable references from getState)
  const actions = useSceneStore.getState();
  
  return {
    pbr,
    currentPreset,
    ambientMultiplier,
    directionalMultiplier,
    hdrBoost,
    materialSettings,
    
    // Stable action references
    setPbrPreset: actions.setPbrPreset,
    setPbrMultiplier: actions.setPbrMultiplier,
    setMaterialSetting: actions.setMaterialSetting,
    setHdrBoost: actions.setHdrBoost,
    toggleAdvancedLighting: actions.toggleAdvancedLighting, // ✅ NOUVEAU: Advanced Lighting
    resetPbr: actions.resetPbr
  };
};

/**
 * Hook optimisé pour onglet Lighting uniquement - FIXED INFINITE LOOPS
 */
export const useLightingTabControls = () => {
  // Individual selectors to avoid infinite loops
  const lighting = useSceneStore((state) => state.lighting);
  const exposure = useSceneStore((state) => state.lighting.exposure);
  // ❌ SUPPRIMÉ: ambient/directional (maintenant dans pbrSlice multipliers)
  const toneMapping = useSceneStore((state) => state.lighting.toneMapping);
  
  // Actions (stable references from getState)
  const actions = useSceneStore.getState();
  
  return {
    lighting,
    exposure,
    // ❌ SUPPRIMÉ: ambient, directional,
    toneMapping,
    
    // Stable action references
    setExposure: actions.setExposure,
    // ❌ SUPPRIMÉ: setAmbientLight, setDirectionalLight (maintenant dans pbrSlice)
    setToneMapping: actions.setToneMapping,
    resetLighting: actions.resetLighting
  };
};

/**
 * Hook optimisé pour onglet Background uniquement - FIXED INFINITE LOOPS
 */
export const useBackgroundTabControls = () => {
  // Individual selectors to avoid infinite loops
  const background = useSceneStore((state) => state.background);
  const backgroundType = useSceneStore((state) => state.background.type);
  const backgroundColor = useSceneStore((state) => state.background.color);
  const backgroundAlpha = useSceneStore((state) => state.background.alpha);
  const gradient = useSceneStore((state) => state.background.gradient);
  const environment = useSceneStore((state) => state.background.environment);
  
  // Actions (stable references from getState)
  const actions = useSceneStore.getState();
  
  return {
    background,
    backgroundType,
    backgroundColor,
    backgroundAlpha,
    gradient,
    environment,
    
    // Stable action references
    setBackgroundType: actions.setBackgroundType,
    setBackgroundColor: actions.setBackgroundColor,
    setBackgroundAlpha: actions.setBackgroundAlpha,
    setGradient: actions.setGradient,
    setGradientColors: actions.setGradientColors,
    setEnvironment: actions.setEnvironment,
    setEnvironmentIntensity: actions.setEnvironmentIntensity,
    resetBackground: actions.resetBackground,
    
    // Utility functions
    generateCssBackground: actions.generateCssBackground,
    getEffectiveBackgroundColor: actions.getEffectiveBackgroundColor
  };
};

/**
 * Hook minimal pour valeurs lecture seule (affichage sans actions)
 * Optimal pour composants qui affichent l'état sans le modifier
 */
export const useDebugPanelValues = () => useSceneStore((state) => ({
  bloom: state.bloom,
  pbr: state.pbr,
  lighting: state.lighting,
  background: state.background,
  currentPreset: state.metadata.currentPreset,
  securityState: state.metadata.securityState,
  performanceStats: state.metadata.performanceStats
}), shallow);

/**
 * Hook minimal pour actions uniquement (sans état)
 * Optimal pour composants qui modifient sans afficher
 */
export const useDebugPanelActions = () => useSceneStore((state) => ({
  // Bloom actions
  setBloomEnabled: state.setBloomEnabled,
  setBloomGlobal: state.setBloomGlobal,
  setBloomGroup: state.setBloomGroup,
  
  // PBR actions
  setPbrPreset: state.setPbrPreset,
  setPbrMultiplier: state.setPbrMultiplier,
  setHdrBoost: state.setHdrBoost,
  
  // Lighting actions
  setExposure: state.setExposure,
  // ❌ SUPPRIMÉ: setAmbientLight (maintenant dans pbrSlice)
  
  // UI actions
  setActiveTab: state.setActiveTab,
  setSecurityState: state.setSecurityState,
  
  // Global actions
  applyPreset: state.applyPreset,
  resetAll: state.resetAll
}), shallow);

/**
 * Hook de debugging avancé
 * Inclut toutes les fonctions de diagnostic et monitoring
 */
export const useDebugPanelDebug = () => useSceneStore((state) => ({
  // Debug utilities
  exportState: state.exportState,
  importState: state.importState,
  createDebugSnapshot: state.createDebugSnapshot,
  generateDebugReport: state.generateDebugReport,
  
  // Session info
  sessionStats: state.getSessionStats?.() || {},
  timeSinceModified: state.getTimeSinceLastModified?.() || 0,
  isSessionActive: state.isSessionActive?.() || false,
  
  // Store info
  version: state.metadata.version,
  migrationPhase: state.metadata.migrationPhase,
  storeSize: JSON.stringify(state).length,
  
  // Performance
  performanceStats: state.metadata.performanceStats,
  updatePerformanceStats: state.updatePerformanceStats
}), shallow);