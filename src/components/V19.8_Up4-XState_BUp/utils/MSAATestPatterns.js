// 🎯 MSAA Test Patterns - Objects pour visualiser l'anti-aliasing
import * as THREE from 'three';

/**
 * MSAATestPatterns - Générateur d'objets de test pour visualiser l'efficacité MSAA
 * Ces objets mettent en évidence les différences avec/sans anti-aliasing
 */
export class MSAATestPatterns {
  constructor() {
    this.patterns = new Map();
    this.isVisible = false;
  }

  /**
   * Crée des motifs géométriques avec bords fins pour test MSAA
   */
  createGeometricPatterns(scene) {
    const group = new THREE.Group();
    group.name = 'MSAATestPatterns';

    // 🔍 1. Grille fine avec lignes diagonales (test aliasing géométrique)
    const gridGeometry = new THREE.PlaneGeometry(4, 4, 32, 32);
    const gridMaterial = new THREE.MeshBasicMaterial({ 
      color: 0xffffff, 
      wireframe: true,
      transparent: true,
      opacity: 0.8
    });
    const gridMesh = new THREE.Mesh(gridGeometry, gridMaterial);
    gridMesh.position.set(-3, 2, 0);
    gridMesh.rotation.z = Math.PI / 4; // Rotation pour créer aliasing
    group.add(gridMesh);

    // 🎯 2. Étoiles avec arêtes fines (test MSAA sur géométrie complexe)
    for (let i = 0; i < 5; i++) {
      const starGeometry = this.createStarGeometry(0.3, 0.6, 8);
      const starMaterial = new THREE.MeshBasicMaterial({ 
        color: new THREE.Color().setHSL(i * 0.2, 0.8, 0.6),
        transparent: true,
        opacity: 0.9
      });
      const starMesh = new THREE.Mesh(starGeometry, starMaterial);
      starMesh.position.set(
        Math.cos(i * Math.PI * 2 / 5) * 2,
        Math.sin(i * Math.PI * 2 / 5) * 2,
        0
      );
      starMesh.rotation.z = i * 0.3;
      group.add(starMesh);
    }

    // 📐 3. Ligne fine rotative (test ultime MSAA)
    const lineGeometry = new THREE.BufferGeometry();
    const linePoints = [];
    for (let i = 0; i <= 100; i++) {
      const angle = (i / 100) * Math.PI * 4;
      const radius = 1 + Math.sin(angle * 3) * 0.3;
      linePoints.push(
        Math.cos(angle) * radius,
        Math.sin(angle) * radius,
        0
      );
    }
    lineGeometry.setAttribute('position', new THREE.Float32BufferAttribute(linePoints, 3));
    
    const lineMaterial = new THREE.LineBasicMaterial({ 
      color: 0xff4444,
      linewidth: 1 // Ligne fine = aliasing visible
    });
    const lineMesh = new THREE.Line(lineGeometry, lineMaterial);
    lineMesh.position.set(3, -2, 0);
    group.add(lineMesh);

    // 🔳 4. Carré avec texture checkerboard haute fréquence (test FXAA)
    const checkerCanvas = this.createCheckerboardTexture(256, 16);
    const checkerTexture = new THREE.CanvasTexture(checkerCanvas);
    checkerTexture.minFilter = THREE.NearestFilter;
    checkerTexture.magFilter = THREE.NearestFilter;
    
    const checkerGeometry = new THREE.PlaneGeometry(2, 2);
    const checkerMaterial = new THREE.MeshBasicMaterial({ 
      map: checkerTexture,
      transparent: true,
      opacity: 0.8
    });
    const checkerMesh = new THREE.Mesh(checkerGeometry, checkerMaterial);
    checkerMesh.position.set(0, -3, 0);
    checkerMesh.rotation.z = Math.PI / 8; // Légère rotation pour aliasing texture
    group.add(checkerMesh);

    // 🎪 5. Spirale avec dégradé (test shaders)
    const spiralGeometry = new THREE.RingGeometry(0.5, 1.5, 32);
    const spiralMaterial = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 }
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float time;
        varying vec2 vUv;
        void main() {
          vec2 center = vUv - 0.5;
          float angle = atan(center.y, center.x);
          float radius = length(center);
          
          float spiral = sin(angle * 8.0 - radius * 20.0 + time) * 0.5 + 0.5;
          vec3 color = mix(vec3(1.0, 0.2, 0.5), vec3(0.2, 0.8, 1.0), spiral);
          
          gl_FragColor = vec4(color, 0.8);
        }
      `,
      transparent: true
    });
    const spiralMesh = new THREE.Mesh(spiralGeometry, spiralMaterial);
    spiralMesh.position.set(-2, -2, 0);
    group.add(spiralMesh);

    // Animation du shader
    const animateSpiral = () => {
      spiralMaterial.uniforms.time.value += 0.02;
      requestAnimationFrame(animateSpiral);
    };
    animateSpiral();

    this.patterns.set('geometric', group);
    scene.add(group);
    group.visible = false;

    console.log('✅ MSAA Test Patterns créés: 5 motifs de test anti-aliasing');
    return group;
  }

  /**
   * Crée une géométrie d'étoile avec arêtes fines
   */
  createStarGeometry(innerRadius, outerRadius, points) {
    const geometry = new THREE.BufferGeometry();
    const vertices = [];
    const indices = [];

    // Centre
    vertices.push(0, 0, 0);

    // Points de l'étoile
    for (let i = 0; i < points * 2; i++) {
      const angle = (i * Math.PI) / points;
      const radius = i % 2 === 0 ? outerRadius : innerRadius;
      
      vertices.push(
        Math.cos(angle) * radius,
        Math.sin(angle) * radius,
        0
      );
    }

    // Triangles
    for (let i = 1; i <= points * 2; i++) {
      const next = i + 1 > points * 2 ? 1 : i + 1;
      indices.push(0, i, next);
    }

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();

    return geometry;
  }

  /**
   * Crée une texture checkerboard haute fréquence pour test FXAA
   */
  createCheckerboardTexture(size, divisions) {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    
    const context = canvas.getContext('2d');
    const cellSize = size / divisions;
    
    for (let i = 0; i < divisions; i++) {
      for (let j = 0; j < divisions; j++) {
        context.fillStyle = (i + j) % 2 === 0 ? '#ffffff' : '#000000';
        context.fillRect(i * cellSize, j * cellSize, cellSize, cellSize);
      }
    }
    
    return canvas;
  }

  /**
   * Crée des textes avec polices fines pour test anti-aliasing text
   */
  createTextPatterns(scene) {
    const _loader = new THREE.FontLoader();
    
    // Note: Nécessite une police, ici on simule avec des formes géométriques
    const textGroup = new THREE.Group();
    textGroup.name = 'MSAATextPatterns';

    // Simulation de texte avec des rectangles fins
    const letters = ['M', 'S', 'A', 'A'];
    letters.forEach((letter, index) => {
      const letterGroup = this.createLetterShape(letter);
      letterGroup.position.x = index * 1.2 - 1.8;
      letterGroup.position.y = 1;
      textGroup.add(letterGroup);
    });

    this.patterns.set('text', textGroup);
    scene.add(textGroup);
    textGroup.visible = false;

    return textGroup;
  }

  /**
   * Crée une forme simulant une lettre avec des lignes fines
   */
  createLetterShape(letter) {
    const group = new THREE.Group();
    const material = new THREE.MeshBasicMaterial({ color: 0x00ff88 });

    switch (letter) {
      case 'M':
        // Forme en M avec barres fines
        [
          [0, 0, 0.1, 1], // Gauche
          [0.4, 0, 0.1, 1], // Droite
          [0.05, 0.8, 0.3, 0.1], // Haut gauche
          [0.15, 0.6, 0.2, 0.1]  // Haut droite
        ].forEach(([x, y, w, h]) => {
          const geo = new THREE.PlaneGeometry(w, h);
          const mesh = new THREE.Mesh(geo, material);
          mesh.position.set(x, y, 0);
          group.add(mesh);
        });
        break;
        
      case 'S': {
        // Forme en S simplifiée
        const sGeometry = new THREE.RingGeometry(0.2, 0.3, 16, 1, 0, Math.PI);
        const sMesh1 = new THREE.Mesh(sGeometry, material);
        sMesh1.position.y = 0.3;
        const sMesh2 = new THREE.Mesh(sGeometry, material);
        sMesh2.position.y = -0.3;
        sMesh2.rotation.z = Math.PI;
        group.add(sMesh1, sMesh2);
        break;
      }
        
      case 'A': {
        // Forme en A avec triangle et barre
        const aGeometry = new THREE.ConeGeometry(0.3, 1, 3);
        const aMesh = new THREE.Mesh(aGeometry, material);
        aMesh.rotation.z = Math.PI;
        const barGeometry = new THREE.PlaneGeometry(0.4, 0.05);
        const barMesh = new THREE.Mesh(barGeometry, material);
        barMesh.position.y = -0.2;
        group.add(aMesh, barMesh);
        break;
      }
    }

    return group;
  }

  /**
   * Toggle visibilité des patterns de test
   */
  setVisible(visible) {
    this.isVisible = visible;
    this.patterns.forEach(pattern => {
      pattern.visible = visible;
    });
    
    console.log(`🎯 MSAA Test Patterns: ${visible ? 'visible' : 'masqué'}`);
  }

  /**
   * Nettoyage des patterns
   */
  dispose() {
    this.patterns.forEach(pattern => {
      pattern.traverse(child => {
        if (child.geometry) child.geometry.dispose();
        if (child.material) {
          if (child.material.map) child.material.map.dispose();
          child.material.dispose();
        }
      });
      
      if (pattern.parent) {
        pattern.parent.remove(pattern);
      }
    });
    
    this.patterns.clear();
    console.log('🧹 MSAA Test Patterns nettoyés');
  }

  /**
   * Animation des patterns pour test mouvement
   */
  animate(deltaTime) {
    this.patterns.forEach((pattern, name) => {
      if (name === 'geometric') {
        pattern.rotation.y += deltaTime * 0.5;
        
        // Rotation individuelle des étoiles
        pattern.children.forEach((child, index) => {
          if (child.geometry && child.geometry.type !== 'PlaneGeometry') {
            child.rotation.z += deltaTime * (index + 1) * 0.3;
          }
        });
      }
      
      if (name === 'text') {
        pattern.position.y = Math.sin(Date.now() * 0.001) * 0.2 + 1;
      }
    });
  }
}

// Export convenience function
export function createMSAATestPatterns(scene) {
  const patterns = new MSAATestPatterns();
  patterns.createGeometricPatterns(scene);
  patterns.createTextPatterns(scene);
  return patterns;
}