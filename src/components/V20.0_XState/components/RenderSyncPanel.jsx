import React, { useState } from 'react';
import {
  useRenderSync,
  useRenderSyncNotifications,
  useRenderSyncCheckpoints
} from '../hooks/useRenderSync';

/**
 * 🎛️ Panneau de contrôle pour la synchronisation des rendus
 * Affiche les conflits, notifications et permet la gestion des checkpoints
 */
export function RenderSyncPanel() {
  const {
    conflicts,
    syncStatus,
    validationEnabled,
    autoResolve,
    saveCheckpoint,
    restoreCheckpoint,
    rollback,
    autoResolveConflicts,
    ignoreConflicts,
    toggleValidation,
    toggleAutoResolve,
    hasSystemConflicts
  } = useRenderSync();

  const { notifications, dismissAll } = useRenderSyncNotifications();
  const { checkpoints, quickSave, quickLoad, deleteCheckpoint } = useRenderSyncCheckpoints();

  const [showCheckpoints, setShowCheckpoints] = useState(false);
  const [checkpointName, setCheckpointName] = useState('');

  return (
    <div className="render-sync-panel">
      {/* Status Bar */}
      <div className="sync-status-bar">
        <div className="status-indicator">
          <span className={`status-dot ${syncStatus}`} />
          <span className="status-text">
            {syncStatus === 'synchronized' && '✅ Synchronisé'}
            {syncStatus === 'conflictDetected' && '⚠️ Conflits détectés'}
            {syncStatus === 'validating' && '🔄 Validation...'}
            {syncStatus === 'resolving' && '🔧 Résolution...'}
            {syncStatus === 'idle' && '💤 En attente'}
          </span>
        </div>

        <div className="sync-controls">
          <button
            onClick={toggleValidation}
            className={`toggle-btn ${validationEnabled ? 'active' : ''}`}
            title="Activer/désactiver la validation"
          >
            {validationEnabled ? '🛡️' : '⚡'} Validation
          </button>

          <button
            onClick={toggleAutoResolve}
            className={`toggle-btn ${autoResolve ? 'active' : ''}`}
            title="Activer/désactiver la résolution automatique"
          >
            {autoResolve ? '🤖' : '👤'} Auto-résolution
          </button>

          <button
            onClick={quickSave}
            className="quick-action-btn"
            title="Sauvegarde rapide"
          >
            💾
          </button>

          <button
            onClick={quickLoad}
            className="quick-action-btn"
            title="Chargement rapide"
            disabled={checkpoints.length === 0}
          >
            📂
          </button>
        </div>
      </div>

      {/* Notifications */}
      {notifications.length > 0 && (
        <div className="notifications-container">
          <div className="notifications-header">
            <h4>Notifications</h4>
            <button onClick={dismissAll} className="dismiss-all-btn">
              ✕ Tout fermer
            </button>
          </div>
          {notifications.map((notif) => (
            <div
              key={notif.id}
              className={`notification notification-${notif.type}`}
            >
              <div className="notification-content">
                <p className="notification-message">{notif.message}</p>
                {notif.suggestion && (
                  <p className="notification-suggestion">💡 {notif.suggestion}</p>
                )}
              </div>
              <button
                onClick={() => notif.dismiss?.()}
                className="notification-dismiss"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Conflits */}
      {conflicts.length > 0 && (
        <div className="conflicts-container">
          <h4 className="conflicts-header">
            ⚠️ Conflits détectés ({conflicts.length})
          </h4>

          <div className="conflicts-list">
            {conflicts.map((conflict, index) => (
              <div
                key={index}
                className={`conflict-item conflict-${conflict.severity}`}
              >
                <div className="conflict-header">
                  <span className="conflict-type">{conflict.type}</span>
                  <span className={`conflict-badge ${conflict.severity}`}>
                    {conflict.severity === 'high' && '🔴 Critique'}
                    {conflict.severity === 'medium' && '🟡 Moyen'}
                    {conflict.severity === 'low' && '🔵 Faible'}
                  </span>
                </div>
                <p className="conflict-message">{conflict.message}</p>
                {conflict.suggestion && (
                  <p className="conflict-suggestion">
                    💡 {conflict.suggestion}
                  </p>
                )}
                <div className="conflict-systems">
                  {conflict.systems?.map((system) => (
                    <span key={system} className="system-tag">
                      {system}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="conflict-actions">
            {autoResolve ? (
              <button
                onClick={autoResolveConflicts}
                className="resolve-btn auto"
              >
                🤖 Résolution automatique
              </button>
            ) : (
              <button
                onClick={() => {
                  // Ouvrir un modal pour résolution manuelle
                  console.log('Open manual resolution modal');
                }}
                className="resolve-btn manual"
              >
                👤 Résolution manuelle
              </button>
            )}
            <button onClick={ignoreConflicts} className="ignore-btn">
              ⏭️ Ignorer
            </button>
            <button onClick={rollback} className="rollback-btn">
              ↩️ Rollback
            </button>
          </div>
        </div>
      )}

      {/* Checkpoints */}
      <div className="checkpoints-section">
        <div className="checkpoints-header">
          <h4>
            📍 Checkpoints ({checkpoints.length})
            <button
              onClick={() => setShowCheckpoints(!showCheckpoints)}
              className="toggle-checkpoints"
            >
              {showCheckpoints ? '▼' : '▶'}
            </button>
          </h4>

          <div className="checkpoint-save">
            <input
              type="text"
              value={checkpointName}
              onChange={(e) => setCheckpointName(e.target.value)}
              placeholder="Nom du checkpoint..."
              className="checkpoint-name-input"
            />
            <button
              onClick={() => {
                saveCheckpoint(checkpointName || undefined);
                setCheckpointName('');
              }}
              className="save-checkpoint-btn"
            >
              💾 Sauvegarder
            </button>
          </div>
        </div>

        {showCheckpoints && (
          <div className="checkpoints-list">
            {checkpoints.length === 0 ? (
              <p className="no-checkpoints">Aucun checkpoint sauvegardé</p>
            ) : (
              checkpoints.map((checkpoint) => (
                <div key={checkpoint.id} className="checkpoint-item">
                  <div className="checkpoint-info">
                    <span className="checkpoint-name">{checkpoint.name}</span>
                    <span className="checkpoint-time">
                      {new Date(checkpoint.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="checkpoint-actions">
                    <button
                      onClick={() => restoreCheckpoint(checkpoint.id)}
                      className="restore-btn"
                      title="Restaurer ce checkpoint"
                    >
                      📂
                    </button>
                    <button
                      onClick={() => deleteCheckpoint(checkpoint.id)}
                      className="delete-btn"
                      title="Supprimer ce checkpoint"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Indicateurs de conflits par système */}
      <div className="system-conflict-indicators">
        <h4>État des systèmes</h4>
        <div className="system-indicators">
          {['bloom', 'pbr', 'lighting', 'background'].map((system) => (
            <div
              key={system}
              className={`system-indicator ${
                hasSystemConflicts(system) ? 'has-conflict' : 'ok'
              }`}
            >
              <span className="system-name">{system}</span>
              <span className="system-status">
                {hasSystemConflicts(system) ? '⚠️' : '✅'}
              </span>
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        .render-sync-panel {
          background: rgba(26, 26, 26, 0.95);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          padding: 16px;
          color: white;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          max-width: 480px;
        }

        .sync-status-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
          padding-bottom: 12px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .status-indicator {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #4caf50;
          animation: pulse 2s infinite;
        }

        .status-dot.conflictDetected {
          background: #ff9800;
        }

        .status-dot.validating,
        .status-dot.resolving {
          background: #2196f3;
          animation: spin 1s linear infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .sync-controls {
          display: flex;
          gap: 8px;
        }

        .toggle-btn {
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: rgba(255, 255, 255, 0.6);
          padding: 4px 12px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 12px;
          transition: all 0.2s;
        }

        .toggle-btn.active {
          background: rgba(76, 175, 80, 0.2);
          border-color: #4caf50;
          color: #4caf50;
        }

        .toggle-btn:hover {
          background: rgba(255, 255, 255, 0.15);
        }

        .quick-action-btn {
          background: transparent;
          border: none;
          font-size: 20px;
          cursor: pointer;
          padding: 4px 8px;
          transition: transform 0.2s;
        }

        .quick-action-btn:hover {
          transform: scale(1.2);
        }

        .quick-action-btn:disabled {
          opacity: 0.3;
          cursor: not-allowed;
        }

        .notifications-container {
          margin-bottom: 16px;
        }

        .notifications-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }

        .notifications-header h4 {
          margin: 0;
          font-size: 14px;
          font-weight: 600;
        }

        .dismiss-all-btn {
          background: transparent;
          border: none;
          color: rgba(255, 255, 255, 0.5);
          cursor: pointer;
          font-size: 12px;
          padding: 2px 4px;
        }

        .dismiss-all-btn:hover {
          color: white;
        }

        .notification {
          display: flex;
          justify-content: space-between;
          align-items: start;
          background: rgba(33, 150, 243, 0.1);
          border-left: 3px solid #2196f3;
          padding: 8px 12px;
          margin-bottom: 8px;
          border-radius: 4px;
          animation: slideIn 0.3s ease;
        }

        @keyframes slideIn {
          from {
            transform: translateX(-100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        .notification-high {
          background: rgba(244, 67, 54, 0.1);
          border-left-color: #f44336;
        }

        .notification-medium {
          background: rgba(255, 152, 0, 0.1);
          border-left-color: #ff9800;
        }

        .notification-content {
          flex: 1;
        }

        .notification-message {
          margin: 0 0 4px 0;
          font-size: 13px;
        }

        .notification-suggestion {
          margin: 0;
          font-size: 12px;
          color: rgba(255, 255, 255, 0.7);
        }

        .notification-dismiss {
          background: transparent;
          border: none;
          color: rgba(255, 255, 255, 0.5);
          cursor: pointer;
          padding: 0 4px;
          font-size: 16px;
        }

        .notification-dismiss:hover {
          color: white;
        }

        .conflicts-container {
          background: rgba(255, 152, 0, 0.05);
          border: 1px solid rgba(255, 152, 0, 0.2);
          border-radius: 6px;
          padding: 12px;
          margin-bottom: 16px;
        }

        .conflicts-header {
          margin: 0 0 12px 0;
          font-size: 14px;
          font-weight: 600;
        }

        .conflicts-list {
          max-height: 300px;
          overflow-y: auto;
          margin-bottom: 12px;
        }

        .conflict-item {
          background: rgba(0, 0, 0, 0.3);
          padding: 10px;
          border-radius: 4px;
          margin-bottom: 8px;
        }

        .conflict-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 6px;
        }

        .conflict-type {
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .conflict-badge {
          font-size: 11px;
          padding: 2px 6px;
          border-radius: 3px;
        }

        .conflict-badge.high {
          background: rgba(244, 67, 54, 0.2);
          color: #ff6b6b;
        }

        .conflict-badge.medium {
          background: rgba(255, 152, 0, 0.2);
          color: #ffb74d;
        }

        .conflict-badge.low {
          background: rgba(33, 150, 243, 0.2);
          color: #64b5f6;
        }

        .conflict-message {
          margin: 4px 0;
          font-size: 13px;
          line-height: 1.4;
        }

        .conflict-suggestion {
          margin: 4px 0;
          font-size: 12px;
          color: rgba(255, 255, 255, 0.7);
          font-style: italic;
        }

        .conflict-systems {
          display: flex;
          gap: 6px;
          margin-top: 8px;
        }

        .system-tag {
          background: rgba(255, 255, 255, 0.1);
          padding: 2px 6px;
          border-radius: 3px;
          font-size: 11px;
          text-transform: uppercase;
        }

        .conflict-actions {
          display: flex;
          gap: 8px;
        }

        .resolve-btn,
        .ignore-btn,
        .rollback-btn {
          flex: 1;
          padding: 6px 12px;
          border: none;
          border-radius: 4px;
          font-size: 12px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .resolve-btn.auto {
          background: rgba(76, 175, 80, 0.2);
          border: 1px solid #4caf50;
          color: #4caf50;
        }

        .resolve-btn.manual {
          background: rgba(33, 150, 243, 0.2);
          border: 1px solid #2196f3;
          color: #2196f3;
        }

        .ignore-btn {
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: rgba(255, 255, 255, 0.7);
        }

        .rollback-btn {
          background: rgba(255, 152, 0, 0.2);
          border: 1px solid #ff9800;
          color: #ff9800;
        }

        .checkpoints-section {
          background: rgba(255, 255, 255, 0.03);
          border-radius: 6px;
          padding: 12px;
          margin-bottom: 16px;
        }

        .checkpoints-header {
          margin-bottom: 12px;
        }

        .checkpoints-header h4 {
          margin: 0 0 8px 0;
          font-size: 14px;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .toggle-checkpoints {
          background: transparent;
          border: none;
          color: rgba(255, 255, 255, 0.6);
          cursor: pointer;
          font-size: 10px;
        }

        .checkpoint-save {
          display: flex;
          gap: 8px;
        }

        .checkpoint-name-input {
          flex: 1;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: white;
          padding: 6px 10px;
          border-radius: 4px;
          font-size: 12px;
        }

        .checkpoint-name-input::placeholder {
          color: rgba(255, 255, 255, 0.4);
        }

        .save-checkpoint-btn {
          background: rgba(76, 175, 80, 0.2);
          border: 1px solid #4caf50;
          color: #4caf50;
          padding: 6px 12px;
          border-radius: 4px;
          font-size: 12px;
          cursor: pointer;
        }

        .checkpoints-list {
          max-height: 200px;
          overflow-y: auto;
        }

        .no-checkpoints {
          text-align: center;
          color: rgba(255, 255, 255, 0.4);
          font-size: 12px;
          padding: 20px;
        }

        .checkpoint-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: rgba(255, 255, 255, 0.05);
          padding: 8px 10px;
          border-radius: 4px;
          margin-bottom: 6px;
        }

        .checkpoint-info {
          flex: 1;
        }

        .checkpoint-name {
          display: block;
          font-size: 13px;
          margin-bottom: 2px;
        }

        .checkpoint-time {
          display: block;
          font-size: 11px;
          color: rgba(255, 255, 255, 0.5);
        }

        .checkpoint-actions {
          display: flex;
          gap: 6px;
        }

        .restore-btn,
        .delete-btn {
          background: transparent;
          border: none;
          font-size: 16px;
          cursor: pointer;
          padding: 2px 6px;
          transition: transform 0.2s;
        }

        .restore-btn:hover,
        .delete-btn:hover {
          transform: scale(1.2);
        }

        .system-conflict-indicators {
          margin-top: 16px;
        }

        .system-conflict-indicators h4 {
          margin: 0 0 8px 0;
          font-size: 14px;
          font-weight: 600;
        }

        .system-indicators {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 8px;
        }

        .system-indicator {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: rgba(255, 255, 255, 0.05);
          padding: 8px 10px;
          border-radius: 4px;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .system-indicator.has-conflict {
          background: rgba(255, 152, 0, 0.1);
          border-color: rgba(255, 152, 0, 0.3);
        }

        .system-indicator.ok {
          background: rgba(76, 175, 80, 0.05);
          border-color: rgba(76, 175, 80, 0.2);
        }

        .system-name {
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .system-status {
          font-size: 14px;
        }

        /* Scrollbar styling */
        .conflicts-list::-webkit-scrollbar,
        .checkpoints-list::-webkit-scrollbar {
          width: 6px;
        }

        .conflicts-list::-webkit-scrollbar-track,
        .checkpoints-list::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 3px;
        }

        .conflicts-list::-webkit-scrollbar-thumb,
        .checkpoints-list::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.2);
          border-radius: 3px;
        }

        .conflicts-list::-webkit-scrollbar-thumb:hover,
        .checkpoints-list::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.3);
        }
      `}</style>
    </div>
  );
}

export default RenderSyncPanel;