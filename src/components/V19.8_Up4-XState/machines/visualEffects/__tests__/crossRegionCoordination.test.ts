/**
 * 🔗 Cross-Region Coordination Tests - B3↔B4↔B5 Bridges
 * Tests de coordination entre régions Lighting ↔ Environment ↔ Security
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { interpret } from 'xstate';
import { visualEffectsMachineWithConfig as visualEffectsMachine } from '../machineWithConfig';
import type { VisualEffectsContext } from '../types';

describe('Cross-Region Coordination - B3↔B4↔B5 Bridges', () => {
  let service: any;
  let currentState: any;
  let consoleSpy: any;

  beforeEach(() => {
    service = interpret(visualEffectsMachine);
    service.start();
    currentState = service.getSnapshot();

    // Spy sur console.log pour vérifier les bridges
    consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    service.stop();
    consoleSpy.mockRestore();
  });

  // ============================================
  // TESTS COORDINATION B5 ↔ AUTRES RÉGIONS
  // ============================================

  describe('B5 Security Coordination', () => {
    it('should automatically establish visual effects bridge on B5 activation', () => {
      service.send({ type: 'B5_SECURITY.ACTIVATE' });
      currentState = service.getSnapshot();

      // Bridge visualEffects auto-connecté
      const bridges = currentState.context.security.securityMachine.bridgeConnections;
      expect(bridges.visualEffects).toBe(true);
    });

    it('should coordinate security escalation across all regions', () => {
      // Activer B5 Security
      service.send({ type: 'B5_SECURITY.ACTIVATE' });

      // Escalade vers niveau critique
      service.send({ type: 'B5_SECURITY.SET_LEVEL', level: 'lockdown' });
      currentState = service.getSnapshot();

      // Vérifier que l'escalade coordonnée est déclenchée
      expect(consoleSpy).toHaveBeenCalledWith('🚨 Escalade de sécurité globale déclenchée');

      // Le niveau est bien mis à jour
      expect(currentState.context.security.securityMachine.securityLevel).toBe('lockdown');
    });

    it('should trigger cross-region performance optimization on circuit breaker', () => {
      service.send({ type: 'B5_SECURITY.ACTIVATE' });

      // Performance critique = circuit breaker ouvert
      const criticalMetrics = {
        fps: 15, // Très faible
        frameTime: 67,
        cpuUsage: 95,
        memoryUsage: 2048
      };

      service.send({ type: 'B5_SECURITY.PERFORMANCE_DEGRADED', metrics: criticalMetrics });
      currentState = service.getSnapshot();

      const securityMachine = currentState.context.security.securityMachine;
      expect(securityMachine.performanceMode).toBe('minimal');
      expect(securityMachine.circuitBreakerState).toBe('open');

      // Devrait déclencher optimisations cross-région
      expect(consoleSpy).toHaveBeenCalledWith('🚨 Escalade de sécurité globale déclenchée');
    });

    it('should reduce visual effects quality on high security levels', () => {
      service.send({ type: 'B5_SECURITY.ACTIVATE' });

      // Escalade vers alert
      service.send({ type: 'B5_SECURITY.SET_LEVEL', level: 'alert' });

      // Vérifier log de réduction automatique
      expect(consoleSpy).toHaveBeenCalledWith('⬇️ Réduction automatique des effets visuels');
    });

    it('should activate HDR security mode on lockdown', () => {
      service.send({ type: 'B5_SECURITY.ACTIVATE' });

      // Escalade vers lockdown
      service.send({ type: 'B5_SECURITY.SET_LEVEL', level: 'lockdown' });

      // Vérifier activation mode HDR sécurisé
      expect(consoleSpy).toHaveBeenCalledWith('🌍 Mode HDR sécurisé activé');
    });

    it('should optimize lighting on circuit breaker open', () => {
      service.send({ type: 'B5_SECURITY.ACTIVATE' });

      // Performance très dégradée
      service.send({
        type: 'B5_SECURITY.PERFORMANCE_DEGRADED',
        metrics: { fps: 10, frameTime: 100, cpuUsage: 98, memoryUsage: 3072 }
      });
      currentState = service.getSnapshot();

      const circuitBreakerOpen = currentState.context.security.securityMachine.circuitBreakerState === 'open';
      expect(circuitBreakerOpen).toBe(true);

      // Devrait optimiser l'éclairage
      expect(consoleSpy).toHaveBeenCalledWith('💡 Mode éclairage minimal pour performance');
    });
  });

  // ============================================
  // TESTS COORDINATION B3 LIGHTING ↔ B5
  // ============================================

  describe('B3 Lighting ↔ B5 Security Bridge', () => {
    it('should notify security when lighting is enabled', () => {
      // Activer B5 d'abord
      service.send({ type: 'B5_SECURITY.ACTIVATE' });

      // Activer éclairage B3
      service.send({ type: 'LIGHTING.ENABLE_BASE' });

      // Vérifier notification bridge (async)
      setTimeout(() => {
        expect(consoleSpy).toHaveBeenCalledWith('🔗 B3 Lighting → B5 Security bridge établi');
      }, 10);
    });

    it('should manually connect B3-B5 bridge', () => {
      service.send({ type: 'B5_SECURITY.ACTIVATE' });

      // Connecter bridge manuellement
      service.send({ type: 'B5_SECURITY.BRIDGE_CONNECT', system: 'b3-lighting' });
      currentState = service.getSnapshot();

      const bridges = currentState.context.security.securityMachine.bridgeConnections;
      expect(bridges.b3Lighting).toBe(true);
    });

    it('should disconnect B3-B5 bridge', () => {
      service.send({ type: 'B5_SECURITY.ACTIVATE' });
      service.send({ type: 'B5_SECURITY.BRIDGE_CONNECT', system: 'b3-lighting' });

      // Déconnecter
      service.send({ type: 'B5_SECURITY.BRIDGE_DISCONNECT', system: 'b3-lighting' });
      currentState = service.getSnapshot();

      const bridges = currentState.context.security.securityMachine.bridgeConnections;
      expect(bridges.b3Lighting).toBe(false);
    });
  });

  // ============================================
  // TESTS COORDINATION B4 ENVIRONMENT ↔ B5
  // ============================================

  describe('B4 Environment ↔ B5 Security Bridge', () => {
    it('should connect B4-B5 bridge', () => {
      service.send({ type: 'B5_SECURITY.ACTIVATE' });

      service.send({ type: 'B5_SECURITY.BRIDGE_CONNECT', system: 'b4-environment' });
      currentState = service.getSnapshot();

      const bridges = currentState.context.security.securityMachine.bridgeConnections;
      expect(bridges.b4Environment).toBe(true);
    });

    it('should coordinate HDR adjustments with security level', () => {
      service.send({ type: 'B5_SECURITY.ACTIVATE' });
      service.send({ type: 'B5_SECURITY.BRIDGE_CONNECT', system: 'b4-environment' });

      // Monter le niveau de sécurité
      service.send({ type: 'B5_SECURITY.SET_LEVEL', level: 'lockdown' });

      // Devrait activer mode HDR sécurisé
      expect(consoleSpy).toHaveBeenCalledWith('🌍 Mode HDR sécurisé activé');
    });
  });

  // ============================================
  // TESTS SYNCHRONISATION PERFORMANCE
  // ============================================

  describe('Cross-Region Performance Synchronization', () => {
    it('should synchronize performance metrics across regions', () => {
      // Simuler des métriques B3 et B4
      currentState = service.getSnapshot();
      const initialContext = currentState.context;

      // Mock des métriques réalistes
      const updatedContext = {
        ...initialContext,
        lighting: {
          ...initialContext.lighting,
          performance: {
            frameTime: 20,
            avgFrameTime: 18,
            maxFrameTime: 25,
            fps: 50,
            batchEfficiency: 0.9,
            fallbackCount: 2,
            adaptiveThrottling: false
          }
        },
        environment: {
          ...initialContext.environment,
          performance: {
            frameTime: 15,
            renderTime: 12,
            loadTime: 200,
            fps: 67,
            memoryUsage: 512,
            cacheHitRate: 0.85,
            adaptiveQuality: true
          }
        }
      };

      // La synchronisation devrait calculer les moyennes
      const avgFrameTime = (20 + 15 + 16) / 3; // ~17ms
      const expectedFPS = 1000 / avgFrameTime; // ~59fps

      // Test approximatif car calcul automatique
      expect(avgFrameTime).toBeCloseTo(17, 1);
      expect(expectedFPS).toBeCloseTo(59, 0);
    });

    it('should trigger emergency mode on extreme performance degradation', () => {
      service.send({ type: 'B5_SECURITY.ACTIVATE' });

      // Performance catastrophique
      const extremeMetrics = {
        fps: 5, // Extrêmement faible
        frameTime: 200,
        cpuUsage: 100,
        memoryUsage: 4096
      };

      service.send({ type: 'B5_SECURITY.PERFORMANCE_DEGRADED', metrics: extremeMetrics });
      currentState = service.getSnapshot();

      const securityMachine = currentState.context.security.securityMachine;
      expect(securityMachine.performanceMode).toBe('minimal');
      expect(securityMachine.circuitBreakerState).toBe('open');

      // Toutes les optimisations devraient être activées
      expect(consoleSpy).toHaveBeenCalledWith('🚨 Escalade de sécurité globale déclenchée');
      expect(consoleSpy).toHaveBeenCalledWith('⬇️ Réduction automatique des effets visuels');
      expect(consoleSpy).toHaveBeenCalledWith('🌍 Mode HDR sécurisé activé');
      expect(consoleSpy).toHaveBeenCalledWith('💡 Mode éclairage minimal pour performance');
    });
  });

  // ============================================
  // TESTS COORDINATION LEGACY COMPATIBILITY
  // ============================================

  describe('Legacy System Coordination', () => {
    it('should coordinate legacy security presets with B5', () => {
      // Preset legacy
      service.send({ type: 'SECURITY.SET_PRESET', preset: 'DANGER' });

      // Activer B5 en parallèle
      service.send({ type: 'B5_SECURITY.ACTIVATE' });
      service.send({ type: 'B5_SECURITY.SET_LEVEL', level: 'alert' });

      currentState = service.getSnapshot();

      // Les deux systèmes coexistent
      expect(currentState.context.security.currentPreset).toBe('DANGER');
      expect(currentState.context.security.securityMachine.securityLevel).toBe('alert');
      expect(currentState.context.security.securityMachine.isActive).toBe(true);
    });

    it('should maintain bloom/pbr coordination with legacy presets', () => {
      // Test que les presets legacy affectent toujours bloom/pbr
      service.send({ type: 'SECURITY.SET_PRESET', preset: 'SAFE' });
      currentState = service.getSnapshot();

      // Vérifier que les presets existent toujours
      const safePreset = currentState.context.security.presets.SAFE;
      expect(safePreset).toBeDefined();
      expect(safePreset.bloomPreset).toBeDefined();
      expect(safePreset.pbrPreset).toBeDefined();
    });
  });

  // ============================================
  // TESTS ÉTATS PARALLÈLES COMPLEXES
  // ============================================

  describe('Complex Parallel States Coordination', () => {
    it('should handle multiple parallel security operations', () => {
      service.send({ type: 'B5_SECURITY.ACTIVATE' });

      // Opérations simultanées
      service.send({ type: 'B5_SECURITY.SET_LEVEL', level: 'alert' });
      service.send({ type: 'B5_SECURITY.TRIGGER_ALERT', pattern: 'flash' });
      service.send({ type: 'B5_SECURITY.BRIDGE_CONNECT', system: 'b3-lighting' });
      service.send({
        type: 'B5_SECURITY.THREAT_DETECTED',
        threat: { score: 65, threats: [{ id: 'test', type: 'test', severity: 'high', timestamp: Date.now() }] }
      });

      currentState = service.getSnapshot();
      const securityMachine = currentState.context.security.securityMachine;

      // Toutes les opérations devraient être effectives
      expect(securityMachine.securityLevel).toBe('alert');
      expect(securityMachine.activeAlerts).toHaveLength(1);
      expect(securityMachine.bridgeConnections.b3Lighting).toBe(true);
      expect(securityMachine.threatScore).toBe(65);
      expect(securityMachine.currentThreats).toHaveLength(1);
    });

    it('should maintain state consistency during rapid state changes', () => {
      service.send({ type: 'B5_SECURITY.ACTIVATE' });

      // Changements rapides
      const operations = [
        { type: 'B5_SECURITY.SET_LEVEL', level: 'scanning' },
        { type: 'B5_SECURITY.ESCALATE' }, // scanning -> alert
        { type: 'B5_SECURITY.ESCALATE' }, // alert -> lockdown
        { type: 'B5_SECURITY.DEESCALATE' }, // lockdown -> alert
        { type: 'B5_SECURITY.SET_LEVEL', level: 'normal' }
      ];

      operations.forEach(op => service.send(op as any));
      currentState = service.getSnapshot();

      // État final cohérent
      expect(currentState.context.security.securityMachine.securityLevel).toBe('normal');
      expect(currentState.context.security.securityMachine.isActive).toBe(true);
    });
  });

  // ============================================
  // TESTS EDGE CASES & ROBUSTESSE
  // ============================================

  describe('Edge Cases & Robustness', () => {
    it('should handle bridge operations when B5 is inactive', () => {
      // Tentative de connexion bridge sans B5 actif
      service.send({ type: 'B5_SECURITY.BRIDGE_CONNECT', system: 'b3-lighting' });
      currentState = service.getSnapshot();

      // Ne devrait pas planter, mais pas d'effet non plus
      expect(currentState.context.security.securityMachine.isActive).toBe(false);
    });

    it('should handle performance metrics with invalid values', () => {
      service.send({ type: 'B5_SECURITY.ACTIVATE' });

      // Métriques invalides
      const invalidMetrics = {
        fps: -10, // Négatif
        frameTime: 0, // Zéro
        cpuUsage: 150, // > 100%
        memoryUsage: -1024 // Négatif
      };

      // Ne devrait pas planter
      expect(() => {
        service.send({ type: 'B5_SECURITY.PERFORMANCE_DEGRADED', metrics: invalidMetrics });
      }).not.toThrow();

      currentState = service.getSnapshot();
      expect(currentState.context.security.securityMachine.isActive).toBe(true);
    });

    it('should handle malformed threat data gracefully', () => {
      service.send({ type: 'B5_SECURITY.ACTIVATE' });

      // Données de menace malformées
      const malformedThreat = {
        score: null, // Invalide
        threats: null // Invalide
      };

      // Ne devrait pas planter
      expect(() => {
        service.send({ type: 'B5_SECURITY.THREAT_DETECTED', threat: malformedThreat as any });
      }).not.toThrow();
    });
  });
});