# ⚡ **PHASE 2 : MIGRATION DEBUGPANEL COMPLÈTE**
**Durée Estimée : 4-5 heures**

---

## 🎯 **OBJECTIF PHASE 2**

Migrer intégralement DebugPanel vers Zustand, supprimant tous les useState et éliminant le props drilling. Cette phase transforme DebugPanel en consommateur pur du store Zustand.

---

## 📊 **ANALYSE PRÉ-MIGRATION**

### **État Actuel DebugPanel (10 useState identifiés) :**
```javascript
// ❌ À SUPPRIMER en Phase 2
const [activeTab, setActiveTab] = useState('groups');              // → metadataSlice
const [perfMonitorStats, setPerfMonitorStats] = useState({...});   // → performanceSlice  
const [exposure, setExposureState] = useState(1.7);               // → lightingSlice
const [globalThreshold, setGlobalThreshold] = useState(0.15);     // → bloomSlice ✅ Déjà fait Phase 1
const [globalBloomSettings, setGlobalBloomSettings] = useState(); // → bloomSlice ✅ Déjà fait Phase 1
const [bloomValues, setBloomValues] = useState({...});            // → bloomSlice ✅ Déjà fait Phase 1
const [backgroundSettings, setBackgroundSettings] = useState();   // → backgroundSlice
const [pbrSettings, setPbrSettings] = useState({...});            // → pbrSlice
const [materialSettings, setMaterialSettings] = useState({...});  // → pbrSlice
const [hdrBoostSettings, setHdrBoostSettings] = useState({...});  // → pbrSlice
```

### **Props Drilling Actuel (15+ props à éliminer) :**
```javascript
// ❌ V3Scene → DebugPanel props à supprimer
<DebugPanel 
  stateController={stateController}
  pbrLightingController={pbrLightingController}
  bloomSystem={bloomSystem}
  renderer={renderer}
  particleSystemController={particleSystemController}
  floatingSpace={floatingSpace}
  onColorBloomChange={onColorBloomChange}
  setExposure={setExposure}
  onSecurityStateChange={onSecurityStateChange}
  securityState={securityState}
  onTriggerTransition={onTriggerTransition}
  isTransitioning={isTransitioning}
  setBackground={setBackground}
  getBackground={getBackground}
  mouseControlMode={mouseControlMode}
  // ... et plus
/>
```

---

## 📋 **CHECKLIST DÉTAILLÉE PHASE 2**

### **✅ STEP 2.1 : Nouveaux Slices (60 min)**

#### **2.1.1 Créer pbrSlice.js :**
```javascript
// stores/slices/pbrSlice.js
export const createPbrSlice = (set, get) => ({
  pbr: {
    // Preset principal
    currentPreset: 'studioProPlus',
    
    // Multipliers
    ambientMultiplier: 1,
    directionalMultiplier: 1,
    customExposure: 1,
    
    // Matériaux
    materialSettings: {
      metalness: 0.3,
      roughness: 1,
      targetMaterials: ['all']
    },
    
    // HDR Boost
    hdrBoost: {
      enabled: false,
      multiplier: 2
    },
    
    // Area Lights
    areaLights: {
      enabled: false,
      intensity: 1,
      width: 10,
      height: 10
    }
  },
  
  // === ACTIONS PBR ===
  setPbrPreset: (presetName) => set((state) => ({
    pbr: { ...state.pbr, currentPreset: presetName }
  }), false, `setPbrPreset:${presetName}`),
  
  setPbrMultiplier: (type, value) => set((state) => ({
    pbr: { ...state.pbr, [`${type}Multiplier`]: value }
  }), false, `setPbrMultiplier:${type}:${value}`),
  
  setMaterialSetting: (setting, value) => set((state) => ({
    pbr: {
      ...state.pbr,
      materialSettings: { ...state.pbr.materialSettings, [setting]: value }
    }
  }), false, `setMaterialSetting:${setting}:${value}`),
  
  setHdrBoost: (enabled, multiplier = null) => set((state) => ({
    pbr: {
      ...state.pbr,
      hdrBoost: {
        enabled,
        multiplier: multiplier !== null ? multiplier : state.pbr.hdrBoost.multiplier
      }
    }
  }), false, `setHdrBoost:${enabled}:${multiplier}`),
  
  resetPbr: () => set((state) => ({
    pbr: {
      currentPreset: 'studioProPlus',
      ambientMultiplier: 1,
      directionalMultiplier: 1,
      customExposure: 1,
      materialSettings: { metalness: 0.3, roughness: 1, targetMaterials: ['all'] },
      hdrBoost: { enabled: false, multiplier: 2 },
      areaLights: { enabled: false, intensity: 1, width: 10, height: 10 }
    }
  }), false, 'resetPbr')
});
```

