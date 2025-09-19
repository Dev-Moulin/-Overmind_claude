# 📚 Claude Guide - Documentation Three.js React App

## 🎯 Vue d'Ensemble

Documentation technique complète pour l'application Three.js React avec architecture Zustand/XState, pipeline de rendu avancé et systèmes d'effets visuels.

## 📁 Structure de la Documentation

### **🔄 [Documentation XState Migration](./doc_xstate_zustand/README.md)**
**Migration Zustand → XState pour résoudre les problèmes de synchronisation**

- **[01_ARCHITECTURE_XSTATE.md](./doc_xstate_zustand/01_ARCHITECTURE_XSTATE.md)** - Machines d'état, guards, actions
- **[02_INTEGRATION_THREEJS.md](./doc_xstate_zustand/02_INTEGRATION_THREEJS.md)** - Pipeline Three.js optimisé
- **[04_MIGRATION_STRATEGY.md](./doc_xstate_zustand/04_MIGRATION_STRATEGY.md)** - Stratégie migration progressive
- **[05_COMPATIBILITY_LAYER.md](./doc_xstate_zustand/05_COMPATIBILITY_LAYER.md)** - Couche compatibilité
- **[06_SLICE_CONVERSION.md](./doc_xstate_zustand/06_SLICE_CONVERSION.md)** - Conversion slices Zustand
- **[07_PERFORMANCE_OPTIMIZATION.md](./doc_xstate_zustand/07_PERFORMANCE_OPTIMIZATION.md)** - Optimisation 60 FPS
- **[08_SHADER_OPTIMIZATION.md](./doc_xstate_zustand/08_SHADER_OPTIMIZATION.md)** - Éviter recompilation shader
- **[09_BENCHMARKING.md](./doc_xstate_zustand/09_BENCHMARKING.md)** - Suite benchmarks
- **[10_DEBUG_TOOLS.md](./doc_xstate_zustand/10_DEBUG_TOOLS.md)** - Outils debug XState

### **📋 [Plan Zustand](./Plan_Zustand/)**
**Planification et stratégie d'implémentation**

- **[00_NOUVEAU_PLAN_V19_8_REALISTE.md](./Plan_Zustand/00_NOUVEAU_PLAN_V19_8_REALISTE.md)** - Plan principal migration XState
- **[Doc_Zustand.md](./Plan_Zustand/Doc_Zustand.md)** - Documentation architecture Zustand

### **🎨 [Documentation PBR](./Doc_PBR/)**
**Physically Based Rendering et matériaux**

- **[Introduction_PBR.md](./Doc_PBR/Introduction_PBR.md)** - Introduction au PBR
- **[Architecture_Technique_PBR.md](./Doc_PBR/Architecture_Technique_PBR.md)** - Architecture technique
- **[Onglet_PBR_Guide.md](./Doc_PBR/Onglet_PBR_Guide.md)** - Guide interface utilisateur

### **🔧 [Documentation MSAA/FXAA/PMREM](./Doc_MSAA_FXAA_PBR_PMREM/)**
**Anti-aliasing et rendu HDR avancé**

- **[PMREM_HDR_DETAILED_EXPLANATION.md](./Doc_MSAA_FXAA_PBR_PMREM/PMREM_HDR_DETAILED_EXPLANATION.md)** - PMREM et HDR
- **[PBR_FXAA_TEXTURE_CLARITY_GUIDE.md](./Doc_MSAA_FXAA_PBR_PMREM/PBR_FXAA_TEXTURE_CLARITY_GUIDE.md)** - Clarté textures
- **[SETTINGS_CONFLICTS_ANALYSIS.md](./Doc_MSAA_FXAA_PBR_PMREM/SETTINGS_CONFLICTS_ANALYSIS.md)** - Analyse conflits

### **✨ [Documentation Particules](./Doc_Particule/)**
**Systèmes de particules Canvas et Three.js**

- **[README_DOC_PARTICULE.md](./Doc_Particule/README_DOC_PARTICULE.md)** - Vue d'ensemble
- **[CANVAS_TO_THREEJS_MIGRATION_COMPLETE.md](./Doc_Particule/CANVAS_TO_THREEJS_MIGRATION_COMPLETE.md)** - Migration Canvas→Three.js
- **[TECHNICAL_IMPLEMENTATION_DETAILS.md](./Doc_Particule/TECHNICAL_IMPLEMENTATION_DETAILS.md)** - Détails techniques

### **🌌 [Documentation Space](./Doc_Space/)**
**Environnements spatiaux et flottants**

- **[README_DOC_SPACE.md](./Doc_Space/README_DOC_SPACE.md)** - Vue d'ensemble
- **[SPACE_FLOATING_RESEARCH.md](./Doc_Space/SPACE_FLOATING_RESEARCH.md)** - Recherche flottement
- **[TECHNICAL_IMPLEMENTATION_GUIDE.md](./Doc_Space/TECHNICAL_IMPLEMENTATION_GUIDE.md)** - Guide implémentation

### **🔗 [Documentation Groups](./Doc_groupe/)**
**Système de groupes et sélection**

- **[Introduction_Groupes.md](./Doc_groupe/Introduction_Groupes.md)** - Introduction groupes
- **[Architecture_Technique_Groupes.md](./Doc_groupe/Architecture_Technique_Groupes.md)** - Architecture
- **[Liens_Groups_PBR.md](./Doc_groupe/Liens_Groups_PBR.md)** - Liens avec PBR

### **📊 [Simulation Réglages](./doc_Reglage_simulation/)**
**Analyse cumul réglages et mécanismes**

- **[README.md](./doc_Reglage_simulation/README.md)** - Vue d'ensemble
- **[Analyse_Cumul_Reglages_PBR_Groupes.md](./doc_Reglage_simulation/Analyse_Cumul_Reglages_PBR_Groupes.md)** - Analyse cumul
- **[Guide_Technique_Mecanismes_Cumul.md](./doc_Reglage_simulation/Guide_Technique_Mecanismes_Cumul.md)** - Mécanismes

### **📜 [Archives](./archives/)**
**Historique et versions précédentes**

- Évolution du projet V7 → V19.8
- Corrections et validations techniques
- Historique des discussions et décisions

## 🎯 Objectifs Principaux

### **Performance 60 FPS**
- Pipeline de rendu optimisé : Environment → PBR → Lighting → Bloom → MSAA
- Évitement recompilation shader via pré-instanciation
- Batching et debounce des changements d'état

### **Architecture State Management**
- Migration progressive Zustand → XState
- Résolution race conditions et synchronisation bidirectionnelle
- Couche de compatibilité pour migration sans rupture

### **Qualité Visuelle**
- PBR avec environment mapping HDR
- Anti-aliasing MSAA/FXAA configurable
- Effets post-processing (Bloom, SSAO, DOF)
- Système de particules avancé

## 🔗 Liens Utiles

- **Repository**: [Dev-Moulin/-Overmind_claude](https://github.com/Dev-Moulin/-Overmind_claude)
- **Documentation XState**: [doc_xstate_zustand/](./doc_xstate_zustand/)
- **Plan Migration**: [Plan_Zustand/00_NOUVEAU_PLAN_V19_8_REALISTE.md](./Plan_Zustand/00_NOUVEAU_PLAN_V19_8_REALISTE.md)

## 📅 Dernière Mise à Jour

**Version**: V19.8_Up4-XState
**Date**: Septembre 2025
**Status**: Documentation XState Migration complète

---

🤖 *Documentation générée et maintenue avec Claude Code*