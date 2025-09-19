# 🧪 Test de la Synchronisation Space-Particule

## État de l'implémentation

### ✅ Complété :

1. **Extension API useFloatingSpace**
   - Ajout du callback `onSyncDataChange`
   - Calcul de la direction de flux
   - Exposition des données de synchronisation via `syncData`

2. **Modification ParticleSystemV2**
   - Ajout des propriétés de synchronisation spatiale
   - Méthode `setSpatialSyncData()` pour recevoir les données
   - Méthode `calculateDynamicFlowDirection()` pour calculer la direction
   - Modification de `applyInfiniteFlow()` pour utiliser la direction dynamique
   - Recyclage adaptatif des particules

3. **Bridge de communication dans V3Scene**
   - Callback `handleSpatialSyncChange` créé
   - Connexion entre floating space et particle system

4. **Configuration**
   - Ajout de `particleSync` dans config.js
   - Presets prédéfinis (subtle, balanced, reactive, immersive)

5. **Contrôles Debug**
   - Section synchronisation dans DebugPanel
   - Affichage de l'état de synchronisation
   - Curseurs pour intensité et blend factor
   - Boutons presets rapides

## Comment tester :

1. **Démarrer l'application** (déjà en cours sur le port 5174)
2. **Ouvrir l'onglet "Space"** dans le panneau debug
3. **Activer le flottement spatial** (bouton ON/OFF)
4. **Observer la section "Synchronisation Particules"**
5. **Bouger la souris près du modèle** pour déclencher la répulsion
6. **Vérifier que** :
   - L'état passe à "Actif" quand la souris repousse le modèle
   - La direction change selon la position de la souris
   - L'intensité varie selon la distance
   - Les particules changent de direction en conséquence

## Paramètres à tester :

- **Intensité Sync** : 0 = pas d'effet, 1.0 = effet maximal
- **Mélange** : 0 = flux normal uniquement, 1.0 = flux complètement réactif
- **Presets** : Essayez les différents presets pour voir les variations

## Debug :

Si la synchronisation ne fonctionne pas, vérifier dans la console :
- Que `floatingSpace.syncData` contient bien les données
- Que `particleSystemV2.setSpatialSyncData()` est appelée
- Que `particleSystemV2.spatialSyncEnabled` est true