#### **2.1.2 Créer lightingSlice.js :**
```javascript
// stores/slices/lightingSlice.js
export const createLightingSlice = (set, get) => ({
  lighting: {
    // Ambient Light
    ambient: {
      color: 4210752,
      intensity: 3.5
    },
    
    // Directional Light  
    directional: {
      color: 16777215,
      intensity: 5,
      position: { x: 1, y: 2, z: 3 }
    },
    
    // Exposure
    exposure: 1.0,
    toneMapping: 5, // ACESFilmicToneMapping
    
    // Shadows
    shadows: {
      enabled: true,
      type: 'PCFSoft',
      mapSize: 2048,
      bias: -0.0001
    }
  },
  
  // === ACTIONS LIGHTING ===
  setExposure: (value) => set((state) => ({
    lighting: { ...state.lighting, exposure: value }
  }), false, `setExposure:${value}`),
  
  setAmbientLight: (property, value) => set((state) => ({
    lighting: {
      ...state.lighting,
      ambient: { ...state.lighting.ambient, [property]: value }
    }
  }), false, `setAmbientLight:${property}:${value}`),
  
  setDirectionalLight: (property, value) => set((state) => ({
    lighting: {
      ...state.lighting,
      directional: { ...state.lighting.directional, [property]: value }
    }
  }), false, `setDirectionalLight:${property}:${value}`),
  
  resetLighting: () => set((state) => ({
    lighting: {
      ambient: { color: 4210752, intensity: 3.5 },
      directional: { color: 16777215, intensity: 5, position: { x: 1, y: 2, z: 3 } },
      exposure: 1.0,
      toneMapping: 5,
      shadows: { enabled: true, type: 'PCFSoft', mapSize: 2048, bias: -0.0001 }
    }
  }), false, 'resetLighting')
});
```

#### **2.1.3 Créer backgroundSlice.js :**
```javascript
// stores/slices/backgroundSlice.js
export const createBackgroundSlice = (set, get) => ({
  background: {
    type: 'color', // 'color', 'transparent', 'environment'
    color: '#1a1a1a',
    alpha: 1.0,
    environment: null
  },
  
  // === ACTIONS BACKGROUND ===
  setBackgroundType: (type) => set((state) => ({
    background: { ...state.background, type }
  }), false, `setBackgroundType:${type}`),
  
  setBackgroundColor: (color) => set((state) => ({
    background: { ...state.background, color }
  }), false, `setBackgroundColor:${color}`),
  
  setBackgroundAlpha: (alpha) => set((state) => ({
    background: { ...state.background, alpha }
  }), false, `setBackgroundAlpha:${alpha}`),
  
  resetBackground: () => set((state) => ({
    background: { type: 'color', color: '#1a1a1a', alpha: 1.0, environment: null }
  }), false, 'resetBackground')
});
```

