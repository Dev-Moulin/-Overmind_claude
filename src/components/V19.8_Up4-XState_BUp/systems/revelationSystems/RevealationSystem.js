// 🌟 RevealationSystem V5 - SYSTÈME RÉVÉLATION ANNEAUX NETTOYÉ
import * as THREE from 'three';
import { V3_CONFIG } from '../../utils/config.js';
import { RING_MATERIALS, getMaterialType } from '../../utils/materials.js';

export class RevealationSystem {
  constructor(magicRings) {
    this.magicRings = magicRings;
    this.triggerZone = {
      position: new THREE.Vector3(
        V3_CONFIG.revelation.centerX,
        V3_CONFIG.revelation.centerY,
        V3_CONFIG.revelation.centerZ
      ),
      radius: V3_CONFIG.revelation.radius,
      height: V3_CONFIG.revelation.height
    };
    
    this.forceShowAll = false;
    this.isAnimating = false;
    this.tempVec = new THREE.Vector3();
    this.tempZone = new THREE.Vector3(); // 👁️ Position zone transformée
    this.modelRef = null; // 👁️ Référence au modèle 3D
    
  }

  // Logique révélation inversée (silencieuse)
  updateRevelation() {
    // ❌ SUPPRIMÉ : Logs spamming supprimés pour performance
    const revealedRings = this.magicRings.map(ring => {
      ring.getWorldPosition(this.tempVec);
      
      // 👁️ NOUVEAU : Si on a une référence au modèle, transformer la zone selon sa rotation
      let zonePosition = this.triggerZone.position;
      if (this.modelRef) {
        // Appliquer la transformation du modèle à la position de zone
        this.tempZone.copy(this.triggerZone.position);
        this.tempZone.applyMatrix4(this.modelRef.matrixWorld);
        zonePosition = this.tempZone;
      }
      
      const distance = this.tempVec.distanceTo(zonePosition);
      const isInZone = distance <= this.triggerZone.radius && 
                      Math.abs(this.tempVec.y - zonePosition.y) <= this.triggerZone.height;
      
      // Logique inversée : visible HORS zone, invisible DANS zone
      const shouldShow = this.forceShowAll || !isInZone;
      
      // Si forceShowAll est actif, ne pas changer la visibilité
      if (!this.forceShowAll) {
        ring.visible = shouldShow;
      }
      
      // Application matériau bloom si révélé
      if (shouldShow && ring.material) {
        this.applyBloomMaterial(ring);
      }
      
      // Utiliser la position mondiale pour l'affichage
      const displayPosition = this.tempVec;
      
      return {
        name: ring.name,
        position: { 
          x: parseFloat(displayPosition.x.toFixed(2)), 
          y: parseFloat(displayPosition.y.toFixed(2)), 
          z: parseFloat(displayPosition.z.toFixed(2)) 
        },
        visible: shouldShow,
        distance: parseFloat(distance.toFixed(2)),
        type: getMaterialType(ring.material?.name || ""),
        isInZone: isInZone,
        material: ring.material?.name || "No Material"
      };
    });
    
    return revealedRings;
  }

  // Application matériau bloom (préserver textures ET contrôles utilisateur)
  applyBloomMaterial(ring) {
    if (!ring.material) return;
    
    const materialName = ring.material.name;
    if (RING_MATERIALS.includes(materialName)) {
      ring.material.transparent = true;
      ring.material.depthWrite = true;
      
      // 🔥 NOUVEAU: Utiliser les valeurs Zustand au lieu de valeurs hardcodées
      // Récupérer les valeurs depuis le store global
      const zustandStore = window.useSceneStore?.getState?.();
      
      if (zustandStore?.bloom?.groups?.revealRings) {
        const revealRingsConfig = zustandStore.bloom.groups.revealRings;
        
        // Appliquer les valeurs Zustand pour TOUS les matériaux de reveal rings
        if (revealRingsConfig.emissive) {
          ring.material.emissive = new THREE.Color(revealRingsConfig.emissive);
        }
        if (revealRingsConfig.emissiveIntensity !== undefined) {
          ring.material.emissiveIntensity = revealRingsConfig.emissiveIntensity;
        }
        
        // Debug seulement quand c'est la première fois ou lors de forceUpdate
        if (this._debugMode || !this._lastAppliedValues) {
          console.log(`✅ RevealationSystem: Applied Zustand values to ${materialName}:`, {
            emissive: revealRingsConfig.emissive,
            emissiveIntensity: revealRingsConfig.emissiveIntensity
          });
          this._lastAppliedValues = { emissive: revealRingsConfig.emissive, emissiveIntensity: revealRingsConfig.emissiveIntensity };
        }
      } else {
        // Debug uniquement si pas déjà signalé récemment
        if (!this._warnedAboutStore || (Date.now() - this._warnedAboutStore) > 5000) {
          console.warn(`❌ RevealationSystem: Zustand store not available for ${materialName}, using fallback values`);
          this._warnedAboutStore = Date.now();
        }
        // 🔧 FALLBACK: Valeurs par défaut seulement si Zustand non disponible
        if (materialName === 'BloomArea' && ring.material.emissiveIntensity === 0) {
          ring.material.emissive = new THREE.Color(0x00ff88); // Vert par défaut
          ring.material.emissiveIntensity = 0.36;
        } else if (materialName === 'alien-panels' && ring.material.emissiveIntensity === 0) {
          ring.material.emissive = new THREE.Color(0x00ff88);
          ring.material.emissiveIntensity = 0.36;
        } else if (materialName === 'Material-metal050-effet-chrome' && ring.material.emissiveIntensity === 0) {
          ring.material.emissive = new THREE.Color(0x00ff88);
          ring.material.emissiveIntensity = 0.36;
        }
      }
      
      // Forcer la mise à jour du matériau
      ring.material.needsUpdate = true;
    }
  }

