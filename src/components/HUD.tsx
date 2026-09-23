import React from 'react';
import { GameStats, GameNotification } from '../game/types';
import { ENVIRONMENTS } from '../game/constants';
import { 
  Zap, 
  Shield, 
  Magnet, 
  FastForward, 
  Clock, 
  Flame, 
  Pause, 
  Volume2, 
  VolumeX,
  Compass,
  Gauge
} from 'lucide-react';
import { sound } from '../game/audio';

interface HUDProps {
  stats: GameStats;
  notifications?: GameNotification[];
  onPause: () => void;
  onToggleMute: () => void;
  isMuted: boolean;
  onToggleGravity: () => void;
  onJump: () => void;
  onSlide: () => void;
  onSwitchLane: (dir: -1 | 1) => void;
}

export const HUD: React.FC<HUDProps> = ({
  stats,
  notifications = [],
  onPause,
  onToggleMute,
  isMuted,
  onToggleGravity,
  onJump,
  onSlide,
  onSwitchLane,
}) => {
  const env = ENVIRONMENTS[stats.environment];
  const isAntiGrav = stats.gravityState === 'REVERSED';
  const isZeroG = stats.gravityState === 'ZERO_G';
  const isSupersonic = stats.currentSpeed >= 34;

  const getPowerUpIcon = (type: string) => {
    switch (type) {
      case 'MAGNET': return <Magnet className="w-4 h-4 text-amber-400" />;
      case 'SHIELD': return <Shield className="w-4 h-4 text-blue-400" />;
      case 'HYPER_BOOST': return <FastForward className="w-4 h-4 text-pink-400" />;
      case 'SLOW_MO': return <Clock className="w-4 h-4 text-purple-400" />;
      case 'GRAV_OVERDRIVE': return <Flame className="w-4 h-4 text-emerald-400" />;
      default: return null;
    }
  };

  const getPowerUpName = (type: string) => {
    switch (type) {
      case 'MAGNET': return 'Orb Attractor';
      case 'SHIELD': return 'Phase Shield';
      case 'HYPER_BOOST': return 'Turbo Warp';
      case 'SLOW_MO': return 'Chronostasis';
      case 'GRAV_OVERDRIVE': return 'Grav Overdrive';
      default: return type;
    }
  };

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-4 md:p-6 select-none z-10">
      {/* Top Bar Header Area */}
      <div className="flex items-start justify-between w-full">
        {/* Left: Score, Distance & Multiplier */}
        <div className="flex flex-col gap-1 bg-black/55 backdrop-blur-md border border-white/10 p-3 md:p-4 rounded-xl max-w-xs pointer-events-auto shadow-lg">
          <div className="text-xs text-slate-400 flex items-center gap-1.5 font-mono">
            <span>SCORE</span>
            {stats.multiplier > 1 && (
              <>
                <span aria-hidden="true">·</span>
                <span className="text-amber-400 font-bold animate-pulse">{stats.multiplier}x BOOST</span>
              </>
            )}
          </div>
          <div className="text-2xl md:text-3xl font-bold font-display text-white tracking-wide tabular-nums">
            {stats.score.toLocaleString()}
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-300 pt-1 border-t border-white/10 font-mono">
            <span>{stats.distance}m</span>
            <span aria-hidden="true">·</span>
            <span className="text-cyan-400">{stats.orbsCollected} Orbs</span>
            <span aria-hidden="true">·</span>
            <span className={`font-semibold ${isSupersonic ? 'text-rose-400' : 'text-slate-300'}`}>
              {stats.currentSpeed} m/s
            </span>
          </div>
        </div>

        {/* Center: Gravity Inversion Status & Environment */}
        <div className="hidden sm:flex flex-col items-center bg-black/55 backdrop-blur-md border border-white/10 px-4 py-2 rounded-xl text-center pointer-events-auto">
          <div className="flex items-center gap-1.5 text-xs text-slate-300">
            <Compass className="w-3.5 h-3.5 text-cyan-400" />
            <span className="font-semibold text-white">{env.name}</span>
          </div>
          <div className="text-[11px] text-slate-400 pt-0.5">
            {isZeroG || isAntiGrav ? (
              <span className="text-cyan-400 font-semibold tracking-wider animate-pulse flex items-center gap-1 justify-center">
                <Zap className="w-3 h-3 text-cyan-300" />
                ANTI-GRAV REPULSOR (HOVER GLIDE)
              </span>
            ) : (
              <span className="text-emerald-400 font-medium tracking-wide">
                GROUND VECTOR (RUNNING ON FLOOR)
              </span>
            )}
          </div>
        </div>

        {/* Right: Quick Action Controls */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            onClick={onToggleMute}
            aria-label={isMuted ? 'Unmute Audio' : 'Mute Audio'}
            className="w-10 h-10 rounded-lg bg-black/55 backdrop-blur-md border border-white/10 flex items-center justify-center text-slate-200 hover:text-white hover:border-white/30 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
          <button
            onClick={onPause}
            aria-label="Pause Game"
            className="w-10 h-10 rounded-lg bg-black/55 backdrop-blur-md border border-white/10 flex items-center justify-center text-slate-200 hover:text-white hover:border-white/30 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
          >
            <Pause className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Dynamic Cinematic In-Game Event Notifications (Near Miss, Milestones, Sectors) */}
      <div className="absolute top-24 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 pointer-events-none z-30 w-full max-w-sm px-4">
        {notifications.map((notif) => (
          <div
            key={notif.id}
            className="px-4 py-2 rounded-xl bg-black/85 backdrop-blur-md border border-white/20 shadow-2xl flex flex-col items-center text-center transition-all animate-bounce"
          >
            <span className={`font-display font-bold text-sm tracking-widest ${notif.colorClass || 'text-cyan-400'}`}>
              {notif.text}
            </span>
            {notif.subtext && (
              <span className="text-[10px] text-slate-400 font-mono tracking-wider pt-0.5">
                {notif.subtext}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Middle Floating: Active Power-Ups Stack */}
      <div className="flex flex-col gap-2 max-w-xs self-start pointer-events-auto">
        {stats.activePowerUps.map((pu) => {
          const pct = Math.max(0, Math.min(100, (pu.duration / pu.maxDuration) * 100));
          return (
            <div
              key={pu.type}
              className="bg-black/60 backdrop-blur-md border border-white/10 px-3 py-2 rounded-lg flex flex-col gap-1 w-48 shadow-md"
            >
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 font-medium text-slate-100">
                  {getPowerUpIcon(pu.type)}
                  <span>{getPowerUpName(pu.type)}</span>
                </div>
                <span className="font-mono tabular-nums text-slate-300 text-[11px]">
                  {pu.duration.toFixed(1)}s
                </span>
              </div>
              <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
                <div
                  className="bg-cyan-400 h-full transition-all duration-100"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom Area: Anti-Grav Battery Gauge & Mobile Touch Controls */}
      <div className="flex flex-col gap-3 w-full max-w-md mx-auto pointer-events-auto">
        {/* Anti-Grav Core Battery Bar */}
        <div className="bg-black/65 backdrop-blur-md border border-white/10 px-4 py-3 rounded-xl flex flex-col gap-1.5 shadow-xl">
          <div className="flex items-center justify-between text-xs font-mono">
            <div className="flex items-center gap-1.5 text-slate-200">
              <Zap className={`w-3.5 h-3.5 ${stats.gravEnergy > 20 ? 'text-cyan-400' : 'text-rose-500 animate-pulse'}`} />
              <span className="font-semibold tracking-wider">ANTI-GRAV FLUX CORE</span>
            </div>
            <span className="text-cyan-400 tabular-nums font-semibold">
              {stats.gravEnergy}%
            </span>
          </div>

          <div className="w-full bg-slate-800/80 h-2.5 rounded-full overflow-hidden relative border border-white/5">
            <div
              className={`h-full transition-all duration-150 rounded-full ${
                stats.gravEnergy > 25
                  ? 'bg-gradient-to-r from-cyan-500 via-sky-400 to-indigo-400'
                  : 'bg-rose-500 animate-pulse'
              }`}
              style={{ width: `${stats.gravEnergy}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>Hover Glide: <span className="text-cyan-300 font-mono font-bold">[G] or [F]</span></span>
            <span>{isAntiGrav || isZeroG ? 'Repulsor Glide Active' : 'Running on Floor Track'}</span>
          </div>
        </div>

        {/* Mobile / On-Screen Touch Control Buttons (Prominent on small screens, accessible on desktop) */}
        <div className="grid grid-cols-4 gap-2 pt-1 sm:hidden">
          <button
            onClick={() => onSwitchLane(-1)}
            aria-label="Move Left"
            className="h-12 bg-black/60 active:bg-cyan-950/60 border border-white/15 rounded-xl text-xs font-bold text-white flex items-center justify-center"
          >
            ← LEFT
          </button>
          <button
            onClick={onJump}
            aria-label="Jump"
            className="h-12 bg-black/60 active:bg-cyan-950/60 border border-white/15 rounded-xl text-xs font-bold text-white flex items-center justify-center"
          >
            ▲ JUMP
          </button>
          <button
            onClick={onSlide}
            aria-label="Slide"
            className="h-12 bg-black/60 active:bg-cyan-950/60 border border-white/15 rounded-xl text-xs font-bold text-white flex items-center justify-center"
          >
            ▼ SLIDE
          </button>
          <button
            onClick={() => onSwitchLane(1)}
            aria-label="Move Right"
            className="h-12 bg-black/60 active:bg-cyan-950/60 border border-white/15 rounded-xl text-xs font-bold text-white flex items-center justify-center"
          >
            RIGHT →
          </button>
        </div>

        {/* Dedicated Anti-Gravity Trigger Button for Touch */}
        <div className="sm:hidden w-full">
          <button
            onClick={onToggleGravity}
            className={`w-full h-12 rounded-xl border text-xs font-bold tracking-wider flex items-center justify-center gap-2 transition-all ${
              isAntiGrav || isZeroG
                ? 'bg-purple-600/80 border-purple-400 text-white shadow-lg shadow-purple-500/30'
                : 'bg-cyan-600/70 border-cyan-400 text-white shadow-lg shadow-cyan-500/25'
            }`}
          >
            <Zap className="w-4 h-4" />
            <span>{isAntiGrav || isZeroG ? 'TOUCH DOWN ON FLOOR' : 'ACTIVATE REPULSOR GLIDE'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