#### **2.1.4 Créer metadataSlice.js :**
```javascript
// stores/slices/metadataSlice.js
export const createMetadataSlice = (set, get) => ({
  metadata: {
    // UI State
    activeTab: 'groups',
    showDebug: true,
    
    // Security
    securityState: 'NORMAL',
    isTransitioning: false,
    
    // Presets
    currentPreset: null,
    lastPresetApplied: null,
    
    // Technical
    version: '1.0.0-phase2',
    lastModified: Date.now(),
    migrationPhase: 2,
    
    // Performance
    performanceStats: {
      fps: 60,
      frameTime: 16.67,
      renderCalls: 0,
      triangles: 0
    }
  },
  
  // === ACTIONS METADATA ===
  setActiveTab: (tab) => set((state) => ({
    metadata: { ...state.metadata, activeTab: tab }
  }), false, `setActiveTab:${tab}`),
  
  setSecurityState: (securityState) => set((state) => ({
    metadata: { 
      ...state.metadata, 
      securityState,
      lastModified: Date.now()
    }
  }), false, `setSecurityState:${securityState}`),
  
  setTransitioning: (isTransitioning) => set((state) => ({
    metadata: { ...state.metadata, isTransitioning }
  }), false, `setTransitioning:${isTransitioning}`),
  
  updatePerformanceStats: (stats) => set((state) => ({
    metadata: {
      ...state.metadata,
      performanceStats: { ...state.metadata.performanceStats, ...stats }
    }
  }), false, 'updatePerformanceStats'),
  
  setCurrentPreset: (presetName) => set((state) => ({
    metadata: {
      ...state.metadata,
      currentPreset: presetName,
      lastPresetApplied: presetName,
      lastModified: Date.now()
    }
  }), false, `setCurrentPreset:${presetName}`)
});
```

---

### **✅ STEP 2.2 : Store Principal Étendu (30 min)**

#### **2.2.1 Mettre à jour sceneStore.js :**
```javascript
// stores/sceneStore.js - Version Phase 2
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { createBloomSlice } from './slices/bloomSlice';
import { createPbrSlice } from './slices/pbrSlice';
import { createLightingSlice } from './slices/lightingSlice';
import { createBackgroundSlice } from './slices/backgroundSlice';
import { createMetadataSlice } from './slices/metadataSlice';
import { logger } from './middleware/logger';

const useSceneStore = create()(
  devtools(
    persist(
      logger((set, get, api) => ({
        // === TOUS LES SLICES PHASE 2 ===
        ...createBloomSlice(set, get, api),
        ...createPbrSlice(set, get, api),
        ...createLightingSlice(set, get, api),
        ...createBackgroundSlice(set, get, api),
        ...createMetadataSlice(set, get, api),
        
        // === ACTIONS GLOBALES ===
        applyPreset: (presetName, presetData) => {
          console.log(`🎯 Applying preset: ${presetName}`);
          
          set((state) => ({
            ...state,
            ...presetData,
            metadata: {
              ...state.metadata,
              currentPreset: presetName,
              lastPresetApplied: presetName,
              lastModified: Date.now()
            }
          }), false, `applyPreset:${presetName}`);
        },
        
        resetAll: () => {
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
              lastModified: Date.now()
            }
          }), false, 'resetAll');
        },
        
        // === UTILITIES ===
        exportState: () => {
          const state = get();
          return {
            bloom: state.bloom,
            pbr: state.pbr,
            lighting: state.lighting,
            background: state.background,
            metadata: {
              currentPreset: state.metadata.currentPreset,
              securityState: state.metadata.securityState,
              version: state.metadata.version
            }
          };
        },
        
        importState: (importedState) => {
          set((state) => ({
            ...state,
            ...importedState,
            metadata: {
              ...state.metadata,
              lastModified: Date.now(),
              currentPreset: importedState.metadata?.currentPreset || null
            }
          }), false, 'importState');
        }
      })),
      {
        name: 'v197-scene-storage-phase2',
        version: 2,
        partialize: (state) => ({
          bloom: state.bloom,
          pbr: state.pbr,
          lighting: state.lighting,
          background: state.background,
          metadata: {
            activeTab: state.metadata.activeTab,
            securityState: state.metadata.securityState,
            currentPreset: state.metadata.currentPreset
          }
        })
      }
    ),
    {
      name: 'V197-SceneStore-Phase2',
      enabled: process.env.NODE_ENV === 'development'
    }
  )
);

export default useSceneStore;
```

---

### **✅ STEP 2.3 : Hooks Spécialisés (45 min)**

