/**
 * zkLogin infrastructure layer.
 *
 * Responsibilities:
 *   • SUI SDK interactions (epoch, nonce, address derivation, JWT decoding).
 *   • User-salt generation & validation.
 *   • Session / pending-login persistence (localStorage / sessionStorage).
 *   • OAuth URL construction.
 *
 * This module does NOT perform any network calls to the AgentBE – those live
 * in `app/services/api.ts`.
 */

import { SuiJsonRpcClient } from '@mysten/sui/jsonRpc';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';

import {
  decodeJwt,
  generateNonce,
  generateRandomness,
  getExtendedEphemeralPublicKey,
  jwtToAddress,
} from '@mysten/sui/zklogin';

import type {
  OAuthProvider,
  ZkLoginPending,
  ZkLoginSession,
} from '../types/zklogin';

// Re-export types so existing consumers that import from this file still work
export type { OAuthProvider, ZkLoginPending, ZkLoginSession } from '../types/zklogin';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SESSION_KEY = 'zklogin-session';
const PENDING_PREFIX = 'zklogin:pending:';

// ---------------------------------------------------------------------------
// SUI client (singleton)
// ---------------------------------------------------------------------------

const defaultRpcUrl =
  process.env.NEXT_PUBLIC_SUI_RPC_URL || 'https://fullnode.testnet.sui.io:443';
const suiNetwork =
  (process.env.NEXT_PUBLIC_SUI_NETWORK as
    | 'mainnet'
    | 'testnet'
    | 'devnet'
    | 'localnet'
    | undefined) || 'testnet';
const suiClient = new SuiJsonRpcClient({ url: defaultRpcUrl, network: suiNetwork });

// ---------------------------------------------------------------------------
// Redirect URI
// ---------------------------------------------------------------------------

