export interface KeyBindings {
  left: string;
  right: string;
  jump: string;
  action: string;
}

export interface GameSettings {
  bgmVolume: number;
  sfxVolume: number;
  controls: KeyBindings;
  controlPreset: 'wasd' | 'arrows' | 'custom';
  showOnScreenControls: boolean;
}

export type GameScreen = 'launcher' | 'playing' | 'options' | 'how-to-play' | 'credits' | 'game-over';

export interface ScoreRecord {
  name: string;
  score: number;
  date: string;
}

export interface IsanItem {
  id: number;
  x: number;
  y: number;
  type: 'amulet' | 'holywater' | 'blessedrice' | 'lamp' | 'candle';
  collected: boolean;
  points: number;
  label: string;
  emoji: string;
}

export interface Obstacle {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'pop' | 'krasue' | 'pret';
  speed: number;
  damage: number;
  emoji: string;
}
