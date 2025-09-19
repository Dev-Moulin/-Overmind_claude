/**
 * 🧪 TEST ZUSTAND DEBUG PANEL - Phase 1
 * Version minimaliste pour tester l'intégration Zustand
 */

import React from 'react';
import useSceneStore from '../stores/sceneStore.js';

const TestZustandDebugPanel = ({ showDebug = true }) => {
  // === HOOKS ZUSTAND PHASE 1 (SIMPLIFIÉ) ===
  const bloom = useSceneStore((state) => state.bloom);
  const setBloomGlobal = useSceneStore((state) => state.setBloomGlobal);
  const setBloomGroup = useSceneStore((state) => state.setBloomGroup);
  const resetBloom = useSceneStore((state) => state.resetBloom);
  
  // === HANDLERS ===
  const handleTestPreset = () => {
    // Test application d'un preset simplifié
    const testPreset = {
      bloom: {
        enabled: true,
        threshold: 0.2,
        strength: 0.8,
        radius: 0.5
      },
      bloomGroups: {
        iris: {
          threshold: 0.1,
          strength: 1.2,
          radius: 0.6,
          emissiveIntensity: 2.0
        }
      }
    };
    
    console.log('Test preset would be applied:', testPreset);
  };
  
  if (!showDebug) return null;
  
  return (
    <div style={{
      position: "fixed",
      top: "10px",
      right: "10px",
      width: "350px",
      background: "rgba(0, 0, 0, 0.95)",
      color: "white",
      padding: "15px",
      borderRadius: "8px",
      fontSize: "11px",
      maxHeight: "90vh",
      overflowY: "auto",
      zIndex: 1000,
      border: "2px solid #4CAF50"
    }}>
      {/* === HEADER === */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '15px',
        borderBottom: '1px solid #333',
        paddingBottom: '10px'
      }}>
        <h3 style={{ margin: 0, color: '#4CAF50' }}>
          🧪 Zustand Phase 1 Test
        </h3>
        <div style={{ fontSize: '9px', color: '#888' }}>
          {bloom.enabled ? '🟢 Active' : '🔴 Inactive'}
        </div>
      </div>
      
      {/* === STATISTIQUES SIMPLES === */}
      <div style={{
        background: 'rgba(76, 175, 80, 0.1)',
        padding: '8px',
        borderRadius: '4px',
        marginBottom: '15px'
      }}>
        <h4 style={{ margin: '0 0 5px 0', color: '#4CAF50' }}>📊 Simple Stats</h4>
        <div style={{ fontSize: '10px', lineHeight: '1.3' }}>
          <div>Enabled: {bloom.enabled ? 'Yes' : 'No'}</div>
          <div>Threshold: {bloom.threshold.toFixed(2)}</div>
          <div>Strength: {bloom.strength.toFixed(2)}</div>
          <div>Groups: {Object.keys(bloom.groups).length}</div>
        </div>
      </div>
      
      {/* === CONTRÔLES GLOBAUX === */}
      <div style={{ marginBottom: '15px' }}>
        <h4 style={{ margin: '0 0 10px 0', color: '#FF9800' }}>
          🌟 Global Bloom
        </h4>
        
        <div style={{ marginBottom: '8px' }}>
          <label style={{ display: 'block', marginBottom: '3px' }}>
            Threshold: {bloom.threshold.toFixed(2)}
          </label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={bloom.threshold}
            onChange={(e) => setBloomGlobal('threshold', parseFloat(e.target.value))}
            style={{ width: '100%' }}
          />
        </div>
        
        <div style={{ marginBottom: '8px' }}>
          <label style={{ display: 'block', marginBottom: '3px' }}>
            Strength: {bloom.strength.toFixed(2)}
          </label>
          <input
            type="range"
            min="0"
            max="2"
            step="0.01"
            value={bloom.strength}
            onChange={(e) => setBloomGlobal('strength', parseFloat(e.target.value))}
            style={{ width: '100%' }}
          />
        </div>
      </div>
      
      {/* === CONTRÔLES GROUPES === */}
      <div style={{ marginBottom: '15px' }}>
        <h4 style={{ margin: '0 0 10px 0', color: '#2196F3' }}>
          👁️ Iris Group
        </h4>
        
        {bloom.groups.iris && (
          <div>
            <div style={{ marginBottom: '6px' }}>
              <label style={{ display: 'block', marginBottom: '3px', fontSize: '10px' }}>
                Strength: {bloom.groups.iris.strength.toFixed(2)}
              </label>
              <input
                type="range"
                min="0"
                max="2"
                step="0.01"
                value={bloom.groups.iris.strength}
                onChange={(e) => setBloomGroup('iris', 'strength', parseFloat(e.target.value))}
                style={{ width: '100%' }}
              />
            </div>
            
            <div style={{ marginBottom: '6px' }}>
              <label style={{ display: 'block', marginBottom: '3px', fontSize: '10px' }}>
                Emissive: {bloom.groups.iris.emissiveIntensity?.toFixed(1) || '0'}
              </label>
              <input
                type="range"
                min="0"
                max="5"
                step="0.1"
                value={bloom.groups.iris.emissiveIntensity || 0}
                onChange={(e) => setBloomGroup('iris', 'emissiveIntensity', parseFloat(e.target.value))}
                style={{ width: '100%' }}
              />
            </div>
          </div>
        )}
      </div>
      
      {/* === ACTIONS TEST === */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '8px',
        marginBottom: '15px'
      }}>
        <button
          onClick={handleTestPreset}
          style={{
            padding: '8px',
            background: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            fontSize: '9px',
            cursor: 'pointer'
          }}
        >
          🎯 Test Preset
        </button>
        
        <button
          onClick={resetBloom}
          style={{
            padding: '8px',
            background: '#f44336',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            fontSize: '9px',
            cursor: 'pointer'
          }}
        >
          🔄 Reset Bloom
        </button>
        
        <button
          onClick={() => console.log('Bloom state:', bloom)}
          style={{
            padding: '8px',
            background: '#2196F3',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            fontSize: '9px',
            cursor: 'pointer'
          }}
        >
          📝 Log State
        </button>
        
        <button
          onClick={() => console.log('Export:', JSON.stringify(bloom, null, 2))}
          style={{
            padding: '8px',
            background: '#FF9800',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            fontSize: '9px',
            cursor: 'pointer'
          }}
        >
          📋 Export
        </button>
      </div>
      
      {/* === DEBUG INFO === */}
      <div style={{
        borderTop: '1px solid #333',
        paddingTop: '10px',
        fontSize: '9px',
        color: '#666'
      }}>
        <div>Store Version: {bloom.metadata?.version || 'N/A'}</div>
        <div>Last Modified: {new Date().toLocaleTimeString()}</div>
        <div>Groups: {Object.keys(bloom.groups).join(', ')}</div>
      </div>
    </div>
  );
};

export default TestZustandDebugPanel;