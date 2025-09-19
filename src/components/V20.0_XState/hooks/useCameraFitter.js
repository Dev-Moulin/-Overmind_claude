// 🎥 Hook caméra V5 - VERSION ROBUSTE CORRIGÉE
import { useCallback } from 'react';
import * as THREE from 'three';

export function useCameraFitter() {
  const fitCameraToObject = useCallback((camera, object, controls, offset = 1.5) => {
    // ✅ VÉRIFICATIONS SÉCURISÉES
    if (!camera || !object) {
      console.warn('⚠️ fitCameraToObject: camera ou object manquant');
      return null;
    }

    // ✅ VÉRIFIER QUE C'EST UN OBJET THREE.JS VALIDE
    if (!object.isObject3D) {
      console.warn('⚠️ fitCameraToObject: object n\'est pas un Object3D valide');
      return null;
    }

    try {
      // ✅ MISE À JOUR WORLD MATRIX AVANT CALCUL - SOLUTION AU PROBLÈME !
      object.updateMatrixWorld(true);

      const boundingBox = new THREE.Box3();
      boundingBox.setFromObject(object);

      // ✅ VÉRIFIER QUE LA BOUNDING BOX EST VALIDE
      if (boundingBox.isEmpty()) {
        console.warn('⚠️ fitCameraToObject: bounding box vide');
        return null;
      }

      const center = new THREE.Vector3();
      const size = new THREE.Vector3();
      boundingBox.getCenter(center);
      boundingBox.getSize(size);

      // Calculer la dimension maximale pour le fit parfait
      const maxDim = Math.max(size.x, size.y, size.z);
      
      // ✅ VÉRIFIER QUE LES DIMENSIONS SONT VALIDES
      if (maxDim === 0) {
        console.warn('⚠️ fitCameraToObject: object sans dimensions');
        return null;
      }

      const fov = camera.fov * (Math.PI / 180);
      
      let cameraZ = maxDim / 2 / Math.tan(fov / 2);
      cameraZ *= offset;

      // Positionner la caméra
      const direction = new THREE.Vector3();
      camera.getWorldDirection(direction);
      direction.negate();
      
      const newPosition = center.clone().add(direction.multiplyScalar(cameraZ));
      camera.position.copy(newPosition);

      // Ajuster les plans near/far
      const minZ = boundingBox.min.z;
      const cameraToFarEdge = (minZ < 0) ? -minZ + cameraZ : cameraZ - minZ;
      camera.near = Math.max(0.1, cameraZ * 0.01);
      camera.far = cameraToFarEdge * 3;
      camera.updateProjectionMatrix();

      if (controls) {
        controls.target.copy(center);
        controls.maxDistance = cameraToFarEdge * 2;
        controls.minDistance = cameraZ * 0.1;
        controls.update();
      } else {
        camera.lookAt(center);
      }
      
      console.log('🎥 Camera fitted successfully:', {
        center: center.toArray(),
        size: size.toArray(),
        distance: cameraZ
      });
      
      return {
        cameraDistance: cameraZ,
        objectCenter: center.clone(),
        objectSize: size.clone(),
        boundingBox: boundingBox.clone()
      };

    } catch (error) {
      console.error('❌ Erreur fitCameraToObject:', error);
      return null;
    }
  }, []);

  const fitCameraToView = useCallback((camera, object, controls, viewType = 'default', offset = 1.5) => {
    const result = fitCameraToObject(camera, object, controls, offset);
    
    if (!result) return null;
    
    // Ajustements spécifiques selon le type de vue
    switch (viewType) {
      case 'front':
        camera.position.set(result.objectCenter.x, result.objectCenter.y, result.cameraDistance);
        break;
      case 'side':
        camera.position.set(result.cameraDistance, result.objectCenter.y, result.objectCenter.z);
        break;
      case 'top':
        camera.position.set(result.objectCenter.x, result.cameraDistance, result.objectCenter.z);
        break;
      case 'isometric': {
        const iso = result.cameraDistance * 0.7;
        camera.position.set(iso, iso, iso);
        break;
      }
      default:
        break;
    }
    
    camera.lookAt(result.objectCenter);
    if (controls) {
      controls.target.copy(result.objectCenter);
      controls.update();
    }
    
    return result;
  }, [fitCameraToObject]);

  return { 
    fitCameraToObject, 
    fitCameraToView 
  };
}