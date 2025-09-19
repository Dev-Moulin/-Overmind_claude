# 💡 ADVANCED LIGHTING THREE.JS - GUIDE COMPLET

## 📋 **VUE D'ENSEMBLE**

L'éclairage avancé dans Three.js permet d'améliorer considérablement la **visibilité des textures** et le **réalisme** de vos scènes 3D.

## 🔦 **TYPES D'ÉCLAIRAGE AVANCÉ**

### **1. Area Lights (Lumières Surfaciques)**

**Ce que c'est** : Des lumières qui émettent depuis une surface plutôt qu'un point.

```javascript
// Lumière ponctuelle classique
const pointLight = new THREE.PointLight(0xffffff, 1);
// → Ombres dures, éclairage peu naturel

// Area Light (Rectangulataire)
const areaLight = new THREE.RectAreaLight(0xffffff, 5, 4, 2);
// → Ombres douces, éclairage naturel type fenêtre
```

**Impact sur vos textures** :
- Éclairage plus doux et uniforme
- Les détails des normal maps ressortent mieux
- Pas de surexposition locale
- Transitions lumière/ombre plus naturelles

### **2. Light Probes (Sondes de Lumière)**

**Ce que c'est** : Capture l'éclairage ambiant de façon plus précise.

```javascript
// Setup Light Probe
const lightProbe = new THREE.LightProbe();
scene.add(lightProbe);

// Capturer l'environnement
const cubeRenderTarget = new THREE.WebGLCubeRenderTarget(256);
const cubeCamera = new THREE.CubeCamera(0.1, 100, cubeRenderTarget);
cubeCamera.update(renderer, scene);

// Appliquer à la probe
lightProbe.copy(THREE.LightProbeGenerator.fromCubeRenderTarget(
  renderer, 
  cubeRenderTarget
));
```

**Bénéfices** :
- Éclairage indirect réaliste
- Les cavités et détails sont mieux éclairés
- Cohérence lumineuse dans toute la scène

### **3. Cascaded Shadow Maps (CSM)**

**Ce que c'est** : Ombres haute qualité qui s'adaptent à la distance.

```javascript
// Shadow Map classique
directionalLight.shadow.mapSize.width = 2048;
directionalLight.shadow.mapSize.height = 2048;
// → Qualité uniforme, peut pixeliser de près

// Cascaded Shadow Maps
const csm = new THREE.CSM({
  maxFar: 100,
  cascades: 4,
  shadowMapSize: 2048,
  lightDirection: new THREE.Vector3(-1, -1, -1),
  camera: camera
});
```

**Amélioration textures** :
- Ombres nettes sur objets proches
- Détails préservés à toutes distances
- Meilleur contraste texture/ombre

## 🎨 **TECHNIQUES D'ÉCLAIRAGE POUR TEXTURES**

### **1. Three-Point Lighting (Éclairage 3 Points)**

Configuration optimale pour voir les détails :

```javascript
// Key Light (Principale) - 45° angle
const keyLight = new THREE.DirectionalLight(0xffffff, 0.8);
keyLight.position.set(5, 5, 5);

// Fill Light (Remplissage) - Côté opposé, plus douce
const fillLight = new THREE.DirectionalLight(0x88aaff, 0.3);
fillLight.position.set(-5, 3, -5);

// Rim Light (Contour) - Derrière, fait ressortir les bords
const rimLight = new THREE.DirectionalLight(0xffffff, 0.5);
rimLight.position.set(0, 5, -10);
```

### **2. Ambient Occlusion Lighting**

Simule l'occlusion sans post-processing :

```javascript
// Hemisphere Light pour AO naturel
const hemiLight = new THREE.HemisphereLight(
  0xffffff, // Ciel
  0x444444, // Sol
  0.6
);

// Gradient ambiant qui fait ressortir les creux
hemiLight.position.set(0, 20, 0);
scene.add(hemiLight);
```

### **3. HDR Light Intensity**

Utiliser des intensités > 1.0 pour plus de dynamique :

