/**
 * 🎛️ DebugPanel V2 Simple - Phase 2 Test
 * Version simplifiée pour tester que Zustand fonctionne
 */

import React from 'react';
import { useDebugPanelControls, usePbrTabControls, useLightingTabControls, useBackgroundTabControls } from '../stores/hooks/useDebugPanelControls.js';
import { useParticlesControls } from '../stores/hooks/useParticlesControls.js';
import { useSecurityControls, useSecurityPresets } from '../stores/hooks/useSecurityControls.js';
import { useMsaaControls } from '../stores/hooks/useMsaaControls.js';
import { usePresetsControls } from '../stores/hooks/usePresetsControls.js';
import useSceneStore from '../stores/sceneStore.js';

// PRESETS POSITION LUMIÈRE DIRECTIONNELLE
const LIGHT_POSITION_PRESETS = {
  "studio-classic": { x: 1, y: 2, z: 3, name: "🎬 Studio", description: "Position studio standard" },
  "top-down": { x: 0, y: 5, z: 0, name: "☀️ Plongée", description: "Lumière du haut (midi)" },
  "side-dramatic": { x: 5, y: 1, z: 1, name: "🌅 Dramatique", description: "Éclairage de côté" },
  "front-soft": { x: 0, y: 1, z: 5, name: "💡 Face", description: "Lumière frontale douce" },
  "back-rim": { x: -2, y: 3, z: -2, name: "✨ Contre-jour", description: "Éclairage arrière" },
  "low-moody": { x: 2, y: 0.5, z: 2, name: "🌙 Ambiance", description: "Lumière basse dramatique" }
};

