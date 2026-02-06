import { NextResponse } from 'next/server';

type Provider = 'google' | 'facebook';

type TokenResponse = {
  id_token?: string;
  access_token?: string;
  expires_in?: number;
  token_type?: string;
};

type RequestPayload = {
  provider?: Provider;
  code?: string;
  redirectUri?: string;
};

function buildRedirectUri(redirectUri?: string) {
  if (redirectUri) return redirectUri;
  const base = (process.env.NEXT_PUBLIC_FRONTEND_URL || '').replace(/\/$/, '');
  const path = process.env.NEXT_PUBLIC_OAUTH_REDIRECT_PATH || '/auth/callback';
  return `${base}${path.startsWith('/') ? path : `/${path}`}`;
}

async function exchangeGoogleCode(code: string, redirectUri: string) {
  const params = new URLSearchParams({
    code,
    client_id: process.env.NEXT_PUBLIC_GOOGLE_OAUTH_CLIENT_ID || '',
    client_secret: process.env.GOOGLE_OAUTH_CLIENT_SECRET || '',
    redirect_uri: redirectUri,
    grant_type: 'authorization_code',
  });

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });

  const data = (await res.json()) as TokenResponse;

  if (!res.ok || !data.id_token) {
    throw new Error(data?.id_token ? 'Respuesta inválida de Google' : 'No se pudo obtener id_token de Google');
  }

  return data;
}

async function exchangeFacebookCode(code: string, redirectUri: string) {
  const params = new URLSearchParams({
    client_id: process.env.NEXT_PUBLIC_FACEBOOK_APP_ID || '',
    client_secret: process.env.FACEBOOK_APP_SECRET || '',
    redirect_uri: redirectUri,
    code,
  });

  const res = await fetch(`https://graph.facebook.com/v19.0/oauth/access_token?${params.toString()}`, {
    method: 'GET',
    headers: { Accept: 'application/json' },
  });

  const data = (await res.json()) as TokenResponse & { error?: { message?: string } };

  if (!res.ok || data?.error) {
    throw new Error(data?.error?.message || 'No se pudo obtener token de Facebook');
  }

  if (!data.id_token) {
    throw new Error('Facebook no devolvió id_token. Activa OpenID Connect en la app de Meta.');
  }

  return data;
}

export async function POST(req: Request) {
  const payload = (await req.json().catch(() => null)) as RequestPayload | null;

  if (!payload?.provider || !payload?.code) {
    return NextResponse.json({ error: 'provider y code son requeridos' }, { status: 400 });
  }

  const redirectUri = buildRedirectUri(payload.redirectUri);

  try {
    const data =
      payload.provider === 'google'
        ? await exchangeGoogleCode(payload.code, redirectUri)
        : await exchangeFacebookCode(payload.code, redirectUri);

    return NextResponse.json({
      id_token: data.id_token,
      access_token: data.access_token,
      expires_in: data.expires_in,
      provider: payload.provider,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error desconocido al obtener token';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
