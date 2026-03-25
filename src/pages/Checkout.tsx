import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CheckCircle, Truck, Shield, Lock, Ticket, Clock, Users, Loader2 } from 'lucide-react';
import centauroLogo from '@/assets/centauro-logo.webp';
import cbfLogo from '@/assets/cbf-logo.webp';
import camisaImg from '@/assets/camisa-brasil-hero.webp';
import albumImg from '@/assets/album-copa-hero.webp';
import { trackEvent } from '@/lib/funnelTracking';
import { fireConversionEvent } from '@/lib/pixelManager';
import { fireWebhookEvent } from '@/lib/webhookManager';
import { getPaymentGatewayConfig } from '@/lib/paymentGateway';
import { supabase } from '@/integrations/supabase/client';
import PixPopup from '@/components/PixPopup';
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle,
  AlertDialogDescription, AlertDialogFooter, AlertDialogAction
} from '@/components/ui/alert-dialog';

export default function Checkout() {
  const [searchParams] = useSearchParams();
  const prefilledName = searchParams.get('nome') || '';
  const prefilledCpf = searchParams.get('cpf') || '';

  const [nome, setNome] = useState(prefilledName);
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [cpf, setCpf] = useState(prefilledCpf ? formatCpf(prefilledCpf) : '');
  const [cep, setCep] = useState('');
  const [endereco, setEndereco] = useState('');
  const [numero, setNumero] = useState('');
  const [complemento, setComplemento] = useState('');
  const [bairro, setBairro] = useState('');
  const [cidade, setCidade] = useState('');
  const [estado, setEstado] = useState('');
  const [cepLoading, setCepLoading] = useState(false);
  const [shippingMethod, setShippingMethod] = useState<'sedex' | 'retirada' | null>(null);
  const [showStoreError, setShowStoreError] = useState(false);
  const [showCepError, setShowCepError] = useState(false);
  const [nearestStore, setNearestStore] = useState('');
  const [timeLeft, setTimeLeft] = useState(1800);
  const [viewersCount] = useState(Math.floor(Math.random() * 30) + 38);

  // PIX state
  const [pixLoading, setPixLoading] = useState(false);
  const [showPixPopup, setShowPixPopup] = useState(false);
  const [pixCode, setPixCode] = useState('');
  const [pixQrCodeBase64, setPixQrCodeBase64] = useState('');
  const [pixOrderId, setPixOrderId] = useState('');
  const [pixError, setPixError] = useState('');

  const cepValid = cep.replace(/\D/g, '').length === 8 && !!endereco;
  const shippingCost = shippingMethod === 'sedex' ? 44.90 : shippingMethod === 'retirada' ? 0 : null;

  useEffect(() => {
    window.scrollTo(0, 0);
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

  const formatCep = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 8);
    if (digits.length <= 5) return digits;
    return `${digits.slice(0, 5)}-${digits.slice(5)}`;
  };

  const formatTelefone = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 11);
    if (digits.length <= 2) return `(${digits}`;
    if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  };

  const formatCpf = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 11);
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
    if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
  };

  const handleCepChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCep(e.target.value);
    setCep(formatted);
    const digits = formatted.replace(/\D/g, '');
    if (digits.length === 8) {
      setCepLoading(true);
      try {
        const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
        const data = await res.json();
        if (!data.erro) {
          setEndereco(data.logradouro || '');
          setBairro(data.bairro || '');
          setCidade(data.localidade || '');
          setEstado(data.uf || '');
          const storeNumber = Math.floor(Math.random() * 900) + 100;
          setNearestStore(`Centauro - Shopping ${data.localidade || 'Centro'}, Nº ${storeNumber}, ${data.localidade || ''} - ${data.uf || ''}`);
        } else {
          setShowCepError(true);
          setEndereco('');
          setBairro('');
          setCidade('');
          setEstado('');
          setNearestStore('');
        }
      } catch {
        // ignore
      } finally {
        setCepLoading(false);
      }
    }
  };

  const handleSubmit = async () => {
    if (shippingMethod === 'retirada') {
      setShowStoreError(true);
      return;
    }

    trackEvent('checkout');
    fireConversionEvent('Purchase', { value: 44.90, currency: 'BRL' });

    const gatewayConfig = getPaymentGatewayConfig();
    const activeGateway = gatewayConfig.activeGateway;

    console.log('Gateway config:', JSON.stringify({ activeGateway, pagouaiHasSecret: !!gatewayConfig.pagouai.secretKey?.trim(), vennoxHasSecret: !!gatewayConfig.vennox.secretKey?.trim() }));

    const hasPagouaiKeys = !!gatewayConfig.pagouai.secretKey?.trim();
    const hasVennoxKeys = !!gatewayConfig.vennox.secretKey?.trim() && !!gatewayConfig.vennox.companyId?.trim();

    if (activeGateway === 'pagouai') {
      if (!hasPagouaiKeys) {
        setPixError('Gateway Pagou.ai não configurado. Vá em /admin → Pagamentos e salve as chaves.');
        setTimeout(() => setPixError(''), 8000);
        return;
      }
      setPixLoading(true);
      setPixError('');
      try {
        const { data, error } = await supabase.functions.invoke('criar-pix', {
          body: {
            publicKey: gatewayConfig.pagouai.publicKey,
            secretKey: gatewayConfig.pagouai.secretKey,
            amount: shippingCost || 44.90,
            buyerName: nome,
            buyerEmail: email,
            buyerDocument: cpf,
            buyerPhone: telefone,
          },
        });

        if (error) throw error;

        setPixCode(data.pix_code || '');
        setPixQrCodeBase64(data.pix_qr_code_base64 || '');
        setPixOrderId(data.order_id || '');
        setShowPixPopup(true);
        fireWebhookEvent('venda_pendente', { source: 'quiz-copa-2026', buyerName: nome, buyerEmail: email, buyerPhone: telefone, amount: shippingCost || 44.90, orderId: data.order_id, gateway: 'pagouai' });
      } catch (err: any) {
        console.error('PIX error:', err);
        setPixError('Erro ao gerar PIX. Tente novamente.');
        setTimeout(() => setPixError(''), 5000);
      } finally {
        setPixLoading(false);
      }
    } else if (activeGateway === 'vennox') {
      if (!hasVennoxKeys) {
        setPixError('Gateway Vennox não configurado. Configure as chaves no painel admin.');
        setTimeout(() => setPixError(''), 5000);
        return;
      }
      setPixLoading(true);
      setPixError('');
      try {
        const { data, error } = await supabase.functions.invoke('criar-pix-vennox', {
          body: {
            secretKey: gatewayConfig.vennox.secretKey,
            companyId: gatewayConfig.vennox.companyId,
            amount: shippingCost || 44.90,
            buyerName: nome,
            buyerEmail: email,
            buyerDocument: cpf,
            buyerPhone: telefone,
          },
        });

        if (error) throw error;

        setPixCode(data.pix_code || '');
        setPixQrCodeBase64(data.pix_qr_code_base64 || '');
        setPixOrderId(data.order_id || '');
        setShowPixPopup(true);
        fireWebhookEvent('venda_pendente', { source: 'quiz-copa-2026', buyerName: nome, buyerEmail: email, buyerPhone: telefone, amount: shippingCost || 44.90, orderId: data.order_id, gateway: 'vennox' });
      } catch (err: any) {
        console.error('PIX error:', err);
        setPixError('Erro ao gerar PIX. Tente novamente.');
        setTimeout(() => setPixError(''), 5000);
      } finally {
        setPixLoading(false);
      }
    }
  };

  const isFormValid = nome && email && telefone.replace(/\D/g, '').length >= 10 && cpf.replace(/\D/g, '').length === 11 && cep.replace(/\D/g, '').length === 8 && endereco && numero && bairro && cidade && estado && shippingMethod;

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

      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Order summary mini */}
        <Card className="p-4 mb-6 border border-border">
          <h3 className="text-sm font-black text-foreground mb-3 uppercase tracking-tight">Resumo do Pedido</h3>
          <div className="flex items-center gap-3 mb-2">
            <img src={camisaImg} alt="Camisa" className="w-12 h-12 object-contain rounded" />
            <div className="flex-1">
              <p className="text-xs font-bold text-foreground">Camisa Brasil 2026</p>
              <p className="text-[10px] text-muted-foreground">Edição Copa do Mundo</p>
            </div>
            <span className="text-xs font-black text-centauro-green">GRÁTIS</span>
          </div>
          <div className="flex items-center gap-3 mb-2">
            <img src={albumImg} alt="Álbum" className="w-12 h-12 object-contain rounded" />
            <div className="flex-1">
              <p className="text-xs font-bold text-foreground">Álbum Copa 2026 + 50 Packs</p>
              <p className="text-[10px] text-muted-foreground">Panini Edição Limitada</p>
            </div>
            <span className="text-xs font-black text-centauro-green">GRÁTIS</span>
          </div>
          <div className="flex items-center gap-3 pt-2 border-t border-border">
            <Ticket size={16} className="text-centauro-gold" />
            <div className="flex-1">
              <p className="text-xs font-bold text-foreground">Sorteio: 2 Ingressos VIP Copa</p>
            </div>
            <span className="text-xs font-black text-centauro-gold">INCLUSO</span>
          </div>
          {cepValid && shippingMethod === 'sedex' && (
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
              <span className="text-sm font-bold text-foreground">Frete SEDEX</span>
              <span className="text-lg font-black text-centauro-green">R$ 44,90</span>
            </div>
          )}
        </Card>

        {/* Checkout Form */}
        <Card className="p-5 md:p-6 mb-6 border border-border">
          <div className="flex items-center gap-2 mb-5">
            <Lock size={16} className="text-centauro-green" />
            <h3 className="text-base font-black text-foreground uppercase tracking-tight">Dados de Entrega</h3>
          </div>

          <div className="space-y-4">
            {/* Nome */}
            <div>
              <label className="text-xs font-bold text-foreground mb-1.5 block">Nome Completo</label>
              <Input
                placeholder="Seu nome completo"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="py-5"
              />
            </div>

            {/* Email + Telefone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-foreground mb-1.5 block">E-mail</label>
                <Input
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="py-5"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-foreground mb-1.5 block">Telefone</label>
                <Input
                  placeholder="(00) 00000-0000"
                  value={telefone}
                  onChange={(e) => setTelefone(formatTelefone(e.target.value))}
                  className="py-5"
                  maxLength={15}
                />
              </div>
            </div>

            {/* CPF */}
            <div>
              <label className="text-xs font-bold text-foreground mb-1.5 block">CPF</label>
              <Input
                placeholder="000.000.000-00"
                value={cpf}
                onChange={(e) => setCpf(formatCpf(e.target.value))}
                className="py-5"
                inputMode="numeric"
                maxLength={14}
              />
            </div>

            {/* CEP */}
            <div>
              <label className="text-xs font-bold text-foreground mb-1.5 block">CEP</label>
              <div className="relative">
                <Input
                  placeholder="00000-000"
                  value={cep}
                  onChange={handleCepChange}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  className="py-5"
                  maxLength={9}
                />
                {cepLoading && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
              </div>
            </div>

            {/* Endereço + Número */}
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2">
                <label className="text-xs font-bold text-foreground mb-1.5 block">Endereço</label>
                <Input
                  placeholder="Rua, Avenida..."
                  value={endereco}
                  onChange={(e) => setEndereco(e.target.value)}
                  className="py-5"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-foreground mb-1.5 block">Número</label>
                <Input
                  placeholder="Nº"
                  value={numero}
                  onChange={(e) => setNumero(e.target.value)}
                  className="py-5"
                />
              </div>
            </div>

            {/* Complemento */}
            <div>
              <label className="text-xs font-bold text-foreground mb-1.5 block">Complemento <span className="text-muted-foreground font-normal">(opcional)</span></label>
              <Input
                placeholder="Apto, Bloco..."
                value={complemento}
                onChange={(e) => setComplemento(e.target.value)}
                className="py-5"
              />
            </div>

            {/* Bairro + Cidade + Estado */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-bold text-foreground mb-1.5 block">Bairro</label>
                <Input placeholder="Bairro" value={bairro} onChange={(e) => setBairro(e.target.value)} className="py-5" />
              </div>
              <div>
                <label className="text-xs font-bold text-foreground mb-1.5 block">Cidade</label>
                <Input placeholder="Cidade" value={cidade} onChange={(e) => setCidade(e.target.value)} className="py-5" />
              </div>
              <div>
                <label className="text-xs font-bold text-foreground mb-1.5 block">Estado</label>
                <Input placeholder="UF" value={estado} onChange={(e) => setEstado(e.target.value.toUpperCase().slice(0, 2))} className="py-5" maxLength={2} />
              </div>
            </div>

            {/* Shipping Method Selection */}
            {cepValid && (
              <div>
                <label className="text-xs font-bold text-foreground mb-2 block">Método de Envio</label>
                <div className="space-y-3">
                  <div
                    onClick={() => setShippingMethod('sedex')}
                    className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${shippingMethod === 'sedex' ? 'border-centauro-green bg-centauro-green/5' : 'border-border hover:border-muted-foreground/30'}`}
                  >
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${shippingMethod === 'sedex' ? 'border-centauro-green' : 'border-muted-foreground/40'}`}>
                      {shippingMethod === 'sedex' && <div className="w-2.5 h-2.5 rounded-full bg-centauro-green" />}
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-bold text-foreground">Correios SEDEX</p>
                      <p className="text-[10px] text-muted-foreground">Prazo: 3 a 5 dias úteis</p>
                    </div>
                    <span className="text-sm font-black text-centauro-green">R$ 44,90</span>
                  </div>

                  {nearestStore && (
                  <div
                    onClick={() => setShippingMethod('retirada')}
                    className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${shippingMethod === 'retirada' ? 'border-centauro-green bg-centauro-green/5' : 'border-border hover:border-muted-foreground/30'}`}
                  >
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${shippingMethod === 'retirada' ? 'border-centauro-green' : 'border-muted-foreground/40'}`}>
                      {shippingMethod === 'retirada' && <div className="w-2.5 h-2.5 rounded-full bg-centauro-green" />}
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-bold text-foreground">Retirada na Loja Centauro</p>
                      <p className="text-[10px] text-muted-foreground">{nearestStore} — Disponível a partir de 15/06</p>
                    </div>
                  </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Submit */}
        {pixError && (
          <div className="mb-3 p-3 rounded-lg bg-destructive/10 text-destructive text-xs font-bold text-center border border-destructive/30">
            {pixError}
          </div>
        )}

        <Button
          onClick={handleSubmit}
          disabled={!isFormValid || pixLoading}
          className="w-full bg-centauro-green hover:bg-centauro-green/80 text-primary-foreground font-black text-base py-7 rounded-lg transition-transform hover:scale-[1.02] active:scale-95 mb-4"
          style={{ boxShadow: '0 6px 25px hsl(145 63% 42% / 0.5)', animation: 'pulse-glow-green 2s ease-in-out infinite' }}
        >
          {pixLoading ? (
            <><Loader2 size={18} className="mr-2 animate-spin" /> GERANDO PIX...</>
          ) : (
            shippingMethod === 'sedex' ? 'FINALIZAR PEDIDO — R$ 44,90' : 'FINALIZAR PEDIDO'
          )}
        </Button>

        {/* Trust */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { icon: CheckCircle, color: 'text-foreground', title: 'Resgate Imediato' },
            { icon: Truck, color: 'text-foreground', title: '3-5 dias úteis' },
            { icon: Shield, color: 'text-foreground', title: 'Compra Segura' },
          ].map(({ icon: Icon, color, title }) => (
            <div key={title} className="bg-card p-3 rounded-lg border border-border text-center">
              <Icon className={`${color} mx-auto mb-1`} size={18} />
              <p className="text-[10px] font-bold text-foreground">{title}</p>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="text-center py-4">
          <img src={centauroLogo} alt="Centauro" className="h-5 mx-auto mb-2 opacity-30" />
          <p className="text-muted-foreground text-[10px]">© 2026 Centauro Esportes. Todos os direitos reservados.</p>
        </div>
      </div>

      {/* Store Unavailable Error Popup */}
      <AlertDialog open={showStoreError} onOpenChange={setShowStoreError}>
        <AlertDialogContent className="max-w-[calc(100%-2rem)] mx-auto rounded-xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Unidade Indisponível</AlertDialogTitle>
            <AlertDialogDescription>
              A unidade <strong>{nearestStore || 'Centauro mais próxima'}</strong> está indisponível para retirada presencial no momento. Por favor, selecione o envio via Correios SEDEX.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction
              onClick={() => {
                setShippingMethod('sedex');
                setShowStoreError(false);
              }}
              className="bg-centauro-green hover:bg-centauro-green/80"
            >
              Enviar por SEDEX — R$ 44,90
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* CEP Error Popup */}
      <AlertDialog open={showCepError} onOpenChange={setShowCepError}>
        <AlertDialogContent className="max-w-[calc(100%-2rem)] mx-auto rounded-xl">
          <AlertDialogHeader>
            <AlertDialogTitle>CEP Inválido</AlertDialogTitle>
            <AlertDialogDescription>
              O CEP informado não foi encontrado. Por favor, verifique o número digitado e tente novamente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction
              onClick={() => {
                setShowCepError(false);
                setCep('');
              }}
              className="bg-primary hover:bg-primary/80"
            >
              Tentar Novamente
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* PIX Popup */}
      <PixPopup
        open={showPixPopup}
        onOpenChange={setShowPixPopup}
        pixCode={pixCode}
        pixQrCodeBase64={pixQrCodeBase64}
        orderId={pixOrderId}
        amount={shippingCost || 44.90}
      />
    </div>
  );
}
