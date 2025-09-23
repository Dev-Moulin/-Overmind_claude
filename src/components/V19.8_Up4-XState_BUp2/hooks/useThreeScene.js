// 🎬 Hook Scene Three.js V8 - COORDINATED BLOOM SYSTEM
import { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { useSimpleBloom } from './useSimpleBloom.js'; // ✅ RESTAURÉ : Coordination avec BloomControlCenter
import { V3_CONFIG } from '../utils/config.js';

const TONE_MAPPING_OPTIONS = {
  None: THREE.NoToneMapping,
  Linear: THREE.LinearToneMapping,
  Reinhard: THREE.ReinhardToneMapping,
  ACESFilmic: THREE.ACESFilmicToneMapping,
};

export function useThreeScene(canvasRef) {
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const controlsRef = useRef(null);
  const cameraRef = useRef(null);
  const animationIdRef = useRef(null);
  
  // ✅ RESTAURÉ SIMPLE BLOOM SYSTEM - Coordination avec BloomControlCenter
  const { 
    initBloom, 
    updateBloom, 
    render: renderBloom, 
    handleResize: handleBloomResize, 
    dispose: disposeBloom,
    getExposure: _getBloomExposure,   // ✅ Lecture depuis renderer
    bloomSystem  // ✅ NOUVEAU : Exposer référence pour coordination
  } = useSimpleBloom();
  
  const [isInitialized, setIsInitialized] = useState(false);

  const setToneMapping = useCallback((toneMappingName) => {
    const toneMapping = TONE_MAPPING_OPTIONS[toneMappingName];
    if (rendererRef.current && toneMapping !== undefined) {
      const renderer = rendererRef.current;
      const scene = sceneRef.current;
      
      // Changer le tone mapping
      renderer.toneMapping = toneMapping;
      
      // ✅ PMREM PHASE 1: Régénérer environnement si PMREM actif et tone mapping change
      if (window.pmremGenerator && scene) {
        try {
          const pmremRenderTarget = window.pmremGenerator.fromScene(scene);
          scene.environment = pmremRenderTarget.texture;
        } catch (error) {
          console.warn('⚠️ PMREM: Erreur régénération environnement:', error);
        }
      }
      
      // Force la recompilation des matériaux
      if (scene) {
        scene.traverse((child) => {
          if (child.material) {
            if (Array.isArray(child.material)) {
              child.material.forEach(mat => {
                mat.needsUpdate = true;
              });
            } else {
              child.material.needsUpdate = true;
            }
          }
        });
      }
      
    }
  }, []);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const width = canvas.clientWidth || window.innerWidth;
    const height = canvas.clientHeight || window.innerHeight;

    // Scene avec background noir par défaut (comme Studio Pro +)
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000); // ✅ CORRECTION: Noir pour cohérence avec presets

    // Camera
    const camera = new THREE.PerspectiveCamera(
      V3_CONFIG.camera.fov,
      width / height,
      V3_CONFIG.camera.near,
      V3_CONFIG.camera.far
    );

    // Renderer simple et optimisé
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      canvas: canvas,
      alpha: false
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    
    // ✅ PMREM PHASE 1: Configuration tone mapping moderne
    renderer.toneMapping = THREE.AgXToneMapping; // 2024 moderne vs LinearToneMapping
    renderer.toneMappingExposure = 1.7; // ✅ CORRECTION: Aligner avec Studio Pro + par défaut
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    
    // ✅ PMREM PHASE 1: PMREMGenerator pour environnement HDR
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    pmremGenerator.compileEquirectangularShader(); // Pre-compile pour performance
    
    // ✅ PMREM PHASE 1: Génération environnement HDR basique depuis scène
    const pmremRenderTarget = pmremGenerator.fromScene(scene);
    scene.environment = pmremRenderTarget.texture; // HDR environnement pour matériaux PBR

    // ✅ CORRIGÉ : INITIALISER SIMPLE BLOOM SYSTEM (sans double init)
    const bloomSystemInstance = initBloom(scene, camera, renderer);

    if (!bloomSystemInstance) {
      console.warn('⚠️ SimpleBloomSystem non initialisé, utilisation du rendu standard');
    } else {
      // ✅ CORRECTION : Ne pas appeler init() ici - déjà fait dans initBloom()
      // ✅ COORDINATION : Exposer le bloomSystem pour BloomControlCenter
      window.bloomSystem = bloomSystemInstance;
    }

    // ✅ COORDINATION PBR : Lumières alignées avec Studio Pro + par défaut
    const ambientLight = new THREE.AmbientLight(
      0x404040, // ✅ CORRECTION: Couleur Studio Pro +
      3.5 // ✅ CORRECTION: Intensité Studio Pro +
    );
    // ✅ Marquer pour PBRLightingController
    ambientLight.userData.pbrControllable = true;
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(
      0xffffff, // ✅ Couleur Studio Pro +
      5.0 // ✅ CORRECTION: Intensité Studio Pro +
    );
    const lightPos = V3_CONFIG.lights.directional.position;
    directionalLight.position.set(lightPos.x, lightPos.y, lightPos.z);
    // ✅ Marquer pour PBRLightingController
    directionalLight.userData.pbrControllable = true;
    scene.add(directionalLight);


    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.screenSpacePanning = false;
    controls.minDistance = 1;
    controls.maxDistance = 50;
    controls.maxPolarAngle = Math.PI;

    // Position initiale camera - CAM1 comme origine
    camera.position.set(0, 1.4511, 14.2794);
    camera.rotation.set(-0.1013, 0, 0);
    camera.lookAt(0, 0, 0);

    // Stocker les références
    sceneRef.current = scene;
    rendererRef.current = renderer;
    controlsRef.current = controls;
    cameraRef.current = camera;
    
    // ✅ PMREM PHASE 1: Exposer PMREMGenerator pour coordination avec autres systèmes
    window.pmremGenerator = pmremGenerator;
    
    // ✅ PHASE 4 FIX: Exposer références globales manquantes pour diagnostic
    window.renderer = renderer;
    window.camera = camera;
    window.controls = controls;
    

    // Gestionnaire de redimensionnement
    const handleResize = () => {
      const width = canvas.clientWidth || window.innerWidth;
      const height = canvas.clientHeight || window.innerHeight;

      camera.aspect = width / height;
      camera.updateProjectionMatrix();

      renderer.setSize(width, height);
      handleBloomResize();
    };

    window.addEventListener('resize', handleResize);

    setIsInitialized(true);

    return () => {
      window.removeEventListener('resize', handleResize);
      disposeBloom();
      
      if (window.bloomSystem) {
        delete window.bloomSystem;
      }
      
      // ✅ PMREM PHASE 1: Nettoyage PMREMGenerator
      if (window.pmremGenerator) {
        window.pmremGenerator.dispose();
        delete window.pmremGenerator;
      }
      
    };
  }, [initBloom, handleBloomResize, disposeBloom, canvasRef]);

  // ✅ BOUCLE DE RENDU SIMPLIFIÉE
  const startRenderLoop = useCallback((updateCallback) => {
    if (!rendererRef.current) return () => {};

    const clock = new THREE.Clock();
    let isRunning = true;

    const animate = () => {
      if (!isRunning) return;

      const delta = clock.getDelta();

      if (controlsRef.current) {
        controlsRef.current.update();
      }

      if (updateCallback) {
        updateCallback(delta);
      }

      // ✅ RESTAURÉ : RENDU AVEC SIMPLE BLOOM SYSTEM
      renderBloom();

      animationIdRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      isRunning = false;
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
        animationIdRef.current = null;
      }
    };
  }, [renderBloom]);

  // ✅ RESTAURÉ : FONCTIONS BLOOM POUR RÉTROCOMPATIBILITÉ
  const updateBloomSettings = useCallback((param, value) => {
    updateBloom(param, value);
    return true;
  }, [updateBloom]);

  const getBloomSettings = useCallback(() => {
    // ✅ CORRECTION CONFLIT #2 : Valeurs par défaut, bloom géré par BloomControlCenter  
    return {
      threshold: 0.15,
      strength: 0.40,
      radius: 0.4,
      enabled: true
    };
  }, []);

  // ✅ CORRIGÉ V8 : Contrôle Tone Mapping Exposure
  const setExposure = useCallback((value) => {
    if (!rendererRef.current) {
      console.warn('⚠️ Renderer non disponible pour setExposure');
      return false;
    }
    
    // Valider le range (basé sur exemples Three.js officiels)
    const clampedValue = Math.max(0.1, Math.min(2.0, value));
    
    // ✅ SEULE SOURCE DE VÉRITÉ : Appliquer uniquement au renderer
    rendererRef.current.toneMappingExposure = clampedValue;
    
    // ✅ CORRECTION CONFLIT #1 : NE PAS appeler setBloomExposure pour éviter triple application
    // Le bloom system utilisera directement la valeur du renderer
    
    return true;
  }, []); // ✅ Suppression dépendance setBloomExposure
  
  // ✅ CORRIGÉ V8 : Obtenir l'exposure actuelle - SOURCE UNIQUE
  const getExposure = useCallback(() => {
    if (!rendererRef.current) return 1.0;
    
    // ✅ CORRECTION CONFLIT #1 : Lire directement depuis le renderer (source unique)
    return rendererRef.current.toneMappingExposure;
  }, []); // ✅ Suppression dépendance getBloomExposure

  return {
    // Références existantes
    scene: sceneRef.current,
    renderer: rendererRef.current,
    camera: cameraRef.current,
    controls: controlsRef.current,
    
    // État
    isInitialized,
    
    // Fonctions de contrôle
    setToneMapping,
    startRenderLoop,
    
    // ✅ FONCTIONS BLOOM SIMPLIFIÉES
    updateBloomSettings,
    getBloomSettings,
    
    // ✅ NOUVEAU V8 : Contrôle Exposure
    setExposure,
    getExposure,
    
    // ✅ NOUVEAU : Contrôle Background
    setBackground: useCallback((type, value) => {
      if (!sceneRef.current) return false;
      
      const scene = sceneRef.current;
      
      switch (type) {
        case 'color': {
          const color = typeof value === 'string' ? parseInt(value.replace('#', ''), 16) : value;
          scene.background = new THREE.Color(color);
          break;
        }
          
        case 'transparent':
          scene.background = null;
          break;
          
        case 'black':
          scene.background = new THREE.Color(0x000000);
          break;
          
        case 'white':
          scene.background = new THREE.Color(0xffffff);
          break;
          
        case 'dark':
          scene.background = new THREE.Color(0x202020);
          break;
          
        default:
          console.warn(`⚠️ Type de background inconnu: ${type}`);
          return false;
      }
      
      return true;
    }, []),

    getBackground: useCallback(() => {
      if (!sceneRef.current) return null;
      
      const scene = sceneRef.current;
      if (!scene.background) return { type: 'transparent' };
      if (scene.background.isColor) return { 
        type: 'color', 
        value: `#${scene.background.getHexString()}` 
      };
      
      return { type: 'unknown' };
    }, []),
    
    // ✅ RESTAURÉ : FONCTIONS BLOOM POUR COORDINATION
    updateBloom,
    renderBloom,
    handleBloomResize,
    disposeBloom,
    
    // ✅ NOUVEAU : Exposer référence bloomSystem pour coordination BloomControlCenter
    bloomSystem,
    
    // ✅ COORDINATION PBR : Exposer accès aux lumières pour PBRLightingController
    getLights: useCallback(() => {
      if (!sceneRef.current) return { ambient: null, directional: null };
      
      let ambient = null, directional = null;
      sceneRef.current.traverse((child) => {
        if (child.isAmbientLight && child.userData.pbrControllable && !ambient) {
          ambient = child;
        }
        if (child.isDirectionalLight && child.userData.pbrControllable && !directional) {
          directional = child;
        }
      });
      
      return { ambient, directional };
    }, [])
  };
}