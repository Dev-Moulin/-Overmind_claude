import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { FXAAShader } from 'three/examples/jsm/shaders/FXAAShader.js';
import { CopyShader } from 'three/examples/jsm/shaders/CopyShader.js';
// ✅ PHASE 2 GTAO: Import Ground Truth Ambient Occlusion
import { GTAOPass } from 'three/examples/jsm/postprocessing/GTAOPass.js';
// ✅ PHASE 3 MSAA: FXAA toujours actif (pas d'import TAA)

/**
 * SimpleBloomSystem MSAA - Système de bloom avec Multi-Sample Anti-Aliasing
 * Pipeline V12.2: PMREM + GTAO + MSAA + FXAA + Bloom + Exposure
 * Alternative performante au TAA pour mobile et production web
 */
export class SimpleBloomSystem {
  constructor(scene, camera, renderer) {
    this.scene = scene;
    this.camera = camera;
    this.renderer = renderer;
    
    // ✅ CONFIGURATION SIMPLE
    this.config = {
      threshold: 0.15,
      strength: 0.40,
      radius: 0.40
    };
    
    // ✅ NOUVEAU : Configuration par groupe d'objets
    this.groupConfigs = {
      iris: {
        emissiveColor: 0x00ff88,
        emissiveIntensity: 0.3,
        bloomSettings: { threshold: 0.15, strength: 0.40, radius: 0.4 }
      },
      eyeRings: {
        emissiveColor: 0x4488ff,
        emissiveIntensity: 0.4,
        bloomSettings: { threshold: 0.4, strength: 0.6, radius: 0.3 }
      },
      revealRings: {
        emissiveColor: 0xffaa00,
        emissiveIntensity: 0.5,
        bloomSettings: { threshold: 0.43, strength: 0.40, radius: 0.36 }
      }
    };
    
    // ✅ CORRECTION : Tracking des objets modifiés pour éviter needsUpdate global
    this.modifiedMaterials = new Set();
    
    // ✅ PHASE 3 MSAA: Configuration Multi-Sample Anti-Aliasing
    this.msaaConfig = {
      enabled: true,
      samples: 4, // 2x, 4x, 8x, 16x samples (4x = recommandé)
      hardware: true, // Utilise MSAA hardware GPU
      // ✅ Paramètres adaptatifs selon performance
      adaptiveSettings: {
        mobile: { samples: 2 },    // 2x MSAA mobile
        balanced: { samples: 4 },  // 4x MSAA équilibré  
        quality: { samples: 8 },   // 8x MSAA qualité
        ultra: { samples: 16 }     // 16x MSAA maximum
      }
    };
    
    // ✅ PHASE 2 GTAO: Configuration Ground Truth Ambient Occlusion
    this.gtaoConfig = {
      enabled: true,
      radius: 0.25,
      distanceExponent: 1.0,
      thickness: 1.0,
      distanceFallOff: 1.0,
      scale: 1.0,
      samples: 16,
      rings: 4,
      // ✅ Paramètres adaptatifs selon thème background
      adaptiveSettings: {
        bright: { scale: 1.5, samples: 24 }, // Plus de contraste sur fond clair
        dark: { scale: 0.8, samples: 12 },   // Moins agressif sur fond sombre
        balanced: { scale: 1.0, samples: 16 } // Standard
      }
    };
    
    // ✅ NOUVEAU : Modes de sécurité
    this.securityModes = {
      SAFE: { color: 0x00ff88, intensity: 0.3 },
      DANGER: { color: 0xff4444, intensity: 0.8 },
      WARNING: { color: 0xffaa00, intensity: 0.5 },
      SCANNING: { color: 0x4488ff, intensity: 0.6 },
      NORMAL: { color: 0xffffff, intensity: 0.2 }
    };
    
    this.currentSecurityMode = 'NORMAL';
    this.isEnabled = true;
    this.composer = null;
    this.bloomPass = null;
    this.fxaaPass = null; // ✅ PHASE 3: FXAA Pass (toujours actif)
    this.luminousObjects = new Set();
    this.objectGroups = {
      iris: new Set(),
      eyeRings: new Set(),
      revealRings: new Set(),
      magicRings: new Set(),  // ✅ CORRECTION : Ajouter groupe manquant
      arms: new Set()         // ✅ CORRECTION : Ajouter groupe arms aussi
    };
    
    // ✅ NOUVEAU V8 : Support exposure
    this.exposure = 1.0;
    
    // ✅ MSAA V12.2: Configuration renderer avec samples
    this.rendererMSAAConfig = {
      antialias: true,           // Active MSAA hardware
      samples: this.msaaConfig.samples, // Nombre échantillons
      alpha: false,              // Pas de canal alpha (performance)
      premultipliedAlpha: false  // Évite artifacts blending
    };
    
    // ✅ THROTTLE : Pour limiter les logs à 1 fois par seconde
    this.lastLogTime = 0;
    this.logThrottleDelay = 1000; // 1 seconde
    
  }
  
