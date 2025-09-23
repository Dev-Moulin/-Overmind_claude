# 🔍 OUTILS DE DEBUG XSTATE + THREE.JS

## 🎯 Objectif

Suite complète d'outils de debugging pour visualiser, analyser et optimiser l'architecture XState + Three.js en temps réel.

## 🛠️ XState Inspector + Three.js Integration

### **1. Configuration XState Inspector**

```typescript
// debug/xstateInspector.js
import { inspect } from '@xstate/inspect';

// Configuration pour développement
if (process.env.NODE_ENV === 'development') {
  inspect({
    // Interface web sur localhost:3001
    url: 'https://stately.ai/viz?inspect',
    iframe: false,

    // Configuration Three.js spécifique
    serialize: (state) => ({
      ...state,
      // Sérialiser les objets Three.js pour l'inspector
      context: serializeThreeJSContext(state.context)
    })
  });
}

function serializeThreeJSContext(context) {
  return {
    ...context,

    // Convertir les objets Three.js en données lisibles
    environmentMap: context.environmentMap ? {
      type: 'THREE.Texture',
      width: context.environmentMap.image?.width,
      height: context.environmentMap.image?.height,
      format: context.environmentMap.format,
      loaded: true
    } : null,

    // Métriques performance
    performance: {
      fps: getCurrentFPS(),
      renderTime: getLastRenderTime(),
      memoryUsage: getMemoryUsage()
    },

    // État du pipeline Three.js
    pipeline: {
      hdrEnabled: context.HDREnabled,
      bloomActive: !!getBloomPass(),
      msaaActive: !!getMSAAConfig(),
      environmentLoaded: !!context.environmentMap
    }
  };
}
```

### **2. Machine de Debug Dédiée**

```typescript
// machines/debugMachine.js
const debugMachine = createMachine({
  id: 'debug',
  initial: 'monitoring',

  context: {
    // Historique des états
    stateHistory: [],
    transitionHistory: [],

    // Métriques en temps réel
    currentMetrics: {
      fps: 60,
      renderTime: 16,
      memoryMB: 0,
      activeEffects: []
    },

    // Configuration debug
    debugMode: 'full', // 'minimal', 'performance', 'full'
    logLevel: 'info',   // 'error', 'warn', 'info', 'debug'

    // Alertes
    activeAlerts: [],

    // Capture état
    capturedStates: new Map()
  },

  states: {
    monitoring: {
      entry: 'startPerformanceMonitoring',

      invoke: {
        id: 'performanceCollector',
        src: 'collectPerformanceMetrics'
      },

      on: {
        STATE_CHANGED: {
          actions: [
            'recordStateChange',
            'updateMetrics',
            'checkPerformanceThresholds'
          ]
        },

        TRANSITION_OCCURRED: {
          actions: [
            'recordTransition',
            'logTransition'
          ]
        },

        CAPTURE_STATE: {
          actions: 'captureCurrentState'
        },

        TOGGLE_DEBUG_MODE: {
          actions: assign({
            debugMode: (context, event) => event.mode
          })
        },

        PERFORMANCE_ALERT: {
          actions: 'addPerformanceAlert'
        }
      }
    }
  }
}, {
  actions: {
    recordStateChange: assign((context, event) => ({
      stateHistory: [
        ...context.stateHistory.slice(-99), // Garder 100 derniers
        {
          timestamp: Date.now(),
          state: event.state,
          context: event.context,
          metrics: context.currentMetrics
        }
      ]
    })),

    recordTransition: assign((context, event) => ({
      transitionHistory: [
        ...context.transitionHistory.slice(-199), // Garder 200 dernières
        {
          timestamp: Date.now(),
          from: event.from,
          to: event.to,
          event: event.triggerEvent,
          duration: event.duration
        }
      ]
    })),

    updateMetrics: assign((context, event) => ({
      currentMetrics: {
        ...context.currentMetrics,
        ...event.metrics
      }
    })),

    captureCurrentState: assign((context, event) => {
      const capture = {
        timestamp: Date.now(),
        state: event.state,
        context: event.context,
        threeJSState: captureThreeJSState(),
        metrics: context.currentMetrics
      };

      return {
        capturedStates: new Map(context.capturedStates).set(
          event.captureId || Date.now().toString(),
          capture
        )
      };
    }),

    checkPerformanceThresholds: (context, event) => {
      const { fps, renderTime, memoryMB } = context.currentMetrics;

      if (fps < 30) {
        console.warn('🔥 Performance Alert: FPS faible', fps);
      }

      if (renderTime > 20) {
        console.warn('🔥 Performance Alert: Render time élevé', renderTime);
      }

      if (memoryMB > 512) {
        console.warn('🔥 Performance Alert: Mémoire élevée', memoryMB);
      }
    },

    addPerformanceAlert: assign((context, event) => ({
      activeAlerts: [
        ...context.activeAlerts,
        {
          id: Date.now(),
          type: event.alertType,
          message: event.message,
          severity: event.severity,
          timestamp: Date.now()
        }
      ]
    })),

    logTransition: (context, event) => {
      if (context.debugMode === 'full') {
        console.group(`🔄 Transition: ${event.from} → ${event.to}`);
        console.log('Event:', event.triggerEvent);
        console.log('Duration:', `${event.duration}ms`);
        console.log('Context:', event.context);
        console.groupEnd();
      }
    }
  },

  services: {
    collectPerformanceMetrics: () => (callback) => {
      const interval = setInterval(() => {
        const metrics = {
          fps: getCurrentFPS(),
          renderTime: getLastRenderTime(),
          memoryMB: getMemoryUsage(),
          activeEffects: getActiveEffects(),
          drawCalls: getDrawCalls(),
          triangles: getTriangleCount()
        };

        callback({
          type: 'METRICS_UPDATED',
          metrics
        });
      }, 100); // Collecte toutes les 100ms

      return () => clearInterval(interval);
    }
  }
});
```