const DebugPanelV2Simple = ({ 
  className = '',
  style = {}
}) => {
  // Test basique des hooks Zustand
  const {
    activeTab,
    setActiveTab,
    bloom,
    setBloomEnabled,
    setBloomGlobal,
    threshold,
    strength,
    radius,
    bloomEnabled,
    version,
    migrationPhase
  } = useDebugPanelControls();
  
  // PBR controls hook
  const {
    pbr,
    setPbrPreset,
    setPbrMultiplier,
    setMaterialSetting,
    setHdrBoost,
    toggleAdvancedLighting, // ✅ NOUVEAU: Advanced Lighting action
    currentPreset,
    ambientMultiplier,
    directionalMultiplier,
    hdrBoost,
    materialSettings
  } = usePbrTabControls();
  
  // Lighting controls hook (simplifié - ambient/directional maintenant dans PBR)
  const {
    lighting,
    setExposure,
    exposure
  } = useLightingTabControls();
  
  // Background controls hook
  const {
    background,
    backgroundType,
    backgroundColor,
    backgroundAlpha,
    gradient,
    setBackgroundType,
    setBackgroundColor,
    setBackgroundAlpha,
    setGradient,
    setGradientColors,
    generateCssBackground
  } = useBackgroundTabControls();
  
  // Particles controls hook
  const {
    particles,
    enabled: particlesEnabled,
    count: particlesCount,
    color: particlesColor,
    arcs,
    setParticlesEnabled,
    setParticlesCount,
    setParticlesColor,
    setArcsEnabled,
    setArcsProperty
  } = useParticlesControls();
  
  // Security controls hook
  const {
    securityState,
    isTransitioning,
    setSecurityState,
    applySecurityPreset
  } = useSecurityControls();
  
  const {
    presets: securityPresets,
    getCurrentPreset
  } = useSecurityPresets();
  
  // MSAA controls hook
  const {
    msaa,
    enabled: msaaEnabled,
    samples,
    fxaa,
    currentQuality,
    stats,
    setMsaaEnabled,
    setMsaaSamples,
    setFxaaEnabled,
    setQualityPreset
  } = useMsaaControls();
  
  // Presets controls hook
  const {
    currentPreset: zustandCurrentPreset,
    getAvailablePresets,
    isPresetActive,
    applyLegacyPreset
  } = usePresetsControls();

  // État local pour la position de la lumière directionnelle (pour panel Zustand)
  const [lightPositionSettings, setLightPositionSettings] = React.useState({
    currentPreset: 'studio-classic',
    advancedMode: false,
    customPosition: { x: 1, y: 2, z: 3 }
  });

  // Handlers pour position lumière directionnelle
  const handleLightPositionPreset = (presetKey) => {
    const preset = LIGHT_POSITION_PRESETS[presetKey];
    if (preset) {
      setLightPositionSettings(prev => ({
        ...prev,
        currentPreset: presetKey,
        customPosition: { x: preset.x, y: preset.y, z: preset.z }
      }));
      
      // Appliquer la position à la lumière directionnelle
      updateDirectionalLightPosition(preset.x, preset.y, preset.z);
    }
  };

  const handleAdvancedModeToggle = () => {
    setLightPositionSettings(prev => ({
      ...prev,
      advancedMode: !prev.advancedMode
    }));
  };

  // ✅ NOUVEAU: Handler pour matériaux avec application Three.js
  const handleMaterialProperty = (property, value) => {
    const numValue = parseFloat(value);
    
    // 1. Mettre à jour le store Zustand
    setMaterialSetting(property, numValue);
    
    // 2. Appliquer immédiatement aux matériaux Three.js (comme dans le panel legacy)
    if (window.scene && materialSettings) {
      let appliedCount = 0;
      const appliedMaterials = [];
      
      window.scene.traverse((child) => {
        if (child.isMesh && child.material) {
          const material = Array.isArray(child.material) ? child.material[0] : child.material;
          const materialName = material.name || '';
          
          // Vérifier si c'est un matériau ciblé
          const shouldApply = materialSettings.targetMaterials && (
            // Cas spécial: 'all' applique à tous les matériaux
            materialSettings.targetMaterials.includes('all') ||
            // Cas normal: vérifier les noms spécifiques
            materialSettings.targetMaterials.some(targetMat => 
              materialName.includes(targetMat) || materialName === targetMat
            )
          );
          
          if (shouldApply && material[property] !== undefined) {
            material[property] = numValue;
            material.needsUpdate = true;
            appliedCount++;
            appliedMaterials.push(materialName);
          }
        }
      });
      
      console.log(`🎨 ${property} appliqué: ${numValue} à ${appliedCount} matériaux:`, appliedMaterials);
    }
  };

  const handleCustomPositionChange = (axis, value) => {
    const newPosition = { ...lightPositionSettings.customPosition, [axis]: parseFloat(value) };
    
    setLightPositionSettings(prev => ({
      ...prev,
      customPosition: newPosition,
      currentPreset: null // Reset preset when manually adjusting
    }));
    
    // Appliquer la position à la lumière directionnelle
    updateDirectionalLightPosition(newPosition.x, newPosition.y, newPosition.z);
  };

  // Fonction utilitaire pour mettre à jour la position de la lumière
  const updateDirectionalLightPosition = (x, y, z) => {
    // Directement via la scène
    if (window.scene) {
      const directionalLight = window.scene.getObjectByName('PBR_DirectionalLight') || 
                             window.scene.children.find(child => child.isDirectionalLight);
      if (directionalLight) {
        directionalLight.position.set(x, y, z);
      }
    }
    console.log(`🔆 Light position updated: (${x}, ${y}, ${z})`);
  };

  return (
    <div 
      className={`debug-panel-v2-simple ${className}`}
      style={{
        position: 'absolute',
        top: '10px',
        left: '10px',
        width: '300px',
        background: 'rgba(20, 20, 40, 0.95)',
        color: '#00ff00',
        padding: '15px',
        borderRadius: '8px',
        fontSize: '11px',
        zIndex: 1001,
        border: '2px solid #00ff00',
        boxShadow: '0 0 20px rgba(0, 255, 0, 0.3)',
        fontFamily: 'monospace',
        ...style
      }}
    >
      {/* Header */}
      <div style={{ 
        borderBottom: '1px solid #00ff00', 
        paddingBottom: '10px', 
        marginBottom: '15px' 
      }}>
        <h3 style={{ 
          margin: '0', 
          color: '#00ff00',
          fontSize: '14px',
          textAlign: 'center'
        }}>
          🚀 ZUSTAND PHASE 2 - V{version} 
        </h3>
        <div style={{ textAlign: 'center', fontSize: '10px', opacity: 0.8 }}>
          Migration Phase: {migrationPhase}
        </div>
      </div>

      {/* Simple Tabs */}
      <div style={{ marginBottom: '15px' }}>
        <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
          {['presets', 'bloom', 'pbr', 'background', 'particles', 'msaa'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '6px 10px',
                fontSize: '11px',
                border: activeTab === tab ? '1px solid #00ff00' : '1px solid #333',
                background: activeTab === tab ? 'rgba(0, 255, 0, 0.2)' : 'rgba(0, 0, 0, 0.5)',
                color: activeTab === tab ? '#00ff00' : '#ccc',
                cursor: 'pointer',
                borderRadius: '3px',
                textTransform: 'uppercase'
              }}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Content based on active tab */}
      
      {/* Presets Section */}
      {activeTab === 'presets' && (
        <div>
          <h4 style={{ color: '#00ff00', margin: '0 0 10px 0' }}>🎨 PRESETS MANAGER</h4>
          
          {/* Current Preset Status */}
          <div style={{ 
            marginBottom: '15px', 
            padding: '8px', 
            background: 'rgba(0,255,0,0.1)', 
            border: '1px solid #00ff00', 
            borderRadius: '4px' 
          }}>
            <div style={{ fontSize: '10px', color: '#ccc', marginBottom: '4px' }}>Current Preset:</div>
            <div style={{ 
              color: '#00ff00',
              fontSize: '12px',
              fontWeight: 'bold'
            }}>
              {zustandCurrentPreset || 'None'}
            </div>
          </div>

          {/* Available Presets */}
          <div style={{ marginBottom: '15px' }}>
            <label style={{ fontSize: '10px', display: 'block', marginBottom: '6px' }}>Available Presets:</label>
            <div style={{ display: 'grid', gap: '6px' }}>
              {getAvailablePresets().map(preset => (
                <button
                  key={preset.key}
                  onClick={() => applyLegacyPreset(preset.key)}
                  disabled={isPresetActive(preset.key)}
                  style={{
                    padding: '8px 12px',
                    fontSize: '10px',
                    background: isPresetActive(preset.key) 
                      ? 'rgba(0,255,0,0.3)' 
                      : 'rgba(0,0,0,0.5)',
                    color: isPresetActive(preset.key) ? '#00ff00' : '#ccc',
                    border: `1px solid ${isPresetActive(preset.key) ? '#00ff00' : '#333'}`,
                    borderRadius: '4px',
                    cursor: isPresetActive(preset.key) ? 'not-allowed' : 'pointer',
                    opacity: isPresetActive(preset.key) ? 0.7 : 1,
                    textAlign: 'left'
                  }}
                >
                  <div style={{ fontWeight: 'bold' }}>{preset.name}</div>
                  <div style={{ fontSize: '9px', opacity: 0.8, marginTop: '2px' }}>
                    {preset.description}
                  </div>
                  <div style={{ fontSize: '8px', opacity: 0.6, marginTop: '2px' }}>
                    Security: {preset.securityMode}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Preset Actions */}
          <div style={{ 
            borderTop: '1px solid #333',
            paddingTop: '10px',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '6px'
          }}>
            <button
              style={{
                padding: '6px 8px',
                fontSize: '9px',
                background: 'rgba(255,165,0,0.2)',
                color: '#ffaa00',
                border: '1px solid #ffaa00',
                borderRadius: '3px',
                cursor: 'pointer'
              }}
              onClick={() => {
                const state = useSceneStore.getState().exportState();
                console.log('📋 Current state:', state);
                navigator.clipboard?.writeText(JSON.stringify(state, null, 2));
              }}
            >
              📋 Export State
            </button>
            
            <button
              style={{
                padding: '6px 8px',
                fontSize: '9px',
                background: 'rgba(255,69,0,0.2)',
                color: '#ff4500',
                border: '1px solid #ff4500',
                borderRadius: '3px',
                cursor: 'pointer'
              }}
              onClick={() => {
                // Reset to defaults
                const actions = useSceneStore.getState();
                actions.resetBloom();
                actions.resetPbr();
                actions.resetLighting();
                actions.resetBackground();
                actions.resetSecurity();
                actions.resetParticles();
                actions.resetMsaa();
                actions.setCurrentPreset(null);
                console.log('🔄 Reset to defaults');
              }}
            >
              🔄 Reset All
            </button>
          </div>
        </div>
      )}
      
      {activeTab === 'bloom' && (
        <div>
          <h4 style={{ color: '#00ff00', margin: '0 0 10px 0' }}>🌟 BLOOM CONTROLS</h4>
          
          {/* Bloom Enable */}
          <div style={{ marginBottom: '10px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="checkbox"
                checked={bloomEnabled}
                onChange={(e) => setBloomEnabled(e.target.checked)}
              />
              <span>Bloom Enabled</span>
            </label>
          </div>

          {/* Bloom Parameters */}
          <div>
            <div style={{ marginBottom: '8px' }}>
              <label>Threshold: {threshold.toFixed(2)}</label>
              <input
                type="range"
                min="0.3"
                max="1"
                step="0.01"
                value={threshold}
                onChange={(e) => setBloomGlobal('threshold', parseFloat(e.target.value))}
                style={{ width: '100%', marginTop: '2px' }}
              />
            </div>
            
            <div style={{ marginBottom: '8px' }}>
              <label>Strength: {strength.toFixed(2)}</label>
              <input
                type="range"
                min="0"
                max="3"
                step="0.01"
                value={strength}
                onChange={(e) => setBloomGlobal('strength', parseFloat(e.target.value))}
                style={{ width: '100%', marginTop: '2px' }}
              />
            </div>
            
            <div style={{ marginBottom: '8px' }}>
              <label>Radius: {radius.toFixed(2)}</label>
              <input
                type="range"
                min="0"
                max="2"
                step="0.01"
                value={radius}
                onChange={(e) => setBloomGlobal('radius', parseFloat(e.target.value))}
                style={{ width: '100%', marginTop: '2px' }}
              />
            </div>

            {/* 🔧 NOUVEAU: Reveal Rings Visibility Control */}
            <div style={{ marginTop: '15px', paddingTop: '10px', borderTop: '1px solid #333' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="checkbox"
                  checked={bloom.groups?.revealRings?.forceVisible || false}
                  onChange={(e) => {
                    const setRevealRingsVisibility = useSceneStore.getState().setRevealRingsVisibility;
                    setRevealRingsVisibility(e.target.checked);
                  }}
                />
                <span style={{ fontSize: '10px' }}>💍 Force Show Reveal Rings</span>
              </label>
            </div>

            {/* 🌟 NOUVEAU: Individual Emissive Controls */}
            <div style={{ marginTop: '15px', paddingTop: '10px', borderTop: '1px solid #333' }}>
              <h5 style={{ color: '#00ccff', margin: '0 0 8px 0', fontSize: '10px' }}>✨ INDIVIDUAL EMISSIVE CONTROLS</h5>
              
              {/* 🔒 Security Modes (sans texte descriptif) */}
              <div style={{ marginBottom: '10px', padding: '6px', background: 'rgba(255,107,107,0.1)', borderRadius: '3px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2px' }}>
                  {Object.entries(securityPresets).map(([key, preset]) => (
                    <button
                      key={key}
                      onClick={() => applySecurityPreset(key)}
                      style={{
                        padding: '4px 6px',
                        fontSize: '9px',
                        background: securityState === key ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.3)',
                        color: preset.color,
                        border: `1px solid ${preset.color}`,
                        borderRadius: '2px',
                        cursor: 'pointer',
                        opacity: securityState === key ? 1 : 0.7,
                        fontWeight: securityState === key ? 'bold' : 'normal'
                      }}
                    >
                      {key}
                    </button>
                  ))}
                </div>
              </div>

              {/* Iris Controls */}
              <div style={{ marginBottom: '4px', padding: '6px', background: 'rgba(0,0,0,0.2)', borderRadius: '3px' }}>
                <label style={{ fontSize: '9px', color: '#ff6b6b', marginBottom: '4px', display: 'block' }}>
                  👁️ Iris Group
                </label>
                <div>
                  <label style={{ fontSize: '8px' }}>Intensity: {(bloom.groups?.iris?.emissiveIntensity || 0.6).toFixed(2)}</label>
                  <input
                    type="range"
                    min="0"
                    max="2"
                    step="0.01"
                    value={bloom.groups?.iris?.emissiveIntensity || 0.6}
                    onChange={(e) => {
                      const setBloomGroup = useSceneStore.getState().setBloomGroup;
                      setBloomGroup('iris', 'emissiveIntensity', parseFloat(e.target.value));
                    }}
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              {/* EyeRings Controls */}
              <div style={{ marginBottom: '4px', padding: '6px', background: 'rgba(0,0,0,0.2)', borderRadius: '3px' }}>
                <label style={{ fontSize: '9px', color: '#4ecdc4', marginBottom: '4px', display: 'block' }}>
                  👀 Eye Rings Group
                </label>
                <div>
                  <label style={{ fontSize: '8px' }}>Intensity: {(bloom.groups?.eyeRings?.emissiveIntensity || 0.45).toFixed(2)}</label>
                  <input
                    type="range"
                    min="0"
                    max="2"
                    step="0.01"
                    value={bloom.groups?.eyeRings?.emissiveIntensity || 0.45}
                    onChange={(e) => {
                      const setBloomGroup = useSceneStore.getState().setBloomGroup;
                      setBloomGroup('eyeRings', 'emissiveIntensity', parseFloat(e.target.value));
                    }}
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              {/* RevealRings Controls */}
              <div style={{ marginBottom: '4px', padding: '6px', background: 'rgba(0,0,0,0.2)', borderRadius: '3px' }}>
                <label style={{ fontSize: '9px', color: '#45b7d1', marginBottom: '4px', display: 'block' }}>
                  💍 Reveal Rings Group
                </label>
                <div>
                  <label style={{ fontSize: '8px' }}>Intensity: {(bloom.groups?.revealRings?.emissiveIntensity || 0.36).toFixed(2)}</label>
                  <input
                    type="range"
                    min="0"
                    max="2"
                    step="0.01"
                    value={bloom.groups?.revealRings?.emissiveIntensity || 0.36}
                    onChange={(e) => {
                      const setBloomGroup = useSceneStore.getState().setBloomGroup;
                      setBloomGroup('revealRings', 'emissiveIntensity', parseFloat(e.target.value));
                    }}
                    style={{ width: '100%' }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'pbr' && (
        <div>
          <h4 style={{ color: '#00ff00', margin: '0 0 10px 0' }}>🎨 PBR CONTROLS</h4>
          
          {/* PBR Preset Selector + Advanced Lighting côte à côte */}
          <div style={{ marginBottom: '10px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '10px' }}>
              Preset: {currentPreset}
            </label>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              {/* Menu déroulant plus petit (70% de la largeur) */}
              <select
                value={currentPreset}
                onChange={(e) => setPbrPreset(e.target.value)}
                style={{
                  flex: '1',
                  padding: '4px',
                  background: '#333',
                  color: '#00ff00',
                  border: '1px solid #00ff00',
                  fontSize: '10px',
                  borderRadius: '3px'
                }}
              >
                <option value="studioProPlus">Studio Pro+</option>
                <option value="chromeShowcase">Chrome Showcase</option>
                <option value="softStudio">Soft Studio</option>
                <option value="dramaticMood">Dramatic Mood</option>
              </select>
              
              {/* Bouton Adv Light avec style des onglets */}
              <button
                onClick={() => toggleAdvancedLighting()}
                style={{
                  padding: '6px 8px',
                  fontSize: '9px',
                  border: pbr.advancedLighting?.enabled ? '1px solid #00ff00' : '1px solid #333',
                  background: pbr.advancedLighting?.enabled ? 'rgba(0, 255, 0, 0.2)' : 'rgba(0, 0, 0, 0.5)',
                  color: pbr.advancedLighting?.enabled ? '#00ff00' : '#ccc',
                  cursor: 'pointer',
                  borderRadius: '3px',
                  textTransform: 'uppercase',
                  whiteSpace: 'nowrap',
                  minWidth: '65px'
                }}
                title={pbr.advancedLighting?.enabled ? 'Advanced Lighting activé' : 'Advanced Lighting désactivé'}
              >
                Adv Light
              </button>
            </div>
          </div>

          {/* ✅ MULTIPLIERS (format ×1.000 comme ancien DebugPanel V6) */}
          <div style={{ marginBottom: '8px' }}>
            <label style={{ fontSize: '10px' }}>Lumière Ambiante: ×{ambientMultiplier.toFixed(3)}</label>
            <input
              type="range"
              min="0.1"
              max="3.0"
              step="0.005"
              value={ambientMultiplier}
              onChange={(e) => setPbrMultiplier('ambient', parseFloat(e.target.value))}
              style={{ width: '100%', marginTop: '2px' }}
            />
          </div>
          
          <div style={{ marginBottom: '8px' }}>
            <label style={{ fontSize: '10px' }}>Lumière Directionnelle: ×{directionalMultiplier.toFixed(3)}</label>
            <input
              type="range"
              min="0.1"
              max="2.0"
              step="0.005"
              value={directionalMultiplier}
              onChange={(e) => setPbrMultiplier('directional', parseFloat(e.target.value))}
              style={{ width: '100%', marginTop: '2px' }}
            />
          </div>
          
          {/* ✅ EXPOSURE (déplacé de Lighting) */}
          <div style={{ marginBottom: '8px' }}>
            <label style={{ fontSize: '10px' }}>Exposure: {exposure.toFixed(1)}</label>
            <input
              type="range"
              min="0.4"
              max="5.0"
              step="0.005"
              value={exposure}
              onChange={(e) => setExposure(parseFloat(e.target.value))}
              style={{ width: '100%', marginTop: '2px' }}
            />
          </div>

          {/* ✅ NOUVEAU : SECTION POSITION LUMIÈRE DIRECTIONNELLE */}
          <div style={{ marginBottom: '15px', paddingTop: '10px', borderTop: '1px solid #333' }}>
            <h5 style={{ margin: '0 0 8px 0', color: '#00ff00', fontSize: '11px' }}>
              🔆 Position Lumière
            </h5>
            
            {/* Presets de position */}
            <div style={{ marginBottom: '8px' }}>
              <div style={{ fontSize: '9px', color: '#ccc', marginBottom: '4px' }}>
                Presets rapides :
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '3px', marginBottom: '6px' }}>
                {Object.entries(LIGHT_POSITION_PRESETS).map(([key, preset]) => (
                  <button
                    key={key}
                    onClick={() => handleLightPositionPreset(key)}
                    style={{
                      padding: '3px 2px',
                      background: lightPositionSettings.currentPreset === key ? '#00ff00' : '#555',
                      color: lightPositionSettings.currentPreset === key ? '#000' : '#ccc',
                      border: '1px solid #777',
                      borderRadius: '2px',
                      fontSize: '7px',
                      cursor: 'pointer',
                      fontWeight: lightPositionSettings.currentPreset === key ? 'bold' : 'normal'
                    }}
                    title={preset.description}
                  >
                    {preset.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Toggle Mode Avancé */}
            <div style={{ marginBottom: '8px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '9px', color: '#ccc', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={lightPositionSettings.advancedMode}
                  onChange={handleAdvancedModeToggle}
                  style={{ margin: 0, transform: 'scale(0.8)' }}
                />
                Mode Avancé (X, Y, Z)
              </label>
            </div>

            {/* Curseurs avancés (affiché seulement en mode avancé) */}
            {lightPositionSettings.advancedMode && (
              <div style={{ 
                padding: '6px', 
                background: 'rgba(0, 255, 0, 0.1)', 
                border: '1px solid rgba(0, 255, 0, 0.3)', 
                borderRadius: '3px' 
              }}>
                {/* Curseur X */}
                <div style={{ marginBottom: '6px' }}>
                  <label style={{ fontSize: '8px', color: '#ccc', display: 'block', marginBottom: '2px' }}>
                    X: {lightPositionSettings.customPosition.x.toFixed(1)}
                  </label>
                  <input
                    type="range"
                    min="-10"
                    max="10"
                    step="0.1"
                    value={lightPositionSettings.customPosition.x}
                    onChange={(e) => handleCustomPositionChange('x', e.target.value)}
                    style={{ width: '100%', height: '2px' }}
                  />
                </div>

                {/* Curseur Y */}
                <div style={{ marginBottom: '6px' }}>
                  <label style={{ fontSize: '8px', color: '#ccc', display: 'block', marginBottom: '2px' }}>
                    Y: {lightPositionSettings.customPosition.y.toFixed(1)}
                  </label>
                  <input
                    type="range"
                    min="-5"
                    max="10"
                    step="0.1"
                    value={lightPositionSettings.customPosition.y}
                    onChange={(e) => handleCustomPositionChange('y', e.target.value)}
                    style={{ width: '100%', height: '2px' }}
                  />
                </div>

                {/* Curseur Z */}
                <div style={{ marginBottom: '4px' }}>
                  <label style={{ fontSize: '8px', color: '#ccc', display: 'block', marginBottom: '2px' }}>
                    Z: {lightPositionSettings.customPosition.z.toFixed(1)}
                  </label>
                  <input
                    type="range"
                    min="-10"
                    max="10"
                    step="0.1"
                    value={lightPositionSettings.customPosition.z}
                    onChange={(e) => handleCustomPositionChange('z', e.target.value)}
                    style={{ width: '100%', height: '2px' }}
                  />
                </div>

                {/* Info position actuelle */}
                <div style={{ fontSize: '7px', color: '#999', textAlign: 'center' }}>
                  ({lightPositionSettings.customPosition.x.toFixed(1)}, {lightPositionSettings.customPosition.y.toFixed(1)}, {lightPositionSettings.customPosition.z.toFixed(1)})
                </div>
              </div>
            )}
          </div>
          
          {/* Material Settings */}
          <div style={{ marginBottom: '15px', paddingTop: '10px', borderTop: '1px solid #333' }}>
            <h5 style={{ color: '#00ccff', margin: '0 0 8px 0', fontSize: '10px' }}>🔧 MATERIAL SETTINGS</h5>
            
            <div style={{ marginBottom: '8px' }}>
              <label style={{ fontSize: '10px' }}>Metalness: {(materialSettings?.metalness || 0).toFixed(2)}</label>
              <input
                type="range"
                min="0.3"
                max="1"
                step="0.01"
                value={materialSettings?.metalness || 0}
                onChange={(e) => handleMaterialProperty('metalness', e.target.value)}
                style={{ width: '100%', marginTop: '2px' }}
              />
            </div>
            
            <div style={{ marginBottom: '8px' }}>
              <label style={{ fontSize: '10px' }}>Roughness: {(materialSettings?.roughness || 0).toFixed(2)}</label>
              <input
                type="range"
                min="0.3"
                max="1"
                step="0.01"
                value={materialSettings?.roughness || 0}
                onChange={(e) => handleMaterialProperty('roughness', e.target.value)}
                style={{ width: '100%', marginTop: '2px' }}
              />
            </div>

            {/* Presets rapides metalness/roughness */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '4px', marginTop: '8px' }}>
              <button
                onClick={() => {
                  handleMaterialProperty('metalness', 0.3);
                  handleMaterialProperty('roughness', 1.0);
                }}
                style={{
                  padding: '4px 2px',
                  background: '#795548',
                  color: 'white',
                  border: 'none',
                  borderRadius: '2px',
                  fontSize: '7px',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
                title="Matériau mat (peu métallique, très rugueux)"
              >
                🪨 Mat
              </button>
              <button
                onClick={() => {
                  handleMaterialProperty('metalness', 0.5);
                  handleMaterialProperty('roughness', 0.6);
                }}
                style={{
                  padding: '4px 2px',
                  background: '#607D8B',
                  color: 'white',
                  border: 'none',
                  borderRadius: '2px',
                  fontSize: '7px',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
                title="Matériau équilibré (semi-métallique)"
              >
                ⚖️ Équilibré
              </button>
              <button
                onClick={() => {
                  handleMaterialProperty('metalness', 1.0);
                  handleMaterialProperty('roughness', 0.3);
                }}
                style={{
                  padding: '4px 2px',
                  background: '#37474F',
                  color: 'white',
                  border: 'none',
                  borderRadius: '2px',
                  fontSize: '7px',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
                title="Matériau chrome/miroir (très métallique, peu rugueux)"
              >
                ✨ Chrome
              </button>
            </div>
          </div>
          
          {/* HDR Boost */}
          <div style={{ marginBottom: '10px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '10px' }}>
              <input
                type="checkbox"
                checked={hdrBoost.enabled}
                onChange={(e) => setHdrBoost(e.target.checked, hdrBoost.multiplier)}
              />
              <span>HDR Boost ({hdrBoost.multiplier.toFixed(1)}x)</span>
            </label>
            {hdrBoost.enabled && (
              <input
                type="range"
                min="1"
                max="5"
                step="0.1"
                value={hdrBoost.multiplier}
                onChange={(e) => setHdrBoost(true, parseFloat(e.target.value))}
                style={{ width: '100%', marginTop: '5px' }}
              />
            )}
          </div>
        </div>
      )}

      {/* ❌ SUPPRIMÉ: onglet lighting (exposure déplacé dans PBR) */}

      {activeTab === 'background' && (
        <div>
          <h4 style={{ color: '#00ff00', margin: '0 0 10px 0' }}>🌈 BACKGROUND CONTROLS</h4>
          
          {/* Background Type Selector */}
          <div style={{ marginBottom: '10px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '10px' }}>
              Type: {backgroundType}
            </label>
            <select
              value={backgroundType}
              onChange={(e) => setBackgroundType(e.target.value)}
              style={{
                width: '100%',
                padding: '4px',
                background: '#333',
                color: '#00ff00',
                border: '1px solid #00ff00',
                fontSize: '10px'
              }}
            >
              <option value="color">Solid Color</option>
              <option value="transparent">Transparent</option>
              <option value="gradient">Gradient</option>
              <option value="environment">Environment</option>
            </select>
          </div>
          
          {/* Background Color (if type is color) */}
          {backgroundType === 'color' && (
            <div style={{ marginBottom: '10px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '10px' }}>
                Color: {backgroundColor}
              </label>
              <input
                type="color"
                value={backgroundColor}
                onChange={(e) => setBackgroundColor(e.target.value)}
                style={{
                  width: '100%',
                  height: '30px',
                  border: '1px solid #00ff00',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              />
              
              {/* Alpha slider */}
              <div style={{ marginTop: '8px' }}>
                <label style={{ fontSize: '10px' }}>Alpha: {backgroundAlpha.toFixed(2)}</label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={backgroundAlpha}
                  onChange={(e) => setBackgroundAlpha(parseFloat(e.target.value))}
                  style={{ width: '100%', marginTop: '2px' }}
                />
              </div>
            </div>
          )}
          
          {/* Gradient Controls (if type is gradient) */}
          {backgroundType === 'gradient' && (
            <div style={{ marginBottom: '10px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '10px', marginBottom: '8px' }}>
                <input
                  type="checkbox"
                  checked={gradient.enabled}
                  onChange={(e) => setGradient(e.target.checked)}
                />
                <span>Enable Gradient</span>
              </label>
              
              {gradient.enabled && (
                <div>
                  <div style={{ marginBottom: '5px' }}>
                    <label style={{ fontSize: '10px' }}>Color 1:</label>
                    <input
                      type="color"
                      value={gradient.colors[0] || '#1a1a1a'}
                      onChange={(e) => setGradientColors([e.target.value, gradient.colors[1] || '#333333'])}
                      style={{ width: '100%', height: '25px', marginTop: '2px' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '10px' }}>Color 2:</label>
                    <input
                      type="color"
                      value={gradient.colors[1] || '#333333'}
                      onChange={(e) => setGradientColors([gradient.colors[0] || '#1a1a1a', e.target.value])}
                      style={{ width: '100%', height: '25px', marginTop: '2px' }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* Preview */}
          <div style={{ marginTop: '10px' }}>
            <label style={{ fontSize: '10px', marginBottom: '5px', display: 'block' }}>Preview:</label>
            <div
              style={{
                width: '100%',
                height: '40px',
                border: '1px solid #00ff00',
                borderRadius: '4px',
                background: generateCssBackground ? generateCssBackground() : backgroundColor
              }}
            />
          </div>
        </div>
      )}

      {/* Particles Controls */}
      {activeTab === 'particles' && (
        <div>
          <h4 style={{ color: '#00ff00', margin: '0 0 10px 0' }}>🎨 PARTICLES CONTROLS</h4>
          
          {/* Particles Enable */}
          <div style={{ marginBottom: '10px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px' }}>
              <input
                type="checkbox"
                checked={particlesEnabled}
                onChange={(e) => setParticlesEnabled(e.target.checked)}
              />
              <span>Particles Enabled</span>
            </label>
          </div>

          {/* Particles Count */}
          <div style={{ marginBottom: '10px' }}>
            <label style={{ fontSize: '10px' }}>Count: {particlesCount}</label>
            <input
              type="range"
              min="0"
              max="2000"
              step="50"
              value={particlesCount}
              onChange={(e) => setParticlesCount(parseInt(e.target.value))}
              style={{ width: '100%', marginTop: '2px' }}
            />
          </div>

          {/* Particles Color */}
          <div style={{ marginBottom: '10px' }}>
            <label style={{ fontSize: '10px', display: 'block', marginBottom: '4px' }}>
              Particles Color
            </label>
            <input
              type="color"
              value={particlesColor}
              onChange={(e) => setParticlesColor(e.target.value)}
              style={{
                width: '100%',
                height: '30px',
                border: '1px solid #00ff00',
                borderRadius: '4px'
              }}
            />
          </div>

          {/* Arcs Controls */}
          <div style={{ marginBottom: '10px', padding: '8px', border: '1px solid #333', borderRadius: '4px' }}>
            <h5 style={{ color: '#00ccff', margin: '0 0 8px 0', fontSize: '10px' }}>⚡ Electric Arcs</h5>
            
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '10px', marginBottom: '6px' }}>
              <input
                type="checkbox"
                checked={arcs.enabled}
                onChange={(e) => setArcsEnabled(e.target.checked)}
              />
              <span>Arcs Enabled</span>
            </label>

            {arcs.enabled && (
              <>
                <div style={{ marginBottom: '6px' }}>
                  <label style={{ fontSize: '10px' }}>Intensity: {arcs.intensity.toFixed(1)}</label>
                  <input
                    type="range"
                    min="0"
                    max="2"
                    step="0.1"
                    value={arcs.intensity}
                    onChange={(e) => setArcsProperty('intensity', parseFloat(e.target.value))}
                    style={{ width: '100%', marginTop: '2px' }}
                  />
                </div>

                <div style={{ marginBottom: '6px' }}>
                  <label style={{ fontSize: '10px' }}>Connection Distance: {arcs.connectionDistance}</label>
                  <input
                    type="range"
                    min="50"
                    max="300"
                    step="10"
                    value={arcs.connectionDistance}
                    onChange={(e) => setArcsProperty('connectionDistance', parseInt(e.target.value))}
                    style={{ width: '100%', marginTop: '2px' }}
                  />
                </div>
              </>
            )}
          </div>
        </div>
      )}


      {/* MSAA Controls */}
      {activeTab === 'msaa' && (
        <div>
          <h4 style={{ color: '#00ff00', margin: '0 0 10px 0' }}>🎨 MSAA CONTROLS</h4>
          
          {/* Performance Stats */}
          <div style={{ marginBottom: '15px', padding: '8px', background: 'rgba(0,0,0,0.3)', borderRadius: '4px' }}>
            <div style={{ fontSize: '10px', color: '#ccc', marginBottom: '4px' }}>Performance:</div>
            <div style={{ fontSize: '11px' }}>
              <div>FPS: <span style={{ color: stats.currentFPS >= 58 ? '#00ff88' : stats.currentFPS >= 45 ? '#ffaa00' : '#ff4444' }}>
                {stats.currentFPS.toFixed(0)}
              </span></div>
              <div>Render: {stats.renderTime.toFixed(1)}ms</div>
              <div>Quality: <span style={{ color: '#00ccff' }}>{currentQuality.toUpperCase()}</span></div>
            </div>
          </div>

          {/* MSAA Enable */}
          <div style={{ marginBottom: '10px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px' }}>
              <input
                type="checkbox"
                checked={msaaEnabled}
                onChange={(e) => setMsaaEnabled(e.target.checked)}
              />
              <span>MSAA Enabled</span>
            </label>
          </div>

          {/* Samples Control */}
          <div style={{ marginBottom: '10px' }}>
            <label style={{ fontSize: '10px', display: 'block', marginBottom: '4px' }}>
              Samples: {samples}x
            </label>
            <div style={{ display: 'flex', gap: '4px' }}>
              {[2, 4, 8].map(sampleCount => (
                <button
                  key={sampleCount}
                  onClick={() => setMsaaSamples(sampleCount)}
                  style={{
                    padding: '4px 8px',
                    fontSize: '9px',
                    background: samples === sampleCount ? 'rgba(0,255,0,0.2)' : 'rgba(0,0,0,0.5)',
                    color: samples === sampleCount ? '#00ff00' : '#ccc',
                    border: `1px solid ${samples === sampleCount ? '#00ff00' : '#333'}`,
                    borderRadius: '3px',
                    cursor: 'pointer'
                  }}
                >
                  {sampleCount}x
                </button>
              ))}
            </div>
          </div>

          {/* FXAA Controls */}
          <div style={{ marginBottom: '10px', padding: '8px', border: '1px solid #333', borderRadius: '4px' }}>
            <h5 style={{ color: '#00ccff', margin: '0 0 6px 0', fontSize: '10px' }}>📐 FXAA</h5>
            
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '10px' }}>
              <input
                type="checkbox"
                checked={fxaa.enabled}
                onChange={(e) => setFxaaEnabled(e.target.checked)}
              />
              <span>FXAA Enabled</span>
            </label>
          </div>

          {/* Quality Presets */}
          <div style={{ marginBottom: '10px' }}>
            <label style={{ fontSize: '10px', display: 'block', marginBottom: '6px' }}>Quality Presets:</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
              {['low', 'medium', 'high', 'ultra'].map(quality => (
                <button
                  key={quality}
                  onClick={() => setQualityPreset(quality)}
                  style={{
                    padding: '4px 6px',
                    fontSize: '9px',
                    background: currentQuality === quality ? 'rgba(0,255,0,0.2)' : 'rgba(0,0,0,0.5)',
                    color: currentQuality === quality ? '#00ff00' : '#ccc',
                    border: `1px solid ${currentQuality === quality ? '#00ff00' : '#333'}`,
                    borderRadius: '3px',
                    cursor: 'pointer',
                    textTransform: 'uppercase'
                  }}
                >
                  {quality}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}


      {/* ❌ SUPPRIMÉ: Footer stats Zustand */}
    </div>
  );
};

export default DebugPanelV2Simple;