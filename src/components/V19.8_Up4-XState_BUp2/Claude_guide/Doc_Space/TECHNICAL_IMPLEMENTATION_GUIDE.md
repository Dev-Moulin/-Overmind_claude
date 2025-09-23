# 🛠️ Guide Technique d'Implémentation
## Système de Flottement Spatial V19.3 - Répulsion Globale

---

## 🏗️ **ARCHITECTURE TECHNIQUE DÉTAILLÉE**

### Structure des Fichiers
```
V19.3_Feat-Matrix/
├── hooks/
│   └── useFloatingSpace.js         # 🆕 Hook principal
├── systems/
│   └── spaceEffects/               # 🆕 Nouveau système
│       ├── SpaceFloatingController.js
│       ├── RepulsionCalculator.js
│       └── index.js
├── utils/
│   ├── config.js                   # 🔄 Ajout config Space
│   └── spaceHelpers.js            # 🆕 Utilitaires spatiaux
└── components/
    └── V3Scene.jsx                 # 🔄 Intégration hook
```

---

## 🔧 **SPÉCIFICATIONS TECHNIQUES**

### **1. Hook Principal : `useFloatingSpace.js`**

#### Interface TypeScript
```typescript
interface UseFloatingSpaceProps {
  model: THREE.Object3D | null
  mouse: { x: number, y: number }
  camera: THREE.Camera
  enabled?: boolean
  config?: FloatingSpaceConfig
}

interface UseFloatingSpaceReturn {
  isActive: boolean
  currentOffset: THREE.Vector3
  effectStrength: number
  setParameters: (params: Partial<FloatingSpaceConfig>) => void
  debug: DebugInfo
}

interface FloatingSpaceConfig {
  sphereRadius: number
  repulsionStrength: number
  inertia: number
  falloffPower: number
  centerOffset: { x: number, y: number, z: number }
  deadZone: number
  updateThreshold: number
  maxDistance: number
  debugMode: boolean
}
```