  init() {
    if (!this.scene || !this.camera || !this.renderer) {
      console.error('❌ SimpleBloomSystem: Scene, camera ou renderer manquant');
      return false;
    }
    
    try {
      // ✅ COMPOSER PRINCIPAL
      this.composer = new EffectComposer(this.renderer);
      
      // ✅ RENDER PASS
      const renderPass = new RenderPass(this.scene, this.camera);
      this.composer.addPass(renderPass);
      
      // ✅ PHASE 2 GTAO: Ground Truth Ambient Occlusion Pass
      if (this.gtaoConfig.enabled) {
        this.gtaoPass = new GTAOPass(this.scene, this.camera, window.innerWidth, window.innerHeight);
        
        // Configuration GTAO
        this.gtaoPass.radius = this.gtaoConfig.radius;
        this.gtaoPass.distanceExponent = this.gtaoConfig.distanceExponent;
        this.gtaoPass.thickness = this.gtaoConfig.thickness;
        this.gtaoPass.distanceFallOff = this.gtaoConfig.distanceFallOff;
        this.gtaoPass.scale = this.gtaoConfig.scale;
        this.gtaoPass.samples = this.gtaoConfig.samples;
        this.gtaoPass.rings = this.gtaoConfig.rings;
        
        this.composer.addPass(this.gtaoPass);
      }
      
      // ✅ PHASE 3 MSAA: Configuration Multi-Sample Anti-Aliasing Hardware
      if (this.msaaConfig.enabled) {
        try {
          // ✅ Vérifier support WebGL2 pour MSAA
          const gl = this.renderer.getContext();
          const isWebGL2 = gl instanceof WebGL2RenderingContext;
          
          if (isWebGL2 && gl) {
            // ✅ MSAA V12.2: Configuration renderer avec anti-aliasing hardware
            this.renderer.antialias = this.msaaConfig.hardware;
            
            // Vérifier capacités GPU
            const maxSamples = gl.getParameter(gl.MAX_SAMPLES);
            this.msaaConfig.samples = Math.min(this.msaaConfig.samples, maxSamples);
          } else {
            console.warn('⚠️ WebGL2 non supporté, MSAA désactivé');
            this.msaaConfig.enabled = false;
          }
          
        } catch (error) {
          console.error('❌ MSAA configuration échouée:', error);
          this.renderer.antialias = false;
          this.msaaConfig.enabled = false;
        }
      }
      
      // ✅ FXAA Pass (actif si MSAA indisponible ou comme complément)
      this.fxaaPass = new ShaderPass(FXAAShader);
      this.fxaaPass.material.uniforms['resolution'].value.x = 1 / (window.innerWidth * this.renderer.getPixelRatio());
      this.fxaaPass.material.uniforms['resolution'].value.y = 1 / (window.innerHeight * this.renderer.getPixelRatio());
      this.fxaaPass.enabled = !this.msaaConfig.enabled; // FXAA actif si pas de MSAA
      
      this.composer.addPass(this.fxaaPass);
      
      // ✅ UNREAL BLOOM PASS
      this.bloomPass = new UnrealBloomPass(
        new THREE.Vector2(window.innerWidth, window.innerHeight),
        this.config.strength,
        this.config.radius,
        this.config.threshold
      );
      this.composer.addPass(this.bloomPass);
      
      // ✅ NOUVEAU V8 : EXPOSURE PASS PERSONNALISÉ
      this.exposurePass = new ShaderPass({
        uniforms: {
          tDiffuse: { value: null },
          exposure: { value: this.exposure }
        },
        vertexShader: `
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          uniform sampler2D tDiffuse;
          uniform float exposure;
          varying vec2 vUv;
          
          void main() {
            vec4 texel = texture2D(tDiffuse, vUv);
            gl_FragColor = vec4(texel.rgb * exposure, texel.a);
          }
        `
      });
      this.composer.addPass(this.exposurePass);
      
      // ✅ MSAA V12.2: FXAA déjà ajouté avec MSAA (pas de duplication)
      
      // ✅ COPY PASS (final) - Fix renderToScreen issue
      const copyPass = new ShaderPass(CopyShader);
      copyPass.renderToScreen = true;
      copyPass.enabled = true;
      this.composer.addPass(copyPass);
      
      // ✅ PHASE 4 FIX: Forcer renderToScreen sur le dernier pass
      const lastPass = this.composer.passes[this.composer.passes.length - 1];
      lastPass.renderToScreen = true;
      
      return true;
    } catch (error) {
      console.error('❌ SimpleBloomSystem: Erreur initialisation composer:', error);
      return false;
    }
  }
  
