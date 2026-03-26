import { useState, useRef, useCallback, useEffect } from 'react';
import { Gift, Star, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import centauroLogo from '@/assets/centauro-logo.webp';
import cbfLogo from '@/assets/cbf-logo.webp';
import camisaImg from '@/assets/camisa-brasil-hero.webp';
import albumImg from '@/assets/album-copa-hero.webp';

interface ScratchItem {
  id: string;
  label: string;
  emoji: string;
  image?: string;
}

const ALL_ITEMS: ScratchItem[] = [
  { id: 'bola', label: 'Bola', emoji: '⚽' },
  { id: 'trofeu', label: 'Troféu', emoji: '🏆' },
  { id: 'chuteira', label: 'Chuteira', emoji: '👟' },
  { id: 'bandeira', label: 'Bandeira', emoji: '🇧🇷' },
  { id: 'album', label: 'Álbum', emoji: '📖', image: albumImg },
  { id: 'camisa', label: 'Camisa', emoji: '👕', image: camisaImg },
];

function generateLosingGrid(): ScratchItem[] {
  const grid: ScratchItem[] = [];
  const counts: Record<string, number> = {};
  const shuffled = [...ALL_ITEMS].sort(() => Math.random() - 0.5);
  let idx = 0;
  while (grid.length < 9) {
    const item = shuffled[idx % shuffled.length];
    const count = counts[item.id] || 0;
    if (count < 2) {
      grid.push({ ...item });
      counts[item.id] = count + 1;
    }
    idx++;
    if (idx > 100) {
      const available = ALL_ITEMS.find(i => (counts[i.id] || 0) < 2);
      if (available) {
        grid.push({ ...available });
        counts[available.id] = (counts[available.id] || 0) + 1;
      }
    }
  }
  return grid.sort(() => Math.random() - 0.5);
}

function generateWinningGrid(winnerId: string): ScratchItem[] {
  const winner = ALL_ITEMS.find(i => i.id === winnerId)!;
  const others = ALL_ITEMS.filter(i => i.id !== winnerId);
  const grid: ScratchItem[] = [];
  for (let i = 0; i < 3; i++) grid.push({ ...winner });
  const shuffled = [...others].sort(() => Math.random() - 0.5);
  const counts: Record<string, number> = {};
  let idx = 0;
  while (grid.length < 9) {
    const item = shuffled[idx % shuffled.length];
    const count = counts[item.id] || 0;
    if (count < 2) {
      grid.push({ ...item });
      counts[item.id] = count + 1;
    }
    idx++;
    if (idx > 100) break;
  }
  return grid.sort(() => Math.random() - 0.5);
}

const ROUND_CONFIGS = [
  { type: 'lose' as const, winnerId: null, title: 'Tente a sorte!' },
  { type: 'win' as const, winnerId: 'album', title: 'Segunda chance!' },
  { type: 'win' as const, winnerId: 'camisa', title: 'Última chance!' },
];

// Single unified canvas scratch card with 9 cells
function ScratchGrid({
  grid,
  onAllRevealed,
}: {
  grid: ScratchItem[];
  onAllRevealed: (revealedIndices: number[]) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDrawing = useRef(false);
  const revealedCells = useRef<Set<number>>(new Set());
  const hasFinished = useRef(false);
  const [revealedCount, setRevealedCount] = useState(0);

  const getCellSize = useCallback(() => {
    const container = containerRef.current;
    if (!container) return { cellW: 0, cellH: 0, gap: 0, totalW: 0, totalH: 0 };
    const totalW = container.getBoundingClientRect().width;
    const gap = 6;
    const cellW = (totalW - gap * 2) / 3;
    const cellH = cellW;
    const totalH = cellH * 3 + gap * 2;
    return { cellW, cellH, gap, totalW, totalH };
  }, []);

  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { cellW, cellH, gap, totalW, totalH } = getCellSize();
    const dpr = 2;
    canvas.width = totalW * dpr;
    canvas.height = totalH * dpr;
    canvas.style.height = `${totalH}px`;
    ctx.scale(dpr, dpr);

    // Draw 9 gold cells
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        const x = col * (cellW + gap);
        const y = row * (cellH + gap);

        const gradient = ctx.createLinearGradient(x, y, x + cellW, y + cellH);
        gradient.addColorStop(0, '#C9A84C');
        gradient.addColorStop(0.3, '#E8D48B');
        gradient.addColorStop(0.5, '#F5E6A3');
        gradient.addColorStop(0.7, '#E8D48B');
        gradient.addColorStop(1, '#C9A84C');

        // Rounded rect
        const r = 12;
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + cellW - r, y);
        ctx.quadraticCurveTo(x + cellW, y, x + cellW, y + r);
        ctx.lineTo(x + cellW, y + cellH - r);
        ctx.quadraticCurveTo(x + cellW, y + cellH, x + cellW - r, y + cellH);
        ctx.lineTo(x + r, y + cellH);
        ctx.quadraticCurveTo(x, y + cellH, x, y + cellH - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
        ctx.fillStyle = gradient;
        ctx.fill();

        // "RASPE" text
        ctx.fillStyle = 'rgba(0,0,0,0.1)';
        const fontSize = Math.max(9, cellW * 0.1);
        ctx.font = `bold ${fontSize}px Inter, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('RASPE', x + cellW / 2, y + cellH / 2);
      }
    }
  }, [getCellSize]);

  useEffect(() => {
    initCanvas();
    // Re-init on resize
    const handleResize = () => initCanvas();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [initCanvas]);

  const checkCellReveal = useCallback((posX: number, posY: number) => {
    const canvas = canvasRef.current;
    if (!canvas || hasFinished.current) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { cellW, cellH, gap } = getCellSize();

    // Scratch with large brush
    const dpr = 2;
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(posX, posY, 20, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalCompositeOperation = 'source-over';

    // Check which cell was touched and if it's sufficiently scratched
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        const idx = row * 3 + col;
        if (revealedCells.current.has(idx)) continue;

        const cx = col * (cellW + gap);
        const cy = row * (cellH + gap);

        // Check if scratch position is in this cell
        if (posX >= cx && posX <= cx + cellW && posY >= cy && posY <= cy + cellH) {
          // Sample a few points in this cell to check transparency
          const samplePoints = [
            [cx + cellW * 0.3, cy + cellH * 0.3],
            [cx + cellW * 0.7, cy + cellH * 0.3],
            [cx + cellW * 0.5, cy + cellH * 0.5],
            [cx + cellW * 0.3, cy + cellH * 0.7],
            [cx + cellW * 0.7, cy + cellH * 0.7],
          ];

          let transparentCount = 0;
          for (const [sx, sy] of samplePoints) {
            const pixel = ctx.getImageData(sx * dpr, sy * dpr, 1, 1).data;
            if (pixel[3] < 50) transparentCount++;
          }

          // If any scratch detected in cell, reveal it immediately
          if (transparentCount >= 1) {
            revealedCells.current.add(idx);
            // Clear entire cell
            ctx.globalCompositeOperation = 'destination-out';
            const r = 12;
            ctx.beginPath();
            ctx.moveTo(cx + r, cy);
            ctx.lineTo(cx + cellW - r, cy);
            ctx.quadraticCurveTo(cx + cellW, cy, cx + cellW, cy + r);
            ctx.lineTo(cx + cellW, cy + cellH - r);
            ctx.quadraticCurveTo(cx + cellW, cy + cellH, cx + cellW - r, cy + cellH);
            ctx.lineTo(cx + r, cy + cellH);
            ctx.quadraticCurveTo(cx, cy + cellH, cx, cy + cellH - r);
            ctx.lineTo(cx, cy + r);
            ctx.quadraticCurveTo(cx, cy, cx + r, cy);
            ctx.closePath();
            ctx.fill();
            ctx.globalCompositeOperation = 'source-over';

            const newCount = revealedCells.current.size;
            setRevealedCount(newCount);

            if (newCount >= 9 && !hasFinished.current) {
              hasFinished.current = true;
              setTimeout(() => {
                onAllRevealed(Array.from(revealedCells.current));
              }, 400);
            }
          }
        }
      }
    }
  }, [getCellSize, onAllRevealed]);

  const getPos = (e: React.TouchEvent | React.MouseEvent) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    if ('touches' in e) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      };
    }
    return {
      x: (e as React.MouseEvent).clientX - rect.left,
      y: (e as React.MouseEvent).clientY - rect.top,
    };
  };

  const handleStart = (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    isDrawing.current = true;
    const pos = getPos(e);
    checkCellReveal(pos.x, pos.y);
  };

  const handleMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (!isDrawing.current) return;
    e.preventDefault();
    const pos = getPos(e);
    checkCellReveal(pos.x, pos.y);
  };

  const handleEnd = () => {
    isDrawing.current = false;
  };

  const { cellW, cellH, gap, totalH } = getCellSize();

  return (
    <div>
      {/* Progress bar */}
      <div className="mb-3">
        <div className="flex justify-between text-[10px] font-bold text-primary-foreground/40 mb-1">
          <span>Campos raspados</span>
          <span>{revealedCount}/9</span>
        </div>
        <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-centauro-gold rounded-full transition-all duration-300"
            style={{ width: `${(revealedCount / 9) * 100}%` }}
          />
        </div>
      </div>

      <div
        ref={containerRef}
        className="relative w-full rounded-2xl overflow-hidden bg-foreground p-1"
        style={{ minHeight: totalH || 'auto' }}
      >
        {/* Prize grid underneath */}
        <div className="absolute inset-1 grid grid-cols-3" style={{ gap: `${gap}px` }}>
          {grid.map((item, i) => (
            <div
              key={i}
              className="rounded-xl bg-gradient-to-br from-muted to-background flex flex-col items-center justify-center gap-0.5 aspect-square"
            >
              {item.image ? (
                <>
                  <img src={item.image} alt={item.label} className="w-3/4 h-3/4 object-contain" />
                  <span className="text-[8px] md:text-[10px] font-bold text-foreground/70">{item.label}</span>
                </>
              ) : (
                <>
                  <span className="text-2xl md:text-3xl">{item.emoji}</span>
                  <span className="text-[8px] md:text-[10px] font-bold text-foreground/70">{item.label}</span>
                </>
              )}
            </div>
          ))}
        </div>

        {/* Single canvas on top */}
        <canvas
          ref={canvasRef}
          className="relative w-full cursor-pointer touch-none"
          style={{ height: totalH || 300 }}
          onMouseDown={handleStart}
          onMouseMove={handleMove}
          onMouseUp={handleEnd}
          onMouseLeave={handleEnd}
          onTouchStart={handleStart}
          onTouchMove={handleMove}
          onTouchEnd={handleEnd}
        />
      </div>
    </div>
  );
}

interface ScratchCardProps {
  onComplete: () => void;
}

export default function ScratchCard({ onComplete }: ScratchCardProps) {
  const [currentRound, setCurrentRound] = useState(0);
  const [grid, setGrid] = useState<ScratchItem[]>(() => generateLosingGrid());
  const [roundResult, setRoundResult] = useState<'pending' | 'win' | 'lose'>('pending');
  const [showCelebration, setShowCelebration] = useState(false);
  const [wonPrizes, setWonPrizes] = useState<ScratchItem[]>([]);

  const totalRounds = 3;
  const config = ROUND_CONFIGS[currentRound];

  const handleAllRevealed = useCallback(() => {
    const counts: Record<string, number> = {};
    grid.forEach(item => {
      counts[item.id] = (counts[item.id] || 0) + 1;
    });
    const winner = Object.entries(counts).find(([, count]) => count >= 3);
    if (winner) {
      const wonItem = ALL_ITEMS.find(i => i.id === winner[0])!;
      setRoundResult('win');
      setWonPrizes(p => [...p, wonItem]);
      setShowCelebration(true);
      setTimeout(() => setShowCelebration(false), 2000);
    } else {
      setRoundResult('lose');
    }
  }, [grid]);

  const handleNext = () => {
    if (currentRound < totalRounds - 1) {
      const nextRound = currentRound + 1;
      const nextConfig = ROUND_CONFIGS[nextRound];
      setCurrentRound(nextRound);
      setRoundResult('pending');
      if (nextConfig.type === 'win' && nextConfig.winnerId) {
        setGrid(generateWinningGrid(nextConfig.winnerId));
      } else {
        setGrid(generateLosingGrid());
      }
    } else {
      onComplete();
    }
  };

  return (
    <div className="min-h-[100dvh] bg-foreground flex flex-col">
      {/* Logo bar */}
      <div className="bg-primary py-4 px-4">
        <div className="max-w-4xl mx-auto flex items-center justify-center -translate-x-2">
          <img src={centauroLogo} alt="Centauro" className="h-14 md:h-20 object-contain brightness-0 invert" />
          <div className="w-px h-8 bg-primary-foreground/30 ml-2 mr-4" />
          <img src={cbfLogo} alt="CBF" className="h-14 md:h-20 object-contain" />
        </div>
      </div>

      {/* Progress dots */}
      <div className="bg-foreground py-4 px-4">
        <div className="flex items-center justify-center gap-3">
          {Array.from({ length: totalRounds }).map((_, i) => (
            <div key={i} className="flex items-center gap-2">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-sm transition-all duration-300 ${
                  i < currentRound
                    ? 'bg-centauro-green text-primary-foreground scale-90'
                    : i === currentRound
                    ? 'bg-centauro-gold text-foreground scale-110 ring-2 ring-centauro-gold/50 ring-offset-2 ring-offset-foreground'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {i < currentRound ? (
                  <Star size={18} className="fill-current" />
                ) : (
                  i + 1
                )}
              </div>
              {i < totalRounds - 1 && (
                <div className={`w-8 h-0.5 transition-colors duration-300 ${
                  i < currentRound ? 'bg-centauro-green' : 'bg-muted'
                }`} />
              )}
            </div>
          ))}
        </div>
        <p className="text-center text-primary-foreground/60 text-xs font-bold mt-2">
          Chance {currentRound + 1} de {totalRounds}
        </p>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center px-4 py-6">
        <div className="w-full max-w-xs">
          {/* Round title */}
          <div className="text-center mb-4">
            <h2 className="text-xl font-black text-primary-foreground mb-1">
              {roundResult === 'win' ? '🎉 VOCÊ GANHOU!' : roundResult === 'lose' ? '😔 Não foi dessa vez...' : `🎰 ${config.title}`}
            </h2>
            <p className="text-primary-foreground/50 text-xs font-semibold">
              {roundResult === 'pending'
                ? 'Raspe todos os campos! 3 iguais = prêmio'
                : roundResult === 'win'
                ? `Parabéns! Você ganhou ${wonPrizes[wonPrizes.length - 1]?.emoji} ${wonPrizes[wonPrizes.length - 1]?.label}!`
                : 'Tente novamente na próxima chance!'
              }
            </p>
          </div>

          {/* Scratch Grid */}
          <div key={currentRound} className="animate-scale-in">
            <ScratchGrid grid={grid} onAllRevealed={handleAllRevealed} />
          </div>

          {/* Legend */}
          <div className="mt-3 text-center">
            <p className="text-[10px] text-primary-foreground/30 font-semibold">
              Encontre 3 iguais para ganhar o prêmio correspondente
            </p>
          </div>

          {/* Action button */}
          {roundResult !== 'pending' && (
            <div className="mt-5 animate-fade-in">
              <Button
                onClick={handleNext}
                className="w-full bg-centauro-green hover:bg-centauro-green/80 text-primary-foreground font-black text-lg py-6 rounded-lg"
              >
                {currentRound < totalRounds - 1 ? (
                  <>
                    Próxima chance
                    <ChevronRight size={20} />
                  </>
                ) : (
                  <>
                    Resgatar prêmios
                    <Gift size={20} />
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Won prizes summary */}
          {wonPrizes.length > 0 && (
            <div className="mt-4 space-y-2 animate-fade-in">
              <p className="text-primary-foreground/40 text-[10px] font-bold text-center uppercase tracking-wider">
                Prêmios ganhos
              </p>
              <div className="flex justify-center gap-2 flex-wrap">
                {wonPrizes.map((prize, i) => (
                  <div
                    key={i}
                    className="bg-centauro-green/20 border border-centauro-green/30 rounded-full px-3 py-1 flex items-center gap-1.5"
                  >
                    <span className="text-base">{prize.emoji}</span>
                    <span className="text-xs font-bold text-centauro-green">{prize.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Celebration overlay */}
      {showCelebration && (
        <div className="fixed inset-0 pointer-events-none z-50">
          {[...Array(25)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-float-up text-3xl"
              style={{
                left: `${Math.random() * 100}%`,
                top: '100%',
                animationDelay: `${Math.random() * 0.3}s`,
                animationDuration: `${1.5 + Math.random()}s`,
              }}
            >
              {['🎉', '🎊', '⭐', '🏆', '💰'][Math.floor(Math.random() * 5)]}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
