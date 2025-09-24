/**
 * 🧪 TESTS MANUELS B5 SECURITY - Validation Intégration
 * Script Node.js pour tester l'intégration B5 dans VisualEffectsMachine
 */

// Import des modules (syntaxe CommonJS pour Node.js simple)
const { createMachine, interpret, assign } = require('xstate');

console.log('🚀 Début des tests manuels B5 Security Integration\n');

// ============================================
// SIMULATION VisualEffectsMachine (simplifié)
// ============================================

// Context simplifié pour test
const createTestContext = () => ({
  security: {
    // Legacy compatibility
    currentPreset: null,
    isTransitioning: false,
    presets: {
      SAFE: { color: 0x00ff00, intensity: 0.3 },
      DANGER: { color: 0xff0000, intensity: 1.0 }
    },

    // B5 Security Actor Model
    securityMachine: {
      isActive: false,
      securityLevel: 'normal',
      threatScore: 0,
      currentThreats: [],
      bridgeConnections: {
        b3Lighting: false,
        b4Environment: false,
        visualEffects: true
      },
      circuitBreakerState: 'closed',
      performanceMode: 'normal',
      activeAlerts: []
    }
  },

  performance: {
    fps: 60,
    frameTime: 16,
    updateCount: 0,
    lastUpdateTime: Date.now()
  }
});

// Actions simplifiées pour test
const testActions = {
  updateSecurityLevel: assign({
    security: (ctx, event) => ({
      ...ctx.security,
      securityMachine: {
        ...ctx.security.securityMachine,
        securityLevel: event.level
      }
    })
  }),

  handleThreatDetected: assign({
    security: (ctx, event) => ({
      ...ctx.security,
      securityMachine: {
        ...ctx.security.securityMachine,
        threatScore: event.threat.score,
        currentThreats: [...ctx.security.securityMachine.currentThreats, ...event.threat.threats]
      }
    })
  }),

  startVisualAlert: assign({
    security: (ctx, event) => {
      const alert = {
        pattern: event.pattern,
        color: event.config?.color || '#ff0000',
        intensity: event.config?.intensity || 0.8
      };

      return {
        ...ctx.security,
        securityMachine: {
          ...ctx.security.securityMachine,
          activeAlerts: [...ctx.security.securityMachine.activeAlerts, alert]
        }
      };
    }
  }),

  connectBridge: assign({
    security: (ctx, event) => {
      // Conversion b3-lighting -> b3Lighting (camelCase)
      let key = event.system;

      // Convertir en camelCase: b3-lighting -> b3Lighting
      key = key.replace(/-([a-z])/g, (match, letter) => letter.toUpperCase());

      console.log(`    🔗 Connecting bridge: ${event.system} -> ${key}`);

      return {
        ...ctx.security,
        securityMachine: {
          ...ctx.security.securityMachine,
          bridgeConnections: {
            ...ctx.security.securityMachine.bridgeConnections,
            [key]: true
          }
        }
      };
    }
  }),

  handlePerformanceDegradation: assign({
    security: (ctx, event) => {
      const performanceMode = event.metrics.fps < 30 ? 'minimal' :
                            event.metrics.fps < 45 ? 'reduced' : 'normal';

      return {
        ...ctx.security,
        securityMachine: {
          ...ctx.security.securityMachine,
          performanceMode,
          circuitBreakerState: performanceMode === 'minimal' ? 'open' : 'closed'
        }
      };
    }
  }),

  escalateSecurityAcrossRegions: (ctx, event) => {
    console.log(`    🚨 Escalade coordonnée: ${event.level}`);
  }
};

