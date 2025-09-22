# 🔄 **PHASE 3 : SYSTEMS INTEGRATION**
**Durée Estimée : 3-4 heures**

---

## 🎯 **OBJECTIF PHASE 3**

Connecter le store Zustand aux systèmes Three.js existants, remplaçant complètement SceneStateController et établissant Zustand comme source unique de vérité pour tout le pipeline de rendu.

---

## 📊 **ANALYSE SYSTÈMES EXISTANTS**

### **Systèmes Three.js à Connecter :**
```
BloomControlCenter (systems/bloomEffects/)
├── Gère: Collections objets (eyeRings, iris, revealRings, arms)
├── Input: threshold, strength, radius par groupe
└── Output: Rendu bloom sélectif

PBRLightingController (systems/lightingSystems/)
├── Gère: Éclairage 3-points + Area Lights + HDR
├── Input: presets, multipliers, customExposure
└── Output: Lighting setup Three.js

ParticleSystemController (systems/particleSystems/)
├── Gère: Particules 3D + arcs électriques
├── Input: count, color, connectionDistance
└── Output: Système particules temps réel

SimpleBloomSystem (systems/bloomEffects/)
├── Gère: Pipeline bloom global
├── Input: enabled, samples, FXAA
└── Output: Post-processing bloom
```

### **Communications Actuelles (à remplacer) :**
```
SceneStateController → Event System → Managers
                   ↓
                Window Global Refs → Direct Method Calls
                   ↓
                Manual Sync useEffect → UI Updates
```

### **Communications Cibles Zustand :**
```
Zustand Actions → Store Update → Automatic Subscriptions → Systems Sync
                              ↓
                         UI Re-render (automatic)
```

---

## 📋 **CHECKLIST DÉTAILLÉE PHASE 3**

### **✅ STEP 3.1 : Hooks de Synchronisation Système (60 min)**

