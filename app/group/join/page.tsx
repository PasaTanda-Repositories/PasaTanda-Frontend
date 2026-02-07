"use client";

import { useMemo, useState } from 'react';
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
import { joinGroup } from '../../services/api';

export default function GroupJoinPage() {
  const { t } = useI18n();
  const mounted = useMounted();
  const router = useRouter();
  const searchParams = useSearchParams();
  const session = useMemo(() => getStoredSession(), []);

  const groupId = searchParams.get('groupId');
  const inviteCode = searchParams.get('code');

  const [turnNumber, setTurnNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ membershipId: string; turnIndex?: number } | null>(null);

  const handleJoin = async () => {
    if (!session?.accessToken || !groupId) {
      setError(t.groups.join.missingGroupId);
      return;
    }

    const parsedTurn = turnNumber.trim() ? Number(turnNumber) : undefined;
    if (parsedTurn !== undefined && (!Number.isFinite(parsedTurn) || parsedTurn <= 0)) {
      setError(t.groups.join.errorJoining);
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await joinGroup(session.accessToken, groupId, parsedTurn);
      setSuccess(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : t.groups.join.errorJoining;
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
            {t.groups.join.title}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {t.groups.join.subtitle}
          </Typography>
          {inviteCode && (
            <Typography variant="body2" color="text.secondary">
              {inviteCode}
            </Typography>
          )}
        </Stack>

        <GlassCard variant="mica" intensity="medium" glow>
          <CardContent sx={{ p: { xs: 3, md: 4 } }}>
            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}
            {success && (
              <Alert severity="success" sx={{ mb: 3 }}>
                <Stack spacing={1}>
                  <Typography variant="body1" sx={{ fontWeight: 700 }}>
                    {t.groups.join.success}
                  </Typography>
                  <Typography variant="body2">{success.membershipId}</Typography>
                  {typeof success.turnIndex === 'number' && (
                    <Typography variant="body2">
                      {t.groups.join.successTurn}: {success.turnIndex}
                    </Typography>
                  )}
                </Stack>
              </Alert>
            )}

            <Stack spacing={3}>
              <TextField
                label={t.groups.join.turnLabel}
                value={turnNumber}
                onChange={(e) => setTurnNumber(e.target.value)}
                type="number"
                helperText={t.groups.join.turnHelper}
              />

              <Button
                variant="contained"
                size="large"
                onClick={handleJoin}
                disabled={loading || !groupId}
                sx={{ bgcolor: '#000', '&:hover': { bgcolor: '#111' } }}
              >
                {loading ? <CircularProgress size={20} color="inherit" /> : t.groups.join.joinButton}
              </Button>
            </Stack>
          </CardContent>
        </GlassCard>
      </Box>

      <Footer />
    </Box>
  );
}
