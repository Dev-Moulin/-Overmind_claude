// 🎯 ModelRotationManager - Rotation de TOUT le modèle 3D vers la souris
import * as THREE from 'three';

export class ModelRotationManager {
  constructor(model, camera = null) {
    this.model = model;
    this.camera = camera;
    
    // Configuration suivi souris
    this.mouseTracking = {
      enabled: false,
      sensitivity: 0.08,    // Sensibilité rotation (augmentée de 0.03 à 0.08)
      deadZone: 0.1,        // Zone morte au centre
      maxRotationY: Math.PI / 3, // Max 60 degrés rotation Y
      maxRotationX: Math.PI / 6, // Max 30 degrés rotation X
      autoReturn: true,     // Retour position neutre
      returnSpeed: 0.04     // Vitesse retour (augmentée de 0.02 à 0.04)
    };
    
    // État souris
    this.mousePosition = new THREE.Vector2();
    this.previousMousePosition = new THREE.Vector2();
    this.mouseVelocity = new THREE.Vector2();
    this.mouseActive = false;
    this.mouseInactiveTimer = 0;
    this.mouseInactiveThreshold = 2000; // 2 secondes
    
    
    // Rotations cibles et actuelles
    this.targetRotationY = 0;
    this.targetRotationX = 0;
    this.currentRotationY = 0;
    this.currentRotationX = 0;
    
    // Position initiale du modèle (sauvegarde)
    this.originalRotation = new THREE.Euler();
    if (this.model) {
      this.originalRotation.copy(this.model.rotation);
    }
    
    // ✅ SUPPRIMÉ : Log pour réduire spam console
  }
  
  // 🖱️ Mise à jour position souris (appelé depuis V3Scene)
  updateMousePosition(mouseX, mouseY) {
    if (!this.mouseTracking.enabled || !this.model) return;
    
    // Sauvegarder position précédente
    this.previousMousePosition.copy(this.mousePosition);
    this.mousePosition.set(mouseX, mouseY);
    
    // Zone morte au centre
    const distance = this.mousePosition.length();
    if (distance < this.mouseTracking.deadZone) {
      this.targetRotationY = 0;
      this.targetRotationX = 0;
      return;
    }
    
    // Calculer rotations cibles
    // mouseX (-1 à 1) -> rotation Y (gauche/droite)  
    this.targetRotationY = mouseX * this.mouseTracking.maxRotationY;
    
    // mouseY (-1 à 1) -> rotation X (haut/bas)
    this.targetRotationX = -mouseY * this.mouseTracking.maxRotationX; // Négatif pour sens naturel
    
    // Clamper dans les limites
    this.targetRotationY = THREE.MathUtils.clamp(
      this.targetRotationY, 
      -this.mouseTracking.maxRotationY, 
      this.mouseTracking.maxRotationY
    );
    this.targetRotationX = THREE.MathUtils.clamp(
      this.targetRotationX, 
      -this.mouseTracking.maxRotationX, 
      this.mouseTracking.maxRotationX
    );
    
    this.mouseActive = true;
    this.mouseInactiveTimer = 0; // Reset timer
  }
  
  // 🔄 Update principal (appelé chaque frame)
  update(deltaTime) {
    if (!this.model) return;
    
    this.updateMouseTracking(deltaTime);
    this.applyRotation();
  }
  
  // 🖱️ Gestion du suivi souris
  updateMouseTracking(deltaTime) {
    if (!this.mouseTracking.enabled) return;
    
    // Timer d'inactivité souris
    if (this.mouseActive) {
      this.mouseInactiveTimer += deltaTime * 1000; // Convert to ms
      
      if (this.mouseInactiveTimer > this.mouseInactiveThreshold && this.mouseTracking.autoReturn) {
        this.mouseActive = false;
        this.targetRotationY = 0; // Retour position neutre
        this.targetRotationX = 0;
      }
    }
    
    // Transition douce vers les rotations cibles
    if (!this.mouseActive && this.mouseTracking.autoReturn) {
      // Retour progressif à la position neutre
      this.currentRotationY = THREE.MathUtils.lerp(
        this.currentRotationY, 
        0, 
        this.mouseTracking.returnSpeed
      );
      this.currentRotationX = THREE.MathUtils.lerp(
        this.currentRotationX, 
        0, 
        this.mouseTracking.returnSpeed
      );
    } else {
      // Suivi normal de la souris
      this.currentRotationY = THREE.MathUtils.lerp(
        this.currentRotationY, 
        this.targetRotationY, 
        this.mouseTracking.sensitivity
      );
      this.currentRotationX = THREE.MathUtils.lerp(
        this.currentRotationX, 
        this.targetRotationX, 
        this.mouseTracking.sensitivity
      );
    }
  }
  
  // 🎯 Appliquer la rotation au modèle
  applyRotation() {
    if (!this.model) return;
    
    // Combiner rotation originale + rotation souris
    this.model.rotation.x = this.originalRotation.x + this.currentRotationX;
    this.model.rotation.y = this.originalRotation.y + this.currentRotationY;
    this.model.rotation.z = this.originalRotation.z; // Garder Z original
  }
  
  // ⚙️ Contrôles publics
  enableMouseTracking() {
    this.mouseTracking.enabled = true;
    console.log('👁️ Suivi modèle complet activé');
  }
  
  disableMouseTracking() {
    this.mouseTracking.enabled = false;
    this.mouseActive = false;
    this.currentRotationY = 0;
    this.currentRotationX = 0;
    
    // Restaurer rotation originale
    if (this.model) {
      this.model.rotation.copy(this.originalRotation);
    }
    
    // ✅ SUPPRIMÉ : Log pour réduire spam console
  }
  
  toggleMouseTracking() {
    this.mouseTracking.enabled = !this.mouseTracking.enabled;
    if (!this.mouseTracking.enabled) {
      this.disableMouseTracking();
    } else {
      this.enableMouseTracking();
    }
    console.log(`👁️ Suivi modèle complet ${this.mouseTracking.enabled ? 'activé' : 'désactivé'}`);
    return this.mouseTracking.enabled;
  }
  
  // ⚙️ Configuration
  setMouseTrackingSensitivity(sensitivity) {
    this.mouseTracking.sensitivity = THREE.MathUtils.clamp(sensitivity, 0.001, 0.1);
  }
  
  setMouseTrackingDeadZone(deadZone) {
    this.mouseTracking.deadZone = THREE.MathUtils.clamp(deadZone, 0, 0.5);
  }
  
  setMaxRotation(maxRotationY, maxRotationX) {
    this.mouseTracking.maxRotationY = Math.max(0, maxRotationY);
    this.mouseTracking.maxRotationX = Math.max(0, maxRotationX);
  }
  
}