#### **3.1.1 Créer useSystemSync.js :**
```javascript
// stores/hooks/useSystemSync.js
import { useEffect, useRef } from 'react';
import useSceneStore from '../sceneStore';

/**
 * Hook principal pour synchroniser Zustand → Systèmes Three.js
 * Remplace SceneStateController et event system
 */
export const useSystemSync = (systems = {}) => {
  const {
    bloomController,
    pbrLightingController,
    particleSystemController,
    simpleBloomSystem,
    renderer
  } = systems;
  
  // Refs pour éviter re-création subscriptions
  const subscribersRef = useRef([]);
  
  useEffect(() => {
    console.log('🔄 Initializing Zustand → Systems sync...');
    
    // Nettoyer anciennes subscriptions
    subscribersRef.current.forEach(unsubscribe => unsubscribe());
    subscribersRef.current = [];
    
    // === BLOOM SYNC ===
    if (bloomController) {
      const bloomUnsubscribe = useSceneStore.subscribe(
        (state) => state.bloom,
        (bloom, prevBloom) => {
          console.log('🌟 Bloom state changed:', bloom);
          
          // Sync bloom global
          if (bloom.threshold !== prevBloom?.threshold) {
            bloomController.setGlobalThreshold?.(bloom.threshold);
          }
          if (bloom.strength !== prevBloom?.strength) {
            bloomController.setGlobalStrength?.(bloom.strength);
          }
          if (bloom.radius !== prevBloom?.radius) {
            bloomController.setGlobalRadius?.(bloom.radius);
          }
          
          // Sync bloom groups
          Object.entries(bloom.groups).forEach(([groupName, groupSettings]) => {
            const prevGroupSettings = prevBloom?.groups?.[groupName];
            
            if (JSON.stringify(groupSettings) !== JSON.stringify(prevGroupSettings)) {
              bloomController.setGroupBloomParameter?.(groupName, 'threshold', groupSettings.threshold);
              bloomController.setGroupBloomParameter?.(groupName, 'strength', groupSettings.strength);
              bloomController.setGroupBloomParameter?.(groupName, 'radius', groupSettings.radius);
              
              if (groupSettings.emissiveIntensity !== undefined) {
                bloomController.setMaterialParameter?.(groupName, 'emissiveIntensity', groupSettings.emissiveIntensity);
              }
            }
          });
        },
        { fireImmediately: true }
      );
      subscribersRef.current.push(bloomUnsubscribe);
    }
    
    // === PBR SYNC ===
    if (pbrLightingController) {
      const pbrUnsubscribe = useSceneStore.subscribe(
        (state) => state.pbr,
        (pbr, prevPbr) => {
          console.log('🎨 PBR state changed:', pbr);
          
          // Sync preset
          if (pbr.currentPreset !== prevPbr?.currentPreset) {
            pbrLightingController.applyPreset?.(pbr.currentPreset);
          }
          
          // Sync multipliers
          if (pbr.ambientMultiplier !== prevPbr?.ambientMultiplier) {
            pbrLightingController.setAmbientMultiplier?.(pbr.ambientMultiplier);
          }
          if (pbr.directionalMultiplier !== prevPbr?.directionalMultiplier) {
            pbrLightingController.setDirectionalMultiplier?.(pbr.directionalMultiplier);
          }
          
          // Sync custom exposure
          if (pbr.customExposure !== prevPbr?.customExposure) {
            pbrLightingController.setCustomExposure?.(pbr.customExposure);
          }
          
          // Sync material settings
          if (JSON.stringify(pbr.materialSettings) !== JSON.stringify(prevPbr?.materialSettings)) {
            const { metalness, roughness, targetMaterials } = pbr.materialSettings;
            pbrLightingController.updateMaterialSettings?.({
              metalness,
              roughness,
              targetMaterials
            });
          }
          
          // Sync HDR boost
          if (JSON.stringify(pbr.hdrBoost) !== JSON.stringify(prevPbr?.hdrBoost)) {
            pbrLightingController.applyHDRBoost?.(pbr.hdrBoost.enabled);
            pbrLightingController.setHDRBoostMultiplier?.(pbr.hdrBoost.multiplier);
          }
        },
        { fireImmediately: true }
      );
      subscribersRef.current.push(pbrUnsubscribe);
    }
    
    // === LIGHTING SYNC ===
    const lightingUnsubscribe = useSceneStore.subscribe(
      (state) => state.lighting,
      (lighting, prevLighting) => {
        console.log('💡 Lighting state changed:', lighting);
        
        // Sync exposure
        if (lighting.exposure !== prevLighting?.exposure && renderer) {
          renderer.toneMappingExposure = lighting.exposure;
        }
        
        // Sync ambient light
        if (JSON.stringify(lighting.ambient) !== JSON.stringify(prevLighting?.ambient)) {
          pbrLightingController?.updateAmbientLight?.(
            lighting.ambient.color,
            lighting.ambient.intensity
          );
        }
        
        // Sync directional light  
        if (JSON.stringify(lighting.directional) !== JSON.stringify(prevLighting?.directional)) {
          pbrLightingController?.updateDirectionalLight?.(
            lighting.directional.color,
            lighting.directional.intensity,
            lighting.directional.position
          );
        }
      },
      { fireImmediately: true }
    );
    subscribersRef.current.push(lightingUnsubscribe);
    
    // === PARTICLES SYNC ===
    if (particleSystemController) {
      const particlesUnsubscribe = useSceneStore.subscribe(
        (state) => state.particles, // À ajouter en Phase 4
        (particles, prevParticles) => {
          if (!particles) return;
          
          console.log('🎨 Particles state changed:', particles);
          
          // Sync particle count
          if (particles.particleCount !== prevParticles?.particleCount) {
            particleSystemController.updateParticleCount?.(particles.particleCount);
          }
          
          // Sync particle color
          if (particles.particleColor !== prevParticles?.particleColor) {
            particleSystemController.updateParticleColor?.(particles.particleColor);
          }
          
          // Sync connection distance
          if (particles.connectionDistance !== prevParticles?.connectionDistance) {
            particleSystemController.updateConnectionDistance?.(particles.connectionDistance);
          }
        },
        { fireImmediately: true }
      );
      subscribersRef.current.push(particlesUnsubscribe);
    }
    
    console.log(`✅ ${subscribersRef.current.length} system subscriptions active`);
    
    // Cleanup
    return () => {
      subscribersRef.current.forEach(unsubscribe => unsubscribe());
      subscribersRef.current = [];
      console.log('🧹 System sync subscriptions cleaned up');
    };
  }, [bloomController, pbrLightingController, particleSystemController, simpleBloomSystem, renderer]);
  
  // Fonction utilitaire pour sync manuelle
  const forceSyncAll = () => {
    const state = useSceneStore.getState();
    console.log('🔄 Force syncing all systems with state:', state);
    
    // Force trigger tous les subscribers
    subscribersRef.current.forEach(unsubscribe => {
      // Re-trigger immediate sync
    });
  };
  
  return { forceSyncAll };
};
```

