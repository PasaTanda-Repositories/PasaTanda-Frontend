'use client';

import {
  Box,
  CardContent,
  Container,
  Stack,
  Typography,
  Chip,
  Fade,
  List,
  ListItem,
  ListItemText,
  Divider,
} from '@mui/material';
import DataObjectIcon from '@mui/icons-material/DataObject';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import ParticleBackground from '../../components/ParticleBackground';
import { useI18n } from '../../lib/i18n';
import { useMounted } from '../../lib/useMounted';
import { GlassCard } from '../../components/GlassCard';

const packageInfo = {
  id: '0xa48c115fbf1248c9413c3c655b7961bab694a57dd8b3961d4ba54b963c34058a',
  module: 'pasatanda_core',
  network: 'Sui Testnet',
};

const architectureCore = [
  {
    title: { es: 'Tanda (Shared Object)', en: 'Tanda (Shared Object)' },
    desc: {
      es: 'Cada ciclo de ROSCA es un objeto compartido accesible por todos los participantes.',
      en: 'Each ROSCA cycle is a shared object accessible by all participants.',
    },
  },
  {
    title: { es: 'Pagos por turno', en: 'Turn-based Payouts' },
    desc: {
      es: 'Los retiros se mantienen en orden fijo e inmutable, cumpliendo la regla de turno.',
      en: 'Payouts execute in a fixed, immutable order so only the current turn can claim.',
    },
  },
  {
    title: { es: 'Integración DeFi atómica', en: 'Atomic DeFi Integration' },
    desc: {
      es: 'Los depósitos pueden canalizarse hacia NAVI para capturar rendimiento antes de pagar al ganador.',
      en: 'Deposits can flow into NAVI to capture yield before the winner is paid.',
    },
  },
  {
    title: { es: 'Patrón relayer', en: 'Relayer Pattern' },
    desc: {
      es: 'Los relayers backend facilitan entradas fiat o cross-chain sin comprometer la lógica on-chain.',
      en: 'Backend relayers enable fiat or cross-chain deposits without exposing on-chain logic.',
    },
  },
];

const functionSpecs = [
  {
    name: 'create_tanda<CoinType>',
    description: {
      es: 'Crea una nueva tanda con participantes, montos y opciones de vault.',
      en: 'Creates a new Tanda with specified participants and configuration.',
    },
    command: `sui client call --package <PACKAGE_ID> --module pasatanda_core --function create_tanda \
  --type-args 0x2::sui::SUI \
  --args '[<participant1>, <participant2>, ...]' <contribution_amount> <guarantee_amount> '<fiat_vault_option>' 0x6 \
  --gas-budget 50000000`,
  },
  {
    name: 'deposit_guarantee<CoinType>',
    description: {
      es: 'Deposita la garantía inicial que activará la tanda una vez que todos la hayan pagado.',
      en: 'Deposit the initial guarantee. All participants must deposit before the Tanda becomes active.',
    },
    command: `sui client call --package <PACKAGE_ID> --module pasatanda_core --function deposit_guarantee \
  --type-args 0x2::sui::SUI \
  --args <tanda_id> <coin_object_id> 0x6 \
  --gas-budget 20000000`,
  },
  {
    name: 'deposit_payment<CoinType>',
    description: {
      es: 'Realiza la contribución mensual desde el emisor hacia la tanda.',
      en: 'Deposit monthly contribution (sender is beneficiary).',
    },
    command: `sui client call --package <PACKAGE_ID> --module pasatanda_core --function deposit_payment \
  --type-args 0x2::sui::SUI \
  --args <tanda_id> <coin_object_id> 0x6 \
  --gas-budget 20000000`,
  },
  {
    name: 'deposit_payment_for<CoinType>',
    description: {
      es: 'Deposita en nombre de otro miembro para soportar fiat o flujos cross-chain.',
      en: 'Deposit on behalf of another participant (Relayer pattern for fiat/cross-chain).',
    },
    command: `sui client call --package <PACKAGE_ID> --module pasatanda_core --function deposit_payment_for \
  --type-args 0x2::sui::SUI \
  --args <tanda_id> <coin_object_id> <beneficiary_address> 0x6 \
  --gas-budget 20000000`,
  },
  {
    name: 'payout_round<CoinType>',
    description: {
      es: 'El participante en turno reclama el pool; la función soporta retiros cripto o fiat.',
      en: 'Claim the pool for the current round. Only the participant whose turn it is can call this.',
    },
    command: `sui client call --package <PACKAGE_ID> --module pasatanda_core --function payout_round \
  --type-args 0x2::sui::SUI \
  --args <tanda_id> <withdrawal_type> 0x6 \
  --gas-budget 20000000`,
  },
  {
    name: 'close_tanda<CoinType>',
    description: {
      es: 'Cierra la tanda una vez completadas todas las rondas y devuelve garantías.',
      en: 'Close the Tanda after all rounds complete, returning guarantees.',
    },
    command: `sui client call --package <PACKAGE_ID> --module pasatanda_core --function close_tanda \
  --type-args 0x2::sui::SUI \
  --args <tanda_id> <admin_cap_id> 0x6 \
  --gas-budget 30000000`,
  },
];