  setupLuminousObjects() {
    if (!this.scene) return;
    
    this.scene.traverse((child) => {
      if (child.isMesh && child.material) {
        const material = Array.isArray(child.material) ? child.material[0] : child.material;
        
        if (material.emissive && material.emissive.getHex() !== 0x000000) {
          this.luminousObjects.add(child);
        }
      }
    });
    
  }
  
  addToGroup(mesh, groupName) {
    if (this.objectGroups[groupName]) {
      this.objectGroups[groupName].add(mesh);
    } else {
      console.warn(`⚠️ Groupe inconnu: ${groupName}`);
    }
  }
  
  updateGroup(groupName, settings) {
    if (!this.objectGroups[groupName]) {
      console.warn(`⚠️ Groupe inconnu: ${groupName}`);
      return;
    }
    
    this.objectGroups[groupName].forEach(mesh => {
      if (mesh.material) {
        const material = Array.isArray(mesh.material) ? mesh.material[0] : mesh.material;
        
        let changed = false;
        
        if (settings.emissiveColor !== undefined) {
          material.emissive.setHex(settings.emissiveColor);
          changed = true;
        }
        
        if (settings.emissiveIntensity !== undefined) {
          material.emissiveIntensity = settings.emissiveIntensity;
          changed = true;
        }
        
        if (changed) {
          this.modifiedMaterials.add(material);
          material.needsUpdate = true;
        }
      }
    });
    
    // ✅ CORRECTION : Synchroniser config groupe avec settings
    if (this.groupConfigs[groupName]) {
      Object.assign(this.groupConfigs[groupName], settings);
    }
  }
  
  setSecurityMode(mode) {
    if (!this.securityModes[mode]) {
      console.warn(`⚠️ Mode de sécurité inconnu: ${mode}`);
      return;
    }
    
    this.currentSecurityMode = mode;
    const config = this.securityModes[mode];
    
    // Appliquer aux groupes iris et eyeRings
    ['iris', 'eyeRings'].forEach(groupName => {
      this.updateGroup(groupName, {
        emissiveColor: config.color,
        emissiveIntensity: config.intensity
      });
    });
    
  }
  
  updateColorBloom(colorName, bloomSettings) {
    if (!this.groupConfigs[colorName]) {
      console.warn(`⚠️ Couleur inconnue: ${colorName}`);
      return;
    }
    
    this.groupConfigs[colorName].bloomSettings = {
      ...this.groupConfigs[colorName].bloomSettings,
      ...bloomSettings
    };
    
  }
  
  updateGroupBloom(groupName, bloomSettings) {
    if (!this.groupConfigs[groupName]) {
      console.warn(`⚠️ Groupe inconnu: ${groupName}`);
      return;
    }
    
    this.groupConfigs[groupName].bloomSettings = {
      ...this.groupConfigs[groupName].bloomSettings,
      ...bloomSettings
    };
    
  }
  
