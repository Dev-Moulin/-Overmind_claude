// 🔗 LegacySystemsBridge - Façade pour connexion XState ↔ Legacy Systems
// Permet à VisualEffectsMachine d'accéder aux systèmes Three.js existants

export interface LegacySystemsInterface {
  simpleBloom?: {
    setBloomEnabled(enabled: boolean): void;
    updateBloom(param: string, value: number): void;
  };
  bloomController?: {
    updateBloom(param: string, value: number): void;
    setGroupBloomParameter(group: string, param: string, value: number): void;
  };
  pbrController?: {
    updatePBR(settings: any): void;
  };
  pbrLightingController?: {
    updateLighting(settings: any): void;
    applyPreset(presetName: string): void;
    setGlobalMultipliers(ambient: number, directional: number): void;
    toggleAdvancedLighting(enabled: boolean): void;
    setAdvancedLightingIntensities(spotIntensity: number, dirIntensity: number): void;
    toggleAreaLights(enabled: boolean): void;
    setAreaLightIntensities(intensity: number): void;
    toggleLightProbes(enabled: boolean): void;
    updateLightProbesFromEnvironment(): void;
    setLightProbeIntensity(intensity: number): void;
    applyHDRBoost(): void;
    setHDRBoostMultiplier(multiplier: number): void;
    enableEnhancedShadows(enabled: boolean): void;
    optimizeShadowBias(): void;
    getCurrentPresetInfo(): any;
  };
}

export class LegacySystemsBridge implements LegacySystemsInterface {
  constructor() {
    console.log('🔗 LegacySystemsBridge: Initializing...');
    this.validateConnection();
  }

  // ============================================
  // ACCESSEURS AUX SYSTÈMES LEGACY
  // ============================================

  get simpleBloom() {
    return (window as any).stateController?.systems?.simpleBloom || null;
  }

  get bloomController() {
    return (window as any).stateController?.systems?.bloomController || null;
  }

  get pbrController() {
    return (window as any).stateController?.systems?.pbrController || null;
  }

  get pbrLightingController() {
    return (window as any).stateController?.systems?.pbrLightingController || null;
  }

  // ============================================
  // MÉTHODES DE VALIDATION
  // ============================================

  private validateConnection(): void {
    const stateController = (window as any).stateController;

    if (!stateController) {
      console.warn('⚠️ LegacyBridge: window.stateController not found');
      return;
    }

    if (!stateController.systems) {
      console.warn('⚠️ LegacyBridge: stateController.systems not found');
      return;
    }

    console.log('✅ LegacyBridge: Connection validated', {
      simpleBloom: !!this.simpleBloom,
      bloomController: !!this.bloomController,
      pbrController: !!this.pbrController,
      pbrLightingController: !!this.pbrLightingController
    });
  }

  isSystemAvailable(systemName: keyof LegacySystemsInterface): boolean {
    return this[systemName] !== null;
  }

  validateSystem(systemName: keyof LegacySystemsInterface, methodName: string): boolean {
    const system = this[systemName];
    return system && typeof system[methodName] === 'function';
  }

  // ============================================
  // MÉTHODES BLOOM SAFELY WRAPPED
  // ============================================

  safeSetBloomEnabled(enabled: boolean): boolean {
    if (this.validateSystem('simpleBloom', 'setBloomEnabled')) {
      try {
        this.simpleBloom!.setBloomEnabled(enabled);
        console.log(`✅ LegacyBridge: Bloom ${enabled ? 'enabled' : 'disabled'}`);
        return true;
      } catch (error) {
        console.error('❌ LegacyBridge: Error setting bloom enabled:', error);
        return false;
      }
    }
    console.warn('⚠️ LegacyBridge: simpleBloom.setBloomEnabled not available');
    return false;
  }

  safeUpdateBloom(param: string, value: number): boolean {
    if (this.validateSystem('simpleBloom', 'updateBloom')) {
      try {
        this.simpleBloom!.updateBloom(param, value);
        console.log(`✅ LegacyBridge: Bloom ${param} = ${value}`);
        return true;
      } catch (error) {
        console.error(`❌ LegacyBridge: Error updating bloom ${param}:`, error);
        return false;
      }
    }
    console.warn(`⚠️ LegacyBridge: simpleBloom.updateBloom not available for ${param}`);
    return false;
  }

