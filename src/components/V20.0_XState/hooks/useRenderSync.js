import { useEffect, useState, useCallback } from 'react';
import { renderSyncService } from '../stores/xstate/machines/renderSyncMachine';
import useSceneStore from '../stores/sceneStore';

/**
 * 🔄 Hook pour utiliser RenderSync dans les composants React
 * Gère la synchronisation bloom/PBR/lighting/background
 */
export function useRenderSync() {
  const [conflicts, setConflicts] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [checkpoints, setCheckpoints] = useState([]);
  const [syncStatus, setSyncStatus] = useState('idle');
  const [validationEnabled, setValidationEnabled] = useState(true);
  const [autoResolve, setAutoResolve] = useState(false);

  // Store Zustand
  const {
    bloom,
    pbr,
    lighting,
    background,
    setBloomGlobalBatch,
    setPbrMultiplier,
    setExposure,
    setBackgroundColor
  } = useSceneStore();

  // Initialisation et cleanup
  useEffect(() => {
    // Démarrer le service si pas déjà fait
    if (!renderSyncService.service) {
      renderSyncService.start();
    }

    // S'abonner aux changements d'état
    const subscription = renderSyncService.service?.subscribe((state) => {
      setSyncStatus(state.value);
      setConflicts(state.context.conflicts || []);
      setCheckpoints(state.context.checkpoints || []);
      setValidationEnabled(state.context.validationEnabled);
      setAutoResolve(state.context.autoResolve);
    });

    // Écouter les notifications
    const handleNotification = (event) => {
      const notif = event.detail;
      setNotifications((prev) => [...prev, notif].slice(-10));

      // Auto-dismiss après 5 secondes
      setTimeout(() => {
        setNotifications((prev) => prev.filter((n) => n.id !== notif.id));
      }, 5000);
    };

    window.addEventListener('renderSyncNotification', handleNotification);

    // Écouter les mises à jour de synchronisation
    const handleSyncUpdate = (event) => {
      const { systems } = event.detail;

      // Appliquer les changements au store Zustand
      if (systems.bloom) {
        setBloomGlobalBatch({
          enabled: systems.bloom.enabled,
          threshold: systems.bloom.threshold,
          strength: systems.bloom.strength,
          radius: systems.bloom.radius
        });
      }

      if (systems.pbr) {
        // Appliquer les multipliers séparément
        setPbrMultiplier('ambient', systems.pbr.ambientMultiplier);
        setPbrMultiplier('directional', systems.pbr.directionalMultiplier);
      }

      if (systems.lighting) {
        setExposure(systems.lighting.exposure);
      }

      if (systems.background) {
        setBackgroundColor(systems.background.color);
      }
    };

    window.addEventListener('renderSyncUpdate', handleSyncUpdate);

    return () => {
      subscription?.unsubscribe();
      window.removeEventListener('renderSyncNotification', handleNotification);
      window.removeEventListener('renderSyncUpdate', handleSyncUpdate);
    };
  }, []);

  // === ACTIONS ===

  /**
   * Mettre à jour les paramètres bloom
   */
  const updateBloom = useCallback((params) => {
    renderSyncService.send({
      type: 'UPDATE_BLOOM',
      params
    });
  }, []);

  /**
   * Mettre à jour les paramètres PBR
   */
  const updatePBR = useCallback((params) => {
    renderSyncService.send({
      type: 'UPDATE_PBR',
      params
    });
  }, []);

  /**
   * Mettre à jour les paramètres lighting
   */
  const updateLighting = useCallback((params) => {
    renderSyncService.send({
      type: 'UPDATE_LIGHTING',
      params
    });
  }, []);

  /**
   * Mettre à jour les paramètres background
   */
  const updateBackground = useCallback((params) => {
    renderSyncService.send({
      type: 'UPDATE_BACKGROUND',
      params
    });
  }, []);

  /**
   * Sauvegarder un checkpoint
   */
  const saveCheckpoint = useCallback((name) => {
    renderSyncService.send({
      type: 'SAVE_CHECKPOINT',
      name: name || `Checkpoint ${new Date().toLocaleTimeString()}`
    });
  }, []);

  /**
   * Restaurer un checkpoint
   */
  const restoreCheckpoint = useCallback((checkpointId) => {
    renderSyncService.send({
      type: 'RESTORE_CHECKPOINT',
      checkpointId
    });
  }, []);

  /**
   * Résoudre les conflits automatiquement
   */
  const autoResolveConflicts = useCallback(() => {
    renderSyncService.send('AUTO_RESOLVE');
  }, []);

  /**
   * Résoudre les conflits manuellement
   */
  const manualResolveConflicts = useCallback((resolution) => {
    renderSyncService.send({
      type: 'MANUAL_RESOLVE',
      resolution
    });
  }, []);

  /**
   * Ignorer les conflits actuels
   */
  const ignoreConflicts = useCallback(() => {
    renderSyncService.send('IGNORE');
  }, []);

  /**
   * Rollback au dernier checkpoint
   */
  const rollback = useCallback(() => {
    renderSyncService.send('ROLLBACK');
  }, []);

  /**
   * Activer/désactiver la validation
   */
  const toggleValidation = useCallback(() => {
    renderSyncService.send('TOGGLE_VALIDATION');
  }, []);

  /**
   * Activer/désactiver la résolution automatique
   */
  const toggleAutoResolve = useCallback(() => {
    renderSyncService.send('TOGGLE_AUTO_RESOLVE');
  }, []);

  /**
   * Effacer les logs
   */
  const clearLogs = useCallback(() => {
    renderSyncService.send('CLEAR_LOGS');
    setNotifications([]);
  }, []);

  /**
   * Obtenir des suggestions pour résoudre les conflits
   */
  const getConflictSuggestions = useCallback(() => {
    return conflicts.map((conflict) => ({
      conflict: conflict.type,
      suggestion: conflict.suggestion,
      severity: conflict.severity
    }));
  }, [conflicts]);

  /**
   * Vérifier si un système a des conflits
   */
  const hasSystemConflicts = useCallback((systemName) => {
    return conflicts.some((c) => c.systems?.includes(systemName));
  }, [conflicts]);

  /**
   * Obtenir les conflits d'un système spécifique
   */
  const getSystemConflicts = useCallback((systemName) => {
    return conflicts.filter((c) => c.systems?.includes(systemName));
  }, [conflicts]);

  return {
    // État
    conflicts,
    notifications,
    checkpoints,
    syncStatus,
    validationEnabled,
    autoResolve,

    // Actions principales
    updateBloom,
    updatePBR,
    updateLighting,
    updateBackground,

    // Gestion des checkpoints
    saveCheckpoint,
    restoreCheckpoint,
    rollback,

    // Résolution des conflits
    autoResolveConflicts,
    manualResolveConflicts,
    ignoreConflicts,

    // Configuration
    toggleValidation,
    toggleAutoResolve,
    clearLogs,

    // Utilitaires
    getConflictSuggestions,
    hasSystemConflicts,
    getSystemConflicts,

    // État des systèmes (depuis Zustand)
    systems: {
      bloom,
      pbr,
      lighting,
      background
    }
  };
}

