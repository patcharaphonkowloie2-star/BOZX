import React from 'react';
import { ArrowLeft, BookOpen, Star, Sparkles, Sun } from 'lucide-react';
import { audioManager } from '../utils/audio';

interface HowToPlayProps {
  onBack: () => void;
}

export default function HowToPlay({ onBack }: HowToPlayProps) {
  return (
    <div id="howto-container" className="max-w-2xl w-full mx-auto bg-white/95 border-2 border-amber-300 rounded-3xl p-6 md:p-8 shadow-[0_10px_50px_rgba(245,158,11,0.15)] backdrop-blur-xl max-h-[90vh] overflow-y-auto animate-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 border-b border-amber-200 pb-4">
        <h2 id="howto-title" className="text-2xl md:text-3xl font-bold font-sans text-transparent bg-clip-text bg-gradient-to-r from-amber-600 to-emerald-600 flex items-center gap-3">
          <BookOpen className="text-amber-500 w-8 h-8" />
          คู่มือการท่องเที่ยวทุ่งรวงทอง (How to Play)
        </h2>
        <button
          id="btn-back-howto"
          onClick={() => { audioManager.playClick(); onBack(); }}
          className="text-slate-400 hover:text-amber-500 transition duration-200"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
      </div>

      <div className="space-y-6 font-sans">
        
        {/* Intro */}
        <div className="bg-amber-50/50 p-4 rounded-2xl border border-amber-200">
          <p className="text-slate-700 text-sm md:text-base leading-relaxed">
            ยินดีต้อนรับสู่ <span className="text-amber-600 font-bold">"ทุ่งรวงทอง แดนอีสานแสนสุข"</span> ยามเช้าที่แสนอบอุ่น! 
            คุณจะได้ช่วยชายหนุ่มผู้สะพายพิณแสนรัก วิ่งเล่นชมทุ่ง เก็บรวบรวมของสะสมแสนอร่อยที่ตกลงมาจากฟากฟ้า เพื่อทำคะแนนสะสมและเติมพลังชีวิตไปพร้อมกับหลบหลีกเพื่อนสัตว์แสนซนที่เข้ามาทักทาย
          </p>
        </div>

        {/* Collections */}
        <div>
          <h3 className="text-lg font-bold text-amber-600 mb-3 flex items-center gap-2">
            <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
            อาหารว่างไอเท็มพิเศษร่วงหล่น (Special Falling Items)
          </h3>
          <div className="bg-white p-4 rounded-2xl border border-amber-200 shadow-sm flex flex-col md:flex-row items-center gap-4">
            <div className="w-20 h-20 bg-amber-50 rounded-2xl border border-amber-200 p-2 flex items-center justify-center shrink-0">
              <img
                src="https://res.cloudinary.com/dst9gxix1/image/upload/v1782440192/item_fxzhhy.png"
                alt="Item"
                referrerPolicy="no-referrer"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <span className="font-bold text-slate-800 text-base block">ไอเท็มรสเด็ดตกลงจากท้องฟ้า</span>
              <p className="text-sm text-slate-600 mt-1 leading-relaxed">
                ไอเท็มแสนอร่อย (มะม่วงน้ำปลาหวาน, น้ำกระเจี๊ยบ, ว่าวจุฬา) จะสุ่มร่วงหล่นลงมาจากท้องฟ้าทั่วบริเวณทุ่งรวงทอง ให้คุณรีบวิ่งไปเก็บเพื่อ <span className="text-emerald-600 font-bold">เติมพลังชีวิต (+1 พลังชีวิต)</span> และรับคะแนนโบนัสแห่งความสุข!
              </p>
            </div>
          </div>
        </div>

        {/* Threats */}
        <div>
          <h3 className="text-lg font-bold text-emerald-600 mb-3 flex items-center gap-2">
            <Sun className="w-5 h-5 text-amber-500 animate-spin-slow" />
            เพื่อนพ้องสัตว์เลี้ยงแสนซนแห่งแดนทุ่ง (Friendly Encounters)
          </h3>
          <div className="space-y-2.5">
            <div className="bg-white p-3 rounded-xl border border-slate-200 flex items-center justify-between gap-4 shadow-sm">
              <div className="flex items-center gap-3">
                <span className="text-3xl">🐕</span>
                <div>
                  <span className="font-semibold text-slate-800 block">น้องหมาไทยแสนซน (Thai Ridgeback)</span>
                  <span className="text-xs text-slate-500">น้องตูบวิ่งเล่นด้วยความตื่นเต้นและอยากพุ่งเข้ามาเลียหน้ากอดคุณ</span>
                </div>
              </div>
              <span className="text-xs font-bold text-rose-600 shrink-0 bg-rose-50 px-2 py-1 rounded border border-rose-100">-1 พลังชีวิต</span>
            </div>

            <div className="bg-white p-3 rounded-xl border border-slate-200 flex items-center justify-between gap-4 shadow-sm">
              <div className="flex items-center gap-3">
                <span className="text-3xl">🐝</span>
                <div>
                  <span className="font-semibold text-slate-800 block">น้องผึ้งหวานรังโต (Happy Honeybee)</span>
                  <span className="text-xs text-slate-500">บินมาตอมดอกไม้ดนตรีพร้อมส่งเสียงหึ่งๆ ขอกอดด้วยความอบอุ่น</span>
                </div>
              </div>
              <span className="text-xs font-bold text-rose-600 shrink-0 bg-rose-50 px-2 py-1 rounded border border-rose-100">-1 พลังชีวิต</span>
            </div>

            <div className="bg-white p-3 rounded-xl border border-slate-200 flex items-center justify-between gap-4 shadow-sm">
              <div className="flex items-center gap-3">
                <span className="text-3xl">🐃</span>
                <div>
                  <span className="font-semibold text-slate-800 block">พี่ควายทุยใจดี (Friendly Buffalo)</span>
                  <span className="text-xs text-slate-500">พี่ทุยตัวใหญ่ยืนเต้นระบำและส่ายหัวโบกหางชวนคุยอย่างเป็นมิตร</span>
                </div>
              </div>
              <span className="text-xs font-bold text-rose-600 shrink-0 bg-rose-50 px-2 py-1 rounded border border-rose-100">-1 พลังชีวิต</span>
            </div>
          </div>
        </div>

        {/* Special Skill Tip */}
        <div className="bg-emerald-50 border-2 border-emerald-100 p-4 rounded-2xl">
          <h4 className="text-sm font-bold text-emerald-700 uppercase tracking-wider mb-1">💡 ยอดวิชาคาถา: บรรเลงเพลงสามช่าแสนสุข</h4>
          <p className="text-xs md:text-sm text-slate-600 leading-relaxed">
            เมื่อกดปุ่มทักษะดนตรี <span className="text-emerald-600 font-bold">"ดีดพิณดีดใจ (P Key)"</span> หรือ <span className="text-amber-600 font-bold">"เซิ้งสามช่า (O Key)"</span> 
            ตัวละครของคุณจะบรรเลงคลื่นเสียงโน้ตรื่นเริงกว้างๆ รอบตัว ทำให้น้องตูบ น้องผึ้ง หรือพี่ทุย เต้นระบำสะบัดหางด้วยความชื่นบานพร้อมเปลี่ยนเป็นความสุขรับ <span className="text-amber-600 font-bold">+25 คะแนนทันที!</span>
          </p>
        </div>

        {/* Game Rules summary */}
        <div className="bg-rose-50 border-2 border-rose-100 p-4 rounded-2xl">
          <h4 className="text-sm font-bold text-rose-700 uppercase tracking-wider mb-1">❤️ ระบบพลังชีวิต 5 ครั้ง</h4>
          <p className="text-xs md:text-sm text-slate-600 leading-relaxed">
            ตัวละครจะมีโอกาสโดนชน/โจมตีได้ทั้งหมด <span className="text-rose-600 font-bold">5 ครั้ง</span> (แสดงผลด้วยหัวใจ 5 ดวงในแถบสถานะด้านบน) หากโดนจนครบ 5 ครั้ง พลังชีวิตหมดลงจะขึ้นหน้าต่างจบเกม (GameOver) ทันที! หมั่นวิ่งเก็บไอเท็มอาหารพิเศษที่ตกจากฟากฟ้าเพื่อเติมพลังชีวิตอยู่เสมอนะ!
          </p>
        </div>

      </div>

      {/* Action Footer */}
      <div id="howto-action" className="mt-6 border-t border-slate-100 pt-5 text-center">
        <button
          id="btn-howto-close"
          onClick={() => { audioManager.playClick(); onBack(); }}
          className="w-full py-3 px-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold rounded-xl transition duration-150 shadow-md"
        >
          ข้าพเจ้าพร้อมรับความสุขเที่ยวทุ่งแล้ว!
        </button>
      </div>
    </div>
  );
}
