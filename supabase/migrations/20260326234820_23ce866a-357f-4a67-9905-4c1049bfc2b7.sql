CREATE TABLE public.webhook_endpoints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  url text NOT NULL,
  events text[] NOT NULL DEFAULT '{"venda_pendente","venda_aprovada"}',
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.webhook_endpoints ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read webhook_endpoints" ON public.webhook_endpoints FOR SELECT TO anon USING (true);
CREATE POLICY "Allow public insert webhook_endpoints" ON public.webhook_endpoints FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow public update webhook_endpoints" ON public.webhook_endpoints FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow public delete webhook_endpoints" ON public.webhook_endpoints FOR DELETE TO anon USING (true);