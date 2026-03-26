import { useState, useRef, useCallback, useEffect } from 'react';
import { Gift, Star, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import centauroLogo from '@/assets/centauro-logo.webp';
import cbfLogo from '@/assets/cbf-logo.webp';
import centauroLogoColor from '@/assets/centauro-logo.webp';
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

// Canvas-based scratch cell with real drag-to-reveal
function ScratchCell({ item, onRevealed }: { item: ScratchItem; onRevealed: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDrawing = useRef(false);
  const hasRevealed = useRef(false);
  const [revealed, setRevealed] = useState(false);

  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = container.getBoundingClientRect();
    const size = rect.width;
    canvas.width = size * 2;
    canvas.height = size * 2;
    ctx.scale(2, 2);

    // Gold gradient
    const gradient = ctx.createLinearGradient(0, 0, size, size);
    gradient.addColorStop(0, '#C9A84C');
    gradient.addColorStop(0.3, '#E8D48B');
    gradient.addColorStop(0.5, '#F5E6A3');
    gradient.addColorStop(0.7, '#E8D48B');
    gradient.addColorStop(1, '#C9A84C');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);

    // Load and draw Centauro logo
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const logoW = size * 0.5;
      const logoH = (img.height / img.width) * logoW;
      const x = (size - logoW) / 2;
      const y = (size - logoH) / 2;
      ctx.globalAlpha = 0.2;
      ctx.drawImage(img, x, y, logoW, logoH);
      ctx.globalAlpha = 1.0;
    };
    img.src = centauroLogoColor;

    // Subtle text
    ctx.fillStyle = 'rgba(0,0,0,0.08)';
    ctx.font = `bold ${Math.max(8, size * 0.08)}px Inter, sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('RASPE', size / 2, size * 0.25);
    ctx.fillText('AQUI', size / 2, size * 0.82);
  }, []);

  useEffect(() => {
    initCanvas();
  }, [initCanvas]);

  const scratch = useCallback((x: number, y: number) => {
    const canvas = canvasRef.current;
    if (!canvas || hasRevealed.current) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(x, y, 18, 0, Math.PI * 2);
    ctx.fill();

    // Check percentage
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    let transparent = 0;
    for (let i = 3; i < imageData.data.length; i += 16) {
      if (imageData.data[i] === 0) transparent++;
    }
    const total = imageData.data.length / 16;
    const pct = (transparent / total) * 100;

    if (pct > 50 && !hasRevealed.current) {
      hasRevealed.current = true;
      setTimeout(() => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        setRevealed(true);
        onRevealed();
      }, 200);
    }
  }, [onRevealed]);

  const getPos = (e: React.TouchEvent | React.MouseEvent) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const scaleX = (canvas.width / 2) / rect.width;
    const scaleY = (canvas.height / 2) / rect.height;
    if ('touches' in e) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX / scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY / scaleY,
      };
    }
    return {
      x: ((e as React.MouseEvent).clientX - rect.left),
      y: ((e as React.MouseEvent).clientY - rect.top),
    };
  };

  const handleStart = (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    isDrawing.current = true;
    const pos = getPos(e);
    scratch(pos.x, pos.y);
  };

  const handleMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (!isDrawing.current) return;
    e.preventDefault();
    const pos = getPos(e);
    scratch(pos.x, pos.y);
  };

  const handleEnd = () => {
    isDrawing.current = false;
  };

  return (
    <div ref={containerRef} className="relative aspect-square rounded-xl overflow-hidden border border-border">
      {/* Prize underneath */}
      <div className="absolute inset-0 bg-gradient-to-br from-muted to-background flex flex-col items-center justify-center gap-0.5">
        {item.image ? (
          <>
            <img src={item.image} alt={item.label} className="w-3/4 h-3/4 object-contain" />
            <span className="text-[9px] md:text-[10px] font-bold text-foreground/70">{item.label}</span>
          </>
        ) : (
          <>
            <span className="text-3xl md:text-4xl">{item.emoji}</span>
            <span className="text-[9px] md:text-[10px] font-bold text-foreground/70">{item.label}</span>
          </>
        )}
      </div>

      {/* Canvas scratch layer */}
      {!revealed && (
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full cursor-pointer touch-none"
          onMouseDown={handleStart}
          onMouseMove={handleMove}
          onMouseUp={handleEnd}
          onMouseLeave={handleEnd}
          onTouchStart={handleStart}
          onTouchMove={handleMove}
          onTouchEnd={handleEnd}
        />
      )}
    </div>
  );
}

interface ScratchCardProps {
  onComplete: () => void;
}

export default function ScratchCard({ onComplete }: ScratchCardProps) {
  const [currentRound, setCurrentRound] = useState(0);
  const [revealedCount, setRevealedCount] = useState(0);
  const [grid, setGrid] = useState<ScratchItem[]>(() => generateLosingGrid());
  const [roundResult, setRoundResult] = useState<'pending' | 'win' | 'lose'>('pending');
  const [showCelebration, setShowCelebration] = useState(false);
  const [wonPrizes, setWonPrizes] = useState<ScratchItem[]>([]);

  const totalRounds = 3;
  const config = ROUND_CONFIGS[currentRound];

  const handleCellRevealed = useCallback(() => {
    setRevealedCount(prev => {
      const newCount = prev + 1;
      if (newCount >= 9) {
        // All revealed, check result
        setTimeout(() => {
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
        }, 300);
      }
      return newCount;
    });
  }, [grid]);

  const handleNext = () => {
    if (currentRound < totalRounds - 1) {
      const nextRound = currentRound + 1;
      const nextConfig = ROUND_CONFIGS[nextRound];
      setCurrentRound(nextRound);
      setRevealedCount(0);
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
      {/* Logo bar only (no banner image) */}
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

          {/* Progress bar */}
          <div className="mb-4">
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

          {/* 3x3 Grid */}
          <div className="grid grid-cols-3 gap-2 animate-scale-in" key={currentRound}>
            {grid.map((item, i) => (
              <ScratchCell
                key={`${currentRound}-${i}`}
                item={item}
                onRevealed={handleCellRevealed}
              />
            ))}
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
