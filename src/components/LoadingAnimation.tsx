import { useState, useEffect } from 'react';
import { CheckCircle } from 'lucide-react';

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
    <div className="min-h-screen bg-accent flex items-center justify-center relative overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-primary" />
        <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-primary" />
      </div>

      <div className="relative z-10 text-center px-6">
        {!showSuccess ? (
          <>
            <div className="mb-12 relative h-40 flex items-center justify-center">
              <div
                className="text-8xl"
                style={{
                  animation: 'pulse 1.5s ease-in-out infinite',
                  transform: `translateX(${progress * 1.5}px)`,
                  transition: 'transform 0.3s',
                }}
              >
                ⚽
              </div>
            </div>

            <h2 className="text-4xl md:text-5xl font-black text-accent-foreground mb-8 tracking-tight">
              VERIFICANDO SEUS PRÊMIOS
            </h2>

            <div className="max-w-md mx-auto">
              <div className="bg-accent-foreground/20 rounded-full h-6 overflow-hidden border-2 border-accent-foreground/30 mb-4">
                <div
                  className="h-full bg-primary transition-all duration-300 flex items-center justify-center rounded-full"
                  style={{ width: `${progress}%` }}
                >
                  {progress > 15 && (
                    <span className="text-primary-foreground font-bold text-xs">{progress}%</span>
                  )}
                </div>
              </div>
              <p className="text-accent-foreground font-bold text-lg">
                {progress < 33 ? 'Processando...' : progress < 66 ? 'Validando...' : 'Finalizando...'}
              </p>
            </div>
          </>
        ) : (
          <>
            {/* Confetti */}
            <div className="fixed inset-0 pointer-events-none">
              {[...Array(40)].map((_, i) => (
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
                  {['🎉', '🎊', '⭐', '🏆', '🎈'][Math.floor(Math.random() * 5)]}
                </div>
              ))}
            </div>

            <div className="animate-bounce">
              <CheckCircle className="w-32 h-32 text-centauro-green mx-auto mb-6" />
            </div>

            <h1 className="text-6xl md:text-7xl font-black text-accent-foreground mb-4 tracking-tight">
              APTO!
            </h1>
            <p className="text-3xl md:text-4xl font-black text-primary mb-3">
              VOCÊ GANHOU SEUS PRÊMIOS
            </p>
            <p className="text-xl font-bold text-accent-foreground/80">
              Camisa Brasil + Álbum Copa 2026
            </p>
          </>
        )}
      </div>
    </div>
  );
}
