import React, { useState, useCallback, useMemo } from 'react';
import { debounce } from 'lodash';

/**
 * BloomControlsPanel - Interface simple pour contrôler le bloom
 * Contrôles basiques et efficaces basés sur UnrealBloomPass
 */
const BloomControlsPanel = ({ onBloomChange, className = '' }) => {
  const [values, setValues] = useState({
    threshold: 0.30,
    strength: 0.80,
    radius: 0.40,
    enabled: true
  });
  
  // Debounce pour éviter le lag - version corrigée
  const debouncedChange = useMemo(
    () => debounce((param, value) => {
      onBloomChange?.(param, value);
    }, 100),
    [onBloomChange]
  );
  
  const handleSliderChange = useCallback((param, value) => {
    setValues(prev => ({ ...prev, [param]: value }));
    debouncedChange(param, value);
  }, [debouncedChange]);
  
  const handleToggle = useCallback(() => {
    const newEnabled = !values.enabled;
    setValues(prev => ({ ...prev, enabled: newEnabled }));
    onBloomChange?.('enabled', newEnabled);
  }, [values.enabled, onBloomChange]);
  
  const handlePreset = useCallback((presetName) => {
    const presets = {
      subtle: { threshold: 0.80, strength: 0.30, radius: 0.20 },
      normal: { threshold: 0.40, strength: 0.80, radius: 0.40 },
      intense: { threshold: 0.10, strength: 1.50, radius: 0.60 }
    };
    
    const preset = presets[presetName];
    if (preset) {
      setValues(prev => ({ ...prev, ...preset }));
      Object.entries(preset).forEach(([param, value]) => {
        onBloomChange?.(param, value);
      });
    }
  }, [onBloomChange]);
  
  const handleReset = useCallback(() => {
    const defaults = { threshold: 0.30, strength: 0.80, radius: 0.40 };
    setValues(prev => ({ ...prev, ...defaults }));
    Object.entries(defaults).forEach(([param, value]) => {
      onBloomChange?.(param, value);
    });
  }, [onBloomChange]);
  
  return (
    <div style={{
      background: 'rgba(0, 0, 0, 0.8)',
      borderRadius: '8px',
      padding: '16px',
      color: 'white',
      fontFamily: "'Courier New', monospace"
    }} className={`bloom-controls-panel ${className}`}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '16px'
      }}>
        <h3 style={{
          margin: 0,
          fontSize: '16px',
          color: '#00ff88'
        }}>
          Bloom Controls
        </h3>
        <div style={{
          display: 'flex',
          alignItems: 'center'
        }}>
          <label style={{
            display: 'flex',
            alignItems: 'center',
            cursor: 'pointer',
            fontSize: '14px'
          }}>
            <input
              type="checkbox"
              checked={values.enabled}
              onChange={handleToggle}
              style={{ display: 'none' }}
            />
            <span style={{
              width: '40px',
              height: '20px',
              background: values.enabled ? '#00ff88' : '#333',
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
                left: values.enabled ? '22px' : '2px',
                transition: 'transform 0.3s'
              }} />
            </span>
            Bloom
          </label>
        </div>
      </div>
      
      <div style={{ marginBottom: '16px' }}>
        <div style={{ marginBottom: '12px' }}>
          <label style={{
            display: 'block',
            fontSize: '14px',
            marginBottom: '4px'
          }}>
            Threshold: {values.threshold.toFixed(2)}
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={values.threshold}
              onChange={(e) => handleSliderChange('threshold', parseFloat(e.target.value))}
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
            <style>{`
              input[type="range"]::-webkit-slider-thumb {
                appearance: none;
                width: 16px;
                height: 16px;
                background: #00ff88;
                border-radius: 50%;
                cursor: pointer;
              }
              input[type="range"]::-moz-range-thumb {
                width: 16px;
                height: 16px;
                background: #00ff88;
                border-radius: 50%;
                cursor: pointer;
              }
            `}</style>
          </label>
        </div>
        
        <div style={{ marginBottom: '12px' }}>
          <label style={{
            display: 'block',
            fontSize: '14px',
            marginBottom: '4px'
          }}>
            Strength: {values.strength.toFixed(2)}
            <input
              type="range"
              min="0"
              max="3"
              step="0.01"
              value={values.strength}
              onChange={(e) => handleSliderChange('strength', parseFloat(e.target.value))}
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
          </label>
        </div>
      
        <div style={{ marginBottom: '12px' }}>
          <label style={{
            display: 'block',
            fontSize: '14px',
            marginBottom: '4px'
          }}>
            Radius: {values.radius.toFixed(2)}
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={values.radius}
              onChange={(e) => handleSliderChange('radius', parseFloat(e.target.value))}
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
          </label>
        </div>
      </div>
      
      <div style={{ marginBottom: '16px' }}>
        <h4 style={{
          margin: '0 0 8px 0',
          fontSize: '14px',
          color: '#00ff88'
        }}>
          Presets
        </h4>
        <div style={{
          display: 'flex',
          gap: '8px',
          marginBottom: '8px'
        }}>
          <button 
            onClick={() => handlePreset('subtle')}
            style={{
              flex: 1,
              padding: '6px 12px',
              background: '#333',
              border: '1px solid #555',
              color: 'white',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px',
              transition: 'all 0.3s'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = '#555';
              e.target.style.borderColor = '#00ff88';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = '#333';
              e.target.style.borderColor = '#555';
            }}
          >
            Subtle
          </button>
          <button 
            onClick={() => handlePreset('normal')}
            style={{
              flex: 1,
              padding: '6px 12px',
              background: '#333',
              border: '1px solid #555',
              color: 'white',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px',
              transition: 'all 0.3s'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = '#555';
              e.target.style.borderColor = '#00ff88';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = '#333';
              e.target.style.borderColor = '#555';
            }}
          >
            Normal
          </button>
          <button 
            onClick={() => handlePreset('intense')}
            style={{
              flex: 1,
              padding: '6px 12px',
              background: '#333',
              border: '1px solid #555',
              color: 'white',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px',
              transition: 'all 0.3s'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = '#555';
              e.target.style.borderColor = '#00ff88';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = '#333';
              e.target.style.borderColor = '#555';
            }}
          >
            Intense
          </button>
        </div>
        <button 
          onClick={handleReset}
          style={{
            width: '100%',
            padding: '8px',
            background: '#ff4444',
            border: 'none',
            color: 'white',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px',
            transition: 'background 0.3s'
          }}
          onMouseEnter={(e) => {
            e.target.style.background = '#ff6666';
          }}
          onMouseLeave={(e) => {
            e.target.style.background = '#ff4444';
          }}
        >
          Reset
        </button>
      </div>
    </div>
  );
};

export default BloomControlsPanel;