import * as THREE from 'three';

export class SpeedLines {
  public mesh: THREE.LineSegments;
  private lineCount: number = 90;
  private positions: Float32Array;
  private velocities: Float32Array;
  private lengths: Float32Array;
  private material: THREE.LineBasicMaterial;
  private radius: number = 6.5;
  private tunnelLength: number = 40;

  constructor() {
    const geometry = new THREE.BufferGeometry();
    this.positions = new Float32Array(this.lineCount * 6); // 2 vertices per line (x,y,z * 2)
    this.velocities = new Float32Array(this.lineCount);
    this.lengths = new Float32Array(this.lineCount);

    for (let i = 0; i < this.lineCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = this.radius * (0.45 + Math.random() * 0.7);
      const x = Math.cos(angle) * dist;
      const y = Math.sin(angle) * dist;
      const z = Math.random() * this.tunnelLength;
      const len = 3.5 + Math.random() * 5.0;

      const idx = i * 6;
      this.positions[idx] = x;
      this.positions[idx + 1] = y;
      this.positions[idx + 2] = z;

      this.positions[idx + 3] = x;
      this.positions[idx + 4] = y;
      this.positions[idx + 5] = z + len;

      this.velocities[i] = 45 + Math.random() * 40;
      this.lengths[i] = len;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));

    this.material = new THREE.LineBasicMaterial({
      color: 0x00f0ff,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      linewidth: 1.5,
      depthWrite: false,
    });

    this.mesh = new THREE.LineSegments(geometry, this.material);
    this.mesh.frustumCulled = false;
  }

  public update(
    camera: THREE.PerspectiveCamera,
    speed: number,
    baseSpeed: number,
    maxSpeed: number,
    isHyperBoost: boolean,
    delta: number
  ) {
    // Determine target opacity based on current speed and boost
    let targetOpacity = 0;
    if (isHyperBoost) {
      targetOpacity = 0.85;
      this.material.color.setHex(0xf43f5e); // Hot pink/crimson warp
    } else if (speed > 30) {
      const ratio = (speed - 30) / (maxSpeed - 30);
      targetOpacity = Math.min(0.65, ratio * 0.65);
      this.material.color.setHex(0x38bdf8); // Cyan warp
    }

    // Smooth lerp opacity
    this.material.opacity += (targetOpacity - this.material.opacity) * Math.min(1, 10 * delta);

    if (this.material.opacity < 0.02) {
      this.mesh.visible = false;
      return;
    }
    this.mesh.visible = true;

    // Attach speed lines directly to follow camera
    this.mesh.position.copy(camera.position);
    this.mesh.quaternion.copy(camera.quaternion);

    const posAttr = this.mesh.geometry.attributes.position as THREE.BufferAttribute;
    const speedMult = isHyperBoost ? 2.2 : (speed / baseSpeed);

    for (let i = 0; i < this.lineCount; i++) {
      const idx = i * 6;
      let z1 = this.positions[idx + 2] - this.velocities[i] * speedMult * delta;
      let z2 = z1 + this.lengths[i] * (isHyperBoost ? 1.8 : 1.0);

      // Wrap around tunnel bounds
      if (z2 < 2) {
        z1 = this.tunnelLength + Math.random() * 5;
        z2 = z1 + this.lengths[i] * (isHyperBoost ? 1.8 : 1.0);

        // Reposition angle for dynamic distribution
        const angle = Math.random() * Math.PI * 2;
        const dist = this.radius * (0.45 + Math.random() * 0.7);
        const x = Math.cos(angle) * dist;
        const y = Math.sin(angle) * dist;

        this.positions[idx] = x;
        this.positions[idx + 1] = y;
        this.positions[idx + 3] = x;
        this.positions[idx + 4] = y;
      }

      this.positions[idx + 2] = z1;
      this.positions[idx + 5] = z2;
    }

    posAttr.needsUpdate = true;
  }

  public dispose() {
    this.mesh.geometry.dispose();
    this.material.dispose();
  }
}
