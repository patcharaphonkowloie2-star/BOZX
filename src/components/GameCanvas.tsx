import React, { useRef, useEffect, useState, useMemo, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useTexture, Billboard, Text, Html } from '@react-three/drei';
import * as THREE from 'three';
import { GameSettings } from '../types';
import { audioManager } from '../utils/audio';
import { Play, RotateCcw, Volume2, VolumeX, Home, Trophy, Sparkles, Sun, Heart } from 'lucide-react';

// --- Types for 3D state representation ---
interface ThreeItem {
  id: number;
  x: number;
  y: number;
  z: number;
  type: 'amulet' | 'holywater' | 'blessedrice' | 'lamp' | 'candle';
  points: number;
  label: string;
  emoji: string;
}

interface ThreeGhost {
  id: number;
  x: number;
  z: number;
  type: 'pop' | 'krasue' | 'pret';
  speed: number;
  damage: number;
  emoji: string;
}

interface ThreeParticle {
  id: number;
  pos: [number, number, number];
  vel: [number, number, number];
  color: string;
  size: number;
  startTime?: number;
}

interface BossFireball {
  id: number;
  x: number;
  y: number;
  z: number;
  targetX: number;
  targetZ: number;
  progress: number;
  duration: number;
  warningVisible: boolean;
}

const dialogueLines = [
  { speaker: 'npc', name: 'ผู้ใหญ่บ้านแสนดี 👴', text: 'โอ้โฮ! เจ้านี่เก่งอีหลีเด้อ! สามารถปราบพญาปีศาจป่วนจนหมดสิ้นได้สำเร็จ!', avatar: '👴' },
  { speaker: 'player', name: 'ผู้กล้าขาเซิ้ง 🧑‍🌾', text: 'ขอบคุณหลายๆ ครับพ่อใหญ่! ผมดีดพิณเต้นเซิ้งสุดฝีมือเพื่อปกป้องทุ่งนาเราเลย', avatar: '🧑‍🌾' },
  { speaker: 'npc', name: 'ผู้ใหญ่บ้านแสนดี 👴', text: 'เสียงพิณลายสามช่าของเจ้านี่มันช่างศักดิ์สิทธิ์และมีพลังวิเศษล้นเหลือจริงๆ', avatar: '👴' },
  { speaker: 'player', name: 'ผู้กล้าขาเซิ้ง 🧑‍🌾', text: 'ธรรมชาติและเสียงเพลงอีสานนี่แหละครับ คือยารักษาจิตใจที่ดีที่สุด', avatar: '🧑‍🌾' },
  { speaker: 'npc', name: 'ผู้ใหญ่บ้านแสนดี 👴', text: 'ตอนเห็นเจ้ากระโดดเต้นหลบลูกไฟพญาปีศาจ พ่อใหญ่นี่ใจหายแวบ นึกว่าจะแย่ซะแล้ว!', avatar: '👴' },
  { speaker: 'player', name: 'ผู้กล้าขาเซิ้ง 🧑‍🌾', text: 'จังหวะเป๊ะปังแบบนี้ ต้องยกความดีให้กับการซ้อมเซิ้งทุกวันเลยครับ ฮ่าๆ', avatar: '🧑‍🌾' },
  { speaker: 'npc', name: 'ผู้ใหญ่บ้านแสนดี 👴', text: 'ฮ่าๆ สมแล้วที่เป็นสุดยอดผู้กล้าเสียงพิณ ต่อจากนี้ทุ่งรวงทองจะเต็มไปด้วยรอยยิ้ม', avatar: '👴' },
  { speaker: 'player', name: 'ผู้กล้าขาเซิ้ง 🧑‍🌾', text: 'ใช่ครับ! พวกเรามาตั้งวงฉลองชัยชนะ เต้นเซิ้งสามช่าแสนสนุกกันเถอะครับ!', avatar: '🧑‍🌾' }
];

interface GameCanvasProps {
  settings: GameSettings;
  onBackToMenu: () => void;
}

// --- Interactive Squishable Grass Prop Component ---
interface GrassPropProps {
  position: [number, number];
  grassTex: THREE.Texture;
  playerPos: React.MutableRefObject<[number, number, number]>;
}

function GrassProp({ position, grassTex, playerPos }: GrassPropProps) {
  const meshRef = useRef<THREE.Group>(null);
  const scaleY = useRef(1.0);

  useFrame((state, delta) => {
    if (!meshRef.current) return;

    // Distance on X-Z ground plane
    const dx = position[0] - playerPos.current[0];
    const dz = position[1] - playerPos.current[2];
    const dist = Math.sqrt(dx * dx + dz * dz);

    const targetScaleY = dist < 1.3 ? 0.12 : 1.0;
    scaleY.current = THREE.MathUtils.lerp(scaleY.current, targetScaleY, 12 * delta);
    meshRef.current.scale.set(1.0, scaleY.current, 1.0);
  });

  return (
    <group ref={meshRef} position={[position[0], 0.01, position[1]]}>
      <Billboard>
        <mesh position={[0, 0.65, 0]}>
          <planeGeometry args={[1.3, 1.3]} />
          <meshStandardMaterial
            map={grassTex}
            transparent
            alphaTest={0.25}
            side={THREE.DoubleSide}
            roughness={0.6}
          />
        </mesh>
      </Billboard>
    </group>
  );
}

// --- Optimized Falling & Colliding Item Component ---
interface ItemComponentProps {
  item: ThreeItem;
  playerPos: React.MutableRefObject<[number, number, number]>;
  itemTex: THREE.Texture;
  onCollect: (id: number, points: number) => void;
  triggerParticleBurst: (pos: [number, number, number], count: number, color: string) => void;
}

function ItemComponent({
  item,
  playerPos,
  itemTex,
  onCollect,
  triggerParticleBurst
}: ItemComponentProps) {
  const meshRef = useRef<THREE.Group>(null);
  const posY = useRef(item.y ?? 15);
  const isCollected = useRef(false);

  useFrame((state, delta) => {
    if (isCollected.current) return;

    // Fall down with gravity physics down to ground Y = 0.7
    posY.current = Math.max(0.7, posY.current - 12.0 * delta);

    if (meshRef.current) {
      meshRef.current.position.y = posY.current;
    }

    // Distance check to player
    const dx = item.x - playerPos.current[0];
    const dz = item.z - playerPos.current[2];
    const dist = Math.sqrt(dx * dx + dz * dz);

    if (dist < 1.3) {
      isCollected.current = true;
      audioManager.playCollect();
      triggerParticleBurst([item.x, posY.current, item.z], 12, '#10b981');
      onCollect(item.id, item.points);
    }
  });

  return (
    <group ref={meshRef} position={[item.x, item.y ?? 15, item.z]}>
      <Billboard>
        {/* Pulsing Aura Circle */}
        <mesh scale={[1.4, 1.4, 1]}>
          <ringGeometry args={[0.4, 0.5, 16]} />
          <meshBasicMaterial color="#10b981" transparent opacity={0.6} />
        </mesh>
        {/* Item Texture */}
        <mesh position={[0, 0, 0.1]} castShadow receiveShadow>
          <planeGeometry args={[1.2, 1.2]} />
          <meshStandardMaterial
            map={itemTex}
            transparent
            alphaTest={0.2}
            side={THREE.DoubleSide}
            roughness={0.5}
          />
        </mesh>
        {/* Hover name */}
        <Text fontSize={0.24} position={[0, 0.75, 0]} color="#047857" font="Kanit">
          {item.label}
        </Text>
      </Billboard>
      <pointLight color="#10b981" intensity={0.6} distance={4} />
    </group>
  );
}

// --- High-Performance Enemy Component with 2-Hit Knockback Mechanics ---
interface GhostComponentProps {
  ghost: ThreeGhost;
  playerPos: React.MutableRefObject<[number, number, number]>;
  playerAttackId: React.MutableRefObject<number>;
  playerDanceId: React.MutableRefObject<number>;
  attackTimer: React.MutableRefObject<number>;
  danceTimer: React.MutableRefObject<number>;
  activeSkillRadius: number;
  enemyTexOriginal: THREE.Texture;
  onDamagePlayer: () => void;
  onDestroy: (id: number, earnScore: boolean) => void;
  onDefeated: (points: number) => void;
  triggerParticleBurst: (pos: [number, number, number], count: number, color: string) => void;
}

