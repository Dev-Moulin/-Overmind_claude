// 🧪 Test d'Intégration React FrameSchedulerMachine - Validation Complète
// Composant de test pour valider l'intégration complète en environnement React

import React, { useEffect, useState } from 'react';
import { useFrameScheduler, useFrameSchedulerDebug } from './useFrameScheduler';

// 🎯 Composant de Test Principal
export const FrameSchedulerTestIntegration = () => {
  const [testResults, setTestResults] = useState([]);
  const [currentTest, setCurrentTest] = useState(0);
  const [isTestRunning, setIsTestRunning] = useState(false);

  const frameScheduler = useFrameScheduler(false, true); // Pas d'auto-start, debug enabled
  const debug = useFrameSchedulerDebug();

  const tests = [
    {
      name: 'Initialisation Hook',
      test: () => {
        return frameScheduler.context !== undefined &&
               frameScheduler.performance !== undefined &&
               typeof frameScheduler.start === 'function';
      }
    },
    {
      name: 'Démarrage Manual',
      test: async () => {
        frameScheduler.start();
        await new Promise(resolve => setTimeout(resolve, 100));
        return frameScheduler.isRunning === true;
      }
    },
    {
      name: 'Métriques FPS',
      test: async () => {
        await new Promise(resolve => setTimeout(resolve, 500));
        return frameScheduler.performance.frameCount > 0;
      }
    },
    {
      name: 'Toggle Debug Mode',
      test: () => {
        const initialDebugMode = frameScheduler.context.controls.debugMode;
        frameScheduler.toggleDebugMode();
        return frameScheduler.context.controls.debugMode !== initialDebugMode;
      }
    },
    {
      name: 'Pause/Resume',
      test: async () => {
        frameScheduler.pause();
        await new Promise(resolve => setTimeout(resolve, 100));
        const isPaused = frameScheduler.isPaused;

        frameScheduler.resume();
        await new Promise(resolve => setTimeout(resolve, 100));
        const isResumed = frameScheduler.isRunning;

        return isPaused && isResumed;
      }
    },
    {
      name: 'Configuration Update',
      test: () => {
        const initialTargetFPS = frameScheduler.context.config.targetFPS;
        frameScheduler.updateConfig({ targetFPS: 30 });
        return frameScheduler.context.config.targetFPS === 30 && initialTargetFPS !== 30;
      }
    },
    {
      name: 'Step Mode',
      test: async () => {
        frameScheduler.enableStepMode();
        await new Promise(resolve => setTimeout(resolve, 100));
        const stepModeEnabled = frameScheduler.context.controls.stepMode;

        frameScheduler.disableStepMode();
        await new Promise(resolve => setTimeout(resolve, 100));
        const stepModeDisabled = !frameScheduler.context.controls.stepMode;

        return stepModeEnabled && stepModeDisabled;
      }
    },
    {
      name: 'Reset Metrics',
      test: () => {
        const initialFrameCount = frameScheduler.performance.frameCount;
        frameScheduler.resetMetrics();
        return frameScheduler.performance.frameCount === 0 && initialFrameCount > 0;
      }
    },
    {
      name: 'Status Helpers',
      test: () => {
        const status = frameScheduler.getPerformanceStatus();
        const stateDesc = frameScheduler.getStateDescription();
        const systemsStatus = frameScheduler.getSystemsStatus();

        return typeof status === 'string' &&
               typeof stateDesc === 'string' &&
               typeof systemsStatus === 'object';
      }
    },
    {
      name: 'Debug Hook',
      test: () => {
        return debug.currentState !== undefined &&
               Array.isArray(debug.nextEvents) &&
               typeof debug.context === 'object';
      }
    }
  ];

  // 🚀 Exécution Automatique des Tests
  useEffect(() => {
    if (isTestRunning && currentTest < tests.length) {
      const runCurrentTest = async () => {
        const test = tests[currentTest];
        console.log(`🧪 Running test: ${test.name}`);

        try {
          const result = await test.test();
          const testResult = {
            name: test.name,
            passed: !!result,
            error: null,
            timestamp: new Date().toISOString()
          };

          setTestResults(prev => [...prev, testResult]);
          console.log(`${result ? '✅' : '❌'} ${test.name}: ${result ? 'PASSED' : 'FAILED'}`);

          setTimeout(() => {
            setCurrentTest(prev => prev + 1);
          }, 200);

        } catch (error) {
          const testResult = {
            name: test.name,
            passed: false,
            error: error.message,
            timestamp: new Date().toISOString()
          };

          setTestResults(prev => [...prev, testResult]);
          console.error(`❌ ${test.name}: ERROR - ${error.message}`);

          setTimeout(() => {
            setCurrentTest(prev => prev + 1);
          }, 200);
        }
      };

      runCurrentTest();
    } else if (isTestRunning && currentTest >= tests.length) {
      setIsTestRunning(false);
      console.log('🏁 All tests completed!');
    }
  }, [isTestRunning, currentTest, tests.length]);

  // 🎮 Contrôles de Test
  const startTests = () => {
    setTestResults([]);
    setCurrentTest(0);
    setIsTestRunning(true);
    console.log('🚀 Starting FrameScheduler integration tests...');
  };

  const stopTests = () => {
    setIsTestRunning(false);
    frameScheduler.stop();
  };

  // 📊 Calcul des Statistiques
  const totalTests = tests.length;
  const completedTests = testResults.length;
  const passedTests = testResults.filter(r => r.passed).length;
  const failedTests = testResults.filter(r => !r.passed).length;
  const successRate = completedTests > 0 ? Math.round((passedTests / completedTests) * 100) : 0;

  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      left: '20px',
      right: '20px',
      backgroundColor: 'rgba(0, 0, 0, 0.9)',
      color: 'white',
      padding: '20px',
      borderRadius: '8px',
      fontFamily: 'monospace',
      fontSize: '12px',
      maxHeight: '80vh',
      overflow: 'auto',
      zIndex: 10001
    }}>
      <h2 style={{ margin: '0 0 15px 0', color: '#00ff88' }}>
        🧪 FrameScheduler Integration Test Suite
      </h2>

      {/* 📊 Statistiques */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
        gap: '10px',
        marginBottom: '15px',
        padding: '10px',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: '4px'
      }}>
        <div>
          <div style={{ color: '#888' }}>Total Tests</div>
          <div style={{ fontSize: '16px', fontWeight: 'bold' }}>{totalTests}</div>
        </div>
        <div>
          <div style={{ color: '#888' }}>Completed</div>
          <div style={{ fontSize: '16px', fontWeight: 'bold' }}>{completedTests}</div>
        </div>
        <div>
          <div style={{ color: '#888' }}>Passed</div>
          <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#00ff88' }}>{passedTests}</div>
        </div>
        <div>
          <div style={{ color: '#888' }}>Failed</div>
          <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#ff4444' }}>{failedTests}</div>
        </div>
        <div>
          <div style={{ color: '#888' }}>Success Rate</div>
          <div style={{
            fontSize: '16px',
            fontWeight: 'bold',
            color: successRate >= 90 ? '#00ff88' : successRate >= 70 ? '#ffaa00' : '#ff4444'
          }}>
            {successRate}%
          </div>
        </div>
      </div>

      {/* 🎮 Contrôles */}
      <div style={{ marginBottom: '15px' }}>
        <button
          onClick={startTests}
          disabled={isTestRunning}
          style={{
            ...buttonStyle,
            backgroundColor: isTestRunning ? '#666' : '#007700',
            marginRight: '10px'
          }}
        >
          🚀 {isTestRunning ? 'Tests Running...' : 'Start Tests'}
        </button>
        <button
          onClick={stopTests}
          style={{
            ...buttonStyle,
            backgroundColor: '#770000'
          }}
        >
          🛑 Stop
        </button>
      </div>

      {/* 📋 Résultats des Tests */}
      <div style={{ marginBottom: '15px' }}>
        <h3 style={{ margin: '0 0 10px 0' }}>📋 Test Results</h3>
        <div style={{ maxHeight: '200px', overflow: 'auto' }}>
          {testResults.map((result, index) => (
            <div
              key={index}
              style={{
                padding: '5px',
                marginBottom: '5px',
                backgroundColor: result.passed ? 'rgba(0, 255, 136, 0.1)' : 'rgba(255, 68, 68, 0.1)',
                borderLeft: `3px solid ${result.passed ? '#00ff88' : '#ff4444'}`,
                borderRadius: '2px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>{result.passed ? '✅' : '❌'} {result.name}</span>
                <span style={{ color: '#888', fontSize: '10px' }}>
                  {new Date(result.timestamp).toLocaleTimeString()}
                </span>
              </div>
              {result.error && (
                <div style={{ color: '#ff4444', fontSize: '10px', marginTop: '2px' }}>
                  Error: {result.error}
                </div>
              )}
            </div>
          ))}

          {isTestRunning && currentTest < tests.length && (
            <div style={{
              padding: '5px',
              backgroundColor: 'rgba(255, 170, 0, 0.1)',
              borderLeft: '3px solid #ffaa00',
              borderRadius: '2px'
            }}>
              🔄 Running: {tests[currentTest].name}
            </div>
          )}
        </div>
      </div>

      {/* 🎯 État Actuel du FrameScheduler */}
      <div style={{
        padding: '10px',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: '4px'
      }}>
        <h3 style={{ margin: '0 0 10px 0' }}>🎯 FrameScheduler Status</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px' }}>
          <div>
            <div style={{ color: '#888' }}>State</div>
            <div>{frameScheduler.getStateDescription()}</div>
          </div>
          <div>
            <div style={{ color: '#888' }}>Running</div>
            <div style={{ color: frameScheduler.isRunning ? '#00ff88' : '#ff4444' }}>
              {frameScheduler.isRunning ? 'Yes' : 'No'}
            </div>
          </div>
          <div>
            <div style={{ color: '#888' }}>FPS</div>
            <div>{frameScheduler.performance.fps}</div>
          </div>
          <div>
            <div style={{ color: '#888' }}>Frames</div>
            <div>{frameScheduler.performance.frameCount}</div>
          </div>
          <div>
            <div style={{ color: '#888' }}>Performance</div>
            <div style={{
              color: frameScheduler.getPerformanceStatus() === 'good' ? '#00ff88' :
                    frameScheduler.getPerformanceStatus() === 'warning' ? '#ffaa00' : '#ff4444'
            }}>
              {frameScheduler.getPerformanceStatus()}
            </div>
          </div>
          <div>
            <div style={{ color: '#888' }}>Debug Mode</div>
            <div style={{ color: frameScheduler.context.controls.debugMode ? '#00ff88' : '#888' }}>
              {frameScheduler.context.controls.debugMode ? 'Enabled' : 'Disabled'}
            </div>
          </div>
        </div>
      </div>

      {/* 🏁 Résumé Final */}
      {!isTestRunning && completedTests === totalTests && (
        <div style={{
          marginTop: '15px',
          padding: '15px',
          backgroundColor: successRate >= 90 ? 'rgba(0, 255, 136, 0.1)' : 'rgba(255, 170, 0, 0.1)',
          borderRadius: '4px',
          borderLeft: `4px solid ${successRate >= 90 ? '#00ff88' : '#ffaa00'}`
        }}>
          <h3 style={{ margin: '0 0 10px 0' }}>
            🏁 Test Suite {successRate >= 90 ? 'PASSED' : 'COMPLETED WITH ISSUES'}
          </h3>
          <div>
            {successRate >= 90 ? (
              <div style={{ color: '#00ff88' }}>
                ✅ All tests passed! FrameSchedulerMachine is ready for production.
              </div>
            ) : successRate >= 70 ? (
              <div style={{ color: '#ffaa00' }}>
                ⚠️ Most tests passed but some issues detected. Review failed tests.
              </div>
            ) : (
              <div style={{ color: '#ff4444' }}>
                ❌ Multiple test failures. FrameScheduler needs debugging.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const buttonStyle = {
  backgroundColor: '#333',
  color: 'white',
  border: '1px solid #555',
  borderRadius: '4px',
  padding: '8px 12px',
  fontSize: '11px',
  cursor: 'pointer',
  fontFamily: 'monospace'
};

export default FrameSchedulerTestIntegration;