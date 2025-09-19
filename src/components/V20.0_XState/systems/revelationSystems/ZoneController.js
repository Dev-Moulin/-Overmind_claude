// 🎯 ZoneController V5 - Contrôle zone trigger NETTOYÉ
import * as THREE from 'three';
import { V3_CONFIG } from '../../utils/config.js';

export class ZoneController {
  constructor() {
    // Zone trigger position et taille
    this.triggerZone = {
      position: new THREE.Vector3(
        V3_CONFIG.revelation.centerX,
        V3_CONFIG.revelation.centerY,
        V3_CONFIG.revelation.centerZ
      ),
      radius: V3_CONFIG.revelation.radius,
      height: V3_CONFIG.revelation.height
    };
    
    // Configuration contrôles clavier
    this.keyStates = new Set();
    this.moveSpeed = 0.5;
    this.scaleSpeed = 0.1;
    
    this.initializeKeyControls();
  }

  // Initialiser les contrôles clavier
  initializeKeyControls() {
    document.addEventListener('keydown', (event) => {
      this.keyStates.add(event.code);
    });
    
    document.addEventListener('keyup', (event) => {
      this.keyStates.delete(event.code);
    });
  }

  // Mettre à jour la position de la zone (contrôles ZQSD + AE + RF)
  updateZonePosition() {
    const position = this.triggerZone.position;
    
    // Mouvement horizontal/vertical (ZQSD)
    if (this.keyStates.has('KeyZ')) position.y += this.moveSpeed;
    if (this.keyStates.has('KeyS')) position.y -= this.moveSpeed;
    if (this.keyStates.has('KeyQ')) position.x -= this.moveSpeed;
    if (this.keyStates.has('KeyD')) position.x += this.moveSpeed;
    
    // Mouvement profondeur (AE)
    if (this.keyStates.has('KeyA')) position.z -= this.moveSpeed;
    if (this.keyStates.has('KeyE')) position.z += this.moveSpeed;
    
    // Redimensionnement (RF)
    if (this.keyStates.has('KeyR')) {
      this.triggerZone.radius = Math.max(0.5, this.triggerZone.radius + this.scaleSpeed);
    }
    if (this.keyStates.has('KeyF')) {
      this.triggerZone.radius = Math.max(0.5, this.triggerZone.radius - this.scaleSpeed);
    }
  }

  // Vérifier si un anneau est dans la zone trigger
  isRingInZone(ringPosition) {
    if (!ringPosition || !this.triggerZone.position) return false;
    
    const distance = ringPosition.distanceTo(this.triggerZone.position);
    const heightDiff = Math.abs(ringPosition.y - this.triggerZone.position.y);
    
    return distance <= this.triggerZone.radius && heightDiff <= this.triggerZone.height / 2;
  }

  // Obtenir les informations de la zone
  getZoneInfo() {
    return {
      position: this.triggerZone.position.clone(),
      radius: this.triggerZone.radius,
      height: this.triggerZone.height
    };
  }

  // Réinitialiser la zone à la position par défaut
  resetZone() {
    this.triggerZone.position.set(
      V3_CONFIG.revelation.centerX,
      V3_CONFIG.revelation.centerY,
      V3_CONFIG.revelation.centerZ
    );
    this.triggerZone.radius = V3_CONFIG.revelation.radius;
    this.triggerZone.height = V3_CONFIG.revelation.height;
  }

  // Nettoyer les event listeners
  cleanup() {
    this.keyStates.clear();
  }
}