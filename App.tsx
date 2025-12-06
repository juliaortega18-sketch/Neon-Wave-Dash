import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { GameState, Difficulty } from './types';
import GameCanvas from './components/GameCanvas';
import { Play, RotateCcw, Trophy, Smile, Skull, Zap, Ghost, Activity, CheckCircle2, Rocket, Dna } from 'lucide-react';
import { getLevelData } from './services/levelService';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.START);
  const [difficulty, setDifficulty] = useState<Difficulty>(Difficulty.NORMAL);
  const [score, setScore] = useState(0);
  const [inputActive, setInputActive] = useState(false);
  const [attempts, setAttempts] = useState(1);
  
  // Persistent Total Attempts
  const [totalAttempts, setTotalAttempts] = useState(() => {
    try {
        const saved = localStorage.getItem('neonWave_totalAttempts');
        return saved ? parseInt(saved, 10) : 0;
    } catch (e) {
        return 0;
    }
  });

  // Persistent Completed Levels
  const [completedLevels, setCompletedLevels] = useState<string[]>(() => {
    try {
        const saved = localStorage.getItem('neonWave_completedLevels');
        return saved ? JSON.parse(saved) : [];
    } catch (e) {
        return [];
    }
  });

  // Persistent Active Skin ('default', 'bullet', 'dizzy')
  const [activeSkin, setActiveSkin] = useState<'default' | 'bullet' | 'dizzy'>(() => {
     try {
        // Migration from old boolean
        const oldBullet = localStorage.getItem('neonWave_useBulletSkin') === 'true';
        if (oldBullet) return 'bullet';
        
        return (localStorage.getItem('neonWave_activeSkin') as any) || 'default';
     } catch { return 'default'; }
  });

  useEffect(() => {
    localStorage.setItem('neonWave_totalAttempts', totalAttempts.toString());
  }, [totalAttempts]);

  useEffect(() => {
    localStorage.setItem('neonWave_completedLevels', JSON.stringify(completedLevels));
  }, [completedLevels]);

  useEffect(() => {
    localStorage.setItem('neonWave_activeSkin', activeSkin);
  }, [activeSkin]);

  // Unlock Logic
  const isBulletWaveUnlocked = useMemo(() => {
      const allDiffs = [Difficulty.NORMAL, Difficulty.MYTHIC, Difficulty.DEMON, Difficulty.INSANE_DEMON];
      return allDiffs.every(d => completedLevels.includes(d));
  }, [completedLevels]);

  const isDizzyUnlocked = totalAttempts >= 100;

  // Load level data based on difficulty
  const currentLevelData = useMemo(() => getLevelData(difficulty), [difficulty]);

  // Input Handling (Mouse & Touch)
  const handleInputStart = useCallback(() => {
    if (gameState === GameState.PLAYING) {
      setInputActive(true);
    }
  }, [gameState]);

  const handleInputEnd = useCallback(() => {
    setInputActive(false);
  }, []);

  const handleVictory = useCallback(() => {
      setGameState(GameState.VICTORY);
      if (!completedLevels.includes(difficulty)) {
          setCompletedLevels(prev => [...prev, difficulty]);
      }
  }, [difficulty, completedLevels]);

  const restartGame = useCallback(() => {
    setAttempts(prev => prev + 1);
    setTotalAttempts(prev => prev + 1);
    setGameState(GameState.PLAYING);
  }, []);

  const selectLevel = (diff: Difficulty) => {
    setDifficulty(diff);
    setAttempts(1);
    setTotalAttempts(prev => prev + 1);
    setGameState(GameState.PLAYING);
    setInputActive(true); 
    setTimeout(() => setInputActive(false), 100);
  };

  // Keyboard support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.code === 'Space' || e.code === 'ArrowUp')) {
        e.preventDefault(); 
        
        if (gameState !== GameState.PLAYING) {
            if (gameState === GameState.GAME_OVER || gameState === GameState.VICTORY) {
                if (!e.repeat) {
                     restartGame();
                     setInputActive(true);
                }
            }
            return;
        }

        if (!e.repeat) {
            setInputActive(true);
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        setInputActive(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameState, restartGame]);

  const renderLevelButton = (diff: Difficulty, label: string, desc: string, Icon: React.ElementType, colorClass: string, borderClass: string, bgClass: string) => {
      const isCompleted = completedLevels.includes(diff);
      return (
        <button 
            onClick={() => selectLevel(diff)}
            className={`group relative flex items-center p-6 bg-slate-800 border-2 ${borderClass} rounded-xl hover:bg-slate-700 transition-all transform hover:scale-105`}
        >
            <div className={`p-3 rounded-full ${bgClass} mr-4 transition-colors relative`}>
                <Icon className={`w-8 h-8 ${colorClass}`} />
                {isCompleted && (
                    <div className="absolute -top-2 -right-2 bg-slate-900 rounded-full border border-slate-700">
                        <CheckCircle2 className="w-5 h-5 text-green-400 fill-green-400/20" />
                    </div>
                )}
            </div>
            <div className="text-left flex-1">
                <h3 className="text-2xl font-bold text-white uppercase italic flex items-center gap-2">
                    {label}
                </h3>
                <p className="text-slate-400 text-sm">{desc}</p>
            </div>
        </button>
      );
  };

  return (
    <div 
      className="w-full h-screen bg-slate-900 flex flex-col items-center justify-center relative overflow-hidden select-none"
      onMouseDown={handleInputStart}
      onMouseUp={handleInputEnd}
      onMouseLeave={handleInputEnd}
      onTouchStart={handleInputStart}
      onTouchEnd={handleInputEnd}
    >
      {/* Game Canvas Layer */}
      <div className="absolute inset-0 z-0 flex items-center justify-center">
        <GameCanvas 
          gameState={gameState} 
          setGameState={(state) => {
              if (state === GameState.VICTORY) handleVictory();
              else setGameState(state);
          }} 
          inputActive={inputActive}
          onScoreUpdate={setScore}
          levelData={currentLevelData}
          activeSkin={activeSkin}
        />
      </div>

      {/* UI Overlay Layer */}
      <div className="absolute inset-0 z-10 pointer-events-none flex flex-col justify-between p-8">
        {/* Header */}
        <div className="flex justify-between items-start">
            <div className="flex flex-col">
                <h1 className="text-white font-bold text-2xl italic tracking-wider drop-shadow-md opacity-80">
                    NEON WAVE
                </h1>
                {gameState === GameState.PLAYING && (
                    <span className="text-xs text-white/50 font-bold uppercase tracking-widest">
                        {difficulty.replace('_', ' ')} • ATTEMPT {attempts}
                    </span>
                )}
            </div>
            {gameState === GameState.PLAYING && (
               <div className="text-white font-mono text-xl opacity-80">
                 {score.toString().padStart(5, '0')}
               </div>
            )}
        </div>

        {/* Attempt Overlay */}
        {gameState === GameState.PLAYING && (
            <div key={`${difficulty}-${attempts}`} className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                <h2 className="text-6xl md:text-8xl font-black italic text-white/10 attempt-overlay select-none">
                    ATTEMPT {attempts}
                </h2>
            </div>
        )}

        {/* Start / Level Select Screen */}
        {gameState === GameState.START && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/80 backdrop-blur-sm pointer-events-auto overflow-y-auto">
             <div className="text-center mb-8 mt-8">
                <Play className="w-16 h-16 text-cyan-400 mx-auto mb-2 fill-cyan-400/20" />
                <h2 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-pink-500 italic transform -skew-x-12">
                NEON WAVE DASH
                </h2>
                <p className="text-slate-400 mt-2">Select your challenge</p>
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-4xl px-4 mb-4">
                 {renderLevelButton(Difficulty.NORMAL, 'Normal', 'Good for warmups.', Smile, 'text-green-500', 'border-green-500', 'bg-green-500/20 group-hover:bg-green-500/40')}
                 {renderLevelButton(Difficulty.MYTHIC, 'Mythic', 'Tricky timings.', Zap, 'text-yellow-500', 'border-yellow-500', 'bg-yellow-500/20 group-hover:bg-yellow-500/40')}
                 {renderLevelButton(Difficulty.DEMON, 'Demon', 'Fast & Dangerous.', Skull, 'text-red-500', 'border-red-500', 'bg-red-500/20 group-hover:bg-red-500/40')}
                 {renderLevelButton(Difficulty.INSANE_DEMON, 'Insane Demon', 'Only for the masters.', Ghost, 'text-purple-500', 'border-purple-600', 'bg-purple-600/20 group-hover:bg-purple-600/40')}
             </div>

             <div className="flex flex-col gap-4 w-full max-w-4xl items-center">
                 <div className="flex items-center justify-center gap-2 text-slate-500 font-mono text-sm tracking-widest bg-slate-800/50 px-6 py-2 rounded-full border border-slate-700">
                    <Activity size={16} />
                    <span>TOTAL ATTEMPTS: {totalAttempts}</span>
                 </div>

                 {/* Skins Selection */}
                 {(isBulletWaveUnlocked || isDizzyUnlocked) && (
                     <div className="flex flex-wrap justify-center gap-3">
                        <button
                            onClick={() => setActiveSkin('default')}
                            className={`px-4 py-2 rounded-full text-xs font-bold tracking-widest transition-all border ${activeSkin === 'default' ? 'bg-cyan-500 text-white border-cyan-400' : 'bg-slate-800 text-slate-500 border-slate-700 hover:bg-slate-700'}`}
                        >
                            DEFAULT
                        </button>

                         {isBulletWaveUnlocked && (
                             <button
                                onClick={() => setActiveSkin('bullet')}
                                className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold tracking-widest transition-all border ${activeSkin === 'bullet' ? 'bg-orange-500 text-white border-orange-400 shadow-[0_0_15px_rgba(249,115,22,0.5)]' : 'bg-slate-800 text-slate-500 border-slate-700 hover:bg-slate-700'}`}
                             >
                                <Rocket size={14} />
                                BULLET
                             </button>
                         )}

                         {isDizzyUnlocked && (
                             <button
                                onClick={() => setActiveSkin('dizzy')}
                                className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold tracking-widest transition-all border ${activeSkin === 'dizzy' ? 'bg-lime-500 text-white border-lime-400 shadow-[0_0_15px_rgba(132,204,22,0.5)]' : 'bg-slate-800 text-slate-500 border-slate-700 hover:bg-slate-700'}`}
                             >
                                <Dna size={14} />
                                DIZZY
                             </button>
                         )}
                     </div>
                 )}
                 
                 {/* Locked Hints */}
                 {!isBulletWaveUnlocked && (
                     <div className="text-[10px] text-slate-700 uppercase tracking-widest">
                         Unlock Bullet Skin: Complete All Levels
                     </div>
                 )}
                 {!isDizzyUnlocked && (
                     <div className="text-[10px] text-slate-700 uppercase tracking-widest">
                         Unlock Dizzy Skin: Reach 100 Attempts
                     </div>
                 )}
             </div>
          </div>
        )}

        {/* Game Over Screen */}
        {gameState === GameState.GAME_OVER && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/90 backdrop-blur-md pointer-events-auto">
             <h2 className="text-5xl font-black text-red-500 mb-2 drop-shadow-[0_0_10px_rgba(239,68,68,0.8)]">
               CRASHED!
             </h2>
             <p className="text-slate-400 mb-8 text-xl">Score: {score}</p>
             <div className="flex gap-4">
                 <button 
                    onClick={() => setGameState(GameState.START)}
                    className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-full transition-all"
                 >
                   MENU
                 </button>
                 <button 
                    onClick={restartGame}
                    className="flex items-center gap-2 px-8 py-3 bg-white hover:bg-slate-200 text-slate-900 font-bold rounded-full shadow-lg transition-all transform hover:scale-105"
                 >
                   <RotateCcw size={20} />
                   RETRY
                 </button>
             </div>
          </div>
        )}

        {/* Victory Screen */}
        {gameState === GameState.VICTORY && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/90 backdrop-blur-md pointer-events-auto">
             <Trophy className="w-24 h-24 text-yellow-400 mb-4 drop-shadow-[0_0_20px_rgba(250,204,21,0.6)]" />
             <h2 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500 mb-4">
               CONGRATULATIONS!
             </h2>
             <p className="text-slate-300 mb-4 text-xl font-semibold">You completed {difficulty.replace('_', ' ')} level!</p>
             
             {isBulletWaveUnlocked && !completedLevels.includes(difficulty) && (
                 <div className="mb-4 p-4 bg-orange-500/20 border border-orange-500 rounded-lg flex items-center gap-3 animate-pulse">
                     <Rocket className="text-orange-500 w-8 h-8" />
                     <span className="text-orange-200 font-bold">BULLET WAVE SKIN UNLOCKED!</span>
                 </div>
             )}
             
             {isDizzyUnlocked && totalAttempts === 100 && (
                  <div className="mb-8 p-4 bg-lime-500/20 border border-lime-500 rounded-lg flex items-center gap-3 animate-pulse">
                     <Dna className="text-lime-500 w-8 h-8" />
                     <span className="text-lime-200 font-bold">DIZZY SKIN UNLOCKED!</span>
                 </div>
             )}

             <div className="flex gap-4">
                 <button 
                    onClick={() => setGameState(GameState.START)}
                    className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-full transition-all"
                 >
                   MENU
                 </button>
                 <button 
                    onClick={restartGame}
                    className="px-8 py-3 bg-yellow-400 hover:bg-yellow-300 text-slate-900 font-bold rounded-full shadow-lg transition-all"
                 >
                   PLAY AGAIN
                 </button>
             </div>
          </div>
        )}
      </div>
      
      {/* Footer Instructions (Mobile) */}
      <div className="absolute bottom-4 text-slate-500 text-xs text-center pointer-events-none">
        v1.1 • React • Tailwind
      </div>
    </div>
  );
};

export default App;