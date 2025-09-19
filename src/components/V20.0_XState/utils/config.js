// ⚙️ Configuration V5 - BLOOM EFFECTS FOCUS
export const V3_CONFIG = {
  camera: {
    fov: 85,
    near: 0.1,
    far: 1000,
    position: { x: 5, y: 1.5, z: 3 }
  },
  
  lights: {
    ambient: { color: 0xffffff, intensity: 0.8 },  // ✅ Augmenté 0.5 → 0.8
    directional: { 
      color: 0xffffff, 
      intensity: 0.8,  // ✅ Augmenté 0.5 → 0.8
      position: { x: 1, y: 2, z: 3 } 
    }
  },
  
  revelation: {
    centerX: 3.3,
    centerY: 3.4,
    centerZ: 1.9,
    height: 0.6,
    radius: 1.3
  },
  
  model: {
    path: "/models/V3_Eye-3.0.glb",
    dracoPath: "https://www.gstatic.com/draco/versioned/decoders/1.5.6/"
  },
  
  controls: {
    moveSpeed: { normal: 0.02, fast: 0.1 },
    sizeSpeed: 0.05,
    limits: { minSize: 0.1, maxSize: 10 }
  },

  // Animations pour bloom effects
  animations: {
    // Bras principaux
    bigArms: [
      'Bras_L1_Mouv',
      'Bras_L2_Mouv', 
      'Bras_R1_Mouv',
      'Bras_R2_Mouv'
    ],
    
    // Petits bras
    littleArms: [
      'Little_1_Mouv', 'Little_2_Mouv', 'Little_3_Mouv', 'Little_4_Mouv',
      'Little_5_Mouv', 'Little_6_Mouv', 'Little_7_Mouv', 'Little_8_Mouv',
      'Arm_Little_9Action', 'Little_10_Mouv', 'Little_11_Mouv', 
      'Little_12_Mouv', 'Little_13_Mouv'
    ],
    
    // Transitions
    poseR1: 'R1&R2_Pose',
    poseR2: 'R2&R1_Pose',
    
    // Anneaux magiques pour révélation
    rings: [
      'Action_Ring',
      'Ring_BloomArea_1Action_Ring',
      'Ring_BloomArea_2Action_Ring', 
      'Ring_BloomArea_3Action_Ring',
      'Ring_BloomArea_4Action_Ring',
      'Ring_BloomArea_5Action_Ring',
      'Ring_Ext_SG1Action_Ring',
      'Ring_Int_SG1Action_Ring'
    ],
    
    // Eye central (drivers automatiques)
    eyeDrivers: {
      enabled: true,
      meshes: ['Anneaux_Eye_Ext', 'Anneaux_Eye_Int']
    }
  },

  // Configuration bloom effects
  bloom: {
    security: {
      intensity: 1.0,
      threshold: 0.5,
      radius: 0.8
    },
    decorative: {
      intensity: 0.8,
      threshold: 0.3,
      radius: 1.0,
      color: 0x88ccff
    }
  },

  // 🌌 FLOATING SPACE SYSTEM
  spaceEffects: {
    floatingSpace: {
      // État général
      enabled: true,
      debugMode: false,
      
      // Zone d'influence sphérique
      sphere: {
        radius: 40.0,             // Rayon zone d'influence (unités Three.js)
        centerOffset: {           // Offset depuis position iris
          x: 0.0,
          y: 0.0, 
          z: 0.0
        }
      },
      
      // Système de répulsion
      repulsion: {
        enabled: true,
        strength: 3.0,            // Force répulsion (0-5) - CENTRÉ
        falloffPower: 1.0,        // Courbe atténuation (1=linéaire, 2=quadratique, 3=cubic) - CENTRÉ
        maxDistance: 10.0,        // Distance max d'effet
        deadZone: 0.05            // Zone morte anti-tremblements
      },
      
      // Inertie et réactivité
      dynamics: {
        inertia: 0.010,           // Vitesse rattrapage (0-1, plus petit = plus lent) - CENTRÉ
        updateThreshold: 0.001,   // Seuil minimum mouvement pour update
        maxOffsetDistance: 5.0    // Distance max offset depuis origine
      },
      
      // Détection du centre
      centerDetection: {
        primaryTarget: 'IRIS',    // Nom objet prioritaire
        fallbackTargets: [        // Noms de fallback
          'Anneaux_Eye_Int',
          'Eye', 
          'Head'
        ],
        useBoundingBoxFallback: true,  // Utiliser bounding box si rien trouvé
        boundingBoxYOffset: 1.0        // Offset Y pour approximer tête
      },
      
      // Presets rapides
      presets: {
        subtle: {
          repulsionStrength: 0.3,
          inertia: 0.08,
          sphereRadius: 20.0,
          falloffPower: 2.2
        },
        marked: {
          repulsionStrength: 0.7,
          inertia: 0.12,
          sphereRadius: 25.0,
          falloffPower: 2.0
        },
        extreme: {
          repulsionStrength: 1.2,
          inertia: 0.15,
          sphereRadius: 35.0,
          falloffPower: 1.8
        },
        reactive: {
          repulsionStrength: 0.5,
          inertia: 0.20,
          sphereRadius: 18.0,
          falloffPower: 2.5
        }
      }
    },

    // 🆕 SYNCHRONISATION PARTICULES
    particleSync: {
      // État général
      enabled: true,
      debugMode: false,
      
      // Intensité et réactivité
      syncIntensity: 0.8,              // Force de réactivité globale (0-1)
      blendFactor: 0.7,                // Mélange flux normal/réactif (0-1)
      intensityThreshold: 0.05,        // Seuil minimum activation
      maxSyncIntensity: 2.0,           // Limite intensité maximum
      
      // Comportement directionnel
      directionSmoothing: 0.15,        // Lissage changements direction (0-1)
      maxFlowDeviation: 45,            // Déviation max en degrés
      directionDeadZone: 0.02,         // Zone morte direction anti-tremblements
      adaptiveBlending: true,          // Blending adaptatif selon intensité
      
      // Performance et optimisations
      performance: {
        enabled: true,
        updateThreshold: 0.001,        // Seuil minimum update
        maxUpdateFrequency: 60,        // Updates max par seconde
        batchUpdates: true             // Batch updates pour performance
      },
      
      // Debug et visualisation
      debug: {
        showFlowDirection: true,       // Afficher direction flux
        showSyncIntensity: true,       // Visualisation intensité
        flowDirectionColor: 0x00ff00,  // Vert pour direction
        intensityColor: 0xff6600       // Orange pour intensité
      },
      
      // Presets numériques 1-10 (du plus faible au plus fort)
      presets: {
        1: { // Désactivé
          syncIntensity: 0,
          blendFactor: 0,
          directionSmoothing: 0.15,
          description: "Désactivé"
        },
        2: { // Ultra subtil
          syncIntensity: 0.2,
          blendFactor: 0.2,
          directionSmoothing: 0.08,
          maxFlowDeviation: 20,
          description: "Ultra subtil"
        },
        3: { // Très subtil
          syncIntensity: 0.3,
          blendFactor: 0.3,
          directionSmoothing: 0.10,
          maxFlowDeviation: 25,
          description: "Très subtil"
        },
        4: { // Subtil
          syncIntensity: 0.4,
          blendFactor: 0.4,
          directionSmoothing: 0.12,
          maxFlowDeviation: 30,
          description: "Subtil"
        },
        5: { // Léger
          syncIntensity: 0.5,
          blendFactor: 0.5,
          directionSmoothing: 0.15,
          maxFlowDeviation: 35,
          description: "Léger"
        },
        6: { // Équilibré
          syncIntensity: 0.6,
          blendFactor: 0.6,
          directionSmoothing: 0.15,
          maxFlowDeviation: 40,
          description: "Équilibré"
        },
        7: { // Marqué
          syncIntensity: 0.8,
          blendFactor: 0.7,
          directionSmoothing: 0.18,
          maxFlowDeviation: 45,
          description: "Marqué"
        },
        8: { // Fort
          syncIntensity: 1.0,
          blendFactor: 0.8,
          directionSmoothing: 0.20,
          maxFlowDeviation: 50,
          description: "Fort"
        },
        9: { // Très fort
          syncIntensity: 1.2,
          blendFactor: 0.9,
          directionSmoothing: 0.25,
          maxFlowDeviation: 60,
          description: "Très fort"
        },
        10: { // Maximum
          syncIntensity: 1.5,
          blendFactor: 1.0,
          directionSmoothing: 0.30,
          maxFlowDeviation: 75,
          description: "Maximum"
        }
      }
    }
  }
};