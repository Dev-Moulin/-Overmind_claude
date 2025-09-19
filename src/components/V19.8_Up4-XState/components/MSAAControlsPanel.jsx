// 🎯 MSAA Controls Panel V12.2 - Anti-Aliasing Testing Interface
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { MSAATestPatterns } from '../utils/MSAATestPatterns.js';

/**
 * MSAAControlsPanel - Interface pour tester et comparer l'efficacité MSAA vs TAA
 * Permet de contrôler en temps réel tous les paramètres anti-aliasing
 */
const MSAAControlsPanel = ({ 
  bloomSystem = null,
  renderer = null,
  onSettingsChange = null,
  onPerformanceUpdate = null
}) => {
  // 🎛️ État des paramètres MSAA (OFF par défaut)
  const [msaaSettings, setMsaaSettings] = useState({
    enabled: false,
    samples: 1,
    hardware: false,
    fxaaEnabled: false,
    showComparison: false,
    testPattern: 'default'
  });

  // 📊 État de performance
  const [_performanceStats, setPerformanceStats] = useState({
    fps: 0,
    frameTime: 0,
    gpuMemory: 0,
    samples: 0
  });

  // 🔧 Références pour monitoring
  const fpsCounterRef = useRef();
  const lastFrameTimeRef = useRef(performance.now());
  const frameCountRef = useRef(0);
  
  // 🎯 Test patterns
  const testPatternsRef = useRef(null);

  // 🎯 GPU Capabilities
  const [gpuCapabilities, setGpuCapabilities] = useState({
    maxSamples: 4,
    supportsHardwareMSAA: true,
    webglVersion: '1.0'
  });

  // ✅ Détection des capacités GPU
  useEffect(() => {
    if (renderer) {
      const gl = renderer.getContext();
      const capabilities = renderer.capabilities;
      
      setGpuCapabilities({
        maxSamples: capabilities?.maxSamples || gl?.getParameter?.(gl.MAX_SAMPLES) || 4,
        supportsHardwareMSAA: !!renderer.antialias,
        webglVersion: capabilities?.isWebGL2 ? '2.0' : '1.0'
      });
      
    }
  }, [renderer]);

  // 📊 Monitoring FPS en temps réel
  useEffect(() => {
    const updateFPS = () => {
      const now = performance.now();
      const delta = now - lastFrameTimeRef.current;
      frameCountRef.current++;
      
      if (frameCountRef.current >= 10) {
        const fps = Math.round(1000 / (delta / frameCountRef.current));
        const stats = {
          fps,
          frameTime: delta / frameCountRef.current,
          samples: msaaSettings.samples
        };
        setPerformanceStats(stats);
        
        // Envoyer les stats au parent
        if (onPerformanceUpdate) {
          onPerformanceUpdate(stats);
        }
        frameCountRef.current = 0;
      }
      
      lastFrameTimeRef.current = now;
      fpsCounterRef.current = requestAnimationFrame(updateFPS);
    };

    fpsCounterRef.current = requestAnimationFrame(updateFPS);
    
    return () => {
      if (fpsCounterRef.current) {
        cancelAnimationFrame(fpsCounterRef.current);
      }
    };
  }, [msaaSettings.samples, onPerformanceUpdate]);

  // 🎛️ Handler pour changement MSAA samples
  const handleSamplesChange = useCallback((samples) => {
    const clampedSamples = Math.min(samples, gpuCapabilities.maxSamples);
    
    setMsaaSettings(prev => ({ ...prev, samples: clampedSamples }));
    
    // Appliquer au bloom system
    if (bloomSystem && bloomSystem.updateMSAASamples) {
      bloomSystem.updateMSAASamples(clampedSamples);
    }
    
    // Notifier parent
    onSettingsChange?.('msaa_samples', clampedSamples);
    
  }, [bloomSystem, gpuCapabilities.maxSamples, onSettingsChange]);

  // 🔧 Handler pour toggle MSAA
  const handleMSAAToggle = useCallback((enabled) => {
    setMsaaSettings(prev => ({ ...prev, enabled }));
    
    if (bloomSystem && bloomSystem.setMSAAEnabled) {
      bloomSystem.setMSAAEnabled(enabled);
    }
    
    onSettingsChange?.('msaa_enabled', enabled);
  }, [bloomSystem, onSettingsChange]);

  // 🎨 Handler pour toggle FXAA
  const handleFXAAToggle = useCallback((enabled) => {
    setMsaaSettings(prev => ({ ...prev, fxaaEnabled: enabled }));
    
    if (bloomSystem && bloomSystem.setFXAAEnabled) {
      bloomSystem.setFXAAEnabled(enabled);
    }
    
    onSettingsChange?.('fxaa_enabled', enabled);
  }, [bloomSystem, onSettingsChange]);

  // 🎯 Handler pour toggle test patterns
  const _handleTestPatternsToggle = useCallback((enabled) => {
    setMsaaSettings(prev => ({ ...prev, testPattern: enabled ? 'geometric' : 'default' }));
    
    if (enabled && !testPatternsRef.current && window.scene) {
      // Créer les patterns de test
      testPatternsRef.current = new MSAATestPatterns();
      testPatternsRef.current.createGeometricPatterns(window.scene);
      testPatternsRef.current.createTextPatterns(window.scene);
      testPatternsRef.current.setVisible(true);
    } else if (testPatternsRef.current) {
      testPatternsRef.current.setVisible(enabled);
    }
    
  }, []);

  // 🧹 Cleanup test patterns
  useEffect(() => {
    return () => {
      if (testPatternsRef.current) {
        testPatternsRef.current.dispose();
        testPatternsRef.current = null;
      }
    };
  }, []);

  // 🎯 Handler pour presets qualité
  const _handleQualityPreset = useCallback((quality) => {
    const qualityMap = {
      'mobile': 2,
      'low': 2,
      'medium': 4,
      'high': 8,
      'ultra': 16
    };
    
    const samples = qualityMap[quality];
    if (samples) {
      handleSamplesChange(samples);
      
      // Adapter FXAA selon qualité
      const fxaaEnabled = quality === 'mobile' || quality === 'low';
      handleFXAAToggle(fxaaEnabled);
    }
  }, [handleSamplesChange, handleFXAAToggle]);

  // 🔄 Reset aux paramètres par défaut
  const _handleReset = useCallback(() => {
    handleSamplesChange(4);
    handleMSAAToggle(true);
    handleFXAAToggle(true);
    setMsaaSettings(prev => ({ 
      ...prev, 
      showComparison: false, 
      testPattern: 'default' 
    }));
  }, [handleSamplesChange, handleMSAAToggle, handleFXAAToggle]);

  return (
    <div style={{
      background: 'rgba(0, 0, 0, 0.9)',
      borderRadius: '8px',
      padding: '16px',
      color: 'white',
      fontFamily: "'Courier New', monospace",
      border: '2px solid #ff6b6b'
    }}>
      {/* 🎯 Header simple */}
      <div style={{
        marginBottom: '16px',
        borderBottom: '1px solid #555',
        paddingBottom: '8px'
      }}>
        <h3 style={{
          margin: 0,
          fontSize: '16px',
          color: '#ff6b6b'
        }}>
          🎯 MSAA Anti-Aliasing Controls
        </h3>
      </div>


      {/* 🎛️ Contrôles principaux MSAA */}
      <div style={{ marginBottom: '16px' }}>
        <h4 style={{ margin: '0 0 12px 0', color: '#ff6b6b', fontSize: '14px' }}>
          🎛️ MSAA Configuration
        </h4>
        
        {/* Toggle MSAA */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '12px',
          padding: '8px',
          background: 'rgba(255, 107, 107, 0.1)',
          borderRadius: '4px'
        }}>
          <label style={{ fontSize: '12px', fontWeight: 'bold' }}>
            🎯 Hardware MSAA
          </label>
          <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={msaaSettings.enabled}
              onChange={(e) => handleMSAAToggle(e.target.checked)}
              style={{ display: 'none' }}
            />
            <span style={{
              width: '40px',
              height: '20px',
              background: msaaSettings.enabled ? '#4CAF50' : '#333',
              borderRadius: '10px',
              marginRight: '8px',
              position: 'relative',
              transition: 'background 0.3s'
            }}>
              <span style={{
                position: 'absolute',
                width: '16px',
                height: '16px',
                background: 'white',
                borderRadius: '50%',
                top: '2px',
                left: msaaSettings.enabled ? '22px' : '2px',
                transition: 'left 0.3s'
              }} />
            </span>
            {msaaSettings.enabled ? 'ON' : 'OFF'}
          </label>
        </div>

        {/* Sample Count Selection */}
        <div style={{ marginBottom: '12px' }}>
          <label style={{ 
            fontSize: '11px', 
            color: '#ccc', 
            display: 'block', 
            marginBottom: '8px',
            fontWeight: 'bold'
          }}>
            🎯 Sample Count: {msaaSettings.samples}x (Max: {gpuCapabilities.maxSamples}x)
          </label>
          
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(4, 1fr)', 
            gap: '4px',
            marginBottom: '8px'
          }}>
            {[2, 4, 8, 16].map(samples => (
              <button
                key={samples}
                onClick={() => handleSamplesChange(samples)}
                disabled={samples > gpuCapabilities.maxSamples}
                style={{
                  padding: '6px 4px',
                  background: msaaSettings.samples === samples ? '#ff6b6b' : '#333',
                  color: samples > gpuCapabilities.maxSamples ? '#666' : 'white',
                  border: '1px solid #555',
                  borderRadius: '3px',
                  fontSize: '10px',
                  cursor: samples > gpuCapabilities.maxSamples ? 'not-allowed' : 'pointer',
                  fontWeight: 'bold',
                  opacity: samples > gpuCapabilities.maxSamples ? 0.5 : 1
                }}
                title={samples > gpuCapabilities.maxSamples ? 'Non supporté par GPU' : `${samples}x MSAA`}
              >
                {samples}x
              </button>
            ))}
          </div>
          
          {/* Slider précis */}
          <input
            type="range"
            min="1"
            max={gpuCapabilities.maxSamples}
            step="1"
            value={msaaSettings.samples}
            onChange={(e) => handleSamplesChange(parseInt(e.target.value))}
            style={{
              width: '100%',
              height: '4px',
              background: '#333',
              borderRadius: '2px',
              outline: 'none',
              WebkitAppearance: 'none',
              appearance: 'none'
            }}
          />
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            fontSize: '8px', 
            color: '#666',
            marginTop: '4px'
          }}>
            <span>1x (Off)</span>
            <span>4x (Balanced)</span>
            <span>{gpuCapabilities.maxSamples}x (Max)</span>
          </div>
        </div>
      </div>

      {/* 🎨 Contrôles FXAA complémentaire */}
      <div style={{ marginBottom: '16px' }}>
        <h4 style={{ margin: '0 0 12px 0', color: '#4CAF50', fontSize: '14px' }}>
          🎨 FXAA Post-Processing
        </h4>
        
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '8px',
          padding: '8px',
          background: 'rgba(76, 175, 80, 0.1)',
          borderRadius: '4px'
        }}>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 'bold', display: 'block' }}>
              🎨 FXAA (Texture Anti-Aliasing)
            </label>
            <div style={{ fontSize: '9px', color: '#aaa' }}>
              Complète MSAA pour textures et shaders
            </div>
          </div>
          <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={msaaSettings.fxaaEnabled}
              onChange={(e) => handleFXAAToggle(e.target.checked)}
              style={{ display: 'none' }}
            />
            <span style={{
              width: '40px',
              height: '20px',
              background: msaaSettings.fxaaEnabled ? '#4CAF50' : '#333',
              borderRadius: '10px',
              marginRight: '8px',
              position: 'relative',
              transition: 'background 0.3s'
            }}>
              <span style={{
                position: 'absolute',
                width: '16px',
                height: '16px',
                background: 'white',
                borderRadius: '50%',
                top: '2px',
                left: msaaSettings.fxaaEnabled ? '22px' : '2px',
                transition: 'left 0.3s'
              }} />
            </span>
            {msaaSettings.fxaaEnabled ? 'ON' : 'OFF'}
          </label>
        </div>
      </div>



      {/* ℹ️ Informations GPU */}
      <div style={{
        padding: '8px',
        background: 'rgba(33, 150, 243, 0.1)',
        border: '1px solid rgba(33, 150, 243, 0.3)',
        borderRadius: '4px',
        fontSize: '9px',
        color: '#2196F3'
      }}>
        <div style={{ marginBottom: '4px' }}>
          <strong>🖥️ GPU Info:</strong>
        </div>
        <div>WebGL: {gpuCapabilities.webglVersion} | Max MSAA: {gpuCapabilities.maxSamples}x</div>
        <div>Hardware MSAA: {gpuCapabilities.supportsHardwareMSAA ? '✅ Supporté' : '❌ Non supporté'}</div>
        <div style={{ marginTop: '6px', fontSize: '8px', color: '#666' }}>
          <strong>💡 Tip:</strong> MSAA améliore les bords géométriques. FXAA améliore les textures.
        </div>
      </div>

    </div>
  );
};

export default MSAAControlsPanel;