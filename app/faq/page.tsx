'use client';

import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Container,
  Stack,
  Typography,
  Fade,
  Chip,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ParticleBackground from '../components/ParticleBackground';
import { useI18n } from '../lib/i18n';
import { useMounted } from '../lib/useMounted';

export default function FAQPage() {
  const { t, locale } = useI18n();
  const mounted = useMounted();

  const faqCategories = [
    {
      title: locale === 'es' ? 'General' : 'General',
      items: [
        {
          q: locale === 'es' ? '¿Qué es PasaTanda?' : 'What is PasaTanda?',
          a: locale === 'es' 
            ? 'PasaTanda es una plataforma SocialFi que moderniza las tandas (ROSCA) usando abstracción de cadena: Sui como capa de ejecución, Circle Arc como tesorería institucional y flujos guiados por WhatsApp.'
            : 'PasaTanda is a SocialFi platform that modernizes ROSCAs using chain abstraction: Sui for execution, Circle Arc for institutional treasury, and WhatsApp-guided flows.',
        },
        {
          q: locale === 'es' ? '¿Necesito criptomonedas para empezar?' : 'Do I need cryptocurrency to start?',
          a: locale === 'es'
            ? 'No. Puedes iniciar solo con pagos bancarios (QR). Las wallets Sui/EVM son opcionales para cobrar en USDC.'
            : 'No. You can start with bank payments only (QR). Sui/EVM wallets are optional for USDC payouts.',
        },
        {
          q: locale === 'es' ? '¿Dónde se guarda el dinero?' : 'Where is the money stored?',
          a: locale === 'es'
            ? 'La custodia vive en contratos Move sobre Sui y la tesorería se consolida en Circle Arc. PayBE verifica pagos fiat y orquesta el puente.'
            : 'Custody lives in Move contracts on Sui and treasury consolidates in Circle Arc. PayBE verifies fiat payments and orchestrates the bridge.',
        },
      ],
    },
    {
      title: locale === 'es' ? 'Pagos' : 'Payments',
      items: [
        {
          q: locale === 'es' ? '¿Cómo pago mi cuota?' : 'How do I pay my quota?',
          a: locale === 'es'
            ? 'Tienes dos opciones: 1) QR Bancario - Escanea el código con tu app bancaria y paga en moneda local. 2) Wallet Sui/EVM - Paga en USDC; el relayer usa CCTP para acuñar en Sui/Arc.'
            : 'You have two options: 1) Bank QR - Scan the code with your banking app and pay in local currency. 2) Sui/EVM wallet - Pay in USDC; the relayer uses CCTP to mint on Sui/Arc.',
        },
        {
          q: locale === 'es' ? '¿Cómo se calculan las cuotas en USDC?' : 'How are USDC quotas calculated?',
          a: locale === 'es'
            ? 'El backend calcula el monto en USDC dinámicamente al generar cada orden, sin fijar un tipo de cambio en la interfaz.'
            : 'The backend calculates the USDC amount dynamically when generating each order, without fixing an exchange rate in the interface.',
        },
        {
          q: locale === 'es' ? '¿Qué wallets son compatibles?' : 'Which wallets are supported?',
          a: locale === 'es'
            ? 'Puedes usar zkLogin en Sui, o wallets EVM (Base/OP/Arbitrum) si envías USDC por CCTP hacia nuestro relayer.'
            : 'You can use zkLogin on Sui, or EVM wallets (Base/OP/Arbitrum) if you send USDC via CCTP to our relayer.',
        },
      ],
    },
    {
      title: locale === 'es' ? 'Rendimientos (DeFi)' : 'Yield (DeFi)',
      items: [
        {
          q: locale === 'es' ? '¿Cómo funcionan los rendimientos?' : 'How does yield generation work?',
          a: locale === 'es'
            ? 'Cuando activas la opción de rendimientos, el pozo se deposita en Navi Protocol sobre Sui en el mismo bloque de entrada. El rendimiento se reparte entre miembros y la plataforma según configuración.'
            : 'When you enable yield, the pool is supplied to Navi Protocol on Sui in the same block it arrives. Yield is shared between members and the platform per configuration.',
        },
        {
          q: locale === 'es' ? '¿Es seguro invertir en Navi?' : 'Is investing in Navi safe?',
          a: locale === 'es'
            ? 'Navi es un protocolo DeFi auditado en Sui. Como cualquier protocolo DeFi, implica riesgos; recomendamos entenderlos antes de activar la opción de rendimientos.'
            : 'Navi is an audited DeFi protocol on Sui. Like any DeFi protocol it carries risk; please understand it before enabling yield.',
        },
      ],
    },
    {
      title: locale === 'es' ? 'Grupos y WhatsApp' : 'Groups and WhatsApp',
      items: [
        {
          q: locale === 'es' ? '¿Cómo creo un grupo?' : 'How do I create a group?',
          a: locale === 'es'
            ? 'Ve a la sección de Onboarding, completa el formulario con los datos del grupo, verifica tu número de WhatsApp, y el sistema creará automáticamente un grupo de WhatsApp con un bot asistente.'
            : 'Go to the Onboarding section, complete the form with group data, verify your WhatsApp number, and the system will automatically create a WhatsApp group with an assistant bot.',
        },
        {
          q: locale === 'es' ? '¿Cómo se activa la tanda?' : 'How is the tanda activated?',
          a: locale === 'es'
            ? 'Después de crear el grupo (estado DRAFT), el administrador debe escribir "iniciar tanda" en el grupo de WhatsApp. Esto despliega el contrato inteligente y genera la primera orden de pago.'
            : 'After creating the group (DRAFT state), the administrator must type "iniciar tanda" in the WhatsApp group. This deploys the smart contract and generates the first payment order.',
        },
        {
          q: locale === 'es' ? '¿Qué hace el bot de WhatsApp?' : 'What does the WhatsApp bot do?',
          a: locale === 'es'
            ? 'El bot guía a los miembros con recordatorios de pago, verifica comprobantes, notifica turnos y permite activar la tanda mediante comandos en el chat.'
            : 'The bot guides members with payment reminders, verifies receipts, notifies turns, and allows activating the tanda through chat commands.',
        },
      ],
    },
    {
      title: locale === 'es' ? 'Seguridad' : 'Security',
      items: [
        {
          q: locale === 'es' ? '¿Mis fondos están seguros?' : 'Are my funds safe?',
          a: locale === 'es'
            ? 'Los fondos se almacenan en contratos Move auditados sobre Sui; las salidas fiat pasan por Circle Arc. Las transacciones se firman con zkLogin o wallets EVM y el sistema nunca tiene tus llaves.'
            : 'Funds are stored in audited Move contracts on Sui; fiat off-ramps settle through Circle Arc. Transactions are signed with zkLogin or EVM wallets and the system never holds your keys.',
        },
        {
          q: locale === 'es' ? '¿Cómo funciona el puente CCTP?' : 'How does the CCTP bridge work?',
          a: locale === 'es'
            ? 'CCTP quema USDC en la red EVM de origen y los acuña en el destino. El PayBE escucha la atestación de Circle, sponsoriza gas y ejecuta una PTB en Sui que deposita directo en la Tanda.'
            : 'CCTP burns USDC on the source EVM chain and mints it on the destination. PayBE listens for Circle attestations, sponsors gas, and executes a PTB on Sui that deposits straight into the Tanda.',
        },
      ],
    },
  ];

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

      {/* Grid overlay */}
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

        <Container maxWidth="md" sx={{ px: { xs: 2, sm: 4 }, py: 6 }}>
          <Fade in={mounted} timeout={600}>
            <Stack spacing={4}>
              {/* Header */}
              <Box sx={{ textAlign: 'center', mb: 4 }}>
                <Chip
                  icon={<HelpOutlineIcon />}
                  label="FAQ"
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
                  {t.faq.title}
                </Typography>
                <Typography
                  variant="h6"
                  sx={{
                    color: 'rgba(0,0,0,0.6)',
                    fontWeight: 400,
                    maxWidth: 600,
                    mx: 'auto',
                  }}
                >
                  {locale === 'es' 
                    ? 'Encuentra respuestas a las preguntas más comunes sobre PasaTanda'
                    : 'Find answers to the most common questions about PasaTanda'}
                </Typography>
              </Box>

              {/* FAQ Categories */}
              {faqCategories.map((category, categoryIndex) => (
                <Box key={categoryIndex}>
                  <Typography
                    variant="h5"
                    sx={{
                      fontWeight: 700,
                      color: '#000',
                      mb: 2,
                      pl: 1,
                    }}
                  >
                    {category.title}
                  </Typography>
                  
                  <Stack spacing={1}>
                    {category.items.map((item, itemIndex) => (
                      <Accordion
                        key={itemIndex}
                        elevation={0}
                        sx={{
                          bgcolor: 'rgba(255,255,255,0.9)',
                          backdropFilter: 'blur(10px)',
                          border: '1px solid rgba(0,0,0,0.08)',
                          borderRadius: '12px !important',
                          '&:before': { display: 'none' },
                          '&.Mui-expanded': {
                            margin: 0,
                            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                          },
                          transition: 'all 0.3s ease',
                        }}
                      >
                        <AccordionSummary
                          expandIcon={<ExpandMoreIcon sx={{ color: '#000' }} />}
                          sx={{
                            '& .MuiAccordionSummary-content': {
                              my: 2,
                            },
                          }}
                        >
                          <Typography sx={{ fontWeight: 600, color: '#000' }}>
                            {item.q}
                          </Typography>
                        </AccordionSummary>
                        <AccordionDetails sx={{ pt: 0, pb: 3 }}>
                          <Typography sx={{ color: 'rgba(0,0,0,0.7)', lineHeight: 1.7 }}>
                            {item.a}
                          </Typography>
                        </AccordionDetails>
                      </Accordion>
                    ))}
                  </Stack>
                </Box>
              ))}

              {/* Contact CTA */}
              <Box
                sx={{
                  mt: 6,
                  p: 4,
                  borderRadius: 4,
                  bgcolor: 'rgba(0,0,0,0.03)',
                  border: '1px solid rgba(0,0,0,0.08)',
                  textAlign: 'center',
                }}
              >
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#000', mb: 1 }}>
                  {locale === 'es' ? '¿No encontraste lo que buscabas?' : 'Didn\'t find what you were looking for?'}
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(0,0,0,0.6)' }}>
                  {locale === 'es' 
                    ? 'Contáctanos en nuestro grupo de Telegram o envíanos un mensaje por WhatsApp.'
                    : 'Contact us on our Telegram group or send us a message on WhatsApp.'}
                </Typography>
              </Box>
            </Stack>
          </Fade>
        </Container>

        <Footer />
      </Box>
    </Box>
  );
}