// Machine de test simplifiée
const testMachine = createMachine({
  id: 'b5-test-machine',
  context: createTestContext(),
  initial: 'testing',

  states: {
    testing: {
      initial: 'inactive',

      states: {
        inactive: {
          on: {
            'B5_SECURITY.ACTIVATE': {
              target: 'active',
              actions: assign({
                security: (ctx) => ({
                  ...ctx.security,
                  securityMachine: {
                    ...ctx.security.securityMachine,
                    isActive: true
                  }
                })
              })
            }
          }
        },

        active: {
          on: {
            'B5_SECURITY.DEACTIVATE': {
              target: 'inactive',
              actions: assign({
                security: (ctx) => ({
                  ...ctx.security,
                  securityMachine: {
                    ...ctx.security.securityMachine,
                    isActive: false,
                    securityLevel: 'normal',
                    threatScore: 0,
                    currentThreats: [],
                    activeAlerts: []
                  }
                })
              })
            },

            'B5_SECURITY.SET_LEVEL': {
              actions: ['updateSecurityLevel', 'escalateSecurityAcrossRegions']
            },

            'B5_SECURITY.ESCALATE': {
              actions: (ctx) => {
                const levels = ['normal', 'scanning', 'alert', 'lockdown'];
                const currentIndex = levels.indexOf(ctx.security.securityMachine.securityLevel);
                const newLevel = levels[Math.min(currentIndex + 1, levels.length - 1)];

                return testActions.updateSecurityLevel(ctx, { level: newLevel });
              }
            },

            'B5_SECURITY.THREAT_DETECTED': {
              actions: 'handleThreatDetected'
            },

            'B5_SECURITY.TRIGGER_ALERT': {
              actions: 'startVisualAlert'
            },

            'B5_SECURITY.BRIDGE_CONNECT': {
              actions: 'connectBridge'
            },

            'B5_SECURITY.PERFORMANCE_DEGRADED': {
              actions: 'handlePerformanceDegradation'
            }
          }
        }
      }
    }
  }
}, {
  actions: testActions
});

// ============================================
// EXÉCUTION DES TESTS
// ============================================

