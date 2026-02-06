import { SuiJsonRpcClient } from '@mysten/sui/jsonRpc';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { decodeJwt, generateNonce, generateRandomness, getExtendedEphemeralPublicKey, jwtToAddress } from '@mysten/sui/zklogin';

export type OAuthProvider = 'google' | 'facebook';

export type ZkLoginPending = {
  provider: OAuthProvider;
  nonce: string;
  maxEpoch: string;
  randomness: string;
  secretKey: string;
  userSalt: string;
  ephemeralPublicKey: string;
};

export type ZkLoginSession = {
  provider: OAuthProvider;
  address: string;
  jwt: string;
  userSalt: string;
  maxEpoch: string;
  randomness: string;
  iss: string;
  sub: string;
  aud: string | string[];
  exp?: number;
};

const SESSION_KEY = 'zklogin-session';
const PENDING_PREFIX = 'zklogin:pending:';

const defaultRpcUrl = process.env.NEXT_PUBLIC_SUI_RPC_URL || 'https://fullnode.testnet.sui.io:443';
const suiNetwork = (process.env.NEXT_PUBLIC_SUI_NETWORK as 'mainnet' | 'testnet' | 'devnet' | 'localnet' | undefined) || 'testnet';
const suiClient = new SuiJsonRpcClient({ url: defaultRpcUrl, network: suiNetwork });

function getRedirectUri(origin?: string) {
  const baseUrl = (origin || process.env.NEXT_PUBLIC_FRONTEND_URL || '').replace(/\/$/, '');
  const path = process.env.NEXT_PUBLIC_OAUTH_REDIRECT_PATH || '/auth/callback';
  return `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
}

function toBase64(json: unknown) {
  return typeof window === 'undefined'
    ? ''
    : btoa(unescape(encodeURIComponent(JSON.stringify(json))));
}

function fromBase64<T>(value: string | null): T | null {
  if (!value || typeof window === 'undefined') return null;
  try {
    return JSON.parse(decodeURIComponent(escape(atob(value)))) as T;
  } catch {
    return null;
  }
}

function generateUserSalt(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  const hex = Array.from(array)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  return BigInt(`0x${hex}`).toString();
}

export function getStoredSession(): ZkLoginSession | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as ZkLoginSession;
  } catch {
    return null;
  }
}

export function persistSession(session: ZkLoginSession) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function clearSession() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(SESSION_KEY);
}

export function storePendingLogin(pending: ZkLoginPending) {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(`${PENDING_PREFIX}${pending.nonce}`, JSON.stringify(pending));
}

export function readPendingLogin(nonce: string): ZkLoginPending | null {
  if (typeof window === 'undefined') return null;
  const raw = sessionStorage.getItem(`${PENDING_PREFIX}${nonce}`);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as ZkLoginPending;
  } catch {
    return null;
  }
}

export function removePendingLogin(nonce: string) {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(`${PENDING_PREFIX}${nonce}`);
}

export async function buildZkLoginRequest(provider: OAuthProvider) {
  const clientId =
    provider === 'google'
      ? process.env.NEXT_PUBLIC_GOOGLE_OAUTH_CLIENT_ID
      : process.env.NEXT_PUBLIC_FACEBOOK_APP_ID;

  if (!clientId) throw new Error(`Falta configurar el clientId de ${provider}`);

  const systemState = await suiClient.getLatestSuiSystemState();
  const currentEpoch = Number(systemState?.epoch || 0);
  const maxEpoch = currentEpoch + 2;
  const randomness = generateRandomness();
  const keypair = Ed25519Keypair.generate();
  const nonce = generateNonce(keypair.getPublicKey(), maxEpoch, randomness);
  const userSalt = getStoredSession()?.userSalt || generateUserSalt();
  const redirectUri = getRedirectUri(typeof window !== 'undefined' ? window.location.origin : undefined);

  const state = toBase64({ nonce, provider });
  const authUrl = buildAuthUrl(provider, {
    clientId,
    nonce,
    redirectUri,
    state,
  });

  storePendingLogin({
    provider,
    nonce,
    maxEpoch: String(maxEpoch),
    randomness,
    secretKey: keypair.getSecretKey(),
    userSalt,
    ephemeralPublicKey: getExtendedEphemeralPublicKey(keypair.getPublicKey()),
  });

  return { authUrl, nonce };
}

export function decodeState<T>(value: string | null): T | null {
  return fromBase64<T>(value);
}

function buildAuthUrl(
  provider: OAuthProvider,
  params: { clientId: string; nonce: string; redirectUri: string; state: string },
) {
  const url =
    provider === 'google'
      ? new URL('https://accounts.google.com/o/oauth2/v2/auth')
      : new URL('https://www.facebook.com/v19.0/dialog/oauth');

  url.searchParams.set('client_id', params.clientId);
  url.searchParams.set('redirect_uri', params.redirectUri);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('state', params.state);

  if (provider === 'google') {
    url.searchParams.set('scope', 'openid email profile');
    url.searchParams.set('nonce', params.nonce);
    url.searchParams.set('prompt', 'select_account');
  } else {
    url.searchParams.set('scope', 'openid public_profile email');
    url.searchParams.set('auth_type', 'rerequest');
    url.searchParams.set('nonce', params.nonce);
  }

  return url.toString();
}

export function deriveAddress(jwt: string, userSalt: string, legacyAddress = false) {
  return jwtToAddress(jwt, BigInt(userSalt), legacyAddress);
}

export function parseJwt(jwt: string) {
  return decodeJwt(jwt);
}

export function getStoredRedirectUri() {
  return getRedirectUri(typeof window !== 'undefined' ? window.location.origin : undefined);
}

export function normalizeAudience(aud: unknown): string | string[] {
  if (Array.isArray(aud)) return aud as string[];
  if (typeof aud === 'string') return aud;
  return [] as string[];
}
