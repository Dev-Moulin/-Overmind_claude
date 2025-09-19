// src/App.jsx - V20.0 XState Store Migration System
import React, { useState } from 'react';
import V19Scene from './components/V19.8_refacto/index.js';
import V20Scene from './components/V20.0_XState/index.js';
import './App.css';
import './index.css';

/**
 * 🚀 V20.0_XState - XState Store Migration System
 * 
 * Approche de transition:
 * - 🔄 Switch entre V19.8 (Zustand) et V20.0 (XState)
 * - 🎯 XState Store pour synchronisation parfaite UI/Render
 * - ✅ Résolution des problèmes de race conditions
 * - 🛠️ Tests side-by-side des deux versions
 * - 📊 Migration progressive event-driven
 * 
 * Architecture: App.jsx → [V19.8_refacto | V20.0_XState] → Store Management
 */
function App() {
  // Switch pour basculer entre les versions - Démarre sur V20.0 XState
  const [useV20, setUseV20] = useState(true);

  return (
    <div className="App">
      {/* Version Selector */}
      <div style={{
        position: 'fixed',
        top: '10px',
        right: '10px',
        zIndex: 1000,
        color: 'white',
        padding: '8px 12px',
        borderRadius: '6px',
        fontFamily: 'monospace',
        fontSize: '12px',
      }}>
        <label>
          <input
            type="checkbox"
            checked={useV20}
            onChange={(e) => setUseV20(e.target.checked)}
            style={{ marginRight: '8px' }}
          />
          Use V20.0 XState ({useV20 ? 'XState Store' : 'V19.8 Zustand'})
        </label>
      </div>

      {/* Scene Renderer */}
      {useV20 ? <V20Scene /> : <V19Scene />}
    </div>
  );
}

export default App;