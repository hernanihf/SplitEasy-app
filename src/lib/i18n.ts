import { getLocales } from 'expo-localization';
import { I18n } from 'i18n-js';

const translations = {
  en: {
    nav: { groups: 'Groups', activity: 'Activity', profile: 'Profile' },
    install: {
      title: 'Install SplitEasy',
      subtitle: 'Quick access from your home screen',
      iosSubtitle: 'Tap the Share icon, then “Add to Home Screen”',
      action: 'Install',
      dismiss: 'Dismiss',
    },
    login: {
      tagline1: 'Split bills,',
      tagline2: 'not friendships.',
      subtitle:
        'Add an expense, split it with your group, and keep everyone square. Done.',
      connecting: 'Connecting…',
      continueWithGoogle: 'Continue with Google',
      terms: 'By continuing you agree to the Terms and Privacy Policy.',
    },
    home: {
      greeting: 'Hi, %{name} 👋',
      title: 'Your groups',
      overall: 'Overall balance',
      youreOwed: "You're owed",
      youOwe: 'You owe',
      groups: 'Groups',
      newGroup: '+ New group',
      empty: 'No groups yet.',
      emptyHint: 'Create one to start sharing expenses.',
      loadError: 'Could not load your data.',
      wordOwe: 'you owe',
      wordOwed: "you're owed",
      wordSettled: 'settled up',
    },
    activity: {
      title: 'Activity',
      subtitle: 'All your recent activity',
      empty: 'No activity yet.',
      paidBy: 'Paid by %{name} · %{group}',
      settledIn: 'in %{group}',
    },
    profile: {
      title: 'Profile',
      logout: 'Log out',
      anonymous: 'You',
      language: 'Language',
      appearance: 'Appearance',
    },
    theme: { system: 'System', light: 'Light', dark: 'Dark' },
    groupDetail: {
      userN: 'User #%{id}',
      loadError: 'Could not load the group.',
      loading: 'Loading…',
      notFound: 'Group not found.',
      settleUp: 'Settle up',
      yourBalance: 'Your balance in this group',
      expenses: 'Expenses',
      balances: 'Balances',
      addExpense: 'Add expense',
      allSettled: 'All settled up',
      allSettledHint: 'No one owes anyone in this group.',
      owes: '%{from} owes %{to}',
      settle: 'Settle',
      invite: 'Invite friends',
      copyLink: 'Copy invite link',
      shareError: "Couldn't get the invite link.",
      copyError: "Couldn't copy the link.",
      memberCount: { one: '%{count} member', other: '%{count} members' },
      wordOwe: 'you owe',
      wordOwed: "you're owed",
      wordSettled: "you're all settled",
      paidBy: 'Paid by %{name}',
      yourShare: 'your share %{amount}',
    },
    join: {
      joining: 'Joining the group…',
      error: 'This invite link is invalid or has expired.',
    },
    addExpense: {
      title: 'New expense',
      amountIn: 'Amount in %{group}',
      scan: '📷 Scan',
      upload: '📎 Upload file',
      scanning: 'Scanning receipt…',
      scanningHint: 'Reading amount and merchant',
      receiptAdded: 'Receipt added',
      descriptionPlaceholder: 'What was it for? e.g. Groceries',
      whoPaid: 'Who paid?',
      howSplit: 'How to split?',
      methodEqual: 'Equally',
      methodFixed: 'Amounts',
      methodPercentage: 'Percent',
      add: 'Add expense',
      saving: 'Saving…',
      splitTotal: 'Total split',
      remaining: 'Remaining',
      descriptionRequired: 'Add a description for the expense.',
      amountPositive: 'The amount must be greater than 0.',
      pickMember: 'Pick at least one member to split the expense.',
      percentagesMustTotal: 'Percentages must add up to 100.',
      amountsMustTotal: 'Amounts must add up to %{amount}.',
      addError: 'Could not add the expense. Check the details.',
      loading: 'Loading…',
    },
    scanReceipt: {
      defaultMerchant: 'Receipt',
      readError: "We couldn't read the receipt. Try another photo or add the expense manually.",
      cameraPermission: 'We need camera permission to scan the receipt.',
      photosPermission: 'We need permission to access your photos.',
      title: 'Scan receipt',
      description: 'Upload an image or PDF and AI will fill in the expense.',
      reading: 'Reading the receipt…',
      chooseFromGallery: '🖼️ Choose from gallery',
      choosePdf: '📄 Upload PDF',
    },
    auth: { signingIn: 'Signing in…' },
    newGroup: {
      title: 'New group',
      emoji: 'Icon',
      groupName: 'Group name',
      namePlaceholder: 'e.g. Trip to the coast',
      membersHint: 'Add members later with an invite link.',
      nameRequired: 'Give the group a name.',
      createError: 'Could not create the group. Please try again.',
      create: 'Create group',
      creating: 'Creating…',
    },
    settle: {
      title: 'Record payment',
      subtitle: 'Confirm the payment was made to settle the debt.',
      pays: '%{from} pays %{to}',
      howMuch: 'How much is being paid?',
      amountPlaceholder: 'Amount',
      confirm: 'Confirm payment',
      cancel: 'Cancel',
      amountPositive: 'The amount must be greater than 0.',
      amountTooHigh: "You can't settle more than %{max}.",
      recordError: 'Could not record the payment. Please try again.',
    },
  },
  es: {
    nav: { groups: 'Grupos', activity: 'Actividad', profile: 'Perfil' },
    install: {
      title: 'Instalar SplitEasy',
      subtitle: 'Acceso rápido desde tu pantalla de inicio',
      iosSubtitle: 'Tocá Compartir y luego “Agregar a inicio”',
      action: 'Instalar',
      dismiss: 'Descartar',
    },
    login: {
      tagline1: 'Dividí gastos,',
      tagline2: 'no amistades.',
      subtitle:
        'Agregá un gasto, dividilo con tu grupo y mantené las cuentas claras. Listo.',
      connecting: 'Conectando…',
      continueWithGoogle: 'Continuar con Google',
      terms: 'Al continuar aceptás los Términos y la Política de Privacidad.',
    },
    home: {
      greeting: 'Hola, %{name} 👋',
      title: 'Tus grupos',
      overall: 'Balance total',
      youreOwed: 'Te deben',
      youOwe: 'Debés',
      groups: 'Grupos',
      newGroup: '+ Nuevo grupo',
      empty: 'Todavía no tenés grupos.',
      emptyHint: 'Creá uno para empezar a compartir gastos.',
      loadError: 'No se pudieron cargar tus datos.',
      wordOwe: 'debés',
      wordOwed: 'te deben',
      wordSettled: 'saldado',
    },
    activity: {
      title: 'Actividad',
      subtitle: 'Toda tu actividad reciente',
      empty: 'Todavía no hay actividad.',
      paidBy: 'Pagó %{name} · %{group}',
      settledIn: 'en %{group}',
    },
    profile: {
      title: 'Perfil',
      logout: 'Cerrar sesión',
      anonymous: 'Vos',
      language: 'Idioma',
      appearance: 'Apariencia',
    },
    theme: { system: 'Sistema', light: 'Claro', dark: 'Oscuro' },
    groupDetail: {
      userN: 'Usuario #%{id}',
      loadError: 'No se pudo cargar el grupo.',
      loading: 'Cargando…',
      notFound: 'Grupo no encontrado.',
      settleUp: 'Saldar',
      yourBalance: 'Tu balance en este grupo',
      expenses: 'Gastos',
      balances: 'Balances',
      addExpense: 'Agregar gasto',
      allSettled: 'Todo saldado',
      allSettledHint: 'Nadie le debe a nadie en este grupo.',
      owes: '%{from} le debe a %{to}',
      settle: 'Saldar',
      invite: 'Invitar amigos',
      copyLink: 'Copiar link de invitación',
      shareError: 'No se pudo obtener el link de invitación.',
      copyError: 'No se pudo copiar el link.',
      memberCount: { one: '%{count} miembro', other: '%{count} miembros' },
      wordOwe: 'debés',
      wordOwed: 'te deben',
      wordSettled: 'estás al día',
      paidBy: 'Pagó %{name}',
      yourShare: 'te toca %{amount}',
    },
    join: {
      joining: 'Uniéndote al grupo…',
      error: 'Este link de invitación no es válido o expiró.',
    },
    addExpense: {
      title: 'Nuevo gasto',
      amountIn: 'Monto en %{group}',
      scan: '📷 Escanear',
      upload: '📎 Subir archivo',
      scanning: 'Escaneando ticket…',
      scanningHint: 'Leyendo monto y comercio',
      receiptAdded: 'Ticket agregado',
      descriptionPlaceholder: '¿En qué fue? ej. Súper',
      whoPaid: '¿Quién pagó?',
      howSplit: '¿Cómo se divide?',
      methodEqual: 'Igual',
      methodFixed: 'Montos',
      methodPercentage: 'Porcentaje',
      add: 'Agregar gasto',
      saving: 'Guardando…',
      splitTotal: 'Total dividido',
      remaining: 'Resta',
      descriptionRequired: 'Ponele una descripción al gasto.',
      amountPositive: 'El monto tiene que ser mayor a 0.',
      pickMember: 'Elegí al menos un miembro para dividir el gasto.',
      percentagesMustTotal: 'Los porcentajes tienen que sumar 100.',
      amountsMustTotal: 'Los montos tienen que sumar %{amount}.',
      addError: 'No se pudo agregar el gasto. Revisá los datos.',
      loading: 'Cargando…',
    },
    scanReceipt: {
      defaultMerchant: 'Ticket',
      readError: 'No pudimos leer el ticket. Probá con otra foto o cargá el gasto manualmente.',
      cameraPermission: 'Necesitamos permiso de cámara para escanear el ticket.',
      photosPermission: 'Necesitamos permiso para acceder a tus fotos.',
      title: 'Escanear ticket',
      description: 'Subí una imagen o PDF y la IA completa el gasto.',
      reading: 'Leyendo el ticket…',
      chooseFromGallery: '🖼️ Elegir de la galería',
      choosePdf: '📄 Subir PDF',
    },
    auth: { signingIn: 'Iniciando sesión…' },
    newGroup: {
      title: 'Nuevo grupo',
      emoji: 'Ícono',
      groupName: 'Nombre del grupo',
      namePlaceholder: 'ej. Viaje a la costa',
      membersHint: 'Sumá miembros después con un link de invitación.',
      nameRequired: 'Ponele un nombre al grupo.',
      createError: 'No se pudo crear el grupo. Probá de nuevo.',
      create: 'Crear grupo',
      creating: 'Creando…',
    },
    settle: {
      title: 'Registrar pago',
      subtitle: 'Confirmá que el pago se hizo para saldar la deuda.',
      pays: '%{from} le paga a %{to}',
      howMuch: '¿Cuánto se paga?',
      amountPlaceholder: 'Monto',
      confirm: 'Confirmar pago',
      cancel: 'Cancelar',
      amountPositive: 'El monto tiene que ser mayor a 0.',
      amountTooHigh: 'No podés saldar más de %{max}.',
      recordError: 'No se pudo registrar el pago. Probá de nuevo.',
    },
  },
};

const i18n = new I18n(translations);

export type Language = 'es' | 'en';

// The device/browser language, used as the default before the user overrides it.
export const deviceLanguage: Language =
  (getLocales()[0]?.languageCode ?? 'en') === 'es' ? 'es' : 'en';

i18n.locale = deviceLanguage;
i18n.enableFallback = true;
i18n.defaultLocale = 'en';

export function setLocale(lang: Language) {
  i18n.locale = lang;
}

export function t(key: string, options?: Record<string, unknown>): string {
  return i18n.t(key, options);
}

/** Formats a monetary amount with locale-aware grouping/decimals, prefixed with "$". */
export function formatAmount(amount: number): string {
  const numberLocale = i18n.locale === 'es' ? 'es-AR' : 'en-US';
  return `$${new Intl.NumberFormat(numberLocale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)}`;
}

/** Formats an amount with an explicit sign (used for balances). */
export function formatSigned(amount: number): string {
  const sign = amount > 0 ? '+' : amount < 0 ? '−' : '';
  return `${sign}${formatAmount(Math.abs(amount))}`;
}

export { i18n };
