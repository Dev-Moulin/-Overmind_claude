# 🚀 **PHASE 1 : STORE MINIMAL - TOUTES LES VALEURS V19.6**
**Durée estimée :** 1-2 heures

---

## 🎯 **OBJECTIF PHASE 1**

Créer un store Zustand contenant TOUTES les valeurs de V19.6 sans toucher au code fonctionnel existant.

---

## 📋 **STRUCTURE DU STORE UNIQUE**

### **debugPanelSlice.js - Structure complète V19.6**
```javascript
export const createDebugPanelSlice = (set, get) => ({
  // ==========================================
  // SECURITY MODE
  // ==========================================
  securityMode: 'SAFE', // SAFE | DANGER | WARNING | SCANNING | NORMAL
  
  // ==========================================
  // BLOOM GLOBAL
  // ==========================================
  globalThreshold: 0.3,
  exposure: 1.7,
  
  // ==========================================
  // BLOOM GROUPS (from V19.6 SAFE preset)
  // ==========================================
  bloomGroups: {
    iris: {
      strength: 0.3,
      radius: 0.5,
      emissiveIntensity: 7.13,
      emissive: '#FFD93D' // Color from SAFE preset
    },
    eyeRings: {
      strength: 0.3,
      radius: 0.5,
      emissiveIntensity: 9.93,
      emissive: '#FFD93D'
    },
    revealRings: {
      strength: 1.0,
      radius: 0.5,
      emissiveIntensity: 5.59,
      emissive: '#00ff88'
    }
  },
  
  // ==========================================
  // LIGHTING PRESETS & MULTIPLIERS
  // ==========================================
  lightingPreset: 'studioPro', // studioPro | studioProPlus
  ambientMultiplier: 49.425,   // From V19.6 SAFE preset
  directionalMultiplier: 2.365, // From V19.6 SAFE preset
  customExposureMultiplier: 1.0,
  
  // ==========================================
  // MATERIALS (PBR)
  // ==========================================
  metalness: 0.945,  // From V19.6 SAFE preset
  roughness: 1.0,    // From V19.6 SAFE preset
  
  // ==========================================
  // ADVANCED LIGHTING FEATURES
  // ==========================================
  advancedLighting: true,
  areaLights: true,
  hdrBoost: {
    enabled: true,
    multiplier: 1.85  // From V19.6 SAFE preset
  },
  
  // ==========================================
  // BACKGROUND
  // ==========================================
  background: {
    type: 'color',    // color | transparent | gradient (future)
    color: '#c0c2bc'  // From V19.6 SAFE preset
  },
  
  // ==========================================
  // MSAA (from V19.6)
  // ==========================================
  msaa: {
    enabled: true,
    samples: 4,
    fxaaEnabled: false
  },
  
  // ==========================================
  // GTAO (from V19.6)
  // ==========================================
  gtao: {
    enabled: false,
    radius: 0.5,
    thickness: 1.0,
    samples: 16
  },
  
  // ==========================================
  // ACTIONS - Simple setters for each value
  // ==========================================
  
  // Security Mode
  setSecurityMode: (mode) => set({ securityMode: mode }),
  
  // Bloom Global
  setGlobalThreshold: (value) => set({ globalThreshold: value }),
  setExposure: (value) => set({ exposure: value }),
  
  // Bloom Groups
  setBloomGroup: (groupName, property, value) => set((state) => ({
    bloomGroups: {
      ...state.bloomGroups,
      [groupName]: {
        ...state.bloomGroups[groupName],
        [property]: value
      }
    }
  })),
  
  // Lighting
  setLightingPreset: (preset) => set({ lightingPreset: preset }),
  setAmbientMultiplier: (value) => set({ ambientMultiplier: value }),
  setDirectionalMultiplier: (value) => set({ directionalMultiplier: value }),
  setCustomExposureMultiplier: (value) => set({ customExposureMultiplier: value }),
  
  // Materials
  setMetalness: (value) => set({ metalness: value }),
  setRoughness: (value) => set({ roughness: value }),
  
  // Advanced Features
  setAdvancedLighting: (enabled) => set({ advancedLighting: enabled }),
  setAreaLights: (enabled) => set({ areaLights: enabled }),
  setHDRBoost: (property, value) => set((state) => ({
    hdrBoost: {
      ...state.hdrBoost,
      [property]: value
    }
  })),
  
  // Background
  setBackground: (property, value) => set((state) => ({
    background: {
      ...state.background,
      [property]: value
    }
  })),
  
  // MSAA
  setMSAA: (property, value) => set((state) => ({
    msaa: {
      ...state.msaa,
      [property]: value
    }
  })),
  
  // GTAO
  setGTAO: (property, value) => set((state) => ({
    gtao: {
      ...state.gtao,
      [property]: value
    }
  })),
  
  // ==========================================
  // UTILITY ACTIONS
  // ==========================================
  
  // Apply security preset (colors and values from V19.6)
  applySecurityPreset: (mode) => {
    const presets = {
      SAFE: {
        bloomGroups: {
          iris: { emissive: '#FFD93D', emissiveIntensity: 7.13 },
          eyeRings: { emissive: '#FFD93D', emissiveIntensity: 9.93 },
          revealRings: { emissive: '#00ff88', emissiveIntensity: 5.59 }
        },
        ambientMultiplier: 49.425,
        directionalMultiplier: 2.365,
        metalness: 0.945,
        roughness: 1.0,
        hdrBoost: { enabled: true, multiplier: 1.85 },
        background: { color: '#c0c2bc' }
      },
      DANGER: {
        bloomGroups: {
          iris: { emissive: '#ff0000', emissiveIntensity: 8.0 },
          eyeRings: { emissive: '#ff0000', emissiveIntensity: 10.0 },
          revealRings: { emissive: '#ff4444', emissiveIntensity: 6.0 }
        },
        ambientMultiplier: 30.0,
        directionalMultiplier: 4.0,
        metalness: 0.8,
        roughness: 0.9,
        hdrBoost: { enabled: true, multiplier: 2.0 },
        background: { color: '#1a0000' }
      },
      WARNING: {
        bloomGroups: {
          iris: { emissive: '#ff8800', emissiveIntensity: 7.5 },
          eyeRings: { emissive: '#ff8800', emissiveIntensity: 9.5 },
          revealRings: { emissive: '#ffaa00', emissiveIntensity: 5.8 }
        },
        ambientMultiplier: 40.0,
        directionalMultiplier: 3.0,
        metalness: 0.9,
        roughness: 0.95,
        hdrBoost: { enabled: true, multiplier: 1.9 },
        background: { color: '#1a1400' }
      },
      SCANNING: {
        bloomGroups: {
          iris: { emissive: '#0088ff', emissiveIntensity: 7.0 },
          eyeRings: { emissive: '#0088ff', emissiveIntensity: 9.0 },
          revealRings: { emissive: '#4488ff', emissiveIntensity: 5.5 }
        },
        ambientMultiplier: 35.0,
        directionalMultiplier: 2.8,
        metalness: 0.92,
        roughness: 0.98,
        hdrBoost: { enabled: true, multiplier: 1.88 },
        background: { color: '#001a1a' }
      },
      NORMAL: {
        bloomGroups: {
          iris: { emissive: '#ffffff', emissiveIntensity: 5.0 },
          eyeRings: { emissive: '#ffffff', emissiveIntensity: 7.0 },
          revealRings: { emissive: '#ffffff', emissiveIntensity: 4.0 }
        },
        ambientMultiplier: 45.0,
        directionalMultiplier: 2.0,
        metalness: 0.95,
        roughness: 1.0,
        hdrBoost: { enabled: true, multiplier: 1.8 },
        background: { color: '#1a1a1a' }
      }
    };
    
    const preset = presets[mode];
    if (preset) {
      set((state) => ({
        securityMode: mode,
        bloomGroups: {
          ...state.bloomGroups,
          ...Object.entries(preset.bloomGroups).reduce((acc, [group, values]) => ({
            ...acc,
            [group]: { ...state.bloomGroups[group], ...values }
          }), {})
        },
        ambientMultiplier: preset.ambientMultiplier,
        directionalMultiplier: preset.directionalMultiplier,
        metalness: preset.metalness,
        roughness: preset.roughness,
        hdrBoost: preset.hdrBoost,
        background: { ...state.background, ...preset.background }
      }));
    }
  },
  
  // Export current configuration
  exportConfig: () => {
    const state = get();
    return {
      securityMode: state.securityMode,
      globalThreshold: state.globalThreshold,
      exposure: state.exposure,
      bloomGroups: state.bloomGroups,
      lightingPreset: state.lightingPreset,
      ambientMultiplier: state.ambientMultiplier,
      directionalMultiplier: state.directionalMultiplier,
      customExposureMultiplier: state.customExposureMultiplier,
      metalness: state.metalness,
      roughness: state.roughness,
      advancedLighting: state.advancedLighting,
      areaLights: state.areaLights,
      hdrBoost: state.hdrBoost,
      background: state.background,
      msaa: state.msaa,
      gtao: state.gtao,
      timestamp: new Date().toISOString()
    };
  },
  
  // Import configuration
  importConfig: (config) => {
    set((state) => ({
      ...state,
      ...config,
      timestamp: undefined // Don't import timestamp
    }));
  }
});
```

