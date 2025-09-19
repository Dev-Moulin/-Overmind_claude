import React from 'react';
import { useRenderSyncNotifications } from '../hooks/useRenderSync';

/**
 * 🍞 Composant Toast pour afficher les notifications de synchronisation
 * Affichage minimal et non-intrusif des alertes
 */
export function RenderSyncToast() {
  const { notifications } = useRenderSyncNotifications();

  if (notifications.length === 0) return null;

  return (
    <div className="toast-container">
      {notifications.map((notif) => (
        <div
          key={notif.id}
          className={`toast toast-${notif.type}`}
          onClick={() => notif.dismiss?.()}
        >
          <div className="toast-icon">
            {notif.type === 'high' && '🔴'}
            {notif.type === 'medium' && '🟡'}
            {notif.type === 'low' && '🔵'}
          </div>
          <div className="toast-content">
            <div className="toast-message">{notif.message}</div>
            {notif.suggestion && (
              <div className="toast-suggestion">{notif.suggestion}</div>
            )}
          </div>
          <button className="toast-close" onClick={() => notif.dismiss?.()}>
            ✕
          </button>
        </div>
      ))}

      <style jsx>{`
        .toast-container {
          position: fixed;
          top: 20px;
          right: 20px;
          z-index: 10000;
          pointer-events: none;
        }

        .toast {
          display: flex;
          align-items: flex-start;
          background: rgba(26, 26, 26, 0.95);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          padding: 12px 16px;
          margin-bottom: 12px;
          min-width: 320px;
          max-width: 420px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
          backdrop-filter: blur(10px);
          pointer-events: auto;
          cursor: pointer;
          animation: slideIn 0.3s ease-out;
          transition: all 0.2s ease;
        }

        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        .toast:hover {
          transform: translateX(-4px);
          box-shadow: 0 6px 16px rgba(0, 0, 0, 0.5);
        }

        .toast-high {
          border-left: 3px solid #f44336;
          background: linear-gradient(90deg, rgba(244, 67, 54, 0.1) 0%, rgba(26, 26, 26, 0.95) 50%);
        }

        .toast-medium {
          border-left: 3px solid #ff9800;
          background: linear-gradient(90deg, rgba(255, 152, 0, 0.1) 0%, rgba(26, 26, 26, 0.95) 50%);
        }

        .toast-low {
          border-left: 3px solid #2196f3;
          background: linear-gradient(90deg, rgba(33, 150, 243, 0.1) 0%, rgba(26, 26, 26, 0.95) 50%);
        }

        .toast-icon {
          font-size: 16px;
          margin-right: 12px;
          flex-shrink: 0;
        }

        .toast-content {
          flex: 1;
          color: white;
        }

        .toast-message {
          font-size: 14px;
          font-weight: 500;
          margin-bottom: 4px;
          line-height: 1.4;
        }

        .toast-suggestion {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.7);
          line-height: 1.4;
        }

        .toast-close {
          background: transparent;
          border: none;
          color: rgba(255, 255, 255, 0.4);
          font-size: 18px;
          cursor: pointer;
          padding: 0;
          margin-left: 12px;
          flex-shrink: 0;
          transition: color 0.2s;
        }

        .toast-close:hover {
          color: rgba(255, 255, 255, 0.8);
        }

        /* Mobile responsive */
        @media (max-width: 480px) {
          .toast-container {
            top: 10px;
            right: 10px;
            left: 10px;
          }

          .toast {
            min-width: auto;
            max-width: 100%;
          }
        }
      `}</style>
    </div>
  );
}

/**
 * 🔔 Composant minimal pour afficher uniquement l'indicateur de conflits
 */
export function RenderSyncIndicator() {
  const { conflicts, syncStatus, validationEnabled } = useRenderSync();

  if (!validationEnabled) return null;

  const hasHighSeverity = conflicts.some(c => c.severity === 'high');
  const hasMediumSeverity = conflicts.some(c => c.severity === 'medium');

  return (
    <div className="sync-indicator">
      <div className={`indicator-dot status-${syncStatus}`}>
        {conflicts.length > 0 && (
          <span className="conflict-count">{conflicts.length}</span>
        )}
      </div>

      {conflicts.length > 0 && (
        <div className="indicator-tooltip">
          <div className="tooltip-header">
            {hasHighSeverity && '🔴 Conflits critiques détectés'}
            {!hasHighSeverity && hasMediumSeverity && '🟡 Conflits moyens détectés'}
            {!hasHighSeverity && !hasMediumSeverity && '🔵 Conflits mineurs détectés'}
          </div>
          <div className="tooltip-content">
            {conflicts.slice(0, 3).map((conflict, i) => (
              <div key={i} className="tooltip-item">
                {conflict.message}
              </div>
            ))}
            {conflicts.length > 3 && (
              <div className="tooltip-more">
                +{conflicts.length - 3} autres conflits...
              </div>
            )}
          </div>
        </div>
      )}

      <style jsx>{`
        .sync-indicator {
          position: fixed;
          bottom: 20px;
          right: 20px;
          z-index: 9999;
        }

        .indicator-dot {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
          transition: all 0.3s ease;
        }

        .indicator-dot.status-synchronized {
          background: #4caf50;
        }

        .indicator-dot.status-conflictDetected {
          background: #ff9800;
          animation: pulse 1.5s infinite;
        }

        .indicator-dot.status-validating,
        .indicator-dot.status-resolving {
          background: #2196f3;
          animation: spin 1s linear infinite;
        }

        .indicator-dot.status-idle {
          background: #666;
        }

        @keyframes pulse {
          0%, 100% {
            transform: scale(1);
            box-shadow: 0 2px 8px rgba(255, 152, 0, 0.3);
          }
          50% {
            transform: scale(1.1);
            box-shadow: 0 2px 16px rgba(255, 152, 0, 0.5);
          }
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .conflict-count {
          color: white;
          font-weight: bold;
          font-size: 14px;
        }

        .indicator-tooltip {
          position: absolute;
          bottom: 50px;
          right: 0;
          background: rgba(26, 26, 26, 0.95);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 8px;
          padding: 12px;
          min-width: 280px;
          max-width: 360px;
          backdrop-filter: blur(10px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
          display: none;
        }

        .indicator-dot:hover + .indicator-tooltip,
        .indicator-tooltip:hover {
          display: block;
        }

        .tooltip-header {
          font-weight: 600;
          font-size: 13px;
          color: white;
          margin-bottom: 8px;
          padding-bottom: 6px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .tooltip-item {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.8);
          margin-bottom: 6px;
          padding-left: 12px;
          position: relative;
        }

        .tooltip-item:before {
          content: '•';
          position: absolute;
          left: 0;
          color: rgba(255, 255, 255, 0.4);
        }

        .tooltip-more {
          font-size: 11px;
          color: rgba(255, 255, 255, 0.5);
          font-style: italic;
          margin-top: 6px;
          text-align: center;
        }
      `}</style>
    </div>
  );
}

export default RenderSyncToast;