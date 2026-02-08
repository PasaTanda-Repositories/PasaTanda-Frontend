"use client";

import { useEffect, useState, Suspense } from 'react';
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
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { GlassCard } from '../../components/GlassCard';
import ParticleBackground from '../../components/ParticleBackground';
import { useI18n } from '../../lib/i18n';
import { useMounted } from '../../lib/useMounted';
import {
  deriveAddress,
  parseJwt,
  readPendingLogin,
  persistSession,
} from '../../lib/zklogin';
import { registerOrLoginUser } from '../../services/api';
import type { ZkLoginSession } from '../../types/zklogin';

function ConfirmAccountContent() {
  const { t } = useI18n();
  const mounted = useMounted();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [copied, setCopied] = useState(false);
  const [address, setAddress] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const salt = searchParams.get('salt');
  const provider = searchParams.get('provider') as 'google' | 'facebook' | null;

  useEffect(() => {
    if (!salt || !provider) {
      router.push('/auth/login');
      return;
    }

    // Retrieve the pending login from sessionStorage
    const allKeys = Object.keys(sessionStorage);
    const pendingKey = allKeys.find(k => k.startsWith('zklogin:pending:'));

    if (!pendingKey) {
      router.push('/auth/login');
      return;
    }

    const nonce = pendingKey.replace('zklogin:pending:', '');
    const pending = readPendingLogin(nonce);

    if (!pending || !pending.jwt) {
      router.push('/auth/login');
      return;
    }

    // Derive the Sui address from JWT + salt
    try {
      const derivedAddress = deriveAddress(pending.jwt, salt, false);
      setAddress(derivedAddress);
    } catch (err) {
      console.error('Error deriving address:', err);
      setError(t.auth.confirmAccount.errorDerivingAddress);
    }
  }, [salt, provider, router, t.auth.confirmAccount.errorDerivingAddress]);

  const handleCopy = async () => {
    if (!address) return;
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Error copying:', err);
    }
  };

  const handleCreateAccount = async () => {
    if (!salt || !address) return;

    setLoading(true);
    setError(null);

    try {
      // Retrieve the JWT from the pending login entry
      const allKeys = Object.keys(sessionStorage);
      const pendingKey = allKeys.find(k => k.startsWith('zklogin:pending:'));

      if (!pendingKey) throw new Error('No pending session found');

      const nonce = pendingKey.replace('zklogin:pending:', '');
      const pending = readPendingLogin(nonce);

      if (!pending || !pending.jwt) throw new Error('JWT not available');

      // Register or login via the service layer
      const response = await registerOrLoginUser(pending.jwt, address, salt);

      // Decode JWT for session claims
      const decoded = parseJwt(pending.jwt);

      const session: ZkLoginSession = {
        provider: provider!,
        address,
        jwt: pending.jwt,
        userSalt: salt,
        maxEpoch: pending.maxEpoch,
        randomness: pending.randomness,
        iss: decoded.iss,
        sub: decoded.sub,
        aud: decoded.aud,
        exp: decoded.exp,
        accessToken: response.accessToken,
        isNewUser: true,
        phoneVerified: response.user.phoneVerified,
        secretKey: pending.secretKey,
        ephemeralPublicKey: pending.ephemeralPublicKey,
      };

      persistSession(session);

      // Redirect based on user status
      if (response.user.status === 'PENDING_PHONE') {
        router.push('/auth/verify-phone');
      } else {
        router.push('/dashboard');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : t.auth.confirmAccount.errorCreating;
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  if (!salt || !provider || !address) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  const shortAddress = `${address.slice(0, 6)}...${address.slice(-6)}`;

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
                  <AccountBalanceWalletIcon sx={{ fontSize: 64, color: '#000' }} />

                  <Typography variant="h4" sx={{ fontWeight: 800, textAlign: 'center' }}>
                    {t.auth.confirmAccount.title}
                  </Typography>

                  <Typography variant="body1" color="text.secondary" textAlign="center">
                    {t.auth.confirmAccount.subtitle}
                  </Typography>

                  <GlassCard variant="mica" intensity="subtle" sx={{ width: '100%', mt: 2 }}>
                    <CardContent sx={{ p: 3 }}>
                      <Stack spacing={2}>
                        <Typography variant="caption" sx={{ fontWeight: 700, color: 'rgba(0,0,0,0.5)' }}>
                          {t.auth.confirmAccount.addressLabel}
                        </Typography>

                        <Box sx={{ textAlign: 'center', py: 2 }}>
                          <Typography variant="h5" sx={{ fontWeight: 700, mb: 1, fontFamily: 'monospace' }}>
                            {shortAddress}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {t.auth.confirmAccount.fullAddressBelow}
                          </Typography>
                        </Box>

                        <Box
                          sx={{
                            p: 2,
                            borderRadius: 2,
                            bgcolor: 'rgba(0,0,0,0.03)',
                            border: '1px solid rgba(0,0,0,0.1)',
                            wordBreak: 'break-all',
                            fontFamily: 'monospace',
                            position: 'relative',
                            fontSize: '0.75rem',
                          }}
                        >
                          <Typography variant="body2">{address}</Typography>
                          <IconButton
                            onClick={handleCopy}
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
                        </Box>
                      </Stack>
                    </CardContent>
                  </GlassCard>

                  {error && (
                    <Alert severity="error" sx={{ width: '100%' }}>
                      {error}
                    </Alert>
                  )}

                  <Alert severity="info" sx={{ width: '100%' }}>
                    {t.auth.confirmAccount.info}
                  </Alert>

                  <Button
                    fullWidth
                    variant="contained"
                    size="large"
                    onClick={handleCreateAccount}
                    disabled={loading}
                    sx={{
                      mt: 3,
                      bgcolor: '#000',
                      '&:hover': { bgcolor: '#111' },
                    }}
                  >
                    {loading ? <CircularProgress size={24} color="inherit" /> : t.auth.confirmAccount.createButton}
                  </Button>

                  <Button component={Link} href="/auth/login" variant="text" size="small">
                    {t.common.back}
                  </Button>
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

export default function ConfirmAccountPage() {
  return (
    <Suspense
      fallback={
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
          <CircularProgress />
        </Box>
      }
    >
      <ConfirmAccountContent />
    </Suspense>
  );
}