#### **2.3.1 Créer useDebugPanelControls.js :**
```javascript
// stores/hooks/useDebugPanelControls.js
import useSceneStore from '../sceneStore';
import { shallow } from 'zustand/shallow';

/**
 * Hook principal pour DebugPanel - Remplace TOUS les useState
 */
export const useDebugPanelControls = () => {
  return useSceneStore(
    (state) => ({
      // === UI STATE ===
      activeTab: state.metadata.activeTab,
      setActiveTab: state.setActiveTab,
      
      // === BLOOM (Phase 1 étendu) ===
      bloom: state.bloom,
      setBloomEnabled: state.setBloomEnabled,
      setBloomGlobal: state.setBloomGlobal,
      setBloomGroup: state.setBloomGroup,
      resetBloom: state.resetBloom,
      
      // === PBR ===
      pbr: state.pbr,
      setPbrPreset: state.setPbrPreset,
      setPbrMultiplier: state.setPbrMultiplier,
      setMaterialSetting: state.setMaterialSetting,
      setHdrBoost: state.setHdrBoost,
      resetPbr: state.resetPbr,
      
      // === LIGHTING ===
      lighting: state.lighting,
      setExposure: state.setExposure,
      setAmbientLight: state.setAmbientLight,
      setDirectionalLight: state.setDirectionalLight,
      resetLighting: state.resetLighting,
      
      // === BACKGROUND ===
      background: state.background,
      setBackgroundType: state.setBackgroundType,
      setBackgroundColor: state.setBackgroundColor,
      setBackgroundAlpha: state.setBackgroundAlpha,
      resetBackground: state.resetBackground,
      
      // === SECURITY ===
      securityState: state.metadata.securityState,
      setSecurityState: state.setSecurityState,
      isTransitioning: state.metadata.isTransitioning,
      setTransitioning: state.setTransitioning,
      
      // === PRESETS ===
      currentPreset: state.metadata.currentPreset,
      applyPreset: state.applyPreset,
      
      // === GLOBAL ===
      resetAll: state.resetAll,
      exportState: state.exportState,
      importState: state.importState,
      
      // === PERFORMANCE ===
      performanceStats: state.metadata.performanceStats,
      updatePerformanceStats: state.updatePerformanceStats
    }),
    shallow
  );
};

/**
 * Hook optimisé pour onglets spécifiques
 */
export const useBloomTabControls = () => useSceneStore((state) => ({
  bloom: state.bloom,
  setBloomEnabled: state.setBloomEnabled,
  setBloomGlobal: state.setBloomGlobal,
  setBloomGroup: state.setBloomGroup,
  resetBloom: state.resetBloom
}), shallow);

export const usePbrTabControls = () => useSceneStore((state) => ({
  pbr: state.pbr,
  setPbrPreset: state.setPbrPreset,
  setPbrMultiplier: state.setPbrMultiplier,
  setMaterialSetting: state.setMaterialSetting,
  setHdrBoost: state.setHdrBoost,
  resetPbr: state.resetPbr
}), shallow);
```

#### **2.3.2 Créer usePresetsControls.js :**
```javascript
// stores/hooks/usePresetsControls.js
import useSceneStore from '../sceneStore';
import { shallow } from 'zustand/shallow';

/**
 * Hook dédié à la gestion des presets
 */
export const usePresetsControls = () => {
  return useSceneStore(
    (state) => ({
      currentPreset: state.metadata.currentPreset,
      lastPresetApplied: state.metadata.lastPresetApplied,
      applyPreset: state.applyPreset,
      exportState: state.exportState,
      importState: state.importState,
      
      // Vérification si état modifié depuis dernier preset
      isModifiedSincePreset: () => {
        const current = state.exportState();
        const lastModified = state.metadata.lastModified;
        // Logique à implémenter selon besoins
        return true;
      }
    }),
    shallow
  );
};
```

---

### **✅ STEP 2.4 : Migration DebugPanel (90 min)**

