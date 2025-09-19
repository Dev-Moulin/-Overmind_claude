/**
 * 🎛️ DebugPanel V2 - Phase 2 Complete
 * DebugPanel complètement migré vers Zustand (0 useState, 0 props drilling)
 */

import React from 'react';
import { useDebugPanelControls } from '../stores/hooks/useDebugPanelControls.js';
import { usePresetsControls } from '../stores/hooks/usePresetsControls.js';

// Import des presets (à adapter selon structure actuelle)
const PRESET_REGISTRY = {
  'blanc_dark': {
    name: 'blanc_dark',
    description: 'Mode Blanc (Normal) - Thème sombre',
    bloom: {
      enabled: true,
      threshold: 0,
      strength: 0.17,
      radius: 0.4,
      groups: {
        iris: { threshold: 0.3, strength: 0.8, radius: 0.4, emissiveIntensity: 1.4 },
        eyeRings: { threshold: 0.4, strength: 0.6, radius: 0.3, emissiveIntensity: 1.8 },
        revealRings: { threshold: 0.43, strength: 0.4, radius: 0.36, emissiveIntensity: 0.7 }
      }
    },
    lighting: {
      exposure: 1.7,
      ambient: { color: 0x404040, intensity: 3.5 },
      directional: { color: 0xffffff, intensity: 5.0 }
    },
    pbr: {
      currentPreset: 'studioProPlus',
      ambientMultiplier: 1.0,
      directionalMultiplier: 1.0
    },
    background: {
      type: 'color',
      color: '#1a1a1a'
    }
  }
};

/**
 * DebugPanel V2 - 100% Zustand, 0 useState, Props quasi-supprimées
 */
