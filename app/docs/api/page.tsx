'use client';

import {
  Box,
  CardContent,
  Container,
  Stack,
  Typography,
  Chip,
  Fade,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Tabs,
  Tab,
} from '@mui/material';
import { useState } from 'react';
import ApiIcon from '@mui/icons-material/Api';
import CodeIcon from '@mui/icons-material/Code';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import ParticleBackground from '../../components/ParticleBackground';
import { useI18n } from '../../lib/i18n';
import { useMounted } from '../../lib/useMounted';
import { GlassCard } from '../../components/GlassCard';

function CodeBlock({ code }: { code: string }) {
  return (
    <Box
      component="pre"
      sx={{
        bgcolor: '#1a1a1a',
        color: '#e0e0e0',
        p: 2,
        borderRadius: 2,
        overflow: 'auto',
        fontSize: '0.85rem',
        fontFamily: 'monospace',
        '& .keyword': { color: '#569cd6' },
        '& .string': { color: '#ce9178' },
        '& .number': { color: '#b5cea8' },
      }}
    >
      <code>{code}</code>
    </Box>
  );
}

export default function APIDocsPage() {
  const { locale } = useI18n();
  const mounted = useMounted();
  const [activeTab, setActiveTab] = useState(0);

  const endpoints = [
    {
      category: 'Chain Abstraction (CCTP)',
      items: [
        {
          method: 'GET',
          path: '/api/pay',
          description: locale === 'es' 
            ? 'Descubrimiento de opciones de pago (fiat, CCTP, zkLogin)' 
            : 'Payment options discovery (fiat, CCTP, zkLogin)',
          params: 'orderId, amountUsd, description, resource, fiatAmount, currency',
          response: '402 Payment Required con rutas disponibles',
        },
        {
          method: 'GET',
          path: '/api/pay',
          description: locale === 'es' 
            ? 'Ejecutar pago crypto (EVM→Sui vía CCTP)' 
            : 'Execute crypto payment (EVM→Sui via CCTP)',
          params: 'attestation de Circle + prueba de firma (zkLogin/PTB)',
          response: '200 OK + recibo de relayer',
        },
        {
          method: 'GET',
          path: '/api/health',
          description: locale === 'es' 
            ? 'Estado del relayer CCTP/Arc' 
            : 'CCTP/Arc relayer health status',
          params: '-',
          response: '{ status, facilitator, network }',
        },
      ],
    },
    {
      category: 'Fiat Automation',
      items: [
        {
          method: 'POST',
          path: '/v1/fiat/generate-qr',
          description: locale === 'es' 
            ? 'Generar código QR bancario' 
            : 'Generate bank QR code',
          params: '{ orderId, glosa, amount, currency }',
          response: '202 Accepted',
        },
        {
          method: 'POST',
          path: '/v1/fiat/verify-payment',
          description: locale === 'es' 
            ? 'Verificar pago bancario' 
            : 'Verify bank payment',
          params: '{ orderId, glosa }',
          response: '202 Accepted',
        },
      ],
    },
    {
      category: 'Sui Move Contracts',
      items: [
        {
          method: 'POST',
          path: '/api/sui/groups',
          description: locale === 'es' 
            ? 'Crear nuevo grupo en Sui (Shared Object)' 
            : 'Create new group on Sui (Shared Object)',
          params: '{ members[], amountPerRound, frequencyDays, enableYield, yieldShareBps }',
          response: '{ groupAddress }',
        },
        {
          method: 'POST',
          path: '/api/sui/groups/:address/deposit',
          description: locale === 'es' 
            ? 'Registrar depósito y disparar PTB hacia Navi' 
            : 'Register deposit and trigger PTB into Navi',
          params: '{ member, amount }',
          response: '{ txHash }',
        },
        {
          method: 'POST',
          path: '/api/sui/groups/:address/payout',
          description: locale === 'es' 
            ? 'Ejecutar payout al ganador con sponsor de gas' 
            : 'Execute payout to round winner with sponsored gas',
          params: '{ winner }',
          response: '{ txHash }',
        },
        {
          method: 'GET',
          path: '/api/sui/groups/:address/config',
          description: locale === 'es' 
            ? 'Obtener configuración del grupo' 
            : 'Get group configuration',
          params: '-',
          response: '{ token, amountPerRound, totalMembers }',
        },
      ],
    },
    {
      category: 'Orders (AgentBE)',
      items: [
        {
          method: 'GET',
          path: '/api/orders/:id',
          description: locale === 'es' 
            ? 'Obtener detalles de una orden de pago' 
            : 'Get payment order details',
          params: '-',
          response: '{ id, status, amountFiat, amountUsdc, qrPayloadUrl, xdrChallenge }',
        },
        {
          method: 'POST',
          path: '/api/orders/:id/claim',
          description: locale === 'es' 
            ? 'Reclamar pago (fiat o crypto)' 
            : 'Claim payment (fiat or crypto)',
          params: '{ paymentType, proofMetadata | xPayment }',
          response: '{ status, message }',
        },
      ],
    },
  ];

  const xPaymentExample = `{
  "version": "cctp-v1",
  "sourceChain": "base",
  "destination": "sui",
  "attestation": "eyJhIjoiYXR0ZXN0YXRpb24tYmFzZS1zdWkifQ==",
  "relay": {
    "sponsor": "PayBE",
    "ptb": "base64-ptb-proof"
  }
}`;

  const claimFiatExample = `{
  "paymentType": "fiat",
  "proofMetadata": {
    "bank": "BancoSol",
    "amount": 700,
    "reference": "TXN-123456",
    "screenshotUrl": "https://..."
  }
}`;

  const claimCryptoExample = `{
  "paymentType": "crypto",
  "chainProof": {
    "network": "sui",
    "ptb": "base64-ptb-proof",
    "sender": "0xabc...",
    "attestationId": "circle-attestation-id"
  }
}`;

  return (
    <Box
      sx={{
        minHeight: '100vh',
        position: 'relative',
        overflow: 'hidden',
        bgcolor: '#fff',
      }}
    >
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
              {/* Header */}
              <Box sx={{ mb: 4 }}>
                <Chip
                  icon={<ApiIcon />}
                  label="API Reference"
                  sx={{
                    mb: 2,
                    bgcolor: 'rgba(0,0,0,0.05)',
                    border: '1px solid rgba(0,0,0,0.1)',
                    fontWeight: 600,
                  }}
                />
                <Typography
                  variant="h2"
                  sx={{
                    fontWeight: 800,
                    color: '#000',
                    mb: 2,
                    fontSize: { xs: '2rem', md: '3rem' },
                  }}
                >
                  {locale === 'es' ? 'Referencia de API' : 'API Reference'}
                </Typography>
                <Typography variant="h6" sx={{ color: 'rgba(0,0,0,0.6)', fontWeight: 400 }}>
                  {locale === 'es' 
                    ? 'Documentación de endpoints para PayBE y AgentBE'
                    : 'Endpoint documentation for PayBE and AgentBE'}
                </Typography>
              </Box>

              {/* Tabs */}
              <Tabs 
                value={activeTab} 
                onChange={(_, v) => setActiveTab(v)}
                sx={{
                  '& .MuiTab-root': {
                    textTransform: 'none',
                    fontWeight: 600,
                  },
                }}
              >
                <Tab label={locale === 'es' ? 'Endpoints' : 'Endpoints'} />
                <Tab label={locale === 'es' ? 'Ejemplos' : 'Examples'} />
              </Tabs>

              {activeTab === 0 && (
                <Stack spacing={4}>
                  {endpoints.map((category) => (
                    <GlassCard key={category.category} variant="mica" intensity="subtle">
                      <CardContent sx={{ p: 3 }}>
                        <Typography variant="h5" sx={{ fontWeight: 700, color: '#000', mb: 3 }}>
                          {category.category}
                        </Typography>
                        
                        <TableContainer component={Paper} elevation={0} sx={{ bgcolor: 'transparent' }}>
                          <Table size="small">
                            <TableHead>
                              <TableRow>
                                <TableCell sx={{ fontWeight: 700, color: '#000' }}>Method</TableCell>
                                <TableCell sx={{ fontWeight: 700, color: '#000' }}>Endpoint</TableCell>
                                <TableCell sx={{ fontWeight: 700, color: '#000' }}>
                                  {locale === 'es' ? 'Descripción' : 'Description'}
                                </TableCell>
                                <TableCell sx={{ fontWeight: 700, color: '#000' }}>
                                  {locale === 'es' ? 'Parámetros' : 'Parameters'}
                                </TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {category.items.map((item, index) => (
                                <TableRow key={index}>
                                  <TableCell>
                                    <Chip 
                                      label={item.method} 
                                      size="small"
                                      sx={{
                                        bgcolor: item.method === 'GET' ? 'rgba(0,150,0,0.1)' : 'rgba(0,100,200,0.1)',
                                        color: item.method === 'GET' ? '#006400' : '#004080',
                                        fontWeight: 700,
                                        fontFamily: 'monospace',
                                      }}
                                    />
                                  </TableCell>
                                  <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>
                                    {item.path}
                                  </TableCell>
                                  <TableCell sx={{ color: 'rgba(0,0,0,0.7)' }}>
                                    {item.description}
                                  </TableCell>
                                  <TableCell sx={{ fontSize: '0.8rem', color: 'rgba(0,0,0,0.5)' }}>
                                    {item.params}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      </CardContent>
                    </GlassCard>
                  ))}
                </Stack>
              )}

              {activeTab === 1 && (
                <Stack spacing={4}>
                  <GlassCard variant="mica" intensity="medium" glow>
                    <CardContent sx={{ p: 3 }}>
                      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                        <CodeIcon sx={{ color: '#000' }} />
                        <Typography variant="h6" sx={{ fontWeight: 700, color: '#000' }}>
                          X-PAYMENT Header Structure
                        </Typography>
                      </Stack>
                      <CodeBlock code={xPaymentExample} />
                    </CardContent>
                  </GlassCard>

                  <GlassCard variant="mica" intensity="subtle">
                    <CardContent sx={{ p: 3 }}>
                      <Typography variant="h6" sx={{ fontWeight: 700, color: '#000', mb: 2 }}>
                        Claim Fiat Payment
                      </Typography>
                      <CodeBlock code={claimFiatExample} />
                    </CardContent>
                  </GlassCard>

                  <GlassCard variant="mica" intensity="subtle">
                    <CardContent sx={{ p: 3 }}>
                      <Typography variant="h6" sx={{ fontWeight: 700, color: '#000', mb: 2 }}>
                        Claim Crypto Payment
                      </Typography>
                      <CodeBlock code={claimCryptoExample} />
                    </CardContent>
                  </GlassCard>
                </Stack>
              )}
            </Stack>
          </Fade>
        </Container>

        <Footer />
      </Box>
    </Box>
  );
}
