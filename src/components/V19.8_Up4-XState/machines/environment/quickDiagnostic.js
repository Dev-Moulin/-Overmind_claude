/**
 * 🔍 Quick Diagnostic B4 Environment - Diagnostic rapide
 * Script pour vérifier rapidement l'état des systèmes B4
 */

// Fonction de diagnostic rapide
function checkB4SystemsStatus() {
  console.log('🔍 === DIAGNOSTIC RAPIDE B4 ENVIRONMENT ===');

  // Vérifier VisualEffects
  if (window.visualEffectsControls) {
    console.log('✅ VisualEffects globaux détectés');

    if (window.visualEffectsControls.environment) {
      console.log('✅ B4 Environment détecté dans VisualEffects');

      const env = window.visualEffectsControls.environment;
      console.log(`  • Ready: ${env.isReady}`);
      console.log(`  • Loading: ${env.isLoading}`);
      console.log(`  • Error: ${env.hasError}`);
      console.log(`  • HDR: ${env.currentHDR || 'none'}`);
      console.log(`  • Quality: ${env.quality}`);
      console.log(`  • Bridge: ${env.bridgeConnected ? 'connected' : 'disconnected'}`);

      if (env.cacheStats) {
        console.log(`  • Cache: ${env.cacheStats.size} maps, ${env.cacheStats.memoryUsage}MB`);
      }
    } else {
      console.log('❌ B4 Environment non trouvé dans VisualEffects');
    }
  } else {
    console.log('❌ VisualEffects globaux non trouvés');
  }

  // Vérifier Performance Monitoring
  const perfLogs = performance.getEntriesByType ? performance.getEntriesByType('navigation') : [];
  if (perfLogs.length > 0) {
    console.log('📊 Performance Navigation:', {
      loadTime: Math.round(perfLogs[0].loadEventEnd - perfLogs[0].loadEventStart) + 'ms',
      domReady: Math.round(perfLogs[0].domContentLoadedEventEnd - perfLogs[0].domContentLoadedEventStart) + 'ms'
    });
  }

  // Vérifier Memory
  if (performance.memory) {
    const memory = performance.memory;
    console.log('💾 Memory Usage:', {
      used: Math.round(memory.usedJSHeapSize / 1024 / 1024) + 'MB',
      total: Math.round(memory.totalJSHeapSize / 1024 / 1024) + 'MB',
      limit: Math.round(memory.jsHeapSizeLimit / 1024 / 1024) + 'MB'
    });
  }

  // Vérifier Tests B4
  const testsAvailable = {
    validator: typeof window.B4EnvironmentValidator !== 'undefined',
    quickTests: typeof window.runQuickB4Tests !== 'undefined',
    fullTests: typeof window.runFullB4Tests !== 'undefined'
  };

  console.log('🧪 Tests B4 Disponibles:', testsAvailable);

  if (testsAvailable.validator && testsAvailable.quickTests && testsAvailable.fullTests) {
    console.log('✅ Tous les tests B4 sont disponibles');
  } else {
    console.log('⚠️ Certains tests B4 manquent - utilisez l\'import manuel');
  }

  console.log('🔍 === FIN DIAGNOSTIC ===');
  return testsAvailable;
}

// Tests spécifiques B4
function runB4PerformanceCheck() {
  console.log('📊 === CHECK PERFORMANCE B4 ===');

  let frameCount = 0;
  let startTime = performance.now();

  function measureFrame() {
    frameCount++;

    if (frameCount === 60) { // Mesure sur 60 frames
      const endTime = performance.now();
      const duration = endTime - startTime;
      const fps = (60 * 1000) / duration;

      console.log('📈 Performance B4 (60 frames):');
      console.log(`  • FPS: ${Math.round(fps)}`);
      console.log(`  • Frame Time: ${Math.round(duration / 60)}ms`);

      if (fps > 55) {
        console.log('✅ Performance EXCELLENTE');
      } else if (fps > 30) {
        console.log('✅ Performance BONNE');
      } else {
        console.log('⚠️ Performance FAIBLE');
      }

      return;
    }

    requestAnimationFrame(measureFrame);
  }

  requestAnimationFrame(measureFrame);
}

// Test simple B4
function testB4Basic() {
  console.log('🧪 === TEST BASIQUE B4 ===');

  try {
    // Test validator creation
    const validator = new window.B4EnvironmentValidator({
      enablePerformanceTests: false,
      enableHDRTests: true,
      enableBridgeTests: false,
      enableCacheTests: false,
      testTimeout: 3000
    });

    console.log('✅ B4EnvironmentValidator créé avec succès');

    // Test simple
    validator.runAllTests().then(results => {
      console.log('🧪 Test basique terminé:', {
        success: results.success,
        hdrTest: results.tests.hdrSystem,
        errors: results.errors
      });
    });

  } catch (error) {
    console.error('❌ Erreur test basique:', error);
  }
}

// Export global
if (typeof window !== 'undefined') {
  window.checkB4SystemsStatus = checkB4SystemsStatus;
  window.runB4PerformanceCheck = runB4PerformanceCheck;
  window.testB4Basic = testB4Basic;

  console.log('🔍 Diagnostic B4 chargé ! Fonctions disponibles:');
  console.log('  • window.checkB4SystemsStatus()');
  console.log('  • window.runB4PerformanceCheck()');
  console.log('  • window.testB4Basic()');
}