// 👁️ SecurityIRISManager V5 - Gestion sécurité Eye + IRIS NETTOYÉ
import * as THREE from 'three';

export class SecurityIRISManager {
  constructor() {
    this.securityObjects = new Map();
    this.currentState = 'NORMAL';
    this.isEnabled = true;
    this.animationFrameId = null;
    
    // États de sécurité - COULEURS UNIQUEMENT (pas d'intensités)
    this.securityStates = {
      SAFE: {
        color: 0x00ff00,      // Vert
        name: 'Safe'
      },
      DANGER: {
        color: 0xff0000,      // Rouge
        name: 'Danger/Scam'
      },
      WARNING: {
        color: 0xff8800,      // Orange
        name: 'Warning'
      },
      NORMAL: {
        color: 0xffffff,      // Blanc
        name: 'Normal'
      },
      SCANNING: {
        color: 0x0088ff,      // Bleu
        name: 'Scanning'
      }
    };
    
    // this.initializeKeyControls();
    console.log("👁️ SecurityIRISManager: Event listeners désactivés (géré par V3Scene)");
  }

  // Initialiser les contrôles clavier pour test
  initializeKeyControls() {
    document.addEventListener('keydown', (event) => {
      // ✅ SEULEMENT les touches simples (sans Ctrl)
      switch(event.code) {
        case 'KeyS':
          event.preventDefault();
          this.setSecurityState('SAFE');
          break;
        case 'KeyD':
          event.preventDefault();
          this.setSecurityState('DANGER');
          break;
        case 'KeyW':
          event.preventDefault();
          this.setSecurityState('WARNING');
          break;
        case 'KeyN':
          event.preventDefault();
          this.setSecurityState('NORMAL');
          break;
        case 'KeyC':
          event.preventDefault();
          this.setSecurityState('SCANNING');
          break;
      }
    });
  }

  // Enregistrer les objets de sécurité (Eye + IRIS)
  addSecurityObject(object, type) {
    if (!object || !object.material) return false;
    
    const name = object.name;
    const isValidObject = 
      name.includes('Anneaux_Eye_Ext') || 
      name.includes('Anneaux_Eye_Int') || 
      name.includes('IRIS');
    
    if (!isValidObject) return false;
    
    // Cloner le matériau pour modifications indépendantes
    const originalMaterial = object.material;
    const clonedMaterial = originalMaterial.clone();
    
    // Configuration matériau pour bloom
    clonedMaterial.emissive = new THREE.Color(0x000000);
    clonedMaterial.emissiveIntensity = 0; // Sera modifié par setState
    
    object.material = clonedMaterial;
    
    this.securityObjects.set(name, {
      object: object,
      material: clonedMaterial,
      originalMaterial: originalMaterial,
      type: type || 'security',
      baseEmissive: new THREE.Color(0x000000)
    });
    
    return true;
  }

  // ✅ MÉTHODE AMÉLIORÉE: Détecter et activer automatiquement
  detectSecurityObjects(model) {
    if (!model) {
      console.warn('👁️ SecurityIRISManager: Aucun modèle fourni pour détection');
      return 0;
    }

    let detectedCount = 0;

    // Parcourir récursivement tous les objets du modèle
    model.traverse((child) => {
      if (child.isMesh && child.material) {
        const name = child.name || '';
        
        // Vérifier si c'est un objet de sécurité (Eye ou IRIS)
        const isEyeObject = name.includes('Anneaux_Eye_Ext') || 
                           name.includes('Anneaux_Eye_Int');
        const isIRISObject = name.includes('IRIS');
        
        if (isEyeObject || isIRISObject) {
          const type = isIRISObject ? 'iris' : 'eye';
          const added = this.addSecurityObject(child, type);
          
          if (added) {
            detectedCount++;
            console.log(`👁️ Détecté: ${name} (${type})`);
          }
        }
      }
    });

    console.log(`👁️ SecurityIRISManager: ${detectedCount} objets de sécurité détectés`);
    
    // // ✅ ACTIVATION AUTOMATIQUE: Mettre en mode SCANNING pour voir les anneaux
    // if (detectedCount > 0) {
    //   console.log('👁️ Activation automatique mode SCANNING pour tests...');
    //   setTimeout(() => {
    //     this.setSecurityState('SCANNING');
    //   }, 2000); // 2 secondes après chargement
    // }
    // ✅ REMPLACER PAR :
console.log('👁️ SecurityIRISManager détection terminée - AUCUNE activation automatique');
    
    return detectedCount;
  }

