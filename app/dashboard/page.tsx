"use client";

import { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  CardContent,
  Container,
  Fade,
  Grid,
  Stack,
  Typography,
  CircularProgress,
  Card,
  Chip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import GroupAddIcon from '@mui/icons-material/GroupAdd';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import GroupsIcon from '@mui/icons-material/Groups';
import { useRouter } from 'next/navigation';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { GlassCard } from '../components/GlassCard';
import ParticleBackground from '../components/ParticleBackground';
import { useI18n } from '../lib/i18n';
import { useMounted } from '../lib/useMounted';
import { getStoredSession } from '../lib/zklogin';

interface Group {
  id: string;
  name: string;
  totalMembers: number;
  currentRound: number;
  status: 'ACTIVE' | 'PENDING' | 'COMPLETED';
}

export default function DashboardPage() {
  const { t } = useI18n();
  const mounted = useMounted();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [groups, setGroups] = useState<Group[]>([]);

  const session = getStoredSession();

  useEffect(() => {
    if (!session || !session.accessToken) {
      router.push('/auth/login');
      return;
    }

    // If phone not verified, redirect to verify
    if (!session.phoneVerified) {
      router.push('/auth/verify-phone');
      return;
    }

    // Fetch user's groups
    const fetchGroups = async () => {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_AGENT_BE_URL || '';
        const res = await fetch(`${baseUrl}/v1/groups`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${session.accessToken}`,
          },
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data?.message || 'Failed to fetch groups');
        }

        setGroups(data.groups || []);
      } catch (err) {
        const message = err instanceof Error ? err.message : t.dashboard.errorLoading;
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    fetchGroups();
  }, [session, router, t.dashboard.errorLoading]);

  if (!session) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  const hasGroups = groups.length > 0;

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

        <Container maxWidth="lg" sx={{ py: 6 }}>
          <Fade in={mounted} timeout={600}>
            <Box>
              {/* User info header */}
              <GlassCard variant="mica" intensity="medium" glow sx={{ mb: 4 }}>
                <CardContent sx={{ p: { xs: 3, md: 4 } }}>
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center" justifyContent="space-between">
                    <Stack direction="row" spacing={2} alignItems="center">
                      <AccountBalanceWalletIcon sx={{ fontSize: 48, color: '#000' }} />
                      <Box>
                        <Typography variant="h5" sx={{ fontWeight: 800 }}>
                          {t.dashboard.welcome}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
                          {session.address.slice(0, 8)}...{session.address.slice(-6)}
                        </Typography>
                      </Box>
                    </Stack>
                    <Chip 
                      label={session.phoneVerified ? t.dashboard.verified : t.dashboard.pending} 
                      color={session.phoneVerified ? 'success' : 'warning'}
                      sx={{ fontWeight: 700 }}
                    />
                  </Stack>
                </CardContent>
              </GlassCard>

              {loading && (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                  <CircularProgress />
                </Box>
              )}

              {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                  {error}
                </Alert>
              )}

              {!loading && !hasGroups && (
                <GlassCard variant="mica" intensity="medium" glow>
                  <CardContent sx={{ p: { xs: 4, md: 6 } }}>
                    <Stack spacing={4} alignItems="center">
                      <GroupsIcon sx={{ fontSize: 80, color: 'rgba(0,0,0,0.3)' }} />
                      
                      <Typography variant="h5" sx={{ fontWeight: 800, textAlign: 'center' }}>
                        {t.dashboard.empty}
                      </Typography>
                      
                      <Typography variant="body1" color="text.secondary" textAlign="center">
                        {t.dashboard.emptySubtitle}
                      </Typography>

                      <Grid container spacing={2} sx={{ mt: 2, maxWidth: 600 }}>
                        <Grid item xs={12} sm={6}>
                          <Button
                            fullWidth
                            variant="contained"
                            size="large"
                            startIcon={<AddIcon />}
                            onClick={() => router.push('/onboarding/verify')}
                            sx={{
                              bgcolor: '#000',
                              '&:hover': { bgcolor: '#111' },
                              py: 2,
                            }}
                          >
                            {t.dashboard.createTanda}
                          </Button>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Button
                            fullWidth
                            variant="outlined"
                            size="large"
                            startIcon={<GroupAddIcon />}
                            onClick={() => router.push('/pagos')}
                            sx={{
                              borderColor: '#000',
                              color: '#000',
                              '&:hover': { borderColor: '#111', bgcolor: 'rgba(0,0,0,0.05)' },
                              py: 2,
                            }}
                          >
                            {t.dashboard.joinTanda}
                          </Button>
                        </Grid>
                      </Grid>
                    </Stack>
                  </CardContent>
                </GlassCard>
              )}

              {!loading && hasGroups && (
                <Box>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
                    <Typography variant="h5" sx={{ fontWeight: 800 }}>
                      {t.dashboard.myTandas}
                    </Typography>
                    <Stack direction="row" spacing={2}>
                      <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => router.push('/onboarding/verify')}
                        sx={{
                          bgcolor: '#000',
                          '&:hover': { bgcolor: '#111' },
                        }}
                      >
                        {t.dashboard.createTanda}
                      </Button>
                      <Button
                        variant="outlined"
                        startIcon={<GroupAddIcon />}
                        onClick={() => router.push('/pagos')}
                        sx={{
                          borderColor: '#000',
                          color: '#000',
                          '&:hover': { borderColor: '#111', bgcolor: 'rgba(0,0,0,0.05)' },
                        }}
                      >
                        {t.dashboard.joinTanda}
                      </Button>
                    </Stack>
                  </Stack>

                  <Grid container spacing={3}>
                    {groups.map((group) => (
                      <Grid item xs={12} md={6} lg={4} key={group.id}>
                        <Card
                          sx={{
                            cursor: 'pointer',
                            transition: 'transform 0.2s',
                            '&:hover': {
                              transform: 'translateY(-4px)',
                            },
                          }}
                          onClick={() => router.push(`/pagos/${group.id}`)}
                        >
                          <CardContent>
                            <Stack spacing={2}>
                              <Stack direction="row" justifyContent="space-between" alignItems="center">
                                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                                  {group.name}
                                </Typography>
                                <Chip
                                  label={group.status}
                                  size="small"
                                  color={group.status === 'ACTIVE' ? 'success' : group.status === 'PENDING' ? 'warning' : 'default'}
                                />
                              </Stack>
                              <Box>
                                <Typography variant="body2" color="text.secondary">
                                  {t.dashboard.members}: {group.totalMembers}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  {t.dashboard.currentRound}: {group.currentRound}
                                </Typography>
                              </Box>
                            </Stack>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              )}
            </Box>
          </Fade>
        </Container>

        <Footer />
      </Box>
    </Box>
  );
}
