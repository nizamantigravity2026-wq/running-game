import * as THREE from 'three';
import { EnvironmentTheme } from './types';
import { ENVIRONMENTS, EnvironmentConfig } from './constants';

interface SkyVehicle {
  mesh: THREE.Group;
  speed: number;
  minZ: number;
  maxZ: number;
  initialX: number;
  initialY: number;
  direction: 1 | -1;
}

interface BeaconLight {
  mesh: THREE.Mesh;
  offset: number;
  baseColor: number;
}

interface SearchLight {
  mesh: THREE.Mesh;
  speed: number;
  phase: number;
}

export class BackgroundManager {
  public group: THREE.Group;
  private scene: THREE.Scene;
  private currentTheme: EnvironmentTheme = 'NEO_VANGUARD';
  private envConfig: EnvironmentConfig;

  // Sky elements
  private starPoints: THREE.Points;
  private nebulaMesh: THREE.Mesh;
  private planetGroup: THREE.Group;
  private planetMesh: THREE.Mesh;
  private planetRings: THREE.Mesh;
  private planetMaterial: THREE.MeshStandardMaterial;
  private ringMaterial: THREE.MeshBasicMaterial;

  // Horizon City elements
  private cityGroup: THREE.Group;
  private buildings: THREE.Mesh[] = [];
  private beaconLights: BeaconLight[] = [];
  private windowMaterial: THREE.MeshStandardMaterial;

  // Sky Traffic
  private trafficGroup: THREE.Group;
  private vehicles: SkyVehicle[] = [];

  // Sector-specific props
  private orbitalRingGroup: THREE.Group;
  private asteroidGroup: THREE.Group;
  private holographicBillboards: THREE.Group[] = [];
  private searchlights: SearchLight[] = [];

  constructor(scene: THREE.Scene, initialTheme: EnvironmentTheme = 'NEO_VANGUARD') {
    this.scene = scene;
    this.currentTheme = initialTheme;
    this.envConfig = ENVIRONMENTS[initialTheme];
    this.group = new THREE.Group();

    // 1. Starfield
    this.starPoints = this.createStarfield();
    this.group.add(this.starPoints);

    // 2. Cosmic Nebula Dome
    this.nebulaMesh = this.createNebulaDome();
    this.group.add(this.nebulaMesh);

    // 3. Giant Celestial Body (Ringed Exoplanet / Orbital Moon)
    const { planetGroup, planetMesh, ringsMesh, planetMat, ringMat } = this.createExoplanet();
    this.planetGroup = planetGroup;
    this.planetMesh = planetMesh;
    this.planetRings = ringsMesh;
    this.planetMaterial = planetMat;
    this.ringMaterial = ringMat;
    this.group.add(this.planetGroup);

    // 4. Horizon Megacity Skyline
    const { cityGroup, buildings, beacons, mat } = this.createCitySkyline();
    this.cityGroup = cityGroup;
    this.buildings = buildings;
    this.beaconLights = beacons;
    this.windowMaterial = mat;
    this.group.add(this.cityGroup);

    // 5. Flying Sky Traffic
    const { trafficGroup, vehicles } = this.createSkyTraffic();
    this.trafficGroup = trafficGroup;
    this.vehicles = vehicles;
    this.group.add(this.trafficGroup);

    // 6. Giant Orbital Ring Megastructure (for Apex Orbital / Station sectors)
    this.orbitalRingGroup = this.createOrbitalSuperstructure();
    this.group.add(this.orbitalRingGroup);

    // 7. Asteroid Field (for Void Quarry sector)
    this.asteroidGroup = this.createAsteroidField();
    this.group.add(this.asteroidGroup);

    // 8. Holographic Billboards
    this.holographicBillboards = this.createHoloBillboards();
    this.holographicBillboards.forEach((holo) => this.group.add(holo));

    // 9. Sweeping Skyward Searchlight Beams
    this.searchlights = this.createSearchlights();
    this.searchlights.forEach((sl) => this.group.add(sl.mesh));

    this.scene.add(this.group);
    this.applyTheme(initialTheme);
  }

