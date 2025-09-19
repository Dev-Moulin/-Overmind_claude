/**
 * 🏪 SCENE STORE - Phase 2 Complete
 * Store principal Zustand avec tous les slices + DevTools + Persistence
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { createBloomSlice } from './slices/bloomSlice.js';
import { createPbrSlice } from './slices/pbrSlice.js';
import { createLightingSlice } from './slices/lightingSlice.js';
import { createBackgroundSlice } from './slices/backgroundSlice.js';
import { createMetadataSlice } from './slices/metadataSlice.js';
import { createParticlesSlice } from './slices/particlesSlice.js';
import { createSecuritySlice } from './slices/securitySlice.js';
import { createMsaaSlice } from './slices/msaaSlice.js';
import { logger, useDebugLogger } from './middleware/logger.js';

/**
 * Store Zustand principal - Phase 2 Complete
 * Contient tous les slices nécessaires pour remplacer useState DebugPanel
 */
const useSceneStore = create()(
  devtools(
    persist(
      logger((set, get, api) => ({
        // === TOUS LES SLICES PHASE 2+ ===
        ...createBloomSlice(set, get, api),
        ...createPbrSlice(set, get, api),
        ...createLightingSlice(set, get, api),
        ...createBackgroundSlice(set, get, api),
        ...createMetadataSlice(set, get, api),
        ...createParticlesSlice(set, get, api),
        ...createSecuritySlice(set, get, api),
        ...createMsaaSlice(set, get, api),
        
        // === ACTIONS GLOBALES PHASE 2 ===
        
        /**
         * Appliquer preset complet (tous les domaines)
         */
        applyPreset: (presetName, presetData) => {
          console.log(`🎯 Applying complete preset: ${presetName}`);
          
          set((state) => {
            const newState = { ...state };
            
            // Appliquer bloom si présent
            if (presetData.bloom) {
              newState.bloom = { ...state.bloom, ...presetData.bloom };
            }
            
            // Appliquer bloomGroups si présent
            if (presetData.bloomGroups) {
              newState.bloom = {
                ...newState.bloom,
                groups: { ...newState.bloom.groups, ...presetData.bloomGroups }
              };
            }
            
            // Appliquer PBR si présent
            if (presetData.pbr) {
              newState.pbr = { ...state.pbr, ...presetData.pbr };
            }
            
            // Appliquer lighting si présent
            if (presetData.lighting || presetData.exposure || presetData.ambient || presetData.directional) {
              newState.lighting = { ...state.lighting };
              
              if (presetData.lighting) {
                Object.assign(newState.lighting, presetData.lighting);
              }
              if (presetData.exposure !== undefined) {
                newState.lighting.exposure = presetData.exposure;
              }
              if (presetData.ambient) {
                newState.lighting.ambient = { ...newState.lighting.ambient, ...presetData.ambient };
              }
              if (presetData.directional) {
                newState.lighting.directional = { ...newState.lighting.directional, ...presetData.directional };
              }
            }
            
            // Appliquer background si présent
            if (presetData.background) {
              newState.background = { ...state.background, ...presetData.background };
            }
            
            // Appliquer materials (vers bloom groups emissiveIntensity)
            if (presetData.materials?.groups) {
              Object.entries(presetData.materials.groups).forEach(([groupName, material]) => {
                if (newState.bloom.groups[groupName] && material.emissiveIntensity !== undefined) {
                  newState.bloom.groups[groupName].emissiveIntensity = material.emissiveIntensity;
                }
              });
            }
            
            // Update metadata
            newState.metadata = {
              ...state.metadata,
              currentPreset: presetName,
              lastPresetApplied: presetName,
              lastModified: Date.now(),
              isPresetModified: false
            };
            
            return newState;
          }, false, `applyPreset:${presetName}`);
        },
        
        /**
         * Reset complet de tous les stores
         */
        resetAll: () => {
          console.log('🔄 Resetting all store slices...');
          
          const actions = get();
          actions.resetBloom();
          actions.resetPbr();
          actions.resetLighting();
          actions.resetBackground();
          
          set((state) => ({
            ...state,
            metadata: {
              ...state.metadata,
              currentPreset: null,
              lastPresetApplied: null,
              isPresetModified: false,
              lastModified: Date.now()
            }
          }), false, 'resetAll');
        },
        
        /**
         * Export état complet pour sauvegarde
         */
        exportState: () => {
          const state = get();
          return {
            version: state.metadata.version,
            migrationPhase: state.metadata.migrationPhase,
            bloom: state.bloom,
            pbr: state.pbr,
            lighting: state.lighting,
            background: state.background,
            metadata: {
              currentPreset: state.metadata.currentPreset,
              securityState: state.metadata.securityState,
              activeTab: state.metadata.activeTab,
              userPreferences: state.metadata.userPreferences
            },
            exportedAt: new Date().toISOString()
          };
        },
        
        /**
         * Import état complet
         */
        importState: (importedState) => {
          console.log('📥 Importing complete state...', importedState);
          
          set((state) => ({
            ...state,
            bloom: importedState.bloom || state.bloom,
            pbr: importedState.pbr || state.pbr,
            lighting: importedState.lighting || state.lighting,
            background: importedState.background || state.background,
            metadata: {
              ...state.metadata,
              currentPreset: importedState.metadata?.currentPreset || null,
              securityState: importedState.metadata?.securityState || state.metadata.securityState,
              activeTab: importedState.metadata?.activeTab || state.metadata.activeTab,
              lastModified: Date.now(),
              imported: true
            }
          }), false, 'importState');
        },
        
        /**
         * 🔧 UTILITAIRE: Forcer reset reveal rings à l'état initial
         */
        forceResetRevealRings: () => {
          console.log('🔧 Forcing reveal rings reset to initial state');
          set((state) => ({
            bloom: {
              ...state.bloom,
              groups: {
                ...state.bloom.groups,
                revealRings: {
                  ...state.bloom.groups.revealRings,
                  forceVisible: false // Force à false
                }
              }
            }
          }), false, 'forceResetRevealRings');
        },

        /**
         * Créer snapshot pour debugging
         */
        createDebugSnapshot: () => {
          const state = get();
          const actions = get();
          
          return {
            timestamp: new Date().toISOString(),
            version: state.metadata.version,
            sessionStats: actions.getSessionStats(),
            performanceStats: state.metadata.performanceStats,
            storeSize: JSON.stringify(state).length,
            bloom: {
              enabled: state.bloom.enabled,
              threshold: state.bloom.threshold,
              strength: state.bloom.strength,
              groupsCount: Object.keys(state.bloom.groups).length
            },
            pbr: {
              currentPreset: state.pbr.currentPreset,
              hdrEnabled: state.pbr.hdrBoost.enabled
            },
            lighting: {
              exposure: state.lighting.exposure,
              ambientIntensity: state.lighting.ambient.intensity
            },
            ui: {
              activeTab: state.metadata.activeTab,
              currentPreset: state.metadata.currentPreset
            }
          };
        }
      })),
      {
        name: 'v197-scene-storage-phase2',
        version: 2,
        partialize: (state) => ({
          // Ne persister que les données importantes, pas les métadonnées techniques
          bloom: state.bloom,
          pbr: state.pbr,
          lighting: state.lighting,
          background: state.background,
          metadata: {
            activeTab: state.metadata.activeTab,
            securityState: state.metadata.securityState,
            currentPreset: state.metadata.currentPreset,
            userPreferences: state.metadata.userPreferences
          }
        }),
        // Configuration persistence
        migrate: (persistedState, version) => {
          console.log(`🔄 Migrating store from version ${version} to 2`);
          return persistedState;
        }
      }
    ),
    {
      name: 'V197-SceneStore-Phase2',
      enabled: typeof process !== 'undefined' && process.env?.NODE_ENV === 'development'
    }
  )
);

// === EXPOSITION GLOBALE POUR SYSTEMS ===
// Exposer store globalement pour RevealationSystem et autres
if (typeof window !== 'undefined') {
  window.useSceneStore = useSceneStore;
  window.debugSceneStore = useSceneStore;
}

// === SETUP DEBUG EN DÉVELOPPEMENT ===
if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'development') {
  // Hook debug logger automatique - seulement si dans un contexte React
  
  // Initialisation message
  console.log(
    '%c🚀 Zustand SceneStore Phase 1 Initialized',
    'color: #4CAF50; font-weight: bold; font-size: 14px;'
  );
  
  // Log état initial
  const initialState = useSceneStore.getState();
  console.log('📋 Initial state:', {
    version: initialState.metadata.version,
    bloomEnabled: initialState.bloom.enabled,
    bloomThreshold: initialState.bloom.threshold,
    groupsCount: Object.keys(initialState.bloom.groups).length
  });
  
  // Warning si DevTools pas disponibles
  if (!window.__REDUX_DEVTOOLS_EXTENSION__) {
    console.warn(
      '⚠️ Redux DevTools extension non détectée. Installer pour meilleur debugging.'
    );
  }
}

export default useSceneStore;