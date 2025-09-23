// 🌍 WorldEnvironmentController V8 - Contrôleur de thèmes avec transitions fluides
import * as THREE from 'three';

/**
 * Contrôleur unifié pour les thèmes d'environnement
 * Gère les transitions fluides entre Night/Day/Bright
 */
export class WorldEnvironmentController {
  constructor(setExposure) {
    this.setExposure = setExposure;
    
    // ✅ PMREM PHASE 1B: Référence PMREMGenerator pour environnements HDR adaptatifs
    this.pmremGenerator = null;
    this.environmentTextures = new Map(); // Cache environnements HDR
    this.currentEnvironmentTexture = null;
    
    // ✅ PMREM PHASE 1B: THÈMES AVEC ENVIRONNEMENTS HDR ADAPTATIFS
    this.themes = {
      NIGHT: {
        name: 'Night',
        exposure: 0.3,
        duration: 2000,
        description: '🌙 Mode nuit - Bloom ultra-contrasté',
        ambientIntensity: 0.2,
        directionalIntensity: 0.3,
        // ✅ NOUVEAU : Environnement HDR adaptatif pour bloom visibility
        environmentType: 'dark', // Dark background pour contraster bloom
        environmentColor: 0x101010, // Très sombre pour faire ressortir bloom
        adaptiveBloom: { boostStrength: 1.5, lowerThreshold: 0.1 },
        // ✅ PHASE 2 GTAO: Configuration pour thème sombre
        gtaoSettings: {
          scale: 0.8,    // Moins agressif sur fond sombre
          samples: 12,   // Performance optimisée
          radius: 0.2    // Rayon réduit
        },
        // ✅ PHASE 3 TAA: Configuration pour thème sombre
        taaSettings: {
          sampleLevel: 3,    // 8 samples - optimisé fond sombre
          accumulate: true   // Accumulation pour scènes statiques
        }
      },
      DAY: {
        name: 'Day', 
        exposure: 1.0,
        duration: 2000,
        description: '☀️ Mode jour - Éclairage normal',
        ambientIntensity: 0.6,
        directionalIntensity: 0.8,
        // ✅ NOUVEAU : Environnement HDR équilibré  
        environmentType: 'balanced', // Background neutre
        environmentColor: 0x404040, // Gris moyen actuel
        adaptiveBloom: { boostStrength: 1.0, standardThreshold: 0.3 },
        // ✅ PHASE 2 GTAO: Configuration équilibrée standard
        gtaoSettings: {
          scale: 1.0,    // Configuration de référence
          samples: 16,   // Qualité/performance équilibrée
          radius: 0.25   // Rayon standard
        },
        // ✅ PHASE 3 TAA: Configuration équilibrée
        taaSettings: {
          sampleLevel: 4,    // 16 samples - qualité/perf équilibrée
          accumulate: true   // Accumulation temporelle
        }
      },
      BRIGHT: {
        name: 'Bright',
        exposure: 1.8, 
        duration: 2000,
        description: '🔆 Mode brillant - Bloom intense',
        ambientIntensity: 1.0,
        directionalIntensity: 1.2,
        // ✅ NOUVEAU : Environnement HDR clair avec anti-disparition bloom
        environmentType: 'bright', // Bright background - PROBLÈME CIBLE !
        environmentColor: 0xf0f0f0, // Fond clair où bloom disparaît
        adaptiveBloom: { 
          boostStrength: 2.0, // Boost bloom sur fond clair
          lowerThreshold: 0.05, // Seuil plus bas pour capturer plus d'objets
          darkHalo: true // Ajouter halo sombre autour bloom
        },
        // ✅ PHASE 2 GTAO: Configuration Ground Truth AO adaptative par thème
        gtaoSettings: {
          scale: 1.5,    // Plus de contraste sur fond clair
          samples: 24,   // Qualité élevée pour fond problématique
          radius: 0.3    // Rayon adapté pour visibility
        },
        // ✅ PHASE 3 TAA: Configuration haute qualité fond clair
        taaSettings: {
          sampleLevel: 5,    // 32 samples - qualité maximale fond clair
          accumulate: true   // Accumulation pour edges parfaits
        }
      }
    };
    
    // ✅ ÉTAT ACTUEL
    this.currentTheme = 'DAY';
    this.currentExposure = 1.0;
    this.isTransitioning = false;
    
    // ✅ ANIMATION DATA
    this.tweenData = { exposure: 1.0 };
    this.activeTween = null;
    
  }
  
  // ✅ PMREM PHASE 1B: Initialisation coordination avec PMREMGenerator
  initializePMREMCoordination() {
    if (window.pmremGenerator) {
      this.pmremGenerator = window.pmremGenerator;
      
      // Générer environnement initial pour thème actuel
      this.generateAdaptiveEnvironment(this.currentTheme);
      return true;
    } else {
      console.warn('⚠️ PMREMGenerator non disponible, utilisation environnements basiques');
      return false;
    }
  }
  