function GhostComponent({
  ghost,
  playerPos,
  playerAttackId,
  playerDanceId,
  attackTimer,
  danceTimer,
  activeSkillRadius,
  enemyTexOriginal,
  onDamagePlayer,
  onDestroy,
  onDefeated,
  triggerParticleBurst
}: GhostComponentProps) {
  const meshRef = useRef<THREE.Group>(null);
  const matRef = useRef<THREE.MeshStandardMaterial>(null);
  const spriteRef = useRef<THREE.Mesh>(null);

  const startY = ghost.type === 'pret' ? 2.5 : ghost.type === 'krasue' ? 2.0 : 0.8;
  const sizeMultiplier = ghost.type === 'pret' ? 2.4 : ghost.type === 'krasue' ? 1.2 : 1.6;

  const posX = useRef(ghost.x);
  const posY = useRef(startY);
  const posZ = useRef(ghost.z);

  const knockbackVelX = useRef(0);
  const knockbackVelZ = useRef(0);

  const hitCount = useRef(0);
  const isDefeated = useRef(false);
  const defeatTimer = useRef(0);

  const lastHitAttackId = useRef(0);
  const lastHitDanceId = useRef(0);

  const flashRedTimer = useRef(0);
  const flashWhiteTimer = useRef(0);
  const animTimer = useRef(Math.random() * 10);
  const facing = useRef<'left' | 'right'>('left');

  // Clone texture to allow independent offset maps
  const enemyTex = useMemo(() => {
    const cloned = enemyTexOriginal.clone();
    cloned.repeat.set(0.25, 0.5);
    cloned.needsUpdate = true;
    return cloned;
  }, [enemyTexOriginal]);

  useEffect(() => {
    return () => {
      enemyTex.dispose();
    };
  }, [enemyTex]);

  const handleHit = () => {
    hitCount.current += 1;
    flashWhiteTimer.current = 0.25;

    const dx = posX.current - playerPos.current[0];
    const dz = posZ.current - playerPos.current[2];
    const dist = Math.sqrt(dx * dx + dz * dz) || 1;
    const dirX = dx / dist;
    const dirZ = dz / dist;

    if (hitCount.current === 1) {
      audioManager.playHit();
      triggerParticleBurst([posX.current, posY.current, posZ.current], 8, '#ffffff');
      // Knockback in direction opposite to travel
      knockbackVelX.current = dirX * 18.0;
      knockbackVelZ.current = dirZ * 18.0;
    } else if (hitCount.current >= 2) {
      audioManager.playCollect();
      triggerParticleBurst([posX.current, posY.current, posZ.current], 15, '#fbbf24');
      isDefeated.current = true;
      onDefeated(25);
    }
  };

  useFrame((state, delta) => {
    if (isDefeated.current) {
      defeatTimer.current += delta;
      
      // Fly up and rotate on defeat
      posY.current += 15.0 * delta;
      posX.current += (Math.random() - 0.5) * 4.0 * delta;
      posZ.current += (Math.random() - 0.5) * 4.0 * delta;

      if (meshRef.current) {
        meshRef.current.position.set(posX.current, posY.current, posZ.current);
        meshRef.current.rotation.z += 10.0 * delta;
      }
      if (spriteRef.current) {
        spriteRef.current.scale.set(facing.current === 'right' ? -sizeMultiplier : sizeMultiplier, sizeMultiplier, 1);
      }

      flashWhiteTimer.current = 0.1;
      const flashVisible = Math.floor(defeatTimer.current * 24.0) % 2 === 0;
      if (matRef.current) {
        if (flashVisible) {
          matRef.current.color.set('#ffffff');
          matRef.current.emissive.set('#ffffff');
          matRef.current.opacity = 0.95;
        } else {
          matRef.current.color.set('#ffffff');
          matRef.current.emissive.set('#000000');
          matRef.current.opacity = 0.1;
        }
      }

      if (defeatTimer.current > 0.6) {
        onDestroy(ghost.id, false);
      }
      return;
    }

    // Decay timers
    if (flashRedTimer.current > 0) flashRedTimer.current -= delta;
    if (flashWhiteTimer.current > 0) flashWhiteTimer.current -= delta;

    // Apply color modifications natively
    if (matRef.current) {
      if (flashWhiteTimer.current > 0) {
        matRef.current.color.set('#ffffff');
        matRef.current.emissive.set('#ffffff');
      } else if (flashRedTimer.current > 0) {
        matRef.current.color.set('#ff4444');
        matRef.current.emissive.set('#990000');
      } else {
        matRef.current.color.set('#ffffff');
        matRef.current.emissive.set('#000000');
      }
    }

    // Movement / Knockback logic
    if (Math.abs(knockbackVelX.current) > 0.05 || Math.abs(knockbackVelZ.current) > 0.05) {
      posX.current += knockbackVelX.current * delta;
      posZ.current += knockbackVelZ.current * delta;

      knockbackVelX.current *= Math.max(0, 1 - 8 * delta);
      knockbackVelZ.current *= Math.max(0, 1 - 8 * delta);
    } else {
      const dx = playerPos.current[0] - posX.current;
      const dz = playerPos.current[2] - posZ.current;
      const dist = Math.sqrt(dx * dx + dz * dz);

      if (dist > 0.1) {
        const nx = dx / dist;
        const nz = dz / dist;
        posX.current += nx * ghost.speed * delta;
        posZ.current += nz * ghost.speed * delta;

        facing.current = nx > 0 ? 'right' : 'left';
      }

      // Hit Player
      if (dist < 1.2 && attackTimer.current <= 0 && danceTimer.current <= 0) {
        flashRedTimer.current = 0.4;
        onDamagePlayer();
        
        // Push back
        const kx = posX.current - playerPos.current[0];
        const kz = posZ.current - playerPos.current[2];
        const klen = Math.sqrt(kx * kx + kz * kz) || 1;
        knockbackVelX.current = (kx / klen) * 12;
        knockbackVelZ.current = (kz / klen) * 12;
      }
    }

    posX.current = Math.max(-24.5, Math.min(posX.current, 24.5));
    posZ.current = Math.max(-24.5, Math.min(posZ.current, 24.5));

    if (meshRef.current) {
      meshRef.current.position.set(posX.current, posY.current, posZ.current);
    }

    // Attack Hits Detection
    const distToPlayer = Math.sqrt(
      (posX.current - playerPos.current[0]) ** 2 +
      (posZ.current - playerPos.current[2]) ** 2
    );

    if (attackTimer.current > 0 && distToPlayer < 3.2 && lastHitAttackId.current !== playerAttackId.current) {
      lastHitAttackId.current = playerAttackId.current;
      handleHit();
    }

    if (danceTimer.current > 0 && distToPlayer <= activeSkillRadius && lastHitDanceId.current !== playerDanceId.current) {
      lastHitDanceId.current = playerDanceId.current;
      handleHit();
    }

    // Animation frame timing
    animTimer.current += delta;
    const isMoving = Math.abs(knockbackVelX.current) < 1.0;
    const currentRow = isMoving ? 1 : 0; // Row 2: Walk, Row 1: Idle
    const currentFrame = Math.floor(animTimer.current * 7) % 4;
    enemyTex.offset.x = currentFrame * 0.25;
    enemyTex.offset.y = 0.5 - currentRow * 0.5;

    if (spriteRef.current) {
      spriteRef.current.scale.set(facing.current === 'right' ? -sizeMultiplier : sizeMultiplier, sizeMultiplier, 1);
    }
  });

  const isPret = ghost.type === 'pret';
  const isKrasue = ghost.type === 'krasue';

  return (
    <group ref={meshRef} position={[ghost.x, startY, ghost.z]}>
      <Billboard>
        {/* Outer aura */}
        <mesh scale={isPret ? [2.4, 4.2, 1] : [1.4, 1.4, 1]}>
          <ringGeometry args={[0.5, 0.62, 16]} />
          <meshBasicMaterial color={isKrasue ? '#06b6d4' : '#f59e0b'} transparent opacity={0.6} />
        </mesh>
        
        {/* Enemy Sprite Sheet */}
        <mesh ref={spriteRef} position={[0, 0, 0.1]} castShadow receiveShadow>
          <planeGeometry args={[1, 1]} />
          <meshStandardMaterial
            ref={matRef}
            map={enemyTex}
            transparent
            alphaTest={0.25}
            side={THREE.DoubleSide}
            roughness={0.5}
          />
        </mesh>

        {/* Friend Label */}
        <Text
          fontSize={0.26}
          position={[0, isPret ? 1.8 : 0.85, 0]}
          color={isKrasue ? '#06b6d4' : '#d97706'}
          font="Kanit"
        >
          {ghost.type === 'pop' ? 'ตูบวิ่งเล่น! 🐕' : isKrasue ? 'น้องผึ้งบินซน! 🐝' : 'พี่ทุยชวนเต้น! 🐃'}
        </Text>
      </Billboard>
      <pointLight
        color={isKrasue ? '#06b6d4' : '#fbbf24'}
        intensity={1.2}
        distance={6}
      />
    </group>
  );
}

// --- Deterministic Particle Component ---
function ParticleComponent({ p }: { p: ThreeParticle }) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame(() => {
    if (!meshRef.current) return;
    const t = (Date.now() / 1000) - (p.startTime || 0);

    const x = p.pos[0] + p.vel[0] * t;
    const y = p.pos[1] + p.vel[1] * t - 5.0 * t * t;
    const z = p.pos[2] + p.vel[2] * t;

    meshRef.current.position.set(x, y, z);
  });

  return (
    <mesh ref={meshRef} position={p.pos}>
      <boxGeometry args={[p.size, p.size, p.size]} />
      <meshBasicMaterial color={p.color} />
    </mesh>
  );
}

// --- Cozy Isan Cabin Component ---
function StiltCabin({ position }: { position: [number, number, number] }) {
  const windowFlickerRef = useRef(0);
  const [flickerOn, setFlickerOn] = useState(true);

  useFrame((state, delta) => {
    windowFlickerRef.current += delta;
    if (windowFlickerRef.current > 0.3) {
      windowFlickerRef.current = 0;
      setFlickerOn(Math.random() > 0.15);
    }
  });

  return (
    <group position={position}>
      {/* Wooden stilts/posts */}
      <mesh position={[-1.2, 0.6, -1.2]} castShadow receiveShadow>
        <boxGeometry args={[0.15, 1.2, 0.15]} />
        <meshStandardMaterial color="#78350f" roughness={0.7} />
      </mesh>
      <mesh position={[1.2, 0.6, -1.2]} castShadow receiveShadow>
        <boxGeometry args={[0.15, 1.2, 0.15]} />
        <meshStandardMaterial color="#78350f" roughness={0.7} />
      </mesh>
      <mesh position={[-1.2, 0.6, 1.2]} castShadow receiveShadow>
        <boxGeometry args={[0.15, 1.2, 0.15]} />
        <meshStandardMaterial color="#78350f" roughness={0.7} />
      </mesh>
      <mesh position={[1.2, 0.6, 1.2]} castShadow receiveShadow>
        <boxGeometry args={[0.15, 1.2, 0.15]} />
        <meshStandardMaterial color="#78350f" roughness={0.7} />
      </mesh>

      {/* Main Wood Cabin floor and walls */}
      <mesh position={[0, 1.7, 0]} castShadow receiveShadow>
        <boxGeometry args={[3.0, 1.1, 3.0]} />
        <meshStandardMaterial color="#b45309" roughness={0.8} />
      </mesh>

      {/* Spooky/Cozy warm triangular roof */}
      <mesh position={[0, 2.7, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
        <coneGeometry args={[2.5, 1.2, 4]} />
        <meshStandardMaterial color="#f97316" roughness={0.8} />
      </mesh>

      {/* Warm flickering cozy window */}
      <mesh position={[0, 1.8, 1.51]}>
        <planeGeometry args={[0.6, 0.6]} />
        <meshBasicMaterial color={flickerOn ? "#fbbf24" : "#d97706"} />
      </mesh>
      {flickerOn && (
        <pointLight position={[0, 1.8, 1.8]} color="#fbbf24" intensity={0.8} distance={6} />
      )}
    </group>
  );
}

// --- Golden Happy Haystack Component ---
function Haystack({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 1.0, 0]} castShadow receiveShadow>
        <coneGeometry args={[1.6, 2.0, 8]} />
        <meshStandardMaterial color="#fbbf24" roughness={0.9} />
      </mesh>
      {/* Sunflower/Flower on top */}
      <Billboard position={[0, 2.1, 0]}>
        <Text fontSize={0.65} anchorX="center" anchorY="middle">🌻</Text>
      </Billboard>
    </group>
  );
}

// --- Floating Firefly / Sparkle Component ---
function SpiritLight({ position, color }: { position: [number, number, number]; color: string }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const randomSeed = useMemo(() => Math.random() * 10, []);

  useFrame((state) => {
    if (meshRef.current) {
      const t = state.clock.getElapsedTime();
      meshRef.current.position.y = position[1] + Math.sin(t * 1.8 + randomSeed) * 0.35;
      meshRef.current.position.x = position[0] + Math.cos(t * 1.0 + randomSeed) * 0.25;
    }
  });

  return (
    <mesh ref={meshRef} position={position}>
      <sphereGeometry args={[0.15, 8, 8]} />
      <meshBasicMaterial color={color} />
      <pointLight color={color} intensity={1.2} distance={4} />
    </mesh>
  );
}

