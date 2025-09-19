// 🛠️ Fonctions utilitaires V5 - NETTOYÉ pour bloom effects
import * as THREE from 'three';

/**
 * 🎥 Ajuster la caméra pour fitter un objet
 */
export function fitCameraToObject(camera, object, controls, offset = 1.5) {
  const boundingBox = new THREE.Box3();
  boundingBox.setFromObject(object);

  const center = new THREE.Vector3();
  const size = new THREE.Vector3();
  boundingBox.getCenter(center);
  boundingBox.getSize(size);

  const maxDim = Math.max(size.x, size.y, size.z);
  const fov = camera.fov * (Math.PI / 180);
  
  let cameraZ = maxDim / 2 / Math.tan(fov / 2);
  cameraZ *= offset;

  const direction = new THREE.Vector3();
  camera.getWorldDirection(direction);
  direction.negate();
  
  const newPosition = center.clone().add(direction.multiplyScalar(cameraZ));
  camera.position.copy(newPosition);

  const minZ = boundingBox.min.z;
  const cameraToFarEdge = (minZ < 0) ? -minZ + cameraZ : cameraZ - minZ;
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

  return {
    cameraDistance: cameraZ,
    objectCenter: center.clone(),
    objectSize: size.clone()
  };
}

/**
 * 🎯 Créer une zone trigger pour révélation
 */
export function createTriggerZone(scene, params) {
  const geometry = new THREE.CylinderGeometry(
    params.radius, 
    params.radius, 
    params.height, 
    32
  );
  
  const material = new THREE.MeshBasicMaterial({
    color: 0x00ff00,
    wireframe: true,
    transparent: true,
    opacity: 0.6,
  });

  const triggerZone = new THREE.Mesh(geometry, material);
  triggerZone.name = 'V5TriggerZone';
  triggerZone.position.set(params.centerX, params.centerY, params.centerZ);
  
  scene.add(triggerZone);
  return triggerZone;
}

/**
 * 🌟 Créer matériau bloom pour effets lumineux
 */
export function createBloomMaterial(baseColor = 0x88ccff, intensity = 1.0) {
  return new THREE.MeshStandardMaterial({
    color: baseColor,
    emissive: new THREE.Color(baseColor),
    emissiveIntensity: intensity,
    metalness: 0.5,
    roughness: 0.2,
    transparent: true,
    opacity: 0.9
  });
}

/**
 * 👁️ Créer matériau sécurité IRIS
 */
export function createSecurityMaterial(state = 'NORMAL') {
  const configs = {
    SAFE: { color: 0x00ff00, intensity: 0.8 },
    DANGER: { color: 0xff0000, intensity: 1.2 },
    WARNING: { color: 0xff8800, intensity: 1.0 },
    NORMAL: { color: 0x000000, intensity: 0.0 },
    SCANNING: { color: 0x0088ff, intensity: 0.6 }
  };

  const config = configs[state] || configs.NORMAL;
  
  return new THREE.MeshStandardMaterial({
    color: config.color,
    emissive: new THREE.Color(config.color),
    emissiveIntensity: config.intensity,
    metalness: 0.9,
    roughness: 0.1
  });
}

/**
 * 📊 Analyser contenu modèle pour bloom
 */
export function analyzeBloomObjects(gltf) {
  const analysis = {
    bloomRings: [],
    eyeComponents: [],
    animations: gltf.animations || []
  };

  gltf.scene.traverse((child) => {
    if (child.isMesh) {
      const name = child.name;
      
      // Identifier objets bloom
      if (name.includes('AnneauxBloomArea') || name.includes('Ring_') && name.includes('SG1')) {
        analysis.bloomRings.push(child);
      }
      
      // Identifier composants Eye
      if (name.includes('Anneaux_Eye') || name.includes('IRIS')) {
        analysis.eyeComponents.push(child);
      }
    }
  });

  return analysis;
}