// 📦 Hook chargement modèle V5 - EFFETS SUBTILS CORRIGES
import { useState, useCallback } from 'react';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { RING_MATERIALS, ARM_MATERIALS_ALL } from '../utils/materials.js';
import { V3_CONFIG } from '../utils/config.js';
import * as THREE from 'three';

export function useModelLoader() {
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [model, setModel] = useState(null);
  const [error, setError] = useState(null);

  // ✅ DÉTECTION IRIS
  const isIRISMesh = useCallback((meshName) => {
    if (!meshName) return false;
    return meshName.toLowerCase().includes('iris');
  }, []);

  // ✅ DÉTECTION EYE/ANNEAUX ULTRA-SÉLECTIVE
  const isEyeMesh = useCallback((meshName) => {
    if (!meshName) return false;
    const name = meshName.toLowerCase();
    
    // ✅ SEULEMENT les anneaux Eye qui doivent briller
    return (
      name.includes('anneaux_eye_ext') ||
      name.includes('anneaux_eye_int')
    );
  }, []);

  // ✅ NOUVELLE FONCTION : Détection bras SANS dos_eye et eye_int
  const isArmMesh = useCallback((meshName) => {
    if (!meshName) return false;
    const name = meshName.toLowerCase();
    
    // ✅ EXCLURE dos_eye et eye_int (ils doivent garder leurs matériaux originaux)
    if (name.includes('dos_eye') || name.includes('eye_int')) {
      return false;
    }
    
    // ✅ Bras qui peuvent avoir un léger effet
    return (
      name.includes('bras') ||
      name.includes('arm')
    );
  }, []);

  // ✅ DÉTECTION ANNEAUX MAGIQUES
  const isRingMesh = useCallback((meshName, materialName) => {
    if (!meshName && !materialName) return false;
    const name = (meshName || '').toLowerCase();
    const mat = (materialName || '').toLowerCase();
    return RING_MATERIALS.some(ringMat => 
      name.includes(ringMat.toLowerCase()) || mat.includes(ringMat.toLowerCase())
    );
  }, []);

  // ✅ DÉTECTION GROS BRAS
  const isBigArmMesh = useCallback((meshName) => {
    if (!meshName) return false;
    const name = meshName.toLowerCase();
    return ARM_MATERIALS_ALL.some(armMat => 
      name.includes(armMat.toLowerCase()) && name.includes('gros')
    );
  }, []);

  // ✅ DÉTECTION PETITS BRAS
  const isLittleArmMesh = useCallback((meshName) => {
    if (!meshName) return false;
    const name = meshName.toLowerCase();
    return ARM_MATERIALS_ALL.some(armMat => 
      name.includes(armMat.toLowerCase()) && name.includes('petit')
    );
  }, []);
  
  // ✅ MATÉRIAU IRIS - Compatible avec presets PBR
  const createIRISMaterial = useCallback((originalMaterial) => {
    const newMaterial = originalMaterial ? originalMaterial.clone() : new THREE.MeshStandardMaterial();
    
    // ✅ CORRECTION: Respecter les valeurs Studio Pro + par défaut
    newMaterial.metalness = 0.3;
    newMaterial.roughness = 1.0;
    // Ne pas forcer emissive - laissé à BloomControlCenter
    
    return newMaterial;
  }, []);

  // ✅ MATÉRIAU EYE ANNEAUX - Compatible avec presets PBR
  const createEyeMaterial = useCallback((originalMaterial) => {
    const newMaterial = originalMaterial ? originalMaterial.clone() : new THREE.MeshStandardMaterial();
    
    // ✅ CORRECTION: Respecter les valeurs Studio Pro + par défaut
    newMaterial.metalness = 0.3;
    newMaterial.roughness = 1.0;
    // Ne pas forcer emissive - laissé à BloomControlCenter
    
    return newMaterial;
  }, []);

  // ✅ MATÉRIAU BRAS - Compatible avec presets PBR
  const createArmMaterial = useCallback((originalMaterial) => {
    const newMaterial = originalMaterial ? originalMaterial.clone() : new THREE.MeshStandardMaterial();
    
    // ✅ CORRECTION: Respecter les valeurs Studio Pro + par défaut
    newMaterial.metalness = 0.3;
    newMaterial.roughness = 1.0;
    // Ne pas forcer emissive - laissé à BloomControlCenter
    
    return newMaterial;
  }, []);
  
  // ✅ FONCTION CHARGEMENT SÉCURISÉE
  const loadModel = useCallback((scene, onSuccess) => {
    if (isLoading) return;

    setIsLoading(true);
    setError(null);
    setLoadingProgress(0);

    const loader = new GLTFLoader();
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath(V3_CONFIG.model.dracoPath);
    loader.setDRACOLoader(dracoLoader);

    loader.load(
      V3_CONFIG.model.path,
      (gltf) => {
        if (!gltf || !gltf.scene) {
          console.error('❌ GLTF ou scene manquant:', gltf);
          setError(new Error('GLTF scene manquant'));
          setIsLoading(false);
          return;
        }
        
        const loadedModel = gltf.scene;
        scene.add(loadedModel);

        const magicRings = [];
        const bigArms = [];
        const littleArms = [];
        const eyeComponents = [];
        const otherMeshes = [];

        loadedModel.traverse((child) => {
          if (child.isMesh) {
            const meshName = child.name || '';
            const materialName = child.material?.name || '';
            
            // ✅ IRIS - Préparer pour BloomControlCenter
            if (isIRISMesh(meshName)) {
              child.material = createIRISMaterial(child.material);
              child.userData.bloomGroup = 'iris'; // ✅ Marqueur pour BloomControlCenter
              eyeComponents.push(child);
            }
            // ✅ SEULEMENT les anneaux Eye
            else if (isEyeMesh(meshName)) {
              child.material = createEyeMaterial(child.material);
              child.userData.bloomGroup = 'eyeRings'; // ✅ Marqueur pour BloomControlCenter
              eyeComponents.push(child);
            }
            // ✅ Bras - Préparer pour BloomControlCenter
            else if (isArmMesh(meshName)) {
              child.material = createArmMaterial(child.material);
              child.userData.bloomGroup = 'arms'; // ✅ Marqueur pour BloomControlCenter
            }
            else if (isRingMesh(meshName, materialName)) {
              child.userData.bloomGroup = 'revealRings'; // ✅ Marqueur pour BloomControlCenter
              magicRings.push(child);
            }
            else if (isBigArmMesh(meshName)) {
              bigArms.push(child);
            }
            else if (isLittleArmMesh(meshName)) {
              littleArms.push(child);
            }
            else {
              otherMeshes.push(child);
            }
          }
        });

        let mixer = null;
        let animations = []; // ✅ Animations GLTF

        if (gltf.animations && gltf.animations.length > 0) {
          animations = gltf.animations; // ✅ Stocker les animations GLTF
          mixer = new THREE.AnimationMixer(loadedModel);
          // ❌ SUPPRIMÉ : Démarrage automatique - laissé à AnimationController
          gltf.animations.forEach((clip) => {
            const _action = mixer.clipAction(clip);
            // action.play(); // ❌ DÉSACTIVÉ : Contrôlé par AnimationController
          });
        }

        setModel(loadedModel);
        setIsLoaded(true);
        setIsLoading(false);
        setLoadingProgress(100);

        if (onSuccess) {
          // ✅ CORRECTION : Retourner TOUTES les listes pour V3Scene.jsx
          onSuccess({
            magicRings,
            bigArms,
            littleArms,
            eyeComponents,
            otherMeshes,
            animations,    // ✅ RETOURNER animations
            mixer,         // ✅ Garder mixer aussi
            model: loadedModel
          });
        }
      },
      (progress) => {
        const percent = (progress.loaded / progress.total) * 100;
        setLoadingProgress(percent);
      },
      (error) => {
        console.error('❌ Erreur chargement modèle:', error);
        setError(error);
        setIsLoading(false);
      }
    );
  }, [isLoading, isBigArmMesh, isEyeMesh, isIRISMesh, isLittleArmMesh, isRingMesh, isArmMesh, createIRISMaterial, createEyeMaterial, createArmMaterial]);

  return {
    model,
    isLoaded, 
    loadModel,
    loadingProgress,
    isLoading,
    error
  };
}