// --- High-Performance Boss Component with Squash/Stretch & Attack Patterns ---
function BossComponent({
  bossActive,
  bossHp,
  setBossHp,
  setBossActive,
  setBossDefeated,
  playerPos,
  playerAttackId,
  playerDanceId,
  attackTimer,
  danceTimer,
  activeSkillRadius,
  bossTexOriginal,
  triggerParticleBurst,
  setFireballs,
}: {
  bossActive: boolean;
  bossHp: number;
  setBossHp: React.Dispatch<React.SetStateAction<number>>;
  setBossActive: React.Dispatch<React.SetStateAction<boolean>>;
  setBossDefeated: React.Dispatch<React.SetStateAction<boolean>>;
  playerPos: React.MutableRefObject<[number, number, number]>;
  playerAttackId: React.MutableRefObject<number>;
  playerDanceId: React.MutableRefObject<number>;
  attackTimer: React.MutableRefObject<number>;
  danceTimer: React.MutableRefObject<number>;
  activeSkillRadius: number;
  bossTexOriginal: THREE.Texture;
  triggerParticleBurst: (pos: [number, number, number], count: number, color: string) => void;
  setFireballs: React.Dispatch<React.SetStateAction<BossFireball[]>>;
}) {
  const meshRef = useRef<THREE.Group>(null);
  const matRef = useRef<THREE.MeshStandardMaterial>(null);

  const posX = useRef(0);
  const posY = useRef(5.0);
  const posZ = useRef(-12);

  const bossState = useRef<'idle' | 'dash' | 'prepare' | 'attack'>('idle');
  const stateTimer = useRef(0);
  const targetX = useRef(0);
  const targetZ = useRef(-12);

  const flashWhiteTimer = useRef(0);
  const flashRedTimer = useRef(0);
  const scaleRef = useRef<[number, number]>([2.5, 2.5]);
  const animTimer = useRef(0);

  const lastHitAttackId = useRef(0);
  const lastHitDanceId = useRef(0);

  const bossTex = useMemo(() => {
    const cloned = bossTexOriginal.clone();
    cloned.repeat.set(0.5, 0.5);
    cloned.needsUpdate = true;
    return cloned;
  }, [bossTexOriginal]);

  useEffect(() => {
    return () => bossTex.dispose();
  }, [bossTex]);

  const handleBossHit = () => {
    if (flashWhiteTimer.current > 0) return;
    setBossHp(hp => {
      const nextHp = Math.max(0, hp - 1);
      flashWhiteTimer.current = 0.3;
      audioManager.playHit();
      triggerParticleBurst([posX.current, posY.current, posZ.current], 15, '#ffffff');
      if (nextHp <= 0) {
        audioManager.playCollect();
        triggerParticleBurst([posX.current, posY.current, posZ.current], 35, '#fbbf24');
        triggerParticleBurst([posX.current, posY.current + 1, posZ.current], 25, '#f59e0b');
        setBossActive(false);
        setBossDefeated(true);
      }
      return nextHp;
    });
  };

  useFrame((state, delta) => {
    if (!bossActive) return;

    // Flash timers decay
    if (flashWhiteTimer.current > 0) flashWhiteTimer.current -= delta;
    if (flashRedTimer.current > 0) flashRedTimer.current -= delta;

    if (matRef.current) {
      if (flashWhiteTimer.current > 0) {
        matRef.current.color.set('#ffffff');
        matRef.current.emissive.set('#ffffff');
      } else if (flashRedTimer.current > 0) {
        matRef.current.color.set('#ff4444');
        matRef.current.emissive.set('#bb0000');
      } else {
        matRef.current.color.set('#ffffff');
        matRef.current.emissive.set('#000000');
      }
    }

    stateTimer.current += delta;
    animTimer.current += delta;

    // Movement Pattern State Machine
    if (bossState.current === 'idle') {
      // Bobbing around
      posY.current = 5.0 + Math.sin(state.clock.getElapsedTime() * 2.2) * 0.45;
      scaleRef.current = [2.5, 2.5];

      if (stateTimer.current > 2.0) {
        bossState.current = 'dash';
        stateTimer.current = 0;
        targetX.current = (Math.random() - 0.5) * 34;
        targetZ.current = (Math.random() - 0.5) * 34;
      }
    } else if (bossState.current === 'dash') {
      posY.current = 5.0 + Math.sin(state.clock.getElapsedTime() * 3.0) * 0.2;
      
      const dx = targetX.current - posX.current;
      const dz = targetZ.current - posZ.current;
      const dist = Math.sqrt(dx * dx + dz * dz);

      if (dist > 0.2) {
        const speed = 11.0;
        posX.current += (dx / dist) * speed * delta;
        posZ.current += (dz / dist) * speed * delta;
      }

      if (stateTimer.current > 1.6 || dist <= 0.2) {
        bossState.current = 'prepare';
        stateTimer.current = 0;
      }
    } else if (bossState.current === 'prepare') {
      // BEFORE throwing, squash & stretch tells player!
      const squash = 1.0 + Math.sin(stateTimer.current * 18.0) * 0.18;
      scaleRef.current = [2.5 * squash, 2.5 * (2.0 - squash)];

      if (stateTimer.current > 1.4) {
        bossState.current = 'attack';
        stateTimer.current = 0;

        // Shoot fireballs
        const fireCount = 3;
        const newFireballs: BossFireball[] = [];
        for (let i = 0; i < fireCount; i++) {
          let tx = playerPos.current[0];
          let tz = playerPos.current[2];

          if (i > 0) {
            // scatter close by
            tx += (Math.random() - 0.5) * 8;
            tz += (Math.random() - 0.5) * 8;
          }

          newFireballs.push({
            id: Math.random() + Date.now() + i,
            x: posX.current,
            y: posY.current,
            z: posZ.current,
            targetX: tx,
            targetZ: tz,
            progress: 0,
            duration: 1.5 + Math.random() * 0.5,
            warningVisible: true,
          });
        }

        audioManager.playJump();
        setFireballs(prev => [...prev, ...newFireballs]);
      }
    } else if (bossState.current === 'attack') {
      scaleRef.current = [2.5, 2.5];
      posY.current = 5.0 + Math.sin(state.clock.getElapsedTime() * 1.5) * 0.25;

      if (stateTimer.current > 1.5) {
        bossState.current = 'idle';
        stateTimer.current = 0;
      }
    }

    posX.current = Math.max(-24.0, Math.min(posX.current, 24.0));
    posZ.current = Math.max(-24.0, Math.min(posZ.current, 24.0));

    if (meshRef.current) {
      meshRef.current.position.set(posX.current, posY.current, posZ.current);
    }

    // Hit registration
    const distToPlayer = Math.sqrt(
      (posX.current - playerPos.current[0]) ** 2 +
      (posZ.current - playerPos.current[2]) ** 2
    );

    if (attackTimer.current > 0 && distToPlayer < 3.8 && lastHitAttackId.current !== playerAttackId.current) {
      lastHitAttackId.current = playerAttackId.current;
      handleBossHit();
    }

    if (danceTimer.current > 0 && distToPlayer <= activeSkillRadius && lastHitDanceId.current !== playerDanceId.current) {
      lastHitDanceId.current = playerDanceId.current;
      handleBossHit();
    }

    // Animation sheet offsets: row 1 (0) idle/flying, row 2 (1) prepare/attack
    const currentRow = (bossState.current === 'prepare' || bossState.current === 'attack') ? 1 : 0;
    const currentFrame = Math.floor(animTimer.current * 7) % 2;
    bossTex.offset.x = currentFrame * 0.5;
    bossTex.offset.y = 0.5 - currentRow * 0.5;
  });

  return (
    <group ref={meshRef} position={[0, 5.0, -12]}>
      <Billboard>
        <mesh scale={[3.2, 3.2, 1]}>
          <ringGeometry args={[0.5, 0.65, 16]} />
          <meshBasicMaterial color="#f43f5e" transparent opacity={0.7} />
        </mesh>

        <mesh position={[0, 0, 0.1]} castShadow receiveShadow scale={[scaleRef.current[0], scaleRef.current[1], 1]}>
          <planeGeometry args={[1, 1]} />
          <meshStandardMaterial
            ref={matRef}
            map={bossTex}
            transparent
            alphaTest={0.25}
            side={THREE.DoubleSide}
            roughness={0.4}
          />
        </mesh>
        
        <Text fontSize={0.34} position={[0, 1.6, 0]} color="#f43f5e" font="Kanit">
          พญาปีศาจป่วน ยักษ์สามช่า 👹🔥
        </Text>
      </Billboard>
      <pointLight color="#f43f5e" intensity={2.0} distance={10} />
    </group>
  );
}

// --- Boss Flying Fireball Component ---
function FireballComponent({ f }: { f: BossFireball }) {
  return (
    <>
      {f.progress < 1.0 && (
        <group position={[f.x, f.y, f.z]}>
          <mesh castShadow>
            <sphereGeometry args={[0.42, 16, 16]} />
            <meshBasicMaterial color="#f97316" />
          </mesh>
          <pointLight color="#f97316" intensity={1.5} distance={5} />
        </group>
      )}

      {f.progress < 1.0 && f.warningVisible && (
        <group position={[f.targetX, 0.05, f.targetZ]} rotation={[-Math.PI / 2, 0, 0]}>
          <mesh>
            <ringGeometry args={[0.7 * f.progress, 0.8, 32]} />
            <meshBasicMaterial color="#ef4444" transparent opacity={0.65} />
          </mesh>
          <mesh scale={[f.progress, f.progress, 1]}>
            <circleGeometry args={[0.7, 32]} />
            <meshBasicMaterial color="#ef4444" transparent opacity={0.25} />
          </mesh>
        </group>
      )}
    </>
  );
}

// --- Warp Gate / Door Portal ---
function WarpGateComponent({
  position,
  playerPos,
  onWarp,
}: {
  position: [number, number, number];
  playerPos: React.MutableRefObject<[number, number, number]>;
  onWarp: () => void;
}) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.z += 1.8 * delta;
    }

    const dx = position[0] - playerPos.current[0];
    const dz = position[2] - playerPos.current[2];
    const dist = Math.sqrt(dx * dx + dz * dz);

    if (dist < 1.3) {
      onWarp();
    }
  });

  return (
    <group position={position}>
      <Billboard position={[0, 1.2, 0]}>
        <mesh ref={meshRef}>
          <ringGeometry args={[0.7, 1.0, 32]} />
          <meshBasicMaterial color="#06b6d4" side={THREE.DoubleSide} />
        </mesh>
        <Text fontSize={1.6} position={[0, 0, 0.05]}>🌀</Text>
        <Text fontSize={0.3} position={[0, 1.3, 0]} color="#06b6d4" font="Kanit">
          ประตูข้ามมิติ แดนอวสาน 🚪✨
        </Text>
      </Billboard>
      <pointLight color="#06b6d4" intensity={2.0} distance={8} />
    </group>
  );
}

