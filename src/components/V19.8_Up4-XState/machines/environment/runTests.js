/**
 * 🧪 B4 Environment Tests Runner - Script pour lancer les tests
 * Script à exécuter dans la console du navigateur
 */

// Fonction pour lancer tous les tests B4 automatiquement
async function runAllB4Tests() {
  console.log('🧪 === LANCEMENT TESTS B4 ENVIRONMENT ===');

  try {
    // Vérifier que les tests sont disponibles
    if (!window.runQuickB4Tests || !window.runFullB4Tests || !window.B4EnvironmentValidator) {
      console.error('❌ Tests B4 non disponibles. Vérifiez que productionTests.ts est chargé.');
      return false;
    }

    console.log('✅ Tests B4 détectés, lancement...');

    // 1. Tests rapides
    console.log('\n🚀 === TESTS RAPIDES B4 ===');
    const quickResult = await window.runQuickB4Tests();
    console.log(`✅ Tests rapides: ${quickResult ? 'RÉUSSI' : 'ÉCHOUÉ'}`);

    // 2. Tests complets si tests rapides réussis
    if (quickResult) {
      console.log('\n🚀 === TESTS COMPLETS B4 ===');
      const fullResults = await window.runFullB4Tests();

      console.log('📊 Résultats détaillés:');
      console.log('  • HDR System:', fullResults.tests.hdrSystem ? '✅' : '❌');
      console.log('  • Quality Manager:', fullResults.tests.qualityManager ? '✅' : '❌');
      console.log('  • Bridge Connection:', fullResults.tests.bridgeConnection ? '✅' : '❌');
      console.log('  • Cache System:', fullResults.tests.cacheSystem ? '✅' : '❌');
      console.log('  • Performance:', fullResults.tests.performance ? '✅' : '❌');

      console.log('📈 Performance:');
      console.log(`  • HDR Load Time: ${fullResults.performance.hdrLoadTime}ms`);
      console.log(`  • Average FPS: ${fullResults.performance.averageFPS}`);
      console.log(`  • Memory Usage: ${fullResults.performance.memoryUsage}MB`);
      console.log(`  • Cache Hit Rate: ${(fullResults.performance.cacheHitRate * 100).toFixed(1)}%`);

      if (fullResults.errors.length > 0) {
        console.log('❌ Erreurs détectées:');
        fullResults.errors.forEach(error => console.log(`  • ${error}`));
      }

      console.log(`\n🎯 RÉSULTAT GLOBAL: ${fullResults.success ? '✅ SUCCÈS' : '❌ ÉCHEC'}`);
      return fullResults.success;

    } else {
      console.log('❌ Tests rapides échoués, arrêt des tests complets');
      return false;
    }

  } catch (error) {
    console.error('❌ Erreur lors des tests:', error);
    return false;
  }
}

// Fonction pour tests de performance uniquement
async function runPerformanceTests() {
  console.log('📊 === TESTS PERFORMANCE B4 UNIQUEMENT ===');

  try {
    const validator = new window.B4EnvironmentValidator({
      enablePerformanceTests: true,
      enableHDRTests: false,
      enableBridgeTests: false,
      enableCacheTests: false,
      testTimeout: 5000
    });

    const results = await validator.runAllTests();

    console.log('📈 Performance B4:');
    console.log(`  • FPS Moyen: ${results.performance.averageFPS}`);
    console.log(`  • Temps Frame: ${results.performance.frameTime}ms`);
    console.log(`  • Mémoire: ${results.performance.memoryUsage}MB`);

    return results.success;

  } catch (error) {
    console.error('❌ Erreur tests performance:', error);
    return false;
  }
}

// Fonction pour vérifier l'état des systèmes B4
function checkB4SystemsStatus() {
  console.log('🔍 === VÉRIFICATION SYSTÈMES B4 ===');

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

  // Vérifier Bridge B3-B4
  if (window.b3b4Bridge || (window.visualEffectsControls && window.visualEffectsControls.environment.bridgeConnected)) {
    console.log('✅ Bridge B3-B4 détecté');
  } else {
    console.log('❌ Bridge B3-B4 non détecté');
  }

  console.log('🔍 Vérification terminée');
}

// Auto-lancement des tests après un délai
setTimeout(() => {
  console.log('🤖 Auto-lancement des tests B4 dans 2 secondes...');
  setTimeout(async () => {
    await runAllB4Tests();
  }, 2000);
}, 1000);

// Export des fonctions pour utilisation manuelle
window.runAllB4Tests = runAllB4Tests;
window.runPerformanceTests = runPerformanceTests;
window.checkB4SystemsStatus = checkB4SystemsStatus;

console.log('🧪 Script de tests B4 chargé !');
console.log('📋 Fonctions disponibles:');
console.log('  • runAllB4Tests() - Tous les tests');
console.log('  • runPerformanceTests() - Performance uniquement');
console.log('  • checkB4SystemsStatus() - Vérification systèmes');