#### Implémentation Core
```javascript
// hooks/useFloatingSpace.js
import { useRef, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

export const useFloatingSpace = ({ 
  model, 
  mouse, 
  camera, 
  enabled = true, 
  config: userConfig = {} 
}) => {
  // Configuration réactive avec useState
  const [config, setConfig] = useState({
    enabled: true,
    sphereRadius: Math.min(window.innerWidth, window.innerHeight), // 100% de la fenêtre
    repulsionStrength: 4.0,      // Changé de 0.7 à 4.0
    inertia: 0.010,              // TRÈS réactif (de 0.12 à 0.010)
    falloffPower: 1.0,           // Linéaire (de 2.0 à 1.0)
    centerOffset: { x: 0, y: 0, z: 0 },
    deadZone: 0.15,              // Augmenté pour stabilité
    updateThreshold: 0.02,       // Augmenté pour stabilité  
    debugMode: false,
    originPosition: { x: 0, y: 0, z: 0 }, // Position d'origine du modèle
    minMovement: 0.05,           // Mouvement minimum pour éviter micro-corrections
    smoothingFactor: 0.95,       // Facteur de lissage pour réduire vibrations
    ...userConfig
  })

  // Refs pour state persistant
  const irisPositionRef = useRef(new THREE.Vector3())
  const currentOffsetRef = useRef(new THREE.Vector3())
  const targetOffsetRef = useRef(new THREE.Vector3())
  const raycasterRef = useRef(new THREE.Raycaster())
  const planeRef = useRef(new THREE.Plane(new THREE.Vector3(0, 0, 1), 0))
  
  // Anti-vibration system
  const lastMouseRef = useRef({ x: 0, y: 0 })
  const stableCountRef = useRef(0)

  // État debug
  const debugRef = useRef({
    sphereCenter: new THREE.Vector3(),
    mouseDirection: new THREE.Vector3(),
    currentOffset: new THREE.Vector3(),
    effectStrength: 0,
    updateTime: 0
  })

  // 1. DÉTECTION DU CENTRE (IRIS/TÊTE)
  const detectIrisPosition = () => {
    if (!model) return false

    // Chercher l'iris ou équivalent dans la hiérarchie
    const iris = model.getObjectByName('IRIS') || 
                 model.getObjectByName('Anneaux_Eye_Int') || 
                 model.getObjectByName('Eye')

    if (iris) {
      iris.getWorldPosition(irisPositionRef.current)
      irisPositionRef.current.add(
        new THREE.Vector3(config.centerOffset.x, config.centerOffset.y, config.centerOffset.z)
      )
      return true
    }

    // Fallback : utiliser le centre du bounding box
    const box = new THREE.Box3().setFromObject(model)
    box.getCenter(irisPositionRef.current)
    irisPositionRef.current.y += 1.0 // Approximation tête
    return true
  }

  // 2. CALCUL DE LA RÉPULSION
  const calculateRepulsion = (mouseNormalized) => {
    const startTime = performance.now()

    // Créer plan 3D centré sur iris, perpendiculaire à la caméra
    const cameraDirection = new THREE.Vector3()
    camera.getWorldDirection(cameraDirection)
    planeRef.current.setFromNormalAndCoplanarPoint(cameraDirection, irisPositionRef.current)

    // Raycasting depuis souris vers le plan
    raycasterRef.current.setFromCamera(mouseNormalized, camera)
    const intersectionPoint = new THREE.Vector3()
    raycasterRef.current.ray.intersectPlane(planeRef.current, intersectionPoint)

    if (!intersectionPoint) {
      debugRef.current.updateTime = performance.now() - startTime
      return new THREE.Vector3(0, 0, 0)
    }

    // Calculer vecteur de répulsion
    const repulsionVector = new THREE.Vector3()
    repulsionVector.subVectors(irisPositionRef.current, intersectionPoint)
    
    const distance = repulsionVector.length()
    
    // Appliquer seulement la deadZone pour éviter les vibrations au centre
    // maxDistance a été SUPPRIMÉ pour permettre l'effet partout dans la fenêtre
    if (distance < config.deadZone) {
      debugRef.current.updateTime = performance.now() - startTime
      return new THREE.Vector3(0, 0, 0)
    }

    // Normaliser et appliquer falloff
    repulsionVector.normalize()
    const falloffStrength = Math.pow(1 - (distance / config.sphereRadius), config.falloffPower)
    const effectiveStrength = falloffStrength * config.repulsionStrength

    repulsionVector.multiplyScalar(effectiveStrength)

    // Update debug info
    debugRef.current.mouseDirection.copy(repulsionVector)
    debugRef.current.effectStrength = effectiveStrength
    debugRef.current.updateTime = performance.now() - startTime

    return repulsionVector
  }

  // 3. UPDATE FUNCTION pour render loop
  const update = useCallback(() => {
    if (!enabled || !model || !config.enabled) return

    const hasValidCenter = detectIrisPosition()
    if (!hasValidCenter) return

    // Anti-vibration : vérifier si la souris bouge assez
    const mouseDelta = Math.abs(mouse.x - lastMouseRef.current.x) + Math.abs(mouse.y - lastMouseRef.current.y)
    if (mouseDelta < 0.001) {
      stableCountRef.current++
      // Si la souris est stable depuis longtemps, réduire progressivement l'effet
      if (stableCountRef.current > 60) { // 1 seconde à 60fps
        currentOffsetRef.current.multiplyScalar(0.98) // Diminution progressive
      }
    } else {
      stableCountRef.current = 0
      lastMouseRef.current.x = mouse.x
      lastMouseRef.current.y = mouse.y
    }

    // Calculer répulsion cible
    const mouseVector = new THREE.Vector2(mouse.x, mouse.y)
    const targetRepulsion = calculateRepulsion(mouseVector)

    // Limiter la magnitude pour éviter les sauts extrêmes
    if (targetRepulsion.length() > 2.0) {
      targetRepulsion.normalize().multiplyScalar(2.0)
    }

    // Appliquer inertie avec double lissage pour réduire les vibrations
    targetOffsetRef.current.lerp(targetRepulsion, 0.5) // Premier lissage sur la cible
    
    // Vérifier si le mouvement est suffisamment important
    const deltaMovement = targetOffsetRef.current.distanceTo(currentOffsetRef.current)
    
    if (deltaMovement > config.minMovement) {
      // Appliquer le mouvement avec inertie
      currentOffsetRef.current.lerp(targetOffsetRef.current, config.inertia)
    } else if (deltaMovement < config.minMovement * 0.5) {
      // Si très petit mouvement, appliquer facteur de lissage pour stabiliser
      currentOffsetRef.current.multiplyScalar(config.smoothingFactor)
    }

    // Appliquer transformation globale au modèle seulement si le changement est significatif
    if (currentOffsetRef.current.length() > config.updateThreshold) {
      // Arrondir les valeurs pour éviter les micro-fluctuations
      const roundedX = Math.round((config.originPosition.x + currentOffsetRef.current.x) * 1000) / 1000
      const roundedY = Math.round((config.originPosition.y + currentOffsetRef.current.y) * 1000) / 1000
      const roundedZ = Math.round((config.originPosition.z + currentOffsetRef.current.z) * 1000) / 1000
      
      // Appliquer l'offset depuis la position d'origine
      model.position.set(roundedX, roundedY, roundedZ)
      
      // Update debug
      debugRef.current.currentOffset.copy(currentOffsetRef.current)
      debugRef.current.sphereCenter.copy(irisPositionRef.current)
    }
  }, [enabled, model, mouse.x, mouse.y, config.enabled, config.inertia, config.updateThreshold, config.deadZone, config.falloffPower, config.repulsionStrength, config.sphereRadius, config.minMovement, config.smoothingFactor])

  // 4. DEBUG HELPERS
  const updateDebugHelpers = () => {
    if (!config.debugMode) return

    // TODO: Implémenter helpers visuels
    // - Sphere helper pour zone d'influence  
    // - Arrow helper pour direction répulsion
    // - Point helper pour position souris projetée
  }

  // 5. API PUBLIQUE
  const setParameters = useCallback((newParams) => {
    setConfig(prevConfig => {
      const newConfig = {
        ...prevConfig,
        ...newParams
      }
      
      // Si on désactive, remettre le modèle à la position d'origine
      if (newParams.enabled === false && model) {
        model.position.set(newConfig.originPosition.x, newConfig.originPosition.y, newConfig.originPosition.z)
        currentOffsetRef.current.set(0, 0, 0)
        targetOffsetRef.current.set(0, 0, 0)
      }
      
      return newConfig
    })
  }, [model])

  // 6. POSITIONS CAMERA PRÉDÉFINIES
  const CAMERA_POSITIONS = {
    cam1: {
      position: { x: 0, y: 1.4511, z: 14.2794 },
      rotation: { x: -0.1013, y: 0, z: 0 }
    },
    cam2: {
      position: { x: 0, y: 2.0779, z: 20.4477 },
      rotation: { x: -0.1013, y: 0, z: 0 }
    }
  }

  // Fonction pour aller à la position CAM1
  const goToCameraPosition1 = useCallback(() => {
    if (!camera) return
    
    const target = CAMERA_POSITIONS.cam1
    camera.position.set(target.position.x, target.position.y, target.position.z)
    camera.rotation.set(target.rotation.x, target.rotation.y, target.rotation.z)
    
    console.log('📷 Caméra déplacée vers POSITION 1')
  }, [camera])

  // Fonction pour aller à la position CAM2
  const goToCameraPosition2 = useCallback(() => {
    if (!camera) return
    
    const target = CAMERA_POSITIONS.cam2
    camera.position.set(target.position.x, target.position.y, target.position.z)
    camera.rotation.set(target.rotation.x, target.rotation.y, target.rotation.z)
    
    console.log('📷 Caméra déplacée vers POSITION 2')
  }, [camera])

  return {
    isActive: enabled && !!model,
    currentOffset: currentOffsetRef.current,
    effectStrength: debugRef.current.effectStrength,
    setParameters,
    debug: debugRef.current,
    update,
    config: config,
    goToCameraPosition1,
    goToCameraPosition2
  }
}
```

