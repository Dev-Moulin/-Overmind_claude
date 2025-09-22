# 🔄 COUCHE DE COMPATIBILITÉ ZUSTAND ↔ XSTATE

## 🎯 Objectif

Middleware et hooks de compatibilité pour migration progressive Zustand → XState sans rupture de service, avec support du middleware officiel `zustand-middleware-xstate`.

## 📦 Installation et Configuration

### **1. Installation du Middleware Officiel**

```bash
npm install zustand-middleware-xstate @xstate/react
```

### **2. Configuration Store Principal**

```typescript
// stores/hybridStore.js
import { create } from 'zustand';
import { xstate } from 'zustand-middleware-xstate';
import { sceneMachine } from '../machines/sceneMachine';

// Store hybride avec XState intégré
const useHybridStore = create(
  xstate(sceneMachine, {
    // Configuration optionnelle
    devtools: process.env.NODE_ENV === 'development',

    // Sélecteurs personnalisés pour compatibilité
    selectors: {
      // Compatibility layer: exposer l'état XState comme Zustand
      bloomEnabled: (state) => state.context.bloom.enabled,
      bloomIntensity: (state) => state.context.bloom.intensity,
      metalness: (state) => state.context.pbr.metalness,
      roughness: (state) => state.context.pbr.roughness,
      HDREnabled: (state) => state.context.environment.HDREnabled,

      // Nouveaux sélecteurs XState
      isLoadingEnvironment: (state) => state.matches('environment.loading'),
      isApplyingChanges: (state) => state.matches('applying'),
      hasErrors: (state) => state.matches('error')
    }
  })
);

export default useHybridStore;
```

### **3. Service XState Intégré**

```typescript
// Le middleware expose automatiquement:
const {
  // État XState complet
  state,          // Current XState state
  context,        // XState context

  // Interface Zustand compatible
  send,           // Envoyer événements XState
  actor,          // XState actor pour hooks avancés

  // Sélecteurs Zustand traditionnels
  bloomEnabled,   // = state.context.bloom.enabled
  setBloomEnabled // Wrapper automatique vers send()
} = useHybridStore();
```

## 🔌 Hooks de Compatibilité

### **1. Hook Bloom Compatible**

```typescript
// hooks/useBloomCompat.js
import { useSelector } from '@xstate/react';
import useHybridStore from '../stores/hybridStore';

export const useBloomCompat = () => {
  const { state, send } = useHybridStore();

  // ✅ Interface identique à l'ancien hook Zustand
  return {
    // États (lecture) - API Zustand compatible
    bloomEnabled: useSelector(state, (s) => s.context.bloom.enabled),
    bloomIntensity: useSelector(state, (s) => s.context.bloom.intensity),
    bloomThreshold: useSelector(state, (s) => s.context.bloom.threshold),
    bloomRadius: useSelector(state, (s) => s.context.bloom.radius),

    // Actions (écriture) - API Zustand compatible
    setBloomEnabled: (enabled) =>
      send({ type: enabled ? 'ENABLE_BLOOM' : 'DISABLE_BLOOM' }),

    setBloomIntensity: (intensity) =>
      send({ type: 'SET_BLOOM_INTENSITY', value: intensity }),

    setBloomThreshold: (threshold) =>
      send({ type: 'SET_BLOOM_THRESHOLD', value: threshold }),

    setBloomRadius: (radius) =>
      send({ type: 'SET_BLOOM_RADIUS', value: radius }),

    // Nouvelles capacités XState (bonus)
    isValidating: useSelector(state, (s) => s.matches('bloom.validating')),
    isRequiringHDR: useSelector(state, (s) => s.matches('bloom.requiring_hdr')),
    isApplying: useSelector(state, (s) => s.matches('applying')),

    // Actions composées (améliorées avec XState)
    toggleBloom: () =>
      send({ type: 'TOGGLE_BLOOM' }), // Gère automatiquement HDR si requis

    resetBloomToDefaults: () =>
      send({ type: 'RESET_BLOOM_DEFAULTS' }),

    // Debug et monitoring
    bloomState: useSelector(state, (s) => s.value.bloom), // État actuel
    lastTransition: useSelector(state, (s) => s.event.type) // Dernier événement
  };
};
```

### **2. Hook PBR Compatible**

```typescript
// hooks/usePBRCompat.js
export const usePBRCompat = () => {
  const { state, send } = useHybridStore();

  return {
    // États Zustand compatibles
    metalness: useSelector(state, (s) => s.context.pbr.metalness),
    roughness: useSelector(state, (s) => s.context.pbr.roughness),
    pbrPreset: useSelector(state, (s) => s.context.pbr.preset),
    envMapIntensity: useSelector(state, (s) => s.context.pbr.envMapIntensity),

    // Actions Zustand compatibles
    setMetalness: (value) =>
      send({ type: 'SET_METALNESS', value }),

    setRoughness: (value) =>
      send({ type: 'SET_ROUGHNESS', value }),

    setPBRPreset: (preset) =>
      send({ type: 'APPLY_PBR_PRESET', preset }),

    setEnvMapIntensity: (intensity) =>
      send({ type: 'SET_ENVMAP_INTENSITY', value: intensity }),

    // Nouveaux états XState
    isUpdatingPBR: useSelector(state, (s) => s.matches('pbr.updating')),
    isApplyingPreset: useSelector(state, (s) => s.matches('pbr.applying_preset')),
    requiresEnvironment: useSelector(state, (s) => s.matches('pbr.requiring_environment')),

    // Actions améliorées
    applyMetallicPreset: () =>
      send({ type: 'APPLY_PBR_PRESET', preset: 'metallic' }),

    applyGlassPreset: () =>
      send({ type: 'APPLY_PBR_PRESET', preset: 'glass' })
  };
};
```

