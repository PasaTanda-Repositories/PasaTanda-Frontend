'use client';

import {
  Box,
  CardContent,
  Container,
  Stack,
  Typography,
  Chip,
  Fade,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Tabs,
  Tab,
} from '@mui/material';
import IntegrationInstructionsIcon from '@mui/icons-material/IntegrationInstructions';
import PaymentIcon from '@mui/icons-material/Payment';
import PhoneAndroidIcon from '@mui/icons-material/PhoneAndroid';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import ParticleBackground from '../../components/ParticleBackground';
import { useI18n } from '../../lib/i18n';
import { useMounted } from '../../lib/useMounted';
import { useState } from 'react';
import { GlassCard } from '../../components/GlassCard';

function CodeBlock({ code, language = 'typescript' }: { code: string; language?: string }) {
  return (
    <Box
      component="pre"
      sx={{
        bgcolor: '#1a1a1a',
        color: '#e0e0e0',
        p: 2,
        borderRadius: 2,
        overflow: 'auto',
        fontSize: '0.8rem',
        fontFamily: 'monospace',
        position: 'relative',
      }}
    >
      <Chip 
        label={language} 
        size="small" 
        sx={{ 
          position: 'absolute', 
          top: 8, 
          right: 8, 
          bgcolor: 'rgba(255,255,255,0.1)',
          color: '#fff',
          fontSize: '0.65rem',
        }}
      />
      <code>{code}</code>
    </Box>
  );
}

function TabPanel({ children, value, index }: { children?: React.ReactNode; value: number; index: number }) {
  return (
    <Box role="tabpanel" hidden={value !== index} sx={{ py: 3 }}>
      {value === index && children}
    </Box>
  );
}

