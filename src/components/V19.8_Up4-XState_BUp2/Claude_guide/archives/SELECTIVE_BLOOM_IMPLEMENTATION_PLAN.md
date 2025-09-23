# 🌈 SELECTIVE BLOOM MULTI-PASS - PLAN D'IMPLÉMENTATION
**Créé:** 2025-01-19 | **Objectif:** Bloom visuellement différents par groupe avec multi-pass rendering

## 🎯 PROBLÈME À RÉSOUDRE

### **Situation Actuelle**
- ✅ **Stockage séparé** : `iris.strength=1.5`, `eyeRings.strength=0.3`, `revealRings.strength=1.0`  
- ❌ **Rendu global** : La dernière valeur appliquée s'affiche pour TOUS les groupes
- ❌ **Limitation** : Impossible d'avoir des effets bloom visuels vraiment différents

### **Objectif Cible** 
- 🎯 **Rendu sélectif** : iris avec bloom fort, eyeRings avec bloom faible, simultanément
- 🎯 **Performance** : Maintenir 30-60 FPS avec multi-pass
- 🎯 **Architecture** : Conserver compatibilité BloomControlCenter existante

---

## 🏗️ ARCHITECTURE TECHNIQUE

### **Approche : Multi-Pass Rendering avec Masques**

```javascript
SelectiveBloomSystem {
  // Pass 1: Rendu scène normale (sans bloom)
  renderNormalScene() → normalTarget
  
  // Pass 2: Masque + Bloom iris uniquement  
  renderMaskedGroup('iris', irisBloomSettings) → irisBloomTarget
  
  // Pass 3: Masque + Bloom eyeRings uniquement
  renderMaskedGroup('eyeRings', eyeRingsBloomSettings) → eyeRingsBloomTarget
  
  // Pass 4: Masque + Bloom revealRings uniquement  
  renderMaskedGroup('revealRings', revealBloomSettings) → revealBloomTarget
  
  // Pass 5: Composition finale
  composeFinalImage(normalTarget + irisBloomTarget + eyeRingsBloomTarget + revealBloomTarget)
}
```

### **Détails Techniques**

#### **1. Masques de Rendu par Groupe**
```javascript
// Créer masques pour isoler chaque groupe
createGroupMask(groupName) {
  const maskMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
  
  scene.traverse((child) => {
    if (belongsToGroup(child, groupName)) {
      child.material = maskMaterial; // Blanc = visible
    } else {
      child.visible = false; // Invisible pour ce pass
    }
  });
}
```

#### **2. Pipeline Bloom par Groupe**
```javascript
renderGroupBloom(groupName, bloomSettings) {
  // 1. Appliquer masque du groupe
  this.createGroupMask(groupName);
  
  // 2. Créer UnrealBloomPass spécifique
  const bloomPass = new UnrealBloomPass(
    resolution, 
    bloomSettings.strength,  // Valeur spécifique au groupe
    bloomSettings.radius,    // Valeur spécifique au groupe  
    bloomSettings.threshold  // Valeur spécifique au groupe
  );
  
  // 3. Rendu vers render target dédié
  composer.render(groupRenderTarget);
  
  // 4. Restaurer visibilité normale
  this.restoreNormalVisibility();
}
```

#### **3. Composition Finale**
```javascript
composeFinalImage() {
  // Shader de composition qui additionne tous les passes
  const compositeShader = {
    uniforms: {
      normalTexture: { value: normalTarget.texture },
      irisBloomTexture: { value: irisBloomTarget.texture },
      eyeRingsBloomTexture: { value: eyeRingsBloomTarget.texture }, 
      revealBloomTexture: { value: revealBloomTarget.texture }
    },
    fragmentShader: `
      // Additionner tous les effets bloom
      vec4 normal = texture2D(normalTexture, vUv);
      vec4 irisBloom = texture2D(irisBloomTexture, vUv);
      vec4 eyeRingsBloom = texture2D(eyeRingsBloomTexture, vUv);
      vec4 revealBloom = texture2D(revealBloomTexture, vUv);
      
      gl_FragColor = normal + irisBloom + eyeRingsBloom + revealBloom;
    `
  };
}
```

---

## 🔧 PLAN D'IMPLÉMENTATION

### **Phase 1: Création SelectiveBloomSystem**

#### **1.1 Nouveau Fichier**
- `systems/bloomEffects/SelectiveBloomSystem.js`
- Remplacer imports SimpleBloomSystem → SelectiveBloomSystem