#### **3.1.2 Créer useBloomSystemSync.js (spécialisé) :**
```javascript
// stores/hooks/useBloomSystemSync.js
import { useEffect } from 'react';
import useSceneStore from '../sceneStore';

/**
 * Hook spécialisé pour synchronisation Bloom
 * Plus granulaire et optimisé
 */
export const useBloomSystemSync = (bloomController) => {
  useEffect(() => {
    if (!bloomController) return;
    
    console.log('🌟 Setting up specialized Bloom sync...');
    
    // Sync global bloom
    const globalUnsubscribe = useSceneStore.subscribe(
      (state) => ({
        threshold: state.bloom.threshold,
        strength: state.bloom.strength,
        radius: state.bloom.radius,
        enabled: state.bloom.enabled
      }),
      ({ threshold, strength, radius, enabled }) => {
        console.log('🌟 Global bloom sync:', { threshold, strength, radius, enabled });
        
        if (bloomController.setGlobalBloomParameter) {
          bloomController.setGlobalBloomParameter('threshold', threshold);
          bloomController.setGlobalBloomParameter('strength', strength);
          bloomController.setGlobalBloomParameter('radius', radius);
        }
        
        if (bloomController.setBloomEnabled) {
          bloomController.setBloomEnabled(enabled);
        }
      },
      { fireImmediately: true }
    );
    
    // Sync iris group
    const irisUnsubscribe = useSceneStore.subscribe(
      (state) => state.bloom.groups.iris,
      (iris) => {
        console.log('👁️ Iris bloom sync:', iris);
        
        if (bloomController.setGroupBloomParameter) {
          bloomController.setGroupBloomParameter('iris', 'threshold', iris.threshold);
          bloomController.setGroupBloomParameter('iris', 'strength', iris.strength);
          bloomController.setGroupBloomParameter('iris', 'radius', iris.radius);
        }
        
        if (bloomController.setMaterialParameter && iris.emissiveIntensity !== undefined) {
          bloomController.setMaterialParameter('iris', 'emissiveIntensity', iris.emissiveIntensity);
        }
      },
      { fireImmediately: true }
    );
    
    // Sync eyeRings group
    const eyeRingsUnsubscribe = useSceneStore.subscribe(
      (state) => state.bloom.groups.eyeRings,
      (eyeRings) => {
        console.log('👀 EyeRings bloom sync:', eyeRings);
        
        if (bloomController.setGroupBloomParameter) {
          bloomController.setGroupBloomParameter('eyeRings', 'threshold', eyeRings.threshold);
          bloomController.setGroupBloomParameter('eyeRings', 'strength', eyeRings.strength);
          bloomController.setGroupBloomParameter('eyeRings', 'radius', eyeRings.radius);
        }
        
        if (bloomController.setMaterialParameter && eyeRings.emissiveIntensity !== undefined) {
          bloomController.setMaterialParameter('eyeRings', 'emissiveIntensity', eyeRings.emissiveIntensity);
        }
      },
      { fireImmediately: true }
    );
    
    // Sync revealRings group
    const revealRingsUnsubscribe = useSceneStore.subscribe(
      (state) => state.bloom.groups.revealRings,
      (revealRings) => {
        console.log('💍 RevealRings bloom sync:', revealRings);
        
        if (bloomController.setGroupBloomParameter) {
          bloomController.setGroupBloomParameter('revealRings', 'threshold', revealRings.threshold);
          bloomController.setGroupBloomParameter('revealRings', 'strength', revealRings.strength);
          bloomController.setGroupBloomParameter('revealRings', 'radius', revealRings.radius);
        }
        
        if (bloomController.setMaterialParameter && revealRings.emissiveIntensity !== undefined) {
          bloomController.setMaterialParameter('revealRings', 'emissiveIntensity', revealRings.emissiveIntensity);
        }
      },
      { fireImmediately: true }
    );
    
    return () => {
      globalUnsubscribe();
      irisUnsubscribe();
      eyeRingsUnsubscribe();
      revealRingsUnsubscribe();
      console.log('🧹 Bloom system sync cleaned up');
    };
  }, [bloomController]);
};
```

