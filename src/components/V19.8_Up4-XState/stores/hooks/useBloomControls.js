/**
 * 🌟 BLOOM CONTROLS HOOK - Phase 1 Foundation
 * Hook optimisé pour contrôles bloom avec shallow equality
 */

import useSceneStore from '../sceneStore.js';
import { shallow } from 'zustand/shallow';

/**
 * Hook principal pour contrôles bloom
 * Utilise shallow equality pour éviter re-renders inutiles
 */
export const useBloomControls = () => {
  return useSceneStore((state) => ({
    // === ÉTAT BLOOM ===
    bloom: state.bloom,
    
    // === ACTIONS GLOBALES ===
    setBloomEnabled: state.setBloomEnabled,
    setBloomGlobal: state.setBloomGlobal,
    setBloomGlobalBatch: state.setBloomGlobalBatch,
    
    // === ACTIONS GROUPES ===
    setBloomGroup: state.setBloomGroup,
    setBloomGroupBatch: state.setBloomGroupBatch,
    resetBloomGroup: state.resetBloomGroup,
    
    // === ACTIONS AVANCÉES ===
    resetBloom: state.resetBloom,
    applyBloomPreset: state.applyBloomPreset,
    getBloomState: state.getBloomState,
    validateBloomValues: state.validateBloomValues
  }), shallow);
};

/**
 * Hook optimisé pour bloom global uniquement
 * Pour composants qui n'ont besoin que des contrôles globaux
 */
export const useBloomGlobalControls = () => {
  return useSceneStore((state) => ({
    enabled: state.bloom.enabled,
    threshold: state.bloom.threshold,
    strength: state.bloom.strength,
    radius: state.bloom.radius,
    
    setEnabled: state.setBloomEnabled,
    setThreshold: (value) => state.setBloomGlobal('threshold', value),
    setStrength: (value) => state.setBloomGlobal('strength', value),
    setRadius: (value) => state.setBloomGlobal('radius', value),
    
    setBatch: state.setBloomGlobalBatch
  }));
};

/**
 * Hook optimisé pour un groupe bloom spécifique
 * Évite re-renders quand autres groupes changent
 */
export const useBloomGroupControls = (groupName) => {
  return useSceneStore(
    (state) => {
      const group = state.bloom.groups[groupName];
      
      if (!group) {
        console.warn(`❌ Bloom group "${groupName}" not found`);
        return {
          threshold: 0,
          strength: 0,
          radius: 0,
          emissiveIntensity: 0,
          setThreshold: () => {},
          setStrength: () => {},
          setRadius: () => {},
          setEmissiveIntensity: () => {},
          setBatch: () => {},
          reset: () => {}
        };
      }
      
      return {
        threshold: group.threshold,
        strength: group.strength,
        radius: group.radius,
        emissiveIntensity: group.emissiveIntensity,
        
        setThreshold: (value) => state.setBloomGroup(groupName, 'threshold', value),
        setStrength: (value) => state.setBloomGroup(groupName, 'strength', value),
        setRadius: (value) => state.setBloomGroup(groupName, 'radius', value),
        setEmissiveIntensity: (value) => state.setBloomGroup(groupName, 'emissiveIntensity', value),
        
        setBatch: (updates) => state.setBloomGroupBatch(groupName, updates),
        reset: () => state.resetBloomGroup(groupName)
      };
    }
  );
};

/**
 * Hook pour statistiques bloom (calculées)
 * Memoized pour éviter recalculs inutiles
 */
export const useBloomStats = () => {
  return useSceneStore(
    (state) => {
      const { bloom } = state;
      
      // Calculs statistiques
      const activeGroups = Object.entries(bloom.groups).filter(
        ([, group]) => group.strength > 0
      );
      
      const averageThreshold = activeGroups.length > 0
        ? activeGroups.reduce((sum, [, group]) => sum + group.threshold, 0) / activeGroups.length
        : 0;
      
      const totalIntensity = bloom.strength + 
        activeGroups.reduce((sum, [, group]) => sum + (group.strength * group.emissiveIntensity || 0), 0);
      
      return {
        isEnabled: bloom.enabled,
        globalIntensity: bloom.strength * (1 - bloom.threshold),
        activeGroupsCount: activeGroups.length,
        totalGroupsCount: Object.keys(bloom.groups).length,
        averageThreshold: parseFloat(averageThreshold.toFixed(3)),
        totalIntensity: parseFloat(totalIntensity.toFixed(3)),
        isHighPerformanceMode: bloom.strength < 0.3 && bloom.threshold > 0.5,
        activeGroups: activeGroups.map(([name]) => name)
      };
    }
  );
};

/**
 * Hook pour debug bloom en développement
 */
export const useBloomDebug = () => {
  const store = useSceneStore();
  
  if (typeof process !== 'undefined' && process.env?.NODE_ENV !== 'development') {
    return {
      logBloomState: () => {},
      exportBloomState: () => {},
      validateAllBloom: () => true
    };
  }
  
  return {
    /**
     * Logger état bloom actuel
     */
    logBloomState: () => {
      const state = store.getState();
      console.group('🌟 Bloom State Debug');
      console.log('Global:', {
        enabled: state.bloom.enabled,
        threshold: state.bloom.threshold,
        strength: state.bloom.strength,
        radius: state.bloom.radius
      });
      console.log('Groups:', state.bloom.groups);
      console.groupEnd();
    },
    
    /**
     * Exporter état bloom pour copier/coller
     */
    exportBloomState: () => {
      const bloomState = store.getState().getBloomState();
      const json = JSON.stringify(bloomState, null, 2);
      navigator.clipboard?.writeText(json);
      console.log('📋 Bloom state exported to clipboard:', bloomState);
      return json;
    },
    
    /**
     * Valider tous les paramètres bloom
     */
    validateAllBloom: () => {
      const state = store.getState();
      const { validateBloomValues } = state;
      let isValid = true;
      
      // Validation global
      ['threshold', 'strength', 'radius'].forEach(param => {
        const validated = validateBloomValues(param, state.bloom[param]);
        if (validated !== state.bloom[param]) {
          console.warn(`❌ Invalid global ${param}: ${state.bloom[param]} → ${validated}`);
          isValid = false;
        }
      });
      
      // Validation groupes
      Object.entries(state.bloom.groups).forEach(([groupName, group]) => {
        Object.entries(group).forEach(([param, value]) => {
          const validated = validateBloomValues(param, value);
          if (validated !== value) {
            console.warn(`❌ Invalid ${groupName}.${param}: ${value} → ${validated}`);
            isValid = false;
          }
        });
      });
      
      if (isValid) {
        console.log('✅ All bloom values are valid');
      }
      
      return isValid;
    }
  };
};

/**
 * Hook minimal pour valeurs bloom seules (lecture seule)
 * Optimal pour composants qui affichent sans modifier
 */
export const useBloomValues = () => useSceneStore((state) => ({
  bloom: state.bloom,
  threshold: state.bloom.threshold,
  strength: state.bloom.strength,
  radius: state.bloom.radius,
  enabled: state.bloom.enabled,
  groups: state.bloom.groups
}), shallow);

/**
 * Hook minimal pour actions bloom seules (sans état)
 * Optimal pour composants qui modifient sans afficher
 */
export const useBloomActions = () => useSceneStore((state) => ({
  setBloomEnabled: state.setBloomEnabled,
  setBloomGlobal: state.setBloomGlobal,
  setBloomGroup: state.setBloomGroup,
  resetBloom: state.resetBloom,
  applyBloomPreset: state.applyBloomPreset
}), shallow);