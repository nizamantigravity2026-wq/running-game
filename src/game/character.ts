import * as THREE from 'three';
import { RUNNER_HEIGHT, RUNNER_WIDTH } from './constants';
import { OperativeSkin } from './types';

export class RunnerCharacter {
  public group: THREE.Group;
  public runnerMeshGroup: THREE.Group;

  // Materials for live skin swapping
  private suitMaterial: THREE.MeshStandardMaterial;
  private armorAccentMaterial: THREE.MeshStandardMaterial;
  private glowCyanMaterial: THREE.MeshBasicMaterial;
  private glowCoreMaterial: THREE.MeshBasicMaterial;

  // Body parts for procedural animation
  private torso: THREE.Mesh;
  private chestCore: THREE.Mesh;
  private head: THREE.Mesh;
  private visor: THREE.Mesh;
  private spinePlate: THREE.Mesh;
  private jetpack: THREE.Mesh;
  private thrusterL: THREE.Mesh;
  private thrusterR: THREE.Mesh;
  private thrusterFlameL: THREE.Mesh;
  private thrusterFlameR: THREE.Mesh;

  private leftArmGroup: THREE.Group;
  private rightArmGroup: THREE.Group;
  private leftLegGroup: THREE.Group;
  private rightLegGroup: THREE.Group;
  private leftShin: THREE.Mesh;
  private rightShin: THREE.Mesh;
  private leftBoot: THREE.Mesh;
  private rightBoot: THREE.Mesh;

  // FX Meshes
  private shieldMesh: THREE.Mesh;
  private magnetRing1: THREE.Mesh;
  private magnetRing2: THREE.Mesh;
  public thrusterLight: THREE.PointLight;
  public blobShadow: THREE.Mesh;

  // Operative-Specific 3D Structural Attachments
  private wingL: THREE.Mesh;
  private wingR: THREE.Mesh;
  private helmetCrest: THREE.Mesh;
  private haloRing: THREE.Mesh;
  private heavyShoulderL: THREE.Mesh;
  private heavyShoulderR: THREE.Mesh;

  // Running animation time
  private animTime: number = 0;