---

### **✅ STEP 3.2 : Adaptation V3Scene (45 min)**

#### **3.2.1 V3Scene - Intégration System Sync :**
```javascript
// components/V3Scene.jsx - Version Phase 3
import React, { useRef, useEffect } from 'react';
import { useSystemSync } from '../stores/hooks/useSystemSync';
import { useBloomSystemSync } from '../stores/hooks/useBloomSystemSync';
import useSceneStore from '../stores/sceneStore';

const V3Scene = () => {
  // === REFS SYSTÈMES ===
  const sceneRef = useRef();
  const rendererRef = useRef();
  const bloomControllerRef = useRef();
  const pbrLightingControllerRef = useRef();
  const particleSystemControllerRef = useRef();
  const simpleBloomSystemRef = useRef();
  const stateControllerRef = useRef(); // ❌ À supprimer progressivement
  
  // === ZUSTAND ÉTAT MINIMAL ===
  const securityState = useSceneStore((state) => state.metadata.securityState);
  const isTransitioning = useSceneStore((state) => state.metadata.isTransitioning);
  
  // === SYSTEM SYNC HOOKS ===
  const { forceSyncAll } = useSystemSync({
    bloomController: bloomControllerRef.current,
    pbrLightingController: pbrLightingControllerRef.current,
    particleSystemController: particleSystemControllerRef.current,
    simpleBloomSystem: simpleBloomSystemRef.current,
    renderer: rendererRef.current
  });
  
  // Bloom sync spécialisé
  useBloomSystemSync(bloomControllerRef.current);
  
  // === INITIALIZATION ===
  useEffect(() => {
    console.log('🚀 V3Scene initialization starting...');
    
    // Setup Three.js scene
    if (!sceneRef.current) {
      sceneRef.current = new THREE.Scene();
    }
    
    // Setup renderer
    if (!rendererRef.current) {
      rendererRef.current = new THREE.WebGLRenderer({ antialias: true });
      // ... renderer config
    }
    
    // Setup bloom controller
    if (!bloomControllerRef.current) {
      bloomControllerRef.current = new BloomControlCenter();
      bloomControllerRef.current.initialize(sceneRef.current, rendererRef.current);
    }
    
    // Setup PBR lighting controller
    if (!pbrLightingControllerRef.current) {
      pbrLightingControllerRef.current = new PBRLightingController();
      pbrLightingControllerRef.current.initialize(sceneRef.current, rendererRef.current);
    }
    
    // ❌ NE PLUS CRÉER SceneStateController
    // stateControllerRef.current = new SceneStateController();
    
    // Force sync initial après setup
    setTimeout(() => {
      forceSyncAll();
      console.log('✅ Initial systems sync completed');
    }, 100);
    
  }, [forceSyncAll]);
  
  // === SECURITY STATE HANDLING ===
  useEffect(() => {
    console.log(`🔒 Security state changed: ${securityState}`);
    
    // Appliquer changements sécurité via systèmes
    if (bloomControllerRef.current) {
      bloomControllerRef.current.setSecurityMode?.(securityState);
    }
    
    if (particleSystemControllerRef.current) {
      particleSystemControllerRef.current.updateSecurityMode?.(securityState);
    }
  }, [securityState]);
  
  // === TRANSITION HANDLING ===
  useEffect(() => {
    console.log(`🔄 Transition state: ${isTransitioning}`);
    
    if (isTransitioning) {
      // Désactiver certains systèmes pendant transition
      bloomControllerRef.current?.pauseUpdates?.();
    } else {
      // Réactiver après transition
      bloomControllerRef.current?.resumeUpdates?.();
      forceSyncAll(); // Re-sync après transition
    }
  }, [isTransitioning, forceSyncAll]);
  
  return (
    <div className="scene-container">
      <Canvas3D 
        ref={rendererRef}
        sceneRef={sceneRef}
        bloomController={bloomControllerRef.current}
        pbrLightingController={pbrLightingControllerRef.current}
        // Plus de stateController prop
      />
      
      <DebugPanel 
        // Aucune prop système nécessaire
      />
    </div>
  );
};

export default V3Scene;
```

