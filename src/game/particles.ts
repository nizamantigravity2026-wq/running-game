import * as THREE from 'three';

interface Particle {
  pos: THREE.Vector3;
  vel: THREE.Vector3;
  color: THREE.Color;
  size: number;
  life: number;
  maxLife: number;
}

export class ParticleSystem {
  private particles: Particle[] = [];
  private geom: THREE.BufferGeometry;
  private points: THREE.Points;
  private positions: Float32Array;
  private colors: Float32Array;
  private sizes: Float32Array;
  private maxParticles: number = 800;

  constructor(scene: THREE.Scene) {
    this.geom = new THREE.BufferGeometry();
    this.positions = new Float32Array(this.maxParticles * 3);
    this.colors = new Float32Array(this.maxParticles * 3);
    this.sizes = new Float32Array(this.maxParticles);

    this.geom.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
    this.geom.setAttribute('color', new THREE.BufferAttribute(this.colors, 3));
    this.geom.setAttribute('size', new THREE.BufferAttribute(this.sizes, 1));

    const material = new THREE.PointsMaterial({
      size: 0.25,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    this.points = new THREE.Points(this.geom, material);
    scene.add(this.points);
  }

  public emit(
    pos: THREE.Vector3, 
    vel: THREE.Vector3, 
    colorHex: number, 
    life: number = 0.5, 
    size: number = 0.25
  ) {
    if (this.particles.length >= this.maxParticles) {
      this.particles.shift();
    }

    this.particles.push({
      pos: pos.clone(),
      vel: vel.clone(),
      color: new THREE.Color(colorHex),
      size,
      life,
      maxLife: life,
    });
  }

  public emitBurst(pos: THREE.Vector3, colorHex: number, count: number = 16, speed: number = 4) {
    for (let i = 0; i < count; i++) {
      const angle1 = Math.random() * Math.PI * 2;
      const angle2 = (Math.random() - 0.5) * Math.PI;
      const vel = new THREE.Vector3(
        Math.cos(angle1) * Math.cos(angle2) * speed * (0.4 + Math.random() * 0.8),
        Math.sin(angle2) * speed * (0.4 + Math.random() * 0.8),
        Math.sin(angle1) * Math.cos(angle2) * speed * (0.4 + Math.random() * 0.8)
      );
      this.emit(pos, vel, colorHex, 0.45 + Math.random() * 0.35, 0.28 + Math.random() * 0.2);
    }
  }

  public emitSlideSparks(pos: THREE.Vector3, count: number = 3) {
    for (let i = 0; i < count; i++) {
      const vel = new THREE.Vector3(
        (Math.random() - 0.5) * 4,
        Math.random() * 2 + 0.5,
        -Math.random() * 6 - 2
      );
      this.emit(pos, vel, 0xf59e0b, 0.2 + Math.random() * 0.2, 0.18);
    }
  }

  public update(delta: number) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= delta;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }
      p.pos.addScaledVector(p.vel, delta);
    }

    // Update GPU buffers
    for (let i = 0; i < this.maxParticles; i++) {
      const idx3 = i * 3;
      if (i < this.particles.length) {
        const p = this.particles[i];
        this.positions[idx3] = p.pos.x;
        this.positions[idx3 + 1] = p.pos.y;
        this.positions[idx3 + 2] = p.pos.z;

        const alpha = p.life / p.maxLife;
        this.colors[idx3] = p.color.r * alpha;
        this.colors[idx3 + 1] = p.color.g * alpha;
        this.colors[idx3 + 2] = p.color.b * alpha;

        this.sizes[i] = p.size * alpha;
      } else {
        this.positions[idx3] = 0;
        this.positions[idx3 + 1] = -999;
        this.positions[idx3 + 2] = 0;
        this.sizes[i] = 0;
      }
    }

    this.geom.attributes.position.needsUpdate = true;
    this.geom.attributes.color.needsUpdate = true;
    this.geom.attributes.size.needsUpdate = true;
  }

  public dispose() {
    this.geom.dispose();
  }
}
