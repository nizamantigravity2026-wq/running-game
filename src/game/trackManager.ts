import * as THREE from 'three';
import { 
  LANES, 
  SEGMENT_LENGTH, 
  VISIBLE_SEGMENTS, 
  FLOOR_Y, 
  CEILING_Y, 
  ZERO_G_Y,
  ENVIRONMENTS, 
  EnvironmentConfig 
} from './constants';
import { EnvironmentTheme, ObstacleType, PowerUpType } from './types';

export interface ObstacleInstance {
  mesh: THREE.Group;
  type: ObstacleType;
  lane: number; // 0, 1, 2
  z: number;
  y: number;
  width: number;
  height: number;
  depth: number;
  speedZ?: number; // for moving maglevs
  rotationSpeed?: number;
  active: boolean;
  nearMissChecked?: boolean;
}

export interface CollectibleInstance {
  mesh: THREE.Group;
  type: 'ORB' | 'BATTERY' | 'POWERUP';
  powerUpType?: PowerUpType;
  lane: number;
  z: number;
  y: number;
  radius: number;
  active: boolean;
  collected: boolean;
}

export interface TrackSegment {
  group: THREE.Group;
  index: number;
  startZ: number;
  endZ: number;
  obstacles: ObstacleInstance[];
  collectibles: CollectibleInstance[];
  hasGap: boolean;
}

export class TrackManager {
  private scene: THREE.Scene;
  public segments: TrackSegment[] = [];
  public currentTheme: EnvironmentTheme = 'NEO_VANGUARD';
  private envConfig: EnvironmentConfig;

  // Shared Geometries & Materials for high performance
  private floorGeom: THREE.BoxGeometry;
  private ceilingGeom: THREE.BoxGeometry;
  private railGeom: THREE.BoxGeometry;
  private laneStripeGeom: THREE.BoxGeometry;
  private archGeom: THREE.BoxGeometry;
  private buildingGeom: THREE.BoxGeometry;

  private orbGeom: THREE.OctahedronGeometry;
  private orbMaterial: THREE.MeshBasicMaterial;

  private batteryGeom: THREE.CylinderGeometry;
  private batteryMaterial: THREE.MeshBasicMaterial;

  private powerUpBoxGeom: THREE.BoxGeometry;

  private floorMaterial: THREE.MeshStandardMaterial;
  private ceilingMaterial: THREE.MeshStandardMaterial;
  private railMaterial: THREE.MeshStandardMaterial;
  private laneMaterial: THREE.MeshBasicMaterial;
  private cityMaterial: THREE.MeshStandardMaterial;

  private nextSegmentZ: number = 0;
  private segmentCounter: number = 0;