  // ✅ PMREM PHASE 1B: Génération environnement HDR adaptatif par thème
  generateAdaptiveEnvironment(themeName) {
    const theme = this.themes[themeName];
    if (!theme || !this.pmremGenerator) return null;
    
    // Vérifier cache
    if (this.environmentTextures.has(themeName)) {
      const cachedTexture = this.environmentTextures.get(themeName);
      this.currentEnvironmentTexture = cachedTexture;
      return cachedTexture;
    }
    
    try {
      // Créer scène temporaire avec couleur adaptée au thème
      const tempScene = new THREE.Scene();
      tempScene.background = new THREE.Color(theme.environmentColor);
      
      // Générer environnement PMREM depuis scène thématique
      const pmremRenderTarget = this.pmremGenerator.fromScene(tempScene);
      const environmentTexture = pmremRenderTarget.texture;
      
      // Cache pour réutilisation
      this.environmentTextures.set(themeName, environmentTexture);
      this.currentEnvironmentTexture = environmentTexture;
      
      return environmentTexture;
    } catch (error) {
      console.warn(`⚠️ PMREM: Erreur génération environnement ${themeName}:`, error);
      return null;
    }
  }
  
  // ✅ PMREM PHASE 1B: Application environnement HDR à la scène
  applyEnvironmentToScene(scene, themeName) {
    if (!scene || !this.pmremGenerator) return false;
    
    const environmentTexture = this.generateAdaptiveEnvironment(themeName);
    if (environmentTexture) {
      scene.environment = environmentTexture;
      
      // Appliquer background adaptatif aussi
      const theme = this.themes[themeName];
      if (theme) {
        scene.background = new THREE.Color(theme.environmentColor);
      }
      
      return true;
    }
    
    return false;
  }
  
  /**
   * Changer vers un thème avec transition fluide
   */
  changeTheme(themeName, customDuration = null) {
    if (this.isTransitioning) {
      console.warn('⚠️ Transition déjà en cours, ignorer la demande');
      return false;
    }
    
    const theme = this.themes[themeName];
    if (!theme) {
      console.error(`❌ Thème inconnu: ${themeName}`);
      return false;
    }
    
    if (this.currentTheme === themeName) {
      return true;
    }
    
    const duration = customDuration || theme.duration;
    
    
    // ✅ PMREM PHASE 1B: Appliquer environnement HDR adaptatif pour nouveau thème
    if (window.scene && this.pmremGenerator) {
      this.applyEnvironmentToScene(window.scene, themeName);
      
      // ✅ PMREM PHASE 1: Déclencher synchronisation autres systèmes
      if (window.syncPMREMSystems) {
        window.syncPMREMSystems();
      }
      
      // ✅ PHASE 2 GTAO: Adapter GTAO au nouveau thème
      this.adaptGTAOToTheme(themeName);
      
      // ✅ PHASE 3 TAA: Adapter TAA au nouveau thème
      this.adaptTAAToTheme(themeName);
    }
    
    this.isTransitioning = true;
    this.currentTheme = themeName;
    
    // ✅ ANIMATION AVEC EASING FLUIDE
    this.tweenData.exposure = this.currentExposure;
    
    const startTime = performance.now();
    const startExposure = this.currentExposure;
    const targetExposure = theme.exposure;
    
    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // ✅ EASING : Smooth In-Out
      const easedProgress = this.easeInOutCubic(progress);
      
      // ✅ INTERPOLATION
      const currentExposure = startExposure + (targetExposure - startExposure) * easedProgress;
      
      // ✅ APPLIQUER
      this.currentExposure = currentExposure;
      this.tweenData.exposure = currentExposure;
      
      if (this.setExposure) {
        this.setExposure(currentExposure);
      }
      
      
      if (progress < 1) {
        this.activeTween = requestAnimationFrame(animate);
      } else {
        // ✅ TRANSITION TERMINÉE
        this.isTransitioning = false;
        this.activeTween = null;
      }
    };
    
