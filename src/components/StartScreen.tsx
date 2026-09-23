import React, { useState } from 'react';
import { 
  Play, 
  Trophy, 
  Volume2, 
  VolumeX, 
  Shield, 
  Zap, 
  Sparkles, 
  Layers, 
  Cpu, 
  Check, 
  Lock,
  ArrowUpRight,
  Disc
} from 'lucide-react';
import { OperativeSkin, TechUpgrades } from '../game/types';
import { sound } from '../game/audio';
import runnerImage from '../assets/images/runner_character_icon_1790139476477.jpg';
import skyboxImage from '../assets/images/skybox_orbital_station_1790139462199.jpg';

interface StartScreenProps {
  highScore: number;
  onStart: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  totalOrbs: number;
  selectedSkin: OperativeSkin;
  onSelectSkin: (skin: OperativeSkin) => void;
  upgrades: TechUpgrades;
  onUpgrade: (type: keyof TechUpgrades, cost: number) => void;
}

interface SkinInfo {
  id: OperativeSkin;
  name: string;
  codename: string;
  color: string;
  cost: number;
  desc: string;
}

const SKINS: SkinInfo[] = [
  {
    id: 'CYAN_VANGUARD',
    name: 'Cyan Vanguard',
    codename: 'Standard Issue MK-IV',
    color: 'from-cyan-400 to-blue-500',
    cost: 0,
    desc: 'High-tensile carbon fiber chassis optimized for balanced orbital slipstream running.',
  },
  {
    id: 'SOLAR_APEX',
    name: 'Solar Apex',
    codename: 'Helios Vanguard',
    color: 'from-amber-400 to-orange-500',
    cost: 60,
    desc: 'Reinforced gold-plasma plating engineered for radiation shielding in inner star corridors.',
  },
  {
    id: 'PRISM_CYBER',
    name: 'Prism Cyber',
    codename: 'Holo-Phase Spec',
    color: 'from-purple-400 to-pink-500',
    cost: 120,
    desc: 'Bioluminescent chromatic lattice that diffracts radar beacons and laser arrays.',
  },
  {
    id: 'EMERALD_VOID',
    name: 'Emerald Void',
    codename: 'Zero-Point Core',
    color: 'from-emerald-400 to-teal-500',
    cost: 180,
    desc: 'Radioactive isotope polymer emitting a soothing quantum emerald propulsion trail.',
  },
  {
    id: 'CRIMSON_PHANTOM',
    name: 'Crimson Phantom',
    codename: 'Null Strobe Exosuit',
    color: 'from-rose-500 to-red-600',
    cost: 250,
    desc: 'Experimental high-velocity interceptor chassis built for supersonic atmospheric dives.',
  },
  {
    id: 'TITAN_WARPING',
    name: 'Titan Warping',
    codename: 'Juggernaut MK-V',
    color: 'from-amber-500 to-orange-600',
    cost: 320,
    desc: 'Heavy industrial blast pauldrons and twin fission reactor pods designed to crush orbital hazards.',
  },
  {
    id: 'VALKYRIE_NEO',
    name: 'Valkyrie Neo',
    codename: 'Aero-Scythe Interceptor',
    color: 'from-violet-400 to-sky-400',
    cost: 400,
    desc: 'High-gloss pearlescent frame fitted with dual aerodynamic phase glider wings and aero helmet crest.',
  },
  {
    id: 'VOID_SPECTRE',
    name: 'Void Spectre',
    codename: 'Quantum Null-9',
    color: 'from-purple-500 to-indigo-600',
    cost: 500,
    desc: 'Deep-void obsidian operative crowned with a levitating quantum halo and dark matter propulsion.',
  },
];

