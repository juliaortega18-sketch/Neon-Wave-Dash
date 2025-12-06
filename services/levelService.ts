import { GameObject, ObstacleType, TriggerType, Difficulty } from '../types';
import { CANVAS_HEIGHT, CEILING_Y, FLOOR_Y } from '../constants';

const SPIKE_W = 40;
const SPIKE_H = 40;
const CENTER = CANVAS_HEIGHT / 2;

// --- Helpers ---

const createSpike = (x: number, y: number): GameObject => ({
  type: ObstacleType.SPIKE,
  x,
  y,
  w: SPIKE_W,
  h: SPIKE_H
});

const createBlock = (x: number, y: number, w: number, h: number): GameObject => ({
  type: ObstacleType.BLOCK,
  x,
  y,
  w,
  h
});

const createSpeedTrigger = (x: number, speed: 1 | 2 | 3): GameObject => ({
    type: speed === 2 ? TriggerType.SPEED_2 : speed === 3 ? TriggerType.SPEED_3 : TriggerType.SPEED_1,
    x,
    y: 0,
    w: 50,
    h: CANVAS_HEIGHT,
    active: true
});

const createDualPortal = (x: number, active: boolean): GameObject => ({
    type: active ? TriggerType.DUAL_MODE : TriggerType.NORMAL_MODE,
    x,
    y: 200,
    w: 80,
    h: 200,
    active: true
});

// --- Level Definitions ---

const normalLevel: GameObject[] = [
    createSpeedTrigger(100, 1),
    // Easy warm up
    createSpike(800, FLOOR_Y - SPIKE_H),
    createSpike(1200, FLOOR_Y - SPIKE_H),
    createSpike(1600, CEILING_Y),
    
    // Wide corridors
    createBlock(2000, CEILING_Y, 50, 100),
    createBlock(2000, FLOOR_Y - 100, 50, 100),
    
    createSpike(2500, FLOOR_Y - SPIKE_H),
    createSpike(2800, CEILING_Y),
    
    // Simple stairs
    createBlock(3200, FLOOR_Y - 100, 200, 100),
    createSpike(3500, FLOOR_Y - SPIKE_H),
    
    // Long straight section
    createBlock(4000, CEILING_Y, 800, 100),
    createBlock(4000, FLOOR_Y - 100, 800, 100),
    
    // Finish
    createSpike(5500, FLOOR_Y - SPIKE_H),
    // Removed the wall at 6000 that was making the level impossible
];

const mythicLevel: GameObject[] = [
    // --- SECTION 1: Intro (Slow) ---
    createSpike(800, FLOOR_Y - SPIKE_H),
    createSpike(1200, FLOOR_Y - SPIKE_H),
    createSpike(1400, CEILING_Y), 
    createBlock(1600, FLOOR_Y - 100, 50, 100),
    createSpike(1800, CEILING_Y),
    createSpike(2000, FLOOR_Y - SPIKE_H),

    // --- SECTION 2: Speed Up (x2) ---
    createSpeedTrigger(2200, 2),
    
    createBlock(2500, CEILING_Y, 50, 150),
    createSpike(2510, CEILING_Y + 150), 
    
    createSpike(2700, CEILING_Y),
    createSpike(2800, FLOOR_Y - SPIKE_H),
    createSpike(2900, CEILING_Y),
    createSpike(3000, FLOOR_Y - SPIKE_H),
    
    createBlock(3300, CEILING_Y, 50, 200),
    createBlock(3300, FLOOR_Y - 100, 50, 100),
    
    createBlock(3800, CEILING_Y, 800, 150),
    createBlock(3800, FLOOR_Y - 150, 800, 150),
    createSpike(4000, FLOOR_Y - 150 - SPIKE_H),
    createSpike(4200, CEILING_Y + 150), 
    createSpike(4400, FLOOR_Y - 150 - SPIKE_H),

    // --- SECTION 3: Speed x3 (Fast) ---
    createSpeedTrigger(4800, 3),

    createSpike(5200, FLOOR_Y - SPIKE_H),
    createSpike(5400, CEILING_Y),
    createSpike(5600, FLOOR_Y - SPIKE_H),
    
    createBlock(5900, CEILING_Y, 1000, 200),
    createBlock(5900, FLOOR_Y - 200, 1000, 200),
    createSpike(6100, CEILING_Y + 200),
    createSpike(6300, FLOOR_Y - 200 - SPIKE_H),
    createSpike(6500, CEILING_Y + 200),

    // --- SECTION 4: Dual Mode ---
    createDualPortal(7000, true), 
    createSpeedTrigger(7100, 2), 
    
    createBlock(7500, CENTER - 50, 50, 100), 
    createSpike(7800, CEILING_Y),
    createSpike(7800, FLOOR_Y - SPIKE_H), 
    createSpike(8100, CEILING_Y),
    createSpike(8100, FLOOR_Y - SPIKE_H),

    createBlock(8500, CEILING_Y, 50, 150), 
    createSpike(8800, FLOOR_Y - SPIKE_H), 
    createBlock(9100, FLOOR_Y - 150, 50, 150), 
    createSpike(9400, CEILING_Y), 

    // --- SECTION 5: Exit Dual & Finale ---
    createDualPortal(9800, false), 
    createSpeedTrigger(10000, 3), 
    
    createSpike(10300, FLOOR_Y - SPIKE_H),
    createSpike(10500, CEILING_Y),
    createSpike(10700, FLOOR_Y - SPIKE_H),
    createSpike(10900, CEILING_Y),
    
    createBlock(11200, FLOOR_Y - 200, 50, 200),
    createBlock(11200, CEILING_Y, 50, 100),
    createBlock(11600, CEILING_Y, 50, 400), 
    createSpike(11900, FLOOR_Y - SPIKE_H),
];