/**
 * Hook pour afficher les notifications dans l'UI
 */
export function useRenderSyncNotifications() {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const handleNotification = (event) => {
      const notif = {
        ...event.detail,
        dismiss: () => {
          setNotifications((prev) => prev.filter((n) => n.id !== event.detail.id));
        }
      };

      setNotifications((prev) => [...prev, notif].slice(-5));

      // Auto-dismiss après 5 secondes pour les notifications de faible sévérité
      if (notif.type === 'low') {
        setTimeout(() => {
          notif.dismiss();
        }, 3000);
      } else if (notif.type === 'medium') {
        setTimeout(() => {
          notif.dismiss();
        }, 5000);
      }
      // Les notifications 'high' restent jusqu'à ce qu'elles soient fermées
    };

    window.addEventListener('renderSyncNotification', handleNotification);

    return () => {
      window.removeEventListener('renderSyncNotification', handleNotification);
    };
  }, []);

  const dismissAll = () => {
    setNotifications([]);
  };

  return {
    notifications,
    dismissAll
  };
}

/**
 * Hook pour gérer les checkpoints
 */
export function useRenderSyncCheckpoints() {
  const { checkpoints, saveCheckpoint, restoreCheckpoint } = useRenderSync();
  const [selectedCheckpoint, setSelectedCheckpoint] = useState(null);

  const quickSave = useCallback(() => {
    const name = `Quick Save - ${new Date().toLocaleTimeString()}`;
    saveCheckpoint(name);
    console.log(`💾 ${name}`);
  }, [saveCheckpoint]);

  const quickLoad = useCallback(() => {
    if (checkpoints.length > 0) {
      const latest = checkpoints[checkpoints.length - 1];
      restoreCheckpoint(latest.id);
      console.log(`📂 Restored: ${latest.name}`);
    }
  }, [checkpoints, restoreCheckpoint]);

  const deleteCheckpoint = useCallback((checkpointId) => {
    // Supprimer du localStorage
    const updatedCheckpoints = checkpoints.filter((cp) => cp.id !== checkpointId);
    localStorage.setItem('renderSyncCheckpoints', JSON.stringify(updatedCheckpoints));
    console.log(`🗑️ Checkpoint deleted`);
  }, [checkpoints]);

  const renameCheckpoint = useCallback((checkpointId, newName) => {
    const updatedCheckpoints = checkpoints.map((cp) =>
      cp.id === checkpointId ? { ...cp, name: newName } : cp
    );
    localStorage.setItem('renderSyncCheckpoints', JSON.stringify(updatedCheckpoints));
    console.log(`✏️ Checkpoint renamed to: ${newName}`);
  }, [checkpoints]);

  return {
    checkpoints,
    selectedCheckpoint,
    setSelectedCheckpoint,
    quickSave,
    quickLoad,
    saveCheckpoint,
    restoreCheckpoint,
    deleteCheckpoint,
    renameCheckpoint
  };
}