export const StartScreen: React.FC<StartScreenProps> = ({
  highScore,
  onStart,
  isMuted,
  onToggleMute,
  totalOrbs,
  selectedSkin,
  onSelectSkin,
  upgrades,
  onUpgrade,
}) => {
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'ARMORY' | 'TECH' | 'CONTROLS' | 'SECTORS'>('OVERVIEW');

  // Track unlocked skins in local state / storage
  const [unlockedSkins, setUnlockedSkins] = useState<string[]>(() => {
    const saved = localStorage.getItem('grav_runner_unlocked_skins');
    return saved ? JSON.parse(saved) : ['CYAN_VANGUARD'];
  });

  const handleUnlockSkin = (skin: SkinInfo) => {
    if (unlockedSkins.includes(skin.id)) {
      onSelectSkin(skin.id);
      sound.playUpgrade();
      return;
    }

    if (totalOrbs >= skin.cost) {
      const nextUnlocked = [...unlockedSkins, skin.id];
      setUnlockedSkins(nextUnlocked);
      localStorage.setItem('grav_runner_unlocked_skins', JSON.stringify(nextUnlocked));
      onUpgrade('orbBonusLevel', 0); // Trigger save callback or subtract
      localStorage.setItem('grav_runner_total_orbs', (totalOrbs - skin.cost).toString());
      onSelectSkin(skin.id);
      sound.playUpgrade();
      window.location.reload(); // Simple sync or state update
    }
  };

  const getUpgradeCost = (currentLevel: number, baseCost: number) => {
    return (currentLevel + 1) * baseCost;
  };

  return (
    <div className="relative w-full h-full flex flex-col justify-between overflow-y-auto bg-black text-slate-100 z-20">
      {/* Background Cinematic Vista with Scrim */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <img
          src={skyboxImage}
          alt="Orbital Station Skyway"
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover opacity-35 scale-105 transition-transform duration-1000"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/85 to-black/60" />
      </div>

      {/* Top Bar Header */}
      <header className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-white/10 backdrop-blur-md bg-black/40">
        {/* Wordmark */}
        <div className="font-display font-bold text-lg md:text-xl tracking-wider text-white flex items-center gap-2">
          <span className="text-cyan-400">GRAV-PULSE</span>
          <span className="text-slate-400 font-normal text-sm">/ NULL VECTOR</span>
        </div>

        {/* Tab Navigation */}
        <nav className="hidden md:flex items-center gap-1 bg-white/5 border border-white/10 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('OVERVIEW')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
              activeTab === 'OVERVIEW'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Mission
          </button>
          <button
            onClick={() => setActiveTab('ARMORY')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
              activeTab === 'ARMORY'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Suits Armory
          </button>
          <button
            onClick={() => setActiveTab('TECH')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
              activeTab === 'TECH'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Tech Lab
          </button>
          <button
            onClick={() => setActiveTab('CONTROLS')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
              activeTab === 'CONTROLS'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Controls
          </button>
          <button
            onClick={() => setActiveTab('SECTORS')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
              activeTab === 'SECTORS'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Sectors
          </button>
        </nav>

        {/* Action Controls & Bank */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/60 border border-white/10 text-xs font-mono text-cyan-300">
            <Disc className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
            <span>{totalOrbs} Orbs</span>
          </div>

          <button
            onClick={onToggleMute}
            aria-label={isMuted ? 'Unmute Audio' : 'Mute Audio'}
            className="p-2 rounded-lg bg-white/5 border border-white/10 text-slate-300 hover:text-white hover:border-white/25 transition-colors focus-visible:ring-2 focus-visible:ring-cyan-400"
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          <button
            onClick={onStart}
            className="px-5 py-2 text-xs font-bold font-display uppercase tracking-wider text-black bg-cyan-400 hover:bg-cyan-300 rounded-lg shadow-lg shadow-cyan-400/25 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Launch Run</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 max-w-5xl mx-auto w-full px-6 py-6 flex flex-col md:flex-row items-center gap-8">
        {/* Left: Operative Chassis Preview */}
        <div className="w-full md:w-5/12 flex flex-col items-center">
          <div className="relative w-64 h-64 md:w-72 md:h-72 rounded-2xl overflow-hidden border border-cyan-500/30 bg-gradient-to-b from-cyan-950/30 to-black p-1 shadow-2xl shadow-cyan-500/15 group">
            <img
              src={runnerImage}
              alt="Vector Grav-Runner Operative"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover rounded-xl group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent rounded-xl" />
            <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between text-xs">
              <span className="font-display font-semibold text-white">CHASSIS ACTIVE</span>
              <span className="text-cyan-400 font-mono text-[11px]">
                {SKINS.find((s) => s.id === selectedSkin)?.name || 'CYAN VANGUARD'}
              </span>
            </div>
          </div>

          {/* High Score Unboxed Display */}
          <div className="mt-4 flex items-center gap-2 text-xs text-slate-400 font-mono">
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span>PERSONAL RECORD</span>
            <span aria-hidden="true">·</span>
            <span className="text-amber-400 font-bold tabular-nums text-sm">
              {highScore.toLocaleString()} PTS
            </span>
          </div>
        </div>

        {/* Right: Active Tab Display */}
        <div className="w-full md:w-7/12 flex flex-col gap-4">
          {/* Mobile Tab Switcher */}
          <div className="flex md:hidden items-center gap-1 bg-white/5 border border-white/10 p-1 rounded-lg w-full overflow-x-auto">
            {(['OVERVIEW', 'ARMORY', 'TECH', 'CONTROLS', 'SECTORS'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-1.5 px-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                  activeTab === tab ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400'
                }`}
              >
                {tab === 'OVERVIEW' ? 'Mission' : tab === 'ARMORY' ? 'Armory' : tab === 'TECH' ? 'Tech' : tab === 'CONTROLS' ? 'Controls' : 'Sectors'}
              </button>
            ))}
          </div>

          {/* Tab 1: Overview */}
          {activeTab === 'OVERVIEW' && (
            <div className="flex flex-col gap-4">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold font-display tracking-tight text-white">
                  Break the Speed Barrier.
                </h1>
                <p className="mt-2 text-sm text-slate-300 leading-relaxed">
                  Sprint across 3 high-speed hyperlanes grounded on orbital skyway decks. 
                  Dodge barriers, jump over plasma beams, and engage Anti-Grav Repulsors with <span className="text-cyan-300 font-bold">[G]</span> to hover-glide smoothly across ground hazards.
                </p>
              </div>

              {/* Core Features Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10 flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                    <Zap className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-white">Anti-Grav Hover Glide</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      Engage repulsors to hover-glide above track obstacles and floor gaps.
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10 flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400">
                    <Shield className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-white">Phase Shielding</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      Absorb high-velocity crashes and vaporize obstacle barriers.
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10 flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-white">Supersonic Dodging</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      Skim closely past obstacles to trigger Near-Miss velocity score bonuses.
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10 flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400">
                    <Layers className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-white">Procedural World Vista</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      Experience ringed celestial bodies, neon megastructures, and sky traffic.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Armory (Skins) */}
          {activeTab === 'ARMORY' && (
            <div className="flex flex-col gap-3">
              <div>
                <h2 className="text-2xl font-bold font-display text-white">Operative Armory</h2>
                <p className="text-xs text-slate-300">
                  Select and deploy specialized chassis variants.
                </p>
              </div>

              <div className="flex flex-col gap-2 max-h-64 overflow-y-auto pr-1">
                {SKINS.map((skin) => {
                  const isUnlocked = unlockedSkins.includes(skin.id);
                  const isEquipped = selectedSkin === skin.id;
                  const canAfford = totalOrbs >= skin.cost;

                  return (
                    <div
                      key={skin.id}
                      onClick={() => handleUnlockSkin(skin)}
                      className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                        isEquipped
                          ? 'bg-cyan-950/40 border-cyan-400 shadow-md shadow-cyan-500/10'
                          : 'bg-white/[0.03] border-white/10 hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg bg-gradient-to-tr ${skin.color} flex items-center justify-center text-black font-bold text-xs shadow-md`}>
                          MK
                        </div>
                        <div>
                          <div className="text-xs font-bold text-white flex items-center gap-2">
                            <span>{skin.name}</span>
                            {isEquipped && (
                              <span className="text-[10px] px-1.5 py-0.5 bg-cyan-400/20 text-cyan-300 rounded font-mono font-semibold">
                                EQUIPPED
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-400">{skin.desc}</div>
                        </div>
                      </div>

                      <div>
                        {isEquipped ? (
                          <Check className="w-4 h-4 text-cyan-400" />
                        ) : isUnlocked ? (
                          <span className="text-xs text-slate-300 font-mono hover:text-cyan-400">EQUIP</span>
                        ) : (
                          <div className={`flex items-center gap-1 text-xs font-mono font-semibold ${canAfford ? 'text-amber-400' : 'text-slate-500'}`}>
                            <Lock className="w-3 h-3" />
                            <span>{skin.cost} Orbs</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Tab 3: Tech Lab (Upgrades) */}
          {activeTab === 'TECH' && (
            <div className="flex flex-col gap-3">
              <div>
                <h2 className="text-2xl font-bold font-display text-white">Cybernetic Tech Lab</h2>
                <p className="text-xs text-slate-300">
                  Amplify phase core systems using harvested Null Orbs.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {/* 1. Orb Attractor (Magnet) */}
                <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10 flex flex-col justify-between gap-2">
                  <div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-amber-300">Orb Attractor</span>
                      <span className="font-mono text-slate-400">Rank {upgrades.magnetLevel}/4</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Increases magnetic pull range +6m & duration +2.5s per rank.
                    </p>
                  </div>
                  <button
                    disabled={upgrades.magnetLevel >= 4 || totalOrbs < getUpgradeCost(upgrades.magnetLevel, 35)}
                    onClick={() => onUpgrade('magnetLevel', getUpgradeCost(upgrades.magnetLevel, 35))}
                    className="w-full py-1.5 px-3 rounded-lg text-xs font-mono font-semibold bg-amber-500/20 border border-amber-500/30 text-amber-300 hover:bg-amber-500/30 disabled:opacity-40 disabled:pointer-events-none transition-colors flex items-center justify-center gap-1 cursor-pointer"
                  >
                    {upgrades.magnetLevel >= 4 ? 'MAXED' : `UPGRADE (${getUpgradeCost(upgrades.magnetLevel, 35)} ORBS)`}
                  </button>
                </div>

                {/* 2. Phase Shield */}
                <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10 flex flex-col justify-between gap-2">
                  <div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-blue-300">Phase Shield Matrix</span>
                      <span className="font-mono text-slate-400">Rank {upgrades.shieldLevel}/4</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Extends duration. At Rank 2+, automatically spawns active shield at run start!
                    </p>
                  </div>
                  <button
                    disabled={upgrades.shieldLevel >= 4 || totalOrbs < getUpgradeCost(upgrades.shieldLevel, 45)}
                    onClick={() => onUpgrade('shieldLevel', getUpgradeCost(upgrades.shieldLevel, 45))}
                    className="w-full py-1.5 px-3 rounded-lg text-xs font-mono font-semibold bg-blue-500/20 border border-blue-500/30 text-blue-300 hover:bg-blue-500/30 disabled:opacity-40 disabled:pointer-events-none transition-colors flex items-center justify-center gap-1 cursor-pointer"
                  >
                    {upgrades.shieldLevel >= 4 ? 'MAXED' : `UPGRADE (${getUpgradeCost(upgrades.shieldLevel, 45)} ORBS)`}
                  </button>
                </div>

                {/* 3. Grav Energy Cell */}
                <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10 flex flex-col justify-between gap-2">
                  <div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-cyan-300">Flux Battery Core</span>
                      <span className="font-mono text-slate-400">Rank {upgrades.energyCellLevel}/4</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Expands anti-gravity gauge capacity +15% per rank for sustained ceiling runs.
                    </p>
                  </div>
                  <button
                    disabled={upgrades.energyCellLevel >= 4 || totalOrbs < getUpgradeCost(upgrades.energyCellLevel, 30)}
                    onClick={() => onUpgrade('energyCellLevel', getUpgradeCost(upgrades.energyCellLevel, 30))}
                    className="w-full py-1.5 px-3 rounded-lg text-xs font-mono font-semibold bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/30 disabled:opacity-40 disabled:pointer-events-none transition-colors flex items-center justify-center gap-1 cursor-pointer"
                  >
                    {upgrades.energyCellLevel >= 4 ? 'MAXED' : `UPGRADE (${getUpgradeCost(upgrades.energyCellLevel, 30)} ORBS)`}
                  </button>
                </div>

                {/* 4. Orb Multiplier */}
                <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10 flex flex-col justify-between gap-2">
                  <div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-purple-300">Orb Hyper-Collector</span>
                      <span className="font-mono text-slate-400">Rank {upgrades.orbBonusLevel}/4</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Adds +20 bonus score points for every crystal orb collected on the track.
                    </p>
                  </div>
                  <button
                    disabled={upgrades.orbBonusLevel >= 4 || totalOrbs < getUpgradeCost(upgrades.orbBonusLevel, 40)}
                    onClick={() => onUpgrade('orbBonusLevel', getUpgradeCost(upgrades.orbBonusLevel, 40))}
                    className="w-full py-1.5 px-3 rounded-lg text-xs font-mono font-semibold bg-purple-500/20 border border-purple-500/30 text-purple-300 hover:bg-purple-500/30 disabled:opacity-40 disabled:pointer-events-none transition-colors flex items-center justify-center gap-1 cursor-pointer"
                  >
                    {upgrades.orbBonusLevel >= 4 ? 'MAXED' : `UPGRADE (${getUpgradeCost(upgrades.orbBonusLevel, 40)} ORBS)`}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Tab 4: Controls */}
          {activeTab === 'CONTROLS' && (
            <div className="flex flex-col gap-3">
              <div>
                <h2 className="text-2xl font-bold font-display text-white">Flight Deck Controls</h2>
                <p className="text-xs text-slate-300 mt-0.5">
                  Responsive controls with full keyboard and mobile gesture support.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="p-2.5 bg-white/[0.03] border border-white/10 rounded-xl flex items-center justify-between">
                  <div className="text-xs text-slate-200">Switch Lanes</div>
                  <div className="flex items-center gap-1 font-mono text-xs text-cyan-300 font-semibold">
                    <kbd className="px-2 py-0.5 bg-black/60 border border-white/15 rounded">A</kbd>
                    <kbd className="px-2 py-0.5 bg-black/60 border border-white/15 rounded">D</kbd>
                    <span className="text-slate-500">/ Swipe</span>
                  </div>
                </div>

                <div className="p-2.5 bg-white/[0.03] border border-white/10 rounded-xl flex items-center justify-between">
                  <div className="text-xs text-slate-200">Jump / Jet Arc</div>
                  <div className="flex items-center gap-1 font-mono text-xs text-cyan-300 font-semibold">
                    <kbd className="px-2 py-0.5 bg-black/60 border border-white/15 rounded">W</kbd>
                    <kbd className="px-2 py-0.5 bg-black/60 border border-white/15 rounded">▲</kbd>
                    <span className="text-slate-500">/ Swipe Up</span>
                  </div>
                </div>

                <div className="p-2.5 bg-white/[0.03] border border-white/10 rounded-xl flex items-center justify-between">
                  <div className="text-xs text-slate-200">Slide / Low Spark</div>
                  <div className="flex items-center gap-1 font-mono text-xs text-cyan-300 font-semibold">
                    <kbd className="px-2 py-0.5 bg-black/60 border border-white/15 rounded">S</kbd>
                    <kbd className="px-2 py-0.5 bg-black/60 border border-white/15 rounded">▼</kbd>
                    <span className="text-slate-500">/ Swipe Down</span>
                  </div>
                </div>

                <div className="p-2.5 bg-cyan-950/20 border border-cyan-500/30 rounded-xl flex items-center justify-between">
                  <div className="text-xs font-bold text-cyan-300">Anti-Grav Hover Glide</div>
                  <div className="flex items-center gap-1 font-mono text-xs text-white font-bold">
                    <kbd className="px-2 py-0.5 bg-cyan-500/20 border border-cyan-400 rounded text-cyan-300">G</kbd>
                    <kbd className="px-2 py-0.5 bg-cyan-500/20 border border-cyan-400 rounded text-cyan-300">F</kbd>
                    <span className="text-slate-500">/ Button</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 5: Sectors */}
          {activeTab === 'SECTORS' && (
            <div className="flex flex-col gap-3">
              <div>
                <h2 className="text-2xl font-bold font-display text-white">Orbital Sectors</h2>
                <p className="text-xs text-slate-300">
                  Dynamically shifting planetary environments every 650m.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="p-2.5 bg-cyan-950/20 border border-cyan-500/20 rounded-xl">
                  <div className="text-xs font-bold text-cyan-400 font-display">01. NEO-VANGUARD SKYWAY</div>
                  <div className="text-[11px] text-slate-300 mt-0.5">
                    Floating megalopolis with high-speed glass bridges and neon holographic spires.
                  </div>
                </div>

                <div className="p-2.5 bg-amber-950/20 border border-amber-500/20 rounded-xl">
                  <div className="text-xs font-bold text-amber-400 font-display">02. APEX ORBITAL STATION</div>
                  <div className="text-[11px] text-slate-300 mt-0.5">
                    Solar-ring transit hub with maglev acceleration loops and vacuum airlocks.
                  </div>
                </div>

                <div className="p-2.5 bg-purple-950/20 border border-purple-500/20 rounded-xl">
                  <div className="text-xs font-bold text-purple-400 font-display">03. PRISM CIRCUIT</div>
                  <div className="text-[11px] text-slate-300 mt-0.5">
                    High-energy hyperlane bathed in deep violet auroral radiation belts.
                  </div>
                </div>

                <div className="p-2.5 bg-emerald-950/20 border border-emerald-500/20 rounded-xl">
                  <div className="text-xs font-bold text-emerald-400 font-display">04. SECTOR 9 VOID QUARRY</div>
                  <div className="text-[11px] text-slate-300 mt-0.5">
                    Sub-surface asteroid mining zone with laser gantries and shattered track rifts.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Primary Action Button */}
          <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
            <button
              onClick={onStart}
              className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-cyan-400 to-sky-400 hover:from-cyan-300 hover:to-sky-300 text-black font-bold font-display text-sm tracking-wider uppercase rounded-xl shadow-xl shadow-cyan-400/20 transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-2.5 cursor-pointer"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Initiate Gravity Run</span>
            </button>

            <span className="text-xs text-slate-400 font-mono">
              Press [SPACE] or Click to Launch
            </span>
          </div>
        </div>
      </main>

      {/* Clean Editorial Footer */}
      <footer className="relative z-10 px-6 py-4 border-t border-white/10 bg-black/40 backdrop-blur-md flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-2">
        <div className="flex items-center gap-2">
          <span>Null-Vector Engine</span>
          <span aria-hidden="true">·</span>
          <span>Dual Deck Anti-Gravity Transit</span>
          <span aria-hidden="true">·</span>
          <span>Web Audio Synthesizer</span>
        </div>
        <div>
          <span>High Performance WebGL · 60 FPS</span>
        </div>
      </footer>
    </div>
  );
};