  constructor() {
    this.group = new THREE.Group();
    this.runnerMeshGroup = new THREE.Group();
    this.group.add(this.runnerMeshGroup);

    // Materials
    this.suitMaterial = new THREE.MeshStandardMaterial({
      color: 0x384556,
      metalness: 0.75,
      roughness: 0.28,
    });

    this.armorAccentMaterial = new THREE.MeshStandardMaterial({
      color: 0x64748b,
      metalness: 0.88,
      roughness: 0.22,
    });

    this.glowCyanMaterial = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
    });

    this.glowCoreMaterial = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
    });

    // 1. Torso
    const torsoGeom = new THREE.BoxGeometry(0.55, 0.7, 0.35);
    this.torso = new THREE.Mesh(torsoGeom, this.suitMaterial);
    this.torso.position.y = 1.15;
    this.torso.castShadow = true;
    this.torso.receiveShadow = true;
    this.runnerMeshGroup.add(this.torso);

    // Glowing Spine Energy Plate (Visible from third-person camera!)
    const spineGeom = new THREE.BoxGeometry(0.08, 0.5, 0.04);
    this.spinePlate = new THREE.Mesh(spineGeom, this.glowCyanMaterial);
    this.spinePlate.position.set(0, 0.05, -0.18);
    this.torso.add(this.spinePlate);

    // Chest Core
    const coreGeom = new THREE.CylinderGeometry(0.09, 0.09, 0.05, 12);
    coreGeom.rotateX(Math.PI / 2);
    this.chestCore = new THREE.Mesh(coreGeom, this.glowCoreMaterial);
    this.chestCore.position.set(0, 0.08, 0.18);
    this.torso.add(this.chestCore);

    // 2. Head & Helmet
    const headGeom = new THREE.BoxGeometry(0.32, 0.34, 0.36);
    this.head = new THREE.Mesh(headGeom, this.armorAccentMaterial);
    this.head.position.set(0, 1.68, 0.02);
    this.head.castShadow = true;
    this.runnerMeshGroup.add(this.head);

    // Visor
    const visorGeom = new THREE.BoxGeometry(0.28, 0.12, 0.1);
    this.visor = new THREE.Mesh(visorGeom, this.glowCyanMaterial);
    this.visor.position.set(0, 0.02, 0.17);
    this.head.add(this.visor);

    // Aerodynamic Helmet Crest (For Valkyrie & Apex Specs)
    const crestGeom = new THREE.BoxGeometry(0.06, 0.12, 0.32);
    this.helmetCrest = new THREE.Mesh(crestGeom, this.glowCyanMaterial);
    this.helmetCrest.position.set(0, 0.22, 0);
    this.helmetCrest.visible = false;
    this.head.add(this.helmetCrest);

    // Quantum Halo Ring (For Void Spectre)
    const haloGeom = new THREE.TorusGeometry(0.26, 0.02, 6, 24);
    haloGeom.rotateX(Math.PI / 2);
    this.haloRing = new THREE.Mesh(haloGeom, this.glowCyanMaterial);
    this.haloRing.position.set(0, 0.32, 0);
    this.haloRing.visible = false;
    this.head.add(this.haloRing);

    // 3. Cybernetic Shoulder Pauldrons (3D Armor Silhouette)
    const shoulderGeom = new THREE.BoxGeometry(0.22, 0.14, 0.28);
    const shoulderL = new THREE.Mesh(shoulderGeom, this.armorAccentMaterial);
    shoulderL.position.set(-0.36, 1.48, 0);
    shoulderL.castShadow = true;
    this.runnerMeshGroup.add(shoulderL);

    const shoulderR = new THREE.Mesh(shoulderGeom, this.armorAccentMaterial);
    shoulderR.position.set(0.36, 1.48, 0);
    shoulderR.castShadow = true;
    this.runnerMeshGroup.add(shoulderR);

    // Reinforced Heavy Armor Pauldrons (For Titan Warping Juggernaut)
    const heavyPlateGeom = new THREE.BoxGeometry(0.28, 0.22, 0.32);
    this.heavyShoulderL = new THREE.Mesh(heavyPlateGeom, this.armorAccentMaterial);
    this.heavyShoulderL.position.set(-0.42, 1.52, 0);
    this.heavyShoulderL.castShadow = true;
    this.heavyShoulderL.visible = false;
    this.runnerMeshGroup.add(this.heavyShoulderL);

    this.heavyShoulderR = new THREE.Mesh(heavyPlateGeom, this.armorAccentMaterial);
    this.heavyShoulderR.position.set(0.42, 1.52, 0);
    this.heavyShoulderR.castShadow = true;
    this.heavyShoulderR.visible = false;
    this.runnerMeshGroup.add(this.heavyShoulderR);

    // 4. Jetpack / Phase Core
    const packGeom = new THREE.BoxGeometry(0.4, 0.5, 0.2);
    this.jetpack = new THREE.Mesh(packGeom, this.armorAccentMaterial);
    this.jetpack.position.set(0, 0.05, -0.24);
    this.jetpack.castShadow = true;
    this.torso.add(this.jetpack);

    // Aerodynamic Jetpack Phase Wing Blades (For Valkyrie)
    const wingGeom = new THREE.BoxGeometry(0.38, 0.08, 0.03);
    this.wingL = new THREE.Mesh(wingGeom, this.glowCyanMaterial);
    this.wingL.position.set(-0.35, 0.12, 0);
    this.wingL.rotation.z = 0.35;
    this.wingL.visible = false;
    this.jetpack.add(this.wingL);

    this.wingR = new THREE.Mesh(wingGeom, this.glowCyanMaterial);
    this.wingR.position.set(0.35, 0.12, 0);
    this.wingR.rotation.z = -0.35;
    this.wingR.visible = false;
    this.jetpack.add(this.wingR);

    // Thruster nozzles
    const nozzleGeom = new THREE.CylinderGeometry(0.06, 0.09, 0.16, 8);
    this.thrusterL = new THREE.Mesh(nozzleGeom, this.glowCyanMaterial);
    this.thrusterL.position.set(-0.13, -0.28, 0);
    this.jetpack.add(this.thrusterL);

    this.thrusterR = new THREE.Mesh(nozzleGeom, this.glowCyanMaterial);
    this.thrusterR.position.set(0.13, -0.28, 0);
    this.jetpack.add(this.thrusterR);

    // Glowing thruster exhaust flame plumes
    const flameGeom = new THREE.ConeGeometry(0.065, 0.28, 8);
    flameGeom.rotateX(Math.PI);
    const flameMat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      transparent: true,
      opacity: 0.85,
    });
    this.thrusterFlameL = new THREE.Mesh(flameGeom, flameMat);
    this.thrusterFlameL.position.set(-0.13, -0.46, 0);
    this.jetpack.add(this.thrusterFlameL);

    this.thrusterFlameR = new THREE.Mesh(flameGeom, flameMat.clone());
    this.thrusterFlameR.position.set(0.13, -0.46, 0);
    this.jetpack.add(this.thrusterFlameR);

    // 4. Arms
    const armGeom = new THREE.BoxGeometry(0.16, 0.55, 0.16);
    // Left Arm
    this.leftArmGroup = new THREE.Group();
    this.leftArmGroup.position.set(-0.38, 1.4, 0);
    const leftArmMesh = new THREE.Mesh(armGeom, this.suitMaterial);
    leftArmMesh.position.y = -0.25;
    leftArmMesh.castShadow = true;
    this.leftArmGroup.add(leftArmMesh);
    this.runnerMeshGroup.add(this.leftArmGroup);

    // Right Arm
    this.rightArmGroup = new THREE.Group();
    this.rightArmGroup.position.set(0.38, 1.4, 0);
    const rightArmMesh = new THREE.Mesh(armGeom, this.suitMaterial);
    rightArmMesh.position.y = -0.25;
    rightArmMesh.castShadow = true;
    this.rightArmGroup.add(rightArmMesh);
    this.runnerMeshGroup.add(this.rightArmGroup);

    // 5. Legs
    const thighGeom = new THREE.BoxGeometry(0.2, 0.45, 0.22);
    const shinGeom = new THREE.BoxGeometry(0.18, 0.45, 0.2);
    const bootGeom = new THREE.BoxGeometry(0.22, 0.16, 0.36);

    // Left Leg
    this.leftLegGroup = new THREE.Group();
    this.leftLegGroup.position.set(-0.18, 0.85, 0);
    const leftThigh = new THREE.Mesh(thighGeom, this.suitMaterial);
    leftThigh.position.y = -0.22;
    leftThigh.castShadow = true;
    this.leftLegGroup.add(leftThigh);

    this.leftShin = new THREE.Mesh(shinGeom, this.armorAccentMaterial);
    this.leftShin.position.set(0, -0.55, 0.02);
    this.leftShin.castShadow = true;
    this.leftLegGroup.add(this.leftShin);

    this.leftBoot = new THREE.Mesh(bootGeom, this.glowCyanMaterial);
    this.leftBoot.position.set(0, -0.78, 0.06);
    this.leftBoot.castShadow = true;
    this.leftLegGroup.add(this.leftBoot);
    this.runnerMeshGroup.add(this.leftLegGroup);

    // Right Leg
    this.rightLegGroup = new THREE.Group();
    this.rightLegGroup.position.set(0.18, 0.85, 0);
    const rightThigh = new THREE.Mesh(thighGeom, this.suitMaterial);
    rightThigh.position.y = -0.22;
    rightThigh.castShadow = true;
    this.rightLegGroup.add(rightThigh);

    this.rightShin = new THREE.Mesh(shinGeom, this.armorAccentMaterial);
    this.rightShin.position.set(0, -0.55, 0.02);
    this.rightShin.castShadow = true;
    this.rightLegGroup.add(this.rightShin);

    this.rightBoot = new THREE.Mesh(bootGeom, this.glowCyanMaterial);
    this.rightBoot.position.set(0, -0.78, 0.06);
    this.rightBoot.castShadow = true;
    this.rightLegGroup.add(this.rightBoot);
    this.runnerMeshGroup.add(this.rightLegGroup);

    // 6. Shield Bubble
    const shieldGeom = new THREE.IcosahedronGeometry(1.35, 2);
    const shieldMat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      wireframe: true,
      transparent: true,
      opacity: 0,
    });
    this.shieldMesh = new THREE.Mesh(shieldGeom, shieldMat);
    this.shieldMesh.position.y = 1.0;
    this.runnerMeshGroup.add(this.shieldMesh);

    // 7. Magnet Rings
    const ringGeom = new THREE.TorusGeometry(1.15, 0.04, 8, 24);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xf59e0b,
      transparent: true,
      opacity: 0,
    });
    this.magnetRing1 = new THREE.Mesh(ringGeom, ringMat);
    this.magnetRing1.position.y = 1.0;
    this.magnetRing2 = new THREE.Mesh(ringGeom, ringMat);
    this.magnetRing2.position.y = 1.0;
    this.magnetRing2.rotation.x = Math.PI / 2;
    this.runnerMeshGroup.add(this.magnetRing1);
    this.runnerMeshGroup.add(this.magnetRing2);

    // 8. Thruster light
    this.thrusterLight = new THREE.PointLight(0x00f0ff, 1.2, 8);
    this.thrusterLight.position.set(0, 1.0, -0.6);
    this.group.add(this.thrusterLight);

    // 9. Ground Contact Blob Shadow (Direct 3D ground projection)
    const shadowCanvas = document.createElement('canvas');
    shadowCanvas.width = 128;
    shadowCanvas.height = 128;
    const sCtx = shadowCanvas.getContext('2d')!;
    const grad = sCtx.createRadialGradient(64, 64, 8, 64, 64, 58);
    grad.addColorStop(0, 'rgba(0, 0, 0, 0.85)');
    grad.addColorStop(0.5, 'rgba(0, 0, 0, 0.45)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    sCtx.fillStyle = grad;
    sCtx.fillRect(0, 0, 128, 128);

    const shadowTex = new THREE.CanvasTexture(shadowCanvas);
    const shadowGeom = new THREE.PlaneGeometry(1.5, 1.1);
    shadowGeom.rotateX(-Math.PI / 2);
    const shadowMat = new THREE.MeshBasicMaterial({
      map: shadowTex,
      transparent: true,
      opacity: 0.75,
      depthWrite: false,
    });
    this.blobShadow = new THREE.Mesh(shadowGeom, shadowMat);
    this.blobShadow.position.y = 0.03;
    this.group.add(this.blobShadow);
  }

  public updateAnimation(
    delta: number,
    speed: number,
    isJumping: boolean,
    isSliding: boolean,
    jumpProgress: number, // 0 to 1
    gravityState: 'NORMAL' | 'REVERSED' | 'ZERO_G',
    hasShield: boolean,
    hasMagnet: boolean,
    jumpAltitude: number = 0
  ) {
    this.animTime += delta * (speed / 16);

    // Update 3D ground contact blob shadow
    // When character jumps into 3D air, shadow stays pinned to floor and shrinks with height
    const altitude = Math.max(0, jumpAltitude);
    const shadowScale = Math.max(0.35, 1.0 - altitude * 0.28);
    this.blobShadow.scale.set(shadowScale, shadowScale, shadowScale);
    (this.blobShadow.material as THREE.MeshBasicMaterial).opacity = Math.max(0.15, 0.75 - altitude * 0.35);
    this.blobShadow.position.y = -altitude + 0.03;

    // Shield glow
    const shieldMat = this.shieldMesh.material as THREE.MeshBasicMaterial;
    if (hasShield) {
      shieldMat.opacity = 0.4 + Math.sin(this.animTime * 8) * 0.15;
      this.shieldMesh.rotation.y += delta * 1.5;
      this.shieldMesh.rotation.x += delta * 0.8;
      this.shieldMesh.visible = true;
    } else {
      this.shieldMesh.visible = false;
    }

    // Magnet ring glow
    const ringMat1 = this.magnetRing1.material as THREE.MeshBasicMaterial;
    const ringMat2 = this.magnetRing2.material as THREE.MeshBasicMaterial;
    if (hasMagnet) {
      ringMat1.opacity = 0.6;
      ringMat2.opacity = 0.6;
      this.magnetRing1.rotation.y += delta * 3.5;
      this.magnetRing2.rotation.z += delta * 2.8;
      this.magnetRing1.visible = true;
      this.magnetRing2.visible = true;
    } else {
      this.magnetRing1.visible = false;
      this.magnetRing2.visible = false;
    }

    // Pose based on states
    if (isSliding) {
      // Sliding posture: leaned back, lower center of gravity
      this.runnerMeshGroup.position.y = -0.55;
      this.runnerMeshGroup.rotation.x = -0.7; // Lean back
      this.leftLegGroup.rotation.x = -1.1;  // Leg extended forward
      this.rightLegGroup.rotation.x = -1.2;
      this.leftArmGroup.rotation.x = 0.8;
      this.rightArmGroup.rotation.x = 0.8;
      this.head.rotation.x = 0.5; // Look forward while leaning back
      return;
    }

    // Reset slide offsets
    this.runnerMeshGroup.position.y = 0;
    this.head.rotation.x = 0;

    if (isJumping) {
      // Jump pose: kinetic tuck or jetpack leap
      const phase = Math.sin(jumpProgress * Math.PI);
      this.runnerMeshGroup.rotation.x = 0.15;
      this.leftLegGroup.rotation.x = -0.3 * phase;
      this.rightLegGroup.rotation.x = 0.4 * phase;
      this.leftArmGroup.rotation.x = -0.6 * phase;
      this.rightArmGroup.rotation.x = -0.6 * phase;
      return;
    }

    if (gravityState === 'ZERO_G') {
      // Repulsor Hover Glide pose: athletic forward aerodynamic stance hovering above floor
      this.runnerMeshGroup.rotation.x = 0.22; // subtle forward glide lean
      this.leftLegGroup.rotation.x = -0.25;
      this.rightLegGroup.rotation.x = 0.2;
      this.leftArmGroup.rotation.x = -0.4;
      this.rightArmGroup.rotation.x = 0.3;
      this.head.rotation.x = -0.05;
      return;
    }

    // Normal running stride
    const stride = Math.sin(this.animTime * 12);
    this.runnerMeshGroup.rotation.x = 0.18; // slight forward athletic lean

    this.leftLegGroup.rotation.x = stride * 0.75;
    this.rightLegGroup.rotation.x = -stride * 0.75;

    this.leftArmGroup.rotation.x = -stride * 0.75;
    this.rightArmGroup.rotation.x = stride * 0.75;

    // Dynamic Thruster Flame Animation
    const flameFlicker = 0.85 + Math.sin(this.animTime * 28) * 0.25;
    this.thrusterFlameL.scale.set(flameFlicker, flameFlicker, flameFlicker);
    this.thrusterFlameR.scale.set(flameFlicker, flameFlicker, flameFlicker);

    // Operative Attachments Animation
    if (this.haloRing.visible) {
      this.haloRing.rotation.z += delta * 2.4;
      this.haloRing.position.y = 0.32 + Math.sin(this.animTime * 6) * 0.04;
    }
    if (this.wingL.visible) {
      const wingFlutter = Math.sin(this.animTime * 14) * 0.08;
      this.wingL.rotation.z = 0.35 + wingFlutter;
      this.wingR.rotation.z = -0.35 - wingFlutter;
    }

    // Subtle hip bob
    this.torso.position.y = 1.15 + Math.abs(Math.sin(this.animTime * 12)) * 0.08;
    this.head.position.y = 1.68 + Math.abs(Math.sin(this.animTime * 12)) * 0.08;
  }

  public setAccentColor(colorHex: number) {
    (this.visor.material as THREE.MeshBasicMaterial).color.setHex(colorHex);
    (this.spinePlate.material as THREE.MeshBasicMaterial).color.setHex(colorHex);
    (this.leftBoot.material as THREE.MeshBasicMaterial).color.setHex(colorHex);
    (this.rightBoot.material as THREE.MeshBasicMaterial).color.setHex(colorHex);
    (this.thrusterL.material as THREE.MeshBasicMaterial).color.setHex(colorHex);
    (this.thrusterR.material as THREE.MeshBasicMaterial).color.setHex(colorHex);
    (this.thrusterFlameL.material as THREE.MeshBasicMaterial).color.setHex(colorHex);
    (this.thrusterFlameR.material as THREE.MeshBasicMaterial).color.setHex(colorHex);
    this.thrusterLight.color.setHex(colorHex);
  }

  public setSkin(skin: OperativeSkin) {
    // Reset all optional operative attachments
    this.wingL.visible = false;
    this.wingR.visible = false;
    this.helmetCrest.visible = false;
    this.haloRing.visible = false;
    this.heavyShoulderL.visible = false;
    this.heavyShoulderR.visible = false;

    switch (skin) {
      case 'SOLAR_APEX':
        this.suitMaterial.color.setHex(0x18181b);
        this.armorAccentMaterial.color.setHex(0xd97706);
        this.glowCyanMaterial.color.setHex(0xfbbf24);
        this.glowCoreMaterial.color.setHex(0xf59e0b);
        this.helmetCrest.visible = true;
        this.setAccentColor(0xfbbf24);
        break;

      case 'PRISM_CYBER':
        this.suitMaterial.color.setHex(0x180d2b);
        this.armorAccentMaterial.color.setHex(0x4c1d95);
        this.glowCyanMaterial.color.setHex(0xd946ef);
        this.glowCoreMaterial.color.setHex(0xa855f7);
        this.setAccentColor(0xd946ef);
        break;

      case 'EMERALD_VOID':
        this.suitMaterial.color.setHex(0x022c22);
        this.armorAccentMaterial.color.setHex(0x065f46);
        this.glowCyanMaterial.color.setHex(0x10b981);
        this.glowCoreMaterial.color.setHex(0x34d399);
        this.setAccentColor(0x10b981);
        break;

      case 'CRIMSON_PHANTOM':
        this.suitMaterial.color.setHex(0x1a0509);
        this.armorAccentMaterial.color.setHex(0x881337);
        this.glowCyanMaterial.color.setHex(0xf43f5e);
        this.glowCoreMaterial.color.setHex(0xff0040);
        this.helmetCrest.visible = true;
        this.setAccentColor(0xf43f5e);
        break;

      case 'TITAN_WARPING':
        this.suitMaterial.color.setHex(0x27272a);
        this.armorAccentMaterial.color.setHex(0x78716c);
        this.glowCyanMaterial.color.setHex(0xf97316);
        this.glowCoreMaterial.color.setHex(0xea580c);
        this.heavyShoulderL.visible = true;
        this.heavyShoulderR.visible = true;
        this.setAccentColor(0xf97316);
        break;

      case 'VALKYRIE_NEO':
        this.suitMaterial.color.setHex(0xf1f5f9);
        this.armorAccentMaterial.color.setHex(0x6366f1);
        this.glowCyanMaterial.color.setHex(0x38bdf8);
        this.glowCoreMaterial.color.setHex(0x818cf8);
        this.wingL.visible = true;
        this.wingR.visible = true;
        this.helmetCrest.visible = true;
        this.setAccentColor(0x38bdf8);
        break;

      case 'VOID_SPECTRE':
        this.suitMaterial.color.setHex(0x050508);
        this.armorAccentMaterial.color.setHex(0x312e81);
        this.glowCyanMaterial.color.setHex(0xc084fc);
        this.glowCoreMaterial.color.setHex(0xa855f7);
        this.haloRing.visible = true;
        this.setAccentColor(0xc084fc);
        break;

      case 'CYAN_VANGUARD':
      default:
        this.suitMaterial.color.setHex(0x384556);
        this.armorAccentMaterial.color.setHex(0x64748b);
        this.glowCyanMaterial.color.setHex(0x00f0ff);
        this.glowCoreMaterial.color.setHex(0x38bdf8);
        this.setAccentColor(0x00f0ff);
        break;
    }
  }
}
