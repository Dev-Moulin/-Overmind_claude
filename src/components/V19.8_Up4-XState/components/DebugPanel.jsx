// 🎛️ DebugPanel V6 - SIMPLE BLOOM SYSTEM EDITION + MSAA CONTROLS
import React, { useState, useEffect, useRef } from 'react';
import MSAAControlsPanel from './MSAAControlsPanel.jsx';
import PerformanceMonitor from './PerformanceMonitor.jsx';
import { usePerformanceMonitor } from '../hooks/usePerformanceMonitor.js';
import { PRESET_REGISTRY, applyPreset } from '../utils/presets.js';
import { V3_CONFIG } from '../utils/config.js';

// PRESETS SÉCURITÉ 
const SECURITY_PRESETS = {
  SAFE: { color: "#00ff88", intensity: 0.3, description: "🟢 Vert (Sécurisé)" },
  DANGER: { color: "#ff4444", intensity: 0.8, description: "🔴 Rouge (Danger)" },
  WARNING: { color: "#ffaa00", intensity: 0.5, description: "🟡 Orange (Alerte)" },
  SCANNING: { color: "#4488ff", intensity: 0.6, description: "🔵 Bleu (Scan)" },
  NORMAL: { color: "#ffffff", intensity: 0.2, description: "⚪ Blanc (Normal)" }
};

// PRESETS POSITION LUMIÈRE DIRECTIONNELLE
const LIGHT_POSITION_PRESETS = {
  "studio-classic": { x: 1, y: 2, z: 3, name: "🎬 Studio Classique", description: "Position studio standard" },
  "top-down": { x: 0, y: 5, z: 0, name: "☀️ Plongée", description: "Lumière du haut (midi)" },
  "side-dramatic": { x: 5, y: 1, z: 1, name: "🌅 Dramatique", description: "Éclairage de côté" },
  "front-soft": { x: 0, y: 1, z: 5, name: "💡 Face douce", description: "Lumière frontale douce" },
  "back-rim": { x: -2, y: 3, z: -2, name: "✨ Contre-jour", description: "Éclairage arrière" },
  "low-moody": { x: 2, y: 0.5, z: 2, name: "🌙 Ambiance basse", description: "Lumière basse dramatique" }
};

// ✅ CORRIGÉ : Composant pour contrôler les paramètres bloom d'une couleur
function ColorBloomControls({ colorName, title, onColorBloomChange, currentColor, values, onValuesChange, stateController = null }) {
  const handleSliderChange = (param, value) => {
    const newValues = { ...values, [param]: value };
    onValuesChange(colorName, newValues);
    
    // 🎯 CCS: Priorité au SceneStateController
    if (stateController) {
      if (param === 'strength' || param === 'radius' || param === 'threshold') {
        stateController.setGroupBloomParameter(colorName, param, value);
      } else if (param === 'emissiveIntensity') {
        stateController.setMaterialParameter(colorName, param, value);
      } else {
        stateController.setMaterialParameter(colorName, param, value);
      }
    } else {
      // Fallback ancien système
      onColorBloomChange?.(colorName, param, value);
    }
  };
  
  return (
    <div style={{ 
      marginBottom: '15px', 
      padding: '10px', 
      border: '1px solid #555', 
      borderRadius: '4px',
      background: 'rgba(0,0,0,0.3)'
    }}>
      <h4 style={{ margin: '0 0 8px 0', color: currentColor || '#FFD93D', fontSize: '12px' }}>
        {title}
      </h4>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
        <div>
          <label style={{ fontSize: '10px', color: '#ccc', display: 'block', marginBottom: '4px' }}>
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
        
        <div>
          <label style={{ fontSize: '10px', color: '#ccc', display: 'block', marginBottom: '4px' }}>
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
        
        <div style={{ gridColumn: '1 / -1' }}>
          <label style={{ fontSize: '10px', color: '#ccc', display: 'block', marginBottom: '4px' }}>
            Emissive: {values.emissiveIntensity.toFixed(2)}
            <input
              type="range"
              min="0"
              max="10"
              step="0.01"
              value={values.emissiveIntensity}
              onChange={(e) => handleSliderChange('emissiveIntensity', parseFloat(e.target.value))}
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
        
        <div style={{ fontSize: '9px', color: '#999', gridColumn: '1 / -1', marginTop: '4px' }}>
          {colorName === 'revealRings' ? '💍 Reveal rings indépendants' : 
           colorName === 'iris' ? '👁️ Iris avec couleur sécurité' :
           colorName === 'eyeRings' ? '💍 Eye rings avec couleur sécurité' : 
           '🎨 Groupe avec couleur sécurité'}
        </div>
      </div>
    </div>
  );
}

