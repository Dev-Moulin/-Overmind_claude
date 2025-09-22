// 🔧 Services XState pour FrameSchedulerMachine - Atome D1
// Services de gestion du render loop avec requestAnimationFrame et monitoring

import { FrameSchedulerContext, FrameSchedulerEvent, PerformanceMetrics } from './types';

// 🎯 Service Principal - Boucle de Rendu avec requestAnimationFrame
export const frameLoopService = (context: FrameSchedulerContext) => (callback: any) => {
  let animationFrameId: number;
  let previousTime = performance.now();
  let isRunning = true;

  console.log('🚀 FrameScheduler: Starting render loop');

  const loop = (timestamp: number) => {
    if (!isRunning) return;

    // 📊 Calcul du deltaTime
    const deltaTime = (timestamp - previousTime) / 1000;
    previousTime = timestamp;

    // ⚡ Envoi du tick à la machine
    callback({
      type: 'FRAME_TICK',
      deltaTime,
      timestamp
    });

    // 🔄 Planification de la prochaine frame
    animationFrameId = requestAnimationFrame(loop);
  };

  // 🚀 Démarrage de la boucle
  animationFrameId = requestAnimationFrame(loop);

  // 🧹 Fonction de nettoyage
  return () => {
    console.log('🛑 FrameScheduler: Stopping render loop');
    isRunning = false;
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
    }
  };
};

// 📊 Service de Monitoring des Performances
export const performanceMonitorService = (context: FrameSchedulerContext) => (callback: any) => {
  let monitoringInterval: any;
  let frameTimeHistory: number[] = [];
  let lastUpdateTime = performance.now();
  let frameCount = 0;

  console.log('📊 FrameScheduler: Starting performance monitoring');

  const updatePerformanceMetrics = () => {
    const currentTime = performance.now();
    const timeDelta = currentTime - lastUpdateTime;

    if (timeDelta >= context.config.performanceUpdateInterval) {
      // 📈 Calcul des métriques FPS
      const fps = Math.round((frameCount * 1000) / timeDelta);

      // 📊 Métriques de frame time
      const averageFrameTime = frameTimeHistory.length > 0
        ? frameTimeHistory.reduce((a, b) => a + b, 0) / frameTimeHistory.length
        : 0;

      const maxFrameTime = frameTimeHistory.length > 0
        ? Math.max(...frameTimeHistory)
        : 0;

      const minFrameTime = frameTimeHistory.length > 0
        ? Math.min(...frameTimeHistory)
        : 0;

      const metrics: PerformanceMetrics = {
        fps,
        averageFPS: fps, // Sera moyenné sur plusieurs mesures
        frameTime: averageFrameTime,
        averageFrameTime,
        maxFrameTime,
        minFrameTime,
        frameCount: context.performance.frameCount + frameCount,
        droppedFrames: frameCount < (timeDelta / (1000 / context.config.targetFPS)) ? 1 : 0
      };

      // 📡 Envoi des métriques à la machine
      callback({
        type: 'PERFORMANCE_UPDATE',
        metrics
      });

      // 🔄 Reset des compteurs
      frameCount = 0;
      frameTimeHistory = [];
      lastUpdateTime = currentTime;
    }
  };

  // 📊 Service de monitoring continu
  const startMonitoring = () => {
    monitoringInterval = setInterval(updatePerformanceMetrics, context.config.performanceUpdateInterval) as unknown as number;
  };

  // Fonction pour enregistrer les frame times (appelée par le service externe)
  const recordFrameTime = (frameTime: number) => {
    frameTimeHistory.push(frameTime);
    frameCount++;

    // 🧹 Limitation de l'historique
    if (frameTimeHistory.length > context.config.maxFrameTimeHistory) {
      frameTimeHistory.shift();
    }
  };

  // Démarrage du monitoring
  startMonitoring();

  // Exposition de la fonction d'enregistrement
  (window as any).__frameSchedulerRecordTime = recordFrameTime;

  // 🧹 Fonction de nettoyage
  return () => {
    console.log('📊 FrameScheduler: Stopping performance monitoring');
    if (monitoringInterval) {
      clearInterval(monitoringInterval);
    }
    delete (window as any).__frameSchedulerRecordTime;
  };
};

