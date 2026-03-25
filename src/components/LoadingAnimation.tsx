import { useState, useEffect } from 'react';
import { CheckCircle, Star, Trophy, Sparkles, PartyPopper, CircleDot } from 'lucide-react';

interface LoadingAnimationProps {
  onComplete: () => void;
}

export default function LoadingAnimation({ onComplete }: LoadingAnimationProps) {
  const [progress, setProgress] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => setShowSuccess(true), 500);
          return 100;
        }
        return prev + 2;
      });
    }, 50);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (showSuccess) {
      setTimeout(() => onComplete(), 2500);
    }
  }, [showSuccess, onComplete]);

  return (
    <div className="min-h-screen bg-primary flex items-center justify-center relative overflow-hidden">
      {/* Diagonal stripes pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{ backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 20px, rgba(255,255,255,0.15) 20px, rgba(255,255,255,0.15) 40px)' }} />
      </div>

      <div className="relative z-10 text-center px-6">
        {!showSuccess ? (
          <>
            <div className="mb-10" style={{ animation: 'pulse 1.5s ease-in-out infinite' }}>
              <CircleDot className="w-16 h-16 text-primary-foreground mx-auto" />
            </div>

            <h2 className="text-3xl md:text-4xl font-black text-primary-foreground mb-8 tracking-tight">
              VERIFICANDO SEUS PRÊMIOS
            </h2>

            <div className="max-w-sm mx-auto">
              <div className="bg-primary-foreground/20 rounded-full h-4 overflow-hidden border border-primary-foreground/30 mb-3">
                <div
                  className="h-full bg-primary-foreground transition-all duration-300 rounded-full flex items-center justify-center"
                  style={{ width: `${progress}%` }}
                >
                  {progress > 20 && (
                    <span className="text-primary font-black text-[10px]">{progress}%</span>
                  )}
                </div>
              </div>
              <p className="text-primary-foreground/80 font-bold text-sm">
                {progress < 33 ? 'Processando...' : progress < 66 ? 'Validando...' : 'Finalizando...'}
              </p>
            </div>
          </>
        ) : (
          <>
            <div className="fixed inset-0 pointer-events-none">
              {[...Array(30)].map((_, i) => {
                const icons = [Star, Trophy, Sparkles, PartyPopper];
                const Icon = icons[i % 4];
                return (
                  <div
                    key={i}
                    className="absolute animate-float-up"
                    style={{
                      left: `${Math.random() * 100}%`,
                      top: '100%',
                      animationDelay: `${Math.random() * 0.5}s`,
                      animationDuration: `${2 + Math.random()}s`,
                    }}
                  >
                    <Icon size={20} className="text-primary-foreground/60" />
                  </div>
                );
              })}
            </div>

            <div className="animate-bounce">
              <CheckCircle className="w-24 h-24 text-primary-foreground mx-auto mb-5" />
            </div>
            <h1 className="text-5xl md:text-6xl font-black text-primary-foreground mb-3 tracking-tight">
              APTO!
            </h1>
            <p className="text-2xl md:text-3xl font-black text-centauro-gold mb-2">
              VOCÊ GANHOU SEUS PRÊMIOS
            </p>
            <p className="text-lg font-semibold text-primary-foreground/80">
              Camisa Brasil + Álbum Copa 2026
            </p>
          </>
        )}
      </div>
    </div>
  );
}
