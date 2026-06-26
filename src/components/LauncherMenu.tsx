import React from 'react';
import { GameScreen } from '../types';
import { audioManager } from '../utils/audio';
import { Play, Settings, BookOpen, Sparkles, Volume2, VolumeX, Sun } from 'lucide-react';

interface LauncherMenuProps {
  onNavigate: (screen: GameScreen) => void;
  isMuted: boolean;
  onToggleMute: () => void;
}

export default function LauncherMenu({ onNavigate, isMuted, onToggleMute }: LauncherMenuProps) {
  
  const handleSelectMenu = (screen: GameScreen) => {
    audioManager.playClick();
    onNavigate(screen);
  };

  return (
    <div id="launcher-menu-container" className="max-w-md w-full mx-auto bg-white/95 border-2 border-amber-300 rounded-3xl p-6 md:p-8 shadow-[0_10px_50px_rgba(245,158,11,0.15)] backdrop-blur-xl text-center flex flex-col items-center animate-slide-up">
      
      {/* Sound Controller in corner */}
      <div className="w-full flex justify-end mb-2">
        <button
          id="btn-launcher-mute"
          onClick={() => {
            onToggleMute();
            audioManager.playClick();
          }}
          className="p-2 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-600 transition duration-150"
          title="เปิด/ปิดเสียงดนตรี"
        >
          {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
        </button>
      </div>

      {/* Main logo with bright animation */}
      <div id="logo-wrapper" className="relative group mb-4 flex items-center justify-center">
        {/* Animated golden-yellow glow ring under the logo */}
        <div className="absolute inset-0 bg-gradient-to-r from-amber-400 to-yellow-300 rounded-full blur-3xl opacity-60 group-hover:opacity-90 transition duration-300 animate-pulse-slow"></div>
        
        {/* Shimmering stars glow behind the logo */}
        <div className="absolute text-xl top-[20%] left-[10%] animate-ping text-yellow-500">✨</div>
        <div className="absolute text-xl bottom-[25%] right-[10%] animate-ping text-yellow-500" style={{ animationDelay: '0.5s' }}>✨</div>

        <div className="relative flex flex-col items-center justify-center p-4 bg-gradient-to-b from-amber-50 to-amber-100/50 rounded-2xl border border-amber-200 shadow-inner">
          <span className="text-7xl animate-float">🌾🌞🌾</span>
        </div>
      </div>

      {/* Title Game Name in Cheerful display style */}
      <div id="game-title-header" className="mb-8">
        <h1 className="text-4xl md:text-5xl font-black font-sans text-transparent bg-clip-text bg-gradient-to-r from-amber-500 via-orange-500 to-emerald-600 tracking-wider select-none filter drop-shadow-sm">
          ทุ่งรวงทอง แดนอีสาน
        </h1>
        <p className="text-emerald-600 font-sans text-xs mt-2 font-black tracking-widest uppercase flex items-center justify-center gap-1.5 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
          <Sun className="w-3.5 h-3.5 text-amber-500 animate-spin-slow" /> แดนสวรรค์อีสานแสนสุข 3D <Sun className="w-3.5 h-3.5 text-amber-500 animate-spin-slow" />
        </p>
      </div>

      {/* Menus List with Golden/Green cheerful theme */}
      <div id="launcher-buttons-list" className="w-full space-y-3.5">
        
        {/* PLAY BUTTON */}
        <button
          id="btn-menu-play"
          onClick={() => handleSelectMenu('playing')}
          className="w-full py-4 px-6 bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-400 bg-[length:200%_auto] hover:bg-right transition-all duration-300 text-white font-extrabold text-lg md:text-xl rounded-2xl shadow-md shadow-orange-500/20 hover:shadow-orange-500/40 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-3 cursor-pointer group border border-amber-300"
        >
          <Play className="w-6 h-6 fill-white group-hover:scale-110 transition duration-200 text-amber-100" />
          <span>เริ่มเที่ยวทุ่งแสนสนุก (Play Game)</span>
        </button>

        {/* OPTIONS BUTTON */}
        <button
          id="btn-menu-options"
          onClick={() => handleSelectMenu('options')}
          className="w-full py-3.5 px-6 bg-amber-50/50 hover:bg-amber-50 text-amber-700 font-bold text-base md:text-lg rounded-2xl border border-amber-200 hover:border-amber-300 transition duration-150 flex items-center justify-center gap-2.5 cursor-pointer"
        >
          <Settings className="w-5 h-5 text-amber-600" />
          <span>ตั้งค่าปุ่มและเสียงดนตรี (Options)</span>
        </button>

        {/* HOW TO PLAY BUTTON */}
        <button
          id="btn-menu-howto"
          onClick={() => handleSelectMenu('how-to-play')}
          className="w-full py-3 px-6 bg-emerald-50/30 hover:bg-emerald-50 text-emerald-700 hover:text-emerald-800 font-semibold text-sm md:text-base rounded-2xl border border-emerald-100 hover:border-emerald-200 transition duration-150 flex items-center justify-center gap-2.5 cursor-pointer"
        >
          <BookOpen className="w-4 h-4 text-emerald-600" />
          <span>คู่มือกติกาความสุข (How to Play)</span>
        </button>

        {/* CREDITS BUTTON */}
        <button
          id="btn-menu-credits"
          onClick={() => handleSelectMenu('credits')}
          className="w-full py-3 px-6 bg-transparent hover:bg-amber-50 text-slate-500 hover:text-amber-700 font-medium text-xs rounded-2xl transition duration-150 flex items-center justify-center gap-2 cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>ผู้สร้างสรรค์แดนทุ่งสุขสันต์ (Credits)</span>
        </button>
      </div>

      {/* Mini Footer / Disclaimer */}
      <div id="launcher-footer" className="mt-8 text-[11px] text-emerald-700 font-mono">
        <span>HAPPY DAN E SAN • BRIGHT GOLDEN EDITION • 2026</span>
      </div>
    </div>
  );
}
