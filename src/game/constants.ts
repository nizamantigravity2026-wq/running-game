import { EnvironmentTheme } from './types';

export const LANES = [3.2, 0, -3.2] as const;
export const LANE_WIDTH = 3.2;

export const FLOOR_Y = 0.0;
export const CEILING_Y = 6.2;
export const ZERO_G_Y = 3.1;

export const RUNNER_HEIGHT = 1.8;
export const RUNNER_WIDTH = 0.9;
export const SLIDE_HEIGHT = 0.9;

export const BASE_SPEED = 26; // m/s
export const MAX_SPEED = 54;  // m/s
export const ACCELERATION = 0.45; // speed increase per 100m

export const JUMP_DURATION = 0.65; // seconds
export const JUMP_HEIGHT = 2.4; // meters
export const SLIDE_DURATION = 0.65; // seconds

export const GRAV_ENERGY_MAX = 100;
export const GRAV_ENERGY_DEPLETION_RATE = 14; // energy per second when active
export const GRAV_ENERGY_ORB_RESTORE = 8;     // energy per orb collected
export const GRAV_ENERGY_PASSIVE_RECHARGE = 2.5; // passive recharge on ground

export const SEGMENT_LENGTH = 36; // meters per segment
export const VISIBLE_SEGMENTS = 14; // ~504m visible track range

export interface EnvironmentConfig {
  name: string;
  subtitle: string;
  theme: EnvironmentTheme;
  skyColor: number;
  fogColor: number;
  fogNear: number;
  fogFar: number;
  trackColor: number;
  laneColor: number;
  neonColor: string;
  accentColor: number;
  hazardColor: number;
  ceilingColor: number;
}

export const ENVIRONMENTS: Record<EnvironmentTheme, EnvironmentConfig> = {
  NEO_VANGUARD: {
    name: 'Neo-Vanguard Skyway',
    subtitle: 'Floating Megacity Sector 01',
    theme: 'NEO_VANGUARD',
    skyColor: 0x030712,
    fogColor: 0x061126,
    fogNear: 180,
    fogFar: 950,
    trackColor: 0x0f172a,
    laneColor: 0x00f0ff,
    neonColor: '#00f0ff',
    accentColor: 0x38bdf8,
    hazardColor: 0xff3366,
    ceilingColor: 0x1e293b,
  },
  APEX_ORBITAL: {
    name: 'Apex Orbital Station',
    subtitle: 'High-Velocity Maglev Transit Ring',
    theme: 'APEX_ORBITAL',
    skyColor: 0x080612,
    fogColor: 0x181024,
    fogNear: 180,
    fogFar: 950,
    trackColor: 0x18181b,
    laneColor: 0xf59e0b,
    neonColor: '#f59e0b',
    accentColor: 0xfbbf24,
    hazardColor: 0xef4444,
    ceilingColor: 0x27272a,
  },
  PRISM_CIRCUIT: {
    name: 'Prism Circuit',
    subtitle: 'Neon Skyway Hyperlane',
    theme: 'PRISM_CIRCUIT',
    skyColor: 0x0c0414,
    fogColor: 0x1c092a,
    fogNear: 180,
    fogFar: 950,
    trackColor: 0x120824,
    laneColor: 0xd946ef,
    neonColor: '#d946ef',
    accentColor: 0xa855f7,
    hazardColor: 0xf43f5e,
    ceilingColor: 0x240e3f,
  },
  VOID_QUARRY: {
    name: 'Sector 9 Void Quarry',
    subtitle: 'Deep Asteroid Mining Corridor',
    theme: 'VOID_QUARRY',
    skyColor: 0x020708,
    fogColor: 0x051411,
    fogNear: 160,
    fogFar: 950,
    trackColor: 0x0d1f1c,
    laneColor: 0x10b981,
    neonColor: '#10b981',
    accentColor: 0x34d399,
    hazardColor: 0xf97316,
    ceilingColor: 0x132d28,
  },
};
