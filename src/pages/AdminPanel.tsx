import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Eye, EyeOff, LogOut, Save, Link2, Info, BarChart3, ShoppingCart, TrendingUp, Users, CheckCircle, ArrowDown, Trash2, Code, Webhook, Bell } from 'lucide-react';
import { getFunnelStats, clearFunnelEvents } from '@/lib/funnelTracking';
import { getPixelConfig, savePixelConfig, type PixelConfig } from '@/lib/pixelManager';
import { getWebhookConfig, saveWebhookConfig, type WebhookConfig } from '@/lib/webhookManager';

const ADMIN_PASSWORD = 'escalabahia';

type Tab = 'analytics' | 'pixels' | 'webhooks' | 'checkout';

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

  // Pixel state
  const [pixelConfig, setPixelConfig] = useState<PixelConfig>({ facebookPixelId: '', facebookAccessToken: '', tiktokPixelId: '', tiktokAccessToken: '', googleAdsId: '', googleAdsLabel: '' });
  const [pixelMessage, setPixelMessage] = useState('');

  // Webhook state
  const [webhookConfig, setWebhookConfig] = useState<WebhookConfig>({ saleWebhookUrl: '' });
  const [webhookMessage, setWebhookMessage] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('checkoutUrl');
    if (saved) { setCheckoutUrl(saved); setNewCheckoutUrl(saved); }
    setPixelConfig(getPixelConfig());
    setWebhookConfig(getWebhookConfig());
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    const refresh = () => setStats(getFunnelStats(period));
    refresh();
    const interval = setInterval(refresh, 30000);
    return () => clearInterval(interval);
  }, [isAuthenticated, period]);

  const handleLogin = () => {
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true); setPassword(''); setMessage('');
    } else {
      setMessage('Senha incorreta!');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const handleSave = () => {
    if (!newCheckoutUrl.trim()) { setMessage('URL não pode estar vazia!'); return; }
    try {
      localStorage.setItem('checkoutUrl', newCheckoutUrl);
      setCheckoutUrl(newCheckoutUrl);
      setMessage('Link salvo com sucesso!');
      setTimeout(() => setMessage(''), 3000);
    } catch { setMessage('Erro ao salvar!'); }
  };

  const handleClearStats = () => { clearFunnelEvents(); setStats(getFunnelStats(period)); };

  const handleSavePixels = () => {
    savePixelConfig(pixelConfig);
    setPixelMessage('Pixels salvos e ativados com sucesso!');
    setTimeout(() => setPixelMessage(''), 3000);
  };

  const handleSaveWebhook = () => {
    saveWebhookConfig(webhookConfig);
    setWebhookMessage('Webhook salvo com sucesso!');
    setTimeout(() => setWebhookMessage(''), 3000);
  };

  const handleTestWebhook = async () => {
    if (!webhookConfig.saleWebhookUrl) {
      setWebhookMessage('Configure uma URL primeiro!');
      setTimeout(() => setWebhookMessage(''), 3000);
      return;
    }
    try {
      await fetch(webhookConfig.saleWebhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'test_webhook',
          timestamp: new Date().toISOString(),
          message: 'Teste de webhook - Copa 2026',
        }),
        mode: 'no-cors',
      });
      setWebhookMessage('Webhook de teste enviado!');
    } catch {
      setWebhookMessage('Erro ao enviar webhook de teste!');
    }
    setTimeout(() => setWebhookMessage(''), 3000);
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
              <Input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleLogin()} placeholder="Digite a senha" className="pr-10 font-semibold text-sm" />
              <button onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          {message && (
            <div className={`p-2.5 rounded-md text-center text-xs font-bold mb-4 border ${message.includes('sucesso') ? 'bg-centauro-green/10 text-centauro-green border-centauro-green/30' : 'bg-destructive/10 text-destructive border-destructive/30'}`}>
              {message}
            </div>
          )}
          <Button onClick={handleLogin} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-sm">Acessar</Button>
        </Card>
      </div>
    );
  }

  const globalConversion = pct(stats.checkout, stats.visitors);

  const funnelSteps = [
    { icon: <Eye size={20} className="text-primary" />, title: 'Visitantes', description: 'Chegaram à landing page', count: stats.visitors, conversion: null as number | null, dropoff: `${pct(stats.quizStarted, stats.visitors)}% dos visitantes`, progressValue: 100 },
    { icon: <TrendingUp size={20} className="text-centauro-green" />, title: 'Quiz Iniciado', description: 'Clicaram em Começar', count: stats.quizStarted, conversion: pct(stats.quizStarted, stats.visitors), dropoff: `${pct(stats.quizCompleted, stats.quizStarted)}% dos iniciados`, progressValue: stats.visitors > 0 ? (stats.quizStarted / stats.visitors) * 100 : 0 },
    { icon: <CheckCircle size={20} className="text-centauro-gold" />, title: 'Quiz Completado', description: 'Terminaram as 8 perguntas', count: stats.quizCompleted, conversion: pct(stats.quizCompleted, stats.visitors), dropoff: `${pct(stats.checkout, stats.quizCompleted)}% dos completados`, progressValue: stats.visitors > 0 ? (stats.quizCompleted / stats.visitors) * 100 : 0 },
    { icon: <ShoppingCart size={20} className="text-destructive" />, title: 'Checkout', description: 'Foram para o pagamento', count: stats.checkout, conversion: pct(stats.checkout, stats.visitors), dropoff: null as string | null, progressValue: stats.visitors > 0 ? (stats.checkout / stats.visitors) * 100 : 0 },
  ];

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'analytics', label: 'Analytics', icon: <BarChart3 size={14} /> },
    { id: 'pixels', label: 'Pixels', icon: <Code size={14} /> },
    { id: 'webhooks', label: 'Webhooks', icon: <Bell size={14} /> },
    { id: 'checkout', label: 'Checkout', icon: <Link2 size={14} /> },
  ];

  const StatusMessage = ({ msg }: { msg: string }) => msg ? (
    <div className={`mt-3 p-2.5 rounded-md text-center text-xs font-bold ${msg.includes('sucesso') || msg.includes('enviado') || msg.includes('ativado') ? 'bg-centauro-green/10 text-centauro-green' : 'bg-destructive/10 text-destructive'}`}>
      {msg}
    </div>
  ) : null;

  return (
    <div className="min-h-screen bg-secondary">
      {/* Top bar */}
      <div className="bg-primary py-3 px-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-primary-foreground font-black text-sm">Painel Admin</h1>
            <p className="text-primary-foreground/60 text-[10px]">Copa 2026 - Gerenciamento</p>
          </div>
          <Button onClick={() => { setIsAuthenticated(false); setPassword(''); setMessage(''); }} variant="ghost" size="sm" className="text-primary-foreground hover:bg-primary-foreground/10 text-xs font-bold">
            <LogOut size={14} className="mr-1" /> Sair
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-border bg-background overflow-x-auto">
        <div className="max-w-3xl mx-auto flex">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-3 text-xs font-bold border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.id ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-3xl mx-auto p-4">
        {/* ANALYTICS TAB */}
        {activeTab === 'analytics' && (
          <div>
            <div className="flex items-start justify-between mb-2">
              <div>
                <h2 className="text-xl font-black text-foreground">Funil de Conversão</h2>
                <p className="text-muted-foreground text-xs">Atualização automática a cada 30 segundos</p>
              </div>
              <span className="flex items-center gap-1.5 bg-centauro-green/10 text-centauro-green text-xs font-bold px-3 py-1.5 rounded-full">
                <span className="w-2 h-2 rounded-full bg-centauro-green animate-pulse" />
                {stats.activeNow} ativos agora
              </span>
            </div>

            <div className="flex items-center gap-2 mb-6">
              <span className="text-xs font-bold text-muted-foreground">Período:</span>
              {[5, 10, 15, 30, 60].map((m) => (
                <button key={m} onClick={() => setPeriod(m)} className={`px-3 py-1.5 rounded-md text-xs font-bold transition-colors ${period === m ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:bg-muted border border-border'}`}>
                  {m} min
                </button>
              ))}
            </div>

            <div className="space-y-0">
              {funnelSteps.map((step, i) => (
                <div key={step.title}>
                  <Card className="p-5 border border-border shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">{step.icon}</div>
                        <div>
                          <h3 className="font-black text-foreground text-sm">{step.title}</h3>
                          <p className="text-muted-foreground text-[11px]">{step.description}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-black text-foreground">{step.count}</p>
                        {step.conversion !== null && <p className="text-xs text-muted-foreground font-bold">{step.conversion}% conversão</p>}
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

            <div className="mt-4 text-right">
              <Button onClick={handleClearStats} variant="outline" size="sm" className="text-xs text-muted-foreground">
                <Trash2 size={12} className="mr-1" /> Limpar dados
              </Button>
            </div>
          </div>
        )}

        {/* PIXELS TAB */}
        {activeTab === 'pixels' && (
          <div>
            <h2 className="text-xl font-black text-foreground mb-1">Pixels de Rastreamento</h2>
            <p className="text-muted-foreground text-xs mb-6">Configure seus pixels para rastrear conversões</p>

            <div className="space-y-4">
              {/* Facebook Pixel */}
              <Card className="p-5 border border-border">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-[#1877F2]/10 flex items-center justify-center">
                    <svg viewBox="0 0 24 24" className="w-5 h-5 fill-[#1877F2]"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                  </div>
                  <div>
                    <h3 className="font-black text-foreground text-sm">Facebook Pixel</h3>
                    <p className="text-muted-foreground text-[11px]">Meta Ads - Rastreamento de conversões</p>
                  </div>
                </div>
                <Input
                  value={pixelConfig.facebookPixelId}
                  onChange={(e) => setPixelConfig(prev => ({ ...prev, facebookPixelId: e.target.value }))}
                  placeholder="Ex: 123456789012345"
                  className="font-mono text-xs"
                />
                <p className="text-[10px] text-muted-foreground mt-1.5">Encontre seu Pixel ID em: Meta Business Suite → Eventos → Pixels</p>
              </Card>

              {/* TikTok Pixel */}
              <Card className="p-5 border border-border">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-foreground/10 flex items-center justify-center">
                    <svg viewBox="0 0 24 24" className="w-5 h-5 fill-foreground"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.11V9.01a6.27 6.27 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.34-6.34V8.75a8.18 8.18 0 004.76 1.52V6.84a4.84 4.84 0 01-1-.15z"/></svg>
                  </div>
                  <div>
                    <h3 className="font-black text-foreground text-sm">TikTok Pixel</h3>
                    <p className="text-muted-foreground text-[11px]">TikTok Ads - Rastreamento de conversões</p>
                  </div>
                </div>
                <Input
                  value={pixelConfig.tiktokPixelId}
                  onChange={(e) => setPixelConfig(prev => ({ ...prev, tiktokPixelId: e.target.value }))}
                  placeholder="Ex: C1234567890"
                  className="font-mono text-xs"
                />
                <p className="text-[10px] text-muted-foreground mt-1.5">Encontre seu Pixel ID em: TikTok Ads Manager → Ativos → Eventos</p>
              </Card>

              {/* Google Ads */}
              <Card className="p-5 border border-border">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-[#4285F4]/10 flex items-center justify-center">
                    <svg viewBox="0 0 24 24" className="w-5 h-5"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                  </div>
                  <div>
                    <h3 className="font-black text-foreground text-sm">Google Ads</h3>
                    <p className="text-muted-foreground text-[11px]">Google Ads - Tag de conversão</p>
                  </div>
                </div>
                <Input
                  value={pixelConfig.googleAdsId}
                  onChange={(e) => setPixelConfig(prev => ({ ...prev, googleAdsId: e.target.value }))}
                  placeholder="Ex: AW-123456789"
                  className="font-mono text-xs"
                />
                <p className="text-[10px] text-muted-foreground mt-1.5">Encontre seu ID em: Google Ads → Ferramentas → Conversões → Tag</p>
              </Card>
            </div>

            <Button onClick={handleSavePixels} className="w-full mt-4 bg-centauro-green hover:bg-centauro-green/90 text-primary-foreground font-bold text-xs">
              <Save size={14} className="mr-1.5" /> Salvar e Ativar Pixels
            </Button>
            <StatusMessage msg={pixelMessage} />

            <div className="bg-centauro-gold/10 p-3.5 rounded-md border border-centauro-gold/20 mt-4">
              <div className="flex items-center gap-1.5 mb-1.5">
                <Info size={13} className="text-centauro-gold" />
                <h3 className="font-bold text-foreground text-[11px]">Como funciona</h3>
              </div>
              <ul className="text-[10px] text-muted-foreground space-y-0.5 pl-5 list-disc">
                <li>Os pixels são injetados automaticamente em todas as páginas</li>
                <li>Eventos de PageView são disparados ao carregar</li>
                <li>Evento de conversão é disparado ao clicar no checkout</li>
                <li>Deixe o campo vazio para desativar um pixel</li>
              </ul>
            </div>
          </div>
        )}

        {/* WEBHOOKS TAB */}
        {activeTab === 'webhooks' && (
          <div>
            <h2 className="text-xl font-black text-foreground mb-1">Webhooks de Notificação</h2>
            <p className="text-muted-foreground text-xs mb-6">Receba notificações quando um lead iniciar o checkout</p>

            <Card className="p-5 border border-border">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Webhook size={20} className="text-primary" />
                </div>
                <div>
                  <h3 className="font-black text-foreground text-sm">Webhook de Venda</h3>
                  <p className="text-muted-foreground text-[11px]">Notificação via POST quando alguém clica no checkout</p>
                </div>
              </div>
              <Input
                type="url"
                value={webhookConfig.saleWebhookUrl}
                onChange={(e) => setWebhookConfig(prev => ({ ...prev, saleWebhookUrl: e.target.value }))}
                placeholder="https://seu-webhook.com/notificacao"
                className="font-mono text-xs"
              />
              <p className="text-[10px] text-muted-foreground mt-1.5">Compatível com Zapier, Make, N8N, ou qualquer endpoint que aceite POST</p>

              <div className="flex gap-2 mt-3">
                <Button onClick={handleSaveWebhook} className="flex-1 bg-centauro-green hover:bg-centauro-green/90 text-primary-foreground font-bold text-xs">
                  <Save size={14} className="mr-1.5" /> Salvar
                </Button>
                <Button onClick={handleTestWebhook} variant="outline" className="text-xs font-bold">
                  Testar Webhook
                </Button>
              </div>
              <StatusMessage msg={webhookMessage} />
            </Card>

            <div className="bg-secondary p-4 rounded-md mt-4">
              <h3 className="font-bold text-foreground text-xs mb-2">Exemplo de payload enviado:</h3>
              <pre className="bg-card p-3 rounded border border-border text-[10px] text-muted-foreground font-mono overflow-x-auto">
{JSON.stringify({
  event: 'checkout_initiated',
  timestamp: '2026-03-25T12:00:00.000Z',
  source: 'quiz-copa-2026',
}, null, 2)}
              </pre>
            </div>

            <div className="bg-centauro-gold/10 p-3.5 rounded-md border border-centauro-gold/20 mt-4">
              <div className="flex items-center gap-1.5 mb-1.5">
                <Info size={13} className="text-centauro-gold" />
                <h3 className="font-bold text-foreground text-[11px]">Integrações populares</h3>
              </div>
              <ul className="text-[10px] text-muted-foreground space-y-0.5 pl-5 list-disc">
                <li><strong>Zapier:</strong> Use um trigger Webhook para receber</li>
                <li><strong>Make:</strong> Crie um cenário com módulo Webhook</li>
                <li><strong>N8N:</strong> Use o nó Webhook como trigger</li>
                <li><strong>Telegram:</strong> Conecte ao bot para receber alertas</li>
              </ul>
            </div>
          </div>
        )}

        {/* CHECKOUT TAB */}
        {activeTab === 'checkout' && (
          <Card className="border border-border p-5">
            <h1 className="text-xl font-black text-foreground mb-1">Gerenciar Checkout</h1>
            <p className="text-muted-foreground text-xs mb-6">Copa 2026 - Link de Pagamento</p>

            <div className="bg-secondary p-4 rounded-md mb-4">
              <div className="flex items-center gap-2 mb-2">
                <Link2 size={14} className="text-muted-foreground" />
                <h3 className="font-bold text-foreground text-xs">Link Atual</h3>
              </div>
              <div className="bg-card p-2.5 rounded border border-border font-mono text-[10px] text-muted-foreground break-all">
                {checkoutUrl || 'Nenhum link configurado'}
              </div>
            </div>

            <div className="bg-primary/5 p-4 rounded-md border border-primary/15 mb-4">
              <h3 className="font-bold text-foreground text-xs mb-3">Novo Link</h3>
              <Input type="url" value={newCheckoutUrl} onChange={(e) => setNewCheckoutUrl(e.target.value)} placeholder="https://seu-checkout.com/taxa-envio" className="mb-3 font-semibold text-xs" />
              <Button onClick={handleSave} className="w-full bg-centauro-green hover:bg-centauro-green/90 text-primary-foreground font-bold text-xs">
                <Save size={14} className="mr-1.5" /> Salvar
              </Button>
              {message && (
                <div className={`mt-3 p-2.5 rounded-md text-center text-xs font-bold ${message.includes('sucesso') ? 'bg-centauro-green/10 text-centauro-green' : 'bg-destructive/10 text-destructive'}`}>
                  {message}
                </div>
              )}
            </div>

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