const DebugPanelV2 = ({
  // ✅ SEULEMENT 2 props conservées (vs 15+ avant Phase 2)
  className = '',
  style = {}
}) => {
  // === REMPLACEMENT DE TOUS LES useState PAR ZUSTAND ===
  
  // AVANT Phase 2 (10+ useState):
  // const [activeTab, setActiveTab] = useState('groups');
  // const [exposure, setExposureState] = useState(1.7);
  // const [globalThreshold, setGlobalThreshold] = useState(0.15);
  // const [pbrSettings, setPbrSettings] = useState({...});
  // const [backgroundSettings, setBackgroundSettings] = useState({...});
  // const [perfMonitorStats, setPerfMonitorStats] = useState({...});
  // const [hdrBoostSettings, setHdrBoostSettings] = useState({...});
  // const [materialSettings, setMaterialSettings] = useState({...});
  // etc.
  
  // APRÈS Phase 2 (1 hook Zustand):
  const {
    // UI State
    activeTab, setActiveTab,
    showDebug, toggleDebugVisibility,
    isCollapsed, toggleCollapsed,
    
    // Bloom Controls
    bloom, setBloomEnabled, setBloomGlobal, setBloomGroup, resetBloom,
    threshold, strength, radius, bloomEnabled,
    irisGroup, eyeRingsGroup, revealRingsGroup,
    
    // PBR Controls
    pbr, setPbrPreset, setPbrMultiplier, setMaterialSetting, setHdrBoost, resetPbr,
    pbrPreset, ambientMultiplier, directionalMultiplier, hdrBoostEnabled, hdrMultiplier,
    metalness, roughness,
    
    // Lighting Controls
    lighting, setExposure, setAmbientLight, setDirectionalLight, resetLighting,
    exposure, ambientIntensity, directionalIntensity, toneMapping,
    
    // Background Controls
    background, setBackgroundType, setBackgroundColor, resetBackground,
    backgroundType, backgroundColor,
    
    // Security
    securityState, setSecurityState, isTransitioning,
    
    // Performance
    performanceStats, updatePerformanceStats,
    
    // Global Actions
    resetAll, exportState, createDebugSnapshot,
    
    // Meta
    currentPreset, version, migrationPhase
  } = useDebugPanelControls();
  
  const {
    applyPreset, validatePreset, createCustomPreset,
    isModifiedSincePreset, getPresetHistory
  } = usePresetsControls();
  
  // === HANDLERS SIMPLIFIÉS (plus de logique useState complexe) ===
  
  const handlePresetSelect = (presetKey) => {
    const preset = PRESET_REGISTRY[presetKey];
    if (preset) {
      console.log(`🎯 Applying preset: ${presetKey}`);
      applyPreset(presetKey, preset);
    } else {
      console.warn(`❌ Preset not found: ${presetKey}`);
    }
  };
  
  const handleThresholdChange = (value) => {
    setBloomGlobal('threshold', parseFloat(value));
  };
  
  const handleStrengthChange = (value) => {
    setBloomGlobal('strength', parseFloat(value));
  };
  
  const handleExposureChange = (value) => {
    setExposure(parseFloat(value));
  };
  
  const handleSecurityModeChange = (mode) => {
    console.log(`🔒 Changing security mode: ${mode}`);
    setSecurityState(mode);
  };
  
  const handleExportState = () => {
    const state = exportState();
    console.log('📋 Exported state:', state);
    
    // Copy to clipboard if available
    if (navigator.clipboard) {
      navigator.clipboard.writeText(JSON.stringify(state, null, 2))
        .then(() => console.log('✅ State copied to clipboard'))
        .catch(err => console.warn('❌ Failed to copy to clipboard:', err));
    }
  };
  
  const handleCreateSnapshot = () => {
    const snapshot = createDebugSnapshot();
    console.log('📸 Debug snapshot:', snapshot);
    return snapshot;
  };
  
  // Conditions d'affichage
  if (!showDebug) return null;
  
  const isModified = isModifiedSincePreset();
  
  return (
    <div 
      className={`debug-panel-v2 ${className}`}
      style={{
        position: 'absolute',
        top: '10px',
        right: '10px',
        width: isCollapsed ? '250px' : '380px',
        maxWidth: '90vw',
        background: 'rgba(0, 0, 0, 0.95)',
        color: 'white',
        padding: isCollapsed ? '10px' : '20px',
        borderRadius: '12px',
        fontSize: '12px',
        maxHeight: '90vh',
        overflowY: 'auto',
        zIndex: 1000,
        border: '1px solid #333',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.6)',
        fontFamily: 'monospace',
        transition: 'all 0.3s ease',
        ...style // Apply custom styles
      }}
    >
      {/* ===== HEADER AVEC CONTROLS ===== */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: isCollapsed ? '0' : '15px',
        borderBottom: isCollapsed ? 'none' : '1px solid #333',
        paddingBottom: isCollapsed ? '0' : '10px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <h3 style={{ 
            margin: 0, 
            color: '#4CAF50',
            fontSize: '14px',
            fontWeight: 'bold'
          }}>
            🎛️ Debug Panel V2
          </h3>
          <div style={{ 
            fontSize: '9px', 
            color: '#888',
            background: '#2a2a2a',
            padding: '2px 6px',
            borderRadius: '4px'
          }}>
            Phase {migrationPhase} • v{version}
          </div>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          {/* Preset Status */}
          <div style={{ 
            fontSize: '10px', 
            color: isModified ? '#FF9800' : '#4CAF50',
            background: isModified ? 'rgba(255, 152, 0, 0.1)' : 'rgba(76, 175, 80, 0.1)',
            padding: '3px 8px',
            borderRadius: '12px',
            border: `1px solid ${isModified ? '#FF9800' : '#4CAF50'}`
          }}>
            {currentPreset ? (
              `${currentPreset}${isModified ? ' •' : ''}`
            ) : 'No Preset'}
          </div>
          
          {/* Toggle Collapse */}
          <button
            onClick={toggleCollapsed}
            style={{
              background: 'none',
              border: '1px solid #555',
              color: '#ccc',
              padding: '4px 8px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '10px'
            }}
          >
            {isCollapsed ? '📖' : '📕'}
          </button>
          
          {/* Close Button */}
          <button
            onClick={toggleDebugVisibility}
            style={{
              background: 'none',
              border: '1px solid #f44336',
              color: '#f44336',
              padding: '4px 8px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '10px'
            }}
          >
            ✕
          </button>
        </div>
      </div>
      
      {/* ===== CONTENU COLLAPSED ===== */}
      {isCollapsed && (
        <div style={{ textAlign: 'center', color: '#888' }}>
          <div style={{ fontSize: '10px', marginBottom: '5px' }}>
            Security: <span style={{ color: getSecurityColor(securityState) }}>
              {securityState}
            </span>
          </div>
          <div style={{ fontSize: '10px' }}>
            FPS: {performanceStats.fps.toFixed(0)} • 
            Threshold: {threshold.toFixed(2)} • 
            Exposure: {exposure.toFixed(1)}
          </div>
        </div>
      )}
      
      {/* ===== CONTENU PRINCIPAL (si pas collapsed) ===== */}
      {!isCollapsed && (
        <>
          {/* ===== PRESETS SELECTOR ===== */}
          <div style={{ marginBottom: '15px' }}>
            <select
              value=""
              onChange={(e) => e.target.value && handlePresetSelect(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                background: '#2a2a2a',
                color: 'white',
                border: '1px solid #555',
                borderRadius: '6px',
                fontSize: '12px',
                cursor: 'pointer'
              }}
            >
              <option value="">🎯 Sélectionner un Preset</option>
              <optgroup label="🌑 Thème Dark">
                <option value="blanc_dark">⚪ Blanc (Normal)</option>
              </optgroup>
              <optgroup label="🔧 Actions">
                <option value="__export">📋 Export Current State</option>
                <option value="__snapshot">📸 Create Debug Snapshot</option>
              </optgroup>
            </select>
          </div>
          
          {/* ===== SECURITY STATUS ===== */}
          <div style={{ 
            marginBottom: '15px',
            padding: '8px 12px',
            background: getSecurityBackground(securityState),
            border: `1px solid ${getSecurityColor(securityState)}`,
            borderRadius: '6px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span style={{ fontSize: '11px', fontWeight: 'bold' }}>
              🔒 Security: <span style={{ color: getSecurityColor(securityState) }}>
                {securityState}
              </span>
            </span>
            <div style={{ display: 'flex', gap: '5px' }}>
              {['NORMAL', 'SAFE', 'WARNING', 'DANGER', 'SCANNING'].map(mode => (
                <button
                  key={mode}
                  onClick={() => handleSecurityModeChange(mode)}
                  style={{
                    padding: '2px 6px',
                    fontSize: '9px',
                    border: 'none',
                    borderRadius: '3px',
                    cursor: 'pointer',
                    background: securityState === mode ? getSecurityColor(mode) : '#444',
                    color: securityState === mode ? '#000' : '#ccc'
                  }}
                >
                  {mode.substr(0, 3)}
                </button>
              ))}
            </div>
          </div>
          
          {/* ===== TABS NAVIGATION ===== */}
          <div style={{ 
            display: 'flex', 
            gap: '3px', 
            marginBottom: '15px',
            borderBottom: '1px solid #333'
          }}>
            {[
              { key: 'groups', label: '🌟', title: 'Bloom Groups' },
              { key: 'pbr', label: '🎨', title: 'PBR Settings' },
              { key: 'lighting', label: '💡', title: 'Lighting' },
              { key: 'background', label: '🌈', title: 'Background' },
              { key: 'perf', label: '📊', title: 'Performance' }
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                title={tab.title}
                style={{
                  flex: 1,
                  padding: '8px 4px',
                  background: activeTab === tab.key ? '#4CAF50' : '#333',
                  color: activeTab === tab.key ? 'white' : '#ccc',
                  border: 'none',
                  borderRadius: '4px 4px 0 0',
                  fontSize: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
          
          {/* ===== TAB CONTENT - BLOOM GROUPS ===== */}
          {activeTab === 'groups' && (
            <div>
              <h4 style={{ color: '#4CAF50', margin: '0 0 15px 0', fontSize: '13px' }}>
                🌟 Bloom Controls
              </h4>
              
              {/* Bloom Global Controls */}
              <div style={{ marginBottom: '20px', padding: '10px', background: '#1a1a1a', borderRadius: '6px' }}>
                <h5 style={{ margin: '0 0 10px 0', color: '#FFC107', fontSize: '12px' }}>Global Bloom</h5>
                
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                    <span>Threshold:</span>
                    <span style={{ color: '#4CAF50', fontWeight: 'bold' }}>{threshold.toFixed(3)}</span>
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.001"
                    value={threshold}
                    onChange={(e) => handleThresholdChange(e.target.value)}
                    style={{ width: '100%' }}
                  />
                </div>
                
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                    <span>Strength:</span>
                    <span style={{ color: '#4CAF50', fontWeight: 'bold' }}>{strength.toFixed(3)}</span>
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="2"
                    step="0.01"
                    value={strength}
                    onChange={(e) => handleStrengthChange(e.target.value)}
                    style={{ width: '100%' }}
                  />
                </div>
                
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                    <span>Radius:</span>
                    <span style={{ color: '#4CAF50', fontWeight: 'bold' }}>{radius.toFixed(2)}</span>
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="2"
                    step="0.01"
                    value={radius}
                    onChange={(e) => setBloomGlobal('radius', parseFloat(e.target.value))}
                    style={{ width: '100%' }}
                  />
                </div>
              </div>
              
              {/* Bloom Groups */}
              {[
                { key: 'iris', label: '👁️ Iris', color: '#00ff88', group: irisGroup },
                { key: 'eyeRings', label: '👀 Eye Rings', color: '#4488ff', group: eyeRingsGroup },
                { key: 'revealRings', label: '💫 Reveal Rings', color: '#ffaa00', group: revealRingsGroup }
              ].map(({ key, label, color, group }) => (
                <div key={key} style={{ 
                  marginBottom: '15px', 
                  padding: '10px', 
                  background: '#1a1a1a', 
                  borderRadius: '6px',
                  border: `1px solid ${color}30`
                }}>
                  <h5 style={{ margin: '0 0 10px 0', color: color, fontSize: '11px' }}>
                    {label}
                  </h5>
                  
                  {/* 🔧 ARCHITECTURE SIMPLIFIÉE : Seulement emissiveIntensity par groupe */}
                  {/* ⚠️ SUPPRIMÉ: Contrôles threshold/strength/radius par groupe (impossible avec UnrealBloomPass) */}
                  <div style={{ fontSize: '10px' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '3px' }}>
                        Emissive Intensity: {group.emissiveIntensity?.toFixed(1) || '0.0'}
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="5"
                        step="0.1"
                        value={group.emissiveIntensity || 0}
                        onChange={(e) => setBloomGroup(key, 'emissiveIntensity', parseFloat(e.target.value))}
                        style={{ width: '100%' }}
                      />
                      <div style={{ 
                        fontSize: '8px', 
                        color: '#666', 
                        marginTop: '2px',
                        fontStyle: 'italic' 
                      }}>
                        ✅ Material property (individual per group)
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {/* ===== TAB CONTENT - PBR ===== */}
          {activeTab === 'pbr' && (
            <div>
              <h4 style={{ color: '#FF9800', margin: '0 0 15px 0', fontSize: '13px' }}>
                🎨 PBR Settings
              </h4>
              
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '11px' }}>
                  Current Preset: <strong style={{ color: '#FF9800' }}>{pbrPreset}</strong>
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  {['studioProPlus', 'chromeShowcase', 'softStudio', 'dramaticMood'].map(preset => (
                    <button
                      key={preset}
                      onClick={() => setPbrPreset(preset)}
                      style={{
                        padding: '8px 12px',
                        background: pbrPreset === preset ? '#FF9800' : '#333',
                        color: pbrPreset === preset ? 'black' : 'white',
                        border: 'none',
                        borderRadius: '4px',
                        fontSize: '10px',
                        cursor: 'pointer'
                      }}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>
              
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px', fontSize: '11px' }}>
                  <span>Ambient Multiplier:</span>
                  <span style={{ color: '#FF9800' }}>{ambientMultiplier.toFixed(1)}</span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="10"
                  step="0.1"
                  value={ambientMultiplier}
                  onChange={(e) => setPbrMultiplier('ambient', parseFloat(e.target.value))}
                  style={{ width: '100%' }}
                />
              </div>
              
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px', fontSize: '11px' }}>
                  <span>Directional Multiplier:</span>
                  <span style={{ color: '#FF9800' }}>{directionalMultiplier.toFixed(1)}</span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="10"
                  step="0.1"
                  value={directionalMultiplier}
                  onChange={(e) => setPbrMultiplier('directional', parseFloat(e.target.value))}
                  style={{ width: '100%' }}
                />
              </div>
              
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '15px' }}>
                <label style={{ fontSize: '11px' }}>
                  <input
                    type="checkbox"
                    checked={hdrBoostEnabled}
                    onChange={(e) => setHdrBoost(e.target.checked, hdrMultiplier)}
                    style={{ marginRight: '5px' }}
                  />
                  HDR Boost
                </label>
                {hdrBoostEnabled && (
                  <input
                    type="range"
                    min="1"
                    max="5"
                    step="0.1"
                    value={hdrMultiplier}
                    onChange={(e) => setHdrBoost(true, parseFloat(e.target.value))}
                    style={{ flex: 1 }}
                  />
                )}
              </div>
            </div>
          )}
          
          {/* ===== TAB CONTENT - LIGHTING ===== */}
          {activeTab === 'lighting' && (
            <div>
              <h4 style={{ color: '#FFD700', margin: '0 0 15px 0', fontSize: '13px' }}>
                💡 Lighting Controls
              </h4>
              
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px', fontSize: '11px' }}>
                  <span>Exposure:</span>
                  <span style={{ color: '#FFD700', fontWeight: 'bold' }}>{exposure.toFixed(2)}</span>
                </label>
                <input
                  type="range"
                  min="0.1"
                  max="5"
                  step="0.1"
                  value={exposure}
                  onChange={(e) => handleExposureChange(e.target.value)}
                  style={{ width: '100%' }}
                />
              </div>
              
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px', fontSize: '11px' }}>
                  <span>Ambient Intensity:</span>
                  <span style={{ color: '#FFD700' }}>{ambientIntensity.toFixed(1)}</span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="10"
                  step="0.1"
                  value={ambientIntensity}
                  onChange={(e) => setAmbientLight('intensity', parseFloat(e.target.value))}
                  style={{ width: '100%' }}
                />
              </div>
              
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px', fontSize: '11px' }}>
                  <span>Directional Intensity:</span>
                  <span style={{ color: '#FFD700' }}>{directionalIntensity.toFixed(1)}</span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="10"
                  step="0.1"
                  value={directionalIntensity}
                  onChange={(e) => setDirectionalLight('intensity', parseFloat(e.target.value))}
                  style={{ width: '100%' }}
                />
              </div>
            </div>
          )}
          
          {/* ===== TAB CONTENT - BACKGROUND ===== */}
          {activeTab === 'background' && (
            <div>
              <h4 style={{ color: '#9C27B0', margin: '0 0 15px 0', fontSize: '13px' }}>
                🌈 Background Settings
              </h4>
              
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '11px' }}>
                  Type: <strong style={{ color: '#9C27B0' }}>{backgroundType}</strong>
                </label>
                <select
                  value={backgroundType}
                  onChange={(e) => setBackgroundType(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px',
                    background: '#2a2a2a',
                    color: 'white',
                    border: '1px solid #555',
                    borderRadius: '4px',
                    fontSize: '11px'
                  }}
                >
                  <option value="color">Color</option>
                  <option value="transparent">Transparent</option>
                  <option value="gradient">Gradient</option>
                  <option value="environment">Environment</option>
                </select>
              </div>
              
              {backgroundType === 'color' && (
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '11px' }}>
                    Color: <strong style={{ color: '#9C27B0' }}>{backgroundColor}</strong>
                  </label>
                  <input
                    type="color"
                    value={backgroundColor}
                    onChange={(e) => setBackgroundColor(e.target.value)}
                    style={{
                      width: '100%',
                      height: '40px',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  />
                </div>
              )}
            </div>
          )}
          
          {/* ===== TAB CONTENT - PERFORMANCE ===== */}
          {activeTab === 'perf' && (
            <div>
              <h4 style={{ color: '#2196F3', margin: '0 0 15px 0', fontSize: '13px' }}>
                📊 Performance Stats
              </h4>
              
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: '1fr 1fr', 
                gap: '10px',
                fontSize: '10px'
              }}>
                <div style={{ padding: '8px', background: '#1a1a1a', borderRadius: '4px' }}>
                  <div style={{ color: '#2196F3', fontWeight: 'bold' }}>FPS</div>
                  <div style={{ fontSize: '16px', color: '#4CAF50' }}>{performanceStats.fps.toFixed(0)}</div>
                </div>
                <div style={{ padding: '8px', background: '#1a1a1a', borderRadius: '4px' }}>
                  <div style={{ color: '#2196F3', fontWeight: 'bold' }}>Frame Time</div>
                  <div style={{ fontSize: '16px', color: '#FF9800' }}>{performanceStats.frameTime.toFixed(1)}ms</div>
                </div>
                <div style={{ padding: '8px', background: '#1a1a1a', borderRadius: '4px' }}>
                  <div style={{ color: '#2196F3', fontWeight: 'bold' }}>Render Calls</div>
                  <div style={{ fontSize: '16px', color: '#9C27B0' }}>{performanceStats.renderCalls}</div>
                </div>
                <div style={{ padding: '8px', background: '#1a1a1a', borderRadius: '4px' }}>
                  <div style={{ color: '#2196F3', fontWeight: 'bold' }}>Triangles</div>
                  <div style={{ fontSize: '16px', color: '#FF5722' }}>{performanceStats.triangles}</div>
                </div>
              </div>
            </div>
          )}
          
          {/* ===== FOOTER ACTIONS ===== */}
          <div style={{ 
            borderTop: '1px solid #333',
            paddingTop: '15px',
            marginTop: '20px'
          }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
              <button
                onClick={resetAll}
                style={{
                  padding: '10px 8px',
                  background: '#f44336',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '10px',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
                title="Reset all settings to default"
              >
                🔄 Reset All
              </button>
              
              <button
                onClick={handleExportState}
                style={{
                  padding: '10px 8px',
                  background: '#2196F3',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '10px',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
                title="Export current state to clipboard"
              >
                📋 Export
              </button>
              
              <button
                onClick={handleCreateSnapshot}
                style={{
                  padding: '10px 8px',
                  background: '#FF9800',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '10px',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
                title="Create debug snapshot"
              >
                📸 Snapshot
              </button>
            </div>
            
            {/* Version Info */}
            <div style={{ 
              textAlign: 'center', 
              fontSize: '9px', 
              color: '#666', 
              marginTop: '10px' 
            }}>
              Phase {migrationPhase} • Version {version} • 100% Zustand
            </div>
          </div>
        </>
      )}
    </div>
  );
};

// Helper functions
const getSecurityColor = (state) => {
  const colors = {
    'NORMAL': '#4CAF50',
    'SAFE': '#2196F3',
    'WARNING': '#FF9800',
    'DANGER': '#f44336',
    'SCANNING': '#9C27B0'
  };
  return colors[state] || '#666';
};

const getSecurityBackground = (state) => {
  const colors = {
    'NORMAL': 'rgba(76, 175, 80, 0.1)',
    'SAFE': 'rgba(33, 150, 243, 0.1)',
    'WARNING': 'rgba(255, 152, 0, 0.1)',
    'DANGER': 'rgba(244, 67, 54, 0.1)',
    'SCANNING': 'rgba(156, 39, 176, 0.1)'
  };
  return colors[state] || 'rgba(102, 102, 102, 0.1)';
};

export default DebugPanelV2;