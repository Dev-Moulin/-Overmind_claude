import * as THREE from 'three';
import { ParticleSystemV2 } from './ParticleSystemV2.js';

/**
 * 🎮 ParticleSystemController V2
 * Contrôleur principal pour le nouveau système de particules 3D
 */
export class ParticleSystemController {
  constructor(scene, camera, config = {}) {
    this.scene = scene;
    this.camera = camera;
    this.config = config;
    
    // Système V2
    this.particleSystemV2 = null;
    
    // État d'activation - ACTIF par défaut comme demandé
    this.enabled = true;
    
    // Temps pour animation
    this.clock = new THREE.Clock();
  }
  
  /**
   * Créer et initialiser le système de particules V2
   */
  initialize() {
    if (this.particleSystemV2) {
      this.particleSystemV2.dispose();
    }
    
    this.particleSystemV2 = new ParticleSystemV2(this.scene, this.camera, this.config);
    this.enabled = true;
    console.log('🎨 ParticleSystemController.initialize() - État final: enabled =', this.enabled);
  }
  
  /**
   * Mettre à jour le système
   */
  update() {
    if (!this.enabled || !this.particleSystemV2) return;
    
    const deltaTime = this.clock.getDelta();
    this.particleSystemV2.update(deltaTime);
  }
  
  /**
   * API pour contrôles debug
   */
  
  setEnabled(enabled) {
    this.enabled = enabled;
    console.log('🎨 ParticleSystemController.setEnabled:', enabled);
    
    if (this.particleSystemV2) {
      // Contrôler la visibilité au lieu de détruire/recréer
      this.particleSystemV2.particleMesh.visible = enabled;
      if (this.particleSystemV2.connectionLines) {
        this.particleSystemV2.connectionLines.visible = enabled;
      }
      if (this.particleSystemV2.electricArcs) {
        this.particleSystemV2.electricArcs.visible = enabled;
      }
      console.log('🎨 Visibilité des particules:', enabled);
    } else if (enabled) {
      console.log('🎨 Réinitialisation du système de particules');
      this.initialize();
    }
  }
  
  getConfig() {
    return this.particleSystemV2 ? this.particleSystemV2.config : null;
  }
  
  updateConfig(config) {
    if (this.particleSystemV2) {
      this.particleSystemV2.setConfig(config);
    }
  }
  
  // Contrôles spécifiques
  
  setParticleCount(count) {
    if (this.particleSystemV2) {
      this.particleSystemV2.setParticleCount(count);
    }
  }
  
  setGravity(x, y, z) {
    if (this.particleSystemV2) {
      this.particleSystemV2.setGravity(x, y, z);
    }
  }
  
  setConnectionDistance(distance) {
    if (this.particleSystemV2) {
      this.particleSystemV2.config.connectionDistance = distance;
    }
  }
  
  setGroupCohesion(cohesion) {
    if (this.particleSystemV2) {
      this.particleSystemV2.config.groupCohesion = cohesion;
    }
  }
  
  setSignalEnabled(enabled) {
    if (this.particleSystemV2) {
      this.particleSystemV2.config.signalEnabled = enabled;
    }
  }
  
  setSignalFrequency(frequency) {
    if (this.particleSystemV2) {
      this.particleSystemV2.setSignalFrequency(frequency);
    }
  }
  
  // Contrôles des arcs électriques
  setArcsEnabled(enabled) {
    if (this.particleSystemV2) {
      this.particleSystemV2.setArcsEnabled(enabled);
    }
  }
  
  setArcCount(count) {
    if (this.particleSystemV2) {
      this.particleSystemV2.setArcCount(count);
    }
  }
  
  setArcIntensity(intensity) {
    if (this.particleSystemV2) {
      this.particleSystemV2.setArcIntensity(intensity);
    }
  }
  
  setArcColor(color) {
    if (this.particleSystemV2) {
      this.particleSystemV2.setArcColor(color);
    }
  }
  
  setArcFrequency(frequency) {
    if (this.particleSystemV2) {
      this.particleSystemV2.setArcFrequency(frequency);
    }
  }
  
  // Nouvelles méthodes pour les contrôles améliorés
  setArcCountVariation(variation) {
    if (this.particleSystemV2) {
      this.particleSystemV2.setArcCountVariation(variation);
    }
  }
  
  setArcIntensityVariation(variation) {
    if (this.particleSystemV2) {
      this.particleSystemV2.setArcIntensityVariation(variation);
    }
  }
  
  setArcFrequencyVariation(variation) {
    if (this.particleSystemV2) {
      this.particleSystemV2.setArcFrequencyVariation(variation);
    }
  }
  
  setArcColorMode(mode) {
    if (this.particleSystemV2) {
      this.particleSystemV2.setArcColorMode(mode);
    }
  }
  
  setArcWhitePercentage(percentage) {
    if (this.particleSystemV2) {
      this.particleSystemV2.setArcWhitePercentage(percentage);
    }
  }
  