### **3. Composant de Debug UI**

```typescript
// components/DebugUI.jsx
import React, { useState } from 'react';
import { useMachine } from '@xstate/react';
import { debugMachine } from '../machines/debugMachine';

const DebugUI = ({ sceneService }) => {
  const [debugState, sendDebug] = useMachine(debugMachine);
  const [selectedTab, setSelectedTab] = useState('states');

  const {
    stateHistory,
    transitionHistory,
    currentMetrics,
    capturedStates,
    debugMode
  } = debugState.context;

  return (
    <div className="debug-ui">
      {/* Header avec métriques temps réel */}
      <div className="debug-header">
        <div className="metrics-bar">
          <span className={`fps ${currentMetrics.fps < 30 ? 'warning' : 'good'}`}>
            FPS: {currentMetrics.fps.toFixed(1)}
          </span>
          <span className={`render-time ${currentMetrics.renderTime > 20 ? 'warning' : 'good'}`}>
            Render: {currentMetrics.renderTime.toFixed(1)}ms
          </span>
          <span className="memory">
            Memory: {currentMetrics.memoryMB.toFixed(1)}MB
          </span>
          <span className="effects">
            Effects: {currentMetrics.activeEffects.length}
          </span>
        </div>

        <div className="debug-controls">
          <select
            value={debugMode}
            onChange={(e) => sendDebug({ type: 'TOGGLE_DEBUG_MODE', mode: e.target.value })}
          >
            <option value="minimal">Minimal</option>
            <option value="performance">Performance</option>
            <option value="full">Full Debug</option>
          </select>

          <button onClick={() => sendDebug({ type: 'CAPTURE_STATE' })}>
            📸 Capture State
          </button>
        </div>
      </div>

      {/* Onglets de debug */}
      <div className="debug-tabs">
        <button
          className={selectedTab === 'states' ? 'active' : ''}
          onClick={() => setSelectedTab('states')}
        >
          States ({stateHistory.length})
        </button>
        <button
          className={selectedTab === 'transitions' ? 'active' : ''}
          onClick={() => setSelectedTab('transitions')}
        >
          Transitions ({transitionHistory.length})
        </button>
        <button
          className={selectedTab === 'performance' ? 'active' : ''}
          onClick={() => setSelectedTab('performance')}
        >
          Performance
        </button>
        <button
          className={selectedTab === 'captures' ? 'active' : ''}
          onClick={() => setSelectedTab('captures')}
        >
          Captures ({capturedStates.size})
        </button>
      </div>

      {/* Contenu des onglets */}
      <div className="debug-content">
        {selectedTab === 'states' && (
          <StateHistoryPanel history={stateHistory} />
        )}

        {selectedTab === 'transitions' && (
          <TransitionHistoryPanel history={transitionHistory} />
        )}

        {selectedTab === 'performance' && (
          <PerformancePanel metrics={currentMetrics} />
        )}

        {selectedTab === 'captures' && (
          <CapturesPanel captures={capturedStates} />
        )}
      </div>
    </div>
  );
};

// Sous-composants pour chaque onglet
const StateHistoryPanel = ({ history }) => (
  <div className="state-history">
    {history.slice(-20).reverse().map((entry, index) => (
      <div key={index} className="state-entry">
        <div className="timestamp">
          {new Date(entry.timestamp).toLocaleTimeString()}
        </div>
        <div className="state-name">{entry.state.value}</div>
        <div className="state-context">
          <pre>{JSON.stringify(entry.context, null, 2)}</pre>
        </div>
        <div className="state-metrics">
          FPS: {entry.metrics.fps?.toFixed(1)} |
          Render: {entry.metrics.renderTime?.toFixed(1)}ms
        </div>
      </div>
    ))}
  </div>
);

const TransitionHistoryPanel = ({ history }) => (
  <div className="transition-history">
    {history.slice(-30).reverse().map((entry, index) => (
      <div key={index} className="transition-entry">
        <div className="timestamp">
          {new Date(entry.timestamp).toLocaleTimeString()}
        </div>
        <div className="transition-flow">
          <span className="from">{entry.from}</span>
          <span className="arrow">→</span>
          <span className="to">{entry.to}</span>
        </div>
        <div className="transition-event">
          Event: {entry.event.type}
        </div>
        <div className="transition-duration">
          Duration: {entry.duration}ms
        </div>
      </div>
    ))}
  </div>
);

const PerformancePanel = ({ metrics }) => (
  <div className="performance-panel">
    <div className="performance-chart">
      {/* Graphique FPS en temps réel */}
      <FPSChart fps={metrics.fps} />
    </div>

    <div className="performance-details">
      <div className="metric-group">
        <h4>Rendering</h4>
        <div>FPS: {metrics.fps?.toFixed(1)}</div>
        <div>Render Time: {metrics.renderTime?.toFixed(1)}ms</div>
        <div>Draw Calls: {metrics.drawCalls}</div>
        <div>Triangles: {metrics.triangles?.toLocaleString()}</div>
      </div>

      <div className="metric-group">
        <h4>Memory</h4>
        <div>JS Heap: {metrics.memoryMB?.toFixed(1)}MB</div>
        <div>GPU Memory: Estimating...</div>
      </div>

      <div className="metric-group">
        <h4>Effects</h4>
        {metrics.activeEffects?.map((effect, index) => (
          <div key={index}>{effect.name}: {effect.status}</div>
        ))}
      </div>
    </div>
  </div>
);
```