---

## ⚡ **ALGORITHMES CLÉS**

### **1. Projection Souris → Plan 3D**
```javascript
// Créer un plan perpendiculaire à la caméra, passant par l'iris
const cameraDirection = new THREE.Vector3()
camera.getWorldDirection(cameraDirection)
const plane = new THREE.Plane(cameraDirection, irisPosition)

// Projeter position souris sur ce plan via raycasting
const raycaster = new THREE.Raycaster()
raycaster.setFromCamera(mouseNormalized, camera)
const intersectionPoint = raycaster.ray.intersectPlane(plane)
```

### **2. Calcul de Répulsion avec Falloff**
```javascript
// Vecteur de répulsion (du point souris vers le centre)
const repulsionVector = centerPosition.clone().sub(mousePosition3D)
const distance = repulsionVector.length()

// Application du falloff (courbe d'atténuation)
const normalizedDistance = distance / sphereRadius
const falloffStrength = Math.pow(1 - normalizedDistance, falloffPower)
const finalStrength = falloffStrength * repulsionStrength

repulsionVector.normalize().multiplyScalar(finalStrength)
```

### **3. Inertie et Lissage**
```javascript
// LERP pour mouvement fluide
currentOffset.lerp(targetOffset, inertiaDamping)

// Application avec seuil minimum pour éviter micro-mouvements
if (currentOffset.length() > updateThreshold) {
  model.position.copy(currentOffset)
}
```

