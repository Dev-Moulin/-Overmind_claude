# Guide Technique : Mécanismes de Cumul des Réglages

## Vue d'Ensemble Technique

Ce document détaille les mécanismes techniques exacts de cumul et d'application des réglages dans le système PBR et Groupes.

## 1. Pipeline de Rendu et Points de Cumul

```
Géométrie 3D
    ↓
Matériaux de base (couleur, texture)
    ↓
[POINT 1] Application PBR (metalness, roughness)
    ↓
[POINT 2] Modifications émissives (groupes)
    ↓
Calcul d'éclairage (ambient, directional, etc.)
    ↓
[POINT 3] Multiplicateurs d'intensité
    ↓
[POINT 4] Post-processing (bloom)
    ↓
[POINT 5] Tone mapping et exposure
    ↓
Image finale
```

## 2. Détails par Point de Cumul

### POINT 1 : Application PBR

**Code source :** `PBRLightingController.js:340-350`

```javascript
// Les valeurs PBR REMPLACENT, ne s'additionnent pas
material.metalness = newMetalness;  // Pas de cumul
material.roughness = newRoughness;  // Pas de cumul
```

**Comportement :** REMPLACEMENT DIRECT

### POINT 2 : Modifications Émissives

**Code source :** `BloomControlCenter.js:updateGroupEmissiveIntensity()`

```javascript
// Sauvegarde de la valeur originale
if (!material.userData.originalEmissiveIntensity) {
    material.userData.originalEmissiveIntensity = material.emissiveIntensity;
}

// Application sur la valeur ORIGINALE
material.emissiveIntensity = material.userData.originalEmissiveIntensity * intensity;
```

**Comportement :** MULTIPLICATION sur valeur originale (évite l'accumulation)

### POINT 3 : Multiplicateurs d'Intensité

**Code source :** `PBRLightingController.js:369-374`

```javascript
// Multiplication des intensités de lumière
this.lights.ambient.intensity = preset.ambient.intensity * ambientMult;
this.lights.directional.intensity = preset.directional.intensity * directionalMult;
```

**Formule exacte :**
```
Intensité_finale = Intensité_preset × Multiplicateur_utilisateur
```

**Comportement :** MULTIPLICATION (se cumule avec l'éclairage)

### POINT 4 : Post-Processing Bloom

**Code source :** `SimpleBloomSystem.js`

```javascript
// Le bloom détecte les pixels au-dessus du threshold
if (pixelLuminance > threshold) {
    bloomIntensity = (pixelLuminance - threshold) * strength;
}
```

**Formule du bloom :**
```
Bloom = (Luminance - Threshold) × Strength × Radius_Function
```

**Comportement :** ADDITIF (s'ajoute à l'image de base)

### POINT 5 : Tone Mapping et Exposure

**Code source :** `Three.js renderer`

```javascript
renderer.toneMappingExposure = exposure;
```

**Formule finale :**
```
Couleur_finale = ToneMap(Couleur_HDR × Exposure)
```

**Comportement :** MULTIPLICATION finale sur toute l'image

## 3. Tableaux de Cumul par Paramètre

### Paramètres qui SE CUMULENT

| Paramètre | Type de cumul | Formule | Exemple |
|-----------|---------------|---------|---------|
| Ambient intensity | Multiplication | preset × multiplier | 3.0 × 1.5 = 4.5 |
| Directional intensity | Multiplication | preset × multiplier | 2.0 × 2.0 = 4.0 |
| Emissive (bloom) | Addition | base + (lum - thresh) × str | Visible + Halo |
| Exposure | Multiplication | couleur × exposure | RGB × 1.5 |

### Paramètres qui NE SE CUMULENT PAS

| Paramètre | Comportement | Raison |
|-----------|--------------|---------|
| Metalness | Remplacement | Propriété physique absolue |
| Roughness | Remplacement | Propriété physique absolue |
| Couleur de base | Remplacement | Une seule couleur possible |
| Preset selection | Remplacement total | Nouveau jeu complet de valeurs |

## 4. Cas Spéciaux et Protections

### Protection Anti-Accumulation HDR

```javascript
// Système de tracking pour éviter la multiplication infinie
if (!this.hdrBoostApplied) {
    material.emissiveIntensity *= 5.0;
    this.hdrBoostApplied = true;
}
```

### Limites Automatiques

```javascript
// Clamping automatique
exposure = Math.max(0.1, Math.min(3.0, exposure));
roughness = Math.max(0.05, roughness);  // Évite division par zéro
envMapIntensity = Math.min(2.0, envMapIntensity);
```

## 5. Ordre d'Application Critique

L'ordre d'application est CRUCIAL pour le résultat final :

1. **Preset PBR** (base)
2. **Modificateurs custom** (metalness, roughness)
3. **Multiplicateurs** (ambient, directional)
4. **Groupes émissifs** (par matériau)
5. **Bloom** (post-processing)
6. **Exposure** (final)

Changer cet ordre donnerait des résultats complètement différents !

## 6. Exemples de Calculs Réels

### Exemple 1 : Cumul Simple
```
Base: Chrome (metalness=1.0)
+ Groupe Eye Ring (emissive=5.0)
+ Bloom (strength=8.0, threshold=0.7)
+ Exposure=1.5

Résultat: Surface chrome réfléchissante AVEC halo lumineux
```

### Exemple 2 : Interaction Complexe
```
Preset PBR Optimisé:
- Ambient: 4.25 × multiplier(2.0) = 8.5
- Directional: 5.375 × multiplier(1.0) = 5.375
- HDR Boost actif: emissive × 5.0

+ Groupe Iris:
- EmissiveIntensity: base(1.0) × groupe(3.0) × HDR(5.0) = 15.0
- Bloom détection: 15.0 > threshold(0.8) ✓
- Bloom intensity: (15.0 - 0.8) × strength(6.0) = 85.2

× Exposure finale: tout × 1.2

= Iris extrêmement lumineux avec large halo
```

## 7. Debug : Vérifier les Cumuls

Pour débugger les cumuls :

```javascript
// Dans la console du navigateur
scene.traverse((obj) => {
    if (obj.material && obj.material.emissive) {
        console.log(`${obj.name}:`, {
            metalness: obj.material.metalness,
            roughness: obj.material.roughness,
            emissiveIntensity: obj.material.emissiveIntensity,
            original: obj.material.userData?.originalEmissiveIntensity
        });
    }
});
```

## 8. Bonnes Pratiques

1. **Toujours commencer par un Reset** avant d'expérimenter
2. **Modifier UN paramètre à la fois** pour comprendre son impact
3. **Utiliser le bouton Debug** pour voir les valeurs réelles
4. **Attention aux multiplications en cascade** (peuvent exploser)
5. **Sauvegarder les configurations** qui fonctionnent bien

## Conclusion Technique

Le système utilise une combinaison intelligente de :
- **Remplacements** pour les propriétés physiques absolues
- **Multiplications** pour les intensités et modificateurs
- **Additions** pour les effets de post-processing
- **Protections** contre l'accumulation involontaire

Cette architecture permet un contrôle fin tout en évitant les comportements imprévisibles.