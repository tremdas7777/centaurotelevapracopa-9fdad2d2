import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Eye, EyeOff, LogOut, Save, Link2, Info, BarChart3, ShoppingCart, TrendingUp, Users, CheckCircle, ArrowDown, Trash2 } from 'lucide-react';
import centauroLogo from '@/assets/centauro-logo.png';
import { getFunnelStats, clearFunnelEvents } from '@/lib/funnelTracking';

const ADMIN_PASSWORD = 'escalabahia';

type Tab = 'analytics' | 'checkout';

export default function AdminPanel() {
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [checkoutUrl, setCheckoutUrl] = useState('');
  const [newCheckoutUrl, setNewCheckoutUrl] = useState('');
  const [message, setMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('analytics');
  const [period, setPeriod] = useState(30);
  const [stats, setStats] = useState({ visitors: 0, quizStarted: 0, quizCompleted: 0, checkout: 0, activeNow: 0 });

  useEffect(() => {
    const saved = localStorage.getItem('checkoutUrl');
    if (saved) {
      setCheckoutUrl(saved);
      setNewCheckoutUrl(saved);
    }
  }, []);

  // Auto-refresh stats every 30 seconds
  useEffect(() => {
    if (!isAuthenticated) return;
    const refresh = () => setStats(getFunnelStats(period));
    refresh();
    const interval = setInterval(refresh, 30000);
    return () => clearInterval(interval);
  }, [isAuthenticated, period]);

  const handleLogin = () => {
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      setPassword('');
      setMessage('');
    } else {
      setMessage('Senha incorreta!');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const handleSave = () => {
    if (!newCheckoutUrl.trim()) {
      setMessage('URL não pode estar vazia!');
      return;
    }
    try {
      localStorage.setItem('checkoutUrl', newCheckoutUrl);
      setCheckoutUrl(newCheckoutUrl);
      setMessage('Link salvo com sucesso!');
      setTimeout(() => setMessage(''), 3000);
    } catch {
      setMessage('Erro ao salvar!');
    }
  };

  const handleClearStats = () => {
    clearFunnelEvents();
    setStats(getFunnelStats(period));
  };

  const pct = (a: number, b: number) => (b === 0 ? 0 : Math.round((a / b) * 100));

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-secondary flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8 border border-border shadow-sm">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-black text-foreground">Painel Admin</h1>
            <p className="text-muted-foreground text-xs mt-1">Copa 2026 - Gerenciamento</p>
          </div>

          <div className="mb-4">
            <label className="block mb-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Senha</label>
            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                placeholder="Digite a senha"
                className="pr-10 font-semibold text-sm"
              />
              <button
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {message && (
            <div className={`p-2.5 rounded-md text-center text-xs font-bold mb-4 border ${
              message.includes('sucesso')
                ? 'bg-centauro-green/10 text-centauro-green border-centauro-green/30'
                : 'bg-destructive/10 text-destructive border-destructive/30'
            }`}>
              {message}
            </div>
          )}

          <Button onClick={handleLogin} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-sm">
            Acessar
          </Button>
        </Card>
      </div>
    );
  }

  const globalConversion = pct(stats.checkout, stats.visitors);

  const funnelSteps = [
    {
      icon: <Eye size={20} className="text-primary" />,
      title: 'Visitantes',
      description: 'Chegaram à landing page',
      count: stats.visitors,
      conversion: null as number | null,
      dropoff: `${pct(stats.quizStarted, stats.visitors)}% dos visitantes`,
      color: 'bg-primary',
      progressValue: 100,
    },
    {
      icon: <TrendingUp size={20} className="text-centauro-green" />,
      title: 'Quiz Iniciado',
      description: 'Clicaram em Começar',
      count: stats.quizStarted,
      conversion: pct(stats.quizStarted, stats.visitors),
      dropoff: `${pct(stats.quizCompleted, stats.quizStarted)}% dos iniciados`,
      color: 'bg-centauro-green',
      progressValue: stats.visitors > 0 ? (stats.quizStarted / stats.visitors) * 100 : 0,
    },
    {
      icon: <CheckCircle size={20} className="text-centauro-gold" />,
      title: 'Quiz Completado',
      description: 'Terminaram as 8 perguntas',
      count: stats.quizCompleted,
      conversion: pct(stats.quizCompleted, stats.visitors),
      dropoff: `${pct(stats.checkout, stats.quizCompleted)}% dos completados`,
      color: 'bg-centauro-gold',
      progressValue: stats.visitors > 0 ? (stats.quizCompleted / stats.visitors) * 100 : 0,
    },
    {
      icon: <ShoppingCart size={20} className="text-destructive" />,
      title: 'Checkout',
      description: 'Foram para o pagamento',
      count: stats.checkout,
      conversion: pct(stats.checkout, stats.visitors),
      dropoff: null as string | null,
      color: 'bg-destructive',
      progressValue: stats.visitors > 0 ? (stats.checkout / stats.visitors) * 100 : 0,
    },
  ];

  return (
    <div className="min-h-screen bg-secondary">
      {/* Top bar */}
      <div className="bg-primary py-3 px-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-primary-foreground font-black text-sm">Painel Admin</h1>
            <p className="text-primary-foreground/60 text-[10px]">Copa 2026 - Gerenciamento</p>
          </div>
          <Button
            onClick={() => { setIsAuthenticated(false); setPassword(''); setMessage(''); }}
            variant="ghost"
            size="sm"
            className="text-primary-foreground hover:bg-primary-foreground/10 text-xs font-bold"
          >
            <LogOut size={14} className="mr-1" /> Sair
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-border bg-background">
        <div className="max-w-3xl mx-auto flex">
          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex items-center gap-2 px-5 py-3 text-xs font-bold border-b-2 transition-colors ${
              activeTab === 'analytics'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <BarChart3 size={14} /> Analytics
          </button>
          <button
            onClick={() => setActiveTab('checkout')}
            className={`flex items-center gap-2 px-5 py-3 text-xs font-bold border-b-2 transition-colors ${
              activeTab === 'checkout'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Link2 size={14} /> Checkout
          </button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto p-4">
        {activeTab === 'analytics' && (
          <div>
            {/* Header */}
            <div className="flex items-start justify-between mb-2">
              <div>
                <h2 className="text-xl font-black text-foreground">Funil de Conversão</h2>
                <p className="text-muted-foreground text-xs">Atualização automática a cada 30 segundos</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1.5 bg-centauro-green/10 text-centauro-green text-xs font-bold px-3 py-1.5 rounded-full">
                  <span className="w-2 h-2 rounded-full bg-centauro-green animate-pulse" />
                  {stats.activeNow} ativos agora
                </span>
              </div>
            </div>

            {/* Period selector */}
            <div className="flex items-center gap-2 mb-6">
              <span className="text-xs font-bold text-muted-foreground">Período:</span>
              {[5, 10, 15, 30, 60].map((m) => (
                <button
                  key={m}
                  onClick={() => setPeriod(m)}
                  className={`px-3 py-1.5 rounded-md text-xs font-bold transition-colors ${
                    period === m
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-muted-foreground hover:bg-muted border border-border'
                  }`}
                >
                  {m} min
                </button>
              ))}
            </div>

            {/* Funnel steps */}
            <div className="space-y-0">
              {funnelSteps.map((step, i) => (
                <div key={step.title}>
                  <Card className="p-5 border border-border shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                          {step.icon}
                        </div>
                        <div>
                          <h3 className="font-black text-foreground text-sm">{step.title}</h3>
                          <p className="text-muted-foreground text-[11px]">{step.description}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-black text-foreground">{step.count}</p>
                        {step.conversion !== null && (
                          <p className="text-xs text-muted-foreground font-bold">{step.conversion}% conversão</p>
                        )}
                      </div>
                    </div>
                    <Progress value={step.progressValue || 1} className="h-1.5" />
                  </Card>

                  {step.dropoff && i < funnelSteps.length - 1 && (
                    <div className="flex items-center gap-2 py-1.5 pl-6">
                      <ArrowDown size={12} className="text-destructive" />
                      <span className="text-[11px] font-bold text-destructive">↓ {step.dropoff}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Global conversion */}
            <Card className="mt-6 p-5 border border-border shadow-sm bg-background">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-black text-foreground text-base">Conversão Global</h3>
                  <p className="text-muted-foreground text-xs">Visitantes que chegaram ao checkout</p>
                </div>
                <div className="text-right">
                  <p className="text-4xl font-black text-foreground">{globalConversion}%</p>
                  <p className="text-xs text-muted-foreground font-bold">{stats.checkout} de {stats.visitors} visitantes</p>
                </div>
              </div>
            </Card>

            {/* Clear data */}
            <div className="mt-4 text-right">
              <Button onClick={handleClearStats} variant="outline" size="sm" className="text-xs text-muted-foreground">
                <Trash2 size={12} className="mr-1" /> Limpar dados
              </Button>
            </div>
          </div>
        )}

        {activeTab === 'checkout' && (
          <Card className="border border-border p-5">
            <h1 className="text-xl font-black text-foreground mb-1">Gerenciar Checkout</h1>
            <p className="text-muted-foreground text-xs mb-6">Copa 2026 - Link de Pagamento</p>

            {/* Current URL */}
            <div className="bg-secondary p-4 rounded-md mb-4">
              <div className="flex items-center gap-2 mb-2">
                <Link2 size={14} className="text-muted-foreground" />
                <h3 className="font-bold text-foreground text-xs">Link Atual</h3>
              </div>
              <div className="bg-card p-2.5 rounded border border-border font-mono text-[10px] text-muted-foreground break-all">
                {checkoutUrl || 'Nenhum link configurado'}
              </div>
            </div>

            {/* Update URL */}
            <div className="bg-primary/5 p-4 rounded-md border border-primary/15 mb-4">
              <h3 className="font-bold text-foreground text-xs mb-3">Novo Link</h3>
              <Input
                type="url"
                value={newCheckoutUrl}
                onChange={(e) => setNewCheckoutUrl(e.target.value)}
                placeholder="https://seu-checkout.com/taxa-envio"
                className="mb-3 font-semibold text-xs"
              />
              <Button onClick={handleSave} className="w-full bg-centauro-green hover:bg-centauro-green/90 text-primary-foreground font-bold text-xs">
                <Save size={14} className="mr-1.5" /> Salvar
              </Button>
              {message && (
                <div className={`mt-3 p-2.5 rounded-md text-center text-xs font-bold ${
                  message.includes('sucesso')
                    ? 'bg-centauro-green/10 text-centauro-green'
                    : 'bg-destructive/10 text-destructive'
                }`}>
                  {message}
                </div>
              )}
            </div>

            {/* Info */}
            <div className="bg-centauro-gold/10 p-3.5 rounded-md border border-centauro-gold/20">
              <div className="flex items-center gap-1.5 mb-1.5">
                <Info size={13} className="text-centauro-gold" />
                <h3 className="font-bold text-foreground text-[11px]">Informações</h3>
              </div>
              <ul className="text-[10px] text-muted-foreground space-y-0.5 pl-5 list-disc">
                <li>Alterações são imediatas</li>
                <li>Todos os usuários serão redirecionados</li>
                <li>Verifique a URL antes de salvar</li>
              </ul>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