#### **2.4.1 DebugPanel - Suppression useState :**
```javascript
// components/DebugPanel.jsx - Version Phase 2
import React from 'react';
import { useDebugPanelControls } from '../stores/hooks/useDebugPanelControls';
import { usePresetsControls } from '../stores/hooks/usePresetsControls';
import { PRESET_REGISTRY } from '../utils/presets';

const DebugPanel = ({
  // ❌ SUPPRIMÉ - Plus aucune prop nécessaire!
  // stateController, pbrLightingController, bloomSystem, etc.
  
  // ✅ GARDÉ - Props non-state uniquement
  showDebug = true
}) => {
  // === REMPLACE TOUS LES useState ===
  const {
    // UI
    activeTab, setActiveTab,
    
    // Bloom
    bloom, setBloomEnabled, setBloomGlobal, setBloomGroup,
    
    // PBR  
    pbr, setPbrPreset, setPbrMultiplier, setMaterialSetting, setHdrBoost,
    
    // Lighting
    lighting, setExposure, setAmbientLight, setDirectionalLight,
    
    // Background
    background, setBackgroundType, setBackgroundColor,
    
    // Security
    securityState, setSecurityState, isTransitioning,
    
    // Global
    resetAll, exportState
  } = useDebugPanelControls();
  
  const {
    currentPreset, applyPreset
  } = usePresetsControls();
  
  // === HANDLERS SIMPLIFIÉS ===
  const handlePresetSelect = (presetKey) => {
    const preset = PRESET_REGISTRY[presetKey];
    if (preset) {
      applyPreset(presetKey, preset);
    }
  };
  
  const handleThresholdChange = (value) => {
    setBloomGlobal('threshold', parseFloat(value));
  };
  
  const handleExposureChange = (value) => {
    setExposure(parseFloat(value));
  };
  
  const handlePbrPresetChange = (presetName) => {
    setPbrPreset(presetName);
  };
  
  if (!showDebug) return null;
  
  return (
    <div style={{
      position: "absolute",
      top: "10px",
      right: "10px",
      width: "320px",
      background: "rgba(0, 0, 0, 0.9)",
      color: "white",
      padding: "15px",
      borderRadius: "8px",
      fontSize: "12px",
      maxHeight: "90vh",
      overflowY: "auto",
      zIndex: 1000
    }}>
      {/* ✅ HEADER AVEC PRESET ACTUEL */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '15px',
        borderBottom: '1px solid #333',
        paddingBottom: '10px'
      }}>
        <h3 style={{ margin: 0, color: '#4CAF50' }}>
          🎛️ Debug Panel V2 (Zustand)
        </h3>
        <div style={{ fontSize: '10px', color: '#888' }}>
          {currentPreset || 'No Preset'}
        </div>
      </div>
      
      {/* ✅ PRESETS DROPDOWN */}
      <select
        value=""
        onChange={(e) => e.target.value && handlePresetSelect(e.target.value)}
        style={{
          width: '100%',
          padding: '8px',
          marginBottom: '15px',
          background: '#333',
          color: 'white',
          border: '1px solid #555',
          borderRadius: '4px'
        }}
      >
        <option value="">🎯 Sélectionner un Preset</option>
        <optgroup label="🌑 Thème Dark">
          <option value="blanc_dark">⚪ Blanc (Normal)</option>
        </optgroup>
      </select>
      
      {/* ✅ TABS NAVIGATION */}
      <div style={{ 
        display: 'flex', 
        gap: '5px', 
        marginBottom: '15px',
        borderBottom: '1px solid #333'
      }}>
        {['groups', 'pbr', 'lighting', 'background'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '8px 12px',
              background: activeTab === tab ? '#4CAF50' : '#333',
              color: 'white',
              border: 'none',
              borderRadius: '4px 4px 0 0',
              fontSize: '10px',
              cursor: 'pointer'
            }}
          >
            {tab.toUpperCase()}
          </button>
        ))}
      </div>
      
      {/* ✅ TAB CONTENT - GROUPS */}
      {activeTab === 'groups' && (
        <div>
          <h4 style={{ color: '#4CAF50', margin: '0 0 10px 0' }}>
            🌟 Bloom Controls
          </h4>
          
          {/* Bloom Global */}
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>
              Threshold: {bloom.threshold.toFixed(2)}
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={bloom.threshold}
              onChange={(e) => handleThresholdChange(e.target.value)}
              style={{ width: '100%' }}
            />
          </div>
          
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>
              Strength: {bloom.strength.toFixed(2)}
            </label>
            <input
              type="range"
              min="0"
              max="2"
              step="0.01"
              value={bloom.strength}
              onChange={(e) => setBloomGlobal('strength', parseFloat(e.target.value))}
              style={{ width: '100%' }}
            />
          </div>
          
          {/* Bloom Groups */}
          <div style={{ marginBottom: '15px' }}>
            <h5 style={{ color: '#FF9800', margin: '0 0 10px 0' }}>👁️ Iris</h5>
            <div style={{ paddingLeft: '10px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>
                Strength: {bloom.groups.iris.strength.toFixed(2)}
              </label>
              <input
                type="range"
                min="0"
                max="2"
                step="0.01"
                value={bloom.groups.iris.strength}
                onChange={(e) => setBloomGroup('iris', 'strength', parseFloat(e.target.value))}
                style={{ width: '100%' }}
              />
            </div>
          </div>
        </div>
      )}
      
      {/* ✅ TAB CONTENT - PBR */}
      {activeTab === 'pbr' && (
        <div>
          <h4 style={{ color: '#FF9800', margin: '0 0 10px 0' }}>
            🎨 PBR Settings
          </h4>
          
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>
              Current Preset: {pbr.currentPreset}
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px' }}>
              <button onClick={() => handlePbrPresetChange('studioProPlus')}>
                Studio Pro+
              </button>
              <button onClick={() => handlePbrPresetChange('chromeShowcase')}>
                Chrome
              </button>
            </div>
          </div>
          
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>
              Ambient Multiplier: {pbr.ambientMultiplier.toFixed(1)}
            </label>
            <input
              type="range"
              min="0"
              max="10"
              step="0.1"
              value={pbr.ambientMultiplier}
              onChange={(e) => setPbrMultiplier('ambient', parseFloat(e.target.value))}
              style={{ width: '100%' }}
            />
          </div>
        </div>
      )}
      
      {/* ✅ TAB CONTENT - LIGHTING */}
      {activeTab === 'lighting' && (
        <div>
          <h4 style={{ color: '#FFD700', margin: '0 0 10px 0' }}>
            💡 Lighting Controls
          </h4>
          
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>
              Exposure: {lighting.exposure.toFixed(2)}
            </label>
            <input
              type="range"
              min="0"
              max="3"
              step="0.1"
              value={lighting.exposure}
              onChange={(e) => handleExposureChange(e.target.value)}
              style={{ width: '100%' }}
            />
          </div>
          
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>
              Ambient Intensity: {lighting.ambient.intensity.toFixed(1)}
            </label>
            <input
              type="range"
              min="0"
              max="10"
              step="0.1"
              value={lighting.ambient.intensity}
              onChange={(e) => setAmbientLight('intensity', parseFloat(e.target.value))}
              style={{ width: '100%' }}
            />
          </div>
        </div>
      )}
      
      {/* ✅ TAB CONTENT - BACKGROUND */}
      {activeTab === 'background' && (
        <div>
          <h4 style={{ color: '#9C27B0', margin: '0 0 10px 0' }}>
            🌈 Background Settings
          </h4>
          
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>
              Type: {background.type}
            </label>
            <select
              value={background.type}
              onChange={(e) => setBackgroundType(e.target.value)}
              style={{ width: '100%', padding: '5px' }}
            >
              <option value="color">Color</option>
              <option value="transparent">Transparent</option>
              <option value="environment">Environment</option>
            </select>
          </div>
          
          {background.type === 'color' && (
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>
                Color: {background.color}
              </label>
              <input
                type="color"
                value={background.color}
                onChange={(e) => setBackgroundColor(e.target.value)}
                style={{ width: '100%' }}
              />
            </div>
          )}
        </div>
      )}
      
      {/* ✅ FOOTER ACTIONS */}
      <div style={{ 
        borderTop: '1px solid #333',
        paddingTop: '10px',
        marginTop: '15px'
      }}>
        <div style={{ display: 'flex', gap: '5px' }}>
          <button
            onClick={resetAll}
            style={{
              flex: 1,
              padding: '8px',
              background: '#f44336',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '10px'
            }}
          >
            🔄 Reset All
          </button>
          <button
            onClick={() => {
              const state = exportState();
              console.log('📋 Exported state:', state);
              navigator.clipboard?.writeText(JSON.stringify(state, null, 2));
            }}
            style={{
              flex: 1,
              padding: '8px',
              background: '#2196F3',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '10px'
            }}
          >
            📋 Export
          </button>
        </div>
      </div>
    </div>
  );
};

export default DebugPanel;
```

