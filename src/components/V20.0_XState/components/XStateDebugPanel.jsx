import React from 'react';
import { useSceneMachine } from '../stores/xstate/hooks/useSceneMachine.js';

/**
 * 🎛️ XSTATE DEBUG PANEL V20.0 - SIMPLIFIÉ
 * 1 couleur globale → 3 intensités → 3 bloom globaux
 * Interface minimaliste et claire
 */
const XStateDebugPanel = () => {
  const {
    // État système
    isReady,
    isAnimationInProgress,
    
    // État couleur
    globalColor,
    intensities,
    bloomGlobal,
    
    // Actions couleur
    setGlobalColor,
    setIntensity,
    
    // Actions bloom
    setBloomParam,
    toggleBloom,
    
    // Actions animations
    triggerAnimation,
    
    // Actions utilitaires
    undo,
    redo,
    resetToDefaults,
    stats
  } = useSceneMachine();

  // Styles
  const panelStyle = {
    position: 'fixed',
    top: '10px',
    right: '10px',
    width: '350px',
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    color: 'white',
    padding: '15px',
    borderRadius: '8px',
    fontFamily: 'monospace',
    fontSize: '12px',
    border: `2px solid ${isReady ? '#00ff88' : '#ff4444'}`,
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)'
  };

  const sectionStyle = {
    marginBottom: '15px',
    paddingBottom: '10px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.2)'
  };

  const titleStyle = {
    fontWeight: 'bold',
    marginBottom: '8px',
    fontSize: '13px'
  };

  const rowStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '8px'
  };

  const labelStyle = {
    minWidth: '80px',
    fontSize: '11px'
  };

  const valueStyle = {
    minWidth: '35px',
    fontSize: '10px',
    opacity: 0.7
  };

  const buttonStyle = {
    margin: '2px',
    padding: '4px 8px',
    fontSize: '10px',
    cursor: 'pointer',
    border: 'none',
    borderRadius: '3px'
  };

  if (!isReady) {
    return (
      <div style={panelStyle}>
        <div style={{ color: '#ff4444', textAlign: 'center' }}>
          <strong>🔄 Initializing...</strong>
        </div>
      </div>
    );
  }

  return (
    <div style={panelStyle}>
      {/* === HEADER === */}
      <div style={sectionStyle}>
        <div style={{ ...titleStyle, color: '#00ff88' }}>
          🚀 XState V20.0 Debug Panel
        </div>
        <div style={{ fontSize: '10px', opacity: 0.7 }}>
          Animation: {isAnimationInProgress ? '🎭 RUNNING' : '⏸️ IDLE'} | 
          Bloom: {bloomGlobal.enabled ? '✓ ON' : '✗ OFF'}
        </div>
      </div>

      {/* === COULEUR GLOBALE === */}
      <div style={sectionStyle}>
        <div style={titleStyle}>🎨 Global Color</div>
        <div style={rowStyle}>
          <input
            type="color"
            value={globalColor}
            style={{ width: '50px', height: '30px', cursor: 'pointer' }}
            onChange={(e) => setGlobalColor(e.target.value)}
            disabled={isAnimationInProgress}
          />
          <span style={{ fontSize: '11px' }}>{globalColor}</span>
        </div>
      </div>

      {/* === INTENSITÉS === */}
      <div style={sectionStyle}>
        <div style={titleStyle}>💡 Intensities</div>
        
        {/* Iris */}
        <div style={rowStyle}>
          <label style={labelStyle}>Iris:</label>
          <input
            type="range"
            min="0"
            max="2"
            step="0.01"
            value={intensities.iris}
            style={{ flex: 1 }}
            onChange={(e) => setIntensity('iris', parseFloat(e.target.value))}
            disabled={isAnimationInProgress}
          />
          <span style={valueStyle}>{intensities.iris.toFixed(2)}</span>
        </div>
        
        {/* Eye Rings */}
        <div style={rowStyle}>
          <label style={labelStyle}>Eye Rings:</label>
          <input
            type="range"
            min="0"
            max="2"
            step="0.01"
            value={intensities.eyeRings}
            style={{ flex: 1 }}
            onChange={(e) => setIntensity('eyeRings', parseFloat(e.target.value))}
            disabled={isAnimationInProgress}
          />
          <span style={valueStyle}>{intensities.eyeRings.toFixed(2)}</span>
        </div>
        
        {/* Reveal */}
        <div style={rowStyle}>
          <label style={labelStyle}>Reveal:</label>
          <input
            type="range"
            min="0"
            max="2"
            step="0.01"
            value={intensities.reveal}
            style={{ flex: 1 }}
            onChange={(e) => setIntensity('reveal', parseFloat(e.target.value))}
            disabled={isAnimationInProgress}
          />
          <span style={valueStyle}>{intensities.reveal.toFixed(2)}</span>
        </div>
      </div>

      {/* === BLOOM GLOBAL === */}
      <div style={sectionStyle}>
        <div style={{ ...titleStyle, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>🌟 Global Bloom</span>
          <button
            style={{
              ...buttonStyle,
              backgroundColor: bloomGlobal.enabled ? '#00ff88' : '#666666',
              color: bloomGlobal.enabled ? 'black' : 'white',
              fontSize: '9px',
              padding: '2px 6px'
            }}
            onClick={toggleBloom}
          >
            {bloomGlobal.enabled ? 'ON' : 'OFF'}
          </button>
        </div>
        
        {/* Threshold */}
        <div style={rowStyle}>
          <label style={labelStyle}>Threshold:</label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={bloomGlobal.threshold}
            style={{ flex: 1 }}
            onChange={(e) => setBloomParam('threshold', parseFloat(e.target.value))}
            disabled={!bloomGlobal.enabled}
          />
          <span style={valueStyle}>{bloomGlobal.threshold.toFixed(2)}</span>
        </div>
        
        {/* Strength */}
        <div style={rowStyle}>
          <label style={labelStyle}>Strength:</label>
          <input
            type="range"
            min="0"
            max="3"
            step="0.01"
            value={bloomGlobal.strength}
            style={{ flex: 1 }}
            onChange={(e) => setBloomParam('strength', parseFloat(e.target.value))}
            disabled={!bloomGlobal.enabled}
          />
          <span style={valueStyle}>{bloomGlobal.strength.toFixed(2)}</span>
        </div>
        
        {/* Radius */}
        <div style={rowStyle}>
          <label style={labelStyle}>Radius:</label>
          <input
            type="range"
            min="0"
            max="2"
            step="0.01"
            value={bloomGlobal.radius}
            style={{ flex: 1 }}
            onChange={(e) => setBloomParam('radius', parseFloat(e.target.value))}
            disabled={!bloomGlobal.enabled}
          />
          <span style={valueStyle}>{bloomGlobal.radius.toFixed(2)}</span>
        </div>
      </div>

      {/* === ACTIONS === */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px' }}>
        <button
          style={{ ...buttonStyle, backgroundColor: '#0088ff', color: 'white' }}
          onClick={() => triggerAnimation('bigArms')}
          disabled={isAnimationInProgress}
        >
          🦾 Big Arms
        </button>
        <button
          style={{ ...buttonStyle, backgroundColor: '#4488ff', color: 'white' }}
          onClick={() => triggerAnimation('littleArms')}
          disabled={isAnimationInProgress}
        >
          🤏 Little Arms
        </button>
        <button
          style={{ ...buttonStyle, backgroundColor: '#8844ff', color: 'white' }}
          onClick={() => triggerAnimation('rings')}
          disabled={isAnimationInProgress}
        >
          🔮 Rings
        </button>
        
        <div style={{ width: '100%', height: '5px' }} />
        
        <button
          style={{ ...buttonStyle, backgroundColor: '#666666', color: 'white' }}
          onClick={undo}
          disabled={!stats.canUndo}
        >
          ↶ Undo
        </button>
        <button
          style={{ ...buttonStyle, backgroundColor: '#666666', color: 'white' }}
          onClick={redo}
          disabled={!stats.canRedo}
        >
          ↷ Redo
        </button>
        <button
          style={{ ...buttonStyle, backgroundColor: '#ff4444', color: 'white' }}
          onClick={resetToDefaults}
        >
          ⟲ Reset
        </button>
      </div>
    </div>
  );
};

export default XStateDebugPanel;