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
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { GlassCard } from '../../components/GlassCard';
import { useI18n } from '../../lib/i18n';
import { useMounted } from '../../lib/useMounted';
import { getStoredSession } from '../../lib/zklogin';
import { joinGroup, lookupGroupByInvite } from '../../services/api';
import type { GroupInviteLookup } from '../../types/zklogin';

function GroupJoinContent() {
  const { t } = useI18n();
  const mounted = useMounted();
  const router = useRouter();
  const searchParams = useSearchParams();
  const params = useParams<{ inviteCode?: string }>();
  const session = useMemo(() => getStoredSession(), []);

  const inviteCodeFromParam = params?.inviteCode ? String(params.inviteCode) : null;
  const inviteCodeFromQuery = searchParams.get('code');
  const initialInviteCode = inviteCodeFromParam || inviteCodeFromQuery || '';

  const [inviteCode, setInviteCode] = useState(initialInviteCode);
  const [turnNumber, setTurnNumber] = useState('');
  const [lookupLoading, setLookupLoading] = useState(false);
  const [joinLoading, setJoinLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ membershipId: string; turnIndex?: number } | null>(null);
  const [groupDetails, setGroupDetails] = useState<GroupInviteLookup | null>(null);

  useEffect(() => {
    if (!session) {
      router.push('/auth/login');
    }
  }, [router, session]);

  useEffect(() => {
    if (initialInviteCode && session?.accessToken) {
      void handleLookup(initialInviteCode);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialInviteCode, session?.accessToken]);

  const handleLookup = async (codeOverride?: string) => {
    const codeToUse = (codeOverride ?? inviteCode).trim();
    if (!session?.accessToken) {
      setError(t.login.sessionMissing);
      return;
    }
    if (!codeToUse) {
      setError(t.groups.join.codeRequired);
      return;
    }

    setLookupLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const data = await lookupGroupByInvite(session.accessToken, codeToUse);
      setGroupDetails(data);
      setInviteCode(data.inviteCode);
    } catch (err) {
      const message = err instanceof Error ? err.message : t.groups.join.errorJoining;
      setError(message);
      setGroupDetails(null);
    } finally {
      setLookupLoading(false);
    }
  };

  const handleJoin = async () => {
    if (!session?.accessToken) {
      setError(t.login.sessionMissing);
      return;
    }

    const codeToUse = (inviteCode || groupDetails?.inviteCode || '').trim();
    if (!codeToUse) {
      setError(t.groups.join.codeRequired);
      return;
    }

    // Turn selection is disabled; backend will assign order of arrival.
    const parsedTurn = turnNumber.trim() ? Number(turnNumber) : undefined;

    setJoinLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await joinGroup(session.accessToken, codeToUse, parsedTurn);
      setSuccess(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : t.groups.join.errorJoining;
      setError(message);
    } finally {
      setJoinLoading(false);
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
          <Typography variant="body2" color="text.secondary">
            {t.groups.join.description}
          </Typography>
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
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'flex-end' }}>
                <TextField
                  label={t.groups.join.inviteCodeLabel}
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value)}
                  fullWidth
                  helperText={t.groups.join.codeHelper}
                />
                <Button
                  variant="outlined"
                  onClick={() => handleLookup()}
                  disabled={lookupLoading || !inviteCode.trim()}
                  sx={{ minWidth: 160 }}
                >
                  {lookupLoading ? <CircularProgress size={20} color="inherit" /> : t.groups.join.lookupButton}
                </Button>
              </Stack>

              {groupDetails && (
                <GlassCard variant="frosted" intensity="low">
                  <CardContent>
                    <Stack spacing={1.5}>
                      <Typography variant="h6" sx={{ fontWeight: 800 }}>
                        {t.groups.join.detailsTitle}: {groupDetails.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {t.groups.join.statusLabel}: {groupDetails.status}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {t.groups.join.contributionLabel}: {groupDetails.contributionAmount}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {t.groups.join.guaranteeLabel}: {groupDetails.guaranteeAmount}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {t.groups.join.frequencyLabel}: {groupDetails.frequency}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {t.groups.join.roundsLabel}: {groupDetails.totalRounds}
                      </Typography>
                    </Stack>
                  </CardContent>
                </GlassCard>
              )}

              <TextField
                label={t.groups.join.turnLabel}
                value={turnNumber}
                onChange={(e) => setTurnNumber(e.target.value)}
                type="number"
                helperText={t.groups.join.turnHelper}
                disabled
              />

              <Button
                variant="contained"
                size="large"
                onClick={handleJoin}
                disabled={joinLoading || (!groupDetails && !inviteCode.trim())}
                sx={{ bgcolor: '#000', '&:hover': { bgcolor: '#111' } }}
              >
                {joinLoading ? <CircularProgress size={20} color="inherit" /> : t.groups.join.joinButton}
              </Button>
            </Stack>
          </CardContent>
        </GlassCard>
      </Box>

      <Footer />
    </Box>
  );
}

export default function GroupJoinPage() {
  return (
    <Suspense fallback={null}>
      <GroupJoinContent />
    </Suspense>
  );
}