---

### **✅ STEP 2.5 : Mise à jour V3Scene (30 min)**

#### **2.5.1 V3Scene - Suppression Props Drilling :**
```javascript
// components/V3Scene.jsx - Version Phase 2
const V3Scene = () => {
  // === GARDER SEULEMENT LES REFS SYSTÈME ===
  const sceneRef = useRef();
  const rendererRef = useRef();
  // ... autres refs

  // === SUPPRIMER TOUS LES useState UI ===
  // ❌ const [showDebug, setShowDebug] = useState(true);
  // ❌ const [securityState, setSecurityState] = useState('NORMAL');
  // etc.
  
  // === AJOUTER HOOK ZUSTAND MINIMAL ===
  const showDebug = useSceneStore((state) => state.metadata.showDebug);
  const securityState = useSceneStore((state) => state.metadata.securityState);
  
  return (
    <div className="scene-container">
      <Canvas3D 
        ref={rendererRef}
        sceneRef={sceneRef}
        // Plus de props state UI
      />
      
      {/* ✅ DEBUGPANEL SANS PROPS! */}
      <DebugPanel 
        showDebug={showDebug}
        // ❌ Supprimé 15+ props
      />
    </div>
  );
};
```

---

### **✅ STEP 2.6 : Tests & Validation (30 min)**

