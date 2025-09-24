/**
 * 🧪 VisualEffectsMachine Integration Tests - B5 Security Intégré
 * Tests d'intégration pour la nouvelle architecture unifiée
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { interpret } from 'xstate';
import { visualEffectsMachineWithConfig as visualEffectsMachine } from '../machineWithConfig';
import type { VisualEffectsContext } from '../types';

describe('VisualEffectsMachine - Integration B5 Security', () => {
  let service: any;
  let currentState: any;

  beforeEach(() => {
    service = interpret(visualEffectsMachine);
    service.start();
    currentState = service.getSnapshot();
  });

  afterEach(() => {
    service.stop();
  });

  // ============================================
  // TESTS ACTIVATION B5 SECURITY
  // ============================================

  describe('B5 Security Activation', () => {
    it('should activate B5 security from inactive state', () => {
      // État initial - B5 Security inactive
      expect(currentState.context.security.securityMachine.isActive).toBe(false);
      expect(currentState.value.security).toBe('inactive');

      // Activation B5 Security
      service.send({ type: 'B5_SECURITY.ACTIVATE' });
      currentState = service.getSnapshot();

      // Vérifications
      expect(currentState.context.security.securityMachine.isActive).toBe(true);
      // b5_active est un état parallèle, donc value.security est un objet
      expect(currentState.value.security).toMatchObject({
        b5_active: expect.any(Object)
      });
      expect(currentState.context.security.securityMachine.securityLevel).toBe('normal');
    });

    it('should initialize B5 with correct default values', () => {
      // Activer B5
      service.send({ type: 'B5_SECURITY.ACTIVATE' });
      currentState = service.getSnapshot();

      const securityMachine = currentState.context.security.securityMachine;

      // Vérifier valeurs par défaut
      expect(securityMachine.threatScore).toBe(0);
      expect(securityMachine.currentThreats).toEqual([]);
      expect(securityMachine.activeAlerts).toEqual([]);
      expect(securityMachine.performanceMode).toBe('normal');
      expect(securityMachine.circuitBreakerState).toBe('closed');

      // Vérifier bridges
      expect(securityMachine.bridgeConnections.b3Lighting).toBe(false);
      expect(securityMachine.bridgeConnections.b4Environment).toBe(false);
      expect(securityMachine.bridgeConnections.visualEffects).toBe(true); // Auto-connecté
    });

    it('should deactivate B5 security and reset state', () => {
      // Activer puis configurer
      service.send({ type: 'B5_SECURITY.ACTIVATE' });
      service.send({ type: 'B5_SECURITY.SET_LEVEL', level: 'alert' });
      service.send({
        type: 'B5_SECURITY.THREAT_DETECTED',
        threat: { score: 50, threats: [{ id: 'test', type: 'test', severity: 'medium', timestamp: Date.now() }] }
      });

      // Désactiver
      service.send({ type: 'B5_SECURITY.DEACTIVATE' });
      currentState = service.getSnapshot();

      const securityMachine = currentState.context.security.securityMachine;

      // Vérifier reset complet
      expect(securityMachine.isActive).toBe(false);
      expect(securityMachine.securityLevel).toBe('normal');
      expect(securityMachine.threatScore).toBe(0);
      expect(securityMachine.currentThreats).toEqual([]);
      expect(securityMachine.activeAlerts).toEqual([]);
      expect(currentState.value.security).toBe('inactive');
    });
  });

  // ============================================
  // TESTS ESCALADE SÉCURITÉ
  // ============================================

  describe('Security Level Management', () => {
    beforeEach(() => {
      // Activer B5 avant chaque test d'escalade
      service.send({ type: 'B5_SECURITY.ACTIVATE' });
      currentState = service.getSnapshot();
    });

    it('should escalate security levels correctly', () => {
      // normal → scanning
      service.send({ type: 'B5_SECURITY.ESCALATE' });
      currentState = service.getSnapshot();
      expect(currentState.context.security.securityMachine.securityLevel).toBe('scanning');

      // scanning → alert
      service.send({ type: 'B5_SECURITY.ESCALATE' });
      currentState = service.getSnapshot();
      expect(currentState.context.security.securityMachine.securityLevel).toBe('alert');

      // alert → lockdown
      service.send({ type: 'B5_SECURITY.ESCALATE' });
      currentState = service.getSnapshot();
      expect(currentState.context.security.securityMachine.securityLevel).toBe('lockdown');

      // lockdown → lockdown (max level)
      service.send({ type: 'B5_SECURITY.ESCALATE' });
      currentState = service.getSnapshot();
      expect(currentState.context.security.securityMachine.securityLevel).toBe('lockdown');
    });

    it('should deescalate security levels correctly', () => {
      // Aller à lockdown d'abord
      service.send({ type: 'B5_SECURITY.SET_LEVEL', level: 'lockdown' });

      // lockdown → alert
      service.send({ type: 'B5_SECURITY.DEESCALATE' });
      currentState = service.getSnapshot();
      expect(currentState.context.security.securityMachine.securityLevel).toBe('alert');

      // alert → scanning
      service.send({ type: 'B5_SECURITY.DEESCALATE' });
      currentState = service.getSnapshot();
      expect(currentState.context.security.securityMachine.securityLevel).toBe('scanning');

      // scanning → normal
      service.send({ type: 'B5_SECURITY.DEESCALATE' });
      currentState = service.getSnapshot();
      expect(currentState.context.security.securityMachine.securityLevel).toBe('normal');

      // normal → normal (min level)
      service.send({ type: 'B5_SECURITY.DEESCALATE' });
      currentState = service.getSnapshot();
      expect(currentState.context.security.securityMachine.securityLevel).toBe('normal');
    });

    it('should set security level directly', () => {
      const testLevels: Array<'normal' | 'scanning' | 'alert' | 'lockdown'> = [
        'scanning', 'lockdown', 'alert', 'normal'
      ];

      testLevels.forEach(level => {
        service.send({ type: 'B5_SECURITY.SET_LEVEL', level });
        currentState = service.getSnapshot();
        expect(currentState.context.security.securityMachine.securityLevel).toBe(level);
      });
    });
  });

  // ============================================
  // TESTS GESTION DES MENACES
  // ============================================

  describe('Threat Management', () => {
    beforeEach(() => {
      service.send({ type: 'B5_SECURITY.ACTIVATE' });
      currentState = service.getSnapshot();
    });

    it('should handle threat detection correctly', () => {
      const threat = {
        score: 75,
        threats: [
          { id: 'threat-1', type: 'webgl-context-loss', severity: 'critical', timestamp: Date.now() },
          { id: 'threat-2', type: 'memory-exhaustion', severity: 'high', timestamp: Date.now() }
        ]
      };

      service.send({ type: 'B5_SECURITY.THREAT_DETECTED', threat });
      currentState = service.getSnapshot();

      const securityMachine = currentState.context.security.securityMachine;
      expect(securityMachine.threatScore).toBe(75);
      expect(securityMachine.currentThreats).toHaveLength(2);
      expect(securityMachine.currentThreats[0].id).toBe('threat-1');
      expect(securityMachine.currentThreats[1].id).toBe('threat-2');
    });

    it('should clear specific threats', () => {
      // Ajouter des menaces
      const threat = {
        score: 50,
        threats: [
          { id: 'threat-1', type: 'test', severity: 'medium', timestamp: Date.now() },
          { id: 'threat-2', type: 'test', severity: 'low', timestamp: Date.now() }
        ]
      };
      service.send({ type: 'B5_SECURITY.THREAT_DETECTED', threat });

      // Supprimer une menace spécifique
      service.send({ type: 'B5_SECURITY.THREAT_CLEARED', threatId: 'threat-1' });
      currentState = service.getSnapshot();

      const threats = currentState.context.security.securityMachine.currentThreats;
      expect(threats).toHaveLength(1);
      expect(threats[0].id).toBe('threat-2');
    });

    it('should accumulate multiple threat detections', () => {
      // Première détection
      service.send({
        type: 'B5_SECURITY.THREAT_DETECTED',
        threat: {
          score: 30,
          threats: [{ id: 'threat-1', type: 'test', severity: 'low', timestamp: Date.now() }]
        }
      });

      // Deuxième détection
      service.send({
        type: 'B5_SECURITY.THREAT_DETECTED',
        threat: {
          score: 60,
          threats: [{ id: 'threat-2', type: 'test', severity: 'medium', timestamp: Date.now() }]
        }
      });

      currentState = service.getSnapshot();
      const securityMachine = currentState.context.security.securityMachine;

      // Le score devrait être mis à jour au dernier
      expect(securityMachine.threatScore).toBe(60);
      // Les menaces devraient s'accumuler
      expect(securityMachine.currentThreats).toHaveLength(2);
    });
  });

  // ============================================
  // TESTS ALERTES VISUELLES
  // ============================================

  describe('Visual Alerts Management', () => {
    beforeEach(() => {
      service.send({ type: 'B5_SECURITY.ACTIVATE' });
      currentState = service.getSnapshot();
    });

    it('should trigger visual alerts correctly', () => {
      const alertConfig = {
        color: '#ff0000',
        intensity: 0.8
      };

      service.send({
        type: 'B5_SECURITY.TRIGGER_ALERT',
        pattern: 'flash',
        config: alertConfig
      });

      currentState = service.getSnapshot();
      const alerts = currentState.context.security.securityMachine.activeAlerts;

      expect(alerts).toHaveLength(1);
      expect(alerts[0].pattern).toBe('flash');
      expect(alerts[0].color).toBe('#ff0000');
      expect(alerts[0].intensity).toBe(0.8);
    });

    it('should accumulate multiple visual alerts', () => {
      service.send({ type: 'B5_SECURITY.TRIGGER_ALERT', pattern: 'flash' });
      service.send({ type: 'B5_SECURITY.TRIGGER_ALERT', pattern: 'pulse' });
      service.send({ type: 'B5_SECURITY.TRIGGER_ALERT', pattern: 'rotate' });

      currentState = service.getSnapshot();
      const alerts = currentState.context.security.securityMachine.activeAlerts;

      expect(alerts).toHaveLength(3);
      expect(alerts.map((a: any) => a.pattern)).toEqual(['flash', 'pulse', 'rotate']);
    });

    it('should stop all alerts', () => {
      // Ajouter plusieurs alertes
      service.send({ type: 'B5_SECURITY.TRIGGER_ALERT', pattern: 'flash' });
      service.send({ type: 'B5_SECURITY.TRIGGER_ALERT', pattern: 'distortion' });

      // Arrêter toutes les alertes
      service.send({ type: 'B5_SECURITY.STOP_ALERTS' });
      currentState = service.getSnapshot();

      const alerts = currentState.context.security.securityMachine.activeAlerts;
      expect(alerts).toHaveLength(0);
    });

    it('should use default alert config when none provided', () => {
      service.send({ type: 'B5_SECURITY.TRIGGER_ALERT', pattern: 'pulse' });
      currentState = service.getSnapshot();

      const alert = currentState.context.security.securityMachine.activeAlerts[0];
      expect(alert.color).toBe('#ff0000'); // Default
      expect(alert.intensity).toBe(0.8); // Default
    });
  });

  // ============================================
  // TESTS PERFORMANCE & CIRCUIT BREAKER
  // ============================================

  describe('Performance Monitoring', () => {
    beforeEach(() => {
      service.send({ type: 'B5_SECURITY.ACTIVATE' });
      currentState = service.getSnapshot();
    });

    it('should handle performance degradation', () => {
      const metrics = {
        fps: 25, // < 30 = minimal mode
        frameTime: 40,
        cpuUsage: 85,
        memoryUsage: 512
      };

      service.send({ type: 'B5_SECURITY.PERFORMANCE_DEGRADED', metrics });
      currentState = service.getSnapshot();

      const securityMachine = currentState.context.security.securityMachine;
      expect(securityMachine.performanceMode).toBe('minimal');
      expect(securityMachine.circuitBreakerState).toBe('open');
    });

    it('should set reduced performance mode for moderate degradation', () => {
      const metrics = {
        fps: 40, // 30-45 = reduced mode
        frameTime: 25,
        cpuUsage: 70,
        memoryUsage: 256
      };

      service.send({ type: 'B5_SECURITY.PERFORMANCE_DEGRADED', metrics });
      currentState = service.getSnapshot();

      const securityMachine = currentState.context.security.securityMachine;
      expect(securityMachine.performanceMode).toBe('reduced');
      expect(securityMachine.circuitBreakerState).toBe('closed'); // Pas assez dégradé pour ouvrir
    });

    it('should recover from performance degradation', () => {
      // Dégrader d'abord
      service.send({
        type: 'B5_SECURITY.PERFORMANCE_DEGRADED',
        metrics: { fps: 20, frameTime: 50, cpuUsage: 90, memoryUsage: 1024 }
      });

      // Récupérer
      service.send({ type: 'B5_SECURITY.PERFORMANCE_RECOVERED' });
      currentState = service.getSnapshot();

      const securityMachine = currentState.context.security.securityMachine;
      expect(securityMachine.performanceMode).toBe('normal');
      expect(securityMachine.circuitBreakerState).toBe('closed');
    });
  });

  // ============================================
  // TESTS BRIDGES INTER-RÉGIONS
  // ============================================

  describe('Bridge Management', () => {
    beforeEach(() => {
      service.send({ type: 'B5_SECURITY.ACTIVATE' });
      currentState = service.getSnapshot();
    });

    it('should connect bridges to other systems', () => {
      const systems: Array<'b3-lighting' | 'b4-environment' | 'visual-effects'> = [
        'b3-lighting', 'b4-environment', 'visual-effects'
      ];

      systems.forEach(system => {
        service.send({ type: 'B5_SECURITY.BRIDGE_CONNECT', system });
      });

      currentState = service.getSnapshot();
      const bridges = currentState.context.security.securityMachine.bridgeConnections;

      expect(bridges.b3Lighting).toBe(true);
      expect(bridges.b4Environment).toBe(true);
      expect(bridges.visualEffects).toBe(true);
    });

    it('should disconnect bridges from systems', () => {
      // Connecter d'abord
      service.send({ type: 'B5_SECURITY.BRIDGE_CONNECT', system: 'b3-lighting' });

      // Déconnecter
      service.send({ type: 'B5_SECURITY.BRIDGE_DISCONNECT', system: 'b3-lighting' });
      currentState = service.getSnapshot();

      const bridges = currentState.context.security.securityMachine.bridgeConnections;
      expect(bridges.b3Lighting).toBe(false);
    });

    it('should handle bridge name conversion correctly', () => {
      // Test de conversion b3-lighting -> b3Lighting
      service.send({ type: 'B5_SECURITY.BRIDGE_CONNECT', system: 'b4-environment' });
      currentState = service.getSnapshot();

      const bridges = currentState.context.security.securityMachine.bridgeConnections;
      expect(bridges.b4Environment).toBe(true);
    });
  });

  // ============================================
  // TESTS COMPATIBILITÉ LEGACY
  // ============================================

  describe('Legacy Compatibility', () => {
    it('should maintain legacy security presets functionality', () => {
      // Les presets legacy doivent toujours fonctionner
      service.send({ type: 'SECURITY.SET_PRESET', preset: 'DANGER' });
      currentState = service.getSnapshot();

      expect(currentState.context.security.currentPreset).toBe('DANGER');
      expect(currentState.context.security.isTransitioning).toBe(true);
    });

    it('should allow transition from legacy to B5', () => {
      // Commencer avec preset legacy
      service.send({ type: 'SECURITY.SET_PRESET', preset: 'SCANNING' });

      // Passer à B5
      service.send({ type: 'B5_SECURITY.ACTIVATE' });
      currentState = service.getSnapshot();

      // Les deux systèmes coexistent
      expect(currentState.context.security.currentPreset).toBe('SCANNING');
      expect(currentState.context.security.securityMachine.isActive).toBe(true);
    });
  });
});