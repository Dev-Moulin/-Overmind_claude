# 🎯 FrameSchedulerMachine - Atome D1

Premier atome de la refactorisation XState complète. Machine d'état pour la gestion optimisée du render loop à 60fps avec monitoring de performance et récupération d'erreurs automatique.

## 🎯 Objectif

Remplacer la gestion manuelle du render loop par une machine XState robuste qui:
- ✅ Gère le requestAnimationFrame de manière optimisée
- ✅ Monitor les performances en temps réel
- ✅ Récupère automatiquement des erreurs
- ✅ Supporte le debugging avec step mode
- ✅ Intègre la télémétrie de production

## 🚀 Installation & Usage

### Usage de Base

```typescript
import { useFrameScheduler } from './machines/frameScheduler/useFrameScheduler';

function MyComponent() {
  const frameScheduler = useFrameScheduler(true); // Auto-start

  return (
    <div>
      <p>FPS: {frameScheduler.performance.fps}</p>
      <p>État: {frameScheduler.getStateDescription()}</p>

      <button onClick={frameScheduler.start}>Start</button>
      <button onClick={frameScheduler.pause}>Pause</button>
      <button onClick={frameScheduler.toggleDebugMode}>Debug</button>
    </div>
  );
}
```

### Intégration dans Canvas3D

```jsx
import { FrameSchedulerIntegration } from './machines/frameScheduler/FrameSchedulerDemo';

function Canvas3D() {
  return (
    <FrameSchedulerIntegration showMonitor={true} showDemo={process.env.NODE_ENV === 'development'}>
      {/* Votre contenu Canvas existant */}
      <Canvas>
        {/* ... */}
      </Canvas>
    </FrameSchedulerIntegration>
  );
}
```

### Monitoring Léger

```jsx
import { FrameSchedulerMonitor } from './machines/frameScheduler/FrameSchedulerDemo';

function App() {
  return (
    <div>
      <FrameSchedulerMonitor />
      {/* Votre app */}
    </div>
  );
}
```

## 🎮 API Hooks

### `useFrameScheduler(autoStart?, debugEnabled?)`

Hook principal avec contrôles complets.

**Retourne:**
- `isRunning`, `isPaused`, `isRecovering`, `hasError` - États
- `performance` - Métriques FPS, frame time, etc.
- `start()`, `stop()`, `pause()`, `resume()` - Contrôles de base
- `toggleDebugMode()`, `enableStepMode()`, `stepFrame()` - Debug
- `updateConfig(config)` - Configuration dynamique

### `useFrameSchedulerMetrics()`

Hook léger pour les métriques uniquement.

**Retourne:**
- `fps`, `averageFPS`, `frameCount` - Métriques de base
- `maxFrameTime`, `minFrameTime` - Performance
- `status: 'good' | 'warning' | 'critical'` - État général

### `useFrameSchedulerControls()`

Hook pour contrôles simples sans métriques.

### `useFrameSchedulerDebug()`

Hook avancé pour debugging avec informations XState détaillées.

## ⚙️ Configuration

```typescript
frameScheduler.updateConfig({
  targetFPS: 30,                    // FPS cible (défaut: 60)
  enablePerformanceMonitoring: true, // Monitoring (défaut: true)
  maxFrameTimeHistory: 120,         // Historique frame times (défaut: 60)
  performanceUpdateInterval: 2000,  // Intervalle métriques ms (défaut: 1000)
  adaptiveFrameRate: true          // Adaptation auto FPS (défaut: true)
});
```

## 🔄 Migration Progressive

Le système supporte la coexistence avec l'ancien render loop via feature flags:

```bash
# Variables d'environnement
REACT_APP_USE_XSTATE_SCHEDULER=true     # Active XState
REACT_APP_SCHEDULER_DUAL_MODE=true      # Mode dual (XState + Legacy)
REACT_APP_SCHEDULER_COMPARE=true        # Comparaison performance
REACT_APP_SCHEDULER_AUTO_FALLBACK=true  # Fallback automatique
```

### Migration Manager

```typescript
import { getFrameSchedulerMigration } from './machines/frameScheduler/migration';

const migration = getFrameSchedulerMigration();

// Status
console.log(migration.getStatus());

// Contrôles manuels
migration.switchToXState();
migration.switchToLegacy();
```

## 🔍 États de la Machine

```
📊 frameScheduler
├── 💤 idle (initial)
├── 🏃 running (parallel)
│   ├── ⏱️ timing.tracking
│   ├── 🎯 systemUpdates.updating
│   └── 📊 performanceMonitoring.monitoring
├── ⏸️ paused
├── 🐛 debugging (step mode)
├── 🔄 recovering
├── 🎮 contextLost (WebGL)
└── ❌ error
```