const securityFeatures = [
  {
    title: { es: 'Orden de participantes inmutable', en: 'Immutable Participant Order' },
    desc: {
      es: 'El turno no se puede modificar una vez creada la tanda.',
      en: 'Once created, the turn order cannot be modified.',
    },
  },
  {
    title: { es: 'Verificación del turno', en: 'Turn Verification' },
    desc: {
      es: 'Solo el participante correcto puede reclamar cada ronda.',
      en: 'Only the correct participant can claim each round.',
    },
  },
  {
    title: { es: 'Gestión de fases', en: 'Phase Management' },
    desc: {
      es: 'Las transiciones de estado se controlan estrictamente.',
      en: 'State transitions are strictly controlled.',
    },
  },
  {
    title: { es: 'Capacidad administrativa', en: 'Admin Capability' },
    desc: {
      es: 'Las funciones administrativas están protegidas.',
      en: 'Protected administrative functions.',
    },
  },
  {
    title: { es: 'Eventos rastreables', en: 'Event Emission' },
    desc: {
      es: 'Todas las acciones importantes emiten eventos para monitoreo off-chain.',
      en: 'All important actions emit events for off-chain monitoring.',
    },
  },
];

const events = [
  { name: 'TandaCreated', desc: { es: 'Nueva tanda inicializada.', en: 'New tanda initialized.' } },
  { name: 'GuaranteeDeposited', desc: { es: 'Participante pagó la garantía.', en: 'Participant paid guarantee.' } },
  { name: 'PaymentDeposited', desc: { es: 'Contribución de ronda recibida.', en: 'Round contribution received.' } },
  { name: 'PayoutExecuted', desc: { es: 'Pool distribuido al ganador.', en: 'Pool distributed to winner.' } },
  { name: 'FiatWithdrawalRequested', desc: { es: 'Retiro fiat solicitado (para backend).', en: 'Fiat payout requested (for backend).' } },
  { name: 'RoundAdvanced', desc: { es: 'Contador de ronda incrementado.', en: 'Round counter incremented.' } },
  { name: 'PhaseChanged', desc: { es: 'Transición de estado.', en: 'Tanda state transition.' } },
  { name: 'TandaClosed', desc: { es: 'Tanda finalizada.', en: 'Tanda finalized.' } },
];

function CodeBlock({ code }: { code: string }) {
  return (
    <Box
      component="pre"
      sx={{
        bgcolor: '#0f0f0f',
        color: '#f5f5f5',
        p: 2,
        borderRadius: 2,
        overflow: 'auto',
        fontSize: '0.8rem',
        fontFamily: 'monospace',
      }}
    >
      <code>{code}</code>
    </Box>
  );
}

