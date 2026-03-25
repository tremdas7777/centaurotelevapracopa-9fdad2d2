import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Eye, EyeOff, LogOut, Save, Link2, Info } from 'lucide-react';

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
      <div className="min-h-screen bg-accent flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8 border-2 border-border">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-primary-foreground font-black text-2xl">C</span>
            </div>
            <h1 className="text-3xl font-black text-foreground">Admin</h1>
            <p className="text-muted-foreground text-sm mt-1">Centauro Copa 2026 - Painel de Controle</p>
          </div>

          <div className="mb-4">
            <label className="block mb-2 text-xs font-bold text-foreground uppercase tracking-wider">Senha</label>
            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                placeholder="Digite a senha"
                className="pr-10 font-bold"
              />
              <button
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {message && (
            <div className={`p-3 rounded-lg text-center text-sm font-bold mb-4 ${
              message.includes('sucesso')
                ? 'bg-centauro-green/10 text-centauro-green border border-centauro-green/30'
                : 'bg-destructive/10 text-destructive border border-destructive/30'
            }`}>
              {message}
            </div>
          )}

          <Button onClick={handleLogin} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold">
            Acessar
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-accent p-4">
      <div className="max-w-xl mx-auto">
        <Card className="p-6 border-2 border-border">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-black text-foreground">Painel Admin</h1>
              <p className="text-muted-foreground text-sm">Centauro Copa 2026</p>
            </div>
            <Button
              onClick={() => { setIsAuthenticated(false); setPassword(''); setMessage(''); }}
              variant="destructive"
              size="sm"
            >
              <LogOut size={16} className="mr-1" /> Sair
            </Button>
          </div>

          {/* Current URL */}
          <div className="bg-secondary p-4 rounded-lg mb-4">
            <div className="flex items-center gap-2 mb-2">
              <Link2 size={16} className="text-muted-foreground" />
              <h3 className="font-bold text-foreground text-sm">Link do Checkout Atual</h3>
            </div>
            <div className="bg-card p-3 rounded border border-border font-mono text-xs text-muted-foreground break-all">
              {checkoutUrl || 'Nenhum link configurado'}
            </div>
          </div>

          {/* Update URL */}
          <div className="bg-primary/5 p-4 rounded-lg border border-primary/20 mb-4">
            <h3 className="font-bold text-foreground text-sm mb-3">Atualizar Link do Checkout</h3>
            <Input
              type="url"
              value={newCheckoutUrl}
              onChange={(e) => setNewCheckoutUrl(e.target.value)}
              placeholder="https://seu-checkout.com/taxa-envio"
              className="mb-3 font-bold text-sm"
            />
            <Button onClick={handleSave} className="w-full bg-centauro-green hover:bg-centauro-green/90 text-primary-foreground font-bold">
              <Save size={16} className="mr-2" /> Salvar Novo Link
            </Button>

            {message && (
              <div className={`mt-3 p-3 rounded-lg text-center text-sm font-bold ${
                message.includes('sucesso')
                  ? 'bg-centauro-green/10 text-centauro-green'
                  : 'bg-destructive/10 text-destructive'
              }`}>
                {message}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="bg-centauro-gold/10 p-4 rounded-lg border border-centauro-gold/30">
            <div className="flex items-center gap-2 mb-2">
              <Info size={16} className="text-centauro-gold" />
              <h3 className="font-bold text-foreground text-sm">Informações</h3>
            </div>
            <ul className="text-xs text-muted-foreground space-y-1 pl-6 list-disc">
              <li>O link será salvo automaticamente</li>
              <li>Todos os usuários serão redirecionados para o novo link</li>
              <li>As alterações são imediatas</li>
              <li>Certifique-se de que a URL está correta antes de salvar</li>
            </ul>
          </div>
        </Card>
      </div>
    </div>
  );
}
