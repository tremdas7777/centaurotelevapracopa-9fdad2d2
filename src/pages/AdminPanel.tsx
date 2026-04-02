import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Eye, EyeOff, LogOut, Save, Link2, Info, BarChart3, ShoppingCart, TrendingUp, Users, CheckCircle, ArrowDown, Trash2, Code, Webhook, Bell, Zap, Loader2, ExternalLink, CreditCard, QrCode, Copy, RefreshCw, Plus, DollarSign, Gift } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { getFunnelStats, clearFunnelEvents } from '@/lib/funnelTracking';
import { getPixelConfig, savePixelConfig, type PixelConfig, type FacebookPixelEntry, type TikTokPixelEntry, type GoogleAdsEntry } from '@/lib/pixelManager';
import { getWebhookConfig, saveWebhookConfig, fireWebhookEvent, syncWebhooksToDb, loadWebhooksFromDb, type WebhookConfig, type WebhookEntry } from '@/lib/webhookManager';
import { loadUtmifyConfig, saveUtmifyConfig, testUtmifyToken, type UtmifyConfig } from '@/lib/utmifyManager';
import { fetchPaymentGatewayConfig, savePaymentGatewayConfig, type PaymentGatewayConfig } from '@/lib/paymentGateway';
import { supabase } from '@/integrations/supabase/client';
import AdminFinanceiro from '@/components/AdminFinanceiro';
import AdminLeads from '@/components/AdminLeads';

const ADMIN_PASSWORD = 'escalabahia';

type Tab = 'analytics' | 'financeiro' | 'leads' | 'pixels' | 'webhooks' | 'utmify' | 'checkout' | 'pagamentos' | 'pedidos';

