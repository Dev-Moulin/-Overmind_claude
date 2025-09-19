// 🎭 V3Scene V18 - PARTICULE SYSTEM INTÉGRÉ
import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as THREE from 'three';
import { useThreeScene } from '../hooks/useThreeScene.js';
import { useModelLoader } from '../hooks/useModelLoader.js';
import { useRevealManager } from '../hooks/useRevealManager.js';
import { useTriggerControls } from '../hooks/useTriggerControls.js';
import { useCameraFitter } from '../hooks/useCameraFitter.js';
import { useFloatingSpace } from '../hooks/useFloatingSpace.js';

// Systems
import { AnimationController } from '../systems/animationSystemes/index.js';

// ✅ PHASE 4: Import diagnostic
import '../tests/PHASE_4_VALIDATION_DIAGNOSTIC.js';
import { EyeRingRotationManager } from '../systems/eyeSystems/index.js';
import { ModelRotationManager } from '../systems/eyeSystems/ModelRotationManager.js';
import { RevealationSystem } from '../systems/revelationSystems/index.js';
import { ObjectTransitionManager } from '../systems/transitionObjects/index.js';
import { BloomControlCenter } from '../systems/bloomEffects/BloomControlCenter.js';
import { WorldEnvironmentController } from '../systems/environmentSystems/WorldEnvironmentController.js';
import { PBRLightingController } from '../systems/lightingSystems/PBRLightingController.js';
import { ParticleSystemController } from '../systems/particleSystems/index.js';

// 🎯 NOUVEAU : Contrôleur Central de Synchronisation
import { SceneStateController } from '../systems/stateController/index.js';

// Components
import DebugPanel from './DebugPanel.jsx';
import TestZustandDebugPanel from './TestZustandDebugPanel.jsx';
import DebugPanelV2Simple from './DebugPanelV2Simple.jsx';
import DualPanelTest from './DualPanelTest.jsx';
import SimpleTest from './SimpleTest.jsx';

// 🚀 TEMPORARY: Phase 1 sync hook
import { useTempBloomSync } from '../hooks/useTempBloomSync.js';

// Configuration
import { V3_CONFIG } from '../utils/config.js';

