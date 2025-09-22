// 🌟 BloomMachine Guards - Atome B1
// Guards XState pour la validation bloom

import type { BloomContext, BloomEvent, SecurityPreset, BloomGroupType } from './types';

// 🔒 Guard: Is Valid Security Preset
export const isValidSecurityPreset = (context: BloomContext, event: any): boolean => {
  const validPresets: SecurityPreset[] = ['SAFE', 'DANGER', 'WARNING', 'SCANNING', 'NORMAL'];
  return validPresets.includes(event.preset);
};

// 🌟 Guard: Can Enable Bloom
export const canEnableBloom = (context: BloomContext, event: any): boolean => {
  // Vérifier que les systèmes nécessaires sont disponibles
  const hasBloomSystem = context.simpleBloomSystem !== null;
  const hasControlCenter = context.bloomControlCenter !== null;

  // Au moins un des systèmes doit être disponible
  return hasBloomSystem || hasControlCenter;
};

// 🌟 Guard: Can Disable Bloom
export const canDisableBloom = (context: BloomContext, event: any): boolean => {
  // On peut toujours désactiver le bloom
  return true;
};

// 🎭 Guard: Is Valid Group
export const isValidGroup = (context: BloomContext, event: any): boolean => {
  const validGroups: BloomGroupType[] = ['iris', 'eyeRings', 'revealRings', 'magicRings', 'arms'];
  return validGroups.includes(event.group);
};

// 🎭 Guard: Has Group Objects
export const hasGroupObjects = (context: BloomContext, event: any): boolean => {
  if (!event.group || !context.groups[event.group]) {
    return false;
  }

  return context.groups[event.group].objects.size > 0;
};

// 🔢 Guard: Is Valid Threshold
export const isValidThreshold = (context: BloomContext, event: any): boolean => {
  if (event.threshold === undefined) return true; // Pas de validation si pas fourni

  const threshold = parseFloat(event.threshold);
  return !isNaN(threshold) && threshold >= 0.0 && threshold <= 1.0;
};

// 🔢 Guard: Is Valid Strength
export const isValidStrength = (context: BloomContext, event: any): boolean => {
  if (event.strength === undefined) return true; // Pas de validation si pas fourni

  const strength = parseFloat(event.strength);
  return !isNaN(strength) && strength >= 0.0 && strength <= 5.0;
};

// 🔢 Guard: Is Valid Radius
export const isValidRadius = (context: BloomContext, event: any): boolean => {
  if (event.radius === undefined) return true; // Pas de validation si pas fourni

  const radius = parseFloat(event.radius);
  return !isNaN(radius) && radius >= 0.0 && radius <= 2.0;
};

// 🔢 Guard: Is Valid Exposure
export const isValidExposure = (context: BloomContext, event: any): boolean => {
  if (event.exposure === undefined) return true; // Pas de validation si pas fourni

  const exposure = parseFloat(event.exposure);
  return !isNaN(exposure) && exposure >= 0.1 && exposure <= 10.0;
};

// 🎨 Guard: Is Valid Emissive Color
export const isValidEmissiveColor = (context: BloomContext, event: any): boolean => {
  if (event.emissiveColor === undefined) return true; // Pas de validation si pas fourni

  const color = event.emissiveColor;

  // Vérifier si c'est un nombre hexadécimal valide
  if (typeof color === 'number') {
    return color >= 0x000000 && color <= 0xffffff;
  }

  // Vérifier si c'est une chaîne hex valide
  if (typeof color === 'string') {
    const hexPattern = /^#?([0-9A-Fa-f]{6})$/;
    return hexPattern.test(color);
  }

  return false;
};

// 🔢 Guard: Is Valid Emissive Intensity
export const isValidEmissiveIntensity = (context: BloomContext, event: any): boolean => {
  if (event.emissiveIntensity === undefined) return true; // Pas de validation si pas fourni

  const intensity = parseFloat(event.emissiveIntensity);
  return !isNaN(intensity) && intensity >= 0.0 && intensity <= 10.0;
};

// 🔄 Guard: Has FrameScheduler
export const hasFrameScheduler = (context: BloomContext, event: any): boolean => {
  return context.frameScheduler !== null && context.frameScheduler !== undefined;
};

// 🔄 Guard: Has SimpleBloomSystem
export const hasSimpleBloomSystem = (context: BloomContext, event: any): boolean => {
  return context.simpleBloomSystem !== null && context.simpleBloomSystem !== undefined;
};

// 🔄 Guard: Has BloomControlCenter
export const hasBloomControlCenter = (context: BloomContext, event: any): boolean => {
  return context.bloomControlCenter !== null && context.bloomControlCenter !== undefined;
};

// 🎭 Guard: Can Update Group
export const canUpdateGroup = (context: BloomContext, event: any): boolean => {
  // Vérifier que le groupe est valide
  if (!isValidGroup(context, event)) {
    return false;
  }

  // Vérifier que au moins un système est disponible pour appliquer la mise à jour
  return hasSimpleBloomSystem(context, event) || hasBloomControlCenter(context, event);
};

// 📱 Guard: Is Performance Mode
export const isPerformanceMode = (context: BloomContext, event: any): boolean => {
  // Mode performance si FrameScheduler indique des FPS faibles
  if (hasFrameScheduler(context, event)) {
    const fps = context.frameScheduler?.performance?.fps || 60;
    return fps < 30;
  }

  // Mode performance par défaut si pas de FrameScheduler
  return false;
};

// 🎯 Guard: Should Throttle Updates
export const shouldThrottleUpdates = (context: BloomContext, event: any): boolean => {
  const now = Date.now();
  const lastUpdate = context.performance.lastUpdateTime;
  const throttleDelay = isPerformanceMode(context, event) ? 100 : 16; // 100ms en perf mode, 16ms sinon

  return (now - lastUpdate) < throttleDelay;
};

// 🔍 Guard: Has Valid Model for Detection
export const hasValidModelForDetection = (context: BloomContext, event: any): boolean => {
  return event.model &&
         (event.model.isGroup || event.model.isMesh) &&
         typeof event.model.traverse === 'function';
};

// 🔒 Guard: Is Security Transitioning
export const isSecurityTransitioning = (context: BloomContext, event: any): boolean => {
  return context.security.isTransitioning;
};

// 🔒 Guard: Can Apply Security Preset
export const canApplySecurityPreset = (context: BloomContext, event: any): boolean => {
  // Pas en cours de transition ET preset valide ET systèmes disponibles
  return !isSecurityTransitioning(context, event) &&
         isValidSecurityPreset(context, event) &&
         (hasSimpleBloomSystem(context, event) || hasBloomControlCenter(context, event));
};

// 🎭 Guard: Has Objects in Any Group
export const hasObjectsInAnyGroup = (context: BloomContext, event: any): boolean => {
  return Object.values(context.groups).some(group => group.objects.size > 0);
};

// 🔄 Guard: Should Auto-Sync
export const shouldAutoSync = (context: BloomContext, event: any): boolean => {
  // Auto-sync si FrameScheduler disponible ET pas en mode performance
  return hasFrameScheduler(context, event) && !isPerformanceMode(context, event);
};

// 🧹 Guard: Can Dispose
export const canDispose = (context: BloomContext, event: any): boolean => {
  // Toujours possible de nettoyer
  return true;
};

// 📊 Guard: Should Log Performance
export const shouldLogPerformance = (context: BloomContext, event: any): boolean => {
  // Log performance tous les 100 updates
  return context.performance.updateCount % 100 === 0;
};