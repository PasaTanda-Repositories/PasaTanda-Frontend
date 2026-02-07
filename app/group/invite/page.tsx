"use client";

import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  CardContent,
  CircularProgress,
  IconButton,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { GlassCard } from '../../components/GlassCard';
import { useI18n } from '../../lib/i18n';
import { useMounted } from '../../lib/useMounted';
import { getStoredSession } from '../../lib/zklogin';
import { generateGroupInvitation } from '../../services/api';

export default function GroupInvitePage() {
  const { t } = useI18n();
  const mounted = useMounted();
  const router = useRouter();
  const searchParams = useSearchParams();
  const session = useMemo(() => getStoredSession(), []);

  const frontendBase = useMemo(() => {
    const envBase = process.env.NEXT_PUBLIC_FRONTEND_URL;
    if (envBase) return envBase.replace(/\/$/, '');
    if (typeof window !== 'undefined') return window.location.origin.replace(/\/$/, '');
    return '';
  }, []);

  const groupId = searchParams.get('groupId');
  const groupName = searchParams.get('name');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<'code' | 'link' | null>(null);
  const [code, setCode] = useState('');
  const [linkValue, setLinkValue] = useState('');

  useEffect(() => {
    if (!session) {
      router.push('/auth/login');
    }
  }, [router, session]);

  const loadInvitation = async () => {
    if (!session?.accessToken || !groupId) {
      setError(t.groups.invite.missingGroupId);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await generateGroupInvitation(session.accessToken, groupId);
      setCode(data.inviteCode);
      const constructedLink = frontendBase
        ? `${frontendBase}/group/join/${data.inviteCode}`
        : data.inviteLink;
      setLinkValue(constructedLink);
    } catch (err) {
      const message = err instanceof Error ? err.message : t.groups.invite.errorLoading;
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInvitation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId, session?.accessToken]);

  const handleCopy = async (value: string, field: 'code' | 'link') => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      const message = err instanceof Error ? err.message : t.common.error;
      setError(message);
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

      <Box sx={{ maxWidth: 900, mx: 'auto', px: 2, py: 4 }}>
        <Stack spacing={2} sx={{ mb: 3 }}>
          <Typography variant="h4" sx={{ fontWeight: 800 }}>
            {t.groups.invite.title}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {t.groups.invite.subtitle}
          </Typography>
          {groupName && (
            <Typography variant="body2" color="text.secondary">
              {groupName}
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

            <Stack spacing={3}>
              <Button
                variant="contained"
                onClick={loadInvitation}
                disabled={loading || !groupId}
                sx={{ bgcolor: '#000', '&:hover': { bgcolor: '#111' } }}
              >
                {loading ? <CircularProgress size={20} color="inherit" /> : t.groups.invite.generate}
              </Button>

              <TextField
                label={t.groups.invite.codeLabel}
                value={code}
                fullWidth
                InputProps={{ readOnly: true }}
              />
              <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => handleCopy(code, 'code')}
                  startIcon={copiedField === 'code' ? <CheckCircleIcon /> : <ContentCopyIcon />}
                  disabled={!code}
                >
                  {copiedField === 'code' ? t.groups.invite.copied : t.groups.invite.copyCode}
                </Button>
              </Box>

              <TextField
                label={t.groups.invite.linkLabel}
                value={linkValue}
                fullWidth
                InputProps={{ readOnly: true }}
              />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1 }}>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => handleCopy(linkValue, 'link')}
                  startIcon={copiedField === 'link' ? <CheckCircleIcon /> : <ContentCopyIcon />}
                  disabled={!linkValue}
                >
                  {copiedField === 'link' ? t.groups.invite.copied : t.groups.invite.copyLink}
                </Button>
                {linkValue && (
                  <Button
                    component={Link}
                    href={linkValue}
                    variant="text"
                    size="small"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {t.common.open}
                  </Button>
                )}
              </Box>

              <Alert severity="info">{t.groups.invite.shareHint}</Alert>
            </Stack>
          </CardContent>
        </GlassCard>
      </Box>

      <Footer />
    </Box>
  );
}
