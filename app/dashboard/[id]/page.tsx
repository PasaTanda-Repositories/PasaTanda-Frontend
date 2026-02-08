"use client";

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  CardContent,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  Stack,
  Typography,
} from '@mui/material';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { useRouter, useParams } from 'next/navigation';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { GlassCard } from '../../components/GlassCard';
import { useI18n } from '../../lib/i18n';
import { useMounted } from '../../lib/useMounted';
import { getStoredSession } from '../../lib/zklogin';
import { fetchAdminGroupDashboard, requestZkProof, sponsorDeploy } from '../../services/api';
import type { AgentBEGroupDashboard } from '../../types/zklogin';

// Sui SDK imports for the deploy flow
import { Transaction } from '@mysten/sui/transactions';
import { SuiJsonRpcClient } from '@mysten/sui/jsonRpc';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import {
  genAddressSeed,
  getExtendedEphemeralPublicKey,
  getZkLoginSignature,
} from '@mysten/sui/zklogin';
import { toBase64 } from '@mysten/sui/utils';

// --- Constants ---
const PACKAGE_ID = '0xa48c115fbf1248c9413c3c655b7961bab694a57dd8b3961d4ba54b963c34058a';
const SUI_COIN_TYPE = '0x2::sui::SUI';
const CLOCK_OBJECT = '0x6';
const SUI_RPC_URL = process.env.NEXT_PUBLIC_SUI_RPC_URL ?? 'https://fullnode.testnet.sui.io:443';
const SUI_NETWORK = (process.env.NEXT_PUBLIC_SUI_NETWORK as 'mainnet' | 'testnet' | 'devnet' | 'localnet' | undefined) ?? 'testnet';
const VAULT_ADDRESS = process.env.NEXT_PUBLIC_VAULT_ADDRESS ?? '';
const DEPLOY_LOG_PREFIX = '[dashboard][deploy]';

const logDeploy = (...args: unknown[]) => {
  console.info(DEPLOY_LOG_PREFIX, ...args);
};

const logDeployError = (...args: unknown[]) => {
  console.error(DEPLOY_LOG_PREFIX, ...args);
};

type DeployStage =
  | 'idle'
  | 'building'
  | 'requestingProof'
  | 'sponsoring'
  | 'signing'
  | 'executing'
  | 'success'
  | 'error';

const formatDateTime = (value?: string | null) => {
  if (!value) return '—';
  const parsed = new Date(value);
  return Number.isNaN(parsed.valueOf()) ? '—' : parsed.toLocaleString();
};