#### **2.6.1 Tests Fonctionnels :**
- [ ] Tous les contrôles DebugPanel fonctionnent
- [ ] Presets s'appliquent avec sync UI immédiate  
- [ ] Onglets switchent correctement
- [ ] Reset All remet à zéro tous les états
- [ ] Export/Import fonctionne

#### **2.6.2 Tests Performance :**
- [ ] Pas de re-renders excessifs (DevTools)
- [ ] Actions < 1ms d'exécution
- [ ] Mémoire stable après utilisation intensive

#### **2.6.3 Tests Régression :**
- [ ] Three.js rendering identique
- [ ] Aucune erreur console
- [ ] DevTools Redux fonctionnels

---

## 🎯 **CRITÈRES DE VALIDATION PHASE 2**

### **✅ Code Quality :**
- [ ] 0 useState résiduel dans DebugPanel
- [ ] Props DebugPanel < 3 (vs 15+ avant)
- [ ] Hooks Zustand utilisés partout
- [ ] DevTools configurés et fonctionnels

### **✅ Fonctionnalités :**
- [ ] 100% features DebugPanel préservées
- [ ] Presets appliquent instantanément
- [ ] Tous les contrôles synchronisés
- [ ] Performance égale ou supérieure

### **✅ Architecture :**
- [ ] Slices modulaires et cohérents
- [ ] Store centralisé fonctionnel
- [ ] Séparation claire responsabilités
- [ ] Patterns Zustand respectés

---

## 🚨 **TROUBLESHOOTING COURANTS**

### **Problème : Re-renders infinies**
```javascript
// Solution : shallow equality
const controls = useDebugPanelControls(shallow);
```

### **Problème : Actions ne se propagent pas**
```javascript
// Vérifier noms actions uniques
setBloomGlobal: (param, value) => set(..., false, `setBloomGlobal:${param}:${value}`)
```

### **Problème : Presets ne s'appliquent pas**
```javascript
// Vérifier structure preset match store
console.log('Store state:', useSceneStore.getState());
console.log('Preset data:', presetData);
```

---

## 📊 **MÉTRIQUES SUCCÈS PHASE 2**

- **-10 useState** supprimés DebugPanel ✅
- **-15 props** supprimées V3Scene → DebugPanel ✅  
- **-5 useEffect** synchronisation supprimés ✅
- **+4 slices** modulaires créés ✅
- **+100% preset sync** UI instantanée ✅

**Go/No-Go Phase 3 :** Validation complète avant migration systèmes Three.js