```javascript
// Éclairage HDR
const hdrLight = new THREE.DirectionalLight(0xffffff, 3.0); // 3x intensité
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.8;

// → Les textures brillent dans les hautes lumières
// → Les détails sombres restent visibles
```

## 💎 **AMÉLIORATION SPÉCIFIQUE TEXTURES**

### **1. Normal Map Enhancement**

```javascript
// Ajuster l'éclairage pour les normal maps
material.normalScale = new THREE.Vector2(1.5, 1.5); // Amplifier

// Light angle optimal
directionalLight.position.set(3, 10, 5); // Rasant pour détails
```

### **2. Metallic Surfaces**

Pour vos surfaces métalliques (metalness=0.8) :

```javascript
// Configuration optimale métaux
const metalLight = new THREE.DirectionalLight(0xffffff, 2.0);
metalLight.position.set(5, 10, 5);

// Lumière bleue subtile (simule ciel)
const skyLight = new THREE.DirectionalLight(0x88aaff, 0.3);
skyLight.position.set(0, 10, 0);

// Environment intensity
material.envMapIntensity = 1.5; // Boost reflections
```

### **3. Texture Detail Lighting**

```javascript
// Multi-directional pour tous les détails
const lights = [];
for(let i = 0; i < 4; i++) {
  const angle = (i / 4) * Math.PI * 2;
  const light = new THREE.DirectionalLight(0xffffff, 0.25);
  light.position.set(
    Math.cos(angle) * 5,
    3,
    Math.sin(angle) * 5
  );
  lights.push(light);
  scene.add(light);
}
```

## 🔧 **INTÉGRATION DANS VOTRE SYSTÈME**

### **Configuration Actuelle Améliorée**

```javascript
// PBRLightingController.js - Version Advanced
class PBRLightingController {
  setupAdvancedLighting() {
    // Area Light pour éclairage doux
    if(THREE.RectAreaLight) {
      const areaLight = new THREE.RectAreaLight(0xffffff, 5, 4, 2);
      areaLight.position.set(5, 5, 0);
      areaLight.lookAt(0, 0, 0);
      this.scene.add(areaLight);
      
      // Helper pour visualiser
      const helper = new RectAreaLightHelper(areaLight);
      this.scene.add(helper);
    }
    
    // Light Probe pour ambiant
    const lightProbe = new THREE.LightProbe();
    this.scene.add(lightProbe);
    
    // Multi-light setup
    this.createThreePointLighting();
  }
  
  createThreePointLighting() {
    // Key Light
    this.keyLight = new THREE.DirectionalLight(0xffffff, 0.8);
    this.keyLight.position.set(5, 8, 5);
    this.keyLight.castShadow = true;
    
    // Fill Light  
    this.fillLight = new THREE.DirectionalLight(0x88aaff, 0.3);
    this.fillLight.position.set(-3, 5, -3);
    
    // Rim Light
    this.rimLight = new THREE.DirectionalLight(0xffffff, 0.5);
    this.rimLight.position.set(0, 3, -8);
  }
}
```

## 📊 **IMPACT PERFORMANCE**

### **Coût des Features**
```
Basic Lighting (actuel)     : Baseline
+ Area Lights              : +5-10% GPU
+ Light Probes             : +10-15% GPU  
+ Shadow Maps améliorés    : +10-20% GPU
+ Multi-directional        : +5% GPU par light
```

### **Optimisations Recommandées**

```javascript
// Mobile : Lighting simple
if(isMobile) {
  // 1 directional + 1 ambient
  setupBasicLighting();
} else {
  // Desktop : Full advanced
  setupAdvancedLighting();
}
```

## 🎯 **PRESETS SUGGÉRÉS POUR VOUS**

### **Preset "Texture Detail"**
```javascript
{
  name: "Texture Detail",
  lights: {
    directional: { intensity: 1.0, angle: 45 },
    ambient: { intensity: 0.4 },
    rim: { intensity: 0.6, color: 0xffffff },
    area: { enabled: true, intensity: 3.0 }
  }
}
```

