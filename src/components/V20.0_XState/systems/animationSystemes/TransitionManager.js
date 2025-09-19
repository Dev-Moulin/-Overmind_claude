// 🔄 TransitionManager V5 - CORRIGÉ selon V4 qui fonctionnait
import * as THREE from 'three';

export class TransitionManager {
  constructor(animationController) {
    this.controller = animationController;
    this.isAnimating = false;
    this.activeTransitions = new Map();
  }

  // Fade-in fluide
  fadeInAction(action, duration) {
    if (!action || duration <= 0) return;
    
    const startWeight = 0;
    const endWeight = 1;
    const startTime = Date.now();
    
    action.setEffectiveWeight(startWeight);
    
    const animate = () => {
      const elapsed = (Date.now() - startTime) / 1000;
      const progress = Math.min(elapsed / duration, 1);
      
      // Courbe smooth ease-out
      const weight = startWeight + (endWeight - startWeight) * this.easeOutCubic(progress);
      action.setEffectiveWeight(weight);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    animate();
  }

  // Fade-out fluide
  fadeOutAction(action, duration) {
    if (!action || duration <= 0) return;
    
    const startWeight = action.getEffectiveWeight();
    const endWeight = 0;
    const startTime = Date.now();
    
    const animate = () => {
      const elapsed = (Date.now() - startTime) / 1000;
      const progress = Math.min(elapsed / duration, 1);
      
      const weight = startWeight + (endWeight - startWeight) * this.easeOutCubic(progress);
      action.setEffectiveWeight(weight);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        action.stop();
      }
    };
    
    animate();
  }

  // Fade vers un poids spécifique
  fadeToWeight(action, targetWeight, duration) {
    if (!action || duration <= 0) {
      action.setEffectiveWeight(targetWeight);
      return;
    }
    
    const startWeight = action.getEffectiveWeight();
    const startTime = Date.now();
    
    const animate = () => {
      const elapsed = (Date.now() - startTime) / 1000;
      const progress = Math.min(elapsed / duration, 1);
      
      const weight = startWeight + (targetWeight - startWeight) * this.easeOutCubic(progress);
      action.setEffectiveWeight(weight);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        // Si fade vers 0, arrêter l'action
        if (targetWeight === 0) {
          action.stop();
        }
      }
    };
    