// --- Friendly NPC in Ending Scene ---
function NPCComponent({
  isEnding,
  playerPos,
  npcTexOriginal,
  setDialogueActive,
}: {
  isEnding: boolean;
  playerPos: React.MutableRefObject<[number, number, number]>;
  npcTexOriginal: THREE.Texture;
  setDialogueActive: (active: boolean) => void;
}) {
  const meshRef = useRef<THREE.Group>(null);
  const posX = useRef(0);
  const posY = useRef(1.15);
  const posZ = useRef(-10);
  const isWalking = useRef(true);
  const animTimer = useRef(0);

  const npcTex = useMemo(() => {
    const cloned = npcTexOriginal.clone();
    cloned.repeat.set(0.25, 0.5);
    cloned.needsUpdate = true;
    return cloned;
  }, [npcTexOriginal]);

  useEffect(() => {
    return () => {
      npcTex.dispose();
    };
  }, [npcTex]);

  useFrame((state, delta) => {
    if (!isEnding) return;

    const targetX = playerPos.current[0];
    const targetZ = playerPos.current[2] - 2.0;

    const dx = targetX - posX.current;
    const dz = targetZ - posZ.current;
    const dist = Math.sqrt(dx * dx + dz * dz);

    if (dist > 0.1 && isWalking.current) {
      const speed = 2.5;
      posX.current += (dx / dist) * speed * delta;
      posZ.current += (dz / dist) * speed * delta;
    } else if (isWalking.current) {
      isWalking.current = false;
      setDialogueActive(true);
    }

    if (meshRef.current) {
      meshRef.current.position.set(posX.current, posY.current, posZ.current);
    }

    animTimer.current += delta;
    const currentRow = isWalking.current ? 1 : 0; // Row 2 (index 1) walk, Row 1 (index 0) idle
    const currentFrame = Math.floor(animTimer.current * (isWalking.current ? 8 : 4)) % 4;
    npcTex.offset.x = currentFrame * 0.25;
    npcTex.offset.y = 0.5 - currentRow * 0.5;
  });

  return (
    <group ref={meshRef} position={[0, 1.15, -10]}>
      <Billboard>
        <mesh position={[0, 0, 0]} castShadow receiveShadow>
          <planeGeometry args={[1.8, 1.8]} />
          <meshStandardMaterial
            map={npcTex}
            transparent
            alphaTest={0.25}
            side={THREE.DoubleSide}
            roughness={0.5}
          />
        </mesh>
        <Text fontSize={0.26} position={[0, 1.1, 0]} color="#059669" font="Kanit">
          ผู้ใหญ่บ้านแสนดี 👴
        </Text>
      </Billboard>
      <pointLight color="#10b981" intensity={1.0} distance={5} />
    </group>
  );
}

// --- Hook to load textures asynchronously without suspending the canvas ---
function useNonblockingTexture(url: string, fallbackColor: string) {
  const [texture, setTexture] = useState<THREE.Texture>(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 16;
    canvas.height = 16;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = fallbackColor;
      ctx.fillRect(0, 0, 16, 16);
    }
    const tex = new THREE.CanvasTexture(canvas);
    return tex;
  });

  useEffect(() => {
    let active = true;
    const loader = new THREE.TextureLoader();
    loader.load(
      url,
      (loadedTex) => {
        if (active) {
          if ('colorSpace' in loadedTex) {
            (loadedTex as any).colorSpace = THREE.SRGBColorSpace;
          } else if ('encoding' in loadedTex) {
            (loadedTex as any).encoding = (THREE as any).sRGBEncoding;
          }
          setTexture(loadedTex);
        }
      },
      undefined,
      (err) => {
        console.warn(`Failed to load texture from ${url}. Using fallback color ${fallbackColor}.`, err);
      }
    );
    return () => {
      active = false;
    };
  }, [url, fallbackColor]);

  return texture;
}