  // ✅ CORRECTION CONFLIT #1 : Source unique d'exposition - renderer seulement
  syncExposure() {
    if (!this.renderer) return;
    
    const rendererExposure = this.renderer.toneMappingExposure;
    
    // ✅ OPTIMISATION : Synchroniser seulement si la valeur a changé
    if (Math.abs(rendererExposure - this.exposure) > 0.001) {
      this.exposure = rendererExposure;
      
      // ✅ APPLIQUER seulement aux shaders internes du bloom
      if (this.exposurePass && this.exposurePass.material && this.exposurePass.material.uniforms.exposure) {
        this.exposurePass.material.uniforms.exposure.value = this.exposure;
      }
    }
  }
  
  // ✅ CORRECTION CONFLIT #1 : Source unique - toujours depuis le renderer
  getExposure() {
    return this.renderer ? this.renderer.toneMappingExposure : 1.0;
  }
  
  render() {
    if (!this.composer) {
      console.warn('❌ SimpleBloomSystem: Composer non initialisé, rendu standard');
      this.renderer.render(this.scene, this.camera);
      return;
    }
    
    // ✅ CRITICAL FIX: Always use composer, bloom is controlled via bloomPass.enabled
    
    try {
      // ✅ CORRECTION CONFLIT #1 : Synchroniser exposure depuis le renderer
      this.syncExposure();
      
      // ✅ OPTIMISATION : Appliquer needsUpdate seulement aux matériaux modifiés
      if (this.modifiedMaterials.size > 0) {
        this.modifiedMaterials.forEach(material => {
          material.needsUpdate = true;
        });
        this.modifiedMaterials.clear();
      }
      
      // Diagnostic réduit: seulement compter objets émissifs
      if (this.bloomPass) {
        const now = Date.now();
        if (now - this.lastLogTime > this.logThrottleDelay) {
          let emissiveCount = 0;
          if (this.scene) {
            this.scene.traverse((child) => {
              if (child.isMesh && child.material && child.material.emissive) {
                const emissiveHex = child.material.emissive.getHex();
                const intensity = child.material.emissiveIntensity || 0;
                if (emissiveHex !== 0x000000 || intensity > 0) {
                  emissiveCount++;
                }
              }
            });
          }
          console.log(`🔍 RENDU: ${emissiveCount} objets émissifs, bloom=${this.bloomPass.enabled ? 'ON' : 'OFF'}`);
          this.lastLogTime = now;
        }
      }
      
      // ✅ RENDU VIA COMPOSER
      this.composer.render();
      
    } catch (error) {
      console.error('❌ Erreur rendu SimpleBloomSystem:', error);
      // Fallback au rendu normal avec exposure
      this.renderer.toneMappingExposure = this.exposure;
      this.renderer.render(this.scene, this.camera);
    }
  }
  
  updateBloom(param, value) {
    if (!this.bloomPass) {
      console.warn(`❌ SimpleBloomSystem: bloomPass not initialized`);
      return;
    }
    
    // ✅ CORRIGÉ : Mettre à jour le paramètre spécifique
    switch (param) {
      case 'threshold':
        this.config.threshold = value;
        this.bloomPass.threshold = value;
        break;
      case 'strength':
        this.config.strength = value;
        this.bloomPass.strength = value;
        break;
      case 'radius':
        this.config.radius = value;
        this.bloomPass.radius = value;
        break;
      case 'enabled':
        this.setBloomEnabled(value);
        return;
      default:
        console.warn(`⚠️ Paramètre bloom inconnu: ${param}`);
        return;
    }
  }
  
