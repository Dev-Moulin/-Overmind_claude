// 🎯 Composant de Démonstration FrameSchedulerMachine - Atome D1
// Interface de test et de monitoring pour le premier atome de la refactorisation

import React from 'react';
import { useFrameScheduler, useFrameSchedulerDebug } from './useFrameScheduler';

// 🎯 Composant Principal de Démonstration
export const FrameSchedulerDemo = () => {
  const frameScheduler = useFrameScheduler(true, true); // Auto-start + debug
  const debug = useFrameSchedulerDebug();

  const {
    isRunning,
    isPaused,
    isRecovering,
    hasError,
    performance,
    start,
    stop,
    pause,
    resume,
    toggleDebugMode,
    enableStepMode,
    disableStepMode,
    stepFrame,
    resetMetrics,
    getStateDescription,
    getPerformanceStatus,
    getSystemsStatus
  } = frameScheduler;

  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      right: '20px',
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      color: 'white',
      padding: '15px',
      borderRadius: '8px',
      fontFamily: 'monospace',
      fontSize: '12px',
      minWidth: '300px',
      zIndex: 10000
    }}>
      <h3 style={{ margin: '0 0 10px 0', color: '#00ff88' }}>
        🎯 FrameScheduler - Atome D1
      </h3>

      {/* 📊 État Général */}
      <div style={{ marginBottom: '10px' }}>
        <div><strong>État:</strong> {getStateDescription()}</div>
        <div style={{
          color: isRunning ? '#00ff88' : isPaused ? '#ffaa00' : '#ff4444'
        }}>
          <strong>Statut:</strong> {
            isRunning ? '🏃 Running' :
            isPaused ? '⏸️ Paused' :
            isRecovering ? '🔄 Recovering' :
            hasError ? '❌ Error' :
            '💤 Idle'
          }
        </div>
      </div>

      {/* 📊 Métriques de Performance */}
      <div style={{ marginBottom: '10px' }}>
        <h4 style={{ margin: '0 0 5px 0' }}>📊 Performance</h4>
        <div>FPS: <span style={{
          color: getPerformanceStatus() === 'good' ? '#00ff88' :
                getPerformanceStatus() === 'warning' ? '#ffaa00' : '#ff4444'
        }}>{performance.fps}</span> / {performance.averageFPS} avg</div>
        <div>Frames: {performance.frameCount}</div>
        <div>Frame Time: {performance.maxFrameTime.toFixed(2)}ms max</div>
        <div>Status: <span style={{
          color: getPerformanceStatus() === 'good' ? '#00ff88' :
                getPerformanceStatus() === 'warning' ? '#ffaa00' : '#ff4444'
        }}>{getPerformanceStatus()}</span></div>
      </div>

      {/* 🎯 Systèmes Actifs */}
      <div style={{ marginBottom: '10px' }}>
        <h4 style={{ margin: '0 0 5px 0' }}>🎯 Systèmes</h4>
        {Object.entries(getSystemsStatus()).map(([system, enabled]) => (
          <div key={system} style={{
            color: enabled ? '#00ff88' : '#666'
          }}>
            {enabled ? '✅' : '❌'} {system}
          </div>
        ))}
      </div>

      {/* 🎮 Contrôles */}
      <div style={{ marginBottom: '10px' }}>
        <h4 style={{ margin: '0 0 5px 0' }}>🎮 Contrôles</h4>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
          <button onClick={start} disabled={isRunning} style={buttonStyle}>
            ▶️ Start
          </button>
          <button onClick={stop} disabled={!isRunning && !isPaused} style={buttonStyle}>
            ⏹️ Stop
          </button>
          <button onClick={pause} disabled={!isRunning} style={buttonStyle}>
            ⏸️ Pause
          </button>
          <button onClick={resume} disabled={!isPaused} style={buttonStyle}>
            ▶️ Resume
          </button>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginTop: '5px' }}>
          <button onClick={toggleDebugMode} style={buttonStyle}>
            🐛 Debug
          </button>
          <button onClick={enableStepMode} style={buttonStyle}>
            👣 Step Mode
          </button>
          <button onClick={disableStepMode} style={buttonStyle}>
            🏃 Normal
          </button>
          <button onClick={stepFrame} style={buttonStyle}>
            ⏭️ Step
          </button>
        </div>
        <div style={{ marginTop: '5px' }}>
          <button onClick={resetMetrics} style={buttonStyle}>
            📊 Reset Metrics
          </button>
        </div>
      </div>

      {/* 🚨 Erreurs */}
      {hasError && (
        <div style={{
          backgroundColor: '#ff4444',
          color: 'white',
          padding: '5px',
          borderRadius: '4px',
          marginBottom: '10px'
        }}>
          <h4 style={{ margin: '0 0 5px 0' }}>🚨 Erreur</h4>
          <div>{frameScheduler.context.error.errorType}</div>
          <div style={{ fontSize: '10px' }}>
            {frameScheduler.context.error.errorMessage}
          </div>
        </div>
      )}

      {/* 🔄 Récupération */}
      {isRecovering && (
        <div style={{
          backgroundColor: '#ffaa00',
          color: 'black',
          padding: '5px',
          borderRadius: '4px',
          marginBottom: '10px'
        }}>
          <h4 style={{ margin: '0 0 5px 0' }}>🔄 Récupération</h4>
          <div>Progression: {Math.round(frameScheduler.context.recovery.recoveryProgress * 100)}%</div>
        </div>
      )}

      {/* 🐛 Debug Info */}
      {frameScheduler.context.controls.debugMode && (
        <div style={{
          backgroundColor: 'rgba(0, 100, 200, 0.3)',
          padding: '5px',
          borderRadius: '4px',
          marginTop: '10px',
          fontSize: '10px'
        }}>
          <h4 style={{ margin: '0 0 5px 0' }}>🐛 Debug</h4>
          <div>State Value: {JSON.stringify(debug.stateValue)}</div>
          <div>Next Events: {debug.nextEvents?.join(', ')}</div>
          <div>Recovery Attempts: {frameScheduler.context.error.recoveryAttempts}</div>
        </div>
      )}
    </div>
  );
};

// 🎯 Composant Compact de Monitoring
export const FrameSchedulerMonitor = () => {
  const { performance, getPerformanceStatus, isRunning } = useFrameScheduler(false);

  if (!isRunning) return null;

  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      left: '20px',
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      color: 'white',
      padding: '8px',
      borderRadius: '4px',
      fontFamily: 'monospace',
      fontSize: '11px',
      zIndex: 9999
    }}>
      <div style={{
        color: getPerformanceStatus() === 'good' ? '#00ff88' :
              getPerformanceStatus() === 'warning' ? '#ffaa00' : '#ff4444'
      }}>
        FPS: {performance.fps} | Avg: {performance.averageFPS}
      </div>
    </div>
  );
};

// 🎯 Composant d'Intégration dans Canvas3D
export const FrameSchedulerIntegration = ({ children, showMonitor = false, showDemo = false }) => {
  // Initialise le FrameScheduler automatiquement
  useFrameScheduler(true, process.env.NODE_ENV === 'development');

  return (
    <>
      {children}
      {showMonitor && <FrameSchedulerMonitor />}
      {showDemo && <FrameSchedulerDemo />}
    </>
  );
};

// 🎨 Styles des boutons
const buttonStyle = {
  backgroundColor: '#333',
  color: 'white',
  border: '1px solid #555',
  borderRadius: '3px',
  padding: '2px 6px',
  fontSize: '10px',
  cursor: 'pointer',
  margin: '0'
};

export default FrameSchedulerDemo;