export default function ContractsDocsPage() {
  const { locale } = useI18n();
  const mounted = useMounted();

  const heroCopy = locale === 'es'
    ? 'Los contratos Move de PasaTanda modelan una ROSCA descentralizada (Tanda) sobre Sui.'
    : 'PasaTanda Move contracts model a decentralized ROSCA (Tanda) on Sui.';

  const heroSubcopy = locale === 'es'
    ? 'La implementación combina objetos compartidos, yield en NAVI y relayers que admiten entradas fiat y cross-chain.'
    : 'Implementation combines shared objects, NAVI yield, and relayers that accept fiat and cross-chain inputs.';

  return (
    <Box sx={{ minHeight: '100vh', position: 'relative', overflow: 'hidden', bgcolor: '#fff' }}>
      <ParticleBackground variant="stars" />
      <Box
        sx={{
          position: 'fixed',
          inset: 0,
          backgroundImage: `
            linear-gradient(rgba(0,0,0,0.02) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,0,0,0.02) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      <Box sx={{ position: 'relative', zIndex: 1 }}>
        <Header />
        <Container maxWidth="lg" sx={{ px: { xs: 2, sm: 4 }, py: 6 }}>
          <Fade in={mounted} timeout={600}>
            <Stack spacing={4}>
              <Box sx={{ mb: 4 }}>
                <Chip
                  icon={<DataObjectIcon />}
                  label={locale === 'es' ? 'Contratos Move' : 'Move Contracts'}
                  sx={{
                    mb: 2,
                    bgcolor: 'rgba(0,0,0,0.05)',
                    border: '1px solid rgba(0,0,0,0.1)',
                    fontWeight: 600,
                  }}
                />
                <Typography
                  variant="h2"
                  sx={{ fontWeight: 800, color: '#000', mb: 2, fontSize: { xs: '2rem', md: '3rem' } }}
                >
                  PasaTanda Move Smart Contracts
                </Typography>
                <Typography variant="h6" sx={{ color: 'rgba(0,0,0,0.6)', fontWeight: 400 }}>
                  {heroCopy}
                </Typography>
                <Typography variant="body1" sx={{ color: 'rgba(0,0,0,0.6)', mt: 1 }}>
                  {heroSubcopy}
                </Typography>
              </Box>

              <GlassCard variant="mica" intensity="subtle">
                <CardContent sx={{ p: 4 }}>
                  <Typography variant="h5" sx={{ fontWeight: 700, mb: 3 }}>
                    {locale === 'es' ? 'Información del paquete' : 'Package Information'}
                  </Typography>
                  <List>
                    <ListItem disablePadding>
                      <ListItemText
                        primary={locale === 'es' ? 'ID del paquete' : 'Package ID'}
                        secondary={packageInfo.id}
                        secondaryTypographyProps={{ sx: { fontFamily: 'monospace' } }}
                      />
                    </ListItem>
                    <ListItem disablePadding>
                      <ListItemText
                        primary={locale === 'es' ? 'Módulo' : 'Module'}
                        secondary={packageInfo.module}
                        secondaryTypographyProps={{ sx: { fontFamily: 'monospace' } }}
                      />
                    </ListItem>
                    <ListItem disablePadding>
                      <ListItemText
                        primary={locale === 'es' ? 'Red' : 'Network'}
                        secondary={packageInfo.network}
                        secondaryTypographyProps={{ sx: { fontFamily: 'monospace' } }}
                      />
                    </ListItem>
                  </List>
                </CardContent>
              </GlassCard>

              <GlassCard variant="mica" intensity="medium">
                <CardContent sx={{ p: 4 }}>
                  <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>
                    {locale === 'es' ? 'Arquitectura general' : 'Architecture Overview'}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'rgba(0,0,0,0.7)', mb: 3 }}>
                    {locale === 'es'
                      ? 'PasaTanda es una ROSCA (Tanda) descentralizada construida sobre Sui, diseñada para capturar rendimiento y admitir flujos fiat.'
                      : 'PasaTanda is a decentralized ROSCA (Tanda) built on Sui, designed to capture yield and accept fiat flows.'}
                  </Typography>
                  <List>
                    {architectureCore.map((item) => (
                      <ListItem
                        key={item.title.en}
                        disablePadding
                        sx={{ flexDirection: 'column', alignItems: 'flex-start', mb: 2 }}
                      >
                        <ListItemText
                          primary={locale === 'es' ? item.title.es : item.title.en}
                          primaryTypographyProps={{ sx: { fontWeight: 600 } }}
                          secondary={locale === 'es' ? item.desc.es : item.desc.en}
                          secondaryTypographyProps={{ sx: { color: 'rgba(0,0,0,0.7)' } }}
                        />
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
              </GlassCard>

              <GlassCard variant="mica" intensity="subtle">
                <CardContent sx={{ p: 4 }}>
                  <Typography variant="h5" sx={{ fontWeight: 700, mb: 3 }}>
                    {locale === 'es' ? 'Funciones principales' : 'Core Functions'}
                  </Typography>
                  <Stack spacing={3}>
                    {functionSpecs.map((fn, idx) => (
                      <Box key={fn.name}>
                        <Chip
                          label={fn.name}
                          size="small"
                          sx={{ fontFamily: 'monospace', fontSize: '0.8rem', bgcolor: 'rgba(0,0,0,0.05)', mb: 1 }}
                        />
                        <Typography variant="body2" sx={{ mb: 2, color: 'rgba(0,0,0,0.7)' }}>
                          {locale === 'es' ? fn.description.es : fn.description.en}
                        </Typography>
                        <CodeBlock code={fn.command} />
                        {idx < functionSpecs.length - 1 && <Divider sx={{ mt: 3, borderStyle: 'dashed' }} />}
                      </Box>
                    ))}
                  </Stack>
                </CardContent>
              </GlassCard>

              <GlassCard variant="mica" intensity="medium">
                <CardContent sx={{ p: 4 }}>
                  <Typography variant="h5" sx={{ fontWeight: 700, mb: 3 }}>
                    {locale === 'es' ? 'Características de seguridad' : 'Security Features'}
                  </Typography>
                  <List>
                    {securityFeatures.map((feature) => (
                      <ListItem
                        key={feature.title.en}
                        disablePadding
                        sx={{ flexDirection: 'column', alignItems: 'flex-start', mb: 2 }}
                      >
                        <ListItemText
                          primary={locale === 'es' ? feature.title.es : feature.title.en}
                          primaryTypographyProps={{ sx: { fontWeight: 600 } }}
                          secondary={locale === 'es' ? feature.desc.es : feature.desc.en}
                          secondaryTypographyProps={{ sx: { color: 'rgba(0,0,0,0.7)' } }}
                        />
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
              </GlassCard>

              <GlassCard variant="mica" intensity="subtle">
                <CardContent sx={{ p: 4 }}>
                  <Typography variant="h5" sx={{ fontWeight: 700, mb: 3 }}>
                    {locale === 'es' ? 'Eventos emitidos' : 'Event Emission'}
                  </Typography>
                  <List>
                    {events.map((event, idx) => (
                      <Box key={event.name}>
                        <ListItem
                          disablePadding
                          sx={{ flexDirection: 'column', alignItems: 'flex-start', mb: 1 }}
                        >
                          <ListItemText
                            primary={event.name}
                            primaryTypographyProps={{ sx: { fontWeight: 600 } }}
                            secondary={locale === 'es' ? event.desc.es : event.desc.en}
                            secondaryTypographyProps={{ sx: { color: 'rgba(0,0,0,0.7)' } }}
                          />
                        </ListItem>
                        {idx < events.length - 1 && <Divider sx={{ borderStyle: 'dotted', mb: 1 }} />}
                      </Box>
                    ))}
                  </List>
                </CardContent>
              </GlassCard>
            </Stack>
          </Fade>
        </Container>
        <Footer />
      </Box>
    </Box>
  );
}
