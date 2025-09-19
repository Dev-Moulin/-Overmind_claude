# 📚 DOCUMENTATION XSTATE + ZUSTAND MIGRATION

## 🎯 Objectif
Documentation complète sur la migration de Zustand vers XState pour résoudre les problèmes de synchronisation du DebugPanel Three.js.

## 📋 Contenu de la documentation

### **1. Architecture XState**
- **01_ARCHITECTURE_XSTATE.md** - Machines d'état, guards, actions
- **02_INTEGRATION_THREEJS.md** - Intégration avec pmndrs/postprocessing
- **03_CONTEXT_DESIGN.md** - Structure du contexte et types TypeScript

### **2. Migration Zustand → XState**
- **04_MIGRATION_STRATEGY.md** - Stratégie de migration progressive
- **05_COMPATIBILITY_LAYER.md** - Maintien de la compatibilité pendant la transition
- **06_SLICE_CONVERSION.md** - Conversion des slices Zustand vers XState

### **3. Performance et Optimisation**
- **07_PERFORMANCE_OPTIMIZATION.md** - Optimisation des transitions et re-renders
- **08_SHADER_OPTIMIZATION.md** - Éviter les recalculs de shaders inutiles
- **09_BENCHMARKING.md** - Mesure de performance et outils

### **4. Debug et Monitoring**
- **10_DEBUG_TOOLS.md** - Outils de visualisation XState
- **11_MONITORING.md** - Logging et détection de conflits
- **12_DEVTOOLS_INTEGRATION.md** - Intégration avec les devtools existants

### **5. Guides Pratiques**
- **13_ASYNC_HANDLING.md** - Gestion des assets HDRI async
- **14_EFFECT_COMPOSER_PATTERNS.md** - Patterns pour EffectComposer dynamique
- **15_BEST_PRACTICES.md** - Bonnes pratiques et patterns recommandés

## 🔗 Sources
Basé sur les recherches approfondies de GPT sur :
- Pipeline de rendu Three.js optimisé
- Architecture XState pour applications complexes
- Migration Zustand vers XState
- Performance et debugging

## 📅 Création
Décembre 2025 - Documentation technique basée sur l'analyse du projet V19.8_Up4-XState