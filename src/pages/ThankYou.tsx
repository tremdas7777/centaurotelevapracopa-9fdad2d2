import { useEffect, useState } from 'react';
import { CheckCircle, Package, Truck, Gift, ArrowRight, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import centauroLogo from '@/assets/centauro-logo.webp';
import cbfLogo from '@/assets/cbf-logo.webp';

export default function ThankYou() {
  const [showConfetti, setShowConfetti] = useState(true);

  useEffect(() => {
    window.scrollTo(0, 0);
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', '#212121');
    document.documentElement.style.backgroundColor = '#212121';
    document.body.style.backgroundColor = '#212121';

    const timer = setTimeout(() => setShowConfetti(false), 4000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-background" style={{ fontFamily: "'Rubik', 'Inter', system-ui, sans-serif" }}>
      {/* Header */}
      <div className="bg-primary py-4 px-4">
        <div className="max-w-4xl mx-auto flex items-center justify-center -translate-x-2">
          <img src={centauroLogo} alt="Centauro" className="h-14 md:h-20 object-contain brightness-0 invert" />
          <div className="w-px h-8 bg-primary-foreground/30 ml-2 mr-4" />
          <img src={cbfLogo} alt="CBF" className="h-14 md:h-20 object-contain" />
        </div>
      </div>

      {/* Success Banner */}
      <div className="bg-centauro-green py-3 px-4">
        <div className="max-w-lg mx-auto flex items-center justify-center gap-2 text-primary-foreground">
          <ShieldCheck size={20} />
          <span className="text-sm font-bold tracking-wide uppercase">Pagamento Confirmado</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-lg mx-auto px-4 py-8">
        {/* Success Icon */}
        <div className="flex flex-col items-center mb-8 relative">
          {showConfetti && (
            <div className="absolute -top-4 left-0 right-0 flex justify-center pointer-events-none">
              {[...Array(12)].map((_, i) => (
                <div
                  key={i}
                  className="w-2 h-2 rounded-full absolute animate-bounce"
                  style={{
                    backgroundColor: ['#E60000', '#FFD700', '#00A651', '#FFFFFF', '#0066CC'][i % 5],
                    left: `${15 + (i * 6)}%`,
                    animationDelay: `${i * 0.15}s`,
                    animationDuration: `${0.8 + (i * 0.1)}s`,
                  }}
                />
              ))}
            </div>
          )}
          <div className="w-20 h-20 rounded-full bg-centauro-green/10 flex items-center justify-center mb-4 ring-4 ring-centauro-green/20">
            <CheckCircle className="text-centauro-green" size={48} strokeWidth={2.5} />
          </div>
          <h1 className="text-2xl font-black text-foreground text-center uppercase tracking-tight">
            Obrigado pela compra!
          </h1>
          <p className="text-muted-foreground text-center mt-2 text-sm leading-relaxed max-w-xs">
            Seu pedido foi confirmado com sucesso. Você receberá os detalhes por e-mail.
          </p>
        </div>

        {/* Order Steps */}
        <div className="space-y-4 mb-8">
          <div className="flex items-start gap-4 bg-card rounded-xl p-4 border border-border shadow-sm">
            <div className="w-10 h-10 rounded-lg bg-centauro-green/10 flex items-center justify-center flex-shrink-0">
              <CheckCircle className="text-centauro-green" size={22} />
            </div>
            <div>
              <p className="font-bold text-foreground text-sm">Pagamento aprovado</p>
              <p className="text-muted-foreground text-xs mt-0.5">O valor foi confirmado e seu pedido está sendo processado.</p>
            </div>
          </div>

          <div className="flex items-start gap-4 bg-card rounded-xl p-4 border border-border shadow-sm">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Package className="text-primary" size={22} />
            </div>
            <div>
              <p className="font-bold text-foreground text-sm">Preparando seu pedido</p>
              <p className="text-muted-foreground text-xs mt-0.5">Os itens estão sendo separados para envio.</p>
            </div>
          </div>

          <div className="flex items-start gap-4 bg-card rounded-xl p-4 border border-border shadow-sm">
            <div className="w-10 h-10 rounded-lg bg-centauro-gold/10 flex items-center justify-center flex-shrink-0">
              <Truck className="text-centauro-gold" size={22} />
            </div>
            <div>
              <p className="font-bold text-foreground text-sm">Envio via Correios SEDEX</p>
              <p className="text-muted-foreground text-xs mt-0.5">O código de rastreio será enviado ao seu e-mail assim que disponível.</p>
            </div>
          </div>

          <div className="flex items-start gap-4 bg-card rounded-xl p-4 border border-border shadow-sm">
            <div className="w-10 h-10 rounded-lg bg-centauro-green/10 flex items-center justify-center flex-shrink-0">
              <Gift className="text-centauro-green" size={22} />
            </div>
            <div>
              <p className="font-bold text-foreground text-sm">Sorteio VIP incluso!</p>
              <p className="text-muted-foreground text-xs mt-0.5">Sua participação no sorteio de ingressos VIP Copa 2026 já está confirmada.</p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="space-y-3">
          <Button
            className="w-full h-14 text-base font-black uppercase tracking-wider bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl shadow-lg"
            onClick={() => window.location.href = '/'}
          >
            <ArrowRight size={18} className="mr-2" />
            Voltar ao início
          </Button>
        </div>

        {/* Security Footer */}
        <div className="mt-8 pt-6 border-t border-border">
          <div className="flex items-center justify-center gap-2 text-muted-foreground mb-3">
            <ShieldCheck size={14} />
            <span className="text-[11px] font-medium uppercase tracking-wider">Compra 100% segura</span>
          </div>
          <p className="text-center text-[10px] text-muted-foreground/70 leading-relaxed">
            Este é um site oficial da Centauro em parceria com a CBF. 
            Todos os seus dados estão protegidos com criptografia de ponta a ponta.
          </p>
        </div>
      </div>
    </div>
  );
}
