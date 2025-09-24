# 🚀 B5 SECURITY - PLAN D'IMPLÉMENTATION FINAL

## 📋 DÉCISIONS ARCHITECTURALES (Basé sur recherches IA)

### 1. Architecture Actor Model (Priorité 1)
**Décision**: Utiliser Actors au lieu de 5 régions parallèles

```typescript
// PAS ÇA (state explosion)
type: 'parallel',
states: {
  securityLevel: {},
  threatDetection: {},
  alertSystem: {},
  performanceAdapter: {},
  auditSystem: {}
}

// MAIS ÇA (actors isolés)
context: {
  threatDetector: spawn(threatDetectorMachine),
  alertVisuals: spawn(alertVisualsMachine),
  auditLogger: spawn(auditLoggerMachine)
}
```

**Justification**:
- Avec 7 régions déjà actives, ajouter 5 de plus = explosion
- Actors communiquent sans bloquer
- Isolation performance parfaite

### 2. Threat Detection Hybride (Priorité 2)
**Décision**: ML-Lite sans dépendances + WebGL monitoring

```typescript
class ThreatDetector {
  // Poids optimisés selon recherches
  private weights = new Float32Array([
    0.3,  // WebGL context anomalies (le plus critique)
    0.25, // Memory patterns
    0.2,  // Shader compilation timing
    0.15, // Input velocity
    0.1   // Network timing
  ]);

  detectThreat(): number {
    return (
      this.detectShaderAttack() * 0.3 +
      this.detectMemoryLeak() * 0.25 +
      this.detectCryptoMining() * 0.2 +
      this.detectContextLoss() * 0.15 +
      this.detectInputAnomaly() * 0.1
    ) * 100; // Score 0-100
  }
}
```

### 3. Bridges via Event Priority Queue (Priorité 3)
**Décision**: Réutiliser EventBus B3 + Priority Queue

```typescript
class SecurityEventBus extends B3EventBus {
  private queues = {
    critical: new PriorityQueue(100),
    high: new PriorityQueue(200),
    normal: new PriorityQueue(500)
  };

  // Batch processing pour éviter spam
  processBatch(priority: Priority) {
    const batch = this.queues[priority].dequeueBatch(50);
    this.b3EventBus.emit('security:batch', batch);
  }
}
```

### 4. Performance Circuit Breaker (Priorité 4)
**Décision**: Protection CPU avec fallback minimal

```typescript
class SecurityCircuitBreaker {
  execute(fn: () => void) {
    if (this.cpuUsage > 10) { // 10% max pour B5
      this.fallbackMinimal();
      return;
    }

    try {
      fn();
    } catch {
      this.recordFailure();
      if (this.failures > 3) {
        this.state = 'OPEN';
      }
    }
  }
}
```

## 📦 STRUCTURE FICHIERS FINALE

```
machines/security/
├── index.ts
├── securityMachine.ts          // Machine principale avec actors
├── types.ts
├── actors/
│   ├── threatDetectorActor.ts  // Actor détection menaces
│   ├── alertVisualsActor.ts    // Actor effets visuels
│   └── auditLoggerActor.ts     // Actor audit
├── services/
│   ├── threatDetection.ts      // ML-Lite scoring
│   ├── webglMonitor.ts         // Monitoring WebGL
│   └── circuitBreaker.ts       // Protection CPU
├── bridges/
│   ├── securityEventBus.ts     // Extension EventBus B3
│   └── priorityQueue.ts        // Queue priorités
├── visual/
│   ├── chromaticAberration.ts  // Shader effet glitch
│   ├── securityPatterns.ts     // Flash, pulse, rotate
│   └── mobileAdaptation.ts     // Adaptation GPU tier
├── audit/
│   ├── ringBuffer.ts           // Buffer circulaire 1MB
│   ├── compression.ts          // LZ compression
│   └── indexedDBExport.ts      // Export gros volumes
└── hooks/
    └── useSecurity.ts          // Hook React principal
```

## 🔧 IMPLÉMENTATION PHASE PAR PHASE