  safeSetGroupBloomParameter(group: string, param: string, value: number): boolean {
    if (this.validateSystem('bloomController', 'setGroupBloomParameter')) {
      try {
        this.bloomController!.setGroupBloomParameter(group, param, value);
        console.log(`✅ LegacyBridge: Group ${group} bloom ${param} = ${value}`);
        return true;
      } catch (error) {
        console.error(`❌ LegacyBridge: Error setting group bloom ${group}.${param}:`, error);
        return false;
      }
    }
    console.warn(`⚠️ LegacyBridge: bloomController.setGroupBloomParameter not available`);
    return false;
  }

  // ============================================
  // MÉTHODES PBR SAFELY WRAPPED
  // ============================================

  safeUpdatePBR(settings: any): boolean {
    if (this.validateSystem('pbrController', 'updatePBR')) {
      try {
        this.pbrController!.updatePBR(settings);
        console.log('✅ LegacyBridge: PBR settings updated', settings);
        return true;
      } catch (error) {
        console.error('❌ LegacyBridge: Error updating PBR:', error);
        return false;
      }
    }
    console.warn('⚠️ LegacyBridge: pbrController.updatePBR not available');
    return false;
  }

  safeUpdateLighting(settings: any): boolean {
    if (this.validateSystem('pbrLightingController', 'updateLighting')) {
      try {
        this.pbrLightingController!.updateLighting(settings);
        console.log('✅ LegacyBridge: Lighting settings updated', settings);
        return true;
      } catch (error) {
        console.error('❌ LegacyBridge: Error updating lighting:', error);
        return false;
      }
    }
    console.warn('⚠️ LegacyBridge: pbrLightingController.updateLighting not available');
    return false;
  }

  // ============================================
  // MÉTHODES LIGHTING ÉTENDUES (B3)
  // ============================================

  safeApplyLightingPreset(presetName: string): boolean {
    if (this.validateSystem('pbrLightingController', 'applyPreset')) {
      try {
        this.pbrLightingController!.applyPreset(presetName);
        console.log(`✅ LegacyBridge: Lighting preset '${presetName}' applied`);
        return true;
      } catch (error) {
        console.error(`❌ LegacyBridge: Error applying preset '${presetName}':`, error);
        return false;
      }
    }
    console.warn('⚠️ LegacyBridge: pbrLightingController.applyPreset not available');
    return false;
  }

  safeSetGlobalLightingMultipliers(ambient: number, directional: number): boolean {
    if (this.validateSystem('pbrLightingController', 'setGlobalMultipliers')) {
      try {
        this.pbrLightingController!.setGlobalMultipliers(ambient, directional);
        console.log(`✅ LegacyBridge: Global multipliers set (ambient: ${ambient}, directional: ${directional})`);
        return true;
      } catch (error) {
        console.error('❌ LegacyBridge: Error setting global multipliers:', error);
        return false;
      }
    }
    console.warn('⚠️ LegacyBridge: pbrLightingController.setGlobalMultipliers not available');
    return false;
  }

  safeToggleAdvancedLighting(enabled: boolean): boolean {
    if (this.validateSystem('pbrLightingController', 'toggleAdvancedLighting')) {
      try {
        this.pbrLightingController!.toggleAdvancedLighting(enabled);
        console.log(`✅ LegacyBridge: Advanced lighting ${enabled ? 'enabled' : 'disabled'}`);
        return true;
      } catch (error) {
        console.error('❌ LegacyBridge: Error toggling advanced lighting:', error);
        return false;
      }
    }
    console.warn('⚠️ LegacyBridge: pbrLightingController.toggleAdvancedLighting not available');
    return false;
  }

  safeSetAdvancedLightingIntensities(spotIntensity: number, dirIntensity: number): boolean {
    if (this.validateSystem('pbrLightingController', 'setAdvancedLightingIntensities')) {
      try {
        this.pbrLightingController!.setAdvancedLightingIntensities(spotIntensity, dirIntensity);
        console.log(`✅ LegacyBridge: Advanced intensities set (spot: ${spotIntensity}, dir: ${dirIntensity})`);
        return true;
      } catch (error) {
        console.error('❌ LegacyBridge: Error setting advanced intensities:', error);
        return false;
      }
    }
    return false;
  }

  safeToggleAreaLights(enabled: boolean): boolean {
    if (this.validateSystem('pbrLightingController', 'toggleAreaLights')) {
      try {
        this.pbrLightingController!.toggleAreaLights(enabled);
        console.log(`✅ LegacyBridge: Area lights ${enabled ? 'enabled' : 'disabled'}`);
        return true;
      } catch (error) {
        console.error('❌ LegacyBridge: Error toggling area lights:', error);
        return false;
      }
    }
    return false;
  }

