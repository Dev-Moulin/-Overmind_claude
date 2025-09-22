# 🧩 DÉCOMPOSITION ATOMIQUE POUR REFACTORISATION XSTATE

## 🎯 OBJECTIF RÉVISÉ

**Refactoriser COMPLÈTEMENT l'architecture pour être 100% cohérente avec XState en décomposant chaque problématique en "atomes" traitables individuellement.**

## 📋 INVENTAIRE DES PROBLÈMES ATOMIQUES

### 1️⃣ **PROBLÈME ATOMIQUE: Window Globals**

#### Problème Identifié
```javascript
// 12 objets exposés sur window
window.scene = scene;
window.renderer = renderer;
window.camera = camera;
window.stateController = stateControllerRef.current;
// ... etc
```

#### Décomposition Atomique
**Atome A1**: `window.scene` → Service XState SceneService
**Atome A2**: `window.renderer` → Service XState RendererService
**Atome A3**: `window.camera` → Service XState CameraService
**Atome A4**: `window.stateController` → Machine XState RootMachine
**Atome A5**: `window.revelationSystem` → Machine XState RevelationMachine
**Atome A6**: `window.pbrLightingController` → Machine XState PBRMachine
**Atome A7**: `window.syncPMREMSystems` → Action XState syncPMREM
**Atome A8**: `window.useSceneStore` → Context XState Provider
**Atome A9**: `window.pmremGenerator` → Service XState PMREMService
**Atome A10**: `window.bloomSystem` → Machine XState BloomMachine

#### Plan de Refactorisation A1 (window.scene)
```javascript
// AVANT (Global)
window.scene = scene;

// APRÈS (XState Service)
const sceneService = {
  id: 'scene',
  src: (context) => (callback) => {
    const scene = new THREE.Scene();
    callback({ type: 'SCENE_CREATED', scene });

    return () => {
      scene.dispose();
    };
  }
};

const sceneMachine = createMachine({
  context: { scene: null },

  invoke: {
    src: sceneService,
    onDone: {
      actions: assign({ scene: (_, event) => event.data.scene })
    }
  }
});
```

### 2️⃣ **PROBLÈME ATOMIQUE: SceneStateController Monolithe**

#### Problème Identifié
```javascript
// 828 lignes monolithiques dans SceneStateController
class SceneStateController {
  // Gestion centralisée de TOUT
}
```

#### Décomposition Atomique
**Atome B1**: Gestion Bloom → BloomMachine
**Atome B2**: Gestion PBR → PBRMachine
**Atome B3**: Gestion Lighting → LightingMachine
**Atome B4**: Gestion Environment → EnvironmentMachine
**Atome B5**: Gestion Particles → ParticleMachine
**Atome B6**: Gestion Security → SecurityMachine
**Atome B7**: Gestion Validation → ValidationMachine
**Atome B8**: Coordination → RootMachine (Parallel States)

#### Plan de Refactorisation B1 (Bloom)
```javascript
// AVANT (Centralisé)
setGroupBloomParameter(groupName, param, value) {
  // 50+ lignes de logique
}

// APRÈS (Machine XState)
const bloomMachine = createMachine({
  id: 'bloom',
  initial: 'disabled',

  context: {
    groups: {
      iris: { enabled: false, intensity: 0.5 },
      eyeRings: { enabled: false, intensity: 0.3 }
    }
  },

  states: {
    disabled: {
      on: {
        ENABLE_GROUP: {
          target: 'enabling',
          cond: 'canEnableBloom'
        }
      }
    },

    enabling: {
      invoke: {
        src: 'enableBloomGroup',
        onDone: 'enabled'
      }
    },

    enabled: {
      on: {
        UPDATE_GROUP_INTENSITY: {
          actions: assign({
            groups: (context, event) => ({
              ...context.groups,
              [event.groupName]: {
                ...context.groups[event.groupName],
                intensity: event.value
              }
            })
          })
        }
      }
    }
  }
});
```

### 3️⃣ **PROBLÈME ATOMIQUE: 580+ Objets THREE.js**

#### Problème Identifié
```javascript
// Création/gestion massive d'objets
- 400+ particules
- 15 arcs électriques
- 580+ instances géométries
- Memory management éparpillé
```

#### Décomposition Atomique
**Atome C1**: Particules → ParticleSystemMachine
**Atome C2**: Arcs électriques → ElectricArcMachine
**Atome C3**: Géométries → GeometryPoolMachine
**Atome C4**: Memory management → MemoryMachine
**Atome C5**: Object lifecycle → LifecycleMachine

#### Plan de Refactorisation C1 (Particules)
```javascript
// APRÈS (Machine XState)
const particleSystemMachine = createMachine({
  id: 'particles',
  type: 'parallel',

  states: {
    pool: {
      initial: 'initializing',
      context: {
        particles: [],
        activeCount: 0,
        maxCount: 400
      },

      states: {
        initializing: {
          invoke: {
            src: 'createParticlePool',
            onDone: {
              target: 'ready',
              actions: assign({
                particles: (_, event) => event.data.particles
              })
            }
          }
        },

        ready: {
          on: {
            SPAWN_PARTICLE: {
              actions: 'spawnFromPool',
              cond: 'hasAvailableParticles'
            },
            RECYCLE_PARTICLE: {
              actions: 'recycleToPool'
            }
          }
        }
      }
    },

    physics: {
      initial: 'idle',
      states: {
        idle: {
          on: { START_PHYSICS: 'running' }
        },
        running: {
          invoke: {
            src: 'physicsLoop',
            onDone: 'idle'
          }
        }
      }
    }
  }
});
```

### 4️⃣ **PROBLÈME ATOMIQUE: Render Loop 60fps**

