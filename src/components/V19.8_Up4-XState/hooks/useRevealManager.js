// 🌟 Hook Révélation V5 - NETTOYÉ pour bloom effects
import { useState, useCallback, useRef } from 'react';
import * as THREE from 'three';
import { RING_MATERIALS, getMaterialType } from '../utils/materials.js';

export function useRevealManager() {
  const [magicRingsInfo, setMagicRingsInfo] = useState([]);
  const [isAnimating, setIsAnimating] = useState(false);
  const lastUpdateRef = useRef(0);

  const createRevealManager = useCallback((magicRings, forceShowRings) => {
    const tempVec = new THREE.Vector3();
    
    return {
      updateRevealedRings: (triggerPosition, triggerRadius, triggerHeight) => {
        const currentTime = Date.now();
        if (currentTime - lastUpdateRef.current < 16) return;
        lastUpdateRef.current = currentTime;

        const updatedRings = magicRings.map(ring => {
          ring.getWorldPosition(tempVec);
          const distance = tempVec.distanceTo(triggerPosition);
          const isInZone = distance <= triggerRadius && 
                          Math.abs(tempVec.y - triggerPosition.y) <= triggerHeight;
          
          const shouldShow = forceShowRings || isInZone;
          ring.visible = shouldShow;
          
          if (shouldShow) {
            const materialType = getMaterialType(ring.material);
            ring.material = RING_MATERIALS[materialType] || RING_MATERIALS.default;
          }
          
          return {
            name: ring.name,
            position: { x: tempVec.x, y: tempVec.y, z: tempVec.z },
            visible: shouldShow,
            distance: distance.toFixed(2)
          };
        });
        
        setMagicRingsInfo(updatedRings);
      },

      // Animation anneaux simplifiée
      animateRings: (animations, mixer) => {
        setIsAnimating(true);

        const ringAnimationNames = [
          'Ring_Master',
          'BloomArea2Action',
          'BloomArea3Action',
          'BloomArea4Action',
          'BloomArea5Action',
          'Ring_ExtAction',
          'Ring_IntAction'
        ];

        // Jouer animations silencieusement
        ringAnimationNames.forEach(animName => {
          const clip = animations.find(clip => clip.name === animName);
          if (clip) {
            try {
              const action = mixer.clipAction(clip);
              action.reset();
              action.setLoop(THREE.LoopOnce);
              action.clampWhenFinished = true;
              action.play();
            } catch {
              // Silent error handling
            }
          }
        });

        // Arrêter après durée
        setTimeout(() => {
          setIsAnimating(false);
        }, 3000);
      }
    };
  }, []);

  return {
    createRevealManager,
    magicRingsInfo,
    isAnimating
  };
}