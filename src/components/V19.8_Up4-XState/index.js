// 🚀 Point d'entrée V19.7 - ZUSTAND MIGRATION ARCHITECTURE Phase 2
import V3Scene from './components/V3Scene.jsx';

// Export par défaut pour App.jsx (compatibilité)
export default V3Scene;

// === COMPOSANTS PRINCIPAUX ===
export { default as V3Scene } from './components/V3Scene.jsx';
export { default as Canvas3D } from './components/Canvas3D.jsx';

// === DEBUGPANEL - Phase 2 Migration ===
export { default as DebugPanel } from './components/DebugPanel.jsx'; // Legacy (Phase 1)

// === ZUSTAND STORE & HOOKS - Phase 2 ===
export { default as useSceneStore } from './stores/sceneStore.js';

// Hooks spécialisés DebugPanel
export {
  useDebugPanelControls,
  useBloomTabControls,
  usePbrTabControls,
  useLightingTabControls,
  useBackgroundTabControls,
  useDebugPanelValues,
  useDebugPanelActions,
  useDebugPanelDebug
} from './stores/hooks/useDebugPanelControls.js';

// Hooks presets
export {
  usePresetsControls
} from './stores/hooks/usePresetsControls.js';

// Hooks bloom (Phase 1 compatibilité)
export {
  useBloomControls,
  useBloomValues,
  useBloomActions
} from './stores/hooks/useBloomControls.js';

// Export des hooks Three.js pour usage avancé
export { useThreeScene } from './hooks/useThreeScene.js';
export { useRevealManager } from './hooks/useRevealManager.js';
export { useModelLoader } from './hooks/useModelLoader.js';
export { useRobotController } from './hooks/useRobotController.js';
export { useTriggerControls } from './hooks/useTriggerControls.js';
export { useCameraFitter } from './hooks/useCameraFitter.js';
export { useTempBloomSync } from './hooks/useTempBloomSync.js'; // Phase 2 sync

// Export des systèmes NOUVEAUX
export { AnimationController } from './systems/animationSystemes/index.js';
export { RevealationSystem } from './systems/revelationSystems/RevealationSystem.js';
export { BloomControlCenter } from './systems/bloomEffects/BloomControlCenter.js';
export { EyeRingRotationManager } from './systems/eyeSystems/EyeRingRotationManager.js';
// 🎯 NOUVEAU : Export du contrôleur central
export { SceneStateController } from './systems/stateController/index.js';
// ❌ SUPPRIMÉ : SecurityIRISManager (remplacé par BloomControlCenter)
// ❌ SUPPRIMÉ : DecorativeRingsBloomManager (remplacé par BloomControlCenter)

// Export de la configuration
export { V3_CONFIG } from './utils/config.js';
export { 
  RING_MATERIALS, 
  ARM_MATERIALS, 
  SECURITY_STATES,
  DECORATIVE_BLOOM_CONFIG,
  getMaterialType,
  createBloomMaterial,
  createSecurityMaterial
} from './utils/materials.js';

// Export des utilitaires
export {
  fitCameraToObject,
  createTriggerZone,
  createBloomMaterial as createBloomMaterialHelper,
  createSecurityMaterial as createSecurityMaterialHelper,
  analyzeBloomObjects
} from './utils/helpers.js';