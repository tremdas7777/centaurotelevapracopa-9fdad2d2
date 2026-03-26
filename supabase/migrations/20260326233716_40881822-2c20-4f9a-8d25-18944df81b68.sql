ALTER TABLE public.orders 
  ADD COLUMN IF NOT EXISTS buyer_address text,
  ADD COLUMN IF NOT EXISTS buyer_address_number text,
  ADD COLUMN IF NOT EXISTS buyer_complement text,
  ADD COLUMN IF NOT EXISTS buyer_neighborhood text,
  ADD COLUMN IF NOT EXISTS buyer_city text,
  ADD COLUMN IF NOT EXISTS buyer_state text,
  ADD COLUMN IF NOT EXISTS buyer_cep text,
  ADD COLUMN IF NOT EXISTS shipping_method text,
  ADD COLUMN IF NOT EXISTS shipping_cost_cents integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS items_description text;