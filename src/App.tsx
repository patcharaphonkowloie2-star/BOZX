import React, { useState, useEffect } from 'react';
import { GameScreen, GameSettings } from './types';
import LauncherMenu from './components/LauncherMenu';
import OptionsMenu from './components/OptionsMenu';
import GameCanvas from './components/GameCanvas';
import HowToPlay from './components/HowToPlay';
import Credits from './components/Credits';
import { audioManager } from './utils/audio';
import { Sparkles, Music, Volume2, VolumeX, Skull } from 'lucide-react';

const LOCAL_STORAGE_KEY = 'danesan_game_settings';

export default function App() {
  const [screen, setScreen] = useState<GameScreen>('launcher');
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [hasInteracted, setHasInteracted] = useState<boolean>(false);

  // Initialize Game Settings with safe defaults or load from LocalStorage
  const [settings, setSettings] = useState<GameSettings>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Guarantee key structure integrity
        if (parsed.controls && parsed.controls.left) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn("Could not read local storage settings", e);
    }

    return {
      bgmVolume: 0.5,
      sfxVolume: 0.6,
      controls: {
        left: 'ArrowLeft',
        right: 'ArrowRight',
        jump: 'Space',
        action: 'KeyF',
      },
      controlPreset: 'arrows',
      showOnScreenControls: true,
    };
  });

  // Apply volume settings to the Audio manager
  useEffect(() => {
    audioManager.setVolumes(settings.bgmVolume, settings.sfxVolume);
  }, [settings]);

  // Persist settings to local storage on change
  const handleSaveSettings = (newSettings: GameSettings) => {
    setSettings(newSettings);
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newSettings));
    } catch (e) {
      console.warn("Could not save settings to local storage", e);
    }
  };

  // Sound manager muting
  const handleToggleMute = () => {
    const muted = audioManager.toggleMute();
    setIsMuted(muted);
  };

  // Start BGM on the first user interaction (browser security policy)
  const handleInteraction = () => {
    if (!hasInteracted) {
      setHasInteracted(true);
      // Initialize and start the creepy ambient soundtrack!
      audioManager.startBgm();
    }
  };

  return (
    <div
      id="app-root-wrapper"
      onClick={handleInteraction}
      onTouchStart={handleInteraction}
      className="min-h-screen w-full relative bg-amber-50 flex flex-col items-center justify-center p-4 overflow-hidden"
      style={{
        backgroundImage: 'radial-gradient(circle at 50% 50%, #f0f9ff 0%, #bae6fd 100%)'
      }}
    >
      {/* Background Ambient happy particles */}
      <div className="absolute inset-0 pointer-events-none opacity-60">
        <div className="absolute w-96 h-96 bg-yellow-200/40 rounded-full blur-3xl top-10 left-10 animate-pulse-slow" />
        <div className="absolute w-96 h-96 bg-emerald-200/30 rounded-full blur-3xl bottom-10 right-10 animate-pulse-slow" style={{ animationDelay: '1.5s' }} />
      </div>

      {/* Floating Happy icons in the air */}
      <div className="absolute top-10 left-1/4 text-yellow-500/30 text-3xl animate-float">🌞</div>
      <div className="absolute bottom-20 right-1/4 text-amber-500/20 text-2xl animate-float" style={{ animationDelay: '2s' }}>🦋</div>
      <div className="absolute top-1/3 right-10 text-emerald-500/25 text-xl animate-float" style={{ animationDelay: '1s' }}>🎈</div>

      {/* First Interaction banner helper */}
      {!hasInteracted && (
        <div
          id="interaction-hud-banner"
          className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-amber-500/90 text-white font-bold px-5 py-2.5 rounded-full shadow-lg text-xs md:text-sm animate-bounce flex items-center gap-2 border border-amber-300 backdrop-blur-md cursor-pointer pointer-events-none"
        >
          <Sparkles className="w-4 h-4 text-amber-100 animate-pulse" />
          <span>แตะหน้าจอตรงไหนก็ได้เพื่อเปิดดนตรีอีสานแสนสนุก!</span>
        </div>
      )}

      {/* Screen Router */}
      <div id="game-main-stage" className="w-full max-w-4xl relative z-10 flex flex-col items-center justify-center">
        {screen === 'launcher' && (
          <LauncherMenu
            onNavigate={setScreen}
            isMuted={isMuted}
            onToggleMute={handleToggleMute}
          />
        )}

        {screen === 'playing' && (
          <GameCanvas
            settings={settings}
            onBackToMenu={() => setScreen('launcher')}
          />
        )}

        {screen === 'options' && (
          <OptionsMenu
            settings={settings}
            onSave={handleSaveSettings}
            onBack={() => setScreen('launcher')}
          />
        )}

        {screen === 'how-to-play' && (
          <HowToPlay
            onBack={() => setScreen('launcher')}
          />
        )}

        {screen === 'credits' && (
          <Credits
            onBack={() => setScreen('launcher')}
          />
        )}
      </div>

      {/* Global aesthetic decorations */}
      <div className="absolute bottom-4 left-4 right-4 flex justify-between text-[11px] text-sky-900/60 font-mono pointer-events-none select-none">
        <span>DAN E SAN • ดินแดนอีสานแสนสดใส • 2026</span>
        <span>BRIGHT & HAPPY DAYTIME 🌾</span>
      </div>
    </div>
  );
}