  // Reset matériaux
  resetRingMaterials() {
    this.magicRings.forEach(ring => {
      if (ring.material) {
        ring.material.emissive = new THREE.Color(0x000000);
        ring.material.emissiveIntensity = 0;
      }
    });
  }

  // Démarrer animation anneaux
  startRingAnimation(animationController) {
    if (this.isAnimating) {
      return false;
    }
    
    this.isAnimating = true;
    
    if (animationController && typeof animationController.startRingAnimations === 'function') {
      const success = animationController.startRingAnimations();
      
      if (success) {
        setTimeout(() => {
          this.isAnimating = false;
        }, 4000);
        
        return true;
      } else {
        this.isAnimating = false;
        return false;
      }
    } else {
      return this.startRingAnimationLegacy(animationController);
    }
  }

  // Fallback legacy
  startRingAnimationLegacy(animationController) {
    V3_CONFIG.animations.rings.forEach(animName => {
      if (animationController.actions && animationController.actions.has(animName)) {
        const action = animationController.actions.get(animName);
        action.reset();
        action.setLoop(THREE.LoopOnce);
        action.clampWhenFinished = true;
        action.play();
      }
    });
    
    setTimeout(() => {
      this.isAnimating = false;
    }, 4000);
    
    return true;
  }

  // Mise à jour zone trigger
  updateTriggerZone(position, radius, height) {
    this.triggerZone.position.copy(position);
    this.triggerZone.radius = radius;
    this.triggerZone.height = height;
  }

  // 👁️ NOUVEAU : Définir référence au modèle pour transformation de zone
  setModelReference(model) {
    this.modelRef = model;
    // ✅ SUPPRIMÉ : Log pour réduire spam console
  }

  // Forçage affichage
  setForceShowAll(force, withEffects = true) {
    // ✅ SUPPRIMÉ : Log pour réduire spam console
    this.forceShowAll = force;
    
    if (force) {
      this.magicRings.forEach((ring) => {
        ring.visible = true;
        if (withEffects) {
          this.applyBloomMaterial(ring);
        }
      });
    } else {
      // ✅ CORRIGÉ: Appliquer immédiatement la logique normale de révélation
      this.updateRevelation();
    }
  }

  // 🔥 NOUVELLE MÉTHODE: Forcer la mise à jour des matériaux avec les valeurs Zustand actuelles
  forceUpdateBloomMaterials() {
    console.log('🔄 RevealationSystem: Forcing bloom materials update with current Zustand values');
    this._debugMode = true; // Activer logs pour cette opération
    this.magicRings.forEach((ring) => {
      if (ring.visible) {
        this.applyBloomMaterial(ring);
      }
    });
    this._debugMode = false; // Désactiver après
  }

  // Getters
  getTriggerZone() {
    return { 
      position: this.triggerZone.position.clone(),
      radius: this.triggerZone.radius,
      height: this.triggerZone.height
    };
  }

  isCurrentlyAnimating() {
    return this.isAnimating;
  }

  getRingStats() {
    const visible = this.magicRings.filter(ring => ring.visible).length;
    const total = this.magicRings.length;
    
    return {
      visible,
      hidden: total - visible,
      total,
      forceShow: this.forceShowAll,
      animating: this.isAnimating
    };
  }

  // Méthodes utilitaires
  resetAllRings() {
    this.magicRings.forEach(ring => {
      ring.visible = false;
      if (ring.material) {
        ring.material.emissive = new THREE.Color(0x000000);
        ring.material.emissiveIntensity = 0;
      }
    });
  }

  forceShowRing(ringName, show = true) {
    const ring = this.magicRings.find(r => r.name === ringName);
    if (ring) {
      ring.visible = show;
      if (show) this.applyBloomMaterial(ring);
    }
  }

  // Nettoyage
  dispose() {
    this.resetAllRings();
    this.magicRings = null;
  }
}