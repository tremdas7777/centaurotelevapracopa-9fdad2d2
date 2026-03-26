import { useState, useRef, useEffect, useCallback } from 'react';
import { Gift, Star, Sparkles, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Prize {
  label: string;
  emoji: string;
  description: string;
}

const PRIZES: Prize[] = [
  { label: 'FRETE GRÁTIS', emoji: '🚚', description: 'Frete grátis na sua compra!' },
  { label: 'R$50 OFF', emoji: '💰', description: 'Desconto de R$50 no pedido!' },
  { label: 'CAMISA BRASIL', emoji: '👕', description: 'Camisa oficial da Seleção!' },
];

interface ScratchCardProps {
  onComplete: () => void;
}

function ScratchCanvas({ prize, onRevealed }: { prize: Prize; onRevealed: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawing = useRef(false);
  const revealed = useRef(false);
  const [percentScratched, setPercentScratched] = useState(0);

  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * 2;
    canvas.height = rect.height * 2;
    ctx.scale(2, 2);

    // Gold gradient scratch layer
    const gradient = ctx.createLinearGradient(0, 0, rect.width, rect.height);
    gradient.addColorStop(0, '#C9A84C');
    gradient.addColorStop(0.3, '#E8D48B');
    gradient.addColorStop(0.5, '#F5E6A3');
    gradient.addColorStop(0.7, '#E8D48B');
    gradient.addColorStop(1, '#C9A84C');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, rect.width, rect.height);

    // Scratch pattern text
    ctx.fillStyle = 'rgba(0,0,0,0.12)';
    ctx.font = 'bold 11px Inter, sans-serif';
    ctx.textAlign = 'center';
    for (let y = 20; y < rect.height; y += 28) {
      for (let x = 30; x < rect.width; x += 100) {
        ctx.fillText('RASPE AQUI', x, y);
      }
    }

    // Stars decorations
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.font = '16px serif';
    const starPositions = [
      [20, 25], [rect.width - 30, 25],
      [20, rect.height - 15], [rect.width - 30, rect.height - 15],
      [rect.width / 2, 18], [rect.width / 2, rect.height - 10],
    ];
    starPositions.forEach(([x, y]) => ctx.fillText('✦', x, y));
  }, []);

  useEffect(() => {
    initCanvas();
  }, [initCanvas]);

  const scratch = useCallback((x: number, y: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(x, y, 22, 0, Math.PI * 2);
    ctx.fill();

    // Check percentage
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    let transparent = 0;
    for (let i = 3; i < imageData.data.length; i += 4) {
      if (imageData.data[i] === 0) transparent++;
    }
    const pct = (transparent / (imageData.data.length / 4)) * 100;
    setPercentScratched(pct);

    if (pct > 45 && !revealed.current) {
      revealed.current = true;
      // Clear remaining with animation
      setTimeout(() => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        onRevealed();
      }, 300);
    }
  }, [onRevealed]);

  const getPos = (e: React.TouchEvent | React.MouseEvent) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    if ('touches' in e) {
      return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
    }
    return { x: (e as React.MouseEvent).clientX - rect.left, y: (e as React.MouseEvent).clientY - rect.top };
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
    <div className="relative w-full aspect-[2/1] rounded-xl overflow-hidden border-2 border-centauro-gold/50 shadow-lg">
      {/* Prize underneath */}
      <div className="absolute inset-0 bg-gradient-to-br from-centauro-green/20 via-background to-centauro-green/10 flex flex-col items-center justify-center gap-2">
        <span className="text-5xl">{prize.emoji}</span>
        <span className="text-2xl md:text-3xl font-black text-foreground tracking-tight">{prize.label}</span>
        <span className="text-xs text-muted-foreground font-semibold">{prize.description}</span>
      </div>

      {/* Scratch canvas on top */}
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

      {/* Hint */}
      {percentScratched < 5 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none animate-pulse">
          <div className="bg-foreground/80 text-primary-foreground px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2">
            <Sparkles size={16} />
            Raspe com o dedo!
          </div>
        </div>
      )}
    </div>
  );
}

