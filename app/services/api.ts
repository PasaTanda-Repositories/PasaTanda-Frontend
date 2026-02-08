/**
 * Service layer – every fetch to the AgentBE (and the local OAuth proxy)
 * lives here.  Each function:
 *   1. Logs the request (action + anonymized payload).
 *   2. Performs the fetch.
 *   3. Logs success / error with status code.
 *   4. Returns typed data or throws a descriptive Error.
 *
 * Endpoint mapping follows the AgentBE API docs v1.3.0
 * (see /docs/API_DOCS.md in the backend repo).
 */

import { logRequest, logResponse, logError } from '../lib/logger';
import type {
  OAuthProvider,
  AgentBESaltResponse,
  AgentBELoginResponse,
  AgentBEOtpResponse,
  AgentBEPhoneStatusResponse,
  AgentBEGroup,
  OAuthTokenRequest,
  OAuthTokenResponse,
  AgentBECreateGroupResponse,
  AgentBEInvitationResponse,
  AgentBEJoinResponse,
  AgentBEGroupDashboard,
  AgentBEStartGroupResponse,
  GroupInviteLookup,
  ZkProofResponse,
  SponsorDeployResponse,
} from '../types/zklogin';

const TAG = 'ApiService';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function agentBaseUrl(): string {
  return (process.env.NEXT_PUBLIC_AGENT_BE_URL || '').replace(/\/$/, '');
}

/**
 * Wrapper around `fetch` that adds structured logging and standard error
 * handling.  Throws on non-OK responses so callers can catch uniformly.
 */
async function request<T>(
  action: string,
  url: string,
  init: RequestInit,
  logPayload?: unknown,
): Promise<T> {
  logRequest(TAG, action, logPayload ?? { url, method: init.method ?? 'GET' });

  const res = await fetch(url, init);
  const contentType = res.headers.get('content-type') || '';

  // Try to parse JSON; fall back to text
  let body: T;
  if (contentType.includes('application/json')) {
    body = (await res.json()) as T;
  } else {
    body = (await res.text()) as unknown as T;
  }

  if (!res.ok) {
    const errMsg =
      (body && typeof body === 'object' && 'message' in body
        ? (body as Record<string, unknown>).message
        : null) ??
      (body && typeof body === 'object' && 'error' in body
        ? (body as Record<string, unknown>).error
        : null) ??
      res.statusText;
    const error = new Error(String(errMsg));
    logError(TAG, action, error, res.status);
    throw error;
  }

  logResponse(TAG, action, res.status, body);
  return body;
}

// ---------------------------------------------------------------------------
// 1. Authentication
// ---------------------------------------------------------------------------

/**
 * `GET /v1/auth/salt`
 * Check whether a user salt already exists for the given OAuth JWT.
 *
 * Headers:
 *   - x-oauth-token  (required): raw OAuth JWT
 *   - x-auth-provider (optional): GOOGLE | FACEBOOK | APPLE
 */
export async function checkExistingUserSalt(
  jwt: string,
  provider: OAuthProvider,
): Promise<AgentBESaltResponse> {
  const base = agentBaseUrl();
  if (!base) throw new Error('NEXT_PUBLIC_AGENT_BE_URL is not configured');

  return request<AgentBESaltResponse>(
    'checkExistingUserSalt',
    `${base}/v1/auth/salt`,
    {
      method: 'GET',
      headers: {
        'x-oauth-token': jwt,
        'x-auth-provider': provider.toUpperCase(),
      },
    },
    { provider: provider.toUpperCase() },
  );
}

/**
 * `POST /v1/auth/login`
 * Register a new user or log in an existing one.
 *
 * Body: { jwt, suiAddress, salt, alias? }
 * Header: x-auth-provider (optional)
 */
export async function registerOrLoginUser(
  jwt: string,
  suiAddress: string,
  salt: string,
  alias?: string,
): Promise<AgentBELoginResponse> {
  const base = agentBaseUrl();
  if (!base) throw new Error('NEXT_PUBLIC_AGENT_BE_URL is not configured');

  const payload: Record<string, string> = { jwt, suiAddress, salt };
  if (alias) payload.alias = alias;

  return request<AgentBELoginResponse>(
    'registerOrLoginUser',
    `${base}/v1/auth/login`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    },
    { suiAddress, hasJwt: Boolean(jwt) },
  );
}

// ---------------------------------------------------------------------------
// 2. Phone verification
// ---------------------------------------------------------------------------

/**
 * `POST /v1/auth/phone/otp`
 * Request a one-time password sent via WhatsApp.
 *
 * Body: { phone }  (optional – backend may derive from token)
 * Auth: Bearer token required.
 */