export default function V3Scene() {
  const canvasRef = useRef();
  
  // ✅ HOOKS PRINCIPAUX
  const { 
    scene, 
    camera, 
    renderer,           // ✅ AJOUTÉ POUR INTERACTIVE LIGHTS
    controls, 
    isInitialized, 
    startRenderLoop,
    setExposure,        // ✅ NOUVEAU V8
    getExposure,        // ✅ NOUVEAU V8
    setBackground,      // ✅ NOUVEAU : Contrôle Background
    getBackground,      // ✅ NOUVEAU : Contrôle Background
    bloomSystem,        // ✅ COORDINATION : Référence SimpleBloomSystem
    getLights          // ✅ COORDINATION PBR : Accès aux lumières pour PBRLightingController
  } = useThreeScene(canvasRef);
  const { model, loadModel } = useModelLoader();
  const { magicRingsInfo } = useRevealManager();
  const { updateZone } = useTriggerControls();
  const { fitCameraToObject } = useCameraFitter();

  // ✅ STATES STABLES
  const [showDebug, setShowDebug] = useState(true);
  const [forceShowRings, setForceShowRings] = useState(false);
  const [currentAnimation, setCurrentAnimation] = useState('permanent');
  const [modelLoaded, setModelLoaded] = useState(false);
  const [systemsInitialized, setSystemsInitialized] = useState(false);
  
  // DEBUG supprimé - causait spam console
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [securityState, setSecurityState] = useState(null); // Pas de preset par défaut
  
  // 👁️ Mode de contrôle souris
  const [mouseControlMode, setMouseControlMode] = useState('navigation'); // 'navigation' ou 'eyeTracking'
  
  // 🌌 Position souris pour floating space
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  
  // ✅ FLAGS POUR ÉVITER BOUCLES
  const loadingRef = useRef(false);
  const initRef = useRef(false);

  // ✅ SYSTEMS REFS - TOUS LES SYSTÈMES V18 + PARTICULES
  const animationControllerRef = useRef();
  const eyeRotationRef = useRef();
  const revelationSystemRef = useRef();
  const objectTransitionRef = useRef();
  const bloomControlCenterRef = useRef();
  const worldEnvironmentControllerRef = useRef();
  const pbrLightingControllerRef = useRef();
  const particleSystemControllerRef = useRef();
  
  // 👁️ NOUVEAU : Gestionnaire rotation modèle complet
  const modelRotationManagerRef = useRef();
  
  // 🎯 CCS : Contrôleur Central de Synchronisation
  const stateControllerRef = useRef();
  
  // ✅ DONNÉES MODÈLE PERSISTANTES
  const modelDataRef = useRef({ animations: null, magicRings: [], model: null });

  // 🆕 Callback synchronisation particules
  const handleSpatialSyncChange = useCallback((syncData) => {
    if (particleSystemControllerRef.current?.particleSystemV2) {
      particleSystemControllerRef.current.particleSystemV2.setSpatialSyncData(syncData)
    }
  }, [])

  // 🌌 FLOATING SPACE SYSTEM
  const floatingSpace = useFloatingSpace({
    model: modelDataRef.current?.model,
    mouse: mousePosition,
    camera: camera,
    enabled: !isTransitioning && systemsInitialized && V3_CONFIG.spaceEffects.floatingSpace.enabled,
    onSyncDataChange: handleSpatialSyncChange,  // 🆕 Callback
    config: {
      sphereRadius: V3_CONFIG.spaceEffects.floatingSpace.sphere.radius,
      repulsionStrength: V3_CONFIG.spaceEffects.floatingSpace.repulsion.strength,
      inertia: V3_CONFIG.spaceEffects.floatingSpace.dynamics.inertia,
      falloffPower: V3_CONFIG.spaceEffects.floatingSpace.repulsion.falloffPower,
      centerOffset: V3_CONFIG.spaceEffects.floatingSpace.sphere.centerOffset,
      deadZone: V3_CONFIG.spaceEffects.floatingSpace.repulsion.deadZone,
      updateThreshold: V3_CONFIG.spaceEffects.floatingSpace.dynamics.updateThreshold,
      debugMode: V3_CONFIG.spaceEffects.floatingSpace.debugMode
    }
  });

  // 🚀 TEMPORARY: Phase 1 Zustand sync test
  useTempBloomSync(systemsInitialized);

  // ✅ FONCTION STABLE POUR CHARGEMENT
  const handleLoadModel = useCallback((scene) => {
    if (loadingRef.current) return;
    
    loadingRef.current = true;

    loadModel(scene, (result) => {
      if (!result) {
        loadingRef.current = false;
        return;
      }
      
      const { magicRings, animations, model } = result;
      
      // ✅ Stocker TOUTES les données nécessaires
      modelDataRef.current = { animations, magicRings, model };
      // ✅ SUPPRIMÉ : Log pour réduire spam console
      
      // ✅ COORDINATION : Initialiser BloomControlCenter avec SimpleBloomSystem
      if (!bloomControlCenterRef.current) {
        bloomControlCenterRef.current = new BloomControlCenter(bloomSystem);
        // ✅ SUPPRIMÉ : Log pour réduire spam console
      }
      
      // ✅ RESTAURÉ V5 : Détecter et configurer les objets bloom
      const _bloomObjectsCount = bloomControlCenterRef.current.detectAndRegisterBloomObjects(model);
      
      // ✅ COORDINATION : Synchroniser objets avec moteur de rendu
      bloomControlCenterRef.current.syncWithRenderingEngine();
      
      // 🔧 SUPPRIMÉ : Ne plus forcer NORMAL au démarrage - laisser Zustand définir les valeurs d'origine
      // Les presets de sécurité ne s'appliquent que sur action utilisateur explicite
      
      // 🔥 CORRECTION CRITIQUE: Déclencher state pour initializeSystems
      // ✅ SUPPRIMÉ : Log pour réduire spam console
      setModelLoaded(true);
    });
  }, [loadModel, bloomSystem]); // ✅ COORDINATION : Ajouter bloomSystem comme dépendance


  // ✅ PMREM PHASE 1: EXPOSER SCENE GLOBALEMENT pour coordination environnement HDR
  useEffect(() => {
    if (scene) {
      window.scene = scene;
    }
    return () => {
      if (window.scene) {
        delete window.scene;
      }
    };
  }, [scene]);

  // 🔧 EXPOSER RENDERER ET CAMERA GLOBALEMENT pour BloomControlCenter
  useEffect(() => {
    if (renderer) {
      window.renderer = renderer;
    }
    if (camera) {
      window.camera = camera;
    }
    return () => {
      if (window.renderer) {
        delete window.renderer;
      }
      if (window.camera) {
        delete window.camera;
      }
    };
  }, [renderer, camera]);

  // ✅ LOAD MODEL - CORRIGÉ ESLINT
  useEffect(() => {
    if (!scene || !isInitialized) return;
    handleLoadModel(scene);
  }, [scene, isInitialized, handleLoadModel]);

  // ✅ FONCTION STABLE POUR AJUSTEMENT CAMÉRA
  const handleCameraFit = useCallback(() => {
    if (camera && controls && fitCameraToObject && model) {
      const _cameraInfo = fitCameraToObject(camera, model, controls, 1.8);
    }
  }, [camera, controls, fitCameraToObject, model]);

  // ✅ FONCTION STABLE POUR INITIALISATION SYSTÈMES - CORRIGÉE
  const initializeSystems = useCallback(() => {
    if (initRef.current || !scene || !modelDataRef.current?.animations || !modelDataRef.current?.model) {
      return;
    }
    
    initRef.current = true;

    // 🎯 CCS: Initialiser le contrôleur central en premier
    if (!stateControllerRef.current && renderer && scene) {
      stateControllerRef.current = new SceneStateController();
      
      // Connecter les systèmes de base
      stateControllerRef.current.connectSystem('renderer', renderer);
      stateControllerRef.current.connectSystem('scene', scene);
      
      // ✅ CORRECTION : Exposer pour debug
      window.stateController = stateControllerRef.current;
      
      console.log('✅ SceneStateController initialisé et exposé globalement');
      
      // 🎯 CCS: Connecter les systèmes déjà créés
      if (bloomControlCenterRef.current) {
        stateControllerRef.current.connectSystem('bloomController', bloomControlCenterRef.current);
        // ✅ SUPPRIMÉ : Log pour réduire spam console
      }
      if (bloomSystem) {
        stateControllerRef.current.connectSystem('simpleBloom', bloomSystem);
        // ✅ SUPPRIMÉ : Log pour réduire spam console
      }
    }

    // ✅ ANIMATION CONTROLLER - CORRIGÉ (comme V5/V6-backup-claude)
    if (modelDataRef.current.animations && modelDataRef.current.model) {
      animationControllerRef.current = new AnimationController(
        modelDataRef.current.model,
        modelDataRef.current.animations
      );
      
      // ✅ AJOUTER LES CALLBACKS
      animationControllerRef.current.onTransitionComplete = () => {
        setIsTransitioning(false);
        setCurrentAnimation('permanent');
      };
      
      
      // ✅ CORRIGÉ : Démarrer les animations immédiatement (comme V5/V6-backup-claude)
      animationControllerRef.current.startPermanentAnimations();
      
      // 🔄 RETRY MECHANISM : Forcer de nouveau après 500ms pour contourner les problèmes de timing
      setTimeout(() => {
        if (animationControllerRef.current) {
          // ✅ SUPPRIMÉ : Log pour réduire spam console
          animationControllerRef.current.startPermanentAnimations();
        }
      }, 500);
    }

    // ✅ EYE ROTATION MANAGER avec caméra pour suivi souris (anneaux seulement)
    eyeRotationRef.current = new EyeRingRotationManager(animationControllerRef.current, camera);
    eyeRotationRef.current.initialize();
    eyeRotationRef.current.forceEyeRotation();
    eyeRotationRef.current.disableMouseTracking();
    
    // 👁️ NOUVEAU : MODEL ROTATION MANAGER (tout le modèle 3D)
    modelRotationManagerRef.current = new ModelRotationManager(modelDataRef.current.model, camera);
    modelRotationManagerRef.current.disableMouseTracking(); // Démarrage en mode navigation
    

    // ✅ SAUTÉ : SecurityIRISManager remplacé par BloomControlCenter

    // ✅ REVELATION SYSTEM
    revelationSystemRef.current = new RevealationSystem(modelDataRef.current.magicRings);
    // 👁️ NOUVEAU : Passer référence du modèle pour rotation cohérente
    revelationSystemRef.current.setModelReference(modelDataRef.current.model);
    // ❌ SUPPRIMÉ : Anneaux invisibles par défaut
    // revelationSystemRef.current.setForceShowAll(true);
    
    // 🔧 EXPOSER GLOBALEMENT pour synchronisation Zustand
    window.revelationSystem = revelationSystemRef.current;

    // ✅ OBJECT TRANSITION MANAGER
    objectTransitionRef.current = new ObjectTransitionManager(modelDataRef.current.model);
    // ✅ SUPPRIMÉ : Log pour réduire spam console

    // 🌟 V2: NOUVEAU SYSTÈME DE PARTICULES 3D
    if (!particleSystemControllerRef.current) {
      particleSystemControllerRef.current = new ParticleSystemController(scene, camera, {
        spatialSync: V3_CONFIG.spaceEffects.particleSync // 🆕 Config sync
      });
      particleSystemControllerRef.current.initialize();
      console.log('🚀 ParticleSystemV2 initialisé avec zones d\'exclusion et comportements 3D');
      
      // 🎯 CCS: Connecter le système de particules
      if (stateControllerRef.current) {
        stateControllerRef.current.connectSystem('particleSystem', particleSystemControllerRef.current);
      }
    }


    // ✅ PMREM PHASE 1: WORLD ENVIRONMENT CONTROLLER avec coordination HDR
    if (!worldEnvironmentControllerRef.current) {
      worldEnvironmentControllerRef.current = new WorldEnvironmentController(setExposure);
      
      // ✅ PMREM PHASE 1: Initialiser coordination avec PMREMGenerator
      const _pmremSuccess = worldEnvironmentControllerRef.current.initializePMREMCoordination();
    }

    // 🎯 CCS: PMREM PHASE 1: PBR LIGHTING CONTROLLER avec coordination HDR complète
    if (!pbrLightingControllerRef.current && renderer && getLights) {
      // ✅ COORDINATION : Récupérer lumières de useThreeScene
      const lights = getLights();
      
      // ✅ Injecter lumières existantes dans PBRLightingController
      pbrLightingControllerRef.current = new PBRLightingController(scene, renderer, camera, lights);
      const success = pbrLightingControllerRef.current.init();
      
      if (success) {
        // 🎯 CCS: Connecter PBRLightingController avec le bon nom
        if (stateControllerRef.current) {
          stateControllerRef.current.connectSystem('pbrLightingController', pbrLightingControllerRef.current);
          // 🔧 CORRECTION: Connecter aussi sous le nom 'pbrController' pour compatibilité
          stateControllerRef.current.connectSystem('pbrController', pbrLightingControllerRef.current);
          console.log('✅ PBRLightingController connecté au SceneStateController (pbrLightingController + pbrController)');
        }
        
        // 🔧 EXPOSER pour debug
        window.pbrLightingController = pbrLightingControllerRef.current;
        
        // ✅ PMREM PHASE 1: Établir coordination environnement HDR
        if (worldEnvironmentControllerRef.current) {
          const _coordSuccess = pbrLightingControllerRef.current.initializeEnvironmentCoordination(
            worldEnvironmentControllerRef.current
          );
          
          // ✅ PMREM PHASE 1: Synchronisation initiale environnement
          pbrLightingControllerRef.current.synchronizeEnvironment();
        }
        
      } else {
        console.error('❌ Échec initialisation PBRLightingController');
      }
    }

    // 🔥 NOUVEAU : Signaler que les systèmes sont initialisés
    // ✅ SUPPRIMÉ : Log pour réduire spam console
    setSystemsInitialized(true);
    
  }, [scene, camera, setExposure, bloomSystem, renderer, getLights]);


  // ✅ INITIALISATION SYSTÈMES - DÉCLENCHÉE PAR CHARGEMENT MODÈLE
  useEffect(() => {
    if (modelLoaded && modelDataRef.current?.animations && modelDataRef.current?.model) {
      // ✅ SUPPRIMÉ : Log pour réduire spam console
      initializeSystems();
    }
  }, [modelLoaded, initializeSystems]);
  
  // ✅ FALLBACK INITIALISATION SYSTÈMES (ancien système)
  useEffect(() => {
    if (!modelLoaded) {
      initializeSystems();
    }
  }, [initializeSystems, modelLoaded]);

  // ✅ PMREM PHASE 1: Synchronisation systèmes lors changements thème environnement
  useEffect(() => {
    // Créer un observer pour les changements d'environnement via window.scene
    if (worldEnvironmentControllerRef.current && pbrLightingControllerRef.current) {
      
      // Définir fonction de synchronisation globale
      const syncSystemsOnThemeChange = () => {
        if (pbrLightingControllerRef.current && worldEnvironmentControllerRef.current) {
          pbrLightingControllerRef.current.synchronizeEnvironment();
        }
      };
      
      // Exposer fonction globalement pour WorldEnvironmentController
      window.syncPMREMSystems = syncSystemsOnThemeChange;
      
    }
    
    return () => {
      if (window.syncPMREMSystems) {
        delete window.syncPMREMSystems;
      }
    };
  }, []);

  // ✅ TRANSITION HANDLER STABLE (comme V6-backup-claude)
  const handleTransition = useCallback(() => {
    if (!animationControllerRef.current || isTransitioning) return;
    
    setIsTransitioning(true);
    
    if (currentAnimation === 'permanent') {
      setCurrentAnimation('pose');
      
      // ✅ NOUVEAU : Décocher automatiquement Force Rings lors de la transition Pose
      if (forceShowRings) {
        setForceShowRings(false);
        if (revelationSystemRef.current) {
          revelationSystemRef.current.setForceShowAll(false);
        }
      }
      
      const success = animationControllerRef.current.startPoseTransition();
      
      if (success) {
        // ✅ DÉLAI 200ms POUR ANNEAUX RESTAURÉ (comme V6-backup-claude)
        setTimeout(() => {
          if (revelationSystemRef.current) {
            revelationSystemRef.current.startRingAnimation?.(animationControllerRef.current);
          }
        }, 200);
      } else {
        setIsTransitioning(false);
        setCurrentAnimation('permanent');
      }
    } else {
      setCurrentAnimation('permanent');
      animationControllerRef.current.startReturnToPermanent();
    }
  }, [currentAnimation, isTransitioning, forceShowRings]);

  // ✅ FONCTION STABLE POUR FORCE SHOW
  const handleToggleForceRings = useCallback((show) => {
    // ✅ SUPPRIMÉ : Log pour réduire spam console
    setForceShowRings(show);
    if (revelationSystemRef.current) {
      revelationSystemRef.current.setForceShowAll(show);
      // Force une mise à jour de la révélation si désactivé
      if (!show) {
        setTimeout(() => {
          revelationSystemRef.current.updateRevelation();
        }, 10);
      }
    }
  }, []);

  // ✅ FONCTION STABLE POUR SECURITY STATE - RESTAURÉE V5 + CCS
  const handleSecurityStateChange = useCallback((newState) => {
    setSecurityState(newState);
    
    // 🎯 CCS: Utiliser le contrôleur central pour propager à tous les systèmes
    if (stateControllerRef.current) {
      stateControllerRef.current.setSecurityMode(newState);
    } else {
      // ✅ FALLBACK : Appels directs si CCS pas encore initialisé
      if (bloomControlCenterRef.current) {
        bloomControlCenterRef.current.setSecurityState(newState);
      }
      
      // 🌟 V2: Mettre à jour les arcs électriques si en mode sécurité
      if (particleSystemControllerRef.current) {
        particleSystemControllerRef.current.setSecurityMode(newState);
      }
    }
  }, []);

  // ✅ CORRIGÉ : Contrôler le bloom via SceneStateController
  const handleColorBloomChange = useCallback((colorName, param, value) => {
    
    // 🎯 CCS: Utiliser le contrôleur central maintenant
    if (!stateControllerRef.current) return;
    
    // ✅ NOUVEAU : Threshold global
    if (colorName === 'global' && param === 'threshold') {
      stateControllerRef.current.setBloomParameter('threshold', value);
      return;
    }
    
    // 🎯 CCS: Traiter les paramètres via le contrôleur central
    if (param === 'strength' || param === 'radius' || param === 'threshold') {
      // Paramètres bloom par groupe
      stateControllerRef.current.setGroupBloomParameter(colorName, param, value);
    } else if (param === 'emissiveIntensity') {
      // Paramètres matériaux par groupe
      stateControllerRef.current.setMaterialParameter(colorName, param, value);
    } else {
      // Autres paramètres matériaux
      stateControllerRef.current.setMaterialParameter(colorName, param, value);
    }
  }, []);

  // ✅ START RENDER LOOP (comme V6-backup-claude)
  useEffect(() => {
    if (!isInitialized || !startRenderLoop) return;

    const stopRenderLoop = startRenderLoop((deltaTime) => {
      // ✅ UPDATE SYSTÈMES V18 + PARTICULES
      animationControllerRef.current?.update(deltaTime);
      
      // ✅ AJOUTÉ: Rotation des anneaux Eye ! (comme V6-backup-claude)
      eyeRotationRef.current?.updateEyeRotation(deltaTime);
      
      // 👁️ NOUVEAU: Update rotation du modèle complet
      modelRotationManagerRef.current?.update(deltaTime);
      
      // 🚀 Synchroniser rotation du modèle avec parallaxe des particules
      if (modelRotationManagerRef.current && particleSystemControllerRef.current) {
        const modelRotationY = modelRotationManagerRef.current.currentRotationY || 0;
        particleSystemControllerRef.current.updateEyeRotation(modelRotationY);
        
        // 🎯 Mettre à jour le point de convergence dynamique basé sur l'orientation du modèle
        if (modelDataRef.current.model) {
          particleSystemControllerRef.current.updateConvergencePoint(
            modelDataRef.current.model.position,
            modelDataRef.current.model.quaternion
          );
        }
      }
      
      revelationSystemRef.current?.updateRevelation();
      bloomControlCenterRef.current?.update(deltaTime);
      objectTransitionRef.current?.update(deltaTime);
      
      // 🌌 NOUVEAU: Update floating space system
      floatingSpace?.update();
      
      // 🌟 V2: Update nouveau système de particules 3D
      particleSystemControllerRef.current?.update();
    });

    return stopRenderLoop;
  }, [isInitialized, startRenderLoop, floatingSpace]);

  // 🌟 INTERACTIONS SOURIS POUR SYSTÈME V2
  useEffect(() => {
    const handleClick = (event) => {
      if (!particleSystemControllerRef.current || !camera || !scene) return;
      
      // Convertir coordonnées souris en coordonnées 3D
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      
      const mouse = new THREE.Vector2(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        -((event.clientY - rect.top) / rect.height) * 2 + 1
      );
      
      // Raycaster pour obtenir position 3D
      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(mouse, camera);
      
      // Plan imaginaire à Y=0 pour l'intersection
      const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
      const intersectPoint = new THREE.Vector3();
      raycaster.ray.intersectPlane(plane, intersectPoint);
      
      // Déclencher une vague de signaux à cette position
      particleSystemControllerRef.current.triggerSignalWave(intersectPoint);
    };

    const handleMouseMove = (event) => {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      
      // Coordonnées normalisées (-1 à 1)
      const mouseX = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      const mouseY = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      
      // 🌌 Toujours mettre à jour position souris pour floating space
      setMousePosition({ x: mouseX, y: mouseY });
      
      // Mode Eye Tracking : suivi du modèle complet et répulsion particules
      if (mouseControlMode === 'eyeTracking') {
        // 👁️ Mettre à jour position souris pour rotation du modèle COMPLET
        if (modelRotationManagerRef.current) {
          modelRotationManagerRef.current.updateMousePosition(mouseX, mouseY);
        }
        
        // Mettre à jour position souris dans le système de particules (répulsion)
        if (particleSystemControllerRef.current) {
          particleSystemControllerRef.current.updateMousePosition(mouseX, mouseY);
        }
      }
      // Mode Navigation : OrbitControls gère déjà tout
    };

    window.addEventListener('click', handleClick);
    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('click', handleClick);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [camera, scene, mouseControlMode]);
  
  // 👁️ Fonction pour basculer entre modes de contrôle souris
  const toggleMouseControlMode = useCallback(() => {
    const newMode = mouseControlMode === 'navigation' ? 'eyeTracking' : 'navigation';
    setMouseControlMode(newMode);
    
    // Contrôler OrbitControls
    if (controls) {
      controls.enabled = (newMode === 'navigation');
    }
    
    // Contrôler Model Rotation (tout le modèle 3D)
    if (modelRotationManagerRef.current) {
      if (newMode === 'eyeTracking') {
        modelRotationManagerRef.current.enableMouseTracking();
      } else {
        modelRotationManagerRef.current.disableMouseTracking();
      }
    }
    
    // 👁️ Le RevealationSystem utilise maintenant la référence modèle automatiquement
    
    console.log(`🖱️ Mode souris: ${newMode === 'navigation' ? '🕹️ NAVIGATION' : '👁️ SUIVI ŒIL'}`);
    
    // Notification visuelle
    if (newMode === 'eyeTracking') {
      console.log('👁️ Bougez la souris pour faire suivre l\'œil !');
    } else {
      console.log('🕹️ Clic+glisser pour naviguer autour de la scène');
    }
    
    return newMode;
  }, [mouseControlMode, controls]);

  // ✅ KEYBOARD CONTROLS
  useEffect(() => {
    const handleKeyDown = (event) => {
      switch (event.key.toLowerCase()) {
        case 'p':
          setShowDebug(prev => !prev);
          break;
        case 't':
          event.preventDefault();
          toggleMouseControlMode();
          break;
        case ' ':
          event.preventDefault();
          handleTransition();
          break;
        case 'f':
          if (event.shiftKey) {
            updateZone();
          } else {
            handleCameraFit();
          }
          break;
        case 'r':
          if (event.shiftKey) {
            updateZone();
          } else {
            handleToggleForceRings(!forceShowRings);
          }
          break;
        case 'z':
        case 'q':
        case 's':
        case 'd':
        case 'a':
        case 'e':
          updateZone();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleTransition, handleCameraFit, forceShowRings, handleToggleForceRings, updateZone, toggleMouseControlMode]);

  // ✅ RENDER
  return (
    <div style={{
      width: '100%',
      height: '100vh',
      position: 'relative',
      background: '#202020'
    }}>
      <canvas
        ref={canvasRef}
        style={{
          width: '100%',
          height: '100%',
          display: 'block'
        }}
      />
      
      
      {/* 🔍 DUAL PANEL TEST - DISABLED for debugging */}
      {/* {showDebug && (
        <DualPanelTest ... />
      )} */}
      
      {/* 🧪 ZUSTAND PHASE 1 TEST PANEL - DISABLED for debugging */}
      {/* <TestZustandDebugPanel showDebug={false} /> */}
      
    </div>
  );
}