  /**
   * 🔧 NOUVELLE MÉTHODE: Forcer la recompilation des shaders bloom pour emissive changes
   * Problème identifié: UnrealBloomPass ne recalcule pas sa passe de luminance quand les matériaux émissifs changent
   */
  forceBloomRecompilation() {
    console.log('🔧 SimpleBloomSystem: Forcing bloom luminance pass recompilation');
    
    if (!this.bloomPass) {
      console.warn('❌ SimpleBloomSystem: No bloom pass available for recompilation');
      return;
    }
    
    // ✅ RÉDUCTION LOGS : Diagnostic minimal
    console.log('🔧 Forcing bloom recompilation');
    
    // Force la recompilation en "tickling" les paramètres critiques
    const currentThreshold = this.bloomPass.threshold;
    const currentStrength = this.bloomPass.strength;
    
    // Micro-changement puis restore pour forcer la recompilation des shaders internes
    this.bloomPass.threshold = currentThreshold + 0.0001;
    this.bloomPass.strength = currentStrength + 0.0001;
    
    // Forcer needsSwap aussi pour être sûr
    this.bloomPass.needsSwap = true;
    
    // Restore immediately les vraies valeurs
    setTimeout(() => {
      if (this.bloomPass) {
        this.bloomPass.threshold = currentThreshold;
        this.bloomPass.strength = currentStrength;
        
        console.log('✅ Bloom recompilation completed');
      }
    }, 1);
  }
  
  setBloomEnabled(enabled) {
    this.isEnabled = enabled;
    
    // ✅ CRITICAL FIX: Control the bloom pass directly instead of bypassing composer
    if (this.bloomPass) {
      this.bloomPass.enabled = enabled;
    } else {
      console.warn(`❌ SimpleBloomSystem: bloomPass not available`);
    }
  }
  
  applyPreset(presetName) {
    const presets = {
      subtle: { threshold: 0.8, strength: 0.3, radius: 0.2 },
      normal: { threshold: 0.15, strength: 0.40, radius: 0.4 },
      intense: { threshold: 0.1, strength: 1.5, radius: 0.6 }
    };
    
    const preset = presets[presetName];
    if (preset) {
      this.updateBloom('threshold', preset.threshold);
      this.updateBloom('strength', preset.strength);
      this.updateBloom('radius', preset.radius);
    }
  }
  
  // ✅ PHASE 2 GTAO: Méthodes contrôle Ground Truth Ambient Occlusion
  updateGTAOSettings(settings) {
    if (!this.gtaoPass) return false;
    
    Object.keys(settings).forEach(key => {
      if (this.gtaoPass[key] !== undefined) {
        this.gtaoPass[key] = settings[key];
      }
    });
    
    return true;
  }
  
  // ✅ PHASE 2 GTAO: Adaptation selon thème background
  adaptGTAOToTheme(themeType) {
    if (!this.gtaoPass || !this.gtaoConfig.adaptiveSettings[themeType]) {
      return false;
    }
    
    const adaptiveSettings = this.gtaoConfig.adaptiveSettings[themeType];
    this.updateGTAOSettings(adaptiveSettings);
    
    return true;
  }
  
  // ✅ PHASE 2 GTAO: Toggle GTAO pour debug/performance
  setGTAOEnabled(enabled) {
    if (!this.gtaoPass) return false;
    
    this.gtaoPass.enabled = enabled;
    this.gtaoConfig.enabled = enabled;
    
    return true;
  }
  
  // ✅ PHASE 3 MSAA: Méthodes contrôle Multi-Sample Anti-Aliasing
  adaptMSAAToTheme(themeType) {
    if (!this.msaaConfig.adaptiveSettings[themeType]) {
      return false;
    }
    
    const _adaptiveSettings = this.msaaConfig.adaptiveSettings[themeType];
    this.setMSAAQuality(themeType);
    
    return true;
  }
  
  // ✅ MSAA V12.2: Toggle FXAA complémentaire
  setFXAAEnabled(enabled) {
    if (!this.fxaaPass) return false;
    
    this.fxaaPass.enabled = enabled;
    return true;
  }
  
  // ✅ MSAA V12.2: Mise à jour résolution FXAA
  updateFXAAResolution() {
    if (!this.fxaaPass) return false;
    
    const pixelRatio = this.renderer.getPixelRatio();
    this.fxaaPass.material.uniforms['resolution'].value.x = 1 / (window.innerWidth * pixelRatio);
    this.fxaaPass.material.uniforms['resolution'].value.y = 1 / (window.innerHeight * pixelRatio);
    
    return true;
  }
  
