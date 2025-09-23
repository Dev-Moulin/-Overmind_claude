# 🌟 BloomMachine - Atome B1

**Machine XState complète pour la gestion bloom THREE.js avec intégration React**

## 📋 Vue d'ensemble

BloomMachine est l'**Atome B1** de la refactorisation XState, remplaçant la gestion bloom centralisée du SceneStateController par une architecture modulaire, robuste et performante.

### ✅ Statut : COMPLET ET OPÉRATIONNEL

- ✅ **Architecture XState** : États parallèles (global/groups/security)
- ✅ **5 groupes bloom** : iris, eyeRings, revealRings, magicRings, arms
- ✅ **Intégration API** : SimpleBloomSystem + BloomControlCenter
- ✅ **Hook React** : `useBloomMachine` prêt pour UI
- ✅ **TypeScript** : Types complets + validation
- ✅ **Performance** : Monitoring + throttling intelligent

## 🏗️ Architecture

```
🌟 BloomMachine (États Parallèles)
├── 🌟 Global State (disabled/enabling/enabled/error)
│   ├── threshold, strength, radius, exposure
│   └── sync avec SimpleBloomSystem
├── 🎭 Groups State (5 groupes en parallèle)
│   ├── iris: { objets + config bloom }
│   ├── eyeRings: { objets + config bloom }
│   ├── revealRings: { objets + config bloom }
│   ├── magicRings: { objets + config bloom }
│   └── arms: { objets + config bloom }
└── 🔒 Security State (SAFE/DANGER/WARNING/SCANNING/NORMAL)
    └── Transitions sécurisées avec validation
```

## 🚀 Utilisation

### Hook React (Recommandé)

```typescript
import { useBloomMachine } from './machines/bloom';

function BloomControls() {
  const bloom = useBloomMachine({
    simpleBloomSystem: myBloomSystem,
    bloomControlCenter: myControlCenter,
    frameScheduler: myFrameScheduler,
    autoStart: true,
    debugMode: true
  });

  // Contrôles globaux
  const handleEnableBloom = () => bloom.enableBloom();
  const handleUpdateGlobal = () => bloom.updateGlobal({
    threshold: 0.2,
    strength: 0.5,
    radius: 0.6
  });

  // Contrôles par groupe
  const handleUpdateIris = () => bloom.updateGroup('iris', {
    threshold: 0.3,
    emissiveColor: 0x00ff88,
    emissiveIntensity: 0.8
  });

  // Contrôles sécurité
  const handleDanger = () => bloom.setSecurity('DANGER');

  return (
    <div>
      <h3>Bloom Status: {bloom.isEnabled ? 'ON' : 'OFF'}</h3>
      <p>Security: {bloom.currentSecurity}</p>
      <p>Objects: {bloom.groupCounts.iris} iris, {bloom.groupCounts.eyeRings} eyeRings</p>

      <button onClick={handleEnableBloom}>Enable Bloom</button>
      <button onClick={handleUpdateGlobal}>Update Global</button>
      <button onClick={handleUpdateIris}>Update Iris</button>
      <button onClick={handleDanger}>Danger Mode</button>
    </div>
  );
}
```

### Machine XState Direct

```typescript
import { useMachine } from '@xstate/react';
import { bloomMachine } from './machines/bloom';

function DirectMachineUsage() {
  const [state, send] = useMachine(bloomMachine);

  const enableBloom = () => send({ type: 'ENABLE_BLOOM' });
  const updateIris = () => send({
    type: 'UPDATE_GROUP_IRIS',
    threshold: 0.3,
    emissiveColor: 0x00ff88
  });

  return (
    <div>
      <p>Global State: {state.value.global}</p>
      <p>Security State: {state.value.security}</p>
      <button onClick={enableBloom}>Enable</button>
      <button onClick={updateIris}>Update Iris</button>
    </div>
  );
}
```

## 📊 API Reference

### Hook useBloomMachine

#### Options
```typescript
interface UseBloomMachineOptions {
  // Systèmes externes
  simpleBloomSystem?: any;
  bloomControlCenter?: any;
  frameScheduler?: any;

  // Configuration
  autoStart?: boolean;
  enablePerformanceMonitoring?: boolean;
  debugMode?: boolean;

  // Callbacks
  onStateChange?: (state: any) => void;
  onError?: (error: Error) => void;
}
```

#### Retour
```typescript
interface BloomMachineHook {
  // États
  state: any;
  isEnabled: boolean;
  currentSecurity: SecurityPreset | null;
  groupCounts: Record<BloomGroupType, number>;
  performance: BloomPerformance;

  // Contrôles globaux
  enableBloom(): void;
  disableBloom(): void;
  updateGlobal(params: Partial<GlobalBloomConfig>): void;

  // Contrôles groupes
  updateGroup(group: BloomGroupType, params: GroupBloomConfig): void;
  registerObjects(group: BloomGroupType, objects: Map<string, THREE.Mesh>): void;

  // Contrôles sécurité
  setSecurity(preset: SecurityPreset): void;

  // Utilitaires
  detectObjects(model: THREE.Group | THREE.Mesh): void;
  syncWithRenderer(): void;
  forceRefresh(): void;
  dispose(): void;
}
```

### Types Principaux