const demonLevel: GameObject[] = [
    createSpeedTrigger(100, 2), // Immediate Speed
    
    // Tight wave patterns
    createSpike(500, FLOOR_Y - SPIKE_H),
    createSpike(600, CEILING_Y),
    createSpike(700, FLOOR_Y - SPIKE_H),
    createSpike(800, CEILING_Y),
    createSpike(900, FLOOR_Y - SPIKE_H),
    createSpike(1000, CEILING_Y),

    // Sudden Block Gaps
    createBlock(1500, 0, 100, 300), // Top block
    createBlock(1500, 450, 100, 200), // Bottom block
    // Gap is 300-450 (150px)

    createBlock(2000, 0, 100, 200),
    createBlock(2000, 350, 100, 300),
    // Gap 200-350 (150px)

    createSpeedTrigger(2500, 3), // Faster

    // Dual Mode Chaos
    createDualPortal(3000, true),
    
    createBlock(3500, CENTER - 20, 200, 40), // Thin line in middle
    createSpike(3550, CENTER - 20 - SPIKE_H), // Spike on top of middle line
    createSpike(3650, CENTER + 20), // Spike below middle line
    
    createBlock(4000, CEILING_Y, 50, 200),
    createBlock(4000, FLOOR_Y - 200, 50, 200),
    
    createDualPortal(4500, false),

    // Final tightness
    createBlock(5000, CEILING_Y, 2000, 200),
    createBlock(5000, FLOOR_Y - 200, 2000, 200),
    
    createSpike(5200, CEILING_Y + 200),
    createSpike(5500, FLOOR_Y - 200 - SPIKE_H),
    createSpike(5800, CEILING_Y + 200),
    createSpike(6100, FLOOR_Y - 200 - SPIKE_H),
];

const insaneDemonLevel: GameObject[] = [
    createSpeedTrigger(50, 3), // MAX SPEED START
    
    // Immediate spikes
    createSpike(400, CEILING_Y),
    createSpike(600, FLOOR_Y - SPIKE_H),
    createSpike(800, CEILING_Y),
    
    // Sawtooth corridor (Spikes on top and bottom constantly)
    createBlock(1200, CEILING_Y, 2000, 50),
    createBlock(1200, FLOOR_Y - 50, 2000, 50),
    
    createSpike(1400, CEILING_Y + 50),
    createSpike(1500, FLOOR_Y - 50 - SPIKE_H),
    createSpike(1600, CEILING_Y + 50),
    createSpike(1700, FLOOR_Y - 50 - SPIKE_H),
    createSpike(1800, CEILING_Y + 50),
    createSpike(1900, FLOOR_Y - 50 - SPIKE_H),
    createSpike(2000, CEILING_Y + 50),
    createSpike(2100, FLOOR_Y - 50 - SPIKE_H),
    
    // Dual Mode Insanity
    createDualPortal(3500, true),
    
    // Asymmetric blockades
    createBlock(3800, 0, 50, 300), // Top heavy
    createBlock(4100, 300, 50, 300), // Bottom heavy
    
    createBlock(4400, 200, 50, 200), // Middle block
    
    createDualPortal(5000, false),
    
    // Precision tunnel
    createBlock(5500, 0, 1500, 250),
    createBlock(5500, 350, 1500, 250),
    // 100px gap at speed 3
    
    createSpike(6000, 350 - SPIKE_H), // Spike inside tunnel
];

export const getLevelData = (difficulty: Difficulty): GameObject[] => {
    switch (difficulty) {
        case Difficulty.NORMAL: return normalLevel;
        case Difficulty.MYTHIC: return mythicLevel;
        case Difficulty.DEMON: return demonLevel;
        case Difficulty.INSANE_DEMON: return insaneDemonLevel;
        default: return normalLevel;
    }
};

// Export legacy for safety
export const levelData = mythicLevel;