### **Preset "Metallic Showcase"**
```javascript
{
  name: "Metallic Showcase", 
  lights: {
    key: { intensity: 2.0, color: 0xffffff },
    fill: { intensity: 0.5, color: 0x88aaff },
    envMapIntensity: 1.5,
    areaLight: { enabled: true }
  }
}
```

## ❓ **QUESTIONS POUR VOUS**

1. **Priorité** : Voir mieux les textures ou performance optimale ?
2. **Use case** : Showcase produit ou temps réel interactif ?
3. **Devices** : Principalement desktop ou aussi mobile ?

## 💡 **RECOMMANDATION**

Pour votre usage (PBR + métallique + visibilité textures) :

1. **Commencer avec** : Three-point lighting basique
2. **Ajouter si bénéfique** : Une area light pour douceur
3. **Éviter pour l'instant** : Light probes (complexe, peu de gain)
4. **Tester** : HDR intensities > 1.0 avec tone mapping

Cela devrait améliorer significativement la visibilité de vos textures sans trop impacter les performances !

---

## 🔮 **LIGHT PROBES - EXPLICATION DÉTAILLÉE** 
*[Ajouté suite à discussion - Feature future]*

### **🎯 Concept**
Light Probes capturent la couleur de l'environnement pour un éclairage indirect réaliste.

**Sans Light Probes (actuel):**
```
Robot dans pièce rouge → éclairé blanc neutre
Robot dans garage → éclairé blanc neutre
Robot dehors → éclairé blanc neutre
```

**Avec Light Probes:**
```
Robot dans pièce rouge → légèrement teinté rouge par murs
Robot dans garage → reflets bleutés des outils métalliques  
Robot dehors → teinté bleu ciel + reflets verts herbe
```

### **💻 Implémentation Technique**

```javascript
// Capture environnement 360°
const lightProbe = new THREE.LightProbe();
const cubeCamera = new THREE.CubeCamera(0.1, 100, cubeRenderTarget);

// Position au centre du robot
cubeCamera.position.set(0, 0, 0);
cubeCamera.update(renderer, scene);

// Analyse couleurs moyennes dans chaque direction
// Haut: bleu ciel, Bas: vert herbe, Côtés: marron bâtiments
lightProbe.copy(THREE.LightProbeGenerator.fromCubeRenderTarget(
  renderer, 
  cubeRenderTarget
));

scene.add(lightProbe);
```

### **✨ Impact Visuel sur Vos Textures Métalliques**

**Actuellement:**
- Métal chrome → reflets blanc/gris neutres
- Parties sombres → noir/gris uniformes
- Aucune variation couleur environnementale

**Avec Light Probes:**
- Métal chrome → reflets colorés environnement
- Parties sombres → subtiles teintes environnementales
- Transitions colorées réalistes

### **🌍 Intégration avec Vos Thèmes**

```javascript
// Thème "Ville" 
Robot capte: reflets bleus ciel + teintes chaudes bâtiments + néons

// Thème "Espace"
Robot capte: noir profond + reflets bleutés étoiles + contraste froid/chaud

// Coordination avec WorldEnvironmentController nécessaire
worldEnvController.onThemeChange(() => {
  lightProbe.updateFromEnvironment();
});
```

### **📊 Performance & Complexité**

**Coût:**
- +10-15% GPU (capture environnement)
- Recapture requise à chaque changement thème

**Avantages pour VOTRE cas:**
✅ Métalliques plus réalistes (reflets environnementaux)  
✅ Cohérence robot/background
✅ Textures plus "intégrées" dans scène
✅ Plus cinématique avec vos presets environnement

**Inconvénients:**
❌ Complexité coordination avec thèmes
❌ Performance impact
❌ Configuration plus complexe

### **🚀 Recommandation Future**

**Intérêt confirmé pour implémentation ultérieure** - Excellent pour réalisme maximal avec vos thèmes d'environnement colorés/contrastés.

**Alternative simple:** Améliorer système PMREM HDR existant = 80% bénéfices, 20% complexité.

---