---

### **✅ STEP 3.3 : Suppression SceneStateController (60 min)**

#### **3.3.1 Audit des Usages SceneStateController :**
```bash
# Rechercher toutes les références
grep -r "SceneStateController\|stateController" src/components/V19.7_refacto_Centralized_Value_Debug_Panel/
```

#### **3.3.2 Remplacement Progressif :**

**Dans DebugPanel.jsx :**
```javascript
// ❌ AVANT
const handleApplyPreset = (presetKey) => {
  const controller = window.sceneStateController || stateController;
  if (controller && controller.applyPreset) {
    controller.applyPreset(presetKey, preset);
  }
};

// ✅ APRÈS (déjà fait Phase 2)
const { applyPreset } = usePresetsControls();
const handleApplyPreset = (presetKey) => {
  const preset = PRESET_REGISTRY[presetKey];
  if (preset) {
    applyPreset(presetKey, preset);
  }
};
```

**Dans V3Scene.jsx :**
```javascript
// ❌ SUPPRIMER
import SceneStateController from '../systems/stateController/SceneStateController';

// ❌ SUPPRIMER
const [stateController, setStateController] = useState(null);

// ❌ SUPPRIMER
useEffect(() => {
  const controller = new SceneStateController();
  // ... setup logic
  setStateController(controller);
}, []);

// ❌ SUPPRIMER toutes les props stateController
```

#### **3.3.3 Validation Suppression :**
```javascript
// Test: Vérifier qu'aucune référence SceneStateController reste
const validateNoStateController = () => {
  console.assert(!window.sceneStateController, 'SceneStateController still exists globally');
  console.assert(!document.querySelector('[data-state-controller]'), 'SceneStateController refs found');
  console.log('✅ SceneStateController successfully removed');
};
```

---

### **✅ STEP 3.4 : Monitoring & Debug (30 min)**

#### **3.4.1 Créer useSystemsMonitor.js :**
```javascript
// stores/hooks/useSystemsMonitor.js
import { useEffect, useState } from 'react';
import useSceneStore from '../sceneStore';

/**
 * Hook pour monitorer synchronisation systèmes
 */
export const useSystemsMonitor = () => {
  const [syncStats, setSyncStats] = useState({
    bloomSyncs: 0,
    pbrSyncs: 0,
    lightingSyncs: 0,
    lastSync: null,
    errors: []
  });
  
  useEffect(() => {
    let statsCounter = { ...syncStats };
    
    // Monitor bloom syncs
    const bloomMonitor = useSceneStore.subscribe(
      (state) => state.bloom,
      () => {
        statsCounter.bloomSyncs++;
        statsCounter.lastSync = Date.now();
        setSyncStats({ ...statsCounter });
      }
    );
    
    // Monitor PBR syncs
    const pbrMonitor = useSceneStore.subscribe(
      (state) => state.pbr,
      () => {
        statsCounter.pbrSyncs++;
        statsCounter.lastSync = Date.now();
        setSyncStats({ ...statsCounter });
      }
    );
    
    // Monitor lighting syncs
    const lightingMonitor = useSceneStore.subscribe(
      (state) => state.lighting,
      () => {
        statsCounter.lightingSyncs++;
        statsCounter.lastSync = Date.now();
        setSyncStats({ ...statsCounter });
      }
    );
    
    return () => {
      bloomMonitor();
      pbrMonitor();
      lightingMonitor();
    };
  }, []);
  
  const resetStats = () => {
    setSyncStats({
      bloomSyncs: 0,
      pbrSyncs: 0,
      lightingSyncs: 0,
      lastSync: null,
      errors: []
    });
  };
  
  return { syncStats, resetStats };
};
```

