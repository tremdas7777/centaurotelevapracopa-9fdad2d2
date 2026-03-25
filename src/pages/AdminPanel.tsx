import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Eye, EyeOff, LogOut, Save, Link2, Info } from 'lucide-react';
import centauroLogo from '@/assets/centauro-logo.png';

const ADMIN_PASSWORD = 'copa2026';

export default function AdminPanel() {
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [checkoutUrl, setCheckoutUrl] = useState('');
  const [newCheckoutUrl, setNewCheckoutUrl] = useState('');
  const [message, setMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('checkoutUrl');
    if (saved) {
      setCheckoutUrl(saved);
      setNewCheckoutUrl(saved);
    }
  }, []);

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

  return (
    <div className="min-h-screen bg-secondary p-4">
      <div className="max-w-xl mx-auto">
        {/* Top bar */}
        <div className="bg-primary rounded-t-lg py-3 px-4 flex items-center justify-between">
          <img src={centauroLogo} alt="Centauro" className="h-6 brightness-0 invert" />
          <Button
            onClick={() => { setIsAuthenticated(false); setPassword(''); setMessage(''); }}
            variant="ghost"
            size="sm"
            className="text-primary-foreground hover:bg-primary-foreground/10 text-xs font-bold"
          >
            <LogOut size={14} className="mr-1" /> Sair
          </Button>
        </div>

        <Card className="rounded-t-none border border-t-0 border-border p-5">
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
      </div>
    </div>
  );
}