    this.activeTween = requestAnimationFrame(animate);
    return true;
  }
  
  /**
   * Transition rapide vers un thème (500ms)
   */
  quickChangeTheme(themeName) {
    return this.changeTheme(themeName, 500);
  }
  
  /**
   * Transition lente vers un thème (4000ms)
   */
  slowChangeTheme(themeName) {
    return this.changeTheme(themeName, 4000);
  }
  
  /**
   * Easing function - Cubic In-Out
   */
  easeInOutCubic(t) {
    return t < 0.5 
      ? 4 * t * t * t 
      : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }
  
  /**
   * Arrêter toute transition en cours
   */
  stopTransition() {
    if (this.activeTween) {
      cancelAnimationFrame(this.activeTween);
      this.activeTween = null;
      this.isTransitioning = false;
    }
  }
  
  /**
   * Obtenir le thème actuel
   */
  getCurrentTheme() {
    return {
      name: this.currentTheme,
      config: this.themes[this.currentTheme],
      exposure: this.currentExposure,
      isTransitioning: this.isTransitioning,
      // ✅ NOUVEAU PMREM : Info environnement HDR
      environmentTexture: this.currentEnvironmentTexture,
      hasHDREnvironment: !!this.currentEnvironmentTexture,
      pmremActive: !!this.pmremGenerator
    };
  }
  
  /**
   * Obtenir tous les thèmes disponibles
   */
  getAvailableThemes() {
    return Object.keys(this.themes).map(key => ({
      key,
      ...this.themes[key]
    }));
  }
  
  /**
   * Définir une exposure personnalisée (sans thème)
   */
  setCustomExposure(exposure, duration = 1000) {
    return this.changeTheme('CUSTOM', duration, { exposure });
  }
  
  /**
   * Cycle entre les thèmes (pour raccourci clavier)
   */
  cycleThemes() {
    const themeKeys = Object.keys(this.themes);
    const currentIndex = themeKeys.indexOf(this.currentTheme);
    const nextIndex = (currentIndex + 1) % themeKeys.length;
    const nextTheme = themeKeys[nextIndex];
    
    return this.changeTheme(nextTheme);
  }
  
  /**
   * Obtenir le statut détaillé
   */
  getStatus() {
    return {
      currentTheme: this.currentTheme,
      currentExposure: this.currentExposure,
      isTransitioning: this.isTransitioning,
      availableThemes: Object.keys(this.themes),
      tweenData: { ...this.tweenData }
    };
  }
  
  /**
   * ✅ PMREM PHASE 1B: Obtenir paramètres bloom adaptatifs pour thème actuel
   */
  getAdaptiveBloomSettings(themeName = null) {
    const theme = this.themes[themeName || this.currentTheme];
    return theme ? theme.adaptiveBloom : null;
  }
  
  /**
   * ✅ PHASE 2 GTAO: Adapter GTAO aux paramètres thème
   */
  adaptGTAOToTheme(themeName) {
    const theme = this.themes[themeName];
    if (!theme || !theme.gtaoSettings) {
      console.warn(`⚠️ GTAO: Pas de configuration pour thème ${themeName}`);
      return false;
    }
    
    // Coordonner avec SimpleBloomSystem pour adaptation GTAO
    if (window.bloomSystem) {
      const success = window.bloomSystem.adaptGTAOToTheme(theme.environmentType);
      if (success) {
        // Appliquer les paramètres spécifiques du thème
        window.bloomSystem.updateGTAOSettings(theme.gtaoSettings);
        return true;
      }
    }
    
    console.warn('⚠️ GTAO: Système bloom non disponible pour coordination');
    return false;
  }
  
  /**
   * ✅ PHASE 2 GTAO: Obtenir paramètres GTAO pour thème
   */
  getGTAOSettings(themeName = null) {
    const theme = this.themes[themeName || this.currentTheme];
    return theme ? theme.gtaoSettings : null;
  }
  
  /**
   * ✅ PHASE 3 TAA: Adapter TAA aux paramètres thème
   */
  adaptTAAToTheme(themeName) {
    const theme = this.themes[themeName];
    if (!theme || !theme.taaSettings) {
      console.warn(`⚠️ TAA: Pas de configuration pour thème ${themeName}`);
      return false;
    }
    
    // Coordonner avec SimpleBloomSystem pour adaptation TAA
    if (window.bloomSystem) {
      const success = window.bloomSystem.adaptTAAToTheme(theme.environmentType);
      if (success) {
        // Appliquer les paramètres spécifiques du thème
        window.bloomSystem.updateTAASettings(theme.taaSettings);
        return true;
      }
    }
    
    console.warn('⚠️ TAA: Système bloom non disponible pour coordination');
    return false;
  }
  
  /**
   * ✅ PHASE 3 TAA: Obtenir paramètres TAA pour thème
   */
  getTAASettings(themeName = null) {
    const theme = this.themes[themeName || this.currentTheme];
    return theme ? theme.taaSettings : null;
  }
  
  /**
   * ✅ PMREM PHASE 1B: Forcer régénération environnements (si changement renderer)
   */
  regenerateAllEnvironments() {
    if (!this.pmremGenerator) return false;
    
    // Vider cache
    this.environmentTextures.clear();
    
    // Régénérer environnement actuel
    this.generateAdaptiveEnvironment(this.currentTheme);
    
    return true;
  }
  
  /**
   * Nettoyage
   */
  dispose() {
    this.stopTransition();
    
    // ✅ PMREM PHASE 1B: Nettoyage environnements HDR
    this.environmentTextures.clear();
    this.currentEnvironmentTexture = null;
    this.pmremGenerator = null;
    
  }
}