// --- Scene Content Rendered Inside Canvas ---
function SceneContent({
  isPlaying,
  score,
  setScore,
  health,
  setHealth,
  endGame,
  keysPressed,
  triggerFlashDamage,
  items,
  setItems,
  ghosts,
  setGhosts,
  particles,
  setParticles,
  activeSkillRadius,
  setActiveSkillRadius,
  skillActive,
  setSkillActive,
  defeatedCount,
  setDefeatedCount,
  bossActive,
  setBossActive,
  bossHp,
  setBossHp,
  bossMaxHp,
  bossDefeated,
  setBossDefeated,
  warpGateActive,
  setWarpGateActive,
  isEnding,
  setIsEnding,
  dialogueActive,
  setDialogueActive,
}: {
  isPlaying: boolean;
  score: number;
  setScore: React.Dispatch<React.SetStateAction<number>>;
  health: number;
  setHealth: React.Dispatch<React.SetStateAction<number>>;
  endGame: () => void;
  keysPressed: React.MutableRefObject<Record<string, boolean>>;
  triggerFlashDamage: () => void;
  items: ThreeItem[];
  setItems: React.Dispatch<React.SetStateAction<ThreeItem[]>>;
  ghosts: ThreeGhost[];
  setGhosts: React.Dispatch<React.SetStateAction<ThreeGhost[]>>;
  particles: ThreeParticle[];
  setParticles: React.Dispatch<React.SetStateAction<ThreeParticle[]>>;
  activeSkillRadius: number;
  setActiveSkillRadius: React.Dispatch<React.SetStateAction<number>>;
  skillActive: boolean;
  setSkillActive: React.Dispatch<React.SetStateAction<boolean>>;
  defeatedCount: number;
  setDefeatedCount: React.Dispatch<React.SetStateAction<number>>;
  bossActive: boolean;
  setBossActive: React.Dispatch<React.SetStateAction<boolean>>;
  bossHp: number;
  setBossHp: React.Dispatch<React.SetStateAction<number>>;
  bossMaxHp: number;
  bossDefeated: boolean;
  setBossDefeated: React.Dispatch<React.SetStateAction<boolean>>;
  warpGateActive: boolean;
  setWarpGateActive: React.Dispatch<React.SetStateAction<boolean>>;
  isEnding: boolean;
  setIsEnding: React.Dispatch<React.SetStateAction<boolean>>;
  dialogueActive: boolean;
  setDialogueActive: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const { camera } = useThree();
  const playerAttackId = useRef<number>(0);
  const playerDanceId = useRef<number>(0);

  // --- Ground Texture Loading with Tiling ---
  const groundTex = useNonblockingTexture('https://res.cloudinary.com/dst9gxix1/image/upload/v1782440193/ground_oukmg1.png', '#4d7c0f');
  useEffect(() => {
    if (groundTex) {
      groundTex.wrapS = THREE.RepeatWrapping;
      groundTex.wrapT = THREE.RepeatWrapping;
      groundTex.repeat.set(16, 16);
      groundTex.needsUpdate = true;
    }
  }, [groundTex]);

  // --- Item Texture Loading ---
  const itemTex = useNonblockingTexture('https://res.cloudinary.com/dst9gxix1/image/upload/v1782440192/item_fxzhhy.png', '#fbbf24');

  // --- Enemy Texture Loading ---
  const enemyTexOriginal = useNonblockingTexture('https://res.cloudinary.com/dst9gxix1/image/upload/v1782440191/enemy_dyqzy9.png', '#a855f7');

  // --- Grass Texture Loading ---
  const grassTex = useNonblockingTexture('https://res.cloudinary.com/dst9gxix1/image/upload/v1782440167/grass_2_b3f4ko.png', '#166534');

  // Scattered grass coordinates across the 50x50 field
  const grassPositions = useMemo(() => {
    const coords: [number, number][] = [];
    for (let i = 0; i < 24; i++) {
      const rx = (Math.random() - 0.5) * 38;
      const rz = (Math.random() - 0.5) * 38;
      // Keep away from starting spawn zone to keep map pleasant
      if (Math.sqrt(rx * rx + rz * rz) > 4) {
        coords.push([rx, rz]);
      }
    }
    return coords;
  }, []);

  // --- Player Sprite Sheet Texture Cloning & Setup ---
  const playerTexOriginal = useNonblockingTexture('https://res.cloudinary.com/dst9gxix1/image/upload/v1782440194/player_mask_giheqi.png', '#f97316');
  const playerTex = useMemo(() => {
    const cloned = playerTexOriginal.clone();
    cloned.repeat.set(0.25, 0.25);
    cloned.needsUpdate = true;
    return cloned;
  }, [playerTexOriginal]);

  // --- Boss & NPC Texture Loaders ---
  const bossTexOriginal = useNonblockingTexture('https://res.cloudinary.com/dst9gxix1/image/upload/v1782440167/boss_x4lq1j.png', '#dc2626');
  const npcTexOriginal = useNonblockingTexture('https://res.cloudinary.com/dsucg33fv/image/upload/v1782439980/npc1_pdraha.png', '#10b981');

  // --- Fireballs State Manager ---
  const [fireballs, setFireballs] = useState<BossFireball[]>([]);

  // --- Game State References for Physics & Spawning ---
  const playerPos = useRef<[number, number, number]>([0, 1.25, 0]);
  const playerVelY = useRef<number>(0);
  const isGrounded = useRef<boolean>(true);
  const playerDirection = useRef<'left' | 'right'>('right');
  const animTimer = useRef<number>(0);
  const animationState = useRef<'idle' | 'walk' | 'attack' | 'dance'>('idle');
  const attackTimer = useRef<number>(0);
  const danceTimer = useRef<number>(0);

  const playerRef = useRef<THREE.Group>(null);
  const skillRingRef = useRef<THREE.Mesh>(null);

  // Periodic garbage collection of particles to prevent growth
  useEffect(() => {
    const pruneTimer = setInterval(() => {
      setParticles(prev => prev.filter(p => Date.now() - p.id < 1200));
    }, 1500);
    return () => clearInterval(pruneTimer);
  }, [setParticles]);

  // --- Trigger particle burst ---
  const triggerParticleBurst = (pos: [number, number, number], count: number, color: string) => {
    const now = Date.now() / 1000;
    const newParticles: ThreeParticle[] = [];
    for (let i = 0; i < count; i++) {
      newParticles.push({
        id: Math.random() + Date.now() + i,
        pos: [...pos] as [number, number, number],
        vel: [
          (Math.random() - 0.5) * 5,
          Math.random() * 5 + 3,
          (Math.random() - 0.5) * 5
        ],
        color,
        size: Math.random() * 0.14 + 0.08,
        startTime: now
      });
    }
    setParticles(prev => [...prev, ...newParticles].slice(-45));
  };

  // --- Keyboard & Button Combat triggers ---
  useEffect(() => {
    const handleActionKeys = (e: KeyboardEvent) => {
      if (!isPlaying) return;
      if (e.code === 'KeyP') {
        triggerAttack();
      }
      if (e.code === 'KeyO') {
        triggerDanceSkill();
      }
    };
    window.addEventListener('keydown', handleActionKeys);
    return () => window.removeEventListener('keydown', handleActionKeys);
  }, [isPlaying]);

  // Read action trigger from keysPressed ref (for mobile HUD clicks)
  useFrame(() => {
    if (!isPlaying) return;
    if (keysPressed.current['action'] && attackTimer.current <= 0 && danceTimer.current <= 0) {
      keysPressed.current['action'] = false;
      triggerAttack();
    }
    if (keysPressed.current['dance'] && danceTimer.current <= 0 && attackTimer.current <= 0) {
      keysPressed.current['dance'] = false;
      triggerDanceSkill();
    }
  });

  const triggerAttack = () => {
    if (attackTimer.current > 0 || danceTimer.current > 0) return;
    audioManager.playJump(); // Play happy pluck
    animationState.current = 'attack';
    attackTimer.current = 0.35; // 350ms duration
    playerAttackId.current += 1;
  };

  const triggerDanceSkill = () => {
    if (danceTimer.current > 0 || attackTimer.current > 0) return;
    audioManager.playCollect(); // High chime
    animationState.current = 'dance';
    danceTimer.current = 1.2; // 1.2s duration
    setSkillActive(true);
    setActiveSkillRadius(0.1);
    playerDanceId.current += 1;
  };

  // --- Core Game Frame Updates ---
  useFrame((state, delta) => {
    if (!isPlaying) return;

    // --- UPDATE BOSS FIREBALLS ---
    setFireballs(prev => {
      const updated: BossFireball[] = [];
      prev.forEach(f => {
        const nextProgress = f.progress + delta / f.duration;
        
        // Arc interpolation
        const currentX = THREE.MathUtils.lerp(f.x, f.targetX, nextProgress);
        const currentZ = THREE.MathUtils.lerp(f.z, f.targetZ, nextProgress);
        const peakY = 5.5;
        const currentY = THREE.MathUtils.lerp(f.y, 0.2, nextProgress) + Math.sin(nextProgress * Math.PI) * peakY;

        if (nextProgress >= 1.0) {
          // Explosion!
          triggerParticleBurst([f.targetX, 0.4, f.targetZ], 12, '#f97316');
          audioManager.playHit();

          // Check hit on player
          const distToPlayer = Math.sqrt(
            (f.targetX - playerPos.current[0]) ** 2 +
            (f.targetZ - playerPos.current[2]) ** 2
          );

          if (distToPlayer < 1.6 && !isEnding) {
            triggerFlashDamage();
            setHealth(hp => {
              const nextHp = Math.max(0, hp - 1);
              if (nextHp <= 0) {
                endGame();
              }
              return nextHp;
            });
          }
        } else {
          updated.push({
            ...f,
            x: currentX,
            y: currentY,
            z: currentZ,
            progress: nextProgress,
            warningVisible: nextProgress < 0.95
          });
        }
      });
      return updated;
    });

    // 1. TIMERS & ATTACK STATE DECAY
    if (attackTimer.current > 0) {
      attackTimer.current -= delta;
      if (attackTimer.current <= 0) {
        animationState.current = 'idle';
      }
    }

    if (danceTimer.current > 0) {
      danceTimer.current -= delta;
      // Expand skill radius
      setActiveSkillRadius(r => {
        const nextR = r + delta * 6.5;
        return nextR;
      });

      if (danceTimer.current <= 0) {
        animationState.current = 'idle';
        setSkillActive(false);
        setActiveSkillRadius(0);
      }
    }

    // 2. PLAYER MOVEMENT ON X-Z PLANE (8 DIRECTIONS)
    if (attackTimer.current <= 0 && danceTimer.current <= 0 && !isEnding) {
      const moveLeft = keysPressed.current['left'] || keysPressed.current['KeyA'] || keysPressed.current['ArrowLeft'];
      const moveRight = keysPressed.current['right'] || keysPressed.current['KeyD'] || keysPressed.current['ArrowRight'];
      const moveForward = keysPressed.current['forward'] || keysPressed.current['KeyW'] || keysPressed.current['ArrowUp'];
      const moveBackward = keysPressed.current['backward'] || keysPressed.current['KeyS'] || keysPressed.current['ArrowDown'];

      let dx = 0;
      let dz = 0;

      if (moveLeft) dx = -1;
      if (moveRight) dx = 1;
      if (moveForward) dz = -1;
      if (moveBackward) dz = 1;

      if (dx !== 0 || dz !== 0) {
        animationState.current = 'walk';
        const length = Math.sqrt(dx * dx + dz * dz);
        const speed = 7.0; // Units per sec
        playerPos.current[0] += (dx / length) * speed * delta;
        playerPos.current[2] += (dz / length) * speed * delta;

        if (dx < 0) playerDirection.current = 'left';
        if (dx > 0) playerDirection.current = 'right';
      } else {
        animationState.current = 'idle';
      }

      // Jump triggers
      const doJump = keysPressed.current['jump'] || keysPressed.current['Space'];
      if (doJump && isGrounded.current) {
        playerVelY.current = 11.5;
        isGrounded.current = false;
        audioManager.playJump();
        keysPressed.current['jump'] = false;
      }
    }

    // 3. JUMP GRAVITY PHYSICS
    if (!isGrounded.current) {
      playerVelY.current -= 28.0 * delta; // Gravity
      playerPos.current[1] += playerVelY.current * delta;

      if (playerPos.current[1] <= 1.25) {
        playerPos.current[1] = 1.25;
        playerVelY.current = 0;
        isGrounded.current = true;
      }
    }

    // Bound coordinate limits inside 50x50 field safely
    playerPos.current[0] = Math.max(-24.2, Math.min(playerPos.current[0], 24.2));
    playerPos.current[2] = Math.max(-24.2, Math.min(playerPos.current[2], 24.2));

    // Update Player Group positions
    if (playerRef.current) {
      playerRef.current.position.set(playerPos.current[0], playerPos.current[1], playerPos.current[2]);
    }

    // 4. CAMERA SMOOTH FOLLOW (Lerp camera offset relative to player)
    const targetCamX = playerPos.current[0];
    const targetCamY = playerPos.current[1] + 7.5;
    const targetCamZ = playerPos.current[2] + 10.0;

    camera.position.x = THREE.MathUtils.lerp(camera.position.x, targetCamX, 0.08);
    camera.position.y = THREE.MathUtils.lerp(camera.position.y, targetCamY, 0.08);
    camera.position.z = THREE.MathUtils.lerp(camera.position.z, targetCamZ, 0.08);
    camera.lookAt(playerPos.current[0], playerPos.current[1] - 0.4, playerPos.current[2]);

    // 5. UPDATE PLAYER ANIMATION SHEET OFFSETS
    animTimer.current += delta;
    let currentRow = 0; // idle
    let fps = 5;

    if (animationState.current === 'dance') {
      currentRow = 3;
      fps = 9;
    } else if (animationState.current === 'attack') {
      currentRow = 2;
      fps = 11;
    } else if (animationState.current === 'walk') {
      currentRow = 1;
      fps = 8;
    } else {
      currentRow = 0;
      fps = 4;
    }

    const currentFrame = Math.floor(animTimer.current * fps) % 4;
    playerTex.offset.x = currentFrame * 0.25;
    playerTex.offset.y = 0.75 - currentRow * 0.25;
  });

  return (
    <>
      {/* 50x50 lush green grass floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[50, 50]} />
        <meshStandardMaterial map={groundTex} color="#6ee7b7" roughness={0.8} />
      </mesh>

      {/* Ground boundaries markers in soft emerald colors */}
      <gridHelper args={[50, 25, '#059669', '#d1fae5']} position={[0, 0.01, 0]} />

      {/* --- SCATTERED PROPS (Atmosphere building) --- */}
      {/* Cozy Cottages on Stilts */}
      <StiltCabin position={[-14, 0, -12]} />
      <StiltCabin position={[16, 0, -18]} />
      <StiltCabin position={[-10, 0, 16]} />

      {/* Cones for Golden Haystacks with flowers */}
      <Haystack position={[-6, 0, -8]} />
      <Haystack position={[8, 0, 12]} />
      <Haystack position={[-18, 0, 6]} />
      <Haystack position={[15, 0, -4]} />

      {/* Floating Sparkly Fireflies */}
      <SpiritLight position={[-12, 1.8, -10]} color="#fbbf24" />
      <SpiritLight position={[10, 2.2, 8]} color="#f43f5e" />
      <SpiritLight position={[-14, 2.0, 12]} color="#06b6d4" />
      <SpiritLight position={[12, 1.9, -15]} color="#a3e635" />

      {/* Beautiful Golden Sun in sky */}
      <mesh position={[18, 14, -25]}>
        <sphereGeometry args={[2.5, 16, 16]} />
        <meshBasicMaterial color="#fbbf24" />
      </mesh>
      <pointLight position={[18, 14, -24]} color="#f59e0b" intensity={3.0} distance={50} />

      {/* --- PLAYER GROUP --- */}
      <group ref={playerRef} position={[0, 1.25, 0]}>
        <Billboard>
          <mesh castShadow receiveShadow>
            <planeGeometry args={[2.2, 2.2]} />
            <meshStandardMaterial
              map={playerTex}
              transparent
              alphaTest={0.35}
              side={THREE.DoubleSide}
              roughness={0.5}
            />
          </mesh>

          {/* Happy warm light around player */}
          <pointLight color="#fbbf24" intensity={1.5} distance={10} position={[0, 0, 0.2]} />

          {/* Action indicator text hovering above player */}
          {animationState.current === 'attack' && (
            <Text fontSize={0.32} position={[0, 1.3, 0]} color="#10b981" font="Kanit">
              🎵 ดีดพิณบรรเลง!
            </Text>
          )}
          {animationState.current === 'dance' && (
            <Text fontSize={0.32} position={[0, 1.3, 0]} color="#f59e0b" font="Kanit">
              ✨ เซิ้งสามช่าแสนสุข!
            </Text>
          )}
        </Billboard>

        {/* Expanding Dance Skill Ring flat on ground */}
        {skillActive && (
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.24, 0]} ref={skillRingRef}>
            <ringGeometry args={[activeSkillRadius - 0.15, activeSkillRadius, 32]} />
            <meshBasicMaterial color="#fbbf24" side={THREE.DoubleSide} transparent opacity={0.8} />
          </mesh>
        )}
      </group>

      {/* --- INTERACTIVE GRASS PROP TILES --- */}
      {grassPositions.map((gPos, idx) => (
        <GrassProp
          key={idx}
          position={gPos}
          grassTex={grassTex}
          playerPos={playerPos}
        />
      ))}

      {/* --- ITEM COLLECTIBLES --- */}
      {items.map(item => (
        <ItemComponent
          key={item.id}
          item={item}
          playerPos={playerPos}
          itemTex={itemTex}
          onCollect={(id, points) => {
            setItems(prev => prev.filter(it => it.id !== id));
            setScore(s => s + points);
            setHealth(hp => Math.min(5, hp + 1));
          }}
          triggerParticleBurst={triggerParticleBurst}
        />
      ))}

      {/* --- CUTE FRIENDS (ENEMIES) --- */}
      {!bossActive && ghosts.map(ghost => (
        <GhostComponent
          key={ghost.id}
          ghost={ghost}
          playerPos={playerPos}
          playerAttackId={playerAttackId}
          playerDanceId={playerDanceId}
          attackTimer={attackTimer}
          danceTimer={danceTimer}
          activeSkillRadius={activeSkillRadius}
          enemyTexOriginal={enemyTexOriginal}
          onDamagePlayer={() => {
            audioManager.playHit();
            triggerFlashDamage();
            setHealth(hp => {
              const nextHp = Math.max(0, hp - 1);
              if (nextHp <= 0) {
                endGame();
              }
              return nextHp;
            });
          }}
          onDestroy={(id) => {
            setGhosts(prev => prev.filter(g => g.id !== id));
          }}
          onDefeated={(points) => {
            setScore(s => s + points);
            setDefeatedCount(c => {
              const nextCount = c + 1;
              if (nextCount >= 10 && !bossActive && !bossDefeated) {
                setBossActive(true);
                setGhosts([]); // clear minion clutter
                audioManager.playCollect();
                triggerParticleBurst([0, 3.5, -12], 40, '#f43f5e');
              }
              return nextCount;
            });
          }}
          triggerParticleBurst={triggerParticleBurst}
        />
      ))}

      {/* --- ELITE FIREBALLS --- */}
      {fireballs.map(f => (
        <FireballComponent key={f.id} f={f} />
      ))}

      {/* --- THE BOSS --- */}
      {bossActive && (
        <BossComponent
          bossActive={bossActive}
          bossHp={bossHp}
          setBossHp={setBossHp}
          setBossActive={setBossActive}
          setBossDefeated={setBossDefeated}
          playerPos={playerPos}
          playerAttackId={playerAttackId}
          playerDanceId={playerDanceId}
          attackTimer={attackTimer}
          danceTimer={danceTimer}
          activeSkillRadius={activeSkillRadius}
          bossTexOriginal={bossTexOriginal}
          triggerParticleBurst={triggerParticleBurst}
          setFireballs={setFireballs}
        />
      )}

      {/* --- WARP GATE --- */}
      {bossDefeated && !isEnding && (
        <WarpGateComponent
          position={[0, 0.5, -4]}
          playerPos={playerPos}
          onWarp={() => {
            audioManager.playCollect();
            setIsEnding(true);
          }}
        />
      )}

      {/* --- NPC ENDING COMPONENT --- */}
      {isEnding && (
        <NPCComponent
          isEnding={isEnding}
          playerPos={playerPos}
          npcTexOriginal={npcTexOriginal}
          setDialogueActive={setDialogueActive}
        />
      )}

      {/* --- SPECTACULAR SPARK PARTICLES --- */}
      {particles.map(p => (
        <ParticleComponent key={p.id} p={p} />
      ))}
    </>
  );
}

