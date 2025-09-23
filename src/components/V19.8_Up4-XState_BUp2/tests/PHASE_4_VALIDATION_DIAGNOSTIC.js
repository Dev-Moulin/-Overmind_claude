/**
 * 🧪 PHASE 4 DIAGNOSTIC - Pipeline Moderne V12
 * Tests de validation pour identifier blocage rendu
 */

// ✅ DIAGNOSTIC COMPLET PHASE 4
export const Phase4Diagnostic = {

  /**
   * Test 1: Vérifier Canvas et Renderer
   */
  testCanvasRenderer() {
    console.log('🧪 PHASE 4 - Test 1: Canvas et Renderer');
    console.log('=======================================');
    
    // Canvas HTML
    const canvas = document.querySelector('canvas');
    console.log('Canvas HTML:', canvas);
    console.log('Canvas dimensions:', canvas ? `${canvas.width}x${canvas.height}` : 'N/A');
    console.log('Canvas style:', canvas ? getComputedStyle(canvas) : 'N/A');
    
    // Renderer
    console.log('Window renderer:', window.renderer);
    console.log('Renderer size:', window.renderer ? window.renderer.getSize(new THREE.Vector2()) : 'N/A');
    console.log('Renderer pixel ratio:', window.renderer ? window.renderer.getPixelRatio() : 'N/A');
    
    return !!canvas && !!window.renderer;
  },

  /**
   * Test 2: Vérifier Scene et Camera
   */
  testSceneCamera() {
    console.log('\n🧪 PHASE 4 - Test 2: Scene et Camera');
    console.log('=====================================');
    
    console.log('Window scene:', window.scene);
    console.log('Scene children:', window.scene ? window.scene.children.length : 'N/A');
    console.log('Window camera:', window.camera);
    console.log('Camera position:', window.camera ? window.camera.position : 'N/A');
    
    // Objets dans la scène
    if (window.scene) {
      const meshes = [];
      window.scene.traverse((obj) => {
        if (obj.isMesh) meshes.push(obj.name || 'unnamed');
      });
      console.log('Meshes dans la scène:', meshes.length, meshes.slice(0, 5));
    }
    
    return !!window.scene && !!window.camera;
  },

  /**
   * Test 3: Vérifier BloomSystem et Pipeline
   */
  testBloomPipeline() {
    console.log('\n🧪 PHASE 4 - Test 3: BloomSystem Pipeline');
    console.log('==========================================');
    
    const bloomSystem = window.bloomSystem;
    console.log('BloomSystem:', bloomSystem);
    
    if (bloomSystem) {
      console.log('Composer:', bloomSystem.composer);
      console.log('Composer passes:', bloomSystem.composer ? bloomSystem.composer.passes.length : 'N/A');
      
      if (bloomSystem.composer?.passes) {
        bloomSystem.composer.passes.forEach((pass, i) => {
          console.log(`Pass ${i}: ${pass.constructor.name} - enabled: ${pass.enabled}`);
        });
      }
      
      const status = bloomSystem.getStatus();
      console.log('BloomSystem Status:', status);
    }
    
    return !!bloomSystem && !!bloomSystem.composer;
  },

  /**
   * Test 4: Test Rendu Manuel Direct
   */
  testDirectRender() {
    console.log('\n🧪 PHASE 4 - Test 4: Rendu Manuel Direct');
    console.log('========================================');
    
    if (!window.renderer || !window.scene || !window.camera) {
      console.error('❌ Renderer, Scene ou Camera manquant');
      return false;
    }
    
    try {
      console.log('🔧 Test rendu Three.js direct (sans EffectComposer)...');
      window.renderer.render(window.scene, window.camera);
      console.log('✅ Rendu Three.js direct réussi');
      return true;
    } catch (error) {
      console.error('❌ Erreur rendu Three.js direct:', error);
      return false;
    }
  },

  /**
   * Test 5: Test Rendu EffectComposer
   */
  testComposerRender() {
    console.log('\n🧪 PHASE 4 - Test 5: Rendu EffectComposer');
    console.log('==========================================');
    
    const bloomSystem = window.bloomSystem;
    if (!bloomSystem || !bloomSystem.composer) {
      console.error('❌ BloomSystem ou Composer manquant');
      return false;
    }
    
    try {
      console.log('🔧 Test rendu EffectComposer manuel...');
      bloomSystem.composer.render();
      console.log('✅ Rendu EffectComposer réussi');
      return true;
    } catch (error) {
      console.error('❌ Erreur rendu EffectComposer:', error);
      return false;
    }
  },

  /**
   * Test 6: Vérifier Animation Loop
   */
  testAnimationLoop() {
    console.log('\n🧪 PHASE 4 - Test 6: Animation Loop');
    console.log('====================================');
    
    let frameCount = 0;
    const startTime = performance.now();
    
    // Hook temporaire pour compter frames
    if (window.bloomSystem && window.bloomSystem.render) {
      const originalRender = window.bloomSystem.render.bind(window.bloomSystem);
      
      window.bloomSystem.render = function() {
        frameCount++;
        console.log(`🎬 Frame ${frameCount} - ${performance.now().toFixed(0)}ms`);
        return originalRender();
      };
      
      // Restaurer après 3 secondes
      setTimeout(() => {
        window.bloomSystem.render = originalRender;
        const duration = (performance.now() - startTime) / 1000;
        const fps = frameCount / duration;
        console.log(`📊 Animation: ${frameCount} frames en ${duration.toFixed(1)}s = ${fps.toFixed(1)} FPS`);
      }, 3000);
      
      return true;
    }
    
    console.error('❌ Impossible de hooker animation loop');
    return false;
  },

  /**
   * Test 7: Vérifier Matériaux Bloom
   */
  testBloomMaterials() {
    console.log('\n🧪 PHASE 4 - Test 7: Matériaux Bloom');
    console.log('=====================================');
    
    if (!window.scene) {
      console.error('❌ Scene non disponible');
      return false;
    }
    
    const emissiveMeshes = [];
    window.scene.traverse((obj) => {
      if (obj.isMesh && obj.material) {
        const material = Array.isArray(obj.material) ? obj.material[0] : obj.material;
        if (material.emissive && material.emissive.getHex() !== 0x000000) {
          emissiveMeshes.push({
            name: obj.name || 'unnamed',
            emissive: material.emissive.getHex(),
            emissiveIntensity: material.emissiveIntensity
          });
        }
      }
    });
    
    console.log(`Objets émissifs détectés: ${emissiveMeshes.length}`);
    emissiveMeshes.forEach(mesh => {
      console.log(`  - ${mesh.name}: 0x${mesh.emissive.toString(16)} (${mesh.emissiveIntensity})`);
    });
    
    return emissiveMeshes.length > 0;
  },

  /**
   * Exécuter tous les tests de diagnostic
   */
  async runFullDiagnostic() {
    console.log('🧪🚀 PHASE 4 - DIAGNOSTIC COMPLET V12');
    console.log('=====================================');
    
    const tests = [
      { name: 'Canvas/Renderer', fn: this.testCanvasRenderer },
      { name: 'Scene/Camera', fn: this.testSceneCamera },
      { name: 'Bloom Pipeline', fn: this.testBloomPipeline },
      { name: 'Rendu Direct', fn: this.testDirectRender },
      { name: 'Rendu Composer', fn: this.testComposerRender },
      { name: 'Animation Loop', fn: this.testAnimationLoop },
      { name: 'Matériaux Bloom', fn: this.testBloomMaterials }
    ];
    
    const results = [];
    let passed = 0;
    
    for (const test of tests) {
      try {
        const result = test.fn();
        results.push({ name: test.name, passed: result });
        if (result) passed++;
      } catch (error) {
        console.error(`💥 ${test.name}: ERREUR -`, error);
        results.push({ name: test.name, passed: false, error });
      }
    }
    
    console.log('\n🧪📊 RAPPORT DIAGNOSTIC PHASE 4');
    console.log('=================================');
    console.log(`✅ Succès: ${passed}/${tests.length}`);
    console.log(`❌ Échecs: ${tests.length - passed}/${tests.length}`);
    
    results.forEach(result => {
      const status = result.passed ? '✅' : '❌';
      console.log(`${status} ${result.name}: ${result.passed ? 'OK' : 'ÉCHEC'}`);
    });
    
    return results;
  }
};

// ✅ EXPORT GLOBAL
window.phase4Diagnostic = Phase4Diagnostic;

