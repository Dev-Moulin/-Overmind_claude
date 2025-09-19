// 👁️ EyeRingRotationManager V5 - Rotation des anneaux Eye SEULEMENT
import * as THREE from 'three';

export class EyeRingRotationManager {
  constructor(animationController, camera = null) {
    this.controller = animationController;
    this.camera = camera;
    this.rotationSpeed = 0.01;
    this.isRotationEnabled = false;
    
    // Système de suivi souris
    this.mouseTracking = {
      enabled: false,
      sensitivity: 0.02,    // Vitesse de transition douce
      deadZone: 0.1,        // Zone morte au centre
      maxAngle: Math.PI,    // Rotation max
      autoReturn: true,     // Retour auto position neutre
      returnSpeed: 0.01     // Vitesse retour
    };
    
    // Position souris 3D pour calculs
    this.mousePosition3D = new THREE.Vector3();
    this.mouseActive = false;
    this.targetRotationZ = 0;
    this.currentMouseRotation = 0;
    
    // Timer pour auto-return
    this.mouseInactiveTimer = 0;
    this.mouseInactiveThreshold = 2000; // 2 secondes
  }

  // ✅ Initialiser (pas besoin du modèle)
  initialize() {
    
    // Activer rotation si pas de drivers
    if (this.controller.eyeDriverActions.size === 0) {
      this.forceEyeRotation();
    }
  }

  // ✅ Démarrer les drivers d'œil
  startEyeDrivers() {
    this.controller.eyeDriverActions.forEach((action) => {
      action.reset();
      action.play();
      action.setEffectiveWeight(0);
      this.controller.transitionManager.fadeInAction(action, this.controller.fadeDuration * 0.3);
    });

    if (this.controller.eyeDriverActions.size === 0) {
      this.forceEyeRotation();
    }
  }

  // ✅ Rotation manuelle des anneaux œil
  forceEyeRotation() {
    this.isRotationEnabled = true;
    this.rotationSpeed = 0.01;
  }

  // ✅ Rotation correcte sur AXE Z pour les deux anneaux + Suivi souris
  updateEyeRotation(deltaTime) {
    if (!this.controller.model || !this.isRotationEnabled) return;
    
    // Mettre à jour le système de suivi souris
    this.updateMouseTracking(deltaTime);
    
    this.controller.model.traverse((child) => {
      if (child.name === 'Anneaux_Eye_Ext') {
        if (this.mouseTracking.enabled && this.mouseActive) {
          // Mode suivi souris : appliquer rotation basée sur position souris
          child.rotation.z = THREE.MathUtils.lerp(
            child.rotation.z, 
            this.currentMouseRotation, 
            this.mouseTracking.sensitivity
          );
        } else {
          // Mode rotation automatique
          child.rotation.z += this.rotationSpeed * deltaTime * 60;
        }
        this.updateChromeMaterial(child);
        
      } else if (child.name === 'Anneaux_Eye_Int') {
        if (this.mouseTracking.enabled && this.mouseActive) {
          // Mode suivi souris : rotation inverse pour effet visuel
          child.rotation.z = THREE.MathUtils.lerp(
            child.rotation.z, 
            -this.currentMouseRotation * 1.2, // Légèrement plus rapide et inversé
            this.mouseTracking.sensitivity
          );
        } else {
          // Mode rotation automatique
          child.rotation.z -= this.rotationSpeed * deltaTime * 80;
        }
        this.updateChromeMaterial(child);
      }
    });
  }
  
  // 🖱️ Système de suivi souris
  updateMouseTracking(deltaTime) {
    if (!this.mouseTracking.enabled) return;
    
    // Timer d'inactivité souris
    if (this.mouseActive) {
      this.mouseInactiveTimer += deltaTime * 1000; // Convert to ms
      
      if (this.mouseInactiveTimer > this.mouseInactiveThreshold && this.mouseTracking.autoReturn) {
        this.mouseActive = false;
        this.targetRotationZ = 0; // Retour position neutre
      }
    }
    
    // Transition douce vers la rotation cible
    if (!this.mouseActive && this.mouseTracking.autoReturn) {
      // Retour progressif à la position neutre
      this.currentMouseRotation = THREE.MathUtils.lerp(
        this.currentMouseRotation, 
        0, 
        this.mouseTracking.returnSpeed
      );
    } else {
      // Suivi normal de la souris
      this.currentMouseRotation = THREE.MathUtils.lerp(
        this.currentMouseRotation, 
        this.targetRotationZ, 
        this.mouseTracking.sensitivity
      );
    }
  }
  
