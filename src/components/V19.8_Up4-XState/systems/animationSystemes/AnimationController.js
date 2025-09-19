// 🎬 AnimationController V5 - Core animations pour bloom effects CORRIGÉ
import * as THREE from 'three';
import { V3_CONFIG } from '../../utils/config.js';
import { TransitionManager } from './TransitionManager.js';
import { DebugManager } from './DebugManager.js';

export class AnimationController {
  constructor(model, animations) {
    this.model = model;
    this.mixer = new THREE.AnimationMixer(model);
    this.actions = new Map();
    
    // Groupes d'animations
    this.permanentActions = new Map();
    this.poseActions = new Map();
    this.ringActions = new Map();
    this.eyeDriverActions = new Map();

    // Configuration transitions
    this.fadeDuration = 1.5;
    this.timeScale = 1.0;
    this.isTransitioning = false;
    this.SYNC_TIMESCALE = 0.8;
    
    // Tracking actions
    this.currentPermanentWeights = new Map();
    this.currentPoseAction = [];
    
    // Callbacks UI
    this.onAnimationFinished = null;
    this.onTransitionComplete = null;
    
    // Modules spécialisés
    this.transitionManager = new TransitionManager(this);
    this.debugManager = new DebugManager(this);
    
    // Initialisation
    this.initializeAnimations(animations);
    
    // ✅ AJOUT: Event listeners manquants !
    this.transitionManager.setupEventListeners();
    
  }

  // Initialisation avec classification
  initializeAnimations(animations) {
    animations.forEach(clip => {
      const action = this.mixer.clipAction(clip);
      this.actions.set(clip.name, action);
      
      // Configuration anti-glitch
      action.setEffectiveTimeScale(0.6);
      action.setEffectiveWeight(0);
      
      // Classification des animations
      const isBig = this.isBigArmAnimation(clip.name);
      const isLittle = this.isLittleArmAnimation(clip.name);
      // ✅ SUPPRIMÉ : Log de classification pour réduire spam console
      
      if (isBig || isLittle) {
        action.setLoop(THREE.LoopRepeat);
        this.permanentActions.set(clip.name, action);
        // ✅ SUPPRIMÉ : Log d'ajout animation permanente pour réduire spam console
        
      } else if (this.isPoseAnimation(clip.name)) {
        action.setLoop(THREE.LoopOnce);
        action.clampWhenFinished = true;
        action.setEffectiveTimeScale(0.8);
        this.poseActions.set(clip.name, action);
        
      } else if (this.isRingAnimation(clip.name)) {
        action.setLoop(THREE.LoopOnce);
        action.clampWhenFinished = true;
        action.setEffectiveTimeScale(0.6);
        this.ringActions.set(clip.name, action);
      }
    });
  }

  // Méthodes de classification
  isPoseAnimation(name) {
    return name === 'R1&R2_Pose' || name === 'R2&R1_Pose';
  }

  isBigArmAnimation(name) {
    return V3_CONFIG.animations.bigArms.includes(name);
  }

  isLittleArmAnimation(name) {
    return V3_CONFIG.animations.littleArms.includes(name);
  }

  isRingAnimation(name) {
    return V3_CONFIG.animations.rings.includes(name);
  }

  // Identifier les bras affectés
  getAffectedPermanentActions() {
    const affected = new Map();
    const affectedArmNames = ['Bras_R1_Mouv', 'Bras_R2_Mouv'];
    
    affectedArmNames.forEach(name => {
      if (this.permanentActions.has(name)) {
        affected.set(name, this.permanentActions.get(name));
      }
    });
    
    return affected;
  }

  // Méthodes principales
  startPermanentAnimations() {
    // ✅ SUPPRIMÉ : Logs répétitifs pour réduire spam console
    
    // Si aucune animation permanent trouvée, forcer avec toutes les animations
    if (this.permanentActions.size === 0) {
      this.actions.forEach((action, name) => {
        if (!this.isPoseAnimation(name) && !this.isRingAnimation(name)) {
          action.reset();
          action.play();
          action.setEffectiveWeight(1);
        }
      });
      return;
    }
    
    // Version normale si permanentActions existe
    this.permanentActions.forEach((action) => {
      action.reset();
      action.play();
      action.setEffectiveWeight(1);
    });
  }

