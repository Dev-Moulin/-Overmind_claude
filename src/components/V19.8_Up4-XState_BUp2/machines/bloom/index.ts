// 🌟 BloomMachine - Atome B1 Export Index
// Point d'entrée centralisé pour BloomMachine

export { bloomMachine as default, bloomMachine } from './machine';
export * from './types';

// Export services avec alias pour éviter conflits
export {
  enableGlobalBloom,
  disableGlobalBloom,
  updateGroupBloom,
  applySecurityPreset,
  detectAndRegisterObjects as detectAndRegisterObjectsService,
  frameLoop,
  syncWithRenderer as syncWithRendererService,
  dispose as disposeService
} from './services';

// Export actions avec alias pour éviter conflits
export {
  updateGlobalParams,
  syncGlobalWithRenderer,
  updateGroupIris,
  updateGroupEyeRings,
  updateGroupRevealRings,
  updateGroupMagicRings,
  updateGroupArms,
  registerIrisObjects,
  registerEyeRingsObjects,
  registerRevealRingsObjects,
  registerMagicRingsObjects,
  registerArmsObjects,
  detectAndRegisterObjects as detectAndRegisterObjectsAction,
  syncWithFrameScheduler,
  syncWithRenderer as syncWithRendererAction,
  forceRefresh,
  notifySecurityTransition,
  dispose as disposeAction,
  logError
} from './actions';

export * from './guards';

// Export hook React
export { useBloomMachine, default as useBloomMachineHook } from './useBloomMachine';
export type { UseBloomMachineOptions } from './useBloomMachine';

// Re-export pour compatibilité
import { bloomMachine } from './machine';
export {
  bloomMachine as BloomMachine,
  bloomMachine as bloomStateMachine
};