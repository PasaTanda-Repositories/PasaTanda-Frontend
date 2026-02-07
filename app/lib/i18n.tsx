"use client";

import { createContext, useCallback, useContext, useMemo, useSyncExternalStore } from "react";

export type Locale = "es" | "en";

const translations = {
es: {
    nav: {
      home: "Inicio",
      pay: "Pagos",
      login: "Acceder",
      onboarding: "Onboarding",
      docs: "Documentación",
      tos: "Términos",
      privacy: "Privacidad",
    },
    login: {
      title: "Inicia sesión con zkLogin",
      subtitle: "Usa Google o Facebook vía Sui zkLogin. Creamos una llave efímera y un nonce para la prueba.",
      google: "Continuar con Google",
      facebook: "Continuar con Facebook",
      apple: "Apple (próximamente)",
      appleSoon: "El soporte para Apple ID llegará pronto.",
      sessionReady: "Sesión zkLogin lista",
      sessionMissing: "Inicia sesión con zkLogin antes de crear tu tanda.",
      addressLabel: "Dirección Sui derivada",
      continue: "Continuar a la creación",
      retry: "Reintentar inicio",
      callbackProcessing: "Procesando callback de OAuth...",
      callbackSuccess: "¡Autenticación completada! Sesión zkLogin guardada.",
      callbackError: "No pudimos finalizar el login. Inténtalo de nuevo.",
      clearSession: "Limpiar sesión",
      sessionCleared: "Sesión limpiada. Inicia nuevamente.",
    },
    // Nota: He movido 'create' a 'groups.create' donde parece pertenecer más abajo, 
    // o si lo usas en la raíz, déjalo aquí.
    auth: {
      // He limpiado el inglés que tenías pegado aquí por error
      // y he agrupado la verificación bajo 'verifyPhone' para coincidir con la estructura de 'en'
      verifyPhone: {
        title: "Verifica tu Teléfono",
        titleVerified: "¡Teléfono Verificado!",
        subtitle: "Genera un código de verificación y envíalo por WhatsApp al bot.",
        phoneLabel: "Número de WhatsApp",
        phonePlaceholder: "+591 70000000",
        subtitleVerified: "Tu número de teléfono ha sido verificado exitosamente.",
        generateButton: "Generar Código",
        phoneRequired: "Ingresa tu número de WhatsApp para continuar.",
        codeLabel: "Código de Verificación",
        sendInstructions: "Copia este código y envíalo al bot de WhatsApp de PasaTanda.",
        checkButton: "Verificar Estado",
        checking: "Verificando...",
        notYetVerified: "Aún no verificado. Envía el código por WhatsApp.",
        verifiedSuccess: "¡Verificación exitosa! Redirigiendo al dashboard...",
        errorGenerating: "Error al generar código",
        errorChecking: "Error al verificar estado",
      },
    }, // Cierra auth
    // (AQUI ESTABA EL ERROR: quitamos la llave extra que cerraba 'es')
    dashboard: {
      welcome: "Bienvenido",
      verified: "Verificado",
      pending: "Pendiente",
      empty: "No tienes tandas",
      emptySubtitle: "Comienza creando una nueva tanda o únete a una existente.",
      createTanda: "Crear Tanda",
      joinTanda: "Unirse a Tanda",
      myTandas: "Mis Tandas",
      members: "Miembros",
      currentRound: "Ronda actual",
      errorLoading: "Error al cargar tandas",
      detailTitle: "Dashboard de tanda",
      detailSubtitle: "Revisa el estado y los participantes de esta tanda.",
      status: "Estado",
      contribution: "Aporte",
      guarantee: "Garantía",
      frequency: "Frecuencia",
      rounds: "Rondas",
      participants: "Participantes",
      startGroup: "Iniciar tanda",
      startReady: "Listo para iniciar: hay suficientes participantes y datos configurados.",
      startDisabled: "Necesitas al menos 2 participantes y completar la configuración antes de iniciar.",
      anonymous: "Participante",
    },
    groups: {
      create: {
        title: "Crear tanda",
        subtitle: "Define los datos básicos de tu grupo.",
        nameLabel: "Nombre del grupo",
        currencyLabel: "Moneda",
        currencyBs: "Bolivianos (Bs)",
        currencyUsdc: "USDC",
        contributionLabel: "Monto por ronda",
        guaranteeLabel: "Monto de garantía",
        guaranteeHelper: "La garantía puede ser cero si aún no la acuerdan.",
        totalRoundsLabel: "Cantidad de rondas",
        frequencyLabel: "Frecuencia de pagos",
        customDaysLabel: "Días personalizados",
        yieldLabel: "Activar rendimientos (opcional)",
        frequencyWeekly: "Semanal (7 días)",
        frequencyBiweekly: "Quincenal (14 días)",
        frequencyMonthly: "Mensual (30 días)",
        frequencyCustom: "Personalizado",
        submit: "Crear grupo",
        creating: "Creando...",
        nameRequired: "Ingresa el nombre del grupo.",
        contributionRequired: "Ingresa un monto de ronda válido (>= 1).",
        guaranteeInvalid: "La garantía debe ser un número >= 0.",
        roundsRequired: "Define cuántas rondas tendrá la tanda.",
        frequencyRequired: "Selecciona la frecuencia.",
        created: "Grupo creado. Genera la invitación para compartirlo.",
        missingGroupId: "No se pudo obtener el identificador del grupo.",
      },
      invite: {
        title: "Invita a tu grupo",
        subtitle: "Genera el enlace y compártelo con los participantes.",
        generate: "Generar invitación",
        codeLabel: "Código de invitación",
        linkLabel: "Enlace de invitación",
        copyCode: "Copiar código",
        copyLink: "Copiar enlace",
        copied: "Copiado",
        shareHint: "Envía este enlace a las personas que quieras sumar al grupo.",
        missingGroupId: "Falta el identificador del grupo.",
        errorLoading: "No se pudo generar la invitación.",
      },
      join: {
        title: "Unirte a una tanda",
        subtitle: "Confirma que deseas unirte al grupo.",
        description: "Ingresa el código de invitación para ver los detalles y unirte.",
        inviteCodeLabel: "Código de invitación",
        codeHelper: "El organizador lo comparte contigo.",
        lookupButton: "Ver detalles",
        turnLabel: "Número de turno (opcional)",
        turnHelper: "Por ahora el turno se asigna por orden de llegada.",
        detailsTitle: "Detalles de la tanda",
        statusLabel: "Estado",
        contributionLabel: "Aporte por ronda",
        guaranteeLabel: "Garantía",
        frequencyLabel: "Frecuencia",
        roundsLabel: "Rondas",
        joinButton: "Unirse al grupo",
        joining: "Uniendo...",
        success: "Te uniste al grupo exitosamente.",
        successTurn: "Tu turno asignado es",
        missingGroupId: "Falta el identificador del grupo.",
        codeRequired: "Ingresa el código de invitación.",
        errorJoining: "No se pudo unir al grupo.",
      },
      start: {
        title: "Iniciar tanda",
        subtitle: "Activa el grupo cuando todos estén listos.",
        startButton: "Iniciar",
        starting: "Iniciando...",
        success: "La tanda se inició correctamente.",
        statusLabel: "Estado",
        groupIdLabel: "ID del grupo",
        missingGroupId: "Falta el identificador del grupo.",
        errorStarting: "No se pudo iniciar la tanda.",
      },
    },
    hero: {
      title: "PasaTanda, ahorro rotativo sobre Sui",
      subtitle:
        "Organiza tandas confiables con on/off ramp bancario, contratos Move y flujos guiados por WhatsApp.",
      primaryCta: "Crear tanda",
      secondaryCta: "Ver pagos",
      metrics: [
        { label: "Liquidaciones 24/7", value: "Sui + EVM" },
        { label: "On/Off ramp", value: "QR bancario" },
        { label: "Custodia", value: "Move" },
      ],
    },
    valueProps: {
      sui: {
        title: "Seguridad sobre Sui",
        body:
          "Firmas con ZKLogin para validar pagos sin exponer llaves. Los contratos Move registran turnos y fondos.",
      },
      onramp: {
        title: "On-ramp / Off-ramp local",
        body:
          "Pagos vía QR bancario o USDC. El backend verifica comprobantes y genera órdenes con links dinámicos.",
      },
      automation: {
        title: "Automatización por WhatsApp",
        body:
          "El bot guía a los miembros: recordatorios, verificación de pagos y activación de la tanda desde el chat.",
      },
    },
    howItWorks: {
      title: "Cómo funciona",
      steps: [
        "Crea tu cuenta con ZKLogin y crea un grupo de ahorro.",
        "Invita a tus amigos a registrarse.",
        "Da inicio a la tanda y deja que el bot la gestione automáticamente.",
      ],
    },
    faq: {
      title: "Preguntas frecuentes",
      items: [
        {
          q: "¿Necesito cripto para empezar?",
          a: "No. Puedes iniciar solo con pagos en Bs. con QR Simple desde tu banco de confianza.",
        },
        {
          q: "¿Dónde se guarda el dinero?",
          a: "La custodia se maneja en Sui.",
        },
        {
          q: "¿Qué wallets soportan?",
          a: "Cualquiera compatible con EVM y Sui.",
        },
        {
          q: "¿Cómo se calculan las cuotas en USDC?",
          a: "El backend calcula el monto en USDC dinámicamente al generar cada orden, sin fijar un tipo de cambio en UI.",
        },
      ],
    },
    docs: {
      title: "Documentación del proyecto",
      intro:
        "Revisa la arquitectura, flujos y endpoints públicos sin exponer secretos. Ideal para handoff y soporte.",
      sections: [
        {
          title: "Arquitectura",
          items: [
            "Frontend Next.js con MUI monocromático y soporte bilingüe.",
            "AgentBE orquesta WhatsApp, verificación y creación de órdenes.",
            "PayBE gestiona on/off ramp y envía webhooks a AgentBE.",
          ],
        },
        {
          title: "Flujos",
          items: [
            "Onboarding: verificación por WhatsApp, creación DRAFT, activación con PTB en Sui Move.",
            "Pagos: link /pagos/{id} con QR bancario o puente EVM→Sui vía CCTP + relayer.",
            "Liquidez: Uniswap v4 hooks + Circle CCTP para acuñar USDC directo en Sui/Arc.",
          ],
        },
        {
          title: "Integraciones",
          items: [
            "zkLogin + PTBs para firmas sin seed ni gas.",
            "CCTP + Uniswap v4 para mover USDC desde Base/OP/Arbitrum hacia Sui/Arc.",
            "Walrus/DeepBook para comprobantes y conversión nativa de SUI.",
          ],
        },
      ],
    },
    onboarding: {
      title: "Onboarding y verificación",
      subtitle:
        "Solicita código, crea el grupo y opcionalmente despliega la tanda sin salir del navegador.",
      requestCode: "Enviar código",
      createDraft: "Crear grupo DRAFT",
      activateGroup: "Activar tanda",
      phone: "WhatsApp (código país)",
      code: "Código de verificación",
      username: "Usuario",
      groupName: "Nombre del grupo",
      amountBs: "Monto en Bs",
      usdc: "Monto en USDC (opcional)",
      freq: "Frecuencia (días)",
      yieldLabel: "Repartir rendimiento con miembros",
      statusDraft: "Grupo creado, revisa tu WhatsApp para validar.",
      statusActivated: "Contrato desplegado y orden inicial lista.",
      verifyHint: "El bot valida el código cuando respondes en WhatsApp.",
    },
    payment: {
      title: "Pago de cuota",
      subtitle: "Selecciona tu método de pago preferido",
      connect: "Conectar wallet",
      payWithWallet: "Pagar con wallet",
      confirmFiat: "Confirmar pago QR",
      claimSent: "Confirmación enviada. Verificaremos tu pago.",
      missingAgent: "Configura NEXT_PUBLIC_AGENT_BE_URL para continuar.",
      walletReady: "Wallet conectada",
      selectMethod: "Método de pago",
      qrSimple: "QR Bancario",
      chainWallet: "Wallet Sui / EVM",
      orderDetails: "Detalles de la orden",
      amount: "Monto",
      status: "Estado",
      group: "Grupo",
      round: "Ronda",
      dueDate: "Fecha límite",
      bank: "Banco",
      reference: "Referencia",
      proofUrl: "URL del comprobante",
      trustlineRequired: "Ruta de liquidez requerida",
      trustlineDesc: "Prepara la ruta USDC (CCTP/Arc) antes de firmar la cuota.",
      addTrustline: "Preparar ruta",
      trustlineAdded: "Ruta de pago lista",
      connectWalletFirst: "Conecta tu wallet primero",
      paymentPending: "Pago pendiente",
      paymentCompleted: "Pago completado",
      paymentFailed: "Pago fallido",
      walletConnected: "Wallet conectada",
      walletDisconnected: "Wallet desconectada",
      disconnect: "Desconectar",
      errorConnecting: "Error al conectar wallet",
      errorProcessing: "Error procesando pago",
    },
    tos: {
      title: "Términos de Servicio",
      lastUpdated: "Última actualización",
      intro: "Estos términos de servicio regulan el uso de la plataforma PasaTanda. Por favor, léelos cuidadosamente antes de utilizar nuestros servicios.",
      sections: {
        acceptance: {
          title: "1. Aceptación de los Términos",
          content: "Al utilizar PasaTanda, aceptas cumplir con estos términos de servicio y todas las leyes aplicables. Si no estás de acuerdo con alguno de estos términos, no debes usar la plataforma.",
        },
        description: {
          title: "2. Descripción del Servicio",
          content: "PasaTanda es una plataforma que facilita la gestión de tandas (ROSCA/Pasanaku) utilizando la blockchain de Sui. Proporcionamos herramientas para organizar grupos, gestionar pagos y automatizar la distribución de fondos.",
        },
        responsibilities: {
          title: "3. Responsabilidades del Usuario",
          items: [
            "Mantener la seguridad de sus \"salts\" y cuentas de inicio de sesion.",
            "Proporcionar información veraz durante el registro",
            "Cumplir con los pagos acordados dentro del grupo",
            "No utilizar la plataforma para actividades ilegales",
          ],
        },
        participation: {
          title: "4. Participación en Tandas",
          content: "Al unirte a una tanda, te comprometes a realizar los pagos según el calendario establecido. El incumplimiento puede resultar en la pérdida de tu turno y restricciones en la plataforma.",
        },
        liability: {
          title: "5. Limitación de Responsabilidad",
          content: "PasaTanda actúa únicamente como facilitador tecnológico. No somos responsables de disputas entre participantes, pérdidas por errores de usuario o fluctuaciones en el valor de activos digitales.",
        },
        modifications: {
          title: "6. Modificaciones",
          content: "Nos reservamos el derecho de modificar estos términos en cualquier momento. Los cambios entrarán en vigor al ser publicados en la plataforma. El uso continuado del servicio después de las modificaciones constituye la aceptación de los nuevos términos.",
        },
      },
      contact: "Para consultas sobre estos términos, contacta a:",
    },
    privacy: {
      title: "Políticas de Privacidad",
      lastUpdated: "Última actualización",
      intro: "En PasaTanda, valoramos tu privacidad y nos comprometemos a proteger tus datos. Esta política describe cómo recopilamos, usamos y protegemos tu información.",
      sections: {
        collection: {
          title: "1. Información que Recopilamos",
          content: "PasaTanda minimiza la recopilación de datos personales. No almacenamos información personal sensible. Las direcciones de wallet y transacciones son registradas en la blockchain de Sui de forma pública y transparente.",
        },
        usage: {
          title: "2. Uso de la Información",
          content: "La información de las transacciones es pública en la blockchain de Sui y se utiliza únicamente para verificar pagos, gestionar turnos de la tanda y mantener el registro del contrato inteligente.",
        },
        security: {
          title: "3. Seguridad",
          content: "Nos comprometemos a proteger la seguridad de tu información mediante el uso de tecnología blockchain y contratos inteligentes auditables. Las llaves privadas nunca son almacenadas en nuestros servidores.",
        },
        rights: {
          title: "4. Tus Derechos",
          content: "Tienes derecho a acceder, rectificar y eliminar tus datos personales (cuando no estén en blockchain). Para ejercer estos derechos, contacta a nuestro equipo de soporte.",
        },
      },
      contact: "Si tienes preguntas sobre esta política de privacidad o sobre cómo manejamos tus datos, puedes contactarnos a través de nuestro canal de WhatsApp o por correo electrónico.",
    },
    common: {
      loading: "Cargando...",
      error: "Error",
      success: "Éxito",
      cancel: "Cancelar",
      confirm: "Confirmar",
      back: "Volver",
      next: "Siguiente",
      save: "Guardar",
      delete: "Eliminar",
      edit: "Editar",
      close: "Cerrar",
      retry: "Reintentar",
      copied: "¡Copiado!",
      copyToClipboard: "Copiar al portapapeles",
        open: "Abrir",
    },
    footer: {
      tagline: "Ahorro colaborativo sobre Sui",
      links: "Enlaces",
      legal: "Legal",
      contact: "Contacto",
      copyright: "Todos los derechos reservados.",
    },
  },
  en: {
    nav: {
      home: "Home",
      pay: "Payments",
      login: "Login",
      onboarding: "Onboarding",
      docs: "Docs",
      tos: "Terms",
      privacy: "Privacy",
    },
    login: {
      title: "Sign in with zkLogin",
      subtitle:
        "Use Google or Facebook via Sui zkLogin. We create an ephemeral key and nonce for the proof.",
      google: "Continue with Google",
      facebook: "Continue with Facebook",
      apple: "Apple (coming soon)",
      appleSoon: "Apple ID support is coming soon.",
      sessionReady: "zkLogin session ready",
      sessionMissing: "Sign in with zkLogin before creating your tanda.",
      addressLabel: "Derived Sui address",
      continue: "Continue to creation",
      retry: "Retry login",
      callbackProcessing: "Processing OAuth callback...",
      callbackSuccess: "Authentication completed! zkLogin session saved.",
      callbackError: "We could not finish login. Please try again.",
      clearSession: "Clear session",
      sessionCleared: "Session cleared. Please sign in again.",
    },
    auth: {
      saveSalt: {
        title: "Save Your Salt",
        subtitle: "This value is necessary to recover your account in the future. Don't lose it!",
        saltLabel: "Your User Salt",
        warning: "Important!",
        warningDetails: "Save this salt in a secure place. You'll need it to access your account from other devices.",
        continue: "Continue",
      },
      confirmAccount: {
        title: "Confirm Your Account",
        subtitle: "This is the Sui address generated for you. Verify it's correct before continuing.",
        addressLabel: "Sui Address",
        fullAddressBelow: "Full address below",
        info: "This address is derived from your salt and will be your identity on the blockchain.",
        createButton: "Create Account",
        errorDerivingAddress: "Error deriving address",
        errorCreating: "Error creating account",
      },
      verifyPhone: {
        title: "Verify Your Phone",
        titleVerified: "Phone Verified!",
        subtitle: "Generate a verification code and send it via WhatsApp to the bot.",
        phoneLabel: "WhatsApp number",
        phonePlaceholder: "+591 70000000",
        subtitleVerified: "Your phone number has been successfully verified.",
        generateButton: "Generate Code",
        phoneRequired: "Enter your WhatsApp number before generating a code.",
        codeLabel: "Verification Code",
        sendInstructions: "Copy this code and send it to the PasaTanda WhatsApp bot.",
        checkButton: "Check Status",
        checking: "Checking...",
        notYetVerified: "Not yet verified. Send the code via WhatsApp.",
        verifiedSuccess: "Verification successful! Redirecting to dashboard...",
        errorGenerating: "Error generating code",
        errorChecking: "Error checking status",
      },
    },
    dashboard: {
      welcome: "Welcome",
      verified: "Verified",
      pending: "Pending",
      empty: "You have no tandas",
      emptySubtitle: "Get started by creating a new tanda or joining an existing one.",
      createTanda: "Create Tanda",
      joinTanda: "Join Tanda",
      myTandas: "My Tandas",
      members: "Members",
      currentRound: "Current round",
      errorLoading: "Error loading tandas",
      detailTitle: "Tanda dashboard",
      detailSubtitle: "Review the status and participants of this tanda.",
      status: "Status",
      contribution: "Contribution",
      guarantee: "Guarantee",
      frequency: "Frequency",
      rounds: "Rounds",
      participants: "Participants",
      startGroup: "Start tanda",
      startReady: "Ready to start: enough participants and configuration set.",
      startDisabled: "You need at least 2 participants and complete setup before starting.",
      anonymous: "Participant",
    },
    groups: {
      create: {
        title: "Create tanda",
        subtitle: "Set the basic details for your group.",
        nameLabel: "Group name",
        currencyLabel: "Currency",
        currencyBs: "Bolivianos (Bs)",
        currencyUsdc: "USDC",
        contributionLabel: "Contribution per round",
        guaranteeLabel: "Guarantee amount",
        guaranteeHelper: "Guarantees are optional; use 0 if not required yet.",
        totalRoundsLabel: "Number of rounds",
        frequencyLabel: "Payment frequency",
        customDaysLabel: "Custom days",
        yieldLabel: "Enable yield (optional)",
        frequencyWeekly: "Weekly (7 days)",
        frequencyBiweekly: "Biweekly (14 days)",
        frequencyMonthly: "Monthly (30 days)",
        frequencyCustom: "Custom",
        submit: "Create group",
        creating: "Creating...",
        nameRequired: "Enter the group name.",
        contributionRequired: "Enter a valid round amount (>= 1).",
        guaranteeInvalid: "Guarantee must be a number >= 0.",
        roundsRequired: "Specify how many rounds the tanda will run.",
        frequencyRequired: "Select a frequency.",
        created: "Group created. Generate the invitation to share it.",
        missingGroupId: "Could not retrieve the group identifier.",
      },
      invite: {
        title: "Invite to your group",
        subtitle: "Generate the link and share it with participants.",
        generate: "Generate invitation",
        codeLabel: "Invitation code",
        linkLabel: "Invitation link",
        copyCode: "Copy code",
        copyLink: "Copy link",
        copied: "Copied",
        shareHint: "Send this link to people you want to add to the group.",
        missingGroupId: "Group identifier is missing.",
        errorLoading: "Could not generate the invitation.",
      },
      join: {
        title: "Join a tanda",
        subtitle: "Confirm you want to join the group.",
        description: "Enter the invitation code to view details and join.",
        inviteCodeLabel: "Invitation code",
        codeHelper: "Shared by the organizer.",
        lookupButton: "View details",
        turnLabel: "Turn number (optional)",
        turnHelper: "Turns are assigned by arrival order for now.",
        detailsTitle: "Tanda details",
        statusLabel: "Status",
        contributionLabel: "Contribution per round",
        guaranteeLabel: "Guarantee",
        frequencyLabel: "Frequency",
        roundsLabel: "Rounds",
        joinButton: "Join group",
        joining: "Joining...",
        success: "You joined the group successfully.",
        successTurn: "Your assigned turn is",
        missingGroupId: "Group identifier is missing.",
        codeRequired: "Enter the invitation code.",
        errorJoining: "Could not join the group.",
      },
      start: {
        title: "Start tanda",
        subtitle: "Activate the group when everyone is ready.",
        startButton: "Start",
        starting: "Starting...",
        success: "The tanda started successfully.",
        statusLabel: "Status",
        groupIdLabel: "Group ID",
        missingGroupId: "Group identifier is missing.",
        errorStarting: "Could not start the tanda.",
      },
    },
    hero: {
      title: "PasaTanda, rotating savings on Sui",
      subtitle:
        "Run trusted ROSCAs with local on/off ramps, Move contracts, and WhatsApp automation.",
      primaryCta: "Start a tanda",
      secondaryCta: "Open payments",
      metrics: [
        { label: "24/7 settlement", value: "Sui + EVM" },
        { label: "On/Off ramp", value: "Bank QR" },
        { label: "Custody", value: "Move" },
      ],
    },
    valueProps: {
      sui: {
        title: "Security on Sui",
        body:
          "ZKLogin signatures validate payments without exposing keys. Move contracts track rounds and funds.",
      },
      onramp: {
        title: "Local on/off ramp",
        body:
          "Pay with bank QR or USDC. The backend verifies proofs and issues dynamic order links.",
      },
      automation: {
        title: "WhatsApp automation",
        body:
          "The bot onboards members, reminds payments, and lets the admin activate the tanda from chat.",
      },
    },
    howItWorks: {
      title: "How it works",
      steps: [
        "Sign up with ZKLogin and create a savings group.",
        "Invite your friends to register.",
        "Start the tanda and let the bot manage it automatically.",
      ],
    },
    faq: {
      title: "FAQ",
      items: [
        {
          q: "Do I need crypto to start?",
          a: "No, you can begin with QR Simple payments using your bank account.",
        },
        {
          q: "Where are funds held?",
          a: "Custody lives in Sui Packages on Blockchain.",
        },
        {
          q: "Which wallets are supported?",
          a: "Any compatible with Sui or EVM.",
        },
        {
          q: "How do you convert to USDC?",
          a: "The backend computes the USDC amount on each order; no fixed FX is set in the UI.",
        },
      ],
    },
    docs: {
      title: "Project documentation",
      intro:
        "Review architecture, flows, and public endpoints without exposing secrets. Perfect for handoff and support.",
      sections: [
        {
          title: "Architecture",
          items: [
            "Next.js frontend with monochrome MUI and bilingual copy.",
            "AgentBE orchestrates WhatsApp, verification, and order creation.",
            "PayBE handles on/off ramp and sends webhooks back to AgentBE.",
          ],
        },
        {
          title: "Flows",
          items: [
            "Onboarding: WhatsApp verification, DRAFT group creation, activation with a PTB on Sui.",
            "Payments: /pagos/{id} link with bank QR or EVM→Sui bridge via CCTP + relayer.",
            "Liquidity: Uniswap v4 hooks + Circle CCTP to mint USDC directly on Sui/Arc.",
          ],
        },
        {
          title: "Integrations",
          items: [
            "zkLogin + PTBs for seedless, gasless signatures.",
            "CCTP + Uniswap v4 to move USDC from Base/OP/Arbitrum into Sui/Arc.",
            "Walrus/DeepBook for proofs of life and native SUI conversion.",
          ],
        },
      ],
    },
    onboarding: {
      title: "Onboarding and verification",
      subtitle:
        "Request a code, create the group, and optionally deploy the tanda without leaving the browser.",
      requestCode: "Send code",
      createDraft: "Create DRAFT group",
      activateGroup: "Activate tanda",
      phone: "WhatsApp (country code)",
      code: "Verification code",
      username: "Username",
      groupName: "Group name",
      amountBs: "Amount in Bs",
      usdc: "Amount in USDC (optional)",
      freq: "Frequency (days)",
      yieldLabel: "Share yield with members",
      statusDraft: "Group created, check WhatsApp to validate.",
      statusActivated: "Contract deployed and first order ready.",
      verifyHint: "The bot validates the code when you reply on WhatsApp.",
    },
    payment: {
      title: "Payment",
      subtitle: "Select your preferred payment method",
      connect: "Connect wallet",
      payWithWallet: "Pay with wallet",
      confirmFiat: "Confirm QR payment",
      claimSent: "Confirmation sent. We will verify your payment.",
      missingAgent: "Set NEXT_PUBLIC_AGENT_BE_URL to continue.",
      walletReady: "Wallet connected",
      selectMethod: "Payment method",
      qrSimple: "Bank QR",
      chainWallet: "Sui / EVM Wallet",
      orderDetails: "Order details",
      amount: "Amount",
      status: "Status",
      group: "Group",
      round: "Round",
      dueDate: "Due date",
      bank: "Bank",
      reference: "Reference",
      proofUrl: "Proof URL",
      trustlineRequired: "Liquidity route required",
      trustlineDesc: "Prepare the USDC route (CCTP/Arc) before signing the installment.",
      addTrustline: "Prepare route",
      trustlineAdded: "Payment route ready",
      connectWalletFirst: "Connect your wallet first",
      paymentPending: "Payment pending",
      paymentCompleted: "Payment completed",
      paymentFailed: "Payment failed",
      walletConnected: "Wallet connected",
      walletDisconnected: "Wallet disconnected",
      disconnect: "Disconnect",
      errorConnecting: "Error connecting wallet",
      errorProcessing: "Error processing payment",
    },    
    tos: {
      title: "Terms of Service",
      lastUpdated: "Last updated",
      intro: "These terms of service govern the use of the PasaTanda platform. Please read them carefully before using our services.",
      sections: {
        acceptance: {
          title: "1. Acceptance of Terms",
          content: "By using PasaTanda, you agree to comply with these terms of service and all applicable laws. If you do not agree with any of these terms, you should not use the platform.",
        },
        description: {
          title: "2. Service Description",
          content: "PasaTanda is a platform that facilitates the management of tandas (ROSCA/Pasanaku) using the Sui blockchain. We provide tools to organize groups, manage payments, and automate fund distribution.",
        },
        responsibilities: {
          title: "3. User Responsibilities",
          items: [
            "Maintain the security of your \"salts\" and login accounts",
            "Provide truthful information during registration",
            "Comply with agreed payments within the group",
            "Not use the platform for illegal activities",
          ],
        },
        participation: {
          title: "4. Tanda Participation",
          content: "By joining a tanda, you commit to making payments according to the established schedule. Non-compliance may result in loss of your turn and platform restrictions.",
        },
        liability: {
          title: "5. Limitation of Liability",
          content: "PasaTanda acts solely as a technology facilitator. We are not responsible for disputes between participants, losses due to user errors, or fluctuations in the value of digital assets.",
        },
        modifications: {
          title: "6. Modifications",
          content: "We reserve the right to modify these terms at any time. Changes will take effect upon publication on the platform. Continued use of the service after modifications constitutes acceptance of the new terms.",
        },
      },
      contact: "For inquiries about these terms, contact:",
    },
    privacy: {
      title: "Privacy Policy",
      lastUpdated: "Last updated",
      intro: "At PasaTanda, we value your privacy and are committed to protecting your data. This policy describes how we collect, use, and protect your information.",
      sections: {
        collection: {
          title: "1. Information We Collect",
          content: "PasaTanda minimizes the collection of personal data. We do not store sensitive personal information. Wallet addresses and transactions are recorded on the Sui blockchain publicly and transparently.",
        },
        usage: {
          title: "2. Use of Information",
          content: "Transaction information is public on the Sui blockchain and is used solely to verify payments, manage tanda turns, and maintain the smart contract registry.",
        },
        security: {
          title: "3. Security",
          content: "We are committed to protecting the security of your information through the use of blockchain technology and auditable smart contracts. Private keys are never stored on our servers.",
        },
        rights: {
          title: "4. Your Rights",
          content: "You have the right to access, rectify, and delete your personal data (when not on blockchain). To exercise these rights, contact our support team.",
        },
      },
      contact: "If you have questions about this privacy policy or how we handle your data, you can contact us through our WhatsApp channel or by email.",
    },
    common: {
      loading: "Loading...",
      error: "Error",
      success: "Success",
      cancel: "Cancel",
      confirm: "Confirm",
      back: "Back",
      next: "Next",
      save: "Save",
      delete: "Delete",
      edit: "Edit",
      close: "Close",
      retry: "Retry",
      copied: "Copied!",
      copyToClipboard: "Copy to clipboard",
        open: "Open",
    },
    footer: {
      tagline: "Collaborative savings on Sui",
      links: "Links",
      legal: "Legal",
      contact: "Contact",
      copyright: "All rights reserved.",
    },
  },
};