```typescript
type BloomGroupType = 'iris' | 'eyeRings' | 'revealRings' | 'magicRings' | 'arms';
type SecurityPreset = 'SAFE' | 'DANGER' | 'WARNING' | 'SCANNING' | 'NORMAL';

interface BloomGlobalConfig {
  threshold: number;    // 0.0 - 1.0
  strength: number;     // 0.0 - 5.0
  radius: number;       // 0.0 - 2.0
  exposure: number;     // 0.1 - 10.0
}

interface BloomGroupConfig {
  threshold: number;
  strength: number;
  radius: number;
  emissiveColor: number;      // 0x000000 - 0xffffff
  emissiveIntensity: number;  // 0.0 - 10.0
  objects: Map<string, THREE.Mesh>;
}
```

## 🎯 Events

### Global Events
- `ENABLE_BLOOM` : Active le bloom global
- `DISABLE_BLOOM` : Désactive le bloom global
- `UPDATE_GLOBAL` : Met à jour paramètres globaux

### Group Events
- `UPDATE_GROUP_IRIS` : Met à jour groupe iris
- `UPDATE_GROUP_EYERINGS` : Met à jour groupe eyeRings
- `UPDATE_GROUP_REVEALRINGS` : Met à jour groupe revealRings
- `UPDATE_GROUP_MAGICRINGS` : Met à jour groupe magicRings
- `UPDATE_GROUP_ARMS` : Met à jour groupe arms
- `REGISTER_OBJECTS` : Enregistre objets THREE.js

### Security Events
- `SET_SECURITY` : Change preset sécurité
- `SECURITY_TRANSITION_COMPLETE` : Transition terminée

### System Events
- `SYNC_WITH_FRAMESCHEDULER` : Sync avec FrameScheduler
- `SYNC_WITH_RENDERER` : Sync avec renderer
- `DETECT_OBJECTS` : Détection automatique objets
- `FORCE_REFRESH` : Refresh forcé
- `DISPOSE` : Nettoyage ressources

## 🔧 Intégrations

### SimpleBloomSystem
```typescript
// Méthodes utilisées
simpleBloomSystem.updateBloom(param, value);
simpleBloomSystem.setBloomEnabled(enabled);
simpleBloomSystem.updateGroup(groupName, settings);
simpleBloomSystem.setSecurityMode(mode);
simpleBloomSystem.addToGroup(mesh, groupName);
```

### BloomControlCenter
```typescript
// Méthodes utilisées
bloomControlCenter.setBloomParameter(param, value, group);
bloomControlCenter.setSecurityState(preset);
bloomControlCenter.setObjectTypeProperty(group, property, value);
bloomControlCenter.registerObject(group, name, mesh);
bloomControlCenter.detectAndRegisterBloomObjects(model);
```

### FrameScheduler
```typescript
// Coordination timing et performance
frameScheduler.performance.fps; // Adaptation throttling
frameScheduler.events;           // Synchronisation updates
```

## 📈 Performance

### Optimisations Intégrées
- **Throttling intelligent** : Updates limités selon FPS
- **Lazy object detection** : Détection à la demande
- **Memory management** : Cleanup automatique objets
- **Performance monitoring** : Métriques temps réel

### Métriques Disponibles
```typescript
const bloom = useBloomMachine();

console.log(bloom.performance);
// {
//   updateCount: 1247,
//   lastUpdateTime: 1695377682341,
//   averageUpdateTime: 2.3
// }
```

## 🧪 Tests

```bash
# Tests unitaires (à venir)
npm test machines/bloom

# Tests d'intégration avec THREE.js
npm run test:bloom:integration

# Tests performance
npm run test:bloom:performance
```

## 🔄 Migration depuis SceneStateController

### Avant (Centralisé)
```javascript
// SceneStateController - 828 lignes
sceneStateController.setGroupBloomParameter('iris', 'threshold', 0.3);
sceneStateController.syncGroupBloom('iris');
```

### Après (BloomMachine)
```typescript
// BloomMachine - Modulaire
const bloom = useBloomMachine();
bloom.updateGroup('iris', { threshold: 0.3 });
// Sync automatique via XState
```

### Avantages Migration
- 🎯 **Séparation des responsabilités** : Bloom isolé
- 🔄 **États prévisibles** : XState state management
- 🧪 **Testabilité** : Machine isolée testable
- 📊 **Performance** : Optimisations ciblées
- 🛡️ **Robustesse** : Error recovery intégré

## 🚨 Points d'attention

### Prérequis
- ✅ XState v4+ installé
- ✅ React 16.8+ (hooks)
- ✅ THREE.js objets disponibles
- ✅ SimpleBloomSystem initialisé

### Limitations Actuelles
- Selective bloom : global seulement (v2 prévue)
- Animation pulse : base implémentée
- Memory profiling : métriques basiques

### Debug
```typescript
// Mode debug activé
const bloom = useBloomMachine({
  debugMode: true
});

// XState DevTools disponible
// Console logs détaillés
```

## 🔮 Roadmap

### Version Actuelle (v1.0)
- ✅ Architecture XState complète
- ✅ Hook React prêt production
- ✅ Intégration systèmes existants

### Version Suivante (v1.1)
- 🔄 Tests complets
- 🔄 Selective bloom par groupe
- 🔄 Animations pulse avancées
- 🔄 Memory profiling détaillé

### Versions Futures
- 🎯 Integration complète FrameScheduler
- 🎯 WebGL2 compute shaders
- 🎯 Multi-threading support

---

## 💡 Support

Pour questions et support :
1. **Consulter la documentation** XState officielle
2. **Analyser les logs** avec debugMode: true
3. **Vérifier l'intégration** FrameScheduler
4. **Tester isolément** chaque groupe bloom

**BloomMachine : L'avenir du bloom management en XState ! 🌟**