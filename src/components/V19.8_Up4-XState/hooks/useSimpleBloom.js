import { useRef, useCallback } from 'react';
import { SimpleBloomSystem } from '../systems/bloomEffects/SimpleBloomSystem.js';

/**
 * Hook simple pour gérer le système de bloom
 */
export const useSimpleBloom = () => {
  const bloomSystemRef = useRef(null);
  
  const initBloom = useCallback((scene, camera, renderer) => {
    try {
      if (bloomSystemRef.current) {
        bloomSystemRef.current.dispose();
      }
      
      bloomSystemRef.current = new SimpleBloomSystem(scene, camera, renderer);
      
      // ✅ CRUCIAL: Initialiser le composer et les passes
      const initSuccess = bloomSystemRef.current.init();
      if (!initSuccess) {
        console.error('❌ useSimpleBloom: Échec initialisation composer');
        return null;
      }
      
      
      return bloomSystemRef.current;
    } catch (error) {
      console.error('❌ useSimpleBloom: Erreur initialisation:', error);
      return null;
    }
  }, []);
  
  const updateBloom = useCallback((param, value) => {
    if (!bloomSystemRef.current) return;
    
    try {
      switch (param) {
        case 'threshold':
        case 'strength':
        case 'radius':
          // CORRECTION: Passer seulement (param, value) au lieu de 3 paramètres
          bloomSystemRef.current.updateBloom(param, value);
          break;
          
        case 'enabled':
          bloomSystemRef.current.setBloomEnabled(value);
          break;
          
        case 'preset':
          bloomSystemRef.current.applyPreset(value);
          break;
          
        default:
          console.warn(`⚠️ useSimpleBloom: Paramètre inconnu "${param}"`);
      }
    } catch (error) {
      console.error('❌ useSimpleBloom: Erreur mise à jour:', error);
    }
  }, []);
  
  const render = useCallback(() => {
    if (bloomSystemRef.current) {
      bloomSystemRef.current.render();
    }
  }, []);
  
  const handleResize = useCallback(() => {
    if (bloomSystemRef.current) {
      bloomSystemRef.current.handleResize();
    }
  }, []);
  
  const getStatus = useCallback(() => {
    return bloomSystemRef.current ? bloomSystemRef.current.getStatus() : null;
  }, []);
  
  const dispose = useCallback(() => {
    if (bloomSystemRef.current) {
      bloomSystemRef.current.dispose();
      bloomSystemRef.current = null;
    }
  }, []);
  
  // ✅ CORRECTION CONFLIT #1 : SUPPRIMÉ setExposure - useThreeScene est la seule source
  // Cette fonction n'est plus nécessaire car SimpleBloomSystem ne modifie plus l'exposure
  
  // ✅ NOUVEAU V8 : Fonction pour obtenir l'exposure
  const getExposure = useCallback(() => {
    if (!bloomSystemRef.current) return 1.0;
    return bloomSystemRef.current.getExposure();
  }, []);
  
  return {
    initBloom,
    updateBloom,
    render,
    handleResize,
    getStatus,
    dispose,
    // setExposure supprimé - useThreeScene est la seule source
    getExposure,  // ✅ Lecture seule depuis renderer
    bloomSystem: bloomSystemRef.current
  };
};