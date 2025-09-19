import * as THREE from 'three';

/**
 * 🚀 ParticleSystemV2 - Système de particules 3D avancé
 * 
 * Caractéristiques principales :
 * - Particules billboards (toujours face caméra)
 * - Zones d'exclusion pour ne pas obstruer la vue
 * - Système de gravité 3D avec attracteurs/répulseurs
 * - Groupes de particules avec comportements émergents
 * - Connexions dynamiques entre particules
 * - Signaux électriques visuels
 */
export class ParticleSystemV2 {
  constructor(scene, camera, config = {}) {
    this.scene = scene;
    this.camera = camera;
    
    // Configuration par défaut
    this.config = {
      // Nombre et répartition (350-400 particules optimisées)
      particleCount: 400,
      particleCountMin: 350,
      particleCountMax: 400,
      groupCount: 20, // Groupes adaptés pour 350-400 particules
      particlesPerGroup: { min: 5, max: 20 }, // Groupes équilibrés pour cette gamme
      
      // Tailles
      particleSize: { min: 0.015, max: 0.08 }, // Plus petites pour éviter surcharge visuelle
      sizeVariation: 0.4,
      particleSizeMultiplier: 1.0, // Contrôle global de taille
      
      // Zone d'action sphérique (centrée et agrandie)
      sphereRadius: 20,        // Rayon augmenté (12 -> 20)
      sphereCenter: { x: 0, y: 0, z: 0 }, // Recentrée sur l'origine
      
      // Zones d'exclusion (où les particules évitent)
      exclusionZones: [
        { type: 'cylinder', center: [0, 0, 0], radius: 1.5, height: 3 }, // Iris
        { type: 'sphere', center: [3.3, 3.4, 1.9], radius: 2.0 }, // Magic Rings
      ],
      
      // Répulsion souris
      mouseRepulsion: {
        enabled: true,
        radius: 3.0,      // Rayon d'influence de la souris
        force: 0.05,      // Force de répulsion
        falloff: 2.0      // Atténuation selon distance (puissance)
      },
      
      // 🚀 Flux infini de particules
      infiniteFlow: {
        enabled: true,
        flowDirection: new THREE.Vector3(0, 0, -1), // Direction flux (-Z)
        flowSpeed: 0.01,     // Vitesse du flux (0.01 = vitesse 1, beaucoup plus lent)
        zoneStart: 15,       // Z début (où les particules apparaissent)
        zoneEnd: -15,        // Z fin (où les particules disparaissent)
        recycleDistance: 30, // Distance totale de recyclage
        basedOnModelRotation: true // Flux basé sur rotation du modèle
      },
      
      // Physique
      gravity: { x: 0, y: 0, z: 0 }, // Pas de gravité par défaut
      damping: 0.98,
      
      // Connexions (distance aléatoire entre 0.8 et 8)
      connectionDistance: 0.8 + Math.random() * 7.2, // 0.8-8.0
      connectionDistanceMin: 0.8,
      connectionDistanceMax: 8.0,
      connectionOpacity: 0.2, // Opacité ajustée pour 350-400 particules
      connectionWidth: 12.0, // Épaisseur augmentée pour meilleure visibilité
      maxConnections: 5, // Plus de connexions possibles avec moins de particules
      
      // Comportements
      attractionForce: 0.0005,
      repulsionForce: 0.001,
      groupCohesion: 0.002,
      
      // Visuels
      particleColor: 0xffffff, // ✅ Blanc par défaut
      particleOpacity: 0.6,
      connectionColor: 0xffffff, // ✅ Blanc par défaut
      
      // Signaux électriques
      signalEnabled: true,
      signalFrequency: 0.02, // Probabilité par frame
      
      // Lumières navigantes sur connexions
      travelingLights: true,
      travelingLightCount: 12, // Nombre optimisé pour 350-400 particules
      travelingLightSpeed: 0.35, // Vitesse légèrement augmentée
      travelingLightSize: 2.2, // Taille augmentée pour meilleure visibilité
      travelingLightIntensity: 1.7, // Intensité augmentée
      signalSpeed: 0.5,
      signalColor: 0x00ffff,
      signalIntensity: 2.0,
      
      // Arcs électriques
      arcsEnabled: true,
      arcCount: 15, // Base optimisée pour 350-400 particules (10-25 arcs)
      arcCountVariation: 1.0, // Pourcentage de variation (0-1) - 100% par défaut
      arcIntensity: 5.0, // Intensité de base
      arcIntensityVariation: 0.75, // Variation jusqu'à 4x (5.0 -> 20.0)
      arcColor: 0x00aaff,
      arcColorMode: 'security', // Toujours en mode sécurité
      arcWhitePercentage: 0.35, // 35% de blanc par défaut (sauf NORMAL)
      arcFrequency: 0.016, // Base 1.6%
      arcFrequencyVariation: 1.0, // Pourcentage de variation
      
      // Variations temporelles d'intensité
      intensityVariationEnabled: true,
      intensityLowProbability: 0.7, // 70% du temps intensité faible
      intensityLowRange: [0.1, 0.6], // 10-60% d'intensité
      intensityHighRange: [0.7, 1.2], // 70-120% d'intensité
      
      // Variations de fréquence des arcs
      arcFrequencyLowValue: 0.7, // 70% de la fréquence normale
      arcFrequencyHighValue: 2.0, // 200% de la fréquence normale (au lieu de 300%)
      arcFrequencyLowProbability: 0.5, // 50% du temps
      arcLifetime: 1000, // ms
      arcDistance: 3.0, // Distance max pour créer un arc
      arcType: 'fractal-smooth', // Type d'arc: 'smooth', 'fractal', 'pulse', 'fractal-pulse', 'fractal-smooth'
      
      // Variété de mouvements
      movementVariety: 0.3, // Pourcentage de particules avec mouvements spéciaux
      specialMovements: ['spiral', 'orbit', 'pulse', 'zigzag', 'pendulum'],
      
      // Interactions spéciales
      interactionVariety: 0.25, // Pourcentage de particules avec interactions spéciales
      specialInteractions: ['magnetic', 'repulsive', 'attractive', 'chaotic', 'harmonic'],
      
      // Système planétaire chaotique
      planetarySystem: {
        enabled: false, // Désactivé par défaut pour revenir au comportement original
        mainRotationSpeed: 0.0000003,  // Vitesse de rotation de base (100,000x plus lent)
        orbitalVariation: 0.4,    // Variation des ellipses (0-1)
        gravitationalStrength: 0.008, // Force des perturbations gravitationnelles (100x plus faible)
        cometRatio: 0.05,         // 5% de comètes
        counterCurrentRatio: 0.15, // 15% en contre-courant
        keplerianMotion: true,    // Loi de Kepler (proche = rapide)
        chaosLevel: 0.003        // Niveau de chaos dans les perturbations (100x plus faible)
      }
    };
    
    // État du système
    this.particles = [];
    this.groups = [];
    this.connections = [];
    this.signals = [];
    this.electricArcs = [];
    this.travelingLights = []; // Lumières naviguant sur les connexions
    
    
    // Position souris 3D pour répulsion
    this.mousePosition3D = new THREE.Vector3();
    this.mouseActive = false;
    
    // 🎯 Point de convergence dynamique basé sur rotation du modèle 3D
    this.convergencePoint = new THREE.Vector3(0, 0, -15); // Point par défaut
    this.modelPosition = new THREE.Vector3();
    this.modelQuaternion = new THREE.Quaternion();
    
    // 👁️ Système de flux infini basé sur rotation du modèle
    this.modelRotationY = 0;    // Rotation Y du modèle (reçue de ModelRotationManager)
    this.flowIntensity = 0;     // Intensité actuelle du flux
    this.targetFlowIntensity = 0; // Intensité cible du flux
    
    // 🆕 Propriétés de synchronisation spatiale
    this.spatialSyncEnabled = false
    this.spatialSyncData = {
      direction: new THREE.Vector3(0, 0, -1),
      intensity: 0,
      isActive: false,
      timestamp: 0
    }
    
    // 🆕 Configuration synchronisation
    this.spatialSyncConfig = {
      enabled: true,
      syncIntensity: 0.8,           // Force réactivité
      blendFactor: 0.7,             // Mélange flux normal/réactif  
      intensityThreshold: 0.05,     // Seuil activation
      directionSmoothing: 0.15,     // Lissage changements direction
      maxFlowDeviation: 45,          // 45° max deviation (en degrés)
      ...config.spatialSync
    }

    // 🆕 État interne pour lissage
    this.currentFlowDirection = new THREE.Vector3(0, 0, -1)
    this.targetFlowDirection = new THREE.Vector3(0, 0, -1)
    this.currentSyncIntensity = 1.0
    this.targetSyncIntensity = 1.0

    // 🆕 Système de fade-in progressif (10s)
    this.syncActivationTime = 0          // Temps depuis activation (ms)
    this.fadeInDuration = 10000          // 10 secondes
    this.fadeOutDuration = 2000          // 2 secondes pour revenir à la normale
    this.isInFadeOut = false             // État de fade-out
    this.dynamicBlendFactor = 0          // blendFactor calculé dynamiquement

    
    // Optimisation performance
    this.frameCounter = 0;
    this.particlesPerFrame = 50; // Nombre de particules à traiter par frame pour les interactions
    this.currentParticleIndex = 0; // Index actuel pour le traitement par batch
    
    // 🔮 Visualisation de la zone d'apparition (debug)
    this.debugSphere = null;
    this.showDebugSphere = false; // Désactivé
    
    // Frustum culling pour n'afficher que ce qui est visible
    this.frustum = new THREE.Frustum();
    this.cameraMatrix = new THREE.Matrix4();
    this.visibleParticles = []; // Particules actuellement visibles
    this.visibilityUpdateFrequency = 3; // Mettre à jour la visibilité tous les 3 frames
    
    // Référence aux couleurs de sécurité (sera mise à jour par le système externe)
    this.securityColors = {
      'NORMAL': 0xffffff,  // ✅ CORRIGÉ : Blanc au lieu de bleu
      'SCANNING': 0x4488ff, // ✅ CORRIGÉ : Bleu au lieu d'orange
      'ALERT': 0xff0044,
      'SECURE': 0x00ff88,
      'SAFE': 0x00ff88,    // Alias pour SECURE
      'DANGER': 0xff0044,  // Alias pour ALERT
      'WARNING': 0xff6600  // Orange (inchangé)
    };
    this.currentSecurityMode = 'NORMAL';
    
    console.log('🎨 ParticleSystemV2: Couleurs de sécurité initialisées', this.securityColors);
    
    // Géométries et matériaux
    this.particleGeometry = null;
    this.particleMaterial = null;
    this.particleMesh = null;
    this.connectionGeometry = null;
    this.connectionMaterial = null;
    this.connectionMesh = null;
    this.arcGeometry = null;
    this.arcMaterial = null;
    this.arcMesh = null;
    
    // Buffers pour performance
    this.particlePositions = null;
    this.particleSizes = null;
    this.particleColors = null;
    this.connectionPositions = null;
    this.connectionColors = null;
    
    this.initialize();
  }
  
  initialize() {
    console.log('🎨 ParticleSystemV2 - Début initialisation');
    this.createParticleSystem();
    this.createConnectionSystem();
    this.createElectricArcSystem();
    this.createTravelingLightSystem();
    this.generateParticles();
    this.formGroups();
    console.log('✅ ParticleSystemV2 - Initialisation terminée, particules ajoutées à la scène');
    
    // 🔮 Créer la sphère de debug pour visualiser la zone
    if (this.showDebugSphere) {
      this.createDebugSphere();
    }
  }
  