---

## 🎛️ **SYSTÈME DE CONFIGURATION**

### **Configuration dans config.js**
```javascript
// utils/config.js - Extension V3_CONFIG
export const V3_CONFIG = {
  // ... configuration existante ...
  
  // 🆕 FLOATING SPACE SYSTEM
  spaceEffects: {
    floatingSpace: {
      // État général
      enabled: true,
      debugMode: false,
      
      // Zone d'influence
      sphereRadius: 3.0,          // Rayon zone (unités Three.js)
      centerOffset: { x: 0, y: 0, z: 0 }, // Offset depuis iris
      
      // Comportement répulsion
      repulsionStrength: 0.7,     // Force de base (0-2)
      falloffPower: 2.0,          // Courbe atténuation (1=linéaire, 2=quadratique)
      maxDistance: 10.0,          // Distance max d'effet
      deadZone: 0.05,             // Zone morte anti-tremblements
      
      // Inertie et réactivité
      inertia: 0.12,              // Vitesse rattrapage (0-1)
      updateThreshold: 0.001,     // Seuil minimum mouvement
      
      // Presets rapides
      presets: {
        subtle: {
          repulsionStrength: 0.3,
          inertia: 0.08,
          sphereRadius: 2.5
        },
        marked: {
          repulsionStrength: 0.7,
          inertia: 0.12,
          sphereRadius: 3.0
        },
        extreme: {
          repulsionStrength: 1.2,
          inertia: 0.15,
          sphereRadius: 4.0
        },
        reactive: {
          repulsionStrength: 0.5,
          inertia: 0.20,
          sphereRadius: 2.0
        }
      }
    }
  }
}
```

---

## 🔧 **INTÉGRATION DANS V3SCENE**

### **Modification de V3Scene.jsx**
```javascript
// components/V3Scene.jsx
import { useFloatingSpace } from '../hooks/useFloatingSpace.js'

export default function V3Scene() {
  // ... code existant ...
  
  // État souris (existing ou nouveau)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  
  // 🆕 FLOATING SPACE INTEGRATION
  const floatingSpace = useFloatingSpace({
    model: modelDataRef.current?.model,
    mouse: mousePosition,
    camera: camera,
    enabled: !isTransitioning && systemsInitialized,
    config: V3_CONFIG.spaceEffects.floatingSpace
  })

  // Gestion mouvement souris (si pas déjà existant)
  useEffect(() => {
    const handleMouseMove = (event) => {
      const rect = canvasRef.current?.getBoundingClientRect()
      if (!rect) return
      
      const x = ((event.clientX - rect.left) / rect.width) * 2 - 1
      const y = -((event.clientY - rect.top) / rect.height) * 2 + 1
      
      setMousePosition({ x, y })
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  // ... rest du code ...

  return (
    <div>
      {/* ... canvas et autres éléments ... */}
      
      {showDebug && (
        <DebugPanel
          // ... props existants ...
          floatingSpace={floatingSpace}  // 🆕 Ajout
        />
      )}
    </div>
  )
}
```

---

## 🐛 **SYSTÈME DE DEBUG**

### **Interface Debug avec Curseurs**
```javascript
// Ajout dans DebugPanel.jsx
{floatingSpace && (
  <div style={{ marginTop: '15px' }}>
    <h5>🌌 Floating Space</h5>
    
    <div style={{ marginBottom: '8px' }}>
      <label>Rayon Sphère: {floatingSpace.config.sphereRadius.toFixed(1)}</label>
      <input
        type="range"
        min="1.0"
        max="10.0"
        step="0.1"
        value={floatingSpace.config.sphereRadius}
        onChange={(e) => floatingSpace.setParameters({ 
          sphereRadius: parseFloat(e.target.value) 
        })}
      />
    </div>
    
    <div style={{ marginBottom: '8px' }}>
      <label>Force Répulsion: {floatingSpace.config.repulsionStrength.toFixed(2)}</label>
      <input
        type="range"
        min="0.0"
        max="2.0"
        step="0.05"
        value={floatingSpace.config.repulsionStrength}
        onChange={(e) => floatingSpace.setParameters({ 
          repulsionStrength: parseFloat(e.target.value) 
        })}
      />
    </div>
    
    <div style={{ marginBottom: '8px' }}>
      <label>Inertie: {floatingSpace.config.inertia.toFixed(3)}</label>
      <input
        type="range"
        min="0.01"
        max="0.5"
        step="0.005"
        value={floatingSpace.config.inertia}
        onChange={(e) => floatingSpace.setParameters({ 
          inertia: parseFloat(e.target.value) 
        })}
      />
    </div>
    
    {/* Debug info */}
    <div style={{ fontSize: '8px', color: '#999' }}>
      Offset: ({floatingSpace.currentOffset.x.toFixed(3)}, {floatingSpace.currentOffset.y.toFixed(3)}, {floatingSpace.currentOffset.z.toFixed(3)})<br/>
      Force: {floatingSpace.effectStrength.toFixed(3)}<br/>
      Temps: {floatingSpace.debug.updateTime.toFixed(2)}ms
    </div>
  </div>
)}
```

