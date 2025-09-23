// 🎯 Hook contrôles V5 - NETTOYÉ pour bloom effects
import { useState, useRef, useCallback, useEffect } from 'react';
import { V3_CONFIG } from '../utils/config.js';

export function useTriggerControls() {
  const [zoneParams, setZoneParams] = useState(V3_CONFIG.revelation);
  const [isEnabled, setIsEnabled] = useState(true);
  
  const keyStateRef = useRef({
    z: false, s: false, q: false, d: false,
    a: false, e: false, r: false, f: false,
    shift: false
  });

  const handleKeyDown = useCallback((event) => {
    if (!isEnabled) return;
    
    const key = event.key.toLowerCase();
    if (key in keyStateRef.current) {
      keyStateRef.current[key] = true;
      event.preventDefault();
    }
  }, [isEnabled]);

  const handleKeyUp = useCallback((event) => {
    if (!isEnabled) return;
    
    const key = event.key.toLowerCase();
    if (key in keyStateRef.current) {
      keyStateRef.current[key] = false;
      event.preventDefault();
    }
  }, [isEnabled]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp]);

  const updateZone = useCallback(() => {
    if (!isEnabled) return;

    const speed = keyStateRef.current.shift ? V3_CONFIG.controls.moveSpeed.fast : V3_CONFIG.controls.moveSpeed.normal;
    let hasChanged = false;

    setZoneParams(prev => {
      let newParams = { ...prev };

      // Déplacements ZQSD
      if (keyStateRef.current.z) { newParams.centerZ -= speed; hasChanged = true; }
      if (keyStateRef.current.s) { newParams.centerZ += speed; hasChanged = true; }
      if (keyStateRef.current.q) { newParams.centerX -= speed; hasChanged = true; }
      if (keyStateRef.current.d) { newParams.centerX += speed; hasChanged = true; }
      
      // Haut/Bas AE
      if (keyStateRef.current.a) { newParams.centerY += speed; hasChanged = true; }
      if (keyStateRef.current.e) { newParams.centerY -= speed; hasChanged = true; }
      
      // Taille RF
      if (keyStateRef.current.r && newParams.radius < V3_CONFIG.controls.limits.maxSize) {
        newParams.radius = Math.min(newParams.radius + V3_CONFIG.controls.sizeSpeed, V3_CONFIG.controls.limits.maxSize);
        hasChanged = true;
      }
      if (keyStateRef.current.f && newParams.radius > V3_CONFIG.controls.limits.minSize) {
        newParams.radius = Math.max(newParams.radius - V3_CONFIG.controls.sizeSpeed, V3_CONFIG.controls.limits.minSize);
        hasChanged = true;
      }

      return hasChanged ? newParams : prev;
    });
  }, [isEnabled]);

  return {
    zoneParams,
    setZoneParams,
    updateZone,
    setIsEnabled
  };
}