#### **1.2 Structure de Base**
```javascript
export class SelectiveBloomSystem {
  constructor(scene, camera, renderer) {
    // Render targets pour chaque groupe
    this.normalTarget = new THREE.WebGLRenderTarget();
    this.irisBloomTarget = new THREE.WebGLRenderTarget();
    this.eyeRingsBloomTarget = new THREE.WebGLRenderTarget(); 
    this.revealBloomTarget = new THREE.WebGLRenderTarget();
    
    // Composers séparés par groupe
    this.normalComposer = new EffectComposer(renderer, this.normalTarget);
    this.irisComposer = new EffectComposer(renderer, this.irisBloomTarget);
    // ... etc
    
    // Shader composition finale
    this.finalComposer = new EffectComposer(renderer);
  }
}
```

### **Phase 2: Intégration BloomControlCenter**

#### **2.1 Connexion des APIs**
```javascript
// BloomControlCenter.js - Modification
setBloomParameter(param, value, groupName = null) {
  if (groupName) {
    // Stockage existant (déjà fait)
    this.groupBloomSettings[groupName][param] = value;
    
    // ✅ NOUVEAU : Appliquer au SelectiveBloomSystem
    if (this.renderingEngine && this.renderingEngine.updateGroupBloomSettings) {
      this.renderingEngine.updateGroupBloomSettings(groupName, this.groupBloomSettings[groupName]);
    }
  }
}
```

#### **2.2 Remplacement useSimpleBloom**
- `useSimpleBloom.js` → `useSelectiveBloom.js`  
- Même interface externe, implémentation multi-pass interne

### **Phase 3: Optimisations Performance**

#### **3.1 Mise en Cache**
```javascript
// Cache des masques pour éviter recalculs
maskCache = {
  iris: null,
  eyeRings: null, 
  revealRings: null
};

// Recalculer seulement si objets changent
updateMaskIfNeeded(groupName) {
  if (!this.maskCache[groupName] || this.groupObjectsChanged[groupName]) {
    this.maskCache[groupName] = this.createGroupMask(groupName);
    this.groupObjectsChanged[groupName] = false;
  }
}
```

#### **3.2 Rendu Conditionnel**
```javascript
render() {
  // Skip passes si pas de changements bloom pour ce groupe
  if (this.irisBloomChanged) {
    this.renderGroupBloom('iris', this.groupSettings.iris);
    this.irisBloomChanged = false;
  }
  
  // Toujours composer final
  this.composeFinalImage();
}
```

---

## 📊 IMPACT ET COMPATIBILITÉ

### **Interface Utilisateur** 
- ✅ **Aucun changement** - DebugPanel reste identique
- ✅ **Même API** - BloomControlCenter interface préservée
- ✅ **Ajout fonctionnel** - Effets visuels enfin différents par groupe

### **Performance Estimée**
- **Render Targets** : ~4x mémoire GPU (normal + 3 bloom)
- **Passes de rendu** : ~4x calls de rendu par frame
- **FPS impact** : -20% à -40% selon GPU
- **Optimisation** : Cache + rendu conditionnel pour minimiser impact

### **Compatibilité Code**
- ✅ **V3Scene.jsx** - Aucune modification requise
- ✅ **BloomControlCenter.js** - Extension de l'API existante  
- ✅ **DebugPanel.jsx** - Aucune modification requise
- ⚠️ **useSimpleBloom.js** - Remplacement par useSelectiveBloom.js

---

## 🎮 TESTS DE VALIDATION

### **Test Visuel Cible**
1. **Iris** : strength=1.5, radius=0.8 → Bloom très fort et large
2. **EyeRings** : strength=0.2, radius=0.2 → Bloom très faible et serré  
3. **RevealRings** : strength=1.0, radius=0.5 → Bloom moyen
4. **Résultat** : 3 effets bloom **visuellement différents simultanément**

### **Test Performance**
- **Baseline** : FPS actuel avec SimpleBloomSystem
- **Target** : Minimum 85% des FPS baseline (ex: 60 FPS → 50+ FPS)
- **Profiling** : Temps GPU par pass de rendu

### **Test Régression**
- ✅ PBR lighting fonctionne toujours
- ✅ Contrôles exposure/themes fonctionnent  
- ✅ Interface DebugPanel responsive
- ✅ Matériaux GLB restent visibles

---

## 🚀 PROCHAINES ÉTAPES

### **Étape 1 : Prototype Minimal**
- Créer SelectiveBloomSystem avec 2 groupes seulement (iris + eyeRings)
- Test visuel rapide : bloom fort vs bloom faible simultané

### **Étape 2 : Intégration Complète** 
- Ajouter 3ème groupe (revealRings)
- Connecter à BloomControlCenter existant
- Remplacement useSimpleBloom → useSelectiveBloom

### **Étape 3 : Optimisation & Polish**
- Cache des masques et rendu conditionnel
- Tests performance et ajustements
- Documentation finale

**Temps estimé** : 2-3h implémentation + 1h tests et optimisation

**Bénéfice utilisateur** : Contrôles bloom enfin fonctionnels visuellement avec des effets vraiment différents par groupe !