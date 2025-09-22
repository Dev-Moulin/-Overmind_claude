// 🧪 BloomMachine Tests - Atome B1
// Tests unitaires pour la machine XState BloomMachine

import { interpret } from 'xstate';
import { bloomMachine } from '../machine';

// Mock THREE.js pour les tests
const mockTHREE = {
  Mesh: class MockMesh {
    constructor() {
      this.isMesh = true;
      this.material = { emissive: { setHex: jest.fn() }, needsUpdate: false };
      this.name = 'test-mesh';
    }
  },
  Group: class MockGroup {
    constructor() {
      this.isGroup = true;
      this.children = [];
    }
    traverse(callback) {
      this.children.forEach(callback);
    }
  }
};

// Mock services pour les tests
const mockServices = {
  enableGlobalBloom: () => Promise.resolve(),
  disableGlobalBloom: () => Promise.resolve(),
  updateGroupBloom: () => Promise.resolve(),
  applySecurityPreset: ({ preset }) => Promise.resolve({ preset }),
  detectAndRegisterObjects: () => Promise.resolve({ detected: 5 }),
  syncWithRenderer: () => Promise.resolve(),
  dispose: () => Promise.resolve()
};

// Mock actions pour les tests
const mockActions = {
  updateGlobalParams: jest.fn(),
  syncGlobalWithRenderer: jest.fn(),
  updateGroupIris: jest.fn(),
  updateGroupEyeRings: jest.fn(),
  updateGroupRevealRings: jest.fn(),
  updateGroupMagicRings: jest.fn(),
  updateGroupArms: jest.fn(),
  registerIrisObjects: jest.fn(),
  registerEyeRingsObjects: jest.fn(),
  registerRevealRingsObjects: jest.fn(),
  registerMagicRingsObjects: jest.fn(),
  registerArmsObjects: jest.fn(),
  detectAndRegisterObjects: jest.fn(),
  syncWithFrameScheduler: jest.fn(),
  syncWithRenderer: jest.fn(),
  forceRefresh: jest.fn(),
  notifySecurityTransition: jest.fn(),
  dispose: jest.fn(),
  logError: jest.fn()
};

// Mock guards pour les tests
const mockGuards = {
  isValidSecurityPreset: () => true,
  canEnableBloom: () => true,
  canDisableBloom: () => true,
  isValidGroup: () => true,
  hasGroupObjects: () => true,
  isValidThreshold: () => true,
  isValidStrength: () => true,
  isValidRadius: () => true,
  isValidExposure: () => true,
  isValidEmissiveColor: () => true,
  isValidEmissiveIntensity: () => true,
  hasFrameScheduler: () => true,
  hasSimpleBloomSystem: () => true,
  hasBloomControlCenter: () => true,
  canUpdateGroup: () => true,
  isPerformanceMode: () => false,
  shouldThrottleUpdates: () => false,
  hasValidModelForDetection: () => true,
  isSecurityTransitioning: () => false,
  canApplySecurityPreset: () => true,
  hasObjectsInAnyGroup: () => true,
  shouldAutoSync: () => true,
  canDispose: () => true,
  shouldLogPerformance: () => false
};

