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
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { GlassCard } from '../../components/GlassCard';
import ParticleBackground from '../../components/ParticleBackground';
import { useI18n } from '../../lib/i18n';
import { useMounted } from '../../lib/useMounted';

function SaveSaltContent() {
  const { t } = useI18n();
  const mounted = useMounted();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [copied, setCopied] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const salt = searchParams.get('salt');
  const provider = searchParams.get('provider');

  useEffect(() => {
    if (!salt || !provider) {
      router.push('/auth/login');
    }
  }, [salt, provider, router]);

  const handleCopy = async () => {
    if (!salt) return;
    try {
      await navigator.clipboard.writeText(salt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Error al copiar:', err);
    }
  };

  const handleContinue = () => {
    setConfirmed(true);
    router.push(`/auth/confirm-account?salt=${salt}&provider=${provider}`);
  };

  if (!salt || !provider) return null;

  return (
    <Box
      sx={{
        minHeight: '100vh',
        position: 'relative',
        overflow: 'hidden',
        backgroundImage: "url('/assets/images/backgrounds/onBoardingNameandAmmount.webp')",
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
                  <WarningIcon sx={{ fontSize: 64, color: '#f57c00' }} />
                  
                  <Typography variant="h4" sx={{ fontWeight: 800, textAlign: 'center' }}>
                    {t.auth.saveSalt.title}
                  </Typography>
                  
                  <Typography variant="body1" color="text.secondary" textAlign="center">
                    {t.auth.saveSalt.subtitle}
                  </Typography>

                  <GlassCard variant="mica" intensity="subtle" sx={{ width: '100%', mt: 2 }}>
                    <CardContent sx={{ p: 3 }}>
                      <Stack spacing={2}>
                        <Typography variant="caption" sx={{ fontWeight: 700, color: 'rgba(0,0,0,0.5)' }}>
                          {t.auth.saveSalt.saltLabel}
                        </Typography>
                        <Box
                          sx={{
                            p: 2,
                            borderRadius: 2,
                            bgcolor: 'rgba(0,0,0,0.03)',
                            border: '1px solid rgba(0,0,0,0.1)',
                            wordBreak: 'break-all',
                            fontFamily: 'monospace',
                            position: 'relative',
                          }}
                        >
                          <Typography variant="body2">{salt}</Typography>
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

                  <Alert severity="warning" sx={{ width: '100%' }}>
                    <Stack spacing={1}>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {t.auth.saveSalt.warning}
                      </Typography>
                      <Typography variant="body2">
                        {t.auth.saveSalt.warningDetails}
                      </Typography>
                    </Stack>
                  </Alert>

                  <Button
                    fullWidth
                    variant="contained"
                    size="large"
                    onClick={handleContinue}
                    disabled={confirmed}
                    sx={{
                      mt: 3,
                      bgcolor: '#000',
                      '&:hover': { bgcolor: '#111' },
                    }}
                  >
                    {t.auth.saveSalt.continue}
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

export default function SaveSaltPage() {
  return (
    <Suspense fallback={null}>
      <SaveSaltContent />
    </Suspense>
  );
}