  setArcType(type) {
    if (this.particleSystemV2) {
      this.particleSystemV2.setArcType(type);
    }
  }
  
  setSecurityMode(mode) {
    if (this.particleSystemV2) {
      this.particleSystemV2.setSecurityMode(mode);
    }
  }
  
  // Contrôles pour particules et connexions
  setParticleSizeMultiplier(multiplier) {
    if (this.particleSystemV2) {
      this.particleSystemV2.setParticleSizeMultiplier(multiplier);
    }
  }
  
  setConnectionWidth(width) {
    if (this.particleSystemV2) {
      this.particleSystemV2.setConnectionWidth(width);
    }
  }
  
  setConnectionColor(color) {
    if (this.particleSystemV2) {
      this.particleSystemV2.setConnectionColor(color);
    }
  }
  
  
  setParticleCountRange(min, max) {
    if (this.particleSystemV2) {
      this.particleSystemV2.setParticleCountRange(min, max);
    }
  }
  
  setConnectionDistanceRange(min, max) {
    if (this.particleSystemV2) {
      this.particleSystemV2.setConnectionDistanceRange(min, max);
    }
  }
  
  randomizeParticleCount() {
    if (this.particleSystemV2) {
      this.particleSystemV2.randomizeParticleCount();
    }
  }
  
  randomizeConnectionDistance() {
    if (this.particleSystemV2) {
      this.particleSystemV2.randomizeConnectionDistance();
    }
  }
  
  // Contrôles de performance et visibilité
  setVisibilityUpdateFrequency(frequency) {
    if (this.particleSystemV2) {
      this.particleSystemV2.setVisibilityUpdateFrequency(frequency);
    }
  }
  
  getVisibilityStats() {
    return this.particleSystemV2 ? this.particleSystemV2.getVisibilityStats() : null;
  }
  
  // Méthode pour compatibilité avec l'ancien DebugPanel
  getSystemsInfo() {
    return this.particleSystemV2 ? {
      'particle_system_v2': {
        active: this.enabled,
        particleCount: this.particleSystemV2.config.particleCount
      }
    } : {};
  }
  
  // Interactions
  
  triggerSignalWave(position) {
    if (this.particleSystemV2) {
      this.particleSystemV2.triggerSignalWave(position, 3.0, 0.8);
    }
  }
  
  updateMousePosition(mouseX, mouseY) {
    if (this.particleSystemV2) {
      this.particleSystemV2.updateMousePosition(mouseX, mouseY);
    }
  }
  
  setMouseRepulsionEnabled(enabled) {
    if (this.particleSystemV2) {
      this.particleSystemV2.config.mouseRepulsion.enabled = enabled;
    }
  }
  
  setMouseRepulsionRadius(radius) {
    if (this.particleSystemV2) {
      this.particleSystemV2.config.mouseRepulsion.radius = radius;
    }
  }
  
  setMouseRepulsionForce(force) {
    if (this.particleSystemV2) {
      this.particleSystemV2.config.mouseRepulsion.force = force;
    }
  }
  
  // Contrôle couleur particules
  setParticleColor(color) {
    if (this.particleSystemV2) {
      this.particleSystemV2.setParticleColor(color);
    }
  }
  
  // 👁️ Contrôles flux infini avec rotation du modèle
  updateEyeRotation(rotationY) {
    if (this.particleSystemV2) {
      this.particleSystemV2.updateEyeRotation(rotationY);
    }
  }
  
  setInfiniteFlowEnabled(enabled) {
    if (this.particleSystemV2) {
      this.particleSystemV2.config.infiniteFlow.enabled = enabled;
    }
  }
  
  setFlowSpeed(speed) {
    if (this.particleSystemV2) {
      this.particleSystemV2.config.infiniteFlow.flowSpeed = speed;
    }
  }
  
  setFlowZone(zoneStart, zoneEnd) {
    if (this.particleSystemV2) {
      this.particleSystemV2.config.infiniteFlow.zoneStart = zoneStart;
      this.particleSystemV2.config.infiniteFlow.zoneEnd = zoneEnd;
      this.particleSystemV2.config.infiniteFlow.recycleDistance = zoneStart - zoneEnd;
    }
  }
  
  setFlowBasedOnModelRotation(enabled) {
    if (this.particleSystemV2) {
      this.particleSystemV2.config.infiniteFlow.basedOnModelRotation = enabled;
    }
  }
  
  
  // 🎯 Mettre à jour point de convergence basé sur modèle 3D
  updateConvergencePoint(modelPosition, modelQuaternion) {
    if (this.particleSystemV2) {
      this.particleSystemV2.updateConvergencePoint(modelPosition, modelQuaternion);
    }
  }
  
  dispose() {
    if (this.particleSystemV2) {
      this.particleSystemV2.dispose();
      this.particleSystemV2 = null;
    }
    
    this.clock.stop();
  }
}