  // --- 1. Procedural Starfield ---
  private createStarfield(): THREE.Points {
    const starCount = 2800;
    const geom = new THREE.BufferGeometry();
    const positions = new Float32Array(starCount * 3);
    const colors = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount; i++) {
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      const r = 700 + Math.random() * 250;

      const sinPhi = Math.sin(phi);
      positions[i * 3] = r * sinPhi * Math.cos(theta);
      positions[i * 3 + 1] = Math.max(10, r * sinPhi * Math.sin(theta)); // mostly upper hemisphere
      positions[i * 3 + 2] = r * Math.cos(phi);

      // Color variation: electric cyan, warm amber, violet, pure white
      const t = Math.random();
      if (t < 0.35) {
        // Cyan
        colors[i * 3] = 0.3;
        colors[i * 3 + 1] = 0.9;
        colors[i * 3 + 2] = 1.0;
      } else if (t < 0.6) {
        // Amber/gold
        colors[i * 3] = 1.0;
        colors[i * 3 + 1] = 0.8;
        colors[i * 3 + 2] = 0.4;
      } else if (t < 0.8) {
        // Violet
        colors[i * 3] = 0.85;
        colors[i * 3 + 1] = 0.4;
        colors[i * 3 + 2] = 1.0;
      } else {
        // Crisp white
        colors[i * 3] = 1.0;
        colors[i * 3 + 1] = 1.0;
        colors[i * 3 + 2] = 1.0;
      }
    }

    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geom.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const mat = new THREE.PointsMaterial({
      size: 1.8,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
    });