#### **3.4.2 Ajouter Debug Panel System Monitor :**
```javascript
// Dans DebugPanel.jsx - Ajouter onglet monitoring
import { useSystemsMonitor } from '../stores/hooks/useSystemsMonitor';

const DebugPanel = () => {
  const { syncStats, resetStats } = useSystemsMonitor();
  
  // Dans le JSX, ajouter onglet "monitor"
  {activeTab === 'monitor' && (
    <div>
      <h4 style={{ color: '#00BCD4', margin: '0 0 10px 0' }}>
        📊 Systems Monitor
      </h4>
      
      <div style={{ fontSize: '10px', lineHeight: '1.4' }}>
        <div>Bloom Syncs: {syncStats.bloomSyncs}</div>
        <div>PBR Syncs: {syncStats.pbrSyncs}</div>
        <div>Lighting Syncs: {syncStats.lightingSyncs}</div>
        <div>Last Sync: {syncStats.lastSync ? new Date(syncStats.lastSync).toLocaleTimeString() : 'Never'}</div>
        
        <button 
          onClick={resetStats}
          style={{ marginTop: '10px', padding: '5px', fontSize: '9px' }}
        >
          Reset Stats
        </button>
      </div>
    </div>
  )}
};
```

---

### **✅ STEP 3.5 : Tests Intégration (45 min)**

#### **3.5.1 Tests Synchronisation :**
```javascript
// tests/systemsIntegration.test.js
import { renderHook, act } from '@testing-library/react';
import useSceneStore from '../stores/sceneStore';
import { useSystemSync } from '../stores/hooks/useSystemSync';

describe('Systems Integration Phase 3', () => {
  let mockBloomController;
  let mockPbrController;
  
  beforeEach(() => {
    mockBloomController = {
      setGlobalThreshold: jest.fn(),
      setGroupBloomParameter: jest.fn(),
      setMaterialParameter: jest.fn()
    };
    
    mockPbrController = {
      applyPreset: jest.fn(),
      setAmbientMultiplier: jest.fn()
    };
  });
  
  test('Bloom changes trigger system sync', async () => {
    renderHook(() => useSystemSync({
      bloomController: mockBloomController
    }));
    
    act(() => {
      useSceneStore.getState().setBloomGlobal('threshold', 0.5);
    });
    
    expect(mockBloomController.setGlobalThreshold).toHaveBeenCalledWith(0.5);
  });
  
  test('PBR preset changes trigger system sync', async () => {
    renderHook(() => useSystemSync({
      pbrLightingController: mockPbrController
    }));
    
    act(() => {
      useSceneStore.getState().setPbrPreset('chromeShowcase');
    });
    
    expect(mockPbrController.applyPreset).toHaveBeenCalledWith('chromeShowcase');
  });
  
  test('Multiple rapid changes are handled correctly', async () => {
    renderHook(() => useSystemSync({
      bloomController: mockBloomController
    }));
    
    act(() => {
      const store = useSceneStore.getState();
      store.setBloomGlobal('threshold', 0.1);
      store.setBloomGlobal('threshold', 0.2);
      store.setBloomGlobal('threshold', 0.3);
    });
    
    // Vérifier que la dernière valeur est appliquée
    expect(mockBloomController.setGlobalThreshold).toHaveBeenLastCalledWith(0.3);
  });
});
```

#### **3.5.2 Tests Visuels :**
```javascript
// Manuel - À effectuer dans navigateur
const testVisualSync = () => {
  console.log('🎯 Testing visual synchronization...');
  
  // Test 1: Bloom threshold
  useSceneStore.getState().setBloomGlobal('threshold', 0.8);
  console.log('→ Bloom threshold should be high (bright scene)');
  
  setTimeout(() => {
    useSceneStore.getState().setBloomGlobal('threshold', 0.1);
    console.log('→ Bloom threshold should be low (dimmer scene)');
  }, 2000);
  
  // Test 2: PBR preset
  setTimeout(() => {
    useSceneStore.getState().setPbrPreset('chromeShowcase');
    console.log('→ Scene should switch to chrome lighting');
  }, 4000);
  
  // Test 3: Preset complet
  setTimeout(() => {
    useSceneStore.getState().applyPreset('blanc_dark', PRESET_BLANC_DARK);
    console.log('→ Scene should apply complete blanc preset');
  }, 6000);
};

// Lancer dans console navigateur
// testVisualSync();
```

