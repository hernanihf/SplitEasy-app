import { getLocales } from 'expo-localization';
import { I18n } from 'i18n-js';

const translations = {
  en: {
    login: {
      subtitle: 'Organize shared expenses with your group.',
      connecting: 'Connecting…',
      continueWithGoogle: 'Continue with Google',
      webHint: 'A Google window will open for you to sign in.',
    },
    groups: {
      title: 'Your groups',
      new: '+ New',
      loading: 'Loading…',
      loadError: 'Could not load your groups.',
      empty: 'No groups yet.',
      emptyHint: 'Create one to start sharing expenses.',
      signOut: 'Sign out',
    },
    newGroup: {
      nameRequired: 'Give the group a name.',
      createError: 'Could not create the group. Please try again.',
      title: 'New group',
      namePlaceholder: 'e.g. Trip to the coast',
      creating: 'Creating…',
      create: 'Create group',
    },
    groupDetail: {
      userN: 'User #%{id}',
      loadError: 'Could not load the group.',
      loading: 'Loading…',
      notFound: 'Group not found.',
      receipt: '📷 Receipt',
      expense: '+ Expense',
      balances: 'Balances',
      allSettled: 'All settled up.',
      owes: '%{from} owes %{to}: %{amount}',
      settle: 'Settle ›',
      expenses: 'Expenses',
      noExpenses: 'No expenses yet.',
      paidBy: 'Paid by %{name} · %{amount}',
    },
    settle: {
      amountPositive: 'The amount must be greater than 0.',
      amountTooHigh: "You can't settle more than %{max}.",
      recordError: 'Could not record the payment. Please try again.',
      title: 'Settle up',
      pays: '%{from} pays %{to}',
      currentDebt: 'Current debt: %{amount}',
      howMuch: 'How much is being paid?',
      amountPlaceholder: 'Amount',
      recording: 'Recording…',
      record: 'Record payment',
    },
    addExpense: {
      methodEqual: 'Equally',
      methodPercentage: 'Percentages',
      methodFixed: 'Fixed amounts',
      methodShares: 'Shares',
      descriptionRequired: 'Add a description for the expense.',
      amountPositive: 'The amount must be greater than 0.',
      pickMember: 'Pick at least one member to split the expense.',
      percentagesMustTotal: 'Percentages add up to %{total}, they must total 100.',
      amountsMustTotal: 'Amounts add up to %{total}, they must total %{amount}.',
      addError: 'Could not add the expense. Check the details.',
      loading: 'Loading…',
      title: 'New expense',
      descriptionPlaceholder: 'Description (e.g. Dinner)',
      amountPlaceholder: 'Total amount',
      whoPaid: 'Who paid?',
      howSplit: 'How is it split?',
      unitsPlaceholder: 'units',
      saving: 'Saving…',
      add: 'Add expense',
    },
    scanReceipt: {
      defaultMerchant: 'Receipt',
      readError: "We couldn't read the receipt. Try another photo or add the expense manually.",
      cameraPermission: 'We need camera permission to scan the receipt.',
      photosPermission: 'We need permission to access your photos.',
      title: 'Scan receipt',
      description: 'Take a photo or upload a picture of the receipt and AI will fill in the expense for you.',
      reading: 'Reading the receipt…',
      takePhoto: '📷 Take photo',
      chooseFromGallery: '🖼️ Choose from gallery',
    },
    auth: {
      signingIn: 'Signing in…',
    },
    tabs: {
      groups: 'Groups',
    },
  },
  es: {
    login: {
      subtitle: 'Organizá los gastos compartidos con tu grupo.',
      connecting: 'Conectando…',
      continueWithGoogle: 'Continuar con Google',
      webHint: 'Se abrirá una ventana de Google para iniciar sesión.',
    },
    groups: {
      title: 'Tus grupos',
      new: '+ Nuevo',
      loading: 'Cargando…',
      loadError: 'No se pudieron cargar los grupos.',
      empty: 'Todavía no tenés grupos.',
      emptyHint: 'Creá uno para empezar a compartir gastos.',
      signOut: 'Cerrar sesión',
    },
    newGroup: {
      nameRequired: 'Ponele un nombre al grupo.',
      createError: 'No se pudo crear el grupo. Probá de nuevo.',
      title: 'Nuevo grupo',
      namePlaceholder: 'Ej: Viaje a la costa',
      creating: 'Creando…',
      create: 'Crear grupo',
    },
    groupDetail: {
      userN: 'Usuario #%{id}',
      loadError: 'No se pudo cargar el grupo.',
      loading: 'Cargando…',
      notFound: 'Grupo no encontrado.',
      receipt: '📷 Ticket',
      expense: '+ Gasto',
      balances: 'Balances',
      allSettled: 'Todo saldado.',
      owes: '%{from} le debe a %{to}: %{amount}',
      settle: 'Saldar ›',
      expenses: 'Gastos',
      noExpenses: 'Todavía no hay gastos.',
      paidBy: 'Pagó %{name} · %{amount}',
    },
    settle: {
      amountPositive: 'El monto tiene que ser mayor a 0.',
      amountTooHigh: 'No podés saldar más de %{max}.',
      recordError: 'No se pudo registrar el pago. Probá de nuevo.',
      title: 'Saldar deuda',
      pays: '%{from} le paga a %{to}',
      currentDebt: 'Deuda actual: %{amount}',
      howMuch: '¿Cuánto se paga?',
      amountPlaceholder: 'Monto',
      recording: 'Registrando…',
      record: 'Registrar pago',
    },
    addExpense: {
      methodEqual: 'Partes iguales',
      methodPercentage: 'Porcentajes',
      methodFixed: 'Montos fijos',
      methodShares: 'Cantidades',
      descriptionRequired: 'Ponele una descripción al gasto.',
      amountPositive: 'El monto tiene que ser mayor a 0.',
      pickMember: 'Elegí al menos un miembro para dividir el gasto.',
      percentagesMustTotal: 'Los porcentajes suman %{total}, tienen que sumar 100.',
      amountsMustTotal: 'Los montos suman %{total}, tienen que sumar %{amount}.',
      addError: 'No se pudo agregar el gasto. Revisá los datos.',
      loading: 'Cargando…',
      title: 'Nuevo gasto',
      descriptionPlaceholder: 'Descripción (ej: Cena)',
      amountPlaceholder: 'Monto total',
      whoPaid: '¿Quién pagó?',
      howSplit: '¿Cómo se divide?',
      unitsPlaceholder: 'unidades',
      saving: 'Guardando…',
      add: 'Agregar gasto',
    },
    scanReceipt: {
      defaultMerchant: 'Ticket',
      readError: 'No pudimos leer el ticket. Probá con otra foto o cargá el gasto manualmente.',
      cameraPermission: 'Necesitamos permiso de cámara para escanear el ticket.',
      photosPermission: 'Necesitamos permiso para acceder a tus fotos.',
      title: 'Escanear ticket',
      description: 'Sacá una foto o subí una imagen del ticket y la IA va a completar el gasto por vos.',
      reading: 'Leyendo el ticket…',
      takePhoto: '📷 Tomar foto',
      chooseFromGallery: '🖼️ Elegir de la galería',
    },
    auth: {
      signingIn: 'Iniciando sesión…',
    },
    tabs: {
      groups: 'Grupos',
    },
  },
};

const i18n = new I18n(translations);

// Detect the device/browser language. Catalog lookup uses the language code
// (es / en); anything else falls back to English.
const deviceLanguage = getLocales()[0]?.languageCode ?? 'en';
i18n.locale = deviceLanguage === 'es' ? 'es' : 'en';
i18n.enableFallback = true;
i18n.defaultLocale = 'en';

// Number formatting locale: Argentine Spanish (1.234,56) vs US English (1,234.56).
const numberLocale = i18n.locale === 'es' ? 'es-AR' : 'en-US';

export function t(key: string, options?: Record<string, unknown>): string {
  return i18n.t(key, options);
}

/** Formats a monetary amount with locale-aware grouping/decimals, prefixed with "$". */
export function formatAmount(amount: number): string {
  return `$${new Intl.NumberFormat(numberLocale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)}`;
}

export { i18n };