  // ✅ CORRIGÉ: Transition vers pose - Utiliser la méthode du TransitionManager
  startPoseTransition() {

    return this.transitionManager.startPoseTransition();
  }

  // ✅ CORRIGÉ: Animations des anneaux
  startRingAnimations() {
    return this.transitionManager.startRingAnimations();
  }

  // ✅ AJOUTÉ: Retour aux animations permanentes (délégation vers TransitionManager)
  startReturnToPermanent() {
    // Force les transitions pose à se terminer et revenir aux animations permanentes
    if (this.isTransitioning && this.currentPoseActions?.length > 0) {
      // Simuler la fin de toutes les poses actives
      this.currentPoseActions.forEach(poseAction => {
        if (poseAction && poseAction.isRunning()) {
          const animationName = poseAction.getClip().name;
          this.transitionManager.startReturnToPermanent(poseAction, animationName);
        }
      });
      
      // Force la fin de la transition
      setTimeout(() => {
        this.isTransitioning = false;
        this.currentPoseActions = [];
        if (this.onTransitionComplete) {
          this.onTransitionComplete('permanent');
        }
      }, 100);
      
      return true;
    }
    return false;
  }
  // Update principal
  update(deltaTime) {
    if (this.mixer) {
      this.mixer.update(deltaTime);
      
      // ❌ DEBUG SUPPRIMÉ pour réduire spam console
    }
  }

  // Méthodes utilitaires
  getCurrentState() {
    return {
      permanentActive: this.permanentActions.size,
      isTransitioning: this.isTransitioning,
      poseActionsActive: Array.from(this.poseActions.values()).filter(action => action.isRunning()).length,
      ringAnimating: Array.from(this.ringActions.values()).some(action => action.isRunning()),
      fadeDuration: this.fadeDuration
    };
  }

  getAvailableAnimations() {
    return {
      permanent: Array.from(this.permanentActions.keys()),
      poses: Array.from(this.poseActions.keys()),
      rings: Array.from(this.ringActions.keys()),
      total: Array.from(this.actions.keys())
    };
  }

  // Configuration callbacks UI
  setAnimationFinishedCallback(callback) {
    this.onAnimationFinished = callback;
  }

  setTransitionCompleteCallback(callback) {
    this.onTransitionComplete = callback;
  }

  // Contrôle paramètres
  setFadeDuration(duration) {
    this.fadeDuration = Math.max(0.1, Math.min(3.0, duration));
  }

  setTimeScale(scale) {
    this.timeScale = Math.max(0.1, Math.min(3.0, scale));
    this.actions.forEach(action => {
      action.setEffectiveTimeScale(this.timeScale);
    });
  }

  // Méthodes debug simplifiées
  healthCheck() {
    return this.debugManager.healthCheck();
  }

  getDetailedStats() {
    return this.debugManager.getDetailedStats();
  }

  // Méthodes legacy (compatibilité)
  fadeToAction() {
    return this.startPoseTransition();
  }

  startPoseAnimation() {
    return this.startPoseTransition();
  }

  // ✅ CORRIGÉ: Nettoyage
  dispose() {
    // Fade out toutes les actions en cours
    const allActions = Array.from(this.actions.values());
    allActions.forEach(action => {
      if (action.isRunning()) {
        this.transitionManager.fadeToWeight(action, 0, 0.2);
      }
    });
    
    setTimeout(() => {
      if (this.mixer) {
        this.mixer.uncacheRoot(this.model);
        this.mixer.stopAllAction();
      }
      
      this.actions.clear();
      this.permanentActions.clear();
      this.poseActions.clear();
      this.ringActions.clear();
      this.eyeDriverActions.clear();
      this.currentPermanentWeights.clear();
      
      this.mixer = null;
      this.model = null;
      this.isTransitioning = false;
      this.currentPoseAction = null;
      this.onAnimationFinished = null;
      this.onTransitionComplete = null;
    }, 250);
  }
}