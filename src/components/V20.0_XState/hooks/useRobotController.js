// 🤖 Hook Robot V5 - NETTOYÉ pour bloom effects
import { useState, useRef, useCallback } from 'react';
import * as THREE from 'three';

export function useRobotController() {
  const [currentAnimation, setCurrentAnimation] = useState('Mouv');
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  const mixerRef = useRef(null);
  const actionsRef = useRef({});
  const onRingAnimationTrigger = useRef(null);

  // Retour vers Mouv
  const returnToMouv = useCallback(() => {
    if (!actionsRef.current.actionMouv || !actionsRef.current.actionPose) return;
    
    actionsRef.current.actionPose.crossFadeTo(actionsRef.current.actionMouv, 1.0, false);
    actionsRef.current.actionMouv.reset().play();
    
    setCurrentAnimation('Mouv');
    setIsTransitioning(false);
  }, []);

  const setupAnimations = useCallback((animations, mixer) => {
    mixerRef.current = mixer;
    
    const mouvClip = animations.find(clip => clip.name === 'Mouv');
    const poseClip = animations.find(clip => clip.name === 'Pose');

    if (mouvClip) {
      actionsRef.current.actionMouv = mixer.clipAction(mouvClip);
      actionsRef.current.actionMouv.setLoop(THREE.LoopRepeat);
    }

    if (poseClip) {
      actionsRef.current.actionPose = mixer.clipAction(poseClip);
      actionsRef.current.actionPose.setLoop(THREE.LoopOnce);
      actionsRef.current.actionPose.clampWhenFinished = true;
      
      // Événement fin d'animation Pose → retour Mouv
      actionsRef.current.actionPose.getMixer().addEventListener('finished', (e) => {
        if (e.action === actionsRef.current.actionPose) {
          returnToMouv();
        }
      });
    }

    // Démarrer animation permanente Mouv
    if (actionsRef.current.actionMouv) {
      actionsRef.current.actionMouv.play();
      setCurrentAnimation('Mouv');
    }
  }, [returnToMouv]);

  const triggerTransition = useCallback((targetAnimation) => {
    if (!actionsRef.current.actionMouv || !actionsRef.current.actionPose) return;
    if (isTransitioning) return;

    setIsTransitioning(true);

    if (targetAnimation === 'Pose' && currentAnimation === 'Mouv') {
      actionsRef.current.actionMouv.crossFadeTo(actionsRef.current.actionPose, 1.0, false);
      actionsRef.current.actionPose.reset().play();
      
      // Déclencher animations anneaux
      if (onRingAnimationTrigger.current) {
        onRingAnimationTrigger.current();
      }
      
      setCurrentAnimation('Pose');
      setTimeout(() => setIsTransitioning(false), 1000);
      
    } else if (targetAnimation === 'Mouv' && currentAnimation === 'Pose') {
      returnToMouv();
    }
  }, [currentAnimation, isTransitioning, returnToMouv]);

  return {
    setupAnimations,
    triggerTransition,
    currentAnimation,
    isTransitioning,
    onRingAnimationTrigger
  };
}