/**
 * 📊 METADATA SLICE - Phase 2
 * Centralise toutes les métadonnées UI et système
 */

/**
 * Générer un ID de session unique
 */
function generateSessionId() {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substr(2, 9);
  return `session_${timestamp}_${random}`;
}

/**
 * État initial metadata pour Phase 2
 */
const INITIAL_METADATA_STATE = {
  // === UI STATE ===
  activeTab: 'groups',
  showDebug: true,
  isCollapsed: false,
  
  // === SECURITY STATE ===
  securityState: null,
  isTransitioning: false,
  securityHistory: [],
  
  // === PRESETS STATE ===
  currentPreset: null,
  lastPresetApplied: null,
  presetHistory: [],
  isPresetModified: false,
  
  // === TECHNICAL METADATA ===
  version: '1.0.0-phase2',
  migrationPhase: 2,
  lastModified: Date.now(),
  sessionId: generateSessionId(),
  
  // === PERFORMANCE STATS ===
  performanceStats: {
    fps: 60,
    frameTime: 16.67,
    renderCalls: 0,
    triangles: 0,
    textures: 0,
    geometries: 0,
    memoryUsage: 0
  },
  
  // === USER PREFERENCES ===
  userPreferences: {
    autoSave: true,
    theme: 'dark',
    showTooltips: true,
    animationsEnabled: true,
    debugLevel: 'normal' // 'minimal', 'normal', 'verbose'
  },
  
  // === DEVELOPER INFO ===
  development: {
    buildNumber: null,
    commitHash: null,
    debugMode: typeof process !== 'undefined' && process.env?.NODE_ENV === 'development',
    devToolsEnabled: true
  }
};

/**
 * METADATA SLICE - Actions et état
 */