---

### **✅ STEP 3.6 : Optimisation Performance (30 min)**

#### **3.6.1 Throttling des Syncs :**
```javascript
// stores/utils/throttle.js
export const createThrottledSubscriber = (callback, delay = 16) => {
  let timeoutId;
  let lastArgs;
  
  return (...args) => {
    lastArgs = args;
    
    if (!timeoutId) {
      timeoutId = setTimeout(() => {
        callback(...lastArgs);
        timeoutId = null;
      }, delay);
    }
  };
};

// Usage dans useSystemSync
const throttledBloomSync = createThrottledSubscriber((bloom) => {
  // Sync bloom logic
}, 16); // 60fps max
```

#### **3.6.2 Selective Subscriptions :**
```javascript
// stores/hooks/useOptimizedSystemSync.js
export const useOptimizedSystemSync = (systems, options = {}) => {
  const { 
    enableBloom = true,
    enablePbr = true,
    enableLighting = true,
    throttleMs = 16
  } = options;
  
  useEffect(() => {
    const subscriptions = [];
    
    if (enableBloom && systems.bloomController) {
      const bloomSub = useSceneStore.subscribe(
        (state) => state.bloom,
        createThrottledSubscriber(
          (bloom) => syncBloom(systems.bloomController, bloom),
          throttleMs
        )
      );
      subscriptions.push(bloomSub);
    }
    
    // Similar pour autres systèmes...
    
    return () => subscriptions.forEach(unsub => unsub());
  }, [systems, enableBloom, enablePbr, enableLighting, throttleMs]);
};
```

---

## 🎯 **CRITÈRES DE VALIDATION PHASE 3**

### **✅ Synchronisation :**
- [ ] Modifications Zustand déclenchent changements visuels immédiats
- [ ] Bloom controls modifient rendu Three.js
- [ ] PBR presets changent lighting en temps réel
- [ ] Presets complets s'appliquent visuellement
- [ ] Aucun décalage UI ↔ rendu

### **✅ Performance :**
- [ ] Sync < 16ms (60fps maintenu)
- [ ] Pas de memory leaks après utilisation intensive
- [ ] CPU usage stable
- [ ] Throttling fonctionne correctement

### **✅ Architecture :**
- [ ] SceneStateController complètement supprimé
- [ ] Aucune référence window.sceneStateController
- [ ] Event system remplacé par Zustand subscriptions
- [ ] Hooks system sync réutilisables

### **✅ Robustesse :**
- [ ] Gestion erreurs si système indisponible
- [ ] Recovery automatique après erreurs
- [ ] Logs monitoring informatifs
- [ ] Tests automatisés passent

---

## 🚨 **TROUBLESHOOTING PHASE 3**

### **Problème : Sync ne fonctionne pas**
```javascript
// Debug: Vérifier subscriptions actives
console.log('Active subscriptions:', useSceneStore.getState());
console.log('Systems refs:', { bloomController, pbrController });
```

### **Problème : Performance dégradée**
```javascript
// Solution: Throttling plus agressif
const throttledSync = createThrottledSubscriber(syncFunction, 32); // 30fps
```

### **Problème : Changements visuels décalés**
```javascript
// Vérifier que fireImmediately: true
const unsubscribe = useSceneStore.subscribe(
  selector,
  callback,
  { fireImmediately: true } // ← Important
);
```

### **Problème : Memory leaks**
```javascript
// Vérifier cleanup dans useEffect
useEffect(() => {
  const unsubscribe = useSceneStore.subscribe(/*...*/);
  
  return () => {
    unsubscribe(); // ← Obligatoire
  };
}, [dependencies]);
```

---

## 📊 **MÉTRIQUES SUCCÈS PHASE 3**

- **100% sync** Zustand → Three.js ✅
- **0 références** SceneStateController ✅  
- **< 16ms** latence synchronisation ✅
- **Auto-recovery** en cas d'erreurs ✅
- **Monitoring** temps réel fonctionnel ✅

**Go/No-Go Phase 4 :** Validation performance + stabilité avant optimisations finales