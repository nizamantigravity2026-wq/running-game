import React from 'react';
import { RotateCcw, Home, Trophy, Award, Zap, Activity } from 'lucide-react';
import { GameStats } from '../game/types';

interface GameOverModalProps {
  stats: GameStats;
  onRestart: () => void;
  onMenu: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  stats,
  onRestart,
  onMenu,
}) => {
  const isNewHighScore = stats.score >= stats.highScore && stats.score > 0;

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md select-none animate-fadeIn">
      <div className="relative w-full max-w-md bg-gradient-to-b from-slate-900/90 to-black border border-white/15 p-6 md:p-8 rounded-2xl shadow-2xl flex flex-col gap-6">
        {/* Glow Header */}
        <div className="text-center flex flex-col items-center gap-1.5">
          <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 mb-1">
            <Activity className="w-6 h-6" />
          </div>
          <h2 className="text-2xl md:text-3xl font-bold font-display tracking-tight text-white">
            TRAJECTORY TERMINATED
          </h2>
          <p className="text-xs text-slate-400">
            Phase suit kinetic shield depleted upon orbital hazard collision.
          </p>
        </div>

        {/* New Record Banner if applicable */}
        {isNewHighScore && (
          <div className="bg-amber-500/15 border border-amber-500/30 px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 text-amber-300 text-xs font-semibold">
            <Award className="w-4 h-4 text-amber-400" />
            <span>NEW ALL-TIME ORBITAL HIGH SCORE RECORD!</span>
          </div>
        )}

        {/* Score & Metric Breakdown (Zero-Pill Tabular Rigor) */}
        <div className="bg-white/[0.03] border border-white/10 rounded-xl p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <span className="text-xs text-slate-400 font-mono">FINAL RUN SCORE</span>
            <span className="text-2xl font-bold font-display text-cyan-400 tabular-nums">
              {stats.score.toLocaleString()}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs font-mono">
            <div>
              <div className="text-slate-400 text-[11px]">DISTANCE TRAVELED</div>
              <div className="text-sm font-semibold text-white tabular-nums mt-0.5">
                {stats.distance} METERS
              </div>
            </div>

            <div>
              <div className="text-slate-400 text-[11px]">NULL ORBS HARVESTED</div>
              <div className="text-sm font-semibold text-cyan-300 tabular-nums mt-0.5">
                {stats.orbsCollected} UNITS
              </div>
            </div>

            <div>
              <div className="text-slate-400 text-[11px]">PEAK VELOCITY</div>
              <div className="text-sm font-semibold text-white tabular-nums mt-0.5">
                {stats.currentSpeed} M/S
              </div>
            </div>

            <div>
              <div className="text-slate-400 text-[11px]">PERSONAL RECORD</div>
              <div className="text-sm font-semibold text-amber-400 tabular-nums mt-0.5 flex items-center gap-1">
                <Trophy className="w-3 h-3" />
                <span>{stats.highScore.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={onRestart}
            className="flex-1 py-3 px-4 bg-gradient-to-r from-cyan-400 to-sky-400 hover:from-cyan-300 hover:to-sky-300 text-black font-bold font-display text-xs tracking-wider uppercase rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-cyan-400/20 transition-all cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Re-Engage Run</span>
          </button>

          <button
            onClick={onMenu}
            className="py-3 px-4 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 hover:text-white font-medium text-xs rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <Home className="w-4 h-4" />
            <span>HQ Menu</span>
          </button>
        </div>
      </div>
    </div>
  );
};