  safeToggleLightProbes(enabled: boolean): boolean {
    if (this.validateSystem('pbrLightingController', 'toggleLightProbes')) {
      try {
        this.pbrLightingController!.toggleLightProbes(enabled);
        console.log(`✅ LegacyBridge: Light probes ${enabled ? 'enabled' : 'disabled'}`);
        return true;
      } catch (error) {
        console.error('❌ LegacyBridge: Error toggling light probes:', error);
        return false;
      }
    }
    return false;
  }

  safeUpdateLightProbesFromEnvironment(): boolean {
    if (this.validateSystem('pbrLightingController', 'updateLightProbesFromEnvironment')) {
      try {
        this.pbrLightingController!.updateLightProbesFromEnvironment();
        console.log('✅ LegacyBridge: Light probes updated from environment');
        return true;
      } catch (error) {
        console.error('❌ LegacyBridge: Error updating light probes:', error);
        return false;
      }
    }
    return false;
  }

  safeApplyHDRBoost(): boolean {
    if (this.validateSystem('pbrLightingController', 'applyHDRBoost')) {
      try {
        this.pbrLightingController!.applyHDRBoost();
        console.log('✅ LegacyBridge: HDR boost applied');
        return true;
      } catch (error) {
        console.error('❌ LegacyBridge: Error applying HDR boost:', error);
        return false;
      }
    }
    return false;
  }

  safeSetHDRBoostMultiplier(multiplier: number): boolean {
    if (this.validateSystem('pbrLightingController', 'setHDRBoostMultiplier')) {
      try {
        this.pbrLightingController!.setHDRBoostMultiplier(multiplier);
        console.log(`✅ LegacyBridge: HDR boost multiplier set to ${multiplier}`);
        return true;
      } catch (error) {
        console.error('❌ LegacyBridge: Error setting HDR multiplier:', error);
        return false;
      }
    }
    return false;
  }

  /**
   * Batch lighting updates pour performance optimale
   * Pattern de la recherche Perplexity
   */
  safeBatchLightingUpdates(updates: Array<{ method: string; params: any[] }>): boolean[] {
    const results: boolean[] = [];

    console.log(`🔄 LegacyBridge: Batching ${updates.length} lighting updates...`);

    updates.forEach(update => {
      let result = false;

      switch(update.method) {
        case 'applyPreset':
          result = this.safeApplyLightingPreset(update.params[0]);
          break;
        case 'setGlobalMultipliers':
          result = this.safeSetGlobalLightingMultipliers(update.params[0], update.params[1]);
          break;
        case 'toggleAdvancedLighting':
          result = this.safeToggleAdvancedLighting(update.params[0]);
          break;
        case 'toggleAreaLights':
          result = this.safeToggleAreaLights(update.params[0]);
          break;
        case 'toggleLightProbes':
          result = this.safeToggleLightProbes(update.params[0]);
          break;
        case 'applyHDRBoost':
          result = this.safeApplyHDRBoost();
          break;
        default:
          console.warn(`⚠️ Unknown lighting method: ${update.method}`);
      }

      results.push(result);
    });

    const successCount = results.filter(r => r).length;
    console.log(`✅ LegacyBridge: Batch complete (${successCount}/${updates.length} successful)`);

    return results;
  }

  // ============================================
  // MÉTHODES D'INTROSPECTION
  // ============================================

  getAvailableSystems(): string[] {
    const systems: string[] = [];
    const stateController = (window as any).stateController;

    if (stateController?.systems) {
      Object.keys(stateController.systems).forEach(key => {
        if (stateController.systems[key]) {
          systems.push(key);
        }
      });
    }

    return systems;
  }

  getSystemMethods(systemName: string): string[] {
    const stateController = (window as any).stateController;
    const system = stateController?.systems?.[systemName];

    if (!system) return [];

    const methods: string[] = [];
    Object.getOwnPropertyNames(Object.getPrototypeOf(system)).forEach(name => {
      if (typeof system[name] === 'function' && name !== 'constructor') {
        methods.push(name);
      }
    });

    return methods;
  }

  // ============================================
  // DIAGNOSTIC ET DEBUG
  // ============================================

  diagnose(): void {
    console.log('🔍 LegacyBridge Diagnostic Report:');
    console.log('Available systems:', this.getAvailableSystems());

    ['simpleBloom', 'bloomController', 'pbrController', 'pbrLightingController'].forEach(systemName => {
      const available = this.isSystemAvailable(systemName as keyof LegacySystemsInterface);
      console.log(`- ${systemName}: ${available ? '✅' : '❌'}`);

      if (available) {
        const methods = this.getSystemMethods(systemName);
        console.log(`  Methods: ${methods.join(', ')}`);
      }
    });
  }
}