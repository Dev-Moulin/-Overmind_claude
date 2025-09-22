# 🌐 PMREM HDR - EXPLICATION DÉTAILLÉE

## 📋 **QU'EST-CE QUE PMREM HDR ?**

**PMREM** = Pre-filtered Mipmap Radiance Environment Maps  
**HDR** = High Dynamic Range

C'est une technique qui permet d'avoir des **reflections réalistes** sur vos objets 3D en utilisant l'environnement comme source de lumière.

## 🔬 **COMMENT ÇA MARCHE CONCRÈTEMENT**

### **1. Sans PMREM HDR**
```
Objet métallique → Reflète couleur simple → Aspect plastique
```
- Les objets métalliques reflètent juste une couleur unie
- Pas de variations dans les reflections
- Les matériaux PBR ne peuvent pas briller correctement

### **2. Avec PMREM HDR**  
```
Objet métallique → Reflète environnement complet → Aspect réaliste
```
- Les objets reflètent l'environnement qui les entoure
- Variations subtiles selon l'angle de vue
- Les matériaux PBR brillent de façon réaliste

## 🎨 **INTERACTION AVEC LE BACKGROUND**

### **Question : "Le background influence-t-il les reflections ?"**

**RÉPONSE COURTE** : OUI, mais pas directement !

### **Explication détaillée :**

1. **Le Background Scene (scene.background)**
   - C'est juste la couleur/image de fond
   - N'influence PAS directement les reflections
   - Visible derrière vos objets 3D

2. **L'Environment Map (scene.environment)** 
   - C'EST ÇA qui influence les reflections !
   - Peut être différent du background
   - Traité par PMREM pour créer les reflections

### **3 Configurations Possibles**

```javascript
// Config 1 : Background simple, pas de reflections
scene.background = new THREE.Color(0x000000);
scene.environment = null;
// → Objets métalliques ternes

// Config 2 : Background et environment identiques
const hdriTexture = pmremGenerator.fromScene(hdriEnvironment);
scene.background = hdriTexture;
scene.environment = hdriTexture;
// → Background et reflections cohérents

// Config 3 : Background différent de environment
scene.background = new THREE.Color(0x000000); // Fond noir
scene.environment = hdriTexture; // Reflections HDR
// → Fond noir MAIS reflections colorées !
```

## 🔍 **IMPACT SUR VOS MATÉRIAUX PBR**

### **Metalness (Métallique)**
- **0.0** : Pas de reflections environment (mat)
- **0.5** : Mix entre couleur et reflections  
- **1.0** : Reflections environment complètes

### **Roughness (Rugosité)**
- **0.0** : Reflections nettes comme un miroir
- **0.5** : Reflections floues/diffuses
- **1.0** : Presque pas de reflections visibles

### **Vos Réglages Favoris (metalness=0.8, roughness=0.2)**
```javascript
// Avec PMREM HDR actif
material.metalness = 0.8;  // 80% reflections environment
material.roughness = 0.2;  // Reflections assez nettes
// → Résultat : Chrome/métal poli réaliste avec reflections
```

## 💡 **POURQUOI C'EST IMPORTANT POUR VOUS**

### **1. Visibilité des Textures**
- PMREM ajoute des variations subtiles sur les surfaces
- Les détails des textures ressortent mieux
- Les normales maps sont plus visibles

### **2. Cohérence Visuelle**
- Vos objets s'intègrent dans la scène
- L'éclairage paraît naturel
- Les matériaux métalliques brillent correctement

### **3. Performance**
- Calculé une fois au démarrage
- Pas de coût par frame
- Compatible avec MSAA sans problème

## 🎯 **DANS VOTRE SYSTÈME ACTUEL**

```javascript
// Dans useThreeScene.js
const pmremGenerator = new THREE.PMREMGenerator(renderer);
pmremGenerator.compileEquirectangularShader();

// Génération environment HDR
const renderTarget = pmremGenerator.fromScene(new THREE.Scene());
scene.environment = renderTarget.texture;

// Exposé globalement pour coordination
window.pmremGenerator = pmremGenerator;
```

## ❓ **QUESTIONS FRÉQUENTES**

### **Q: Puis-je changer le background sans affecter les reflections ?**
**R:** OUI ! Background et environment sont indépendants.
```javascript
scene.background = new THREE.Color(0xff0000); // Rouge
// Les reflections restent inchangées
```

### **Q: Le background noir donne des reflections noires ?**
**R:** NON ! Si vous avez un environment map séparé.
```javascript
scene.background = black;      // Fond noir
scene.environment = hdriMap;   // Reflections colorées
```

### **Q: Comment avoir des reflections plus intenses ?**
**R:** Augmentez envMapIntensity sur vos matériaux !
```javascript
material.envMapIntensity = 2.0; // Double intensité
```

## 🔧 **OPTIMISATIONS POSSIBLES**

### **1. Qualité PMREM**
```javascript
// Basse qualité (mobile)
pmremGenerator.fromScene(envScene, 0.04); // Blur élevé

// Haute qualité (desktop)  
pmremGenerator.fromScene(envScene, 0.01); // Blur faible
```

### **2. Taille Environment Map**
```javascript
// Mobile : 256x256
// Desktop : 512x512 ou 1024x1024
```

### **3. Mise à jour Dynamique**
```javascript
// Changer environment runtime
function updateEnvironment(newColor) {
  const newEnv = pmremGenerator.fromScene(createEnvScene(newColor));
  scene.environment = newEnv.texture;
}
```

## 🎨 **PRESETS ENVIRONMENT SUGGÉRÉS**

```javascript
// Studio (neutre)
const studioEnv = {
  top: 0xffffff,    // Blanc
  middle: 0x888888, // Gris
  bottom: 0x444444  // Gris foncé
};

// Sunset (chaud)
const sunsetEnv = {
  top: 0xffcc77,    // Orange clair
  middle: 0xff7744, // Orange
  bottom: 0x441111  // Rouge foncé  
};

// Night (froid)
const nightEnv = {
  top: 0x112244,    // Bleu foncé
  middle: 0x111122, // Presque noir
  bottom: 0x000000  // Noir
};
```

## 💡 **CONSEIL PRATIQUE**

Pour vos matériaux métalliques avec preset PBR :
1. Gardez un environment map même subtil
2. Utilisez envMapIntensity pour contrôler l'intensité
3. Le background peut rester noir si vous préférez
4. L'environment donnera vie à vos métaux

**Voulez-vous que j'explique un aspect spécifique plus en détail ?**