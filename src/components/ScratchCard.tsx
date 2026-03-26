import { useState, useRef, useCallback } from 'react';
import { Gift, Star, ChevronRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import CentauroHeader from '@/components/CentauroHeader';

interface ScratchItem {
  id: string;
  label: string;
  emoji: string;
}

const ALL_ITEMS: ScratchItem[] = [
  { id: 'bola', label: 'Bola', emoji: '⚽' },
  { id: 'trofeu', label: 'Troféu', emoji: '🏆' },
  { id: 'chuteira', label: 'Chuteira', emoji: '👟' },
  { id: 'bandeira', label: 'Bandeira', emoji: '🇧🇷' },
  { id: 'album', label: 'Álbum', emoji: '📖' },
  { id: 'camisa', label: 'Camisa', emoji: '👕' },
];

// Generate a grid where NO item appears 3+ times (no winner)
function generateLosingGrid(): ScratchItem[] {
  const grid: ScratchItem[] = [];
  const counts: Record<string, number> = {};

  // Shuffle all items and pick ensuring max 2 of each
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
    // Safety: after many iterations just fill
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

// Generate a grid where the winning item appears exactly 3 times
function generateWinningGrid(winnerId: string): ScratchItem[] {
  const winner = ALL_ITEMS.find(i => i.id === winnerId)!;
  const others = ALL_ITEMS.filter(i => i.id !== winnerId);
  const grid: ScratchItem[] = [];

  // Place 3 winners
  for (let i = 0; i < 3; i++) {
    grid.push({ ...winner });
  }

  // Fill remaining 6 with others (max 2 each)
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

// Round configs: round 0 = lose, round 1 = win album, round 2 = win camisa
const ROUND_CONFIGS = [
  { type: 'lose' as const, winnerId: null, title: 'Tente a sorte!' },
  { type: 'win' as const, winnerId: 'album', title: 'Segunda chance!' },
  { type: 'win' as const, winnerId: 'camisa', title: 'Última chance!' },
];

interface ScratchCellProps {
  item: ScratchItem;
  index: number;
  revealed: boolean;
  onScratch: (index: number) => void;
}

function ScratchCell({ item, index, revealed, onScratch }: ScratchCellProps) {
  const cellRef = useRef<HTMLDivElement>(null);
  const scratchAmount = useRef(0);
  const [localRevealed, setLocalRevealed] = useState(false);
  const isRevealed = revealed || localRevealed;

  const handleInteraction = useCallback((clientX: number, clientY: number) => {
    if (isRevealed) return;
    scratchAmount.current += 1;
    if (scratchAmount.current >= 3) {
      setLocalRevealed(true);
      onScratch(index);
    }
  }, [isRevealed, index, onScratch]);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (e.buttons === 1) handleInteraction(e.clientX, e.clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    e.preventDefault();
    handleInteraction(e.touches[0].clientX, e.touches[0].clientY);
  };

  const handleClick = () => {
    if (!isRevealed) {
      setLocalRevealed(true);
      onScratch(index);
    }
  };

  return (
    <div
      ref={cellRef}
      className="relative aspect-square rounded-xl overflow-hidden cursor-pointer select-none touch-none"
      onMouseDown={handleClick}
      onMouseMove={handleMouseMove}
      onTouchStart={(e) => { e.preventDefault(); handleClick(); }}
      onTouchMove={handleTouchMove}
    >
      {/* Prize underneath */}
      <div className="absolute inset-0 bg-gradient-to-br from-muted to-background flex flex-col items-center justify-center gap-0.5 border border-border rounded-xl">
        <span className="text-3xl md:text-4xl">{item.emoji}</span>
        <span className="text-[10px] md:text-xs font-bold text-foreground/70">{item.label}</span>
      </div>

      {/* Gold scratch overlay */}
      {!isRevealed && (
        <div className="absolute inset-0 rounded-xl flex items-center justify-center transition-opacity duration-300"
          style={{
            background: 'linear-gradient(135deg, #C9A84C, #E8D48B, #F5E6A3, #E8D48B, #C9A84C)',
          }}
        >
          <div className="text-center">
            <Sparkles size={20} className="mx-auto mb-1 text-foreground/30" />
            <span className="text-[10px] font-bold text-foreground/40 uppercase tracking-wider">Raspe</span>
          </div>
        </div>
      )}
    </div>
  );
}

interface ScratchCardProps {
  onComplete: () => void;
}

export default function ScratchCard({ onComplete }: ScratchCardProps) {
  const [currentRound, setCurrentRound] = useState(0);
  const [revealedCells, setRevealedCells] = useState<boolean[]>(Array(9).fill(false));
  const [grid, setGrid] = useState<ScratchItem[]>(() => generateLosingGrid());
  const [roundResult, setRoundResult] = useState<'pending' | 'win' | 'lose'>('pending');
  const [showCelebration, setShowCelebration] = useState(false);
  const [wonPrizes, setWonPrizes] = useState<ScratchItem[]>([]);

  const totalRounds = 3;
  const config = ROUND_CONFIGS[currentRound];

  const checkResult = useCallback((newRevealed: boolean[]) => {
    const allRevealed = newRevealed.every(Boolean);
    if (!allRevealed) return;

    // Count items
    const counts: Record<string, number> = {};
    grid.forEach(item => {
      counts[item.id] = (counts[item.id] || 0) + 1;
    });

    const winner = Object.entries(counts).find(([, count]) => count >= 3);
    if (winner) {
      const wonItem = ALL_ITEMS.find(i => i.id === winner[0])!;
      setRoundResult('win');
      setWonPrizes(prev => [...prev, wonItem]);
      setShowCelebration(true);
      setTimeout(() => setShowCelebration(false), 2000);
    } else {
      setRoundResult('lose');
    }
  }, [grid]);

  const handleScratch = useCallback((index: number) => {
    setRevealedCells(prev => {
      const newRevealed = [...prev];
      newRevealed[index] = true;
      // Defer check to next tick so state is updated
      setTimeout(() => checkResult(newRevealed), 100);
      return newRevealed;
    });
  }, [checkResult]);

  const handleNext = () => {
    if (currentRound < totalRounds - 1) {
      const nextRound = currentRound + 1;
      const nextConfig = ROUND_CONFIGS[nextRound];
      setCurrentRound(nextRound);
      setRevealedCells(Array(9).fill(false));
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

  const revealedCount = revealedCells.filter(Boolean).length;

  return (
    <div className="min-h-[100dvh] bg-foreground flex flex-col">
      {/* Centauro + CBF Header */}
      <CentauroHeader />

      {/* Title bar */}
      <div className="bg-primary py-3 px-4">
        <div className="max-w-4xl mx-auto flex items-center justify-center">
          <Gift className="text-centauro-gold mr-3" size={24} />
          <h1 className="text-lg md:text-xl font-black text-primary-foreground tracking-tight">
            RASPADINHA DA SORTE
          </h1>
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
                index={i}
                revealed={revealedCells[i]}
                onScratch={handleScratch}
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