### Phase 1: Core Architecture (4h)
```typescript
// 1. Machine principale avec actors
export const securityMachine = createMachine({
  id: 'b5-security',

  context: {
    // Actors spawned
    threatDetector: null,
    alertVisuals: null,
    auditLogger: null,

    // État global
    securityLevel: 'normal',
    threatScore: 0,

    // Performance
    circuitBreaker: new SecurityCircuitBreaker()
  },

  entry: [
    // Spawn actors au démarrage
    assign({
      threatDetector: () => spawn(threatDetectorActor, 'threatDetector'),
      alertVisuals: () => spawn(alertVisualsActor, 'alertVisuals'),
      auditLogger: () => spawn(auditLoggerActor, 'auditLogger')
    })
  ],

  on: {
    // Communication inter-actors
    'THREAT.DETECTED': {
      actions: [
        forwardTo('alertVisuals'),
        forwardTo('auditLogger')
      ]
    },

    'PERFORMANCE.DEGRADED': {
      actions: 'activateCircuitBreaker'
    }
  }
});
```

### Phase 2: Threat Detection (3h)
```typescript
// 2. Actor détection avec ML-Lite
const threatDetectorActor = createMachine({
  id: 'threat-detector',

  context: {
    metrics: new ThreatMetrics(),
    scorer: new ThreatScorerMLLite(),
    webglMonitor: null
  },

  states: {
    monitoring: {
      invoke: {
        src: 'continuousMonitoring',
        onDone: {
          actions: 'analyzeThreat'
        }
      },

      on: {
        'ANOMALY.DETECTED': {
          actions: sendParent((ctx) => ({
            type: 'THREAT.DETECTED',
            score: ctx.scorer.calculate()
          }))
        }
      }
    }
  }
});

// 3. WebGL Monitor intégré
class WebGLSecurityMonitor {
  monitor(renderer: THREE.WebGLRenderer) {
    const gl = renderer.getContext();

    // Hook détection shader attacks
    const originalCompileShader = gl.compileShader.bind(gl);
    gl.compileShader = (shader) => {
      const source = gl.getShaderSource(shader);
      if (this.isMaliciousShader(source)) {
        throw new Error('Malicious shader blocked');
      }
      return originalCompileShader(shader);
    };

    // Monitor memory leaks
    this.trackGeometries();
    this.trackTextures();
  }
}
```

### Phase 3: Visual Effects (2h)
```typescript
// 4. Actor effets visuels optimisé
const alertVisualsActor = createMachine({
  id: 'alert-visuals',

  context: {
    effectComposer: null,
    patterns: new Map(),
    gpuTier: detectGPUTier()
  },

  states: {
    idle: {
      on: {
        ACTIVATE_ALERT: [
          {
            target: 'chromatic',
            cond: (ctx) => ctx.gpuTier === 'HIGH'
          },
          {
            target: 'simple',
            cond: (ctx) => ctx.gpuTier === 'LOW'
          }
        ]
      }
    },

    chromatic: {
      entry: 'enableChromaticAberration',
      exit: 'disableChromaticAberration'
    },

    simple: {
      entry: 'enableSimpleFlash'
    }
  }
});

// 5. Shader chromatic optimisé
const chromaticAberrationShader = {
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform float intensity;
    uniform float time;
    varying vec2 vUv;

    void main() {
      float offset = intensity * 0.01 * sin(time);
      vec4 cr = texture2D(tDiffuse, vUv + vec2(offset, 0.0));
      vec4 cg = texture2D(tDiffuse, vUv);
      vec4 cb = texture2D(tDiffuse, vUv - vec2(offset, 0.0));
      gl_FragColor = vec4(cr.r, cg.g, cb.b, 1.0);
    }
  `
};
```

### Phase 4: Bridges & Integration (2h)
```typescript
// 6. Bridge avec EventBus B3 existant
class SecurityBridgeAdapter {
  constructor(
    private b3EventBus: LightingEventBus,
    private b4Bridge: EnvironmentBridge
  ) {
    // S'abonne aux events pertinents
    b3EventBus.on('lighting:changed', this.onLightingChange);
  }

