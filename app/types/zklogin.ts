/**
 * Centralized type definitions for the zkLogin authentication flow.
 * Reusable across lib, services, and UI layers without circular dependencies.
 */

// ---------------------------------------------------------------------------
// OAuth
// ---------------------------------------------------------------------------

/** Supported OAuth providers for zkLogin. */
export type OAuthProvider = 'google' | 'facebook';

// ---------------------------------------------------------------------------
// Pending login (sessionStorage)
// ---------------------------------------------------------------------------

/** Data stored in sessionStorage while an OAuth round-trip is in progress. */
export interface ZkLoginPending {
  provider: OAuthProvider;
  nonce: string;
  maxEpoch: string;
  randomness: string;
  secretKey: string;
  userSalt: string;
  ephemeralPublicKey: string;
  /** Set after the OAuth code exchange when the user is new. */
  jwt?: string;
}

// ---------------------------------------------------------------------------
// Session (localStorage)
// ---------------------------------------------------------------------------

/** Persisted session after a successful zkLogin authentication. */
export interface ZkLoginSession {
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
  accessToken?: string;
  isNewUser?: boolean;
  phoneVerified?: boolean;
}

// ---------------------------------------------------------------------------
// AgentBE – Auth responses
// ---------------------------------------------------------------------------

/** Response from `GET /v1/auth/salt`. */
export interface AgentBESaltResponse {
  exists: boolean;
  salt: string | null;
}

/** Response from `POST /v1/auth/login`. */
export interface AgentBELoginResponse {
  accessToken: string;
  user: {
    id: string;
    suiAddress: string;
    phoneVerified: boolean;
    status: 'PENDING_PHONE' | 'ACTIVE';
  };
}

// ---------------------------------------------------------------------------
// AgentBE – Phone verification
// ---------------------------------------------------------------------------

/** Response from `POST /v1/auth/phone/otp`. */
export interface AgentBEOtpResponse {
  code: string;
  instruction: string;
  /** Legacy field returned by some backend versions. */
  otp?: string;
}

/** Response from `GET /v1/auth/phone/status`. */
export interface AgentBEPhoneStatusResponse {
  verified: boolean;
  linkedAt?: string;
}

// ---------------------------------------------------------------------------
// AgentBE – Groups
// ---------------------------------------------------------------------------

/** A group item returned by `GET /v1/groups`. */
export interface AgentBEGroup {
  id: string;
  name: string;
  status: 'ACTIVE' | 'PENDING' | 'COMPLETED';
  contributionAmount?: number;
  myTurn?: number;
  totalMembers?: number;
  currentRound?: number;
}

/** Response from `POST /v1/groups`. */
export interface AgentBECreateGroupResponse {
  id?: string;
  groupId?: string;
  objectId?: string;
  name?: string;
  status?: string;
}

/** Response from `POST /v1/groups/{id}/invitation`. */
export interface AgentBEInvitationResponse {
  inviteCode: string;
  inviteLink: string;
  groupName: string;
}

/** Response from `POST /v1/groups/{id}/join`. */
export interface AgentBEJoinResponse {
  membershipId: string;
  turnIndex: number;
}

/** Response from `GET /v1/groups/{id}/dashboard`. */
export interface AgentBEGroupDashboard {
  group: { objectId: string; status: string };
  participants: Array<{ alias?: string; status?: string }>;
  myStatus?: string;
}

/** Response from `POST /v1/groups/{id}/start`. */
export interface AgentBEStartGroupResponse {
  status?: string;
}

// ---------------------------------------------------------------------------
// OAuth token exchange (Next.js API route)
// ---------------------------------------------------------------------------

/** Payload sent to `/api/oauth/token`. */
export interface OAuthTokenRequest {
  provider: OAuthProvider;
  code: string;
  redirectUri: string;
}

/** Response from `/api/oauth/token`. */
export interface OAuthTokenResponse {
  id_token: string;
  access_token?: string;
  expires_in?: number;
  provider: OAuthProvider;
  error?: string;
}

// ---------------------------------------------------------------------------
// Decoded state in the OAuth callback URL
// ---------------------------------------------------------------------------

/** The state payload encoded in the OAuth redirect. */
export interface OAuthStatePayload {
  nonce: string;
  provider: OAuthProvider;
}
