"use client";

import { useEffect, useMemo, useState, Suspense } from 'react';
import {
  Alert,
  Box,
  Button,
  CardContent,
  CircularProgress,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useRouter, useSearchParams } from 'next/navigation';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { GlassCard } from '../../components/GlassCard';
import { useI18n } from '../../lib/i18n';
import { useMounted } from '../../lib/useMounted';
import { getStoredSession } from '../../lib/zklogin';
import { fetchGroupDashboard, startGroup } from '../../services/api';

function GroupStartContent() {
  const { t } = useI18n();
  const mounted = useMounted();
  const router = useRouter();
  const searchParams = useSearchParams();
  const session = useMemo(() => getStoredSession(), []);

  const initialGroupId = searchParams.get('groupId') || '';

  const [groupId, setGroupId] = useState(initialGroupId);
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session) {
      router.push('/auth/login');
    }
  }, [router, session]);

  useEffect(() => {
    const loadStatus = async () => {
      if (!session?.accessToken || !groupId) return;
      try {
        const dashboard = await fetchGroupDashboard(session.accessToken, groupId);
        setStatus(dashboard.group?.status || null);
      } catch {
        // ignore dashboard errors silently
      }
    };

    loadStatus();
  }, [groupId, session?.accessToken]);

  const handleStart = async () => {
    if (!session?.accessToken || !groupId.trim()) {
      setError(t.groups.start.missingGroupId);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await startGroup(session.accessToken, groupId.trim());
      setStatus(result.status || 'ACTIVE');
    } catch (err) {
      const message = err instanceof Error ? err.message : t.groups.start.errorStarting;
      setError(message);
    } finally {
      setLoading(false);
    }
  };

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

      <Box sx={{ maxWidth: 720, mx: 'auto', px: 2, py: 4 }}>
        <Stack spacing={2} sx={{ mb: 3 }}>
          <Typography variant="h4" sx={{ fontWeight: 800 }}>
            {t.groups.start.title}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {t.groups.start.subtitle}
          </Typography>
        </Stack>

        <GlassCard variant="mica" intensity="medium" glow>
          <CardContent sx={{ p: { xs: 3, md: 4 } }}>
            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}
            {status && (
              <Alert severity="info" sx={{ mb: 3 }}>
                {t.groups.start.statusLabel}: {status}
              </Alert>
            )}

            <Stack spacing={3}>
              <TextField
                label={t.groups.start.groupIdLabel}
                value={groupId}
                onChange={(e) => setGroupId(e.target.value)}
              />

              <Button
                variant="contained"
                size="large"
                onClick={handleStart}
                disabled={loading || !groupId.trim()}
                sx={{ bgcolor: '#000', '&:hover': { bgcolor: '#111' } }}
              >
                {loading ? <CircularProgress size={20} color="inherit" /> : t.groups.start.startButton}
              </Button>

              {status && (
                <Alert severity="success">{t.groups.start.success}</Alert>
              )}
            </Stack>
          </CardContent>
        </GlassCard>
      </Box>

      <Footer />
    </Box>
  );
}

export default function GroupStartPage() {
  return (
    <Suspense fallback={null}>
      <GroupStartContent />
    </Suspense>
  );
}