  createParticleSystem() {
    // Géométrie pour les particules (sprites billboards)
    this.particleGeometry = new THREE.BufferGeometry();
    
    // Buffers
    const positions = new Float32Array(this.config.particleCount * 3);
    const colors = new Float32Array(this.config.particleCount * 3);
    
    this.particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    
    // Material simple avec PointsMaterial (plus stable)
    this.particleMaterial = new THREE.PointsMaterial({
      size: 0.2 * this.config.particleSizeMultiplier, // Taille de base augmentée
      sizeAttenuation: true,
      vertexColors: true,
      transparent: true,
      opacity: this.config.particleOpacity,
      blending: THREE.AdditiveBlending,
      map: this.createParticleTexture()
    });
    
    this.particleMesh = new THREE.Points(this.particleGeometry, this.particleMaterial);
    this.particleMesh.visible = true; // Force la visibilité
    console.log('🎨 ParticleMesh créé et ajouté à la scène, visible:', this.particleMesh.visible);
    this.scene.add(this.particleMesh);
  }
  
  createConnectionSystem() {
    // Géométrie pour les connexions - optimisée pour 1250 particules max
    const maxConnections = Math.min(this.config.particleCount * this.config.maxConnections, 5000); // Limite pour performance
    
    this.connectionGeometry = new THREE.BufferGeometry();
    
    const positions = new Float32Array(maxConnections * 6); // 2 points par ligne
    const colors = new Float32Array(maxConnections * 6);
    
    this.connectionGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.connectionGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    
    this.connectionMaterial = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: this.config.connectionOpacity,
      blending: THREE.AdditiveBlending,
      linewidth: this.config.connectionWidth
    });
    
    this.connectionMesh = new THREE.LineSegments(this.connectionGeometry, this.connectionMaterial);
    this.scene.add(this.connectionMesh);
  }
  
  createTravelingLightSystem() {
    if (!this.config.travelingLights) return;
    
    // Géométrie pour les lumières navigantes
    const lightGeometry = new THREE.BufferGeometry();
    const lightPositions = new Float32Array(this.config.travelingLightCount * 3);
    const lightColors = new Float32Array(this.config.travelingLightCount * 3);
    const lightSizes = new Float32Array(this.config.travelingLightCount);
    
    lightGeometry.setAttribute('position', new THREE.BufferAttribute(lightPositions, 3));
    lightGeometry.setAttribute('color', new THREE.BufferAttribute(lightColors, 3));
    lightGeometry.setAttribute('size', new THREE.BufferAttribute(lightSizes, 1));
    
    // Material avec glow
    this.travelingLightMaterial = new THREE.PointsMaterial({
      size: this.config.travelingLightSize,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      transparent: true,
      opacity: 0.9,
      sizeAttenuation: false
    });
    
    this.travelingLightMesh = new THREE.Points(lightGeometry, this.travelingLightMaterial);
    this.scene.add(this.travelingLightMesh);
    
    // Initialiser les lumières
    for (let i = 0; i < this.config.travelingLightCount; i++) {
      this.spawnTravelingLight();
    }
  }
  
  spawnTravelingLight() {
    if (!this.connections.length) return;
    
    // Choisir une connexion aléatoire
    const connection = this.connections[Math.floor(Math.random() * this.connections.length)];
    
    this.travelingLights.push({
      from: connection.from,
      to: connection.to,
      progress: 0,
      speed: this.config.travelingLightSpeed * (0.5 + Math.random() * 0.5),
      intensity: this.config.travelingLightIntensity * (0.7 + Math.random() * 0.3),
      color: new THREE.Color(this.config.connectionColor)
    });
  }
  
  createElectricArcSystem() {
    // Géométrie pour les arcs électriques (lignes en zigzag)
    const maxArcs = this.config.arcCount * 10; // 10 segments par arc max
    this.arcGeometry = new THREE.BufferGeometry();
    
    const positions = new Float32Array(maxArcs * 6); // 2 points par segment
    const colors = new Float32Array(maxArcs * 6);
    
    this.arcGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.arcGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    
    // Matériau pour arcs électriques (plus lumineux)
    this.arcMaterial = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
      linewidth: 2
    });
    
    this.arcMesh = new THREE.LineSegments(this.arcGeometry, this.arcMaterial);
    this.scene.add(this.arcMesh);
  }
  
  createParticleTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    
    // Gradient radial pour effet lumineux
    const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    gradient.addColorStop(0, 'rgba(255,255,255,1)');
    gradient.addColorStop(0.2, 'rgba(255,255,255,0.8)');
    gradient.addColorStop(0.4, 'rgba(255,255,255,0.4)');
    gradient.addColorStop(1, 'rgba(255,255,255,0)');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 64, 64);
    
    return new THREE.CanvasTexture(canvas);
  }
  
  generateParticles() {
    const color = new THREE.Color(this.config.particleColor);
    console.log('🎨 Génération de', this.config.particleCount, 'particules, couleur:', this.config.particleColor);
    
    for (let i = 0; i < this.config.particleCount; i++) {
      // Position dans la sphère avec exclusion des zones
      let position;
      let attempts = 0;
      do {
        position = this.generateSpherePosition();
        attempts++;
      } while (this.isInExclusionZone(position) && attempts < 50);
      
      // Distribution de tailles spécifique
      const sizeRoll = Math.random();
      let sizeMultiplier;
      if (sizeRoll < 0.30) {
        sizeMultiplier = 0.4; // 30% des particules à 0.4x
      } else if (sizeRoll < 0.70) {
        sizeMultiplier = 1.1; // 40% des particules à 1.1x
      } else if (sizeRoll < 0.80) {
        sizeMultiplier = 1.4; // 10% des particules à 1.4x
      } else if (sizeRoll < 0.90) {
        sizeMultiplier = 1.7; // 10% des particules à 1.7x
      } else {
        sizeMultiplier = 2.0; // 10% des particules à 2.0x
      }
      
      const baseSize = THREE.MathUtils.randFloat(
        this.config.particleSize.min,
        this.config.particleSize.max
      );
      const size = baseSize * sizeMultiplier;
      
      // Vélocité initiale aléatoire
      const velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 0.01,
        (Math.random() - 0.5) * 0.01,
        (Math.random() - 0.5) * 0.01
      );
      
      // Déterminer si cette particule aura un mouvement spécial
      const hasSpecialMovement = Math.random() < this.config.movementVariety;
      const movementPattern = hasSpecialMovement ? 
        this.config.specialMovements[Math.floor(Math.random() * this.config.specialMovements.length)] : 
        'normal';
        
      // Déterminer si cette particule aura des interactions spéciales
      const hasSpecialInteraction = Math.random() < this.config.interactionVariety;
      const interactionType = hasSpecialInteraction ?
        this.config.specialInteractions[Math.floor(Math.random() * this.config.specialInteractions.length)] :
        'normal';
      
      // Déterminer le type orbital
      const particleRoll = Math.random();
      let orbitalType = 'standard';
      if (particleRoll < this.config.planetarySystem.cometRatio) {
        orbitalType = 'comet';
      } else if (particleRoll < this.config.planetarySystem.cometRatio + this.config.planetarySystem.counterCurrentRatio) {
        orbitalType = 'counter';
      }
      
      // Calculer les paramètres orbitaux
      const distanceFromCenter = position.length();
      const orbitalRadius = distanceFromCenter;
      const orbitalSpeed = this.config.planetarySystem.keplerianMotion ? 
        this.config.planetarySystem.mainRotationSpeed * Math.pow(5 / (orbitalRadius + 5), 0.5) : // Loi de Kepler
        this.config.planetarySystem.mainRotationSpeed;
      
      // Créer la particule
      const particle = {
        id: i,
        position: position,
        velocity: velocity,
        size: size,
        baseSize: size,
        color: color.clone(),
        group: null,
        connections: [],
        mass: size * 10, // Masse proportionnelle à la taille
        charge: Math.random() > 0.5 ? 1 : -1, // Charge positive ou négative
        lifetime: 0,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.02,
        // Nouveau : mouvement spécial
        movementPattern: movementPattern,
        movementPhase: Math.random() * Math.PI * 2, // Phase pour éviter la synchronisation
        movementAmplitude: 0.3 + Math.random() * 0.7, // Amplitude du mouvement
        movementFrequency: 0.5 + Math.random() * 1.5, // Fréquence du mouvement
        orbitCenter: hasSpecialMovement && movementPattern === 'orbit' ? 
          position.clone().add(new THREE.Vector3(
            (Math.random() - 0.5) * 2,
            (Math.random() - 0.5) * 2,
            (Math.random() - 0.5) * 2
          )) : null,
        // Nouveau : interaction spéciale
        interactionType: interactionType,
        interactionStrength: 0.5 + Math.random() * 1.5, // Force d'interaction
        interactionRange: 1.0 + Math.random() * 2.0,    // Portée d'interaction
        magneticField: hasSpecialInteraction && interactionType === 'magnetic' ?
          new THREE.Vector3(
            (Math.random() - 0.5) * 2,
            (Math.random() - 0.5) * 2,
            (Math.random() - 0.5) * 2
          ).normalize() : null,
        // Visibilité pour frustum culling
        visible: true, // Par défaut visible, sera mise à jour par updateVisibility()
        
        // Propriétés orbitales planétaires
        orbitalType: orbitalType,
        orbitalCenter: new THREE.Vector3(0, 0, 0), // Centre de l'orbite
        orbitalRadius: orbitalRadius,
        orbitalSpeed: orbitalSpeed,
        orbitalPhase: Math.random() * Math.PI * 2, // Phase initiale aléatoire
        orbitalEccentricity: Math.random() * this.config.planetarySystem.orbitalVariation, // Ellipticité
        orbitalInclination: (Math.random() - 0.5) * 0.5, // Inclinaison de l'orbite
        
        // Pour les comètes
        cometTail: orbitalType === 'comet' ? [] : null,
        cometPhase: orbitalType === 'comet' ? Math.random() * Math.PI * 2 : 0
      };
      
      this.particles.push(particle);
    }
    
    console.log('🎨 Particules générées:', this.particles.length, 'particules créées');
    this.updateParticleBuffer();
    
    // Appliquer les couleurs avec nuances
    this.updateParticleColors(this.config.particleColor);
    console.log('✅ Buffer des particules mis à jour, particules prêtes pour le rendu');
  }
  
  generateSpherePosition() {
    // 🎯 NOUVELLE LOGIQUE : Distribuer les particules dans TOUTE la zone de flux
    if (this.config.infiniteFlow.enabled) {
      // Zone de flux : étaler les particules entre zoneEnd et zoneStart + marge
      const zStart = this.config.infiniteFlow.zoneStart;
      const zEnd = this.config.infiniteFlow.zoneEnd;
      const zMargin = 10; // Marge au-delà de zoneStart pour éviter concentration
      
      // Position Z étalée dans toute la zone de flux (déjà avec offset global)
      const z = zEnd + Math.random() * (zStart + zMargin - zEnd);
      
      // Position X,Y dans un cercle (pas une sphère complète)
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.sqrt(Math.random()) * this.config.sphereRadius;
      
      const x = Math.cos(angle) * radius;
      const y = (Math.random() - 0.5) * this.config.sphereRadius * 1.5; // Plus d'étalement vertical
      
      return new THREE.Vector3(x, y, z);
    } else {
      // Mode sphère classique (si flux désactivé)
      let x, y, z;
      
      // Générer un point uniforme dans la sphère unitaire
      do {
        x = (Math.random() - 0.5) * 2;
        y = (Math.random() - 0.5) * 2;
        z = (Math.random() - 0.5) * 2;
      } while (x*x + y*y + z*z > 1);
      
      // Mettre à l'échelle selon le rayon et décaler selon le centre
      const radius = this.config.sphereRadius;
      const center = this.config.sphereCenter;
      
      return new THREE.Vector3(
        x * radius + center.x,
        y * radius + center.y,
        z * radius + center.z
      );
    }
  }
  
  // 🔮 Créer sphère de debug pour visualiser la zone d'apparition
  createDebugSphere() {
    // Géométrie wireframe pour voir la zone
    const geometry = new THREE.SphereGeometry(
      this.config.sphereRadius, 
      32, // Segments largeur
      16  // Segments hauteur
    );
    
    // Matériau wireframe semi-transparent
    const material = new THREE.MeshBasicMaterial({
      color: 0x00ffff,
      wireframe: true,
      transparent: true,
      opacity: 0.3
    });
    
    // Créer le mesh
    this.debugSphere = new THREE.Mesh(geometry, material);
    
    // Positionner au centre de la zone
    this.debugSphere.position.set(
      this.config.sphereCenter.x,
      this.config.sphereCenter.y,
      this.config.sphereCenter.z
    );
    
    this.debugSphere.name = 'ParticleZoneDebugSphere';
    this.scene.add(this.debugSphere);
    
    // Ajouter aussi un petit marqueur au centre
    const centerGeometry = new THREE.SphereGeometry(0.5, 16, 8);
    const centerMaterial = new THREE.MeshBasicMaterial({
      color: 0xff0000,
      emissive: 0xff0000,
      emissiveIntensity: 0.5
    });
    
    const centerMarker = new THREE.Mesh(centerGeometry, centerMaterial);
    centerMarker.position.copy(this.debugSphere.position);
    centerMarker.name = 'ParticleZoneCenterMarker';
    this.scene.add(centerMarker);
    
    console.log('🔮 Debug sphere créée:', {
      rayon: this.config.sphereRadius,
      centre: this.config.sphereCenter,
      position: this.debugSphere.position
    });
  }
  
  isInExclusionZone(position) {
    for (const zone of this.config.exclusionZones) {
      if (zone.type === 'cylinder') {
        const dx = position.x - zone.center[0];
        const dz = position.z - zone.center[2];
        const distance2D = Math.sqrt(dx * dx + dz * dz);
        const dy = Math.abs(position.y - zone.center[1]);
        
        if (distance2D < zone.radius && dy < zone.height / 2) {
          return true;
        }
      } else if (zone.type === 'sphere') {
        const distance = position.distanceTo(
          new THREE.Vector3(...zone.center)
        );
        if (distance < zone.radius) {
          return true;
        }
      }
    }
    return false;
  }
  
  formGroups() {
    // Former des groupes de particules
    const ungrouped = [...this.particles];
    
    for (let g = 0; g < this.config.groupCount && ungrouped.length > 0; g++) {
      const groupSize = THREE.MathUtils.randInt(
        this.config.particlesPerGroup.min,
        Math.min(this.config.particlesPerGroup.max, ungrouped.length)
      );
      
      const group = {
        id: g,
        particles: [],
        center: new THREE.Vector3(),
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 0.005,
          (Math.random() - 0.5) * 0.005,
          (Math.random() - 0.5) * 0.005
        ),
        color: new THREE.Color().setHSL(Math.random(), 0.7, 0.5),
        behavior: this.randomBehavior(),
        mass: 0
      };
      
      // Choisir une particule de départ
      const seedIndex = Math.floor(Math.random() * ungrouped.length);
      const seedParticle = ungrouped.splice(seedIndex, 1)[0];
      seedParticle.group = group;
      group.particles.push(seedParticle);
      
      // Ajouter des particules proches
      for (let i = 1; i < groupSize && ungrouped.length > 0; i++) {
        // Trouver la particule la plus proche
        let closestIndex = 0;
        let closestDistance = Infinity;
        
        ungrouped.forEach((particle, index) => {
          const distance = particle.position.distanceTo(seedParticle.position);
          if (distance < closestDistance) {
            closestDistance = distance;
            closestIndex = index;
          }
        });
        
        if (closestDistance < this.config.connectionDistance * 3) {
          const particle = ungrouped.splice(closestIndex, 1)[0];
          particle.group = group;
          group.particles.push(particle);
        } else {
          break;
        }
      }
      
      // Calculer la masse totale du groupe
      group.mass = group.particles.reduce((sum, p) => sum + p.mass, 0);
      
      this.groups.push(group);
    }
  }
  
  randomBehavior() {
    const behaviors = ['flock', 'orbit', 'wander', 'chase', 'flee'];
    return behaviors[Math.floor(Math.random() * behaviors.length)];
  }
  
  updateMousePosition(mouseX, mouseY) {
    if (!this.config.mouseRepulsion.enabled) return;
    
    // Convertir coordonnées souris 2D en 3D
    const mouse = new THREE.Vector2(mouseX, mouseY);
    
    // Utiliser un raycaster pour projeter sur un plan
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, this.camera);
    
    // Plan imaginaire au niveau Y=0
    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const intersectPoint = new THREE.Vector3();
    
    if (raycaster.ray.intersectPlane(plane, intersectPoint)) {
      this.mousePosition3D.copy(intersectPoint);
      this.mouseActive = true;
    }
  }
  
  updateGroupCenters() {
    // Calculer le centre de masse de chaque groupe
    this.groups.forEach(group => {
      if (group.particles.length === 0) return;
      
      const center = new THREE.Vector3();
      let totalMass = 0;
      
      group.particles.forEach(particle => {
        center.add(particle.position.clone().multiplyScalar(particle.mass));
        totalMass += particle.mass;
      });
      
      if (totalMass > 0) {
        center.divideScalar(totalMass);
        group.centerOfMass = center;
        group.totalMass = totalMass;
      }
    });
  }
  
  update(deltaTime) {
    // Limiter deltaTime pour éviter les sauts
    deltaTime = Math.min(deltaTime, 0.05);
    
    
    // Mettre à jour la visibilité des particules (pas tous les frames pour optimiser)
    if (this.frameCounter % this.visibilityUpdateFrequency === 0) {
      this.updateVisibility();
    }
    
    // Mettre à jour les centres de masse des groupes
    this.updateGroupCenters();
    
    // Mettre à jour la physique (seulement les particules visibles pour les gros systèmes)
    this.updatePhysics(deltaTime);
    
    // Mettre à jour les connexions (seulement entre particules visibles)
    this.updateConnections();
    
    // Mettre à jour les signaux
    this.updateSignals(deltaTime);
    
    // Mettre à jour les arcs électriques
    this.updateElectricArcs(deltaTime);
    
    // Mettre à jour les lumières navigantes
    this.updateTravelingLights(deltaTime);
    
    // Mettre à jour les buffers GPU (seulement pour les éléments visibles)
    this.updateParticleBuffer();
    this.updateConnectionBuffer();
    this.updateArcBuffer();
    if (this.config.travelingLights) {
      this.updateTravelingLightBuffer();
    }
  }
  
  updateVisibility() {
    // Mettre à jour le frustum avec la matrice de projection actuelle de la caméra
    this.cameraMatrix.multiplyMatrices(this.camera.projectionMatrix, this.camera.matrixWorldInverse);
    this.frustum.setFromProjectionMatrix(this.cameraMatrix);
    
    // Vider la liste des particules visibles
    this.visibleParticles = [];
    
    // Tester chaque particule pour voir si elle est dans le frustum
    this.particles.forEach((particle, index) => {
      // Créer une sphère temporaire pour tester la visibilité
      // Utiliser la taille de la particule comme rayon
      if (this.frustum.intersectsSphere(new THREE.Sphere(particle.position, particle.size * 2))) {
        this.visibleParticles.push(index);
        particle.visible = true;
      } else {
        particle.visible = false;
      }
    });
    
    // Stats de performance (optionnel) - variable supprimée pour éviter warning ESLint
    // if (this.config.particleCount > 1000) {
    //   const visibilityRatio = this.visibleParticles.length / this.particles.length;
    //   console.log(`Particules visibles: ${this.visibleParticles.length}/${this.particles.length} (${(visibilityRatio * 100).toFixed(1)}%)`);
    // }
  }
  
  updatePhysics(deltaTime) {
    this.frameCounter++;
    
    // Optimisation ajustée pour 350-400 particules
    const useOptimization = this.config.particleCount > 350;
    const useFrustumCulling = this.config.particleCount > 300;
    
    // Mettre à jour chaque particule (physique de base)
    // 🚀 TOUJOURS traiter TOUTES les particules pour flux infini (recyclage essentiel)
    // Le frustum culling est seulement pour l'affichage, pas pour la physique du flux
    const particlesToProcess = this.particles;
      
    particlesToProcess.forEach(particle => {
      // 🚀 FLUX INFINI EN PRIORITÉ (recyclage toujours actif même pour particules non visibles)
      this.applyInfiniteFlow(particle, deltaTime);
      
      // 🎯 Traitement physique optimisé : seulement pour particules visibles si système lourd
      const processPhysics = !useFrustumCulling || particle.visible;
      
      if (processPhysics) {
        // Gravité
        particle.velocity.add(
          new THREE.Vector3(
            this.config.gravity.x * deltaTime,
            this.config.gravity.y * deltaTime,
            this.config.gravity.z * deltaTime
          )
        );
        
        // Forces de groupe
        if (particle.group) {
          const groupCenter = this.calculateGroupCenter(particle.group);
          const toCenter = groupCenter.clone().sub(particle.position);
          toCenter.multiplyScalar(this.config.groupCohesion * deltaTime);
          particle.velocity.add(toCenter);
        }
        
        // Éviter les zones d'exclusion
        this.applyExclusionForces(particle, deltaTime);
        
        // 🎯 Force de convergence vers le point dynamique (après évitement d'obstacles)
        this.applyConvergenceForce(particle, deltaTime);
        
        // Interactions entre particules (optimisées pour grands systèmes)
        if (!useOptimization) {
          this.applyParticleInteractions(particle, deltaTime);
        }
        
        // Appliquer le mouvement planétaire global
        this.applyPlanetaryMotion(particle, deltaTime);
        
        // Appliquer la répulsion de souris
        this.applyMouseRepulsion(particle);
        
        // Appliquer mouvement spécial supplémentaire
        this.applySpecialMovement(particle, deltaTime);
        
        // Rotation
        particle.rotation += particle.rotationSpeed;
        
        // Damping
        particle.velocity.multiplyScalar(this.config.damping);
        
        // Limiter la vitesse maximale pour éviter accumulation
        const maxVelocity = 0.3;
        if (particle.velocity.length() > maxVelocity) {
          particle.velocity.normalize().multiplyScalar(maxVelocity);
        }
        
        // Mettre à jour la position avec vélocité limitée
        particle.position.add(
          particle.velocity.clone().multiplyScalar(deltaTime * 60)
        );
        
        // Ne PAS contraindre à la sphère si le flux est actif (évite blocage)
        if (!this.config.infiniteFlow.enabled) {
          this.constrainToSphere(particle);
        }
      }
      
      // 🕒 Âge toujours mis à jour (même particules non visibles)
      particle.lifetime += deltaTime;
    });
    
    // Traitement par batch des interactions pour les gros systèmes
    if (useOptimization) {
      this.updateParticleInteractionsBatch(deltaTime);
    }
    
    // Mettre à jour les groupes
    this.updateGroups(deltaTime);
  }
  
  updateParticleInteractionsBatch(deltaTime) {
    // Traiter seulement une partie des particules par frame
    const endIndex = Math.min(this.currentParticleIndex + this.particlesPerFrame, this.particles.length);
    
    for (let i = this.currentParticleIndex; i < endIndex; i++) {
      this.applyParticleInteractions(this.particles[i], deltaTime);
    }
    
    // Avancer l'index pour la prochaine frame
    this.currentParticleIndex = endIndex;
    if (this.currentParticleIndex >= this.particles.length) {
      this.currentParticleIndex = 0; // Revenir au début
    }
  }
  
  calculateGroupCenter(group) {
    const center = new THREE.Vector3();
    group.particles.forEach(particle => {
      center.add(particle.position);
    });
    center.divideScalar(group.particles.length);
    return center;
  }
  
  applyExclusionForces(particle, deltaTime) {
    this.config.exclusionZones.forEach(zone => {
      let force = new THREE.Vector3();
      
      if (zone.type === 'cylinder') {
        const center2D = new THREE.Vector2(zone.center[0], zone.center[2]);
        const particle2D = new THREE.Vector2(particle.position.x, particle.position.z);
        const distance2D = particle2D.distanceTo(center2D);
        
        if (distance2D < zone.radius * 1.5) {
          const direction2D = particle2D.clone().sub(center2D).normalize();
          const forceMagnitude = this.config.repulsionForce * 
            (1 - distance2D / (zone.radius * 1.5));
          
          force.x = direction2D.x * forceMagnitude;
          force.z = direction2D.y * forceMagnitude;
        }
      } else if (zone.type === 'sphere') {
        const center = new THREE.Vector3(...zone.center);
        const distance = particle.position.distanceTo(center);
        
        if (distance < zone.radius * 1.5) {
          const direction = particle.position.clone().sub(center).normalize();
          const forceMagnitude = this.config.repulsionForce * 
            (1 - distance / (zone.radius * 1.5));
          
          force = direction.multiplyScalar(forceMagnitude);
        }
      }
      
      particle.velocity.add(force.multiplyScalar(deltaTime));
    });
  }
  
  applyParticleInteractions(particle, deltaTime) {
    let nearbyCount = 0;
    const maxNearby = this.config.particleCount > 400 ? 6 : 10; // Moins d'interactions avec plus de particules
    
    for (const other of this.particles) {
      if (other === particle || nearbyCount >= maxNearby) continue;
      
      const distance = particle.position.distanceTo(other.position);
      const maxInteractionRange = Math.max(
        this.config.connectionDistance * 2,
        particle.interactionRange,
        other.interactionRange
      );
      
      if (distance < maxInteractionRange) {
        nearbyCount++;
        
        const direction = other.position.clone().sub(particle.position).normalize();
        let forceMagnitude = 0;
        
        // Interactions spéciales ont priorité
        if (particle.interactionType !== 'normal' || other.interactionType !== 'normal') {
          forceMagnitude = this.calculateSpecialInteractionForce(particle, other, distance);
        } else {
          // Attraction/répulsion basée sur la charge (comportement par défaut)
          if (particle.charge === other.charge) {
            forceMagnitude = -this.config.repulsionForce / (distance * distance);
          } else {
            forceMagnitude = this.config.attractionForce / (distance * distance);
          }
        }
        
        // Limiter la force
        forceMagnitude = THREE.MathUtils.clamp(forceMagnitude, -0.003, 0.003);
        
        const force = direction.multiplyScalar(forceMagnitude * deltaTime);
        particle.velocity.add(force);
      }
    }
  }
  
  calculateSpecialInteractionForce(particle, other, distance) {
    let force = 0;
    
    // Appliquer l'interaction de la particule principale
    switch (particle.interactionType) {
      case 'magnetic':
        // Force magnétique - dépend de l'alignement des champs
        if (particle.magneticField && other.magneticField) {
          const alignment = particle.magneticField.dot(other.magneticField);
          force = alignment * particle.interactionStrength * 0.001 / distance;
        } else {
          // Particule magnétique attire les particules chargées différemment
          force = particle.charge !== other.charge ? 
            particle.interactionStrength * 0.0008 / distance : 
            -particle.interactionStrength * 0.0005 / distance;
        }
        break;
        
      case 'repulsive':
        // Force répulsive plus forte que normale
        force = -particle.interactionStrength * 0.002 / (distance * distance);
        break;
        
      case 'attractive':
        // Force attractive plus forte que normale
        force = particle.interactionStrength * 0.001 / (distance * distance);
        break;
        
      case 'chaotic': {
        // Force aléatoire qui change constamment
        const randomFactor = (Math.random() - 0.5) * 2;
        force = randomFactor * particle.interactionStrength * 0.001 / distance;
        break;
      }
        
      case 'harmonic': {
        // Force harmonique - crée des oscillations
        const time = particle.lifetime;
        const harmonicForce = Math.sin(time * 3 + distance) * particle.interactionStrength * 0.0008;
        force = harmonicForce / distance;
        break;
      }
        
      default:
        // Comportement par défaut
        force = particle.charge === other.charge ? 
          -this.config.repulsionForce / (distance * distance) :
          this.config.attractionForce / (distance * distance);
    }
    
    return force;
  }
  
  applyMouseRepulsion(particle) {
    if (!this.config.mouseRepulsion.enabled || !this.mouseActive) return;
    
    const mouseConfig = this.config.mouseRepulsion;
    
    // Distance entre la particule et la souris
    const distance = particle.position.distanceTo(this.mousePosition3D);
    
    // Si trop loin, pas d'effet
    if (distance > mouseConfig.radius) return;
    
    // Direction de répulsion (de la souris vers la particule)
    const direction = particle.position.clone().sub(this.mousePosition3D);
    
    // Éviter division par zéro
    if (direction.length() < 0.01) {
      direction.set(Math.random() - 0.5, 0, Math.random() - 0.5).normalize();
    } else {
      direction.normalize();
    }
    
    // Calculer la force selon la distance (plus proche = plus fort)
    const distanceRatio = 1.0 - (distance / mouseConfig.radius);
    const forceStrength = Math.pow(distanceRatio, mouseConfig.falloff) * mouseConfig.force;
    
    // Appliquer la force de répulsion
    const repulsionForce = direction.multiplyScalar(forceStrength);
    particle.velocity.add(repulsionForce);
  }
  
  // 🚀 Appliquer flux infini basé sur rotation du modèle (mouvement direct des particules)
  applyInfiniteFlow(particle, deltaTime) {
    if (!this.config.infiniteFlow.enabled) return;
    
    // Calculer intensité du flux basée sur rotation du modèle
    let intensityMultiplier = 1.0;
    if (this.config.infiniteFlow.basedOnModelRotation) {
      // Plus le modèle regarde de côté, plus le flux est intense
      this.targetFlowIntensity = Math.abs(this.modelRotationY) * 2.0; // Facteur multiplicateur
      intensityMultiplier = 0.5 + this.targetFlowIntensity;
    }
    
    // Transition douce vers l'intensité cible
    this.flowIntensity = THREE.MathUtils.lerp(
      this.flowIntensity || 0,
      intensityMultiplier,
      0.02 // Smoothness
    );
    
    // 🆕 Calcul direction dynamique
    const flowDirection = this.calculateDynamicFlowDirection()
    const flowMovement = flowDirection.clone()
    
    // Vitesse normale (sans multiplicateur de sync pour éviter vitesse folle)
    let effectiveSpeed = this.config.infiniteFlow.flowSpeed * 
                        this.flowIntensity * 
                        deltaTime * 60 // 60fps normalization
    
    
    flowMovement.multiplyScalar(effectiveSpeed);
    
    // Déplacer directement la particule
    particle.position.add(flowMovement);
    
    // Recyclage simple basique
    if (particle.position.z < this.config.infiniteFlow.zoneEnd) {
      particle.position.z = this.config.infiniteFlow.zoneStart + Math.random() * 5;
      particle.position.x = (Math.random() - 0.5) * this.config.sphereRadius;
      particle.position.y = (Math.random() - 0.5) * this.config.sphereRadius;
    }
  }
  
  // 👁️ Mettre à jour la rotation du modèle (appelé depuis ModelRotationManager)
  updateEyeRotation(rotationY) {
    this.modelRotationY = rotationY;
  }

  // 🆕 API de communication avec système flottement
  setSpatialSyncData(syncData) {
    if (!this.spatialSyncConfig.enabled) return

    this.spatialSyncData = { ...syncData }
    const wasEnabled = this.spatialSyncEnabled
    this.spatialSyncEnabled = syncData.isActive && 
                             syncData.intensity > this.spatialSyncConfig.intensityThreshold
    
    // 🆕 Gestion du timer de fade-in/fade-out
    if (this.spatialSyncEnabled && !wasEnabled) {
      // Activation : commencer le fade-in
      this.syncActivationTime = 0
      this.isInFadeOut = false
    } else if (this.spatialSyncEnabled && wasEnabled) {
      // Synchronisation continue : incrémenter le timer
      this.syncActivationTime += 16 // ~60fps (approximation)
      
      // Commencer fade-out après fadeInDuration (10 secondes)
      if (this.syncActivationTime > this.fadeInDuration && !this.isInFadeOut) {
        this.isInFadeOut = true
        this.syncActivationTime = 0 // Reset pour fade-out
      }
    } else if (!this.spatialSyncEnabled) {
      // Désactivation : reset
      this.syncActivationTime = 0
      this.isInFadeOut = false
      this.dynamicBlendFactor = 0
    }
    
    // Update targets pour lissage
    if (this.spatialSyncEnabled) {
      this.targetFlowDirection.copy(syncData.direction)
      this.targetSyncIntensity = 1.0 + (syncData.intensity * this.spatialSyncConfig.syncIntensity)
    } else {
      this.targetFlowDirection.set(0, 0, -1) // Retour direction par défaut
      this.targetSyncIntensity = 1.0
    }
  }

  // 🆕 Calcul du blendFactor dynamique avec fade-out seulement (garde l'effet de choc initial)
  calculateDynamicBlendFactor() {
    if (!this.spatialSyncEnabled) {
      this.dynamicBlendFactor = 0
      return 0
    }

    const targetBlendFactor = this.spatialSyncConfig.blendFactor

    if (!this.isInFadeOut) {
      // Phase initiale (0-10s) : Effet maximum immédiat (garde l'accélération brutale)
      this.dynamicBlendFactor = targetBlendFactor
    } else {
      // Phase fade-out : targetBlendFactor → 30% sur fadeOutDuration (garde un effet subtil)
      const fadeProgress = Math.min(this.syncActivationTime / this.fadeOutDuration, 1.0)
      // Courbe ease-in pour transition douce
      const easedProgress = Math.pow(fadeProgress, 2)
      // Descendre de 100% à 30% de la valeur du preset (au lieu de 0%)
      const minValue = targetBlendFactor * 0.3  // 30% de la valeur du preset
      const maxValue = targetBlendFactor
      this.dynamicBlendFactor = maxValue - (easedProgress * (maxValue - minValue))
    }

    return this.dynamicBlendFactor
  }

  // 🆕 Calcul direction flux dynamique
  calculateDynamicFlowDirection() {
    // Lissage progressif vers direction cible
    this.currentFlowDirection.lerp(
      this.targetFlowDirection, 
      this.spatialSyncConfig.directionSmoothing
    )

    // Lissage intensité
    this.currentSyncIntensity = THREE.MathUtils.lerp(
      this.currentSyncIntensity,
      this.targetSyncIntensity,
      this.spatialSyncConfig.directionSmoothing
    )

    // 🆕 Utiliser le blendFactor dynamique au lieu du statique
    const currentBlendFactor = this.calculateDynamicBlendFactor()

    // Blending avec direction par défaut
    const defaultDirection = new THREE.Vector3(0, 0, -1)
    const blendedDirection = defaultDirection.clone().lerp(
      this.currentFlowDirection, 
      currentBlendFactor // ← Changé de this.spatialSyncConfig.blendFactor
    )

    return blendedDirection.normalize()
  }

  
  // 🎯 Mettre à jour le point de convergence basé sur l'orientation du modèle 3D
  updateConvergencePoint(modelPosition, modelQuaternion) {
    this.modelPosition.copy(modelPosition);
    this.modelQuaternion.copy(modelQuaternion);
    
    // Direction Z du modèle 3D (vers où il regarde)
    const eyeDirection = new THREE.Vector3(0, 0, -1);
    eyeDirection.applyQuaternion(this.modelQuaternion);
    
    // Distance jusqu'à la zone de fin
    const distanceToZoneEnd = Math.abs(this.config.infiniteFlow.zoneEnd - this.modelPosition.z);
    
    // Point de convergence = position du modèle + direction * distance jusqu'à zoneEnd
    this.convergencePoint.copy(this.modelPosition);
    this.convergencePoint.addScaledVector(eyeDirection, distanceToZoneEnd);
    
    // S'assurer que le point est à la bonne coordonnée Z (zone de fin)
    this.convergencePoint.z = this.config.infiniteFlow.zoneEnd;
  }
  
  // 🎯 Appliquer force de convergence vers le point dynamique
  applyConvergenceForce(particle, deltaTime) {
    if (!this.config.infiniteFlow.enabled) return;
    
    // NE PAS appliquer la convergence si la particule est trop loin en Z
    // Pour éviter l'accumulation de particules
    const particleZ = particle.position.z;
    if (particleZ > this.config.infiniteFlow.zoneStart || particleZ < this.config.infiniteFlow.zoneEnd) {
      return; // Particule hors zone, pas de convergence
    }
    
    // Calculer direction vers le point de convergence
    const toConvergence = this.convergencePoint.clone().sub(particle.position);
    const distance = toConvergence.length();
    
    // Plus la particule est loin de l'axe central, plus la force de convergence est forte
    const lateralDistance = Math.sqrt(
      Math.pow(particle.position.x - this.convergencePoint.x, 2) + 
      Math.pow(particle.position.y - this.convergencePoint.y, 2)
    );
    
    // Force FAIBLE et seulement proche de la fin du flux
    const zDistanceToEnd = Math.abs(particle.position.z - this.config.infiniteFlow.zoneEnd);
    const zInfluence = Math.max(0, 1 - (zDistanceToEnd / 10)); // Influence seulement sur 10 unités
    const convergenceStrength = (lateralDistance * 0.0005) * zInfluence; // Force réduite
    
    // Appliquer la force (seulement sur X et Y pour ne pas interférer avec le flux Z)
    if (distance > 0.1 && convergenceStrength > 0.0001) {
      const convergenceForce = toConvergence.clone();
      convergenceForce.z = 0; // Pas de force sur Z, seulement convergence latérale
      convergenceForce.normalize();
      convergenceForce.multiplyScalar(convergenceStrength * deltaTime);
      
      // Limiter la force maximale pour éviter accumulation
      const maxForce = 0.01;
      if (convergenceForce.length() > maxForce) {
        convergenceForce.normalize().multiplyScalar(maxForce);
      }
      
      particle.velocity.add(convergenceForce);
    }
  }
  
  applyPlanetaryMotion(particle, deltaTime) {
    if (!this.config.planetarySystem.enabled) return;
    
    // Mise à jour de la phase orbitale
    particle.orbitalPhase += particle.orbitalSpeed * deltaTime;
    
    // Calculer la position orbitale elliptique
    const a = particle.orbitalRadius; // Demi-grand axe
    const e = particle.orbitalEccentricity; // Eccentricité
    const b = a * Math.sqrt(1 - e * e); // Demi-petit axe
    
    // Position sur l'ellipse
    const angle = particle.orbitalPhase;
    let x = a * Math.cos(angle);
    let y = b * Math.sin(angle);
    
    // Appliquer l'inclinaison orbitale pour un mouvement 3D
    const incl = particle.orbitalInclination;
    const rotatedX = x;
    const rotatedY = y * Math.cos(incl);
    const z = y * Math.sin(incl);
    
    // Rotation autour de l'axe Y pour varier les plans orbitaux
    const orbitRotation = particle.id * 0.1; // Chaque particule a un plan légèrement différent
    const finalX = rotatedX * Math.cos(orbitRotation) - z * Math.sin(orbitRotation);
    const finalZ = rotatedX * Math.sin(orbitRotation) + z * Math.cos(orbitRotation);
    
    // Position cible de base
    const targetPosition = new THREE.Vector3(
      particle.orbitalCenter.x + finalX,
      particle.orbitalCenter.y + rotatedY,
      particle.orbitalCenter.z + finalZ
    );
    
    // PERTURBATIONS GRAVITATIONNELLES ENTRE GROUPES
    const gravitationalForce = this.calculateGroupGravity(particle);
    targetPosition.add(gravitationalForce);
    
    // Pour les comètes : orbites très excentriques
    if (particle.orbitalType === 'comet') {
      particle.orbitalEccentricity = 0.8 + Math.sin(particle.lifetime * 0.01) * 0.15;
      
      // Queue de comète
      if (particle.cometTail.length > 20) {
        particle.cometTail.shift();
      }
      if (particle.lifetime % 3 === 0) {
        particle.cometTail.push(particle.position.clone());
      }
    }
    
    // Contre-courant : rotation inverse
    if (particle.orbitalType === 'counter') {
      targetPosition.x = particle.orbitalCenter.x - finalX;
      targetPosition.z = particle.orbitalCenter.z - finalZ;
    }
    
    // Force d'attraction vers la position orbitale cible
    const direction = targetPosition.clone().sub(particle.position);
    const distance = direction.length();
    
    // Force proportionnelle à la distance (ressort)
    const springForce = direction.normalize().multiplyScalar(distance * 0.02);
    
    // Amortissement pour éviter les oscillations
    const damping = particle.velocity.clone().multiplyScalar(-0.05);
    
    // Appliquer les forces
    particle.velocity.add(springForce);
    particle.velocity.add(damping);
    
    // Limiter la vitesse max
    if (particle.velocity.length() > 2) {
      particle.velocity.normalize().multiplyScalar(2);
    }
  }
  
  calculateGroupGravity(particle) {
    const gravityForce = new THREE.Vector3();
    
    // Si la particule n'a pas de groupe, pas d'influence gravitationnelle
    if (!particle.group) return gravityForce;
    
    // Calculer l'influence de chaque groupe
    this.groups.forEach(group => {
      // Ignorer son propre groupe
      if (group === particle.group) return;
      
      // Centre de masse du groupe
      const groupCenter = group.centerOfMass || new THREE.Vector3();
      const toGroup = groupCenter.clone().sub(particle.position);
      const distance = toGroup.length();
      
      // Éviter division par zéro et limiter l'influence
      if (distance < 1) return;
      if (distance > 20) return; // Portée maximale
      
      // Force gravitationnelle F = G * m1 * m2 / r²
      // Masse du groupe influence la force
      const groupMass = group.totalMass || group.particles.length;
      const strength = (groupMass * this.config.planetarySystem.gravitationalStrength * 0.0001) / (distance * distance);
      const force = toGroup.normalize().multiplyScalar(strength);
      
      // Perturbations chaotiques
      const chaosStrength = this.config.planetarySystem.chaosLevel;
      const chaos = new THREE.Vector3(
        (Math.random() - 0.5) * strength * chaosStrength,
        (Math.random() - 0.5) * strength * chaosStrength,
        (Math.random() - 0.5) * strength * chaosStrength
      );
      
      gravityForce.add(force);
      gravityForce.add(chaos);
    });
    
    // Limiter la force totale
    const maxForce = 0.5;
    if (gravityForce.length() > maxForce) {
      gravityForce.normalize().multiplyScalar(maxForce);
    }
    
    return gravityForce;
  }
  
  
  applySpecialMovement(particle, deltaTime) {
    if (particle.movementPattern === 'normal') return;
    
    const time = particle.lifetime;
    const phase = particle.movementPhase;
    const amplitude = particle.movementAmplitude;
    const frequency = particle.movementFrequency;
    
    let specialForce = new THREE.Vector3();
    
    switch (particle.movementPattern) {
      case 'spiral': {
        // Mouvement en spirale autour de la position originale
        const spiralRadius = amplitude * 0.5;
        const spiralSpeed = frequency * time * 2;
        specialForce.set(
          Math.cos(spiralSpeed + phase) * spiralRadius * 0.01,
          Math.sin(spiralSpeed * 0.5 + phase) * amplitude * 0.005,
          Math.sin(spiralSpeed + phase) * spiralRadius * 0.01
        );
        break;
      }
        
      case 'orbit': {
        // Orbite autour d'un point fixe
        if (particle.orbitCenter) {
          const toCenter = particle.orbitCenter.clone().sub(particle.position);
          const distance = toCenter.length();
          
          // Force centripète pour maintenir l'orbite
          const orbitSpeed = frequency * 0.02;
          toCenter.normalize();
          
          // Direction tangentielle pour l'orbite
          const tangent = new THREE.Vector3(-toCenter.z, 0, toCenter.x);
          tangent.normalize();
          
          specialForce.copy(tangent).multiplyScalar(orbitSpeed);
          
          // Ajuster la distance à l'orbiteur
          if (distance > amplitude * 2) {
            specialForce.add(toCenter.multiplyScalar(0.01));
          } else if (distance < amplitude * 0.5) {
            specialForce.sub(toCenter.multiplyScalar(0.01));
          }
        }
        break;
      }
        
      case 'pulse': {
        // Pulsation de taille et mouvement vertical
        const pulsePhase = Math.sin(frequency * time * 4 + phase);
        particle.size = particle.baseSize * (1 + pulsePhase * 0.5);
        specialForce.set(
          Math.sin(time * frequency + phase) * amplitude * 0.002,
          pulsePhase * amplitude * 0.01,
          Math.cos(time * frequency + phase) * amplitude * 0.002
        );
        break;
      }
        
      case 'zigzag': {
        // Mouvement en zigzag
        const zigzagTime = time * frequency * 3;
        const direction = Math.floor(zigzagTime) % 2 === 0 ? 1 : -1;
        specialForce.set(
          direction * amplitude * 0.01,
          Math.sin(zigzagTime * Math.PI) * amplitude * 0.005,
          Math.cos(zigzagTime + phase) * amplitude * 0.008
        );
        break;
      }
        
      case 'pendulum': {
        // Mouvement de pendule
        const pendulumSwing = Math.sin(time * frequency + phase);
        specialForce.set(
          pendulumSwing * amplitude * 0.015,
          -Math.abs(pendulumSwing) * amplitude * 0.005, // Gravité du pendule
          Math.cos(time * frequency * 0.5 + phase) * amplitude * 0.01
        );
        break;
      }
    }
    
    // Appliquer la force spéciale
    particle.velocity.add(specialForce.multiplyScalar(deltaTime));
    
    // Modifier légèrement la couleur pour les particules à mouvement spécial
    if (particle.movementPattern !== 'normal') {
      const colorShift = Math.sin(time * frequency * 2 + phase) * 0.1;
      particle.color.setHSL(
        (particle.color.getHSL({}).h + colorShift) % 1,
        particle.color.getHSL({}).s,
        Math.min(1, particle.color.getHSL({}).l + Math.abs(colorShift) * 0.2)
      );
    }
  }
  
  constrainToSphere(particle) {
    // Calculer distance au centre de la sphère
    const center = new THREE.Vector3(
      this.config.sphereCenter.x,
      this.config.sphereCenter.y,
      this.config.sphereCenter.z
    );
    
    const toCenter = particle.position.clone().sub(center);
    const distance = toCenter.length();
    
    // Si la particule sort de la sphère, la ramener à la surface
    if (distance > this.config.sphereRadius) {
      toCenter.normalize();
      particle.position.copy(center).add(toCenter.multiplyScalar(this.config.sphereRadius));
    }
  }
  
  updateGroups(deltaTime) {
    this.groups.forEach(group => {
      // Mettre à jour le centre du groupe
      group.center = this.calculateGroupCenter(group);
      
      // Comportements de groupe
      switch (group.behavior) {
        case 'orbit': {
          // Orbiter autour du centre
          const orbitSpeed = 0.5;
          const angle = deltaTime * orbitSpeed;
          group.particles.forEach(particle => {
            const offset = particle.position.clone().sub(group.center);
            const cos = Math.cos(angle);
            const sin = Math.sin(angle);
            const newX = offset.x * cos - offset.z * sin;
            const newZ = offset.x * sin + offset.z * cos;
            offset.x = newX;
            offset.z = newZ;
            particle.position.copy(group.center).add(offset);
          });
          break;
        }
          
        case 'flock': {
          // Comportement de banc (alignment, cohésion, séparation)
          group.particles.forEach(particle => {
            let alignment = new THREE.Vector3();
            let cohesion = new THREE.Vector3();
            let separation = new THREE.Vector3();
            let count = 0;
            
            group.particles.forEach(other => {
              if (other === particle) return;
              
              const distance = particle.position.distanceTo(other.position);
              if (distance < 2.0) {
                // Alignment
                alignment.add(other.velocity);
                
                // Cohésion
                cohesion.add(other.position);
                
                // Séparation
                if (distance < 0.5) {
                  const diff = particle.position.clone().sub(other.position);
                  diff.divideScalar(distance || 0.1);
                  separation.add(diff);
                }
                
                count++;
              }
            });
            
            if (count > 0) {
              alignment.divideScalar(count).normalize().multiplyScalar(0.001);
              cohesion.divideScalar(count).sub(particle.position).normalize().multiplyScalar(0.001);
              separation.divideScalar(count).normalize().multiplyScalar(0.002);
              
              particle.velocity.add(alignment);
              particle.velocity.add(cohesion);
              particle.velocity.add(separation);
            }
          });
          break;
        }
          
        case 'wander': {
          // Mouvement aléatoire
          group.velocity.x += (Math.random() - 0.5) * 0.0001;
          group.velocity.y += (Math.random() - 0.5) * 0.0001;
          group.velocity.z += (Math.random() - 0.5) * 0.0001;
          group.velocity.clampLength(0, 0.01);
          
          group.particles.forEach(particle => {
            particle.velocity.add(group.velocity);
          });
          break;
        }
      }
    });
  }
  
  updateConnections() {
    this.connections = [];
    
    const useFrustumCulling = this.config.particleCount > 400;
    
    // Pour les gros systèmes, ne créer des connexions qu'entre particules visibles
    const particlesToCheck = useFrustumCulling ? 
      this.particles.filter(particle => particle.visible) : 
      this.particles;
    
    // Connexions entre particules proches
    for (let i = 0; i < particlesToCheck.length; i++) {
      const particle = particlesToCheck[i];
      let connectionCount = 0;
      
      for (let j = i + 1; j < particlesToCheck.length && connectionCount < this.config.maxConnections; j++) {
        const other = particlesToCheck[j];
        const distance = particle.position.distanceTo(other.position);
        
        if (distance < this.config.connectionDistance) {
          // Opacité basée sur la distance
          const opacity = 1 - (distance / this.config.connectionDistance);
          
          this.connections.push({
            from: particle,
            to: other,
            distance: distance,
            opacity: opacity,
            color: particle.group === other.group && particle.group?.color ? 
              particle.group.color : 
              new THREE.Color(this.config.connectionColor)
          });
          
          connectionCount++;
        }
      }
    }
  }
  
  updateSignals(deltaTime) {
    // Créer de nouveaux signaux aléatoirement
    if (this.config.signalEnabled && Math.random() < this.config.signalFrequency) {
      const connection = this.connections[Math.floor(Math.random() * this.connections.length)];
      if (connection) {
        this.signals.push({
          from: connection.from,
          to: connection.to,
          progress: 0,
          color: new THREE.Color(this.config.signalColor),
          intensity: this.config.signalIntensity
        });
      }
    }
    
    // Mettre à jour les signaux existants
    this.signals = this.signals.filter(signal => {
      signal.progress += this.config.signalSpeed * deltaTime;
      
      if (signal.progress >= 1) {
        // Signal arrivé, peut déclencher un nouveau signal
        if (Math.random() < 0.5) {
          // Trouver une connexion depuis la particule d'arrivée
          const nextConnection = this.connections.find(
            conn => conn.from === signal.to && conn.to !== signal.from
          );
          
          if (nextConnection) {
            this.signals.push({
              from: signal.to,
              to: nextConnection.to,
              progress: 0,
              color: signal.color.clone(),
              intensity: signal.intensity * 0.8
            });
          }
        }
        
        return false; // Supprimer le signal
      }
      
      return true; // Garder le signal
    });
  }
  
  updateTravelingLights(deltaTime) {
    if (!this.config.travelingLights) return;
    
    // Mettre à jour chaque lumière
    for (let i = this.travelingLights.length - 1; i >= 0; i--) {
      const light = this.travelingLights[i];
      
      // Avancer la lumière le long de la connexion
      light.progress += light.speed * deltaTime;
      
      // Si la lumière a atteint la fin, la respawn
      if (light.progress >= 1) {
        this.travelingLights.splice(i, 1);
        this.spawnTravelingLight();
      }
    }
  }
  
  updateTravelingLightBuffer() {
    if (!this.travelingLightMesh) return;
    
    const positions = this.travelingLightMesh.geometry.attributes.position.array;
    const colors = this.travelingLightMesh.geometry.attributes.color.array;
    const sizes = this.travelingLightMesh.geometry.attributes.size.array;
    
    this.travelingLights.forEach((light, index) => {
      if (index >= this.config.travelingLightCount) return;
      
      // Position interpolée entre from et to
      const pos = new THREE.Vector3().lerpVectors(
        light.from.position,
        light.to.position,
        light.progress
      );
      
      positions[index * 3] = pos.x;
      positions[index * 3 + 1] = pos.y;
      positions[index * 3 + 2] = pos.z;
      
      // Appliquer la variation d'intensité temporelle
      const intensityMultiplier = this.getCurrentIntensityMultiplier();
      
      // Couleur avec intensité
      colors[index * 3] = light.color.r * light.intensity * intensityMultiplier;
      colors[index * 3 + 1] = light.color.g * light.intensity * intensityMultiplier;
      colors[index * 3 + 2] = light.color.b * light.intensity * intensityMultiplier;
      
      // Taille variable selon l'intensité
      sizes[index] = this.config.travelingLightSize * light.intensity * intensityMultiplier;
    });
    
    this.travelingLightMesh.geometry.attributes.position.needsUpdate = true;
    this.travelingLightMesh.geometry.attributes.color.needsUpdate = true;
    this.travelingLightMesh.geometry.attributes.size.needsUpdate = true;
  }
  
  getCurrentIntensityMultiplier() {
    if (!this.config.intensityVariationEnabled) return 1.0;
    
    // Décider aléatoirement si on est en intensité faible ou haute
    const isLowIntensity = Math.random() < this.config.intensityLowProbability;
    
    if (isLowIntensity) {
      // Intensité entre 10-60%
      const range = this.config.intensityLowRange;
      return range[0] + Math.random() * (range[1] - range[0]);
    } else {
      // Intensité entre 70-120%
      const range = this.config.intensityHighRange;
      return range[0] + Math.random() * (range[1] - range[0]);
    }
  }
  
  updateElectricArcs(deltaTime) {
    // Calculer les valeurs dynamiques basées sur les pourcentages
    const baseFrequency = this.config.arcFrequency * (1 + this.config.arcFrequencyVariation);
    
    // Variation de fréquence temporelle (50% du temps à 70%, 50% à 300%)
    const freqMultiplier = Math.random() < this.config.arcFrequencyLowProbability ? 
      this.config.arcFrequencyLowValue : 
      this.config.arcFrequencyHighValue;
    
    const currentFrequency = baseFrequency * freqMultiplier;
    const currentMaxArcs = Math.floor(10 + (this.config.arcCountVariation * 20)); // 10-30 arcs
    const currentIntensity = 5.0 + (this.config.arcIntensityVariation * 15.0); // 5.0-20.0
    
    // Créer de nouveaux arcs électriques aléatoirement
    if (this.config.arcsEnabled && 
        Math.random() < currentFrequency && 
        this.electricArcs.length < currentMaxArcs) {
      
      // Choisir deux particules proches pour créer un arc
      const particlesInRange = [];
      const useFrustumCulling = this.config.particleCount > 400;
      
      // Pour les gros systèmes, ne considérer que les particules visibles pour les arcs
      const particlesToCheck = useFrustumCulling ? 
        this.particles.filter(particle => particle.visible) : 
        this.particles;
      
      for (let i = 0; i < particlesToCheck.length; i++) {
        for (let j = i + 1; j < particlesToCheck.length; j++) {
          const distance = particlesToCheck[i].position.distanceTo(particlesToCheck[j].position);
          if (distance < this.config.arcDistance && distance > 0.5) {
            particlesInRange.push({
              from: particlesToCheck[i],
              to: particlesToCheck[j],
              distance: distance
            });
          }
        }
      }
      
      if (particlesInRange.length > 0) {
        const selected = particlesInRange[Math.floor(Math.random() * particlesInRange.length)];
        
        // Créer un arc électrique avec le type sélectionné
        const segments = this.generateElectricArcPath(selected.from.position, selected.to.position, this.config.arcType);
        
        // Déterminer la couleur de l'arc (toujours basé sur le mode de sécurité)
        const baseColor = new THREE.Color(this.securityColors[this.currentSecurityMode]);
        let arcColor;
        
        // Pour le mode NORMAL, couleur pure à 100%
        if (this.currentSecurityMode === 'NORMAL') {
          arcColor = baseColor;
        } else {
          // Pour les autres modes, mélanger avec du blanc selon le pourcentage (35% par défaut)
          const whiteColor = new THREE.Color(0xffffff);
          arcColor = baseColor.clone().lerp(whiteColor, this.config.arcWhitePercentage);
        }
        
        this.electricArcs.push({
          from: selected.from,
          to: selected.to,
          segments: segments,
          lifetime: 0,
          maxLifetime: this.config.arcLifetime,
          intensity: currentIntensity * this.getCurrentIntensityMultiplier(),
          baseIntensity: currentIntensity,
          color: arcColor,
          flickering: 0
        });
      }
    }
    
    // Mettre à jour les arcs existants
    this.electricArcs = this.electricArcs.filter(arc => {
      arc.lifetime += deltaTime * 1000; // Convertir en ms
      arc.flickering += deltaTime * 10;
      
      // Faire scintiller l'arc
      arc.intensity = arc.baseIntensity * (0.5 + 0.5 * Math.sin(arc.flickering));
      
      // Régénérer le chemin périodiquement pour l'effet de foudre
      if (Math.random() < 0.1) {
        arc.segments = this.generateElectricArcPath(arc.from.position, arc.to.position, this.config.arcType);
      }
      
      return arc.lifetime < arc.maxLifetime;
    });
  }
  
  generateElectricArcPath(from, to, type = 'smooth') {
    const segments = [];
    const segmentCount = type === 'fractal' ? 12 : 8; // Plus de segments pour fractal
    
    switch (type) {
      case 'smooth': // Arc lisse avec courbe sinusoïdale
        for (let i = 0; i < segmentCount; i++) {
          const t1 = i / segmentCount;
          const t2 = (i + 1) / segmentCount;
          
          const pos1 = from.clone().lerp(to, t1);
          const pos2 = from.clone().lerp(to, t2);
          
          // Courbe sinusoïdale perpendiculaire à la ligne
          const direction = to.clone().sub(from).normalize();
          const perpendicular = new THREE.Vector3(-direction.y, direction.x, 0).normalize();
          
          const wave1 = Math.sin(t1 * Math.PI * 2) * 0.2;
          const wave2 = Math.sin(t2 * Math.PI * 2) * 0.2;
          
          pos1.add(perpendicular.clone().multiplyScalar(wave1));
          pos2.add(perpendicular.clone().multiplyScalar(wave2));
          
          segments.push({ start: pos1, end: pos2 });
        }
        break;
        
      case 'fractal': // Arc avec branches fractales
        // Ligne principale
        for (let i = 0; i < segmentCount; i++) {
          const t1 = i / segmentCount;
          const t2 = (i + 1) / segmentCount;
          
          const pos1 = from.clone().lerp(to, t1);
          const pos2 = from.clone().lerp(to, t2);
          
          segments.push({ start: pos1, end: pos2 });
          
          // Ajouter des branches fractales
          if (Math.random() < 0.3 && i > 1 && i < segmentCount - 2) {
            const branchLength = 0.3;
            const branchAngle = (Math.random() - 0.5) * Math.PI;
            const branchEnd = pos1.clone();
            branchEnd.x += Math.cos(branchAngle) * branchLength;
            branchEnd.y += Math.sin(branchAngle) * branchLength;
            branchEnd.z += (Math.random() - 0.5) * branchLength;
            
            segments.push({ start: pos1, end: branchEnd });
          }
        }
        break;
        
      case 'pulse': // Arc pulsé avec épaisseur variable
        for (let i = 0; i < segmentCount; i++) {
          const t1 = i / segmentCount;
          const t2 = (i + 1) / segmentCount;
          
          const pos1 = from.clone().lerp(to, t1);
          const pos2 = from.clone().lerp(to, t2);
          
          // Pulse basé sur la position
          const pulse = Math.sin(t1 * Math.PI * 3) * 0.2;
          pos1.y += pulse;
          pos2.y += Math.sin(t2 * Math.PI * 3) * 0.2;
          
          segments.push({ start: pos1, end: pos2, pulse: Math.abs(pulse) });
        }
        break;
        
      case 'fractal-pulse': // Combinaison Fractal + Pulsé
        // Ligne principale pulsée
        for (let i = 0; i < segmentCount; i++) {
          const t1 = i / segmentCount;
          const t2 = (i + 1) / segmentCount;
          
          const pos1 = from.clone().lerp(to, t1);
          const pos2 = from.clone().lerp(to, t2);
          
          // Pulse basé sur la position
          const pulse1 = Math.sin(t1 * Math.PI * 3) * 0.2;
          const pulse2 = Math.sin(t2 * Math.PI * 3) * 0.2;
          pos1.y += pulse1;
          pos2.y += pulse2;
          
          segments.push({ start: pos1, end: pos2, pulse: Math.abs(pulse1) });
          
          // Ajouter des branches fractales pulsées
          if (Math.random() < 0.25 && i > 1 && i < segmentCount - 2) {
            const branchLength = 0.25 + Math.abs(pulse1) * 0.2; // Longueur variable selon pulse
            const branchAngle = (Math.random() - 0.5) * Math.PI;
            const branchEnd = pos1.clone();
            branchEnd.x += Math.cos(branchAngle) * branchLength;
            branchEnd.y += Math.sin(branchAngle) * branchLength + pulse1 * 0.5;
            branchEnd.z += (Math.random() - 0.5) * branchLength;
            
            segments.push({ start: pos1, end: branchEnd, pulse: Math.abs(pulse1) * 0.7 });
          }
        }
        break;
        
      case 'fractal-smooth': // Combinaison Fractal + Lisse
        // Ligne principale lisse
        for (let i = 0; i < segmentCount; i++) {
          const t1 = i / segmentCount;
          const t2 = (i + 1) / segmentCount;
          
          const pos1 = from.clone().lerp(to, t1);
          const pos2 = from.clone().lerp(to, t2);
          
          // Courbe sinusoïdale perpendiculaire à la ligne
          const direction = to.clone().sub(from).normalize();
          const perpendicular = new THREE.Vector3(-direction.y, direction.x, 0).normalize();
          
          const wave1 = Math.sin(t1 * Math.PI * 2) * 0.15; // Vague plus subtile
          const wave2 = Math.sin(t2 * Math.PI * 2) * 0.15;
          
          pos1.add(perpendicular.clone().multiplyScalar(wave1));
          pos2.add(perpendicular.clone().multiplyScalar(wave2));
          
          segments.push({ start: pos1, end: pos2 });
          
          // Ajouter des branches fractales fluides
          if (Math.random() < 0.3 && i > 1 && i < segmentCount - 2) {
            const branchLength = 0.2 + Math.abs(wave1) * 0.3; // Longueur basée sur la vague
            const branchAngle = (Math.random() - 0.5) * Math.PI * 0.8; // Angle plus doux
            const branchEnd = pos1.clone();
            
            // Branches suivant la courbe principale
            const branchPerpendicular = perpendicular.clone().multiplyScalar(Math.cos(branchAngle) * branchLength);
            const branchForward = direction.clone().multiplyScalar(Math.sin(branchAngle) * branchLength);
            
            branchEnd.add(branchPerpendicular).add(branchForward);
            branchEnd.y += wave1 * 0.5; // Suivre légèrement la vague
            
            segments.push({ start: pos1, end: branchEnd });
          }
        }
        break;
        
      default: // Fallback vers smooth
        return this.generateElectricArcPath(from, to, 'smooth');
    }
    
    return segments;
  }
  
  updateArcBuffer() {
    const positions = this.arcGeometry.attributes.position.array;
    const colors = this.arcGeometry.attributes.color.array;
    
    let index = 0;
    
    this.electricArcs.forEach(arc => {
      arc.segments.forEach(segment => {
        if (index * 6 + 5 < positions.length) {
          // Position de départ du segment
          positions[index * 6] = segment.start.x;
          positions[index * 6 + 1] = segment.start.y;
          positions[index * 6 + 2] = segment.start.z;
          
          // Position de fin du segment
          positions[index * 6 + 3] = segment.end.x;
          positions[index * 6 + 4] = segment.end.y;
          positions[index * 6 + 5] = segment.end.z;
          
          // Couleur avec intensité scintillante
          const intensity = arc.intensity;
          
          // Couleur de départ
          colors[index * 6] = arc.color.r * intensity;
          colors[index * 6 + 1] = arc.color.g * intensity;
          colors[index * 6 + 2] = arc.color.b * intensity;
          
          // Couleur de fin
          colors[index * 6 + 3] = arc.color.r * intensity;
          colors[index * 6 + 4] = arc.color.g * intensity;
          colors[index * 6 + 5] = arc.color.b * intensity;
          
          index++;
        }
      });
    });
    
    // Réinitialiser le reste du buffer
    for (let i = index * 6; i < positions.length; i++) {
      positions[i] = 0;
      colors[i] = 0;
    }
    
    this.arcGeometry.attributes.position.needsUpdate = true;
    this.arcGeometry.attributes.color.needsUpdate = true;
    
    // Optimisation : limiter le drawRange
    this.arcGeometry.setDrawRange(0, index * 2);
  }
  
  updateParticleBuffer() {
    const positions = this.particleGeometry.attributes.position.array;
    const colors = this.particleGeometry.attributes.color.array;
    
    this.particles.forEach((particle, i) => {
      positions[i * 3] = particle.position.x;
      positions[i * 3 + 1] = particle.position.y;
      positions[i * 3 + 2] = particle.position.z;
      
      // Couleur avec intensité pour les signaux
      let intensity = 1;
      
      // Vérifier si la particule reçoit un signal
      this.signals.forEach(signal => {
        const signalPosition = signal.from.position.clone().lerp(
          signal.to.position,
          signal.progress
        );
        
        const distance = particle.position.distanceTo(signalPosition);
        if (distance < 0.3) {
          intensity = signal.intensity;
        }
      });
      
      colors[i * 3] = particle.color.r * intensity;
      colors[i * 3 + 1] = particle.color.g * intensity;
      colors[i * 3 + 2] = particle.color.b * intensity;
    });
    
    this.particleGeometry.attributes.position.needsUpdate = true;
    this.particleGeometry.attributes.color.needsUpdate = true;
  }
  
  updateConnectionBuffer() {
    // Vérifier que la géométrie existe avant de l'utiliser
    if (!this.connectionGeometry || !this.connectionGeometry.attributes) {
      return;
    }
    
    const positions = this.connectionGeometry.attributes.position.array;
    const colors = this.connectionGeometry.attributes.color.array;
    
    let index = 0;
    
    this.connections.forEach(connection => {
      // Position de départ
      positions[index * 6] = connection.from.position.x;
      positions[index * 6 + 1] = connection.from.position.y;
      positions[index * 6 + 2] = connection.from.position.z;
      
      // Position d'arrivée
      positions[index * 6 + 3] = connection.to.position.x;
      positions[index * 6 + 4] = connection.to.position.y;
      positions[index * 6 + 5] = connection.to.position.z;
      
      // Couleur avec opacité basée sur la distance
      const color = connection.color;
      const opacity = connection.opacity * this.config.connectionOpacity;
      
      // Couleur de départ
      colors[index * 6] = color.r * opacity;
      colors[index * 6 + 1] = color.g * opacity;
      colors[index * 6 + 2] = color.b * opacity;
      
      // Couleur d'arrivée
      colors[index * 6 + 3] = color.r * opacity;
      colors[index * 6 + 4] = color.g * opacity;
      colors[index * 6 + 5] = color.b * opacity;
      
      index++;
    });
    
    // Réinitialiser le reste du buffer
    for (let i = index * 6; i < positions.length; i++) {
      positions[i] = 0;
      colors[i] = 0;
    }
    
    this.connectionGeometry.attributes.position.needsUpdate = true;
    this.connectionGeometry.attributes.color.needsUpdate = true;
    
    // Optimisation : limiter le drawRange
    this.connectionGeometry.setDrawRange(0, index * 2);
  }
  
  // API publique pour contrôles
  
  setConfig(newConfig) {
    Object.assign(this.config, newConfig);
  }
  
  setParticleCount(count) {
    // TODO: Implémenter le changement dynamique du nombre de particules
    this.config.particleCount = count;
  }
  
  setGravity(x, y, z) {
    this.config.gravity.x = x;
    this.config.gravity.y = y;
    this.config.gravity.z = z;
  }
  
  addAttractor(position, force) {
    // TODO: Implémenter les attracteurs dynamiques
    console.log('Attracteur ajouté:', position, force);
  }
  
  addRepulsor(position, force) {
    // TODO: Implémenter les répulseurs dynamiques  
    console.log('Répulseur ajouté:', position, force);
  }
  
  // Contrôles des signaux
  setSignalEnabled(enabled) {
    this.config.signalEnabled = enabled;
  }
  
  setSignalFrequency(frequency) {
    this.config.signalFrequency = frequency;
  }
  
  // Contrôles des arcs électriques
  setArcsEnabled(enabled) {
    this.config.arcsEnabled = enabled;
  }
  
  setArcCount(count) {
    this.config.arcCount = count;
  }
  
  setArcIntensity(intensity) {
    this.config.arcIntensity = intensity;
  }
  
  setArcColor(color) {
    this.config.arcColor = color;
  }
  
  setArcFrequency(frequency) {
    this.config.arcFrequency = frequency;
  }
  
  triggerSignalWave(origin, radius, intensity) {
    // Déclencher une vague de signaux depuis un point
    this.particles.forEach(particle => {
      const distance = particle.position.distanceTo(origin);
      
      if (distance < radius) {
        // Trouver toutes les connexions de cette particule
        const connections = this.connections.filter(
          conn => conn.from === particle || conn.to === particle
        );
        
        connections.forEach(connection => {
          if (Math.random() < intensity) {
            this.signals.push({
              from: particle,
              to: connection.from === particle ? connection.to : connection.from,
              progress: 0,
              color: new THREE.Color(this.config.signalColor),
              intensity: this.config.signalIntensity * intensity
            });
          }
        });
      }
    });
  }
  
  // Méthodes de contrôle pour les arcs
  setArcColorMode(mode) {
    console.log(`🎨 ParticleSystemV2: Changement mode couleur arcs: ${this.config.arcColorMode} → ${mode}`);
    this.config.arcColorMode = mode;
    
    // Mettre à jour les arcs existants si on change de mode
    // ✅ SUPPRIMÉ : Log pour réduire spam console
    this.electricArcs.forEach((arc, index) => {
      if (mode === 'security') {
        const securityColor = this.securityColors[this.currentSecurityMode];
        arc.color = new THREE.Color(securityColor);
        console.log(`  Arc ${index}: couleur sécurité → #${securityColor.toString(16).padStart(6, '0')} (${this.currentSecurityMode})`);
      } else {
        const randomHue = Math.random();
        arc.color = new THREE.Color().setHSL(randomHue, 0.8, 0.6);
        console.log(`  Arc ${index}: couleur RGB → HSL(${(randomHue * 360).toFixed(0)}°, 80%, 60%)`);
      }
    });
  }
  
  setArcWhitePercentage(percentage) {
    console.log(`🎨 ParticleSystemV2: Changement pourcentage blanc arcs: ${this.config.arcWhitePercentage} → ${percentage}`);
    this.config.arcWhitePercentage = THREE.MathUtils.clamp(percentage, 0, 1);
    
    // Mettre à jour les arcs existants en mode sécurité
    this.updateExistingArcsColor();
  }
  
  setArcType(type) {
    const validTypes = ['smooth', 'fractal', 'pulse', 'fractal-pulse', 'fractal-smooth'];
    if (validTypes.includes(type)) {
      console.log(`⚡ ParticleSystemV2: Changement type d'arc: ${this.config.arcType} → ${type}`);
      this.config.arcType = type;
    } else {
      console.warn(`⚠️ Type d'arc invalide: ${type}, utilisation de 'smooth'`);
      this.config.arcType = 'smooth';
    }
  }
  
  updateExistingArcsColor() {
    if (this.config.arcColorMode === 'security' && this.currentSecurityMode !== 'NORMAL') {
      const baseColor = new THREE.Color(this.securityColors[this.currentSecurityMode]);
      const whiteColor = new THREE.Color(0xffffff);
      
      this.electricArcs.forEach((arc) => {
        const mixedColor = baseColor.clone().lerp(whiteColor, this.config.arcWhitePercentage);
        arc.color = mixedColor;
      });
    }
  }
  
  setSecurityMode(mode) {
    // ✅ SUPPRIMÉ : Log pour réduire spam console
    this.currentSecurityMode = mode;
    
    // Vérifier que le mode existe
    if (!this.securityColors[mode]) {
      console.warn(`⚠️ Mode de sécurité inconnu: ${mode}, utilisation de NORMAL`);
      mode = 'NORMAL';
    }
    
    const securityColor = this.securityColors[mode];
    // ✅ SUPPRIMÉ : Log pour réduire spam console
    
    // Mettre à jour la couleur des arcs si on est en mode sécurité
    if (this.config.arcColorMode === 'security') {
      // ✅ SUPPRIMÉ : Log pour réduire spam console
      
      if (mode === 'NORMAL') {
        // Mode NORMAL : couleur pure à 100%
        this.electricArcs.forEach((arc) => {
          arc.color = new THREE.Color(securityColor);
          // ✅ SUPPRIMÉ : Log pour réduire spam console
        });
      } else {
        // Autres modes : appliquer le pourcentage de blanc
        this.updateExistingArcsColor();
      }
    } else {
      console.log('💡 Mode couleur arcs: RGB (pas de changement)');
    }
  }
  
  setArcCountVariation(variation) {
    this.config.arcCountVariation = THREE.MathUtils.clamp(variation, 0, 1);
  }
  
  setArcIntensityVariation(variation) {
    this.config.arcIntensityVariation = THREE.MathUtils.clamp(variation, 0, 1);
  }
  
  setArcFrequencyVariation(variation) {
    this.config.arcFrequencyVariation = THREE.MathUtils.clamp(variation, 0, 3);
  }
  
  // Contrôles pour particules et connexions
  setParticleCountRange(min, max) {
    this.config.particleCountMin = Math.max(900, min);
    this.config.particleCountMax = Math.min(1250, max);
    // Générer un nouveau nombre aléatoire dans la plage
    this.config.particleCount = Math.floor(this.config.particleCountMin + 
      Math.random() * (this.config.particleCountMax - this.config.particleCountMin));
  }
  
  setConnectionDistanceRange(min, max) {
    this.config.connectionDistanceMin = Math.max(0.8, min);
    this.config.connectionDistanceMax = Math.min(8.0, max);
    // Générer une nouvelle distance aléatoire
    this.config.connectionDistance = this.config.connectionDistanceMin + 
      Math.random() * (this.config.connectionDistanceMax - this.config.connectionDistanceMin);
  }
  
  setParticleSizeMultiplier(multiplier) {
    this.config.particleSizeMultiplier = THREE.MathUtils.clamp(multiplier, 0.1, 5.0);
    
    // Mettre à jour le matériau des particules (taille globale)
    if (this.particleMaterial) {
      this.particleMaterial.size = 0.2 * this.config.particleSizeMultiplier;
      this.particleMaterial.needsUpdate = true;
    }
    
    // Mettre à jour les tailles individuelles des particules
    this.particles.forEach(particle => {
      particle.size = particle.baseSize * this.config.particleSizeMultiplier;
    });
  }
  
  setParticleColor(color) {
    this.config.particleColor = color;
    
    // Créer nuances de couleurs : 70% couleur de base + 30% variations
    this.updateParticleColors(color);
    
    console.log(`🎨 Couleur particules mise à jour avec nuances: #${color.toString(16).padStart(6, '0')}`);
  }
  
  updateParticleColors(baseColor) {
    if (!this.particleGeometry || !this.particles.length) return;
    
    const baseColorObj = new THREE.Color(baseColor);
    const colorAttribute = this.particleGeometry.getAttribute('color');
    const colors = colorAttribute.array;
    
    for (let i = 0; i < this.particles.length; i++) {
      const colorIndex = i * 3;
      
      // 70% des particules gardent la couleur de base
      if (i < this.particles.length * 0.7) {
        colors[colorIndex] = baseColorObj.r;
        colors[colorIndex + 1] = baseColorObj.g; 
        colors[colorIndex + 2] = baseColorObj.b;
      }
      // 30% restantes : nuances avec variations subtiles
      else {
        const variation = (i - this.particles.length * 0.7) / (this.particles.length * 0.3);
        
        // Créer nuance plus claire ou plus sombre
        const nuancedColor = baseColorObj.clone();
        
        if (variation < 0.33) {
          // 10% plus claires
          nuancedColor.multiplyScalar(1.2);
        } else if (variation < 0.66) {
          // 10% plus sombres  
          nuancedColor.multiplyScalar(0.8);
        } else {
          // 10% avec légère teinte
          nuancedColor.offsetHSL(0.05, 0.1, 0.05);
        }
        
        colors[colorIndex] = Math.min(nuancedColor.r, 1.0);
        colors[colorIndex + 1] = Math.min(nuancedColor.g, 1.0);
        colors[colorIndex + 2] = Math.min(nuancedColor.b, 1.0);
      }
    }
    
    colorAttribute.needsUpdate = true;
  }
  
  setConnectionWidth(width) {
    this.config.connectionWidth = THREE.MathUtils.clamp(width, 0.5, 20.0); // ✅ Max 20px
    
    // Mettre à jour simplement la propriété linewidth du material
    if (this.connectionMaterial) {
      this.connectionMaterial.linewidth = this.config.connectionWidth;
      // Note: linewidth > 1 ne fonctionne pas sur tous les navigateurs/GPU
      // mais on laisse la valeur pour ceux qui le supportent
    }
  }
  
  setConnectionColor(color) {
    this.config.connectionColor = color;
    // Forcer une mise à jour des connexions
    this.updateConnections();
  }
  
  disposeConnectionSystem() {
    if (this.connectionMesh) {
      this.scene.remove(this.connectionMesh);
      this.connectionMesh = null;
    }
    if (this.connectionGroup) {
      this.scene.remove(this.connectionGroup);
      this.connectionGroup = null;
      this.connectionCylinders = [];
    }
    if (this.connectionGeometry) {
      this.connectionGeometry.dispose();
      this.connectionGeometry = null;
    }
    if (this.connectionMaterial) {
      this.connectionMaterial.dispose();
      this.connectionMaterial = null;
    }
  }
  
  randomizeParticleCount() {
    this.config.particleCount = Math.floor(this.config.particleCountMin + 
      Math.random() * (this.config.particleCountMax - this.config.particleCountMin));
  }
  
  randomizeConnectionDistance() {
    this.config.connectionDistance = this.config.connectionDistanceMin + 
      Math.random() * (this.config.connectionDistanceMax - this.config.connectionDistanceMin);
  }
  
  // Ajuster la fréquence de frustum culling basée sur la performance
  setVisibilityUpdateFrequency(frequency) {
    this.visibilityUpdateFrequency = Math.max(1, Math.min(10, frequency));
  }
  
  getVisibilityStats() {
    if (this.visibleParticles.length === 0) return null;
    
    const visibilityRatio = this.visibleParticles.length / this.particles.length;
    return {
      totalParticles: this.particles.length,
      visibleParticles: this.visibleParticles.length,
      visibilityRatio: visibilityRatio,
      cullingEnabled: this.config.particleCount > 300, // Activer le culling au-delà de 300 particules
      updateFrequency: this.visibilityUpdateFrequency
    };
  }
  
  
  dispose() {
    if (this.particleGeometry) this.particleGeometry.dispose();
    if (this.particleMaterial) this.particleMaterial.dispose();
    if (this.arcGeometry) this.arcGeometry.dispose();
    if (this.arcMaterial) this.arcMaterial.dispose();
    
    // Utiliser la nouvelle méthode pour dispose des connexions
    this.disposeConnectionSystem();
    
    // Dispose des lumières navigantes
    if (this.travelingLightMesh) {
      if (this.travelingLightMesh.geometry) this.travelingLightMesh.geometry.dispose();
      if (this.travelingLightMaterial) this.travelingLightMaterial.dispose();
      this.scene.remove(this.travelingLightMesh);
    }
    
    // 🔮 Supprimer la sphère de debug
    if (this.debugSphere) {
      this.debugSphere.geometry.dispose();
      this.debugSphere.material.dispose();
      this.scene.remove(this.debugSphere);
      
      const centerMarker = this.scene.getObjectByName('ParticleZoneCenterMarker');
      if (centerMarker) {
        centerMarker.geometry.dispose();
        centerMarker.material.dispose();
        this.scene.remove(centerMarker);
      }
    }
    
    if (this.particleMesh) this.scene.remove(this.particleMesh);
    if (this.arcMesh) this.scene.remove(this.arcMesh);
  }
}