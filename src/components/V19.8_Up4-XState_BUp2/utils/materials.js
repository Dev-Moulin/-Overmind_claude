// 🎨 Matériaux V5 - BLOOM EFFECTS FOCUS
export const BLOOM_MATERIALS = [
  "BloomArea",           // Matériau principal des anneaux bloom
  "alien-panels"         // Matériau des AnneauxBloomArea_1→5
];

export const SECURITY_MATERIALS = [
  "Material-metal050-effet-chrome",  // Anneaux_Eye_Ext/Int (œil)
  "Material-Metal027",               // Pop_Inf, Pop_Sup, Dos_Eye
  "metalgrid3"                       // Eye_Int
];

export const ARM_MATERIALS = [
  "Material.003",                    // Big Arms
  "metalgrid3"                      // Little Arms
];

// Tous les matériaux révélables (anneaux magiques)
export const RING_MATERIALS = [
  ...BLOOM_MATERIALS,
  "Material-metal050-effet-chrome",
  "Material-Metal027"
];

// Tous les matériaux bras (toujours visibles)
export const ARM_MATERIALS_ALL = [
  "Material.003",   // Big Arms
  "metalgrid3"      // Little Arms
];

// États de sécurité pour bloom IRIS
export const SECURITY_STATES = {
  SAFE: {
    name: 'Safe',
    color: 0x00ff00,      // Vert
    intensity: 0.8,
    pulseSpeed: 1.0
  },
  DANGER: {
    name: 'Danger/Scam',
    color: 0xff0000,      // Rouge
    intensity: 1.2,
    pulseSpeed: 3.0
  },
  WARNING: {
    name: 'Warning',
    color: 0xff8800,      // Orange
    intensity: 1.0,
    pulseSpeed: 2.0
  },
  NORMAL: {
    name: 'Normal',
    color: 0x000000,      // Aucun
    intensity: 0.0,
    pulseSpeed: 0.0
  },
  SCANNING: {
    name: 'Scanning',
    color: 0x0088ff,      // Bleu
    intensity: 0.6,
    pulseSpeed: 0.8
  }
};

// Configuration bloom décoratif
export const DECORATIVE_BLOOM_CONFIG = {
  color: 0x88ccff,        // Bleu-blanc lumineux
  intensity: 0.8,
  pulseSpeed: 0.5,
  fadeInDuration: 1000,
  fadeOutDuration: 1500
};

// Fonction utilitaire pour identifier les matériaux
export const getMaterialType = (materialName) => {
  if (BLOOM_MATERIALS.includes(materialName)) return "🌟 Bloom Ring";
  if (materialName === "Material-metal050-effet-chrome") return "👁️ Eye Chrome";
  if (materialName === "Material-Metal027") return "🔘 Eye Metal";
  if (materialName === "metalgrid3") return "🤏 Little Arm";
  if (materialName === "Material.003") return "🦾 Big Arm";
  return "❓ Other";
};

// Fonction pour créer matériau bloom
export const createBloomMaterial = (baseColor = DECORATIVE_BLOOM_CONFIG.color, intensity = DECORATIVE_BLOOM_CONFIG.intensity) => {
  return {
    color: baseColor,
    emissive: baseColor,
    emissiveIntensity: intensity,
    metalness: 0.5,
    roughness: 0.2,
    transparent: true,
    opacity: 0.9
  };
};

// Fonction pour créer matériau sécurité
export const createSecurityMaterial = (state = 'NORMAL') => {
  const config = SECURITY_STATES[state] || SECURITY_STATES.NORMAL;
  
  return {
    color: config.color,
    emissive: config.color,
    emissiveIntensity: config.intensity,
    metalness: 0.9,
    roughness: 0.1
  };
};