  // 🖱️ Mise à jour position souris (appelé depuis V3Scene)
  updateMousePosition(mouseX, mouseY) {
    if (!this.mouseTracking.enabled || !this.camera) return;
    
    const _mouse = new THREE.Vector2(mouseX, mouseY);
    
    // Zone morte au centre
    const distance = Math.sqrt(mouseX * mouseX + mouseY * mouseY);
    if (distance < this.mouseTracking.deadZone) {
      this.targetRotationZ = 0;
      return;
    }
    
    // Calculer l'angle de rotation basé sur position souris
    // mouseX : -1 (gauche) à 1 (droite) -> rotation Z
    this.targetRotationZ = -mouseX * this.mouseTracking.maxAngle; // Négatif pour rotation naturelle
    
    // Clamper dans les limites
    this.targetRotationZ = THREE.MathUtils.clamp(
      this.targetRotationZ, 
      -this.mouseTracking.maxAngle, 
      this.mouseTracking.maxAngle
    );
    
    this.mouseActive = true;
    this.mouseInactiveTimer = 0; // Reset timer
    
    console.log(`👁️ Eye tracking: mouseX=${mouseX.toFixed(2)} -> rotZ=${this.targetRotationZ.toFixed(2)}rad`);
  }

  // ✅ MATÉRIAU CHROME DYNAMIQUE
  updateChromeMaterial(child) {
    if (child.material && child.material.name === 'Material-metal050-effet-chrome') {
      child.material.metalness = 1.0;
      child.material.roughness = 0.05;
    }
  }

  // 🔄 Update principal (rotation seulement)
  update(deltaTime) {
    this.updateEyeRotation(deltaTime);
  }

  // 🎨 API publique pour sécurité (redirections vers BloomControlCenter)
  setSecurityState() {
    return true;
  }

  getCurrentSecurityState() {
    return { state: 'MANAGED_BY_BLOOM_CONTROL_CENTER', objectCount: 0 };
  }

  // 🔍 Classification animation Eye
  isEyeDriverAnimation(name) {
    const eyeKeywords = ['Eye', 'Anneaux_Eye', 'Driver'];
    return eyeKeywords.some(keyword => name.includes(keyword));
  }

  // 🔧 Debug spécifique drivers œil
  debugEyeDriversSearch() {
    const allAnimations = Array.from(this.controller.actions.keys());
    
    allAnimations.forEach(name => {
      if (name.toLowerCase().includes('eye') || 
          name.toLowerCase().includes('anneaux') ||
          name.toLowerCase().includes('driver') ||
          name.toLowerCase().includes('rotation')) {
        // Eye rotation handling
      }
    });
    
    this.controller.model.traverse((child) => {
      if (child.name && (
          child.name.includes('Eye') || 
          child.name.includes('Anneaux_Eye') ||
          child.name.includes('eye')
        )) {
        // Child eye handling
      }
    });

  }

  // ⚙️ Contrôles rotation
  setRotationSpeed(speed) {
    this.rotationSpeed = Math.max(0.001, Math.min(0.1, speed));
  }

  enableRotation() {
    this.isRotationEnabled = true;
  }

  disableRotation() {
    this.isRotationEnabled = false;
  }

  toggleRotation() {
    this.isRotationEnabled = !this.isRotationEnabled;
    return this.isRotationEnabled;
  }
  
  // 👁️ Contrôles suivi souris
  enableMouseTracking() {
    this.mouseTracking.enabled = true;
    console.log('👁️ Suivi souris activé');
  }
  
  disableMouseTracking() {
    this.mouseTracking.enabled = false;
    this.mouseActive = false;
    this.currentMouseRotation = 0;
    // ✅ SUPPRIMÉ : Log pour réduire spam console
  }
  
  toggleMouseTracking() {
    this.mouseTracking.enabled = !this.mouseTracking.enabled;
    if (!this.mouseTracking.enabled) {
      this.mouseActive = false;
      this.currentMouseRotation = 0;
    }
    console.log(`👁️ Suivi souris ${this.mouseTracking.enabled ? 'activé' : 'désactivé'}`);
    return this.mouseTracking.enabled;
  }
  
  setMouseTrackingSensitivity(sensitivity) {
    this.mouseTracking.sensitivity = THREE.MathUtils.clamp(sensitivity, 0.001, 0.1);
  }
  
  setMouseTrackingDeadZone(deadZone) {
    this.mouseTracking.deadZone = THREE.MathUtils.clamp(deadZone, 0, 0.5);
  }

  // ⚙️ Contrôles bloom (redirections vers BloomControlCenter)
  enableSecurityBloom() {
  }

  disableSecurityBloom() {
  }
}