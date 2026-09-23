import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GameEngine } from './game/gameEngine';
import { 
  GameState, 
  GameStats, 
  OperativeSkin, 
  TechUpgrades, 
  GameNotification 
} from './game/types';
import { HUD } from './components/HUD';
import { StartScreen } from './components/StartScreen';
import { PauseModal } from './components/PauseModal';
import { GameOverModal } from './components/GameOverModal';
import { sound } from './game/audio';

const INITIAL_STATS: GameStats = {
  score: 0,
  distance: 0,
  orbsCollected: 0,
  multiplier: 1,
  highScore: 0,
  gravEnergy: 100,
  gravityState: 'NORMAL',
  activePowerUps: [],
  currentSpeed: 26,
  environment: 'NEO_VANGUARD',
};

export default function App() {
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<GameEngine | null>(null);

  const [gameState, setGameState] = useState<GameState>('MENU');
  const [stats, setStats] = useState<GameStats>(INITIAL_STATS);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [sfxVolume, setSfxVolume] = useState<number>(0.7);
  const [notifications, setNotifications] = useState<GameNotification[]>([]);

  // Persistent player profile & armory
  const [totalOrbs, setTotalOrbs] = useState<number>(() => {
    const saved = localStorage.getItem('grav_runner_total_orbs');
    return saved ? parseInt(saved, 10) || 0 : 0;
  });

  const [selectedSkin, setSelectedSkin] = useState<OperativeSkin>(() => {
    return (localStorage.getItem('grav_runner_skin') as OperativeSkin) || 'CYAN_VANGUARD';
  });

  const [upgrades, setUpgrades] = useState<TechUpgrades>(() => {
    const saved = localStorage.getItem('grav_runner_upgrades');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // default fallback
      }
    }
    return {
      magnetLevel: 0,
      shieldLevel: 0,
      energyCellLevel: 0,
      orbBonusLevel: 0,
    };
  });

  // Initialize Game Engine
  useEffect(() => {
    if (!canvasContainerRef.current) return;

    const engine = new GameEngine(canvasContainerRef.current);
    engineRef.current = engine;

    engine.onStatsUpdate = (newStats: GameStats) => {
      setStats(newStats);
    };

    engine.onNotification = (notif: GameNotification) => {
      setNotifications((prev) => [...prev.slice(-2), notif]);
      setTimeout(() => {
        setNotifications((prev) => prev.filter((n) => n.id !== notif.id));
      }, 2400);
    };

    engine.onStateChange = (newState: GameState) => {
      setGameState(newState);
      if (newState === 'GAMEOVER') {
        // Bank collected orbs into wallet
        setTotalOrbs((prev) => {
          const updated = prev + engine.orbsCollected;
          localStorage.setItem('grav_runner_total_orbs', updated.toString());
          return updated;
        });
      }
    };

    // Load initial highscore
    const savedHighScore = localStorage.getItem('grav_runner_highscore');
    if (savedHighScore) {
      setStats((prev) => ({
        ...prev,
        highScore: parseInt(savedHighScore, 10) || 0,
      }));
    }

    return () => {
      engine.dispose();
      engineRef.current = null;
    };
  }, []);

  const handleStartGame = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.startGame();
    }
  }, []);

  const handlePause = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.pauseGame();
    }
  }, []);

  const handleResume = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.resumeGame();
    }
  }, []);

  const handleRestart = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.restartGame();
    }
  }, []);

  const handleMenu = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.state = 'MENU';
      sound.stopMusic();
      setGameState('MENU');
    }
  }, []);

  const handleToggleMute = useCallback(() => {
    const muted = sound.toggleMute();
    setIsMuted(muted);
  }, []);

  const handleSfxVolumeChange = useCallback((vol: number) => {
    setSfxVolume(vol);
    sound.setSfxVolume(vol);
  }, []);

  const handleToggleGravity = useCallback(() => {
    if (engineRef.current && engineRef.current.state === 'PLAYING') {
      engineRef.current.toggleGravity();
    }
  }, []);

  const handleJump = useCallback(() => {
    if (engineRef.current && engineRef.current.state === 'PLAYING') {
      engineRef.current.jump();
    }
  }, []);

  const handleSlide = useCallback(() => {
    if (engineRef.current && engineRef.current.state === 'PLAYING') {
      engineRef.current.slide();
    }
  }, []);

  const handleSwitchLane = useCallback((dir: -1 | 1) => {
    if (engineRef.current && engineRef.current.state === 'PLAYING') {
      engineRef.current.switchLane(dir);
    }
  }, []);

  const handleSelectSkin = useCallback((skin: OperativeSkin) => {
    setSelectedSkin(skin);
    if (engineRef.current) {
      engineRef.current.setSkin(skin);
    }
  }, []);

  const handleUpgrade = useCallback((type: keyof TechUpgrades, cost: number) => {
    setTotalOrbs((currentOrbs) => {
      if (currentOrbs < cost) return currentOrbs;
      const newOrbs = currentOrbs - cost;
      localStorage.setItem('grav_runner_total_orbs', newOrbs.toString());

      setUpgrades((prev) => {
        const next = { ...prev, [type]: prev[type] + 1 };
        localStorage.setItem('grav_runner_upgrades', JSON.stringify(next));
        if (engineRef.current) {
          engineRef.current.setUpgrades(next);
        }
        return next;
      });

      sound.playUpgrade();
      return newOrbs;
    });
  }, []);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black font-body select-none">
      {/* 3D WebGL Canvas Viewport */}
      <div
        ref={canvasContainerRef}
        className="absolute inset-0 w-full h-full z-0 cursor-crosshair"
      />

      {/* Start Screen Overlay */}
      {gameState === 'MENU' && (
        <StartScreen
          highScore={stats.highScore}
          onStart={handleStartGame}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
          totalOrbs={totalOrbs}
          selectedSkin={selectedSkin}
          onSelectSkin={handleSelectSkin}
          upgrades={upgrades}
          onUpgrade={handleUpgrade}
        />
      )}

      {/* Active In-Game HUD (Visible during gameplay and paused/gameover background) */}
      {gameState !== 'MENU' && (
        <HUD
          stats={stats}
          notifications={notifications}
          onPause={handlePause}
          onToggleMute={handleToggleMute}
          isMuted={isMuted}
          onToggleGravity={handleToggleGravity}
          onJump={handleJump}
          onSlide={handleSlide}
          onSwitchLane={handleSwitchLane}
        />
      )}

      {/* Pause Screen Modal */}
      {gameState === 'PAUSED' && (
        <PauseModal
          onResume={handleResume}
          onRestart={handleRestart}
          onMenu={handleMenu}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
          sfxVolume={sfxVolume}
          onSfxVolumeChange={handleSfxVolumeChange}
        />
      )}

      {/* Game Over Modal */}
      {gameState === 'GAMEOVER' && (
        <GameOverModal
          stats={stats}
          onRestart={handleRestart}
          onMenu={handleMenu}
        />
      )}
    </div>
  );
}