export default function IntegrationsDocsPage() {
  const { locale } = useI18n();
  const mounted = useMounted();
  const [tab, setTab] = useState(0);

  const bridgeFlowSteps = locale === 'es' ? [
    { label: 'Usuario abre link de pago', desc: 'El bot de WhatsApp envía /pagos/{uuid}' },
    { label: 'Frontend obtiene orden', desc: 'GET /api/orders/:id retorna QR y ruta CCTP' },
    { label: 'Usuario firma', desc: 'zkLogin en Sui o wallet EVM firma la intención' },
    { label: 'Relayer recibe atestación', desc: 'PayBE escucha Circle y sponsoriza gas' },
    { label: 'PTB en Sui', desc: 'Recibir USDC + depositar en la Tanda en un solo bloque' },
    { label: 'Confirmación', desc: 'AgentBE marca el pago como completado' },
  ] : [
    { label: 'User opens payment link', desc: 'WhatsApp bot sends /pagos/{uuid}' },
    { label: 'Frontend fetches order', desc: 'GET /api/orders/:id returns QR and CCTP route' },
    { label: 'User signs', desc: 'zkLogin on Sui or an EVM wallet signs the intent' },
    { label: 'Relayer receives attestation', desc: 'PayBE listens to Circle and sponsors gas' },
    { label: 'PTB on Sui', desc: 'Receive USDC + deposit into the Tanda in one block' },
    { label: 'Confirmation', desc: 'AgentBE marks the payment as completed' },
  ];

  const walletKitExample = `import { getZkLoginSession, buildPtbProof } from '@/app/lib/chain-abstraction';

async function handleCryptoPayment(ptbChallenge: string, orderId: string) {
  // 1. Obtener sesión zkLogin o dirección EVM
  const session = await getZkLoginSession();

  // 2. Construir prueba PTB (seedless, gasless)
  const chainProof = await buildPtbProof({
    ptbChallenge,
    address: session.address,
    network: 'sui',
  });

  // 3. Enviar claim al AgentBE/PayBE
  const res = await fetch(\`/api/orders/\${orderId}/claim\`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      paymentType: 'crypto',
      chainProof,
    }),
  });

  return res.json();
}`;

  const trustlineExample = `import { prepareBridgeRoute } from '@/app/lib/chain-abstraction';

async function ensureRoute(orderId: string, sourceChain: 'base' | 'optimism' | 'arbitrum') {
  // Prepara la ruta EVM → Sui usando CCTP
  const route = await prepareBridgeRoute({ orderId, sourceChain });
  console.log('Route ready:', route.attestationId);
  return route;
}`;

  const whatsappWebhookFlow = `// AgentBE recibe webhook de WhatsApp
app.post('/webhook/whatsapp', async (req, res) => {
  const { from, body, type } = req.body;
  
  if (type === 'text') {
    // Procesar con IA (Gemini)
    const intent = await geminiClassify(body);
    
    switch (intent) {
      case 'START_ROUND':
        await startRound(from);
        break;
      case 'CHECK_PAYMENT':
        await checkPaymentStatus(from);
        break;
      case 'VIEW_BALANCE':
        await sendBalance(from);
        break;
    }
  } else if (type === 'image') {
    // Verificar comprobante
    await processPaymentProof(from, req.body.mediaUrl);
  }
});`;

  const onboardingIntegration = `// POST /api/onboarding
{
  "name": "Tanda Familia",
  "phone": "+59177777777",
  "currency": "BS",          // BS o USDC
  "amount": 100,              // Monto por ronda
  "frequency": "MENSUAL",
  "enableYield": true,        // Activar DeFi
  "yieldShareBps": 8000       // 80% para usuarios
}

// Response
{
  "groupId": "uuid",
  "whatsappGroupJid": "xxx@g.us",
  "status": "DRAFT",
  "inviteLink": "https://chat.whatsapp.com/xxx"
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
                  icon={<IntegrationInstructionsIcon />}
                  label="Integration Guides"
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
                  {locale === 'es' ? 'Guías de Integración' : 'Integration Guides'}
                </Typography>
                <Typography variant="h6" sx={{ color: 'rgba(0,0,0,0.6)', fontWeight: 400 }}>
                  {locale === 'es'
                    ? 'Cómo integrar los diferentes componentes del sistema'
                    : 'How to integrate the different system components'}
                </Typography>
              </Box>

              {/* Tabs */}
              <Box sx={{ borderBottom: 1, borderColor: 'rgba(0,0,0,0.1)' }}>
                <Tabs 
                  value={tab} 
                  onChange={(_, v) => setTab(v)}
                  sx={{
                    '& .MuiTab-root': { color: 'rgba(0,0,0,0.5)' },
                    '& .Mui-selected': { color: '#000' },
                    '& .MuiTabs-indicator': { bgcolor: '#000' },
                  }}
                >
                  <Tab icon={<AccountBalanceWalletIcon />} label="Sui / zkLogin" />
                  <Tab icon={<PaymentIcon />} label="CCTP + Relayer" />
                  <Tab icon={<PhoneAndroidIcon />} label="WhatsApp Bot" />
                </Tabs>
              </Box>

              {/* Sui / zkLogin Tab */}
              <TabPanel value={tab} index={0}>
                <Stack spacing={3}>
                  <GlassCard variant="mica" intensity="medium" glow>
                    <CardContent sx={{ p: 4 }}>
                      <Typography variant="h5" sx={{ fontWeight: 700, color: '#000', mb: 3 }}>
                        zkLogin + PTB Signing
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'rgba(0,0,0,0.6)', mb: 3 }}>
                        {locale === 'es'
                          ? 'Usamos zkLogin para firmar PTBs sin seed phrases ni gas; también puedes usar wallets EVM para iniciar CCTP.'
                          : 'We use zkLogin to sign PTBs with no seed phrases or gas; you can also use EVM wallets to kick off CCTP.'}
                      </Typography>
                      <CodeBlock code={walletKitExample} language="typescript" />
                    </CardContent>
                  </GlassCard>

                  <GlassCard variant="mica" intensity="subtle">
                    <CardContent sx={{ p: 4 }}>
                      <Typography variant="h5" sx={{ fontWeight: 700, color: '#000', mb: 3 }}>
                        {locale === 'es' ? 'Ruta de liquidez' : 'Liquidity Route'}
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'rgba(0,0,0,0.6)', mb: 3 }}>
                        {locale === 'es'
                          ? 'Prepara la ruta CCTP desde Base/OP/Arbitrum para acuñar USDC en Sui/Arc.'
                          : 'Prepare the CCTP route from Base/OP/Arbitrum to mint USDC on Sui/Arc.'}
                      </Typography>
                      <CodeBlock code={trustlineExample} language="typescript" />
                    </CardContent>
                  </GlassCard>
                </Stack>
              </TabPanel>

              {/* CCTP + Relayer Tab */}
              <TabPanel value={tab} index={1}>
                <Stack spacing={3}>
                  <GlassCard variant="mica" intensity="medium" glow>
                    <CardContent sx={{ p: 4 }}>
                      <Typography variant="h5" sx={{ fontWeight: 700, color: '#000', mb: 3 }}>
                        {locale === 'es' ? 'Flujo CCTP + Relayer' : 'CCTP + Relayer Flow'}
                      </Typography>
                      <Stepper orientation="vertical" activeStep={-1}>
                        {bridgeFlowSteps.map((step, idx) => (
                          <Step key={idx} active>
                            <StepLabel>
                              <Typography sx={{ fontWeight: 600, color: '#000' }}>{step.label}</Typography>
                            </StepLabel>
                            <StepContent>
                              <Typography variant="body2" sx={{ color: 'rgba(0,0,0,0.6)' }}>
                                {step.desc}
                              </Typography>
                            </StepContent>
                          </Step>
                        ))}
                      </Stepper>
                    </CardContent>
                  </GlassCard>

                  <GlassCard variant="mica" intensity="subtle">
                    <CardContent sx={{ p: 4 }}>
                      <Typography variant="h5" sx={{ fontWeight: 700, color: '#000', mb: 3 }}>
                        Prueba de PTB
                      </Typography>
                      <CodeBlock 
                        code={`{
  "network": "sui",
  "ptb": "base64-ptb-proof",
  "attestationId": "circle-attestation"
}`} 
                        language="json" 
                      />
                    </CardContent>
                  </GlassCard>
                </Stack>
              </TabPanel>

              {/* WhatsApp Bot Tab */}
              <TabPanel value={tab} index={2}>
                <Stack spacing={3}>
                  <GlassCard variant="mica" intensity="medium" glow>
                    <CardContent sx={{ p: 4 }}>
                      <Typography variant="h5" sx={{ fontWeight: 700, color: '#000', mb: 3 }}>
                        {locale === 'es' ? 'Webhook de WhatsApp' : 'WhatsApp Webhook'}
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'rgba(0,0,0,0.6)', mb: 3 }}>
                        {locale === 'es'
                          ? 'El AgentBE procesa mensajes de WhatsApp usando IA (Gemini) para clasificar intenciones.'
                          : 'AgentBE processes WhatsApp messages using AI (Gemini) for intent classification.'}
                      </Typography>
                      <CodeBlock code={whatsappWebhookFlow} language="javascript" />
                    </CardContent>
                  </GlassCard>

                  <GlassCard variant="mica" intensity="subtle">
                    <CardContent sx={{ p: 4 }}>
                      <Typography variant="h5" sx={{ fontWeight: 700, color: '#000', mb: 3 }}>
                        {locale === 'es' ? 'Crear Tanda (Onboarding)' : 'Create Tanda (Onboarding)'}
                      </Typography>
                      <CodeBlock code={onboardingIntegration} language="json" />
                    </CardContent>
                  </GlassCard>

                  <GlassCard variant="frosted" intensity="medium">
                    <CardContent sx={{ p: 4 }}>
                      <Typography variant="h5" sx={{ fontWeight: 700, color: '#000', mb: 2 }}>
                        {locale === 'es' ? 'Comandos del Bot' : 'Bot Commands'}
                      </Typography>
                      <Stack spacing={1}>
                        {[
                          { cmd: '"iniciar tanda"', desc: locale === 'es' ? 'Activa el grupo y despliega el contrato' : 'Activates group and deploys contract' },
                          { cmd: '"ver saldo"', desc: locale === 'es' ? 'Muestra el balance del grupo' : 'Shows group balance' },
                          { cmd: '"¿quién va?"', desc: locale === 'es' ? 'Lista los próximos turnos' : 'Lists next turns' },
                          { cmd: '"ya pagué"', desc: locale === 'es' ? 'Notifica pago pendiente de verificación' : 'Notifies pending payment verification' },
                          { cmd: '[enviar imagen]', desc: locale === 'es' ? 'Sube comprobante para verificación IA' : 'Uploads receipt for AI verification' },
                        ].map((item, idx) => (
                          <Box key={idx} sx={{ display: 'flex', gap: 2, py: 1, borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                            <Chip label={item.cmd} size="small" sx={{ fontFamily: 'monospace', bgcolor: 'rgba(0,0,0,0.05)' }} />
                            <Typography variant="body2" sx={{ color: 'rgba(0,0,0,0.7)' }}>{item.desc}</Typography>
                          </Box>
                        ))}
                      </Stack>
                    </CardContent>
                  </GlassCard>
                </Stack>
              </TabPanel>
            </Stack>
          </Fade>
        </Container>

        <Footer />
      </Box>
    </Box>
  );
}
