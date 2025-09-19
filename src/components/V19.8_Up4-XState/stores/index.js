/**
 * 🎯 STORES - EXPORT PRINCIPAL
 * Phase 1 Foundation - Export centralisé pour Zustand store
 */

// Core store (always loaded)
export { default as useSceneStore } from './sceneStore.js';

// Hooks phase 1 (direct exports)
export { useBloomControls } from './hooks/useBloomControls.js';

// Version et métadonnées
export const STORE_VERSION = '1.0.0-phase1';
export const MIGRATION_PHASE = 1;