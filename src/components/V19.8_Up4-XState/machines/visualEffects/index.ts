// 🎨 VisualEffectsMachine - Point d'entrée centralisé
// Exports pour la machine des effets visuels unifiée

// Machine principale
export { visualEffectsMachine } from './machine';
export { default as visualEffectsMachineWithConfig } from './machineWithConfig';

// Types
export * from './types';

// Services
export * as visualEffectsServices from './services';

// Actions
export * as visualEffectsActions from './actions';

// Guards
export * as visualEffectsGuards from './guards';

// Helpers
export {
  createVisualEffectsContext,
  isRegionInState,
  getGroupContext
} from './machine';

// Hooks
export { useVisualEffects, default as useVisualEffectsHook } from './useVisualEffects';
export type { UseVisualEffectsOptions } from './useVisualEffects';

// Re-exports pour compatibilité
export {
  default as VisualEffectsMachine,
  default as visualEffectsStateMachine
} from './machineWithConfig';