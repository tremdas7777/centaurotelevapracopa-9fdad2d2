import { useState, useEffect } from 'react';
import { CheckCircle, Mail, Phone, MapPin } from 'lucide-react';

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
    <div className="bg-primary flex flex-col relative overflow-hidden">
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{ backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 20px, rgba(255,255,255,0.15) 20px, rgba(255,255,255,0.15) 40px)' }} />
      </div>

      <div className="min-h-screen flex items-center justify-center relative z-10 text-center px-6">
        {!showSuccess ? (
          <>
            <div>
              <div className="mb-10 text-7xl" style={{ animation: 'pulse 1.5s ease-in-out infinite' }}>
                ⚽
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
            </div>
          </>
        ) : (
          <>
            <div className="fixed inset-0 pointer-events-none">
              {[...Array(30)].map((_, i) => (
                <div
                  key={i}
                  className="absolute animate-float-up text-2xl"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: '100%',
                    animationDelay: `${Math.random() * 0.5}s`,
                    animationDuration: `${2 + Math.random()}s`,
                  }}
                >
                  {['🎉', '🎊', '⭐', '🏆'][Math.floor(Math.random() * 4)]}
                </div>
              ))}
            </div>

            <div>
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
            </div>
          </>
        )}
      </div>

      {/* Footer vermelho */}
      <footer className="relative z-10 bg-primary border-t border-primary-foreground/10 py-8 px-4">
        <div className="max-w-xl mx-auto text-primary-foreground">
          <div className="mb-5">
            <h4 className="font-bold text-sm mb-2">Contato</h4>
            <div className="flex items-center gap-2 mb-1.5">
              <Mail size={14} className="opacity-80" />
              <span className="text-xs opacity-80">sac@centauro.com.br</span>
            </div>
            <div className="flex items-center gap-2 mb-1.5">
              <Phone size={14} className="opacity-80" />
              <span className="text-xs opacity-80">+55 (11) 3003-4916</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin size={14} className="opacity-80" />
              <span className="text-xs opacity-80">São Paulo, SP - Brasil</span>
            </div>
          </div>

          <div className="mb-5">
            <h4 className="font-bold text-sm mb-2">Informação Legal</h4>
            <p className="text-xs opacity-80"><strong>CNPJ:</strong> 06.347.409/0001-90</p>
            <p className="text-xs opacity-80"><strong>Razão Social:</strong> SBF Comércio de Produtos Esportivos S.A.</p>
          </div>

          <div className="border-t border-primary-foreground/20 pt-4 mb-5">
            <h4 className="font-bold text-sm mb-2">Segurança e Confiança</h4>
            <div className="grid grid-cols-2 gap-1.5">
              <span className="text-xs opacity-80">✓ SSL 256-bit Cifrado</span>
              <span className="text-xs opacity-80">✓ Garantia de 30 dias</span>
              <span className="text-xs opacity-80">✓ Suporte 24/7</span>
              <span className="text-xs opacity-80">✓ Dados Protegidos</span>
            </div>
          </div>

          <div className="border-t border-primary-foreground/20 pt-4 text-center">
            <p className="text-[10px] opacity-60">© 2026 SBF Comércio de Produtos Esportivos S.A. Todos os direitos reservados.</p>
            <p className="text-[10px] opacity-60 mt-1">Promoção válida enquanto durar o estoque.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
