"use client";

import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  CardContent,
  CircularProgress,
  FormControlLabel,
  MenuItem,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import { useRouter } from 'next/navigation';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { GlassCard } from '../../components/GlassCard';
import { useI18n } from '../../lib/i18n';
import { useMounted } from '../../lib/useMounted';
import { getStoredSession } from '../../lib/zklogin';
import { createGroup } from '../../services/api';

const frequencyOptions = [
  { value: 7, labelKey: 'weekly' },
  { value: 14, labelKey: 'biweekly' },
  { value: 30, labelKey: 'monthly' },
  { value: -1, labelKey: 'custom' },
];

const glassInputStyle = {
  '& .MuiOutlinedInput-root': {
    bgcolor: 'rgba(255,255,255,0.95)',
    borderRadius: 2,
    '& fieldset': {
      borderColor: 'rgba(0,0,0,0.2)',
    },
    '&:hover fieldset': {
      borderColor: 'rgba(0,0,0,0.4)',
    },
    '&.Mui-focused fieldset': {
      borderColor: '#000',
    },
  },
  '& .MuiInputLabel-root': {
    color: 'rgba(0,0,0,0.6)',
  },
  '& .MuiInputBase-input': {
    color: '#000',
  },
  '& .MuiSelect-icon': {
    color: 'rgba(0,0,0,0.6)',
  },
};

export default function GroupCreatePage() {
  const { t } = useI18n();
  const mounted = useMounted();
  const router = useRouter();
  const session = useMemo(() => getStoredSession(), []);

  const [name, setName] = useState('');
  const [currency, setCurrency] = useState<'BS' | 'USDC'>('BS');
  const [amount, setAmount] = useState('');
  const [frequency, setFrequency] = useState<number>(30);
  const [customDays, setCustomDays] = useState('');
  const [yieldEnabled, setYieldEnabled] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (!session) {
      router.push('/auth/login');
    }
  }, [router, session]);

  const frequencyLabel = (value: number) => {
    switch (value) {
      case 7:
        return t.groups.create.frequencyWeekly;
      case 14:
        return t.groups.create.frequencyBiweekly;
      case 30:
        return t.groups.create.frequencyMonthly;
      case -1:
        return t.groups.create.frequencyCustom;
      default:
        return String(value);
    }
  };

  const resolveFrequency = () => {
    if (frequency === -1) {
      const custom = Number(customDays || '0');
      return Number.isFinite(custom) && custom > 0 ? custom : 0;
    }
    return frequency;
  };

  const handleSubmit = async () => {
    if (!session?.accessToken) {
      setMessage({ type: 'error', text: t.login.sessionMissing });
      return;
    }

    const parsedAmount = Number(amount);
    const freqToSend = resolveFrequency();

    if (!name.trim()) {
      setMessage({ type: 'error', text: t.groups.create.nameRequired });
      return;
    }
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setMessage({ type: 'error', text: t.groups.create.amountRequired });
      return;
    }
    if (freqToSend <= 0) {
      setMessage({ type: 'error', text: t.groups.create.frequencyRequired });
      return;
    }

    setSubmitting(true);
    setMessage(null);

    try {
      const response = await createGroup(session.accessToken, {
        name: name.trim(),
        currency,
        amount: parsedAmount,
        frequency: freqToSend,
        enableYield: yieldEnabled,
      });

      const groupId = response.groupId || response.id || response.objectId;
      if (!groupId) {
        setMessage({ type: 'error', text: t.groups.create.missingGroupId });
        return;
      }

      setMessage({ type: 'success', text: t.groups.create.created });
      router.push(`/group/invite?groupId=${encodeURIComponent(groupId)}&name=${encodeURIComponent(name.trim())}`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : t.common.error;
      setMessage({ type: 'error', text: errorMessage });
    } finally {
      setSubmitting(false);
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

      <Box sx={{ maxWidth: 960, mx: 'auto', px: 2, py: 4 }}>
        <Stack spacing={2} sx={{ mb: 3 }}>
          <Typography variant="h4" sx={{ fontWeight: 800 }}>
            {t.groups.create.title}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {t.groups.create.subtitle}
          </Typography>
        </Stack>

        <GlassCard variant="mica" intensity="medium" glow>
          <CardContent sx={{ p: { xs: 3, md: 4 } }}>
            {message && (
              <Alert severity={message.type} sx={{ mb: 3 }}>
                {message.text}
              </Alert>
            )}

            <Stack spacing={3}>
              <TextField
                label={t.groups.create.nameLabel}
                value={name}
                onChange={(e) => setName(e.target.value)}
                fullWidth
                sx={glassInputStyle}
              />

              <Stack spacing={1}>
                <Typography variant="body2" sx={{ color: 'rgba(0,0,0,0.7)' }}>
                  {t.groups.create.currencyLabel}
                </Typography>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                  <Button
                    variant={currency === 'BS' ? 'contained' : 'outlined'}
                    onClick={() => setCurrency('BS')}
                    sx={{ flex: 1 }}
                  >
                    {t.groups.create.currencyBs}
                  </Button>
                  <Button
                    variant={currency === 'USDC' ? 'contained' : 'outlined'}
                    onClick={() => setCurrency('USDC')}
                    sx={{ flex: 1 }}
                  >
                    {t.groups.create.currencyUsdc}
                  </Button>
                </Stack>
              </Stack>

              <TextField
                label={`${t.groups.create.amountLabel} (${currency})`}
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                fullWidth
                sx={glassInputStyle}
              />

              <TextField
                select
                label={t.groups.create.frequencyLabel}
                value={frequency}
                onChange={(e) => setFrequency(Number(e.target.value))}
                fullWidth
                sx={glassInputStyle}
              >
                {frequencyOptions.map((opt) => (
                  <MenuItem key={opt.value} value={opt.value}>
                    {frequencyLabel(opt.value)}
                  </MenuItem>
                ))}
              </TextField>

              {frequency === -1 && (
                <TextField
                  label={t.groups.create.customDaysLabel}
                  type="number"
                  value={customDays}
                  onChange={(e) => setCustomDays(e.target.value)}
                  fullWidth
                  sx={glassInputStyle}
                />
              )}

              <FormControlLabel
                control={
                  <Switch
                    checked={yieldEnabled}
                    onChange={(_, checked) => setYieldEnabled(checked)}
                    sx={{
                      '& .MuiSwitch-switchBase.Mui-checked': { color: '#000' },
                      '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: '#000' },
                    }}
                  />
                }
                label={t.groups.create.yieldLabel}
              />

              <Button
                variant="contained"
                size="large"
                onClick={handleSubmit}
                disabled={submitting}
                sx={{ bgcolor: '#000', '&:hover': { bgcolor: '#111' } }}
              >
                {submitting ? <CircularProgress size={20} color="inherit" /> : t.groups.create.submit}
              </Button>
            </Stack>
          </CardContent>
        </GlassCard>
      </Box>

      <Footer />
    </Box>
  );
}
