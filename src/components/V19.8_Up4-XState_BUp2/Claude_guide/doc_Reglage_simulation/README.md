# Documentation : Cumul et Simulation des Réglages

## Contenu du Dossier

### 1. [Analyse_Cumul_Reglages_PBR_Groupes.md](./Analyse_Cumul_Reglages_PBR_Groupes.md)
**Résumé complet du comportement des réglages**
- Vue d'ensemble du cumul PBR/Groupes
- Tableaux récapitulatifs
- Exemples pratiques
- Recommandations d'usage

### 2. [Guide_Technique_Mecanismes_Cumul.md](./Guide_Technique_Mecanismes_Cumul.md)
**Documentation technique approfondie**
- Pipeline de rendu détaillé
- Formules mathématiques exactes
- Code source et implémentation
- Guide de debug

## Résumé Rapide

### ✅ Ce qui SE CUMULE
- **Multiplicateurs d'intensité** : Ambient × Multiplier, Directional × Multiplier
- **Effets de bloom** : S'additionnent au rendu de base
- **Exposure globale** : Multiplie tout le rendu final
- **Émission des groupes** : S'ajoute aux propriétés PBR

### ❌ Ce qui NE SE CUMULE PAS
- **Metalness/Roughness** : Valeurs remplacées directement
- **Presets** : Écrasent complètement les valeurs précédentes
- **Couleurs** : Remplacement direct, pas d'addition
- **Modes de sécurité** : Changent les couleurs de base

## Points Clés à Retenir

1. **Les réglages PBR et Groupes travaillent en SYNERGIE**
2. **Pas d'accumulation involontaire** grâce aux protections
3. **L'ordre d'application est important**
4. **Les limites automatiques évitent les valeurs extrêmes**

## Utilisation Recommandée

Pour comprendre le système :
1. Lisez d'abord l'**Analyse** pour une vue d'ensemble
2. Consultez le **Guide Technique** pour les détails d'implémentation
3. Utilisez les exemples comme référence

## Limitation Actuelle

⚠️ **Important** : Les paramètres bloom (strength, radius) dans l'onglet Groupes s'appliquent actuellement de manière **globale** et non par groupe individuel.

---

*Documentation créée le 09/02/2025*