import * as THREE from 'three';
import { 
  LANES, 
  FLOOR_Y, 
  CEILING_Y, 
  ZERO_G_Y, 
  RUNNER_HEIGHT, 
  RUNNER_WIDTH, 
  SLIDE_HEIGHT,
  BASE_SPEED, 
  MAX_SPEED, 
  ACCELERATION,
  JUMP_DURATION, 
  JUMP_HEIGHT, 
  SLIDE_DURATION,
  GRAV_ENERGY_MAX,
  GRAV_ENERGY_DEPLETION_RATE,
  GRAV_ENERGY_ORB_RESTORE,
  GRAV_ENERGY_PASSIVE_RECHARGE,
  ENVIRONMENTS
} from './constants';
import { 
  GameState, 
  GravityState, 
  EnvironmentTheme, 
  PowerUpType, 
  PowerUpActive, 
  GameStats, 
  ObstacleType,
  OperativeSkin,
  TechUpgrades,
  GameNotification
} from './types';
import { RunnerCharacter } from './character';
import { TrackManager, ObstacleInstance } from './trackManager';
import { ParticleSystem } from './particles';
import { BackgroundManager } from './backgroundManager';
import { SpeedLines } from './speedLines';
import { sound } from './audio';

export class GameEngine {
  private container: HTMLElement;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private animFrameId: number | null = null;
  private lastTime: number = 0;

  // Lights & Fog
  private ambientLight: THREE.AmbientLight;
  private dirLight: THREE.DirectionalLight;
  private hemiLight: THREE.HemisphereLight;
  private runnerLight: THREE.PointLight;
  private backgroundManager: BackgroundManager;
  private speedLines: SpeedLines;

  // Subsystems
  private runner: RunnerCharacter;
  private trackManager: TrackManager;
  private particles: ParticleSystem;

  // Screen Shake system
  private shakeIntensity: number = 0;
  private shakeDuration: number = 0;
  private shakeElapsed: number = 0;

  // Customization & Upgrades
  public skin: OperativeSkin = 'CYAN_VANGUARD';
  public upgrades: TechUpgrades = {
    magnetLevel: 0,
    shieldLevel: 0,
    energyCellLevel: 0,
    orbBonusLevel: 0,
  };
  private reachedMilestones: Set<number> = new Set();

  // Game Play State
  public state: GameState = 'MENU';
  public gravityState: GravityState = 'NORMAL';
  public currentTheme: EnvironmentTheme = 'NEO_VANGUARD';

  // Stats
  public score: number = 0;
  public distance: number = 0;
  public orbsCollected: number = 0;
  public multiplier: number = 1;
  public highScore: number = 0;
  public gravEnergy: number = 100;
  public currentSpeed: number = BASE_SPEED;
  public activePowerUps: PowerUpActive[] = [];

  // Movement & Physics
  private currentLane: number = 1; // Center lane
  private targetLane: number = 1;
  private playerX: number = 0;
  private playerY: number = FLOOR_Y;
  private playerZ: number = 0;

  private isJumping: boolean = false;
  private jumpTimer: number = 0;

  private isSliding: boolean = false;
  private slideTimer: number = 0;

  // Gravity transition
  private targetPlayerY: number = FLOOR_Y;
  private gravFlipProgress: number = 0; // 0 to 1
  private isFlippingGravity: boolean = false;
  private cameraRoll: number = 0; // 0 to Math.PI

  // Invulnerability window after shield hit
  private invulnerableTimer: number = 0;
  private orbCombo: number = 0;
  private comboResetTimer: number = 0;

  // Mobile Swipe tracking
  private touchStartX: number = 0;
  private touchStartY: number = 0;

  // Callbacks for React HUD
  public onStatsUpdate?: (stats: GameStats) => void;
  public onStateChange?: (state: GameState) => void;
  public onEnvironmentChange?: (theme: EnvironmentTheme) => void;
  public onNotification?: (notification: GameNotification) => void;

