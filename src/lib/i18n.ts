import { getLocales } from 'expo-localization';
import { I18n } from 'i18n-js';

import { DEFAULT_CURRENCY } from '@/constants/currencies';

const translations = {
  en: {
    common: { cancel: 'Cancel', delete: 'Delete', edit: 'Edit' },
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
      deleteGroupTitle: 'Delete this group?',
      deleteGroupMessage:
        "This can't be undone — it deletes every expense, payment, comment, and receipt image in the group, for everyone.",
      deleteGroupError: 'Could not delete the group. Please try again.',
      deleteGroupNotAllowed: 'Only the group creator can delete it.',
    },
    activity: {
      title: 'Activity',
      subtitle: 'All your recent activity',
      empty: 'No activity yet.',
      paidBy: 'Paid by %{name} · %{group}',
      settledIn: 'in %{group}',
      openError: 'Could not open that.',
    },
    profile: {
      title: 'Profile',
      logout: 'Log out',
      anonymous: 'You',
      language: 'Language',
      appearance: 'Appearance',
      notifications: 'Notifications',
      notificationsUnsupported: 'Notifications need the app added to your home screen (iOS 16.4+).',
      notificationsError: 'Could not enable notifications — check your browser permission.',
    },
    theme: { system: 'System', light: 'Light', dark: 'Dark' },
    groupDetail: {
      userN: 'User #%{id}',
      loadError: 'Could not load the group.',
      notFound: 'Group not found.',
      settleUp: 'Settle up',
      yourBalance: 'Your balance in this group',
      history: 'History',
      balances: 'Balances',
      spending: 'Spending',
      totalSpent: 'Total spent',
      spendingEmpty: 'Add some expenses to see where the group spends.',
      addExpense: 'Add expense',
      allSettled: 'All settled up',
      allSettledHint: 'No one owes anyone in this group.',
      historyEmpty: 'No activity yet.',
      paymentTitle: 'Payment',
      paidFromTo: '%{from} paid %{to}',
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
      youLent: 'You lent %{amount}',
      youOwe: 'You owe %{amount}',
      deleteSettlementTitle: 'Delete this payment?',
      deleteSettlementMessage: "This can't be undone from the app.",
      deleteSettlementError: 'Could not delete the payment. Please try again.',
    },
    join: {
      joining: 'Joining the group…',
      error: 'This invite link is invalid or has expired.',
    },
    addExpense: {
      title: 'New expense',
      editTitle: 'Edit expense',
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
      percentagesMustTotal: 'Percentages must add up to 100.',
      add: 'Add expense',
      save: 'Save changes',
      saving: 'Saving…',
      splitTotal: 'Total split',
      remaining: 'Remaining',
      descriptionRequired: 'Add a description for the expense.',
      amountPositive: 'The amount must be greater than 0.',
      pickMember: 'Pick at least one member to split the expense.',
      amountsMustTotal: 'Amounts must add up to %{amount}.',
      addError: 'Could not add the expense. Check the details.',
      updateError: 'Could not update the expense. Check the details.',
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
    itemize: {
      title: 'Split by items',
      total: 'Total',
      assignItems: 'Who had what?',
      taxTip: 'Tax / tip',
      proportional: 'Proportional',
      equal: 'Equally',
      perPerson: 'Per person',
      confirm: 'Add expense',
      assignAll: 'Every item needs at least one person.',
      itemsInvalid: 'Every item needs a description and an amount greater than 0.',
    },
    expenseDetail: {
      title: 'Expense detail',
      split: 'How it was split',
      items: 'Items',
      viewReceipt: 'View receipt',
      deleteTitle: 'Delete this expense?',
      deleteMessage: "This can't be undone from the app.",
      deleteError: 'Could not delete the expense. Please try again.',
      notAllowed: 'Only the payer or a split participant can edit or delete this expense.',
    },
    settlementDetail: {
      title: 'Payment detail',
      notAllowed: 'Only a party to this payment can delete it.',
    },
    comments: {
      title: 'Comments',
      placeholder: 'Add a comment…',
      send: 'Send',
      empty: 'No comments yet.',
      loadError: 'Could not load comments.',
      postError: 'Could not post your comment. Please try again.',
      deleteTitle: 'Delete this comment?',
      deleteMessage: "This can't be undone.",
      deleteError: 'Could not delete the comment. Please try again.',
    },
    categories: {
      label: 'Category',
      food: 'Food & drink',
      groceries: 'Groceries',
      coffee: 'Coffee',
      drinks: 'Drinks & nightlife',
      transport: 'Transport',
      fuel: 'Fuel',
      travel: 'Travel',
      accommodation: 'Accommodation',
      housing: 'Rent & housing',
      utilities: 'Bills & utilities',
      internet: 'Phone & internet',
      entertainment: 'Entertainment',
      sports: 'Sports',
      shopping: 'Shopping',
      health: 'Health',
      education: 'Education',
      gifts: 'Gifts',
      pets: 'Pets',
      household: 'Household',
      other: 'Other',
    },
    currencies: {
      label: 'Currency',
      USD: 'US Dollar',
      ARS: 'Argentine Peso',
      BRL: 'Brazilian Real',
      MXN: 'Mexican Peso',
      EUR: 'Euro',
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
    common: { cancel: 'Cancelar', delete: 'Borrar', edit: 'Editar' },
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
      deleteGroupTitle: '¿Borrar este grupo?',
      deleteGroupMessage:
        'Esto no se puede deshacer — borra todos los gastos, pagos, comentarios e imágenes de tickets del grupo, para todos.',
      deleteGroupError: 'No se pudo borrar el grupo. Intentá de nuevo.',
      deleteGroupNotAllowed: 'Solo quien creó el grupo puede borrarlo.',
    },
    activity: {
      title: 'Actividad',
      subtitle: 'Toda tu actividad reciente',
      empty: 'Todavía no hay actividad.',
      paidBy: 'Pagó %{name} · %{group}',
      settledIn: 'en %{group}',
      openError: 'No se pudo abrir eso.',
    },
    profile: {
      title: 'Perfil',
      logout: 'Cerrar sesión',
      anonymous: 'Vos',
      language: 'Idioma',
      appearance: 'Apariencia',
      notifications: 'Notificaciones',
      notificationsUnsupported: 'Las notificaciones necesitan que agregues la app a tu pantalla de inicio (iOS 16.4+).',
      notificationsError: 'No se pudieron activar las notificaciones — revisá el permiso del navegador.',
    },
    theme: { system: 'Sistema', light: 'Claro', dark: 'Oscuro' },
    groupDetail: {
      userN: 'Usuario #%{id}',
      loadError: 'No se pudo cargar el grupo.',
      notFound: 'Grupo no encontrado.',
      settleUp: 'Saldar',
      yourBalance: 'Tu balance en este grupo',
      history: 'Historial',
      balances: 'Balances',
      spending: 'Gastos',
      totalSpent: 'Total gastado',
      spendingEmpty: 'Agregá gastos para ver en qué gasta el grupo.',
      addExpense: 'Agregar gasto',
      allSettled: 'Todo saldado',
      allSettledHint: 'Nadie le debe a nadie en este grupo.',
      historyEmpty: 'Todavía no hay actividad.',
      paymentTitle: 'Pago',
      paidFromTo: '%{from} le pagó a %{to}',
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
      youLent: 'Prestaste %{amount}',
      youOwe: 'Debés %{amount}',
      deleteSettlementTitle: '¿Borrar este pago?',
      deleteSettlementMessage: 'Esto no se puede deshacer desde la app.',
      deleteSettlementError: 'No se pudo borrar el pago. Intentá de nuevo.',
    },
    join: {
      joining: 'Uniéndote al grupo…',
      error: 'Este link de invitación no es válido o expiró.',
    },
    addExpense: {
      title: 'Nuevo gasto',
      editTitle: 'Editar gasto',
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
      percentagesMustTotal: 'Los porcentajes tienen que sumar 100.',
      add: 'Agregar gasto',
      save: 'Guardar cambios',
      saving: 'Guardando…',
      splitTotal: 'Total dividido',
      remaining: 'Resta',
      descriptionRequired: 'Ponele una descripción al gasto.',
      amountPositive: 'El monto tiene que ser mayor a 0.',
      pickMember: 'Elegí al menos un miembro para dividir el gasto.',
      amountsMustTotal: 'Los montos tienen que sumar %{amount}.',
      addError: 'No se pudo agregar el gasto. Revisá los datos.',
      updateError: 'No se pudo actualizar el gasto. Revisá los datos.',
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
    itemize: {
      title: 'Dividir por ítems',
      total: 'Total',
      assignItems: '¿Quién consumió qué?',
      taxTip: 'Impuesto / propina',
      proportional: 'Proporcional',
      equal: 'En partes iguales',
      perPerson: 'Por persona',
      confirm: 'Agregar gasto',
      assignAll: 'Cada ítem necesita al menos una persona.',
      itemsInvalid: 'Cada ítem necesita una descripción y un monto mayor a 0.',
    },
    expenseDetail: {
      title: 'Detalle del gasto',
      split: 'Cómo se dividió',
      items: 'Ítems',
      viewReceipt: 'Ver ticket',
      deleteTitle: '¿Borrar este gasto?',
      deleteMessage: 'Esto no se puede deshacer desde la app.',
      deleteError: 'No se pudo borrar el gasto. Intentá de nuevo.',
      notAllowed: 'Solo quien pagó o participa del split puede editar o borrar este gasto.',
    },
    settlementDetail: {
      title: 'Detalle del pago',
      notAllowed: 'Solo alguien de las partes del pago puede borrarlo.',
    },
    comments: {
      title: 'Comentarios',
      placeholder: 'Agregá un comentario…',
      send: 'Enviar',
      empty: 'Todavía no hay comentarios.',
      loadError: 'No se pudieron cargar los comentarios.',
      postError: 'No se pudo publicar tu comentario. Intentá de nuevo.',
      deleteTitle: '¿Borrar este comentario?',
      deleteMessage: 'Esto no se puede deshacer.',
      deleteError: 'No se pudo borrar el comentario. Intentá de nuevo.',
    },
    categories: {
      label: 'Categoría',
      food: 'Comida y bebida',
      groceries: 'Supermercado',
      coffee: 'Café',
      drinks: 'Salidas y tragos',
      transport: 'Transporte',
      fuel: 'Combustible',
      travel: 'Viajes',
      accommodation: 'Alojamiento',
      housing: 'Alquiler y vivienda',
      utilities: 'Servicios',
      internet: 'Teléfono e internet',
      entertainment: 'Entretenimiento',
      sports: 'Deportes',
      shopping: 'Compras',
      health: 'Salud',
      education: 'Educación',
      gifts: 'Regalos',
      pets: 'Mascotas',
      household: 'Hogar',
      other: 'Otros',
    },
    currencies: {
      label: 'Moneda',
      USD: 'Dólar estadounidense',
      ARS: 'Peso argentino',
      BRL: 'Real brasileño',
      MXN: 'Peso mexicano',
      EUR: 'Euro',
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

/**
 * Formats a monetary amount (in integer cents) with locale-aware grouping
 * and the given currency's symbol/placement, via Intl — e.g. 123450 cents
 * in ARS renders as "$ 1.234,50" (es) while the same cents in EUR render as
 * "1.234,50 €", with no per-currency table to maintain here. Currency
 * defaults to USD for the handful of call sites without a group in scope.
 */
export function formatAmount(cents: number, currency: string = DEFAULT_CURRENCY): string {
  const numberLocale = i18n.locale === 'es' ? 'es-AR' : 'en-US';
  return new Intl.NumberFormat(numberLocale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}

/**
 * Just the symbol Intl would render for this currency (e.g. "$", "€",
 * "ARS") — for decorating an amount TextInput while the user types, where a
 * fully formatted number doesn't make sense.
 */
export function currencySymbol(currency: string = DEFAULT_CURRENCY): string {
  const numberLocale = i18n.locale === 'es' ? 'es-AR' : 'en-US';
  const parts = new Intl.NumberFormat(numberLocale, { style: 'currency', currency }).formatToParts(0);
  return parts.find((p) => p.type === 'currency')?.value ?? '$';
}

/** Formats a cents amount with an explicit sign (used for balances). */
export function formatSigned(cents: number, currency: string = DEFAULT_CURRENCY): string {
  const sign = cents > 0 ? '+' : cents < 0 ? '−' : '';
  return `${sign}${formatAmount(Math.abs(cents), currency)}`;
}

/** Parses a user-typed dollar string (e.g. "10.50") into integer cents. */
export function toCents(input: string): number {
  return Math.round((parseFloat(input.replace(',', '.')) || 0) * 100);
}

/** Renders integer cents as a plain dollar string for prefilling a text input. */
export function fromCents(cents: number): string {
  return cents ? String(cents / 100) : '';
}

export { i18n };
