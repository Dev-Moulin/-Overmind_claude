# Analyse du Cumul des Réglages PBR et Groupes

## Résumé Exécutif

**Les réglages PBR et Groupes SE CUMULENT et ne s'écrasent pas mutuellement.**

## Comportement des Réglages Individuels (Onglet PBR)

### 1. Mécanisme de Base
- **Pas de cumul additif** : Les valeurs se remplacent toujours
- **Multiplication** : Les multiplicateurs s'appliquent sur les valeurs du preset actuel
- **Protection contre l'accumulation** : Le système sauvegarde les valeurs originales

### 2. Application des Multiplicateurs

```
Intensité finale = Intensité du preset × Multiplicateur custom
```

**Exemple concret :**
- Preset PBR : `ambient.intensity = 3.0`
- Multiplicateur : `ambientMult = 1.5`
- Résultat : `3.0 × 1.5 = 4.5`

### 3. Limites de Sécurité

| Paramètre | Minimum | Maximum | Raison |
|-----------|---------|---------|---------|
| Exposure | 0.1 | 3.0 | Éviter sur/sous-exposition |
| Roughness (métallique) | 0.05 | 1.0 | Éviter artefacts visuels |
| EnvMapIntensity | - | 2.0 | Limiter les réflexions |
| EmissiveIntensity (bloom) | 3.0 | - | Minimum garanti pour visibilité |

### 4. Réglages qui NE S'ADDITIONNENT PAS

- **Changement de preset** : Écrase complètement les valeurs précédentes
- **Metalness/Roughness** : Valeurs directement remplacées
- **Couleurs des lumières** : Remplacement direct

### 5. Mécanisme Anti-Flash HDR

Pour les matériaux émissifs avec bloom :
- Multiplication × 5.0 de l'emissiveIntensity
- Minimum garanti de 3.0
- Sauvegarde de la valeur originale pour éviter l'accumulation

## Comportement des Réglages Groupes

### 1. Architecture à Trois Niveaux

**Niveau Global :**
- **Threshold** : Affecte TOUTE la scène (PBR + Groupes)
- **Exposure** : Multiplicateur final après tous les calculs

**Niveau Groupe :**
- **Iris** : Œil du robot
- **Eye Rings** : Anneaux autour de l'œil  
- **Reveal Rings** : Anneaux magiques

**Niveau Paramètres :**
- **Strength** : Intensité du bloom (0-10)
- **Radius** : Diffusion du bloom (0-4)
- **Emissive Intensity** : Lumière émise

### 2. Cumul avec le Système PBR

**Les effets SE CUMULENT :**

```
Rendu Final = Propriétés PBR de base
            + Émission des groupes (emissiveIntensity)  
            + Post-processing bloom (strength, radius)
            × Exposure globale
```

### 3. Exemple Pratique de Cumul

**Configuration :**
- Preset : "Chrome Showcase" (metalness=0.9, roughness=0.1)
- Groupe Eye Rings : emissiveIntensity=5.0, bloom strength=8.0
- Threshold global : 0.7
- Exposure : 1.5

**Résultat :**
- Anneaux avec surface chrome très réfléchissante (PBR)
- PLUS halo lumineux intense (bloom)
- MULTIPLIÉ par l'exposure globale
- = Effet chrome lumineux spectaculaire

### 4. Points d'Attention

**Ce qui se cumule :**
- Propriétés émissives des matériaux
- Effets de post-processing
- Multiplicateurs d'intensité

**Ce qui ne se cumule pas :**
- Changement de mode de sécurité (remplace les couleurs)
- Sélection d'un nouveau preset PBR (écrase tout)
- Valeurs de metalness/roughness (remplacement direct)

## Limitation Technique Actuelle

**Important :** Les paramètres bloom (strength, radius) dans l'interface Groupes s'appliquent actuellement de manière **globale** et non par groupe individuel. Seule l'emissiveIntensity est vraiment appliquée par groupe.

## Recommandations d'Usage

### Pour un Rendu Optimal

1. **Choisir d'abord le preset PBR** pour définir l'ambiance de base
2. **Ajuster les multiplicateurs PBR** pour affiner l'éclairage global
3. **Configurer le threshold** pour contrôler la sensibilité du bloom
4. **Régler les groupes individuellement** pour les effets spéciaux
5. **Utiliser l'exposure** en dernier pour l'ajustement final

### Stratégies par Cas d'Usage

**Pour un rendu sombre mystérieux :**
- Preset : "Sombre"
- Threshold : 0.8-0.9 (seuls les éléments très lumineux brillent)
- Groupes : Intensités faibles (1-3)

**Pour un showcase impressionnant :**
- Preset : "Chrome Showcase" ou "Studio Pro"  
- Threshold : 0.5-0.7
- Groupes : Intensités élevées (6-10)
- Exposure : 1.2-1.5

**Pour le développement/debug :**
- Preset : "Lumineux" ou "Métallique Ultra"
- Threshold : 0.3 (voir tous les effets)
- Groupes : Valeurs moyennes

## Conclusion

Le système est conçu pour que les onglets PBR et Groupes travaillent en **synergie**. Les réglages se cumulent intelligemment pour offrir un contrôle granulaire du rendu, avec des protections contre les valeurs extrêmes et l'accumulation involontaire. La combinaison des deux systèmes permet d'obtenir des effets visuels impossibles avec un seul système.