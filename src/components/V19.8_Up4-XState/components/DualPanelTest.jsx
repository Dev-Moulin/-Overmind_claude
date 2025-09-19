/**
 * 🔍 Dual Panel Test Component
 * Affiche les deux panels côte à côte pour comparaison et test
 */

import React, { useState } from 'react';
import DebugPanel from './DebugPanel.jsx';
import DebugPanelV2Simple from './DebugPanelV2Simple.jsx';

const DualPanelTest = ({ 
  // Props pour DebugPanel original (legacy) - TOUTES LES PROPS REQUISES
  stateController = null,
  pbrLightingController = null,
  bloomSystem = null,
  renderer = null,
  particleSystemController = null,
  floatingSpace = null,
  onColorBloomChange = null,
  setExposure = null,
  onSecurityStateChange = null,
  securityState = 'NORMAL',
  onTriggerTransition = null,
  isTransitioning = false,
  setBackground = null,
  getBackground = null,
  mouseControlMode = 'navigation',
  
  // Props additionnelles requises par DebugPanel
  forceShowRings = false,
  onToggleForceRings = () => {},
  magicRingsInfo = [],
  currentAnimation = 'permanent'
}) => {
  const [showOriginal, setShowOriginal] = useState(true);
  const [showV2, setShowV2] = useState(true);
  const [comparisonMode, setComparisonMode] = useState('side-by-side'); // 'side-by-side', 'overlay', 'toggle'

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.1)',
      zIndex: 999,
      pointerEvents: 'none'
    }}>
      
      {/* Control Panel - Repositionné en bas à gauche */}
      <div style={{
        position: 'absolute',
        bottom: '10px',
        left: '10px',
        background: 'rgba(0,0,0,0.9)',
        color: 'white',
        padding: '15px',
        borderRadius: '8px',
        border: '2px solid #ffaa00',
        fontSize: '11px',
        pointerEvents: 'auto',
        zIndex: 1002
      }}>
        <h3 style={{ margin: '0 0 10px 0', color: '#ffaa00', textAlign: 'center' }}>
          🔍 DUAL PANEL TEST
        </h3>
        
        <div style={{ marginBottom: '10px' }}>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px' }}>
              <input
                type="checkbox"
                checked={showOriginal}
                onChange={(e) => setShowOriginal(e.target.checked)}
              />
              Show Original (Legacy)
            </label>
            
            <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px' }}>
              <input
                type="checkbox"
                checked={showV2}
                onChange={(e) => setShowV2(e.target.checked)}
              />
              Show V2 (Zustand)
            </label>
          </div>
          
          <div style={{ marginBottom: '8px' }}>
            <label style={{ fontSize: '10px', display: 'block', marginBottom: '4px' }}>
              Comparison Mode:
            </label>
            <select
              value={comparisonMode}
              onChange={(e) => setComparisonMode(e.target.value)}
              style={{
                padding: '4px',
                fontSize: '10px',
                background: '#333',
                color: 'white',
                border: '1px solid #555',
                borderRadius: '3px'
              }}
            >
              <option value="side-by-side">Side by Side</option>
              <option value="overlay">Overlay</option>
              <option value="toggle">Toggle</option>
            </select>
          </div>
        </div>
        
        <div style={{ 
          fontSize: '9px', 
          color: '#ccc',
          textAlign: 'center',
          borderTop: '1px solid #555',
          paddingTop: '8px'
        }}>
          Compare functionality and UI between panels
        </div>
      </div>

      {/* Panels Display */}
      {comparisonMode === 'side-by-side' && (
        <>
          {/* Original Panel (Left) */}
          {showOriginal && (
            <div style={{ pointerEvents: 'auto' }}>
              <DebugPanel
                showDebug={true}
                forceShowRings={forceShowRings}
                onToggleForceRings={onToggleForceRings}
                magicRingsInfo={magicRingsInfo}
                currentAnimation={currentAnimation}
                stateController={stateController}
                pbrLightingController={pbrLightingController}
                bloomSystem={bloomSystem}
                renderer={renderer}
                particleSystemController={particleSystemController}
                floatingSpace={floatingSpace}
                onColorBloomChange={onColorBloomChange}
                setExposure={setExposure}
                onSecurityStateChange={onSecurityStateChange}
                securityState={securityState}
                onTriggerTransition={onTriggerTransition}
                isTransitioning={isTransitioning}
                setBackground={setBackground}
                getBackground={getBackground}
                mouseControlMode={mouseControlMode}
                style={{
                  position: 'absolute',
                  top: '10px',
                  left: '10px',
                  border: '2px solid #ff4444',
                  boxShadow: '0 0 20px rgba(255, 68, 68, 0.3)'
                }}
              />
            </div>
          )}

          {/* V2 Panel (Right) */}
          {showV2 && (
            <div style={{ pointerEvents: 'auto' }}>
              <DebugPanelV2Simple
                style={{
                  position: 'absolute',
                  top: '10px',
                  right: '10px',
                  left: 'auto',
                  border: '2px solid #00ff00',
                  boxShadow: '0 0 20px rgba(0, 255, 0, 0.3)'
                }}
              />
            </div>
          )}
        </>
      )}

      {comparisonMode === 'overlay' && (
        <>
          {/* Original Panel (Background) */}
          {showOriginal && (
            <div style={{ pointerEvents: 'auto', opacity: showV2 ? 0.5 : 1 }}>
              <DebugPanel
                showDebug={true}
                forceShowRings={forceShowRings}
                onToggleForceRings={onToggleForceRings}
                magicRingsInfo={magicRingsInfo}
                currentAnimation={currentAnimation}
                stateController={stateController}
                pbrLightingController={pbrLightingController}
                bloomSystem={bloomSystem}
                renderer={renderer}
                particleSystemController={particleSystemController}
                floatingSpace={floatingSpace}
                onColorBloomChange={onColorBloomChange}
                setExposure={setExposure}
                onSecurityStateChange={onSecurityStateChange}
                securityState={securityState}
                onTriggerTransition={onTriggerTransition}
                isTransitioning={isTransitioning}
                setBackground={setBackground}
                getBackground={getBackground}
                mouseControlMode={mouseControlMode}
                style={{
                  position: 'absolute',
                  top: '10px',
                  right: '10px',
                  border: '2px solid #ff4444',
                  boxShadow: '0 0 20px rgba(255, 68, 68, 0.3)'
                }}
              />
            </div>
          )}

          {/* V2 Panel (Foreground) */}
          {showV2 && (
            <div style={{ pointerEvents: 'auto' }}>
              <DebugPanelV2Simple
                style={{
                  position: 'absolute',
                  top: '10px',
                  right: '340px',
                  border: '2px solid #00ff00',
                  boxShadow: '0 0 20px rgba(0, 255, 0, 0.3)'
                }}
              />
            </div>
          )}
        </>
      )}

      {comparisonMode === 'toggle' && (
        <>
          {/* Show only one at a time */}
          {showOriginal && !showV2 && (
            <div style={{ pointerEvents: 'auto' }}>
              <DebugPanel
                showDebug={true}
                forceShowRings={forceShowRings}
                onToggleForceRings={onToggleForceRings}
                magicRingsInfo={magicRingsInfo}
                currentAnimation={currentAnimation}
                stateController={stateController}
                pbrLightingController={pbrLightingController}
                bloomSystem={bloomSystem}
                renderer={renderer}
                particleSystemController={particleSystemController}
                floatingSpace={floatingSpace}
                onColorBloomChange={onColorBloomChange}
                setExposure={setExposure}
                onSecurityStateChange={onSecurityStateChange}
                securityState={securityState}
                onTriggerTransition={onTriggerTransition}
                isTransitioning={isTransitioning}
                setBackground={setBackground}
                getBackground={getBackground}
                mouseControlMode={mouseControlMode}
                style={{
                  position: 'absolute',
                  top: '10px',
                  right: '10px',
                  border: '2px solid #ff4444',
                  boxShadow: '0 0 20px rgba(255, 68, 68, 0.3)'
                }}
              />
            </div>
          )}

          {showV2 && !showOriginal && (
            <div style={{ pointerEvents: 'auto' }}>
              <DebugPanelV2Simple
                style={{
                  position: 'absolute',
                  top: '10px',
                  right: '10px',
                  border: '2px solid #00ff00',
                  boxShadow: '0 0 20px rgba(0, 255, 0, 0.3)'
                }}
              />
            </div>
          )}

          {showV2 && showOriginal && (
            <div style={{ pointerEvents: 'auto' }}>
              <DebugPanelV2Simple
                style={{
                  position: 'absolute',
                  top: '10px',
                  right: '10px',
                  border: '2px solid #00ff00',
                  boxShadow: '0 0 20px rgba(0, 255, 0, 0.3)'
                }}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default DualPanelTest;