### **4. Console de Debug Avancée**

```typescript
// debug/debugConsole.js
export class DebugConsole {
  constructor(sceneService, debugService) {
    this.sceneService = sceneService;
    this.debugService = debugService;

    this.commands = new Map();
    this.setupCommands();

    // Exposer dans window pour accès console
    if (typeof window !== 'undefined') {
      window.threeDebug = this;
    }
  }

  setupCommands() {
    // Commandes de base
    this.commands.set('help', () => {
      console.log('🔍 Three.js Debug Commands:');
      console.log('  help - Afficher cette aide');
      console.log('  state - État actuel des machines');
      console.log('  history - Historique des transitions');
      console.log('  metrics - Métriques de performance');
      console.log('  capture [id] - Capturer l\'état actuel');
      console.log('  replay [id] - Rejouer un état capturé');
      console.log('  scene - Analyser la scène Three.js');
      console.log('  effects - Lister les effets actifs');
      console.log('  materials - Analyser les matériaux');
      console.log('  performance - Rapport de performance');
    });

    this.commands.set('state', () => {
      const state = this.sceneService.getSnapshot();
      console.log('🔄 État actuel:', state.value);
      console.log('📊 Contexte:', state.context);
    });

    this.commands.set('history', () => {
      const debugState = this.debugService.getSnapshot();
      const history = debugState.context.transitionHistory.slice(-10);

      console.table(history.map(entry => ({
        Time: new Date(entry.timestamp).toLocaleTimeString(),
        From: entry.from,
        To: entry.to,
        Event: entry.event.type,
        Duration: `${entry.duration}ms`
      })));
    });

    this.commands.set('capture', (id = Date.now().toString()) => {
      this.debugService.send({
        type: 'CAPTURE_STATE',
        captureId: id,
        state: this.sceneService.getSnapshot(),
        context: this.sceneService.getSnapshot().context
      });
      console.log(`📸 État capturé avec ID: ${id}`);
    });

    this.commands.set('scene', () => {
      console.log('🎮 Analyse Scene Three.js:');
      console.log('  Objects:', countSceneObjects());
      console.log('  Lights:', countLights());
      console.log('  Materials:', countMaterials());
      console.log('  Textures:', countTextures());
      console.log('  Draw Calls:', getDrawCalls());
    });

    this.commands.set('effects', () => {
      const effects = getActiveEffects();
      console.log('✨ Effets actifs:');
      effects.forEach(effect => {
        console.log(`  ${effect.name}: ${effect.status}`);
      });
    });

    this.commands.set('performance', () => {
      const report = this.getPerformanceReport();
      console.log('⚡ Rapport Performance:');
      console.table(report);
    });
  }

  // Interface publique pour console
  help() { this.commands.get('help')(); }
  state() { this.commands.get('state')(); }
  history() { this.commands.get('history')(); }
  capture(id) { this.commands.get('capture')(id); }
  scene() { this.commands.get('scene')(); }
  effects() { this.commands.get('effects')(); }
  performance() { this.commands.get('performance')(); }

  getPerformanceReport() {
    const debugState = this.debugService.getSnapshot();
    const metrics = debugState.context.currentMetrics;

    return {
      'FPS': metrics.fps?.toFixed(1),
      'Render Time (ms)': metrics.renderTime?.toFixed(1),
      'Memory (MB)': metrics.memoryMB?.toFixed(1),
      'Draw Calls': metrics.drawCalls,
      'Triangles': metrics.triangles?.toLocaleString(),
      'Active Effects': metrics.activeEffects?.length
    };
  }
}
```