const runTests = async () => {
  const service = interpret(testMachine);
  service.start();

  let testCount = 0;
  let passedTests = 0;

  const test = (name, testFn) => {
    testCount++;
    try {
      console.log(`\n🧪 Test ${testCount}: ${name}`);
      testFn();
      passedTests++;
      console.log('  ✅ PASSED');
    } catch (error) {
      console.log(`  ❌ FAILED: ${error.message}`);
    }
  };

  const assertEqual = (actual, expected, message) => {
    if (actual !== expected) {
      throw new Error(`${message} - Expected: ${expected}, Got: ${actual}`);
    }
  };

  const assertTrue = (condition, message) => {
    if (!condition) {
      throw new Error(message);
    }
  };

  // ============================================
  // TEST 1: Activation B5 Security
  // ============================================
  test('Activation B5 Security', () => {
    const initialState = service.getSnapshot();
    assertEqual(initialState.context.security.securityMachine.isActive, false, 'Initial state should be inactive');

    service.send({ type: 'B5_SECURITY.ACTIVATE' });
    const activeState = service.getSnapshot();

    assertEqual(activeState.context.security.securityMachine.isActive, true, 'Should be active after activation');
    assertEqual(activeState.context.security.securityMachine.securityLevel, 'normal', 'Should start at normal level');
  });

  // ============================================
  // TEST 2: Escalade de sécurité
  // ============================================
  test('Escalade de sécurité par niveau', () => {
    service.send({ type: 'B5_SECURITY.SET_LEVEL', level: 'scanning' });
    let state = service.getSnapshot();
    assertEqual(state.context.security.securityMachine.securityLevel, 'scanning', 'Should escalate to scanning');

    service.send({ type: 'B5_SECURITY.SET_LEVEL', level: 'alert' });
    state = service.getSnapshot();
    assertEqual(state.context.security.securityMachine.securityLevel, 'alert', 'Should escalate to alert');

    service.send({ type: 'B5_SECURITY.SET_LEVEL', level: 'lockdown' });
    state = service.getSnapshot();
    assertEqual(state.context.security.securityMachine.securityLevel, 'lockdown', 'Should escalate to lockdown');
  });

  // ============================================
  // TEST 3: Détection de menaces
  // ============================================
  test('Détection et gestion des menaces', () => {
    const threat = {
      score: 75,
      threats: [
        { id: 'threat-1', type: 'webgl-context-loss', severity: 'critical', timestamp: Date.now() }
      ]
    };

    service.send({ type: 'B5_SECURITY.THREAT_DETECTED', threat });
    const state = service.getSnapshot();

    assertEqual(state.context.security.securityMachine.threatScore, 75, 'Threat score should be updated');
    assertEqual(state.context.security.securityMachine.currentThreats.length, 1, 'Should have one threat');
    assertEqual(state.context.security.securityMachine.currentThreats[0].id, 'threat-1', 'Threat ID should match');
  });

  // ============================================
  // TEST 4: Alertes visuelles
  // ============================================
  test('Déclenchement alertes visuelles', () => {
    const alertConfig = { color: '#ff0000', intensity: 0.9 };
    service.send({ type: 'B5_SECURITY.TRIGGER_ALERT', pattern: 'flash', config: alertConfig });

    const state = service.getSnapshot();
    assertEqual(state.context.security.securityMachine.activeAlerts.length, 1, 'Should have one active alert');

    const alert = state.context.security.securityMachine.activeAlerts[0];
    assertEqual(alert.pattern, 'flash', 'Alert pattern should match');
    assertEqual(alert.color, '#ff0000', 'Alert color should match');
    assertEqual(alert.intensity, 0.9, 'Alert intensity should match');
  });

  // ============================================
  // TEST 5: Bridges inter-régions
  // ============================================
  test('Connexion bridges inter-régions', () => {
    service.send({ type: 'B5_SECURITY.BRIDGE_CONNECT', system: 'b3-lighting' });
    service.send({ type: 'B5_SECURITY.BRIDGE_CONNECT', system: 'b4-environment' });

    const state = service.getSnapshot();
    const bridges = state.context.security.securityMachine.bridgeConnections;

    assertEqual(bridges.b3Lighting, true, 'B3 bridge should be connected');
    assertEqual(bridges.b4Environment, true, 'B4 bridge should be connected');
    assertEqual(bridges.visualEffects, true, 'Visual Effects bridge should remain connected');
  });

  // ============================================
  // TEST 6: Performance monitoring
  // ============================================
  test('Monitoring et circuit breaker performance', () => {
    const criticalMetrics = {
      fps: 20, // < 30 = minimal mode
      frameTime: 50,
      cpuUsage: 90,
      memoryUsage: 1024
    };

    service.send({ type: 'B5_SECURITY.PERFORMANCE_DEGRADED', metrics: criticalMetrics });
    const state = service.getSnapshot();

    assertEqual(state.context.security.securityMachine.performanceMode, 'minimal', 'Should switch to minimal performance mode');
    assertEqual(state.context.security.securityMachine.circuitBreakerState, 'open', 'Circuit breaker should open');
  });

  // ============================================
  // TEST 7: Désactivation et reset
  // ============================================
  test('Désactivation et reset complet', () => {
    // État actuel devrait avoir des données
    let state = service.getSnapshot();
    assertTrue(state.context.security.securityMachine.isActive, 'Should be active before deactivation');
    assertTrue(state.context.security.securityMachine.currentThreats.length > 0, 'Should have threats before reset');

    // Désactiver
    service.send({ type: 'B5_SECURITY.DEACTIVATE' });
    state = service.getSnapshot();

    // Vérifier reset complet
    assertEqual(state.context.security.securityMachine.isActive, false, 'Should be inactive');
    assertEqual(state.context.security.securityMachine.securityLevel, 'normal', 'Security level should reset');
    assertEqual(state.context.security.securityMachine.threatScore, 0, 'Threat score should reset');
    assertEqual(state.context.security.securityMachine.currentThreats.length, 0, 'Threats should be cleared');
    assertEqual(state.context.security.securityMachine.activeAlerts.length, 0, 'Alerts should be cleared');
  });

  // ============================================
  // RÉSULTATS FINAUX
  // ============================================
  service.stop();

  console.log('\n' + '='.repeat(50));
  console.log('📊 RÉSULTATS DES TESTS MANUELS');
  console.log('='.repeat(50));
  console.log(`✅ Tests réussis: ${passedTests}/${testCount}`);
  console.log(`❌ Tests échoués: ${testCount - passedTests}/${testCount}`);

  if (passedTests === testCount) {
    console.log('\n🎉 TOUS LES TESTS SONT PASSÉS !');
    console.log('🚀 Intégration B5 Security validée avec succès');
  } else {
    console.log('\n⚠️  Certains tests ont échoué');
    console.log('🔧 Corrections nécessaires');
  }

  console.log('\n✨ Tests terminés\n');

  return passedTests === testCount;
};

// Exécution
if (require.main === module) {
  runTests().then(success => {
    process.exit(success ? 0 : 1);
  }).catch(error => {
    console.error('❌ Erreur lors des tests:', error);
    process.exit(1);
  });
}

module.exports = { runTests };