---

## 📂 **FICHIERS À CRÉER**

### **1. sceneStore.js**
```javascript
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { createDebugPanelSlice } from './slices/debugPanelSlice';

const useSceneStore = create()(
  devtools(
    (set, get) => ({
      ...createDebugPanelSlice(set, get)
    }),
    {
      name: 'V19.7-DebugPanel-Store'
    }
  )
);

// Expose globally for system access (like V19.6)
if (typeof window !== 'undefined') {
  window.useSceneStore = useSceneStore;
}

export default useSceneStore;
```

### **2. Hook d'accès simplifié**
```javascript
// hooks/useDebugPanelStore.js
import useSceneStore from '../sceneStore';

export const useDebugPanelStore = () => {
  return useSceneStore((state) => state);
};

// Sélecteurs optimisés pour éviter re-renders
export const useSecurityMode = () => useSceneStore((state) => state.securityMode);
export const useBloomGroups = () => useSceneStore((state) => state.bloomGroups);
export const useLightingSettings = () => useSceneStore((state) => ({
  preset: state.lightingPreset,
  ambient: state.ambientMultiplier,
  directional: state.directionalMultiplier
}));
```

---

## ✅ **VALIDATION PHASE 1**

### **Tests à effectuer :**
1. **Store accessible** : `window.useSceneStore.getState()` affiche toutes les valeurs
2. **DevTools fonctionnels** : Redux DevTools montre le state
3. **Actions fonctionnent** : `useSceneStore.getState().setSecurityMode('DANGER')` change la valeur
4. **Export/Import** : Les configurations peuvent être exportées et importées

### **Commandes de test dans la console :**
```javascript
// Test 1: Voir l'état complet
console.log(window.useSceneStore.getState());

// Test 2: Changer security mode
window.useSceneStore.getState().setSecurityMode('DANGER');

// Test 3: Modifier bloom group
window.useSceneStore.getState().setBloomGroup('iris', 'emissiveIntensity', 10);

// Test 4: Export config
const config = window.useSceneStore.getState().exportConfig();
console.log(JSON.stringify(config, null, 2));
```

---

## 🎯 **RÉSULTAT ATTENDU**

À la fin de la Phase 1 :
- ✅ Un store Zustand contenant TOUTES les valeurs V19.6
- ✅ Aucune modification du code existant
- ✅ Possibilité de lire/modifier toutes les valeurs via le store
- ✅ Export/Import des configurations fonctionnel
- ✅ Base solide pour Phase 2 (connexion avec systèmes existants)