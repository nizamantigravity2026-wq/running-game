export type GameState = 'MENU' | 'PLAYING' | 'PAUSED' | 'GAMEOVER';

export type GravityState = 'NORMAL' | 'REVERSED' | 'ZERO_G';

export type EnvironmentTheme = 'NEO_VANGUARD' | 'APEX_ORBITAL' | 'PRISM_CIRCUIT' | 'VOID_QUARRY';

export type PowerUpType = 'MAGNET' | 'SHIELD' | 'HYPER_BOOST' | 'SLOW_MO' | 'GRAV_OVERDRIVE';

export interface PowerUpActive {
  type: PowerUpType;
  duration: number; // in seconds remaining
  maxDuration: number;
}

export type ObstacleType = 
  | 'LASER_BARRIER_LOW'       // Must jump over
  | 'LASER_BARRIER_HIGH'      // Must slide under
  | 'MAGLEV_TRAIN'            // Tall obstacle taking 1 lane (or moving)
  | 'PATROL_DRONE'            // Hovering drone
  | 'TRACK_GAP'               // Floor missing, jump or flip to ceiling
  | 'ROTATING_BLADE'          // Rotating plasma beam
  | 'GRAVITY_INVERTER_GATE';  // Natural gravity flip gate

export interface GameStats {
  score: number;
  distance: number;
  orbsCollected: number;
  multiplier: number;
  highScore: number;
  gravEnergy: number; // 0 to 100
  gravityState: GravityState;
  activePowerUps: PowerUpActive[];
  currentSpeed: number;
  environment: EnvironmentTheme;
}

export interface PlayerInput {
  laneChange: -1 | 0 | 1;
  jump: boolean;
  slide: boolean;
  toggleGravity: boolean;
}

export type OperativeSkin = 
  | 'CYAN_VANGUARD' 
  | 'SOLAR_APEX' 
  | 'PRISM_CYBER' 
  | 'EMERALD_VOID' 
  | 'CRIMSON_PHANTOM'
  | 'TITAN_WARPING'
  | 'VALKYRIE_NEO'
  | 'VOID_SPECTRE';

export interface TechUpgrades {
  magnetLevel: number;     // 0 to 3
  shieldLevel: number;     // 0 to 3
  energyCellLevel: number; // 0 to 3
  orbBonusLevel: number;   // 0 to 3
}

export interface GameNotification {
  id: string;
  text: string;
  subtext?: string;
  colorClass?: string;
}
