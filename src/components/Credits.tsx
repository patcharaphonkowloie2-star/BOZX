import React from 'react';
import { ArrowLeft, Sparkles, Sun } from 'lucide-react';
import { audioManager } from '../utils/audio';

interface CreditsProps {
  onBack: () => void;
}

export default function Credits({ onBack }: CreditsProps) {
  return (
    <div id="credits-container" className="max-w-md w-full mx-auto bg-white/95 border-2 border-amber-300 rounded-3xl p-6 md:p-8 shadow-[0_10px_50px_rgba(245,158,11,0.15)] backdrop-blur-xl text-center flex flex-col items-center animate-slide-up">
      {/* Header */}
      <div className="w-full flex items-center justify-between mb-6 border-b border-amber-200 pb-4">
        <h2 id="credits-title" className="text-xl font-bold font-sans text-amber-600 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-amber-500" />
          ผู้สร้างสรรค์ทุ่งแสนสนุก (Credits)
        </h2>
        <button
          id="btn-back-credits"
          onClick={() => { audioManager.playClick(); onBack(); }}
          className="text-slate-400 hover:text-amber-500 transition duration-200"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
      </div>

      {/* Sun / Flower Animation */}
      <div className="relative mb-6">
        <Sun className="w-16 h-16 text-amber-500 animate-spin-slow" />
        <span className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-2xl">🌾</span>
      </div>

      {/* Main Text */}
      <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-600 to-emerald-600 font-sans mb-3">
        ทุ่งรวงทอง แดนอีสาน
      </h3>
      
      <p className="text-slate-600 text-sm font-sans leading-relaxed mb-6">
        เกมท่องเที่ยวนี้อิงตามทัศนียภาพและวิถีชีวิตท้องถิ่นที่สวยงามของชาวอีสาน เกี่ยวกับ <span className="text-amber-600 font-semibold">"ทุ่งรวงทองแดนข้าวหอมมะลิกว้างใหญ่"</span>
        ทุ่งข้าวแสนงามกว้างใหญ่สุดลูกหูลูกตา บรรเลงคลื่นดนตรีเพลงพิณจังหวะสนุกสนานคึกคัก สร้างความสุขสงบร่มเย็นและรอยยิ้มให้กับเยาวชนคนรุ่นหลัง
      </p>

      {/* Sub Credits Details */}
      <div className="w-full space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-left text-xs mb-6">
        <div className="flex justify-between border-b border-slate-100 pb-2">
          <span className="text-slate-500">วิถีชีวิตและวัฒนธรรม</span>
          <span className="text-emerald-600 font-semibold">ทุ่งกุลารวงทองแดนอีสาน</span>
        </div>
        <div className="flex justify-between border-b border-slate-100 pb-2">
          <span className="text-slate-500">ซินธิไซเซอร์ร่าเริง</span>
          <span className="text-amber-600 font-semibold">Web Audio Oscillators</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500">เทคโนโลยีและดีไซน์</span>
          <span className="text-slate-700 font-semibold">React, Tailwind, ThreeJS</span>
        </div>
      </div>

      {/* Quote */}
      <p className="text-xs text-amber-600/80 font-sans italic mb-8">
        "ฟ้าสีครามคอยสว่าง แดดเรืองรองอุ่นใจ... สายลมโบกพัดผ่าน ท้องทุ่งตระการตา"
      </p>

      {/* Return Button */}
      <button
        id="btn-credits-close"
        onClick={() => { audioManager.playClick(); onBack(); }}
        className="w-full py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition duration-150 border border-slate-200"
      >
        กลับไปหน้าหลัก
      </button>
    </div>
  );
}