  constructor(scene: THREE.Scene, initialTheme: EnvironmentTheme = 'NEO_VANGUARD') {
    this.scene = scene;
    this.currentTheme = initialTheme;
    this.envConfig = ENVIRONMENTS[initialTheme];

    // Shared geometries
    this.floorGeom = new THREE.BoxGeometry(11.5, 0.4, SEGMENT_LENGTH);
    this.ceilingGeom = new THREE.BoxGeometry(11.5, 0.4, SEGMENT_LENGTH);
    this.railGeom = new THREE.BoxGeometry(0.3, 1.2, SEGMENT_LENGTH);
    this.laneStripeGeom = new THREE.BoxGeometry(0.12, 0.05, SEGMENT_LENGTH);
    this.archGeom = new THREE.BoxGeometry(12.4, 0.4, 1.2);
    this.buildingGeom = new THREE.BoxGeometry(16, 60, 24);

    this.orbGeom = new THREE.OctahedronGeometry(0.38, 1);
    this.orbMaterial = new THREE.MeshBasicMaterial({ color: 0x00f0ff });

    this.batteryGeom = new THREE.CylinderGeometry(0.28, 0.28, 0.65, 8);
    this.batteryMaterial = new THREE.MeshBasicMaterial({ color: 0x10b981 });

    this.powerUpBoxGeom = new THREE.BoxGeometry(0.7, 0.7, 0.7);

    // Initial materials
    const trackTexture = this.createTrackGridTexture();
    this.floorMaterial = new THREE.MeshStandardMaterial({
      color: this.envConfig.trackColor,
      map: trackTexture,
      roughness: 0.3,
      metalness: 0.7,
    });
    this.ceilingMaterial = new THREE.MeshStandardMaterial({
      color: this.envConfig.ceilingColor,
      map: trackTexture,
      roughness: 0.35,
      metalness: 0.7,
    });
    this.railMaterial = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      metalness: 0.85,
      roughness: 0.25,
      emissive: new THREE.Color(this.envConfig.laneColor),
      emissiveIntensity: 0.2,
    });
    this.laneMaterial = new THREE.MeshBasicMaterial({
      color: this.envConfig.laneColor,
    });
    this.cityMaterial = new THREE.MeshStandardMaterial({
      color: 0x0a0f1d,
      roughness: 0.8,
      metalness: 0.5,
    });

    this.initTrack();
  }

  private createTrackGridTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    // Dark sleek carbon composite base
    ctx.fillStyle = '#0a0f1d';
    ctx.fillRect(0, 0, 512, 512);

    // Subtle metallic grid panels
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 3;
    for (let i = 0; i <= 512; i += 64) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, 512);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(512, i);
      ctx.stroke();
    }

    // High-tech directional chevrons down center
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.lineWidth = 5;
    for (let y = 48; y < 512; y += 128) {
      ctx.beginPath();
      ctx.moveTo(216, y);
      ctx.lineTo(256, y + 36);
      ctx.lineTo(296, y);
      ctx.stroke();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(2, 6);
    return texture;
  }

  public setEnvironment(theme: EnvironmentTheme) {
    this.currentTheme = theme;
    this.envConfig = ENVIRONMENTS[theme];

    // Update material colors
    this.floorMaterial.color.setHex(this.envConfig.trackColor);
    this.ceilingMaterial.color.setHex(this.envConfig.ceilingColor);
    this.railMaterial.emissive.setHex(this.envConfig.laneColor);
    this.laneMaterial.color.setHex(this.envConfig.laneColor);
  }

  public initTrack(startZ: number = -10) {
    this.clear();
    // Pre-build initial visible segments starting just behind player (e.g. z = -10)
    this.nextSegmentZ = startZ;
    for (let i = 0; i < VISIBLE_SEGMENTS; i++) {
      // First 3 segments have no obstacles so player has smooth start
      const isInitialSafe = i < 3;
      this.spawnSegment(isInitialSafe);
    }
  }

  public reset(startZ: number = -10) {
    this.initTrack(startZ);
  }

  public clear() {
    for (const segment of this.segments) {
      this.scene.remove(segment.group);
      this.disposeGroup(segment.group);
    }
    this.segments = [];
    this.nextSegmentZ = 0;
    this.segmentCounter = 0;
  }

  private disposeGroup(group: THREE.Group) {
    group.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        // Individual obstacle custom geoms can be cleaned if unique
        if (child.userData?.isUniqueGeom) {
          child.geometry.dispose();
        }
      }
    });
  }

  public update(playerZ: number, delta: number) {
    // Safety check: if track is somehow empty, immediately spawn segments!
    if (this.segments.length === 0) {
      this.initTrack(playerZ - 10);
      return;
    }

    // 1. Check if furthest behind segment should be recycled
    while (this.segments.length > 0 && this.segments[0].endZ < playerZ - 25) {
      const oldSeg = this.segments.shift()!;
      this.scene.remove(oldSeg.group);
      this.disposeGroup(oldSeg.group);
      this.spawnSegment(false);
    }

    // 2. Animate obstacles and collectibles
    for (const seg of this.segments) {
      // Rotate & float collectibles in 3D
      const timeNow = Date.now() * 0.005;
      for (const col of seg.collectibles) {
        if (!col.collected && col.active) {
          col.mesh.rotation.y += delta * 3.2;
          col.mesh.position.y = col.y + Math.sin(timeNow + col.z * 0.5) * 0.14;
          // Spin outer gyro ring on secondary axis if present
          if (col.mesh.children.length > 1) {
            col.mesh.children[1].rotation.z += delta * 4.0;
          }
        }
      }

      // Animate dynamic obstacles
      for (const obs of seg.obstacles) {
        if (!obs.active) continue;

        if (obs.speedZ) {
          // Moving Mag-Lev train
          obs.z += obs.speedZ * delta;
          obs.mesh.position.z = obs.z;
        }

        if (obs.rotationSpeed) {
          obs.mesh.rotation.z += obs.rotationSpeed * delta;
        }

        if (obs.type === 'PATROL_DRONE') {
          // Hover drone vertical bobbing
          obs.mesh.position.y = obs.y + Math.sin(Date.now() * 0.005 + obs.z) * 0.35;
        }
      }
    }
  }

  private spawnSegment(isSafe: boolean) {
    const startZ = this.nextSegmentZ;
    const endZ = startZ + SEGMENT_LENGTH;
    const centerZ = startZ + SEGMENT_LENGTH / 2;

    const segmentGroup = new THREE.Group();
    const obstacles: ObstacleInstance[] = [];
    const collectibles: CollectibleInstance[] = [];

    // Decide if track segment has a floor gap (only on higher segments, ~12% chance)
    const hasGap = !isSafe && this.segmentCounter > 8 && Math.random() < 0.14;

    // 1. Floor Deck
    if (!hasGap) {
      const floor = new THREE.Mesh(this.floorGeom, this.floorMaterial);
      floor.position.set(0, FLOOR_Y - 0.2, centerZ);
      floor.receiveShadow = true;
      segmentGroup.add(floor);

      // 3D Elevated Track Curbs (Give deep 3D structural road definition)
      const curbGeom = new THREE.BoxGeometry(0.4, 0.45, SEGMENT_LENGTH);
      const curbMat = new THREE.MeshStandardMaterial({
        color: 0x1e293b,
        metalness: 0.8,
        roughness: 0.3,
      });
      const curbL = new THREE.Mesh(curbGeom, curbMat);
      curbL.position.set(-5.6, FLOOR_Y + 0.1, centerZ);
      curbL.receiveShadow = true;
      curbL.castShadow = true;
      segmentGroup.add(curbL);

      const curbR = new THREE.Mesh(curbGeom, curbMat);
      curbR.position.set(5.6, FLOOR_Y + 0.1, centerZ);
      curbR.receiveShadow = true;
      curbR.castShadow = true;
      segmentGroup.add(curbR);

      // Lane separator neon stripes (-1.6, 1.6)
      const stripeL = new THREE.Mesh(this.laneStripeGeom, this.laneMaterial);
      stripeL.position.set(-1.6, FLOOR_Y + 0.02, centerZ);
      segmentGroup.add(stripeL);

      const stripeR = new THREE.Mesh(this.laneStripeGeom, this.laneMaterial);
      stripeR.position.set(1.6, FLOOR_Y + 0.02, centerZ);
      segmentGroup.add(stripeR);
    } else {
      // Floor gap warning lasers
      const gapWarningMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
      const warningGeom = new THREE.BoxGeometry(11.5, 0.1, 0.5);
      const warnStart = new THREE.Mesh(warningGeom, gapWarningMat);
      warnStart.position.set(0, FLOOR_Y + 0.05, startZ + 1);
      segmentGroup.add(warnStart);

      const warnEnd = new THREE.Mesh(warningGeom, gapWarningMat);
      warnEnd.position.set(0, FLOOR_Y + 0.05, endZ - 1);
      segmentGroup.add(warnEnd);

      // Add floating warning holo
      const holoPillar = this.createGapHolo();
      holoPillar.position.set(0, FLOOR_Y + 0.5, centerZ);
      segmentGroup.add(holoPillar);
    }

    // 2. Open Skyway Architecture: Overhead sci-fi arches and gantries without solid roof deck
    // This ensures character runs cleanly on the floor deck with full vista of orbital skyline

    // 3. Side Guard Rails & Support Pillars
    const railLeft = new THREE.Mesh(this.railGeom, this.railMaterial);
    railLeft.position.set(-5.6, (FLOOR_Y + CEILING_Y) / 2, centerZ);
    segmentGroup.add(railLeft);

    const railRight = new THREE.Mesh(this.railGeom, this.railMaterial);
    railRight.position.set(5.6, (FLOOR_Y + CEILING_Y) / 2, centerZ);
    segmentGroup.add(railRight);

    // Overhead Structural Arches at start and mid (aesthetic open-air skyway gantries)
    const arch1 = this.createArch();
    arch1.position.set(0, CEILING_Y, startZ);
    segmentGroup.add(arch1);

    const arch2 = this.createArch();
    arch2.position.set(0, CEILING_Y, centerZ);
    segmentGroup.add(arch2);
    arch2.position.set(0, CEILING_Y, centerZ);
    segmentGroup.add(arch2);

    // 4. Background Scenery (Towering spires / floating platforms)
    if (this.segmentCounter % 2 === 0) {
      const spireL = this.createSpire(this.envConfig.accentColor);
      spireL.position.set(-22 - Math.random() * 8, -10 + Math.random() * 20, centerZ + Math.random() * 10);
      segmentGroup.add(spireL);

      const spireR = this.createSpire(this.envConfig.accentColor);
      spireR.position.set(22 + Math.random() * 8, -10 + Math.random() * 20, centerZ + Math.random() * 10);
      segmentGroup.add(spireR);
    }

    // 5. Populate Obstacles (if not initial safe zones)
    if (!isSafe) {
      this.populateObstacles(segmentGroup, obstacles, startZ, hasGap);
      this.populateCollectibles(segmentGroup, collectibles, startZ, hasGap);
    }

    this.scene.add(segmentGroup);

    this.segments.push({
      group: segmentGroup,
      index: this.segmentCounter,
      startZ,
      endZ,
      obstacles,
      collectibles,
      hasGap,
    });

    this.nextSegmentZ = endZ;
    this.segmentCounter++;
  }

  private createArch(): THREE.Group {
    const group = new THREE.Group();
    // Top beam
    const beam = new THREE.Mesh(this.archGeom, this.railMaterial);
    beam.position.y = 0;
    beam.castShadow = true;
    group.add(beam);

    // Neon trim
    const trimGeom = new THREE.BoxGeometry(12.4, 0.1, 0.2);
    const trim = new THREE.Mesh(trimGeom, this.laneMaterial);
    trim.position.set(0, -0.22, 0);
    group.add(trim);

    // Columns left and right
    const colGeom = new THREE.BoxGeometry(0.5, CEILING_Y - FLOOR_Y, 0.5);
    const colL = new THREE.Mesh(colGeom, this.railMaterial);
    colL.position.set(-6, -(CEILING_Y - FLOOR_Y) / 2, 0);
    colL.castShadow = true;
    colL.receiveShadow = true;
    group.add(colL);

    const colR = new THREE.Mesh(colGeom, this.railMaterial);
    colR.position.set(6, -(CEILING_Y - FLOOR_Y) / 2, 0);
    colR.castShadow = true;
    colR.receiveShadow = true;
    group.add(colR);

    // Overhead Sci-Fi Hologram Sign on the Arch
    const signCanvas = document.createElement('canvas');
    signCanvas.width = 256;
    signCanvas.height = 64;
    const sCtx = signCanvas.getContext('2d')!;
    sCtx.fillStyle = 'rgba(6, 182, 212, 0.12)';
    sCtx.fillRect(0, 0, 256, 64);
    sCtx.strokeStyle = '#00f0ff';
    sCtx.lineWidth = 3;
    sCtx.strokeRect(4, 4, 248, 56);
    sCtx.font = 'bold 22px monospace';
    sCtx.fillStyle = '#00f0ff';
    sCtx.textAlign = 'center';
    sCtx.fillText('HYPER-LANE ACTIVE', 128, 38);

    const signTex = new THREE.CanvasTexture(signCanvas);
    const signMat = new THREE.MeshBasicMaterial({
      map: signTex,
      transparent: true,
      opacity: 0.85,
      side: THREE.DoubleSide,
    });
    const signMesh = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 0.9), signMat);
    signMesh.position.set(0, -0.7, 0);
    group.add(signMesh);

    // Flashing warning beacons on the arch posts
    const beaconMat = new THREE.MeshBasicMaterial({ color: 0xff3366 });
    const beaconGeom = new THREE.SphereGeometry(0.12, 8, 8);
    const beaconL = new THREE.Mesh(beaconGeom, beaconMat);
    beaconL.position.set(-5.9, 0.2, 0);
    group.add(beaconL);

    const beaconR = new THREE.Mesh(beaconGeom, beaconMat);
    beaconR.position.set(5.9, 0.2, 0);
    group.add(beaconR);

    return group;
  }

  private createSpire(accentColor: number): THREE.Group {
    const group = new THREE.Group();
    const h = 40 + Math.random() * 50;
    const spireGeom = new THREE.BoxGeometry(8 + Math.random() * 6, h, 8 + Math.random() * 6);
    const spire = new THREE.Mesh(spireGeom, this.cityMaterial);
    spire.position.y = h / 2 - 20;
    group.add(spire);

    // Glowing window strips
    const stripGeom = new THREE.BoxGeometry(0.2, h * 0.7, 0.6);
    const stripMat = new THREE.MeshBasicMaterial({ color: accentColor });
    const strip1 = new THREE.Mesh(stripGeom, stripMat);
    strip1.position.set(4.1, h / 2 - 20, 0);
    group.add(strip1);

    return group;
  }

  private createGapHolo(): THREE.Group {
    const group = new THREE.Group();
    const holoGeom = new THREE.BoxGeometry(10, 0.8, 0.2);
    const holoMat = new THREE.MeshBasicMaterial({
      color: 0xff3366,
      transparent: true,
      opacity: 0.6,
      wireframe: true,
    });
    const holo = new THREE.Mesh(holoGeom, holoMat);
    group.add(holo);
    return group;
  }

  private populateObstacles(
    group: THREE.Group, 
    obstacles: ObstacleInstance[], 
    startZ: number, 
    hasGap: boolean
  ) {
    // In a 36m segment, we can place 1 or 2 obstacle events
    const eventZ1 = startZ + 12;
    const eventZ2 = startZ + 24;

    const availableLanes = [0, 1, 2];

    // Pick 1-2 lanes for an obstacle event at eventZ1
    const pick1 = this.createRandomObstacle(eventZ1, availableLanes, hasGap);
    if (pick1) {
      group.add(pick1.mesh);
      obstacles.push(pick1);
    }

    // At eventZ2, place another obstacle if random chance (70%)
    if (Math.random() < 0.75) {
      const pick2 = this.createRandomObstacle(eventZ2, availableLanes, hasGap);
      if (pick2) {
        group.add(pick2.mesh);
        obstacles.push(pick2);
      }
    }
  }

  private createRandomObstacle(
    z: number, 
    availableLanes: number[],
    hasGap: boolean
  ): ObstacleInstance | null {
    const laneIndex = availableLanes[Math.floor(Math.random() * availableLanes.length)];
    const laneX = LANES[laneIndex];

    // Types of obstacles (ground-track hazards designed for floor running)
    const types: ObstacleType[] = [
      'LASER_BARRIER_LOW',
      'LASER_BARRIER_HIGH',
      'MAGLEV_TRAIN',
      'PATROL_DRONE',
      'ROTATING_BLADE',
    ];

    const type = types[Math.floor(Math.random() * types.length)];
    const obsGroup = new THREE.Group();

    switch (type) {
      case 'LASER_BARRIER_LOW': {
        // Low barrier: Must jump over (height ~0.9)
        const barGeom = new THREE.BoxGeometry(2.6, 0.85, 0.35);
        const barMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.9 });
        const barMesh = new THREE.Mesh(barGeom, barMat);
        barMesh.position.y = FLOOR_Y + 0.45;
        barMesh.castShadow = true;
        barMesh.receiveShadow = true;
        obsGroup.add(barMesh);

        // Glowing red plasma beam on top
        const beamGeom = new THREE.CylinderGeometry(0.08, 0.08, 2.6, 8);
        beamGeom.rotateZ(Math.PI / 2);
        const beamMat = new THREE.MeshBasicMaterial({ color: 0xff1744 });
        const beam = new THREE.Mesh(beamGeom, beamMat);
        beam.position.y = FLOOR_Y + 0.9;
        obsGroup.add(beam);

        obsGroup.position.set(laneX, 0, z);
        return {
          mesh: obsGroup,
          type: 'LASER_BARRIER_LOW',
          lane: laneIndex,
          z,
          y: FLOOR_Y + 0.45,
          width: 2.6,
          height: 0.9,
          depth: 0.4,
          active: true,
        };
      }

      case 'LASER_BARRIER_HIGH': {
        // High barrier: Must slide under (clearance under is ~1.1m, top is ~2.6m)
        const topGeom = new THREE.BoxGeometry(2.6, 1.4, 0.4);
        const topMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.9 });
        const topMesh = new THREE.Mesh(topGeom, topMat);
        topMesh.position.y = FLOOR_Y + 2.0; // Hangs from 1.3 to 2.7
        topMesh.castShadow = true;
        topMesh.receiveShadow = true;
        obsGroup.add(topMesh);

        // Warning laser hanging down
        const laserGeom = new THREE.BoxGeometry(2.4, 0.1, 0.2);
        const laserMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b });
        const laser = new THREE.Mesh(laserGeom, laserMat);
        laser.position.y = FLOOR_Y + 1.25;
        obsGroup.add(laser);

        obsGroup.position.set(laneX, 0, z);
        return {
          mesh: obsGroup,
          type: 'LASER_BARRIER_HIGH',
          lane: laneIndex,
          z,
          y: FLOOR_Y + 2.0,
          width: 2.6,
          height: 1.4,
          depth: 0.4,
          active: true,
        };
      }

      case 'MAGLEV_TRAIN': {
        // Massive sci-fi hovering transport pod
        const trainGeom = new THREE.BoxGeometry(2.7, 3.4, 11);
        const trainMat = new THREE.MeshStandardMaterial({
          color: 0x0f172a,
          metalness: 0.85,
          roughness: 0.3,
        });
        const trainMesh = new THREE.Mesh(trainGeom, trainMat);
        trainMesh.position.y = FLOOR_Y + 1.8;
        trainMesh.castShadow = true;
        trainMesh.receiveShadow = true;
        obsGroup.add(trainMesh);

        // Headlights
        const lightGeom = new THREE.BoxGeometry(0.6, 0.3, 0.1);
        const lightMat = new THREE.MeshBasicMaterial({ color: 0xff0055 });
        const headL = new THREE.Mesh(lightGeom, lightMat);
        headL.position.set(-0.9, FLOOR_Y + 1.0, -5.55);
        obsGroup.add(headL);

        const headR = new THREE.Mesh(lightGeom, lightMat);
        headR.position.set(0.9, FLOOR_Y + 1.0, -5.55);
        obsGroup.add(headR);

        // Window glow stripe
        const winGeom = new THREE.BoxGeometry(2.75, 0.4, 9);
        const winMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
        const win = new THREE.Mesh(winGeom, winMat);
        win.position.y = FLOOR_Y + 2.2;
        obsGroup.add(win);

        obsGroup.position.set(laneX, 0, z);
        return {
          mesh: obsGroup,
          type: 'MAGLEV_TRAIN',
          lane: laneIndex,
          z,
          y: FLOOR_Y + 1.8,
          width: 2.7,
          height: 3.4,
          depth: 11,
          speedZ: Math.random() < 0.4 ? -8 : 0, // 40% chance of oncoming movement!
          active: true,
        };
      }

      case 'PATROL_DRONE': {
        // Hovering security drone
        const droneGeom = new THREE.SphereGeometry(0.65, 8, 8);
        const droneMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.9 });
        const droneMesh = new THREE.Mesh(droneGeom, droneMat);
        droneMesh.position.y = 0;
        obsGroup.add(droneMesh);

        // Red scanning eye
        const eyeGeom = new THREE.SphereGeometry(0.25, 8, 8);
        const eyeMat = new THREE.MeshBasicMaterial({ color: 0xff0033 });
        const eye = new THREE.Mesh(eyeGeom, eyeMat);
        eye.position.set(0, 0, -0.55);
        obsGroup.add(eye);

        // Pulse ring
        const ringGeom = new THREE.TorusGeometry(0.95, 0.04, 6, 16);
        const ringMat = new THREE.MeshBasicMaterial({ color: 0xff3366 });
        const ring = new THREE.Mesh(ringGeom, ringMat);
        ring.rotation.x = Math.PI / 2;
        obsGroup.add(ring);

        const spawnY = FLOOR_Y + 1.5;
        obsGroup.position.set(laneX, spawnY, z);
        return {
          mesh: obsGroup,
          type: 'PATROL_DRONE',
          lane: laneIndex,
          z,
          y: spawnY,
          width: 1.8,
          height: 1.8,
          depth: 1.8,
          active: true,
        };
      }

      case 'ROTATING_BLADE': {
        // Rotating 2-arm plasma barrier
        const centerGeom = new THREE.CylinderGeometry(0.4, 0.4, 0.5, 8);
        centerGeom.rotateX(Math.PI / 2);
        const centerMesh = new THREE.Mesh(centerGeom, new THREE.MeshStandardMaterial({ color: 0x334155 }));
        obsGroup.add(centerMesh);

        // Blade arms
        const armGeom = new THREE.BoxGeometry(4.8, 0.25, 0.15);
        const armMat = new THREE.MeshBasicMaterial({ color: 0xf43f5e });
        const arm = new THREE.Mesh(armGeom, armMat);
        obsGroup.add(arm);

        const spawnY = (FLOOR_Y + CEILING_Y) / 2;
        obsGroup.position.set(0, spawnY, z); // Covers center & spans lanes as it spins
        return {
          mesh: obsGroup,
          type: 'ROTATING_BLADE',
          lane: 1,
          z,
          y: spawnY,
          width: 4.8,
          height: 4.8,
          depth: 0.5,
          rotationSpeed: 1.8 * (Math.random() > 0.5 ? 1 : -1),
          active: true,
        };
      }

      case 'GRAVITY_INVERTER_GATE': {
        // Gate ring that naturally flips gravity to ceiling or floor
        const gateGeom = new THREE.TorusGeometry(2.4, 0.15, 8, 24);
        const gateMat = new THREE.MeshBasicMaterial({ color: 0xa855f7 });
        const gate = new THREE.Mesh(gateGeom, gateMat);
        obsGroup.add(gate);

        // Energy curtain
        const planeGeom = new THREE.CircleGeometry(2.2, 16);
        const planeMat = new THREE.MeshBasicMaterial({
          color: 0x9333ea,
          transparent: true,
          opacity: 0.35,
          side: THREE.DoubleSide,
        });
        const curtain = new THREE.Mesh(planeGeom, planeMat);
        obsGroup.add(curtain);

        const spawnY = (FLOOR_Y + CEILING_Y) / 2;
        obsGroup.position.set(0, spawnY, z);
        return {
          mesh: obsGroup,
          type: 'GRAVITY_INVERTER_GATE',
          lane: 1,
          z,
          y: spawnY,
          width: 4.5,
          height: 4.5,
          depth: 0.4,
          active: true,
        };
      }

      default:
        return null;
    }
  }

  private populateCollectibles(
    group: THREE.Group, 
    collectibles: CollectibleInstance[], 
    startZ: number,
    hasGap: boolean
  ) {
    const laneIndex = Math.floor(Math.random() * 3);
    const laneX = LANES[laneIndex];

    // Pattern 1: Null Orb Arch (Jump curve) or Line (5 orbs)
    const count = 5;
    const isArc = Math.random() < 0.4 && !hasGap;

    for (let i = 0; i < count; i++) {
      const orbGroup = new THREE.Group();
      const orbMesh = new THREE.Mesh(this.orbGeom, this.orbMaterial);
      orbGroup.add(orbMesh);

      // Outer 3D Gyroscopic Ring
      const ringGeom = new THREE.TorusGeometry(0.52, 0.02, 6, 20);
      const ringMat = new THREE.MeshBasicMaterial({
        color: this.envConfig.laneColor,
        transparent: true,
        opacity: 0.8,
      });
      const ringMesh = new THREE.Mesh(ringGeom, ringMat);
      ringMesh.rotation.x = Math.PI / 3;
      orbGroup.add(ringMesh);

      const z = startZ + 6 + i * 2.5;
      let y = FLOOR_Y + 0.9;
      if (isArc) {
        // Parabolic arc for jump
        const t = i / (count - 1);
        y = FLOOR_Y + 0.9 + Math.sin(t * Math.PI) * 2.2;
      }

      orbGroup.position.set(laneX, y, z);
      group.add(orbGroup);

      collectibles.push({
        mesh: orbGroup,
        type: 'ORB',
        lane: laneIndex,
        z,
        y,
        radius: 0.5,
        active: true,
        collected: false,
      });
    }

    // Pattern 2: Rare Power-Up or Battery Cell
    if (Math.random() < 0.28) {
      const puLaneIndex = (laneIndex + 1 + Math.floor(Math.random() * 2)) % 3;
      const puZ = startZ + 18;
      const puY = FLOOR_Y + 1.2;

      const isBattery = Math.random() < 0.4;
      if (isBattery) {
        // Battery cell
        const batGroup = new THREE.Group();
        const batMesh = new THREE.Mesh(this.batteryGeom, this.batteryMaterial);
        batGroup.add(batMesh);
        batGroup.position.set(LANES[puLaneIndex], puY, puZ);
        group.add(batGroup);

        collectibles.push({
          mesh: batGroup,
          type: 'BATTERY',
          lane: puLaneIndex,
          z: puZ,
          y: puY,
          radius: 0.65,
          active: true,
          collected: false,
        });
      } else {
        // Power-Up Hologram
        const puTypes: PowerUpType[] = ['MAGNET', 'SHIELD', 'HYPER_BOOST', 'SLOW_MO', 'GRAV_OVERDRIVE'];
        const chosenPU = puTypes[Math.floor(Math.random() * puTypes.length)];

        const puGroup = this.createPowerUpMesh(chosenPU);
        puGroup.position.set(LANES[puLaneIndex], puY, puZ);
        group.add(puGroup);

        collectibles.push({
          mesh: puGroup,
          type: 'POWERUP',
          powerUpType: chosenPU,
          lane: puLaneIndex,
          z: puZ,
          y: puY,
          radius: 0.75,
          active: true,
          collected: false,
        });
      }
    }
  }

  private createPowerUpMesh(type: PowerUpType): THREE.Group {
    const group = new THREE.Group();

    let color = 0x00f0ff;
    if (type === 'SHIELD') color = 0x3b82f6;
    if (type === 'MAGNET') color = 0xf59e0b;
    if (type === 'HYPER_BOOST') color = 0xec4899;
    if (type === 'SLOW_MO') color = 0x8b5cf6;
    if (type === 'GRAV_OVERDRIVE') color = 0x10b981;

    const boxMat = new THREE.MeshBasicMaterial({
      color,
      wireframe: true,
    });
    const box = new THREE.Mesh(this.powerUpBoxGeom, boxMat);
    group.add(box);

    const innerGeom = new THREE.SphereGeometry(0.28, 8, 8);
    const innerMat = new THREE.MeshBasicMaterial({ color });
    const inner = new THREE.Mesh(innerGeom, innerMat);
    group.add(inner);

    return group;
  }
}