// --- Error Boundary for WebGL/Texture Loading Failures ---
class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean; error: Error | null }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error("GameCanvas ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="absolute inset-0 bg-sky-50 flex flex-col items-center justify-center p-6 text-center z-10 border-4 border-red-350 rounded-2xl m-2 shadow-inner">
          <div className="max-w-md bg-white border-2 border-red-300 p-6 rounded-3xl shadow-lg animate-scale-up text-slate-800 pointer-events-auto">
            <span className="text-4xl block mb-2">⚠️👹</span>
            <h3 className="text-lg font-black text-red-600 font-sans mb-1.5 uppercase">
              เกิดข้อผิดพลาดในการโหลดระบบ 3D
            </h3>
            <p className="text-slate-600 text-xs mb-4 leading-relaxed">
              ไม่สามารถเปิดเกม 3D ได้สำเร็จ อาจเกิดจากเบราว์เซอร์ไม่รองรับ WebGL หรือระบบเครือข่ายบล็อกการโหลดรูปภาพจากเซิร์ฟเวอร์
            </p>
            
            <div className="bg-slate-950 text-red-400 font-mono text-[9px] p-2.5 rounded-xl mb-4 text-left overflow-auto max-h-24 whitespace-pre-wrap select-text border border-red-950">
              {this.state.error?.toString() || 'Unknown WebGL context error'}
            </div>

            <button
              onClick={() => window.location.reload()}
              className="w-full py-2.5 px-4 bg-red-500 hover:bg-red-600 text-white font-black text-xs rounded-xl shadow transition active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
            >
              <span>รีโหลดหน้าเว็บเพื่อเริ่มใหม่ 🔄</span>
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// --- MAIN GAME CANVAS COMPONENT ---
export default function GameCanvas({ settings, onBackToMenu }: GameCanvasProps) {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [score, setScore] = useState<number>(0);
  const [highScore, setHighScore] = useState<number>(() => {
    return parseInt(localStorage.getItem('danesan_highscore') || '0', 10);
  });
  const [health, setHealth] = useState<number>(5);
  const [showGameOver, setShowGameOver] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(audioManager.getMutedStatus());
  const [flashDamage, setFlashDamage] = useState<boolean>(false);

  const [items, setItems] = useState<ThreeItem[]>([]);
  const [ghosts, setGhosts] = useState<ThreeGhost[]>([]);
  const [particles, setParticles] = useState<ThreeParticle[]>([]);

  const [skillActive, setSkillActive] = useState<boolean>(false);
  const [activeSkillRadius, setActiveSkillRadius] = useState<number>(0);

  // --- Boss and Ending Cutscene States ---
  const [defeatedCount, setDefeatedCount] = useState<number>(0);
  const [bossActive, setBossActive] = useState<boolean>(false);
  const [bossHp, setBossHp] = useState<number>(8);
  const [bossMaxHp] = useState<number>(8);
  const [bossDefeated, setBossDefeated] = useState<boolean>(false);
  const [warpGateActive, setWarpGateActive] = useState<boolean>(false);
  const [isEnding, setIsEnding] = useState<boolean>(false);
  const [dialogueActive, setDialogueActive] = useState<boolean>(false);
  const [dialogueIndex, setDialogueIndex] = useState<number>(0);

  const keysPressed = useRef<Record<string, boolean>>({});

  const keyToPrint = (code: string) => {
    return code
      .replace('Key', '')
      .replace('Arrow', 'ปุ่ม ')
      .replace('Space', 'Space')
      .replace('Enter', 'Enter');
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['Space', 'ArrowUp', 'ArrowDown'].includes(e.code)) {
        e.preventDefault();
      }

      if (e.code === settings.controls.left || e.code === 'KeyA' || e.code === 'ArrowLeft') {
        keysPressed.current['left'] = true;
      }
      if (e.code === settings.controls.right || e.code === 'KeyD' || e.code === 'ArrowRight') {
        keysPressed.current['right'] = true;
      }
      if (e.code === 'KeyW' || e.code === 'ArrowUp') {
        keysPressed.current['forward'] = true;
      }
      if (e.code === 'KeyS' || e.code === 'ArrowDown') {
        keysPressed.current['backward'] = true;
      }
      if (e.code === settings.controls.jump || e.code === 'Space') {
        keysPressed.current['jump'] = true;
      }
      if (e.code === settings.controls.action || e.code === 'KeyP') {
        keysPressed.current['action'] = true;
      }
      if (e.code === 'KeyO') {
        keysPressed.current['dance'] = true;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === settings.controls.left || e.code === 'KeyA' || e.code === 'ArrowLeft') {
        keysPressed.current['left'] = false;
      }
      if (e.code === settings.controls.right || e.code === 'KeyD' || e.code === 'ArrowRight') {
        keysPressed.current['right'] = false;
      }
      if (e.code === 'KeyW' || e.code === 'ArrowUp') {
        keysPressed.current['forward'] = false;
      }
      if (e.code === 'KeyS' || e.code === 'ArrowDown') {
        keysPressed.current['backward'] = false;
      }
      if (e.code === settings.controls.jump || e.code === 'Space') {
        keysPressed.current['jump'] = false;
      }
      if (e.code === settings.controls.action || e.code === 'KeyP') {
        keysPressed.current['action'] = false;
      }
      if (e.code === 'KeyO') {
        keysPressed.current['dance'] = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [settings.controls]);

  // Spawning intervals during active gameplay
  useEffect(() => {
    if (!isPlaying) return;

    // Spawns items randomly inside field
    const itemInterval = setInterval(() => {
      setItems(prev => {
        if (prev.length >= 8) return prev;
        const rx = (Math.random() - 0.5) * 36;
        const rz = (Math.random() - 0.5) * 36;
        const types: Array<{ type: ThreeItem['type']; pts: number; label: string; emoji: string }> = [
          { type: 'amulet', pts: 15, label: 'มะม่วงน้ำปลาหวาน', emoji: '🥭' },
          { type: 'holywater', pts: 20, label: 'น้ำกระเจี๊ยบชื่นใจ', emoji: '🥤' },
          { type: 'blessedrice', pts: 10, label: 'ข้าวโพดปิ้งหวานฉ่ำ', emoji: '🌽' },
          { type: 'lamp', pts: 40, label: 'ว่าวจุฬาแสนสวย', emoji: '🪁' },
        ];
        const chosen = types[Math.floor(Math.random() * types.length)];
        return [...prev, {
          id: Math.random() + Date.now(),
          x: rx,
          z: rz,
          y: 15, // Starts falling from 15 units high in the sky
          type: chosen.type,
          points: chosen.pts,
          label: chosen.label,
          emoji: chosen.emoji
        }];
      });
    }, 3800);

    // Spawns friends
    const ghostInterval = setInterval(() => {
      if (bossActive || bossDefeated) return;

      setGhosts(prev => {
        if (prev.length >= 10) return prev;

        const angle = Math.random() * Math.PI * 2;
        const radius = 23;
        const gx = Math.cos(angle) * radius;
        const gz = Math.sin(angle) * radius;

        const types: Array<{ type: ThreeGhost['type']; speed: number; damage: number; emoji: string }> = [
          { type: 'pop', speed: 4.8, damage: 25, emoji: '🐕' },
          { type: 'krasue', speed: 3.2, damage: 15, emoji: '🐝' },
          { type: 'pret', speed: 1.5, damage: 30, emoji: '🐃' }
        ];
        const chosen = types[Math.floor(Math.random() * types.length)];

        return [...prev, {
          id: Math.random() + Date.now(),
          x: gx,
          z: gz,
          type: chosen.type,
          speed: chosen.speed,
          damage: chosen.damage,
          emoji: chosen.emoji
        }];
      });
    }, Math.max(1400, 2400 - Math.floor(score * 1.5)));

    return () => {
      clearInterval(itemInterval);
      clearInterval(ghostInterval);
    };
  }, [isPlaying, score, bossActive, bossDefeated]);

  const handleToggleMute = () => {
    const muted = audioManager.toggleMute();
    setIsMuted(muted);
  };

  const triggerFlashDamage = () => {
    setFlashDamage(true);
    setTimeout(() => setFlashDamage(false), 250);
  };

  const startGame = () => {
    audioManager.playClick();
    audioManager.startBgm();

    setItems([]);
    setGhosts([]);
    setParticles([]);
    setScore(0);
    setHealth(5);
    setSkillActive(false);
    setActiveSkillRadius(0);
    keysPressed.current = {};

    setDefeatedCount(0);
    setBossActive(false);
    setBossHp(8);
    setBossDefeated(false);
    setWarpGateActive(false);
    setIsEnding(false);
    setDialogueActive(false);
    setDialogueIndex(0);

    setIsPlaying(true);
    setShowGameOver(false);
  };

  const endGame = () => {
    setIsPlaying(false);
    setShowGameOver(true);
    audioManager.stopBgm();
    audioManager.playGameOver();

    if (score > highScore) {
      setHighScore(score);
      try {
        localStorage.setItem('danesan_highscore', score.toString());
      } catch (e) {
        console.warn('Highscore save failed', e);
      }
    }
  };

  const simulateKeyDown = (keyType: string) => {
    keysPressed.current[keyType] = true;
  };

  const simulateKeyUp = (keyType: string) => {
    keysPressed.current[keyType] = false;
  };

  return (
    <div
      id="game-stage-wrapper"
      className={`relative w-full aspect-video bg-sky-50 border-4 ${
        flashDamage ? 'border-orange-500 animate-pulse' : 'border-amber-300'
      } rounded-3xl overflow-hidden shadow-[0_10px_60px_rgba(245,158,11,0.15)] flex flex-col transition-all duration-150 min-h-[480px]`}
    >
      {/* Damage indicator flash */}
      {flashDamage && (
        <div className="absolute inset-0 bg-orange-500/15 z-40 pointer-events-none transition-opacity duration-100" />
      )}

      {/* Top HUD panel */}
      <div id="game-hud-top" className="absolute top-4 left-4 right-4 z-30 flex items-center justify-between pointer-events-none select-none">
        {/* HP Bar & Spiritual points */}
        <div className="flex items-center gap-4 bg-white/95 border border-amber-200 p-3 rounded-2xl backdrop-blur-md pointer-events-auto shadow-md">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold text-amber-600 flex items-center gap-1">
              <Heart className="w-3.5 h-3.5 text-rose-500 animate-pulse fill-rose-500" /> พลังชีวิตคงเหลือ (Happiness Lives)
            </span>
            <div className="flex items-center gap-1 mt-0.5">
              {Array.from({ length: 5 }).map((_, index) => (
                <Heart
                  key={index}
                  className={`w-4 h-4 transition-all duration-300 ${
                    index < health
                      ? 'text-rose-500 fill-rose-500 scale-100'
                      : 'text-slate-300 fill-slate-100 scale-90'
                  }`}
                />
              ))}
              <span className="ml-1.5 text-xs font-black text-slate-700 font-mono">
                {health}/5
              </span>
            </div>
            <div className="w-24 md:w-36 bg-slate-100 h-1 rounded-full overflow-hidden border border-amber-100 mt-1">
              <div
                className="bg-gradient-to-r from-rose-500 via-amber-400 to-emerald-500 h-full transition-all duration-150"
                style={{ width: `${(health / 5) * 100}%` }}
              />
            </div>
          </div>

          <div className="w-[1px] h-8 bg-slate-200" />

          <div className="flex flex-col">
            <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">คะแนนความสุข</span>
            <span className="font-mono text-base md:text-lg font-black text-amber-500 flex items-center gap-1 leading-none">
              <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
              {score}
            </span>
          </div>
        </div>

        {/* High Score & Mute config */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <div className="bg-white/95 border border-amber-200 px-3 py-2 rounded-2xl backdrop-blur-md flex items-center gap-2 shadow-md">
            <Trophy className="w-3.5 h-3.5 text-amber-500" />
            <div className="flex flex-col">
              <span className="text-[9px] text-slate-500 leading-none">รอยยิ้มสูงสุด</span>
              <span className="font-mono text-xs md:text-sm font-black text-amber-500 leading-none mt-0.5">{highScore}</span>
            </div>
          </div>

          <button
            id="btn-hud-mute"
            onClick={handleToggleMute}
            className="bg-white/95 hover:bg-amber-50 border border-amber-200 p-2 rounded-xl backdrop-blur-md transition text-amber-600 shadow-md"
          >
            {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </button>

          <button
            id="btn-hud-exit"
            onClick={() => {
              audioManager.playClick();
              audioManager.stopBgm();
              onBackToMenu();
            }}
            className="bg-amber-50 hover:bg-amber-100 border border-amber-200 p-2 rounded-xl backdrop-blur-md transition text-amber-700 flex items-center gap-1.5 font-bold text-sm cursor-pointer shadow-md"
          >
            <Home className="w-4 h-4 text-amber-600" />
            <span className="hidden md:inline">กลับหน้าหลัก</span>
          </button>
        </div>
      </div>

      {/* THREEJS FIBER CANVAS AREA */}
      <div className="relative w-full flex-grow flex items-center justify-center min-h-[350px]">
        <ErrorBoundary>
          <Canvas
            shadows
            camera={{ position: [0, 8, 12], fov: 48 }}
            className="w-full h-full block"
            style={{ background: '#f0f9ff' }}
          >
            {/* Beautiful bright day mist */}
            <fog attach="fog" args={['#f0f9ff', 12, 33]} />
            
            {/* Sunny Warm Daylight */}
            <ambientLight intensity={1.3} color="#fefbc3" />
            
            <directionalLight
              castShadow
              position={[15, 18, -15]}
              intensity={2.5}
              color="#ffffff"
              shadow-mapSize-width={1024}
              shadow-mapSize-height={1024}
              shadow-camera-far={60}
              shadow-camera-left={-25}
              shadow-camera-right={25}
              shadow-camera-top={25}
              shadow-camera-bottom={-25}
            />

            <Suspense fallback={
              <Html center>
                <div className="flex flex-col items-center justify-center gap-3 bg-white/95 px-6 py-5 rounded-2xl shadow-xl border-2 border-amber-300 min-w-[250px] animate-pulse">
                  <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
                  <span className="text-sm font-black text-amber-700 font-sans tracking-wide whitespace-nowrap text-center">
                    🌾 กำลังโหลดทุ่งนาและเสียงพิณ... 🎵
                  </span>
                  <span className="text-[10px] text-slate-500 font-sans leading-none">
                    โปรดรอสักครู่ ระบบกำลังจัดเตรียมฉาก 3D
                  </span>
                </div>
              </Html>
            }>
              <SceneContent
                isPlaying={isPlaying}
                score={score}
                setScore={setScore}
                health={health}
                setHealth={setHealth}
                endGame={endGame}
                keysPressed={keysPressed}
                triggerFlashDamage={triggerFlashDamage}
                items={items}
                setItems={setItems}
                ghosts={ghosts}
                setGhosts={setGhosts}
                particles={particles}
                setParticles={setParticles}
                activeSkillRadius={activeSkillRadius}
                setActiveSkillRadius={setActiveSkillRadius}
                skillActive={skillActive}
                setSkillActive={setSkillActive}
                defeatedCount={defeatedCount}
                setDefeatedCount={setDefeatedCount}
                bossActive={bossActive}
                setBossActive={setBossActive}
                bossHp={bossHp}
                setBossHp={setBossHp}
                bossMaxHp={bossMaxHp}
                bossDefeated={bossDefeated}
                setBossDefeated={setBossDefeated}
                warpGateActive={warpGateActive}
                setWarpGateActive={setWarpGateActive}
                isEnding={isEnding}
                setIsEnding={setIsEnding}
                dialogueActive={dialogueActive}
                setDialogueActive={setDialogueActive}
              />
            </Suspense>
          </Canvas>
        </ErrorBoundary>

        {/* Start Game Tutorial Overlay */}
        {!isPlaying && !showGameOver && (
          <div id="start-game-overlay" className="absolute inset-0 bg-slate-100/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center z-20">
            <div className="max-w-md w-full bg-white border-2 border-amber-300 p-6 md:p-8 rounded-3xl shadow-xl animate-slide-up">
              <h3 className="text-2xl md:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-600 via-orange-500 to-emerald-600 font-sans mb-3 flex items-center justify-center gap-2">
                <Sun className="w-7 h-7 text-amber-500 animate-spin-slow" />
                ทุ่งรวงทอง แดนอีสาน 3D
              </h3>
              <p className="text-slate-600 text-sm mb-6 leading-relaxed">
                ยินดีต้อนรับสู่ทุ่งรวงทองแสนสุข! วิ่งเล่นชมนกชมไม้ เก็บคะแนนอาหารว่างแสนอร่อย แล้วดีดเพลงพิณสามช่าชวนเพื่อนหมา ตูบ ผึ้ง และควายทุยเต้นรำไปพร้อมกันเพื่อสะสมความสุข!
              </p>

              {/* Controls Layout Guide */}
              <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-200 mb-6 text-left space-y-2.5 text-xs">
                <span className="font-bold text-amber-700 block border-b border-amber-200 pb-1">ปุ่มบังคับและเสียงพิณ:</span>
                <div className="grid grid-cols-2 gap-3 text-slate-700 font-mono">
                  <div className="flex justify-between">
                    <span>เดินชมทุ่ง 8 ทิศ:</span>
                    <span className="text-amber-600 font-bold bg-white px-1.5 py-0.5 rounded border border-amber-200">WASD / ลูกศร</span>
                  </div>
                  <div className="flex justify-between">
                    <span>กระโดดหลบ:</span>
                    <span className="text-amber-600 font-bold bg-white px-1.5 py-0.5 rounded border border-amber-200">{keyToPrint(settings.controls.jump)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>ดีดพิณดีดใจ:</span>
                    <span className="text-emerald-600 font-bold bg-white px-1.5 py-0.5 rounded border border-amber-200">P Key</span>
                  </div>
                  <div className="flex justify-between">
                    <span>เต้นรำสามช่า:</span>
                    <span className="text-amber-600 font-bold bg-white px-1.5 py-0.5 rounded border border-amber-200">O Key</span>
                  </div>
                </div>
              </div>

              <button
                id="btn-canvas-start"
                onClick={startGame}
                className="w-full py-4 px-6 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 active:scale-95 text-white font-black text-lg rounded-2xl shadow-md transition flex items-center justify-center gap-2 group cursor-pointer"
              >
                <Play className="w-5 h-5 fill-white group-hover:scale-110 transition text-amber-100" />
                เข้าสู่ทุ่งแสนสนุกกันเลย!
              </button>
            </div>
          </div>
        )}

        {/* Game Over Screen Overlay */}
        {showGameOver && (
          <div id="game-over-overlay" className="absolute inset-0 bg-slate-100/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center z-20">
            <div className="max-w-md w-full bg-white border-2 border-amber-300 p-6 md:p-8 rounded-3xl shadow-xl animate-slide-up">
              <span className="text-5xl block mb-2 animate-bounce">🐕🐝🐃</span>
              <h3 className="text-2xl font-black text-amber-600 font-sans mb-2 tracking-wide">
                หมดเวลาแห่งความสุขแล้ว!
              </h3>
              <p className="text-slate-500 text-sm mb-6 leading-relaxed">
                พลังงานความสุขของคุณหมดลงแล้วจากการวิ่งเล่นเหนื่อยล้ามาทั้งวัน! มาดื่มน้ำกระเจี๊ยบชื่นใจปัดเป่าความเหนื่อย แล้วมาเริ่มวิ่งเล่นในทุ่งรวงทองกันใหม่อีกรอบนะ!
              </p>

              {/* Score panel */}
              <div className="bg-amber-50/50 p-4 rounded-2xl border border-amber-200 mb-6">
                <div className="flex justify-between items-center text-slate-700">
                  <span className="text-sm font-sans">คะแนนความสุขสะสมได้:</span>
                  <span className="font-mono text-2xl font-black text-amber-500">{score}</span>
                </div>
                {score >= highScore && score > 0 && (
                  <div className="mt-2 text-xs text-amber-600 font-bold bg-amber-500/10 py-1 rounded border border-amber-500/20 animate-pulse">
                    🏆 ยินดีด้วย! คุณทุบสถิติความรื่นเริงสูงสุดอันดับใหม่! 🏆
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  id="btn-canvas-restart"
                  onClick={startGame}
                  className="flex-1 py-3.5 px-6 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold rounded-xl shadow-md transition duration-150 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <RotateCcw className="w-5 h-5 text-amber-100" />
                  วิ่งเล่นอีกรอบ
                </button>
                <button
                  id="btn-canvas-menu"
                  onClick={() => {
                    audioManager.playClick();
                    onBackToMenu();
                  }}
                  className="py-3.5 px-5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition duration-150 cursor-pointer"
                >
                  กลับหน้าหลัก
                </button>
              </div>
            </div>
          </div>
        )}

        {/* --- BOSS HP BAR --- */}
        {bossActive && (
          <div id="boss-hud-health" className="absolute top-20 left-1/2 -translate-x-1/2 z-35 w-full max-w-xs px-2 animate-scale-up">
            <div className="bg-slate-900/90 border-2 border-rose-500/50 p-2 rounded-2xl shadow-xl backdrop-blur-sm text-center">
              <div className="flex justify-between items-center px-1 mb-1">
                <span className="text-[10px] font-black text-rose-400 font-sans tracking-wide uppercase flex items-center gap-1">
                  👹 พญาปีศาจ ยักษ์สามช่า 🔥
                </span>
                <span className="text-[10px] font-bold text-rose-300 font-mono">
                  {bossHp} / {bossMaxHp} HP
                </span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden border border-rose-950">
                <div
                  className="bg-gradient-to-r from-red-600 via-rose-500 to-amber-400 h-full transition-all duration-300"
                  style={{ width: `${(bossHp / bossMaxHp) * 100}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {/* --- RPG DIALOGUE BOX (ENDING SEQUENCE) --- */}
        {dialogueActive && (
          <div id="rpg-dialogue-overlay" className="absolute bottom-6 left-4 right-4 z-35 flex justify-center animate-slide-up">
            <div className="w-full max-w-2xl bg-gradient-to-r from-teal-900/95 to-slate-900/95 border-2 border-teal-400 p-4 rounded-2xl shadow-2xl backdrop-blur-md flex flex-col md:flex-row items-center gap-4 text-white">
              {/* Dynamic Left/Right Avatar positioning based on speaker */}
              {dialogueLines[dialogueIndex].speaker === 'npc' && (
                <div className="flex-shrink-0 w-16 h-16 bg-teal-850 border-2 border-teal-400 rounded-full flex items-center justify-center text-4xl shadow-md select-none animate-bounce">
                  {dialogueLines[dialogueIndex].avatar}
                </div>
              )}

              <div className="flex-grow text-center md:text-left">
                <div className="text-xs font-black text-teal-400 tracking-wide uppercase font-sans mb-1">
                  {dialogueLines[dialogueIndex].name}
                </div>
                <p className="text-sm font-bold font-sans leading-relaxed text-slate-100">
                  "{dialogueLines[dialogueIndex].text}"
                </p>
              </div>

              {dialogueLines[dialogueIndex].speaker === 'player' && (
                <div className="flex-shrink-0 w-16 h-16 bg-teal-850 border-2 border-amber-400 rounded-full flex items-center justify-center text-4xl shadow-md select-none animate-bounce">
                  {dialogueLines[dialogueIndex].avatar}
                </div>
              )}

              <button
                id="btn-dialogue-next"
                onClick={() => {
                  audioManager.playClick();
                  if (dialogueIndex < dialogueLines.length - 1) {
                    setDialogueIndex(i => i + 1);
                  } else {
                    setDialogueActive(false);
                  }
                }}
                className="flex-shrink-0 bg-teal-400 hover:bg-teal-300 text-teal-950 font-black text-xs py-2.5 px-4 rounded-xl shadow-lg transition active:scale-95 cursor-pointer font-sans"
              >
                {dialogueIndex < dialogueLines.length - 1 ? 'ถัดไป ▶' : 'เสร็จสิ้น 🏁'}
              </button>
            </div>
          </div>
        )}

        {/* --- ENDING VICTORY SUCCESS SCREEN --- */}
        {isEnding && !dialogueActive && dialogueIndex === dialogueLines.length - 1 && (
          <div id="ending-victory-overlay" className="absolute inset-0 bg-slate-900/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center z-40">
            <div className="max-w-md w-full bg-gradient-to-b from-amber-50 to-orange-50 border-4 border-amber-400 p-6 md:p-8 rounded-3xl shadow-2xl animate-scale-up text-slate-800">
              <span className="text-5xl block mb-3 animate-bounce">🏆🌾🌾🎵</span>
              <h2 className="text-2xl md:text-3xl font-black text-amber-700 font-sans mb-1 uppercase tracking-wide">
                รอยยิ้มคืนสู่ทุ่งนาแสนสุข!
              </h2>
              <h3 className="text-md font-bold text-emerald-600 mb-4">
                ภารกิจสวดเซิ้งปกป้องถิ่นสำเร็จลุล่วง! ✨
              </h3>
              <p className="text-slate-600 text-xs mb-5 leading-relaxed">
                ขอขอบคุณเสียงพิณและรอยยิ้มเซิ้งสามช่าของผู้กล้า แผ่นดินอีสานและทุ่งรวงทองแห่งนี้จะจดจำวีรกรรมความรื่นเริงแสนดีงามของคุณไปตราบนานเท่านาน!
              </p>

              {/* End Stats summary */}
              <div className="bg-white/95 border border-amber-200 p-3.5 rounded-2xl shadow-inner mb-5 flex justify-around items-center">
                <div className="text-center">
                  <span className="text-[10px] text-slate-500 block leading-none mb-1">ความสุขที่ได้</span>
                  <span className="font-mono text-lg font-black text-amber-500">{score}</span>
                </div>
                <div className="w-[1px] h-6 bg-slate-200" />
                <div className="text-center">
                  <span className="text-[10px] text-slate-500 block leading-none mb-1">ปราบปีศาจป่วน</span>
                  <span className="font-mono text-lg font-black text-emerald-500">{defeatedCount} ตัว</span>
                </div>
              </div>

              <button
                id="btn-ending-return"
                onClick={() => {
                  audioManager.playClick();
                  audioManager.stopBgm();
                  onBackToMenu();
                }}
                className="w-full py-3.5 px-6 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-black text-base rounded-2xl shadow-lg transition transform active:scale-95 cursor-pointer flex items-center justify-center gap-2"
              >
                กลับไปหน้าแรก (Title Screen)
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Onscreen mobile HUD / Touch controller (if enabled in settings) */}
      {settings.showOnScreenControls && isPlaying && (
        <div id="mobile-controller-hud" className="bg-white/95 border-t border-amber-200 p-4 flex justify-between items-center select-none z-30 shadow-inner">
          
          {/* Left Side: 8-directional cross pad */}
          <div className="flex flex-col gap-1.5">
            {/* Top Row Arrow Up */}
            <div className="flex justify-center">
              <button
                id="ctrl-btn-up"
                onMouseDown={() => simulateKeyDown('forward')}
                onMouseUp={() => simulateKeyUp('forward')}
                onTouchStart={() => simulateKeyDown('forward')}
                onTouchEnd={() => simulateKeyUp('forward')}
                className="w-11 h-11 bg-amber-50 hover:bg-amber-100 active:bg-amber-200 text-sm font-bold rounded-xl border border-amber-200 flex items-center justify-center text-amber-600 cursor-pointer shadow-sm"
              >
                ▲
              </button>
            </div>
            {/* Middle Row Left / Right */}
            <div className="flex gap-2">
              <button
                id="ctrl-btn-left"
                onMouseDown={() => simulateKeyDown('left')}
                onMouseUp={() => simulateKeyUp('left')}
                onTouchStart={() => simulateKeyDown('left')}
                onTouchEnd={() => simulateKeyUp('left')}
                className="w-11 h-11 bg-amber-50 hover:bg-amber-100 active:bg-amber-200 text-sm font-bold rounded-xl border border-amber-200 flex items-center justify-center text-amber-600 cursor-pointer shadow-sm"
              >
                ◀
              </button>
              <div className="w-11 h-11 flex items-center justify-center text-amber-700 font-mono text-[9px] font-bold">ปุ่มเดิน</div>
              <button
                id="ctrl-btn-right"
                onMouseDown={() => simulateKeyDown('right')}
                onMouseUp={() => simulateKeyUp('right')}
                onTouchStart={() => simulateKeyDown('right')}
                onTouchEnd={() => simulateKeyUp('right')}
                className="w-11 h-11 bg-amber-50 hover:bg-amber-100 active:bg-amber-200 text-sm font-bold rounded-xl border border-amber-200 flex items-center justify-center text-amber-600 cursor-pointer shadow-sm"
              >
                ▶
              </button>
            </div>
            {/* Bottom Row Arrow Down */}
            <div className="flex justify-center">
              <button
                id="ctrl-btn-down"
                onMouseDown={() => simulateKeyDown('backward')}
                onMouseUp={() => simulateKeyUp('backward')}
                onTouchStart={() => simulateKeyDown('backward')}
                onTouchEnd={() => simulateKeyUp('backward')}
                className="w-11 h-11 bg-amber-50 hover:bg-amber-100 active:bg-amber-200 text-sm font-bold rounded-xl border border-amber-200 flex items-center justify-center text-amber-600 cursor-pointer shadow-sm"
              >
                ▼
              </button>
            </div>
          </div>

          {/* Center text hint info */}
          <div className="hidden md:block text-center text-xs text-amber-700 font-sans max-w-sm">
            <span>💡 กดดีดพิณดีดใจชวนเพื่อนๆ สัตว์เลี้ยงเต้นระบำอย่างรื่นเริงและได้รับความสุขบวกเพิ่ม!</span>
          </div>

          {/* Right Side: Skill (O), Attack (P), Jump pads */}
          <div className="flex gap-2.5 items-center">
            {/* Special Dance Skill Button (O) */}
            <button
              id="ctrl-btn-dance-skill"
              onMouseDown={() => simulateKeyDown('dance')}
              onMouseUp={() => simulateKeyUp('dance')}
              onTouchStart={() => simulateKeyDown('dance')}
              onTouchEnd={() => simulateKeyUp('dance')}
              className="w-14 h-14 bg-gradient-to-br from-amber-500 to-yellow-400 active:from-amber-600 text-white text-[11px] font-black rounded-full border-2 border-amber-300 flex flex-col items-center justify-center shadow-md cursor-pointer leading-tight"
            >
              <span className="text-[13px]">✨</span>
              <span>เซิ้งสามช่า</span>
            </button>

            {/* Attack / Action Button (P) */}
            <button
              id="ctrl-btn-action"
              onMouseDown={() => simulateKeyDown('action')}
              onMouseUp={() => simulateKeyUp('action')}
              onTouchStart={() => simulateKeyDown('action')}
              onTouchEnd={() => simulateKeyUp('action')}
              className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-400 active:from-emerald-600 text-white text-[11px] font-black rounded-full border-2 border-emerald-300 flex flex-col items-center justify-center shadow-md cursor-pointer leading-tight"
            >
              <span className="text-[13px]">🎵</span>
              <span>ดีดพิณดีดใจ</span>
            </button>

            {/* Jump Button (Space) */}
            <button
              id="ctrl-btn-jump"
              onMouseDown={() => simulateKeyDown('jump')}
              onMouseUp={() => simulateKeyUp('jump')}
              onTouchStart={() => simulateKeyDown('jump')}
              onTouchEnd={() => simulateKeyUp('jump')}
              className="w-14 h-14 bg-slate-100 hover:bg-slate-200 active:bg-amber-100 text-slate-700 text-[11px] font-black rounded-2xl border border-slate-300 flex flex-col items-center justify-center shadow-md cursor-pointer leading-tight"
            >
              <span className="text-[13px]">🚀</span>
              <span>กระโดด</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