## 📊 Monitoring

### DevTools XState

En mode développement, la machine est connectée aux XState DevTools pour inspection visuelle des états et transitions.

### Télémétrie Production

```typescript
// Données automatiquement collectées
{
  type: 'frame_scheduler_event',
  eventType: 'FRAME_TICK',
  context: {
    fps: 60,
    averageFPS: 58,
    frameCount: 1440,
    hasError: false,
    debugMode: false
  },
  timestamp: 1234567890
}
```

### Performance Comparison (Mode Dual)

En mode dual, le système compare automatiquement les performances XState vs Legacy et génère des recommandations.

## 🚨 Gestion d'Erreurs

### Types d'Erreurs

- **`FRAME_TIMEOUT`** - Frame trop lente → Récupération auto
- **`SYSTEM_UPDATE_ERROR`** - Erreur système → Récupération auto
- **`WEBGL_CONTEXT_LOST`** - Contexte perdu → Récupération spécialisée
- **`MEMORY_EXHAUSTED`** - Mémoire insuffisante → Erreur critique

### Récupération Automatique

La machine tente automatiquement de récupérer des erreurs non-critiques:
1. Détection d'erreur
2. Transition vers état `recovering`
3. Exécution de la procédure de récupération
4. Retour à l'état `running` ou escalade vers `error`

### Fallback Legacy

En cas d'échec critique, basculement automatique vers l'ancien système si activé.

## 🧪 Tests

### Lancer les Tests

```bash
npm test frameScheduler.test.js
```

### Tests Couverts

- ✅ Initialisation et états de base
- ✅ Transitions START/STOP/PAUSE/RESUME
- ✅ Gestion des FRAME_TICK et métriques
- ✅ Mode debug et step mode
- ✅ Gestion d'erreurs et récupération
- ✅ Configuration dynamique
- ✅ Gestion WebGL context lost/restored
- ✅ Intégration avec mock objects

## 🎯 Intégration avec Systèmes Existants

### Systèmes Supportés

La machine met à jour automatiquement ces systèmes s'ils sont disponibles:

```typescript
// Systèmes détectés via window globals
- window.animationControllerRef?.current.update(deltaTime)
- window.eyeRotationRef?.current.updateEyeRotation(deltaTime)
- window.particleSystemRef?.current.update(deltaTime)
- window.pbrLightingController (éclairage)
- window.bloomSystem (effets)
- window.worldEnvironmentController (environnement)
```

### Activation/Désactivation Sélective

```typescript
frameScheduler.updateConfig({
  systems: {
    animation: true,
    physics: false,      // Désactiver physics
    particles: true,
    lighting: true,
    effects: false,      // Désactiver effects
    render: true,
    eyeRotation: true,
    environment: true
  }
});
```

## 🔗 Liens avec Autres Atomes

Ce premier atome (D1) est la fondation pour les prochains:

- **Atome B1** (BloomMachine) → Utilisera FrameScheduler pour timing
- **Atome B2** (PBRMachine) → Sync via FrameScheduler events
- **Atome C1** (ParticleSystemMachine) → Updates coordonnés
- **Atome A1-A3** (Services Scene/Renderer/Camera) → Lifecycle géré

## 📈 Métriques de Succès

- ✅ FPS stable ≥ 55 (target 60)
- ✅ Frame time max ≤ 20ms
- ✅ Taux d'erreur ≤ 0.1%
- ✅ Temps de récupération ≤ 2s
- ✅ Overhead ≤ 2% CPU vs legacy

## 🎮 Debug et Développement

### Mode Step

```typescript
frameScheduler.enableStepMode();  // Pause et active step mode
frameScheduler.stepFrame();       // Exécute une frame
frameScheduler.disableStepMode(); // Retour normal
```

### Logs Debug

En mode développement, logs détaillés automatiques:
- 🚀 Démarrage/arrêt des services
- 📊 Mises à jour de performance
- 🔄 Transitions d'état
- 🚨 Erreurs et récupérations

## 🏁 Statut d'Implémentation

- ✅ Machine XState complète
- ✅ Services requestAnimationFrame
- ✅ Actions et guards complets
- ✅ Hooks React intégrés
- ✅ Composants de démonstration
- ✅ Tests unitaires complets
- ✅ Migration progressive
- ✅ Documentation complète

**Prêt pour intégration et test en conditions réelles.**