  constructor(container: HTMLElement) {
    this.container = container;

    // Load High Score from localStorage
    const savedHighScore = localStorage.getItem('grav_runner_highscore');
    if (savedHighScore) {
      this.highScore = parseInt(savedHighScore, 10) || 0;
    }

    // 1. Scene
    this.scene = new THREE.Scene();
    const env = ENVIRONMENTS[this.currentTheme];
    this.scene.background = new THREE.Color(env.skyColor);
    this.scene.fog = new THREE.Fog(env.fogColor, env.fogNear, env.fogFar);

    // 2. Camera with expanded view frustum for massive horizon vistas
    this.camera = new THREE.PerspectiveCamera(
      62,
      container.clientWidth / container.clientHeight,
      0.1,
      1400
    );
    this.camera.position.set(0, 3.2, -6.5);
    this.camera.lookAt(0, 1.2, 12);

    // 3. Renderer with real-time 3D shadow maps
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
      alpha: false,
    });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.25;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(this.renderer.domElement);

    // 4. Lights with dynamic 3D directional shadowing
    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.75);
    this.scene.add(this.ambientLight);

    this.dirLight = new THREE.DirectionalLight(0xffffff, 1.8);
    this.dirLight.position.set(12, 26, -8);
    this.dirLight.castShadow = true;
    this.dirLight.shadow.mapSize.width = 1024;
    this.dirLight.shadow.mapSize.height = 1024;
    this.dirLight.shadow.camera.near = 0.5;
    this.dirLight.shadow.camera.far = 85;
    this.dirLight.shadow.camera.left = -14;
    this.dirLight.shadow.camera.right = 14;
    this.dirLight.shadow.camera.top = 22;
    this.dirLight.shadow.camera.bottom = -10;
    this.dirLight.shadow.bias = -0.0005;
    this.scene.add(this.dirLight);
    this.scene.add(this.dirLight.target);

    this.hemiLight = new THREE.HemisphereLight(0x38bdf8, 0x0f172a, 0.75);
    this.scene.add(this.hemiLight);

    // Dedicated dynamic aura light illuminating runner and nearby road
    this.runnerLight = new THREE.PointLight(0x00f0ff, 2.5, 22);
    this.scene.add(this.runnerLight);

    // 5. Cinematic Sci-Fi Background Vista (Nebula, Ringed Planet, Horizon Skyline, Sky Traffic)
    this.backgroundManager = new BackgroundManager(this.scene, this.currentTheme);

    // 6. Subsystems
    this.trackManager = new TrackManager(this.scene, this.currentTheme);
    this.runner = new RunnerCharacter();
    this.scene.add(this.runner.group);
    this.particles = new ParticleSystem(this.scene);

    // 7. Supersonic Speed Lines FX
    this.speedLines = new SpeedLines();
    this.scene.add(this.speedLines.mesh);

    // Load saved skin and upgrades
    const savedSkin = localStorage.getItem('grav_runner_skin') as OperativeSkin | null;
    if (savedSkin) {
      this.skin = savedSkin;
      this.runner.setSkin(savedSkin);
    }
    const savedUpgrades = localStorage.getItem('grav_runner_upgrades');
    if (savedUpgrades) {
      try {
        this.upgrades = JSON.parse(savedUpgrades);
      } catch {
        // default
      }
    }

    // Setup input listeners
    this.setupListeners();
    this.resetPlayerPosition();

    // Start render loop
    this.startLoop();
  }

  public triggerShake(intensity: number = 0.25, duration: number = 0.25) {
    this.shakeIntensity = Math.max(this.shakeIntensity, intensity);
    this.shakeDuration = duration;
    this.shakeElapsed = 0;
  }

  public setSkin(skin: OperativeSkin) {
    this.skin = skin;
    this.runner.setSkin(skin);
    localStorage.setItem('grav_runner_skin', skin);
  }

  public setUpgrades(upgrades: TechUpgrades) {
    this.upgrades = upgrades;
    localStorage.setItem('grav_runner_upgrades', JSON.stringify(upgrades));
  }

  public triggerNearMiss() {
    const bonus = Math.round(150 * this.multiplier);
    this.score += bonus;
    this.triggerShake(0.14, 0.15);
    sound.playNearMiss();

    // Visual burst at runner position
    this.particles.emitBurst(
      new THREE.Vector3(this.playerX, this.playerY + 1.0, this.playerZ),
      0xfbbf24,
      14,
      4
    );

    if (this.onNotification) {
      this.onNotification({
        id: Math.random().toString(),
        text: `CLOSE CALL! +${bonus}`,
        subtext: 'SUPERSONIC DODGE',
        colorClass: 'text-amber-400',
      });
    }
  }

  private setupListeners() {
    window.addEventListener('resize', this.onResize);
    window.addEventListener('keydown', this.onKeyDown);

    // Touch event handling for mobile swipe
    this.container.addEventListener('touchstart', this.onTouchStart, { passive: true });
    this.container.addEventListener('touchend', this.onTouchEnd, { passive: true });
  }

  private onResize = () => {
    if (!this.container || !this.renderer || !this.camera) return;
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  };

  private onKeyDown = (e: KeyboardEvent) => {
    if (e.code === 'KeyP' || e.code === 'Escape') {
      if (this.state === 'PLAYING') {
        this.pauseGame();
      } else if (this.state === 'PAUSED') {
        this.resumeGame();
      }
      return;
    }

    if (this.state !== 'PLAYING') return;

    if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
      this.switchLane(-1);
    } else if (e.code === 'ArrowRight' || e.code === 'KeyD') {
      this.switchLane(1);
    } else if (e.code === 'ArrowUp' || e.code === 'KeyW' || e.code === 'Space') {
      this.jump();
    } else if (e.code === 'ArrowDown' || e.code === 'KeyS') {
      this.slide();
    } else if (e.code === 'KeyG' || e.code === 'KeyF') {
      this.toggleGravity();
    }
  };

  private onTouchStart = (e: TouchEvent) => {
    if (e.touches.length > 0) {
      this.touchStartX = e.touches[0].clientX;
      this.touchStartY = e.touches[0].clientY;
    }
  };

  private onTouchEnd = (e: TouchEvent) => {
    if (this.state !== 'PLAYING' || e.changedTouches.length === 0) return;

    const dx = e.changedTouches[0].clientX - this.touchStartX;
    const dy = e.changedTouches[0].clientY - this.touchStartY;
    const absX = Math.abs(dx);
    const absY = Math.abs(dy);

    const minSwipeDist = 28;

    if (absX > absY && absX > minSwipeDist) {
      // Horizontal swipe
      if (dx > 0) {
        this.switchLane(1);
      } else {
        this.switchLane(-1);
      }
    } else if (absY > absX && absY > minSwipeDist) {
      // Vertical swipe
      if (dy < 0) {
        this.jump();
      } else {
        this.slide();
      }
    }
  };

  public startGame() {
    this.state = 'PLAYING';
    this.score = 0;
    this.distance = 0;
    this.orbsCollected = 0;
    this.multiplier = 1;
    const maxGrav = 100 + (this.upgrades.energyCellLevel || 0) * 15;
    this.gravEnergy = maxGrav;
    this.currentSpeed = BASE_SPEED;
    this.activePowerUps = [];
    this.currentLane = 1;
    this.targetLane = 1;
    this.gravityState = 'NORMAL';
    this.targetPlayerY = FLOOR_Y;
    this.playerY = FLOOR_Y;
    this.cameraRoll = 0;
    this.invulnerableTimer = 0;
    this.orbCombo = 0;
    this.reachedMilestones.clear();

    this.resetPlayerPosition();
    this.runner.setSkin(this.skin);
    this.trackManager.reset(-10);
    this.setEnvironment('NEO_VANGUARD');

    // Starting Shield upgrade bonus if level >= 2
    if (this.upgrades.shieldLevel >= 2) {
      this.activatePowerUp('SHIELD');
    }

    sound.startMusic();
    if (this.onStateChange) this.onStateChange('PLAYING');
  }

  public pauseGame() {
    if (this.state !== 'PLAYING') return;
    this.state = 'PAUSED';
    sound.stopMusic();
    if (this.onStateChange) this.onStateChange('PAUSED');
  }

  public resumeGame() {
    if (this.state !== 'PAUSED') return;
    this.state = 'PLAYING';
    sound.startMusic();
    if (this.onStateChange) this.onStateChange('PLAYING');
  }

  public restartGame() {
    this.startGame();
  }

  private gameOver() {
    this.state = 'GAMEOVER';
    sound.stopMusic();
    sound.playCrash();
    this.triggerShake(0.65, 0.55);

    // Particle explosion at player location
    this.particles.emitBurst(
      new THREE.Vector3(this.playerX, this.playerY + 1.0, this.playerZ),
      0xff3366,
      36,
      8
    );

    // Save High Score
    if (this.score > this.highScore) {
      this.highScore = Math.floor(this.score);
      localStorage.setItem('grav_runner_highscore', this.highScore.toString());
    }

    if (this.onStateChange) this.onStateChange('GAMEOVER');
  }

  public switchLane(direction: -1 | 1) {
    const nextLane = this.targetLane + direction;
    if (nextLane >= 0 && nextLane <= 2) {
      this.targetLane = nextLane;
      sound.playLaneSwitch(direction);
    }
  }

  public jump() {
    if (this.isJumping) return;
    this.isJumping = true;
    this.jumpTimer = 0;
    sound.playJump();
    this.triggerShake(0.08, 0.12);

    // Jet burst particles
    this.particles.emitBurst(
      new THREE.Vector3(this.playerX, this.playerY + 0.3, this.playerZ - 0.4),
      0x00f0ff,
      12,
      3
    );
  }

  public slide() {
    if (this.isSliding) return;
    this.isSliding = true;
    this.slideTimer = 0;
    sound.playSlide();
    this.triggerShake(0.06, 0.1);
  }

  public toggleGravity() {
    // Check if player has enough energy (or has GRAV_OVERDRIVE active)
    const hasOverdrive = this.hasPowerUp('GRAV_OVERDRIVE');

    if (this.gravityState === 'NORMAL') {
      if (this.gravEnergy < 15 && !hasOverdrive) {
        // Not enough energy buzz
        sound.playLaneSwitch(0);
        return;
      }
      // Engage Anti-Grav Repulsor Hover Glide right above the floor track
      this.gravityState = 'ZERO_G';
      this.targetPlayerY = FLOOR_Y + 1.6;
      sound.playGravFlip(true);
    } else {
      // Touch down to running on the floor track
      this.gravityState = 'NORMAL';
      this.targetPlayerY = FLOOR_Y;
      sound.playGravFlip(false);
    }

    this.triggerShake(0.12, 0.18);

    // Energy pulse particles at runner's boots on the floor
    this.particles.emitBurst(
      new THREE.Vector3(this.playerX, FLOOR_Y + 0.4, this.playerZ),
      0x00f0ff,
      18,
      3.5
    );
  }

  public setZeroGravity(active: boolean) {
    if (active) {
      this.gravityState = 'ZERO_G';
      this.targetPlayerY = FLOOR_Y + 1.6;
      sound.playGravFlip(true);
    } else {
      this.gravityState = 'NORMAL';
      this.targetPlayerY = FLOOR_Y;
      sound.playGravFlip(false);
    }
  }

  public hasPowerUp(type: PowerUpType): boolean {
    return this.activePowerUps.some((p) => p.type === type && p.duration > 0);
  }

  public activatePowerUp(type: PowerUpType) {
    sound.playPowerUp();
    const durations: Record<PowerUpType, number> = {
      MAGNET: 11 + (this.upgrades.magnetLevel || 0) * 2.5,
      SHIELD: 18 + (this.upgrades.shieldLevel || 0) * 3.5,
      HYPER_BOOST: 6,
      SLOW_MO: 8,
      GRAV_OVERDRIVE: 12,
    };

    if (type === 'HYPER_BOOST') {
      this.triggerShake(0.25, 0.35);
    }

    const maxDuration = durations[type];
    const existing = this.activePowerUps.find((p) => p.type === type);
    if (existing) {
      existing.duration = maxDuration;
    } else {
      this.activePowerUps.push({
        type,
        duration: maxDuration,
        maxDuration,
      });
    }

    // If Overdrive or Hyper Boost, instantly refill grav energy
    if (type === 'GRAV_OVERDRIVE' || type === 'HYPER_BOOST') {
      this.gravEnergy = 100 + (this.upgrades.energyCellLevel || 0) * 15;
    }

    // Power-up pickup visual fanfare
    this.particles.emitBurst(
      new THREE.Vector3(this.playerX, this.playerY + 1.0, this.playerZ),
      0x00f0ff,
      24,
      6
    );
  }

  private resetPlayerPosition() {
    this.playerX = LANES[1];
    this.playerY = FLOOR_Y;
    this.playerZ = 0;
    this.runner.group.position.set(this.playerX, this.playerY, this.playerZ);
    this.runner.group.rotation.set(0, 0, 0);
  }

  private setEnvironment(theme: EnvironmentTheme) {
    this.currentTheme = theme;
    const config = ENVIRONMENTS[theme];

    this.scene.background = new THREE.Color(config.skyColor);
    (this.scene.fog as THREE.Fog).color.setHex(config.fogColor);
    (this.scene.fog as THREE.Fog).near = config.fogNear;
    (this.scene.fog as THREE.Fog).far = config.fogFar;

    this.trackManager.setEnvironment(theme);
    this.backgroundManager.applyTheme(theme);
    this.runner.setAccentColor(config.accentColor);
    this.runnerLight.color.setHex(config.accentColor);

    if (this.onEnvironmentChange) {
      this.onEnvironmentChange(theme);
    }
  }

  private startLoop() {
    this.lastTime = performance.now();
    const loop = (time: number) => {
      this.animFrameId = requestAnimationFrame(loop);
      const rawDelta = Math.min((time - this.lastTime) / 1000, 0.1);
      this.lastTime = time;

      this.update(rawDelta);
      this.render();
    };
    this.animFrameId = requestAnimationFrame(loop);
  }

  private update(rawDelta: number) {
    if (this.state !== 'PLAYING') {
      // In menu or paused, subtle background idle motion
      this.backgroundManager.update(this.playerZ, rawDelta * 0.3);
      return;
    }

    // Slow-Mo dilation if active
    const isSlowMo = this.hasPowerUp('SLOW_MO');
    const delta = isSlowMo ? rawDelta * 0.55 : rawDelta;

    // Hyper Boost speed multiplier
    const isHyperBoost = this.hasPowerUp('HYPER_BOOST');
    const effectiveSpeed = isHyperBoost
      ? this.currentSpeed * 1.55
      : this.currentSpeed;

    // 1. Advance distance & score
    const forwardMovement = effectiveSpeed * delta;
    this.distance += forwardMovement;
    this.playerZ += forwardMovement;

    // Speed progression
    this.currentSpeed = Math.min(
      MAX_SPEED,
      BASE_SPEED + (this.distance / 100) * ACCELERATION
    );
    sound.updateBpm((this.currentSpeed - BASE_SPEED) / (MAX_SPEED - BASE_SPEED));

    // Multiplier calculation (combo + overdrive)
    let scoreMult = 1;
    if (this.hasPowerUp('GRAV_OVERDRIVE')) scoreMult *= 2;
    if (this.gravityState === 'REVERSED') scoreMult *= 1.5; // Bonus for ceiling running!
    this.multiplier = scoreMult;

    this.score += forwardMovement * 2.2 * this.multiplier;

    // Combo decay
    this.comboResetTimer -= rawDelta;
    if (this.comboResetTimer <= 0) {
      this.orbCombo = 0;
    }

    // 2. Anti-Gravity Energy Management
    const hasOverdrive = this.hasPowerUp('GRAV_OVERDRIVE');
    if (this.gravityState === 'REVERSED' || this.gravityState === 'ZERO_G') {
      if (!hasOverdrive) {
        this.gravEnergy = Math.max(
          0,
          this.gravEnergy - GRAV_ENERGY_DEPLETION_RATE * rawDelta
        );
        if (this.gravEnergy <= 0) {
          // Exhausted energy, forced return to floor
          this.toggleGravity();
        }
      }
    } else {
      // Passive recharge when running on normal floor (respecting energy cell capacity)
      const maxCap = 100 + (this.upgrades.energyCellLevel || 0) * 15;
      this.gravEnergy = Math.min(
        maxCap,
        this.gravEnergy + GRAV_ENERGY_PASSIVE_RECHARGE * rawDelta
      );
    }

    // Distance Milestones check
    const milestones = [500, 1000, 2000, 3500, 5000, 7500, 10000];
    for (const m of milestones) {
      if (this.distance >= m && !this.reachedMilestones.has(m)) {
        this.reachedMilestones.add(m);
        sound.playMilestone();
        this.triggerShake(0.24, 0.3);
        if (this.onNotification) {
          this.onNotification({
            id: Math.random().toString(),
            text: `ORBITAL MILESTONE: ${m.toLocaleString()}m`,
            subtext: 'SUPERSONIC VECTOR FLUX',
            colorClass: 'text-purple-400',
          });
        }
      }
    }

    // 3. Update Power-Ups duration
    for (let i = this.activePowerUps.length - 1; i >= 0; i--) {
      const pu = this.activePowerUps[i];
      pu.duration -= rawDelta;
      if (pu.duration <= 0) {
        this.activePowerUps.splice(i, 1);
      }
    }

    // 4. Smooth Lane Switching (Lerp)
    const targetX = LANES[this.targetLane];
    this.playerX += (targetX - this.playerX) * Math.min(1, 14 * delta);

    // 5. Jump & Slide Timers
    let jumpOffset = 0;
    let jumpProgress = 0;
    if (this.isJumping) {
      this.jumpTimer += delta;
      jumpProgress = this.jumpTimer / JUMP_DURATION;
      if (jumpProgress >= 1) {
        this.isJumping = false;
        jumpOffset = 0;
      } else {
        // Parabolic jump arc
        const sign = this.gravityState === 'REVERSED' ? -1 : 1;
        jumpOffset = Math.sin(jumpProgress * Math.PI) * JUMP_HEIGHT * sign;
      }
    }

    if (this.isSliding) {
      this.slideTimer += delta;
      if (this.slideTimer >= SLIDE_DURATION) {
        this.isSliding = false;
      } else {
        // Emit sparks while sliding on floor track
        this.particles.emitSlideSparks(
          new THREE.Vector3(this.playerX, FLOOR_Y + 0.05, this.playerZ - 0.2),
          2
        );
      }
    }

    // 6. Smooth Floor Height Transition
    this.playerY += (this.targetPlayerY - this.playerY) * Math.min(1, 14 * delta);
    this.cameraRoll = 0;

    // Position the runner in 3D space on the floor track
    const currentTotalY = this.playerY + jumpOffset;
    this.runner.group.position.set(this.playerX, currentTotalY, this.playerZ);

    // Dynamic bank tilt based on lane change velocity (smooth 3D roll into turns)
    const laneVelocity = (targetX - this.playerX) * 0.18;
    this.runner.group.rotation.z = -laneVelocity;
    this.runner.group.rotation.x = 0; // Character is always upright running on the floor

    // Animate runner limbs & FX with 3D jump altitude for ground contact blob shadow
    const jumpAltitude = jumpOffset + (this.gravityState === 'ZERO_G' ? (this.playerY - FLOOR_Y) : 0);
    this.runner.updateAnimation(
      delta,
      effectiveSpeed,
      this.isJumping,
      this.isSliding,
      jumpProgress,
      this.gravityState,
      this.hasPowerUp('SHIELD'),
      this.hasPowerUp('MAGNET'),
      jumpAltitude
    );

    // Dynamic 3D lighting follows player down track
    this.runnerLight.position.set(this.playerX, currentTotalY + 1.2, this.playerZ);
    this.dirLight.position.set(12, 26, this.playerZ - 8);
    this.dirLight.target.position.set(0, 0, this.playerZ + 12);
    this.dirLight.target.updateMatrixWorld();

    // Jetpack thruster trail particles behind runner on the floor track
    if (Math.random() < 0.65) {
      const thrusterY = currentTotalY + 0.85;
      this.particles.emit(
        new THREE.Vector3(
          this.playerX + (Math.random() - 0.5) * 0.28,
          thrusterY,
          this.playerZ - 0.4
        ),
        new THREE.Vector3((Math.random() - 0.5) * 0.4, (Math.random() - 0.5) * 0.3, -effectiveSpeed * 0.35),
        0x00f0ff,
        0.22,
        0.18
      );
    }

    // 7. Track & Obstacles Update
    this.trackManager.update(this.playerZ, delta);

    // 8. Collisions and Collectibles Check
    this.handleCollisionsAndCollectibles(currentTotalY, delta);

    // 9. Environment Transition
    this.checkEnvironmentProgression();

    // 10. Update Particles & Lights
    this.particles.update(delta);
    this.runnerLight.position.set(this.playerX, currentTotalY + 1.2, this.playerZ);

    // 11. Update Panoramic Vista & Parallax Horizon
    this.backgroundManager.update(this.playerZ, delta);

    // 12. Invulnerability Timer
    if (this.invulnerableTimer > 0) {
      this.invulnerableTimer -= rawDelta;
      this.runner.runnerMeshGroup.visible = Math.floor(Date.now() / 80) % 2 === 0;
    } else {
      this.runner.runnerMeshGroup.visible = true;
    }

    // 13. Update Supersonic Speed Lines
    this.speedLines.update(
      this.camera,
      effectiveSpeed,
      BASE_SPEED,
      MAX_SPEED,
      isHyperBoost,
      delta
    );

    // 14. Camera Positioning (Smooth Third-Person Follow)
    this.updateCamera(delta, effectiveSpeed);

    // 15. Notify React HUD
    if (this.onStatsUpdate) {
      this.onStatsUpdate({
        score: Math.floor(this.score),
        distance: Math.floor(this.distance),
        orbsCollected: this.orbsCollected,
        multiplier: Number(this.multiplier.toFixed(1)),
        highScore: this.highScore,
        gravEnergy: Math.round(this.gravEnergy),
        gravityState: this.gravityState,
        activePowerUps: this.activePowerUps,
        currentSpeed: Math.round(effectiveSpeed),
        environment: this.currentTheme,
      });
    }
  }

  private handleCollisionsAndCollectibles(playerActualY: number, delta: number) {
    const runnerBox = new THREE.Box3();
    const runnerHalfW = RUNNER_WIDTH / 2;
    const runnerActualHeight = this.isSliding ? SLIDE_HEIGHT : RUNNER_HEIGHT;

    // Upright bounding box for runner on the floor track
    const minY = playerActualY;
    const maxY = playerActualY + runnerActualHeight;

    runnerBox.min.set(this.playerX - runnerHalfW, minY, this.playerZ - 0.4);
    runnerBox.max.set(this.playerX + runnerHalfW, maxY, this.playerZ + 0.4);

    const hasMagnet = this.hasPowerUp('MAGNET');
    const isHyperBoost = this.hasPowerUp('HYPER_BOOST');

    // Check across all active track segments
    for (const segment of this.trackManager.segments) {
      // Floor gap check (if on normal gravity and segment has floor gap)
      if (
        segment.hasGap &&
        this.gravityState === 'NORMAL' &&
        !this.isJumping &&
        this.playerZ >= segment.startZ &&
        this.playerZ <= segment.endZ
      ) {
        // Player fell through track gap!
        if (this.invulnerableTimer <= 0 && !isHyperBoost) {
          this.gameOver();
          return;
        }
      }

      // 1. Obstacles
      for (const obs of segment.obstacles) {
        if (!obs.active) continue;

        // Near-Miss close call check
        if (!obs.nearMissChecked && obs.active) {
          const zDiff = this.playerZ - obs.mesh.position.z;
          if (zDiff > 0.4 && zDiff < 2.4) {
            obs.nearMissChecked = true;
            const xDiff = Math.abs(this.playerX - obs.mesh.position.x);
            if (xDiff < 2.5) {
              this.triggerNearMiss();
            }
          }
        }

        // Skip check if far away in Z
        if (Math.abs(obs.z - this.playerZ) > 12) continue;

        // Bounding box for obstacle
        const obsBox = new THREE.Box3();
        const halfW = obs.width / 2;
        const halfH = obs.height / 2;
        const halfD = obs.depth / 2;

        obsBox.min.set(
          obs.mesh.position.x - halfW,
          obs.mesh.position.y - halfH,
          obs.mesh.position.z - halfD
        );
        obsBox.max.set(
          obs.mesh.position.x + halfW,
          obs.mesh.position.y + halfH,
          obs.mesh.position.z + halfD
        );

        // Intersect check
        if (runnerBox.intersectsBox(obsBox)) {
          if (isHyperBoost) {
            // Turbo smash obstacle!
            obs.active = false;
            obs.mesh.visible = false;
            this.score += 250;
            this.triggerShake(0.32, 0.25);
            this.particles.emitBurst(obs.mesh.position, 0xf59e0b, 20, 6);
            sound.playShieldBreak();
            continue;
          }

          if (this.invulnerableTimer > 0) {
            continue;
          }

          if (this.hasPowerUp('SHIELD')) {
            // Shield absorbs impact!
            this.activePowerUps = this.activePowerUps.filter((p) => p.type !== 'SHIELD');
            this.invulnerableTimer = 1.8;
            obs.active = false;
            obs.mesh.visible = false;
            sound.playShieldBreak();
            this.triggerShake(0.42, 0.35);
            this.particles.emitBurst(
              new THREE.Vector3(this.playerX, playerActualY + 1.0, this.playerZ),
              0x38bdf8,
              28,
              6
            );
            continue;
          }

          // Deadly crash!
          this.gameOver();
          return;
        }
      }

      // 2. Collectibles (Orbs, Batteries, Power-Ups)
      for (const col of segment.collectibles) {
        if (!col.active || col.collected) continue;

        const distZ = col.z - this.playerZ;
        const maxMagnetDist = hasMagnet ? 20 + (this.upgrades.magnetLevel || 0) * 6 : 20;
        if (distZ < -4 || distZ > maxMagnetDist) continue;

        // Magnet attraction
        if (hasMagnet && col.type === 'ORB') {
          const dx = this.playerX - col.mesh.position.x;
          const dy = playerActualY + 1.0 - col.mesh.position.y;
          const dz = this.playerZ - col.mesh.position.z;
          col.mesh.position.x += dx * Math.min(1, 15 * delta);
          col.mesh.position.y += dy * Math.min(1, 15 * delta);
          col.mesh.position.z += dz * Math.min(1, 15 * delta);
        }

        // Distance to player
        const dx = col.mesh.position.x - this.playerX;
        const dy = col.mesh.position.y - (playerActualY + 1.0);
        const dz = col.mesh.position.z - this.playerZ;
        const distSq = dx * dx + dy * dy + dz * dz;

        const pickupDist = col.type === 'POWERUP' ? 2.4 : 1.8;
        if (distSq < pickupDist * pickupDist) {
          col.collected = true;
          col.active = false;
          col.mesh.visible = false;

          if (col.type === 'ORB') {
            this.orbsCollected++;
            this.orbCombo++;
            this.comboResetTimer = 2.0;
            const orbBaseScore = 50 + (this.upgrades.orbBonusLevel || 0) * 20;
            this.score += orbBaseScore * this.multiplier;
            const maxGrav = 100 + (this.upgrades.energyCellLevel || 0) * 15;
            this.gravEnergy = Math.min(
              maxGrav,
              this.gravEnergy + GRAV_ENERGY_ORB_RESTORE
            );
            sound.playOrbCollect(this.orbCombo);
            this.particles.emitBurst(col.mesh.position, 0x00f0ff, 8, 2.5);
          } else if (col.type === 'BATTERY') {
            const maxGrav = 100 + (this.upgrades.energyCellLevel || 0) * 15;
            this.gravEnergy = Math.min(maxGrav, this.gravEnergy + 40);
            this.score += 150;
            sound.playPowerUp();
            this.particles.emitBurst(col.mesh.position, 0x10b981, 14, 4);
          } else if (col.type === 'POWERUP' && col.powerUpType) {
            this.activatePowerUp(col.powerUpType);
          }
        }
      }
    }
  }

  private checkEnvironmentProgression() {
    // Every 650m, transition environment
    const envThemes: EnvironmentTheme[] = [
      'NEO_VANGUARD',
      'APEX_ORBITAL',
      'PRISM_CIRCUIT',
      'VOID_QUARRY',
    ];

    const currentEnvIndex = Math.floor(this.distance / 650) % envThemes.length;
    const targetTheme = envThemes[currentEnvIndex];

    if (this.currentTheme !== targetTheme) {
      this.setEnvironment(targetTheme);
      sound.playMilestone();
      this.triggerShake(0.2, 0.3);
      if (this.onNotification) {
        this.onNotification({
          id: Math.random().toString(),
          text: `SECTOR: ${ENVIRONMENTS[targetTheme].name}`,
          subtext: 'ORBITAL SECTOR TRANSITION',
          colorClass: 'text-cyan-400',
        });
      }
    }
  }

  private updateCamera(delta: number, effectiveSpeed: number) {
    // Cinematic 3D third-person runner camera: elevated perspective displaying road depth and horizon
    const chaseDist = 6.4;
    const heightOffset = 3.6;

    const targetCamX = this.playerX * 0.45;
    const targetCamY = this.playerY + heightOffset;
    const targetCamZ = this.playerZ - chaseDist;

    this.camera.position.x += (targetCamX - this.camera.position.x) * Math.min(1, 12 * delta);
    this.camera.position.y += (targetCamY - this.camera.position.y) * Math.min(1, 12 * delta);
    this.camera.position.z = targetCamZ;

    // Screen Shake Offset
    if (this.shakeElapsed < this.shakeDuration) {
      this.shakeElapsed += delta;
      const factor = 1 - this.shakeElapsed / this.shakeDuration;
      const currentIntensity = this.shakeIntensity * factor;
      this.camera.position.x += (Math.random() - 0.5) * currentIntensity;
      this.camera.position.y += (Math.random() - 0.5) * currentIntensity;
    }

    // Ensure camera up vector is always pointing towards the sky (+Y)
    this.camera.up.set(0, 1, 0);

    // Look down along the 3D track into the distance with golden-ratio depth perspective
    const lookY = this.playerY + 0.85;
    this.camera.lookAt(this.playerX * 0.3, lookY, this.playerZ + 16);

    // Dynamic Speed FOV expansion (3D depth warp sensation)
    const targetFov = this.hasPowerUp('HYPER_BOOST')
      ? 80
      : 68 + ((effectiveSpeed - BASE_SPEED) / (MAX_SPEED - BASE_SPEED)) * 14;

    this.camera.fov += (targetFov - this.camera.fov) * Math.min(1, 6 * delta);
    this.camera.updateProjectionMatrix();
  }

  private render() {
    this.renderer.render(this.scene, this.camera);
  }

  public dispose() {
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
    }
    window.removeEventListener('resize', this.onResize);
    window.removeEventListener('keydown', this.onKeyDown);
    this.container.removeEventListener('touchstart', this.onTouchStart);
    this.container.removeEventListener('touchend', this.onTouchEnd);
    this.renderer.dispose();
    this.backgroundManager.dispose();
    this.speedLines.dispose();
    sound.stopMusic();
    if (this.container.contains(this.renderer.domElement)) {
      this.container.removeChild(this.renderer.domElement);
    }
  }
}
