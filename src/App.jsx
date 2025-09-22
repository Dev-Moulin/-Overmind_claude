// src/App.jsx - V19.8_Up4-XState System
import React, { useState } from 'react';
import V3Scene from './components/V19.8_Up4-XState/index.js';
import VisualEffectsTest from './components/V19.8_Up4-XState/machines/visualEffects/VisualEffectsTest.tsx';
import './App.css';
import './index.css';

/**
 * 🚀 V19.8_Up4-XState
 *
 * XState version with:
 * - 🎯 XState state management
 * - 🔄 Component-based architecture
 * - 💾 State persistence
 * - 🎛️ Advanced rendering controls
 */
function App() {
  const [showTest, setShowTest] = useState(false);

  return (
    <div className="App">
      {/* Bouton pour basculer entre la scène principale et le test */}
      <div style={{ position: 'fixed', top: '10px', right: '10px', zIndex: 1000 }}>
        <button
          onClick={() => setShowTest(!showTest)}
          style={{
            padding: '10px 20px',
            background: showTest ? '#f44336' : '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          {showTest ? '🎬 Back to Scene' : '🧪 Test VisualEffects'}
        </button>
      </div>

      {showTest ? <VisualEffectsTest /> : <V3Scene />}
    </div>
  );
}

export default App;