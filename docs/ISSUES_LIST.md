# 📋 Liste des Issues GitHub pour l'Implémentation XState

## 🚨 Issues Critiques (Priority: High)

### Issue #1: [SYNC] Synchronisation Manuelle XState ↔ Three.js
**Labels:** `bug`, `synchronization`, `critical`
**Description:**
Le hook `useXStateSync` synchronise manuellement entre XState et Three.js, causant des désynchronisations et des race conditions.

**Tâches:**
- [ ] Analyser les points de synchronisation actuels
- [ ] Identifier les race conditions
- [ ] Implémenter la synchronisation automatique via XState services
- [ ] Tests d'intégration

---

### Issue #2: [BUG] Security Mode Override Sans Notification
**Labels:** `bug`, `ux`, `critical`
**Description:**
Quand le security mode est activé, il force le lighting au maximum sans prévenir l'utilisateur, écrasant ses réglages.

**Tâches:**
- [ ] Ajouter notification avant override
- [ ] Permettre de sauvegarder config avant security mode
- [ ] Option pour désactiver l'override
- [ ] UI pour visualiser l'impact du security mode

---

### Issue #3: [BUG] Bloom Invisible sur Background Clair
**Labels:** `bug`, `rendering`, `validation`
**Description:**
Le bloom devient invisible quand le background est trop clair, sans avertissement utilisateur.

**Tâches:**
- [ ] Implémenter détection de visibilité bloom
- [ ] Ajouter alertes en temps réel
- [ ] Suggérer corrections automatiques
- [ ] Tests avec différentes combinaisons

---

## ✨ Features à Implémenter (Priority: Medium)

### Issue #4: [XSTATE] Système de Checkpoints
**Labels:** `enhancement`, `xstate`, `ux`
**Description:**
Implémenter un système de checkpoints pour sauvegarder et restaurer des configurations.

**Tâches:**
- [ ] Créer la machine checkpoint manager
- [ ] UI pour visualiser les checkpoints
- [ ] Système de comparaison avant/après
- [ ] Limite de 10 checkpoints avec rotation
- [ ] Export/Import de checkpoints

---

### Issue #5: [XSTATE] Analyseur d'Impact en Temps Réel
**Labels:** `enhancement`, `xstate`, `performance`
**Description:**
Analyser automatiquement l'impact d'un changement de paramètre sur les autres.

**Tâches:**
- [ ] Service `analyzeImpacts`
- [ ] Calcul des dépendances
- [ ] UI pour afficher les impacts
- [ ] Optimisation performance < 16ms

---

### Issue #6: [XSTATE] Détecteur de Problèmes
**Labels:** `enhancement`, `xstate`, `validation`
**Description:**
Détecter automatiquement les configurations problématiques avant qu'elles n'affectent le rendu.

**Tâches:**
- [ ] Service `detectProblems`
- [ ] Catalogue des problèmes connus
- [ ] Système de suggestions contextuelles
- [ ] Alertes graduées (info, warning, error)

---

## 🔧 Tâches Techniques (Priority: Low-Medium)

### Issue #7: [REFACTOR] Migration Progressive Zustand → XState
**Labels:** `refactoring`, `technical-debt`
**Description:**
Migrer progressivement de Zustand vers XState tout en maintenant la compatibilité.

**Tâches:**
- [ ] Créer adaptateur Zustand ↔ XState
- [ ] Migration bloom slice
- [ ] Migration lighting slice
- [ ] Migration PBR slice
- [ ] Migration background slice
- [ ] Tests de non-régression

---

### Issue #8: [TEST] Suite de Tests pour Configuration Lab
**Labels:** `testing`, `quality`
**Description:**
Créer une suite complète de tests pour la machine Configuration Lab.

**Tâches:**
- [ ] Tests unitaires des services
- [ ] Tests d'intégration des machines
- [ ] Tests de performance
- [ ] Tests E2E des workflows utilisateur

---

### Issue #9: [DOC] Documentation Développeur XState
**Labels:** `documentation`
**Description:**
Documenter l'architecture XState pour faciliter la maintenance et l'onboarding.

**Tâches:**
- [ ] Guide d'architecture
- [ ] Patterns XState utilisés
- [ ] Guide de contribution
- [ ] Exemples de code

---

## 🎯 Milestones

### Milestone 1: Core Infrastructure (Semaine 1-2)
- Issue #1: Synchronisation
- Issue #4: Checkpoints
- Issue #7: Adaptateur Zustand

### Milestone 2: Intelligence & Detection (Semaine 3-4)
- Issue #5: Impact Analyzer
- Issue #6: Problem Detector
- Issue #2: Security Mode

### Milestone 3: UI & Polish (Semaine 5-6)
- Issue #3: Bloom Visibility
- Issue #8: Tests
- Issue #9: Documentation

## 🏷️ Labels Suggérés

- `bug` - Problème existant
- `enhancement` - Nouvelle fonctionnalité
- `xstate` - Relatif à XState
- `synchronization` - Problème de sync
- `rendering` - Problème visuel
- `critical` - Priorité haute
- `ux` - Impact utilisateur
- `performance` - Optimisation
- `testing` - Tests
- `documentation` - Docs
- `technical-debt` - Dette technique
- `validation` - Validation des données
- `refactoring` - Refactoring code

## 📊 Project Board Structure

### Colonnes Kanban
1. **Backlog** - Toutes les issues non commencées
2. **To Do** - Issues prêtes à être travaillées
3. **In Progress** - En cours de développement
4. **Review** - En cours de review
5. **Testing** - En phase de test
6. **Done** - Terminées

## 🔗 Template de Commit

```
[XSTATE] type: description courte (#issue)

- Détail 1
- Détail 2

Fixes #issue
```

Types: feat, fix, refactor, test, docs, perf

---

*Document créé pour faciliter la création des issues GitHub*
*À copier-coller dans GitHub Issues*