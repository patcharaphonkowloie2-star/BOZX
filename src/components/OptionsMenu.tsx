import React, { useState, useEffect } from 'react';
import { GameSettings, KeyBindings } from '../types';
import { audioManager } from '../utils/audio';
import { ArrowLeft, Keyboard, Volume2, Gamepad2, RotateCcw, Check, Sparkles, Sun } from 'lucide-react';

interface OptionsMenuProps {
  settings: GameSettings;
  onSave: (settings: GameSettings) => void;
  onBack: () => void;
}

export default function OptionsMenu({ settings, onSave, onBack }: OptionsMenuProps) {
  const [currentSettings, setCurrentSettings] = useState<GameSettings>({ ...settings });
  const [bindingKey, setBindingKey] = useState<keyof KeyBindings | null>(null);

  // Keyboard mapping labels in Thai with cheerful tone
  const keyLabels: Record<keyof KeyBindings, string> = {
    left: 'วิ่งรับลมไปทางซ้าย (Move Left)',
    right: 'วิ่งรับลมไปทางขวา (Move Right)',
    jump: 'กระโดดข้ามกองฟาง (Jump / Up)',
    action: 'ดีดพิณสามช่าสร้างรอยยิ้ม (Play Happy Phin / Dance)',
  };

  const handlePresetChange = (preset: 'wasd' | 'arrows' | 'custom') => {
    audioManager.playClick();
    let newControls: KeyBindings = { ...currentSettings.controls };
    
    if (preset === 'wasd') {
      newControls = {
        left: 'KeyA',
        right: 'KeyD',
        jump: 'Space',
        action: 'KeyF',
      };
    } else if (preset === 'arrows') {
      newControls = {
        left: 'ArrowLeft',
        right: 'ArrowRight',
        jump: 'ArrowUp',
        action: 'Enter',
      };
    }

    setCurrentSettings(prev => ({
      ...prev,
      controlPreset: preset,
      controls: newControls,
    }));
  };

  const startBinding = (key: keyof KeyBindings) => {
    audioManager.playClick();
    setBindingKey(key);
  };

  // Listen for keydown when binding a custom key
  useEffect(() => {
    if (!bindingKey) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      e.preventDefault();
      
      // Don't bind Escape key as it is used to cancel/exit
      if (e.code === 'Escape') {
        setBindingKey(null);
        return;
      }

      audioManager.playCollect();

      const newControls = {
        ...currentSettings.controls,
        [bindingKey]: e.code,
      };

      setCurrentSettings(prev => ({
        ...prev,
        controlPreset: 'custom',
        controls: newControls,
      }));

      setBindingKey(null);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [bindingKey, currentSettings]);

  const handleVolumeChange = (type: 'bgm' | 'sfx', value: number) => {
    const updated = { ...currentSettings };
    if (type === 'bgm') {
      updated.bgmVolume = value;
    } else {
      updated.sfxVolume = value;
    }
    setCurrentSettings(updated);
    audioManager.setVolumes(updated.bgmVolume, updated.sfxVolume);
  };

  const handleSave = () => {
    audioManager.playClick();
    onSave(currentSettings);
    onBack();
  };

  const resetToDefault = () => {
    audioManager.playClick();
    const defaults: GameSettings = {
      bgmVolume: 0.5,
      sfxVolume: 0.6,
      controls: {
        left: 'ArrowLeft',
        right: 'ArrowRight',
        jump: 'Space',
        action: 'KeyF',
      },
      controlPreset: 'custom',
      showOnScreenControls: true,
    };
    setCurrentSettings(defaults);
    audioManager.setVolumes(defaults.bgmVolume, defaults.sfxVolume);
  };

  const formatKeyName = (code: string) => {
    if (!code) return 'ว่างเปล่า';
    return code
      .replace('Key', '')
      .replace('Arrow', 'ปุ่มลูกศร ')
      .replace('Digit', 'ตัวเลข ')
      .replace('Space', 'Spacebar')
      .replace('Enter', 'Enter ↵')
      .replace('ShiftLeft', 'Shift ซ้าย')
      .replace('ShiftRight', 'Shift ขวา')
      .replace('ControlLeft', 'Ctrl ซ้าย')
      .replace('AltLeft', 'Alt ซ้าย');
  };

  return (
    <div id="options-container" className="relative max-w-2xl w-full mx-auto bg-white/95 border-2 border-amber-300 rounded-3xl p-6 md:p-8 shadow-[0_10px_50px_rgba(245,158,11,0.1)] backdrop-blur-xl max-h-[90vh] overflow-y-auto animate-slide-up">
      {/* Title */}
      <div className="flex items-center justify-between mb-6 border-b border-amber-200 pb-4">
        <h2 id="options-title" className="text-2xl md:text-3xl font-bold font-sans text-transparent bg-clip-text bg-gradient-to-r from-amber-600 to-orange-500 flex items-center gap-3">
          <Sparkles className="text-amber-500 w-8 h-8 animate-pulse-slow" />
          การตั้งค่าเครื่องดนตรีและควบคุม (Options)
        </h2>
        <button
          id="btn-back-header"
          onClick={() => { audioManager.playClick(); onBack(); }}
          className="text-slate-400 hover:text-amber-500 transition duration-200"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
      </div>

      <div className="space-y-6">
        {/* Preset Selector */}
        <div id="preset-section" className="bg-amber-50/40 p-4 rounded-2xl border border-amber-200">
          <h3 className="text-lg font-semibold text-amber-700 mb-3 flex items-center gap-2">
            <Gamepad2 className="w-5 h-5 text-amber-500" />
            รูปแบบการบังคับตัวละคร
          </h3>
          <div className="grid grid-cols-3 gap-3">
            <button
              id="preset-wasd"
              onClick={() => handlePresetChange('wasd')}
              className={`py-3 px-4 rounded-xl font-medium transition-all flex flex-col items-center justify-center border-2 ${
                currentSettings.controlPreset === 'wasd'
                  ? 'bg-gradient-to-br from-amber-500 to-orange-500 text-white border-amber-400 shadow-md'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-transparent'
              }`}
            >
              <span className="text-lg font-bold">W-A-S-D</span>
              <span className="text-xs opacity-80 mt-1">สไตล์ยอดฮิต</span>
            </button>
            <button
              id="preset-arrows"
              onClick={() => handlePresetChange('arrows')}
              className={`py-3 px-4 rounded-xl font-medium transition-all flex flex-col items-center justify-center border-2 ${
                currentSettings.controlPreset === 'arrows'
                  ? 'bg-gradient-to-br from-amber-500 to-orange-500 text-white border-amber-400 shadow-md'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-transparent'
              }`}
            >
              <span className="text-lg font-bold">ลูกศรทิศทาง</span>
              <span className="text-xs opacity-80 mt-1">แป้นดั้งเดิม</span>
            </button>
            <button
              id="preset-custom"
              onClick={() => handlePresetChange('custom')}
              className={`py-3 px-4 rounded-xl font-medium transition-all flex flex-col items-center justify-center border-2 ${
                currentSettings.controlPreset === 'custom'
                  ? 'bg-gradient-to-br from-amber-500 to-orange-500 text-white border-amber-400 shadow-md'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-transparent'
              }`}
            >
              <span className="text-lg font-bold">ปรับแต่งปุ่ม</span>
              <span className="text-xs opacity-80 mt-1">กำหนดเองอิสระ</span>
            </button>
          </div>
        </div>

        {/* Custom bindings mapping list */}
        <div id="keybindings-section" className="bg-amber-50/40 p-4 rounded-2xl border border-amber-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-amber-700 flex items-center gap-2">
              <Keyboard className="w-5 h-5 text-amber-500" />
              กำหนดหน้าที่ปุ่มรายปุ่ม
            </h3>
            {bindingKey && (
              <span className="text-xs text-amber-600 animate-pulse bg-amber-50 border border-amber-200 px-2 py-1 rounded-full">
                กำลังบันทึกการกดปุ่ม... (กด ESC เพื่อกลับ)
              </span>
            )}
          </div>

          <div className="space-y-2.5">
            {(Object.keys(currentSettings.controls) as Array<keyof KeyBindings>).map((key) => {
              const isActive = bindingKey === key;
              return (
                <div
                  key={key}
                  id={`row-bind-${key}`}
                  className={`flex items-center justify-between p-3 rounded-xl transition duration-150 border ${
                    isActive
                      ? 'bg-amber-50 border-amber-400'
                      : 'bg-white hover:bg-amber-50/50 border-slate-200'
                  }`}
                >
                  <span className="text-sm md:text-base font-medium text-slate-700">
                    {keyLabels[key]}
                  </span>
                  <button
                    id={`btn-bind-${key}`}
                    onClick={() => startBinding(key)}
                    disabled={bindingKey !== null && !isActive}
                    className={`py-1.5 px-4 rounded-lg font-mono text-sm min-w-32 text-center transition-all border-2 ${
                      isActive
                        ? 'bg-amber-500 text-white font-bold border-amber-400 shadow-sm scale-105'
                        : 'bg-slate-50 hover:bg-slate-100 text-amber-600 border-amber-200'
                    } disabled:opacity-50`}
                  >
                    {isActive ? 'กดปุ่มใหม่...' : formatKeyName(currentSettings.controls[key])}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Touch HUD switch */}
        <div id="hud-section" className="bg-amber-50/40 p-4 rounded-2xl border border-amber-200 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-slate-800 font-semibold flex items-center gap-2">
              <Sun className="w-4 h-4 text-amber-500" />
              ปุ่มสัมผัสลอยหน้าจอ (Mobile HUD)
            </span>
            <span className="text-xs text-slate-500 mt-0.5">
              เปิดไว้หากคุณเล่นเกมบนโทรศัพท์มือถือ/แท็บเล็ต
            </span>
          </div>
          <button
            id="btn-toggle-hud"
            onClick={() => {
              audioManager.playClick();
              setCurrentSettings(prev => ({
                ...prev,
                showOnScreenControls: !prev.showOnScreenControls,
              }));
            }}
            className={`w-14 h-7 rounded-full transition-colors relative ${
              currentSettings.showOnScreenControls ? 'bg-amber-500' : 'bg-slate-300'
            }`}
          >
            <span
              className={`absolute top-1 left-1 bg-white w-5 h-5 rounded-full transition-transform duration-200 ${
                currentSettings.showOnScreenControls ? 'translate-x-7' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Audio Volume configuration */}
        <div id="audio-section" className="bg-amber-50/40 p-4 rounded-2xl border border-amber-200">
          <h3 className="text-lg font-semibold text-amber-700 mb-4 flex items-center gap-2">
            <Volume2 className="w-5 h-5 text-amber-500" />
            ระดับดนตรีและเอฟเฟกต์ (Audio Settings)
          </h3>

          <div className="space-y-4">
            <div id="row-bgm-vol" className="flex flex-col gap-2">
              <div className="flex justify-between text-sm text-slate-600">
                <span>เสียงแอมเบี้ยน & ดนตรีอีสาน (BGM)</span>
                <span className="font-mono text-amber-600 font-semibold">
                  {Math.round(currentSettings.bgmVolume * 100)}%
                </span>
              </div>
              <input
                id="slider-bgm"
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={currentSettings.bgmVolume}
                onChange={(e) => handleVolumeChange('bgm', parseFloat(e.target.value))}
                className="w-full accent-amber-500 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            <div id="row-sfx-vol" className="flex flex-col gap-2">
              <div className="flex justify-between text-sm text-slate-600">
                <span>เสียงเครื่องดนตรีและพิณสดใส (SFX)</span>
                <span className="font-mono text-amber-600 font-semibold">
                  {Math.round(currentSettings.sfxVolume * 100)}%
                </span>
              </div>
              <input
                id="slider-sfx"
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={currentSettings.sfxVolume}
                onChange={(e) => handleVolumeChange('sfx', parseFloat(e.target.value))}
                className="w-full accent-amber-500 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Buttons */}
      <div id="options-actions" className="mt-8 flex gap-3 border-t border-slate-200 pt-6">
        <button
          id="btn-reset-options"
          onClick={resetToDefault}
          className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition duration-150 flex items-center justify-center gap-2 border border-slate-200"
        >
          <RotateCcw className="w-4 h-4" />
          คืนค่าเริ่มต้น
        </button>
        <button
          id="btn-save-options"
          onClick={handleSave}
          className="flex-1 py-3 px-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold rounded-xl transition duration-150 shadow-md flex items-center justify-center gap-2"
        >
          <Check className="w-4 h-4" />
          บันทึกการตั้งค่า
        </button>
      </div>
    </div>
  );
}
