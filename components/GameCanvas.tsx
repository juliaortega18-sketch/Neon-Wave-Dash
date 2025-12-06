import React, { useRef, useEffect } from 'react';
import { 
  GameState, 
  Player, 
  GameObject, 
  ObstacleType, 
  TriggerType 
} from '../types';
import { 
  CANVAS_WIDTH, 
  CANVAS_HEIGHT, 
  BASE_SPEED, 
  PLAYER_SIZE, 
  TRAIL_LENGTH,
  COLOR_PLAYER_1,
  COLOR_PLAYER_2,
  COLOR_OBSTACLE,
  COLOR_SPIKE,
  COLOR_BACKGROUND,
  COLOR_GRID,
  FLOOR_Y,
  CEILING_Y
} from '../constants';

interface GameCanvasProps {
  gameState: GameState;
  setGameState: (state: GameState) => void;
  inputActive: boolean;
  onScoreUpdate: (score: number) => void;
  levelData: GameObject[];
  activeSkin: 'default' | 'bullet' | 'dizzy';
}

const GameCanvas: React.FC<GameCanvasProps> = ({ 
  gameState, 
  setGameState, 
  inputActive,
  onScoreUpdate,
  levelData,
  activeSkin
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Input Ref (Crucial for avoiding stale closures in the loop)
  const inputActiveRef = useRef(inputActive);

  // Update the ref whenever the prop changes
  useEffect(() => {
    inputActiveRef.current = inputActive;
  }, [inputActive]);
  
  // Mutable Game State (Refs for performance in loop)
  const reqRef = useRef<number>(0);
  const speedMultiplierRef = useRef<number>(1);
  const cameraRef = useRef<{x: number}>({ x: 0 });
  const isDualModeRef = useRef<boolean>(false);
  
  // Players
  const player1Ref = useRef<Player>({
    x: 200,
    y: CANVAS_HEIGHT / 2,
    color: COLOR_PLAYER_1,
    inverted: false,
    dead: false,
    trail: []
  });

  const player2Ref = useRef<Player>({
    x: 200,
    y: CANVAS_HEIGHT / 2,
    color: COLOR_PLAYER_2,
    inverted: true,
    dead: true, // Starts dead until dual mode
    trail: []
  });

  // Level Objects (Deep copy to allow modification like consuming triggers)
  // Init with prop data
  const objectsRef = useRef<GameObject[]>(JSON.parse(JSON.stringify(levelData)));

  // Helper: Reset Game
  const resetGame = () => {
    speedMultiplierRef.current = 1;
    cameraRef.current = { x: 0 };
    isDualModeRef.current = false;
    
    player1Ref.current = {
      x: 200,
      y: CANVAS_HEIGHT / 2,
      color: COLOR_PLAYER_1,
      inverted: false,
      dead: false,
      trail: []
    };

    player2Ref.current = {
      x: 200,
      y: CANVAS_HEIGHT / 2,
      color: COLOR_PLAYER_2,
      inverted: true,
      dead: true,
      trail: []
    };

    // Reload level data from PROPS
    objectsRef.current = JSON.parse(JSON.stringify(levelData));
    onScoreUpdate(0);
  };

  // Main Game Loop
  const loop = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 1. UPDATE LOGIC
    if (gameState === GameState.PLAYING) {
      const speed = BASE_SPEED * speedMultiplierRef.current;
      
      // Update Camera
      cameraRef.current.x += speed;

      // Update Players
      const players = [player1Ref.current];
      if (isDualModeRef.current) players.push(player2Ref.current);

      players.forEach(p => {
        if (p.dead) return;

        // X Movement
        p.x += speed;

        // Y Movement (Wave Physics)
        const isHolding = inputActiveRef.current;
        const direction = isHolding ? -1 : 1;
        const dy = speed * direction * (p.inverted ? -1 : 1);
        
        p.y += dy;

        // --- Floor/Ceiling Logic (Sliding) ---
        if (p.y < CEILING_Y) {
            p.y = CEILING_Y;
        } else if (p.y + PLAYER_SIZE > FLOOR_Y) {
            p.y = FLOOR_Y - PLAYER_SIZE;
        }

        // Trail Logic
        if (p.trail.length > TRAIL_LENGTH) p.trail.shift();
        p.trail.push({ x: p.x, y: p.y + PLAYER_SIZE / 2 });

        // Object Collision & Triggers
        objectsRef.current.forEach(obj => {
          // Optimization: Simple AABB check first
          // Shrink player hitbox slightly for fairness
          const padding = 4;
          const px = p.x + padding;
          const py = p.y + padding;
          const pw = PLAYER_SIZE - padding * 2;
          const ph = PLAYER_SIZE - padding * 2;

          if (
            px < obj.x + obj.w &&
            px + pw > obj.x &&
            py < obj.y + obj.h &&
            py + ph > obj.y
          ) {
            // --- COLLISION DETECTED ---

            if (obj.type === ObstacleType.SPIKE) {
                // Spikes are always lethal
                const spikePadding = 6;
                if (
                    px + spikePadding < obj.x + obj.w &&
                    px + pw - spikePadding > obj.x &&
                    py + spikePadding < obj.y + obj.h &&
                    py + ph - spikePadding > obj.y
                ) {
                    p.dead = true;
                    setGameState(GameState.GAME_OVER);
                }
            } else if (obj.type === ObstacleType.BLOCK) {
                // Block Logic: Slide vs Crash
                const isOnTop = (p.y + PLAYER_SIZE) - dy <= obj.y + 10;
                const isOnBottom = p.y - dy >= (obj.y + obj.h) - 10; 
                
                if (dy > 0 && isOnTop) {
                    p.y = obj.y - PLAYER_SIZE;
                } else if (dy < 0 && isOnBottom) {
                    p.y = obj.y + obj.h;
                } else {
                    p.dead = true;
                    setGameState(GameState.GAME_OVER);
                }
            } else if (obj.active !== false) {
              // Triggers
              if (obj.type === TriggerType.SPEED_1) speedMultiplierRef.current = 1;
              if (obj.type === TriggerType.SPEED_2) speedMultiplierRef.current = 1.4; 
              if (obj.type === TriggerType.SPEED_3) speedMultiplierRef.current = 1.8; 
              
              if (obj.type === TriggerType.DUAL_MODE && !isDualModeRef.current) {
                isDualModeRef.current = true;
                player2Ref.current.x = p.x;
                player2Ref.current.y = p.y;
                player2Ref.current.dead = false;
                player2Ref.current.trail = [];
              }
              
              if (obj.type === TriggerType.NORMAL_MODE && isDualModeRef.current) {
                isDualModeRef.current = false;
                player2Ref.current.dead = true;
              }

              obj.active = false;
            }
          }
        });
      });

      // Update Score
      onScoreUpdate(Math.floor(player1Ref.current.x / 100));

      // Check Victory
      // Find the last object x position
      const lastObjectX = objectsRef.current[objectsRef.current.length - 1]?.x || 14000;
      if (player1Ref.current.x > lastObjectX + 500) { 
          setGameState(GameState.VICTORY);
      }
    }

    // 2. RENDER LOGIC
    const camX = cameraRef.current.x;
    
    // Clear Background
    ctx.fillStyle = COLOR_BACKGROUND;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw Grid
    ctx.strokeStyle = COLOR_GRID;
    ctx.lineWidth = 1;
    const gridSpacing = 50;
    const gridOffsetX = -(camX % gridSpacing);
    
    ctx.beginPath();
    for (let x = gridOffsetX; x < CANVAS_WIDTH; x += gridSpacing) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, CANVAS_HEIGHT);
    }
    for (let y = 0; y < CANVAS_HEIGHT; y += gridSpacing) {
      ctx.moveTo(0, y);
      ctx.lineTo(CANVAS_WIDTH, y);
    }
    ctx.stroke();

    // Draw Floor and Ceiling
    ctx.fillStyle = COLOR_OBSTACLE;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CEILING_Y);
    ctx.fillRect(0, FLOOR_Y, CANVAS_WIDTH, CANVAS_HEIGHT - FLOOR_Y);
    
    // Draw Floor Line Glow
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#fff';
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, CEILING_Y - 2, CANVAS_WIDTH, 2);
    ctx.fillRect(0, FLOOR_Y, CANVAS_WIDTH, 2);
    ctx.shadowBlur = 0;

    const renderOffsetX = 200 - camX;

    // Draw Objects
    objectsRef.current.forEach(obj => {
      const screenX = obj.x + renderOffsetX;
      if (screenX + obj.w < -100 || screenX > CANVAS_WIDTH + 100) return;

      if (obj.type === ObstacleType.BLOCK) {
        ctx.fillStyle = COLOR_OBSTACLE;
        ctx.fillRect(screenX, obj.y, obj.w, obj.h);
        ctx.fillStyle = '#00000030';
        ctx.fillRect(screenX + 4, obj.y + 4, obj.w - 8, obj.h - 8);
        
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.strokeRect(screenX, obj.y, obj.w, obj.h);

      } else if (obj.type === ObstacleType.SPIKE) {
        ctx.fillStyle = COLOR_SPIKE;
        ctx.beginPath();
        const isCeilingSpike = obj.y < CANVAS_HEIGHT / 2;
        if (isCeilingSpike) {
           ctx.moveTo(screenX, obj.y); 
           ctx.lineTo(screenX + obj.w, obj.y); 
           ctx.lineTo(screenX + obj.w / 2, obj.y + obj.h); 
        } else {
           ctx.moveTo(screenX, obj.y + obj.h); 
           ctx.lineTo(screenX + obj.w, obj.y + obj.h); 
           ctx.lineTo(screenX + obj.w / 2, obj.y); 
        }
        ctx.closePath();
        ctx.fill();
      } else if (obj.type === TriggerType.SPEED_1 || obj.type === TriggerType.SPEED_2 || obj.type === TriggerType.SPEED_3) {
        ctx.fillStyle = '#00000000'; 
        ctx.strokeStyle = '#fbbf24'; 
        if (obj.type === TriggerType.SPEED_2) ctx.strokeStyle = '#ef4444'; 
        if (obj.type === TriggerType.SPEED_3) ctx.strokeStyle = '#a855f7'; 
        
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(screenX + 10, obj.y);
        ctx.lineTo(screenX + 30, obj.y + obj.h / 2);
        ctx.lineTo(screenX + 10, obj.y + obj.h);
        ctx.stroke();
        
        if (obj.type !== TriggerType.SPEED_1) {
             ctx.beginPath();
             ctx.moveTo(screenX + 20, obj.y);
             ctx.lineTo(screenX + 40, obj.y + obj.h / 2);
             ctx.lineTo(screenX + 20, obj.y + obj.h);
             ctx.stroke();
        }
        if (obj.type === TriggerType.SPEED_3) {
             ctx.beginPath();
             ctx.moveTo(screenX + 30, obj.y);
             ctx.lineTo(screenX + 50, obj.y + obj.h / 2);
             ctx.lineTo(screenX + 30, obj.y + obj.h);
             ctx.stroke();
        }
      } else if (obj.type === TriggerType.DUAL_MODE || obj.type === TriggerType.NORMAL_MODE) {
          ctx.fillStyle = obj.type === TriggerType.DUAL_MODE ? COLOR_PLAYER_2 : COLOR_PLAYER_1;
          ctx.globalAlpha = 0.5;
          ctx.beginPath();
          ctx.arc(screenX + obj.w/2, obj.y + obj.h/2, obj.w/2, 0, Math.PI*2);
          ctx.fill();
          ctx.globalAlpha = 1.0;
          
          ctx.strokeStyle = '#fff';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(screenX + obj.w/2, obj.y + obj.h/2, obj.w/2, 0, Math.PI*2);
          ctx.stroke();
      }
    });

    // Draw Players
    const playersToRender = [player1Ref.current];
    if (isDualModeRef.current) playersToRender.push(player2Ref.current);

    playersToRender.forEach(p => {
        if (p.dead) return;

        let effectiveColor = p.color;
        if (activeSkin === 'bullet') effectiveColor = '#f97316'; // Orange
        if (activeSkin === 'dizzy') effectiveColor = '#a3e635'; // Lime

        // Draw Trail
        ctx.strokeStyle = effectiveColor;
        ctx.lineWidth = activeSkin !== 'default' ? 6 : 4;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.shadowColor = effectiveColor;
        ctx.shadowBlur = 10;
        
        ctx.beginPath();
        if (p.trail.length > 0) {
            const first = p.trail[0];
            ctx.moveTo(first.x + renderOffsetX, first.y);
            for (let i = 1; i < p.trail.length; i++) {
                ctx.lineTo(p.trail[i].x + renderOffsetX, p.trail[i].y);
            }
            ctx.lineTo(p.x + renderOffsetX, p.y + PLAYER_SIZE/2);
        }
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Draw Player
        const pScreenX = p.x + renderOffsetX;
        ctx.fillStyle = 'white';
        ctx.shadowColor = effectiveColor;
        ctx.shadowBlur = 15;

        if (activeSkin === 'bullet') {
            // BULLET SKIN: Rounded capsule shape
            ctx.beginPath();
            const radius = PLAYER_SIZE / 2;
            const centerY = p.y + radius;
            // Rounded nose (right)
            ctx.arc(pScreenX + PLAYER_SIZE, centerY, radius, -Math.PI/2, Math.PI/2);
            // Flat back or rounded back (left)
            ctx.arc(pScreenX + 4, centerY, radius, Math.PI/2, -Math.PI/2);
            ctx.closePath();
            ctx.fill();
            
            // Core detail
            ctx.fillStyle = effectiveColor;
            ctx.beginPath();
            ctx.arc(pScreenX + 10, centerY, 4, 0, Math.PI * 2);
            ctx.fill();

        } else if (activeSkin === 'dizzy') {
            // DIZZY SKIN: Circle with X eyes
            ctx.fillStyle = effectiveColor;
            ctx.beginPath();
            const radius = PLAYER_SIZE / 1.2; // Slightly bigger head
            const centerX = pScreenX + PLAYER_SIZE/2;
            const centerY = p.y + PLAYER_SIZE/2;
            
            ctx.arc(centerX, centerY, radius, 0, Math.PI*2);
            ctx.fill();
            
            // Eyes (X shape)
            ctx.strokeStyle = '#000'; 
            ctx.lineWidth = 2;
            ctx.shadowBlur = 0; // No shadow for face details

            const drawX = (x: number, y: number) => {
                ctx.beginPath();
                ctx.moveTo(x-3, y-3); ctx.lineTo(x+3, y+3);
                ctx.moveTo(x+3, y-3); ctx.lineTo(x-3, y+3);
                ctx.stroke();
            };

            // Calculate rotation based on holding? Maybe too complex for now.
            // Just fixed relative to face
            drawX(centerX + 6, centerY - 2);
            drawX(centerX - 2, centerY - 2); // Shifted slightly left due to speed illusion? No, just center.
            
            // Mouth (Wobbly line)
            ctx.beginPath();
            ctx.moveTo(centerX - 4, centerY + 5);
            ctx.quadraticCurveTo(centerX, centerY + 8, centerX + 4, centerY + 5);
            ctx.stroke();

        } else {
            // STANDARD WAVE: Triangle
            ctx.beginPath();
            ctx.moveTo(pScreenX + PLAYER_SIZE, p.y + PLAYER_SIZE / 2); 
            ctx.lineTo(pScreenX, p.y); 
            ctx.lineTo(pScreenX, p.y + PLAYER_SIZE); 
            ctx.closePath();
            ctx.fill();
            ctx.stroke(); 
        }
        
        ctx.shadowBlur = 0;
    });
    
    reqRef.current = requestAnimationFrame(loop);
  };

  useEffect(() => {
    if (gameState === GameState.START) {
        resetGame();
        loop();
        if (reqRef.current) cancelAnimationFrame(reqRef.current);
    } else if (gameState === GameState.PLAYING) {
        resetGame(); 
        reqRef.current = requestAnimationFrame(loop);
    }

    return () => {
        if (reqRef.current) cancelAnimationFrame(reqRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState, levelData]); // Add levelData to deps

  return (
    <canvas 
      ref={canvasRef}
      width={CANVAS_WIDTH}
      height={CANVAS_HEIGHT}
      className="w-full h-full object-contain bg-slate-900"
    />
  );
};

export default GameCanvas;