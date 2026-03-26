CREATE TABLE public.gateway_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  active_gateway text NOT NULL DEFAULT 'centurionpay',
  pagouai_public_key text DEFAULT '',
  pagouai_secret_key text DEFAULT '',
  vennox_secret_key text DEFAULT '',
  vennox_company_id text DEFAULT '',
  centurionpay_secret_key text DEFAULT '',
  centurionpay_company_id text DEFAULT '',
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.gateway_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read" ON public.gateway_config FOR SELECT TO anon USING (true);
CREATE POLICY "Allow public update" ON public.gateway_config FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow public insert" ON public.gateway_config FOR INSERT TO anon WITH CHECK (true);

INSERT INTO public.gateway_config (active_gateway) VALUES ('centurionpay');