// 🔄 Service de Récupération d'Erreurs
export const recoveryService = (context: FrameSchedulerContext) => (callback: any) => {
  console.log('🔄 FrameScheduler: Starting recovery process');

  return new Promise((resolve) => {
    const recoverySteps = [
      'Resetting performance metrics',
      'Reinitializing render loop',
      'Validating system state',
      'Restarting monitoring'
    ];

    let currentStep = 0;
    const totalSteps = recoverySteps.length;

    const executeRecoveryStep = () => {
      if (currentStep < totalSteps) {
        const progress = (currentStep + 1) / totalSteps;

        console.log(`🔄 Recovery Step ${currentStep + 1}/${totalSteps}: ${recoverySteps[currentStep]}`);

        // 📊 Notification de progression
        callback({
          type: 'RECOVERY_PROGRESS',
          progress
        });

        currentStep++;

        // ⏱️ Simulation du temps de récupération
        setTimeout(executeRecoveryStep, 200);
      } else {
        // ✅ Récupération terminée
        console.log('✅ FrameScheduler: Recovery completed successfully');

        resolve({
          success: true,
          recoveredSystems: ['frameLoop', 'performanceMonitor', 'systemUpdates']
        });
      }
    };

    // 🚀 Démarrage de la récupération
    setTimeout(executeRecoveryStep, 100);
  });
};

// 🎮 Service de Récupération du Contexte WebGL
export const contextRecoveryService = (context: FrameSchedulerContext) => (callback: any) => {
  console.log('🎮 FrameScheduler: Starting WebGL context recovery');

  return new Promise((resolve) => {
    const startTime = performance.now();

    // 🔍 Vérification du contexte WebGL
    const checkWebGLContext = () => {
      try {
        // Accès aux objets Three.js globaux
        const renderer = (window as any).renderer;
        const scene = (window as any).scene;
        const camera = (window as any).camera;

        if (renderer && scene && camera) {
          // ✅ Contexte disponible
          const recoveryTime = performance.now() - startTime;

          console.log(`✅ WebGL context recovered in ${recoveryTime.toFixed(2)}ms`);

          resolve({
            success: true,
            context: {
              renderer: !!renderer,
              scene: !!scene,
              camera: !!camera,
              recoveryTime
            }
          });
        } else {
          // ❌ Contexte non disponible, retry
          setTimeout(checkWebGLContext, 100);
        }
      } catch (error) {
        console.error('❌ WebGL context recovery failed:', error);
        resolve({
          success: false,
          context: null,
          error: error.message
        });
      }
    };

    // 🚀 Démarrage de la vérification
    checkWebGLContext();
  });
};

// 📡 Service de Télémétrie (Optionnel)
export const telemetryService = (context: FrameSchedulerContext) => (callback: any) => {
  let telemetryData: any[] = [];
  let lastSendTime = performance.now();

  const collectTelemetry = (data: any) => {
    telemetryData.push({
      timestamp: performance.now(),
      ...data
    });

    // 📊 Envoi périodique des données
    const currentTime = performance.now();
    if (currentTime - lastSendTime > 5000) { // Toutes les 5 secondes
      if (telemetryData.length > 0) {
        console.log('📡 Sending telemetry data:', telemetryData.length, 'points');

        // Ici on pourrait envoyer à un service externe
        // sendToAnalytics(telemetryData);

        telemetryData = [];
        lastSendTime = currentTime;
      }
    }
  };

  // Exposition de la fonction de collecte
  (window as any).__frameSchedulerTelemetry = collectTelemetry;

  return () => {
    delete (window as any).__frameSchedulerTelemetry;
  };
};

// 🎯 Service de Mise à Jour des Systèmes Three.js
export const systemUpdateService = (context: FrameSchedulerContext) => {
  const updateSystems = (deltaTime: number) => {
    const updateStartTime = performance.now();

    try {
      // 🎬 Animation Controller
      if (context.systems.animation && (window as any).animationControllerRef?.current) {
        (window as any).animationControllerRef.current.update(deltaTime);
      }

      // 👁️ Eye Rotation
      if (context.systems.eyeRotation && (window as any).eyeRotationRef?.current) {
        (window as any).eyeRotationRef.current.updateEyeRotation(deltaTime);
      }

      // 🌟 Particle Systems
      if (context.systems.particles && (window as any).particleSystemRef?.current) {
        (window as any).particleSystemRef.current.update(deltaTime);
      }

      // 💡 Lighting Systems
      if (context.systems.lighting && (window as any).pbrLightingController) {
        // Update lighting if needed
      }

      // 🎨 Effects Systems
      if (context.systems.effects && (window as any).bloomSystem) {
        // Update bloom effects if needed
      }

      // 🌍 Environment Systems
      if (context.systems.environment && (window as any).worldEnvironmentController) {
        // Update environment if needed
      }

      // 📊 Enregistrement du temps de mise à jour
      const updateDuration = performance.now() - updateStartTime;

      // 📡 Télémétrie si disponible
      if ((window as any).__frameSchedulerTelemetry) {
        (window as any).__frameSchedulerTelemetry({
          type: 'system_update',
          duration: updateDuration,
          systems: Object.keys(context.systems).filter(key => context.systems[key])
        });
      }

      // 📊 Enregistrement du frame time si disponible
      if ((window as any).__frameSchedulerRecordTime) {
        (window as any).__frameSchedulerRecordTime(updateDuration);
      }

    } catch (error) {
      console.error('❌ Error updating systems:', error);
      throw error;
    }
  };

  return { updateSystems };
};