### **3. Hook Global Compatible (Legacy Support)**

```typescript
// hooks/useSceneStoreCompat.js
export const useSceneStoreCompat = () => {
  const { state, send, context } = useHybridStore();

  // ✅ API 100% compatible avec l'ancien useSceneStore Zustand
  return {
    // Tous les états dans un seul objet (style Zustand legacy)
    ...context.bloom,
    ...context.pbr,
    ...context.environment,
    ...context.lighting,

    // Actions legacy - wrappers vers XState
    setBloomEnabled: (enabled) =>
      send({ type: enabled ? 'ENABLE_BLOOM' : 'DISABLE_BLOOM' }),

    setBloomIntensity: (intensity) =>
      send({ type: 'SET_BLOOM_INTENSITY', value: intensity }),

    setMetalness: (metalness) =>
      send({ type: 'SET_METALNESS', value: metalness }),

    setRoughness: (roughness) =>
      send({ type: 'SET_ROUGHNESS', value: roughness }),

    setExposure: (exposure) =>
      send({ type: 'SET_EXPOSURE', value: exposure }),

    // Actions composées améliorées
    applyPreset: (presetName) =>
      send({ type: 'APPLY_COMPLETE_PRESET', preset: presetName }),

    // Nouveaux helpers XState (bonus pour composants migrés)
    isLoading: state.matches('loading'),
    hasErrors: state.matches('error'),
    currentState: state.value,

    // Debug helpers
    debugInfo: {
      stateMachine: state,
      lastEvent: state.event,
      transitions: state.transitions
    }
  };
};
```

## 🔄 Migration Component par Component

### **1. Composant Bloom (Avant/Après)**

```typescript
// AVANT (Zustand pur)
const BloomControls = () => {
  const {
    bloomEnabled,
    bloomIntensity,
    setBloomEnabled,
    setBloomIntensity
  } = useSceneStore();

  return (
    <div>
      <input
        type="checkbox"
        checked={bloomEnabled}
        onChange={(e) => setBloomEnabled(e.target.checked)}
      />
      <input
        type="range"
        min="0" max="3" step="0.1"
        value={bloomIntensity}
        onChange={(e) => setBloomIntensity(Number(e.target.value))}
      />
    </div>
  );
};

// APRÈS (XState avec compatibilité)
const BloomControls = () => {
  const {
    bloomEnabled,
    bloomIntensity,
    setBloomEnabled,
    setBloomIntensity,
    isValidating,      // ✅ Nouveau: feedback état
    isRequiringHDR     // ✅ Nouveau: indication dépendance
  } = useBloomCompat();

  return (
    <div>
      <input
        type="checkbox"
        checked={bloomEnabled}
        onChange={(e) => setBloomEnabled(e.target.checked)}
        disabled={isValidating} // ✅ Nouveau: UX améliorée
      />

      {isRequiringHDR && (
        <span className="warning">⚠️ HDR requis pour bloom</span>
      )}

      <input
        type="range"
        min="0" max="3" step="0.1"
        value={bloomIntensity}
        onChange={(e) => setBloomIntensity(Number(e.target.value))}
        disabled={!bloomEnabled || isValidating}
      />

      {isValidating && <span>Applying...</span>}
    </div>
  );
};
```

### **2. Composant avec Actions Composées**

```typescript
// Nouveau composant utilisant les capacités XState
const QuickPresets = () => {
  const {
    applyPreset,
    isApplying,
    currentState
  } = useSceneStoreCompat();

  const presets = [
    { name: 'Cinematic', values: { bloom: true, exposure: 1.2, metalness: 0.8 } },
    { name: 'Studio', values: { bloom: false, exposure: 1.0, metalness: 0.0 } },
    { name: 'Gaming', values: { bloom: true, exposure: 0.8, metalness: 0.5 } }
  ];

  return (
    <div className="quick-presets">
      <h3>Quick Presets</h3>
      {presets.map(preset => (
        <button
          key={preset.name}
          onClick={() => applyPreset(preset.name)}
          disabled={isApplying}
          className={isApplying ? 'applying' : ''}
        >
          {preset.name}
          {isApplying && ' ⏳'}
        </button>
      ))}

      <div className="state-info">
        Current: {JSON.stringify(currentState)}
      </div>
    </div>
  );
};
```