export const createMetadataSlice = (set, get) => ({
  metadata: INITIAL_METADATA_STATE,
  
  // === ACTIONS UI STATE ===
  
  /**
   * Changer onglet actif
   */
  setActiveTab: (tab) => set((state) => ({
    metadata: { ...state.metadata, activeTab: tab }
  }), false, `setActiveTab:${tab}`),
  
  /**
   * Basculer visibilité debug panel
   */
  toggleDebugVisibility: () => set((state) => ({
    metadata: { 
      ...state.metadata, 
      showDebug: !state.metadata.showDebug 
    }
  }), false, `toggleDebugVisibility:${!get().metadata.showDebug}`),
  
  /**
   * Set visibilité debug panel
   */
  setDebugVisibility: (visible) => set((state) => ({
    metadata: { ...state.metadata, showDebug: visible }
  }), false, `setDebugVisibility:${visible}`),
  
  /**
   * Basculer état collapsed du panel
   */
  toggleCollapsed: () => set((state) => ({
    metadata: { 
      ...state.metadata, 
      isCollapsed: !state.metadata.isCollapsed 
    }
  }), false, `toggleCollapsed:${!get().metadata.isCollapsed}`),
  
  // === ACTIONS SECURITY ===
  
  /**
   * Changer security state avec historique
   */
  setSecurityState: (securityState) => set((state) => {
    const newHistory = [...state.metadata.securityHistory];
    if (state.metadata.securityState !== securityState) {
      newHistory.push({
        from: state.metadata.securityState,
        to: securityState,
        timestamp: Date.now()
      });
      
      // Limiter historique à 50 entrées
      if (newHistory.length > 50) {
        newHistory.shift();
      }
    }
    
    return {
      metadata: { 
        ...state.metadata, 
        securityState,
        securityHistory: newHistory,
        lastModified: Date.now()
      }
    };
  }, false, `setSecurityState:${securityState}`),
  
  /**
   * Set état transition
   */
  setTransitioning: (isTransitioning) => set((state) => ({
    metadata: { ...state.metadata, isTransitioning }
  }), false, `setTransitioning:${isTransitioning}`),
  
  // === ACTIONS PRESETS ===
  
  /**
   * Set preset actuel avec historique
   */
  setCurrentPreset: (presetName) => set((state) => {
    const newHistory = [...state.metadata.presetHistory];
    if (state.metadata.currentPreset !== presetName) {
      newHistory.push({
        preset: presetName,
        timestamp: Date.now(),
        previous: state.metadata.currentPreset
      });
      
      // Limiter historique à 20 presets
      if (newHistory.length > 20) {
        newHistory.shift();
      }
    }
    
    return {
      metadata: {
        ...state.metadata,
        currentPreset: presetName,
        lastPresetApplied: presetName,
        presetHistory: newHistory,
        isPresetModified: false,
        lastModified: Date.now()
      }
    };
  }, false, `setCurrentPreset:${presetName}`),
  
  /**
   * Marquer preset comme modifié
   */
  markPresetModified: (modified = true) => set((state) => ({
    metadata: { 
      ...state.metadata, 
      isPresetModified: modified,
      lastModified: Date.now()
    }
  }), false, `markPresetModified:${modified}`),
  
  /**
   * Clear preset actuel
   */
  clearCurrentPreset: () => set((state) => ({
    metadata: {
      ...state.metadata,
      currentPreset: null,
      isPresetModified: false,
      lastModified: Date.now()
    }
  }), false, 'clearCurrentPreset'),
  
  // === ACTIONS PERFORMANCE ===
  
  /**
   * Mettre à jour stats performance
   */
  updatePerformanceStats: (stats) => set((state) => ({
    metadata: {
      ...state.metadata,
      performanceStats: { ...state.metadata.performanceStats, ...stats }
    }
  }), false, 'updatePerformanceStats'),
  
  /**
   * Reset stats performance
   */
  resetPerformanceStats: () => set((state) => ({
    metadata: {
      ...state.metadata,
      performanceStats: {
        fps: 60,
        frameTime: 16.67,
        renderCalls: 0,
        triangles: 0,
        textures: 0,
        geometries: 0,
        memoryUsage: 0
      }
    }
  }), false, 'resetPerformanceStats'),
  
  // === ACTIONS USER PREFERENCES ===
  
  /**
   * Modifier préférence utilisateur
   */
  setUserPreference: (key, value) => set((state) => ({
    metadata: {
      ...state.metadata,
      userPreferences: {
        ...state.metadata.userPreferences,
        [key]: value
      },
      lastModified: Date.now()
    }
  }), false, `setUserPreference:${key}:${value}`),
  
  /**
   * Batch update préférences
   */
  setUserPreferences: (preferences) => set((state) => ({
    metadata: {
      ...state.metadata,
      userPreferences: {
        ...state.metadata.userPreferences,
        ...preferences
      },
      lastModified: Date.now()
    }
  }), false, `setUserPreferences:${Object.keys(preferences).join(',')}`),
  
  // === ACTIONS VERSION/BUILD ===
  
  /**
   * Update metadata technique
   */
  updateMetadata: (updates) => set((state) => ({
    metadata: {
      ...state.metadata,
      ...updates,
      lastModified: Date.now()
    }
  }), false, `updateMetadata:${Object.keys(updates).join(',')}`),
  
  /**
   * Set build info
   */
  setBuildInfo: (buildNumber, commitHash) => set((state) => ({
    metadata: {
      ...state.metadata,
      development: {
        ...state.metadata.development,
        buildNumber,
        commitHash
      },
      lastModified: Date.now()
    }
  }), false, `setBuildInfo:${buildNumber}:${commitHash?.substr(0, 7)}`),
  
  // === ACTIONS AVANCÉES ===
  
  /**
   * Nouvelle session (reset session ID)
   */
  startNewSession: () => set((state) => ({
    metadata: {
      ...state.metadata,
      sessionId: generateSessionId(),
      securityHistory: [],
      presetHistory: [],
      lastModified: Date.now()
    }
  }), false, 'startNewSession'),
  
  /**
   * Reset metadata à l'état initial (garde user preferences)
   */
  resetMetadata: () => set((state) => ({
    metadata: {
      ...INITIAL_METADATA_STATE,
      userPreferences: state.metadata.userPreferences, // Préserver préférences
      sessionId: generateSessionId()
    }
  }), false, 'resetMetadata'),
  
  /**
   * Export metadata pour sauvegarde
   */
  getMetadataSnapshot: () => {
    const state = get();
    return {
      version: state.metadata.version,
      migrationPhase: state.metadata.migrationPhase,
      currentPreset: state.metadata.currentPreset,
      securityState: state.metadata.securityState,
      activeTab: state.metadata.activeTab,
      userPreferences: state.metadata.userPreferences,
      timestamp: Date.now()
    };
  },
  
  // === UTILITIES ===
  
  /**
   * Obtenir temps depuis dernière modification
   */
  getTimeSinceLastModified: () => {
    const state = get();
    return Date.now() - state.metadata.lastModified;
  },
  
  /**
   * Vérifier si session est active (< 1h)
   */
  isSessionActive: () => {
    const timeSince = get().getTimeSinceLastModified();
    return timeSince < 3600000; // 1 heure
  },
  
  /**
   * Obtenir stats session
   */
  getSessionStats: () => {
    const state = get();
    const sessionId = state.metadata.sessionId;
    
    // Calculer durée de session de manière sécurisée
    let duration = 0;
    if (sessionId && typeof sessionId === 'string' && sessionId.includes('_')) {
      const parts = sessionId.split('_');
      if (parts.length >= 2) {
        const startTime = parseInt(parts[1]);
        if (!isNaN(startTime)) {
          duration = Date.now() - startTime;
        }
      }
    }
    
    // Vérifier et formater lastModified de manière sécurisée
    let lastModifiedISO = 'unknown';
    try {
      const lastModified = state.metadata.lastModified;
      if (lastModified && !isNaN(lastModified)) {
        lastModifiedISO = new Date(lastModified).toISOString();
      }
    } catch (error) {
      console.warn('❌ Invalid lastModified value:', state.metadata.lastModified);
      lastModifiedISO = new Date().toISOString(); // Fallback à maintenant
    }
    
    return {
      sessionId: sessionId || 'unknown',
      duration,
      securityChanges: state.metadata.securityHistory?.length || 0,
      presetChanges: state.metadata.presetHistory?.length || 0,
      currentPreset: state.metadata.currentPreset,
      lastModified: lastModifiedISO
    };
  },
  
  /**
   * Générer rapport debug
   */
  generateDebugReport: () => {
    const state = get();
    const fullState = get();
    
    return {
      metadata: state.metadata,
      sessionStats: get().getSessionStats(),
      timeSinceModified: get().getTimeSinceLastModified(),
      storeSize: JSON.stringify(fullState).length,
      timestamp: new Date().toISOString(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Node.js'
    };
  }
});