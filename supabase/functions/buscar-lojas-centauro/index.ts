import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const GOOGLE_MAPS_API_KEY = Deno.env.get('GOOGLE_MAPS_API_KEY');
    if (!GOOGLE_MAPS_API_KEY) {
      throw new Error('GOOGLE_MAPS_API_KEY não configurada');
    }

    const { cep } = await req.json();
    if (!cep || cep.replace(/\D/g, '').length !== 8) {
      return new Response(JSON.stringify({ error: 'CEP inválido' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const cleanCep = cep.replace(/\D/g, '');

    // Step 1: Geocode the CEP to get lat/lng
    const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${cleanCep}&region=br&key=${GOOGLE_MAPS_API_KEY}`;
    const geocodeRes = await fetch(geocodeUrl);
    const geocodeData = await geocodeRes.json();

    if (geocodeData.status !== 'OK' || !geocodeData.results?.length) {
      return new Response(JSON.stringify({ stores: [], message: 'CEP não encontrado no Google Maps' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { lat, lng } = geocodeData.results[0].geometry.location;

    // Step 2: Nearby Search for Centauro stores, sorted by distance
    const placesUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?keyword=Centauro&location=${lat},${lng}&rankby=distance&type=store&language=pt-BR&key=${GOOGLE_MAPS_API_KEY}`;
    const placesRes = await fetch(placesUrl);
    const placesData = await placesRes.json();

    if (placesData.status !== 'OK' || !placesData.results?.length) {
      return new Response(JSON.stringify({ stores: [] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Filter to actual Centauro stores — results already sorted by distance
    const centauroStores = placesData.results
      .filter((place: any) => {
        const name = (place.name || '').toLowerCase();
        return name.includes('centauro');
      })
      .slice(0, 5)
      .map((place: any) => ({
        name: place.name,
        address: place.vicinity || place.formatted_address || '',
        rating: place.rating,
        open_now: place.opening_hours?.open_now ?? null,
        place_id: place.place_id,
        lat: place.geometry?.location?.lat,
        lng: place.geometry?.location?.lng,
      }));

    return new Response(JSON.stringify({ stores: centauroStores }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Erro ao buscar lojas:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