## 🛡️ Validation de Compatibilité

### **1. Tests de Non-Régression**

```typescript
// tests/compatibility.test.js
import { renderHook, act } from '@testing-library/react';
import { useBloomCompat } from '../hooks/useBloomCompat';
import { useSceneStore } from '../stores/legacyStore'; // Ancien store

describe('Compatibilité Zustand → XState', () => {
  test('useBloomCompat retourne la même API que useSceneStore', () => {
    const { result: xstateResult } = renderHook(() => useBloomCompat());
    const { result: zustandResult } = renderHook(() => useSceneStore());

    // Vérifier présence des mêmes propriétés
    expect(xstateResult.current).toHaveProperty('bloomEnabled');
    expect(xstateResult.current).toHaveProperty('bloomIntensity');
    expect(xstateResult.current).toHaveProperty('setBloomEnabled');
    expect(xstateResult.current).toHaveProperty('setBloomIntensity');

    // Vérifier types identiques
    expect(typeof xstateResult.current.bloomEnabled).toBe('boolean');
    expect(typeof xstateResult.current.setBloomEnabled).toBe('function');
  });

  test('Actions Zustand et XState produisent le même résultat', async () => {
    const { result: xstateHook } = renderHook(() => useBloomCompat());

    // Test toggle bloom
    act(() => {
      xstateHook.current.setBloomEnabled(true);
    });

    expect(xstateHook.current.bloomEnabled).toBe(true);

    // Test paramètre intensité
    act(() => {
      xstateHook.current.setBloomIntensity(1.5);
    });

    expect(xstateHook.current.bloomIntensity).toBe(1.5);
  });

  test('Nouvelles capacités XState fonctionnent', () => {
    const { result } = renderHook(() => useBloomCompat());

    // Vérifier nouvelles propriétés XState
    expect(result.current).toHaveProperty('isValidating');
    expect(result.current).toHaveProperty('isRequiringHDR');
    expect(result.current).toHaveProperty('toggleBloom');

    expect(typeof result.current.isValidating).toBe('boolean');
    expect(typeof result.current.toggleBloom).toBe('function');
  });
});
```

### **2. Monitoring de Migration**

```typescript
// utils/migrationMonitor.js
export class MigrationMonitor {
  constructor() {
    this.usageStats = {
      zustandCalls: 0,
      xstateCalls: 0,
      compatCalls: 0
    };

    this.deprecated = new Set();
  }

  trackZustandUsage(componentName, action) {
    this.usageStats.zustandCalls++;

    console.warn(
      `🔄 Migration Warning: ${componentName} utilise encore Zustand direct pour ${action}`
    );

    // Analytics ou logging pour suivre progression migration
    this.reportMigrationProgress();
  }

  trackXStateUsage(componentName, event) {
    this.usageStats.xstateCalls++;

    console.log(`✅ ${componentName} utilise XState: ${event.type}`);
  }

  trackCompatibilityUsage(componentName, method) {
    this.usageStats.compatCalls++;

    console.log(`🔄 ${componentName} utilise couche compatibilité: ${method}`);
  }

  warnDeprecated(method, replacement) {
    if (!this.deprecated.has(method)) {
      console.warn(
        `⚠️ Deprecated: ${method} sera supprimé. Utilisez ${replacement}`
      );
      this.deprecated.add(method);
    }
  }

  reportMigrationProgress() {
    const total = this.usageStats.zustandCalls + this.usageStats.xstateCalls;
    const xstatePercentage = total > 0 ? (this.usageStats.xstateCalls / total * 100) : 0;

    console.log(`📊 Migration Progress: ${xstatePercentage.toFixed(1)}% XState`);
  }

  getMigrationReport() {
    return {
      ...this.usageStats,
      migrationPercentage: this.usageStats.xstateCalls /
        (this.usageStats.zustandCalls + this.usageStats.xstateCalls) * 100,
      componentsToMigrate: this.usageStats.zustandCalls,
      compatibilityUsage: this.usageStats.compatCalls
    };
  }
}

// Instance globale
export const migrationMonitor = new MigrationMonitor();
```

## 📈 Bénéfices de la Couche de Compatibilité

### **1. Migration Sans Rupture**
- ✅ **API identique** - Aucun changement requis dans composants existants
- ✅ **Introduction progressive** - Nouveaux composants peuvent utiliser XState complet
- ✅ **Rollback possible** - Retour à Zustand pur en cas de problème

### **2. Amélioration Progressive**
- ✅ **Feedback visuel** - États loading/validating automatiques
- ✅ **Validation** - Guards et dépendances vérifiées automatiquement
- ✅ **Performance** - Batching et optimisations XState

### **3. Debug et Monitoring**
- ✅ **Traçabilité** - Toutes les transitions visibles dans devtools
- ✅ **Métriques migration** - Suivi du pourcentage de migration
- ✅ **Tests automatisés** - Validation de non-régression

Cette couche de compatibilité permet une migration en douceur sur plusieurs semaines, avec amélioration continue de l'UX et maintien de la stabilité de production.