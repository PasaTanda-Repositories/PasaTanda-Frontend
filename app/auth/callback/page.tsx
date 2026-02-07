"use client";

import { useEffect, useState, Suspense } from 'react';
import {
  Alert,
  Box,
  Button,
  CardContent,
  CircularProgress,
  Container,
  Fade,
  Stack,
  Typography,
} from '@mui/material';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { GlassCard } from '../../components/GlassCard';
import ParticleBackground from '../../components/ParticleBackground';
import { useI18n } from '../../lib/i18n';
import { useMounted } from '../../lib/useMounted';
import {
  decodeState,
  deriveAddress,
  generateUserSalt,
  getStoredRedirectUri,
  parseJwt,
  persistSession,
  persistPendingLogin,
  readPendingLogin,
  removePendingLogin,
} from '../../lib/zklogin';
import {
  exchangeOAuthCode,
  checkExistingUserSalt,
  registerOrLoginUser,
} from '../../services/api';
import type { OAuthStatePayload, ZkLoginSession } from '../../types/zklogin';

// ---------------------------------------------------------------------------
// Inner component (needs useSearchParams → must be inside Suspense)
// ---------------------------------------------------------------------------

function CallbackContent() {
  const { t } = useI18n();
  const mounted = useMounted();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState<string>('');
  const [session, setSession] = useState<ZkLoginSession | null>(null);

  useEffect(() => {
    const code = searchParams.get('code');
    const stateParam = searchParams.get('state');
    const oauthError = searchParams.get('error');

    if (oauthError) {
      setStatus('error');
      setMessage(oauthError);
      return;
    }

    const parsedState = decodeState<OAuthStatePayload>(stateParam);
    if (!code || !parsedState?.nonce || !parsedState?.provider) {
      setStatus('error');
      setMessage('Missing callback parameters');
      return;
    }

    const pending = readPendingLogin(parsedState.nonce);
    if (!pending) {
      setStatus('error');
      setMessage('No pending login found. Please try again.');
      return;
    }

    const run = async () => {
      setStatus('loading');
      setMessage(t.login.callbackProcessing);

      try {
        // 1. Exchange OAuth code for id_token via Next.js proxy
        const tokenData = await exchangeOAuthCode({
          provider: parsedState.provider,
          code,
          redirectUri: getStoredRedirectUri(),
        });

        if (!tokenData.id_token) {
          throw new Error(tokenData.error || 'Failed to get id_token');
        }

        const jwt = tokenData.id_token;

        // 2. Check whether the user already has a salt in AgentBE
        const saltResponse = await checkExistingUserSalt(jwt, parsedState.provider);

        if (saltResponse.exists && saltResponse.salt) {
          // ── EXISTING USER ── login flow
          const address = deriveAddress(jwt, saltResponse.salt, false);
          const loginResponse = await registerOrLoginUser(jwt, address, saltResponse.salt);
          const decoded = parseJwt(jwt);

          const newSession: ZkLoginSession = {
            provider: parsedState.provider,
            address,
            jwt,
            userSalt: saltResponse.salt,
            maxEpoch: pending.maxEpoch,
            randomness: pending.randomness,
            iss: decoded.iss,
            sub: decoded.sub,
            aud: decoded.aud,
            exp: decoded.exp,
            accessToken: loginResponse.accessToken,
            isNewUser: false,
            phoneVerified: loginResponse.user.phoneVerified,
          };

          persistSession(newSession);
          removePendingLogin(parsedState.nonce);
          setSession(newSession);
          setStatus('success');
          setMessage(t.login.callbackSuccess);

          setTimeout(() => {
            if (loginResponse.user.status === 'PENDING_PHONE') {
              router.push('/auth/verify-phone');
            } else {
              router.push('/dashboard');
            }
          }, 1400);
        } else {
          // ── NEW USER ── registration flow → save-salt page
          const newSalt = generateUserSalt();

          // Persist the JWT inside the pending entry so confirm-account can use it
          persistPendingLogin(parsedState.nonce, { jwt });

          const params = new URLSearchParams({
            salt: newSalt,
            provider: parsedState.provider,
          });
          router.push(`/auth/save-salt?${params.toString()}`);
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : t.login.callbackError;
        setMessage(msg);
        setStatus('error');
      }
    };

    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router, searchParams]);

  // ── UI ──────────────────────────────────────────────────────────────────

  return (
    <Box
      sx={{
        minHeight: '100vh',
        position: 'relative',
        overflow: 'hidden',
        backgroundImage: "url('/assets/images/backgrounds/onBoardingSuccess.webp')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          bgcolor: 'rgba(255,255,255,0.88)',
          backdropFilter: 'blur(6px)',
          zIndex: 0,
        }}
      />
      <ParticleBackground variant="combined" />

      <Box sx={{ position: 'relative', zIndex: 1 }}>
        <Header />

        <Container maxWidth="md" sx={{ py: 6 }}>
          <Fade in={mounted} timeout={600}>
            <GlassCard variant="mica" intensity="medium" glow>
              <CardContent sx={{ p: { xs: 4, md: 6 } }}>
                <Stack spacing={3} alignItems="center">
                  <Typography variant="h4" sx={{ fontWeight: 800, textAlign: 'center' }}>
                    {t.login.title}
                  </Typography>
                  <Typography variant="body1" color="text.secondary" textAlign="center">
                    {message || t.login.callbackProcessing}
                  </Typography>

                  <Box sx={{ py: 2 }}>
                    {status === 'loading' && <CircularProgress />}
                    {status === 'success' && (
                      <Alert severity="success" sx={{ mt: 2 }}>
                        {t.login.callbackSuccess}
                        {session && (
                          <Box sx={{ mt: 1 }}>
                            <Typography variant="body2">
                              {t.login.addressLabel}: {session.address}
                            </Typography>
                            <Typography variant="body2">
                              Provider: {session.provider}
                            </Typography>
                          </Box>
                        )}
                      </Alert>
                    )}
                    {status === 'error' && (
                      <Alert severity="error" sx={{ mt: 2 }}>
                        {t.login.callbackError}
                        {message && <Box component="span"> — {message}</Box>}
                      </Alert>
                    )}
                  </Box>

                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                    <Button component={Link} href="/auth/login" variant="outlined">
                      {t.login.retry}
                    </Button>
                    <Button
                      component={Link}
                      href="/onboarding/verify"
                      variant="contained"
                      disabled={status !== 'success'}
                    >
                      {t.login.continue}
                    </Button>
                  </Stack>
                </Stack>
              </CardContent>
            </GlassCard>
          </Fade>
        </Container>

        <Footer />
      </Box>
    </Box>
  );
}

// ---------------------------------------------------------------------------
// Default export – wraps in Suspense for useSearchParams
// ---------------------------------------------------------------------------

export default function CallbackPage() {
  return (
    <Suspense
      fallback={
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
          <CircularProgress />
        </Box>
      }
    >
      <CallbackContent />
    </Suspense>
  );
}
