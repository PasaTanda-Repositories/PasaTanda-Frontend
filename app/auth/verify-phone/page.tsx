"use client";

import { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  CardContent,
  Container,
  Fade,
  IconButton,
  Stack,
  Typography,
  CircularProgress,
  Paper,
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PhoneAndroidIcon from '@mui/icons-material/PhoneAndroid';
import RefreshIcon from '@mui/icons-material/Refresh';
import { useRouter } from 'next/navigation';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { GlassCard } from '../../components/GlassCard';
import ParticleBackground from '../../components/ParticleBackground';
import { useI18n } from '../../lib/i18n';
import { useMounted } from '../../lib/useMounted';
import { getStoredSession, persistSession } from '../../lib/zklogin';
import { requestPhoneOtp, checkPhoneStatus } from '../../services/api';

export default function VerifyPhonePage() {
  const { t } = useI18n();
  const mounted = useMounted();
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [otpCode, setOtpCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verified, setVerified] = useState(false);

  const session = getStoredSession();

  useEffect(() => {
    if (!session || !session.accessToken) {
      router.push('/auth/login');
      return;
    }

    // If already verified, redirect to dashboard
    if (session.phoneVerified) {
      router.push('/dashboard');
    }
  }, [session, router]);

  const handleGenerateOTP = async () => {
    if (!session?.accessToken) return;

    setLoading(true);
    setError(null);

    try {
      const data = await requestPhoneOtp(session.accessToken);
      // The backend may return `code` (API docs) or `otp` (legacy)
      setOtpCode(data.code || data.otp || null);
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : t.auth.verifyPhone.errorGenerating;
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckStatus = async () => {
    if (!session?.accessToken) return;

    setChecking(true);
    setError(null);

    try {
      const data = await checkPhoneStatus(session.accessToken);

      if (data.verified) {
        setVerified(true);

        // Update persisted session
        persistSession({
          ...session,
          phoneVerified: true,
        });

        // Redirect to dashboard after a short delay
        setTimeout(() => {
          router.push('/dashboard');
        }, 1500);
      } else {
        setError(t.auth.verifyPhone.notYetVerified);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : t.auth.verifyPhone.errorChecking;
      setError(message);
    } finally {
      setChecking(false);
    }
  };

  const handleCopyOTP = async () => {
    if (!otpCode) return;
    try {
      await navigator.clipboard.writeText(otpCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Error copying:', err);
    }
  };

  if (!session) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        position: 'relative',
        overflow: 'hidden',
        backgroundImage: "url('/assets/images/backgrounds/onBoardingFrecuencyandYield.webp')",
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
                  <PhoneAndroidIcon sx={{ fontSize: 64, color: '#000' }} />

                  <Typography variant="h4" sx={{ fontWeight: 800, textAlign: 'center' }}>
                    {verified ? t.auth.verifyPhone.titleVerified : t.auth.verifyPhone.title}
                  </Typography>

                  <Typography variant="body1" color="text.secondary" textAlign="center">
                    {verified ? t.auth.verifyPhone.subtitleVerified : t.auth.verifyPhone.subtitle}
                  </Typography>

                  {!verified && !otpCode && (
                    <Button
                      fullWidth
                      variant="contained"
                      size="large"
                      onClick={handleGenerateOTP}
                      disabled={loading}
                      sx={{ mt: 3, bgcolor: '#000', '&:hover': { bgcolor: '#111' } }}
                    >
                      {loading ? (
                        <CircularProgress size={24} color="inherit" />
                      ) : (
                        t.auth.verifyPhone.generateButton
                      )}
                    </Button>
                  )}

                  {otpCode && !verified && (
                    <GlassCard variant="mica" intensity="subtle" sx={{ width: '100%', mt: 2 }}>
                      <CardContent sx={{ p: 3 }}>
                        <Stack spacing={2}>
                          <Typography variant="caption" sx={{ fontWeight: 700, color: 'rgba(0,0,0,0.5)' }}>
                            {t.auth.verifyPhone.codeLabel}
                          </Typography>

                          <Paper
                            sx={{
                              p: 3,
                              textAlign: 'center',
                              bgcolor: 'rgba(0,0,0,0.03)',
                              border: '2px solid rgba(0,0,0,0.1)',
                              position: 'relative',
                            }}
                          >
                            <Typography
                              variant="h3"
                              sx={{ fontWeight: 700, fontFamily: 'monospace', letterSpacing: 4 }}
                            >
                              {otpCode}
                            </Typography>
                            <IconButton
                              onClick={handleCopyOTP}
                              sx={{
                                position: 'absolute',
                                top: 8,
                                right: 8,
                                bgcolor: copied ? 'success.main' : 'rgba(0,0,0,0.05)',
                                color: copied ? '#fff' : '#000',
                                '&:hover': {
                                  bgcolor: copied ? 'success.dark' : 'rgba(0,0,0,0.1)',
                                },
                              }}
                            >
                              {copied ? <CheckCircleIcon /> : <ContentCopyIcon />}
                            </IconButton>
                          </Paper>

                          <Alert severity="info">{t.auth.verifyPhone.sendInstructions}</Alert>

                          <Button
                            fullWidth
                            variant="outlined"
                            size="large"
                            onClick={handleCheckStatus}
                            disabled={checking}
                            startIcon={checking ? <CircularProgress size={20} /> : <RefreshIcon />}
                            sx={{ mt: 2 }}
                          >
                            {checking ? t.auth.verifyPhone.checking : t.auth.verifyPhone.checkButton}
                          </Button>
                        </Stack>
                      </CardContent>
                    </GlassCard>
                  )}

                  {verified && (
                    <Alert severity="success" sx={{ width: '100%' }}>
                      <Typography variant="body1" sx={{ fontWeight: 700 }}>
                        {t.auth.verifyPhone.verifiedSuccess}
                      </Typography>
                    </Alert>
                  )}

                  {error && (
                    <Alert severity="error" sx={{ width: '100%' }}>
                      {error}
                    </Alert>
                  )}
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
