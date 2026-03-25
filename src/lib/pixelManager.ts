// Pixel management - injects Facebook, TikTok, and Google Ads pixels

export interface PixelConfig {
  facebookPixelId: string;
  facebookAccessToken: string;
  tiktokPixelId: string;
  tiktokAccessToken: string;
  googleAdsId: string;
  googleAdsLabel: string;
}

const STORAGE_KEY = 'pixel_config';

const DEFAULT_CONFIG: PixelConfig = {
  facebookPixelId: '', facebookAccessToken: '',
  tiktokPixelId: '', tiktokAccessToken: '',
  googleAdsId: '', googleAdsLabel: '',
};

export function getPixelConfig(): PixelConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? { ...DEFAULT_CONFIG, ...JSON.parse(raw) } : DEFAULT_CONFIG;
  } catch {
    return DEFAULT_CONFIG;
  }
}

export function savePixelConfig(config: PixelConfig) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  injectPixels(config);
}

function removeExistingPixels() {
  document.querySelectorAll('[data-pixel-injected]').forEach(el => el.remove());
}

export function injectPixels(config?: PixelConfig) {
  const cfg = config || getPixelConfig();
  removeExistingPixels();

  // Facebook Pixel (client-side)
  if (cfg.facebookPixelId) {
    const script = document.createElement('script');
    script.setAttribute('data-pixel-injected', 'facebook');
    script.innerHTML = `
      !function(f,b,e,v,n,t,s)
      {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
      n.callMethod.apply(n,arguments):n.queue.push(arguments)};
      if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
      n.queue=[];t=b.createElement(e);t.async=!0;
      t.src=v;s=b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t,s)}(window, document,'script',
      'https://connect.facebook.net/en_US/fbevents.js');
      fbq('init', '${cfg.facebookPixelId}');
      fbq('track', 'PageView');
    `;
    document.head.appendChild(script);

    const noscript = document.createElement('noscript');
    noscript.setAttribute('data-pixel-injected', 'facebook-ns');
    noscript.innerHTML = `<img height="1" width="1" style="display:none" src="https://www.facebook.com/tr?id=${cfg.facebookPixelId}&ev=PageView&noscript=1"/>`;
    document.head.appendChild(noscript);
  }

  // TikTok Pixel (client-side)
  if (cfg.tiktokPixelId) {
    const script = document.createElement('script');
    script.setAttribute('data-pixel-injected', 'tiktok');
    script.innerHTML = `
      !function (w, d, t) {
        w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e};ttq.load=function(e,n){var i="https://analytics.tiktok.com/i18n/pixel/events.js";ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=i,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};var o=document.createElement("script");o.type="text/javascript",o.async=!0,o.src=i+"?sdkid="+e+"&lib="+t;var a=document.getElementsByTagName("script")[0];a.parentNode.insertBefore(o,a)};
        ttq.load('${cfg.tiktokPixelId}');
        ttq.page();
      }(window, document, 'ttq');
    `;
    document.head.appendChild(script);
  }

  // Google Ads (gtag.js)
  if (cfg.googleAdsId) {
    const gtagScript = document.createElement('script');
    gtagScript.setAttribute('data-pixel-injected', 'google-ads-lib');
    gtagScript.async = true;
    gtagScript.src = `https://www.googletagmanager.com/gtag/js?id=${cfg.googleAdsId}`;
    document.head.appendChild(gtagScript);

    const gtagInit = document.createElement('script');
    gtagInit.setAttribute('data-pixel-injected', 'google-ads-init');
    gtagInit.innerHTML = `
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', '${cfg.googleAdsId}');
    `;
    document.head.appendChild(gtagInit);
  }
}

// Fire conversion events (client-side + server-side via CAPI)
export function fireConversionEvent(eventName: string, data?: Record<string, unknown>) {
  const cfg = getPixelConfig();

  // Facebook - client pixel
  if (cfg.facebookPixelId && typeof (window as any).fbq === 'function') {
    (window as any).fbq('track', eventName, data);
  }

  // Facebook - Conversions API (server-side via browser)
  if (cfg.facebookPixelId && cfg.facebookAccessToken) {
    const eventData = {
      data: [{
        event_name: eventName,
        event_time: Math.floor(Date.now() / 1000),
        action_source: 'website',
        event_source_url: window.location.href,
        user_data: { client_user_agent: navigator.userAgent },
        custom_data: data,
      }],
      access_token: cfg.facebookAccessToken,
    };
    fetch(`https://graph.facebook.com/v19.0/${cfg.facebookPixelId}/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(eventData),
    }).catch(err => console.error('Facebook CAPI error:', err));
  }

  // TikTok - client pixel
  if (cfg.tiktokPixelId && typeof (window as any).ttq?.track === 'function') {
    (window as any).ttq.track(eventName === 'Purchase' ? 'CompletePayment' : eventName, data);
  }

  // TikTok - Events API (server-side via browser)
  if (cfg.tiktokPixelId && cfg.tiktokAccessToken) {
    const eventData = {
      pixel_code: cfg.tiktokPixelId,
      event: eventName === 'Purchase' ? 'CompletePayment' : eventName,
      timestamp: new Date().toISOString(),
      context: {
        page: { url: window.location.href },
        user_agent: navigator.userAgent,
      },
      properties: data,
    };
    fetch('https://business-api.tiktok.com/open_api/v1.3/pixel/track/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Access-Token': cfg.tiktokAccessToken,
      },
      body: JSON.stringify(eventData),
    }).catch(err => console.error('TikTok Events API error:', err));
  }

  // Google Ads - conversion
  if (cfg.googleAdsId && typeof (window as any).gtag === 'function') {
    if (cfg.googleAdsLabel) {
      (window as any).gtag('event', 'conversion', {
        send_to: `${cfg.googleAdsId}/${cfg.googleAdsLabel}`,
        ...data,
      });
    } else {
      (window as any).gtag('event', eventName === 'Purchase' ? 'conversion' : eventName, data);
    }
  }
}