#### Problème Identifié
```javascript
// 8 systèmes mis à jour à chaque frame
animationControllerRef.current?.update(deltaTime);
eyeRotationRef.current?.updateEyeRotation(deltaTime);
// ... etc (performance critique)
```

#### Décomposition Atomique
**Atome D1**: Frame scheduling → FrameSchedulerMachine
**Atome D2**: Animation updates → AnimationMachine
**Atome D3**: Physics updates → PhysicsMachine
**Atome D4**: Render pipeline → RenderMachine

#### Plan de Refactorisation D1 (Frame Scheduler)
```javascript
const frameSchedulerMachine = createMachine({
  id: 'frameScheduler',
  initial: 'idle',

  states: {
    idle: {
      on: { START_LOOP: 'running' }
    },

    running: {
      invoke: {
        src: 'frameLoop'
      },

      on: {
        FRAME_TICK: {
          actions: [
            'updateAnimations',
            'updatePhysics',
            'updateRender'
          ]
        }
      }
    }
  }
}, {
  services: {
    frameLoop: () => (callback) => {
      let animationId;
      let lastTime = 0;

      const tick = (time) => {
        const deltaTime = time - lastTime;
        lastTime = time;

        callback({
          type: 'FRAME_TICK',
          deltaTime,
          time
        });

        animationId = requestAnimationFrame(tick);
      };

      animationId = requestAnimationFrame(tick);

      return () => {
        cancelAnimationFrame(animationId);
      };
    }
  }
});
```

## 🔬 MÉTHODOLOGIE DE DÉCOMPOSITION

### Règles Atomiques
1. **Un atome = Un problème précis**
2. **Un atome = Une machine XState**
3. **Un atome = Testable indépendamment**
4. **Un atome = Refactorisable isolément**

### Process de Refactorisation
```
1. IDENTIFIER → Problème atomique précis
2. ISOLER → Extraire la logique concernée
3. MODÉLISER → Créer la machine XState
4. TESTER → Valider le comportement
5. INTÉGRER → Connecter aux autres machines
6. NETTOYER → Supprimer l'ancien code
```

## 📋 PLAN D'ACTION ATOMIQUE

### Phase 1: Fondations (Semaines 1-2) ✅ TERMINÉ
- [ ] **Atome A1-A3**: Services Scene/Renderer/Camera
- [x] **Atome D1**: FrameSchedulerMachine ✅
- [ ] **Atome B8**: RootMachine architecture

### Phase 2: Systèmes Core (Semaines 3-4) ✅ TERMINÉ
- [x] **Atome B1**: BloomMachine ✅
- [x] **Atome B2**: PBRMachine → VisualEffectsMachine ✅
- [ ] **Atome B3**: LightingMachine

### Phase 3: Systèmes Avancés (Semaines 5-6)
- [ ] **Atome C1**: ParticleSystemMachine
- [ ] **Atome C2**: ElectricArcMachine
- [ ] **Atome B4**: EnvironmentMachine

### Phase 4: Integration (Semaines 7-8)
- [ ] **Coordination** toutes les machines
- [ ] **Optimisation** performance
- [ ] **Tests** complets

## 🤝 COLLABORATION PROPOSÉE

**Tu m'aides sur chaque atome** avec des recherches précises :

1. **Je décompose** le problème en atomes
2. **Tu recherches** les détails techniques spécifiques
3. **Ensemble on modélise** la machine XState
4. **Je code** la refactorisation
5. **On teste** et valide
6. **On passe** à l'atome suivant

### ✅ STATUT ATOMES

#### 🎯 Atome D1 - FrameScheduler ✅ COMPLET
- ✅ **Recherches**: 6 phases complétées
- ✅ **Plan technique**: Détaillé et validé
- ✅ **Implémentation**: Machine XState complète
- ✅ **Tests**: Validation fonctionnelle
- ✅ **Compilation**: TypeScript sans erreur
- ✅ **Documentation**: README + guides complets

**📂 Voir**: `15_ATOME_D1_FRAMESCHEDULER_COMPLET.md`

#### 🎯 Atome B1 - BloomMachine ✅ COMPLET
- ✅ **Intégration**: Dans VisualEffectsMachine unifiée
- ✅ **Architecture**: XState parallèle (région bloom)
- ✅ **Tests**: Validation visuelle Three.js
- ✅ **API**: useBloomMachine préservée (rétrocompatibilité)
- ✅ **Performance**: Registry partagé optimisé

**📂 Voir**: `15.1_ATOME_B1_BLOOMACHINE_ANALYSE.md`

#### 🎯 Atome B2 - PBRMachine → VisualEffectsMachine ✅ COMPLET
- ✅ **Architecture**: Machine XState parallèle 4 régions
- ✅ **Implémentation**: Bloom + PBR + Environment + Security
- ✅ **Tests**: Validation React/Three.js complète
- ✅ **API**: Hook `useVisualEffects` unifié
- ✅ **Migration**: Feature flag + 0 breaking change
- ✅ **Performance**: Registry partagé, lazy loading HDR
- ✅ **Validation visuelle**: Contrôle XState → Three.js confirmé

**📂 Voir**: `16.1_ATOME_B2_IMPLEMENTATION_COMPLETE.md`

#### 🎯 Prochains Atomes Prioritaires

**Recommandation**: **Atome C1** ou **C2** (Particle/ElectricArc)
- 🔗 **S'appuie** sur VisualEffectsMachine foundation
- 🎯 **Systèmes avancés** (effets visuels complexes)
- 📊 **Architecture** XState maintenant mature

**Alternatives**:
- 🎯 **Atome A1** (window.scene → SceneService)
- 🎯 **Migration progressive** SceneStateController → XState

**Pour continuer la refactorisation atomique, dis-moi quel atome attaquer ensuite !**