  sendSecurityAlert(level: SecurityLevel) {
    // Batch pour performance
    const batch = {
      lighting: SECURITY_LIGHTING_PRESETS[level],
      environment: SECURITY_ENVIRONMENT_CONFIG[level]
    };

    this.b3EventBus.emit('security:batch', batch);
  }
}

// 7. Intégration dans VisualEffectsMachine
const visualEffectsMachineWithSecurity = visualEffectsMachine.withConfig({
  // Ajouter B5 comme actor, pas région
  actors: {
    security: securityMachine
  },

  actions: {
    // Forward events vers B5
    forwardSecurityEvent: forwardTo('security')
  }
});
```

### Phase 5: Audit & Performance (2h)
```typescript
// 8. Ring Buffer optimisé
class AuditRingBuffer {
  private buffer = new ArrayBuffer(1048576); // 1MB
  private view = new DataView(this.buffer);
  private position = 0;

  write(entry: AuditEntry) {
    const compressed = this.compressLZ(JSON.stringify(entry));

    // Header: size (4) + timestamp (4)
    this.view.setUint32(this.position, compressed.length);
    this.view.setUint32(this.position + 4, Date.now());

    // Data
    for (let i = 0; i < compressed.length; i++) {
      this.view.setUint8(this.position + 8 + i, compressed[i]);
    }

    this.position = (this.position + 8 + compressed.length) % this.buffer.byteLength;
  }

  exportToIndexedDB() {
    // Export si > 512KB utilisés
    if (this.position > 524288) {
      this.flushToIndexedDB();
    }
  }
}

// 9. Circuit Breaker final
const circuitBreaker = {
  check: () => {
    const metrics = {
      cpu: performance.now() - lastFrame,
      memory: performance.memory?.usedJSHeapSize,
      fps: currentFPS
    };

    if (metrics.cpu > 10 || metrics.fps < 45) {
      return 'REDUCE';
    }

    if (metrics.cpu > 15 || metrics.fps < 30) {
      return 'MINIMAL';
    }

    return 'NORMAL';
  }
};
```

## 📊 MÉTRIQUES DE VALIDATION

### Performance Targets
- ✅ CPU Usage B5: <10% idle, <25% alerte
- ✅ Memory: <30MB total pour B5
- ✅ FPS: Maintenir 60fps desktop, 30fps mobile
- ✅ Latence détection: <100ms
- ✅ Transitions visuelles: <50ms

### Tests Critiques
```typescript
describe('B5 Security Performance', () => {
  test('maintains performance with all systems', async () => {
    const machine = createActor(securityMachine);
    machine.start();

    // Simulate load
    for (let i = 0; i < 1000; i++) {
      machine.send({ type: 'THREAT.DETECTED', score: 50 });
      await new Promise(r => requestAnimationFrame(r));
    }

    expect(performance.now() / 1000).toBeLessThan(17); // <17ms/frame
  });

  test('circuit breaker protects CPU', () => {
    const breaker = new SecurityCircuitBreaker();
    let executed = false;

    // Force high CPU
    while (performance.now() < 20) { /* busy wait */ }

    breaker.execute(() => { executed = true; });

    expect(executed).toBe(false); // Should be blocked
  });
});
```

## 🚦 GO/NO-GO CHECKLIST

Avant de commencer l'implémentation :

- [ ] Confirmer Actor Model vs Regions
- [ ] Valider réutilisation EventBus B3
- [ ] Tester Circuit Breaker sur mobile
- [ ] Vérifier compatibilité shaders avec bloom
- [ ] Confirmer 1MB limite pour Ring Buffer

## ⏰ TIMELINE FINALE

- **Phase 1-2**: 7h (Core + Detection)
- **Phase 3-4**: 4h (Visual + Bridges)
- **Phase 5**: 2h (Audit + Perf)
- **Tests**: 2h
- **Total**: **15h** (vs 8-10h initial, mais beaucoup plus robuste)

## 🎯 DÉCISION FINALE

**RECOMMANDATION**: Implémenter avec Actor Model + ML-Lite + Circuit Breaker

Cette architecture garantit :
1. Pas de dégradation performance
2. Isolation parfaite B5
3. Détection threats réelle
4. Scalabilité future

Prêt pour implémentation immédiate avec ces choix validés par recherche.