export default function DebugPanel({ 
  showDebug, 
  forceShowRings, 
  onToggleForceRings,
  // _magicRingsInfo = [],            // Unused parameter
  currentAnimation = 'permanent',
  onTriggerTransition = null,
  securityState = 'NORMAL',
  onSecurityStateChange = null,
  isTransitioning = false,
  onColorBloomChange = null,
  setExposure = null,              // ✅ NOUVEAU V8
  mouseControlMode = 'navigation',  // 👁️ NOUVEAU : Mode de contrôle souris
  // _getExposure = null,              // ✅ NOUVEAU V8 - Unused
  // _worldEnvironmentController = null, // ✅ PHASE 2 V8 - Unused
  pbrLightingController = null,    // ✅ PHASE 5 V8 - Option 3
  setBackground = null,            // ✅ NOUVEAU : Contrôle Background
  getBackground = null,            // ✅ NOUVEAU : Contrôle Background
  bloomSystem = null,              // ✅ NOUVEAU V12.2: BloomSystem pour contrôles MSAA
  renderer = null,                 // ✅ NOUVEAU V12.2: Renderer pour contrôles MSAA
  particleSystemController = null, // 🌟 V18: Contrôleur de particules
  floatingSpace = null,            // 🌌 V19.3: Système de flottement spatial
  stateController = null           // 🎯 CCS: Contrôleur Central de Synchronisation
}) {
  const [activeTab, setActiveTab] = useState('groups');
  
  // Performance stats pour le monitor
  const [perfMonitorStats, setPerfMonitorStats] = useState({
    fps: 0,
    frameTime: 0,
    gpuMemory: 0,
    samples: 0
  });
  
  // Refs pour le monitoring FPS permanent
  const fpsCounterRef = useRef();
  const lastFrameTimeRef = useRef(performance.now());
  const frameCountRef = useRef(0);
  
  // Monitoring FPS permanent (indépendant de MSAA)
  useEffect(() => {
    const updateFPS = () => {
      const now = performance.now();
      const delta = now - lastFrameTimeRef.current;
      frameCountRef.current++;
      
      if (frameCountRef.current >= 10) {
        const fps = Math.round(1000 / (delta / frameCountRef.current));
        const frameTime = delta / frameCountRef.current;
        
        setPerfMonitorStats(prev => ({
          ...prev,
          fps,
          frameTime,
          samples: prev.samples // Garder la dernière valeur MSAA
        }));
        
        frameCountRef.current = 0;
      }
      
      lastFrameTimeRef.current = now;
      fpsCounterRef.current = requestAnimationFrame(updateFPS);
    };

    fpsCounterRef.current = requestAnimationFrame(updateFPS);
    
    return () => {
      if (fpsCounterRef.current) {
        cancelAnimationFrame(fpsCounterRef.current);
      }
    };
  }, []);
  
  // ✅ NOUVEAU V12.2: Performance monitoring pour MSAA
  const { stats: performanceStats, updateSamples, resetStats, getPerformanceStatus } = usePerformanceMonitor();
  
  // ✅ NOUVEAU V8 : State pour exposure
  const [exposure, setExposureState] = useState(1.7);
  
  // ✅ CCS: Threshold global synchronisé depuis SceneStateController
  const [globalThreshold, setGlobalThreshold] = useState(0.15);
  
  // 🎯 CCS: Contrôles globaux strength/radius synchronisés depuis SceneStateController
  const [globalBloomSettings, setGlobalBloomSettings] = useState({
    strength: 0.40,
    radius: 0.4
  });
  
  const [bloomValues, setBloomValues] = useState({
    iris: {
      emissiveIntensity: 0.5
    },
    eyeRings: {
      emissiveIntensity: 0.5
    },
    revealRings: {
      emissiveIntensity: 0.5
    }
  });
  
  // ✅ CCS: Synchronisation automatique des valeurs UI depuis SceneStateController
  useEffect(() => {
    if (stateController && stateController.state) {
      const bloomState = stateController.state.bloom;
      if (bloomState) {
        // ✅ SUPPRIMÉ : Log de sync DebugPanel pour réduire spam console
        
        // Synchroniser les curseurs avec les valeurs du CCS
        if (bloomState.threshold !== undefined && bloomState.threshold !== globalThreshold) {
          setGlobalThreshold(bloomState.threshold);
        }
        
        if (bloomState.strength !== undefined || bloomState.radius !== undefined) {
          setGlobalBloomSettings(prev => ({
            ...prev,
            ...(bloomState.strength !== undefined && { strength: bloomState.strength }),
            ...(bloomState.radius !== undefined && { radius: bloomState.radius })
          }));
        }
      }
    }
  }, [stateController, globalThreshold]); // Se déclenche quand stateController change
  
  // 🎯 CCS : Handler pour exposure via SceneStateController
  const handleExposureChange = (value) => {
    const newExposure = parseFloat(value);
    setExposureState(newExposure);
    
    // Priorité au SceneStateController
    if (stateController) {
      stateController.setExposure(newExposure);
    } else if (setExposure) {
      // Fallback ancien système
      setExposure(newExposure);
    }
  };

  // 🎯 CCS : Handler pour contrôles globaux bloom via SceneStateController
  const handleGlobalBloomChange = (param, value) => {
    setGlobalBloomSettings(prev => ({
      ...prev,
      [param]: parseFloat(value)
    }));
    
    // Priorité au SceneStateController
    if (stateController) {
      // Appliquer globalement via CCS
      stateController.setBloomParameter(param, parseFloat(value));
    } else {
      // Fallback ancien système
      onColorBloomChange?.('iris', param, parseFloat(value));
      onColorBloomChange?.('eyeRings', param, parseFloat(value));
      onColorBloomChange?.('revealRings', param, parseFloat(value));
    }
  };
  
  // 🎯 CCS : Handler pour threshold global via SceneStateController
  const handleGlobalThresholdChange = (value) => {
    const newThreshold = parseFloat(value);
    setGlobalThreshold(newThreshold);
    
    // Priorité au SceneStateController
    if (stateController) {
      stateController.setBloomParameter('threshold', newThreshold);
    } else if (onColorBloomChange) {
      // Fallback ancien système
      onColorBloomChange('global', 'threshold', newThreshold);
    }
  };

  // ✅ NOUVEAU : Handler pour mise à jour des valeurs bloom
  const _handleBloomValuesChange = (colorName, newValues) => {
    setBloomValues(prev => ({
      ...prev,
      [colorName]: newValues
    }));
  };


  // ✅ NOUVEAU : State pour le background
  const [backgroundSettings, setBackgroundSettings] = useState({
    type: 'color',
    color: '#404040'
  });

  // ✅ NOUVEAU : Handler pour background
  const handleBackgroundChange = (type, value) => {
    setBackgroundSettings({ type, color: value || '#404040' });
    if (setBackground) {
      setBackground(type, value);
    }
  };

  // ✅ NOUVEAU V12.2: Handler pour changements MSAA
  const handleMSAASettingsChange = (param, value) => {
    
    // Mettre à jour le monitoring de performance
    if (param === 'msaa_samples') {
      updateSamples(value);
    }
    
    // Appliquer changements au bloom system si disponible
    if (bloomSystem) {
      switch (param) {
        case 'msaa_enabled':
          bloomSystem.setMSAAEnabled?.(value);
          break;
        case 'msaa_samples':
          bloomSystem.updateMSAASamples?.(value);
          break;
        case 'fxaa_enabled':
          bloomSystem.setFXAAEnabled?.(value);
          break;
      }
    }
  };

  // ✅ NOUVEAU PHASE 5 : States pour PBR Lighting - Option 3
  const [pbrSettings, setPbrSettings] = useState({
    currentPreset: 'studioProPlus',
    ambientMultiplier: 1.0,
    directionalMultiplier: 1.0,
    customExposure: 1.7
  });
  
  // ✅ NOUVEAU : État des matériaux PBR
  const [materialSettings, setMaterialSettings] = useState({
    metalness: 0.8,     // 0.0 = matte, 1.0 = très métallique
    roughness: 1.0,     // 0.0 = miroir, 1.0 = très rugueux
    targetMaterials: ['Material-metal050-effet-chrome', 'Material-Metal027', 'metalgrid3']
  });
  
  // ✅ V15 : État HDR Boost (actif par défaut)
  const [hdrBoostSettings, setHdrBoostSettings] = useState({
    enabled: true,        // Actif par défaut
    multiplier: 2.5      // Valeur par défaut (équivalent à 2-3 clics)
  });

  // ✅ NOUVEAU : État pour position lumière directionnelle
  const [lightPositionSettings, setLightPositionSettings] = useState({
    currentPreset: 'studio-classic',
    advancedMode: false,
    customPosition: { x: 1, y: 2, z: 3 }
  });

  // 🎯 CCS: Initialisation HDR Boost via SceneStateController
  useEffect(() => {
    if (stateController && hdrBoostSettings.enabled) {
      // Activer HDR Boost au démarrage via le contrôleur central
      stateController.setHDRBoost(true, hdrBoostSettings.multiplier);
      // ✅ SUPPRIMÉ : Log pour réduire spam console
    } else if (pbrLightingController && hdrBoostSettings.enabled && !stateController) {
      // Fallback ancien système si SceneStateController pas disponible
      pbrLightingController.applyHDRBoost(true);
      pbrLightingController.setHDRBoostMultiplier(hdrBoostSettings.multiplier);
      // ✅ SUPPRIMÉ : Log pour réduire spam console
    }
  }, [stateController, pbrLightingController, hdrBoostSettings.enabled, hdrBoostSettings.multiplier]);

  // ✅ Handler pour presets PBR
  const handlePbrPresetChange = (presetName) => {
    if (pbrLightingController) {
      const success = pbrLightingController.applyPreset(presetName);
      if (success) {
        setPbrSettings(prev => ({ ...prev, currentPreset: presetName }));
      }
    }
  };

  // ✅ NOUVEAU : Handler pour matériaux PBR (metalness/roughness)
  const handleMaterialProperty = (property, value) => {
    
    // Traverser la scène pour trouver et modifier les matériaux métalliques
    if (window.scene) {
      window.scene.traverse((child) => {
        if (child.isMesh && child.material) {
          const material = Array.isArray(child.material) ? child.material[0] : child.material;
          const materialName = material.name || '';
          
          // Vérifier si c'est un matériau métallique
          if (materialSettings.targetMaterials.some(targetMat => 
              materialName.includes(targetMat) || materialName === targetMat
          )) {
            if (material[property] !== undefined) {
              material[property] = parseFloat(value);
              material.needsUpdate = true;
            }
          }
        }
      });
      
      // Mettre à jour l'état local
      setMaterialSettings(prev => ({
        ...prev,
        [property]: parseFloat(value)
      }));
    } else {
      console.warn('⚠️ Scene non disponible pour modification matériaux');
    }
  };

  // ✅ Handler pour multipliers PBR
  const handlePbrMultipliers = (ambientMult, directionalMult) => {
    
    if (pbrLightingController) {
      pbrLightingController.setGlobalMultipliers(ambientMult, directionalMult);
      setPbrSettings(prev => ({
        ...prev,
        ambientMultiplier: ambientMult,
        directionalMultiplier: directionalMult
      }));
    } else {
      // Même si le contrôleur n'est pas prêt, on met à jour l'état local
      setPbrSettings(prev => ({
        ...prev,
        ambientMultiplier: ambientMult,
        directionalMultiplier: directionalMult
      }));
      console.warn('⚠️ Contrôleur PBR non disponible, mais état local mis à jour');
    }
  };

  // ✅ NOUVEAU : Handlers pour position lumière directionnelle
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
    // Méthode 1: Via le PBRLightingController si disponible
    if (pbrLightingController && pbrLightingController.updateDirectionalLightPosition) {
      pbrLightingController.updateDirectionalLightPosition(x, y, z);
    }
    
    // Méthode 2: Directement via la scène (fallback)
    if (window.scene) {
      const directionalLight = window.scene.getObjectByName('PBR_DirectionalLight') || 
                             window.scene.children.find(child => child.isDirectionalLight);
      if (directionalLight) {
        directionalLight.position.set(x, y, z);
      }
    }
    
    console.log(`🔆 Light position updated: (${x}, ${y}, ${z})`);
  };

  // 🎯 CCS: Fonction de capture COMPLÈTE utilisant SceneStateController 
  const captureCurrentPreset = () => {
    console.log('📥 Début capture preset avec CCS...');
    
    if (!stateController) {
      console.error('❌ SceneStateController non disponible pour capture');
      return;
    }

    // ✅ CCS: Récupérer L'ÉTAT COMPLET depuis SceneStateController
    const completeState = stateController.getState();
    
    // Obtenir les paramètres background actuels  
    const _currentBackground = getBackground ? getBackground() : backgroundSettings;

    // 🎯 CCS: Collecter TOUS les paramètres depuis la source unique de vérité
    const presetData = {
      timestamp: new Date().toISOString(),
      presetName: `${completeState.securityMode || securityState}_${backgroundSettings.type || 'color'}_preset`,
      
      // ✅ CCS: Paramètres Bloom depuis SceneStateController
      bloom: {
        ...completeState.bloom
      },
      
      // ✅ CCS: Paramètres Bloom par groupe depuis SceneStateController  
      bloomGroups: {
        ...completeState.bloomGroups
      },
      
      // ✅ CCS: Paramètres Matériaux depuis SceneStateController
      materials: {
        ...completeState.materials
      },
      
      // ✅ CCS: Paramètres Éclairage depuis SceneStateController
      lighting: {
        ...completeState.lighting
      },
      
      // ✅ CCS: Mode sécurité depuis SceneStateController
      securityMode: completeState.securityMode,
      
      // ✅ CCS: Paramètres PBR depuis SceneStateController
      pbr: {
        ...completeState.pbr
      },
      
      // ✅ CCS: Paramètres Background depuis SceneStateController
      background: {
        ...completeState.background
      },
      
      // ✅ CCS: Paramètres MSAA depuis SceneStateController
      msaa: {
        ...completeState.msaa
      },
      
      // 🎯 POSITION CAMÉRA
      camera: (() => {
        const cameraSettings = {
          position: null,
          rotation: null,
          fov: null,
          zoom: null
        };
        
        if (window.camera) {
          cameraSettings.position = {
            x: window.camera.position.x,
            y: window.camera.position.y,
            z: window.camera.position.z
          };
          cameraSettings.rotation = {
            x: window.camera.rotation.x,
            y: window.camera.rotation.y,
            z: window.camera.rotation.z
          };
          cameraSettings.fov = window.camera.fov;
          cameraSettings.zoom = window.camera.zoom;
        }
        
        return cameraSettings;
      })(),
      
      // 🌟 PARAMÈTRES PARTICULES
      particles: {
        enabled: particleSystemController?.enabled || false,
        particleCount: particleSystemController?.particleSystemV2?.config?.particleCount || 500,
        particleColor: particleSystemController?.particleSystemV2?.config?.particleColor || 0xffffff,
        connectionDistance: particleSystemController?.particleSystemV2?.config?.connectionDistance || 4.0,
        connectionColor: particleSystemController?.particleSystemV2?.config?.connectionColor || 0xffffff,
        connectionWidth: particleSystemController?.particleSystemV2?.config?.connectionWidth || 10.0,
        
        // Arcs électriques
        arcs: {
          enabled: particleSystemController?.particleSystemV2?.config?.arcsEnabled || false,
          count: particleSystemController?.particleSystemV2?.config?.arcCount || 3,
          intensity: particleSystemController?.particleSystemV2?.config?.arcIntensity || 0.8,
          frequency: particleSystemController?.particleSystemV2?.config?.arcFrequency || 0.02,
          colorMode: particleSystemController?.particleSystemV2?.config?.arcColorMode || 'rgb',
          color: particleSystemController?.particleSystemV2?.config?.arcColor || 0x00ffff
        },
        
        // Répulsion souris
        mouseRepulsion: {
          enabled: particleSystemController?.particleSystemV2?.config?.mouseRepulsion?.enabled || false,
          radius: particleSystemController?.particleSystemV2?.config?.mouseRepulsion?.radius || 3.0,
          force: particleSystemController?.particleSystemV2?.config?.mouseRepulsion?.force || 0.05
        },
        
        
        // Performance
        visibilityUpdateFrequency: particleSystemController?.particleSystemV2?.visibilityUpdateFrequency || 3
      },
      
      // Informations contextuelles
      context: {
        fps: perfMonitorStats.fps,
        frameTime: perfMonitorStats.frameTime,
        isTransitioning: isTransitioning,
        currentAnimation: currentAnimation
      }
    };

    // Logger le preset de manière structurée
    console.log('🎯 ===== PRESET CAPTURE =====');
    console.log('📊 PRESET DATA FOR:', presetData.presetName);
    console.log('🔒 Security Mode:', presetData.securityMode);
    console.log('⏰ Timestamp:', presetData.timestamp);
    console.log('');
    console.log('📦 BLOOM SETTINGS:');
    console.log('   • Global Threshold:', presetData.bloom?.threshold);
    console.log('   • Global Strength:', presetData.bloom?.strength);
    console.log('   • Global Radius:', presetData.bloom?.radius);
    console.log('   • Iris Bloom:', presetData.bloomGroups?.iris);
    console.log('   • EyeRings Bloom:', presetData.bloomGroups?.eyeRings);
    console.log('   • RevealRings Bloom:', presetData.bloomGroups?.revealRings);
    console.log('');
    console.log('🎨 PBR SETTINGS:');
    console.log('   • Current Preset:', presetData.pbr?.currentPreset);
    console.log('   • Ambient Multiplier:', presetData.pbr?.ambientMultiplier);
    console.log('   • Directional Multiplier:', presetData.pbr?.directionalMultiplier);
    console.log('   • Custom Exposure:', presetData.pbr?.customExposure);
    console.log('   • Metalness:', presetData.pbr?.materialSettings?.metalness);
    console.log('   • Roughness:', presetData.pbr?.materialSettings?.roughness);
    console.log('   • HDR Boost Enabled:', presetData.pbr?.hdrBoost?.enabled);
    console.log('   • HDR Boost Multiplier:', presetData.pbr?.hdrBoost?.multiplier);
    console.log('');
    console.log('🌈 BACKGROUND SETTINGS:');
    console.log('   • Type:', presetData.background?.type);
    console.log('   • Color:', presetData.background?.color);
    console.log('');
    console.log('🎯 MSAA SETTINGS:');
    console.log('   • Enabled:', presetData.msaa?.enabled);
    console.log('   • Samples:', presetData.msaa?.samples);
    console.log('   • FXAA Enabled:', presetData.msaa?.fxaaEnabled);
    console.log('');
    console.log('🎥 CAMERA SETTINGS:');
    console.log('   • Position:', presetData.camera?.position);
    console.log('   • Rotation:', presetData.camera?.rotation);
    console.log('   • FOV:', presetData.camera?.fov);
    console.log('   • Zoom:', presetData.camera?.zoom);
    console.log('');
    console.log('🌟 PARTICLE SETTINGS:');
    console.log('   • System Enabled:', presetData.particles.enabled);
    console.log('   • Particle Count:', presetData.particles.particleCount);
    console.log('   • Particle Color:', presetData.particles.particleColor.toString(16));
    console.log('   • Connection Distance:', presetData.particles.connectionDistance);
    console.log('   • Arcs Enabled:', presetData.particles.arcs.enabled);
    console.log('   • Arc Color Mode:', presetData.particles.arcs.colorMode);
    console.log('   • Mouse Repulsion:', presetData.particles.mouseRepulsion.enabled);
    console.log('');
    console.log('📈 PERFORMANCE CONTEXT:');
    console.log('   • FPS:', presetData.context.fps);
    console.log('   • Frame Time:', presetData.context.frameTime + 'ms');
    console.log('   • Animation:', presetData.context.currentAnimation);
    // 🎯 CCS: LOGS DÉTAILLÉS pour vérification
    console.log('');
    console.log('💾 ÉTAT COMPLET CCS CAPTURÉ:');
    console.log('   📊 BLOOM GLOBAL:', completeState.bloom);
    console.log('   📊 BLOOM GROUPES:', completeState.bloomGroups);
    console.log('   🎨 MATÉRIAUX:', completeState.materials);
    console.log('   💡 ÉCLAIRAGE:', completeState.lighting);
    console.log('   🛡️ MODE SÉCURITÉ:', completeState.securityMode);
    console.log('   🎨 PBR:', completeState.pbr);
    console.log('   🌈 BACKGROUND:', completeState.background);
    console.log('   🎯 MSAA:', completeState.msaa);
    console.log('');
    console.log('💾 PRESET COMPLET GÉNÉRÉ:');
    console.log(JSON.stringify(presetData, null, 2));
    console.log('🎯 ===== FIN CAPTURE CCS - PRÊT POUR CRÉATION PRESET =====');

    return presetData;
  };

  // ✅ NOUVEAU : Fonction d'application des presets
  const handleApplyPreset = (presetKey) => {
    const preset = PRESET_REGISTRY[presetKey];
    if (!preset) {
      console.warn(`⚠️ Preset non trouvé: ${presetKey}`);
      return;
    }
    
    const handlers = {
      onColorBloomChange,
      setExposure,
      pbrLightingController,
      setBackground,
      bloomSystem
    };
    
    // Appliquer le preset via CCS ou stateController
    const controller = window.sceneStateController || stateController;
    if (controller && controller.applyPreset) {
      try {
        controller.applyPreset(presetKey, preset);
        console.log(`✅ Preset appliqué via CCS: ${presetKey}`);
        console.log('📋 Configuration appliquée:', preset);
      
      if (preset.pbr) {
        setPbrSettings(prev => ({
          ...prev,
          currentPreset: preset.pbr.currentPreset
        }));
        
        setMaterialSettings(prev => ({
          ...prev,
          metalness: preset.pbr.materialSettings.metalness,
          roughness: preset.pbr.materialSettings.roughness
        }));
        
        setHdrBoostSettings({
          enabled: preset.pbr.hdrBoost.enabled,
          multiplier: preset.pbr.hdrBoost.multiplier
        });
      }
      
      if (preset.background) {
        setBackgroundSettings({
          type: preset.background.type,
          color: preset.background.color
        });
      }
      
      // Changer automatiquement le mode de sécurité
      if (preset.securityMode && onSecurityStateChange) {
        onSecurityStateChange(preset.securityMode);
      }
      } catch (error) {
        console.error(`❌ Erreur application preset: ${presetKey}`, error);
      }
    } else {
      console.error('❌ SceneStateController non disponible');
    }
  };

  
  if (!showDebug) return null;
  
  // ✅ CORRIGÉ : Obtenir la couleur actuelle du mode de sécurité
  const _currentColor = SECURITY_PRESETS[securityState]?.color || '#ffffff';
  
  return (
    <>
    <div style={{
      position: "absolute",
      top: "10px",
      left: "10px",
      color: "white",
      background: "rgba(0,0,0,0.95)",
      padding: "20px",
      borderRadius: "12px",
      fontSize: "12px",
      maxHeight: "90vh",
      overflowY: "auto",
      minWidth: "400px",
      fontFamily: "monospace",
      border: "2px solid #333",
      boxShadow: "0 8px 32px rgba(0,0,0,0.8)"
    }}>
      
      {/* Header avec bouton transition et checkbox */}
      <div style={{ 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "space-between", 
        marginBottom: "15px",
        gap: "10px"
      }}>
        {/* Titre réduit */}
        <h3 style={{ margin: 0, color: "#4CAF50", fontSize: "14px" }}>
          🎛️ V6 Bloom
        </h3>
        
        {/* 👁️ NOUVEAU : Indicateur mode navigation */}
        <div style={{
          padding: '4px 8px',
          backgroundColor: mouseControlMode === 'eyeTracking' ? 'rgba(255, 100, 100, 0.8)' : 'rgba(100, 150, 255, 0.8)',
          color: 'white',
          borderRadius: '3px',
          fontSize: '10px',
          fontWeight: 'bold',
          whiteSpace: 'nowrap',
          backdropFilter: 'blur(4px)'
        }}>
          {mouseControlMode === 'eyeTracking' ? '👁️ SUIVI ŒIL' : '🕹️ NAVIGATION'} 
          <div style={{ fontSize: '8px', opacity: 0.8, marginTop: '1px' }}>
            Touche T
          </div>
        </div>
        
        {/* Bouton de transition */}
        {onTriggerTransition && (
          <button
            onClick={onTriggerTransition}
            disabled={isTransitioning}
            style={{
              padding: "6px 12px",
              background: isTransitioning ? "#666" : "#4CAF50",
              color: "white",
              border: "none",
              borderRadius: "4px",
              fontSize: "11px",
              cursor: isTransitioning ? "not-allowed" : "pointer",
              fontWeight: "bold",
              whiteSpace: "nowrap"
            }}
          >
            {isTransitioning ? "⏳ Transition..." : `🔄 ${currentAnimation === 'permanent' ? 'POSE' : 'PERMANENT'}`}
          </button>
        )}
        
        {/* Checkbox Force Show Rings */}
        <label style={{ 
          display: "flex", 
          alignItems: "center", 
          cursor: "pointer",
          fontSize: "10px",
          color: "#ccc",
          whiteSpace: "nowrap"
        }}>
          <input
            type="checkbox"
            checked={forceShowRings}
            onChange={(e) => onToggleForceRings?.(e.target.checked)}
            style={{ marginRight: "4px" }}
          />
          Force Rings
        </label>
        
        {/* Bouton Capture Preset */}
        <button
          onClick={captureCurrentPreset}
          style={{
            padding: "6px 12px",
            background: "#FF9800",
            color: "white",
            border: "none",
            borderRadius: "4px",
            fontSize: "10px",
            cursor: "pointer",
            fontWeight: "bold",
            whiteSpace: "nowrap"
          }}
          title={`Capturer les paramètres actuels pour le mode ${securityState}`}
        >
          📥 Capturer
        </button>
        
        {/* Dropdown Appliquer Presets */}
        <select
          onChange={(e) => {
            if (e.target.value) {
              handleApplyPreset(e.target.value);
              e.target.value = ""; // Reset selection
            }
          }}
          style={{
            padding: "6px 8px",
            background: "#4CAF50",
            color: "white",
            border: "none",
            borderRadius: "4px",
            fontSize: "10px",
            cursor: "pointer",
            fontWeight: "bold",
            minWidth: "80px"
          }}
          title="Appliquer un preset prédéfini"
        >
          <option value="">🎯 Presets</option>
          <optgroup label="🌑 Thème Dark">
            <option value="blanc_dark">⚪ Blanc (Normal)</option>
            <option value="" disabled>🟢 Vert (Sécurisé)</option>
            <option value="" disabled>🔴 Rouge (Danger)</option>
            <option value="" disabled>🟡 Orange (Alerte)</option>
            <option value="" disabled>🔵 Bleu (Scan)</option>
          </optgroup>
          <optgroup label="🌕 Thème Light">
            <option value="" disabled>⚪ Blanc (Normal)</option>
            <option value="" disabled>🟢 Vert (Sécurisé)</option>
            <option value="" disabled>🔴 Rouge (Danger)</option>
            <option value="" disabled>🟡 Orange (Alerte)</option>
            <option value="" disabled>🔵 Bleu (Scan)</option>
          </optgroup>
        </select>
      </div>

      {/* 📑 TABS */}
      <div style={{ 
        display: "flex", 
        marginBottom: "15px", 
        borderBottom: "1px solid #555",
        paddingBottom: "8px",
        flexWrap: "wrap"
      }}>
        {['groups', 'particles', 'space', 'pbr', 'background', 'msaa'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              flex: 1,
              padding: "6px 8px",
              margin: "0 1px",
              marginBottom: "0",
              background: activeTab === tab ? "#4CAF50" : "#333",
              color: "white",
              border: "none",
              borderRadius: "4px",
              fontSize: "9px",
              cursor: "pointer",
              fontWeight: "normal"
            }}
          >
            {tab === 'groups' && '🎨 Groupes'}
            {tab === 'particles' && '🌟 Particules'}
            {tab === 'space' && '🌌 Space'}
            {tab === 'pbr' && '💡 PBR'}
            {tab === 'background' && '🌍 Background'}
            {tab === 'msaa' && '🎯 MSAA'}
          </button>
        ))}
      </div>


      {/* 🎨 TAB GROUPES */}
      {activeTab === 'groups' && (
        <div>
          <h4 style={{ margin: '0 0 15px 0', color: '#4CAF50', fontSize: '14px' }}>
            🎨 Contrôles Bloom par Groupe
          </h4>

          {/* ✅ V15-REFACTO: Modes Sécurité (déplacé de Contrôles) */}
          <div style={{ marginBottom: '15px' }}>
            <h4 style={{ margin: "0 0 8px 0", color: "#FF6B6B" }}>
              🔒 Modes Sécurité (Couleur de base)
            </h4>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
              {Object.entries(SECURITY_PRESETS).map(([state, preset]) => (
                <button
                  key={state}
                  onClick={() => onSecurityStateChange?.(state)}
                  style={{
                    padding: "8px",
                    background: securityState === state ? preset.color : "#444",
                    color: securityState === state ? "#000000" : "white",
                    border: securityState === state ? "2px solid #000" : "none",
                    borderRadius: "4px",
                    fontSize: "10px",
                    cursor: "pointer",
                    fontWeight: securityState === state ? "bold" : "normal",
                    textShadow: securityState === state ? "0 0 2px rgba(255,255,255,0.8)" : "none"
                  }}
                >
                  {preset.description}
                </button>
              ))}
            </div>
          </div>

          {/* ✅ V15-REFACTO: Exposure Précis (déplacé de Contrôles) */}
          {setExposure && (
            <div style={{ marginBottom: '15px' }}>
              <div style={{ 
                padding: "10px", 
                border: "1px solid #555", 
                borderRadius: "4px",
                background: "rgba(255, 217, 61, 0.1)"
              }}>
                <label style={{ 
                  fontSize: "11px", 
                  color: "#FFD93D", 
                  display: "block", 
                  marginBottom: "6px",
                  fontWeight: "bold"
                }}>
                  Exposure Précis: {exposure.toFixed(2)}
                </label>
                <input
                  type="range"
                  min="0.4"
                  max="5.0"
                  step="0.005"
                  value={exposure}
                  onChange={(e) => handleExposureChange(e.target.value)}
                  style={{
                    width: "100%",
                    margin: "4px 0",
                    accentColor: "#FFD93D"
                  }}
                />
                <div style={{ 
                  display: "flex", 
                  justifyContent: "space-between", 
                  fontSize: "9px", 
                  color: "#aaa",
                  marginTop: "4px"
                }}>
                  <span>🌙 0.1 (Très sombre)</span>
                  <span>☀️ 1.0 (Normal)</span>
                  <span>🔆 2.0 (Très lumineux)</span>
                </div>
              </div>
            </div>
          )}

          {/* ✅ V15-REFACTO: Threshold Global (déplacé de Contrôles) */}
          <div style={{ marginBottom: '15px' }}>
            <div style={{ 
              padding: "10px", 
              border: "1px solid #555", 
              borderRadius: "4px",
              background: "rgba(255, 152, 0, 0.1)"
            }}>
              <label style={{ 
                fontSize: "11px", 
                color: "#FF9800", 
                display: "block", 
                marginBottom: "6px",
                fontWeight: "bold"
              }}>
                Threshold: {globalThreshold.toFixed(2)} (Seuil luminosité pour toute la scène)
              </label>
              <input
                type="range"
                min="0.0"
                max="1.0"
                step="0.01"
                value={globalThreshold}
                onChange={(e) => handleGlobalThresholdChange(e.target.value)}
                style={{
                  width: "100%",
                  margin: "4px 0",
                  accentColor: "#FF9800"
                }}
              />
              <div style={{ 
                display: "flex", 
                justifyContent: "space-between", 
                fontSize: "9px", 
                color: "#aaa",
                marginTop: "4px"
              }}>
                <span>🔥 0.0 (Tout bloom)</span>
                <span>⚡ 0.3 (Recommandé)</span>
                <span>❄️ 1.0 (Aucun bloom)</span>
              </div>
            </div>
          </div>
          
          {/* 🎯 NOUVEAU : Contrôles globaux simplifiés */}
          <div style={{ 
            marginBottom: '15px', 
            padding: '12px', 
            border: '2px solid #4CAF50', 
            borderRadius: '6px',
            background: 'rgba(76, 175, 80, 0.1)'
          }}>
            <h4 style={{ margin: '0 0 10px 0', color: '#4CAF50', fontSize: '14px', fontWeight: 'bold' }}>
              🌟 Contrôles Globaux Bloom
            </h4>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '11px', color: '#4CAF50', display: 'block', marginBottom: '6px', fontWeight: 'bold' }}>
                  Strength Global: {globalBloomSettings.strength.toFixed(2)}
                </label>
                <input
                  type="range"
                  min="0"
                  max="3"
                  step="0.01"
                  value={globalBloomSettings.strength}
                  onChange={(e) => handleGlobalBloomChange('strength', e.target.value)}
                  style={{ 
                    width: '100%',
                    height: '6px',
                    background: 'linear-gradient(to right, #2196F3, #4CAF50)',
                    borderRadius: '3px',
                    outline: 'none',
                    cursor: 'pointer'
                  }}
                />
                <div style={{ fontSize: '9px', color: '#aaa', marginTop: '2px' }}>
                  Appliqué à tous les groupes
                </div>
              </div>
              
              <div>
                <label style={{ fontSize: '11px', color: '#4CAF50', display: 'block', marginBottom: '6px', fontWeight: 'bold' }}>
                  Radius Global: {globalBloomSettings.radius.toFixed(2)}
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={globalBloomSettings.radius}
                  onChange={(e) => handleGlobalBloomChange('radius', e.target.value)}
                  style={{ 
                    width: '100%',
                    height: '6px',
                    background: 'linear-gradient(to right, #FF9800, #4CAF50)',
                    borderRadius: '3px',
                    outline: 'none',
                    cursor: 'pointer'
                  }}
                />
                <div style={{ fontSize: '9px', color: '#aaa', marginTop: '2px' }}>
                  Appliqué à tous les groupes
                </div>
              </div>
            </div>
          </div>
          
          {/* 🎯 Contrôles individuels d'intensité émissive */}
          <div style={{ 
            marginBottom: '15px', 
            padding: '10px', 
            border: '1px solid #666', 
            borderRadius: '4px',
            background: 'rgba(0,0,0,0.2)'
          }}>
            <h4 style={{ margin: '0 0 10px 0', color: '#FFD93D', fontSize: '12px' }}>
              🎨 Intensités Émissives Individuelles
            </h4>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ fontSize: '10px', color: '#00ffff', display: 'block', marginBottom: '4px' }}>
                  👁️ Iris: {bloomValues.iris.emissiveIntensity.toFixed(1)}
                </label>
                <input
                  type="range"
                  min="0"
                  max="10"
                  step="0.1"
                  value={bloomValues.iris.emissiveIntensity}
                  onChange={(e) => {
                    const newValue = parseFloat(e.target.value);
                    setBloomValues(prev => ({
                      ...prev,
                      iris: { ...prev.iris, emissiveIntensity: newValue }
                    }));
                    // 🎯 CCS: Utiliser SceneStateController si disponible
                    if (stateController) {
                      stateController.setMaterialParameter('iris', 'emissiveIntensity', newValue);
                    } else {
                      onColorBloomChange?.('iris', 'emissiveIntensity', newValue);
                    }
                  }}
                  style={{ width: '100%', height: '4px' }}
                />
              </div>
              
              <div>
                <label style={{ fontSize: '10px', color: '#ff6699', display: 'block', marginBottom: '4px' }}>
                  💍 Eye Rings: {bloomValues.eyeRings.emissiveIntensity.toFixed(1)}
                </label>
                <input
                  type="range"
                  min="0"
                  max="10"
                  step="0.1"
                  value={bloomValues.eyeRings.emissiveIntensity}
                  onChange={(e) => {
                    const newValue = parseFloat(e.target.value);
                    setBloomValues(prev => ({
                      ...prev,
                      eyeRings: { ...prev.eyeRings, emissiveIntensity: newValue }
                    }));
                    // 🎯 CCS: Utiliser SceneStateController si disponible
                    if (stateController) {
                      stateController.setMaterialParameter('eyeRings', 'emissiveIntensity', newValue);
                    } else {
                      onColorBloomChange?.('eyeRings', 'emissiveIntensity', newValue);
                    }
                  }}
                  style={{ width: '100%', height: '4px' }}
                />
              </div>
              
              <div>
                <label style={{ fontSize: '10px', color: '#ffaa00', display: 'block', marginBottom: '4px' }}>
                  🔮 Reveal: {bloomValues.revealRings.emissiveIntensity.toFixed(1)}
                </label>
                <input
                  type="range"
                  min="0"
                  max="10"
                  step="0.1"
                  value={bloomValues.revealRings.emissiveIntensity}
                  onChange={(e) => {
                    const newValue = parseFloat(e.target.value);
                    setBloomValues(prev => ({
                      ...prev,
                      revealRings: { ...prev.revealRings, emissiveIntensity: newValue }
                    }));
                    // 🎯 CCS: Utiliser SceneStateController si disponible
                    if (stateController) {
                      stateController.setMaterialParameter('revealRings', 'emissiveIntensity', newValue);
                    } else {
                      onColorBloomChange?.('revealRings', 'emissiveIntensity', newValue);
                    }
                  }}
                  style={{ width: '100%', height: '4px' }}
                />
              </div>
            </div>
          </div>
        </div>
      )}


      {/* 🌟 TAB PARTICULES V2 */}
      {activeTab === 'particles' && (
        <div>
          <h4 style={{ margin: '0 0 15px 0', color: '#00E5FF', fontSize: '14px' }}>
            🚀 Système de Particules V2 - 3D Avancé
          </h4>
          
          {/* 🚀 SYSTÈME V2 */}
          <div style={{ 
            marginBottom: '20px', 
            padding: '10px', 
            background: 'rgba(0, 255, 255, 0.1)',
            border: '1px solid rgba(0, 255, 255, 0.3)',
            borderRadius: '4px'
          }}>
            <h5 style={{ margin: '0 0 10px 0', color: '#00ffff', fontSize: '12px' }}>
              🚀 Particules 3D avec Zones d'Exclusion
            </h5>
            <div style={{ fontSize: '9px', color: '#aaa', marginBottom: '10px' }}>
              <strong>Système avancé</strong> : Gravité, groupes, signaux électriques, billboards GPU
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px', marginBottom: '10px' }}>
              <button
                onClick={() => {
                  if (particleSystemController) {
                    particleSystemController.setEnabled(!particleSystemController.enabled);
                  }
                }}
                style={{
                  padding: '8px',
                  background: particleSystemController?.enabled === true ? '#00ffff' : '#666',
                  color: particleSystemController?.enabled === true ? '#000' : 'white',
                  border: 'none',
                  borderRadius: '3px',
                  fontSize: '10px',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                {particleSystemController?.enabled === true ? '⏸️ DÉSACTIVER' : '▶️ ACTIVER'} Système V2
                <div style={{ fontSize: '8px', marginTop: '2px', opacity: 0.8 }}>
                  Particules 3D avec zones d'exclusion
                </div>
              </button>
            </div>
            
            {/* Contrôles arcs électriques */}
            {particleSystemController?.enabled && (
              <div style={{ marginTop: '15px' }}>
                <h5 style={{ margin: '0 0 10px 0', color: '#00ffff', fontSize: '12px' }}>
                  ⚡ Arcs Électriques
                </h5>
                
                
                <div style={{ marginBottom: '8px', marginTop: '8px' }}>
                  <div style={{ fontSize: '10px', color: '#ccc', marginBottom: '4px' }}>
                    🛡️ Couleur basée sur le mode de sécurité: <strong>{securityState || 'NORMAL'}</strong>
                  </div>
                </div>
                
                {/* Pourcentage de blanc (sauf pour mode NORMAL) */}
                {securityState !== 'NORMAL' && (
                  <div style={{ marginBottom: '8px' }}>
                    <label style={{ fontSize: '10px', color: '#ccc', marginBottom: '4px', display: 'block' }}>
                      Pourcentage blanc: {((particleSystemController?.particleSystemV2?.config?.arcWhitePercentage || 0.35) * 100).toFixed(0)}%
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="5"
                      value={(particleSystemController?.particleSystemV2?.config?.arcWhitePercentage || 0.35) * 100}
                      onChange={(e) => {
                        const percentage = parseFloat(e.target.value) / 100;
                        particleSystemController?.setArcWhitePercentage?.(percentage);
                      }}
                      style={{ width: '100%', height: '4px' }}
                    />
                    <div style={{ fontSize: '8px', color: '#999', marginTop: '2px' }}>
                      💡 Mélange de la couleur de sécurité avec du blanc (défaut: 35%)
                    </div>
                  </div>
                )}
                
                {securityState === 'NORMAL' && (
                  <div style={{ fontSize: '8px', color: '#999', marginBottom: '8px' }}>
                    💡 Mode NORMAL : couleur pure à 100% (pas de mélange blanc)
                  </div>
                )}
                
                {/* Types d'arcs électriques */}
                <div style={{ marginBottom: '8px' }}>
                  <label style={{ fontSize: '10px', color: '#ccc', marginBottom: '4px', display: 'block' }}>
                    Type d'arc électrique
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '3px', marginBottom: '4px' }}>
                    {[
                      { key: 'smooth', label: '🌊 Lisse', desc: 'Courbe fluide' },
                      { key: 'fractal', label: '🌿 Fractal', desc: 'Branches' },
                      { key: 'pulse', label: '💗 Pulsé', desc: 'Battements' },
                      { key: 'fractal-pulse', label: '🌿💗 Fractal+', desc: 'Branches pulsées' },
                      { key: 'fractal-smooth', label: '🌿🌊 Fluid+', desc: 'Branches fluides' }
                    ].map(arc => (
                      <button
                        key={arc.key}
                        onClick={() => particleSystemController?.setArcType?.(arc.key)}
                        style={{
                          padding: '4px 2px',
                          backgroundColor: (particleSystemController?.particleSystemV2?.config?.arcType || 'smooth') === arc.key ? '#00ff88' : '#555',
                          color: (particleSystemController?.particleSystemV2?.config?.arcType || 'smooth') === arc.key ? '#000' : '#fff',
                          border: 'none', borderRadius: '2px', fontSize: '7px', cursor: 'pointer', fontWeight: 'bold',
                          display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center'
                        }}
                      >
                        <div>{arc.label}</div>
                        <div style={{ fontSize: '6px', opacity: 0.8 }}>{arc.desc}</div>
                      </button>
                    ))}
                  </div>
                  <div style={{ fontSize: '8px', color: '#999' }}>
                    💡 Différents styles visuels d'arcs électriques
                  </div>
                </div>
              </div>
            )}
            
            {/* Contrôles particules */}
            {particleSystemController?.enabled && (
              <div style={{ marginTop: '15px' }}>
                <h5 style={{ margin: '0 0 10px 0', color: '#4488ff', fontSize: '12px' }}>
                  🌟 Particules & Connexions
                </h5>
                
                <div style={{ marginBottom: '8px' }}>
                  <label style={{ fontSize: '10px', color: '#ccc', marginBottom: '6px', display: 'block' }}>
                    Nombre de particules: {particleSystemController?.particleSystemV2?.config?.particleCount || 400}
                  </label>
                  <div style={{ fontSize: '8px', color: '#999' }}>
                    💡 Modifiable dans ParticleSystemV2.js ligne 22
                  </div>
                </div>
                
                <div style={{ marginBottom: '8px' }}>
                  <label style={{ fontSize: '10px', color: '#ccc', marginBottom: '4px', display: 'block' }}>
                    Couleur particules
                  </label>
                  <input
                    type="color"
                    value={`#${(particleSystemController?.particleSystemV2?.config?.particleColor || 0xffffff).toString(16).padStart(6, '0')}`}
                    onChange={(e) => {
                      const color = parseInt(e.target.value.slice(1), 16);
                      particleSystemController?.setParticleColor(color);
                    }}
                    style={{ width: '100%', height: '25px', border: 'none', borderRadius: '3px' }}
                  />
                </div>
                
                <div style={{ marginBottom: '8px' }}>
                  <label style={{ fontSize: '10px', color: '#ccc' }}>
                    Distance connexions: {(particleSystemController?.particleSystemV2?.config?.connectionDistance || 4.0).toFixed(1)} (range: 0.8-8.0)
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '4px', alignItems: 'center' }}>
                    <span style={{ fontSize: '9px', color: '#999' }}>Auto-randomisé au démarrage</span>
                    <button
                      onClick={() => particleSystemController?.randomizeConnectionDistance()}
                      style={{
                        padding: '4px 8px', backgroundColor: '#66aaff', color: '#fff',
                        border: 'none', borderRadius: '3px', fontSize: '8px', cursor: 'pointer'
                      }}
                    >
                      🔄 Nouvelle distance
                    </button>
                  </div>
                </div>
                
                
                
                <div style={{ marginBottom: '8px' }}>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '10px' }}>
                    Couleur connexions
                  </label>
                  <input
                    type="color"
                    value={`#${(particleSystemController?.particleSystemV2?.config?.connectionColor || 0xffffff).toString(16).padStart(6, '0')}`}
                    onChange={(e) => {
                      const color = parseInt(e.target.value.slice(1), 16);
                      particleSystemController?.setConnectionColor(color);
                    }}
                    style={{ width: '100%', height: '25px', border: 'none', borderRadius: '3px' }}
                  />
                </div>
                
              </div>
            )}
            
            
            
            {/* Performance et visibilité */}
            {particleSystemController?.enabled && (
              <div style={{ marginTop: '15px' }}>
                <h5 style={{ margin: '0 0 10px 0', color: '#00ff88', fontSize: '12px' }}>
                  ⚡ Performance & Visibilité
                </h5>
                
                <div style={{ 
                  padding: '6px', 
                  background: 'rgba(0, 255, 136, 0.1)',
                  border: '1px solid rgba(0, 255, 136, 0.2)',
                  borderRadius: '3px',
                  fontSize: '9px',
                  color: '#00ff88',
                  marginBottom: '8px'
                }}>
                  {(() => {
                    const stats = particleSystemController?.getVisibilityStats();
                    if (stats) {
                      return (
                        <>
                          <strong>Frustum Culling:</strong> {stats.cullingEnabled ? '✅ Activé' : '❌ Désactivé'}<br/>
                          <strong>Particules visibles:</strong> {stats.visibleParticles}/{stats.totalParticles} ({(stats.visibilityRatio * 100).toFixed(1)}%)<br/>
                          <strong>Fréquence MAJ:</strong> {stats.updateFrequency} frames
                        </>
                      );
                    }
                    return 'Stats non disponibles';
                  })()}
                </div>
                
                <div style={{ marginBottom: '8px' }}>
                  <label style={{ fontSize: '10px', color: '#ccc' }}>
                    Fréquence de visibilité: {particleSystemController?.particleSystemV2?.visibilityUpdateFrequency || 3} frames
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    step="1"
                    value={particleSystemController?.particleSystemV2?.visibilityUpdateFrequency || 3}
                    onChange={(e) => particleSystemController?.setVisibilityUpdateFrequency(parseInt(e.target.value))}
                    style={{ width: '100%', height: '4px' }}
                  />
                  <div style={{ fontSize: '8px', color: '#999' }}>
                    1 = Max performance, 10 = Max précision
                  </div>
                </div>
              </div>
            )}
            
            <div style={{ marginTop: '15px', fontSize: '9px', color: '#666' }}>
              💡 Click sur la scène = vague de signaux<br/>
              🎨 30% particules = mouvements spéciaux (spirale, orbite, pulse...)<br/>
              🔗 25% particules = interactions spéciales (magnétique, harmonique...)<br/>
              ⚡ Frustum culling activé pour 300+ particules (optimisé pour performance)
            </div>

          </div>
          
          {/* Info système V2 */}
          <div style={{ 
            marginTop: '15px',
            padding: '8px', 
            background: 'rgba(0, 255, 255, 0.05)',
            border: '1px solid rgba(0, 255, 255, 0.2)',
            borderRadius: '4px',
            fontSize: '9px',
            color: '#999'
          }}>
            <strong>🚀 ParticleSystemV2:</strong> Zones d'exclusion, groupes émergents, arcs électriques
            <br/>
            <strong>📊 Performance:</strong> Billboards GPU optimisés
            <br/>
            <strong>🌟 Status:</strong> {particleSystemController?.enabled ? '✅ Activé' : '❌ Désactivé'}
          </div>
        </div>
      )}

      {/* 🌌 TAB FLOATING SPACE */}
      {activeTab === 'space' && (
        <div>
          <h4 style={{ margin: '0 0 15px 0', color: '#4CAF50', fontSize: '14px' }}>
            🌌 Flottement Spatial - Répulsion Globale
          </h4>

          {floatingSpace && (
            <div>
              {/* Status et activation */}
              <div style={{ 
                marginBottom: '15px', 
                padding: '10px', 
                background: floatingSpace.config?.enabled ? 'rgba(76, 175, 80, 0.1)' : 'rgba(255, 152, 0, 0.1)', 
                borderRadius: '6px', 
                border: floatingSpace.config?.enabled ? '1px solid #4CAF50' : '1px solid #FF9800' 
              }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px', gap: '8px', flexWrap: 'wrap' }}>
                  <button
                    onClick={() => floatingSpace.setParameters({ enabled: !floatingSpace.config?.enabled })}
                    style={{
                      padding: '6px 12px',
                      fontSize: '10px',
                      fontWeight: 'bold',
                      background: floatingSpace.config?.enabled ? '#4CAF50' : '#FF9800',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      minWidth: '60px'
                    }}
                  >
                    {floatingSpace.config?.enabled ? '🟢 ON' : '🟠 OFF'}
                  </button>
                  
                  <button
                    onClick={() => floatingSpace.goToCameraPosition1()}
                    style={{
                      padding: '6px 10px',
                      fontSize: '9px',
                      fontWeight: 'bold',
                      background: '#4CAF50',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                    title="Aller à la position caméra 1 (Position d'origine)"
                  >
                    📷 CAM 1
                  </button>
                  
                  <button
                    onClick={() => floatingSpace.goToCameraPosition2()}
                    style={{
                      padding: '6px 10px',
                      fontSize: '9px',
                      fontWeight: 'bold',
                      background: '#2196F3',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                    title="Aller à la position caméra 2 (Vue éloignée)"
                  >
                    📷 CAM 2
                  </button>
                  
                  <div style={{ fontSize: '10px', color: floatingSpace.config?.enabled ? '#4CAF50' : '#FF9800', flex: '1' }}>
                    <strong>Status:</strong> {floatingSpace.isActive && floatingSpace.config?.enabled ? '✅ Actif' : '❌ Inactif'}
                    {floatingSpace.debug.centerDetected ? ' | 🎯 Iris détecté' : ' | 📦 Fallback bbox'}
                  </div>
                </div>
                <div style={{ fontSize: '9px', color: '#888' }}>
                  Offset: ({floatingSpace.currentOffset.x.toFixed(3)}, {floatingSpace.currentOffset.y.toFixed(3)}, {floatingSpace.currentOffset.z.toFixed(3)})<br/>
                  Origine: ({floatingSpace.config?.originPosition?.x?.toFixed(3) || '0.000'}, {floatingSpace.config?.originPosition?.y?.toFixed(3) || '0.000'}, {floatingSpace.config?.originPosition?.z?.toFixed(3) || '0.000'})<br/>
                  Force: {floatingSpace.effectStrength.toFixed(3)} | Temps: {floatingSpace.debug.updateTime.toFixed(2)}ms
                </div>
              </div>

              {/* Contrôles principaux */}
              <div style={{ 
                marginBottom: '15px', 
                padding: '10px', 
                border: '1px solid #555', 
                borderRadius: '4px',
                background: 'rgba(0,0,0,0.3)'
              }}>
                <h5 style={{ margin: '0 0 10px 0', color: '#4CAF50', fontSize: '12px' }}>
                  ⚡ Contrôles Principaux
                </h5>


                {/* Force de répulsion */}
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ fontSize: '10px', color: '#ccc', display: 'block', marginBottom: '4px' }}>
                    Force Répulsion: {floatingSpace.config?.repulsionStrength?.toFixed(1) || '3.0'}
                    <input
                      type="range"
                      min="0.5"
                      max="5.5"
                      step="0.1"
                      value={floatingSpace.config?.repulsionStrength || 3.0}
                      onChange={(e) => floatingSpace.setParameters({ 
                        repulsionStrength: parseFloat(e.target.value) 
                      })}
                      style={{ 
                        width: '100%',
                        height: '4px',
                        background: '#333',
                        borderRadius: '2px',
                        outline: 'none'
                      }}
                    />
                  </label>
                </div>

                {/* Inertie */}
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ fontSize: '10px', color: '#ccc', display: 'block', marginBottom: '4px' }}>
                    Inertie: {floatingSpace.config?.inertia?.toFixed(3) || '0.010'}
                    <input
                      type="range"
                      min="0.005"
                      max="0.015"
                      step="0.001"
                      value={floatingSpace.config?.inertia || 0.010}
                      onChange={(e) => floatingSpace.setParameters({ 
                        inertia: parseFloat(e.target.value) 
                      })}
                      style={{ 
                        width: '100%',
                        height: '4px',
                        background: '#333',
                        borderRadius: '2px',
                        outline: 'none'
                      }}
                    />
                  </label>
                </div>

                {/* Courbe de falloff */}
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ fontSize: '10px', color: '#ccc', display: 'block', marginBottom: '4px' }}>
                    Falloff: {floatingSpace.config?.falloffPower?.toFixed(1) || '1.0'} (1=linéaire, 2=quad, 3=cubic)
                    <input
                      type="range"
                      min="0.5"
                      max="1.5"
                      step="0.1"
                      value={floatingSpace.config?.falloffPower || 1.0}
                      onChange={(e) => floatingSpace.setParameters({ 
                        falloffPower: parseFloat(e.target.value) 
                      })}
                      style={{ 
                        width: '100%',
                        height: '4px',
                        background: '#333',
                        borderRadius: '2px',
                        outline: 'none'
                      }}
                    />
                  </label>
                </div>
              </div>


              {/* Informations techniques */}
              <div style={{ 
                padding: '8px', 
                background: 'rgba(0,0,0,0.2)', 
                borderRadius: '4px', 
                fontSize: '9px', 
                color: '#888' 
              }}>
                <strong>🌌 Flottement Spatial:</strong> Répulsion globale du modèle depuis la souris<br/>
                <strong>📊 Performance:</strong> Transform global unique, &lt; 1ms/frame<br/>
                <strong>🎯 Détection:</strong> IRIS → Anneaux_Eye_Int → Eye → BoundingBox
              </div>

              {/* 🆕 Synchronisation Particules */}
              <div style={{ 
                marginTop: '15px',
                padding: '10px', 
                border: '1px solid #00ff88', 
                borderRadius: '4px',
                background: 'rgba(0,255,136,0.05)'
              }}>
                <h5 style={{ margin: '0 0 10px 0', color: '#00ff88', fontSize: '12px' }}>
                  🔄 Synchronisation Particules
                </h5>

                {/* État sync */}
                <div style={{ 
                  marginBottom: '10px',
                  padding: '6px',
                  background: floatingSpace.syncData?.isActive ? 'rgba(0,255,136,0.1)' : 'rgba(100,100,100,0.1)',
                  borderRadius: '4px',
                  fontSize: '9px'
                }}>
                  <strong>État:</strong> {floatingSpace.syncData?.isActive ? '✅ Actif' : '❌ Inactif'}<br/>
                  <strong>Direction:</strong> ({floatingSpace.syncData?.direction.x.toFixed(2)}, {floatingSpace.syncData?.direction.y.toFixed(2)}, {floatingSpace.syncData?.direction.z.toFixed(2)})<br/>
                  <strong>Intensité:</strong> {floatingSpace.syncData?.intensity.toFixed(3)}
                </div>

                {/* Contrôles sync */}
                {particleSystemController?.particleSystemV2 && (
                  <div>
                    <div style={{ marginBottom: '8px' }}>
                      <label style={{ fontSize: '10px', color: '#ccc' }}>
                        <input
                          type="checkbox"
                          checked={particleSystemController.particleSystemV2.spatialSyncConfig.enabled}
                          onChange={(e) => {
                            particleSystemController.particleSystemV2.spatialSyncConfig.enabled = e.target.checked;
                          }}
                        /> Activer Synchronisation
                      </label>
                    </div>

                    <div style={{ marginBottom: '8px' }}>
                      <label style={{ fontSize: '10px', color: '#ccc', display: 'block' }}>
                        Intensité Sync: {particleSystemController.particleSystemV2.spatialSyncConfig.syncIntensity.toFixed(2)}
                        <input
                          type="range"
                          min="0"
                          max="1.5"
                          step="0.05"
                          value={particleSystemController.particleSystemV2.spatialSyncConfig.syncIntensity}
                          onChange={(e) => {
                            particleSystemController.particleSystemV2.spatialSyncConfig.syncIntensity = parseFloat(e.target.value);
                          }}
                          style={{ width: '100%', height: '4px' }}
                        />
                      </label>
                    </div>

                    <div style={{ marginBottom: '8px' }}>
                      <label style={{ fontSize: '10px', color: '#ccc', display: 'block' }}>
                        Mélange: {particleSystemController.particleSystemV2.spatialSyncConfig.blendFactor.toFixed(2)}
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.05"
                          value={particleSystemController.particleSystemV2.spatialSyncConfig.blendFactor}
                          onChange={(e) => {
                            particleSystemController.particleSystemV2.spatialSyncConfig.blendFactor = parseFloat(e.target.value);
                          }}
                          style={{ width: '100%', height: '4px' }}
                        />
                      </label>
                    </div>

                    {/* Info sur les paramètres */}
                    <div style={{ 
                      marginBottom: '10px', 
                      padding: '8px', 
                      background: 'rgba(0,255,136,0.05)', 
                      borderRadius: '4px',
                      fontSize: '9px',
                      color: '#aaa'
                    }}>
                      <strong>💡 Intensité Sync:</strong> Force de réaction (0 = aucun effet, 1.5 = très fort)<br/>
                      <strong>🔀 Mélange:</strong> 0 = flux normal uniquement, 1 = flux 100% réactif
                    </div>

                    {/* Presets numériques 1-10 */}
                    <div style={{ marginBottom: '8px' }}>
                      <div style={{ fontSize: '10px', color: '#00ff88', marginBottom: '6px' }}>
                        🎚️ Niveaux d'Intensité (1 = Désactivé → 10 = Maximum)
                      </div>
                      <div style={{ display: 'flex', gap: '3px', flexWrap: 'wrap' }}>
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(level => {
                          const preset = V3_CONFIG.spaceEffects.particleSync.presets[level];
                          // const isDisabled = level === 1; // Unused variable
                          const getButtonColor = (level) => {
                            if (level === 1) return '#666';
                            if (level <= 3) return '#4CAF50';
                            if (level <= 6) return '#FF9800';
                            if (level <= 8) return '#FF5722';
                            return '#F44336';
                          };
                          
                          return (
                            <button
                              key={level}
                              onClick={() => {
                                Object.assign(particleSystemController.particleSystemV2.spatialSyncConfig, preset);
                                if (level === 1) {
                                  particleSystemController.particleSystemV2.spatialSyncConfig.enabled = false;
                                } else {
                                  particleSystemController.particleSystemV2.spatialSyncConfig.enabled = true;
                                }
                              }}
                              style={{ 
                                padding: '4px 8px', 
                                fontSize: '9px', 
                                background: getButtonColor(level),
                                color: 'white',
                                border: 'none',
                                borderRadius: '3px',
                                cursor: 'pointer',
                                minWidth: '25px',
                                fontWeight: 'bold'
                              }}
                              title={preset.description}
                            >
                              {level}
                            </button>
                          );
                        })}
                      </div>
                      <div style={{ fontSize: '8px', color: '#666', marginTop: '4px' }}>
                        Survolez les boutons pour voir la description
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {!floatingSpace && (
            <div style={{ 
              padding: '15px', 
              background: 'rgba(255, 193, 7, 0.1)', 
              borderRadius: '6px', 
              border: '1px solid #FFC107',
              color: '#FFC107',
              fontSize: '11px'
            }}>
              ⚠️ Système de flottement spatial non disponible
            </div>
          )}
        </div>
      )}

      {/* 💡 TAB PBR LIGHTING - Option 3 */}
      {activeTab === 'pbr' && (
        <div>
          <h4 style={{ margin: '0 0 15px 0', color: '#FF9800', fontSize: '14px' }}>
            💡 Éclairage PBR - Solution Hybride
          </h4>
          
          {/* ✅ INFO SOLUTION HYBRIDE + DEBUG */}
          <div style={{ 
            marginBottom: '15px', 
            padding: '8px', 
            background: 'rgba(255, 152, 0, 0.1)',
            border: '1px solid rgba(255, 152, 0, 0.3)',
            borderRadius: '4px',
            fontSize: '10px',
            color: '#ccc'
          }}>
            <strong>🎛️ Option 3:</strong> Presets rapides + contrôles temps réel pour matériaux PBR Blender
            <br/>
            <strong>🔍 Debug:</strong> Contrôleur = {pbrLightingController ? '✅ Initialisé' : '❌ Non initialisé'}
          </div>

          {/* ✅ PRESETS RAPIDES */}
          <div style={{ marginBottom: '15px' }}>
            <h5 style={{ margin: '0 0 10px 0', color: '#FF9800', fontSize: '12px' }}>
              🎨 Presets Éclairage
            </h5>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
              {pbrLightingController?.getAvailablePresets()?.map(preset => (
                <button
                  key={preset.key}
                  onClick={() => handlePbrPresetChange(preset.key)}
                  style={{
                    padding: '6px 8px',
                    background: pbrSettings.currentPreset === preset.key ? '#FF9800' : '#333',
                    color: 'white',
                    border: '1px solid #555',
                    borderRadius: '4px',
                    fontSize: '9px',
                    cursor: 'pointer',
                    fontWeight: pbrSettings.currentPreset === preset.key ? 'bold' : 'normal'
                  }}
                  title={preset.description}
                >
                  {preset.name}
                </button>
              )) || 
              // ✅ FALLBACK: Boutons statiques si contrôleur pas prêt
              ['studioLight', 'studioProPlus'].map(presetKey => (
                <button
                  key={presetKey}
                  onClick={() => {
                    if (pbrLightingController) {
                      handlePbrPresetChange(presetKey);
                    }
                  }}
                  style={{
                    padding: '6px 8px',
                    background: pbrSettings.currentPreset === presetKey ? '#FF9800' : '#333',
                    color: 'white',
                    border: '1px solid #555',
                    borderRadius: '4px',
                    fontSize: '9px',
                    cursor: 'pointer',
                    fontWeight: pbrSettings.currentPreset === presetKey ? 'bold' : 'normal',
                    opacity: pbrLightingController ? 1 : 0.6
                  }}
                  title={pbrLightingController ? `Preset ${presetKey}` : 'Contrôleur non initialisé'}
                >
                  {presetKey === 'studioLight' ? 'Studio Pro' : presetKey === 'studioProPlus' ? 'Studio Pro +' : presetKey.charAt(0).toUpperCase() + presetKey.slice(1)}
                </button>
              ))}
            </div>
            
            {/* ✅ DESCRIPTION PRESET ACTUEL */}
            {pbrLightingController && (
              <div style={{ 
                marginTop: '8px',
                padding: '6px',
                background: 'rgba(255, 152, 0, 0.1)',
                borderRadius: '3px',
                fontSize: '9px',
                color: '#FF9800'
              }}>
                <strong>Actuel:</strong> {pbrLightingController.presets[pbrSettings.currentPreset]?.description}
              </div>
            )}
          </div>

          {/* ✅ SLIDERS GLOBAUX TEMPS RÉEL */}
          <div style={{ marginBottom: '15px' }}>
            <h5 style={{ margin: '0 0 10px 0', color: '#FF9800', fontSize: '12px' }}>
              🔧 Multipliers Globaux
            </h5>
            
            {/* Ambient Light Multiplier */}
            <div style={{ marginBottom: '10px' }}>
              <label style={{ fontSize: '10px', color: '#ccc', display: 'block', marginBottom: '4px' }}>
                Lumière Ambiante: ×{pbrSettings.ambientMultiplier.toFixed(3)}
                <input
                  type="range"
                  min="0.1"
                  max="25.0"
                  step="0.005"
                  value={pbrSettings.ambientMultiplier}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value);
                    handlePbrMultipliers(value, pbrSettings.directionalMultiplier);
                  }}
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
            
            {/* Directional Light Multiplier */}
            <div style={{ marginBottom: '10px' }}>
              <label style={{ fontSize: '10px', color: '#ccc', display: 'block', marginBottom: '4px' }}>
                Lumière Directionnelle: ×{pbrSettings.directionalMultiplier.toFixed(3)}
                <input
                  type="range"
                  min="0.1"
                  max="2.5"
                  step="0.005"
                  value={pbrSettings.directionalMultiplier}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value);
                    handlePbrMultipliers(pbrSettings.ambientMultiplier, value);
                  }}
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

          {/* ✅ ACTIONS RAPIDES */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
            <button
              onClick={() => {
                
                if (pbrLightingController) {
                  handlePbrPresetChange('studioProPlus');
                  handlePbrMultipliers(1.0, 1.0);
                } else {
                  // Fallback: reset local state
                  setPbrSettings({
                    currentPreset: 'studioProPlus',
                    ambientMultiplier: 1.0,
                    directionalMultiplier: 1.0,
                    customExposure: 1.7
                  });
                }
              }}
              style={{
                padding: '6px',
                background: '#607D8B',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                fontSize: '9px',
                cursor: 'pointer',
                fontWeight: 'bold',
                opacity: pbrLightingController ? 1 : 0.7
              }}
              title={pbrLightingController ? 'Reset au preset Sombre (V6)' : 'Contrôleur PBR non initialisé'}
            >
              🔄 Reset V6
            </button>
            
            <button
              onClick={() => {
                if (pbrLightingController) {
                  const _info = pbrLightingController.getDebugInfo();
                } else {
                  console.warn('⚠️ PBRLightingController non initialisé');
                }
              }}
              style={{
                padding: '6px',
                background: '#4CAF50',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                fontSize: '9px',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              📊 Debug
            </button>
          </div>

          {/* ✅ NOUVEAU : SECTION POSITION LUMIÈRE DIRECTIONNELLE */}
          <div style={{ marginTop: '15px', marginBottom: '15px' }}>
            <h5 style={{ margin: '0 0 10px 0', color: '#FF9800', fontSize: '12px' }}>
              🔆 Position Lumière Directionnelle
            </h5>
            
            {/* Presets de position */}
            <div style={{ marginBottom: '10px' }}>
              <div style={{ fontSize: '9px', color: '#ccc', marginBottom: '6px' }}>
                Presets rapides :
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '4px', marginBottom: '8px' }}>
                {Object.entries(LIGHT_POSITION_PRESETS).map(([key, preset]) => (
                  <button
                    key={key}
                    onClick={() => handleLightPositionPreset(key)}
                    style={{
                      padding: '4px 2px',
                      background: lightPositionSettings.currentPreset === key ? '#FF9800' : '#555',
                      color: 'white',
                      border: '1px solid #777',
                      borderRadius: '3px',
                      fontSize: '8px',
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
            <div style={{ marginBottom: '10px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10px', color: '#ccc', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={lightPositionSettings.advancedMode}
                  onChange={handleAdvancedModeToggle}
                  style={{ margin: 0 }}
                />
                Mode Avancé (Curseurs X, Y, Z)
              </label>
            </div>

            {/* Curseurs avancés (affiché seulement en mode avancé) */}
            {lightPositionSettings.advancedMode && (
              <div style={{ 
                padding: '8px', 
                background: 'rgba(255, 152, 0, 0.1)', 
                border: '1px solid rgba(255, 152, 0, 0.3)', 
                borderRadius: '4px' 
              }}>
                <div style={{ fontSize: '9px', color: '#FF9800', marginBottom: '8px', fontWeight: 'bold' }}>
                  🎛️ Contrôle Manuel de Position
                </div>
                
                {/* Curseur X */}
                <div style={{ marginBottom: '8px' }}>
                  <label style={{ fontSize: '9px', color: '#ccc', display: 'block', marginBottom: '2px' }}>
                    X (Gauche ↔ Droite): {lightPositionSettings.customPosition.x.toFixed(1)}
                  </label>
                  <input
                    type="range"
                    min="-10"
                    max="10"
                    step="0.1"
                    value={lightPositionSettings.customPosition.x}
                    onChange={(e) => handleCustomPositionChange('x', e.target.value)}
                    style={{
                      width: '100%',
                      height: '3px',
                      background: '#333',
                      borderRadius: '2px',
                      outline: 'none',
                      WebkitAppearance: 'none',
                      appearance: 'none'
                    }}
                  />
                </div>

                {/* Curseur Y */}
                <div style={{ marginBottom: '8px' }}>
                  <label style={{ fontSize: '9px', color: '#ccc', display: 'block', marginBottom: '2px' }}>
                    Y (Bas ↔ Haut): {lightPositionSettings.customPosition.y.toFixed(1)}
                  </label>
                  <input
                    type="range"
                    min="-5"
                    max="10"
                    step="0.1"
                    value={lightPositionSettings.customPosition.y}
                    onChange={(e) => handleCustomPositionChange('y', e.target.value)}
                    style={{
                      width: '100%',
                      height: '3px',
                      background: '#333',
                      borderRadius: '2px',
                      outline: 'none',
                      WebkitAppearance: 'none',
                      appearance: 'none'
                    }}
                  />
                </div>

                {/* Curseur Z */}
                <div style={{ marginBottom: '6px' }}>
                  <label style={{ fontSize: '9px', color: '#ccc', display: 'block', marginBottom: '2px' }}>
                    Z (Arrière ↔ Avant): {lightPositionSettings.customPosition.z.toFixed(1)}
                  </label>
                  <input
                    type="range"
                    min="-10"
                    max="10"
                    step="0.1"
                    value={lightPositionSettings.customPosition.z}
                    onChange={(e) => handleCustomPositionChange('z', e.target.value)}
                    style={{
                      width: '100%',
                      height: '3px',
                      background: '#333',
                      borderRadius: '2px',
                      outline: 'none',
                      WebkitAppearance: 'none',
                      appearance: 'none'
                    }}
                  />
                </div>

                {/* Info position actuelle */}
                <div style={{ fontSize: '8px', color: '#999', textAlign: 'center' }}>
                  Position actuelle: ({lightPositionSettings.customPosition.x.toFixed(1)}, {lightPositionSettings.customPosition.y.toFixed(1)}, {lightPositionSettings.customPosition.z.toFixed(1)})
                </div>
              </div>
            )}
          </div>

          {/* ✅ NOUVEAU : SECTION MATÉRIAUX PBR */}
          <div style={{ marginTop: '15px', marginBottom: '15px' }}>
            <h5 style={{ margin: '0 0 10px 0', color: '#FF9800', fontSize: '12px' }}>
              🎨 Matériaux Métalliques
            </h5>
            
            {/* Info */}
            <div style={{ 
              marginBottom: '10px', 
              padding: '6px', 
              background: 'rgba(255, 152, 0, 0.1)',
              border: '1px solid rgba(255, 152, 0, 0.3)',
              borderRadius: '3px',
              fontSize: '9px',
              color: '#FF9800'
            }}>
              <strong>Chrome/Metal:</strong> Ajustez metalness/roughness des matériaux importés
            </div>

            {/* Metalness Slider */}
            <div style={{ marginBottom: '10px' }}>
              <label style={{ fontSize: '10px', color: '#ccc', display: 'block', marginBottom: '4px' }}>
                Metalness: {materialSettings.metalness.toFixed(1)} (0.0=matte, 1.0=métal)
                <input
                  type="range"
                  min="0.3"
                  max="1.0"
                  step="0.005"
                  value={materialSettings.metalness}
                  onChange={(e) => handleMaterialProperty('metalness', e.target.value)}
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

            {/* Roughness Slider */}
            <div style={{ marginBottom: '10px' }}>
              <label style={{ fontSize: '10px', color: '#ccc', display: 'block', marginBottom: '4px' }}>
                Roughness: {materialSettings.roughness.toFixed(1)} (0.0=miroir, 1.0=rugueux)
                <input
                  type="range"
                  min="0.3"
                  max="1.0"
                  step="0.005"
                  value={materialSettings.roughness}
                  onChange={(e) => handleMaterialProperty('roughness', e.target.value)}
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

            {/* Presets rapides */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '4px' }}>
              <button
                onClick={() => {
                  handleMaterialProperty('metalness', 0.3);
                  handleMaterialProperty('roughness', 1.0);
                }}
                style={{
                  padding: '6px 2px',
                  background: '#795548',
                  color: 'white',
                  border: 'none',
                  borderRadius: '3px',
                  fontSize: '8px',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                🪨 Mat
              </button>
              <button
                onClick={() => {
                  handleMaterialProperty('metalness', 0.5);
                  handleMaterialProperty('roughness', 0.6);
                }}
                style={{
                  padding: '6px 2px',
                  background: '#607D8B',
                  color: 'white',
                  border: 'none',
                  borderRadius: '3px',
                  fontSize: '8px',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                ⚖️ Équilibré
              </button>
              <button
                onClick={() => {
                  handleMaterialProperty('metalness', 1.0);
                  handleMaterialProperty('roughness', 0.3);
                }}
                style={{
                  padding: '6px 2px',
                  background: '#37474F',
                  color: 'white',
                  border: 'none',
                  borderRadius: '3px',
                  fontSize: '8px',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                ✨ Miroir
              </button>
            </div>

            {/* ✅ NOUVEAU : ADVANCED LIGHTING SECTION */}
            <div style={{ marginTop: '20px', marginBottom: '15px', padding: '15px', border: '2px solid #4CAF50', borderRadius: '6px', background: 'rgba(76, 175, 80, 0.1)' }}>
              <h5 style={{ margin: '0 0 15px 0', color: '#4CAF50', fontSize: '12px', fontWeight: 'bold' }}>
                💡 Advanced Lighting (Three-Point)
              </h5>
              
              {/* Info explicative */}
              <div style={{ 
                marginBottom: '15px', 
                padding: '8px', 
                background: 'rgba(76, 175, 80, 0.15)',
                border: '1px solid rgba(76, 175, 80, 0.3)',
                borderRadius: '4px',
                fontSize: '9px',
                color: '#4CAF50'
              }}>
                <strong>Three-Point Lighting</strong> améliore drastiquement la visibilité des textures métalliques :<br/>
                • <strong>Key Light</strong> : Principale (45° angle)<br/>
                • <strong>Fill Light</strong> : Remplissage doux (bleuté)<br/>
                • <strong>Rim Light</strong> : Contour arrière (fait ressortir bords)
              </div>

              {/* Toggle ON/OFF global */}
              <div style={{ marginBottom: '15px' }}>
                <button
                  onClick={() => {
                    if (pbrLightingController) {
                      const newState = pbrLightingController.toggleAdvancedLighting();
                      console.log(`Advanced Lighting: ${newState ? 'ACTIVÉ' : 'DÉSACTIVÉ'}`);
                    }
                  }}
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: pbrLightingController?.advancedLights?.enabled ? '#4CAF50' : '#757575',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    fontSize: '11px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    transition: 'background 0.3s ease'
                  }}
                  onMouseOver={(e) => e.target.style.background = pbrLightingController?.advancedLights?.enabled ? '#45a049' : '#616161'}
                  onMouseOut={(e) => e.target.style.background = pbrLightingController?.advancedLights?.enabled ? '#4CAF50' : '#757575'}
                >
                  {pbrLightingController?.advancedLights?.enabled ? '🌟 DÉSACTIVER Advanced Lighting' : '💡 ACTIVER Advanced Lighting'}
                </button>
              </div>

              {/* ✅ PHASE 4B : Contrôles intensités individuelles */}
              {pbrLightingController?.advancedLights?.enabled && (
                <div style={{ marginTop: '15px', padding: '10px', background: 'rgba(76, 175, 80, 0.05)', borderRadius: '4px' }}>
                  <div style={{ fontSize: '10px', color: '#4CAF50', marginBottom: '10px', fontWeight: 'bold' }}>
                    Contrôles Individuels
                  </div>
                  
                  {/* Key Light Intensity */}
                  <div style={{ marginBottom: '8px' }}>
                    <label style={{ fontSize: '9px', color: '#ccc', display: 'block', marginBottom: '2px' }}>
                      Key Light: 0.800
                    </label>
                    <input
                      type="range"
                      min="0.0"
                      max="2.0"
                      step="0.005"
                      defaultValue={0.8}
                      onChange={(e) => {
                        if (pbrLightingController) {
                          const keyVal = parseFloat(e.target.value);
                          pbrLightingController.setAdvancedLightingIntensities(keyVal, 0.3, 0.5);
                          e.target.previousSibling.textContent = `Key Light: ${keyVal.toFixed(3)}`;
                        }
                      }}
                      style={{ width: '100%', height: '3px', background: '#333', borderRadius: '2px', outline: 'none', WebkitAppearance: 'none', appearance: 'none' }}
                    />
                  </div>

                  {/* Fill Light Intensity */}
                  <div style={{ marginBottom: '8px' }}>
                    <label style={{ fontSize: '9px', color: '#ccc', display: 'block', marginBottom: '2px' }}>
                      Fill Light: 0.300
                    </label>
                    <input
                      type="range"
                      min="0.0"
                      max="1.0"
                      step="0.005"
                      defaultValue={0.3}
                      onChange={(e) => {
                        if (pbrLightingController) {
                          const fillVal = parseFloat(e.target.value);
                          pbrLightingController.setAdvancedLightingIntensities(0.8, fillVal, 0.5);
                          e.target.previousSibling.textContent = `Fill Light: ${fillVal.toFixed(3)}`;
                        }
                      }}
                      style={{ width: '100%', height: '3px', background: '#333', borderRadius: '2px', outline: 'none', WebkitAppearance: 'none', appearance: 'none' }}
                    />
                  </div>

                  {/* Rim Light Intensity */}
                  <div>
                    <label style={{ fontSize: '9px', color: '#ccc', display: 'block', marginBottom: '2px' }}>
                      Rim Light: 0.500
                    </label>
                    <input
                      type="range"
                      min="0.0"
                      max="1.5"
                      step="0.005"
                      defaultValue={0.5}
                      onChange={(e) => {
                        if (pbrLightingController) {
                          const rimVal = parseFloat(e.target.value);
                          pbrLightingController.setAdvancedLightingIntensities(0.8, 0.3, rimVal);
                          e.target.previousSibling.textContent = `Rim Light: ${rimVal.toFixed(3)}`;
                        }
                      }}
                      style={{ width: '100%', height: '3px', background: '#333', borderRadius: '2px', outline: 'none', WebkitAppearance: 'none', appearance: 'none' }}
                    />
                  </div>
                </div>
              )}
              
              <div style={{ fontSize: '9px', color: '#aaa', marginTop: '10px', opacity: 0.7 }}>
                Impact performance: +5-10% GPU
              </div>
            </div>

            {/* ✅ PHASE 4A : AREA LIGHTS SECTION */}
            <div style={{ marginTop: '20px', marginBottom: '15px', padding: '15px', border: '2px solid #FF5722', borderRadius: '6px', background: 'rgba(255, 87, 34, 0.1)' }}>
              <h5 style={{ margin: '0 0 15px 0', color: '#FF5722', fontSize: '12px', fontWeight: 'bold' }}>
                🔲 Area Lights (Studio)
              </h5>
              
              {/* Info explicative */}
              <div style={{ 
                marginBottom: '15px', 
                padding: '8px', 
                background: 'rgba(255, 87, 34, 0.15)',
                border: '1px solid rgba(255, 87, 34, 0.3)',
                borderRadius: '4px',
                fontSize: '9px',
                color: '#FF5722'
              }}>
                <strong>Area Lights</strong> = éclairage surfacique ultra-doux :<br/>
                • <strong>Main Area</strong> : Panneau LED 6×4 (fenêtre studio)<br/>
                • <strong>Fill Area</strong> : Panneau 4×3 bleuté (remplissage)<br/>
                • Plus doux que DirectionalLight, idéal pour chrome/métal
              </div>

              {/* Toggle ON/OFF Area Lights */}
              <div style={{ marginBottom: '15px' }}>
                <button
                  onClick={() => {
                    if (pbrLightingController) {
                      const _newState = pbrLightingController.toggleAreaLights();
                    }
                  }}
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: '#FF5722',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    fontSize: '11px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    transition: 'background 0.3s ease'
                  }}
                  onMouseOver={(e) => e.target.style.background = '#E64A19'}
                  onMouseOut={(e) => e.target.style.background = '#FF5722'}
                >
                  {pbrLightingController?.areaLights?.enabled ? '🔲 DÉSACTIVER Area Lights' : '💡 ACTIVER Area Lights'}
                </button>
              </div>

              {/* ✅ PHASE 4B : Contrôles Area Light intensités */}
              {pbrLightingController?.areaLights?.enabled && (
                <div style={{ marginTop: '15px', padding: '10px', background: 'rgba(255, 87, 34, 0.05)', borderRadius: '4px' }}>
                  <div style={{ fontSize: '10px', color: '#FF5722', marginBottom: '10px', fontWeight: 'bold' }}>
                    Contrôles Area Lights
                  </div>
                  
                  {/* Main Area Light Intensity */}
                  <div style={{ marginBottom: '8px' }}>
                    <label style={{ fontSize: '9px', color: '#ccc', display: 'block', marginBottom: '2px' }}>
                      Main Area (6×4): 2.000
                    </label>
                    <input
                      type="range"
                      min="0.0"
                      max="5.0"
                      step="0.005"
                      defaultValue={2.0}
                      onChange={(e) => {
                        if (pbrLightingController) {
                          const mainVal = parseFloat(e.target.value);
                          pbrLightingController.setAreaLightIntensities(mainVal, 1.0);
                          e.target.previousSibling.textContent = `Main Area (6×4): ${mainVal.toFixed(3)}`;
                        }
                      }}
                      style={{ width: '100%', height: '3px', background: '#333', borderRadius: '2px', outline: 'none', WebkitAppearance: 'none', appearance: 'none' }}
                    />
                  </div>

                  {/* Fill Area Light Intensity */}
                  <div>
                    <label style={{ fontSize: '9px', color: '#ccc', display: 'block', marginBottom: '2px' }}>
                      Fill Area (4×3): 1.000
                    </label>
                    <input
                      type="range"
                      min="0.0"
                      max="3.0"
                      step="0.005"
                      defaultValue={1.0}
                      onChange={(e) => {
                        if (pbrLightingController) {
                          const fillVal = parseFloat(e.target.value);
                          pbrLightingController.setAreaLightIntensities(2.0, fillVal);
                          e.target.previousSibling.textContent = `Fill Area (4×3): ${fillVal.toFixed(3)}`;
                        }
                      }}
                      style={{ width: '100%', height: '3px', background: '#333', borderRadius: '2px', outline: 'none', WebkitAppearance: 'none', appearance: 'none' }}
                    />
                  </div>
                </div>
              )}

              {/* Info technique */}
              <div style={{ fontSize: '9px', color: '#aaa', marginTop: '10px', opacity: 0.7 }}>
                Impact performance: +10-15% GPU (requires RectAreaLight)
              </div>
            </div>


            {/* ✅ PHASE 5B : HDR BOOST SECTION */}
            <div style={{ marginTop: '20px', marginBottom: '15px', padding: '15px', border: '2px solid #FF9800', borderRadius: '6px', background: 'rgba(255, 152, 0, 0.1)' }}>
              <h5 style={{ margin: '0 0 15px 0', color: '#FF9800', fontSize: '12px', fontWeight: 'bold' }}>
                🌟 HDR Boost (Ultra-Brillance)
              </h5>
              
              {/* Info explicative */}
              <div style={{ 
                marginBottom: '15px', 
                padding: '8px', 
                background: 'rgba(255, 152, 0, 0.15)',
                border: '1px solid rgba(255, 152, 0, 0.3)',
                borderRadius: '4px',
                fontSize: '9px',
                color: '#FF9800'
              }}>
                <strong>HDR Boost</strong> = intensités ultra-hautes pour métaux :<br/>
                • Lumières × 1.5 à × 2.2 (au-delà des limites normales)<br/>
                • Tone Mapping ACES automatique pour éviter surexposition<br/>
                • Matériaux métalliques optimisés (envMapIntensity × 1.5)<br/>
                • Roughness réduite pour plus de brillance
              </div>

              {/* ✅ V15: Checkbox Toggle HDR Boost (actif par défaut) */}
              <div style={{ marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px', padding: '10px', background: hdrBoostSettings.enabled ? '#2a2a2a' : '#1a1a1a', borderRadius: '4px', border: hdrBoostSettings.enabled ? '2px solid #FF9800' : '2px solid #666' }}>
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  cursor: 'pointer',
                  fontSize: '11px',
                  fontWeight: 'bold',
                  color: hdrBoostSettings.enabled ? '#FF9800' : '#999',
                  flex: '1'
                }}>
                  <input
                    type="checkbox"
                    checked={hdrBoostSettings.enabled}
                    onChange={(e) => {
                      const enabled = e.target.checked;
                      setHdrBoostSettings(prev => ({ ...prev, enabled }));
                      
                      // 🎯 CCS: Priorité au SceneStateController
                      if (stateController) {
                        stateController.setHDRBoost(enabled, hdrBoostSettings.multiplier);
                      } else if (pbrLightingController) {
                        // Fallback ancien système
                        pbrLightingController.applyHDRBoost(enabled);
                      }
                    }}
                    style={{ marginRight: '8px', transform: 'scale(1.2)' }}
                  />
                  {hdrBoostSettings.enabled ? '🌟 HDR Boost ACTIF' : '🌙 HDR Boost OFF'}
                </label>
                
                <div style={{ 
                  fontSize: '8px', 
                  color: hdrBoostSettings.enabled ? '#FF9800' : '#666',
                  fontWeight: 'bold',
                  padding: '2px 6px',
                  borderRadius: '2px',
                  background: hdrBoostSettings.enabled ? 'rgba(255, 152, 0, 0.1)' : 'rgba(102, 102, 102, 0.1)'
                }}>
                  ×{hdrBoostSettings.multiplier.toFixed(1)}
                </div>
              </div>

              {/* ✅ V15: SLIDER HDR BOOST PRÉCIS - Connecté à l'état */}
              <div style={{ marginBottom: '15px', opacity: hdrBoostSettings.enabled ? 1 : 0.5 }}>
                <div style={{ fontSize: '10px', color: hdrBoostSettings.enabled ? '#FF9800' : '#666', marginBottom: '10px', fontWeight: 'bold' }}>
                  🌟 HDR Boost Précis
                </div>
                
                <div style={{ marginBottom: '8px' }}>
                  <label style={{ fontSize: '9px', color: '#ccc', display: 'block', marginBottom: '2px' }}>
                    Multiplicateur HDR: {hdrBoostSettings.multiplier.toFixed(3)}
                  </label>
                  <input
                    type="range"
                    min="0.1"
                    max="5.0"
                    step="0.005"
                    value={hdrBoostSettings.multiplier}
                    disabled={!hdrBoostSettings.enabled}
                    onChange={(e) => {
                      const multiplier = parseFloat(e.target.value);
                      setHdrBoostSettings(prev => ({ ...prev, multiplier }));
                      
                      if (pbrLightingController && hdrBoostSettings.enabled) {
                        pbrLightingController.setHDRBoostMultiplier(multiplier);
                      }
                    }}
                    style={{ 
                      width: '100%', 
                      height: '3px', 
                      background: '#333', 
                      borderRadius: '2px', 
                      outline: 'none', 
                      WebkitAppearance: 'none', 
                      appearance: 'none',
                      cursor: hdrBoostSettings.enabled ? 'pointer' : 'not-allowed'
                    }}
                  />
                  <div style={{ fontSize: '8px', color: '#999', marginTop: '4px', display: 'flex', justifyContent: 'space-between' }}>
                    <span>0.1 (Minimal)</span>
                    <span>2.5 (Défaut)</span>
                    <span>5.0 (Ultra)</span>
                  </div>
                </div>
              </div>

              {/* Bouton enhancement matériaux */}
              <button
                onClick={() => {
                  if (pbrLightingController) {
                    const _enhanced = pbrLightingController.enhanceMetallicMaterials();
                  }
                }}
                style={{
                  width: '100%',
                  padding: '10px',
                  background: '#E65100',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '9px',
                  cursor: 'pointer',
                  marginBottom: '10px'
                }}
              >
                ✨ Optimiser Matériaux Métalliques
              </button>

              {/* Info technique */}
              <div style={{ fontSize: '9px', color: '#aaa', marginTop: '10px', opacity: 0.7 }}>
                <div>• Ambient +50%, Directional +100%, Key +80%, Rim +120%</div>
                <div>• Tone Mapping: ACES, Exposure: 0.6</div>
                <div>• Impact performance: +5% GPU (tone mapping)</div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* 🌌 TAB BACKGROUND */}
      {activeTab === 'background' && (
        <div>
          <h4 style={{ margin: '0 0 15px 0', color: '#9C27B0', fontSize: '14px' }}>
            🌌 Contrôle du Background
          </h4>
          
          {/* ✅ INFO */}
          <div style={{ 
            marginBottom: '15px', 
            padding: '8px', 
            background: 'rgba(156, 39, 176, 0.1)',
            border: '1px solid rgba(156, 39, 176, 0.3)',
            borderRadius: '4px',
            fontSize: '10px',
            color: '#ccc'
          }}>
            <strong>ℹ️ Background:</strong> Contrôlez l'arrière-plan de la scène 3D. Par défaut, la scène utilise un gris moyen (#404040).
          </div>


          {/* ✅ COULEUR PERSONNALISÉE */}
          <div style={{ 
            marginBottom: '15px', 
            padding: '10px', 
            border: '1px solid #555', 
            borderRadius: '4px',
            background: 'rgba(156, 39, 176, 0.1)'
          }}>
            <h5 style={{ margin: '0 0 8px 0', color: '#9C27B0', fontSize: '12px' }}>
              🎨 Couleur Personnalisée
            </h5>
            <label style={{ fontSize: '10px', color: '#ccc', display: 'block', marginBottom: '6px' }}>
              Choisir une couleur:
              <input
                type="color"
                value={backgroundSettings.color}
                onChange={(e) => {
                  const newColor = e.target.value;
                  handleBackgroundChange('color', newColor);
                }}
                style={{
                  width: '100%',
                  height: '35px',
                  border: '1px solid #555',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  marginTop: '4px'
                }}
              />
            </label>
            <div style={{ fontSize: '9px', color: '#999', marginTop: '6px' }}>
              Couleur actuelle: {backgroundSettings.color} ({backgroundSettings.type})
            </div>
          </div>

          {/* ✅ STATUS */}
          <div style={{ 
            padding: '8px', 
            background: 'rgba(0,0,0,0.3)',
            border: '1px solid #555',
            borderRadius: '4px',
            fontSize: '10px',
            color: '#ccc'
          }}>
            <strong>📊 Status:</strong><br/>
            Type: {backgroundSettings.type}<br/>
            {backgroundSettings.type === 'color' && `Couleur: ${backgroundSettings.color}`}
            {backgroundSettings.type === 'transparent' && 'Arrière-plan transparent'}
            {backgroundSettings.type === 'black' && 'Arrière-plan noir'}
            {backgroundSettings.type === 'white' && 'Arrière-plan blanc'}
            {backgroundSettings.type === 'dark' && 'Arrière-plan sombre'}
          </div>
        </div>
      )}

      {/* 🎯 TAB MSAA CONTROLS */}
      {activeTab === 'msaa' && (
        <div>
          <MSAAControlsPanel
            bloomSystem={bloomSystem}
            renderer={renderer}
            onSettingsChange={handleMSAASettingsChange}
            onPerformanceUpdate={null}
          />
          
          {/* 📊 Performance Status */}
          <div style={{
            marginTop: '16px',
            padding: '10px',
            background: `rgba(${getPerformanceStatus().color === '#4CAF50' ? '76, 175, 80' : 
                              getPerformanceStatus().color === '#FF9800' ? '255, 152, 0' : 
                              getPerformanceStatus().color === '#FF5722' ? '255, 87, 34' : 
                              '244, 67, 54'}, 0.1)`,
            border: `1px solid ${getPerformanceStatus().color}`,
            borderRadius: '4px'
          }}>
            <h4 style={{ 
              margin: '0 0 8px 0', 
              color: getPerformanceStatus().color, 
              fontSize: '12px' 
            }}>
              📊 Performance Status
            </h4>
            <div style={{ fontSize: '10px', color: '#ccc' }}>
              <div><strong>Status:</strong> {getPerformanceStatus().message}</div>
              <div><strong>Avg FPS:</strong> {performanceStats.averageFps} (Min: {performanceStats.minFps}, Max: {performanceStats.maxFps})</div>
              <div><strong>Stability:</strong> {performanceStats.isStable ? '✅ Stable' : '⚠️ Unstable'}</div>
              <div><strong>Frame Time:</strong> {performanceStats.averageFrameTime.toFixed(1)}ms avg</div>
            </div>
            
            <button
              onClick={resetStats}
              style={{
                marginTop: '8px',
                padding: '4px 8px',
                background: '#333',
                color: 'white',
                border: '1px solid #555',
                borderRadius: '3px',
                fontSize: '9px',
                cursor: 'pointer'
              }}
            >
              🔄 Reset Stats
            </button>
          </div>
          
          {/* 🎯 MSAA vs TAA Comparison Info */}
          <div style={{
            marginTop: '16px',
            padding: '10px',
            background: 'rgba(156, 39, 176, 0.1)',
            border: '1px solid rgba(156, 39, 176, 0.3)',
            borderRadius: '4px',
            fontSize: '9px',
            color: '#9C27B0'
          }}>
            <h4 style={{ margin: '0 0 6px 0', fontSize: '11px' }}>
              🔬 MSAA vs TAA Comparison
            </h4>
            <div style={{ color: '#ccc', lineHeight: '1.3' }}>
              <div><strong>MSAA:</strong> Hardware anti-aliasing for geometry edges</div>
              <div><strong>FXAA:</strong> Post-processing for texture/shader aliasing</div>
              <div><strong>Performance:</strong> MSAA is faster but uses more VRAM</div>
              <div><strong>Quality:</strong> TAA has better texture AA, MSAA better stability</div>
            </div>
          </div>
        </div>
      )}


    </div>
    
    {/* Performance Monitor flottant */}
    <PerformanceMonitor 
      performanceStats={perfMonitorStats}
    />
    </>
  );
}