// 🧪 VisualEffectsTest - Test d'intégration pour useVisualEffects
// Test simple pour valider que l'architecture fonctionne

import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { useVisualEffects } from './useVisualEffects';

export const VisualEffectsTest: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [renderer, setRenderer] = useState<THREE.WebGLRenderer | null>(null);
  const [scene, setScene] = useState<THREE.Scene | null>(null);
  const [camera, setCamera] = useState<THREE.Camera | null>(null);

  // Configuration Three.js basique
  useEffect(() => {
    if (!mountRef.current) return;

    // Scene
    const newScene = new THREE.Scene();

    // Camera
    const newCamera = new THREE.PerspectiveCamera(75, 800 / 600, 0.1, 1000);
    newCamera.position.z = 5;

    // Renderer
    const newRenderer = new THREE.WebGLRenderer({ antialias: true });
    newRenderer.setSize(800, 600);
    newRenderer.setClearColor(0x111111);

    // ✅ CORRECTION: Forcer la taille du canvas
    newRenderer.domElement.style.width = '800px';
    newRenderer.domElement.style.height = '600px';
    newRenderer.domElement.style.maxWidth = '100%';
    newRenderer.domElement.style.maxHeight = '100%';

    mountRef.current.appendChild(newRenderer.domElement);

    // Quelques objets de test
    const geometry = new THREE.BoxGeometry();

    // Iris (groupe test)
    const irisMaterial = new THREE.MeshStandardMaterial({
      color: 0x4444ff,
      emissive: 0x002200
    });
    const irisMesh = new THREE.Mesh(geometry, irisMaterial);
    irisMesh.position.x = -2;
    irisMesh.name = 'iris_test';
    newScene.add(irisMesh);

    // Eye rings (groupe test)
    const eyeRingMaterial = new THREE.MeshStandardMaterial({
      color: 0xff4444,
      emissive: 0x002200
    });
    const eyeRingMesh = new THREE.Mesh(geometry, eyeRingMaterial);
    eyeRingMesh.position.x = 2;
    eyeRingMesh.name = 'eyeRings_test';
    newScene.add(eyeRingMesh);

    // Lumière
    const light = new THREE.AmbientLight(0x404040, 0.5);
    newScene.add(light);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(1, 1, 1);
    newScene.add(directionalLight);

    setScene(newScene);
    setCamera(newCamera);
    setRenderer(newRenderer);

    // Animation basique
    const animate = () => {
      requestAnimationFrame(animate);
      irisMesh.rotation.x += 0.01;
      irisMesh.rotation.y += 0.01;
      eyeRingMesh.rotation.x -= 0.01;
      eyeRingMesh.rotation.y -= 0.01;
      newRenderer.render(newScene, newCamera);
    };
    animate();

    return () => {
      if (mountRef.current && newRenderer.domElement) {
        mountRef.current.removeChild(newRenderer.domElement);
      }
      newRenderer.dispose();
    };
  }, []);

  // ✅ CORRECTION: Callbacks stables avec useCallback
  const handleStateChange = useCallback((state: any) => {
    console.log('🎨 VisualEffects State Change:', state.value);
  }, []);

  const handleError = useCallback((error: Error) => {
    console.error('❌ VisualEffects Error:', error);
  }, []);

  // Hook useVisualEffects avec callbacks stables
  const visualEffects = useVisualEffects({
    renderer,
    scene,
    camera,
    autoInit: true,
    enablePerformanceMonitoring: false, // ✅ CORRECTION: Désactivé pour éviter spam
    debugMode: true,
    onStateChange: handleStateChange,
    onError: handleError
  });

  // ✅ Event Pipeline Tracer (recommandé par recherche)
  const traceEventPipeline = useCallback(() => {
    console.group('🔬 Event Pipeline Trace');
    console.log('1. Handler called');
    console.log('2. visualEffects object:', !!visualEffects);
    console.log('3. bloom controls:', !!visualEffects.bloom);
    console.log('4. enable function:', typeof visualEffects.bloom?.enable);
    console.log('5. Current state:', visualEffects.state?.value);
    console.log('6. Context bloom:', visualEffects.context?.bloom?.global);
    console.log('7. Send function:', typeof visualEffects.send);
    console.groupEnd();
  }, [visualEffects]);

  // Test des fonctionnalités
  const handleTestBloom = useCallback(() => {
    console.log('🧪 Testing Bloom Enable...');
    traceEventPipeline();

    try {
      visualEffects.bloom.enable();
      console.log('✅ visualEffects.bloom.enable() called successfully');
    } catch (error) {
      console.error('❌ Error calling visualEffects.bloom.enable():', error);
    }
  }, [visualEffects, traceEventPipeline]);

  const handleTestBloomDisable = useCallback(() => {
    console.log('🧪 Testing Bloom Disable...');
    try {
      visualEffects.bloom.disable();
      console.log('✅ Bloom disable called');
    } catch (error) {
      console.error('❌ Bloom disable failed:', error);
    }
  }, [visualEffects]);

  const handleTestDetectObjects = useCallback(() => {
    console.log('🧪 Testing Object Detection...');
    try {
      if (scene) {
        // Créer un groupe de test avec nos objets
        const testGroup = new THREE.Group();
        scene.children.forEach(child => {
          if (child instanceof THREE.Mesh) {
            testGroup.add(child.clone());
          }
        });
        visualEffects.objects.detect(testGroup);
        console.log('✅ Object detection called');
      } else {
        console.warn('⚠️ No scene available');
      }
    } catch (error) {
      console.error('❌ Object detection failed:', error);
    }
  }, [visualEffects, scene]);

  const handleTestSecurity = useCallback(() => {
    console.log('🧪 Testing Security Preset...');
    try {
      visualEffects.security.setPreset('DANGER');
      console.log('✅ Security preset called');
    } catch (error) {
      console.error('❌ Security preset failed:', error);
    }
  }, [visualEffects]);

  const handleTestPBR = useCallback(() => {
    console.log('🧪 Testing PBR Enable...');
    try {
      visualEffects.pbr.enable();
      console.log('✅ PBR enable called');
    } catch (error) {
      console.error('❌ PBR enable failed:', error);
    }
  }, [visualEffects]);

  return (
    <div style={{ padding: '20px' }}>
      <h2>🧪 VisualEffects Test Integration</h2>


      {/* Canvas Three.js */}
      <div
        ref={mountRef}
        style={{
          border: '2px solid #333',
          marginBottom: '20px',
          borderRadius: '8px',
          width: '800px',
          height: '600px',
          maxWidth: '100%',
          overflow: 'hidden',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          position: 'relative',
          zIndex: 1
        }}
      />

      {/* État */}
      <div style={{ marginBottom: '20px' }}>
        <h3>📊 État Actuel</h3>
        <div style={{ fontFamily: 'monospace', background: '#f5f5f5', padding: '10px', borderRadius: '4px' }}>
          <div>🌟 Bloom: {visualEffects.bloom.isEnabled ? '✅ Activé' : '❌ Désactivé'}</div>
          <div>🎨 PBR: {visualEffects.pbr.isActive ? '✅ Actif' : '❌ Inactif'}</div>
          <div>🔒 Security: {visualEffects.security.currentPreset || 'NORMAL'}</div>
          <div>📊 FPS: {visualEffects.performance.fps}</div>
          <div>🎭 Objets:
            iris: {visualEffects.objects.counts.iris},
            eyeRings: {visualEffects.objects.counts.eyeRings}
          </div>
        </div>
      </div>

      {/* Contrôles de test */}
      <div style={{
        display: 'flex',
        gap: '10px',
        flexWrap: 'wrap',
        position: 'relative',
        zIndex: 1000,
        padding: '10px',
        background: 'rgba(255, 255, 255, 0.95)',
        borderRadius: '8px',
        border: '2px solid #ddd'
      }}>
        <button
          onClick={handleTestBloom}
          style={{
            padding: '8px 16px',
            background: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 'bold',
            position: 'relative',
            zIndex: 1001,
            pointerEvents: 'auto'
          }}
        >
          🌟 Enable Bloom
        </button>

        <button
          onClick={handleTestBloomDisable}
          style={{
            padding: '8px 16px',
            background: '#f44336',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 'bold',
            position: 'relative',
            zIndex: 1001,
            pointerEvents: 'auto'
          }}
        >
          🌟 Disable Bloom
        </button>

        <button
          onClick={handleTestPBR}
          style={{
            padding: '8px 16px',
            background: '#2196F3',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 'bold',
            position: 'relative',
            zIndex: 1001,
            pointerEvents: 'auto'
          }}
        >
          🎨 Enable PBR
        </button>

        <button
          onClick={handleTestDetectObjects}
          style={{
            padding: '8px 16px',
            background: '#FF9800',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 'bold',
            position: 'relative',
            zIndex: 1001,
            pointerEvents: 'auto'
          }}
        >
          🔍 Detect Objects
        </button>

        <button
          onClick={handleTestSecurity}
          style={{
            padding: '8px 16px',
            background: '#9C27B0',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 'bold',
            position: 'relative',
            zIndex: 1001,
            pointerEvents: 'auto'
          }}
        >
          🔒 Security DANGER
        </button>
      </div>

      {/* Debug info */}
      <div style={{ marginTop: '20px', fontSize: '12px', color: '#666' }}>
        <div>State: {JSON.stringify(visualEffects.state.value)}</div>
        <div>Context keys: {Object.keys(visualEffects.context).join(', ')}</div>
      </div>
    </div>
  );
};

export default VisualEffectsTest;