type Messages = (typeof translations)[Locale];

type I18nContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: Messages;
};

const I18nContext = createContext<I18nContextValue | undefined>(undefined);

// Create a simple store for locale
let localeListeners: Array<() => void> = [];
let currentLocale: Locale = "es";

const localeStore = {
  getSnapshot: () => currentLocale,
  getServerSnapshot: () => "es" as Locale,
  subscribe: (listener: () => void) => {
    localeListeners.push(listener);
    return () => {
      localeListeners = localeListeners.filter(l => l !== listener);
    };
  },
  setLocale: (newLocale: Locale) => {
    currentLocale = newLocale;
    if (typeof window !== "undefined") {
      window.localStorage.setItem("pt-lang", newLocale);
      document.documentElement.lang = newLocale;
    }
    localeListeners.forEach(listener => listener());
  },
  initialize: () => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem("pt-lang");
    if (stored === "en" || stored === "es") {
      currentLocale = stored;
    } else {
      const lang = navigator.language?.toLowerCase() || "es";
      currentLocale = lang.startsWith("en") ? "en" : "es";
    }
    document.documentElement.lang = currentLocale;
  }
};

// Initialize on module load (client-side only)
if (typeof window !== "undefined") {
  localeStore.initialize();
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const locale = useSyncExternalStore(
    localeStore.subscribe,
    localeStore.getSnapshot,
    localeStore.getServerSnapshot
  );

  const setLocale = useCallback((newLocale: Locale) => {
    localeStore.setLocale(newLocale);
  }, []);

  const value = useMemo<I18nContextValue>(() => ({
    locale,
    setLocale,
    t: translations[locale],
  }), [locale, setLocale]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n debe usarse dentro de I18nProvider");
  return ctx;
}
