/**
 * 🌟 BLOOM SLICE - Phase 1 Foundation
 * Premier slice Zustand pour centraliser l'état des effets bloom
 */

/**
 * État initial bloom basé sur BLANC_DARK_PRESET
 */
const INITIAL_BLOOM_STATE = {
  // Bloom global
  enabled: true,
  threshold: 0.15,        // 🔧 CORRIGÉ: 0.15 au lieu de 0 pour avoir du bloom visible
  strength: 0.4,          // 🔧 CORRIGÉ: 0.4 au lieu de 0.17 pour plus d'effet
  radius: 0.4,
  
  // 🔧 ARCHITECTURE SIMPLIFIÉE : Bloom par groupes - SEULEMENT emissiveIntensity
  // ⚠️ SUPPRIMÉ: threshold/strength/radius (conflits avec bloom global)
  // ✅ CONSERVÉ: emissiveIntensity (fonctionne par matériau)
  groups: {
    iris: {
      emissive: '#00ff88',        // Couleur émissive par défaut (vert)
      emissiveIntensity: 0.6      // ✅ SEUL paramètre par groupe - pas de conflit
    },
    eyeRings: {
      emissive: '#00ff88',        // Couleur émissive par défaut (vert)
      emissiveIntensity: 0.45     // ✅ SEUL paramètre par groupe - pas de conflit
    },
    revealRings: {
      emissive: '#00ff88',        // Couleur émissive par défaut (vert)
      emissiveIntensity: 0.36,    // ✅ SEUL paramètre par groupe - pas de conflit
      forceVisible: false         // Contrôle visibilité reveal rings - INITIAL STATE: false = invisible
    },
    arms: {
      emissive: '#00ff88',        // Couleur émissive par défaut (vert)
      emissiveIntensity: 0.09     // ✅ SEUL paramètre par groupe - pas de conflit
    }
  }
};

/**
 * BLOOM SLICE - Actions et état
 */
export const createBloomSlice = (set, get) => ({
  bloom: INITIAL_BLOOM_STATE,
  
  // === ACTIONS BLOOM GLOBAL ===
  
  /**
   * Activer/désactiver bloom global
   */
  setBloomEnabled: (enabled) => set((state) => ({
    bloom: { ...state.bloom, enabled }
  }), false, `setBloomEnabled:${enabled}`),
  
  /**
   * Modifier paramètre bloom global
   */
  setBloomGlobal: (parameter, value) => set((state) => ({
    bloom: { ...state.bloom, [parameter]: value }
  }), false, `setBloomGlobal:${parameter}:${value}`),
  
  /**
   * Batch update paramètres bloom globaux
   */
  setBloomGlobalBatch: (updates) => set((state) => ({
    bloom: { ...state.bloom, ...updates }
  }), false, `setBloomGlobalBatch:${Object.keys(updates).join(',')}`),
  
  // === ACTIONS BLOOM GROUPES ===
  
  /**
   * Modifier paramètre d'un groupe bloom spécifique
   */
  setBloomGroup: (groupName, parameter, value) => set((state) => ({
    bloom: {
      ...state.bloom,
      groups: {
        ...state.bloom.groups,
        [groupName]: {
          ...state.bloom.groups[groupName],
          [parameter]: value
        }
      }
    }
  }), false, `setBloomGroup:${groupName}:${parameter}:${value}`),
  
  /**
   * Batch update paramètres d'un groupe
   */
  setBloomGroupBatch: (groupName, updates) => set((state) => ({
    bloom: {
      ...state.bloom,
      groups: {
        ...state.bloom.groups,
        [groupName]: {
          ...state.bloom.groups[groupName],
          ...updates
        }
      }
    }
  }), false, `setBloomGroupBatch:${groupName}:${Object.keys(updates).join(',')}`),
  
  /**
   * Reset un groupe à ses valeurs par défaut
   */
  resetBloomGroup: (groupName) => {
    const defaultGroup = INITIAL_BLOOM_STATE.groups[groupName];
    if (!defaultGroup) {
      console.warn(`❌ Group ${groupName} not found for reset`);
      return;
    }
    
    set((state) => ({
      bloom: {
        ...state.bloom,
        groups: {
          ...state.bloom.groups,
          [groupName]: { ...defaultGroup }
        }
      }
    }), false, `resetBloomGroup:${groupName}`);
  },

  /**
   * 🔧 NOUVEAU: Contrôler visibilité des reveal rings
   */
  setRevealRingsVisibility: (visible) => set((state) => ({
    bloom: {
      ...state.bloom,
      groups: {
        ...state.bloom.groups,
        revealRings: {
          ...state.bloom.groups.revealRings,
          forceVisible: visible
        }
      }
    }
  }), false, `setRevealRingsVisibility:${visible}`),
  
  // === ACTIONS AVANCÉES ===
  
  /**
   * Reset complet bloom à l'état initial
   */
  resetBloom: () => set(() => ({
    bloom: { ...INITIAL_BLOOM_STATE }
  }), false, 'resetBloom'),
  
  /**
   * Appliquer preset bloom (pour integration presets.js)
   */
  applyBloomPreset: (presetData) => {
    if (!presetData.bloom && !presetData.bloomGroups) {
      console.warn('❌ No bloom data in preset');
      return;
    }
    
    set((state) => {
      const newBloom = { ...state.bloom };
      
      // Appliquer bloom global
      if (presetData.bloom) {
        Object.assign(newBloom, presetData.bloom);
      }
      
      // Appliquer bloom groups
      if (presetData.bloomGroups) {
        newBloom.groups = {
          ...newBloom.groups,
          ...presetData.bloomGroups
        };
      }
      
      // Appliquer emissive intensities si disponibles
      if (presetData.materials?.groups) {
        Object.entries(presetData.materials.groups).forEach(([groupName, material]) => {
          if (newBloom.groups[groupName] && material.emissiveIntensity !== undefined) {
            newBloom.groups[groupName].emissiveIntensity = material.emissiveIntensity;
          }
        });
      }
      
      return { bloom: newBloom };
    }, false, 'applyBloomPreset');
  },
  
  /**
   * Obtenir état bloom pour export
   */
  getBloomState: () => {
    const state = get();
    return {
      bloom: state.bloom
    };
  },
  
  // === UTILITIES ===
  
  /**
   * 🔧 ARCHITECTURE SIMPLIFIÉE : Validation valeurs bloom
   * Supporte seulement les paramètres globaux + emissiveIntensity par groupe
   */
  validateBloomValues: (parameter, value) => {
    const validations = {
      // ✅ Paramètres bloom globaux (UnrealBloomPass)
      threshold: { min: 0, max: 1, type: 'number' },
      strength: { min: 0, max: 3, type: 'number' },
      radius: { min: 0, max: 2, type: 'number' },
      
      // ✅ Paramètre par groupe (matériau) - pas de conflit
      emissiveIntensity: { min: 0, max: 10, type: 'number' }
    };
    
    const rule = validations[parameter];
    if (!rule) return value; // Paramètre non validé
    
    if (rule.type === 'number') {
      const numValue = Number(value);
      if (isNaN(numValue)) return 0;
      return Math.max(rule.min, Math.min(rule.max, numValue));
    }
    
    return value;
  }
});