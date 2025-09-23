/**
 * 📝 LOGGER MIDDLEWARE - Phase 1 Foundation
 * Middleware de développement pour tracer les actions Zustand
 */

// Configuration logger
const LOG_CONFIG = {
  enabled: typeof process !== 'undefined' && process.env?.NODE_ENV === 'development',
  colors: {
    action: '#4CAF50',
    state: '#2196F3', 
    diff: '#FF9800',
    error: '#f44336'
  },
  logLevel: 'info' // 'debug', 'info', 'warn', 'error'
};

/**
 * Utilitaire pour formatter les logs avec couleurs
 */
const formatLog = (type, message, data = null) => {
  if (!LOG_CONFIG.enabled) return;
  
  const color = LOG_CONFIG.colors[type] || '#333';
  const timestamp = new Date().toLocaleTimeString();
  
  console.log(
    `%c[${timestamp}] Zustand ${type.toUpperCase()}`,
    `color: ${color}; font-weight: bold;`,
    message,
    data ? data : ''
  );
};

/**
 * Calculer différences entre états (simple)
 */
const getStateDiff = (prevState, nextState) => {
  const changes = {};
  
  // Bloom changes
  if (JSON.stringify(prevState.bloom) !== JSON.stringify(nextState.bloom)) {
    changes.bloom = {
      prev: prevState.bloom,
      next: nextState.bloom
    };
  }
  
  return changes;
};

/**
 * LOGGER MIDDLEWARE PRINCIPAL
 */
export const logger = (config) => (set, get, api) =>
  config(
    (state, replace, action) => {
      if (!LOG_CONFIG.enabled) {
        return set(state, replace, action);
      }
      
      const prevState = get();
      const timestamp = performance.now();
      
      try {
        // Exécuter l'action
        const result = set(state, replace, action);
        
        const executionTime = performance.now() - timestamp;
        const nextState = get();
        
        // Log l'action
        formatLog('action', `${action || 'unknown'} (${executionTime.toFixed(2)}ms)`);
        
        // Log les changements d'état si significatifs
        const diff = getStateDiff(prevState, nextState);
        if (Object.keys(diff).length > 0) {
          formatLog('diff', 'State changes:', diff);
        }
        
        // Warning si action lente
        if (executionTime > 10) {
          console.warn(
            `⚠️ Slow Zustand action: ${action} took ${executionTime.toFixed(2)}ms`
          );
        }
        
        return result;
      } catch (error) {
        formatLog('error', `Action failed: ${action}`, error);
        throw error;
      }
    },
    get,
    api
  );

/**
 * Utilitaires de debug supplémentaires
 */
export const debugStore = {
  /**
   * Logger l'état actuel complet
   */
  logCurrentState: (store) => {
    if (!LOG_CONFIG.enabled) return;
    
    const state = store.getState();
    formatLog('state', 'Current state snapshot:', state);
  },
  
  /**
   * Logger statistiques du store
   */
  logStats: (store) => {
    if (!LOG_CONFIG.enabled) return;
    
    const state = store.getState();
    const stats = {
      bloomThreshold: state.bloom?.threshold || 'N/A',
      bloomStrength: state.bloom?.strength || 'N/A',
      bloomEnabled: state.bloom?.enabled || false,
      groupsCount: state.bloom?.groups ? Object.keys(state.bloom.groups).length : 0
    };
    
    formatLog('state', 'Store statistics:', stats);
  }
};

/**
 * Hook pour debug en développement
 */
export const useDebugLogger = (store) => {
  if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'development') {
    // Exposer debug functions sur window pour console browser
    window.debugZustand = {
      logState: () => debugStore.logCurrentState(store),
      logStats: () => debugStore.logStats(store),
      getState: () => store.getState(),
      store
    };
  }
};