export default function DashboardDetailPage() {
  const { t } = useI18n();
  const mounted = useMounted();
  const router = useRouter();
  const session = useMemo(() => getStoredSession(), []);
  const params = useParams();

  const groupIdRaw = params?.id;
  const groupId = Array.isArray(groupIdRaw) ? groupIdRaw[0] : groupIdRaw;

  // --- Data loading state ---
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<AgentBEGroupDashboard | null>(null);

  // --- Deploy flow state ---
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deployStage, setDeployStage] = useState<DeployStage>('idle');
  const [deployError, setDeployError] = useState<string | null>(null);

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

  const participants = data?.participants ?? [];
  const transactions = data?.transactions ?? [];
  const memberAddresses = useMemo(() => data?.memberAddresses ?? [], [data?.memberAddresses]);
  const participantsCount = participants.length;
  const hasConfig = Boolean(
    data?.group?.contributionAmount &&
      data?.group?.frequency &&
      data?.group?.totalRounds,
  );
  const readyToStart = participantsCount >= 2 && hasConfig && data?.group?.status !== 'ACTIVE';

  const myStatus = data?.myStatus ?? '—';

  // --- Dialog handlers ---
  const handleOpenDialog = useCallback(() => {
    setDeployStage('idle');
    setDeployError(null);
    setDialogOpen(true);
  }, []);

  const handleCloseDialog = useCallback(() => {
    // Only allow closing when not mid-deploy
    if (
      deployStage === 'idle' ||
      deployStage === 'success' ||
      deployStage === 'error'
    ) {
      setDialogOpen(false);
    }
  }, [deployStage]);

  // --- Deploy flow ---
  const handleStartTanda = useCallback(async () => {
    logDeploy('Deploy requested', {
      groupId,
      status: data?.group?.status,
      participants: data?.participants?.length ?? 0,
    });
    try {
      // Validate session data
      if (
        !session?.accessToken ||
        !session.jwt ||
        typeof session.secretKey !== 'string' ||
        !session.maxEpoch ||
        !session.randomness ||
        !session.userSalt
      ) {
        setDeployError(t.dashboard.deploy.errorMissingSession);
        setDeployStage('error');
        return;
      }

      if (!groupId) {
        throw new Error('Missing group identifier');
      }

      // Validate member addresses
      const validAddresses = memberAddresses.filter(
        (a): a is string => typeof a === 'string' && a.length > 0,
      );
      if (validAddresses.length < 2) {
        setDeployError(t.dashboard.deploy.errorMissingAddresses);
        setDeployStage('error');
        return;
      }

      logDeploy('Validation complete', {
        groupId,
        validAddresses: validAddresses.length,
      });

      // ---- Phase A: Build the PTB (gasless) ----
      setDeployStage('building');

      const client = new SuiJsonRpcClient({ url: SUI_RPC_URL, network: SUI_NETWORK });
      const tx = new Transaction();
      tx.setSender(session.address!);

      // Build create_tanda call
      const contributionAmountRaw = Number(data?.group?.contributionAmount ?? 0);
      const guaranteeAmountRaw = Number(data?.group?.guaranteeAmount ?? 0);

      if (!Number.isFinite(contributionAmountRaw) || !Number.isFinite(guaranteeAmountRaw)) {
        throw new Error('Invalid contribution or guarantee amount');
      }

      const contributionMist = BigInt(Math.round(contributionAmountRaw * 1_000_000_000));
      const guaranteeMist = BigInt(Math.round(guaranteeAmountRaw * 1_000_000_000));

      // Fiat vault option: Option<address>
      const fiatVaultOption = VAULT_ADDRESS
        ? tx.pure.option('address', VAULT_ADDRESS)
        : tx.pure.option('address', null);

      tx.moveCall({
        target: `${PACKAGE_ID}::pasatanda_core::create_tanda`,
        typeArguments: [SUI_COIN_TYPE],
        arguments: [
          tx.pure.vector('address', validAddresses),
          tx.pure.u64(contributionMist),
          tx.pure.u64(guaranteeMist),
          fiatVaultOption,
          tx.object(CLOCK_OBJECT),
        ],
      });

      // Build gasless tx bytes (TransactionKind only)
      const gaslessTxBytes = await tx.build({ client, onlyTransactionKind: true });
      const gaslessTxB64 = toBase64(gaslessTxBytes);

      logDeploy('Phase A complete', {
        contributionMist: contributionMist.toString(),
        guaranteeMist: guaranteeMist.toString(),
        addressCount: validAddresses.length,
        gaslessBytesLength: gaslessTxBytes.length,
      });

      // ---- Phase B: Request ZK proof from backend ----
      setDeployStage('requestingProof');

      // session.secretKey is a bech32-encoded string ("suiprivkey1q...")
      // returned by Ed25519Keypair.getSecretKey() in Sui SDK v2.x.
      // Ed25519Keypair.fromSecretKey() accepts this format directly.
      logDeploy('Reconstructing ephemeral keypair', {
        secretKeyFormat: session.secretKey.substring(0, 14) + '...',
        secretKeyLength: session.secretKey.length,
      });

      const ephemeralKp = Ed25519Keypair.fromSecretKey(session.secretKey);
      const extendedEphPk = getExtendedEphemeralPublicKey(
        ephemeralKp.getPublicKey(),
      );

      const maxEpochNum = Number(session.maxEpoch);
      if (!Number.isFinite(maxEpochNum)) {
        throw new Error('Invalid maxEpoch value');
      }

      logDeploy('Phase B requesting proof', {
        maxEpochNum,
        randomnessLength: session.randomness.length,
      });

      const zkProofResp = await requestZkProof(session.jwt, {
        extendedEphemeralPublicKey: extendedEphPk,
        maxEpoch: maxEpochNum,
        randomness: session.randomness,
        salt: session.userSalt,
        keyClaimName: 'sub',
      });

      if (!zkProofResp.proofPoints) {
        throw new Error('Backend returned empty proof points');
      }

      logDeploy('Phase B proof received', {
        headerLength: zkProofResp.headerBase64.length,
        proofA: zkProofResp.proofPoints.a.length,
      });

      // ---- Phase C: Sponsor transaction ----
      setDeployStage('sponsoring');

      const sponsorResp = await sponsorDeploy(
        session.accessToken,
        gaslessTxB64,
        groupId!,
      );

      if (!sponsorResp?.bytes || typeof sponsorResp.bytes !== 'string') {
        throw new Error('Invalid sponsor response bytes');
      }

      logDeploy('Phase C sponsor response received', {
        digest: sponsorResp.digest,
        bytesLength: sponsorResp.bytes.length,
      });

      // ---- Phase D: Sign the sponsored transaction ----
      setDeployStage('signing');

      // Reconstruct the full transaction from the sponsored bytes
      const sponsoredTx = Transaction.from(sponsorResp.bytes);
      const { bytes: signedTxBytes, signature: ephSig } = await sponsoredTx.sign({
        client,
        signer: ephemeralKp,
      });

      logDeploy('Phase D signed transaction', {
        signedBytesLength: signedTxBytes.length,
        ephSigLength: ephSig.length,
      });

      // Assemble the zkLogin composite signature
      const aud = Array.isArray(session.aud) ? session.aud[0] : session.aud;

      logDeploy('Phase D assembling zkLogin signature', {
        userSaltPrefix: session.userSalt.substring(0, 8) + '...',
        sub: session.sub ? session.sub.substring(0, 8) + '...' : 'MISSING',
        aud: typeof aud === 'string' ? aud.substring(0, 20) + '...' : 'MISSING',
      });

      const addressSeed = genAddressSeed(
        BigInt(session.userSalt),
        'sub',
        session.sub ?? '',
        aud ?? '',
      ).toString();

      const zkLoginSig = getZkLoginSignature({
        inputs: {
          proofPoints: zkProofResp.proofPoints,
          addressSeed,
          headerBase64: zkProofResp.headerBase64,
          issBase64Details: zkProofResp.issBase64Details,
        },
        maxEpoch: maxEpochNum,
        userSignature: ephSig,
      });

      // ---- Phase E: Execute on-chain ----
      setDeployStage('executing');

      const executeResult = await client.executeTransactionBlock({
        transactionBlock: signedTxBytes,
        signature: zkLoginSig,
        options: { showEffects: true, showObjectChanges: true },
      });

      if (
        executeResult.effects?.status?.status === 'failure'
      ) {
        throw new Error(
          executeResult.effects.status.error ?? 'Transaction failed on-chain',
        );
      }

      logDeploy('Phase E execution complete', {
        effectsStatus: executeResult.effects?.status?.status,
        digest: executeResult.effects?.transactionDigest ?? sponsorResp.digest,
      });

      setDeployStage('success');
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);

      // Map error to the appropriate stage message
      const stageErrorMap: Record<string, string> = {
        building: t.dashboard.deploy.errorBuilding,
        requestingProof: t.dashboard.deploy.errorProof,
        sponsoring: t.dashboard.deploy.errorSponsor,
        signing: t.dashboard.deploy.errorSigning,
        executing: t.dashboard.deploy.errorExecuting,
      };

      setDeployError(
        stageErrorMap[deployStage] ? `${stageErrorMap[deployStage]}: ${msg}` : msg,
      );
      logDeployError('Deploy failed', { stage: deployStage, error: msg });
      setDeployStage('error');
    }
  }, [session, memberAddresses, data, groupId, t, deployStage]);

  // Human-readable label for the current deploy stage
  const deployStageLabel = useMemo(() => {
    const map: Record<DeployStage, string> = {
      idle: '',
      building: t.dashboard.deploy.building,
      requestingProof: t.dashboard.deploy.requestingProof,
      sponsoring: t.dashboard.deploy.sponsoring,
      signing: t.dashboard.deploy.signing,
      executing: t.dashboard.deploy.executing,
      success: t.dashboard.deploy.success,
      error: '',
    };
    return map[deployStage];
  }, [deployStage, t]);

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
                    {t.dashboard.idLabel}: {data.group.id}
                  </Typography>
                {data.group.objectId && (
                  <Typography variant="body2" color="text.secondary">
                    {t.dashboard.objectIdLabel}: {data.group.objectId}
                  </Typography>
                )}
                {data.group.inviteCode && (
                  <Typography variant="body2" color="text.secondary">
                    {t.dashboard.inviteCodeLabel}: {data.group.inviteCode}
                  </Typography>
                )}
                {data.group.createdBy && (
                  <Typography variant="body2" color="text.secondary">
                    {t.dashboard.createdByLabel}: {data.group.createdBy}
                  </Typography>
                )}
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

            <Stack spacing={2}>
              <GlassCard variant="frosted" intensity="low">
              <CardContent>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2, gap: 2, flexWrap: 'wrap' }}>
                    <Typography variant="h6" sx={{ fontWeight: 800 }}>
                      {t.dashboard.participants}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {t.dashboard.myStatusLabel}: {myStatus}
                    </Typography>
                    <Button variant="contained" disabled={!readyToStart} onClick={handleOpenDialog}>
                      {t.dashboard.startGroup}
                    </Button>
                  </Stack>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {readyToStart ? t.dashboard.startReady : t.dashboard.startDisabled}
                  </Typography>
                  <Grid container spacing={2}>
                    {participants.map((p) => (
                      <Grid size={{ xs: 12, sm: 6, md: 4 }} key={p.membershipId}>
                        <GlassCard variant="default" intensity="low">
                          <CardContent>
                            <Typography variant="body1" sx={{ fontWeight: 700 }}>
                              {p.alias || t.dashboard.anonymous}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {t.dashboard.turnLabel}: {p.turnNumber ?? '—'}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {p.isAdmin ? t.dashboard.adminLabel : t.dashboard.memberLabel} · {formatDateTime(p.joinedAt)}
                            </Typography>
                          </CardContent>
                        </GlassCard>
                      </Grid>
                    ))}
                    {participants.length === 0 && (
                      <Grid size={{ xs: 12 }}>
                        <Typography variant="body2" color="text.secondary">
                          {t.dashboard.participantsEmpty}
                        </Typography>
                      </Grid>
                    )}
                  </Grid>
              </CardContent>
            </GlassCard>

              <GlassCard variant="frosted" intensity="low">
                <CardContent>
                  <Stack spacing={2}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Typography variant="h6" sx={{ fontWeight: 800 }}>
                        {t.dashboard.transactionsTitle}
                      </Typography>
                      {transactions.length > 0 && (
                        <Typography variant="body2" color="text.secondary">
                          {transactions.length} {t.dashboard.transactionsRecords}
                        </Typography>
                      )}
                    </Stack>
                      {transactions.length === 0 ? (
                        <Typography variant="body2" color="text.secondary">
                          {t.dashboard.transactionsEmpty}
                        </Typography>
                      ) : (
                      <Stack spacing={1}>
                        {transactions.map((tx) => (
                          <Box
                            key={tx.id}
                            sx={{
                              borderRadius: 2,
                              p: 1.5,
                              bgcolor: 'background.paper',
                              border: '1px solid rgba(0,0,0,0.05)',
                            }}
                          >
                            <Stack direction="row" justifyContent="space-between" alignItems="center">
                              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                                {tx.type} · {tx.method}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {tx.status}
                              </Typography>
                            </Stack>
                            <Typography variant="body2" color="text.secondary">
                              {tx.amount} {tx.currency} · {formatDateTime(tx.createdAt)}
                            </Typography>
                            {tx.externalPaymentUrl && (
                              <Typography variant="body2" color="primary">
                                {t.dashboard.transactionExternal}
                              </Typography>
                            )}
                          </Box>
                        ))}
                      </Stack>
                    )}
                  </Stack>
                </CardContent>
              </GlassCard>
            </Stack>
          </Stack>
        )}
      </Box>

      <Footer />

      {/* ---- Confirmation & Deploy Dialog ---- */}
      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 800 }}>
          <WarningAmberIcon color="warning" />
          {t.dashboard.startDialog.title}
        </DialogTitle>

        <DialogContent dividers>
          {/* Pre-deploy warning */}
          {deployStage === 'idle' && (
            <Stack spacing={2}>
              <Alert severity="warning" sx={{ fontWeight: 700 }}>
                {t.dashboard.startDialog.warning}
              </Alert>
              <Typography variant="body2">
                {t.dashboard.startDialog.body}
              </Typography>
            </Stack>
          )}

          {/* In-progress stages */}
          {['building', 'requestingProof', 'sponsoring', 'signing', 'executing'].includes(deployStage) && (
            <Stack spacing={2} alignItems="center" sx={{ py: 3 }}>
              <CircularProgress />
              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                {deployStageLabel}
              </Typography>
            </Stack>
          )}

          {/* Success */}
          {deployStage === 'success' && (
            <Alert severity="success" sx={{ fontWeight: 700 }}>
              {t.dashboard.deploy.success}
            </Alert>
          )}

          {/* Error */}
          {deployStage === 'error' && (
            <Alert severity="error">{deployError}</Alert>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2 }}>
          {deployStage === 'idle' && (
            <>
              <Button onClick={handleCloseDialog} color="inherit">
                {t.dashboard.startDialog.cancel}
              </Button>
              <Button variant="contained" color="warning" onClick={handleStartTanda}>
                {t.dashboard.startDialog.confirm}
              </Button>
            </>
          )}

          {deployStage === 'success' && (
            <Button
              variant="contained"
              onClick={() => {
                setDialogOpen(false);
                // Reload data to reflect on-chain status
                window.location.reload();
              }}
            >
              OK
            </Button>
          )}

          {deployStage === 'error' && (
            <>
              <Button onClick={handleCloseDialog} color="inherit">
                {t.dashboard.startDialog.cancel}
              </Button>
              <Button variant="contained" color="warning" onClick={handleStartTanda}>
                {t.dashboard.startDialog.confirm}
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
}