  // Changer l'état de sécurité
  setSecurityState(stateName) {
    if (!this.securityStates[stateName]) {
      console.warn(`État de sécurité inconnu: ${stateName}`);
      return false;
    }
  
    this.currentState = stateName;
    
    // Arrêter l'animation précédente
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    
    const state = this.securityStates[stateName];
    
    // Appliquer SEULEMENT la couleur aux objets de sécurité (pas l'intensité)
    this.securityObjects.forEach((data) => {
      const { material } = data;
      
      // Changer SEULEMENT la couleur émissive, garder l'intensité actuelle
      material.emissive.setHex(state.color);
      // ❌ SUPPRIMÉ: material.emissiveIntensity = state.intensity;
      // Les intensités sont maintenant gérées par le DebugPanel/Zustand
    });
    
    return true;
  }

  // Animation de pulsation
  // startPulseAnimation(state) {
  //   let startTime = Date.now();
    
  //   const animate = () => {
  //     const elapsed = Date.now() - startTime;
  //     const cycle = (elapsed * state.pulseSpeed * 0.001) % (Math.PI * 2);
  //     const intensity = state.intensity * (0.5 + 0.5 * Math.sin(cycle));
      
  //     // Appliquer à tous les objets
  //     this.securityObjects.forEach((data) => {
  //       data.material.emissiveIntensity = intensity;
  //     });
      
  //     this.animationFrameId = requestAnimationFrame(animate);
  //   };
    
  //   animate();
  // }

  // Obtenir l'état actuel
  getCurrentState() {
    return {
      state: this.currentState,
      config: this.securityStates[this.currentState],
      objectCount: this.securityObjects.size
    };
  }

  // Activer/désactiver le système
  setEnabled(enabled) {
    this.isEnabled = enabled;
    
    if (!enabled) {
      // Désactiver tous les effets
      this.securityObjects.forEach((data) => {
        data.material.emissive.setHex(0x000000);
        data.material.emissiveIntensity = 0;
      });
      
      if (this.animationFrameId) {
        cancelAnimationFrame(this.animationFrameId);
        this.animationFrameId = null;
      }
    } else {
      // Réactiver l'état actuel
      this.setSecurityState(this.currentState);
    }
  }

  // Obtenir les contrôles disponibles
  getAvailableControls() {
    return {
      'S': 'SAFE (Vert)',
      'D': 'DANGER (Rouge)', 
      'W': 'WARNING (Orange)', 
      'N': 'NORMAL (Aucun)',
      'C': 'SCANNING (Bleu)'
    };
  }

  // Debug des objets de sécurité
  debugSecurityObjects() {
    console.log('👁️ DEBUG Security Objects:');
    this.securityObjects.forEach((data, name) => {
      console.log(`  - ${name}: ${data.type} | Emissive: ${data.material.emissiveIntensity}`);
    });
  }

  // Update pour animations (optionnel)
  update() {
    // Placeholder pour animations futures si besoin
  }

  // Nettoyer les ressources
  cleanup() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    
    // Restaurer les matériaux originaux
    this.securityObjects.forEach((data) => {
      if (data.object && data.originalMaterial) {
        data.object.material = data.originalMaterial;
      }
    });
    
    this.securityObjects.clear();
  }
}