### **5. Styles CSS pour l'UI de Debug**

```css
/* debug/debugUI.css */
.debug-ui {
  position: fixed;
  top: 10px;
  right: 10px;
  width: 400px;
  max-height: 80vh;
  background: rgba(0, 0, 0, 0.9);
  color: white;
  font-family: 'Courier New', monospace;
  font-size: 12px;
  border-radius: 8px;
  overflow: hidden;
  z-index: 1000;
}

.debug-header {
  padding: 10px;
  background: #2a2a2a;
  border-bottom: 1px solid #444;
}

.metrics-bar {
  display: flex;
  gap: 15px;
  margin-bottom: 10px;
}

.fps.good { color: #4CAF50; }
.fps.warning { color: #FF9800; }
.render-time.good { color: #4CAF50; }
.render-time.warning { color: #FF9800; }

.debug-tabs {
  display: flex;
  background: #1a1a1a;
}

.debug-tabs button {
  flex: 1;
  padding: 8px;
  background: transparent;
  color: #ccc;
  border: none;
  cursor: pointer;
}

.debug-tabs button.active {
  background: #333;
  color: white;
}

.debug-content {
  max-height: 400px;
  overflow-y: auto;
  padding: 10px;
}

.state-entry, .transition-entry {
  margin-bottom: 10px;
  padding: 8px;
  background: #222;
  border-radius: 4px;
  border-left: 3px solid #4CAF50;
}

.timestamp {
  color: #888;
  font-size: 10px;
}

.state-name {
  font-weight: bold;
  color: #4CAF50;
}

.transition-flow {
  display: flex;
  align-items: center;
  gap: 5px;
}

.arrow {
  color: #FF9800;
}

.state-context {
  background: #111;
  padding: 5px;
  margin: 5px 0;
  border-radius: 3px;
  max-height: 100px;
  overflow-y: auto;
}

.performance-panel {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
}

.metric-group h4 {
  margin: 0 0 5px 0;
  color: #4CAF50;
}
```

Cette suite d'outils de debug offre une visibilité complète sur l'architecture XState + Three.js, permettant d'identifier rapidement les problèmes de performance et de synchronisation.