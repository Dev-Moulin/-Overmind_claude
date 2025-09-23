// ✨ ObjectTransitionManager V5 - STUB MINIMAL pour débloquer le système
import * as THREE from 'three';

// 🔄 ObjectTransitionManager V5 - STUB COMPLET
export class ObjectTransitionManager {
    constructor(model) {
      this.model = model;
      this.isTransitioning = false;
      this.currentState = 'idle';
      
    }
  
    // Méthodes de base pour compatibilité
    startTransition() {
      this.isTransitioning = true;
      this.currentState = 'transitioning';
      
      // Simuler une transition qui se termine
      setTimeout(() => {
        this.isTransitioning = false;
        this.currentState = 'idle';
      }, 1000);
    }
  
    stopTransition() {
      this.isTransitioning = false;
      this.currentState = 'idle';
    }
  
    setTransitionSpeed() {
    }
  
    getState() {
      return {
        isTransitioning: this.isTransitioning,
        currentState: this.currentState,
        model: !!this.model
      };
    }
  
    update(/* delta */) {
        // Pas d'update nécessaire pour le moment
        // Cette méthode existe pour éviter les erreurs si appelée
      }
  
    dispose() {
      this.model = null;
      this.isTransitioning = false;
      this.currentState = 'disposed';
    }
  }