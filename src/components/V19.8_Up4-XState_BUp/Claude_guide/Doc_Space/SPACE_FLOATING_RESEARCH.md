# 🌌 Feature Space : Flottement Spatial Global
## Documentation de Recherche et Planification V19.3 - Répulsion Globale

---

## 📋 **CONTEXTE DU PROJET**

### Objectif Principal
Créer un effet de **flottement spatial** où **TOUT le modèle 3D** réagit à la position de la souris avec un comportement de répulsion douce, simulant un effet d'apesanteur dynamique et immersif.

### Comportement Souhaité
- **Répulsion globale** : Tout le modèle "fuit" doucement la position de la souris
- **Zone sphérique** centrée sur l'iris/tête avec rayon ajustable (défaut: 3 unités)
- **Effet immersif** : Mouvement fluide avec inertie, sans saccades
- **Intensité réglable** : Force de répulsion paramétrable en temps réel
- **Performance optimale** : Transformation globale unique (pas de traversal d'objets)

### État Actuel (V19.3_Feat-Matrix)
- ✅ Architecture Three.js + React Three Fiber mature
- ✅ Système de suivi souris existant (eye tracking)
- ✅ Infrastructure de debug et configuration avancée
- ✅ Hooks et systèmes modulaires bien établis

---

## 🔬 **RECHERCHE TECHNIQUE APPROFONDIE**

### **Approche 1 : Transformation Globale (Recommandé)**

#### Principe
Application d'un **offset global unique** au modèle entier, calculé en fonction de la position souris et du centre de répulsion.

#### Avantages Three.js/R3F
- **Performance maximale** : Une seule transformation par frame
- **Simplicité** : Pas de traversal de hiérarchie complexe  
- **useFrame()** : Hook R3F parfait pour updates temps réel
- **Vector3.lerp()** : Inertie native Three.js
- **Raycasting** : Projection souris vers plan 3D

#### Sources de Recherche

1. **Three.js Fundamentals - Mouse Interaction**
   - URL : `https://threejs.org/manual/#en/picking`
   - Pattern : Raycasting depuis souris vers objets 3D
   - Usage : Projection position souris sur plan perpendiculaire caméra

2. **React Three Fiber - useFrame Hook**
   - URL : `https://docs.pmnd.rs/react-three-fiber/api/hooks#useframe`
   - Pattern : `useFrame((state, delta) => { /* update logic */ })`
   - Usage : Updates fluides à 60fps avec delta time

3. **Vector Math - Repulsion Algorithm**
   - Source : Game Programming Patterns - Component Pattern
   - Formule : `repulsion = normalize(center - mousePos) * strength * falloff`
   - Usage : Calcul direction et force de répulsion

#### Code Pattern de Base
```javascript
useFrame(() => {
  // 1. Projeter souris sur plan 3D centré sur iris
  const mouseWorld = raycastMouseToPlane(mouse, camera, irisPosition)
  
  // 2. Calculer vecteur répulsion
  const repulsionVector = irisPosition.clone().sub(mouseWorld)
  const distance = repulsionVector.length()
  
  // 3. Appliquer falloff et force
  const falloff = Math.pow(1 - (distance / sphereRadius), falloffPower)
  repulsionVector.normalize().multiplyScalar(strength * falloff)
  
  // 4. Appliquer avec inertie
  currentOffset.lerp(repulsionVector, inertiaDamping)
  model.position.copy(currentOffset)
})
```

### **Approche 2 : Transformation Individuelle (Alternative)**

#### Principe
Application d'offsets individuels à chaque objet 3D en fonction de sa position relative au centre et à la souris.

#### Avantages
- **Effet différentiel** : Parties éloignées bougent moins
- **Réalisme physique** : Simulation plus authentique
- **Contrôle granulaire** : Possibilité d'exclure certains objets

#### Inconvénients
- **Performance** : Traversal complet de la hiérarchie chaque frame
- **Complexité** : Gestion des transformations locales/world
- **Maintenance** : Plus de code et de points de défaillance

---

## 🎯 **ALGORITHMES CLÉS**

### **1. Projection Souris → Plan 3D**

#### Problématique
Convertir position souris 2D (écran) en position 3D dans l'espace du modèle.

#### Solution : Raycasting vers Plan
```javascript
// Créer plan perpendiculaire à caméra, passant par centre (iris)
const cameraDirection = new THREE.Vector3()
camera.getWorldDirection(cameraDirection)
const plane = new THREE.Plane(cameraDirection, irisPosition)

// Raycasting depuis souris
const raycaster = new THREE.Raycaster()
raycaster.setFromCamera(mouseNormalized, camera)
const intersectionPoint = raycaster.ray.intersectPlane(plane)
```

#### Sources Techniques
- **Three.js Ray Class** : `Ray.intersectPlane(plane, target)`
- **Three.js Plane Class** : `Plane.setFromNormalAndCoplanarPoint(normal, point)`
- **Coordinate Systems** : Screen → NDC → World transformation

### **2. Calcul de Répulsion avec Falloff**

#### Formule Mathématique
```
repulsionVector = normalize(centerPos - mousePos3D)
distance = length(centerPos - mousePos3D)
normalizedDistance = clamp(distance / sphereRadius, 0, 1)
falloffStrength = pow(1 - normalizedDistance, falloffPower)
finalRepulsion = repulsionVector * strength * falloffStrength
```

#### Types de Falloff
- **Linéaire** (power=1) : Atténuation constante
- **Quadratique** (power=2) : Atténuation douce puis rapide
- **Cubique** (power=3) : Effet très concentré au centre
- **Logarithmique** : Atténuation très progressive

#### Références Mathématiques
- **Inverse Square Law** : Physique des forces à distance
- **Smoothstep Function** : Interpolation douce 0→1
- **Easing Functions** : Animation et transitions fluides

### **3. Système d'Inertie**

#### Linear Interpolation (LERP)
```javascript
// Transition douce vers position cible
currentPosition.lerp(targetPosition, dampingFactor)
```

#### Paramètres d'Inertie
- **dampingFactor : 0.12** - Vitesse de rattrapage (0=immobile, 1=instantané)
- **updateThreshold : 0.001** - Seuil minimum pour éviter micro-updates
- **maxOffset : 5.0** - Limite sécurité pour éviter positions extrêmes

#### Sources d'Inspiration
- **Unity Lerp Documentation** : Smooth transitions between values
- **Game Feel** (livre Steve Swink) : Juice et responsiveness
- **Tween.js** : Courbes d'easing et timing functions

---

## 🏗️ **ARCHITECTURE D'INTÉGRATION**

### Points d'Ancrage dans V19.3_Feat-Matrix

#### **1. V3Scene.jsx**
- ✅ Point d'orchestration principal
- ✅ Gère déjà camera, model, mouse tracking
- 🔄 **Intégration** : Appeler le hook `useFloatingSpace`

#### **2. Système Mouse Tracking Existant**
- ✅ Infrastructure souris déjà présente (eye tracking)
- ✅ Normalisation coordonnées (-1→1)
- 🔄 **Extension** : Réutiliser pour répulsion spatiale

#### **3. utils/config.js**
- ✅ Configuration centralisée mature
- 🔄 **Ajout** : Section `spaceEffects.floatingSpace`

#### **4. DebugPanel.jsx**
- ✅ Interface debug sophisticated
- 🔄 **Extension** : Curseurs pour paramètres spatiaux

### Nouveau Hook Proposé : `useFloatingSpace.js`

#### Responsabilités
1. **Détection du centre** (iris/tête) comme point de référence
2. **Raycasting souris** vers plan 3D pour position world
3. **Calcul répulsion** avec falloff et limites de sécurité
4. **Application inertie** via interpolation douce
5. **Transform global** appliqué au modèle entier

#### Interface Proposée
```javascript
const useFloatingSpace = ({ model, mouse, camera, enabled, config }) => {
  return {
    isActive: boolean,           // Système actif/inactif
    currentOffset: Vector3,      // Offset actuellement appliqué
    effectStrength: number,      // Force d'effet actuelle (0-1)
    setParameters: (params) => void, // Modification params à chaud
    debug: {                     // Infos debug temps réel
      sphereCenter: Vector3,     // Position centre détecté
      mouseDirection: Vector3,   // Direction répulsion
      updateTime: number,        // Temps calcul (ms)
      centerDetected: boolean    // Centre trouvé ou fallback
    }
  }
}
```

---

## 🎛️ **PARAMÈTRES DE CONFIGURATION**

### Configuration Principale
```javascript
const FLOATING_SPACE_CONFIG = {
  // Zone d'influence
  sphereRadius: 3.0,           // Rayon zone (unités Three.js)
  centerOffset: { x: 0, y: 0, z: 0 }, // Offset depuis iris
  
  // Répulsion
  repulsionStrength: 0.7,      // Force base (0-2)
  falloffPower: 2.0,           // Courbe atténuation (1-4)
  maxDistance: 10.0,           // Distance max d'effet
  deadZone: 0.05,              // Zone morte anti-tremblements
  
  // Dynamiques
  inertia: 0.12,               // Vitesse rattrapage (0-1)
  updateThreshold: 0.001,      // Seuil minimum update
  maxOffsetDistance: 5.0,      // Limite sécurité offset
  
  // Performance
  mouseDeltaThreshold: 0.001,  // Seuil mouvement souris
  lodEnabled: true,            // Level of detail
  lodDistance: 15.0            // Distance LOD activation
}
```

### Presets par Intensité
```javascript
const SPACE_PRESETS = {
  subtle: {
    repulsionStrength: 0.3,
    inertia: 0.08,
    sphereRadius: 2.5,
    falloffPower: 2.2
  },
  marked: {
    repulsionStrength: 0.7,    // Configuration par défaut
    inertia: 0.12,
    sphereRadius: 3.0,
    falloffPower: 2.0
  },
  extreme: {
    repulsionStrength: 1.2,
    inertia: 0.15,
    sphereRadius: 4.0,
    falloffPower: 1.8
  }
}
```

---

## 📊 **PLAN D'IMPLÉMENTATION**

### **Phase 1 : Foundation (1-2h)**
1. **Créer `useFloatingSpace.js`**
   - Structure hook avec useFrame
   - Détection centre iris/tête avec fallbacks
   - Raycasting basique souris → plan 3D

2. **Intégrer dans V3Scene.jsx**
   - Import et appel du hook
   - Transmission model, mouse, camera
   - Application transform global

3. **Configuration de base**
   - Ajout section dans config.js
   - Paramètres initiaux (rayon=3, force=0.7)

### **Phase 2 : Répulsion Spatial (2-3h)**
1. **Système de répulsion complet**
   - Calcul vecteur répulsion avec falloff
   - Application des limites et zones mortes
   - Inertie via LERP avec seuils

2. **Interface debug**
   - Curseurs pour paramètres principaux
   - Visualisation sphere et vecteurs (optionnel)
   - Métriques performance temps réel

3. **Optimisations**
   - Update conditionnel selon mouvement souris
   - LOD selon distance caméra
   - Seuils performance

### **Phase 3 : Polish et Presets (1-2h)**
1. **Presets prédéfinis**
   - Subtil, Marqué, Extrême, Réactif
   - Interface sélection rapide
   - Sauvegarde/chargement configuration

2. **Tests et validation**
   - Différents types de mouvements souris
   - Performance avec modèles complexes
   - Intégration avec systèmes existants

**🎯 Temps total estimé : 4-7 heures**

---

## ⚗️ **ALTERNATIVES ET VARIATIONS**

### **Variation 1 : Répulsion Directionnelle**
Au lieu de répulsion radiale, appliquer une force dans une direction privilégiée (ex: toujours vers l'arrière).

```javascript
const backDirection = new THREE.Vector3(0, 0, 1) // Vers arrière
const repulsionVector = backDirection.multiplyScalar(distance * strength)
```

### **Variation 2 : Répulsion Multi-Points**
Plusieurs centres de répulsion au lieu d'un seul (ex: tête + extrémités des bras).

### **Variation 3 : Effet Gravitationnel**
Au lieu de répulsion, attraction douce vers un point avec oscillation.

### **Variation 4 : Répulsion Asymétrique**
Force différente selon axes X/Y/Z pour effets directionnels.

---

## 🔬 **RECHERCHES COMPLÉMENTAIRES**

### **Forces et Champs**
- **Electromagnetic Fields** : Simulation de répulsion magnétique
- **Fluid Dynamics** : Comportement dans un fluide
- **N-Body Simulation** : Interactions multiples

### **Animation et Easing**
- **Robert Penner Easing** : Courbes d'animation avancées
- **Green Sock (GSAP)** : Techniques d'interpolation
- **Disney Animation Principles** : Timing et spacing

### **Performance 3D**
- **Level of Detail (LOD)** : Réduction détails selon distance
- **Frustum Culling** : Optimisation hors-écran
- **Object Pooling** : Réutilisation objets Three.js

---

## ⚠️ **POINTS D'ATTENTION**

### **Performance**
- **Une transformation par frame** : Très léger computationnellement
- **Pas de traversal** : Évite itération sur hiérarchie complexe
- **Updates conditionnels** : Seuils pour éviter calculs inutiles

### **Stabilité**
- **Limites de sécurité** : MaxDistance, maxOffset pour éviter positions extrêmes
- **Zone morte** : DeadZone pour éviter tremblements près du centre
- **Fallbacks** : Si détection iris échoue, utiliser bounding box

### **Intégration**
- **Coordination souris** : Compatible avec eye tracking existant
- **Préservation hiérarchie** : Pas de modification des bones/animations
- **Systèmes compatibles** : Bloom, particules, etc. non affectés

### **UX/Design**
- **Effet subtil par défaut** : Éviter motion sickness
- **Feedback visuel** : Debug helpers pour comprendre comportement
- **Presets accessibles** : Configurations rapides pour différents usages

---

## 🎯 **CONCLUSION**

Le système de **Flottement Spatial** représente une approche **élégante et performante** pour créer un effet d'immersion spatiale. Contrairement aux approches complexes de manipulation de bones, cette solution utilise une **transformation globale unique** qui garantit :

- **Simplicité d'implémentation** (< 7h développement)
- **Performance maximale** (< 1ms par frame)  
- **Effet visuel immédiat** et ajustable
- **Maintenance aisée** avec architecture modulaire

L'effet sera **marqué** par défaut (force 0.7) pour être bien visible, avec possibilité d'ajustement temps réel via interface debug.

---

**🎯 Status : Recherche Complète ✅**  
**📚 Foundation solide pour implémentation robuste**  
**⏱️ Prêt pour développement Phase 1**

*Space Floating Research v1.0 - Janvier 2025*