export default function ScratchCard({ onComplete }: ScratchCardProps) {
  const [currentCard, setCurrentCard] = useState(0);
  const [revealedPrizes, setRevealedPrizes] = useState<Prize[]>([]);
  const [showCelebration, setShowCelebration] = useState(false);
  const [cardRevealed, setCardRevealed] = useState(false);

  const totalCards = 3;

  const handleRevealed = () => {
    setCardRevealed(true);
    setRevealedPrizes(prev => [...prev, PRIZES[currentCard]]);
    setShowCelebration(true);
    setTimeout(() => setShowCelebration(false), 1500);
  };

  const handleNext = () => {
    if (currentCard < totalCards - 1) {
      setCardRevealed(false);
      setCurrentCard(prev => prev + 1);
    } else {
      onComplete();
    }
  };

  return (
    <div className="min-h-screen bg-foreground flex flex-col">
      {/* Header */}
      <div className="bg-primary py-4 px-4">
        <div className="max-w-4xl mx-auto flex items-center justify-center">
          <Gift className="text-centauro-gold mr-3" size={28} />
          <h1 className="text-xl md:text-2xl font-black text-primary-foreground tracking-tight">
            RASPADINHA DA SORTE
          </h1>
        </div>
      </div>

      {/* Progress dots */}
      <div className="bg-foreground py-4 px-4">
        <div className="flex items-center justify-center gap-3">
          {Array.from({ length: totalCards }).map((_, i) => (
            <div key={i} className="flex items-center gap-2">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-sm transition-all duration-300 ${
                  i < currentCard
                    ? 'bg-centauro-green text-primary-foreground scale-90'
                    : i === currentCard
                    ? 'bg-centauro-gold text-foreground scale-110 ring-2 ring-centauro-gold/50 ring-offset-2 ring-offset-foreground'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {i < currentCard ? (
                  <Star size={18} className="fill-current" />
                ) : (
                  i + 1
                )}
              </div>
              {i < totalCards - 1 && (
                <div className={`w-8 h-0.5 transition-colors duration-300 ${
                  i < currentCard ? 'bg-centauro-green' : 'bg-muted'
                }`} />
              )}
            </div>
          ))}
        </div>
        <p className="text-center text-primary-foreground/60 text-xs font-bold mt-2">
          Chance {currentCard + 1} de {totalCards}
        </p>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center px-5 py-8">
        <div className="w-full max-w-sm">
          {/* Title */}
          <div className="text-center mb-6 animate-fade-in">
            <h2 className="text-2xl font-black text-primary-foreground mb-1">
              {cardRevealed ? '🎉 PRÊMIO REVELADO!' : '🎰 Raspe e descubra!'}
            </h2>
            <p className="text-primary-foreground/50 text-sm font-semibold">
              {cardRevealed
                ? 'Parabéns! Continue raspando!'
                : 'Use o dedo para raspar o cartão'
              }
            </p>
          </div>

          {/* Scratch Card */}
          <div key={currentCard} className="animate-scale-in">
            <ScratchCanvas
              prize={PRIZES[currentCard]}
              onRevealed={handleRevealed}
            />
          </div>

          {/* Action button */}
          {cardRevealed && (
            <div className="mt-6 animate-fade-in">
              <Button
                onClick={handleNext}
                className="w-full bg-centauro-green hover:bg-centauro-green/80 text-primary-foreground font-black text-lg py-6 rounded-lg"
              >
                {currentCard < totalCards - 1 ? (
                  <>
                    Próxima raspadinha
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

          {/* Revealed prizes summary */}
          {revealedPrizes.length > 0 && (
            <div className="mt-6 space-y-2 animate-fade-in">
              <p className="text-primary-foreground/40 text-xs font-bold text-center uppercase tracking-wider">
                Prêmios ganhos
              </p>
              <div className="flex justify-center gap-2 flex-wrap">
                {revealedPrizes.map((prize, i) => (
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
