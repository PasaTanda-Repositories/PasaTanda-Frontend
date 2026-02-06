"use client";

import { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  CardContent,
  CircularProgress,
  Container,
  Fade,
  Grid,
  Stack,
  Typography,
} from '@mui/material';
import GoogleIcon from '@mui/icons-material/Google';
import FacebookIcon from '@mui/icons-material/Facebook';
import AppleIcon from '@mui/icons-material/Apple';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import Link from 'next/link';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { GlassCard } from '../../components/GlassCard';
import ParticleBackground from '../../components/ParticleBackground';
import { useI18n } from '../../lib/i18n';
import { useMounted } from '../../lib/useMounted';
import { OAuthProvider, ZkLoginSession, buildZkLoginRequest, clearSession, getStoredSession } from '../../lib/zklogin';

export default function LoginPage() {
  const { t } = useI18n();
  const mounted = useMounted();
  const [loadingProvider, setLoadingProvider] = useState<OAuthProvider | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [session, setSession] = useState<ZkLoginSession | null>(() => getStoredSession());

  const handleLogin = async (provider: OAuthProvider) => {
    setError(null);
    setLoadingProvider(provider);

    try {
      const { authUrl } = await buildZkLoginRequest(provider);
      window.location.href = authUrl;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'No se pudo iniciar sesión';
      setError(message);
      setLoadingProvider(null);
    }
  };

  const handleClearSession = () => {
    clearSession();
    setSession(null);
    setError(null);
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        position: 'relative',
        overflow: 'hidden',
        backgroundImage: "url('/assets/images/backgrounds/onBoardingWhatsappVerification.webp')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          bgcolor: 'rgba(255,255,255,0.85)',
          backdropFilter: 'blur(6px)',
          zIndex: 0,
        }}
      />
      <ParticleBackground variant="combined" />

      <Box sx={{ position: 'relative', zIndex: 1 }}>
        <Header />

        <Container maxWidth="lg" sx={{ py: 6 }}>
          <Fade in={mounted} timeout={700}>
            <Stack spacing={4}>
              <GlassCard variant="mica" intensity="medium" glow>
                <CardContent sx={{ p: { xs: 4, md: 6 } }}>
                  <Grid container spacing={4} alignItems="center">
                    <Grid size={{ xs: 12, md: 7 }}>
                      <Stack spacing={2}>
                        <Typography variant="h4" sx={{ fontWeight: 800 }}>
                          {t.login.title}
                        </Typography>
                        <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                          {t.login.subtitle}
                        </Typography>
                        <Stack spacing={1}>
                          {[t.hero.metrics[0].label, t.onboarding.title, t.login.addressLabel].map((label, idx) => (
                            <Stack key={idx} direction="row" spacing={2} alignItems="center">
                              <Box
                                sx={{
                                  width: 10,
                                  height: 10,
                                  borderRadius: '50%',
                                  bgcolor: '#000',
                                  flexShrink: 0,
                                }}
                              />
                              <Typography variant="body2" color="text.secondary">
                                {label}
                              </Typography>
                            </Stack>
                          ))}
                        </Stack>
                      </Stack>
                    </Grid>
                    <Grid size={{ xs: 12, md: 5 }}>
                      <GlassCard variant="mica" intensity="subtle">
                        <CardContent sx={{ p: 3 }}>
                          <Stack spacing={2}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                              OAuth · zkLogin
                            </Typography>
                            {error && (
                              <Alert severity="error" onClose={() => setError(null)}>
                                {error}
                              </Alert>
                            )}
                            <Button
                              fullWidth
                              size="large"
                              variant="contained"
                              startIcon={<GoogleIcon />}
                              disabled={!!loadingProvider}
                              onClick={() => handleLogin('google')}
                              sx={{
                                bgcolor: '#000',
                                '&:hover': { bgcolor: '#111' },
                              }}
                            >
                              {loadingProvider === 'google' ? <CircularProgress size={20} color="inherit" /> : t.login.google}
                            </Button>
                            <Button
                              fullWidth
                              size="large"
                              variant="outlined"
                              startIcon={<FacebookIcon />}
                              disabled={!!loadingProvider}
                              onClick={() => handleLogin('facebook')}
                              sx={{ borderWidth: 2 }}
                            >
                              {loadingProvider === 'facebook' ? <CircularProgress size={20} /> : t.login.facebook}
                            </Button>
                            <Button fullWidth size="large" variant="text" startIcon={<AppleIcon />} disabled>
                              {t.login.apple}
                            </Button>
                            <Alert severity="info">{t.login.appleSoon}</Alert>
                          </Stack>
                        </CardContent>
                      </GlassCard>
                    </Grid>
                  </Grid>
                </CardContent>
              </GlassCard>

              <GlassCard variant="mica" intensity="subtle">
                <CardContent sx={{ p: { xs: 3, md: 4 } }}>
                  <Stack spacing={2}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                      {session ? t.login.sessionReady : t.login.sessionMissing}
                    </Typography>
                    {session ? (
                      <Alert icon={<CheckCircleIcon fontSize="inherit" />} severity="success">
                        <Stack spacing={0.5}>
                          <Typography variant="body2">{t.login.addressLabel}: {session.address}</Typography>
                          <Typography variant="body2">Provider: {session.provider}</Typography>
                          <Typography variant="body2">Exp: {session.exp ? new Date(session.exp * 1000).toLocaleString() : '—'}</Typography>
                        </Stack>
                      </Alert>
                    ) : (
                      <Alert severity="warning">{t.login.sessionMissing}</Alert>
                    )}
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                      <Button component={Link} href="/onboarding/verify" variant="contained" disabled={!session}>
                        {t.login.continue}
                      </Button>
                      {session && (
                        <Button onClick={handleClearSession} variant="outlined" color="warning">
                          {t.login.clearSession}
                        </Button>
                      )}
                      <Button component={Link} href="/auth/login" variant="outlined">
                        {t.login.retry}
                      </Button>
                    </Stack>
                  </Stack>
                </CardContent>
              </GlassCard>
            </Stack>
          </Fade>
        </Container>

        <Footer />
      </Box>
    </Box>
  );
}