export default function AdminPanel() {
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [checkoutUrl, setCheckoutUrl] = useState('');
  const [newCheckoutUrl, setNewCheckoutUrl] = useState('');
  const [message, setMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('analytics');
  const [period, setPeriod] = useState(30);
  const [stats, setStats] = useState({ visitors: 0, quizStarted: 0, quizCompleted: 0, scratchCompleted: 0, checkout: 0, activeNow: 0 });

  // Pixel state
  const [pixelConfig, setPixelConfig] = useState<PixelConfig>({ facebookPixels: [], tiktokPixels: [], googleAdsPixels: [], utmifyHtml: '' });
  const [pixelMessage, setPixelMessage] = useState('');

  // External checkout toggle
  const [externalCheckout, setExternalCheckout] = useState(false);

  // Webhook state
  const [webhookConfig, setWebhookConfig] = useState<WebhookConfig>(getWebhookConfig());
  const [webhookMessage, setWebhookMessage] = useState('');

  // Utmify state
  const [utmifyConfig, setUtmifyConfig] = useState<UtmifyConfig>({ apiToken: '', apiToken2: '' });
  const [utmifyMessage, setUtmifyMessage] = useState('');
  const [utmifyMessage2, setUtmifyMessage2] = useState('');
  const [utmifyTesting, setUtmifyTesting] = useState(false);
  const [utmifyTesting2, setUtmifyTesting2] = useState(false);

  // Payment gateway state
  const [gatewayConfig, setGatewayConfig] = useState<PaymentGatewayConfig>({
    activeGateway: 'centurionpay',
    pagouai: { publicKey: '', secretKey: '', enabled: false },
    vennox: { secretKey: '', companyId: '', enabled: false },
    centurionpay: { secretKey: '', companyId: '', enabled: false },
    ironpay: { apiToken: '', offerHash: '', enabled: false },
    hypercash: { publicKey: '', secretKey: '', enabled: false },
  });
  const [gatewayMessage, setGatewayMessage] = useState('');
  const [orders, setOrders] = useState<any[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  const fetchOrders = async () => {
    setOrdersLoading(true);
    const { data } = await supabase.from('orders').select('*').order('created_at', { ascending: false }).limit(50);
    setOrders(data || []);
    setOrdersLoading(false);
  };

  useEffect(() => {
    const saved = localStorage.getItem('checkoutUrl');
    if (saved) { setCheckoutUrl(saved); setNewCheckoutUrl(saved); }
    setExternalCheckout(localStorage.getItem('externalCheckout') === 'true');
    setPixelConfig(getPixelConfig());
    loadWebhooksFromDb().then(config => {
      setWebhookConfig(config);
      saveWebhookConfig(config); // sync to localStorage
    });
    loadUtmifyConfig().then(config => setUtmifyConfig(config));
    fetchPaymentGatewayConfig().then(config => setGatewayConfig(config));
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    const refresh = () => setStats(getFunnelStats(period));
    refresh();
    const interval = setInterval(refresh, 30000);
    return () => clearInterval(interval);
  }, [isAuthenticated, period]);

  useEffect(() => {
    if (isAuthenticated && activeTab === 'pedidos') {
      fetchOrders();
    }
  }, [isAuthenticated, activeTab]);

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

  const handleSaveUtmify = async () => {
    await saveUtmifyConfig(utmifyConfig);
    setUtmifyMessage('Token Utmify salvo com sucesso!');
    setTimeout(() => setUtmifyMessage(''), 3000);
  };

  const handleDeleteUtmifyToken = async (tokenNum: 1 | 2) => {
    const updated = { ...utmifyConfig };
    if (tokenNum === 1) updated.apiToken = '';
    else updated.apiToken2 = '';
    setUtmifyConfig(updated);
    await saveUtmifyConfig(updated);
    const setMsg = tokenNum === 1 ? setUtmifyMessage : setUtmifyMessage2;
    setMsg('Token excluído com sucesso!');
    setTimeout(() => setMsg(''), 3000);
  };

  const handleTestUtmify = async (tokenNum: 1 | 2) => {
    const token = tokenNum === 1 ? utmifyConfig.apiToken : utmifyConfig.apiToken2;
    const setMsg = tokenNum === 1 ? setUtmifyMessage : setUtmifyMessage2;
    const setTesting = tokenNum === 1 ? setUtmifyTesting : setUtmifyTesting2;
    setTesting(true);
    setMsg('');
    const result = await testUtmifyToken(token);
    setMsg(result.message);
    setTesting(false);
    setTimeout(() => setMsg(''), 5000);
  };

  const handleSaveWebhook = async () => {
    saveWebhookConfig(webhookConfig);
    await syncWebhooksToDb(webhookConfig);
    setWebhookMessage('Webhooks salvos com sucesso!');
    setTimeout(() => setWebhookMessage(''), 3000);
  };

  const handleTestWebhook = async (eventType: 'venda_pendente' | 'venda_aprovada') => {
    // Check both local state and DB for webhooks
    let hasWebhooks = webhookConfig.webhooks.length > 0;
    if (!hasWebhooks) {
      const dbConfig = await loadWebhooksFromDb();
      hasWebhooks = dbConfig.webhooks.length > 0;
      if (hasWebhooks) {
        setWebhookConfig(dbConfig);
      }
    }
    if (!hasWebhooks) {
      setWebhookMessage('Adicione pelo menos um webhook primeiro!');
      setTimeout(() => setWebhookMessage(''), 3000);
      return;
    }
    try {
      await fireWebhookEvent(eventType, { source: 'quiz-copa-2026', test: true });
      setWebhookMessage(`Teste de ${eventType === 'venda_pendente' ? 'venda pendente' : 'venda aprovada'} enviado!`);
    } catch (err) {
      setWebhookMessage('Erro ao enviar teste de webhook');
    }
    setTimeout(() => setWebhookMessage(''), 3000);
  };

  const addWebhook = () => {
    setWebhookConfig(prev => ({
      ...prev,
      webhooks: [...prev.webhooks, { id: crypto.randomUUID(), url: '', events: ['venda_pendente', 'venda_aprovada'] }],
    }));
  };

  const removeWebhook = (id: string) => {
    setWebhookConfig(prev => ({
      ...prev,
      webhooks: prev.webhooks.filter(w => w.id !== id),
    }));
  };

  const updateWebhook = (id: string, updates: Partial<WebhookEntry>) => {
    setWebhookConfig(prev => ({
      ...prev,
      webhooks: prev.webhooks.map(w => w.id === id ? { ...w, ...updates } : w),
    }));
  };

  const toggleWebhookEvent = (id: string, event: 'venda_pendente' | 'venda_aprovada') => {
    setWebhookConfig(prev => ({
      ...prev,
      webhooks: prev.webhooks.map(w => {
        if (w.id !== id) return w;
        const events = w.events.includes(event)
          ? w.events.filter(e => e !== event)
          : [...w.events, event];
        return { ...w, events: events.length > 0 ? events : [event] };
      }),
    }));
  };

  const pct = (a: number, b: number) => (b === 0 ? 0 : Math.round((a / b) * 100));

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-secondary flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8 border border-border shadow-sm">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-black text-foreground">Painel Admin</h1>
            <p className="text-muted-foreground text-xs mt-1">Gerenciamento</p>
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
    { icon: <CheckCircle size={20} className="text-centauro-gold" />, title: 'Quiz Completado', description: 'Terminaram as 8 perguntas', count: stats.quizCompleted, conversion: pct(stats.quizCompleted, stats.visitors), dropoff: `${pct(stats.scratchCompleted, stats.quizCompleted)}% dos completados`, progressValue: stats.visitors > 0 ? (stats.quizCompleted / stats.visitors) * 100 : 0 },
    { icon: <Gift size={20} className="text-orange-500" />, title: 'Raspadinha', description: 'Completaram a raspadinha', count: stats.scratchCompleted, conversion: pct(stats.scratchCompleted, stats.visitors), dropoff: `${pct(stats.checkout, stats.scratchCompleted)}% da raspadinha`, progressValue: stats.visitors > 0 ? (stats.scratchCompleted / stats.visitors) * 100 : 0 },
    { icon: <ShoppingCart size={20} className="text-destructive" />, title: 'Checkout', description: 'Foram para o pagamento', count: stats.checkout, conversion: pct(stats.checkout, stats.visitors), dropoff: null as string | null, progressValue: stats.visitors > 0 ? (stats.checkout / stats.visitors) * 100 : 0 },
  ];

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'analytics', label: 'Analytics', icon: <BarChart3 size={14} /> },
    { id: 'financeiro', label: 'Financeiro', icon: <DollarSign size={14} /> },
    { id: 'leads', label: 'Leads', icon: <Users size={14} /> },
    { id: 'pixels', label: 'Pixels', icon: <Code size={14} /> },
    { id: 'webhooks', label: 'Webhooks', icon: <Bell size={14} /> },
    { id: 'utmify', label: 'Utmify', icon: <Zap size={14} /> },
    { id: 'pagamentos', label: 'Pagamentos', icon: <CreditCard size={14} /> },
    { id: 'pedidos', label: 'Pedidos', icon: <ShoppingCart size={14} /> },
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
            <p className="text-primary-foreground/60 text-[10px]">Gerenciamento</p>
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

            {/* Funnel Chart */}
            <Card className="mt-6 p-5 border border-border shadow-sm bg-background">
              <h3 className="font-black text-foreground text-sm mb-3 uppercase">Funil Visual</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={[
                  { etapa: 'Visitantes', valor: stats.visitors, fill: 'hsl(var(--primary))' },
                  { etapa: 'Quiz Início', valor: stats.quizStarted, fill: 'hsl(142, 71%, 45%)' },
                  { etapa: 'Quiz Fim', valor: stats.quizCompleted, fill: 'hsl(45, 93%, 47%)' },
                  { etapa: 'Checkout', valor: stats.checkout, fill: 'hsl(0, 84%, 60%)' },
                ]} layout="vertical" margin={{ left: 10, right: 30 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis dataKey="etapa" type="category" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))', fontWeight: 700 }} width={80} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid hsl(var(--border))' }} />
                  <Bar dataKey="valor" radius={[0, 6, 6, 0]}>
                    {[
                      { fill: 'hsl(var(--primary))' },
                      { fill: 'hsl(142, 71%, 45%)' },
                      { fill: 'hsl(45, 93%, 47%)' },
                      { fill: 'hsl(0, 84%, 60%)' },
                    ].map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Card>

            <Card className="mt-4 p-5 border border-border shadow-sm bg-background">
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

        {/* FINANCEIRO TAB */}
        {activeTab === 'financeiro' && <AdminFinanceiro />}

        {/* LEADS TAB */}
        {activeTab === 'leads' && <AdminLeads />}

        {/* PIXELS TAB */}
        {activeTab === 'pixels' && (
          <div>
            <h2 className="text-xl font-black text-foreground mb-1">Pixels de Rastreamento</h2>
            <p className="text-muted-foreground text-xs mb-6">Configure quantos pixels quiser por plataforma</p>

            {/* Facebook Pixels */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-[#1877F2]/10 flex items-center justify-center">
                    <svg viewBox="0 0 24 24" className="w-4 h-4 fill-[#1877F2]"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                  </div>
                  <h3 className="font-black text-foreground text-sm">Facebook / Meta Pixel</h3>
                  <Badge variant="secondary" className="text-[10px]">{pixelConfig.facebookPixels.length}</Badge>
                </div>
                <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => setPixelConfig(prev => ({ ...prev, facebookPixels: [...prev.facebookPixels, { id: crypto.randomUUID(), pixelId: '', accessToken: '' }] }))}>
                  <Plus size={12} className="mr-1" /> Adicionar
                </Button>
              </div>
              {pixelConfig.facebookPixels.length === 0 && <p className="text-xs text-muted-foreground text-center py-4 border border-dashed border-border rounded-md">Nenhum pixel Facebook adicionado</p>}
              <div className="space-y-2">
                {pixelConfig.facebookPixels.map((fb, i) => (
                  <Card key={fb.id} className="p-4 border border-border">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-black text-foreground">Pixel #{i + 1}</span>
                      <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10 h-6 w-6 p-0" onClick={() => setPixelConfig(prev => ({ ...prev, facebookPixels: prev.facebookPixels.filter(p => p.id !== fb.id) }))}>
                        <Trash2 size={12} />
                      </Button>
                    </div>
                    <div className="space-y-2">
                      <div>
                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Pixel ID</label>
                        <Input value={fb.pixelId} onChange={(e) => setPixelConfig(prev => ({ ...prev, facebookPixels: prev.facebookPixels.map(p => p.id === fb.id ? { ...p, pixelId: e.target.value } : p) }))} placeholder="Ex: 123456789012345" className="font-mono text-xs mt-1" />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Access Token (CAPI)</label>
                        <Input type="password" value={fb.accessToken} onChange={(e) => setPixelConfig(prev => ({ ...prev, facebookPixels: prev.facebookPixels.map(p => p.id === fb.id ? { ...p, accessToken: e.target.value } : p) }))} placeholder="Token da Conversions API (opcional)" className="font-mono text-xs mt-1" />
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            {/* TikTok Pixels */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-foreground/10 flex items-center justify-center">
                    <svg viewBox="0 0 24 24" className="w-4 h-4 fill-foreground"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.11V9.01a6.27 6.27 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.34-6.34V8.75a8.18 8.18 0 004.76 1.52V6.84a4.84 4.84 0 01-1-.15z"/></svg>
                  </div>
                  <h3 className="font-black text-foreground text-sm">TikTok Pixel</h3>
                  <Badge variant="secondary" className="text-[10px]">{pixelConfig.tiktokPixels.length}</Badge>
                </div>
                <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => setPixelConfig(prev => ({ ...prev, tiktokPixels: [...prev.tiktokPixels, { id: crypto.randomUUID(), pixelId: '', accessToken: '' }] }))}>
                  <Plus size={12} className="mr-1" /> Adicionar
                </Button>
              </div>
              {pixelConfig.tiktokPixels.length === 0 && <p className="text-xs text-muted-foreground text-center py-4 border border-dashed border-border rounded-md">Nenhum pixel TikTok adicionado</p>}
              <div className="space-y-2">
                {pixelConfig.tiktokPixels.map((tt, i) => (
                  <Card key={tt.id} className="p-4 border border-border">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-black text-foreground">Pixel #{i + 1}</span>
                      <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10 h-6 w-6 p-0" onClick={() => setPixelConfig(prev => ({ ...prev, tiktokPixels: prev.tiktokPixels.filter(p => p.id !== tt.id) }))}>
                        <Trash2 size={12} />
                      </Button>
                    </div>
                    <div className="space-y-2">
                      <div>
                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Pixel ID</label>
                        <Input value={tt.pixelId} onChange={(e) => setPixelConfig(prev => ({ ...prev, tiktokPixels: prev.tiktokPixels.map(p => p.id === tt.id ? { ...p, pixelId: e.target.value } : p) }))} placeholder="Ex: CXXXXXXXXXXXXXXX" className="font-mono text-xs mt-1" />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Access Token</label>
                        <Input type="password" value={tt.accessToken} onChange={(e) => setPixelConfig(prev => ({ ...prev, tiktokPixels: prev.tiktokPixels.map(p => p.id === tt.id ? { ...p, accessToken: e.target.value } : p) }))} placeholder="Token da Events API (opcional)" className="font-mono text-xs mt-1" />
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            {/* Google Ads Pixels */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-[#4285F4]/10 flex items-center justify-center">
                    <svg viewBox="0 0 24 24" className="w-4 h-4"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                  </div>
                  <h3 className="font-black text-foreground text-sm">Google Ads</h3>
                  <Badge variant="secondary" className="text-[10px]">{pixelConfig.googleAdsPixels.length}</Badge>
                </div>
                <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => setPixelConfig(prev => ({ ...prev, googleAdsPixels: [...prev.googleAdsPixels, { id: crypto.randomUUID(), adsId: '', adsLabel: '' }] }))}>
                  <Plus size={12} className="mr-1" /> Adicionar
                </Button>
              </div>
              {pixelConfig.googleAdsPixels.length === 0 && <p className="text-xs text-muted-foreground text-center py-4 border border-dashed border-border rounded-md">Nenhum pixel Google Ads adicionado</p>}
              <div className="space-y-2">
                {pixelConfig.googleAdsPixels.map((ga, i) => (
                  <Card key={ga.id} className="p-4 border border-border">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-black text-foreground">Pixel #{i + 1}</span>
                      <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10 h-6 w-6 p-0" onClick={() => setPixelConfig(prev => ({ ...prev, googleAdsPixels: prev.googleAdsPixels.filter(p => p.id !== ga.id) }))}>
                        <Trash2 size={12} />
                      </Button>
                    </div>
                    <div className="space-y-2">
                      <div>
                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">ID de Conversão</label>
                        <Input value={ga.adsId} onChange={(e) => setPixelConfig(prev => ({ ...prev, googleAdsPixels: prev.googleAdsPixels.map(p => p.id === ga.id ? { ...p, adsId: e.target.value } : p) }))} placeholder="Ex: AW-123456789" className="font-mono text-xs mt-1" />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Rótulo de Conversão</label>
                        <Input value={ga.adsLabel} onChange={(e) => setPixelConfig(prev => ({ ...prev, googleAdsPixels: prev.googleAdsPixels.map(p => p.id === ga.id ? { ...p, adsLabel: e.target.value } : p) }))} placeholder="Ex: AbCdEfGhIjKlMnOp" className="font-mono text-xs mt-1" />
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            {/* Utmify HTML Pixel */}
            <Card className="p-5 border border-border">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-centauro-green/10 flex items-center justify-center">
                  <Zap size={20} className="text-centauro-green" />
                </div>
                <div>
                  <h3 className="font-black text-foreground text-sm">Pixel Utmify (HTML)</h3>
                  <p className="text-muted-foreground text-[11px]">Cole o script HTML da Utmify para injetar no projeto inteiro</p>
                </div>
              </div>
              <textarea
                value={pixelConfig.utmifyHtml || ''}
                onChange={(e) => setPixelConfig(prev => ({ ...prev, utmifyHtml: e.target.value }))}
                placeholder={'<script src="https://cdn.utmify.com.br/scripts/pixel.js" data-id="SEU_ID"></script>'}
                className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-xs font-mono ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
              <p className="text-[9px] text-muted-foreground mt-1">Utmify → Integrações → Pixel → Copie o código HTML completo</p>
            </Card>

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
                <li><strong>Ilimitado:</strong> Adicione quantos pixels quiser de cada plataforma</li>
                <li><strong>Pixel ID:</strong> Dispara eventos no navegador (PageView, Purchase)</li>
                <li><strong>Access Token / CAPI:</strong> Envia eventos server-side para maior precisão</li>
                <li>O token é opcional, mas recomendado para contornar bloqueadores de anúncios</li>
                <li>Evento de conversão é disparado ao clicar no checkout</li>
              </ul>
            </div>
          </div>
        )}

        {/* WEBHOOKS TAB */}
        {activeTab === 'webhooks' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-black text-foreground mb-1">Webhooks de Notificação</h2>
                <p className="text-muted-foreground text-xs">Receba notificações de venda pendente e aprovada</p>
              </div>
              <Button onClick={addWebhook} size="sm" className="bg-primary text-primary-foreground font-bold text-xs">
                + Adicionar
              </Button>
            </div>

            {webhookConfig.webhooks.length === 0 && (
              <Card className="p-8 border border-border text-center">
                <Webhook size={32} className="mx-auto mb-3 text-muted-foreground" />
                <p className="text-sm font-bold text-foreground">Nenhum webhook configurado</p>
                <p className="text-xs text-muted-foreground mt-1">Clique em "+ Adicionar" para configurar</p>
              </Card>
            )}

            <div className="space-y-3">
              {webhookConfig.webhooks.map((webhook, index) => (
                <Card key={webhook.id} className="p-4 border border-border">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-black text-foreground">Webhook #{index + 1}</span>
                    <Button onClick={() => removeWebhook(webhook.id)} variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10 h-7 px-2">
                      <Trash2 size={12} />
                    </Button>
                  </div>
                  <Input
                    type="url"
                    value={webhook.url}
                    onChange={(e) => updateWebhook(webhook.id, { url: e.target.value })}
                    placeholder="https://seu-webhook.com/notificacao"
                    className="font-mono text-xs mb-2"
                  />
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-[10px] font-bold text-muted-foreground">Eventos:</span>
                    <button
                      onClick={() => toggleWebhookEvent(webhook.id, 'venda_pendente')}
                      className={`px-2.5 py-1 rounded-md text-[10px] font-bold border transition-all ${
                        webhook.events.includes('venda_pendente')
                          ? 'border-centauro-gold bg-centauro-gold/10 text-centauro-gold'
                          : 'border-border text-muted-foreground'
                      }`}
                    >
                      Venda Pendente
                    </button>
                    <button
                      onClick={() => toggleWebhookEvent(webhook.id, 'venda_aprovada')}
                      className={`px-2.5 py-1 rounded-md text-[10px] font-bold border transition-all ${
                        webhook.events.includes('venda_aprovada')
                          ? 'border-centauro-green bg-centauro-green/10 text-centauro-green'
                          : 'border-border text-muted-foreground'
                      }`}
                    >
                      Venda Aprovada
                    </button>
                  </div>
                </Card>
              ))}
            </div>

            {webhookConfig.webhooks.length > 0 && (
              <div className="mt-4 space-y-2">
                <Button onClick={handleSaveWebhook} className="w-full bg-centauro-green hover:bg-centauro-green/90 text-primary-foreground font-bold text-xs">
                  <Save size={14} className="mr-1.5" /> Salvar Webhooks
                </Button>
                <div className="flex gap-2">
                  <Button onClick={() => handleTestWebhook('venda_pendente')} variant="outline" className="flex-1 text-xs font-bold">
                    Testar Pendente
                  </Button>
                  <Button onClick={() => handleTestWebhook('venda_aprovada')} variant="outline" className="flex-1 text-xs font-bold">
                    Testar Aprovada
                  </Button>
                </div>
              </div>
            )}
            <StatusMessage msg={webhookMessage} />

            <div className="bg-secondary p-4 rounded-md mt-4">
              <h3 className="font-bold text-foreground text-xs mb-2">Exemplo de payload:</h3>
              <pre className="bg-card p-3 rounded border border-border text-[10px] text-muted-foreground font-mono overflow-x-auto">
{JSON.stringify({
  event: 'venda_pendente',
  timestamp: '2026-03-25T12:00:00.000Z',
  source: 'quiz-copa-2026',
  buyerName: 'João Silva',
  amount: 44.90,
}, null, 2)}
              </pre>
            </div>

            <div className="bg-centauro-gold/10 p-3.5 rounded-md border border-centauro-gold/20 mt-4">
              <div className="flex items-center gap-1.5 mb-1.5">
                <Info size={13} className="text-centauro-gold" />
                <h3 className="font-bold text-foreground text-[11px]">Como funciona</h3>
              </div>
              <ul className="text-[10px] text-muted-foreground space-y-0.5 pl-5 list-disc">
                <li><strong>Venda Pendente:</strong> Dispara quando o PIX é gerado (cliente ainda não pagou)</li>
                <li><strong>Venda Aprovada:</strong> Dispara quando o pagamento é confirmado</li>
                <li>Adicione quantos webhooks quiser — todos são disparados em paralelo</li>
                <li>Compatível com Zapier, Make, N8N, ou qualquer endpoint que aceite POST</li>
              </ul>
            </div>
          </div>
        )}

        {/* UTMIFY TAB */}
        {activeTab === 'utmify' && (
          <div>
            <h2 className="text-xl font-black text-foreground mb-1">Integração Utmify</h2>
            <p className="text-muted-foreground text-xs mb-6">Rastreie suas vendas com a Utmify</p>

            <Card className="p-5 border border-border">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-centauro-green/10 flex items-center justify-center">
                  <Zap size={20} className="text-centauro-green" />
                </div>
                <div>
                  <h3 className="font-black text-foreground text-sm">Tokens da API</h3>
                  <p className="text-muted-foreground text-[11px]">Configure até 2 tokens Utmify para envio simultâneo</p>
                </div>
              </div>

              <div className="space-y-4">
                {/* Token 1 */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Token 1</label>
                  <Input
                    type="password"
                    value={utmifyConfig.apiToken}
                    onChange={(e) => setUtmifyConfig(prev => ({ ...prev, apiToken: e.target.value }))}
                    placeholder="Cole aqui o Token 1 da Utmify"
                    className="font-mono text-xs"
                  />
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleTestUtmify(1)}
                      variant="outline"
                      size="sm"
                      className="text-xs font-bold"
                      disabled={utmifyTesting || !utmifyConfig.apiToken}
                    >
                      {utmifyTesting ? <Loader2 size={14} className="mr-1.5 animate-spin" /> : <Zap size={14} className="mr-1.5" />}
                      {utmifyTesting ? 'Testando...' : 'Testar Token 1'}
                    </Button>
                    {utmifyConfig.apiToken && (
                      <Button
                        onClick={() => handleDeleteUtmifyToken(1)}
                        variant="outline"
                        size="sm"
                        className="text-xs font-bold text-destructive border-destructive/30 hover:bg-destructive/10"
                      >
                        <Trash2 size={14} className="mr-1.5" /> Excluir
                      </Button>
                    )}
                  </div>
                  {utmifyMessage && (
                    <div className={`p-2 rounded-md text-center text-xs font-bold ${
                      utmifyMessage.includes('válido') || utmifyMessage.includes('sucesso') || utmifyMessage.includes('✓') || utmifyMessage.includes('salvo')
                        ? 'bg-centauro-green/10 text-centauro-green'
                        : 'bg-destructive/10 text-destructive'
                    }`}>{utmifyMessage}</div>
                  )}
                </div>

                {/* Token 2 */}
                <div className="space-y-2 pt-2 border-t border-border">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Token 2 (opcional)</label>
                  <Input
                    type="password"
                    value={utmifyConfig.apiToken2}
                    onChange={(e) => setUtmifyConfig(prev => ({ ...prev, apiToken2: e.target.value }))}
                    placeholder="Cole aqui o Token 2 da Utmify"
                    className="font-mono text-xs"
                  />
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleTestUtmify(2)}
                      variant="outline"
                      size="sm"
                      className="text-xs font-bold"
                      disabled={utmifyTesting2 || !utmifyConfig.apiToken2}
                    >
                      {utmifyTesting2 ? <Loader2 size={14} className="mr-1.5 animate-spin" /> : <Zap size={14} className="mr-1.5" />}
                      {utmifyTesting2 ? 'Testando...' : 'Testar Token 2'}
                    </Button>
                    {utmifyConfig.apiToken2 && (
                      <Button
                        onClick={() => handleDeleteUtmifyToken(2)}
                        variant="outline"
                        size="sm"
                        className="text-xs font-bold text-destructive border-destructive/30 hover:bg-destructive/10"
                      >
                        <Trash2 size={14} className="mr-1.5" /> Excluir
                      </Button>
                    )}
                  </div>
                  {utmifyMessage2 && (
                    <div className={`p-2 rounded-md text-center text-xs font-bold ${
                      utmifyMessage2.includes('válido') || utmifyMessage2.includes('sucesso') || utmifyMessage2.includes('✓') || utmifyMessage2.includes('salvo')
                        ? 'bg-centauro-green/10 text-centauro-green'
                        : 'bg-destructive/10 text-destructive'
                    }`}>{utmifyMessage2}</div>
                  )}
                </div>

                <Button onClick={handleSaveUtmify} className="w-full bg-centauro-green hover:bg-centauro-green/90 text-primary-foreground font-bold text-xs">
                  <Save size={14} className="mr-1.5" /> Salvar Tokens
                </Button>
              </div>
            </Card>

            <div className="bg-centauro-gold/10 p-3.5 rounded-md border border-centauro-gold/20 mt-4">
              <div className="flex items-center gap-1.5 mb-1.5">
                <Info size={13} className="text-centauro-gold" />
                <h3 className="font-bold text-foreground text-[11px]">Como funciona</h3>
              </div>
              <ul className="text-[10px] text-muted-foreground space-y-0.5 pl-5 list-disc">
                <li><strong>Token:</strong> Gere em Utmify → Integrações → Credenciais de API</li>
                <li><strong>Teste:</strong> Envia um pedido de teste (isTest: true) para validar o token</li>
                <li>Eventos de venda são enviados automaticamente ao clicar no checkout</li>
                <li>Parâmetros UTM são capturados e enviados junto com a venda</li>
                <li>O endpoint usado é: <code className="bg-card px-1 py-0.5 rounded text-[9px]">api.utmify.com.br/api-credentials/orders</code></li>
              </ul>
            </div>
          </div>
        )}

        {/* PAGAMENTOS TAB */}
        {activeTab === 'pagamentos' && (
          <div>
            <h2 className="text-xl font-black text-foreground mb-1">Gateways de Pagamento</h2>
            <p className="text-muted-foreground text-xs mb-6">Configure os gateways para gerar cobranças PIX</p>

            {/* Active Gateway Selector */}
            <Card className="p-4 mb-4 border border-border">
              <div className="flex items-center gap-2 mb-2">
                <QrCode size={16} className="text-centauro-green" />
                <span className="font-black text-foreground text-sm">Gateway Ativo</span>
              </div>
              <div className="flex gap-2 flex-wrap">
                {(['vennox', 'centurionpay', 'ironpay', 'hypercash'] as const).map((gw) => (
                  <button
                    key={gw}
                    onClick={async () => {
                      const updated = { ...gatewayConfig, activeGateway: gw };
                      setGatewayConfig(updated);
                      await savePaymentGatewayConfig(updated);
                      const names: Record<string, string> = { vennox: 'Vennox', centurionpay: 'Centurion Pay', ironpay: 'Iron Pay', hypercash: 'Hyper Cash' };
                      setGatewayMessage(`Gateway ativo: ${names[gw]}`);
                      setTimeout(() => setGatewayMessage(''), 3000);
                    }}
                    className={`flex-1 min-w-[80px] px-3 py-2.5 rounded-lg text-xs font-bold border-2 transition-all ${
                      gatewayConfig.activeGateway === gw
                        ? 'border-centauro-green bg-centauro-green/5 text-centauro-green'
                        : 'border-border text-muted-foreground hover:border-muted-foreground/30'
                    }`}
                  >
                    {gw === 'vennox' ? 'Vennox' : gw === 'centurionpay' ? 'Centurion Pay' : gw === 'ironpay' ? 'Iron Pay' : 'Hyper Cash'}
                  </button>
                ))}
              </div>
              <StatusMessage msg={gatewayMessage} />
            </Card>

            {/* Pagou.ai removido do painel */}

            {/* Vennox Config */}
            <Card className="p-5 border border-border">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <CreditCard size={20} className="text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-black text-foreground text-sm">Vennox</h3>
                  <p className="text-muted-foreground text-[11px]">VennoxPay - Gateway PIX</p>
                </div>
                {gatewayConfig.activeGateway === 'vennox' && (
                  <Badge className="bg-centauro-green/10 text-centauro-green border-centauro-green/30 text-[10px]">Ativo</Badge>
                )}
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Secret Key</label>
                  <Input
                    type="password"
                    value={gatewayConfig.vennox.secretKey}
                    onChange={(e) => setGatewayConfig(prev => ({
                      ...prev,
                      vennox: { ...prev.vennox, secretKey: e.target.value }
                    }))}
                    placeholder="sua_secret_key_aqui"
                    className="font-mono text-xs mt-1"
                  />
                  <p className="text-[9px] text-muted-foreground mt-1">Vennox → Integrações → Chaves de API → Secret Key</p>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Company ID</label>
                  <Input
                    type="text"
                    value={gatewayConfig.vennox.companyId}
                    onChange={(e) => setGatewayConfig(prev => ({
                      ...prev,
                      vennox: { ...prev.vennox, companyId: e.target.value }
                    }))}
                    placeholder="seu_company_id_aqui"
                    className="font-mono text-xs mt-1"
                  />
                  <p className="text-[9px] text-muted-foreground mt-1">Vennox → Integrações → Chaves de API → Company ID</p>
                </div>

                <Button
                  onClick={async () => {
                    await savePaymentGatewayConfig(gatewayConfig);
                    setGatewayMessage('Configuração da Vennox salva com sucesso!');
                    setTimeout(() => setGatewayMessage(''), 3000);
                  }}
                  className="w-full bg-centauro-green hover:bg-centauro-green/90 text-primary-foreground font-bold text-xs"
                >
                  <Save size={14} className="mr-1.5" /> Salvar Vennox
                </Button>
              </div>
            </Card>

            {/* Centurion Pay Config */}
            <Card className="p-5 border border-border mt-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <CreditCard size={20} className="text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-black text-foreground text-sm">Centurion Pay</h3>
                  <p className="text-muted-foreground text-[11px]">CenturionPay - Gateway PIX</p>
                </div>
                {gatewayConfig.activeGateway === 'centurionpay' && (
                  <Badge className="bg-centauro-green/10 text-centauro-green border-centauro-green/30 text-[10px]">Ativo</Badge>
                )}
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Company ID</label>
                  <Input
                    type="text"
                    value={gatewayConfig.centurionpay?.companyId || ''}
                    onChange={(e) => setGatewayConfig(prev => ({
                      ...prev,
                      centurionpay: { ...prev.centurionpay, companyId: e.target.value }
                    }))}
                    placeholder="2499a6bb-42e6-44c6-bab0-d9bd6aa3c503"
                    className="font-mono text-xs mt-1"
                  />
                  <p className="text-[9px] text-muted-foreground mt-1">Centurion Pay → Integrações → Company ID</p>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Chave Secreta (Secret Key)</label>
                  <Input
                    type="password"
                    value={gatewayConfig.centurionpay?.secretKey || ''}
                    onChange={(e) => setGatewayConfig(prev => ({
                      ...prev,
                      centurionpay: { ...prev.centurionpay, secretKey: e.target.value }
                    }))}
                    placeholder="sk_live_..."
                    className="font-mono text-xs mt-1"
                  />
                  <p className="text-[9px] text-muted-foreground mt-1">Centurion Pay → Integrações → Chave Secreta</p>
                </div>

                <Button
                  onClick={async () => {
                    await savePaymentGatewayConfig(gatewayConfig);
                    setGatewayMessage('Configuração da Centurion Pay salva com sucesso!');
                    setTimeout(() => setGatewayMessage(''), 3000);
                  }}
                  className="w-full bg-centauro-green hover:bg-centauro-green/90 text-primary-foreground font-bold text-xs"
                >
                  <Save size={14} className="mr-1.5" /> Salvar Centurion Pay
                </Button>
              </div>
            </Card>

            {/* Iron Pay Config */}
            <Card className="p-5 border border-border mt-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <CreditCard size={20} className="text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-black text-foreground text-sm">Iron Pay</h3>
                  <p className="text-muted-foreground text-[11px]">IronPay - Gateway PIX</p>
                </div>
                {gatewayConfig.activeGateway === 'ironpay' && (
                  <Badge className="bg-centauro-green/10 text-centauro-green border-centauro-green/30 text-[10px]">Ativo</Badge>
                )}
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Token da API Pública</label>
                  <Input
                    type="password"
                    value={gatewayConfig.ironpay?.apiToken || ''}
                    onChange={(e) => setGatewayConfig(prev => ({
                      ...prev,
                      ironpay: { ...prev.ironpay, apiToken: e.target.value }
                    }))}
                    placeholder="RUOkOpSr6bO7jIo6yAJk..."
                    className="font-mono text-xs mt-1"
                  />
                  <p className="text-[9px] text-muted-foreground mt-1">Iron Pay → Configurações de API → Token de Acesso</p>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Hash da Oferta</label>
                  <Input
                    type="text"
                    value={gatewayConfig.ironpay?.offerHash || ''}
                    onChange={(e) => setGatewayConfig(prev => ({
                      ...prev,
                      ironpay: { ...prev.ironpay, offerHash: e.target.value }
                    }))}
                    placeholder="hash-da-oferta-ironpay"
                    className="font-mono text-xs mt-1"
                  />
                  <p className="text-[9px] text-muted-foreground mt-1">Iron Pay → Produtos → Oferta → Copiar Hash</p>
                </div>

                <Button
                  onClick={async () => {
                    await savePaymentGatewayConfig(gatewayConfig);
                    setGatewayMessage('Configuração da Iron Pay salva com sucesso!');
                    setTimeout(() => setGatewayMessage(''), 3000);
                  }}
                  className="w-full bg-centauro-green hover:bg-centauro-green/90 text-primary-foreground font-bold text-xs"
                >
                  <Save size={14} className="mr-1.5" /> Salvar Iron Pay
                </Button>
              </div>
            </Card>

            {/* Hyper Cash Config */}
            <Card className="p-5 border border-border mt-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <CreditCard size={20} className="text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-black text-foreground text-sm">Hyper Cash</h3>
                  <p className="text-muted-foreground text-[11px]">HyperCash - Gateway PIX</p>
                </div>
                {gatewayConfig.activeGateway === 'hypercash' && (
                  <Badge className="bg-centauro-green/10 text-centauro-green border-centauro-green/30 text-[10px]">Ativo</Badge>
                )}
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Credencial Pública (Public Key)</label>
                  <Input
                    type="text"
                    value={gatewayConfig.hypercash?.publicKey || ''}
                    onChange={(e) => setGatewayConfig(prev => ({
                      ...prev,
                      hypercash: { ...prev.hypercash, publicKey: e.target.value }
                    }))}
                    placeholder="pk_173673057fe1aef57e73f954bbbc05340e420353"
                    className="font-mono text-xs mt-1"
                  />
                  <p className="text-[9px] text-muted-foreground mt-1">Hyper Cash → Integrações → Credencial Pública</p>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Credencial Secreta (Secret Key)</label>
                  <Input
                    type="password"
                    value={gatewayConfig.hypercash?.secretKey || ''}
                    onChange={(e) => setGatewayConfig(prev => ({
                      ...prev,
                      hypercash: { ...prev.hypercash, secretKey: e.target.value }
                    }))}
                    placeholder="a3fb31dd-80a6-4074-b680-a4e34085cac6"
                    className="font-mono text-xs mt-1"
                  />
                  <p className="text-[9px] text-muted-foreground mt-1">Hyper Cash → Integrações → Credencial Secreta</p>
                </div>

                <Button
                  onClick={async () => {
                    await savePaymentGatewayConfig(gatewayConfig);
                    setGatewayMessage('Configuração da Hyper Cash salva com sucesso!');
                    setTimeout(() => setGatewayMessage(''), 3000);
                  }}
                  className="w-full bg-centauro-green hover:bg-centauro-green/90 text-primary-foreground font-bold text-xs"
                >
                  <Save size={14} className="mr-1.5" /> Salvar Hyper Cash
                </Button>
              </div>
            </Card>

            <div className="bg-centauro-gold/10 p-3.5 rounded-md border border-centauro-gold/20 mt-4">
              <div className="flex items-center gap-1.5 mb-1.5">
                <Info size={13} className="text-centauro-gold" />
                <h3 className="font-bold text-foreground text-[11px]">Como funciona</h3>
              </div>
              <ul className="text-[10px] text-muted-foreground space-y-0.5 pl-5 list-disc">
                <li>O gateway ativo será usado para gerar o QR Code PIX no checkout</li>
                <li>As chaves são enviadas de forma segura via servidor</li>
                <li>Alterne entre gateways clicando no botão do gateway desejado acima</li>
                <li><strong>Pagou.ai:</strong> Public Key + Secret Key</li>
                <li><strong>Vennox:</strong> Secret Key + Company ID (autenticação Basic)</li>
                <li><strong>Centurion Pay:</strong> Company ID + Secret Key (autenticação Basic)</li>
                <li><strong>Iron Pay:</strong> Token da API Pública + Hash da Oferta</li>
                <li><strong>Hyper Cash:</strong> Credencial Pública + Credencial Secreta</li>
              </ul>
            </div>
          </div>
        )}

        {/* PEDIDOS TAB */}
        {activeTab === 'pedidos' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-black text-foreground mb-1">Pedidos</h2>
                <p className="text-muted-foreground text-xs">Visualize os pedidos gerados via PIX</p>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={async () => {
                    if (!confirm('Tem certeza que deseja limpar TODOS os pedidos?')) return;
                    await supabase.from('orders').delete().neq('id', '00000000-0000-0000-0000-000000000000');
                    fetchOrders();
                  }}
                  variant="outline"
                  size="sm"
                  className="text-xs font-bold text-destructive hover:bg-destructive/10"
                >
                  <Trash2 size={14} className="mr-1" /> Limpar
                </Button>
                <Button onClick={fetchOrders} variant="outline" size="sm" className="text-xs font-bold" disabled={ordersLoading}>
                  <RefreshCw size={14} className={`mr-1 ${ordersLoading ? 'animate-spin' : ''}`} />
                  Atualizar
                </Button>
              </div>
            </div>

            {orders.length === 0 && !ordersLoading && (
              <Card className="p-8 border border-border text-center">
                <ShoppingCart size={32} className="mx-auto mb-3 text-muted-foreground" />
                <p className="text-sm font-bold text-foreground">Nenhum pedido ainda</p>
                <p className="text-xs text-muted-foreground mt-1">Os pedidos aparecerão aqui quando clientes gerarem PIX</p>
                <Button onClick={fetchOrders} className="mt-4 bg-primary text-primary-foreground text-xs font-bold" size="sm">
                  Carregar Pedidos
                </Button>
              </Card>
            )}

            {ordersLoading && (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            )}

            {orders.length > 0 && (
              <div className="space-y-3">
                {orders.map((order) => (
                  <Card key={order.id} className="p-4 border border-border">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="text-xs font-black text-foreground">{order.buyer_name || 'Sem nome'}</p>
                        <p className="text-[10px] text-muted-foreground">{order.buyer_email || 'Sem email'}</p>
                        {order.buyer_phone && <p className="text-[10px] text-muted-foreground">{order.buyer_phone}</p>}
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <Badge className={`text-[10px] ${order.status === 'paid' ? 'bg-centauro-green/10 text-centauro-green border-centauro-green/30' : 'bg-centauro-gold/10 text-centauro-gold border-centauro-gold/30'}`}>
                          {order.status === 'paid' ? 'Pago' : 'Pendente'}
                        </Badge>
                        <Badge variant="outline" className={`text-[10px] ${order.qr_code_copied ? 'border-centauro-green/30 text-centauro-green' : 'border-muted-foreground/30 text-muted-foreground'}`}>
                          <Copy size={10} className="mr-1" />
                          {order.qr_code_copied ? 'Copiado' : 'Não copiado'}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-border">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-foreground">
                          R$ {(order.amount_cents / 100).toFixed(2).replace('.', ',')}
                        </span>
                        <Badge variant="outline" className="text-[9px]">{order.gateway}</Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        {order.status !== 'paid' && (
                          <Button
                            size="sm"
                            className="h-6 px-2 text-[10px] font-bold bg-centauro-green hover:bg-centauro-green/90 text-primary-foreground"
                            onClick={async () => {
                              const { error } = await supabase.functions.invoke('payment-webhook', {
                                body: { orderId: order.id, action: 'approve' },
                              });
                              if (!error) {
                                fireWebhookEvent('venda_aprovada', {
                                  source: 'quiz-copa-2026',
                                  buyerName: order.buyer_name,
                                  buyerEmail: order.buyer_email,
                                  buyerPhone: order.buyer_phone,
                                  amount: order.amount_cents / 100,
                                  orderId: order.id,
                                  gateway: order.gateway,
                                });
                                fetchOrders();
                              }
                            }}
                          >
                            <CheckCircle size={10} className="mr-1" /> Aprovar
                          </Button>
                        )}
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(order.created_at).toLocaleString('pt-BR')}
                        </span>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}


        {activeTab === 'checkout' && (
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-black text-foreground mb-1">Checkout</h2>
              <p className="text-muted-foreground text-xs">Defina o destino do botão "Garantir Meus Prêmios"</p>
            </div>

            <Card className="border border-border p-5 space-y-4">
              {/* Toggle */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ExternalLink size={14} className="text-muted-foreground" />
                  <span className="font-bold text-foreground text-xs">Usar checkout externo</span>
                </div>
                <Switch
                  checked={externalCheckout}
                  onCheckedChange={(checked) => {
                    setExternalCheckout(checked);
                    localStorage.setItem('externalCheckout', String(checked));
                  }}
                />
              </div>

              {/* URL field */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Link do checkout externo</label>
                <Input
                  type="url"
                  value={newCheckoutUrl}
                  onChange={(e) => setNewCheckoutUrl(e.target.value)}
                  placeholder="https://seu-checkout.com/pagamento"
                  className="font-mono text-xs"
                />
                <Button onClick={handleSave} className="w-full bg-centauro-green hover:bg-centauro-green/90 text-primary-foreground font-bold text-xs" size="sm">
                  <Save size={14} className="mr-1.5" /> Salvar Link
                </Button>
                <StatusMessage msg={message} />
              </div>

              {/* Status info */}
              <p className="text-[10px] text-muted-foreground">
                {externalCheckout
                  ? checkoutUrl ? `Redirecionando para: ${checkoutUrl}` : 'Nenhum link configurado ainda'
                  : 'Usando o checkout interno do quiz (CPF → endereço → pagamento)'}
              </p>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