function getRedirectUri(origin?: string): string {
  const baseUrl = (origin || process.env.NEXT_PUBLIC_FRONTEND_URL || '').replace(/\/$/, '');
  const path = process.env.NEXT_PUBLIC_OAUTH_REDIRECT_PATH || '/auth/callback';
  return `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
}

export function getStoredRedirectUri(): string {
  return getRedirectUri(typeof window !== 'undefined' ? window.location.origin : undefined);
}

// ---------------------------------------------------------------------------
// Base64 helpers
// ---------------------------------------------------------------------------

function encodeJsonToBase64(json: unknown): string {
  return typeof window === 'undefined'
    ? ''
    : btoa(unescape(encodeURIComponent(JSON.stringify(json))));
}

function decodeJsonFromBase64<T>(value: string | null): T | null {
  if (!value || typeof window === 'undefined') return null;
  try {
    return JSON.parse(decodeURIComponent(escape(atob(value)))) as T;
  } catch {
    return null;
  }
}

/**
 * Normalize a serialized secret key to a bech32 string ("suiprivkey1q...").
 *
 * Handles three legacy formats that may exist in storage:
 *   1. Already a bech32 string ("suiprivkey1q...")  → return as-is.
 *   2. A JSON-serialized Uint8Array ({"0":42,"1":17,...}) → extract bytes,
 *      reconstruct the keypair, and return the bech32 string.
 *   3. Anything else → null.
 */
function normalizeSerializedSecretKey(value: unknown): string | null {
  if (typeof value === 'string') return value;
  if (!value || typeof value !== 'object') return null;

  const record = value as Record<string, unknown>;
  const numericKeys = Object.keys(record).filter((key) => /^\d+$/.test(key));
  if (numericKeys.length === 0) return null;

  numericKeys.sort((a, b) => Number(a) - Number(b));
  const byteValues = numericKeys
    .map((key) => record[key])
    .filter((byte): byte is number => typeof byte === 'number' && Number.isFinite(byte))
    .map((byte) => Math.max(0, Math.min(255, byte)));

  if (byteValues.length === 0) return null;

  // Re-create the keypair from the raw bytes and return the proper bech32 string
  try {
    const kp = Ed25519Keypair.fromSecretKey(new Uint8Array(byteValues));
    return kp.getSecretKey();
  } catch {
    return null;
  }
}

export function decodeState<T>(value: string | null): T | null {
  return decodeJsonFromBase64<T>(value);
}

// ---------------------------------------------------------------------------
// Salt generation & validation
// ---------------------------------------------------------------------------

/**
 * Generate a cryptographically-random user salt (< 2^128) suitable for
 * zkLogin.
 */
export function generateUserSalt(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  const hex = Array.from(array)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  return BigInt(`0x${hex}`).toString();
}

/** Return `true` when the salt is a valid BN254-field element (0 < salt < 2^128). */
export function isValidUserSalt(salt: string): boolean {
  try {
    const v = BigInt(salt);
    const MAX_SALT = BigInt(2) ** BigInt(128);
    return v > BigInt(0) && v < MAX_SALT;
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Session (localStorage)
// ---------------------------------------------------------------------------

export function getStoredSession(): ZkLoginSession | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    const session = JSON.parse(raw) as ZkLoginSession;
    if (!isValidUserSalt(session.userSalt)) {
      console.warn('[zklogin] Invalid userSalt detected – clearing session');
      clearSession();
      return null;
    }
    const normalizedSecretKey = normalizeSerializedSecretKey((session as { secretKey?: unknown }).secretKey);
    if (normalizedSecretKey) {
      session.secretKey = normalizedSecretKey;
    }
    return session;
  } catch {
    return null;
  }
}

export function persistSession(session: ZkLoginSession): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function clearSession(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(SESSION_KEY);
}

// ---------------------------------------------------------------------------
// Pending login (sessionStorage)
// ---------------------------------------------------------------------------

export function storePendingLogin(pending: ZkLoginPending): void {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(`${PENDING_PREFIX}${pending.nonce}`, JSON.stringify(pending));
}

/**
 * Merge partial data into an existing pending entry (e.g. adding the JWT
 * after the OAuth code exchange for new users).
 */
export function persistPendingLogin(
  nonce: string,
  updatedPending: Partial<ZkLoginPending>,
): void {
  if (typeof window === 'undefined') return;
  const existing = readPendingLogin(nonce) || ({ nonce } as ZkLoginPending);
  const merged: ZkLoginPending = { ...existing, ...updatedPending, nonce } as ZkLoginPending;
  sessionStorage.setItem(`${PENDING_PREFIX}${nonce}`, JSON.stringify(merged));
}

export function readPendingLogin(nonce: string): ZkLoginPending | null {
  if (typeof window === 'undefined') return null;
  const raw = sessionStorage.getItem(`${PENDING_PREFIX}${nonce}`);
  if (!raw) return null;
  try {
    const pending = JSON.parse(raw) as ZkLoginPending & { secretKey?: unknown };
    const normalizedSecretKey = normalizeSerializedSecretKey(pending.secretKey);
    if (normalizedSecretKey) {
      pending.secretKey = normalizedSecretKey;
    }
    return pending as ZkLoginPending;
  } catch {
    return null;
  }
}

export function removePendingLogin(nonce: string): void {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(`${PENDING_PREFIX}${nonce}`);
}

// ---------------------------------------------------------------------------
// Address derivation & JWT helpers
// ---------------------------------------------------------------------------

export function deriveAddress(jwt: string, userSalt: string, legacyAddress = false): string {
  return jwtToAddress(jwt, BigInt(userSalt), legacyAddress);
}

export function parseJwt(jwt: string) {
  return decodeJwt(jwt);
}

export function normalizeAudience(aud: unknown): string | string[] {
  if (Array.isArray(aud)) return aud as string[];
  if (typeof aud === 'string') return aud;
  return [] as string[];
}

// ---------------------------------------------------------------------------
// OAuth URL builder
// ---------------------------------------------------------------------------

function buildAuthUrl(
  provider: OAuthProvider,
  params: { clientId: string; nonce: string; redirectUri: string; state: string },
): string {
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

// ---------------------------------------------------------------------------
// High-level: build the full zkLogin request (epoch + nonce + URL)
// ---------------------------------------------------------------------------

export async function buildZkLoginRequest(provider: OAuthProvider) {
  const clientId =
    provider === 'google'
      ? process.env.NEXT_PUBLIC_GOOGLE_OAUTH_CLIENT_ID
      : process.env.NEXT_PUBLIC_FACEBOOK_APP_ID;

  if (!clientId) throw new Error(`Missing OAuth clientId for ${provider}`);

  const systemState = await suiClient.getLatestSuiSystemState();
  const currentEpoch = Number(systemState?.epoch || 0);
  const maxEpoch = currentEpoch + 2;
  const randomness = generateRandomness();
  const keypair = Ed25519Keypair.generate();
  const nonce = generateNonce(keypair.getPublicKey(), maxEpoch, randomness);

  // Reuse valid existing salt or generate a fresh one
  const existingSalt = getStoredSession()?.userSalt;
  const userSalt =
    existingSalt && isValidUserSalt(existingSalt)
      ? existingSalt
      : generateUserSalt();

  const redirectUri = getRedirectUri(
    typeof window !== 'undefined' ? window.location.origin : undefined,
  );

  const state = encodeJsonToBase64({ nonce, provider });
  const authUrl = buildAuthUrl(provider, { clientId, nonce, redirectUri, state });

  // getSecretKey() returns a bech32-encoded string ("suiprivkey1q...")
  // in Sui SDK v2.x — store it directly.
  const secretKey = keypair.getSecretKey();

  storePendingLogin({
    provider,
    nonce,
    maxEpoch: String(maxEpoch),
    randomness,
    secretKey,
    userSalt,
    ephemeralPublicKey: getExtendedEphemeralPublicKey(keypair.getPublicKey()),
  });

  return { authUrl, nonce };
}
