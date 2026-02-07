"use client";

import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  CardContent,
  CircularProgress,
  Grid,
  Stack,
  Typography,
} from '@mui/material';
import { useRouter, useParams } from 'next/navigation';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { GlassCard } from '../../components/GlassCard';
import { useI18n } from '../../lib/i18n';
import { useMounted } from '../../lib/useMounted';
import { getStoredSession } from '../../lib/zklogin';
import { fetchAdminGroupDashboard } from '../../services/api';
import type { AgentBEGroupDashboard } from '../../types/zklogin';

export default function DashboardDetailPage() {
  const { t } = useI18n();
  const mounted = useMounted();
  const router = useRouter();
  const session = useMemo(() => getStoredSession(), []);
  const params = useParams();

  const groupId = params?.id;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<AgentBEGroupDashboard | null>(null);

  useEffect(() => {
    if (!groupId || groupId === 'undefined') {
      setError(t.dashboard.errorLoading);
      setLoading(false);
      return;
    }

    if (!session || !session.accessToken) {
      router.push('/auth/login');
      return;
    }

    const load = async () => {
      try {
        const response = await fetchAdminGroupDashboard(session.accessToken!, groupId);
        setData(response);
      } catch (err) {
        const message = err instanceof Error ? err.message : t.dashboard.errorLoading;
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId, session?.accessToken]);

  const participantsCount = data?.participants?.length ?? 0;
  const hasConfig = Boolean(
    data?.group?.contributionAmount &&
      data?.group?.frequency &&
      data?.group?.totalRounds,
  );
  const readyToStart = participantsCount >= 2 && hasConfig && data?.group?.status !== 'ACTIVE';

  if (!mounted) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f5f5f5' }}>
      <Header />

      <Box sx={{ maxWidth: 1080, mx: 'auto', px: 2, py: 4 }}>
        <Stack spacing={2} sx={{ mb: 3 }}>
          <Typography variant="h4" sx={{ fontWeight: 800 }}>
            {t.dashboard.detailTitle}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t.dashboard.detailSubtitle}
          </Typography>
        </Stack>

        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress />
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {!loading && !error && data && (
          <Stack spacing={3}>
            <GlassCard variant="mica" intensity="medium" glow>
              <CardContent>
                <Stack spacing={1.5}>
                  <Typography variant="h6" sx={{ fontWeight: 800 }}>
                    {data.group.name || groupId}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {t.dashboard.status}: {data.group.status}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {t.dashboard.contribution}: {data.group.contributionAmount ?? '—'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {t.dashboard.guarantee}: {data.group.guaranteeAmount ?? '—'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {t.dashboard.frequency}: {data.group.frequency ?? '—'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {t.dashboard.rounds}: {data.group.totalRounds ?? '—'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {t.dashboard.members}: {data.group.totalMembers ?? participantsCount}
                  </Typography>
                </Stack>
              </CardContent>
            </GlassCard>

            <GlassCard variant="frosted" intensity="low">
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: 800 }}>
                    {t.dashboard.participants}
                  </Typography>
                  <Button variant="contained" disabled={!readyToStart}>
                    {t.dashboard.startGroup}
                  </Button>
                </Stack>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {readyToStart ? t.dashboard.startReady : t.dashboard.startDisabled}
                </Typography>
                <Grid container spacing={2}>
                  {data.participants.map((p, idx) => (
                    <Grid size={{ xs: 12, sm: 6, md: 4 }} key={`${p.alias || 'member'}-${idx}`}>
                      <GlassCard variant="flat" intensity="low">
                        <CardContent>
                          <Typography variant="body1" sx={{ fontWeight: 700 }}>
                            {p.alias || t.dashboard.anonymous}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {p.status || '—'}
                          </Typography>
                        </CardContent>
                      </GlassCard>
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </GlassCard>
          </Stack>
        )}
      </Box>

      <Footer />
    </Box>
  );
}
