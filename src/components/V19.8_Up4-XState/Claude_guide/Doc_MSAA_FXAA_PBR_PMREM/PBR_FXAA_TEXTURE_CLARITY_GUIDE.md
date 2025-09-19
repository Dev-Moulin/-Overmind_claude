# 🔍 PBR & FXAA - AMÉLIORATION CLARTÉ TEXTURES

## 📋 **COMMENT PBR AMÉLIORE LA CLARTÉ**

### **PBR = Physically Based Rendering**

Le PBR améliore la visibilité des textures car il simule comment la lumière interagit **réellement** avec les matériaux.

### **Les 3 Maps Essentielles**

```javascript
// 1. Base Color Map (Albedo)
material.map = textureLoader.load('diffuse.jpg');
// → Couleurs de base sans éclairage

// 2. Normal Map  
material.normalMap = textureLoader.load('normal.jpg');
material.normalScale = new THREE.Vector2(1, 1);
// → Détails de surface, bosses, creux

// 3. Roughness/Metalness Map
material.roughnessMap = textureLoader.load('roughness.jpg');
material.metalnessMap = textureLoader.load('metalness.jpg');
// → Définit comment la lumière se reflète
```

### **Pourquoi les Textures sont Plus Claires avec PBR**

1. **Séparation des Composantes**
   ```
   Sans PBR : Texture = Couleur + Ombres cuites
   Avec PBR : Texture = Couleur pure, ombres calculées dynamiquement
   ```

2. **Micro-détails Préservés**
   - Les normal maps ajoutent des détails sans géométrie
   - Roughness contrôle la netteté des reflections
   - Metalness définit le type de reflection

3. **Éclairage Dynamique**
   - Les textures réagissent à l'angle de vue
   - Les détails apparaissent selon l'éclairage
   - Pas de "baked lighting" qui cache les détails

## 🎨 **FXAA ET CLARTÉ DES TEXTURES**

### **FXAA = Fast Approximate Anti-Aliasing**

FXAA améliore la clarté en réduisant l'aliasing qui peut masquer les détails fins.

### **Comment FXAA Préserve les Détails**

```javascript
// Configuration FXAA optimale pour textures
const fxaaPass = new ShaderPass(FXAAShader);
fxaaPass.material.uniforms['resolution'].value.x = 1 / (width * pixelRatio);
fxaaPass.material.uniforms['resolution'].value.y = 1 / (height * pixelRatio);
```

**Paramètres cachés du FXAA** (actuellement non exposés) :

```glsl
// Dans le shader FXAA
#define FXAA_QUALITY_SUBPIX 0.75  // Qualité sub-pixel (0-1)
#define FXAA_QUALITY_EDGE_THRESHOLD 0.166  // Seuil détection bords
#define FXAA_QUALITY_EDGE_THRESHOLD_MIN 0.0833  // Seuil minimum
```

### **Impact sur les Textures**

- **Sans FXAA** : Bords crénelés cachent détails fins
- **Avec FXAA** : Bords lisses, textures plus nettes
- **Attention** : Trop de FXAA peut flouter

## 💡 **TECHNIQUES POUR PLUS DE CLARTÉ**

### **1. Texture Filtering Avancé**

```javascript
// Anisotropic Filtering (crucial pour textures inclinées)
texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
// → Textures nettes même vues en angle

// Minification filter pour détails
texture.minFilter = THREE.LinearMipmapLinearFilter;
texture.magFilter = THREE.LinearFilter;
```

### **2. Mipmap Bias**

```javascript
// Forcer plus de détails (attention performances)
texture.mipmapBias = -0.5; // Négatif = plus de détails
// Standard = 0, Range utile : -1 à 0
```

### **3. Sharpening Post-Process**

```javascript
// Ajouter après FXAA pour récupérer netteté
const sharpenPass = new ShaderPass(SharpenShader);
sharpenPass.uniforms['amount'].value = 0.3; // Subtil
composer.addPass(sharpenPass);
```

## 🔬 **CE QUI POURRAIT AUSSI AJOUTER DE LA CLARTÉ**

### **1. SMAA (Subpixel Morphological Anti-Aliasing)**

**Avantages sur FXAA** :
- Préserve mieux les détails des textures
- Moins de blur sur les fins détails
- Meilleure détection des patterns

