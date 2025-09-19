/**
 * 🎯 usePresetsControls - Hook spécialisé Phase 2
 * Gestion avancée des presets avec historique et validation
 */

import useSceneStore from '../sceneStore.js';
import { shallow } from 'zustand/shallow';
import { PRESET_REGISTRY } from '../../utils/presets.js';

/**
 * Hook dédié à la gestion complète des presets
 * Inclut application, historique, validation et utilitaires
 */
export const usePresetsControls = () => {
  // Approche simplifiée pour éviter les boucles infinies
  const currentPreset = useSceneStore((state) => state.metadata.currentPreset);
  const lastPresetApplied = useSceneStore((state) => state.metadata.lastPresetApplied);
  const isPresetModified = useSceneStore((state) => state.metadata.isPresetModified);
  const presetHistory = useSceneStore((state) => state.metadata.presetHistory);
  
  // Actions stables
  const actions = useSceneStore.getState();
  
  return {
    // État presets
    currentPreset,
    lastPresetApplied,
    isPresetModified,
    presetHistory,
    
    // Actions principales
    applyPreset: actions.applyPreset,
    clearCurrentPreset: actions.clearCurrentPreset,
    markPresetModified: actions.markPresetModified,
    
    // Export/Import
    exportState: actions.exportState,
    importState: actions.importState,
    
    // Helpers étendus
    getAvailablePresets: () => {
      return Object.entries(PRESET_REGISTRY).map(([key, preset]) => ({
        key,
        name: preset.name || key,
        description: preset.description || '',
        securityMode: preset.securityMode || null
      }));
    },
    
    isPresetActive: (presetName) => currentPreset === presetName,
    
    getPresetInfo: (presetName) => PRESET_REGISTRY[presetName] || null,
    
    // Application preset avec conversion legacy → Zustand
    applyLegacyPreset: (presetName) => {
      const legacyPreset = PRESET_REGISTRY[presetName];
      if (!legacyPreset) {
        console.warn(`❌ Preset not found: ${presetName}`);
        return false;
      }
      
      console.log(`🎨 Applying legacy preset: ${presetName}`, legacyPreset);
      
      try {
        // Appliquer Bloom
        if (legacyPreset.bloom) {
          actions.setBloomEnabled(legacyPreset.bloom.enabled ?? true);
          actions.setBloomGlobal('threshold', legacyPreset.bloom.threshold ?? 0);
          actions.setBloomGlobal('strength', legacyPreset.bloom.strength ?? 0.17);
          actions.setBloomGlobal('radius', legacyPreset.bloom.radius ?? 0.4);
        }
        
        // Appliquer les groupes bloom
        if (legacyPreset.bloomGroups) {
          Object.entries(legacyPreset.bloomGroups).forEach(([groupName, groupSettings]) => {
            if (groupSettings.threshold !== undefined) {
              actions.setBloomGroup(groupName, 'threshold', groupSettings.threshold);
            }
            if (groupSettings.strength !== undefined) {
              actions.setBloomGroup(groupName, 'strength', groupSettings.strength);
            }
            if (groupSettings.radius !== undefined) {
              actions.setBloomGroup(groupName, 'radius', groupSettings.radius);
            }
            if (groupSettings.emissiveIntensity !== undefined) {
              actions.setBloomGroup(groupName, 'emissiveIntensity', groupSettings.emissiveIntensity);
            }
          });
        }
        
        // Appliquer PBR
        if (legacyPreset.pbrPreset) {
          actions.setPbrPreset(legacyPreset.pbrPreset);
        }
        if (legacyPreset.pbrMultipliers) {
          if (legacyPreset.pbrMultipliers.ambientMultiplier !== undefined) {
            actions.setPbrMultiplier('ambient', legacyPreset.pbrMultipliers.ambientMultiplier);
          }
          if (legacyPreset.pbrMultipliers.directionalMultiplier !== undefined) {
            actions.setPbrMultiplier('directional', legacyPreset.pbrMultipliers.directionalMultiplier);
          }
        }
        
        // Appliquer Lighting
        if (legacyPreset.exposure !== undefined) {
          actions.setExposure(legacyPreset.exposure);
        }
        if (legacyPreset.ambient) {
          if (legacyPreset.ambient.color !== undefined) {
            actions.setAmbientLight('color', legacyPreset.ambient.color);
          }
          if (legacyPreset.ambient.intensity !== undefined) {
            actions.setAmbientLight('intensity', legacyPreset.ambient.intensity);
          }
        }
        if (legacyPreset.directional) {
          if (legacyPreset.directional.color !== undefined) {
            actions.setDirectionalLight('color', legacyPreset.directional.color);
          }
          if (legacyPreset.directional.intensity !== undefined) {
            actions.setDirectionalLight('intensity', legacyPreset.directional.intensity);
          }
        }
        
        // Appliquer Background
        if (legacyPreset.backgroundType) {
          actions.setBackgroundType(legacyPreset.backgroundType);
        }
        if (legacyPreset.background) {
          if (legacyPreset.background.color) {
            actions.setBackgroundColor(legacyPreset.background.color);
          }
          if (legacyPreset.background.alpha !== undefined) {
            actions.setBackgroundAlpha(legacyPreset.background.alpha);
          }
        }
        
        // Appliquer Security
        if (legacyPreset.securityMode) {
          actions.setSecurityMode(legacyPreset.securityMode);
        }
        
        // Mettre à jour les metadata
        actions.setCurrentPreset(presetName);
        
        console.log(`✅ Legacy preset ${presetName} applied successfully`);
        return true;
        
      } catch (error) {
        console.error(`❌ Failed to apply legacy preset ${presetName}:`, error);
        return false;
      }
    }
  };
};