// 🧪 Tests Unitaires FrameSchedulerMachine - Atome D1
// Tests de validation du comportement et des transitions

import { interpret } from 'xstate';
import { frameSchedulerMachine } from '../machine';
import { defaultFrameSchedulerConfig } from '../types';

describe('FrameSchedulerMachine - Atome D1', () => {
  let service;

  beforeEach(() => {
    service = interpret(frameSchedulerMachine);
  });

  afterEach(() => {
    if (service.status === 1) { // RUNNING
      service.stop();
    }
  });

  // 🚀 Tests d'Initialisation
  describe('Initialisation', () => {
    test('should start in idle state', () => {
      expect(service.initialState.value).toBe('idle');
    });

    test('should have default configuration', () => {
      const context = service.initialState.context;
      expect(context.config.targetFPS).toBe(defaultFrameSchedulerConfig.targetFPS);
      expect(context.config.enablePerformanceMonitoring).toBe(true);
    });

    test('should have all systems enabled by default', () => {
      const context = service.initialState.context;
      const systems = context.systems;

      expect(systems.animation).toBe(true);
      expect(systems.physics).toBe(true);
      expect(systems.particles).toBe(true);
      expect(systems.lighting).toBe(true);
      expect(systems.effects).toBe(true);
      expect(systems.render).toBe(true);
      expect(systems.eyeRotation).toBe(true);
      expect(systems.environment).toBe(true);
    });

    test('should have no errors initially', () => {
      const context = service.initialState.context;
      expect(context.error.hasError).toBe(false);
      expect(context.error.errorType).toBe(null);
    });
  });

  // 🎮 Tests de Contrôle de Base
  describe('Contrôles de Base', () => {
    test('should transition from idle to running on START_LOOP', () => {
      service.start();

      const nextState = service.send('START_LOOP');
      expect(nextState.value).toEqual(expect.objectContaining({
        running: expect.any(Object)
      }));
    });

    test('should transition from running to idle on STOP_LOOP', () => {
      service.start();
      service.send('START_LOOP');

      const nextState = service.send('STOP_LOOP');
      expect(nextState.value).toBe('idle');
    });

    test('should transition from running to paused on PAUSE_LOOP', () => {
      service.start();
      service.send('START_LOOP');

      const nextState = service.send('PAUSE_LOOP');
      expect(nextState.value).toBe('paused');
    });

    test('should transition from paused to running on RESUME_LOOP', () => {
      service.start();
      service.send('START_LOOP');
      service.send('PAUSE_LOOP');

      const nextState = service.send('RESUME_LOOP');
      expect(nextState.value).toEqual(expect.objectContaining({
        running: expect.any(Object)
      }));
    });
  });

  // 📊 Tests de Performance
  describe('Gestion de Performance', () => {
    test('should update performance metrics on PERFORMANCE_UPDATE', () => {
      service.start();
      service.send('START_LOOP');

      const mockMetrics = {
        fps: 60,
        averageFPS: 58,
        frameTime: 16.67,
        averageFrameTime: 17.2,
        maxFrameTime: 25.3,
        minFrameTime: 14.1,
        frameCount: 1000,
        droppedFrames: 2
      };

      const nextState = service.send({
        type: 'PERFORMANCE_UPDATE',
        metrics: mockMetrics
      });

      expect(nextState.context.performance.fps).toBe(60);
      expect(nextState.context.performance.averageFPS).toBeGreaterThan(0);
    });

    test('should handle FRAME_TICK events', () => {
      service.start();
      service.send('START_LOOP');

      const nextState = service.send({
        type: 'FRAME_TICK',
        deltaTime: 0.016667,
        timestamp: performance.now()
      });

      expect(nextState.context.deltaTime).toBeCloseTo(0.016667, 5);
    });
  });

  // 🐛 Tests de Debug
  describe('Mode Debug', () => {
    test('should toggle debug mode', () => {
      service.start();

      const nextState = service.send('TOGGLE_DEBUG_MODE');
      expect(nextState.context.controls.debugMode).toBe(true);

      const toggledState = service.send('TOGGLE_DEBUG_MODE');
      expect(toggledState.context.controls.debugMode).toBe(false);
    });

    test('should transition to debugging state on ENABLE_STEP_MODE', () => {
      service.start();
      service.send('START_LOOP');

      const nextState = service.send('ENABLE_STEP_MODE');
      expect(nextState.value).toBe('debugging');
      expect(nextState.context.controls.stepMode).toBe(true);
    });

    test('should handle STEP_FRAME in debugging mode', () => {
      service.start();
      service.send('START_LOOP');
      service.send('ENABLE_STEP_MODE');

      const canStep = service.state.can('STEP_FRAME');
      expect(canStep).toBe(true);
    });
  });

  // 🚨 Tests de Gestion d'Erreur
  describe('Gestion d\'Erreur', () => {
    test('should handle ERROR_OCCURRED event', () => {
      service.start();
      service.send('START_LOOP');

      const errorEvent = {
        type: 'ERROR_OCCURRED',
        error: {
          type: 'FRAME_TIMEOUT',
          message: 'Frame took too long to process',
          timestamp: performance.now()
        }
      };

      const nextState = service.send(errorEvent);

      // Should transition to recovering for recoverable errors
      expect(nextState.value).toBe('recovering');
      expect(nextState.context.error.hasError).toBe(true);
      expect(nextState.context.error.errorType).toBe('FRAME_TIMEOUT');
    });

    test('should handle critical errors differently', () => {
      service.start();
      service.send('START_LOOP');

      const criticalError = {
        type: 'ERROR_OCCURRED',
        error: {
          type: 'WEBGL_CONTEXT_LOST',
          message: 'WebGL context has been lost',
          timestamp: performance.now()
        }
      };

      const nextState = service.send(criticalError);

      // Critical errors should go to contextLost state
      expect(nextState.value).toBe('contextLost');
    });
  });

  // 🔄 Tests de Récupération
  describe('Récupération', () => {
    test('should track recovery progress', () => {
      service.start();
      service.send('START_LOOP');

      // Force une erreur récupérable
      service.send({
        type: 'ERROR_OCCURRED',
        error: {
          type: 'FRAME_TIMEOUT',
          message: 'Test error',
          timestamp: performance.now()
        }
      });

      expect(service.state.value).toBe('recovering');

      const progressState = service.send({
        type: 'RECOVERY_PROGRESS',
        progress: 0.5
      });

      expect(progressState.context.recovery.recoveryProgress).toBe(0.5);
    });

    test('should increment recovery attempts', () => {
      service.start();
      const initialAttempts = service.state.context.error.recoveryAttempts;

      service.send('START_LOOP');
      service.send({
        type: 'ERROR_OCCURRED',
        error: {
          type: 'FRAME_TIMEOUT',
          message: 'Test error',
          timestamp: performance.now()
        }
      });

      expect(service.state.context.error.recoveryAttempts).toBe(initialAttempts + 1);
    });
  });

  // ⚙️ Tests de Configuration
  describe('Configuration', () => {
    test('should update configuration', () => {
      service.start();

      const newConfig = {
        targetFPS: 30,
        enablePerformanceMonitoring: false
      };

      const nextState = service.send({
        type: 'UPDATE_CONFIG',
        config: newConfig
      });

      expect(nextState.context.config.targetFPS).toBe(30);
      expect(nextState.context.config.enablePerformanceMonitoring).toBe(false);
    });
  });

  // 🎮 Tests WebGL
  describe('Gestion WebGL', () => {
    test('should handle WEBGL_CONTEXT_LOST', () => {
      service.start();
      service.send('START_LOOP');

      const nextState = service.send('WEBGL_CONTEXT_LOST');

      expect(nextState.value).toBe('contextLost');
      expect(nextState.context.error.errorType).toBe('WEBGL_CONTEXT_LOST');
      expect(nextState.context.controls.isPaused).toBe(true);
    });

    test('should handle WEBGL_CONTEXT_RESTORED', () => {
      service.start();
      service.send('START_LOOP');
      service.send('WEBGL_CONTEXT_LOST');

      const nextState = service.send('WEBGL_CONTEXT_RESTORED');

      expect(nextState.value).toEqual(expect.objectContaining({
        running: expect.any(Object)
      }));
      expect(nextState.context.error.hasError).toBe(false);
    });
  });

  // 🔍 Tests de Guards
  describe('Guards', () => {
    test('canStartLoop should work correctly', () => {
      service.start();

      // Should be able to start from idle
      expect(service.state.can('START_LOOP')).toBe(true);

      service.send('START_LOOP');

      // Should not be able to start when already running
      expect(service.state.can('START_LOOP')).toBe(false);
    });

    test('should prevent actions when in error state', () => {
      service.start();
      service.send('START_LOOP');

      // Force un état d'erreur critique
      service.send({
        type: 'ERROR_OCCURRED',
        error: {
          type: 'MEMORY_EXHAUSTED',
          message: 'Out of memory',
          timestamp: performance.now()
        }
      });

      // Devrait être dans un état d'erreur
      const canStart = service.state.can('START_LOOP');
      expect(canStart).toBeFalsy();
    });
  });

  // 📈 Tests de Métriques
  describe('Métriques et Télémétrie', () => {
    test('should maintain frame time history', () => {
      service.start();
      service.send('START_LOOP');

      // Simuler plusieurs frames
      for (let i = 0; i < 5; i++) {
        service.send({
          type: 'FRAME_TICK',
          deltaTime: 0.016667 + (Math.random() * 0.002),
          timestamp: performance.now() + (i * 16.667)
        });
      }

      expect(service.state.context.performance.frameCount).toBeGreaterThan(0);
    });

    test('should reset metrics correctly', () => {
      service.start();
      service.send('START_LOOP');

      // Ajouter quelques frames
      service.send({
        type: 'PERFORMANCE_UPDATE',
        metrics: { fps: 60, frameCount: 100 }
      });

      const beforeReset = service.state.context.performance.frameCount;
      expect(beforeReset).toBeGreaterThan(0);

      service.send('RESET_PERFORMANCE_METRICS');

      const afterReset = service.state.context.performance.frameCount;
      expect(afterReset).toBe(0);
    });
  });
});

// 🧪 Tests d'Intégration
describe('FrameScheduler Integration Tests', () => {
  test('should work with mock window objects', (done) => {
    // Mock des objets window nécessaires
    global.window = global.window || {};
    window.performance = window.performance || { now: () => Date.now() };
    window.requestAnimationFrame = window.requestAnimationFrame ||
      ((callback) => setTimeout(() => callback(performance.now()), 16));
    window.cancelAnimationFrame = window.cancelAnimationFrame || clearTimeout;

    const service = interpret(frameSchedulerMachine);

    service.onTransition((state) => {
      if (state.matches('running')) {
        // Test réussi si on atteint l'état running
        service.stop();
        done();
      }
    });

    service.start();
    service.send('START_LOOP');
  });

  test('should handle missing Three.js objects gracefully', () => {
    const service = interpret(frameSchedulerMachine);
    service.start();
    service.send('START_LOOP');

    // Simuler un frame tick sans objets Three.js
    expect(() => {
      service.send({
        type: 'FRAME_TICK',
        deltaTime: 0.016667,
        timestamp: performance.now()
      });
    }).not.toThrow();

    service.stop();
  });
});