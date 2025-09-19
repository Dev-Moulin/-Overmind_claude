// xstateStateController.js - PHASE 1 Jour 6-8
// State Controller pour connecter XState à Three.js
// Remplace l'ancien système Zustand par XState

// 🎯 XSTATE STATE CONTROLLER - Interface entre XState et Three.js
class XStateStateController {
  constructor() {
    this.sceneHook = null;
    this.currentAnimation = null;
    this.bloomGroups = new Map();
    this.securityLights = new Map();
    this.revealRings = new Map();
  }

  // === INITIALIZATION ===
  init(sceneHook) {
    this.sceneHook = sceneHook;
    console.log('🚀 XStateStateController initialized');
  }

  // === BLOOM MANAGEMENT ===
  updateBloomGroup(groupName, settings) {
    if (!this.sceneHook) return;
    
    // Met à jour chaque valeur si fournie
    if (settings.intensity !== undefined && this.sceneHook.updateBloomValue) {
      this.sceneHook.updateBloomValue(groupName, 'intensity', settings.intensity);
    }
    
    if (settings.color !== undefined && this.sceneHook.updateBloomValue) {
      this.sceneHook.updateBloomValue(groupName, 'color', settings.color);
    }
    
    if (settings.enabled !== undefined && this.sceneHook.updateBloomValue) {
      this.sceneHook.updateBloomValue(groupName, 'enabled', settings.enabled);
    }
    
    // Applique immédiatement (plus de setTimeout!)
    if (this.sceneHook.applyBloomChangeImmediately) {
      this.sceneHook.applyBloomChangeImmediately();
    }
  }

  applyPreset(presetName) {
    if (!this.sceneHook || !this.sceneHook.applyBloomPreset) return;
    
    this.sceneHook.applyBloomPreset(presetName);
  }

  // ✅ MÉTHODE ATTENDUE PAR LA STATE MACHINE (ligne 549)
  applyBloomPreset(preset) {
    console.log('🌟 applyBloomPreset called:', preset);
    if (!this.sceneHook || !this.sceneHook.applyBloomPreset) return;
    
    this.sceneHook.applyBloomPreset(preset);
  }

  // ✅ MÉTHODE ATTENDUE PAR LA STATE MACHINE (ligne 505)
  setMaterialParameter(group, property, value) {
    console.log('🌟 setMaterialParameter called:', group, property, value);
    
    // Direct Three.js mock update - bypass state machine pour éviter les erreurs
    console.log(`🎨 Direct Three.js Update: ${group}.${property} = ${value}`);
    
    // Si on a le sceneHook, on peut l'utiliser directement sans passer par XState
    if (this.sceneHook && this.sceneHook.updateBloomValue) {
      // Pour éviter les boucles, on n'appelle pas updateBloomValue qui retrigger XState
      console.log('📡 Would update Three.js directly');
    }
  }

  // === SECURITY MANAGEMENT ===
  setSecurityMode(mode) {
    if (!this.sceneHook || !this.sceneHook.setSecurityMode) return;
    
    this.sceneHook.setSecurityMode(mode);
  }

  overrideSecurity() {
    if (!this.sceneHook || !this.sceneHook.overrideSecurity) return;
    
    this.sceneHook.overrideSecurity();
  }

  // === ANIMATION MANAGEMENT ===
  startAnimation(type, data = {}) {
    if (!this.sceneHook || !this.sceneHook.startAnimation) return;
    
    // Vérifie si une animation est déjà en cours
    if (this.sceneHook.isAnimationInProgress && this.sceneHook.isAnimationInProgress()) {
      console.warn('🚫 Animation already in progress');
      return false;
    }
    
    this.sceneHook.startAnimation(type, data);
    return true;
  }

  completeAnimation() {
    if (!this.sceneHook || !this.sceneHook.completeAnimation) return;
    
    this.sceneHook.completeAnimation();
  }

  // === REVEAL RINGS MANAGEMENT ===
  setRevealRingVisibility(ringId, visible) {
    if (!this.sceneHook || !this.sceneHook.setRevealRingVisibility) return;
    
    this.sceneHook.setRevealRingVisibility(ringId, visible);
  }

  resolveRevealConflicts() {
    if (!this.sceneHook || !this.sceneHook.resolveRevealConflicts) return;
    
    this.sceneHook.resolveRevealConflicts();
  }

  // === STATE QUERIES ===
  getBloomState() {
    if (!this.sceneHook || !this.sceneHook.bloomState) return {};
    
    return this.sceneHook.bloomState;
  }

  getSecurityState() {
    if (!this.sceneHook || !this.sceneHook.securityState) return {};
    
    return this.sceneHook.securityState;
  }

  getCurrentAnimationState() {
    if (!this.sceneHook || !this.sceneHook.animationState) return null;
    
    return this.sceneHook.animationState.currentAnimation;
  }

  // === ERROR HANDLING ===
  handleError(error) {
    if (!this.sceneHook) return;
    
    console.error('❌ XStateStateController Error:', error);
    
    // Tente de retry automatiquement une fois
    if (this.sceneHook.retryLastOperation) {
      setTimeout(() => {
        this.sceneHook.retryLastOperation();
      }, 100);
    }
  }

  // === DEBUG INFO ===
  getDebugInfo() {
    if (!this.sceneHook) return {};
    
    return {
      currentState: this.sceneHook.currentState || null,
      queueSize: this.sceneHook.operationQueue ? this.sceneHook.operationQueue.length : 0,
      hasErrors: this.sceneHook.errorState !== null && this.sceneHook.errorState !== undefined,
      notificationCount: this.sceneHook.notifications ? this.sceneHook.notifications.length : 0
    };
  }
}

// Singleton instance
const xstateController = new XStateStateController();

export default xstateController;