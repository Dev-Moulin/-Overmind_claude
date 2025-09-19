// V20Scene.jsx - Version simplifiée pour architecture V20.0
// 1 couleur → 3 intensités → 3 bloom globaux

import React from 'react';
import { Canvas } from '@react-three/fiber';
import { useSceneMachine } from './stores/xstate/hooks/useSceneMachine.js';
import XStateDebugPanel from './components/XStateDebugPanel.jsx';
import { RenderSyncToast } from './components/RenderSyncToast.jsx';


// Mock 3D Scene Component pour tester
const MockScene = () => {
  const {
    globalColor,
    intensities,
    isAnimationInProgress
  } = useSceneMachine();

  return (
    <group>
      {/* Mock Iris */}
      <mesh position={[0, 0, 0]}>
        <ringGeometry args={[0.3, 0.4, 32]} />
        <meshStandardMaterial 
          color={globalColor}
          emissive={globalColor}
          emissiveIntensity={intensities.iris}
          transparent
          opacity={0.8}
        />
      </mesh>

      {/* Mock Eye Rings */}
      <mesh position={[0, 0, 0.1]}>
        <ringGeometry args={[0.5, 0.6, 32]} />
        <meshStandardMaterial 
          color={globalColor}
          emissive={globalColor}
          emissiveIntensity={intensities.eyeRings}
          transparent
          opacity={0.7}
        />
      </mesh>

      {/* Mock Reveal */}
      <mesh position={[0, 0, 0.2]}>
        <ringGeometry args={[0.7, 0.8, 32]} />
        <meshStandardMaterial 
          color={globalColor}
          emissive={globalColor}
          emissiveIntensity={intensities.reveal}
          transparent
          opacity={0.6}
        />
      </mesh>

      {/* Animation Indicator */}
      {isAnimationInProgress && (
        <mesh position={[0, -1.5, 0]}>
          <boxGeometry args={[2, 0.2, 0.1]} />
          <meshStandardMaterial color="#ff4444" emissive="#ff0000" />
        </mesh>
      )}

      {/* Lighting */}
      <ambientLight intensity={0.5} />
      <pointLight position={[2, 2, 2]} intensity={1} />
    </group>
  );
};

const V20Scene = () => {
  const { isReady } = useSceneMachine();

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      {/* Header informatif */}
      <div style={{
        position: 'absolute',
        top: '10px',
        left: '10px',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        color: 'white',
        padding: '10px',
        borderRadius: '5px',
        fontFamily: 'monospace',
        fontSize: '12px',
        zIndex: 999
      }}>
        <div>🚀 V20.0 XState Scene - Simplified</div>
        <div>System: {isReady ? '✅ Ready' : '⏳ Initializing'}</div>
      </div>

      {/* Canvas 3D */}
      <Canvas
        camera={{ position: [0, 0, 3], fov: 75 }}
        style={{ background: '#0a0a0a' }}
      >
        <MockScene />
      </Canvas>

      {/* Debug Panel */}
      <XStateDebugPanel />

      {/* RenderSync Toast Notifications */}
      <RenderSyncToast />
    </div>
  );
};

export default V20Scene;