  // ✅ MSAA V12.2: Configuration samples adaptatifs selon performance
  setMSAAQuality(quality) {
    const qualitySettings = {
      mobile: { samples: 2 },    // 2x MSAA mobile
      low: { samples: 2 },       // 2x MSAA performance
      medium: { samples: 4 },    // 4x MSAA équilibré
      high: { samples: 8 },      // 8x MSAA qualité
      ultra: { samples: 16 }     // 16x MSAA maximum
    };
    
    const settings = qualitySettings[quality];
    if (settings && this.renderer) {
      // Vérifier capacités GPU
      const gl = this.renderer.getContext();
      const maxSamples = gl ? gl.getParameter(gl.MAX_SAMPLES) : 4;
      
      this.msaaConfig.samples = Math.min(settings.samples, maxSamples);
      
      return true;
    }
    
    return false;
  }
  
  // ✅ MSAA V12.2: Toggle MSAA hardware
  setMSAAEnabled(enabled) {
    if (this.renderer) {
      this.msaaConfig.enabled = enabled;
      this.renderer.antialias = enabled && this.msaaConfig.hardware;
      return true;
    }
    return false;
  }

  // ✅ MSAA V12.2: Contrôle adaptatif selon performance
  updateMSAASamples(samples) {
    if (!this.renderer) return false;
    
    // Vérifier capacités GPU
    const gl = this.renderer.getContext();
    const maxSamples = gl ? gl.getParameter(gl.MAX_SAMPLES) : 4;
    
    this.msaaConfig.samples = Math.min(samples, maxSamples);
    return true;
  }
  
  // ✅ PHASE 2 GTAO: Réglage performance samples adaptatif
  setGTAOQuality(quality) {
    if (!this.gtaoPass) return false;
    
    const qualitySettings = {
      low: { samples: 8, rings: 3, scale: 0.8 },
      medium: { samples: 16, rings: 4, scale: 1.0 },
      high: { samples: 24, rings: 5, scale: 1.2 },
      ultra: { samples: 32, rings: 6, scale: 1.5 }
    };
    
    const settings = qualitySettings[quality];
    if (settings) {
      this.updateGTAOSettings(settings);
      return true;
    }
    
    return false;
  }
  
  handleResize() {
    if (this.composer) {
      this.composer.setSize(window.innerWidth, window.innerHeight);
    }
    
    // ✅ PHASE 2 GTAO: Redimensionner GTAO aussi
    if (this.gtaoPass) {
      this.gtaoPass.setSize(window.innerWidth, window.innerHeight);
    }
    
    // ✅ PHASE 3 MSAA: Mise à jour résolution FXAA
    if (this.fxaaPass) {
      this.updateFXAAResolution();
    }
  }
  
  dispose() {
    if (this.composer) {
      this.composer.dispose();
    }
  }
  
  getStatus() {
    return {
      enabled: this.isEnabled,
      config: this.config,
      composer: !!this.composer,
      bloomPass: !!this.bloomPass,
      luminousObjectsCount: this.luminousObjects.size,
      currentSecurityMode: this.currentSecurityMode,
      exposure: this.exposure,  // ✅ NOUVEAU V8
      groupCounts: {
        iris: this.objectGroups.iris.size,
        eyeRings: this.objectGroups.eyeRings.size,
        revealRings: this.objectGroups.revealRings.size
      },
      // ✅ PHASE 2 GTAO: Status Ground Truth Ambient Occlusion
      gtao: {
        enabled: this.gtaoConfig.enabled,
        pass: !!this.gtaoPass,
        samples: this.gtaoPass?.samples || 0,
        scale: this.gtaoPass?.scale || 0,
        radius: this.gtaoPass?.radius || 0
      },
      // ✅ PHASE 3 MSAA: Status Multi-Sample Anti-Aliasing
      msaa: {
        enabled: this.msaaConfig.enabled,
        hardware: this.msaaConfig.hardware,
        samples: this.msaaConfig.samples,
        antialias: this.renderer?.antialias || false,
        fxaa: {
          enabled: this.fxaaPass?.enabled || false,
          pass: !!this.fxaaPass
        }
      }
    };
  }
}