    return new THREE.Points(geom, mat);
  }

  // --- 2. Cosmic Nebula Dome ---
  private createNebulaDome(): THREE.Mesh {
    const geom = new THREE.SphereGeometry(950, 24, 18);
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;

    // Cosmic gradient with auroral glow
    const grad = ctx.createLinearGradient(0, 0, 0, 256);
    grad.addColorStop(0, '#030712');
    grad.addColorStop(0.3, '#0b1329');
    grad.addColorStop(0.65, '#082f49');
    grad.addColorStop(0.85, '#021e35');
    grad.addColorStop(1, '#020617');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 256);

    // Paint cosmic dust clouds
    ctx.filter = 'blur(20px)';
    ctx.fillStyle = 'rgba(6, 182, 212, 0.22)';
    ctx.beginPath();
    ctx.ellipse(180, 90, 140, 50, 0.4, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'rgba(168, 85, 247, 0.18)';
    ctx.beginPath();
    ctx.ellipse(360, 110, 120, 60, -0.3, 0, Math.PI * 2);
    ctx.fill();

    ctx.filter = 'none';

    const texture = new THREE.CanvasTexture(canvas);
    const mat = new THREE.MeshBasicMaterial({
      map: texture,
      side: THREE.BackSide,
      depthWrite: false,
    });

    return new THREE.Mesh(geom, mat);
  }

  // --- 3. Giant Celestial Body (Ringed Planet) ---
  private createExoplanet() {
    const group = new THREE.Group();
    // Position planet in the upper-right sky ahead
    group.position.set(380, 220, 550);

    // Planet surface canvas texture
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;

    // Gas giant atmospheric stripes
    const grad = ctx.createLinearGradient(0, 0, 0, 256);
    grad.addColorStop(0, '#082f49');
    grad.addColorStop(0.18, '#0369a1');
    grad.addColorStop(0.35, '#0284c7');
    grad.addColorStop(0.5, '#38bdf8');
    grad.addColorStop(0.68, '#0ea5e9');
    grad.addColorStop(0.85, '#075985');
    grad.addColorStop(1, '#0c4a6e');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 256);

    // Band details
    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
    for (let y = 30; y < 230; y += 22) {
      ctx.fillRect(0, y, 512, 4 + Math.random() * 6);
    }

    const planetTex = new THREE.CanvasTexture(canvas);
    const planetMat = new THREE.MeshStandardMaterial({
      map: planetTex,
      roughness: 0.7,
      metalness: 0.1,
      emissive: new THREE.Color(0x0284c7),
      emissiveIntensity: 0.25,
    });

    const planetGeom = new THREE.SphereGeometry(110, 32, 24);
    const planetMesh = new THREE.Mesh(planetGeom, planetMat);
    group.add(planetMesh);

    // Planetary Ring System
    const ringGeom = new THREE.RingGeometry(140, 220, 48);
    const ringCanvas = document.createElement('canvas');
    ringCanvas.width = 256;
    ringCanvas.height = 1;
    const rCtx = ringCanvas.getContext('2d')!;
    const rGrad = rCtx.createLinearGradient(0, 0, 256, 0);
    rGrad.addColorStop(0, 'rgba(56, 189, 248, 0)');
    rGrad.addColorStop(0.15, 'rgba(56, 189, 248, 0.7)');
    rGrad.addColorStop(0.35, 'rgba(125, 211, 252, 0.9)');
    rGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.3)'); // Cassini division
    rGrad.addColorStop(0.65, 'rgba(56, 189, 248, 0.75)');
    rGrad.addColorStop(0.9, 'rgba(14, 165, 233, 0.5)');
    rGrad.addColorStop(1, 'rgba(14, 165, 233, 0)');
    rCtx.fillStyle = rGrad;
    rCtx.fillRect(0, 0, 256, 1);

    const ringTex = new THREE.CanvasTexture(ringCanvas);
    const ringMat = new THREE.MeshBasicMaterial({
      map: ringTex,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.85,
      depthWrite: false,
    });

    const ringsMesh = new THREE.Mesh(ringGeom, ringMat);
    ringsMesh.rotation.x = Math.PI / 2.3;
    ringsMesh.rotation.y = -Math.PI / 7;
    group.add(ringsMesh);

    // Atmospheric rim glow
    const haloGeom = new THREE.SphereGeometry(114, 24, 18);
    const haloMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.15,
      side: THREE.BackSide,
    });
    const haloMesh = new THREE.Mesh(haloGeom, haloMat);
    group.add(haloMesh);

    return { planetGroup: group, planetMesh, ringsMesh, planetMat, ringMat };
  }

  // --- 4. Distant Megacity Skyline ---
  private createCitySkyline() {
    const cityGroup = new THREE.Group();
    const buildings: THREE.Mesh[] = [];
    const beacons: BeaconLight[] = [];

    // Procedural glowing skyscraper window texture
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;

    // Dark tower base
    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, 0, 128, 256);

    // Illuminated window matrix
    ctx.fillStyle = '#38bdf8';
    for (let y = 10; y < 246; y += 6) {
      for (let x = 6; x < 122; x += 6) {
        if (Math.random() < 0.42) {
          // Color tone: cyan or warm amber
          ctx.fillStyle = Math.random() < 0.75 ? '#38bdf8' : '#fbbf24';
          ctx.fillRect(x, y, 3, 3);
        }
      }
    }

    const windowTexture = new THREE.CanvasTexture(canvas);
    windowTexture.wrapS = THREE.RepeatWrapping;
    windowTexture.wrapT = THREE.RepeatWrapping;

    const buildingMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.6,
      metalness: 0.8,
      emissiveMap: windowTexture,
      emissive: new THREE.Color(0x38bdf8),
      emissiveIntensity: 0.65,
    });

    // Generate 48 skyscraper towers across left & right flanks and distance
    const totalTowers = 44;
    const beaconGeom = new THREE.SphereGeometry(1.4, 8, 6);
    const beaconMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });

    for (let i = 0; i < totalTowers; i++) {
      const isLeft = i % 2 === 0;
      const flankDist = isLeft ? -1 : 1;
      const x = flankDist * (110 + Math.random() * 320);
      const z = -100 + (i / totalTowers) * 900;
      const height = 120 + Math.random() * 260;
      const width = 25 + Math.random() * 45;
      const depth = 25 + Math.random() * 45;

      const towerGeom = new THREE.BoxGeometry(width, height, depth);
      const tower = new THREE.Mesh(towerGeom, buildingMat);
      tower.position.set(x, height / 2 - 40, z);
      cityGroup.add(tower);
      buildings.push(tower);

      // Summit Communication Spire & Beacon
      const spireH = 18 + Math.random() * 25;
      const spireGeom = new THREE.CylinderGeometry(0.5, 2, spireH, 6);
      const spire = new THREE.Mesh(spireGeom, buildingMat);
      spire.position.set(x, height - 40 + spireH / 2, z);
      cityGroup.add(spire);

      // Blinking red/amber aviation hazard beacon
      const beacon = new THREE.Mesh(beaconGeom, beaconMat.clone());
      beacon.position.set(x, height - 40 + spireH + 1, z);
      cityGroup.add(beacon);

      beacons.push({
        mesh: beacon,
        offset: Math.random() * 10,
        baseColor: Math.random() < 0.5 ? 0xef4444 : 0xf59e0b,
      });
    }

    return { cityGroup, buildings, beacons, mat: buildingMat };
  }

  // --- 5. Flying Sky Traffic (Aerocars with Light Trails) ---
  private createSkyTraffic() {
    const trafficGroup = new THREE.Group();
    const vehicles: SkyVehicle[] = [];

    // Aerocar geometry: sleek futuristic cruiser
    const bodyGeom = new THREE.BoxGeometry(4, 1.2, 10);
    const cockpitGeom = new THREE.BoxGeometry(2.4, 0.8, 4.5);
    const headlightGeom = new THREE.BoxGeometry(0.8, 0.4, 0.2);
    const taillightGeom = new THREE.BoxGeometry(3.6, 0.3, 0.2);

    const vehicleBodyMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      metalness: 0.9,
      roughness: 0.2,
    });
    const cockpitMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });
    const headlightMat = new THREE.MeshBasicMaterial({ color: 0xe0f2fe });
    const taillightMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });

    // 14 cruisers across multiple sky corridors
    const corridorCount = 14;
    for (let i = 0; i < corridorCount; i++) {
      const vGroup = new THREE.Group();

      const body = new THREE.Mesh(bodyGeom, vehicleBodyMat);
      vGroup.add(body);

      const cockpit = new THREE.Mesh(cockpitGeom, cockpitMat);
      cockpit.position.set(0, 0.8, -0.5);
      vGroup.add(cockpit);

      // Front headlights
      const hlLeft = new THREE.Mesh(headlightGeom, headlightMat);
      hlLeft.position.set(-1.2, 0, 5.1);
      vGroup.add(hlLeft);

      const hlRight = new THREE.Mesh(headlightGeom, headlightMat);
      hlRight.position.set(1.2, 0, 5.1);
      vGroup.add(hlRight);

      // Rear taillight
      const tl = new THREE.Mesh(taillightGeom, taillightMat);
      tl.position.set(0, 0.1, -5.1);
      vGroup.add(tl);

      // Engine beam trail
      const trailGeom = new THREE.CylinderGeometry(0.2, 1.2, 22, 8);
      trailGeom.rotateX(Math.PI / 2);
      const trailMat = new THREE.MeshBasicMaterial({
        color: 0x00f0ff,
        transparent: true,
        opacity: 0.45,
      });
      const trail = new THREE.Mesh(trailGeom, trailMat);
      trail.position.set(0, 0, -16);
      vGroup.add(trail);

      const isLeft = i % 2 === 0;
      const initialX = isLeft ? -(50 + (i * 18)) : 50 + (i * 18);
      const initialY = 35 + (i % 4) * 22;
      const direction: 1 | -1 = isLeft ? 1 : -1;
      const speed = 45 + Math.random() * 55;

      vGroup.position.set(initialX, initialY, (i / corridorCount) * 700);
      if (direction === -1) {
        vGroup.rotation.y = Math.PI;
      }

      trafficGroup.add(vGroup);

      vehicles.push({
        mesh: vGroup,
        speed,
        minZ: -120,
        maxZ: 750,
        initialX,
        initialY,
        direction,
      });
    }

    return { trafficGroup, vehicles };
  }

  // --- 6. Giant Orbital Ring Superstructure ---
  private createOrbitalSuperstructure(): THREE.Group {
    const group = new THREE.Group();
    // Huge curved ring segment sweeping across the upper atmosphere
    const ringGeom = new THREE.TorusGeometry(520, 9, 12, 64, Math.PI * 0.9);
    const ringMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      metalness: 0.85,
      roughness: 0.3,
      emissive: new THREE.Color(0xf59e0b),
      emissiveIntensity: 0.35,
    });
    const ring = new THREE.Mesh(ringGeom, ringMat);
    ring.rotation.x = Math.PI / 2.2;
    ring.rotation.z = Math.PI / 4;
    ring.position.set(0, 240, 380);
    group.add(ring);

    // Glowing docking hubs along the ring
    const hubGeom = new THREE.CylinderGeometry(18, 18, 14, 16);
    const hubMat = new THREE.MeshBasicMaterial({ color: 0xfbbf24 });
    for (let i = 0; i < 4; i++) {
      const hub = new THREE.Mesh(hubGeom, hubMat);
      const angle = (i - 1.5) * 0.45;
      hub.position.set(
        Math.cos(angle) * 520,
        240 + Math.sin(angle) * 120,
        380 + Math.sin(angle) * 280
      );
      group.add(hub);
    }

    return group;
  }

  // --- 7. Floating Asteroid Field (for Void Quarry) ---
  private createAsteroidField(): THREE.Group {
    const group = new THREE.Group();
    const astMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      roughness: 0.9,
      metalness: 0.2,
    });

    for (let i = 0; i < 16; i++) {
      const radius = 8 + Math.random() * 22;
      const geom = new THREE.DodecahedronGeometry(radius, 1);
      const asteroid = new THREE.Mesh(geom, astMat);
      const side = i % 2 === 0 ? -1 : 1;
      asteroid.position.set(
        side * (80 + Math.random() * 200),
        20 + Math.random() * 90,
        Math.random() * 650
      );
      asteroid.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
      group.add(asteroid);
    }

    return group;
  }

  // --- 8. Holographic Neon Billboards ---
  private createHoloBillboards(): THREE.Group[] {
    const holos: THREE.Group[] = [];
    const holoTitles = ['GRAV-PULSE', 'NULL VECTOR', 'APEX TRANSIT', 'SPEED LIMIT: NULL'];

    holoTitles.forEach((title, idx) => {
      const hGroup = new THREE.Group();
      const canvas = document.createElement('canvas');
      canvas.width = 256;
      canvas.height = 128;
      const ctx = canvas.getContext('2d')!;

      ctx.fillStyle = 'rgba(6, 182, 212, 0.08)';
      ctx.fillRect(0, 0, 256, 128);
      ctx.strokeStyle = '#00f0ff';
      ctx.lineWidth = 4;
      ctx.strokeRect(4, 4, 248, 120);

      ctx.font = 'bold 26px monospace';
      ctx.fillStyle = '#00f0ff';
      ctx.textAlign = 'center';
      ctx.fillText(title, 128, 68);

      const tex = new THREE.CanvasTexture(canvas);
      const mat = new THREE.MeshBasicMaterial({
        map: tex,
        transparent: true,
        opacity: 0.85,
        side: THREE.DoubleSide,
      });

      const geom = new THREE.PlaneGeometry(36, 18);
      const mesh = new THREE.Mesh(geom, mat);
      hGroup.add(mesh);

      const side = idx % 2 === 0 ? -1 : 1;
      hGroup.position.set(side * 65, 30 + idx * 10, 150 + idx * 160);
      holos.push(hGroup);
    });

    return holos;
  }

  // --- Dynamic Theme Switching ---
  public applyTheme(theme: EnvironmentTheme) {
    this.currentTheme = theme;
    this.envConfig = ENVIRONMENTS[theme];

    // Sector-specific visibility & lighting
    switch (theme) {
      case 'NEO_VANGUARD':
        this.orbitalRingGroup.visible = false;
        this.asteroidGroup.visible = false;
        this.planetMaterial.emissive.setHex(0x0284c7);
        this.ringMaterial.color.setHex(0x38bdf8);
        this.windowMaterial.emissive.setHex(0x00f0ff);
        break;

      case 'APEX_ORBITAL':
        this.orbitalRingGroup.visible = true;
        this.asteroidGroup.visible = false;
        this.planetMaterial.emissive.setHex(0xd97706);
        this.ringMaterial.color.setHex(0xfbbf24);
        this.windowMaterial.emissive.setHex(0xf59e0b);
        break;

      case 'PRISM_CIRCUIT':
        this.orbitalRingGroup.visible = false;
        this.asteroidGroup.visible = false;
        this.planetMaterial.emissive.setHex(0x9333ea);
        this.ringMaterial.color.setHex(0xd946ef);
        this.windowMaterial.emissive.setHex(0xa855f7);
        break;

      case 'VOID_QUARRY':
        this.orbitalRingGroup.visible = false;
        this.asteroidGroup.visible = true;
        this.planetMaterial.emissive.setHex(0x059669);
        this.ringMaterial.color.setHex(0x34d399);
        this.windowMaterial.emissive.setHex(0x10b981);
        break;
    }
  }

  // --- Frame Loop: Parallax Follow & Scenery Animations ---
  public update(playerZ: number, delta: number) {
    // 1. Lock the background coordinate center to the player's Z so it NEVER gets left behind!
    this.group.position.z = playerZ;

    // 2. Slow celestial rotation for the planet & rings
    this.planetMesh.rotation.y += delta * 0.04;
    this.planetRings.rotation.z += delta * 0.015;

    // 3. Subtle slow rotation of the starfield
    this.starPoints.rotation.y += delta * 0.008;

    // 4. Sky traffic animation (vehicles speeding through air corridors)
    for (const v of this.vehicles) {
      v.mesh.position.z += v.direction * v.speed * delta;

      // Wrap around within the player's current view horizon
      if (v.direction === 1 && v.mesh.position.z > v.maxZ) {
        v.mesh.position.z = v.minZ;
      } else if (v.direction === -1 && v.mesh.position.z < v.minZ) {
        v.mesh.position.z = v.maxZ;
      }
    }

    // 5. Aviation beacon blinking
    const time = Date.now() * 0.003;
    for (const beacon of this.beaconLights) {
      const pulse = Math.sin(time + beacon.offset);
      beacon.mesh.visible = pulse > 0.2;
    }

    // 6. Asteroid tumble (if visible)
    if (this.asteroidGroup.visible) {
      this.asteroidGroup.children.forEach((ast, idx) => {
        ast.rotation.x += delta * (0.1 + idx * 0.02);
        ast.rotation.y += delta * (0.08 + idx * 0.01);
      });
    }
  }

  public dispose() {
    this.scene.remove(this.group);
  }
}
