
CREATE TABLE public.orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  external_id TEXT,
  gateway TEXT NOT NULL DEFAULT 'pagouai',
  status TEXT NOT NULL DEFAULT 'pending',
  amount_cents INTEGER NOT NULL,
  buyer_name TEXT,
  buyer_email TEXT,
  buyer_document TEXT,
  buyer_phone TEXT,
  pix_code TEXT,
  pix_qr_code_base64 TEXT,
  qr_code_copied BOOLEAN NOT NULL DEFAULT false,
  gateway_response JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public insert on orders" ON public.orders FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow public select on orders" ON public.orders FOR SELECT TO anon USING (true);
CREATE POLICY "Allow public update on orders" ON public.orders FOR UPDATE TO anon USING (true) WITH CHECK (true);
