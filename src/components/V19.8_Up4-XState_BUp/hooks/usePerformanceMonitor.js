// 📊 Performance Monitor Hook V12.2 - Real-time MSAA performance tracking
import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * usePerformanceMonitor - Hook pour surveiller les performances en temps réel
 * Optimisé pour mesurer l'impact MSAA/FXAA sur les performances
 */
export function usePerformanceMonitor() {
  const [stats, setStats] = useState({
    fps: 0,
    averageFps: 0,
    frameTime: 0,
    averageFrameTime: 0,
    minFps: Infinity,
    maxFps: 0,
    gpuMemory: 0,
    samples: 0,
    isStable: true
  });

  // 🔧 Références pour calculs précis
  const lastTimeRef = useRef(performance.now());
  const frameCountRef = useRef(0);
  const frameTimesRef = useRef([]);
  const fpsHistoryRef = useRef([]);
  const animationIdRef = useRef();
  const startTimeRef = useRef(performance.now());

  // 📊 Configuration monitoring
  const SAMPLE_SIZE = 60; // Échantillons pour moyenne mobile
  const UPDATE_INTERVAL = 10; // Frames entre mises à jour

  // 🎯 Calculs de performance
  const updatePerformanceStats = useCallback(() => {
    const now = performance.now();
    const deltaTime = now - lastTimeRef.current;
    
    if (deltaTime > 0) {
      const currentFps = 1000 / deltaTime;
      const currentFrameTime = deltaTime;
      
      // Historique FPS
      fpsHistoryRef.current.push(currentFps);
      frameTimesRef.current.push(currentFrameTime);
      
      // Maintenir taille échantillon
      if (fpsHistoryRef.current.length > SAMPLE_SIZE) {
        fpsHistoryRef.current.shift();
        frameTimesRef.current.shift();
      }
      
      frameCountRef.current++;
      
      // Mise à jour stats toutes les N frames
      if (frameCountRef.current % UPDATE_INTERVAL === 0) {
        const avgFps = fpsHistoryRef.current.reduce((a, b) => a + b, 0) / fpsHistoryRef.current.length;
        const avgFrameTime = frameTimesRef.current.reduce((a, b) => a + b, 0) / frameTimesRef.current.length;
        const minFps = Math.min(...fpsHistoryRef.current);
        const maxFps = Math.max(...fpsHistoryRef.current);
        
        // Détection stabilité (variance FPS < 10%)
        const fpsVariance = fpsHistoryRef.current.reduce((sum, fps) => sum + Math.pow(fps - avgFps, 2), 0) / fpsHistoryRef.current.length;
        const fpsStdDev = Math.sqrt(fpsVariance);
        const isStable = (fpsStdDev / avgFps) < 0.1; // <10% variance = stable
        
        setStats(prev => ({
          ...prev,
          fps: Math.round(currentFps),
          averageFps: Math.round(avgFps),
          frameTime: Math.round(currentFrameTime * 100) / 100,
          averageFrameTime: Math.round(avgFrameTime * 100) / 100,
          minFps: Math.round(minFps),
          maxFps: Math.round(maxFps),
          isStable
        }));
      }
    }
    
    lastTimeRef.current = now;
  }, []);

  // 📊 Boucle de monitoring
  useEffect(() => {
    const monitor = () => {
      updatePerformanceStats();
      animationIdRef.current = requestAnimationFrame(monitor);
    };
    
    animationIdRef.current = requestAnimationFrame(monitor);
    
    return () => {
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
    };
  }, [updatePerformanceStats]);

  // 🎯 Mise à jour samples MSAA
  const updateSamples = useCallback((samples) => {
    setStats(prev => ({ ...prev, samples }));
  }, []);

  // 📊 Reset des statistiques
  const resetStats = useCallback(() => {
    fpsHistoryRef.current = [];
    frameTimesRef.current = [];
    frameCountRef.current = 0;
    startTimeRef.current = performance.now();
    setStats(prev => ({
      ...prev,
      minFps: Infinity,
      maxFps: 0,
      averageFps: 0,
      averageFrameTime: 0
    }));
  }, []);

  // 🎮 Évaluation impact performance
  const getPerformanceImpact = useCallback((newSamples, currentSamples = 1) => {
    // Estimation basée sur échantillons MSAA
    const impactMap = {
      1: 1.0,   // Baseline (no MSAA)
      2: 0.85,  // ~15% impact
      4: 0.70,  // ~30% impact  
      8: 0.55,  // ~45% impact
      16: 0.40  // ~60% impact
    };
    
    const currentImpact = impactMap[currentSamples] || 1.0;
    const newImpact = impactMap[newSamples] || 1.0;
    const relativeChange = (newImpact / currentImpact - 1) * 100;
    
    return {
      estimatedFpsChange: relativeChange,
      impactLevel: newSamples <= 4 ? 'low' : newSamples <= 8 ? 'medium' : 'high',
      recommendation: newSamples <= 4 ? 'Recommended for most systems' : 
                     newSamples <= 8 ? 'Good for high-end systems' : 
                     'Only for very powerful GPUs'
    };
  }, []);

  // 🔍 Détection problèmes performance
  const getPerformanceStatus = useCallback(() => {
    const { _fps, averageFps, _isStable } = stats;
    
    if (averageFps > 55) {
      return { status: 'excellent', color: '#4CAF50', message: 'Performance excellente' };
    } else if (averageFps > 40) {
      return { status: 'good', color: '#FF9800', message: 'Performance correcte' };
    } else if (averageFps > 25) {
      return { status: 'poor', color: '#FF5722', message: 'Performance faible' };
    } else {
      return { status: 'critical', color: '#f44336', message: 'Performance critique' };
    }
  }, [stats]);

  return {
    stats,
    updateSamples,
    resetStats,
    getPerformanceImpact,
    getPerformanceStatus
  };
}