export async function requestPhoneOtp(
  accessToken: string,
  phone?: string,
): Promise<AgentBEOtpResponse> {
  const base = agentBaseUrl();
  if (!base) throw new Error('NEXT_PUBLIC_AGENT_BE_URL is not configured');

  const bodyObj: Record<string, string> = {};
  if (phone) bodyObj.phone = phone;

  return request<AgentBEOtpResponse>(
    'requestPhoneOtp',
    `${base}/v1/auth/phone/otp`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(bodyObj),
    },
    { hasPhone: Boolean(phone) },
  );
}

/**
 * `GET /v1/auth/phone/status?phone=<phone>`
 * Poll whether the phone has been verified.
 *
 * Auth: Bearer token required.
 */
export async function checkPhoneStatus(
  accessToken: string,
  phone?: string,
): Promise<AgentBEPhoneStatusResponse> {
  const base = agentBaseUrl();
  if (!base) throw new Error('NEXT_PUBLIC_AGENT_BE_URL is not configured');

  const url = new URL(`${base}/v1/auth/phone/status`);
  if (phone) url.searchParams.set('phone', phone);

  return request<AgentBEPhoneStatusResponse>(
    'checkPhoneStatus',
    url.toString(),
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
    { hasPhone: Boolean(phone) },
  );
}

// ---------------------------------------------------------------------------
// 3. Groups (Tandas)
// ---------------------------------------------------------------------------

/**
 * `GET /v1/groups`
 * Retrieve the authenticated user's groups.
 *
 * Auth: Bearer token required.
 */
export async function fetchMyGroups(
  accessToken: string,
): Promise<AgentBEGroup[]> {
  const base = agentBaseUrl();
  if (!base) throw new Error('NEXT_PUBLIC_AGENT_BE_URL is not configured');

  // The backend may return an array directly or { groups: [...] }
  const raw = await request<AgentBEGroup[] | { groups?: AgentBEGroup[] }>(
    'fetchMyGroups',
    `${base}/v1/groups`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );

  return Array.isArray(raw) ? raw : (raw?.groups ?? []);
}

/**
 * `POST /v1/groups`
 * Create a new group (tanda).
 */
export async function createGroup(
  accessToken: string,
  payload: {
    name: string;
    currency: string;
    contributionAmount: number;
    guaranteeAmount: number;
    totalRounds: number;
    frequency: string;
    frequencyDays: number;
    enableYield?: boolean;
  },
): Promise<AgentBECreateGroupResponse> {
  const base = agentBaseUrl();
  if (!base) throw new Error('NEXT_PUBLIC_AGENT_BE_URL is not configured');

  return request<AgentBECreateGroupResponse>(
    'createGroup',
    `${base}/v1/groups`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(payload),
    },
    { 
      name: payload.name, 
      currency: payload.currency, 
      round: payload.contributionAmount,
      totalRounds: payload.totalRounds,
      frequency: payload.frequency,
    },
  );
}

/**
 * `POST /v1/groups/{id}/invitation`
 * Generate an invitation link for a group.
 */
export async function generateGroupInvitation(
  accessToken: string,
  groupId: string,
): Promise<AgentBEInvitationResponse> {
  const base = agentBaseUrl();
  if (!base) throw new Error('NEXT_PUBLIC_AGENT_BE_URL is not configured');

  return request<AgentBEInvitationResponse>(
    'generateGroupInvitation',
    `${base}/v1/groups/${groupId}/invitation`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
    { groupId },
  );
}

/**
 * `GET /v1/groups/join/{inviteCode}`
 * Lookup group details by invitation code.
 */
export async function lookupGroupByInvite(
  accessToken: string,
  inviteCode: string,
): Promise<GroupInviteLookup> {
  const base = agentBaseUrl();
  if (!base) throw new Error('NEXT_PUBLIC_AGENT_BE_URL is not configured');

  return request<GroupInviteLookup>(
    'lookupGroupByInvite',
    `${base}/v1/groups/join/${inviteCode}`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
    { inviteCode },
  );
}

/**
 * `POST /v1/groups/join`
 * Join a group with an optional turn number.
 */
export async function joinGroup(
  accessToken: string,
  inviteCode: string,
  turnNumber?: number,
): Promise<AgentBEJoinResponse> {
  const base = agentBaseUrl();
  if (!base) throw new Error('NEXT_PUBLIC_AGENT_BE_URL is not configured');

  const body: Record<string, unknown> = { inviteCode };
  if (typeof turnNumber === 'number') body.turnNumber = turnNumber;

  return request<AgentBEJoinResponse>(
    'joinGroup',
    `${base}/v1/groups/join`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    },
    { inviteCode, hasTurnNumber: Boolean(turnNumber) },
  );
}

