// hooks/useFloatingSpace.js
import { useRef, useCallback, useState } from 'react'
import * as THREE from 'three'

export const useFloatingSpace = ({ 
  model, 
  mouse, 
  camera, 
  enabled = true, 
  config: userConfig = {},
  onSyncDataChange = null  // 🆕 Callback pour particules
}) => {
  // Configuration réactive avec useState
  const [config, setConfig] = useState({
    enabled: true,
    sphereRadius: Math.min(window.innerWidth, window.innerHeight), // 100% de la fenêtre
    repulsionStrength: 3.0,      // CENTRÉ à 3.0
    inertia: 0.010,              // CENTRÉ à 0.010
    falloffPower: 1.0,           // CENTRÉ à 1.0
    centerOffset: { x: 0, y: 0, z: 0 },
    deadZone: 0.15,                // Augmenté de 0.1 à 0.15 pour réduire les vibrations
    updateThreshold: 0.02,         // Augmenté de 0.01 à 0.02 pour plus de stabilité
    debugMode: false,
    originPosition: { x: 0, y: 0, z: 0 }, // Position d'origine du modèle
    minMovement: 0.05,            // Nouveau: mouvement minimum pour éviter les micro-corrections
    smoothingFactor: 0.95,        // Nouveau: facteur de lissage pour réduire les saccades
    ...userConfig
  })

  // Refs pour state persistant
  const irisPositionRef = useRef(new THREE.Vector3())
  const currentOffsetRef = useRef(new THREE.Vector3())
  const targetOffsetRef = useRef(new THREE.Vector3())
  const raycasterRef = useRef(new THREE.Raycaster())
  const planeRef = useRef(new THREE.Plane(new THREE.Vector3(0, 0, 1), 0))
  
  // 🆕 Données de synchronisation exposées
  const syncDataRef = useRef({
    direction: new THREE.Vector3(0, 0, -1),    // Direction flux actuelle
    intensity: 0,                              // Intensité 0-1
    isActive: false,                           // État synchronisation
    timestamp: 0                               // Pour éviter updates inutiles
  })
  
  // Anti-vibration system
  const lastMouseRef = useRef({ x: 0, y: 0 })
  const stableCountRef = useRef(0)

  // État debug
  const debugRef = useRef({
    sphereCenter: new THREE.Vector3(),
    mouseDirection: new THREE.Vector3(),
    currentOffset: new THREE.Vector3(),
    effectStrength: 0,
    updateTime: 0,
    centerDetected: false
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
      debugRef.current.centerDetected = true
      return true
    }

    // Fallback : utiliser le centre du bounding box
    const box = new THREE.Box3().setFromObject(model)
    box.getCenter(irisPositionRef.current)
    irisPositionRef.current.y += 1.0 // Approximation tête
    debugRef.current.centerDetected = false
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
    const intersection = raycasterRef.current.ray.intersectPlane(planeRef.current, intersectionPoint)

    if (!intersection) {
      debugRef.current.updateTime = performance.now() - startTime
      return new THREE.Vector3(0, 0, 0)
    }

    // Calculer vecteur de répulsion
    const repulsionVector = new THREE.Vector3()
    repulsionVector.subVectors(irisPositionRef.current, intersectionPoint)
    
    const distance = repulsionVector.length()
    
    // Appliquer seulement la deadZone pour éviter les vibrations au centre
    if (distance < config.deadZone) {
      debugRef.current.updateTime = performance.now() - startTime
      return new THREE.Vector3(0, 0, 0)
    }

    // Normaliser et appliquer falloff
    repulsionVector.normalize()
    const normalizedDistance = Math.min(distance / config.sphereRadius, 1.0)
    const falloffStrength = Math.pow(1 - normalizedDistance, config.falloffPower)
    const effectiveStrength = falloffStrength * config.repulsionStrength

    repulsionVector.multiplyScalar(effectiveStrength)

    // Update debug info
    debugRef.current.mouseDirection.copy(repulsionVector)
    debugRef.current.effectStrength = effectiveStrength
    debugRef.current.updateTime = performance.now() - startTime

    return repulsionVector
  }

  // 🆕 Calcul direction de flux pour particules
  const calculateParticleFlowDirection = useCallback(() => {
    if (!currentOffsetRef.current || currentOffsetRef.current.length() < config.updateThreshold) {
      return new THREE.Vector3(0, 0, -1) // Direction par défaut
    }

    // Direction opposée à la répulsion (flux "fuit" dans même direction)
    const flowDirection = currentOffsetRef.current.clone().normalize()
    return flowDirection
  }, [config.updateThreshold])

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

    // 🆕 Communication avec système particules
    if (onSyncDataChange) {
      const newDirection = calculateParticleFlowDirection()
      const newIntensity = debugRef.current.effectStrength
      const timestamp = performance.now()

      // Update seulement si changement significatif
      if (newDirection.distanceTo(syncDataRef.current.direction) > 0.01 ||
          Math.abs(newIntensity - syncDataRef.current.intensity) > 0.05 ||
          timestamp - syncDataRef.current.timestamp > 16) { // Min 60fps

        syncDataRef.current.direction.copy(newDirection)
        syncDataRef.current.intensity = newIntensity
        syncDataRef.current.isActive = newIntensity > 0.01
        syncDataRef.current.timestamp = timestamp

        onSyncDataChange(syncDataRef.current)
      }
    }
  }, [enabled, model, mouse.x, mouse.y, onSyncDataChange, calculateParticleFlowDirection, config, calculateRepulsion, detectIrisPosition])

  // 4. API PUBLIQUE
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

  // 5. POSITIONS CAMERA PRÉDÉFINIES
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
  }, [camera, CAMERA_POSITIONS.cam1])

  // Fonction pour aller à la position CAM2
  const goToCameraPosition2 = useCallback(() => {
    if (!camera) return
    
    const target = CAMERA_POSITIONS.cam2
    camera.position.set(target.position.x, target.position.y, target.position.z)
    camera.rotation.set(target.rotation.x, target.rotation.y, target.rotation.z)
    
    console.log('📷 Caméra déplacée vers POSITION 2')
  }, [camera, CAMERA_POSITIONS.cam2])

  return {
    isActive: enabled && !!model,
    currentOffset: currentOffsetRef.current,
    effectStrength: debugRef.current.effectStrength,
    setParameters,
    debug: debugRef.current,
    update,
    config: config,
    goToCameraPosition1,
    goToCameraPosition2,
    syncData: syncDataRef.current  // 🆕 Données de sync
  }
}