---

## ⚡ **OPTIMISATIONS PERFORMANCE**

### **1. Update Conditionnel**
```javascript
// Ne pas calculer si mouvement souris insignifiant
const mouseDelta = Math.abs(mouse.x - lastMouse.x) + Math.abs(mouse.y - lastMouse.y)
if (mouseDelta < updateThreshold) return
```

### **2. Object Pooling**
```javascript
// Réutiliser objets Three.js au lieu de les recréer
const tempVector1 = new THREE.Vector3()  // réutilisé
const tempVector2 = new THREE.Vector3()  // réutilisé
```

### **3. LOD selon Distance Caméra**
```javascript
// Réduire précision si caméra loin
const cameraDistance = camera.position.distanceTo(irisPosition)
const lodFactor = Math.min(1.0, 10.0 / cameraDistance)
const adjustedInertia = config.inertia * lodFactor
```

---

## 🔬 **TESTS ET VALIDATION**

### **Test Cases**
1. **Mouvement souris graduel** → Répulsion proportionnelle
2. **Souris au centre** → Effet minimal/nul 
3. **Souris aux extrémités** → Répulsion maximale
4. **Mouvement rapide souris** → Inertie fluide sans lag
5. **Changement paramètres runtime** → Application immédiate

### **Métriques Performance**
- **Target :** < 1ms par frame
- **Memory :** Pas d'allocation dynamique
- **FPS :** Stable à 60 FPS

---

## 🆕 **NOUVEAUTÉS IMPLÉMENTÉES V19.4**

### **1. Zone d'Effet Globale**
- **Suppression de `maxDistance`** : L'effet fonctionne maintenant partout dans la fenêtre
- **Zone couvre 100% de la fenêtre** : `sphereRadius: Math.min(window.innerWidth, window.innerHeight)`
- **Pas de limite de distance** : Le modèle réagit peu importe où se trouve la souris

### **2. Paramètres Optimisés**
- **Force de répulsion** : `4.0` (au lieu de 0.7) - effet subtil mais visible
- **Inertie** : `0.010` (au lieu de 0.12) - réaction quasi-instantanée
- **Falloff** : `1.0` (au lieu de 2.0) - décroissance linéaire
- **DeadZone** : `0.15` (au lieu de 0.05) - zone morte plus large pour stabilité

### **3. Système Anti-Vibration Avancé**
```javascript
// Double lissage pour réduire les tremblements
targetOffsetRef.current.lerp(targetRepulsion, 0.5) // Premier lissage

// Détection de stabilité souris
if (mouseDelta < 0.001) {
  stableCountRef.current++
  if (stableCountRef.current > 60) {
    currentOffsetRef.current.multiplyScalar(0.98) // Atténuation progressive
  }
}

// Arrondi des valeurs pour éviter les micro-fluctuations
const roundedX = Math.round(value * 1000) / 1000
```

### **4. Positions Caméra Prédéfinies**
- **CAM1** : Position d'origine (x: 0, y: 1.4511, z: 14.2794) - Vue rapprochée
- **CAM2** : Vue éloignée (x: 0, y: 2.0779, z: 20.4477)
- **Boutons remplacés** : Les anciens boutons de capture sont maintenant des boutons de navigation

### **5. Configuration Réactive avec useState**
```javascript
const [config, setConfig] = useState({...})
```
- Permet une mise à jour immédiate des paramètres
- Résout les problèmes de réactivité des contrôles
- Facilite le reset lors de la désactivation

### **6. Intégration dans V3Scene**
```javascript
// Appel de la fonction update dans la render loop
floatingSpace?.update()

// Pas besoin de useFrame - utilise la render loop existante
```

---

**🎯 Guide technique complet avec toutes les améliorations de la V19.4**

*Technical Implementation Guide v1.1 - Janvier 2025*