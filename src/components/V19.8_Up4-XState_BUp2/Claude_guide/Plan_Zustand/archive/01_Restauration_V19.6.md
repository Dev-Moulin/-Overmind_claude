# 🔧 **ÉTAPE 1 : RESTAURATION VERS CODE FONCTIONNEL**
**Durée estimée :** 30 minutes

---

## 🎯 **OBJECTIF**

Restaurer dans V19.7 le code fonctionnel de référence (V19.6) qui a été modifié pendant la migration Zustand ratée. 

**IMPORTANT :** On copie les fichiers V19.6 vers V19.7 pour que V19.7 soit autonome et fonctionne comme V19.6.

---

## 📋 **FICHIERS À RESTAURER**

### **🔄 Commandes de restauration**

```bash
# Aller dans le répertoire V19.7
cd /home/paul/THP_Linux/Dev_++/API_Chrome_Extention/V2_plasmo/Test_Transition_Anim/threejs-react-app/src/components/V19.7_refacto_Centralized_Value_Debug_Panel

# 1. Copier PBRLightingController.js fonctionnel dans V19.7
cp ../V19.6_feat_CCS_BU_de_BU/systems/lightingSystems/PBRLightingController.js systems/lightingSystems/PBRLightingController.js

# 2. Copier DebugPanel.jsx fonctionnel dans V19.7  
cp ../V19.6_feat_CCS_BU_de_BU/components/DebugPanel.jsx components/DebugPanel.jsx

# 3. Copier V3Scene.jsx fonctionnel dans V19.7
cp ../V19.6_feat_CCS_BU_de_BU/components/V3Scene.jsx components/V3Scene.jsx

# 4. Copier useThreeScene.js (valeurs par défaut) dans V19.7
cp ../V19.6_feat_CCS_BU_de_BU/hooks/useThreeScene.js hooks/useThreeScene.js

# 5. Copier index.js fonctionnel dans V19.7
cp ../V19.6_feat_CCS_BU_de_BU/index.js index.js
```

**Note :** Après ces copies, V19.7 devient autonome avec le code fonctionnel et n'a plus besoin de V19.6.

### **🗑️ Fichiers et dossiers à supprimer**

```bash
# Supprimer les slices complexes (garder seulement le dossier pour la suite)
rm -f stores/slices/bloomSlice.js
rm -f stores/slices/pbrSlice.js
rm -f stores/slices/lightingSlice.js
rm -f stores/slices/particlesSlice.js
rm -f stores/slices/backgroundSlice.js
rm -f stores/slices/msaaSlice.js
rm -f stores/slices/securitySlice.js
rm -f stores/slices/metadataSlice.js

# Supprimer les hooks dupliqués
rm -rf stores/hooks/

# Supprimer les composants de test Zustand
rm -f components/DebugPanelV2.jsx
rm -f components/DebugPanelV2Simple.jsx
rm -f components/TestZustandDebugPanel.jsx
rm -f components/TestPhase2Integration.jsx
rm -f components/DualPanelTest.jsx

# Supprimer le SceneStateController
rm -rf systems/stateController/

# Supprimer le middleware complexe
rm -f stores/middleware/logger.js
rm -f stores/middleware/validator.js
rm -f stores/middleware/performance.js
```

---

## ✅ **VALIDATION DE LA RESTAURATION**

### **Tests à effectuer :**

1. **Vérifier que V19.7 fonctionne comme V19.6**
   ```bash
   npm run dev
   # Vérifier que l'application démarre sans erreur
   ```

2. **Tester les fonctionnalités principales :**
   - ✅ Modes de sécurité (SAFE, DANGER, WARNING, SCANNING, NORMAL)
   - ✅ Contrôles bloom (threshold, strength, radius)
   - ✅ Intensités émissives par groupe
   - ✅ Presets éclairage (Studio Pro, Studio Pro +)
   - ✅ Multipliers globaux
   - ✅ Matériaux (metalness, roughness)
   - ✅ Advanced lighting & Area lights
   - ✅ HDR boost
   - ✅ Background

3. **Vérifier les valeurs par défaut :**
   - Threshold: 0.3 (pas 0.15)
   - Strength: 0.8 (pas 0.40)
   - Pas de boost x20/x10 dans PBRLightingController

### **Structure attendue après restauration :**
```
V19.7_refacto_Centralized_Value_Debug_Panel/
├── components/
│   ├── DebugPanel.jsx               ✅ V19.6 restauré
│   └── V3Scene.jsx                  ✅ V19.6 restauré
├── systems/
│   └── lightingSystems/
│       └── PBRLightingController.js ✅ V19.6 restauré
├── hooks/
│   ├── useThreeScene.js             ✅ V19.6 restauré
│   └── useTempBloomSync.js          🔄 Garder (pour Zustand)
├── stores/
│   ├── sceneStore.js                🔄 À simplifier ensuite
│   └── slices/                      📁 Vide, prêt pour debugPanelSlice.js
└── index.js                         ✅ V19.6 restauré
```

---

## 🎯 **RÉSULTAT ATTENDU**

À la fin de cette étape :
- ✅ V19.7 fonctionne exactement comme V19.6
- ✅ Toutes les features fonctionnent parfaitement
- ✅ Aucune régression introduite
- ✅ Base propre pour créer le store Zustand minimal
- ✅ Architecture Zustand complexe supprimée

**Règle de validation :** Si quelque chose ne fonctionne pas comme dans V19.6, c'est qu'il faut restaurer d'autres fichiers.