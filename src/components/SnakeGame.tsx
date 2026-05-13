/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, RefreshCw, Play, Pause, Keyboard } from 'lucide-react';
import { Point, Direction, GameState } from '../types';
import {
  GRID_SIZE,
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  INITIAL_SNAKE,
  INITIAL_SPEED,
  SPEED_INCREMENT,
  MIN_SPEED,
} from '../constants';

export default function SnakeGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [snake, setSnake] = useState<Point[]>(INITIAL_SNAKE);
  const [food, setFood] = useState<Point>({ x: 5, y: 5 });
  const [direction, setDirection] = useState<Direction>(Direction.UP);
  const [nextDirection, setNextDirection] = useState<Direction>(Direction.UP);
  const [gameState, setGameState] = useState<GameState>(GameState.START);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [speed, setSpeed] = useState(INITIAL_SPEED);

  const gameLoopRef = useRef<number>(0);
  const lastUpdateTimeRef = useRef<number>(0);

  // Load high score
  useEffect(() => {
    const saved = localStorage.getItem('snake-high-score');
    if (saved) setHighScore(parseInt(saved, 10));
  }, []);

  // Save high score
  useEffect(() => {
    if (score > highScore) {
      setHighScore(score);
      localStorage.setItem('snake-high-score', score.toString());
    }
  }, [score, highScore]);

  const generateFood = useCallback((currentSnake: Point[]): Point => {
    const cols = Math.floor(CANVAS_WIDTH / GRID_SIZE);
    const rows = Math.floor(CANVAS_HEIGHT / GRID_SIZE);
    let newFood: Point;
    while (true) {
      newFood = {
        x: Math.floor(Math.random() * cols),
        y: Math.floor(Math.random() * rows),
      };
      // Make sure food doesn't land on snake
      const onSnake = currentSnake.some(
        (segment) => segment.x === newFood.x && segment.y === newFood.y
      );
      if (!onSnake) break;
    }
    return newFood;
  }, []);

  const resetGame = () => {
    setSnake(INITIAL_SNAKE);
    setDirection(Direction.UP);
    setNextDirection(Direction.UP);
    setScore(0);
    setSpeed(INITIAL_SPEED);
    setGameState(GameState.PLAYING);
    setFood(generateFood(INITIAL_SNAKE));
  };

  const moveSnake = useCallback(() => {
    setSnake((prevSnake) => {
      const head = prevSnake[0];
      const newHead = { ...head };

      // Apply next direction to avoid 180 degree turns in a single tick
      const currentDir = nextDirection;
      setDirection(currentDir);

      switch (currentDir) {
        case Direction.UP: newHead.y -= 1; break;
        case Direction.DOWN: newHead.y += 1; break;
        case Direction.LEFT: newHead.x -= 1; break;
        case Direction.RIGHT: newHead.x += 1; break;
      }

      // Check wall collision
      const cols = Math.floor(CANVAS_WIDTH / GRID_SIZE);
      const rows = Math.floor(CANVAS_HEIGHT / GRID_SIZE);
      if (
        newHead.x < 0 ||
        newHead.x >= cols ||
        newHead.y < 0 ||
        newHead.y >= rows
      ) {
        setGameState(GameState.GAME_OVER);
        return prevSnake;
      }

      // Check self collision
      if (prevSnake.some((segment) => segment.x === newHead.x && segment.y === newHead.y)) {
        setGameState(GameState.GAME_OVER);
        return prevSnake;
      }

      const newSnake = [newHead, ...prevSnake];

      // Check food collision
      if (newHead.x === food.x && newHead.y === food.y) {
        setScore((s) => s + 10);
        setSpeed((prev) => Math.max(MIN_SPEED, prev - SPEED_INCREMENT));
        setFood(generateFood(newSnake));
      } else {
        newSnake.pop();
      }

      return newSnake;
    });
  }, [food, generateFood, nextDirection]);

  // Request Animation Frame Loop
  useEffect(() => {
    const update = (time: number) => {
      if (gameState === GameState.PLAYING) {
        const deltaTime = time - lastUpdateTimeRef.current;
        if (deltaTime >= speed) {
          moveSnake();
          lastUpdateTimeRef.current = time;
        }
      }
      gameLoopRef.current = requestAnimationFrame(update);
    };

    gameLoopRef.current = requestAnimationFrame(update);
    return () => cancelAnimationFrame(gameLoopRef.current);
  }, [gameState, moveSnake, speed]);

  // Input Handling
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          if (direction !== Direction.DOWN) setNextDirection(Direction.UP);
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          if (direction !== Direction.UP) setNextDirection(Direction.DOWN);
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          if (direction !== Direction.RIGHT) setNextDirection(Direction.LEFT);
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          if (direction !== Direction.LEFT) setNextDirection(Direction.RIGHT);
          break;
        case ' ': // Space to pause/start
          if (gameState === GameState.PLAYING) setGameState(GameState.PAUSED);
          else if (gameState === GameState.PAUSED) setGameState(GameState.PLAYING);
          else if (gameState === GameState.START || gameState === GameState.GAME_OVER) resetGame();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [direction, gameState]);

  // Drawing
  useEffect(() => {
    const context = canvasRef.current?.getContext('2d');
    if (!context) return;

    // Clear background
    context.fillStyle = '#020617'; 
    context.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw Grid (Geometric)
    context.strokeStyle = '#1e293b';
    context.lineWidth = 1;
    context.globalAlpha = 0.5;
    for (let x = 0; x <= CANVAS_WIDTH; x += GRID_SIZE) {
      context.beginPath();
      context.moveTo(x, 0);
      context.lineTo(x, CANVAS_HEIGHT);
      context.stroke();
    }
    for (let y = 0; y <= CANVAS_HEIGHT; y += GRID_SIZE) {
      context.beginPath();
      context.moveTo(0, y);
      context.lineTo(CANVAS_WIDTH, y);
      context.stroke();
    }
    context.globalAlpha = 1;

    // Draw Food
    context.shadowBlur = 15;
    context.shadowColor = '#f43f5e';
    context.fillStyle = '#f43f5e';
    context.beginPath();
    // Circle for food, keeping it distinct
    context.arc(
      food.x * GRID_SIZE + GRID_SIZE / 2,
      food.y * GRID_SIZE + GRID_SIZE / 2,
      GRID_SIZE / 3,
      0,
      Math.PI * 2
    );
    context.fill();

    // Draw Snake (Geometric Square Segments)
    snake.forEach((segment, index) => {
      const isHead = index === 0;
      context.shadowBlur = isHead ? 20 : 0;
      context.shadowColor = '#10b981';
      
      const opacity = Math.max(0.4, 1 - (index / snake.length) * 0.6);
      context.fillStyle = `rgba(16, 185, 129, ${opacity})`;
      
      const x = segment.x * GRID_SIZE + 1;
      const y = segment.y * GRID_SIZE + 1;
      const size = GRID_SIZE - 2;

      context.fillRect(x, y, size, size);

      // Simple indicator for head
      if (isHead) {
        context.shadowBlur = 0;
        context.fillStyle = '#ffffff';
        let dotX = x + size / 2;
        let dotY = y + size / 2;
        const offset = 4;

        if (direction === Direction.UP) dotY -= offset;
        if (direction === Direction.DOWN) dotY += offset;
        if (direction === Direction.LEFT) dotX -= offset;
        if (direction === Direction.RIGHT) dotX += offset;
        
        context.beginPath();
        context.arc(dotX, dotY, 2, 0, Math.PI * 2);
        context.fill();
      }
    });

    context.shadowBlur = 0;
  }, [snake, food, direction]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#020617] text-slate-200 font-mono p-10 overflow-hidden relative">
      <div className="w-full max-w-6xl">
        {/* Header */}
        <header className="flex justify-between items-end border-b border-slate-800 pb-6 mb-8">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></div>
              <h1 className="text-4xl font-black tracking-tighter text-white uppercase">
                NEON_SNAKE<span className="text-emerald-500">.TS</span>
              </h1>
            </div>
            <p className="text-[10px] text-slate-500 uppercase tracking-[0.3em]">
              Vite + React + TypeScript Environment v2.4.0
            </p>
          </div>
          <div className="flex gap-16">
            <div className="flex flex-col items-end">
              <span className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">本次得分</span>
              <span className="text-4xl font-bold text-emerald-400 tabular-nums">
                {score.toString().padStart(5, '0')}
              </span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">歷史最高</span>
              <span className="text-4xl font-bold text-slate-600 tabular-nums">
                {highScore.toString().padStart(5, '0')}
              </span>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex gap-8">
          {/* Game Canvas Container */}
          <div className="relative flex-1 bg-slate-950 border border-slate-800 rounded-sm shadow-[0_0_50px_-12px_rgba(16,185,129,0.15)] overflow-hidden">
            <canvas
              ref={canvasRef}
              width={CANVAS_WIDTH}
              height={CANVAS_HEIGHT}
              className="w-full h-auto block"
            />

            {/* Grid Pattern Overlay */}
            <div className="absolute inset-0 pointer-events-none opacity-[0.05]" 
                 style={{ backgroundImage: 'linear-gradient(#1e293b 1px, transparent 1px), linear-gradient(90deg, #1e293b 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

            {/* Game Over Overlay */}
            <AnimatePresence>
              {gameState === GameState.GAME_OVER && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm flex flex-col items-center justify-center p-12 text-center border-2 border-rose-500/30 m-[-2px]"
                >
                  <span className="text-rose-500 font-bold tracking-[0.5em] text-sm mb-4">系統嚴重錯誤</span>
                  <h2 className="text-8xl font-black text-white mb-2 italic tracking-tighter uppercase">
                    遊戲結束
                  </h2>
                  <p className="text-slate-400 max-w-md text-sm mb-12 uppercase tracking-wide">
                    蛇頭與系統邊界發生碰撞。<br/>遊戲執行緒已終止，得分：{score}。
                  </p>
                  <button
                    onClick={resetGame}
                    className="group flex flex-col items-center gap-4 outline-none"
                  >
                    <div className="px-12 py-4 bg-emerald-500 text-slate-950 font-black uppercase tracking-widest text-lg hover:bg-white transition-all transform active:scale-95 cursor-pointer">
                      按下空白鍵重啟系統
                    </div>
                    <div className="text-[10px] text-slate-500">或點擊畫面任何地方開始新執行緒</div>
                  </button>
                </motion.div>
              )}

              {/* Start Overlay */}
              {gameState === GameState.START && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-slate-950/80 backdrop-blur-md flex flex-col items-center justify-center p-12 text-center"
                >
                  <span className="text-emerald-500 font-bold tracking-[0.5em] text-sm mb-4">系統就緒</span>
                  <h2 className="text-7xl font-black text-white mb-8 tracking-tighter uppercase">
                    初始化中
                  </h2>
                  <button
                    onClick={resetGame}
                    className="px-16 py-5 bg-emerald-500 text-slate-950 font-black uppercase tracking-widest text-xl hover:bg-white transition-all transform active:scale-95 cursor-pointer"
                  >
                    開始遊戲
                  </button>
                </motion.div>
              )}

              {/* Pause Overlay */}
              {gameState === GameState.PAUSED && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm flex flex-col items-center justify-center"
                >
                  <div className="border border-emerald-500/30 p-8 flex flex-col items-center gap-6 bg-slate-950/80">
                    <span className="text-emerald-500 font-bold tracking-[0.5em] text-[10px]">程序已暫停</span>
                    <Pause size={48} className="text-white opacity-50" />
                    <button
                      onClick={() => setGameState(GameState.PLAYING)}
                      className="px-12 py-3 border border-white text-white font-bold uppercase tracking-widest text-xs hover:bg-white hover:text-slate-950 transition-colors"
                    >
                      恢復服務
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Sidebar */}
          <aside className="w-72 flex flex-col gap-6">
            <div className="p-6 bg-slate-900/50 border border-slate-800 rounded-sm">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">系統狀態</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-500">難度評等</span>
                  <span className="text-xs font-bold text-orange-400 uppercase">
                    {speed < 100 ? '困難' : speed < 130 ? '一般' : '容易'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-500">系統完整度</span>
                  <span className="text-xs font-bold text-white uppercase tabular-nums">
                    {Math.max(0, 100 - (score / 10)).toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-500">週期速度</span>
                  <span className="text-xs font-bold text-white uppercase tabular-nums">
                    {speed.toFixed(1)} ms
                  </span>
                </div>
              </div>
            </div>

            <div className="p-6 bg-slate-900/50 border border-slate-800 rounded-sm flex-1">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">操作說明</h3>
              <div className="space-y-4 font-mono">
                {[
                  { key: 'W', desc: '向上移動' },
                  { key: 'A', desc: '向左移動' },
                  { key: 'S', desc: '向下移動' },
                  { key: 'D', desc: '向右移動' },
                  { key: 'SPACE', desc: '暫停 / 執行' },
                ].map((cmd) => (
                  <div key={cmd.key} className="flex items-center gap-4 text-[10px]">
                    <div className="w-12 h-12 border border-slate-700 flex items-center justify-center bg-slate-800 rounded-sm text-white font-bold opacity-80">
                      {cmd.key}
                    </div>
                    <span className="text-slate-400 uppercase tracking-wider">{cmd.desc}</span>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </main>

        {/* Footer */}
        <footer className="mt-8 flex justify-between items-center text-[10px] text-slate-600 uppercase tracking-[0.2em] border-t border-slate-900 pt-6">
          <div className="flex gap-4 items-center">
            <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
            <span>React.useEffect 鉤子已啟動 / 按鍵監聽器已連結</span>
          </div>
          <div className="flex gap-8">
            <span>畫布渲染：硬體加速</span>
            <span>執行緒狀態：正常</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
