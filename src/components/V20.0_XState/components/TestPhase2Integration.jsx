/**
 * 🧪 Test Phase 2 Integration
 * Composant de test pour valider la migration DebugPanel vers Zustand
 */

import React, { useEffect } from 'react';
import DebugPanelV2 from './DebugPanelV2.jsx';
import useSceneStore from '../stores/sceneStore.js';

const TestPhase2Integration = ({ 
  // Props de compatibilité avec V3Scene
  systemsInitialized = true,
  stateController = null,
  ...otherProps 
}) => {
  // === TEST INITIALISATION STORE ===
  const storeInitialized = useSceneStore(state => state.metadata?.storeInitialized);
  const version = useSceneStore(state => state.metadata?.version);
  const migrationPhase = useSceneStore(state => state.metadata?.migrationPhase);
  
  // === DIAGNOSTIC ACTIONS ===
  const createSnapshot = useSceneStore(state => state.createDebugSnapshot);
  const exportState = useSceneStore(state => state.exportState);
  
  useEffect(() => {
    console.log('%c🧪 Phase 2 Integration Test Started', 'color: #4CAF50; font-weight: bold; font-size: 16px;');
    
    // Diagnostic complet du store
    const diagnosticStore = () => {
      const store = useSceneStore.getState();
      console.group('📊 Store Diagnostic Phase 2');
      
      console.log('Version:', store.metadata?.version || 'unknown');
      console.log('Migration Phase:', store.metadata?.migrationPhase || 'unknown');
      console.log('Store Keys:', Object.keys(store));
      
      // Vérifier présence de tous les slices
      const expectedSlices = ['bloom', 'pbr', 'lighting', 'background', 'metadata'];
      const presentSlices = expectedSlices.filter(slice => store[slice] !== undefined);
      const missingSlices = expectedSlices.filter(slice => store[slice] === undefined);
      
      console.log('✅ Present Slices:', presentSlices);
      if (missingSlices.length > 0) {
        console.warn('❌ Missing Slices:', missingSlices);
      }
      
      // Vérifier actions disponibles
      const bloomActions = [
        'setBloomEnabled', 'setBloomGlobal', 'setBloomGroup', 'resetBloom'
      ].filter(action => typeof store[action] === 'function');
      
      const pbrActions = [
        'setPbrPreset', 'setPbrMultiplier', 'setHdrBoost', 'resetPbr'
      ].filter(action => typeof store[action] === 'function');
      
      console.log('🌟 Bloom Actions:', bloomActions.length + '/4');
      console.log('🎨 PBR Actions:', pbrActions.length + '/4');
      
      // État initial values
      console.log('🌟 Bloom State:', {
        enabled: store.bloom?.enabled,
        threshold: store.bloom?.threshold,
        strength: store.bloom?.strength,
        groupsCount: store.bloom?.groups ? Object.keys(store.bloom.groups).length : 0
      });
      
      console.log('🎨 PBR State:', {
        preset: store.pbr?.currentPreset,
        hdrEnabled: store.pbr?.hdrBoost?.enabled,
        ambientMult: store.pbr?.ambientMultiplier
      });
      
      console.log('💡 Lighting State:', {
        exposure: store.lighting?.exposure,
        ambientIntensity: store.lighting?.ambient?.intensity
      });
      
      console.log('📊 Metadata:', {
        activeTab: store.metadata?.activeTab,
        currentPreset: store.metadata?.currentPreset,
        securityState: store.metadata?.securityState
      });
      
      console.groupEnd();
    };
    
    // Tests fonctionnels automatisés
    const runFunctionalTests = () => {
      console.group('🔧 Functional Tests Phase 2');
      
      try {
        const store = useSceneStore.getState();
        
        // Test 1: Bloom Controls
        console.log('Test 1: Bloom threshold change...');
        store.setBloomGlobal('threshold', 0.5);
        const newThreshold = useSceneStore.getState().bloom.threshold;
        console.log(newThreshold === 0.5 ? '✅ Bloom threshold test passed' : '❌ Bloom threshold test failed');
        
        // Test 2: PBR Controls
        console.log('Test 2: PBR multiplier change...');
        store.setPbrMultiplier('ambient', 2.5);
        const newMultiplier = useSceneStore.getState().pbr.ambientMultiplier;
        console.log(newMultiplier === 2.5 ? '✅ PBR multiplier test passed' : '❌ PBR multiplier test failed');
        
        // Test 3: Lighting Controls
        console.log('Test 3: Exposure change...');
        store.setExposure(2.2);
        const newExposure = useSceneStore.getState().lighting.exposure;
        console.log(newExposure === 2.2 ? '✅ Exposure test passed' : '❌ Exposure test failed');
        
        // Test 4: UI State
        console.log('Test 4: Tab change...');
        store.setActiveTab('pbr');
        const newTab = useSceneStore.getState().metadata.activeTab;
        console.log(newTab === 'pbr' ? '✅ Tab change test passed' : '❌ Tab change test failed');
        
        // Test 5: Security State
        console.log('Test 5: Security state change...');
        store.setSecurityState('WARNING');
        const newSecurity = useSceneStore.getState().metadata.securityState;
        console.log(newSecurity === 'WARNING' ? '✅ Security state test passed' : '❌ Security state test failed');
        
        // Reset pour état propre
        store.setBloomGlobal('threshold', 0);
        store.setPbrMultiplier('ambient', 1);
        store.setExposure(1.0);
        store.setActiveTab('groups');
        store.setSecurityState('NORMAL');
        
        console.log('✅ All functional tests completed');
        
      } catch (error) {
        console.error('❌ Functional test error:', error);
      }
      
      console.groupEnd();
    };
    
    // Exécuter diagnostics
    setTimeout(() => {
      diagnosticStore();
      runFunctionalTests();
      
      // Test snapshot et export
      if (typeof createSnapshot === 'function') {
        console.log('📸 Creating debug snapshot...');
        const snapshot = createSnapshot();
        console.log('Snapshot created:', snapshot);
      }
      
      if (typeof exportState === 'function') {
        console.log('📋 Testing state export...');
        const exported = exportState();
        console.log('State exported:', exported);
      }
      
    }, 1000);
    
    return () => {
      console.log('🧪 Phase 2 Integration Test Cleanup');
    };
  }, [createSnapshot, exportState]);
  
  // === COMPATIBILITY LAYER ===
  // Pour transition depuis ancien DebugPanel
  
  const legacyProps = {
    stateController,
    ...otherProps
  };
  
  // Warning si props legacy détectées
  useEffect(() => {
    const legacyPropsCount = Object.keys(legacyProps).filter(key => 
      key !== 'systemsInitialized' && legacyProps[key] !== null
    ).length;
    
    if (legacyPropsCount > 0) {
      console.warn(
        `⚠️ Phase 2: Detected ${legacyPropsCount} legacy props. These will be ignored in Zustand version:`,
        Object.keys(legacyProps).filter(key => legacyProps[key] !== null)
      );
    }
  }, [legacyProps]);
  
  return (
    <div style={{ position: 'relative' }}>
      {/* Phase 2 Status Indicator */}
      <div style={{
        position: 'fixed',
        top: '10px',
        left: '10px',
        background: 'rgba(76, 175, 80, 0.9)',
        color: 'white',
        padding: '8px 12px',
        borderRadius: '6px',
        fontSize: '12px',
        fontWeight: 'bold',
        zIndex: 999,
        fontFamily: 'monospace'
      }}>
        🧪 PHASE 2 TEST • Zustand Migration • v{version}
      </div>
      
      {/* Store Status Mini-Debug */}
      <div style={{
        position: 'fixed',
        top: '50px',
        left: '10px',
        background: 'rgba(0, 0, 0, 0.8)',
        color: 'white',
        padding: '10px',
        borderRadius: '6px',
        fontSize: '10px',
        fontFamily: 'monospace',
        zIndex: 998,
        maxWidth: '200px'
      }}>
        <div>📊 Store: {storeInitialized ? '✅' : '❌'}</div>
        <div>🔢 Migration: Phase {migrationPhase}</div>
        <div>🏪 Version: {version}</div>
        <div>⚙️ Systems: {systemsInitialized ? '✅' : '❌'}</div>
      </div>
      
      {/* Le nouveau DebugPanel V2 - 100% Zustand */}
      <DebugPanelV2 
        className="debug-panel-phase2-test"
      />
    </div>
  );
};

export default TestPhase2Integration;