    animate();
  }

  // ✅ CORRIGÉ: Crossfade entre deux actions (NOM V4)
  crossFadeActions(fromAction, toAction, duration) {
    if (!fromAction || !toAction || duration <= 0) return;
    
    
    // Reset et démarrage action destination
    toAction.reset();
    toAction.play();
    toAction.setEffectiveWeight(0);
    
    // Crossfade simultané  
    this.fadeToWeight(fromAction, 0, duration);
    this.fadeInAction(toAction, duration);
    
    // Tracking de la transition
    this.activeTransitions.set(fromAction.getClip().name, {
      from: fromAction,
      to: toAction,
      startTime: Date.now(),
      duration: duration * 1000
    });
  }

  // ✅ TRANSITION POSE CORRECTE (permanent → 2 poses différentes)
  startPoseTransition() {
    if (this.controller.isTransitioning) {
      return false;
    }
    
    this.controller.isTransitioning = true;
    
    // ✅ RÉCUPÉRER LES 2 BRAS PERMANENTS
    const brasR1 = this.controller.permanentActions.get('Bras_R1_Mouv');
    const brasR2 = this.controller.permanentActions.get('Bras_R2_Mouv');
    
    // ✅ RÉCUPÉRER LES 2 POSES DIFFÉRENTES
    const poseR1R2 = this.controller.poseActions.get('R1&R2_Pose');
    const poseR2R1 = this.controller.poseActions.get('R2&R1_Pose');
    
    if (!brasR1 || !brasR2 || !poseR1R2 || !poseR2R1) {
      console.error("❌ Animations manquantes:", {
        brasR1: !!brasR1,
        brasR2: !!brasR2, 
        poseR1R2: !!poseR1R2,
        poseR2R1: !!poseR2R1
      });
      this.controller.isTransitioning = false;
      return false;
    }
    
    // ✅ SAUVEGARDER POIDS ACTUELS
    this.controller.currentPermanentWeights.set('Bras_R1_Mouv', brasR1.getEffectiveWeight());
    this.controller.currentPermanentWeights.set('Bras_R2_Mouv', brasR2.getEffectiveWeight());
    
    // ✅ CROSSFADES CORRECTS - 2 bras → 2 poses différentes (NOM CORRIGÉ)
    this.crossFadeActions(brasR1, poseR1R2, this.controller.fadeDuration);
    this.crossFadeActions(brasR2, poseR2R1, this.controller.fadeDuration);
    
    // ✅ DÉMARRER 7 ANIMATIONS RINGS SYNCHRONISÉES
    this.startRingAnimations();
    
    // ✅ SAUVEGARDER POSES ACTIVES
    this.controller.currentPoseActions = [poseR1R2, poseR2R1];
    
    return true;
  }

  // ✅ RETOUR PERMANENT CORRIGÉ (poses → permanents)
  startReturnToPermanent(finishedPoseAction, finishedAnimationName) {
    if (!this.controller.isTransitioning) return false;
    
    
    // ✅ IDENTIFIER ANIMATION PERMANENTE CORRESPONDANTE
    let targetPermanentAction = null;
    
    if (finishedAnimationName === 'R1&R2_Pose') {
      targetPermanentAction = this.controller.permanentActions.get('Bras_R1_Mouv');
    } else if (finishedAnimationName === 'R2&R1_Pose') {
      targetPermanentAction = this.controller.permanentActions.get('Bras_R2_Mouv');
    }
    
    if (!targetPermanentAction) {
      console.error(`❌ Animation permanente non trouvée pour: ${finishedAnimationName}`);
      return false;
    }
    
    // ✅ CROSSFADE FLUIDE pose → permanent (NOM CORRIGÉ)
    this.crossFadeActions(finishedPoseAction, targetPermanentAction, this.controller.fadeDuration);
    
    // ✅ RESTAURER POIDS ORIGINAL
    const savedWeight = this.controller.currentPermanentWeights.get(targetPermanentAction.getClip().name);
    if (savedWeight !== undefined) {
      setTimeout(() => {
        targetPermanentAction.setEffectiveWeight(savedWeight);
      }, this.controller.fadeDuration * 1000);
    }
    
    // ✅ VÉRIFIER SI TOUTES LES POSES SONT TERMINÉES
    const allPosesFinished = this.controller.currentPoseActions?.every(action => 
      !action.isRunning() || action === finishedPoseAction
    );
    
    if (allPosesFinished) {
      // ✅ NETTOYAGE COMPLET QUAND TOUTES POSES TERMINÉES
      this.controller.isTransitioning = false;
      this.controller.currentPoseActions = [];
      this.controller.currentPermanentWeights.clear();
      
      // Callback UI
      if (this.controller.onTransitionComplete) {
        this.controller.onTransitionComplete('permanent');
      }
      
    }
    
    return true;
  }

  // ✅ ANIMATIONS RINGS SYNCHRONISÉES (7 éléments)
  startRingAnimations() {
    const ringAnimations = Array.from(this.controller.ringActions.entries());
    
    if (ringAnimations.length === 0) {
      return false;
    }
    
    
    ringAnimations.forEach(([, action]) => {
      action.reset();
      action.play();
      action.setEffectiveWeight(1);
      action.setEffectiveTimeScale(this.controller.SYNC_TIMESCALE);
      
      const _effectiveDuration = action.getClip().duration / action.getEffectiveTimeScale();
    });
    
    return true;
  }

  // ✅ GESTION ÉVÉNEMENTS MIXER (RESTAURÉ DE V4)
  setupEventListeners() {
    this.controller.mixer.addEventListener('finished', (event) => {
      const finishedAction = event.action;
      const animationName = finishedAction.getClip().name;
      
      
      // ✅ RETOUR AUTOMATIQUE POUR POSES UNIQUEMENT
      if (this.controller.isPoseAnimation(animationName)) {
        this.startReturnToPermanent(finishedAction, animationName);
      }
      
      // Callback UI
      if (this.controller.onAnimationFinished) {
        this.controller.onAnimationFinished(animationName);
      }
      
      // Nettoyage transitions terminées
      this.cleanupFinishedTransitions();
    });
    
  }

  // ✅ Courbe d'animation smooth
  easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  // ✅ Nettoyage transitions
  cleanupFinishedTransitions() {
    const now = Date.now();
    
    this.activeTransitions.forEach((transition, name) => {
      if (now - transition.startTime > transition.duration) {
        this.activeTransitions.delete(name);
      }
    });
  }

  // ✅ État des transitions
  getTransitionState() {
    return {
      isTransitioning: this.controller.isTransitioning,
      activeTransitions: this.activeTransitions.size,
      currentPoses: this.controller.currentPoseActions?.map(action => action.getClip().name) || [],
      transitions: Array.from(this.activeTransitions.entries()).map(([name, data]) => ({
        name,
        from: data.from.getClip().name,
        to: data.to.getClip().name,
        elapsed: ((Date.now() - data.startTime) / 1000).toFixed(2) + 's',
        duration: (data.duration / 1000).toFixed(2) + 's'
      }))
    };
  }

  // Vérifier si une transition est en cours
  isTransitioning() {
    return this.isAnimating;
  }

  // Arrêter toutes les transitions
  stopAllTransitions() {
    this.isAnimating = false;
    this.activeTransitions.clear();
  }

  // 🗑️ Nettoyage
  dispose() {
    this.activeTransitions.clear();
    this.isAnimating = false;
  }
}