describe('🌟 BloomMachine Tests', () => {
  let service;
  let mockBloomSystem;
  let mockControlCenter;

  beforeEach(() => {
    // Créer des mocks pour les systèmes externes
    mockBloomSystem = {
      updateBloom: jest.fn(),
      setBloomEnabled: jest.fn(),
      updateGroup: jest.fn(),
      setSecurityMode: jest.fn(),
      addToGroup: jest.fn()
    };

    mockControlCenter = {
      setBloomParameter: jest.fn(),
      setSecurityState: jest.fn(),
      setObjectTypeProperty: jest.fn(),
      registerObject: jest.fn(),
      syncWithRenderingEngine: jest.fn(),
      forceCompleteRefresh: jest.fn()
    };

    // Machine avec mocks
    const machineWithMocks = bloomMachine.withConfig({
      services: mockServices,
      actions: mockActions,
      guards: mockGuards
    }).withContext({
      ...bloomMachine.context,
      simpleBloomSystem: mockBloomSystem,
      bloomControlCenter: mockControlCenter,
      frameScheduler: null
    });

    service = interpret(machineWithMocks);
  });

  afterEach(() => {
    if (service) {
      service.stop();
    }
  });

  describe('🔧 Initialization', () => {
    test('should start in correct initial state', () => {
      service.start();

      expect(service.state.value).toEqual({
        global: 'disabled',
        groups: {
          iris: 'idle',
          eyeRings: 'idle',
          revealRings: 'idle',
          magicRings: 'idle',
          arms: 'idle'
        },
        security: 'normal'
      });
    });

    test('should have correct initial context', () => {
      service.start();

      const context = service.state.context;
      expect(context.global.enabled).toBe(false);
      expect(context.global.threshold).toBe(0.15);
      expect(context.global.strength).toBe(0.40);
      expect(context.global.radius).toBe(0.40);
      expect(context.security.currentPreset).toBe(null);
    });
  });

  describe('🌟 Global Bloom Controls', () => {
    test('should enable bloom globally', (done) => {
      service.start();

      service.onTransition((state) => {
        if (state.value.global === 'enabled') {
          expect(state.context.global.enabled).toBe(true);
          done();
        }
      });

      service.send({ type: 'ENABLE_BLOOM' });
    });

    test('should update global parameters', () => {
      service.start();

      service.send({
        type: 'UPDATE_GLOBAL',
        threshold: 0.2,
        strength: 0.6,
        radius: 0.5
      });

      expect(mockActions.updateGlobalParams).toHaveBeenCalled();
    });

    test('should disable bloom', (done) => {
      service.start();

      // D'abord activer puis désactiver
      service.send({ type: 'ENABLE_BLOOM' });

      service.onTransition((state) => {
        if (state.value.global === 'enabled') {
          service.send({ type: 'DISABLE_BLOOM' });
        } else if (state.value.global === 'disabled' && state.context.global.enabled === false) {
          done();
        }
      });
    });
  });

  describe('🎭 Group Controls', () => {
    beforeEach(() => {
      service.start();
    });

    test('should update iris group', () => {
      service.send({
        type: 'UPDATE_GROUP_IRIS',
        threshold: 0.3,
        emissiveColor: 0x00ff88
      });

      expect(mockActions.updateGroupIris).toHaveBeenCalled();
    });

    test('should update eyeRings group', () => {
      service.send({
        type: 'UPDATE_GROUP_EYERINGS',
        threshold: 0.4,
        emissiveIntensity: 0.8
      });

      expect(mockActions.updateGroupEyeRings).toHaveBeenCalled();
    });

    test('should register objects for groups', () => {
      const mockObjects = new Map();
      mockObjects.set('test1', new mockTHREE.Mesh());

      service.send({
        type: 'REGISTER_OBJECTS',
        group: 'iris',
        objects: mockObjects
      });

      expect(mockActions.registerIrisObjects).toHaveBeenCalled();
    });
  });

  describe('🔒 Security Controls', () => {
    beforeEach(() => {
      service.start();
    });

    test('should change security preset', (done) => {
      service.onTransition((state) => {
        if (state.value.security === 'normal' && state.context.security.currentPreset === 'DANGER') {
          done();
        }
      });

      service.send({
        type: 'SET_SECURITY',
        preset: 'DANGER'
      });
    });

    test('should handle security transition', () => {
      service.send({
        type: 'SET_SECURITY',
        preset: 'WARNING'
      });

      // Vérifier que la transition de sécurité est en cours
      expect(service.state.context.security.isTransitioning).toBe(true);
    });
  });

  describe('🔍 Object Detection', () => {
    beforeEach(() => {
      service.start();
    });

    test('should detect and register objects', () => {
      const mockModel = new mockTHREE.Group();
      mockModel.children = [
        Object.assign(new mockTHREE.Mesh(), { name: 'iris_test' }),
        Object.assign(new mockTHREE.Mesh(), { name: 'anneaux_eye_test' })
      ];

      service.send({
        type: 'DETECT_OBJECTS',
        model: mockModel
      });

      expect(mockActions.detectAndRegisterObjects).toHaveBeenCalled();
    });
  });

  describe('🔄 System Integration', () => {
    beforeEach(() => {
      service.start();
    });

    test('should sync with renderer', () => {
      service.send({ type: 'SYNC_WITH_RENDERER' });
      expect(mockActions.syncWithRenderer).toHaveBeenCalled();
    });

    test('should force refresh', () => {
      service.send({ type: 'FORCE_REFRESH' });
      expect(mockActions.forceRefresh).toHaveBeenCalled();
    });

    test('should sync with frame scheduler', () => {
      service.send({
        type: 'SYNC_WITH_FRAMESCHEDULER',
        fps: 60,
        deltaTime: 16.67
      });

      expect(mockActions.syncWithFrameScheduler).toHaveBeenCalled();
    });
  });

  describe('🧹 Cleanup', () => {
    beforeEach(() => {
      service.start();
    });

    test('should dispose resources', () => {
      service.send({ type: 'DISPOSE' });
      expect(mockActions.dispose).toHaveBeenCalled();
    });
  });

  describe('🚨 Error Handling', () => {
    beforeEach(() => {
      service.start();
    });

    test('should handle errors gracefully', () => {
      const testError = new Error('Test error');

      service.send({
        type: 'ERROR',
        error: testError
      });

      expect(mockActions.logError).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          type: 'ERROR',
          error: testError
        })
      );
    });

    test('should recover from errors', (done) => {
      // Simuler une erreur puis recovery
      service.onTransition((state) => {
        if (state.value.global === 'error') {
          service.send({ type: 'RETRY' });
        } else if (state.value.global === 'enabling') {
          done();
        }
      });

      // Forcer une erreur (en mockant un échec de service)
      service.send({ type: 'ENABLE_BLOOM' });
      // Simuler une erreur dans le service
      service.send({ type: 'ERROR', error: new Error('Bloom enable failed') });
    });
  });

  describe('📊 Performance', () => {
    test('should track performance metrics', () => {
      service.start();

      const initialUpdateCount = service.state.context.performance.updateCount;

      service.send({
        type: 'UPDATE_GLOBAL',
        threshold: 0.25
      });

      // Vérifier que les métriques sont mises à jour (via l'action)
      expect(mockActions.updateGlobalParams).toHaveBeenCalled();
    });

    test('should handle high-frequency updates', () => {
      service.start();

      // Envoyer plusieurs updates rapidement
      for (let i = 0; i < 10; i++) {
        service.send({
          type: 'UPDATE_GROUP_IRIS',
          threshold: 0.1 + i * 0.01
        });
      }

      // Vérifier que les actions sont appelées
      expect(mockActions.updateGroupIris).toHaveBeenCalledTimes(10);
    });
  });
});

// Tests d'intégration avec des mocks plus réalistes
describe('🔗 BloomMachine Integration Tests', () => {
  test('should integrate with SimpleBloomSystem', () => {
    const mockBloomSystem = {
      updateBloom: jest.fn(),
      setBloomEnabled: jest.fn(),
      updateGroup: jest.fn()
    };

    const machineWithIntegration = bloomMachine.withContext({
      ...bloomMachine.context,
      simpleBloomSystem: mockBloomSystem
    });

    const service = interpret(machineWithIntegration);
    service.start();

    // Les intégrations seront testées par les services mockés
    expect(service.state.context.simpleBloomSystem).toBe(mockBloomSystem);

    service.stop();
  });

  test('should work without external systems', () => {
    const isolatedMachine = bloomMachine.withContext({
      ...bloomMachine.context,
      simpleBloomSystem: null,
      bloomControlCenter: null,
      frameScheduler: null
    });

    const service = interpret(isolatedMachine);
    service.start();

    // La machine devrait fonctionner même sans systèmes externes
    expect(service.state.value.global).toBe('disabled');

    service.stop();
  });
});

console.log('🧪 BloomMachine Tests: Suite complète prête à exécuter');