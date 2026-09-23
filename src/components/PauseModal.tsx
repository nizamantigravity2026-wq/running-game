import React from 'react';
import { Play, RotateCcw, Home, Volume2, VolumeX } from 'lucide-react';
import { sound } from '../game/audio';

interface PauseModalProps {
  onResume: () => void;
  onRestart: () => void;
  onMenu: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  sfxVolume: number;
  onSfxVolumeChange: (vol: number) => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  onResume,
  onRestart,
  onMenu,
  isMuted,
  onToggleMute,
  sfxVolume,
  onSfxVolumeChange,
}) => {
  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md select-none">
      <div className="relative w-full max-w-sm bg-gradient-to-b from-slate-900/90 to-black border border-white/15 p-6 rounded-2xl shadow-2xl flex flex-col gap-5">
        <div className="text-center">
          <h2 className="text-2xl font-bold font-display tracking-tight text-white">
            MISSION SUSPENDED
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Systems paused. Gravitational matrix holding.
          </p>
        </div>

        {/* Audio settings */}
        <div className="bg-white/[0.03] border border-white/10 p-3.5 rounded-xl flex flex-col gap-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-300 font-medium">Audio Output</span>
            <button
              onClick={onToggleMute}
              className="px-2.5 py-1 rounded bg-white/5 border border-white/10 text-xs text-slate-300 hover:text-white flex items-center gap-1.5"
            >
              {isMuted ? <VolumeX className="w-3.5 h-3.5 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5 text-cyan-400" />}
              <span>{isMuted ? 'Muted' : 'Enabled'}</span>
            </button>
          </div>

          <div className="flex items-center justify-between gap-3 text-xs">
            <span className="text-slate-400 text-[11px]">SFX Volume</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={sfxVolume}
              onChange={(e) => onSfxVolumeChange(parseFloat(e.target.value))}
              className="w-32 accent-cyan-400 cursor-pointer"
            />
          </div>
        </div>

        {/* Controls cheat sheet */}
        <div className="bg-white/[0.03] border border-white/10 p-3 rounded-xl flex flex-col gap-1.5 text-xs text-slate-300">
          <div className="text-[11px] font-semibold text-slate-400">COMMANDS</div>
          <div className="flex justify-between">
            <span>Switch Lanes</span>
            <span className="font-mono text-cyan-400">A / D or ← / →</span>
          </div>
          <div className="flex justify-between">
            <span>Jet Jump</span>
            <span className="font-mono text-cyan-400">SPACE or W</span>
          </div>
          <div className="flex justify-between">
            <span>Kinetic Slide</span>
            <span className="font-mono text-cyan-400">S or ↓</span>
          </div>
          <div className="flex justify-between">
            <span>Invert Gravity</span>
            <span className="font-mono text-purple-400">G or Shift</span>
          </div>
        </div>

        {/* Modal Buttons */}
        <div className="flex flex-col gap-2 pt-1">
          <button
            onClick={onResume}
            className="w-full py-3 bg-gradient-to-r from-cyan-400 to-sky-400 hover:from-cyan-300 hover:to-sky-300 text-black font-bold font-display text-xs tracking-wider uppercase rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-cyan-400/20 cursor-pointer"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Resume Mission</span>
          </button>

          <div className="flex gap-2">
            <button
              onClick={onRestart}
              className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white text-xs font-medium rounded-xl flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restart</span>
            </button>

            <button
              onClick={onMenu}
              className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white text-xs font-medium rounded-xl flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Home className="w-3.5 h-3.5" />
              <span>Main Menu</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