```javascript
// SMAA au lieu de FXAA
const smaaPass = new SMAAPass(width, height);
smaaPass.edgeDetectionThreshold = 0.1;
composer.addPass(smaaPass);
```

### **2. Contrast Adaptive Sharpening (CAS)**

Technique AMD qui améliore la netteté sans artifacts :

```javascript
// CAS Pass personnalisé
const casPass = new ShaderPass(CASShader);
casPass.uniforms['sharpness'].value = 0.6;
// → Détails textures amplifiés intelligemment
```

### **3. Temporal Upsampling + Sharpening**

```javascript
// Render à 0.8x resolution
renderer.setPixelRatio(window.devicePixelRatio * 0.8);

// Upscale avec sharpening
const upscalePass = new ShaderPass(UpscaleSharpenShader);
composer.addPass(upscalePass);
// → Performance + clarté
```

### **4. Detail Normal Maps**

Technique de double normal maps :

```javascript
// Normal map principale
material.normalMap = normalTexture;
material.normalScale.set(1, 1);

// Detail normal map (tiling élevé)
material.detailNormalMap = detailNormalTexture;
material.detailNormalScale = 2.0;
// → Micro-détails sans alourdir textures principales
```

## 🎯 **OPTIMISATIONS POUR VOS BESOINS**

### **Configuration Optimale Actuelle**

```javascript
// PBR Settings (vos préférences)
material.metalness = 0.8;
material.roughness = 0.2;
material.envMapIntensity = 1.0;

// Anti-aliasing  
// MSAA 2x (hardware) + FXAA (post)
renderer.antialias = true;
renderer.samples = 2;
```

### **Améliorations Suggérées**

```javascript
// 1. Anisotropic sur toutes textures
textures.forEach(tex => {
  tex.anisotropy = 16; // Maximum
});

// 2. Normal map enhancement
material.normalScale.set(1.2, 1.2); // +20% détails

// 3. Ajout subtle sharpening
const sharpenPass = new ShaderPass(SimpleSharpenShader);
sharpenPass.uniforms.amount.value = 0.2;
```

## 📊 **ANALYSE DES CONFLITS POSSIBLES**

### **Conflits Settings Identifiés**

1. **FXAA vs Bloom Threshold**
   - FXAA lisse les bords → Bloom peut les détecter différemment
   - Solution : Ajuster bloom threshold après FXAA

2. **PBR Exposure vs Background Color**
   - Background clair → PBR semble surexposé
   - Solution : Exposure adaptive selon background

3. **Normal Scale vs Light Angle**  
   - Normal maps trop fortes + lumière rasante = artifacts
   - Solution : Clamp normal scale selon angle lumière

### **Conflits Hypothétiques à Vérifier**

```javascript
// Test 1 : MSAA samples vs Texture anisotropy
if(msaaSamples > 4 && texture.anisotropy > 8) {
  // Possible conflit mémoire GPU mobile
}

// Test 2 : Multiple post-process vs FPS
if(fxaaEnabled && sharpenEnabled && bloomEnabled) {
  // Cumul peut dépasser budget performance
}

// Test 3 : HDR tone mapping vs PBR metalness
if(toneMapping === THREE.ACESFilmicToneMapping && metalness > 0.8) {
  // Métaux peuvent paraître trop sombres
}
```

## 💡 **RECOMMANDATIONS FINALES**

### **Pour Maximum de Clarté Textures**

1. **Gardez** : MSAA 2x + FXAA (bon compromis)
2. **Ajoutez** : Anisotropic filtering max sur textures
3. **Testez** : SMAA au lieu de FXAA si détails critiques
4. **Évitez** : Trop de post-processing empilés

### **Quick Wins**

```javascript
// 1. Boost anisotropy (immédiat, gratuit sur desktop)
allTextures.anisotropy = 16;

// 2. Fine-tune normal maps
material.normalScale.set(1.3, 1.3);

// 3. Subtle sharpen post-FXAA
addSharpenPass(0.15); // Très subtil
```

**Questions** : 
- Voulez-vous tester SMAA vs FXAA ?
- L'anisotropic filtering est-il déjà activé ?
- Préférez-vous netteté maximale ou douceur ?