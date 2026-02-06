"use client";

import { useEffect, useState } from 'react';
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
  OAuthProvider,
  ZkLoginSession,
  decodeState,
  deriveAddress,
  getStoredRedirectUri,
  parseJwt,
  persistSession,
  readPendingLogin,
  removePendingLogin,
} from '../../lib/zklogin';

type StatePayload = { nonce: string; provider: OAuthProvider };

export default function CallbackPage() {
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

    const parsedState = decodeState<StatePayload>(stateParam);
    if (!code || !parsedState?.nonce || !parsedState?.provider) {
      setStatus('error');
      setMessage('Faltan parámetros del callback');
      return;
    }

    const pending = readPendingLogin(parsedState.nonce);
    if (!pending) {
      setStatus('error');
      setMessage('No existe un login pendiente. Intenta nuevamente.');
      return;
    }

    const run = async () => {
      setStatus('loading');
      setMessage(t.login.callbackProcessing);

      try {
        const res = await fetch('/api/oauth/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            provider: parsedState.provider,
            code,
            redirectUri: getStoredRedirectUri(),
          }),
        });

        const data = await res.json();
        if (!res.ok || !data?.id_token) {
          throw new Error(data?.error || 'No se pudo obtener el token');
        }

        const address = deriveAddress(data.id_token, pending.userSalt, false);
        const decodedJwt = parseJwt(data.id_token);

        const newSession: ZkLoginSession = {
          provider: parsedState.provider,
          address,
          jwt: data.id_token,
          userSalt: pending.userSalt,
          maxEpoch: pending.maxEpoch,
          randomness: pending.randomness,
          iss: decodedJwt.iss,
          sub: decodedJwt.sub,
          aud: decodedJwt.aud,
          exp: decodedJwt.exp,
        };

        persistSession(newSession);
        removePendingLogin(parsedState.nonce);
        setSession(newSession);
        setStatus('success');
        setMessage(t.login.callbackSuccess);

        setTimeout(() => {
          router.push('/onboarding/verify');
        }, 1400);
      } catch (err) {
        const msg = err instanceof Error ? err.message : t.login.callbackError;
        setMessage(msg);
        setStatus('error');
      }
    };

    run();
  }, [router, searchParams, t.login.callbackProcessing, t.login.callbackSuccess, t.login.callbackError]);

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
                            <Typography variant="body2">{t.login.addressLabel}: {session.address}</Typography>
                            <Typography variant="body2">Provider: {session.provider}</Typography>
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
                    <Button component={Link} href="/onboarding/verify" variant="contained" disabled={status !== 'success'}>
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