/**
 * `GET /v1/groups/{id}/dashboard`
 * Retrieve group dashboard details.
 */
export async function fetchGroupDashboard(
  accessToken: string,
  groupId: string,
): Promise<AgentBEGroupDashboard> {
  const base = agentBaseUrl();
  if (!base) throw new Error('NEXT_PUBLIC_AGENT_BE_URL is not configured');

  return request<AgentBEGroupDashboard>(
    'fetchGroupDashboard',
    `${base}/v1/groups/${groupId}/dashboard`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
    { groupId },
  );
}

/**
 * `GET /v1/groups/dashboard/{id}`
 * Retrieve admin dashboard details for a group (requires admin).
 */
export async function fetchAdminGroupDashboard(
  accessToken: string,
  groupId: string,
): Promise<AgentBEGroupDashboard> {
  const base = agentBaseUrl();
  if (!base) throw new Error('NEXT_PUBLIC_AGENT_BE_URL is not configured');

  return request<AgentBEGroupDashboard>(
    'fetchAdminGroupDashboard',
    `${base}/v1/groups/dashboard/${groupId}`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
    { groupId },
  );
}

/**
 * `POST /v1/groups/{id}/start`
 * Start a group (activate the tanda contract).
 */
export async function startGroup(
  accessToken: string,
  groupId: string,
): Promise<AgentBEStartGroupResponse> {
  const base = agentBaseUrl();
  if (!base) throw new Error('NEXT_PUBLIC_AGENT_BE_URL is not configured');

  return request<AgentBEStartGroupResponse>(
    'startGroup',
    `${base}/v1/groups/${groupId}/start`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
    { groupId },
  );
}

// ---------------------------------------------------------------------------
// 4. zkLogin ZK-proof & Sponsored Transactions
// ---------------------------------------------------------------------------

/**
 * `POST /v1/auth/zkp`
 * Request a zero-knowledge proof from the backend (Enoki).
 *
 * Header: zklogin-jwt (required)
 * Body: { ephemeralPublicKey, maxEpoch, randomness, network }
 */
export async function requestZkProof(
  jwt: string,
  payload: {
    extendedEphemeralPublicKey: string;
    maxEpoch: number;
    randomness: string;
    salt: string;
    keyClaimName?: string;
  },
): Promise<ZkProofResponse> {
  const base = agentBaseUrl();
  if (!base) throw new Error('NEXT_PUBLIC_AGENT_BE_URL is not configured');

  return request<ZkProofResponse>(
    'requestZkProof',
    `${base}/v1/auth/zkp`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jwt,
        extendedEphemeralPublicKey: payload.extendedEphemeralPublicKey,
        maxEpoch: String(payload.maxEpoch),
        jwtRandomness: payload.randomness,
        salt: payload.salt,
        keyClaimName: payload.keyClaimName ?? 'sub',
      }),
    },
    {
      maxEpoch: payload.maxEpoch,
      hasSalt: Boolean(payload.salt),
      keyClaimName: payload.keyClaimName ?? 'sub',
    },
  );
}

/**
 * `POST /v1/tx/sponsor/deploy`
 * Send gasless transaction bytes + group ID to the backend for sponsoring.
 *
 * Auth: Bearer token required.
 * Body: { txBytes, groupId }
 */
export async function sponsorDeploy(
  accessToken: string,
  txBytes: string,
  groupId: string,
): Promise<SponsorDeployResponse> {
  const base = agentBaseUrl();
  if (!base) throw new Error('NEXT_PUBLIC_AGENT_BE_URL is not configured');

  return request<SponsorDeployResponse>(
    'sponsorDeploy',
    `${base}/v1/tx/sponsor/deploy`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ txBytes, groupId }),
    },
    { groupId },
  );
}

// ---------------------------------------------------------------------------
// 5. Local OAuth proxy (Next.js API route)
// ---------------------------------------------------------------------------

/**
 * `POST /api/oauth/token`
 * Exchange an OAuth authorization code for an id_token via the Next.js
 * server-side route (keeps client_secret off the browser).
 */
export async function exchangeOAuthCode(
  payload: OAuthTokenRequest,
): Promise<OAuthTokenResponse> {
  return request<OAuthTokenResponse>(
    'exchangeOAuthCode',
    '/api/oauth/token',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    },
    { provider: payload.provider },
  );
}
