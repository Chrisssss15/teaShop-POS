// =============================
// IMPORTS
// =============================

import './style.css'
import { supabase } from './lib/supabase'
import QRCode from 'qrcode'

// =============================
// TYPES
// =============================

type Screen = 'pos' | 'pos-product-status' | 'pos-settings' | 'orders' | 'kitchen' | 'customer' | 'pickup' | 'order-history' | 'admin' | 'admin-products' | 'admin-sales' | 'admin-day-close' | 'admin-add-product' | 'admin-add-topping' | 'admin-categories' | 'print-preview' | 'payment-test'

type DiscountType = 'none' | 'percentage' | 'fixed'

type CupSize = 'medium' | 'large'

type Product = {
  id: string
  name: string
  category: string
  tea_type: string | null
  temperature_label: string | null
  pos_only: boolean
  product_type: 'drink' | 'item'
  base_price: number
  vat_rate: number
  is_active: boolean
  is_bestseller: boolean
  is_sold_out: boolean
  image_url: string | null
  discount_type: DiscountType
  discount_value: number
  qr_product_code: string | null

  available_sizes: CupSize[]
  medium_price: number | null
  large_price: number | null

  allow_ice_customization: boolean
  allowed_ice_levels: IceLevel[]
  medium_allowed_ice_levels: IceLevel[] | null
  large_allowed_ice_levels: IceLevel[] | null
  default_ice_level: IceLevel | null

  allow_sugar_customization: boolean
  allowed_sugar_levels: SugarLevel[]
}

type Topping = {
  id: string
  name: string
  price: number
  is_active: boolean
  is_sold_out: boolean
}

type ProductToppingLink = {
  product_id: string
  topping_id: string
}


type Category = {
  id: string
  name: string
  is_active: boolean
  discount_type: DiscountType
  discount_value: number
  sort_order: number
  created_at?: string | null
}

type IceLevel =
  | 'no_ice'
  | 'less_ice'
  | 'normal_ice'
  | 'warm'
  | 'extra_ice'
type SugarLevel = 'none' | 'minimal' | 'less' | 'normal' | 'sweet'

type SelectedTopping = {
  id: string
  name: string
  price: number
}

type CartItem = {
  cartItemId: string
  product: Product
  quantity: number
  cupSize: CupSize
  iceLevel: IceLevel
  sugarLevel: SugarLevel
  toppings: SelectedTopping[]
}

type SavedCartItem = {
  cartItemId: string
  productId: string
  quantity: number
  cupSize?: CupSize
  iceLevel: IceLevel
  sugarLevel: SugarLevel
  toppings: SelectedTopping[]
}

type OrderStatus = 'new' | 'preparing' | 'ready' | 'completed' | 'cancelled'
type LabelStatus = 'new' | 'preparing' | 'done' | 'cancelled'
type PrintStatus = 'pending' | 'printing' | 'printed' | 'failed'
type OrderFilter = 'all' | 'active' | 'preparation' | 'completed'
type PaymentStatus =
  | 'unpaid'
  | 'pending'
  | 'paid'
  | 'failed'
  | 'cancelled'
  | 'refunded'

type PaymentMethod = 'cash' | 'card' | 'online_fake' | 'pay_at_counter'

type PaymentRecordStatus = 'pending' | 'paid' | 'failed' | 'cancelled' | 'refunded'

type Payment = {
  id: string
  order_id: string
  provider: string
  provider_order_id?: string | null
  provider_transaction_id?: string | null
  amount: number
  currency: string
  status: PaymentRecordStatus
  payment_method?: string | null
  payment_url?: string | null
  failure_reason?: string | null
  created_at?: string | null
  updated_at?: string | null
  paid_at?: string | null
  failed_at?: string | null
  refund_amount?: number | null
  refund_reason?: string | null
  refunded_at?: string | null
  refunded_by?: string | null
}
type CashSession = {
  id: string
  opened_at: string
  closed_at?: string | null
  opening_amount: number
  expected_amount?: number | null
  counted_amount?: number | null
  difference_amount?: number | null
  opened_by?: string | null
  closed_by?: string | null
  status: string
  created_at?: string | null
}


type DailyClosing = {
  id: string
  business_date: string
  closed_at: string
  closed_by?: string | null
  cash_session_id?: string | null
  order_count?: number | null
  gross_sales?: number | null
  net_sales?: number | null
  vat_total?: number | null
  cash_sales?: number | null
  card_sales?: number | null
  online_sales?: number | null
  refund_total?: number | null
  cash_in?: number | null
  cash_out?: number | null
  opening_amount?: number | null
  expected_amount?: number | null
  counted_amount?: number | null
  difference_amount?: number | null
  created_at?: string | null
}

type DailyClosingVat = {
  id?: string
  daily_closing_id: string
  vat_rate: number
  gross_amount: number
  net_amount: number
  vat_amount: number
  created_at?: string | null
}

type CustomerLanguage = 'nl' | 'en' | 'cn'

type Order = {
  id: string
  order_number?: string | null
  order_type?: string | null
  channel?: string | null
  status: OrderStatus
  subtotal?: number | null
  total?: number | null
  total_amount?: number | null
  net_total?: number | null
  vat_total?: number | null
  gross_total?: number | null
  payment_status?: PaymentStatus | null
  payment_method?: PaymentMethod | null
  paid_at?: string | null
  customer_session_id?: string | null
  pickup_code?: string | null
  customer_name?: string | null
  customer_phone?: string | null
  created_at?: string | null
  updated_at?: string | null
  completed_at?: string | null
  cancelled_at?: string | null
  cancel_reason?: string | null
  cancelled_by?: string | null
}

type OrderItem = {
  id?: string
  order_id: string
  product_id?: string | null
  product_name?: string | null
  product_name_snapshot?: string | null
  original_unit_price?: number | null
  unit_price?: number | null
  discount_type_snapshot?: DiscountType | null
  discount_value_snapshot?: number | null
  discount_amount?: number | null
  quantity: number
  line_total?: number | null
  vat_rate?: number | null
  net_amount?: number | null
  vat_amount?: number | null
  gross_amount?: number | null
  cup_size?: CupSize | null
  ice_level?: IceLevel | null
  sugar_level?: SugarLevel | null
  toppings?: SelectedTopping[] | null
}

type KitchenLabel = {
  id: string
  order_id: string
  order_item_id?: string | null
  product_id?: string | null
  order_number?: string | null
  product_name: string
  status: LabelStatus
  label_index: number
  cup_size?: CupSize | null
  ice_level?: IceLevel | null
  sugar_level?: SugarLevel | null
  toppings?: SelectedTopping[] | null
  notes?: string | null
  print_status?: PrintStatus | null
  print_attempts?: number | null
  printed_at?: string | null
  print_error?: string | null
  created_at?: string | null
  started_at?: string | null
  done_at?: string | null
  cancelled_at?: string | null
}

// =============================
// CONSTANTS
// =============================

const CUSTOMER_SESSION_DURATION_MS = 60 * 60 * 1000

const CUSTOMER_SESSION_ID_KEY = 'customer_session_id'
const CUSTOMER_SESSION_EXPIRES_KEY = 'customer_session_expires_at'
const CUSTOMER_CART_KEY = 'customer_cart'
const CUSTOMER_NAME_KEY = 'customer_name'
const CUSTOMER_PHONE_KEY = 'customer_phone'
const CUSTOMER_PAYMENT_METHOD_KEY = 'customer_payment_method'
const CUSTOMER_CHECKOUT_OPEN_KEY = 'customer_checkout_open'
const CUSTOMER_ORDER_PLACED_KEY = 'customer_order_placed'
const CUSTOMER_ORDER_ID_KEY = 'customer_order_id'
const CUSTOMER_PICKUP_CODE_KEY = 'customer_pickup_code'
const CUSTOMER_ORDER_STATUS_KEY = 'customer_order_status'
const CUSTOMER_LANGUAGE_KEY = 'customer_language'

const ICE_LEVELS: IceLevel[] = [
  'no_ice',
  'less_ice',
  'normal_ice',
  'warm',
]

const SUGAR_LEVELS: SugarLevel[] = [
  'none',
  'minimal',
  'less',
  'normal',
  'sweet',
]


const TEA_TYPES = [
  'Jasmine Tea',
  'Longjing Tea',
  'Oolong Tea',
  'Black Tea',
  'Green Tea',
  'White Tea',
  'Earl Grey',
  'Matcha',
] as const

function getAvailableTeaTypes() {
  const existingTeaTypes = products
    .map((product) => product.tea_type?.trim())
    .filter((teaType): teaType is string => Boolean(teaType))

  return Array.from(new Set([...TEA_TYPES, ...existingTeaTypes])).sort((a, b) =>
    a.localeCompare(b)
  )
}

function renderTeaTypeOptions(selectedTeaType: string | null | undefined) {
  const selected = selectedTeaType?.trim() || ''

  return `
    <option value="">Geen theesoort</option>
    ${getAvailableTeaTypes()
      .map(
        (teaType) => `
          <option
            value="${escapeHtml(teaType)}"
            ${selected === teaType ? 'selected' : ''}
          >
            ${escapeHtml(teaType)}
          </option>
        `
      )
      .join('')}
    <option value="__custom__">Anders...</option>
  `
}


function setupAdminProductTypeControls() {
  const productTypeInput =
    document.querySelector<HTMLSelectElement>('#admin-product-type')

  const basePriceInput =
    document.querySelector<HTMLInputElement>('#admin-product-price')

  if (!productTypeInput) return

  const root =
    productTypeInput.closest<HTMLElement>('.admin-modal') ??
    productTypeInput.closest<HTMLElement>('.admin-panel') ??
    document.body

  const drinkOnlySelectors = [
    '.admin-product-info-field',
    '.admin-product-size-field',
    '.admin-product-customization-field',
    '.admin-product-toppings-field',
  ]

  const update = () => {
    const isItem = productTypeInput.value === 'item'

    drinkOnlySelectors.forEach((selector) => {
      root.querySelectorAll<HTMLElement>(selector).forEach((element) => {
        element.hidden = isItem
      })
    })

    if (basePriceInput) {
      basePriceInput.readOnly = !isItem
      basePriceInput.classList.toggle('admin-base-price-readonly', !isItem)
      basePriceInput.placeholder = isItem
        ? 'Bijv. 3.50'
        : 'Wordt automatisch bepaald'
    }

    const priceHelp = basePriceInput
      ?.closest('label')
      ?.querySelector<HTMLElement>('.admin-field-help')

    if (priceHelp) {
      priceHelp.textContent = isItem
        ? 'Vul voor een los item één vaste verkoopprijs in.'
        : 'Wordt automatisch Medium, of Large als alleen Large beschikbaar is.'
    }

    if (isItem && basePriceInput && !basePriceInput.value) {
      basePriceInput.value = ''
    }
  }

  productTypeInput.addEventListener('change', update)
  update()
}

function setupTeaTypeCustomInputs() {
  document
    .querySelectorAll<HTMLSelectElement>('#admin-product-tea-type')
    .forEach((select) => {
      const field = select.closest<HTMLElement>('.admin-tea-type-field')
      const customInput =
        field?.querySelector<HTMLInputElement>('.admin-product-custom-tea-type')

      if (!customInput) return

      const updateState = () => {
        const isCustom = select.value === '__custom__'
        customInput.hidden = !isCustom

        if (!isCustom) {
          customInput.value = ''
        }
      }

      select.addEventListener('change', () => {
        updateState()

        if (select.value === '__custom__') {
          customInput.focus()
        }
      })

      updateState()
    })
}


const translations = {
  nl: {
    languageName: 'Nederlands',
    orderTitle: 'Blue Cup Bestellen',
    orderSubtitle: 'Scan & bestel',
    chooseDrinks: 'Kies je drankjes',
    customizeDrink: 'Maak je drankje persoonlijk',
    required: 'Verplicht',
    multiplePossible: 'Meerdere mogelijk',
    iceLevel: 'Temperatuur / ijsniveau',
    sugarLevel: 'Sugar level',
    toppings: 'Toppings',
    noToppings: 'Geen toppings beschikbaar.',
    total: 'Totaal',
    chooseIceSugar: 'Kies temperatuur/ijs & sugar',
    addToOrder: 'Toevoegen aan bestelling',
    edit: 'Bewerken',
    saveChanges: 'Wijzigingen opslaan',
    yourOrder: 'Jouw bestelling',
    drink: 'drankje',
    drinks: 'drankjes',
    emptyCart: 'Je winkelmand is nog leeg.',
    emptyCartHint: 'Voeg eerst een drankje toe met de rode plus knop.',
    perItem: 'per stuk',
    remove: 'Verwijder',
    continueDetails: 'Verder naar gegevens',
    enterDetails: 'Gegevens invullen',
    checkoutSubtitle: 'Controleer je bestelling en kies je betaalmethode.',
    contactDetails: 'Contactgegevens',
    name: 'Naam',
    namePlaceholder: 'Bijv. Chris',
    phone: 'Telefoonnummer',
    phonePlaceholder: 'Bijv. 0612345678',
    paymentMethod: 'Betaalmethode',
    onlinePayment: 'Online betalen',
    onlinePaymentHint: 'Fake betaling voor MVP',
    payAtCounter: 'Betalen aan balie',
    payAtCounterHint: 'Betaal bij ophalen',
    overview: 'Overzicht',
    noDrinksChosen: 'Geen drankjes gekozen.',
    placeOrder: 'Plaats bestelling',
    placingOrder: 'Bestelling plaatsen...',
    orderPlaced: 'Bestelling geplaatst ✅',
    thankYou: 'Bedankt voor je bestelling.',
    pickupCode: 'Je pickup code is:',
    status: 'Status',
    yourDrinks: 'Je drankjes',
    loadingDrinks: 'Drankjes laden...',
    autoRefresh: 'Deze status vernieuwt automatisch elke 5 seconden. Deze sessie blijft maximaal 1 uur actief.',
    newOrder: 'Nieuwe bestelling',
    nameRequired: 'Vul je naam in voordat je bestelt.',
    phoneRequired: 'Vul je telefoonnummer in voordat je bestelt.',
    statusNew: 'Wachten',
    statusPreparing: 'In bereiding',
    statusReady: 'Klaar voor ophalen',
    statusCompleted: 'Afgerond',
    statusCancelled: 'Geannuleerd',
    msgNew: 'We hebben je bestelling ontvangen.',
    msgPreparing: 'Je drankjes worden nu gemaakt.',
    msgReady: 'Je bestelling is klaar om op te halen!',
    msgCompleted: 'Je bestelling is afgerond.',
    msgCancelled: 'Je bestelling is geannuleerd.',
    loadingStatus: 'We halen je status op...',
    labelWaiting: 'Wachten',
    labelPreparing: 'In bereiding',
    labelFinished: 'Klaar',
    labelCancelled: 'Geannuleerd',
  },
  en: {
    languageName: 'English',
    orderTitle: 'Blue Cup Order',
    orderSubtitle: 'Scan & order',
    chooseDrinks: 'Choose your drinks',
    customizeDrink: 'Customize your drink',
    required: 'Required',
    multiplePossible: 'Multiple allowed',
    iceLevel: 'Temperature / ice level',
    sugarLevel: 'Sugar level',
    toppings: 'Toppings',
    noToppings: 'No toppings available.',
    total: 'Total',
    chooseIceSugar: 'Choose temperature/ice & sugar',
    addToOrder: 'Add to order',
    edit: 'Edit',
    saveChanges: 'Save changes',
    yourOrder: 'Your order',
    drink: 'drink',
    drinks: 'drinks',
    emptyCart: 'Your cart is empty.',
    emptyCartHint: 'Add a drink first with the red plus button.',
    perItem: 'each',
    remove: 'Remove',
    continueDetails: 'Continue',
    enterDetails: 'Enter your details',
    checkoutSubtitle: 'Check your order and choose a payment method.',
    contactDetails: 'Contact details',
    name: 'Name',
    namePlaceholder: 'E.g. Chris',
    phone: 'Phone number',
    phonePlaceholder: 'E.g. 0612345678',
    paymentMethod: 'Payment method',
    onlinePayment: 'Pay online',
    onlinePaymentHint: 'Fake payment for MVP',
    payAtCounter: 'Pay at counter',
    payAtCounterHint: 'Pay when collecting',
    overview: 'Overview',
    noDrinksChosen: 'No drinks selected.',
    placeOrder: 'Place order',
    placingOrder: 'Placing order...',
    orderPlaced: 'Order placed ✅',
    thankYou: 'Thanks for your order.',
    pickupCode: 'Your pickup code is:',
    status: 'Status',
    yourDrinks: 'Your drinks',
    loadingDrinks: 'Loading drinks...',
    autoRefresh: 'This status refreshes automatically every 5 seconds. This session stays active for up to 1 hour.',
    newOrder: 'New order',
    nameRequired: 'Enter your name before ordering.',
    phoneRequired: 'Enter your phone number before ordering.',
    statusNew: 'Waiting',
    statusPreparing: 'Preparing',
    statusReady: 'Ready for pickup',
    statusCompleted: 'Completed',
    statusCancelled: 'Cancelled',
    msgNew: 'We received your order.',
    msgPreparing: 'Your drinks are being prepared.',
    msgReady: 'Your order is ready for pickup!',
    msgCompleted: 'Your order is completed.',
    msgCancelled: 'Your order was cancelled.',
    loadingStatus: 'Loading your status...',
    labelWaiting: 'Waiting',
    labelPreparing: 'Preparing',
    labelFinished: 'Finished',
    labelCancelled: 'Cancelled',
  },
  cn: {
    languageName: '中文',
    orderTitle: '奶茶店点单',
    orderSubtitle: '扫码点单',
    chooseDrinks: '选择饮品',
    customizeDrink: '定制你的饮品',
    required: '必选',
    multiplePossible: '可多选',
    iceLevel: '温度 / 冰量',
    sugarLevel: '甜度',
    toppings: '加料',
    noToppings: '暂无可选加料。',
    total: '总计',
    chooseIceSugar: '请选择温度 / 冰量和甜度',
    addToOrder: '加入订单',
    edit: '编辑',
    saveChanges: '保存修改',
    yourOrder: '你的订单',
    drink: '杯饮品',
    drinks: '杯饮品',
    emptyCart: '购物车还是空的。',
    emptyCartHint: '请先点击红色加号添加饮品。',
    perItem: '每杯',
    remove: '删除',
    continueDetails: '继续填写信息',
    enterDetails: '填写信息',
    checkoutSubtitle: '请确认订单并选择付款方式。',
    contactDetails: '联系信息',
    name: '姓名',
    namePlaceholder: '例如：Chris',
    phone: '电话号码',
    phonePlaceholder: '例如：0612345678',
    paymentMethod: '付款方式',
    onlinePayment: '在线付款',
    onlinePaymentHint: 'MVP 模拟付款',
    payAtCounter: '柜台付款',
    payAtCounterHint: '取餐时付款',
    overview: '订单概览',
    noDrinksChosen: '尚未选择饮品。',
    placeOrder: '提交订单',
    placingOrder: '正在提交订单...',
    orderPlaced: '订单已提交 ✅',
    thankYou: '感谢你的订单。',
    pickupCode: '你的取餐码：',
    status: '状态',
    yourDrinks: '你的饮品',
    loadingDrinks: '正在加载饮品...',
    autoRefresh: '状态每 5 秒自动更新。此会话最多保留 1 小时。',
    newOrder: '新订单',
    nameRequired: '请先填写姓名。',
    phoneRequired: '请先填写电话号码。',
    statusNew: '等待中',
    statusPreparing: '制作中',
    statusReady: '可取餐',
    statusCompleted: '已完成',
    statusCancelled: '已取消',
    msgNew: '我们已收到你的订单。',
    msgPreparing: '你的饮品正在制作中。',
    msgReady: '你的订单已经可以取餐！',
    msgCompleted: '你的订单已完成。',
    msgCancelled: '你的订单已取消。',
    loadingStatus: '正在获取订单状态...',
    labelWaiting: '等待中',
    labelPreparing: '制作中',
    labelFinished: '完成',
    labelCancelled: '已取消',
  },
} as const

const ICE_LEVEL_LABELS: Record<CustomerLanguage, Record<IceLevel, string>> = {
  nl: {
    no_ice: 'Geen ijs',
    less_ice: 'Minder ijs',
    normal_ice: 'Normaal ijs',
    warm: 'Warm',
    extra_ice: 'Extra ijs',
  },
  en: {
    no_ice: 'No ice',
    less_ice: 'Less ice',
    normal_ice: 'Normal ice',
    warm: 'Warm',
    extra_ice: 'Extra ice',
  },
  cn: {
    no_ice: '去冰',
    less_ice: '少冰',
    normal_ice: '正常冰',
    warm: '热',
    extra_ice: '多冰',
  },
}

const SUGAR_LEVEL_LABELS: Record<CustomerLanguage, Record<SugarLevel, string>> = {
  nl: {
    none: 'Geen',
    minimal: 'Minimaal',
    less: 'Minder',
    normal: 'Normaal',
    sweet: 'Zoet',
  },
  en: {
    none: 'None',
    minimal: 'Minimal',
    less: 'Less',
    normal: 'Normal',
    sweet: 'Sweet',
  },
  cn: {
    none: '无糖',
    minimal: '微糖',
    less: '少糖',
    normal: '正常糖',
    sweet: '多糖',
  },
}

// =============================
// ROUTING
// =============================

const params = new URLSearchParams(window.location.search)
const mode = params.get('mode')

function getScreenFromMode(modeValue: string | null): Screen {
  if (modeValue === 'pos-product-status') return 'pos-product-status'
  if (modeValue === 'pos-settings') return 'pos-settings'
  if (modeValue === 'orders') return 'orders'
  if (modeValue === 'kitchen') return 'kitchen'
  if (modeValue === 'customer') return 'customer'
  if (modeValue === 'pickup') return 'pickup'
  if (modeValue === 'order-history') return 'order-history'
  if (modeValue === 'admin') return 'admin'
  if (modeValue === 'admin-products') return 'admin-products'
  if (modeValue === 'admin-sales') return 'admin-sales'
  if (modeValue === 'admin-day-close') return 'admin-day-close'
  if (modeValue === 'admin-add-product') return 'admin-add-product'
  if (modeValue === 'admin-add-topping') return 'admin-add-topping'
  if (modeValue === 'admin-categories') return 'admin-categories'
  if (modeValue === 'print-preview') return 'print-preview'
  if (modeValue === 'payment-test') return 'payment-test'

  return 'pos'
}

function updateModeInUrl(nextScreen: Screen) {
  const url = new URL(window.location.href)
  url.searchParams.set('mode', nextScreen)
  window.history.pushState({ screen: nextScreen }, '', url)
}

// =============================
// GLOBAL STATE
// App, products, cart, orders, kitchen
// =============================

let screen: Screen = getScreenFromMode(mode)
let orderFilter: OrderFilter = 'active'

let products: Product[] = []
let toppings: Topping[] = []
let productToppingLinks: ProductToppingLink[] = []
let categories: Category[] = []
let cart: CartItem[] = []

let orders: Order[] = []
let orderItems: OrderItem[] = []
let kitchenLabels: KitchenLabel[] = []

// Payment records voor orderhistorie en admin
let paymentRecords: Payment[] = []

// Sticker preview: latest real order from Supabase
let printPreviewLabels: KitchenLabel[] = []
let printPreviewOrder: Order | null = null
let printPreviewQrDataUrls: Record<string, string> = {}
let isLoadingPrintPreview = false
let printPreviewError = ''

// Payment simulator: voorbereiding op MultiSafepay
let paymentTestPayment: Payment | null = null
let paymentTestOrder: Order | null = null
let isLoadingPaymentTest = false
let isUpdatingPaymentTest = false
let paymentTestError = ''

let isSubmitting = false
let isLoadingOrders = false
let isLoadingOrderHistory = false
let posProductSearch = ''
let isPosAvailabilityOpen = false
let isLoadingPosAvailability = false
let posAvailabilitySearch = ''
let posAvailabilityTeaType = ''
let posAvailabilityProducts: Product[] = []
let posAvailabilityError = ''
let orderHistorySearch = ''
let selectedOrderHistoryId: string | null = null
let orderHistoryReturnScreen: 'pos' | 'admin' = 'pos'
let settingsReturnScreen: 'pos' | 'admin' = 'pos'
let printPreviewReturnScreen: 'pos' | 'admin' = 'pos'
let isLoadingKitchen = false
let message = ''

// =============================
// CUSTOMER STATE
// QR ordering, checkout and progress
// =============================

let customerName = ''
let customerPhone = ''
let customerPaymentMethod: PaymentMethod = 'online_fake'
let customerPickupCode = ''
let customerOrderPlaced = false
let customerOrderId = ''
let customerOrderStatus: OrderStatus | null = null
let customerOrderLabels: KitchenLabel[] = []
let isCustomerCartOpen = false
let isCustomerCheckoutOpen = false
let customerLanguage: CustomerLanguage = 'nl'

// =============================
// ADMIN STATE
// Simple MVP product + topping management
// =============================

let adminEditingProductId: string | null = null
let adminProductSearch = ''
let adminEditingToppingId: string | null = null
let adminEditingCategoryId: string | null = null
let adminViewingCategoryId: string | null = null
let adminDraggingCategoryId: string | null = null
let adminMessage = ''
let adminError = ''

let adminTodayOrders: Order[] = []
let adminTodayOrderItems: OrderItem[] = []
let adminSalesOrders: Order[] = []
let adminSalesOrderItems: OrderItem[] = []
let adminSalesRange: 'today' | '7d' | '30d' | 'all' = 'today'
let activeCashSession: CashSession | null = null
let adminDailyClosing: DailyClosing | null = null
let adminDailyClosingVat: DailyClosingVat[] = []
let adminDailyClosingHistory: DailyClosing[] = []
let adminDailyClosingDateFilter = ''
let adminSelectedDailyClosing: DailyClosing | null = null
let adminSelectedDailyClosingVat: DailyClosingVat[] = []
let isLoadingDailyClosingHistory = false
let isLoadingAdminSales = false

let bestSellerSales: Record<string, number> = {}

// Product customizer
let isCustomerCustomizerOpen = false
let customizerProduct: Product | null = null
let customizerCupSize: CupSize | null = null
let customizerIceLevel: IceLevel | null = null
let customizerSugarLevel: SugarLevel | null = null
let customizerToppingIds: string[] = []
let editingCartItemId: string | null = null

// =============================
// TIMERS
// Kitchen and customer auto-refresh
// =============================

let autoRefreshTimer: number | null = null
let customerProgressTimer: number | null = null

let ordersRealtimeChannel: ReturnType<typeof supabase.channel> | null = null
let kitchenRealtimeChannel: ReturnType<typeof supabase.channel> | null = null
let pickupRealtimeChannel: ReturnType<typeof supabase.channel> | null = null

let ordersRealtimeReloadTimer: number | null = null
let kitchenRealtimeReloadTimer: number | null = null
let pickupRealtimeReloadTimer: number | null = null

let autoPrintRealtimeChannel: ReturnType<typeof supabase.channel> | null = null
let autoPrintReloadTimer: number | null = null
let isAutoPrintProcessing = false
let ignoredPendingLabelIds = new Set<string>()

let pickupWaitVisible = true
let pickupWaitMinutes = 10
let cashRegistrationEnabled = true
let isSmoothScrollingToCategory = false


// =============================
// CUSTOMER: SESSION
// =============================

function makeSessionId() {
  if (crypto.randomUUID) {
    return crypto.randomUUID()
  }

  return `session-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

function isCustomerSessionExpired() {
  const expiresAt = sessionStorage.getItem(CUSTOMER_SESSION_EXPIRES_KEY)

  if (!expiresAt) {
    return false
  }

  return Date.now() > Number(expiresAt)
}

function clearCustomerSessionStorage() {
  sessionStorage.removeItem(CUSTOMER_SESSION_ID_KEY)
  sessionStorage.removeItem(CUSTOMER_SESSION_EXPIRES_KEY)
  sessionStorage.removeItem(CUSTOMER_CART_KEY)
  sessionStorage.removeItem(CUSTOMER_NAME_KEY)
  sessionStorage.removeItem(CUSTOMER_PHONE_KEY)
  sessionStorage.removeItem(CUSTOMER_PAYMENT_METHOD_KEY)
  sessionStorage.removeItem(CUSTOMER_CHECKOUT_OPEN_KEY)
  sessionStorage.removeItem(CUSTOMER_ORDER_PLACED_KEY)
  sessionStorage.removeItem(CUSTOMER_ORDER_ID_KEY)
  sessionStorage.removeItem(CUSTOMER_PICKUP_CODE_KEY)
  sessionStorage.removeItem(CUSTOMER_ORDER_STATUS_KEY)
}

function resetCustomerStateVariables() {
  cart = []
  customerName = ''
  customerPhone = ''
  customerPaymentMethod = 'online_fake'
  customerPickupCode = ''
  customerOrderPlaced = false
  customerOrderId = ''
  customerOrderStatus = null
  customerOrderLabels = []
  isCustomerCartOpen = false
  isCustomerCheckoutOpen = false
  isCustomerCustomizerOpen = false
  customizerProduct = null
  customizerCupSize = null
  customizerIceLevel = null
  customizerSugarLevel = null
  customizerToppingIds = []
  editingCartItemId = null
}

function getCustomerSessionId() {
  if (isCustomerSessionExpired()) {
    clearCustomerSessionStorage()
    resetCustomerStateVariables()
  }

  let sessionId = sessionStorage.getItem(CUSTOMER_SESSION_ID_KEY)

  if (!sessionId) {
    sessionId = makeSessionId()

    sessionStorage.setItem(CUSTOMER_SESSION_ID_KEY, sessionId)
    sessionStorage.setItem(
      CUSTOMER_SESSION_EXPIRES_KEY,
      String(Date.now() + CUSTOMER_SESSION_DURATION_MS)
    )
  }

  return sessionId
}

function saveCustomerState() {
  if (screen !== 'customer') return

  getCustomerSessionId()

  const savedCart: SavedCartItem[] = cart.map((item) => ({
    cartItemId: item.cartItemId,
    productId: String(item.product.id),
    quantity: item.quantity,
    cupSize: item.cupSize,
    iceLevel: item.iceLevel,
    sugarLevel: item.sugarLevel,
    toppings: item.toppings,
  }))

  sessionStorage.setItem(CUSTOMER_CART_KEY, JSON.stringify(savedCart))
  sessionStorage.setItem(CUSTOMER_NAME_KEY, customerName)
  sessionStorage.setItem(CUSTOMER_PHONE_KEY, customerPhone)
  sessionStorage.setItem(CUSTOMER_PAYMENT_METHOD_KEY, customerPaymentMethod)
  sessionStorage.setItem(CUSTOMER_CHECKOUT_OPEN_KEY, String(isCustomerCheckoutOpen))
  sessionStorage.setItem(CUSTOMER_ORDER_PLACED_KEY, String(customerOrderPlaced))
  sessionStorage.setItem(CUSTOMER_ORDER_ID_KEY, customerOrderId)
  sessionStorage.setItem(CUSTOMER_PICKUP_CODE_KEY, customerPickupCode)
  sessionStorage.setItem(CUSTOMER_ORDER_STATUS_KEY, customerOrderStatus || '')
}

function normalizeSugarLevel(value: unknown): SugarLevel {
  if (value === 'none' || value === 'minimal' || value === 'less' || value === 'normal' || value === 'sweet') {
    return value
  }

  // Oude sessiewaarden uit de percentage-versie omzetten.
  if (value === '0') return 'none'
  if (value === '25') return 'minimal'
  if (value === '50') return 'less'
  if (value === '75') return 'normal'
  if (value === '100') return 'sweet'

  return 'normal'
}

function loadCustomerStateAfterProducts() {
  getCustomerSessionId()

  customerName = sessionStorage.getItem(CUSTOMER_NAME_KEY) || ''
  customerPhone = sessionStorage.getItem(CUSTOMER_PHONE_KEY) || ''

  const savedLanguage = sessionStorage.getItem(CUSTOMER_LANGUAGE_KEY) as CustomerLanguage | null
  if (savedLanguage === 'nl' || savedLanguage === 'en' || savedLanguage === 'cn') {
    customerLanguage = savedLanguage
  }

  const savedPaymentMethod = sessionStorage.getItem(CUSTOMER_PAYMENT_METHOD_KEY) as PaymentMethod | null

  if (savedPaymentMethod) {
    customerPaymentMethod = savedPaymentMethod
  }

  isCustomerCheckoutOpen = sessionStorage.getItem(CUSTOMER_CHECKOUT_OPEN_KEY) === 'true'
  customerOrderPlaced = sessionStorage.getItem(CUSTOMER_ORDER_PLACED_KEY) === 'true'
  customerOrderId = sessionStorage.getItem(CUSTOMER_ORDER_ID_KEY) || ''
  customerPickupCode = sessionStorage.getItem(CUSTOMER_PICKUP_CODE_KEY) || ''

  const savedStatus = sessionStorage.getItem(CUSTOMER_ORDER_STATUS_KEY) as OrderStatus | null

  if (savedStatus) {
    customerOrderStatus = savedStatus
  }

  const savedCartText = sessionStorage.getItem(CUSTOMER_CART_KEY)

  if (savedCartText && !customerOrderPlaced) {
    try {
      const savedCart = JSON.parse(savedCartText) as SavedCartItem[]

      cart = savedCart
        .map((savedItem) => {
          const product = products.find((p) => String(p.id) === String(savedItem.productId))

          if (!product) {
            return null
          }

          return {
            cartItemId: savedItem.cartItemId || makeCartItemId(),
            product,
            quantity: savedItem.quantity,
            cupSize: getSafeCupSizeForProduct(product, savedItem.cupSize),
            iceLevel: savedItem.iceLevel || 'normal_ice',
            sugarLevel: normalizeSugarLevel(savedItem.sugarLevel),
            toppings: Array.isArray(savedItem.toppings) ? savedItem.toppings : [],
          }
        })
        .filter((item): item is CartItem => item !== null)
    } catch (error) {
      console.error('Customer cart laden mislukt:', error)
      cart = []
    }
  }
}


// =============================
// SUPABASE: LOAD DATA
// =============================

async function loadProducts() {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('is_active', true)
    .order('category', { ascending: true })
    .order('name', { ascending: true })

  if (error) {
    showError(`Fout bij laden producten: ${error.message}`)
    return
  }

  const loadedProducts = (data ?? []) as Product[]

  products =
    screen === 'customer'
      ? loadedProducts.filter((product) => product.pos_only !== true)
      : loadedProducts

  if (screen === 'customer') {
    loadCustomerStateAfterProducts()

    if (customerOrderPlaced && customerOrderId) {
      await loadCustomerOrderProgress(false)
      startCustomerProgressRefresh()
    }
  }

  render()
}

async function loadPosAvailabilityProducts(showLoading = true) {
  if (showLoading) {
    isLoadingPosAvailability = true
    posAvailabilityError = ''
    render()
  }

  const [
    { data: productData, error: productError },
    { data: toppingData, error: toppingError },
  ] = await Promise.all([
    supabase
      .from('products')
      .select('*')
      .order('category', { ascending: true })
      .order('name', { ascending: true }),
    supabase
      .from('toppings')
      .select('*')
      .eq('is_active', true)
      .order('name', { ascending: true }),
  ])

  if (productError) {
    isLoadingPosAvailability = false
    posAvailabilityError = `Productstatus laden mislukt: ${productError.message}`
    render()
    return
  }

  if (toppingError) {
    isLoadingPosAvailability = false
    posAvailabilityError = `Toppingstatus laden mislukt: ${toppingError.message}`
    render()
    return
  }

  posAvailabilityProducts = (productData ?? []) as Product[]
  toppings = (toppingData ?? []) as Topping[]
  isLoadingPosAvailability = false
  render()
}

async function openPosAvailability() {
  stopAutoRefresh()
  stopCustomerProgressRefresh()
  removeCustomerScrollListeners()

  screen = 'pos-product-status'
  isPosAvailabilityOpen = false
  posAvailabilitySearch = ''
  posAvailabilityTeaType = ''
  posAvailabilityError = ''

  updateModeInUrl('pos-product-status')

  await Promise.all([
    loadPosAvailabilityProducts(false),
    loadToppings(),
  ])

  render()
}

function closePosAvailability() {
  stopAutoRefresh()
  stopCustomerProgressRefresh()
  removeCustomerScrollListeners()

  screen = 'pos'
  isPosAvailabilityOpen = false
  posAvailabilitySearch = ''
  posAvailabilityTeaType = ''
  posAvailabilityError = ''

  updateModeInUrl('pos')
  render()
}

async function setPosProductSoldOut(productId: string, isSoldOut: boolean) {
  const { error } = await supabase
    .from('products')
    .update({ is_sold_out: isSoldOut })
    .eq('id', productId)

  if (error) {
    posAvailabilityError = `Productstatus aanpassen mislukt: ${error.message}`
    render()
    return
  }

  posAvailabilityProducts = posAvailabilityProducts.map((product) =>
    String(product.id) === String(productId)
      ? { ...product, is_sold_out: isSoldOut }
      : product
  )

  products = products.map((product) =>
    String(product.id) === String(productId)
      ? { ...product, is_sold_out: isSoldOut }
      : product
  )

  message = isSoldOut
    ? 'Product staat nu op uitverkocht.'
    : 'Product is weer beschikbaar.'

  render()
}

async function setPosProductVisible(productId: string, isVisible: boolean) {
  const { error } = await supabase
    .from('products')
    .update({ is_active: isVisible })
    .eq('id', productId)

  if (error) {
    posAvailabilityError = `Zichtbaarheid aanpassen mislukt: ${error.message}`
    render()
    return
  }

  posAvailabilityProducts = posAvailabilityProducts.map((product) =>
    String(product.id) === String(productId)
      ? { ...product, is_active: isVisible }
      : product
  )

  if (isVisible) {
    const restoredProduct = posAvailabilityProducts.find(
      (product) => String(product.id) === String(productId)
    )

    if (restoredProduct) {
      const alreadyLoaded = products.some(
        (product) => String(product.id) === String(productId)
      )

      if (!alreadyLoaded) {
        products = [...products, restoredProduct]
      }
    }
  } else {
    products = products.filter(
      (product) => String(product.id) !== String(productId)
    )

    cart = cart.filter(
      (item) => String(item.product.id) !== String(productId)
    )
  }

  message = isVisible
    ? 'Product is weer zichtbaar.'
    : 'Product is verborgen uit het menu.'

  render()
}

function getPosAvailabilityTeaTypes() {
  return Array.from(
    new Set(
      (posAvailabilityProducts.length > 0 ? posAvailabilityProducts : products)
        .filter(
          (product) =>
            product.product_type === 'drink' &&
            Boolean(product.tea_type?.trim())
        )
        .map((product) => product.tea_type!.trim())
    )
  ).sort((a, b) => a.localeCompare(b))
}

function getPosAvailabilityTeaTypeCount(teaType: string) {
  if (!teaType) return 0

  return (posAvailabilityProducts.length > 0 ? posAvailabilityProducts : products).filter(
    (product) =>
      product.product_type === 'drink' &&
      product.tea_type?.trim() === teaType
  ).length
}

async function setPosTeaTypeSoldOut(
  teaType: string,
  isSoldOut: boolean
) {
  const cleanTeaType = teaType.trim()
  if (!cleanTeaType) {
    posAvailabilityError = 'Kies eerst een theesoort.'
    render()
    return
  }

  const matchingProducts = posAvailabilityProducts.filter(
    (product) =>
      product.product_type === 'drink' &&
      product.tea_type?.trim() === cleanTeaType
  )

  if (matchingProducts.length === 0) {
    posAvailabilityError = `Geen drankjes gevonden met ${cleanTeaType}.`
    render()
    return
  }

  const actionText = isSoldOut ? 'uitverkocht zetten' : 'beschikbaar maken'
  const confirmed = window.confirm(
    `${matchingProducts.length} drankje${matchingProducts.length === 1 ? '' : 's'} met ${cleanTeaType} ${actionText}?`
  )

  if (!confirmed) return

  posAvailabilityError = ''

  const { error } = await supabase
    .from('products')
    .update({ is_sold_out: isSoldOut })
    .eq('tea_type', cleanTeaType)
    .eq('product_type', 'drink')

  if (error) {
    posAvailabilityError = `Productstatus aanpassen mislukt: ${error.message}`
    render()
    return
  }

  posAvailabilityProducts = posAvailabilityProducts.map((product) =>
    product.product_type === 'drink' &&
    product.tea_type?.trim() === cleanTeaType
      ? { ...product, is_sold_out: isSoldOut }
      : product
  )

  products = products.map((product) =>
    product.product_type === 'drink' &&
    product.tea_type?.trim() === cleanTeaType
      ? { ...product, is_sold_out: isSoldOut }
      : product
  )

  message = isSoldOut
    ? `${matchingProducts.length} ${cleanTeaType} drankjes staan nu op uitverkocht.`
    : `${matchingProducts.length} ${cleanTeaType} drankjes zijn weer beschikbaar.`

  render()
}

async function setPosToppingSoldOut(
  toppingId: string,
  isSoldOut: boolean
) {
  const topping = toppings.find(
    (item) => String(item.id) === String(toppingId)
  )

  if (!topping) {
    posAvailabilityError = 'Topping niet gevonden.'
    render()
    return
  }

  const { error } = await supabase
    .from('toppings')
    .update({ is_sold_out: isSoldOut })
    .eq('id', toppingId)

  if (error) {
    posAvailabilityError = `Toppingstatus aanpassen mislukt: ${error.message}`
    render()
    return
  }

  toppings = toppings.map((item) =>
    String(item.id) === String(toppingId)
      ? { ...item, is_sold_out: isSoldOut }
      : item
  )

  message = isSoldOut
    ? `${topping.name} staat nu op uitverkocht.`
    : `${topping.name} is weer beschikbaar.`

  posAvailabilityError = ''
  render()
}

function getFilteredPosAvailabilityProducts() {
  const search = posAvailabilitySearch.trim().toLowerCase()

  if (!search) {
    return posAvailabilityProducts
  }

  return posAvailabilityProducts.filter((product) =>
    `${product.name} ${product.category}`.toLowerCase().includes(search)
  )
}

async function loadBestSellerSales() {
  const { data: orderData, error: orderError } = await supabase
    .from('orders')
    .select('id,status')

  if (orderError) {
    console.error('Best seller orders laden mislukt:', orderError)
    bestSellerSales = {}
    return
  }

  const validOrderIds = (orderData ?? [])
    .filter((order: any) => order.status !== 'cancelled')
    .map((order: any) => order.id)

  if (validOrderIds.length === 0) {
    bestSellerSales = {}
    return
  }

  const { data: itemData, error: itemError } = await supabase
    .from('order_items')
    .select('product_id,quantity,order_id')
    .in('order_id', validOrderIds)

  if (itemError) {
    console.error('Best seller order items laden mislukt:', itemError)
    bestSellerSales = {}
    return
  }

  const sales: Record<string, number> = {}

  for (const item of itemData ?? []) {
    if (!item.product_id) continue

    const productId = String(item.product_id)
    sales[productId] =
      Number(sales[productId] ?? 0) + Number(item.quantity ?? 0)
  }

  bestSellerSales = sales
}

async function loadCategories() {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true })

  if (error) {
    console.error('Categorieën laden mislukt:', error)
    return
  }

  categories = (data ?? []) as Category[]

  let shouldRefresh = false

  if (!getDiscountSystemCategory()) {
    await ensureDiscountSystemCategory()
    shouldRefresh = true
  }

  if (!getBestSellerSystemCategory()) {
    await ensureBestSellerSystemCategory()
    shouldRefresh = true
  }

  if (!getHotSystemCategory()) {
    await ensureHotSystemCategory()
    shouldRefresh = true
  }

  if (shouldRefresh) {
    const { data: refreshedData, error: refreshedError } = await supabase
      .from('categories')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true })

    if (!refreshedError) {
      categories = (refreshedData ?? []) as Category[]
    }
  }
}

async function loadToppings() {
  const { data, error } = await supabase
    .from('toppings')
    .select('*')
    .eq('is_active', true)
    .order('name', { ascending: true })

  if (error) {
    console.error('Toppings laden mislukt:', error)
    return
  }

  toppings = (data ?? []) as Topping[]
  console.log('Toppings geladen:', toppings)
}


async function loadProductToppingLinks() {
  const { data, error } = await supabase
    .from('product_toppings')
    .select('product_id,topping_id')

  if (error) {
    console.error('Product toppings laden mislukt:', error)
    productToppingLinks = []
    return
  }

  productToppingLinks = (data ?? []) as ProductToppingLink[]
}

function getAllowedToppingsForProduct(productId: string) {
  const allowedIds = new Set(
    productToppingLinks
      .filter((link) => String(link.product_id) === String(productId))
      .map((link) => String(link.topping_id))
  )

  return toppings.filter(
    (topping) =>
      topping.is_active &&
      !topping.is_sold_out &&
      allowedIds.has(String(topping.id))
  )
}

function getSelectedAdminToppingIds() {
  return Array.from(
    document.querySelectorAll<HTMLInputElement>(
      'input[name="admin-product-topping"]:checked'
    )
  ).map((input) => String(input.value))
}


function toggleAllAdminProductToppings(button: HTMLButtonElement) {
  const container = button.closest('.admin-product-toppings-field')
  if (!container) return

  const checkboxes = Array.from(
    container.querySelectorAll<HTMLInputElement>(
      'input[name="admin-product-topping"]'
    )
  )

  if (checkboxes.length === 0) return

  const allChecked = checkboxes.every((checkbox) => checkbox.checked)
  const nextChecked = !allChecked

  checkboxes.forEach((checkbox) => {
    checkbox.checked = nextChecked
  })

  button.textContent = nextChecked ? 'Clear' : 'All'
}

async function saveProductToppingLinks(productId: string, toppingIds: string[]) {
  const { error: deleteError } = await supabase
    .from('product_toppings')
    .delete()
    .eq('product_id', productId)

  if (deleteError) {
    throw new Error(`Bestaande toppings verwijderen mislukt: ${deleteError.message}`)
  }

  if (toppingIds.length === 0) {
    productToppingLinks = productToppingLinks.filter(
      (link) => String(link.product_id) !== String(productId)
    )
    return
  }

  const rows = toppingIds.map((toppingId) => ({
    product_id: productId,
    topping_id: toppingId,
  }))

  const { error: insertError } = await supabase
    .from('product_toppings')
    .insert(rows)

  if (insertError) {
    throw new Error(`Toppings koppelen mislukt: ${insertError.message}`)
  }
}


async function loadOrderHistory() {
  isLoadingOrderHistory = true
  render()

  const { startIso, endIso } = getTodayDateRange()

  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .gte('created_at', startIso)
    .lt('created_at', endIso)
    .order('created_at', { ascending: false })

  if (error) {
    isLoadingOrderHistory = false
    message = `Bonnen van vandaag laden mislukt: ${error.message}`
    render()
    return
  }

  orders = (data ?? []) as Order[]

  await Promise.all([
    loadOrderItemsForOrders(orders),
    loadPaymentsForOrders(orders),
  ])

  isLoadingOrderHistory = false
  render()
}

async function loadOrders() {
  isLoadingOrders = true
  render()

  const { startIso, endIso } = getTodayDateRange()

  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .gte('created_at', startIso)
    .lt('created_at', endIso)
    .order('created_at', { ascending: false })

  if (error) {
    isLoadingOrders = false
    message = `Fout bij laden orders: ${error.message}`
    render()
    return
  }

  orders = (data ?? []) as Order[]

  await loadOrderItemsForOrders(orders)

  isLoadingOrders = false
  render()
}

async function loadKitchenLabels(showLoading = true) {
  if (showLoading) {
    isLoadingKitchen = true
    render()
  }

  const { data, error } = await supabase
    .from('kitchen_labels')
    .select('*')
    .in('status', ['new', 'preparing'])
    .order('created_at', { ascending: true })

  if (error) {
    isLoadingKitchen = false
    message = `Fout bij laden kitchen labels: ${error.message}`
    render()
    return
  }

  kitchenLabels = (data ?? []) as KitchenLabel[]

  isLoadingKitchen = false
  render()
}

async function loadCustomerOrderProgress(shouldRender = true) {
  if (!customerOrderId) return

  const { data: orderData, error: orderError } = await supabase
    .from('orders')
    .select('*')
    .eq('id', customerOrderId)
    .single()

  if (orderError) {
    console.error('Customer order status laden mislukt:', orderError)
    return
  }

  const order = orderData as Order
  customerOrderStatus = order.status
  customerPickupCode = order.pickup_code || customerPickupCode

  const { data: labelsData, error: labelsError } = await supabase
    .from('kitchen_labels')
    .select('*')
    .eq('order_id', customerOrderId)
    .order('created_at', { ascending: true })

  if (labelsError) {
    console.error('Customer labels laden mislukt:', labelsError)
    return
  }

  customerOrderLabels = (labelsData ?? []) as KitchenLabel[]
  saveCustomerState()

  if (shouldRender) {
    render()
  }
}

async function loadOrderItemsForOrders(orderList: Order[]) {
  const orderIds = orderList.map((order) => order.id)

  if (orderIds.length === 0) {
    orderItems = []
    return
  }

  const { data, error } = await supabase
    .from('order_items')
    .select('*')
    .in('order_id', orderIds)

  if (error) {
    console.error('Order items laden mislukt:', error)
    orderItems = []
    return
  }

  orderItems = (data ?? []) as OrderItem[]
}


async function loadPaymentsForOrders(orderList: Order[]) {
  const orderIds = orderList.map((order) => String(order.id))

  if (orderIds.length === 0) {
    paymentRecords = []
    return
  }

  const { data, error } = await supabase
    .from('payments')
    .select('*')
    .in('order_id', orderIds)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Payments laden mislukt:', error)
    paymentRecords = []
    return
  }

  paymentRecords = (data ?? []) as Payment[]
}

function getPaymentForOrder(orderId: string) {
  return paymentRecords.find(
    (payment) => String(payment.order_id) === String(orderId)
  ) ?? null
}

function getPaymentProviderLabel(payment: Payment | null) {
  if (!payment) return '-'

  if (payment.provider === 'multisafepay') {
    return 'MultiSafepay'
  }

  if (payment.provider === 'pos') {
    return 'POS'
  }

  return payment.provider || '-'
}

function getPaymentRecordStatusLabel(payment: Payment | null) {
  if (!payment) return '-'

  if (payment.status === 'paid') return 'Betaald'
  if (payment.status === 'pending') return 'Wacht op betaling'
  if (payment.status === 'failed') return 'Mislukt'
  if (payment.status === 'cancelled') return 'Geannuleerd'
  if (payment.status === 'refunded') return 'Terugbetaald'

  return payment.status
}

function getPaymentRecordStatusClass(payment: Payment | null) {
  if (!payment) return 'order-payment-unpaid'

  if (payment.status === 'paid') return 'order-payment-paid'
  if (payment.status === 'pending') return 'order-payment-pending'
  if (payment.status === 'failed') return 'order-payment-failed'
  if (payment.status === 'cancelled') return 'order-payment-cancelled'
  if (payment.status === 'refunded') return 'order-payment-refunded'

  return 'order-payment-unpaid'
}


// =============================
// CART LOGIC: SHARED BY CUSTOMER AND STAFF
// =============================

function makeCartItemId() {
  if (crypto.randomUUID) {
    return crypto.randomUUID()
  }

  return `cart-${Date.now()}-${Math.random().toString(36).slice(2)}`
}



function getProductAvailableSizes(product: Product): CupSize[] {
  const configuredSizes = Array.isArray(product.available_sizes)
    ? product.available_sizes
    : []

  const validSizes = configuredSizes.filter(
    (size): size is CupSize => size === 'medium' || size === 'large'
  )

  return validSizes.length > 0 ? validSizes : ['medium']
}

function getDefaultCupSizeForProduct(product: Product): CupSize {
  const sizes = getProductAvailableSizes(product)

  if (sizes.includes('medium')) {
    return 'medium'
  }

  return sizes[0] ?? 'medium'
}

function getSafeCupSizeForProduct(
  product: Product,
  value?: CupSize | null
): CupSize {
  const sizes = getProductAvailableSizes(product)

  if (value && sizes.includes(value)) {
    return value
  }

  return getDefaultCupSizeForProduct(product)
}

function getProductSizePrice(product: Product, size: CupSize) {
  if (product.product_type === 'item') {
    return Math.max(0, Number(product.base_price))
  }

  if (size === 'large' && product.large_price != null) {
    return Math.max(0, Number(product.large_price))
  }

  if (size === 'medium' && product.medium_price != null) {
    return Math.max(0, Number(product.medium_price))
  }

  return Math.max(0, Number(product.base_price))
}

function getDiscountedPriceForAmount(product: Product, originalPrice: number) {
  const safePrice = Math.max(0, Number(originalPrice) || 0)
  const discount = getProductDiscount(product)

  if (discount.type === 'percentage') {
    const percentage = Math.min(100, discount.value)
    return Math.max(0, safePrice - safePrice * (percentage / 100))
  }

  if (discount.type === 'fixed') {
    return Math.max(0, safePrice - discount.value)
  }

  return safePrice
}

function getCupSizeLabel(size: CupSize) {
  return size === 'large' ? 'Large' : 'Medium'
}

function getCustomizerCupSizePrice(size: CupSize) {
  if (!customizerProduct) return 0

  return getDiscountedPriceForAmount(
    customizerProduct,
    getProductSizePrice(customizerProduct, size)
  )
}

function productAllowsIceCustomization(product: Product) {
  return product.allow_ice_customization !== false
}

function productAllowsSugarCustomization(product: Product) {
  return product.allow_sugar_customization !== false
}

function getProductAllowedIceLevels(
  product: Product,
  cupSize?: CupSize | null
): IceLevel[] {
  const getValidLevels = (levels?: IceLevel[] | null) => {
    if (!Array.isArray(levels)) {
      return []
    }

    return levels.filter((level) => ICE_LEVELS.includes(level))
  }

  if (cupSize === 'medium') {
    const mediumLevels = getValidLevels(product.medium_allowed_ice_levels)

    if (mediumLevels.length > 0) {
      return mediumLevels
    }
  }

  if (cupSize === 'large') {
    const largeLevels = getValidLevels(product.large_allowed_ice_levels)

    if (largeLevels.length > 0) {
      return largeLevels
    }
  }

  const configuredLevels = getValidLevels(product.allowed_ice_levels)

  if (cupSize) {
    return configuredLevels.length > 0 ? configuredLevels : ICE_LEVELS
  }

  const availableSizes = getProductAvailableSizes(product)
  const sizeSpecificLevels = availableSizes.flatMap((size) => {
    if (size === 'medium') {
      return getValidLevels(product.medium_allowed_ice_levels)
    }

    return getValidLevels(product.large_allowed_ice_levels)
  })

  const combinedLevels = Array.from(
    new Set([...sizeSpecificLevels, ...configuredLevels])
  )

  return combinedLevels.length > 0 ? combinedLevels : ICE_LEVELS
}

function getProductAllowedSugarLevels(product: Product): SugarLevel[] {
  const configuredLevels = Array.isArray(product.allowed_sugar_levels)
    ? product.allowed_sugar_levels
    : []

  const validLevels = configuredLevels.filter((level) =>
    SUGAR_LEVELS.includes(level)
  )

  return validLevels.length > 0 ? validLevels : SUGAR_LEVELS
}

function getFixedIceLevelForProduct(product: Product): IceLevel | null {
  const fixedLevel = product.default_ice_level

  if (!fixedLevel) {
    return null
  }

  return ICE_LEVELS.includes(fixedLevel) ? fixedLevel : null
}

function getDefaultIceLevelForProduct(
  product: Product,
  cupSize?: CupSize | null
): IceLevel {
  const fixedLevel = getFixedIceLevelForProduct(product)

  if (fixedLevel) {
    return fixedLevel
  }

  const allowedLevels = getProductAllowedIceLevels(product, cupSize)

  if (allowedLevels.includes('normal_ice')) {
    return 'normal_ice'
  }

  return allowedLevels[0] ?? 'normal_ice'
}

function getDefaultSugarLevelForProduct(product: Product): SugarLevel {
  const allowedLevels = getProductAllowedSugarLevels(product)

  if (allowedLevels.includes('normal')) {
    return 'normal'
  }

  return allowedLevels[0] ?? 'normal'
}

function isCustomizerSelectionValid() {
  if (!customizerProduct) return false

  const sizeIsValid =
    customizerCupSize !== null &&
    getProductAvailableSizes(customizerProduct).includes(customizerCupSize)

  const iceIsValid =
    !productAllowsIceCustomization(customizerProduct) ||
    (
      customizerIceLevel !== null &&
      getProductAllowedIceLevels(
        customizerProduct,
        customizerCupSize
      ).includes(customizerIceLevel)
    )

  const sugarIsValid =
    !productAllowsSugarCustomization(customizerProduct) ||
    (
      customizerSugarLevel !== null &&
      getProductAllowedSugarLevels(customizerProduct).includes(customizerSugarLevel)
    )

  return sizeIsValid && iceIsValid && sugarIsValid
}

function createDefaultCartItem(product: Product): CartItem {
  return {
    cartItemId: makeCartItemId(),
    product,
    quantity: 1,
    cupSize: getDefaultCupSizeForProduct(product),
    iceLevel: getDefaultIceLevelForProduct(
      product,
      getDefaultCupSizeForProduct(product)
    ),
    sugarLevel: getDefaultSugarLevelForProduct(product),
    toppings: [],
  }
}

function addToCart(productId: string) {
  const product = products.find((p) => String(p.id) === String(productId))
  if (!product) return

  if (!product.is_active || product.is_sold_out) {
    message = product.is_sold_out
      ? `${product.name} is uitverkocht.`
      : `${product.name} is momenteel niet beschikbaar.`
    render()
    return
  }

  if (product.product_type === 'item') {
    const existingItem = cart.find(
      (item) =>
        String(item.product.id) === String(productId) &&
        item.product.product_type === 'item'
    )

    if (existingItem) {
      existingItem.quantity += 1
    } else {
      cart.push(createDefaultCartItem(product))
    }

    saveCustomerState()
    render()
    return
  }

  if (screen === 'customer' || screen === 'pos') {
    openCustomerCustomizer(product)
    return
  }

  const existing = cart.find((item) => {
    return (
      String(item.product.id) === String(productId) &&
      item.cupSize === getDefaultCupSizeForProduct(product) &&
      item.iceLevel === 'normal_ice' &&
      item.sugarLevel === 'normal' &&
      item.toppings.length === 0
    )
  })

  if (existing) {
    existing.quantity += 1
  } else {
    cart.push(createDefaultCartItem(product))
  }

  render()
}

function decreaseQty(cartItemId: string) {
  const item = cart.find((cartItem) => cartItem.cartItemId === cartItemId)
  if (!item) return

  item.quantity -= 1

  if (item.quantity <= 0) {
    cart = cart.filter((cartItem) => cartItem.cartItemId !== cartItemId)
  }

  saveCustomerState()
  render()
}

function increaseQty(cartItemId: string) {
  const item = cart.find((cartItem) => cartItem.cartItemId === cartItemId)
  if (!item) return

  item.quantity += 1
  saveCustomerState()
  render()
}

function removeFromCart(cartItemId: string) {
  cart = cart.filter((item) => item.cartItemId !== cartItemId)
  saveCustomerState()
  render()
}

function getCartItemCount() {
  return cart.reduce((sum, item) => sum + item.quantity, 0)
}

function getToppingsTotal(item: CartItem) {
  return item.toppings.reduce((sum, topping) => sum + Number(topping.price), 0)
}

function normalizeDiscountType(value: unknown): DiscountType {
  if (value === 'percentage' || value === 'fixed') {
    return value
  }

  return 'none'
}

function getProductDiscount(product: Product) {
  const productDiscountType = normalizeDiscountType(product.discount_type)
  const productDiscountValue = Math.max(0, Number(product.discount_value ?? 0))

  // Een korting op het individuele product krijgt altijd voorrang.
  if (productDiscountType !== 'none' && productDiscountValue > 0) {
    return {
      type: productDiscountType,
      value: productDiscountValue,
      source: 'product' as const,
    }
  }

  const category = categories.find(
    (item) => item.name === product.category
  )

  const categoryDiscountType = normalizeDiscountType(category?.discount_type)
  const categoryDiscountValue = Math.max(
    0,
    Number(category?.discount_value ?? 0)
  )

  if (
    category &&
    categoryDiscountType !== 'none' &&
    categoryDiscountValue > 0
  ) {
    return {
      type: categoryDiscountType,
      value: categoryDiscountValue,
      source: 'category' as const,
    }
  }

  return {
    type: 'none' as DiscountType,
    value: 0,
    source: 'none' as const,
  }
}

function getDiscountedProductPrice(product: Product) {
  const originalPrice = Math.max(0, Number(product.base_price))
  const discount = getProductDiscount(product)

  if (discount.type === 'percentage') {
    const percentage = Math.min(100, discount.value)

    return Math.max(
      0,
      originalPrice - originalPrice * (percentage / 100)
    )
  }

  if (discount.type === 'fixed') {
    return Math.max(0, originalPrice - discount.value)
  }

  return originalPrice
}

function hasProductDiscount(product: Product) {
  return getDiscountedProductPrice(product) < Number(product.base_price)
}

function getProductDiscountLabel(product: Product) {
  const discount = getProductDiscount(product)

  if (discount.type === 'percentage') {
    return `${Math.min(100, discount.value)}% korting`
  }

  if (discount.type === 'fixed') {
    return `€ ${discount.value.toFixed(2)} korting`
  }

  return ''
}

function getDiscountSourceLabel(product: Product) {
  const discount = getProductDiscount(product)

  if (discount.source === 'category') {
    return 'Categoriekorting'
  }

  if (discount.source === 'product') {
    return 'Productkorting'
  }

  return ''
}

function getCartItemUnitPrice(item: CartItem) {
  const sizePrice = getProductSizePrice(item.product, item.cupSize)
  const discountedSizePrice =
    getDiscountedPriceForAmount(item.product, sizePrice)

  return discountedSizePrice + getToppingsTotal(item)
}


function calculateDiscountPreviewPrice(
  originalPrice: number,
  discountType: DiscountType,
  discountValue: number
) {
  const safePrice = Math.max(0, Number(originalPrice) || 0)
  const safeValue = Math.max(0, Number(discountValue) || 0)

  if (discountType === 'percentage') {
    const percentage = Math.min(100, safeValue)
    return Math.max(0, safePrice - safePrice * (percentage / 100))
  }

  if (discountType === 'fixed') {
    return Math.max(0, safePrice - safeValue)
  }

  return safePrice
}

function getDiscountInputSymbol(discountType: DiscountType) {
  if (discountType === 'percentage') return '%'
  if (discountType === 'fixed') return '€'
  return ''
}

function updateProductDiscountPreview() {
  const priceInput = document.querySelector<HTMLInputElement>('#admin-product-price')
  const typeInput = document.querySelector<HTMLSelectElement>('#admin-product-discount-type')
  const valueInput = document.querySelector<HTMLInputElement>('#admin-product-discount-value')
  const symbol = document.querySelector<HTMLElement>('#admin-product-discount-symbol')
  const preview = document.querySelector<HTMLElement>('#admin-product-discount-preview')
  const previewPrice = document.querySelector<HTMLElement>('#admin-product-preview-price')
  const previewText = document.querySelector<HTMLElement>('#admin-product-preview-text')

  if (!priceInput || !typeInput || !valueInput) return

  const type = normalizeDiscountType(typeInput.value)
  const originalPrice = Math.max(0, Number(priceInput.value || 0))
  const discountValue = Math.max(0, Number(valueInput.value || 0))

  if (symbol) {
    symbol.textContent = getDiscountInputSymbol(type)
  }

  valueInput.disabled = type === 'none'

  if (type === 'none') {
    if (preview) preview.classList.add('hidden')
    return
  }

  if (preview) preview.classList.remove('hidden')

  const finalPrice = calculateDiscountPreviewPrice(
    originalPrice,
    type,
    discountValue
  )

  if (previewPrice) {
    previewPrice.textContent = `€ ${finalPrice.toFixed(2)}`
  }

  if (previewText) {
    previewText.textContent =
      type === 'percentage'
        ? `${Math.min(100, discountValue)}% korting op € ${originalPrice.toFixed(2)}`
        : `€ ${discountValue.toFixed(2)} korting op € ${originalPrice.toFixed(2)}`
  }
}

function updateCategoryDiscountPreview() {
  const isEdit = Boolean(adminEditingCategoryId)

  const typeInput = document.querySelector<HTMLSelectElement>(
    isEdit
      ? '#admin-category-edit-discount-type'
      : '#admin-category-discount-type'
  )

  const valueInput = document.querySelector<HTMLInputElement>(
    isEdit
      ? '#admin-category-edit-discount-value'
      : '#admin-category-discount-value'
  )

  const symbol = document.querySelector<HTMLElement>(
    isEdit
      ? '#admin-category-edit-discount-symbol'
      : '#admin-category-discount-symbol'
  )

  const preview = document.querySelector<HTMLElement>(
    isEdit
      ? '#admin-category-edit-discount-preview'
      : '#admin-category-discount-preview'
  )

  const previewText = document.querySelector<HTMLElement>(
    isEdit
      ? '#admin-category-edit-preview-text'
      : '#admin-category-preview-text'
  )

  if (!typeInput || !valueInput) return

  const type = normalizeDiscountType(typeInput.value)
  const discountValue = Math.max(0, Number(valueInput.value || 0))

  if (symbol) {
    symbol.textContent = getDiscountInputSymbol(type)
  }

  valueInput.disabled = type === 'none'

  if (type === 'none') {
    if (preview) preview.classList.add('hidden')
    return
  }

  if (preview) preview.classList.remove('hidden')

  if (previewText) {
    previewText.textContent =
      type === 'percentage'
        ? `Alle producten in deze categorie krijgen ${Math.min(100, discountValue)}% korting.`
        : `Van alle producten in deze categorie gaat € ${discountValue.toFixed(2)} van de prijs af.`
  }
}

function getCartItemLineTotal(item: CartItem) {
  return getCartItemUnitPrice(item) * item.quantity
}

// =============================
// FISCAL / VAT HELPERS
// Prices in the POS are stored and shown including VAT.
// =============================

function roundMoney(value: number) {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100
}

function getProductVatRate(product: Product) {
  const rate = Number(product.vat_rate ?? 9)

  if (!Number.isFinite(rate) || rate < 0) {
    return 9
  }

  return rate
}

function getCartItemOriginalUnitPrice(item: CartItem) {
  const originalSizePrice = getProductSizePrice(item.product, item.cupSize)
  const toppingsTotal = getToppingsTotal(item)

  return roundMoney(originalSizePrice + toppingsTotal)
}

function getCartItemDiscountAmount(item: CartItem) {
  const originalUnitPrice = getCartItemOriginalUnitPrice(item)
  const finalUnitPrice = roundMoney(getCartItemUnitPrice(item))

  return roundMoney(Math.max(0, originalUnitPrice - finalUnitPrice))
}

function getCartItemTaxAmounts(item: CartItem) {
  const grossAmount = roundMoney(getCartItemLineTotal(item))
  const vatRate = getProductVatRate(item.product)

  const vatAmount =
    vatRate > 0
      ? roundMoney(grossAmount * (vatRate / (100 + vatRate)))
      : 0

  const netAmount = roundMoney(grossAmount - vatAmount)

  return {
    vatRate,
    grossAmount,
    vatAmount,
    netAmount,
  }
}

function getCartTaxTotals() {
  const totals = cart.reduce(
    (result, item) => {
      const amounts = getCartItemTaxAmounts(item)

      result.netTotal += amounts.netAmount
      result.vatTotal += amounts.vatAmount
      result.grossTotal += amounts.grossAmount

      return result
    },
    { netTotal: 0, vatTotal: 0, grossTotal: 0 }
  )

  return {
    netTotal: roundMoney(totals.netTotal),
    vatTotal: roundMoney(totals.vatTotal),
    grossTotal: roundMoney(totals.grossTotal),
  }
}

function getTotal() {
  return cart.reduce((sum, item) => sum + getCartItemLineTotal(item), 0)
}

const DISCOUNT_CATEGORY_KEY = '__discount__'
const DISCOUNT_CATEGORY_LABEL = 'Discount'

const BESTSELLER_CATEGORY_KEY = '__bestseller__'
const BESTSELLER_CATEGORY_LABEL = 'Best Seller'
const BESTSELLER_LIMIT = 5

const HOT_CATEGORY_KEY = '__hot__'
const HOT_CATEGORY_LABEL = 'Hot'

function isDiscountSystemCategory(category: Category) {
  return category.name.trim().toLowerCase() === DISCOUNT_CATEGORY_LABEL.toLowerCase()
}

function getDiscountSystemCategory() {
  return categories.find((category) => isDiscountSystemCategory(category)) ?? null
}


function isBestSellerSystemCategory(category: Category) {
  return category.name.trim().toLowerCase() === BESTSELLER_CATEGORY_LABEL.toLowerCase()
}

function getBestSellerSystemCategory() {
  return categories.find((category) => isBestSellerSystemCategory(category)) ?? null
}

function isHotSystemCategory(category: Category) {
  return category.name.trim().toLowerCase() === HOT_CATEGORY_LABEL.toLowerCase()
}

function getHotSystemCategory() {
  return categories.find((category) => isHotSystemCategory(category)) ?? null
}

function isProductAvailableHot(product: Product) {
  const fixedIceLevel = getFixedIceLevelForProduct(product)

  if (fixedIceLevel === 'warm') {
    return true
  }

  return (
    productAllowsIceCustomization(product) &&
    getProductAllowedIceLevels(product).includes('warm')
  )
}

function getHotProducts() {
  return products
    .filter((product) => isProductAvailableHot(product))
    .sort((a, b) => a.name.localeCompare(b.name))
}

async function ensureHotSystemCategory() {
  if (getHotSystemCategory()) {
    return
  }

  const maxSortOrder = categories.reduce((max, category) => {
    return Math.max(max, Number(category.sort_order ?? 0))
  }, 0)

  const { error } = await supabase
    .from('categories')
    .insert({
      name: HOT_CATEGORY_LABEL,
      is_active: true,
      discount_type: 'none',
      discount_value: 0,
      sort_order: maxSortOrder + 1,
    })

  if (error) {
    console.error('Hot categorie aanmaken mislukt:', error)
  }
}


async function ensureBestSellerSystemCategory() {
  if (getBestSellerSystemCategory()) {
    return
  }

  const maxSortOrder = categories.reduce((max, category) => {
    return Math.max(max, Number(category.sort_order ?? 0))
  }, 0)

  const { error } = await supabase
    .from('categories')
    .insert({
      name: BESTSELLER_CATEGORY_LABEL,
      is_active: true,
      discount_type: 'none',
      discount_value: 0,
      sort_order: maxSortOrder + 1,
    })

  if (error) {
    console.error('Best Seller categorie aanmaken mislukt:', error)
  }
}

async function ensureDiscountSystemCategory() {
  if (getDiscountSystemCategory()) {
    return
  }

  const maxSortOrder = categories.reduce((max, category) => {
    return Math.max(max, Number(category.sort_order ?? 0))
  }, 0)

  const { error } = await supabase
    .from('categories')
    .insert({
      name: DISCOUNT_CATEGORY_LABEL,
      is_active: true,
      discount_type: 'none',
      discount_value: 0,
      sort_order: maxSortOrder + 1,
    })

  if (error) {
    console.error('Discount categorie aanmaken mislukt:', error)
  }
}

function getTeaTypeBadgeClass(teaType: string | null | undefined) {
  if (!teaType) return ''

  const normalized = teaType.trim().toLowerCase()

  if (normalized === 'jasmine tea') return 'tea-type-jasmine'
  if (normalized === 'longjing tea') return 'tea-type-longjing'
  if (normalized === 'oolong tea') return 'tea-type-oolong'
  if (normalized === 'black tea') return 'tea-type-black'
  if (normalized === 'green tea') return 'tea-type-green'
  if (normalized === 'white tea') return 'tea-type-white'
  if (normalized === 'earl grey') return 'tea-type-earl-grey'
  if (normalized === 'matcha') return 'tea-type-matcha'

  return 'tea-type-default'
}

function getCategoryDisplayName(categoryKey: string) {
  if (categoryKey === DISCOUNT_CATEGORY_KEY) {
    return DISCOUNT_CATEGORY_LABEL
  }

  if (categoryKey === BESTSELLER_CATEGORY_KEY) {
    return BESTSELLER_CATEGORY_LABEL
  }

  if (categoryKey === HOT_CATEGORY_KEY) {
    return HOT_CATEGORY_LABEL
  }

  return categoryKey
}


function getDiscountedProducts() {
  return products
    .filter((product) => hasProductDiscount(product))
    .sort((a, b) => {
      const discountA =
        Number(a.base_price) - getDiscountedProductPrice(a)

      const discountB =
        Number(b.base_price) - getDiscountedProductPrice(b)

      if (discountB !== discountA) {
        return discountB - discountA
      }

      return a.name.localeCompare(b.name)
    })
}


function getBestSellerProducts() {
  return products
    .filter((product) => product.is_bestseller === true)
    .sort((a, b) => a.name.localeCompare(b.name))
}

function getBestSellerSoldCount(productId: string) {
  return Number(bestSellerSales[String(productId)] ?? 0)
}

function groupProductsByCategory() {
  const grouped: Record<string, Product[]> = {}
  for (const product of products) {
    // Normale categorie blijft altijd bestaan.
    if (!grouped[product.category]) {
      grouped[product.category] = []
    }

    grouped[product.category].push(product)

  }

  const discountedProducts = getDiscountedProducts()
  const discountCategory = getDiscountSystemCategory()

  if (
    discountCategory?.is_active &&
    discountedProducts.length > 0
  ) {
    grouped[DISCOUNT_CATEGORY_KEY] = discountedProducts
  }

  const bestSellerProducts = getBestSellerProducts()
  const bestSellerCategory = getBestSellerSystemCategory()

  if (
    bestSellerCategory?.is_active &&
    bestSellerProducts.length > 0
  ) {
    grouped[BESTSELLER_CATEGORY_KEY] = bestSellerProducts
  }

  const hotProducts = getHotProducts()
  const hotCategory = getHotSystemCategory()

  if (
    hotCategory?.is_active &&
    hotProducts.length > 0
  ) {
    grouped[HOT_CATEGORY_KEY] = hotProducts
  }

  return grouped
}


// =============================
// CUSTOMER: LANGUAGE
// NL / EN / CN for customer QR flow
// =============================

type TranslationKey = keyof typeof translations.nl

function t(key: TranslationKey) {
  return translations[customerLanguage][key]
}

function setCustomerLanguage(language: CustomerLanguage) {
  customerLanguage = language
  sessionStorage.setItem(CUSTOMER_LANGUAGE_KEY, language)
  render()
}

function getIceLevelText(level?: IceLevel | null) {
  if (!level) {
    return ICE_LEVEL_LABELS[customerLanguage].normal_ice
  }

  return ICE_LEVEL_LABELS[customerLanguage][level]
}

function getSugarLevelText(level?: SugarLevel | null) {
  if (!level) {
    return SUGAR_LEVEL_LABELS[customerLanguage].normal
  }

  return SUGAR_LEVEL_LABELS[customerLanguage][level]
}

function renderCustomerLanguageSwitcher() {
  return `
    <div class="customer-language-switcher" aria-label="Language">
      <button
        class="customer-language-btn ${customerLanguage === 'nl' ? 'active' : ''}"
        data-customer-language="nl"
        type="button"
      >
        NL
      </button>
      <button
        class="customer-language-btn ${customerLanguage === 'en' ? 'active' : ''}"
        data-customer-language="en"
        type="button"
      >
        EN
      </button>
      <button
        class="customer-language-btn ${customerLanguage === 'cn' ? 'active' : ''}"
        data-customer-language="cn"
        type="button"
      >
        中文
      </button>
    </div>
  `
}


// =============================
// CUSTOMER: PRODUCT CUSTOMIZER
// Ice level, sugar level and toppings per drink
// =============================

function openCustomerCustomizer(product: Product) {
  editingCartItemId = null
  customizerProduct = product
  customizerCupSize = getDefaultCupSizeForProduct(product)

  customizerIceLevel = productAllowsIceCustomization(product)
    ? null
    : getDefaultIceLevelForProduct(product, customizerCupSize)

  customizerSugarLevel = productAllowsSugarCustomization(product)
    ? null
    : getDefaultSugarLevelForProduct(product)

  customizerToppingIds = []
  isCustomerCustomizerOpen = true
  isCustomerCartOpen = false
  isCustomerCheckoutOpen = false
  render()
}

function editCustomerCartItem(cartItemId: string) {
  const item = cart.find((cartItem) => cartItem.cartItemId === cartItemId)
  if (!item) return

  editingCartItemId = cartItemId
  customizerProduct = item.product
  customizerCupSize = getSafeCupSizeForProduct(item.product, item.cupSize)

  const allowedIceLevels = getProductAllowedIceLevels(
    item.product,
    customizerCupSize
  )
  const allowedSugarLevels = getProductAllowedSugarLevels(item.product)

  customizerIceLevel = productAllowsIceCustomization(item.product)
    ? allowedIceLevels.includes(item.iceLevel)
      ? item.iceLevel
      : null
    : getDefaultIceLevelForProduct(item.product, customizerCupSize)

  customizerSugarLevel = productAllowsSugarCustomization(item.product)
    ? allowedSugarLevels.includes(item.sugarLevel)
      ? item.sugarLevel
      : null
    : getDefaultSugarLevelForProduct(item.product)

  customizerToppingIds = item.toppings.map((topping) => String(topping.id))

  isCustomerCartOpen = false
  isCustomerCheckoutOpen = false
  isCustomerCustomizerOpen = true
  render()
}

function closeCustomerCustomizer() {
  const wasEditing = editingCartItemId !== null

  isCustomerCustomizerOpen = false
  customizerProduct = null
  customizerCupSize = null
  customizerIceLevel = null
  customizerSugarLevel = null
  customizerToppingIds = []
  editingCartItemId = null

  if (wasEditing && screen === 'customer') {
    isCustomerCartOpen = true
  }

  render()
}


function setCustomizerCupSize(size: CupSize) {
  if (!customizerProduct) return
  if (!getProductAvailableSizes(customizerProduct).includes(size)) return

  customizerCupSize = size

  if (productAllowsIceCustomization(customizerProduct)) {
    const allowedIceLevels = getProductAllowedIceLevels(
      customizerProduct,
      size
    )

    if (
      customizerIceLevel &&
      !allowedIceLevels.includes(customizerIceLevel)
    ) {
      customizerIceLevel = null
    }
  } else {
    customizerIceLevel = getDefaultIceLevelForProduct(
      customizerProduct,
      size
    )
  }

  render()
}

function setCustomizerIceLevel(level: IceLevel) {
  if (!customizerProduct) return
  if (!productAllowsIceCustomization(customizerProduct)) return
  if (
    !getProductAllowedIceLevels(
      customizerProduct,
      customizerCupSize
    ).includes(level)
  ) {
    return
  }

  customizerIceLevel = level
  render()
}

function setCustomizerSugarLevel(level: SugarLevel) {
  if (!customizerProduct) return
  if (!productAllowsSugarCustomization(customizerProduct)) return
  if (!getProductAllowedSugarLevels(customizerProduct).includes(level)) return

  customizerSugarLevel = level
  render()
}

function toggleCustomizerTopping(toppingId: string) {
  if (customizerToppingIds.includes(toppingId)) {
    customizerToppingIds = customizerToppingIds.filter((id) => id !== toppingId)
  } else {
    customizerToppingIds.push(toppingId)
  }

  render()
}

function getCustomizerSelectedToppings(): SelectedTopping[] {
  if (!customizerProduct) return []

  const allowedToppings = getAllowedToppingsForProduct(customizerProduct.id)

  return allowedToppings
    .filter((topping) => customizerToppingIds.includes(String(topping.id)))
    .map((topping) => ({
      id: String(topping.id),
      name: topping.name,
      price: Number(topping.price),
    }))
}

function getCustomizerTotal() {
  if (!customizerProduct) return 0

  const toppingsTotal = getCustomizerSelectedToppings().reduce(
    (sum, topping) => sum + topping.price,
    0
  )

  const selectedSize =
    customizerCupSize ?? getDefaultCupSizeForProduct(customizerProduct)

  return getCustomizerCupSizePrice(selectedSize) + toppingsTotal
}

function confirmCustomerCustomizer() {
  if (!customizerProduct) return
  if (!isCustomizerSelectionValid()) return

  const finalIceLevel =
    customizerIceLevel ??
    getDefaultIceLevelForProduct(customizerProduct, customizerCupSize)

  const finalSugarLevel =
    customizerSugarLevel ?? getDefaultSugarLevelForProduct(customizerProduct)

  const finalCupSize =
    customizerCupSize ?? getDefaultCupSizeForProduct(customizerProduct)

  const selectedToppings = getCustomizerSelectedToppings()
  const wasEditing = editingCartItemId !== null

  if (editingCartItemId) {
    const item = cart.find((cartItem) => cartItem.cartItemId === editingCartItemId)

    if (item) {
      item.product = customizerProduct
      item.cupSize = finalCupSize
      item.iceLevel = finalIceLevel
      item.sugarLevel = finalSugarLevel
      item.toppings = selectedToppings
    }
  } else {
    const item: CartItem = {
      cartItemId: makeCartItemId(),
      product: customizerProduct,
      quantity: 1,
      cupSize: finalCupSize,
      iceLevel: finalIceLevel,
      sugarLevel: finalSugarLevel,
      toppings: selectedToppings,
    }

    cart.push(item)
  }

  isCustomerCustomizerOpen = false
  customizerProduct = null
  customizerCupSize = null
  customizerIceLevel = null
  customizerSugarLevel = null
  customizerToppingIds = []
  editingCartItemId = null
  isCustomerCartOpen = wasEditing && screen === 'customer'

  saveCustomerState()
  render()
}

function renderModifierSummary(
  iceLevel?: IceLevel | null,
  sugarLevel?: SugarLevel | null,
  selectedToppings?: SelectedTopping[] | null,
  cupSize?: CupSize | null
) {
  const toppingText = (selectedToppings ?? []).map((topping) => topping.name).join(', ')

  return `
    <div class="modifier-summary">
      ${cupSize ? `<span>${escapeHtml(getCupSizeLabel(cupSize))}</span>` : ''}
      <span>${escapeHtml(getIceLevelText(iceLevel))}</span>
      <span>${escapeHtml(getSugarLevelText(sugarLevel))}</span>
      ${toppingText ? `<span>+ ${escapeHtml(toppingText)}</span>` : ''}
    </div>
  `
}


// =============================
// CUSTOMER: CART AND CHECKOUT UI STATE
// =============================

function openCustomerCart() {
  isCustomerCartOpen = true
  isCustomerCheckoutOpen = false
  saveCustomerState()
  render()
}

function closeCustomerCart() {
  isCustomerCartOpen = false
  saveCustomerState()
  render()
}

function openCustomerCheckout() {
  if (cart.length === 0) return

  isCustomerCartOpen = false
  isCustomerCheckoutOpen = true
  message = ''
  saveCustomerState()
  render()
}

function closeCustomerCheckout() {
  isCustomerCheckoutOpen = false
  saveCustomerState()
  render()
}

function backToCustomerCartFromCheckout() {
  isCustomerCheckoutOpen = false
  isCustomerCartOpen = true
  saveCustomerState()
  render()
}

function setCustomerPaymentMethod(method: PaymentMethod) {
  customerPaymentMethod = method
  saveCustomerState()
  render()
}


// =============================
// ORDER HELPERS: NUMBERS AND CODES
// =============================

function makeOrderNumber() {
  const now = new Date()
  const yyyy = now.getFullYear()
  const mm = String(now.getMonth() + 1).padStart(2, '0')
  const dd = String(now.getDate()).padStart(2, '0')
  const hh = String(now.getHours()).padStart(2, '0')
  const mi = String(now.getMinutes()).padStart(2, '0')
  const ss = String(now.getSeconds()).padStart(2, '0')

  return `ORD-${yyyy}${mm}${dd}-${hh}${mi}${ss}`
}

function makePickupCode() {
  const number = Math.floor(100 + Math.random() * 900)
  return `P${number}`
}


// =============================
// STAFF POS: CHECKOUT
// =============================

async function submitOrder(paymentMethod: PaymentMethod) {
  if (cart.length === 0 || isSubmitting) return

  // Als kasregistratie aan staat, is voor cash een open kassasessie verplicht.
  // Als kasregistratie uit staat, mag cash zonder kassasessie en wordt er
  // geen cash_movement aan een kassasessie gekoppeld.
  let cashSessionForSale: CashSession | null = null

  if (paymentMethod === 'cash') {
    const { data: settingsData, error: settingsError } = await supabase
      .from('shop_settings')
      .select('cash_registration_enabled')
      .eq('id', 1)
      .maybeSingle()

    if (settingsError) {
      message = `Kasregistratie-instelling controleren mislukt: ${settingsError.message}`
      render()
      return
    }

    cashRegistrationEnabled =
      settingsData?.cash_registration_enabled ?? true

    if (cashRegistrationEnabled) {
      const { data: cashSessionData, error: cashSessionError } = await supabase
        .from('cash_sessions')
        .select('*')
        .eq('status', 'open')
        .order('opened_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (cashSessionError) {
        message = `Open kas controleren mislukt: ${cashSessionError.message}`
        render()
        return
      }

      if (!cashSessionData) {
        window.alert('Open eerst de kas in Admin voordat je contant afrekent, of zet kasregistratie uit bij Dagafsluiting.')
        return
      }

      cashSessionForSale = cashSessionData as CashSession
    }
  }

  isSubmitting = true
  message = ''
  render()

  const taxTotals = getCartTaxTotals()
  const total = taxTotals.grossTotal
  const orderNumber = makeOrderNumber()
  const now = new Date().toISOString()

  const { data: orderData, error: orderError } = await supabase
    .from('orders')
    .insert({
      order_number: orderNumber,
      status: 'new',
      order_type: 'staff',
      channel: 'pos',
      subtotal: total,
      total: total,
      net_total: taxTotals.netTotal,
      vat_total: taxTotals.vatTotal,
      gross_total: taxTotals.grossTotal,
      payment_status: 'paid',
      payment_method: paymentMethod,
      paid_at: now,
    })
    .select()
    .single()

  if (orderError) {
    isSubmitting = false
    message = `Fout bij opslaan order: ${orderError.message}`
    render()
    return
  }

  const orderItemsPayload = cart.map((item) => {
    const tax = getCartItemTaxAmounts(item)
    const discount = getProductDiscount(item.product)

    return {
      order_id: orderData.id,
      product_id: item.product.id,
      product_name: item.product.name,
      product_name_snapshot: item.product.name,
      original_unit_price: getCartItemOriginalUnitPrice(item),
      unit_price: roundMoney(getCartItemUnitPrice(item)),
      discount_type_snapshot: discount.type,
      discount_value_snapshot: roundMoney(discount.value),
      discount_amount: roundMoney(
        getCartItemDiscountAmount(item) * item.quantity
      ),
      quantity: item.quantity,
      line_total: tax.grossAmount,
      vat_rate: tax.vatRate,
      net_amount: tax.netAmount,
      vat_amount: tax.vatAmount,
      gross_amount: tax.grossAmount,
      cup_size: item.cupSize,
      ice_level: item.iceLevel,
      sugar_level: item.sugarLevel,
      toppings: item.toppings,
    }
  })

  const { data: savedOrderItems, error: itemsError } = await supabase
    .from('order_items')
    .insert(orderItemsPayload)
    .select()

  if (itemsError) {
    isSubmitting = false
    message = `Fout bij opslaan orderregels: ${itemsError.message}`
    render()
    return
  }

  const paymentAmountCents = Math.max(0, Math.round(total * 100))

  const { data: paymentRecord, error: paymentRecordError } = await supabase
    .from('payments')
    .insert({
      order_id: orderData.id,
      provider: 'pos',
      provider_order_id: `POS-${orderNumber}`,
      amount: paymentAmountCents,
      currency: 'EUR',
      status: 'paid',
      payment_method: paymentMethod,
      payment_url: null,
      failure_reason: null,
      paid_at: now,
    })
    .select('*')
    .single()

  if (paymentRecordError) {
    console.error('POS payment-record opslaan mislukt:', paymentRecordError)
  }

  // Bij een cashbetaling registreren we de geldbeweging in de open kas.
  if (paymentMethod === 'cash' && cashSessionForSale) {
    if (!paymentRecord) {
      console.error('Cash movement niet opgeslagen: payment-record ontbreekt.')
    } else {
      const { error: cashMovementError } = await supabase
        .from('cash_movements')
        .insert({
          cash_session_id: cashSessionForSale.id,
          movement_type: 'sale',
          amount: paymentAmountCents,
          order_id: orderData.id,
          payment_id: paymentRecord.id,
          reason: `Contante verkoop ${orderNumber}`,
          actor: 'staff',
        })

      if (cashMovementError) {
        console.error('Cash movement opslaan mislukt:', cashMovementError)
      }
    }
  }

  const labelError = await createKitchenLabelsForOrder(
    orderData.id,
    orderNumber,
    savedOrderItems as OrderItem[]
  )

  if (labelError) {
    isSubmitting = false
    message = `Order betaald, maar labels maken mislukt: ${labelError}`
    render()
    return
  }

  cart = []
  isSubmitting = false
  message = `Bestelling betaald met ${paymentMethod} en opgeslagen als ${orderNumber}`
  render()
}


// =============================
// CUSTOMER: SUBMIT ORDER
// =============================

async function submitCustomerOrder() {
  if (cart.length === 0 || isSubmitting) return

  const cleanCustomerName = customerName.trim()
  const cleanCustomerPhone = customerPhone.trim()

  if (!cleanCustomerName) {
    message = t('nameRequired')
    render()
    return
  }

  if (!cleanCustomerPhone) {
    message = t('phoneRequired')
    render()
    return
  }

  isSubmitting = true
  message = ''
  render()

  const taxTotals = getCartTaxTotals()
  const total = taxTotals.grossTotal
  const orderNumber = makeOrderNumber()
  const pickupCode = makePickupCode()
  const now = new Date().toISOString()
  const customerSessionId = getCustomerSessionId()

  const paymentStatus: PaymentStatus =
    customerPaymentMethod === 'online_fake' ? 'pending' : 'unpaid'

  const paidAt = null

  const { data: orderData, error: orderError } = await supabase
    .from('orders')
    .insert({
      order_number: orderNumber,
      status: 'new',
      order_type: 'customer',
      channel: 'qr',
      subtotal: total,
      total: total,
      net_total: taxTotals.netTotal,
      vat_total: taxTotals.vatTotal,
      gross_total: taxTotals.grossTotal,
      payment_status: paymentStatus,
      payment_method: customerPaymentMethod,
      paid_at: paidAt,
      customer_session_id: customerSessionId,
      pickup_code: pickupCode,
      customer_name: cleanCustomerName,
      customer_phone: cleanCustomerPhone,
    })
    .select()
    .single()

  if (orderError) {
    isSubmitting = false
    message = `Bestelling plaatsen mislukt: ${orderError.message}`
    render()
    return
  }

  const orderItemsPayload = cart.map((item) => {
    const tax = getCartItemTaxAmounts(item)
    const discount = getProductDiscount(item.product)

    return {
      order_id: orderData.id,
      product_id: item.product.id,
      product_name: item.product.name,
      product_name_snapshot: item.product.name,
      original_unit_price: getCartItemOriginalUnitPrice(item),
      unit_price: roundMoney(getCartItemUnitPrice(item)),
      discount_type_snapshot: discount.type,
      discount_value_snapshot: roundMoney(discount.value),
      discount_amount: roundMoney(
        getCartItemDiscountAmount(item) * item.quantity
      ),
      quantity: item.quantity,
      line_total: tax.grossAmount,
      vat_rate: tax.vatRate,
      net_amount: tax.netAmount,
      vat_amount: tax.vatAmount,
      gross_amount: tax.grossAmount,
      cup_size: item.cupSize,
      ice_level: item.iceLevel,
      sugar_level: item.sugarLevel,
      toppings: item.toppings,
    }
  })

  const { data: savedOrderItems, error: itemsError } = await supabase
    .from('order_items')
    .insert(orderItemsPayload)
    .select()

  if (itemsError) {
    isSubmitting = false
    message = `Order gemaakt, maar orderregels opslaan mislukt: ${itemsError.message}`
    render()
    return
  }

  const labelError = await createKitchenLabelsForOrder(
    orderData.id,
    orderNumber,
    savedOrderItems as OrderItem[]
  )

  if (labelError) {
    isSubmitting = false
    message = `Order betaald, maar kitchen labels maken mislukt: ${labelError}`
    render()
    return
  }

  let createdPayment: Payment | null = null

  if (customerPaymentMethod === 'online_fake') {
    try {
      createdPayment = await createTestMultisafepayPayment(
        String(orderData.id),
        orderNumber,
        total
      )
    } catch (error) {
      isSubmitting = false
      message =
        error instanceof Error
          ? error.message
          : 'Payment aanmaken mislukt.'
      render()
      return
    }
  }

  cart = []
  customerOrderId = orderData.id
  customerPickupCode = pickupCode
  customerOrderStatus = 'new'
  customerOrderPlaced = true
  isCustomerCartOpen = false
  isCustomerCheckoutOpen = false
  isSubmitting = false

  saveCustomerState()

  if (createdPayment) {
    await goToPaymentTest(createdPayment.id)
    return
  }

  await loadCustomerOrderProgress(false)
  startCustomerProgressRefresh()
  render()
}


// =============================
// PAYMENTS: MULTISAFEPAY PREPARATION
// Voorlopig nog een lokale simulator.
// Kitchen-label gedrag blijft voor nu hetzelfde.
// =============================

function getPaymentTestIdFromUrl() {
  const currentParams = new URLSearchParams(window.location.search)
  return currentParams.get('payment') || ''
}

function formatPaymentAmount(amountInCents: number) {
  return `€ ${(Number(amountInCents || 0) / 100).toFixed(2)}`
}

function getPaymentTestStatusText(status?: PaymentRecordStatus | null) {
  if (status === 'paid') return 'Betaling geslaagd'
  if (status === 'failed') return 'Betaling mislukt'
  if (status === 'cancelled') return 'Betaling geannuleerd'
  if (status === 'refunded') return 'Terugbetaald'
  return 'Wacht op betaling'
}

function getPaymentTestStatusClass(status?: PaymentRecordStatus | null) {
  if (status === 'paid') return 'payment-test-status-paid'
  if (status === 'failed') return 'payment-test-status-failed'
  if (status === 'cancelled') return 'payment-test-status-cancelled'
  if (status === 'refunded') return 'payment-test-status-refunded'
  return 'payment-test-status-pending'
}

async function createTestMultisafepayPayment(
  orderId: string,
  orderNumber: string,
  total: number
) {
  const amountInCents = Math.max(0, Math.round(total * 100))

  const { data, error } = await supabase
    .from('payments')
    .insert({
      order_id: orderId,
      provider: 'multisafepay',
      provider_order_id: `MSP-TEST-${orderNumber}`,
      amount: amountInCents,
      currency: 'EUR',
      status: 'pending',
      payment_method: 'online_fake',
      payment_url: null,
      failure_reason: null,
    })
    .select('*')
    .single()

  if (error) {
    throw new Error(`Payment aanmaken mislukt: ${error.message}`)
  }

  return data as Payment
}

async function loadPaymentTestData(showLoading = true) {
  const paymentId = getPaymentTestIdFromUrl()

  if (!paymentId) {
    isLoadingPaymentTest = false
    paymentTestPayment = null
    paymentTestOrder = null
    paymentTestError = 'Geen payment-id gevonden in de URL.'
    render()
    return
  }

  if (showLoading) {
    isLoadingPaymentTest = true
    paymentTestError = ''
    render()
  }

  const { data: paymentData, error: paymentError } = await supabase
    .from('payments')
    .select('*')
    .eq('id', paymentId)
    .maybeSingle()

  if (paymentError) {
    isLoadingPaymentTest = false
    paymentTestPayment = null
    paymentTestOrder = null
    paymentTestError = `Payment laden mislukt: ${paymentError.message}`
    render()
    return
  }

  if (!paymentData) {
    isLoadingPaymentTest = false
    paymentTestPayment = null
    paymentTestOrder = null
    paymentTestError = 'Deze betaling bestaat niet.'
    render()
    return
  }

  paymentTestPayment = paymentData as Payment

  const { data: orderData, error: orderError } = await supabase
    .from('orders')
    .select('*')
    .eq('id', paymentTestPayment.order_id)
    .maybeSingle()

  if (orderError) {
    isLoadingPaymentTest = false
    paymentTestOrder = null
    paymentTestError = `Order bij betaling laden mislukt: ${orderError.message}`
    render()
    return
  }

  paymentTestOrder = orderData ? (orderData as Order) : null
  paymentTestError = ''
  isLoadingPaymentTest = false
  render()
}

async function updatePaymentTestStatus(nextStatus: PaymentRecordStatus) {
  if (!paymentTestPayment || isUpdatingPaymentTest) return

  isUpdatingPaymentTest = true
  paymentTestError = ''
  render()

  const now = new Date().toISOString()

  const paymentUpdate: Record<string, string | null> = {
    status: nextStatus,
    updated_at: now,
    failure_reason: null,
  }

  if (nextStatus === 'paid') {
    paymentUpdate.paid_at = now
    paymentUpdate.failed_at = null
  }

  if (nextStatus === 'failed') {
    paymentUpdate.failed_at = now
    paymentUpdate.paid_at = null
    paymentUpdate.failure_reason = 'Gesimuleerde mislukte betaling'
  }

  if (nextStatus === 'cancelled') {
    paymentUpdate.failed_at = null
    paymentUpdate.paid_at = null
    paymentUpdate.failure_reason = 'Betaling geannuleerd in simulator'
  }

  if (nextStatus === 'pending') {
    paymentUpdate.failed_at = null
    paymentUpdate.paid_at = null
  }

  const { error: paymentError } = await supabase
    .from('payments')
    .update(paymentUpdate)
    .eq('id', paymentTestPayment.id)

  if (paymentError) {
    isUpdatingPaymentTest = false
    paymentTestError = `Paymentstatus aanpassen mislukt: ${paymentError.message}`
    render()
    return
  }

  const orderPaymentStatus: PaymentStatus =
    nextStatus === 'paid'
      ? 'paid'
      : nextStatus === 'failed'
        ? 'failed'
        : nextStatus === 'cancelled'
          ? 'cancelled'
          : nextStatus === 'refunded'
            ? 'refunded'
            : 'pending'

  const orderUpdate: Record<string, string | null> = {
    payment_status: orderPaymentStatus,
  }

  if (nextStatus === 'paid') {
    orderUpdate.paid_at = now
  } else {
    orderUpdate.paid_at = null
  }

  const { error: orderError } = await supabase
    .from('orders')
    .update(orderUpdate)
    .eq('id', paymentTestPayment.order_id)

  if (orderError) {
    isUpdatingPaymentTest = false
    paymentTestError = `Order-betaalstatus aanpassen mislukt: ${orderError.message}`
    render()
    return
  }

  isUpdatingPaymentTest = false
  await loadPaymentTestData(false)
}

async function goToPaymentTest(paymentId: string) {
  stopAutoRefresh()
  stopCustomerProgressRefresh()
  removeCustomerScrollListeners()

  screen = 'payment-test'
  message = ''
  paymentTestError = ''

  const url = new URL(window.location.href)
  url.searchParams.set('mode', 'payment-test')
  url.searchParams.set('payment', paymentId)
  window.history.pushState({ screen: 'payment-test' }, '', url)

  await loadPaymentTestData()
}

async function returnFromPaymentTestToCustomer() {
  stopAutoRefresh()
  stopCustomerProgressRefresh()
  removeCustomerScrollListeners()

  screen = 'customer'
  message = ''

  const url = new URL(window.location.href)
  url.searchParams.set('mode', 'customer')
  url.searchParams.delete('payment')
  window.history.pushState({ screen: 'customer' }, '', url)

  if (customerOrderId) {
    await loadCustomerOrderProgress(false)
    startCustomerProgressRefresh()
  }

  render()
}



// =============================
// KITCHEN: LABEL CREATION
// =============================

async function createKitchenLabelsForOrder(
  orderId: string,
  orderNumber: string,
  savedItems: OrderItem[]
) {
  const labels = []

  for (const item of savedItems) {
    const sourceProduct = products.find(
      (product) => String(product.id) === String(item.product_id)
    )

    if (sourceProduct?.product_type === 'item') {
      continue
    }

    const quantity = Number(item.quantity ?? 1)
    const productName =
      item.product_name_snapshot ||
      item.product_name ||
      'Onbekend product'

    for (let i = 1; i <= quantity; i++) {
      labels.push({
        order_id: String(orderId),
        order_item_id: item.id ? String(item.id) : null,
        product_id: item.product_id ? String(item.product_id) : null,
        order_number: orderNumber,
        product_name: productName,
        status: 'new',
        label_index: i,
        cup_size: item.cup_size || null,
        ice_level: item.ice_level || null,
        sugar_level: item.sugar_level || null,
        toppings: item.toppings || [],
        print_status: 'pending',
        print_attempts: 0,
        printed_at: null,
        print_error: null,
      })
    }
  }

  if (labels.length === 0) {
    return null
  }

  const { error } = await supabase
    .from('kitchen_labels')
    .insert(labels)

  if (error) {
    console.error('Kitchen labels maken mislukt:', error)
    return error.message
  }

  return null
}


// =============================
// ORDERS: STATUS UPDATES
// =============================

async function cancelOrderWithAudit(orderId: string) {
  const currentOrder = orders.find(
    (order) => String(order.id) === String(orderId)
  )

  if (!currentOrder) {
    message = 'Order niet gevonden.'
    render()
    return
  }

  if (currentOrder.status === 'cancelled') {
    message = 'Deze order is al geannuleerd.'
    render()
    return
  }

  const reasonInput = window.prompt(
    'Waarom wordt deze bestelling geannuleerd?\n\nVul een korte reden in.'
  )

  if (reasonInput === null) {
    return
  }

  const reason = reasonInput.trim()

  if (!reason) {
    message = 'Annuleren gestopt: een reden is verplicht.'
    render()
    return
  }

  const now = new Date().toISOString()
  const actor = 'staff'
  const previousStatus = currentOrder.status

  const { error: orderError } = await supabase
    .from('orders')
    .update({
      status: 'cancelled',
      cancelled_at: now,
      cancel_reason: reason,
      cancelled_by: actor,
      updated_at: now,
    })
    .eq('id', orderId)

  if (orderError) {
    message = `Order annuleren mislukt: ${orderError.message}`
    render()
    return
  }

  // Zorg dat kitchen labels niet later de orderstatus opnieuw veranderen.
  const { error: labelError } = await supabase
    .from('kitchen_labels')
    .update({
      status: 'cancelled',
      cancelled_at: now,
    })
    .eq('order_id', orderId)
    .neq('status', 'cancelled')

  if (labelError) {
    console.error('Kitchen labels annuleren mislukt:', labelError)
  }

  const { error: auditError } = await supabase
    .from('audit_logs')
    .insert({
      event_type: 'ORDER_CANCELLED',
      entity_type: 'order',
      entity_id: orderId,
      old_data: {
        status: previousStatus,
      },
      new_data: {
        status: 'cancelled',
        cancelled_at: now,
        cancel_reason: reason,
        cancelled_by: actor,
      },
      reason,
      actor,
    })

  if (auditError) {
    console.error('Auditlog opslaan mislukt:', auditError)
    message = `Order is geannuleerd, maar auditlog opslaan mislukte: ${auditError.message}`
  } else if (labelError) {
    message = 'Order is geannuleerd. Let op: kitchen labels konden niet allemaal worden bijgewerkt.'
  } else {
    message = 'Order geannuleerd en auditlog opgeslagen.'
  }

  if (screen === 'orders') {
    await loadOrders()
  } else {
    render()
  }
}

async function updateOrderStatus(orderId: string, nextStatus: OrderStatus) {
  if (nextStatus === 'cancelled') {
    await cancelOrderWithAudit(orderId)
    return
  }

  const currentOrder = orders.find(
    (order) => String(order.id) === String(orderId)
  )

  // Als een READY-order teruggaat naar PREPARING,
  // moeten de kitchen labels ook terug naar preparing.
  // Anders zou de kitchen-sync de order opnieuw op READY kunnen zetten.
  if (currentOrder?.status === 'ready' && nextStatus === 'preparing') {
    const now = new Date().toISOString()

    const { error: labelError } = await supabase
      .from('kitchen_labels')
      .update({
        status: 'preparing',
        started_at: now,
        done_at: null,
      })
      .eq('order_id', orderId)
      .eq('status', 'done')

    if (labelError) {
      message = `Terugzetten naar voorbereiding mislukt: ${labelError.message}`
      render()
      return
    }
  }

  const updateData: Record<string, string | null> = {
    status: nextStatus,
    updated_at: new Date().toISOString(),
  }

  if (nextStatus === 'completed') {
    updateData.completed_at = new Date().toISOString()
  } else {
    updateData.completed_at = null
  }

  updateData.cancelled_at = null

  const { error } = await supabase
    .from('orders')
    .update(updateData)
    .eq('id', orderId)

  if (error) {
    message = `Status aanpassen mislukt: ${error.message}`
    render()
    return
  }

  message =
    currentOrder?.status === 'ready' && nextStatus === 'preparing'
      ? 'Order teruggezet naar voorbereiding.'
      : currentOrder?.status === 'completed' && nextStatus === 'ready'
        ? 'Order teruggezet naar pickup.'
        : `Order status aangepast naar ${nextStatus}`

  if (screen === 'orders') {
    await loadOrders()
  }
}


// =============================
// KITCHEN: LABEL STATUS AND ORDER SYNC
// =============================

async function syncOrderStatusFromLabels(orderId: string) {
  const { data, error } = await supabase
    .from('kitchen_labels')
    .select('status')
    .eq('order_id', orderId)

  if (error) {
    console.error('Labels ophalen voor order sync mislukt:', error)
    return
  }

  const labels = data ?? []

  if (labels.length === 0) {
    return
  }

  const allDone = labels.every((label) => label.status === 'done')
  const allCancelled = labels.every((label) => label.status === 'cancelled')
  const hasPreparing = labels.some((label) => label.status === 'preparing')
  const hasDone = labels.some((label) => label.status === 'done')

  let nextOrderStatus: OrderStatus = 'new'

  if (allCancelled) {
    nextOrderStatus = 'cancelled'
  } else if (allDone) {
    nextOrderStatus = 'ready'
  } else if (hasPreparing || hasDone) {
    nextOrderStatus = 'preparing'
  }

  const updateData: Record<string, string> = {
    status: nextOrderStatus,
    updated_at: new Date().toISOString(),
  }

  if (nextOrderStatus === 'cancelled') {
    updateData.cancelled_at = new Date().toISOString()
  }

  const { error: orderError } = await supabase
    .from('orders')
    .update(updateData)
    .eq('id', orderId)

  if (orderError) {
    console.error('Order sync status mislukt:', orderError)
  }
}

async function updateKitchenLabelStatus(labelId: string, nextStatus: LabelStatus) {
  const now = new Date().toISOString()
  const label = kitchenLabels.find((item) => item.id === labelId)

  const updateData: Record<string, string> = {
    status: nextStatus,
  }

  if (nextStatus === 'preparing') {
    updateData.started_at = now
  }

  if (nextStatus === 'done') {
    updateData.done_at = now
  }

  if (nextStatus === 'cancelled') {
    updateData.cancelled_at = now
  }

  const { error } = await supabase
    .from('kitchen_labels')
    .update(updateData)
    .eq('id', labelId)

  if (error) {
    message = `Label status aanpassen mislukt: ${error.message}`
    render()
    return
  }

  if (label?.order_id) {
    await syncOrderStatusFromLabels(label.order_id)
  }

  message = `Label aangepast naar ${getLabelStatusText(nextStatus)}`

  if (screen === 'kitchen') {
    await loadKitchenLabels()
  }
}

async function updateWholeKitchenOrder(orderId: string, nextLabelStatus: LabelStatus) {
  const now = new Date().toISOString()

  const labelUpdateData: Record<string, string> = {
    status: nextLabelStatus,
  }

  let nextOrderStatus: OrderStatus = 'preparing'

  if (nextLabelStatus === 'preparing') {
    labelUpdateData.started_at = now
    nextOrderStatus = 'preparing'
  }

  if (nextLabelStatus === 'done') {
    labelUpdateData.done_at = now
    nextOrderStatus = 'ready'
  }

  const { error: labelError } = await supabase
    .from('kitchen_labels')
    .update(labelUpdateData)
    .eq('order_id', orderId)
    .in('status', ['new', 'preparing'])

  if (labelError) {
    message = `Labels aanpassen mislukt: ${labelError.message}`
    render()
    return
  }

  const orderUpdateData: Record<string, string> = {
    status: nextOrderStatus,
    updated_at: now,
  }

  const { error: orderError } = await supabase
    .from('orders')
    .update(orderUpdateData)
    .eq('id', orderId)

  if (orderError) {
    message = `Order status aanpassen mislukt: ${orderError.message}`
    render()
    return
  }

  message = `Hele order aangepast naar ${nextOrderStatus}`

  if (screen === 'kitchen') {
    await loadKitchenLabels()
  }

  if (screen === 'orders') {
    await loadOrders()
  }
}


// =============================
// REALTIME: ORDERS + KITCHEN
// Refresh-knoppen blijven als fallback.
// =============================

function stopAutoRefresh() {
  // Oude polling timer opruimen voor het geval deze nog actief was.
  if (autoRefreshTimer !== null) {
    window.clearInterval(autoRefreshTimer)
    autoRefreshTimer = null
  }

  stopOrdersRealtime()
  stopKitchenRealtime()
  stopPickupRealtime()
}

function scheduleOrdersRealtimeReload() {
  if (ordersRealtimeReloadTimer !== null) {
    window.clearTimeout(ordersRealtimeReloadTimer)
  }

  ordersRealtimeReloadTimer = window.setTimeout(async () => {
    ordersRealtimeReloadTimer = null

    if (screen === 'orders') {
      await loadOrders()
    }
  }, 150)
}

function scheduleKitchenRealtimeReload() {
  if (kitchenRealtimeReloadTimer !== null) {
    window.clearTimeout(kitchenRealtimeReloadTimer)
  }

  kitchenRealtimeReloadTimer = window.setTimeout(async () => {
    kitchenRealtimeReloadTimer = null

    if (screen === 'kitchen') {
      await loadKitchenLabels(false)
    }
  }, 150)
}

function startOrdersRealtime() {
  stopOrdersRealtime()

  ordersRealtimeChannel = supabase
    .channel('blue-cup-orders')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'orders',
      },
      () => {
        scheduleOrdersRealtimeReload()
      }
    )
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'order_items',
      },
      () => {
        scheduleOrdersRealtimeReload()
      }
    )
    .subscribe((status, error) => {
      if (status === 'SUBSCRIBED') {
        console.log('Orders realtime verbonden')
      }

      if (error) {
        console.error('Orders realtime fout:', error)
      }
    })
}

function stopOrdersRealtime() {
  if (ordersRealtimeReloadTimer !== null) {
    window.clearTimeout(ordersRealtimeReloadTimer)
    ordersRealtimeReloadTimer = null
  }

  if (ordersRealtimeChannel) {
    void supabase.removeChannel(ordersRealtimeChannel)
    ordersRealtimeChannel = null
  }
}



async function loadPickupWaitSettings() {
  const { data, error } = await supabase
    .from('shop_settings')
    .select('pickup_wait_visible,pickup_wait_minutes,cash_registration_enabled')
    .eq('id', 1)
    .maybeSingle()

  if (error) {
    console.error('Wachttijd instellingen laden mislukt:', error)
    return
  }

  if (!data) return

  pickupWaitVisible = data.pickup_wait_visible ?? true
  pickupWaitMinutes = Number(data.pickup_wait_minutes ?? 10)
  cashRegistrationEnabled = data.cash_registration_enabled ?? true
}

async function saveCashRegistrationSetting(enabled: boolean) {
  const previousValue = cashRegistrationEnabled
  cashRegistrationEnabled = enabled
  adminMessage = ''
  adminError = ''
  render()

  const { error } = await supabase
    .from('shop_settings')
    .upsert(
      {
        id: 1,
        cash_registration_enabled: enabled,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' }
    )

  if (error) {
    cashRegistrationEnabled = previousValue
    adminError = `Kasregistratie-instelling opslaan mislukt: ${error.message}`
    render()
    return
  }

  adminMessage = enabled
    ? 'Kasregistratie staat aan. Voor cash is een open kas verplicht.'
    : 'Kasregistratie staat uit. Cash afrekenen kan zonder kassasessie.'
  render()
}

async function savePickupWaitSettings() {
  const visibleInput =
    document.querySelector<HTMLInputElement>('#pos-wait-visible')
  const minutesInput =
    document.querySelector<HTMLInputElement>('#pos-wait-minutes')

  const visible = visibleInput?.checked ?? true
  const minutes = Math.max(
    0,
    Math.min(180, Math.round(Number(minutesInput?.value ?? 10)))
  )

  if (!Number.isFinite(minutes)) {
    message = 'Vul een geldige wachttijd in.'
    render()
    return
  }

  const { error } = await supabase
    .from('shop_settings')
    .upsert(
      {
        id: 1,
        pickup_wait_visible: visible,
        pickup_wait_minutes: minutes,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' }
    )

  if (error) {
    message = `Wachttijd opslaan mislukt: ${error.message}`
    render()
    return
  }

  pickupWaitVisible = visible
  pickupWaitMinutes = minutes
  message = 'Instellingen opgeslagen.'
  render()
}

async function goToPosSettings(
  from: 'pos' | 'admin' = 'pos'
) {
  settingsReturnScreen = from

  stopAutoRefresh()
  stopCustomerProgressRefresh()
  removeCustomerScrollListeners()

  screen = 'pos-settings'
  message = ''
  updateModeInUrl('pos-settings')

  await loadPickupWaitSettings()
  render()
}

function goBackFromSettings() {
  if (settingsReturnScreen === 'admin') {
    void goToAdmin()
    return
  }

  goToPos()
}

function schedulePickupRealtimeReload() {
  if (pickupRealtimeReloadTimer !== null) {
    window.clearTimeout(pickupRealtimeReloadTimer)
  }

  pickupRealtimeReloadTimer = window.setTimeout(async () => {
    pickupRealtimeReloadTimer = null

    if (screen === 'pickup') {
      await loadOrders()
    }
  }, 150)
}

function startPickupRealtime() {
  stopPickupRealtime()

  pickupRealtimeChannel = supabase
    .channel('blue-cup-pickup')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'orders',
      },
      () => {
        schedulePickupRealtimeReload()
      }
    )
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'shop_settings',
        filter: 'id=eq.1',
      },
      async () => {
        await loadPickupWaitSettings()

        if (screen === 'pickup') {
          render()
        }
      }
    )
    .subscribe((status, error) => {
      if (status === 'SUBSCRIBED') {
        console.log('Pickup realtime verbonden')
      }

      if (error) {
        console.error('Pickup realtime fout:', error)
      }
    })
}

function stopPickupRealtime() {
  if (pickupRealtimeReloadTimer !== null) {
    window.clearTimeout(pickupRealtimeReloadTimer)
    pickupRealtimeReloadTimer = null
  }

  if (pickupRealtimeChannel) {
    void supabase.removeChannel(pickupRealtimeChannel)
    pickupRealtimeChannel = null
  }
}

function startKitchenRealtime() {
  stopKitchenRealtime()

  kitchenRealtimeChannel = supabase
    .channel('blue-cup-kitchen')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'kitchen_labels',
      },
      () => {
        scheduleKitchenRealtimeReload()
      }
    )
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'orders',
      },
      () => {
        scheduleKitchenRealtimeReload()
      }
    )
    .subscribe((status, error) => {
      if (status === 'SUBSCRIBED') {
        console.log('Kitchen realtime verbonden')
      }

      if (error) {
        console.error('Kitchen realtime fout:', error)
      }
    })
}

function stopKitchenRealtime() {
  if (kitchenRealtimeReloadTimer !== null) {
    window.clearTimeout(kitchenRealtimeReloadTimer)
    kitchenRealtimeReloadTimer = null
  }

  if (kitchenRealtimeChannel) {
    void supabase.removeChannel(kitchenRealtimeChannel)
    kitchenRealtimeChannel = null
  }
}

function stopCustomerProgressRefresh() {
  if (customerProgressTimer !== null) {
    window.clearInterval(customerProgressTimer)
    customerProgressTimer = null
  }
}

function startCustomerProgressRefresh() {
  stopCustomerProgressRefresh()

  customerProgressTimer = window.setInterval(async () => {
    if (isCustomerSessionExpired()) {
      clearCustomerSessionStorage()
      resetCustomerStateVariables()
      stopCustomerProgressRefresh()
      render()
      return
    }

    if (screen === 'customer' && customerOrderPlaced && customerOrderId) {
      await loadCustomerOrderProgress()
    }
  }, 5000)
}


// =============================
// NAVIGATION
// =============================

function removeCustomerScrollListeners() {
  window.removeEventListener('scroll', updateActiveCustomerCategory)

  const scrollBox = getCustomerProductScrollBox()

  if (scrollBox) {
    scrollBox.removeEventListener('scroll', updateActiveCustomerCategory)
  }
}

function goToPos() {
  void startAutomaticPrintWorker()
  stopAutoRefresh()
  stopCustomerProgressRefresh()
  removeCustomerScrollListeners()

  screen = 'pos'
  message = ''
  updateModeInUrl('pos')
  render()
}


async function goToOrderHistory(
  from: 'pos' | 'admin' = 'pos'
) {
  orderHistoryReturnScreen = from

  stopAutoRefresh()
  stopCustomerProgressRefresh()
  removeCustomerScrollListeners()

  screen = 'order-history'
  message = ''
  orderHistorySearch = ''
  selectedOrderHistoryId = null
  updateModeInUrl('order-history')

  await loadOrderHistory()
}

function goBackFromOrderHistory() {
  if (orderHistoryReturnScreen === 'admin') {
    void goToAdmin()
    return
  }

  goToPos()
}

async function goToOrders() {
  stopAutoRefresh()
  stopCustomerProgressRefresh()
  removeCustomerScrollListeners()

  screen = 'orders'
  message = ''
  updateModeInUrl('orders')

  await loadOrders()
  startOrdersRealtime()
}


async function goToPickup() {
  stopAutoRefresh()
  stopCustomerProgressRefresh()
  removeCustomerScrollListeners()

  screen = 'pickup'
  message = ''
  updateModeInUrl('pickup')

  await Promise.all([
    loadOrders(),
    loadPickupWaitSettings(),
  ])

  startPickupRealtime()
}

async function goToKitchen() {
  stopAutoRefresh()
  stopCustomerProgressRefresh()
  removeCustomerScrollListeners()

  screen = 'kitchen'
  message = ''
  updateModeInUrl('kitchen')

  await loadKitchenLabels()
  startKitchenRealtime()
}


async function goToAdmin() {
  stopAutoRefresh()
  stopCustomerProgressRefresh()
  removeCustomerScrollListeners()

  screen = 'admin'
  message = ''
  adminMessage = ''
  adminError = ''
  updateModeInUrl('admin')

  await loadAllAdminData()
}


async function goToAdminProducts() {
  stopAutoRefresh()
  stopCustomerProgressRefresh()
  removeCustomerScrollListeners()

  screen = 'admin-products'
  message = ''
  adminMessage = ''
  adminError = ''
  updateModeInUrl('admin-products')

  await loadAllAdminData()
}


async function goToAdminSales() {
  stopAutoRefresh()
  stopCustomerProgressRefresh()
  removeCustomerScrollListeners()

  screen = 'admin-sales'
  message = ''
  adminMessage = ''
  adminError = ''
  updateModeInUrl('admin-sales')

  await loadAdminSalesData()
}

async function goToAdminDayClose() {
  stopAutoRefresh()
  stopCustomerProgressRefresh()
  removeCustomerScrollListeners()

  screen = 'admin-day-close'
  message = ''
  adminMessage = ''
  adminError = ''
  updateModeInUrl('admin-day-close')

  await loadAllAdminData()
}

async function goToAdminAddProduct() {
  stopAutoRefresh()
  stopCustomerProgressRefresh()
  removeCustomerScrollListeners()

  screen = 'admin-add-product'
  adminEditingProductId = null
  message = ''
  adminMessage = ''
  adminError = ''
  updateModeInUrl('admin-add-product')

  await loadAllAdminData()
}

async function goToAdminAddTopping() {
  stopAutoRefresh()
  stopCustomerProgressRefresh()
  removeCustomerScrollListeners()

  screen = 'admin-add-topping'
  adminEditingToppingId = null
  message = ''
  adminMessage = ''
  adminError = ''
  updateModeInUrl('admin-add-topping')

  await loadAllAdminData()
}


async function goToAdminCategories() {
  stopAutoRefresh()
  stopCustomerProgressRefresh()
  removeCustomerScrollListeners()

  screen = 'admin-categories'

  // Voorkom dat oude product/topping edit-state blijft hangen.
  adminEditingProductId = null
  adminEditingToppingId = null
  adminEditingCategoryId = null

  message = ''
  adminMessage = ''
  adminError = ''
  updateModeInUrl('admin-categories')

  await loadAllAdminData()
}


async function goToAdminToppings() {
  stopAutoRefresh()
  stopCustomerProgressRefresh()
  removeCustomerScrollListeners()

  screen = 'admin-products'
  message = ''
  adminMessage = ''
  adminError = ''
  updateModeInUrl('admin-products')

  await loadAllAdminData()

  requestAnimationFrame(() => {
    document
      .querySelector<HTMLElement>('#admin-toppings-section')
      ?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      })
  })
}

async function goToAdminCash() {
  await goToAdminDayClose()

  requestAnimationFrame(() => {
    document
      .querySelector<HTMLElement>('#admin-cash-section')
      ?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      })
  })
}

async function goToPrintPreview(
  from: 'pos' | 'admin' = 'pos'
) {
  printPreviewReturnScreen = from

  stopAutoRefresh()
  stopCustomerProgressRefresh()
  removeCustomerScrollListeners()

  screen = 'print-preview'
  message = ''
  printPreviewError = ''
  updateModeInUrl('print-preview')

  await loadPrintPreviewData()
}

function goBackFromPrintPreview() {
  if (printPreviewReturnScreen === 'admin') {
    void goToAdmin()
    return
  }

  goToPos()
}


// =============================
// CUSTOMER: NEW ORDER
// =============================

function startNewCustomerOrder() {
  clearCustomerSessionStorage()
  resetCustomerStateVariables()
  message = ''

  stopCustomerProgressRefresh()
  getCustomerSessionId()
  saveCustomerState()
  render()
}


// =============================
// HELPERS: ORDER TOTALS AND TEXT
// =============================

function getOrderItems(orderId: string) {
  return orderItems.filter((item) => String(item.order_id) === String(orderId))
}

function getOrderTotal(order: Order) {
  return Number(order.total ?? order.total_amount ?? order.subtotal ?? 0)
}

function getOrderItemTotal(item: OrderItem) {
  const lineTotal = Number(item.line_total ?? 0)

  if (lineTotal > 0) {
    return lineTotal
  }

  const unitPrice = Number(item.unit_price ?? 0)
  const quantity = Number(item.quantity ?? 1)

  return unitPrice * quantity
}

function getOrderName(order: Order) {
  return order.order_number || `Order #${order.id}`
}

function getPaymentText(order: Order) {
  if (order.payment_status === 'paid') {
    return `Paid ${order.payment_method ? `(${order.payment_method})` : ''}`
  }

  if (order.payment_status === 'pending') {
    return 'Payment pending'
  }

  if (order.payment_status === 'failed') {
    return 'Payment failed'
  }

  if (order.payment_status === 'cancelled') {
    return 'Payment cancelled'
  }

  if (order.payment_status === 'refunded') {
    return 'Refunded'
  }

  return 'Unpaid'
}

function getPaymentBadgeText(order: Order) {
  if (order.payment_status === 'paid') return 'Betaald'
  if (order.payment_status === 'pending') return 'Wacht op betaling'
  if (order.payment_status === 'failed') return 'Betaling mislukt'
  if (order.payment_status === 'cancelled') return 'Betaling geannuleerd'
  if (order.payment_status === 'refunded') return 'Terugbetaald'
  return 'Niet betaald'
}

function getPaymentBadgeClass(order: Order) {
  if (order.payment_status === 'paid') return 'order-payment-paid'
  if (order.payment_status === 'pending') return 'order-payment-pending'
  if (order.payment_status === 'failed') return 'order-payment-failed'
  if (order.payment_status === 'cancelled') return 'order-payment-cancelled'
  if (order.payment_status === 'refunded') return 'order-payment-refunded'
  return 'order-payment-unpaid'
}

function getCustomerPaymentMethodText(method: PaymentMethod) {
  if (method === 'online_fake') return t('onlinePayment')
  if (method === 'pay_at_counter') return t('payAtCounter')
  if (method === 'cash') return 'Cash'
  if (method === 'card') return 'Card'

  return method
}

function getCustomerOrderText(order: Order) {
  const parts = []

  if (order.customer_name) {
    parts.push(`Naam: ${order.customer_name}`)
  }

  if (order.customer_phone) {
    parts.push(`Tel: ${order.customer_phone}`)
  }

  if (order.pickup_code) {
    parts.push(`Pickup: ${order.pickup_code}`)
  }

  return parts.join(' • ')
}

function getFilteredOrders() {
  if (orderFilter === 'all') {
    return orders
  }

  if (orderFilter === 'active') {
    return orders.filter((order) => {
      return (
        order.status === 'new' ||
        order.status === 'preparing' ||
        order.status === 'ready'
      )
    })
  }

  if (orderFilter === 'preparation') {
    return orders.filter((order) => order.status === 'preparing')
  }

  if (orderFilter === 'completed') {
    return orders.filter((order) => order.status === 'completed')
  }

  return orders
}

function getOrderFilterText(filter: OrderFilter) {
  if (filter === 'all') return 'All'
  if (filter === 'active') return 'Active'
  if (filter === 'preparation') return 'Preparation'
  if (filter === 'completed') return 'Completed'

  return filter
}

function groupKitchenLabelsByOrder() {
  const grouped: Record<string, KitchenLabel[]> = {}

  for (const label of kitchenLabels) {
    const key = label.order_number || label.order_id

    if (!grouped[key]) {
      grouped[key] = []
    }

    grouped[key].push(label)
  }

  return grouped
}

function getLabelStatusText(status: LabelStatus) {
  if (status === 'new') return 'Waiting'
  if (status === 'preparing') return 'Preparation'
  if (status === 'done') return 'Finished'
  if (status === 'cancelled') return 'Cancelled'

  return status
}

function getOrderStatusText(status?: OrderStatus | null) {
  if (status === 'new') return t('statusNew')
  if (status === 'preparing') return t('statusPreparing')
  if (status === 'ready') return t('statusReady')
  if (status === 'completed') return t('statusCompleted')
  if (status === 'cancelled') return t('statusCancelled')

  return t('statusNew')
}

function getCustomerStatusMessage(status?: OrderStatus | null) {
  if (status === 'new') return t('msgNew')
  if (status === 'preparing') return t('msgPreparing')
  if (status === 'ready') return t('msgReady')
  if (status === 'completed') return t('msgCompleted')
  if (status === 'cancelled') return t('msgCancelled')

  return t('loadingStatus')
}

function getCustomerLabelStatusText(status: LabelStatus) {
  if (status === 'new') return t('labelWaiting')
  if (status === 'preparing') return t('labelPreparing')
  if (status === 'done') return t('labelFinished')
  if (status === 'cancelled') return t('labelCancelled')

  return status
}

function getKitchenOrderPhase(labels: KitchenLabel[]) {
  const hasPreparing = labels.some((label) => label.status === 'preparing')
  const hasNew = labels.some((label) => label.status === 'new')

  if (hasPreparing) return 'Preparation'
  if (hasNew) return 'Waiting'

  return 'Finished'
}


// =============================
// HELPERS: FORMAT AND SAFETY
// =============================

function formatDate(value?: string | null) {
  if (!value) return '-'

  return new Date(value).toLocaleString('nl-NL', {
    dateStyle: 'short',
    timeStyle: 'short',
  })
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

function showError(errorMessage: string) {
  document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
    <div class="page">
      <h1>Blue Cup POS</h1>
      <p class="error">${escapeHtml(errorMessage)}</p>
    </div>
  `
}



// =============================
// ADMIN: PRODUCT MANAGEMENT
// =============================

const PRODUCT_IMAGE_BUCKET = 'product-images'
const MAX_PRODUCT_IMAGE_SIZE = 5 * 1024 * 1024

async function uploadProductImage(productId: string, file: File) {
  const allowedTypes = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/heic',
    'image/heif',
  ]

  if (!allowedTypes.includes(file.type)) {
    throw new Error('Gebruik een JPG, PNG, WEBP of HEIC afbeelding.')
  }

  if (file.size > MAX_PRODUCT_IMAGE_SIZE) {
    throw new Error('De productfoto mag maximaal 5 MB zijn.')
  }

  const fileExtension =
    file.name.includes('.') && file.name.split('.').pop()
      ? file.name.split('.').pop()!.toLowerCase().replace(/[^a-z0-9]/g, '')
      : 'jpg'

  const safeExtension = fileExtension || 'jpg'
  const filePath = `${productId}/${Date.now()}.${safeExtension}`

  const { error: uploadError } = await supabase.storage
    .from(PRODUCT_IMAGE_BUCKET)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type,
    })

  if (uploadError) {
    throw new Error(`Foto uploaden mislukt: ${uploadError.message}`)
  }

  const { data } = supabase.storage
    .from(PRODUCT_IMAGE_BUCKET)
    .getPublicUrl(filePath)

  if (!data.publicUrl) {
    throw new Error('Kon geen publieke URL voor de productfoto maken.')
  }

  return data.publicUrl
}

function bindAdminProductImagePreview() {
  const input = document.querySelector<HTMLInputElement>('#admin-product-image')
  const preview = document.querySelector<HTMLImageElement>('#admin-product-image-preview')
  const empty = document.querySelector<HTMLElement>('#admin-product-image-empty')
  const fileName = document.querySelector<HTMLElement>('#admin-product-image-name')

  if (!input || !preview || !empty) return

  input.addEventListener('change', () => {
    const file = input.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      input.value = ''
      return
    }

    const reader = new FileReader()

    reader.addEventListener('load', () => {
      preview.src = String(reader.result || '')
      preview.hidden = false
      empty.hidden = true

      if (fileName) {
        fileName.textContent = file.name
      }
    })

    reader.readAsDataURL(file)
  })
}


async function deleteAdminProduct(productId: string) {
  adminMessage = ''
  adminError = ''

  const product = products.find(
    (item) => String(item.id) === String(productId)
  )

  if (!product) {
    adminError = 'Product niet gevonden.'
    render()
    return
  }

  const { count: orderItemCount, error: orderItemCountError } = await supabase
    .from('order_items')
    .select('id', { count: 'exact', head: true })
    .eq('product_id', productId)

  if (orderItemCountError) {
    adminError =
      `Kon niet controleren of dit product al besteld is: ${orderItemCountError.message}`
    render()
    return
  }

  if ((orderItemCount ?? 0) > 0) {
    adminError =
      `Dit product is al gebruikt in ${orderItemCount} orderregel${orderItemCount === 1 ? '' : 's'}. ` +
      'Zet het product daarom op inactief in plaats van het te verwijderen.'
    render()
    return
  }

  const confirmed = window.confirm(
    `Weet je zeker dat je "${product.name}" definitief wilt verwijderen?`
  )

  if (!confirmed) {
    return
  }

  const { error: toppingLinkError } = await supabase
    .from('product_toppings')
    .delete()
    .eq('product_id', productId)

  if (toppingLinkError) {
    adminError =
      `Product-topping koppelingen verwijderen mislukt: ${toppingLinkError.message}`
    render()
    return
  }

  const { error: modifierLinkError } = await supabase
    .from('product_modifier_groups')
    .delete()
    .eq('product_id', productId)

  if (modifierLinkError) {
    console.warn(
      'Product-modifier koppelingen verwijderen overgeslagen:',
      modifierLinkError.message
    )
  }

  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', productId)

  if (error) {
    adminError = `Product verwijderen mislukt: ${error.message}`
    render()
    return
  }

  if (
    adminEditingProductId &&
    String(adminEditingProductId) === String(productId)
  ) {
    adminEditingProductId = null
  }

  adminMessage = `Product "${product.name}" verwijderd.`
  await loadAllAdminData()
}

async function saveAdminProduct() {
  const nameInput = document.querySelector<HTMLInputElement>('#admin-product-name')
  const qrCodeInput = document.querySelector<HTMLInputElement>('#admin-product-qr-code')
  const categoryInput = document.querySelector<HTMLSelectElement>('#admin-product-category')
  const teaTypeInput = document.querySelector<HTMLSelectElement>('#admin-product-tea-type')
  const customTeaTypeInput = document.querySelector<HTMLInputElement>('.admin-product-custom-tea-type:not([hidden])')
  const temperatureLabelInput = document.querySelector<HTMLSelectElement>('#admin-product-temperature-label')
  const posOnlyInput = document.querySelector<HTMLInputElement>('#admin-product-pos-only')
  const productTypeInput = document.querySelector<HTMLSelectElement>('#admin-product-type')
  const priceInput = document.querySelector<HTMLInputElement>('#admin-product-price')
  const vatRateInput = document.querySelector<HTMLSelectElement>('#admin-product-vat-rate')
  const mediumSizeInput = document.querySelector<HTMLInputElement>('#admin-product-size-medium')
  const largeSizeInput = document.querySelector<HTMLInputElement>('#admin-product-size-large')
  const mediumPriceInput = document.querySelector<HTMLInputElement>('#admin-product-medium-price')
  const largePriceInput = document.querySelector<HTMLInputElement>('#admin-product-large-price')
  const discountTypeInput = document.querySelector<HTMLSelectElement>('#admin-product-discount-type')
  const discountValueInput = document.querySelector<HTMLInputElement>('#admin-product-discount-value')
  const bestSellerInput = document.querySelector<HTMLInputElement>('#admin-product-bestseller')
  const soldOutInput = document.querySelector<HTMLInputElement>('#admin-product-sold-out')
  const activeInput = document.querySelector<HTMLInputElement>('#admin-product-active')
  const allowIceInput = document.querySelector<HTMLInputElement>('#admin-product-allow-ice')
  const defaultIceInput = document.querySelector<HTMLSelectElement>('#admin-product-default-ice')
  const allowSugarInput = document.querySelector<HTMLInputElement>('#admin-product-allow-sugar')
  const imageInput = document.querySelector<HTMLInputElement>('#admin-product-image')
  const removeImageInput = document.querySelector<HTMLInputElement>('#admin-product-remove-image')
  const selectedImageFile = imageInput?.files?.[0] ?? null
  const removeExistingImage = removeImageInput?.checked ?? false
  const selectedToppingIds = getSelectedAdminToppingIds()

  const name = nameInput?.value.trim() || ''
  const qrProductCode = qrCodeInput?.value.trim() || ''
  const category = categoryInput?.value.trim() || ''
  const selectedTeaType = teaTypeInput?.value.trim() || ''
  const customTeaType = customTeaTypeInput?.value.trim() || ''
  const teaType =
    selectedTeaType === '__custom__'
      ? customTeaType || null
      : selectedTeaType || null
  const temperatureLabel = temperatureLabelInput?.value.trim() || null
  const posOnly = posOnlyInput?.checked ?? false
  const productType = productTypeInput?.value === 'item' ? 'item' : 'drink'
  const vatRate = Number(vatRateInput?.value ?? 9)

  const availableSizes: CupSize[] = []

  if (productType === 'drink') {
    if (mediumSizeInput?.checked) {
      availableSizes.push('medium')
    }

    if (largeSizeInput?.checked) {
      availableSizes.push('large')
    }
  } else {
    // Losse items gebruiken geen bekermaten, maar we bewaren een veilige
    // interne default zodat bestaande order/cart-code compatibel blijft.
    availableSizes.push('medium')
  }

  const mediumPrice =
    productType === 'drink' && mediumSizeInput?.checked
      ? Number(mediumPriceInput?.value || 0)
      : null

  const largePrice =
    productType === 'drink' && largeSizeInput?.checked
      ? Number(largePriceInput?.value || 0)
      : null

  const basePrice =
    productType === 'item'
      ? Number(priceInput?.value || 0)
      : availableSizes.includes('medium')
        ? Number(mediumPrice ?? 0)
        : Number(largePrice ?? 0)

  const discountType = normalizeDiscountType(discountTypeInput?.value)
  const discountValue =
    discountType === 'none'
      ? 0
      : Math.max(0, Number(discountValueInput?.value || 0))
  const isBestSeller = bestSellerInput?.checked ?? false
  const isSoldOut = soldOutInput?.checked ?? false
  const isActive = activeInput?.checked ?? true

  const allowIceCustomization = allowIceInput?.checked ?? true
  const allowSugarCustomization = allowSugarInput?.checked ?? true

  const defaultIceLevel =
    !allowIceCustomization && defaultIceInput?.value
      ? (defaultIceInput.value as IceLevel)
      : null

  const selectedMediumIceLevels = Array.from(
    document.querySelectorAll<HTMLInputElement>(
      'input[name="admin-product-ice-level-medium"]:checked'
    )
  ).map((input) => input.value as IceLevel)

  const selectedLargeIceLevels = Array.from(
    document.querySelectorAll<HTMLInputElement>(
      'input[name="admin-product-ice-level-large"]:checked'
    )
  ).map((input) => input.value as IceLevel)

  const selectedIceLevels = Array.from(
    new Set([
      ...selectedMediumIceLevels,
      ...selectedLargeIceLevels,
    ])
  )

  const selectedSugarLevels = Array.from(
    document.querySelectorAll<HTMLInputElement>(
      'input[name="admin-product-sugar-level"]:checked'
    )
  ).map((input) => input.value as SugarLevel)

  adminMessage = ''
  adminError = ''

  if (!name) {
    adminError = 'Vul een productnaam in.'
    render()
    return
  }

  if (!category) {
    adminError = 'Vul een categorie in.'
    render()
    return
  }

  if (
    productType === 'drink' &&
    selectedTeaType === '__custom__' &&
    !customTeaType
  ) {
    adminError = 'Vul een nieuwe theesoort in.'
    render()
    return
  }

  if (vatRate !== 9 && vatRate !== 21) {
    adminError = 'Kies een geldig BTW-tarief: 9% of 21%.'
    render()
    return
  }

  if (productType === 'drink' && availableSizes.length === 0) {
    adminError = 'Kies minimaal één bekergrootte: Medium of Large.'
    render()
    return
  }

  if (
    productType === 'drink' &&
    availableSizes.includes('medium') &&
    (!Number.isFinite(mediumPrice) || Number(mediumPrice) < 0)
  ) {
    adminError = 'Vul een geldige prijs voor Medium in.'
    render()
    return
  }

  if (
    productType === 'drink' &&
    availableSizes.includes('large') &&
    (!Number.isFinite(largePrice) || Number(largePrice) < 0)
  ) {
    adminError = 'Vul een geldige prijs voor Large in.'
    render()
    return
  }

  if (!Number.isFinite(basePrice) || basePrice < 0) {
    adminError = 'Vul een geldige prijs in.'
    render()
    return
  }

  if (!Number.isFinite(discountValue) || discountValue < 0) {
    adminError = 'Vul een geldige korting in.'
    render()
    return
  }

  if (discountType === 'percentage' && discountValue > 100) {
    adminError = 'Een percentage korting kan maximaal 100% zijn.'
    render()
    return
  }

  if (
    productType === 'drink' &&
    allowIceCustomization &&
    availableSizes.includes('medium') &&
    selectedMediumIceLevels.length === 0
  ) {
    adminError =
      'Kies minimaal één temperatuur / ijsniveau voor Medium.'
    render()
    return
  }

  if (
    productType === 'drink' &&
    allowIceCustomization &&
    availableSizes.includes('large') &&
    selectedLargeIceLevels.length === 0
  ) {
    adminError =
      'Kies minimaal één temperatuur / ijsniveau voor Large.'
    render()
    return
  }

  if (
    productType === 'drink' &&
    defaultIceLevel &&
    !ICE_LEVELS.includes(defaultIceLevel)
  ) {
    adminError = 'Kies een geldige vaste temperatuur / ijsniveau.'
    render()
    return
  }

  if (
    productType === 'drink' &&
    allowSugarCustomization &&
    selectedSugarLevels.length === 0
  ) {
    adminError =
      'Kies minimaal één optie voor Sugar level.'
    render()
    return
  }

  if (qrProductCode) {
    let qrQuery = supabase
      .from('products')
      .select('id')
      .eq('qr_product_code', qrProductCode)
      .limit(1)

    if (adminEditingProductId) {
      qrQuery = qrQuery.neq('id', adminEditingProductId)
    }

    const { data: duplicateQrProduct, error: duplicateQrError } =
      await qrQuery.maybeSingle()

    if (duplicateQrError) {
      adminError =
        `QR product code controleren mislukt: ${duplicateQrError.message}`
      render()
      return
    }

    if (duplicateQrProduct) {
      adminError =
        `QR product code "${qrProductCode}" is al in gebruik. Kies een unieke code.`
      render()
      return
    }
  }

  try {
    if (adminEditingProductId) {
      const productId = adminEditingProductId
      const existingProduct = products.find(
        (product) => String(product.id) === String(productId)
      )

      let imageUrl = removeExistingImage
        ? null
        : existingProduct?.image_url ?? null

      if (selectedImageFile) {
        imageUrl = await uploadProductImage(productId, selectedImageFile)
      }

      const { error } = await supabase
        .from('products')
        .update({
          name,
          category,
          tea_type: productType === 'item' ? null : teaType,
          temperature_label: productType === 'item' ? null : temperatureLabel,
          pos_only: posOnly,
          product_type: productType,
          base_price: basePrice,
          vat_rate: vatRate,
          discount_type: discountType,
          discount_value: discountValue,
          qr_product_code: qrProductCode || null,
          available_sizes: availableSizes,
          medium_price: mediumPrice,
          large_price: largePrice,
          is_bestseller: isBestSeller,
          is_sold_out: isSoldOut,
          is_active: isActive,
          image_url: imageUrl,
          allow_ice_customization: productType === 'item' ? false : allowIceCustomization,
          allowed_ice_levels: productType === 'item' ? [] : selectedIceLevels,
          medium_allowed_ice_levels:
            productType === 'item'
              ? null
              : availableSizes.includes('medium')
                ? selectedMediumIceLevels
                : null,
          large_allowed_ice_levels:
            productType === 'item'
              ? null
              : availableSizes.includes('large')
                ? selectedLargeIceLevels
                : null,
          default_ice_level: productType === 'item' ? null : defaultIceLevel,
          allow_sugar_customization: productType === 'item' ? false : allowSugarCustomization,
          allowed_sugar_levels: productType === 'item' ? [] : selectedSugarLevels,
        })
        .eq('id', productId)

      if (error) {
        adminError = `Product aanpassen mislukt: ${error.message}`
        render()
        return
      }

      await saveProductToppingLinks(productId, productType === 'item' ? [] : selectedToppingIds)
      adminMessage = 'Product, toppings en foto aangepast.'
    } else {
      const { data, error } = await supabase
        .from('products')
        .insert({
          name,
          category,
          tea_type: productType === 'item' ? null : teaType,
          temperature_label: productType === 'item' ? null : temperatureLabel,
          pos_only: posOnly,
          product_type: productType,
          base_price: basePrice,
          discount_type: discountType,
          discount_value: discountValue,
          qr_product_code: qrProductCode || null,
          available_sizes: availableSizes,
          medium_price: mediumPrice,
          large_price: largePrice,
          is_bestseller: isBestSeller,
          is_sold_out: isSoldOut,
          is_active: isActive,
          image_url: null,
          allow_ice_customization: productType === 'item' ? false : allowIceCustomization,
          allowed_ice_levels: productType === 'item' ? [] : selectedIceLevels,
          medium_allowed_ice_levels:
            productType === 'item'
              ? null
              : availableSizes.includes('medium')
                ? selectedMediumIceLevels
                : null,
          large_allowed_ice_levels:
            productType === 'item'
              ? null
              : availableSizes.includes('large')
                ? selectedLargeIceLevels
                : null,
          default_ice_level: productType === 'item' ? null : defaultIceLevel,
          allow_sugar_customization: productType === 'item' ? false : allowSugarCustomization,
          allowed_sugar_levels: productType === 'item' ? [] : selectedSugarLevels,
        })
        .select('id')
        .single()

      if (error) {
        adminError = `Product toevoegen mislukt: ${error.message}`
        render()
        return
      }

      const productId = String(data.id)

      if (selectedImageFile) {
        const imageUrl = await uploadProductImage(productId, selectedImageFile)

        const { error: imageUpdateError } = await supabase
          .from('products')
          .update({ image_url: imageUrl })
          .eq('id', productId)

        if (imageUpdateError) {
          throw new Error(`Foto URL opslaan mislukt: ${imageUpdateError.message}`)
        }
      }

      await saveProductToppingLinks(productId, productType === 'item' ? [] : selectedToppingIds)
      adminMessage = 'Product, toppings en foto toegevoegd.'
    }
  } catch (error) {
    adminError =
      error instanceof Error
        ? error.message
        : 'Product toppings opslaan mislukt.'
    render()
    return
  }

  adminEditingProductId = null

  if (screen === 'admin-add-product') {
    screen = 'admin-products'
    updateModeInUrl('admin-products')
  }

  await loadAllAdminData()
}

function editAdminProduct(productId: string) {
  adminEditingProductId = productId
  adminMessage = ''
  adminError = ''
  render()
}

function cancelAdminProductEdit() {
  adminEditingProductId = null
  adminMessage = ''
  adminError = ''
  render()
}

async function toggleAdminProduct(productId: string, nextActive: boolean) {
  adminMessage = ''
  adminError = ''

  const { error } = await supabase
    .from('products')
    .update({ is_active: nextActive })
    .eq('id', productId)

  if (error) {
    adminError = `Productstatus aanpassen mislukt: ${error.message}`
    render()
    return
  }

  adminMessage = nextActive ? 'Product geactiveerd.' : 'Product gedeactiveerd.'
  await loadAllAdminData()
}


// =============================
// ADMIN: TOPPING MANAGEMENT
// =============================

async function saveAdminTopping() {
  const nameInput = document.querySelector<HTMLInputElement>('#admin-topping-name')
  const priceInput = document.querySelector<HTMLInputElement>('#admin-topping-price')
  const activeInput = document.querySelector<HTMLInputElement>('#admin-topping-active')

  const name = nameInput?.value.trim() || ''
  const price = Number(priceInput?.value || 0)
  const isActive = activeInput?.checked ?? true

  adminMessage = ''
  adminError = ''

  if (!name) {
    adminError = 'Vul een toppingnaam in.'
    render()
    return
  }

  if (!Number.isFinite(price) || price < 0) {
    adminError = 'Vul een geldige toppingprijs in.'
    render()
    return
  }

  if (adminEditingToppingId) {
    const { error } = await supabase
      .from('toppings')
      .update({
        name,
        price,
        is_active: isActive,
      })
      .eq('id', adminEditingToppingId)

    if (error) {
      adminError = `Topping aanpassen mislukt: ${error.message}`
      render()
      return
    }

    adminMessage = 'Topping aangepast.'
  } else {
    const { error } = await supabase
      .from('toppings')
      .insert({
        name,
        price,
        is_active: isActive,
      })

    if (error) {
      adminError = `Topping toevoegen mislukt: ${error.message}`
      render()
      return
    }

    adminMessage = 'Topping toegevoegd.'
  }

  adminEditingToppingId = null

  if (screen === 'admin-add-topping') {
    screen = 'admin-products'
    updateModeInUrl('admin-products')
  }

  await loadAllAdminData()
}

function editAdminTopping(toppingId: string) {
  adminEditingToppingId = toppingId
  adminMessage = ''
  adminError = ''
  render()
}

function cancelAdminToppingEdit() {
  adminEditingToppingId = null
  adminMessage = ''
  adminError = ''
  render()
}

async function toggleAdminTopping(toppingId: string, nextActive: boolean) {
  adminMessage = ''
  adminError = ''

  const { error } = await supabase
    .from('toppings')
    .update({ is_active: nextActive })
    .eq('id', toppingId)

  if (error) {
    adminError = `Toppingstatus aanpassen mislukt: ${error.message}`
    render()
    return
  }

  adminMessage = nextActive ? 'Topping geactiveerd.' : 'Topping gedeactiveerd.'
  await loadAllAdminData()
}


// =============================
// ADMIN: DAILY SALES STATS
// =============================

function getTodayDateRange() {
  const start = new Date()
  start.setHours(0, 0, 0, 0)

  const end = new Date(start)
  end.setDate(end.getDate() + 1)

  return {
    startIso: start.toISOString(),
    endIso: end.toISOString(),
  }
}


function getAdminSalesDateRange() {
  if (adminSalesRange === 'all') {
    return {
      startIso: null as string | null,
      endIso: null as string | null,
    }
  }

  const end = new Date()
  end.setHours(23, 59, 59, 999)

  const start = new Date()
  start.setHours(0, 0, 0, 0)

  if (adminSalesRange === '7d') {
    start.setDate(start.getDate() - 6)
  }

  if (adminSalesRange === '30d') {
    start.setDate(start.getDate() - 29)
  }

  return {
    startIso: start.toISOString(),
    endIso: end.toISOString(),
  }
}

function getAdminSalesRangeLabel() {
  if (adminSalesRange === 'today') return 'Vandaag'
  if (adminSalesRange === '7d') return 'Laatste 7 dagen'
  if (adminSalesRange === '30d') return 'Laatste 30 dagen'
  return 'Alle verkopen'
}

async function loadAdminSalesData() {
  isLoadingAdminSales = true
  adminError = ''
  render()

  const { startIso, endIso } = getAdminSalesDateRange()

  let query = supabase
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false })

  if (startIso && endIso) {
    query = query
      .gte('created_at', startIso)
      .lte('created_at', endIso)
  }

  const { data: orderData, error: orderError } = await query

  if (orderError) {
    isLoadingAdminSales = false
    adminError = `Verkoopdata laden mislukt: ${orderError.message}`
    render()
    return
  }

  adminSalesOrders = (orderData ?? []) as Order[]

  const ids = adminSalesOrders.map((order) => String(order.id))

  if (ids.length === 0) {
    adminSalesOrderItems = []
    isLoadingAdminSales = false
    render()
    return
  }

  const { data: itemData, error: itemError } = await supabase
    .from('order_items')
    .select('*')
    .in('order_id', ids)

  if (itemError) {
    isLoadingAdminSales = false
    adminError = `Orderregels laden mislukt: ${itemError.message}`
    render()
    return
  }

  adminSalesOrderItems = (itemData ?? []) as OrderItem[]
  isLoadingAdminSales = false
  render()
}

function getAdminSalesValidOrders() {
  return adminSalesOrders.filter(
    (order) => order.status !== 'cancelled'
  )
}

function getAdminSalesPaidOrders() {
  return adminSalesOrders.filter(
    (order) =>
      order.status !== 'cancelled' &&
      order.payment_status === 'paid'
  )
}

function getAdminSalesRevenue() {
  return getAdminSalesPaidOrders().reduce(
    (sum, order) => sum + getOrderTotal(order),
    0
  )
}

function getAdminSalesOrderCount() {
  return getAdminSalesValidOrders().length
}

function getAdminSalesDrinkCount() {
  const validIds = new Set(
    getAdminSalesValidOrders().map((order) => String(order.id))
  )

  return adminSalesOrderItems
    .filter((item) => validIds.has(String(item.order_id)))
    .reduce(
      (sum, item) => sum + Number(item.quantity ?? 0),
      0
    )
}

function getAdminAverageOrderValue() {
  const paidOrders = getAdminSalesPaidOrders()

  if (paidOrders.length === 0) return 0

  return getAdminSalesRevenue() / paidOrders.length
}

function getAdminHistoricalDrinkSalesRows(): AdminDrinkSalesRow[] {
  const validIds = new Set(
    getAdminSalesValidOrders().map((order) => String(order.id))
  )

  const grouped: Record<string, AdminDrinkSalesRow> = {}

  for (const item of adminSalesOrderItems) {
    if (!validIds.has(String(item.order_id))) continue

    const name =
      item.product_name_snapshot ||
      item.product_name ||
      'Onbekend product'

    if (!grouped[name]) {
      grouped[name] = {
        name,
        quantity: 0,
        revenue: 0,
      }
    }

    grouped[name].quantity += Number(item.quantity ?? 0)
    grouped[name].revenue += getOrderItemTotal(item)
  }

  return Object.values(grouped).sort((a, b) => {
    if (b.quantity !== a.quantity) {
      return b.quantity - a.quantity
    }

    return b.revenue - a.revenue
  })
}

function getAdminHistoricalToppingSalesRows(): AdminToppingSalesRow[] {
  const validIds = new Set(
    getAdminSalesValidOrders().map((order) => String(order.id))
  )

  const grouped: Record<string, AdminToppingSalesRow> = {}

  for (const item of adminSalesOrderItems) {
    if (!validIds.has(String(item.order_id))) continue

    const quantity = Number(item.quantity ?? 0)
    const selectedToppings =
      Array.isArray(item.toppings) ? item.toppings : []

    for (const topping of selectedToppings) {
      const name = topping.name || 'Onbekende topping'
      const price = Number(topping.price ?? 0)

      if (!grouped[name]) {
        grouped[name] = {
          name,
          quantity: 0,
          revenue: 0,
        }
      }

      grouped[name].quantity += quantity
      grouped[name].revenue += price * quantity
    }
  }

  return Object.values(grouped).sort((a, b) => {
    if (b.quantity !== a.quantity) {
      return b.quantity - a.quantity
    }

    return b.revenue - a.revenue
  })
}

function setAdminSalesRange(
  range: 'today' | '7d' | '30d' | 'all'
) {
  adminSalesRange = range
  void loadAdminSalesData()
}

function getAdminTodayCompletedOrders() {
  return adminTodayOrders.filter((order) => {
    return order.status !== 'cancelled'
  })
}

function getAdminTodayPaidOrders() {
  return adminTodayOrders.filter((order) => {
    return order.status !== 'cancelled' && order.payment_status === 'paid'
  })
}

function getAdminTodayOrderCount() {
  return getAdminTodayCompletedOrders().length
}

function getAdminTodayDrinkCount() {
  const validOrderIds = new Set(
    getAdminTodayCompletedOrders().map((order) => String(order.id))
  )

  return adminTodayOrderItems
    .filter((item) => validOrderIds.has(String(item.order_id)))
    .reduce((sum, item) => sum + Number(item.quantity ?? 0), 0)
}


type AdminDrinkSalesRow = {
  name: string
  quantity: number
  revenue: number
}


type AdminToppingSalesRow = {
  name: string
  quantity: number
  revenue: number
}

function getAdminDrinkSalesRows(): AdminDrinkSalesRow[] {
  const validOrderIds = new Set(
    getAdminTodayCompletedOrders().map((order) => String(order.id))
  )

  const grouped: Record<string, AdminDrinkSalesRow> = {}

  for (const item of adminTodayOrderItems) {
    if (!validOrderIds.has(String(item.order_id))) {
      continue
    }

    const name =
      item.product_name_snapshot ||
      item.product_name ||
      'Onbekend product'

    if (!grouped[name]) {
      grouped[name] = {
        name,
        quantity: 0,
        revenue: 0,
      }
    }

    grouped[name].quantity += Number(item.quantity ?? 0)
    grouped[name].revenue += getOrderItemTotal(item)
  }

  return Object.values(grouped).sort((a, b) => {
    if (b.quantity !== a.quantity) {
      return b.quantity - a.quantity
    }

    return a.name.localeCompare(b.name)
  })
}

function getAdminTopDrinkSales(limit = 5) {
  return getAdminDrinkSalesRows().slice(0, limit)
}


function getAdminToppingSalesRows(): AdminToppingSalesRow[] {
  const validOrderIds = new Set(
    getAdminTodayCompletedOrders().map((order) => String(order.id))
  )

  const grouped: Record<string, AdminToppingSalesRow> = {}

  for (const item of adminTodayOrderItems) {
    if (!validOrderIds.has(String(item.order_id))) {
      continue
    }

    const quantity = Number(item.quantity ?? 0)
    const selectedToppings = Array.isArray(item.toppings) ? item.toppings : []

    for (const topping of selectedToppings) {
      const name = topping.name || 'Onbekende topping'
      const toppingPrice = Number(topping.price ?? 0)

      if (!grouped[name]) {
        grouped[name] = {
          name,
          quantity: 0,
          revenue: 0,
        }
      }

      grouped[name].quantity += quantity
      grouped[name].revenue += toppingPrice * quantity
    }
  }

  return Object.values(grouped).sort((a, b) => {
    if (b.quantity !== a.quantity) {
      return b.quantity - a.quantity
    }

    return a.name.localeCompare(b.name)
  })
}

function getAdminPieGradient() {
  const rows = getAdminTopDrinkSales(5)
  const total = rows.reduce((sum, row) => sum + row.quantity, 0)

  if (rows.length === 0 || total <= 0) {
    return '#e8edf5 0deg 360deg'
  }

  const chartColors = [
    '#1B478F',
    '#3C68AD',
    '#6689BF',
    '#91A9D2',
    '#BCCBE4',
  ]

  let currentDegrees = 0

  return rows
    .map((row, index) => {
      const degrees = (row.quantity / total) * 360
      const start = currentDegrees
      const end = currentDegrees + degrees
      currentDegrees = end

      return `${chartColors[index]} ${start.toFixed(2)}deg ${end.toFixed(2)}deg`
    })
    .join(', ')
}

function getAdminTodayRevenue() {
  return getAdminTodayPaidOrders().reduce((sum, order) => {
    return sum + getOrderTotal(order)
  }, 0)
}

function formatAdminTodayDate() {
  return new Date().toLocaleDateString('nl-NL', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
}


// =============================
// ADMIN: CATEGORY MANAGEMENT
// =============================

async function saveAdminCategory() {
  const nameInput = document.querySelector<HTMLInputElement>(
    adminEditingCategoryId ? '#admin-category-edit-name' : '#admin-category-name'
  )

  const discountTypeInput = document.querySelector<HTMLSelectElement>(
    adminEditingCategoryId
      ? '#admin-category-edit-discount-type'
      : '#admin-category-discount-type'
  )

  const discountValueInput = document.querySelector<HTMLInputElement>(
    adminEditingCategoryId
      ? '#admin-category-edit-discount-value'
      : '#admin-category-discount-value'
  )

  const name = nameInput?.value.trim() || ''
  const discountType = normalizeDiscountType(discountTypeInput?.value)
  const discountValue =
    discountType === 'none'
      ? 0
      : Math.max(0, Number(discountValueInput?.value || 0))
  const isActive = true

  adminMessage = ''
  adminError = ''

  if (!name) {
    adminError = 'Vul een categorienaam in.'
    render()
    return
  }

  if (!Number.isFinite(discountValue) || discountValue < 0) {
    adminError = 'Vul een geldige korting in.'
    render()
    return
  }

  if (discountType === 'percentage' && discountValue > 100) {
    adminError = 'Een percentage korting kan maximaal 100% zijn.'
    render()
    return
  }

  if (adminEditingCategoryId) {
    const existingCategory = categories.find(
      (category) => String(category.id) === String(adminEditingCategoryId)
    )

    const oldName = existingCategory?.name || ''

    const { error } = await supabase
      .from('categories')
      .update({
        name,
        discount_type: discountType,
        discount_value: discountValue,
        is_active: isActive,
      })
      .eq('id', adminEditingCategoryId)

    if (error) {
      adminError = `Categorie aanpassen mislukt: ${error.message}`
      render()
      return
    }

    // Houd bestaande products.category tekst synchroon als de naam wijzigt.
    if (oldName && oldName !== name) {
      const { error: productUpdateError } = await supabase
        .from('products')
        .update({ category: name })
        .eq('category', oldName)

      if (productUpdateError) {
        adminError = `Categorie aangepast, maar producten bijwerken mislukt: ${productUpdateError.message}`
        render()
        return
      }
    }

    adminMessage = 'Categorie aangepast.'
  } else {
    const { error } = await supabase
      .from('categories')
      .insert({
        name,
        discount_type: discountType,
        discount_value: discountValue,
        is_active: isActive,
      })

    if (error) {
      adminError = `Categorie toevoegen mislukt: ${error.message}`
      render()
      return
    }

    adminMessage = 'Categorie toegevoegd.'
  }

  adminEditingCategoryId = null
  await loadAllAdminData()
}

function editAdminCategory(categoryId: string) {
  // Alleen de categorie-editor mag actief zijn.
  adminEditingProductId = null
  adminEditingToppingId = null
  adminEditingCategoryId = categoryId

  screen = 'admin-categories'
  updateModeInUrl('admin-categories')

  adminMessage = ''
  adminError = ''
  render()
}

function cancelAdminCategoryEdit() {
  adminEditingCategoryId = null
  adminMessage = ''
  adminError = ''
  render()
}


async function deleteAdminCategory(categoryId: string) {
  adminMessage = ''
  adminError = ''

  const category = categories.find(
    (item) => String(item.id) === String(categoryId)
  )

  if (!category) {
    adminError = 'Categorie niet gevonden.'
    render()
    return
  }

  if (
    isDiscountSystemCategory(category) ||
    isBestSellerSystemCategory(category) ||
    isHotSystemCategory(category)
  ) {
    adminError =
      'Discount, Best Seller en Hot zijn systeemcategorieën en kunnen niet worden verwijderd.'
    render()
    return
  }

  const productCount = getAdminCategoryProductCount(category.name)

  if (productCount > 0) {
    adminError =
      `Deze categorie bevat nog ${productCount} product${productCount === 1 ? '' : 'en'}. ` +
      'Verplaats of verwijder die producten eerst.'
    render()
    return
  }

  const confirmed = window.confirm(
    `Weet je zeker dat je de categorie "${category.name}" wilt verwijderen?`
  )

  if (!confirmed) {
    return
  }

  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('id', categoryId)

  if (error) {
    adminError = `Categorie verwijderen mislukt: ${error.message}`
    render()
    return
  }

  if (
    adminEditingCategoryId &&
    String(adminEditingCategoryId) === String(categoryId)
  ) {
    adminEditingCategoryId = null
  }

  if (
    adminViewingCategoryId &&
    String(adminViewingCategoryId) === String(categoryId)
  ) {
    adminViewingCategoryId = null
  }

  adminMessage = `Categorie "${category.name}" verwijderd.`
  await loadAllAdminData()
}

async function toggleAdminCategory(categoryId: string, nextActive: boolean) {
  adminMessage = ''
  adminError = ''

  const { error } = await supabase
    .from('categories')
    .update({ is_active: nextActive })
    .eq('id', categoryId)

  if (error) {
    adminError = `Categoriestatus aanpassen mislukt: ${error.message}`
    render()
    return
  }

  const toggledCategory = categories.find(
    (category) => String(category.id) === String(categoryId)
  )

  if (toggledCategory && isDiscountSystemCategory(toggledCategory)) {
    adminMessage = nextActive
      ? 'Discount categorie aangezet.'
      : 'Discount categorie uitgezet.'
  } else if (toggledCategory && isBestSellerSystemCategory(toggledCategory)) {
    adminMessage = nextActive
      ? 'Best Seller categorie aangezet.'
      : 'Best Seller categorie uitgezet.'
  } else {
    adminMessage = nextActive
      ? 'Categorie geactiveerd.'
      : 'Categorie gedeactiveerd.'
  }

  await loadAllAdminData()
}

function getAdminCategoryProductCount(categoryName: string) {
  return products.filter((product) => product.category === categoryName).length
}

function openAdminCategoryProducts(categoryId: string) {
  adminViewingCategoryId = categoryId
  adminMessage = ''
  adminError = ''
  render()
}

function closeAdminCategoryProducts() {
  adminViewingCategoryId = null
  render()
}


async function saveAdminCategoryOrder(orderedCategoryIds: string[]) {
  adminMessage = ''
  adminError = ''

  const updates = orderedCategoryIds.map((categoryId, index) => {
    return supabase
      .from('categories')
      .update({
        sort_order: index + 1,
      })
      .eq('id', categoryId)
  })

  const results = await Promise.all(updates)
  const failedResult = results.find((result) => result.error)

  if (failedResult?.error) {
    adminError = `Volgorde aanpassen mislukt: ${failedResult.error.message}`
    render()
    return
  }

  adminMessage = 'Categorievolgorde aangepast.'
  await loadAllAdminData()
}

function handleAdminCategoryDragStart(categoryId: string) {
  adminDraggingCategoryId = categoryId
}

function handleAdminCategoryDragEnd() {
  adminDraggingCategoryId = null
}

async function handleAdminCategoryDrop(targetCategoryId: string) {
  if (
    !adminDraggingCategoryId ||
    adminDraggingCategoryId === targetCategoryId
  ) {
    adminDraggingCategoryId = null
    return
  }

  const orderedCategories = [...categories].sort((a, b) => {
    const sortDifference =
      Number(a.sort_order ?? 0) - Number(b.sort_order ?? 0)

    if (sortDifference !== 0) {
      return sortDifference
    }

    return a.name.localeCompare(b.name)
  })

  const draggedIndex = orderedCategories.findIndex(
    (category) => String(category.id) === String(adminDraggingCategoryId)
  )

  const targetIndex = orderedCategories.findIndex(
    (category) => String(category.id) === String(targetCategoryId)
  )

  if (draggedIndex === -1 || targetIndex === -1) {
    adminDraggingCategoryId = null
    return
  }

  const [draggedCategory] = orderedCategories.splice(draggedIndex, 1)
  orderedCategories.splice(targetIndex, 0, draggedCategory)

  adminDraggingCategoryId = null

  await saveAdminCategoryOrder(
    orderedCategories.map((category) => String(category.id))
  )
}

// =============================
// ADMIN: DAILY CLOSING / Z-REPORT
// =============================

function getBusinessDateLocal(date = new Date()) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function moneyToCents(value: number | null | undefined) {
  return Math.round(Number(value ?? 0) * 100)
}

function getOrderGrossCents(order: Order) {
  const gross = order.gross_total ?? order.total ?? order.total_amount ?? order.subtotal ?? 0
  return moneyToCents(Number(gross))
}

function getOrderNetCents(order: Order) {
  if (order.net_total != null) {
    return moneyToCents(Number(order.net_total))
  }

  const gross = Number(order.gross_total ?? order.total ?? order.total_amount ?? order.subtotal ?? 0)
  const vat = Number(order.vat_total ?? 0)
  return moneyToCents(Math.max(0, gross - vat))
}

function getOrderVatCents(order: Order) {
  return moneyToCents(Number(order.vat_total ?? 0))
}

async function loadAdminDailyClosing() {
  const businessDate = getBusinessDateLocal()

  const { data, error } = await supabase
    .from('daily_closings')
    .select('*')
    .eq('business_date', businessDate)
    .limit(1)
    .maybeSingle()

  if (error) {
    adminDailyClosing = null
    adminDailyClosingVat = []
    adminError = `Z-rapport laden mislukt: ${error.message}`
    return
  }

  adminDailyClosing = data ? (data as DailyClosing) : null

  if (!adminDailyClosing) {
    adminDailyClosingVat = []
    return
  }

  const { data: vatData, error: vatError } = await supabase
    .from('daily_closing_vat')
    .select('*')
    .eq('daily_closing_id', adminDailyClosing.id)
    .order('vat_rate', { ascending: true })

  if (vatError) {
    adminDailyClosingVat = []
    console.error('BTW-uitsplitsing Z-rapport laden mislukt:', vatError)
    return
  }

  adminDailyClosingVat = (vatData ?? []) as DailyClosingVat[]
}

function centsToCsvMoney(value?: number | null) {
  return (Number(value ?? 0) / 100).toFixed(2).replace('.', ',')
}

function escapeCsvValue(value: string | number) {
  const text = String(value)

  if (text.includes(';') || text.includes('\n') || text.includes('"')) {
    return `"${text.replaceAll('"', '""')}"`
  }

  return text
}

function downloadDailyClosingCsvFile(
  closing: DailyClosing,
  vatRows: DailyClosingVat[]
) {
  const rows: Array<[string, string | number]> = [
    ['Blue Cup POS Z-rapport', closing.business_date],
    ['Afgesloten op', formatDate(closing.closed_at)],
    ['Afgesloten door', closing.closed_by || 'staff'],
    ['Aantal orders', Number(closing.order_count ?? 0)],
    ['Omzet incl. BTW', centsToCsvMoney(closing.gross_sales)],
    ['Omzet excl. BTW', centsToCsvMoney(closing.net_sales)],
    ['BTW totaal', centsToCsvMoney(closing.vat_total)],
    ['Contante omzet', centsToCsvMoney(closing.cash_sales)],
    ['Kaartomzet', centsToCsvMoney(closing.card_sales)],
    ['Online omzet', centsToCsvMoney(closing.online_sales)],
    ['Refunds', centsToCsvMoney(closing.refund_total)],
    ['Kas stortingen', centsToCsvMoney(closing.cash_in)],
    ['Kas opnames', centsToCsvMoney(closing.cash_out)],
    ['Begin kas', centsToCsvMoney(closing.opening_amount)],
    ['Verwachte kas', centsToCsvMoney(closing.expected_amount)],
    ['Getelde kas', centsToCsvMoney(closing.counted_amount)],
    ['Kasverschil', centsToCsvMoney(closing.difference_amount)],
  ]

  const summaryCsv = [
    'Kenmerk;Waarde',
    ...rows.map(([label, value]) => `${escapeCsvValue(label)};${escapeCsvValue(value)}`),
  ]

  const vatCsv = [
    '',
    'BTW-tarief;Omzet incl. BTW;Omzet excl. BTW;BTW-bedrag',
    ...vatRows.map((row) =>
      [
        `${Number(row.vat_rate).toFixed(2).replace('.', ',')}%`,
        centsToCsvMoney(row.gross_amount),
        centsToCsvMoney(row.net_amount),
        centsToCsvMoney(row.vat_amount),
      ]
        .map(escapeCsvValue)
        .join(';')
    ),
  ]

  const csv = '\uFEFF' + [...summaryCsv, ...vatCsv].join('\r\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = url
  link.download = `blue-cup-z-rapport-${closing.business_date}.csv`
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

function downloadDailyClosingCsv() {
  if (!adminDailyClosing) {
    window.alert('Er is nog geen Z-rapport om te exporteren.')
    return
  }

  downloadDailyClosingCsvFile(adminDailyClosing, adminDailyClosingVat)
}

async function downloadHistoricalDailyClosingCsv(closingId: string) {
  const closing = adminDailyClosingHistory.find(
    (item) => String(item.id) === String(closingId)
  )

  if (!closing) {
    window.alert('Z-rapport niet gevonden.')
    return
  }

  const { data, error } = await supabase
    .from('daily_closing_vat')
    .select('*')
    .eq('daily_closing_id', closing.id)
    .order('vat_rate', { ascending: true })

  if (error) {
    window.alert(`BTW-regels laden mislukt: ${error.message}`)
    return
  }

  downloadDailyClosingCsvFile(
    closing,
    (data ?? []) as DailyClosingVat[]
  )
}

async function loadAdminDailyClosingHistory() {
  isLoadingDailyClosingHistory = true

  const { data, error } = await supabase
    .from('daily_closings')
    .select('*')
    .order('business_date', { ascending: false })
    .limit(100)

  if (error) {
    adminDailyClosingHistory = []
    isLoadingDailyClosingHistory = false
    console.error('Z-rapport historie laden mislukt:', error)
    return
  }

  adminDailyClosingHistory = (data ?? []) as DailyClosing[]
  isLoadingDailyClosingHistory = false

  if (adminSelectedDailyClosing) {
    const refreshedSelected = adminDailyClosingHistory.find(
      (item) => String(item.id) === String(adminSelectedDailyClosing?.id)
    )

    if (!refreshedSelected) {
      adminSelectedDailyClosing = null
      adminSelectedDailyClosingVat = []
    } else {
      adminSelectedDailyClosing = refreshedSelected
    }
  }
}

async function openAdminDailyClosingHistoryItem(closingId: string) {
  const closing = adminDailyClosingHistory.find(
    (item) => String(item.id) === String(closingId)
  )

  if (!closing) {
    adminError = 'Z-rapport niet gevonden.'
    render()
    return
  }

  const { data, error } = await supabase
    .from('daily_closing_vat')
    .select('*')
    .eq('daily_closing_id', closing.id)
    .order('vat_rate', { ascending: true })

  if (error) {
    adminError = `BTW-details laden mislukt: ${error.message}`
    render()
    return
  }

  adminSelectedDailyClosing = closing
  adminSelectedDailyClosingVat = (data ?? []) as DailyClosingVat[]
  adminError = ''
  render()
}

function closeAdminDailyClosingHistoryItem() {
  adminSelectedDailyClosing = null
  adminSelectedDailyClosingVat = []
  render()
}

async function createDailyClosing() {
  if (activeCashSession) {
    window.alert('Sluit eerst de kas af. Daarna kun je het Z-rapport / de dagafsluiting maken.')
    return
  }

  const businessDate = getBusinessDateLocal()
  const { startIso, endIso } = getTodayDateRange()
  const actor = 'staff'

  const { data: existingClosing, error: existingClosingError } = await supabase
    .from('daily_closings')
    .select('id,business_date')
    .eq('business_date', businessDate)
    .limit(1)
    .maybeSingle()

  if (existingClosingError) {
    window.alert(`Controleren van bestaande dagafsluiting mislukt: ${existingClosingError.message}`)
    return
  }

  if (existingClosing) {
    window.alert(`De dag ${businessDate} is al afgesloten. Er wordt geen tweede Z-rapport gemaakt.`)
    return
  }

  const { data: closedSessions, error: closedSessionError } = await supabase
    .from('cash_sessions')
    .select('*')
    .eq('status', 'closed')
    .gte('opened_at', startIso)
    .lt('opened_at', endIso)
    .order('closed_at', { ascending: false })
    .limit(1)

  if (closedSessionError) {
    window.alert(`Afgesloten kassasessie laden mislukt: ${closedSessionError.message}`)
    return
  }

  const closedCashSession = (closedSessions?.[0] ?? null) as CashSession | null

  if (!closedCashSession) {
    window.alert('Er is voor vandaag nog geen afgesloten kassasessie gevonden. Open en sluit eerst de kas voordat je de dag afsluit.')
    return
  }

  const [ordersResult, itemsResult, paymentsResult, movementsResult] = await Promise.all([
    supabase
      .from('orders')
      .select('*')
      .gte('created_at', startIso)
      .lt('created_at', endIso),
    supabase
      .from('order_items')
      .select('*')
      .gte('created_at', startIso)
      .lt('created_at', endIso),
    supabase
      .from('payments')
      .select('*')
      .gte('created_at', startIso)
      .lt('created_at', endIso),
    supabase
      .from('cash_movements')
      .select('*')
      .eq('cash_session_id', closedCashSession.id),
  ])

  if (ordersResult.error) {
    window.alert(`Orders voor dagafsluiting laden mislukt: ${ordersResult.error.message}`)
    return
  }

  if (itemsResult.error) {
    window.alert(`Orderregels voor dagafsluiting laden mislukt: ${itemsResult.error.message}`)
    return
  }

  if (paymentsResult.error) {
    window.alert(`Betalingen voor dagafsluiting laden mislukt: ${paymentsResult.error.message}`)
    return
  }

  if (movementsResult.error) {
    window.alert(`Kasbewegingen voor dagafsluiting laden mislukt: ${movementsResult.error.message}`)
    return
  }

  const dayOrders = (ordersResult.data ?? []) as Order[]
  const dayItems = (itemsResult.data ?? []) as OrderItem[]
  const dayPayments = (paymentsResult.data ?? []) as Payment[]
  const dayMovements = movementsResult.data ?? []

  // Een betaalde én later volledig terugbetaalde order telt fiscaal netto als 0 omzet.
  // Geannuleerde orders tellen niet mee.
  const fiscalOrders = dayOrders.filter(
    (order) =>
      order.status !== 'cancelled' &&
      (order.payment_status === 'paid' || order.payment_status === 'refunded')
  )

  const refundedOrderIds = new Set(
    fiscalOrders
      .filter((order) => order.payment_status === 'refunded')
      .map((order) => String(order.id))
  )

  const fiscalOrderIds = new Set(fiscalOrders.map((order) => String(order.id)))

  let grossSales = 0
  let netSales = 0
  let vatTotal = 0
  let cashSales = 0
  let cardSales = 0
  let onlineSales = 0

  for (const order of fiscalOrders) {
    const sign = refundedOrderIds.has(String(order.id)) ? -1 : 1
    const gross = getOrderGrossCents(order)
    const net = getOrderNetCents(order)
    const vat = getOrderVatCents(order)

    grossSales += sign * gross
    netSales += sign * net
    vatTotal += sign * vat

    if (order.payment_method === 'cash') cashSales += sign * gross
    if (order.payment_method === 'card') cardSales += sign * gross
    if (order.payment_method === 'online_fake') onlineSales += sign * gross
  }

  const refundTotal = dayPayments
    .filter((payment) => payment.status === 'refunded')
    .reduce(
      (sum, payment) => sum + Number(payment.refund_amount ?? payment.amount ?? 0),
      0
    )

  const cashIn = dayMovements
    .filter((movement: any) => movement.movement_type === 'cash_in')
    .reduce((sum: number, movement: any) => sum + Math.max(0, Number(movement.amount ?? 0)), 0)

  const cashOut = dayMovements
    .filter((movement: any) => movement.movement_type === 'cash_out')
    .reduce((sum: number, movement: any) => sum + Math.abs(Math.min(0, Number(movement.amount ?? 0))), 0)

  const vatByRate = new Map<number, { gross: number; net: number; vat: number }>()

  for (const item of dayItems) {
    if (!fiscalOrderIds.has(String(item.order_id))) continue

    const sign = refundedOrderIds.has(String(item.order_id)) ? -1 : 1
    const vatRate = Number(item.vat_rate ?? 0)
    const gross = moneyToCents(Number(item.gross_amount ?? item.line_total ?? 0))
    const net = moneyToCents(Number(item.net_amount ?? 0))
    const vat = moneyToCents(Number(item.vat_amount ?? 0))

    const current = vatByRate.get(vatRate) ?? { gross: 0, net: 0, vat: 0 }
    current.gross += sign * gross
    current.net += sign * net
    current.vat += sign * vat
    vatByRate.set(vatRate, current)
  }

  const confirmed = window.confirm(
    `Dag ${businessDate} afsluiten?\n\n` +
      `Orders: ${fiscalOrders.length}\n` +
      `Omzet incl. BTW: ${formatPaymentAmount(grossSales)}\n` +
      `Omzet excl. BTW: ${formatPaymentAmount(netSales)}\n` +
      `BTW totaal: ${formatPaymentAmount(vatTotal)}\n` +
      `Refunds: ${formatPaymentAmount(refundTotal)}\n\n` +
      `Na bevestigen wordt het Z-rapport definitief opgeslagen.`
  )

  if (!confirmed) return

  const closedAt = new Date().toISOString()

  const { data: dailyClosing, error: closingError } = await supabase
    .from('daily_closings')
    .insert({
      business_date: businessDate,
      closed_at: closedAt,
      closed_by: actor,
      cash_session_id: closedCashSession.id,
      order_count: fiscalOrders.length,
      gross_sales: grossSales,
      net_sales: netSales,
      vat_total: vatTotal,
      cash_sales: cashSales,
      card_sales: cardSales,
      online_sales: onlineSales,
      refund_total: refundTotal,
      cash_in: cashIn,
      cash_out: cashOut,
      opening_amount: Number(closedCashSession.opening_amount ?? 0),
      expected_amount: Number(closedCashSession.expected_amount ?? 0),
      counted_amount: Number(closedCashSession.counted_amount ?? 0),
      difference_amount: Number(closedCashSession.difference_amount ?? 0),
    })
    .select('*')
    .single()

  if (closingError) {
    window.alert(`Dagafsluiting opslaan mislukt: ${closingError.message}`)
    return
  }

  const vatRows = Array.from(vatByRate.entries())
    .filter(([, amounts]) => amounts.gross !== 0 || amounts.net !== 0 || amounts.vat !== 0)
    .map(([vatRate, amounts]) => ({
      daily_closing_id: dailyClosing.id,
      vat_rate: vatRate,
      gross_amount: amounts.gross,
      net_amount: amounts.net,
      vat_amount: amounts.vat,
    }))

  if (vatRows.length > 0) {
    const { error: vatInsertError } = await supabase
      .from('daily_closing_vat')
      .insert(vatRows)

    if (vatInsertError) {
      // Rollback van de hoofdregel zodat je veilig opnieuw kunt proberen.
      await supabase.from('daily_closings').delete().eq('id', dailyClosing.id)
      window.alert(`BTW-uitsplitsing opslaan mislukt: ${vatInsertError.message}`)
      return
    }
  }

  const { error: auditError } = await supabase
    .from('audit_logs')
    .insert({
      event_type: 'DAILY_CLOSING_CREATED',
      entity_type: 'daily_closing',
      entity_id: String(dailyClosing.id),
      old_data: null,
      new_data: {
        business_date: businessDate,
        cash_session_id: closedCashSession.id,
        order_count: fiscalOrders.length,
        gross_sales: grossSales,
        net_sales: netSales,
        vat_total: vatTotal,
        cash_sales: cashSales,
        card_sales: cardSales,
        online_sales: onlineSales,
        refund_total: refundTotal,
        cash_in: cashIn,
        cash_out: cashOut,
      },
      reason: `Dagafsluiting / Z-rapport ${businessDate}`,
      actor,
    })

  if (auditError) {
    console.error('Dagafsluiting auditlog opslaan mislukt:', auditError)
  }

  adminMessage =
    `Dag ${businessDate} afgesloten. Z-rapport opgeslagen: ` +
    `${formatPaymentAmount(grossSales)} incl. BTW, ${formatPaymentAmount(vatTotal)} BTW.`
  adminError = ''

  await loadAllAdminData()
}

function renderAdminDailyClosing() {
  if (activeCashSession) {
    return `
      <section class="admin-payment-panel">
        <div class="admin-payment-panel-header">
          <div>
            <h2>Dagafsluiting / Z-rapport</h2>
            <p class="muted">Sluit eerst de open kas af.</p>
          </div>
        </div>

        <div class="admin-payment-empty">
          Zodra de kas gesloten is, kun je hier de dag definitief afsluiten.
        </div>
      </section>
    `
  }

  if (adminDailyClosing) {
    const closing = adminDailyClosing

    return `
      <section class="admin-payment-panel">
        <div class="admin-payment-panel-header">
          <div>
            <h2>Z-rapport ${escapeHtml(closing.business_date)}</h2>
            <p class="muted">
              Dag definitief afgesloten op ${escapeHtml(formatDate(closing.closed_at))}.
            </p>
          </div>

          <button class="admin-secondary-btn" id="admin-export-daily-closing-csv" type="button">
            CSV exporteren
          </button>
        </div>

        <div class="admin-payment-row-meta" style="margin-bottom:12px;">
          <span>Orders: <strong>${Number(closing.order_count ?? 0)}</strong></span>
          <span>Omzet incl. BTW: <strong>${escapeHtml(formatPaymentAmount(Number(closing.gross_sales ?? 0)))}</strong></span>
          <span>Omzet excl. BTW: <strong>${escapeHtml(formatPaymentAmount(Number(closing.net_sales ?? 0)))}</strong></span>
          <span>BTW: <strong>${escapeHtml(formatPaymentAmount(Number(closing.vat_total ?? 0)))}</strong></span>
        </div>

        <div class="admin-payment-row-meta" style="margin-bottom:12px;">
          <span>Cash: <strong>${escapeHtml(formatPaymentAmount(Number(closing.cash_sales ?? 0)))}</strong></span>
          <span>Card: <strong>${escapeHtml(formatPaymentAmount(Number(closing.card_sales ?? 0)))}</strong></span>
          <span>Online: <strong>${escapeHtml(formatPaymentAmount(Number(closing.online_sales ?? 0)))}</strong></span>
          <span>Refunds: <strong>${escapeHtml(formatPaymentAmount(Number(closing.refund_total ?? 0)))}</strong></span>
        </div>

        <div class="admin-payment-row-meta" style="margin-bottom:12px;">
          <span>Begin kas: <strong>${escapeHtml(formatPaymentAmount(Number(closing.opening_amount ?? 0)))}</strong></span>
          <span>Verwacht: <strong>${escapeHtml(formatPaymentAmount(Number(closing.expected_amount ?? 0)))}</strong></span>
          <span>Geteld: <strong>${escapeHtml(formatPaymentAmount(Number(closing.counted_amount ?? 0)))}</strong></span>
          <span>Verschil: <strong>${escapeHtml(formatPaymentAmount(Number(closing.difference_amount ?? 0)))}</strong></span>
        </div>

        ${
          adminDailyClosingVat.length === 0
            ? `<div class="admin-payment-empty">Geen aparte BTW-regels opgeslagen.</div>`
            : `
              <div class="admin-payment-list">
                ${adminDailyClosingVat.map((vatRow) => `
                  <article class="admin-payment-row">
                    <div>
                      <strong>${Number(vatRow.vat_rate).toFixed(0)}% BTW</strong>
                      <div class="admin-payment-row-meta">
                        <span>Incl.: <strong>${escapeHtml(formatPaymentAmount(Number(vatRow.gross_amount ?? 0)))}</strong></span>
                        <span>Excl.: <strong>${escapeHtml(formatPaymentAmount(Number(vatRow.net_amount ?? 0)))}</strong></span>
                        <span>BTW: <strong>${escapeHtml(formatPaymentAmount(Number(vatRow.vat_amount ?? 0)))}</strong></span>
                      </div>
                    </div>
                  </article>
                `).join('')}
              </div>
            `
        }
      </section>
    `
  }

  return `
    <section class="admin-payment-panel">
      <div class="admin-payment-panel-header">
        <div>
          <h2>Dagafsluiting / Z-rapport</h2>
          <p class="muted">Sla omzet, BTW, betaalmethodes, refunds en kasgegevens definitief op.</p>
        </div>

        <button class="admin-secondary-btn" id="admin-create-daily-closing">
          Dag afsluiten
        </button>
      </div>

      <div class="admin-payment-empty">
        Dit kan maar één keer per kalenderdag. Controleer eerst of de kas correct is afgesloten.
      </div>
    </section>
  `
}


function getFilteredAdminDailyClosingHistory() {
  const sorted = [...adminDailyClosingHistory].sort((a, b) => {
    return String(b.business_date).localeCompare(String(a.business_date))
  })

  if (!adminDailyClosingDateFilter) {
    return sorted
  }

  return sorted.filter(
    (closing) => closing.business_date === adminDailyClosingDateFilter
  )
}

function clearAdminDailyClosingDateFilter() {
  adminDailyClosingDateFilter = ''
  closeAdminDailyClosingHistoryItem()
}

function renderAdminDailyClosingHistory() {
  const filteredHistory = getFilteredAdminDailyClosingHistory()

  return `
    <section class="admin-payment-panel">
      <div class="admin-payment-panel-header">
        <div>
          <h2>Z-rapport historie</h2>
          <p class="muted">Bekijk en exporteer eerdere dagafsluitingen. Nieuwste rapport staat bovenaan.</p>
        </div>
      </div>

      <div style="display:flex; gap:10px; align-items:end; flex-wrap:wrap; margin-bottom:14px;">
        <label style="display:flex; flex-direction:column; gap:5px; min-width:190px;">
          <span class="muted">Filter op datum</span>
          <input
            id="admin-daily-closing-date-filter"
            class="admin-input"
            type="date"
            value="${escapeHtml(adminDailyClosingDateFilter)}"
          />
        </label>

        <button
          class="admin-secondary-btn"
          id="admin-clear-daily-closing-date-filter"
          type="button"
          ${adminDailyClosingDateFilter ? '' : 'disabled'}
        >
          Filter wissen
        </button>
      </div>

      ${
        isLoadingDailyClosingHistory
          ? `<div class="admin-payment-empty">Z-rapporten laden...</div>`
          : adminDailyClosingHistory.length === 0
            ? `<div class="admin-payment-empty">Nog geen opgeslagen Z-rapporten.</div>`
            : filteredHistory.length === 0
              ? `<div class="admin-payment-empty">Geen Z-rapport gevonden voor deze datum.</div>`
              : `
                <div class="admin-payment-list">
                  ${filteredHistory.map((closing) => `
                    <article class="admin-payment-row">
                      <div style="flex:1; min-width:0;">
                        <strong>${escapeHtml(closing.business_date)}</strong>
                        <div class="admin-payment-row-meta">
                          <span>Orders: <strong>${Number(closing.order_count ?? 0)}</strong></span>
                          <span>Bruto: <strong>${escapeHtml(formatPaymentAmount(Number(closing.gross_sales ?? 0)))}</strong></span>
                          <span>BTW: <strong>${escapeHtml(formatPaymentAmount(Number(closing.vat_total ?? 0)))}</strong></span>
                          <span>Kasverschil: <strong>${escapeHtml(formatPaymentAmount(Number(closing.difference_amount ?? 0)))}</strong></span>
                        </div>
                      </div>

                      <div style="display:flex; gap:8px; flex-wrap:wrap; justify-content:flex-end;">
                        <button
                          class="admin-secondary-btn"
                          type="button"
                          data-admin-view-daily-closing="${escapeHtml(String(closing.id))}"
                        >
                          Bekijken
                        </button>

                        <button
                          class="admin-secondary-btn"
                          type="button"
                          data-admin-export-history-closing="${escapeHtml(String(closing.id))}"
                        >
                          CSV exporteren
                        </button>
                      </div>
                    </article>
                  `).join('')}
                </div>
              `
      }

      ${
        adminSelectedDailyClosing
          ? `
            <article class="admin-payment-row" style="margin-top:16px;">
              <div style="width:100%;">
                <div class="admin-payment-panel-header">
                  <div>
                    <h3>Z-rapport ${escapeHtml(adminSelectedDailyClosing.business_date)}</h3>
                    <p class="muted">
                      Afgesloten op ${escapeHtml(formatDate(adminSelectedDailyClosing.closed_at))}
                      · ${escapeHtml(adminSelectedDailyClosing.closed_by || 'staff')}
                    </p>
                  </div>

                  <button
                    class="admin-secondary-btn"
                    id="admin-close-daily-closing-history-detail"
                    type="button"
                  >
                    Sluiten
                  </button>
                </div>

                <div class="admin-payment-row-meta" style="margin-bottom:12px;">
                  <span>Orders: <strong>${Number(adminSelectedDailyClosing.order_count ?? 0)}</strong></span>
                  <span>Omzet incl. BTW: <strong>${escapeHtml(formatPaymentAmount(Number(adminSelectedDailyClosing.gross_sales ?? 0)))}</strong></span>
                  <span>Omzet excl. BTW: <strong>${escapeHtml(formatPaymentAmount(Number(adminSelectedDailyClosing.net_sales ?? 0)))}</strong></span>
                  <span>BTW: <strong>${escapeHtml(formatPaymentAmount(Number(adminSelectedDailyClosing.vat_total ?? 0)))}</strong></span>
                </div>

                <div class="admin-payment-row-meta" style="margin-bottom:12px;">
                  <span>Cash: <strong>${escapeHtml(formatPaymentAmount(Number(adminSelectedDailyClosing.cash_sales ?? 0)))}</strong></span>
                  <span>Card: <strong>${escapeHtml(formatPaymentAmount(Number(adminSelectedDailyClosing.card_sales ?? 0)))}</strong></span>
                  <span>Online: <strong>${escapeHtml(formatPaymentAmount(Number(adminSelectedDailyClosing.online_sales ?? 0)))}</strong></span>
                  <span>Refunds: <strong>${escapeHtml(formatPaymentAmount(Number(adminSelectedDailyClosing.refund_total ?? 0)))}</strong></span>
                </div>

                <div class="admin-payment-row-meta" style="margin-bottom:12px;">
                  <span>Begin kas: <strong>${escapeHtml(formatPaymentAmount(Number(adminSelectedDailyClosing.opening_amount ?? 0)))}</strong></span>
                  <span>Verwacht: <strong>${escapeHtml(formatPaymentAmount(Number(adminSelectedDailyClosing.expected_amount ?? 0)))}</strong></span>
                  <span>Geteld: <strong>${escapeHtml(formatPaymentAmount(Number(adminSelectedDailyClosing.counted_amount ?? 0)))}</strong></span>
                  <span>Verschil: <strong>${escapeHtml(formatPaymentAmount(Number(adminSelectedDailyClosing.difference_amount ?? 0)))}</strong></span>
                </div>

                ${
                  adminSelectedDailyClosingVat.length === 0
                    ? `<div class="admin-payment-empty">Geen aparte BTW-regels opgeslagen.</div>`
                    : `
                      <div class="admin-payment-list">
                        ${adminSelectedDailyClosingVat.map((vatRow) => `
                          <article class="admin-payment-row">
                            <div>
                              <strong>${Number(vatRow.vat_rate).toFixed(0)}% BTW</strong>
                              <div class="admin-payment-row-meta">
                                <span>Incl.: <strong>${escapeHtml(formatPaymentAmount(Number(vatRow.gross_amount ?? 0)))}</strong></span>
                                <span>Excl.: <strong>${escapeHtml(formatPaymentAmount(Number(vatRow.net_amount ?? 0)))}</strong></span>
                                <span>BTW: <strong>${escapeHtml(formatPaymentAmount(Number(vatRow.vat_amount ?? 0)))}</strong></span>
                              </div>
                            </div>
                          </article>
                        `).join('')}
                      </div>
                    `
                }
              </div>
            </article>
          `
          : ''
      }
    </section>
  `
}

// =============================
// ADMIN: CASH SESSION
// =============================

async function loadActiveCashSession() {
  const { data, error } = await supabase
    .from('cash_sessions')
    .select('*')
    .eq('status', 'open')
    .order('opened_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    adminError = `Open kas laden mislukt: ${error.message}`
    activeCashSession = null
    return
  }

  activeCashSession = data ? (data as CashSession) : null
}

function parseEuroAmountToCents(value: string) {
  const normalized = value.trim().replace(',', '.')
  const amount = Number(normalized)

  if (!Number.isFinite(amount) || amount < 0) {
    return null
  }

  return Math.round(amount * 100)
}


async function addManualCashMovement(movementType: 'cash_in' | 'cash_out') {
  if (!activeCashSession) {
    window.alert('Open eerst de kas voordat je een kasbeweging registreert.')
    return
  }

  const label = movementType === 'cash_in' ? 'storting' : 'opname'
  const amountInput = window.prompt(
    `Welk bedrag wil je als kas${label} registreren? Bijvoorbeeld 20,00`
  )

  if (amountInput === null) return

  const amountCents = parseEuroAmountToCents(amountInput)

  if (amountCents === null || amountCents <= 0) {
    window.alert('Vul een bedrag groter dan €0,00 in, bijvoorbeeld 20,00.')
    return
  }

  const reasonInput = window.prompt(
    movementType === 'cash_in'
      ? 'Wat is de reden van deze kasstorting? Bijvoorbeeld: Extra wisselgeld'
      : 'Wat is de reden van deze kasopname? Bijvoorbeeld: Geld naar kluis'
  )

  if (reasonInput === null) return

  const reason = reasonInput.trim()

  if (!reason) {
    window.alert('Vul een reden in. Een kasstorting of kasopname moet herleidbaar zijn.')
    return
  }

  const actor = 'staff'
  const signedAmount = movementType === 'cash_in' ? amountCents : -amountCents

  const { data: movement, error } = await supabase
    .from('cash_movements')
    .insert({
      cash_session_id: activeCashSession.id,
      movement_type: movementType,
      amount: signedAmount,
      order_id: null,
      payment_id: null,
      reason,
      actor,
    })
    .select('*')
    .single()

  if (error) {
    window.alert(`Kasbeweging opslaan mislukt: ${error.message}`)
    return
  }

  const { error: auditError } = await supabase
    .from('audit_logs')
    .insert({
      event_type: movementType === 'cash_in' ? 'CASH_IN' : 'CASH_OUT',
      entity_type: 'cash_movement',
      entity_id: String(movement.id),
      old_data: null,
      new_data: {
        cash_session_id: activeCashSession.id,
        movement_type: movementType,
        amount: signedAmount,
      },
      reason,
      actor,
    })

  if (auditError) {
    console.error('Kasbeweging auditlog opslaan mislukt:', auditError)
  }

  adminMessage = `${movementType === 'cash_in' ? 'Kasstorting' : 'Kasopname'} van ${formatPaymentAmount(amountCents)} geregistreerd.`
  adminError = ''
  render()
}

async function closeCashSession() {
  if (!activeCashSession) {
    window.alert('Er is geen open kas om af te sluiten.')
    return
  }

  const { data: movements, error: movementsError } = await supabase
    .from('cash_movements')
    .select('amount')
    .eq('cash_session_id', activeCashSession.id)

  if (movementsError) {
    window.alert(`Kasbewegingen laden mislukt: ${movementsError.message}`)
    return
  }

  const movementTotal = (movements || []).reduce(
    (sum, movement) => sum + Number(movement.amount || 0),
    0
  )

  const expectedAmount =
    Number(activeCashSession.opening_amount || 0) + movementTotal

  const countedInput = window.prompt(
    `Verwacht kasbedrag: ${formatPaymentAmount(expectedAmount)}\n\nHoeveel contant geld heb je werkelijk geteld? Bijvoorbeeld 164,90`
  )

  if (countedInput === null) return

  const countedAmount = parseEuroAmountToCents(countedInput)

  if (countedAmount === null) {
    window.alert('Vul een geldig geteld bedrag in, bijvoorbeeld 164,90.')
    return
  }

  const differenceAmount = countedAmount - expectedAmount

  const confirmed = window.confirm(
    `Kas afsluiten?\n\n` +
      `Verwacht: ${formatPaymentAmount(expectedAmount)}\n` +
      `Geteld: ${formatPaymentAmount(countedAmount)}\n` +
      `Verschil: ${formatPaymentAmount(differenceAmount)}\n\n` +
      `Na bevestigen wordt deze kassasessie afgesloten.`
  )

  if (!confirmed) return

  const actor = 'staff'
  const closedAt = new Date().toISOString()
  const oldData = {
    status: activeCashSession.status,
    opening_amount: activeCashSession.opening_amount,
  }

  const { data: closedSession, error: closeError } = await supabase
    .from('cash_sessions')
    .update({
      closed_at: closedAt,
      expected_amount: expectedAmount,
      counted_amount: countedAmount,
      difference_amount: differenceAmount,
      closed_by: actor,
      status: 'closed',
    })
    .eq('id', activeCashSession.id)
    .eq('status', 'open')
    .select('*')
    .single()

  if (closeError) {
    window.alert(`Kas afsluiten mislukt: ${closeError.message}`)
    return
  }

  const { error: auditError } = await supabase
    .from('audit_logs')
    .insert({
      event_type: 'CASH_SESSION_CLOSED',
      entity_type: 'cash_session',
      entity_id: String(activeCashSession.id),
      old_data: oldData,
      new_data: {
        status: 'closed',
        closed_at: closedAt,
        expected_amount: expectedAmount,
        counted_amount: countedAmount,
        difference_amount: differenceAmount,
      },
      reason: 'Kas afgesloten',
      actor,
    })

  if (auditError) {
    console.error('Kas-afsluit auditlog opslaan mislukt:', auditError)
  }

  activeCashSession = null
  adminMessage =
    `Kas afgesloten. Verwacht ${formatPaymentAmount(expectedAmount)}, ` +
    `geteld ${formatPaymentAmount(countedAmount)}, ` +
    `verschil ${formatPaymentAmount(differenceAmount)}.`
  adminError = ''

  console.log('Kas afgesloten:', closedSession)
  render()
}

async function openCashSession() {
  if (activeCashSession) {
    window.alert('Er staat al een kas open.')
    return
  }

  const input = window.prompt(
    'Hoeveel contant wisselgeld zit er nu in de kassalade? Bijvoorbeeld 150,00'
  )

  if (input === null) return

  const openingAmount = parseEuroAmountToCents(input)

  if (openingAmount === null) {
    window.alert('Vul een geldig bedrag in, bijvoorbeeld 150,00.')
    return
  }

  const actor = 'staff'

  const { data, error } = await supabase
    .from('cash_sessions')
    .insert({
      opening_amount: openingAmount,
      opened_by: actor,
      status: 'open',
    })
    .select('*')
    .single()

  if (error) {
    window.alert(`Kas openen mislukt: ${error.message}`)
    return
  }

  activeCashSession = data as CashSession

  const { error: auditError } = await supabase
    .from('audit_logs')
    .insert({
      event_type: 'CASH_SESSION_OPENED',
      entity_type: 'cash_session',
      entity_id: String(activeCashSession.id),
      old_data: null,
      new_data: {
        status: 'open',
        opening_amount: openingAmount,
      },
      reason: 'Kas geopend',
      actor,
    })

  if (auditError) {
    console.error('Kas-open auditlog opslaan mislukt:', auditError)
  }

  adminMessage = `Kas geopend met ${formatPaymentAmount(openingAmount)} wisselgeld.`
  adminError = ''
  render()
}

function renderCashRegistrationSetting() {
  return `
    <section class="admin-payment-panel">
      <div class="admin-payment-panel-header">
        <div>
          <h2>Kasregistratie gebruiken</h2>
          <p class="muted">
            Bepaal of een geopende kassasessie verplicht is voor contante betalingen.
          </p>
        </div>

        <div class="admin-cash-registration-toggle-wrap">
          <span class="admin-cash-registration-status">
            ${cashRegistrationEnabled ? 'AAN' : 'UIT'}
          </span>

          <label class="pos-wait-switch" aria-label="Kasregistratie aan of uit">
            <input
              id="admin-cash-registration-enabled"
              type="checkbox"
              ${cashRegistrationEnabled ? 'checked' : ''}
            />
            <span class="pos-wait-switch-track">
              <span class="pos-wait-switch-thumb"></span>
            </span>
          </label>
        </div>
      </div>

      <div class="admin-payment-empty">
        ${
          cashRegistrationEnabled
            ? 'AAN: cash afrekenen kan alleen met een geopende kas en wordt in de kassasessie geregistreerd.'
            : 'UIT: cash afrekenen kan zonder geopende kas. De verkoop blijft in orders/Z-rapport staan, maar wordt niet aan een kassasessie gekoppeld.'
        }
      </div>
    </section>
  `
}

function renderAdminCashSession() {
  if (!activeCashSession) {
    return `
      <section class="admin-payment-panel">
        <div class="admin-payment-panel-header">
          <div>
            <h2>Kasadministratie</h2>
            <p class="muted">Er is momenteel geen kassasessie geopend.</p>
          </div>

          <button class="admin-secondary-btn" id="admin-open-cash-session">
            Kas openen
          </button>
        </div>

        <div class="admin-payment-empty">
          Open de kas voordat je contante verkopen automatisch gaat registreren.
        </div>
      </section>
    `
  }

  return `
    <section class="admin-payment-panel">
      <div class="admin-payment-panel-header">
        <div>
          <h2>Kasadministratie</h2>
          <p class="muted">Kassasessie is geopend.</p>
        </div>

        <div style="display:flex; gap:8px; align-items:center; flex-wrap:wrap;">
          <button class="admin-secondary-btn" id="admin-cash-in">Kas storten</button>
          <button class="admin-secondary-btn" id="admin-cash-out">Kas opnemen</button>
          <button class="admin-secondary-btn" id="admin-close-cash-session">Kas afsluiten</button>
          <span class="order-payment-badge order-payment-paid">Open</span>
        </div>
      </div>

      <div class="admin-payment-row-meta">
        <span>
          Geopend:
          <strong>${escapeHtml(formatDate(activeCashSession.opened_at))}</strong>
        </span>

        <span>
          Beginbedrag:
          <strong>${escapeHtml(formatPaymentAmount(activeCashSession.opening_amount))}</strong>
        </span>

        <span>
          Geopend door:
          <strong>${escapeHtml(activeCashSession.opened_by || 'staff')}</strong>
        </span>
      </div>
    </section>
  `
}

// =============================
// ADMIN: LOAD ALL DATA
// Admin must also see inactive products/toppings.
// =============================

async function loadAllAdminData() {
  const { startIso, endIso } = getTodayDateRange()

  adminError = ''
  await loadActiveCashSession()
  await loadAdminDailyClosing()
  await loadAdminDailyClosingHistory()
  await loadBestSellerSales()

  const [
    { data: productData, error: productError },
    { data: toppingData, error: toppingError },
    { data: productToppingData, error: productToppingError },
    { data: categoryData, error: categoryError },
    { data: todayOrderData, error: todayOrderError },
  ] = await Promise.all([
    supabase
      .from('products')
      .select('*')
      .order('category', { ascending: true })
      .order('name', { ascending: true }),
    supabase
      .from('toppings')
      .select('*')
      .order('name', { ascending: true }),
    supabase
      .from('product_toppings')
      .select('product_id,topping_id'),
    supabase
      .from('categories')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true }),
    supabase
      .from('orders')
      .select('*')
      .gte('created_at', startIso)
      .lt('created_at', endIso)
      .order('created_at', { ascending: false }),
  ])

  if (productError) {
    adminError = `Producten laden mislukt: ${productError.message}`
    render()
    return
  }

  if (toppingError) {
    adminError = `Toppings laden mislukt: ${toppingError.message}`
    render()
    return
  }

  if (productToppingError) {
    adminError = `Product toppings laden mislukt: ${productToppingError.message}`
    render()
    return
  }

  if (categoryError) {
    adminError = `Categorieën laden mislukt: ${categoryError.message}`
    render()
    return
  }

  if (todayOrderError) {
    adminError = `Dagomzet laden mislukt: ${todayOrderError.message}`
    render()
    return
  }

  products = (productData ?? []) as Product[]
  toppings = (toppingData ?? []) as Topping[]
  productToppingLinks = (productToppingData ?? []) as ProductToppingLink[]
  categories = (categoryData ?? []) as Category[]
  adminTodayOrders = (todayOrderData ?? []) as Order[]

  let shouldRefreshSystemCategories = false

  if (!getDiscountSystemCategory()) {
    await ensureDiscountSystemCategory()
    shouldRefreshSystemCategories = true
  }

  if (!getBestSellerSystemCategory()) {
    await ensureBestSellerSystemCategory()
    shouldRefreshSystemCategories = true
  }

  if (shouldRefreshSystemCategories) {
    const { data: refreshedCategories } = await supabase
      .from('categories')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true })

    if (refreshedCategories) {
      categories = refreshedCategories as Category[]
    }
  }

  const todayOrderIds = adminTodayOrders.map((order) => order.id)

  if (todayOrderIds.length === 0) {
    adminTodayOrderItems = []
    paymentRecords = []
    render()
    return
  }

  const { data: todayItemsData, error: todayItemsError } = await supabase
    .from('order_items')
    .select('*')
    .in('order_id', todayOrderIds)

  if (todayItemsError) {
    adminError = `Verkochte drankjes laden mislukt: ${todayItemsError.message}`
    render()
    return
  }

  adminTodayOrderItems = (todayItemsData ?? []) as OrderItem[]
  await loadPaymentsForOrders(adminTodayOrders)
  render()
}

// =============================
// RENDER: SHARED UI
// =============================

function renderNav() {
  return `
    <nav class="top-nav">
      <button class="nav-btn ${screen === 'pos' || screen === 'pos-settings' ? 'active' : ''}" id="go-pos">
        POS
      </button>

      <button class="nav-btn ${screen === 'orders' ? 'active' : ''}" id="go-orders">
        Orders
      </button>

      <button class="nav-btn ${screen === 'kitchen' ? 'active' : ''}" id="go-kitchen">
        Kitchen
      </button>

      <button class="nav-btn ${
        screen === 'admin' ||
        screen === 'admin-products' ||
        screen === 'admin-sales' ||
        screen === 'admin-day-close' ||
        screen === 'admin-add-product' ||
        screen === 'admin-add-topping' ||
        screen === 'admin-categories'
          ? 'active'
          : ''
      }" id="go-admin">
        Admin
      </button>
    </nav>
  `
}

function renderOrderFilters() {
  const filters: OrderFilter[] = ['all', 'active', 'preparation', 'completed']

  return `
    <div class="order-filters" data-active-filter="${orderFilter}">
      ${filters
        .map(
          (filter) => `
            <button 
              class="filter-btn ${orderFilter === filter ? 'active' : ''}" 
              data-order-filter="${filter}"
            >
              ${getOrderFilterText(filter)}
            </button>
          `
        )
        .join('')}
    </div>
  `
}

function getOrderedCategoryNames(grouped: Record<string, Product[]>) {
  const groupedNames = Object.keys(grouped)

  const orderedFromDatabase = categories
    .filter((category) => {
      if (!category.is_active) {
        return false
      }

      if (isDiscountSystemCategory(category)) {
        return groupedNames.includes(DISCOUNT_CATEGORY_KEY)
      }

      if (isBestSellerSystemCategory(category)) {
        return groupedNames.includes(BESTSELLER_CATEGORY_KEY)
      }

      if (isHotSystemCategory(category)) {
        return groupedNames.includes(HOT_CATEGORY_KEY)
      }

      return groupedNames.includes(category.name)
    })
    .sort((a, b) => {
      const sortDifference =
        Number(a.sort_order ?? 0) - Number(b.sort_order ?? 0)

      if (sortDifference !== 0) {
        return sortDifference
      }

      return a.name.localeCompare(b.name)
    })
    .map((category) => {
      if (isDiscountSystemCategory(category)) {
        return DISCOUNT_CATEGORY_KEY
      }

      if (isBestSellerSystemCategory(category)) {
        return BESTSELLER_CATEGORY_KEY
      }

      if (isHotSystemCategory(category)) {
        return HOT_CATEGORY_KEY
      }

      return category.name
    })

  const missingNames = groupedNames
    .filter((name) => !orderedFromDatabase.includes(name))
    .sort((a, b) => a.localeCompare(b))

  return [...orderedFromDatabase, ...missingNames]
}

function renderProductGroups(grouped: Record<string, Product[]>) {
  if (Object.keys(grouped).length === 0) {
    return `<p>Geen producten gevonden.</p>`
  }

  return getOrderedCategoryNames(grouped)
    .map(
      (category, index) => {
        const items = grouped[category] ?? []

        return `
        <div class="category-block" id="category-${index}">
          <h3>${escapeHtml(getCategoryDisplayName(category))}</h3>

          <div class="product-grid">
            ${items
              .map(
                (product) => `
                  <button
                    class="product-card ${hasProductDiscount(product) ? 'has-discount' : ''} ${product.is_sold_out ? 'sold-out' : ''} ${product.image_url ? 'has-image' : ''}"
                    data-add="${product.id}"
                    data-pos-product-search="${escapeHtml(
                      `${product.name} ${product.category}`.toLowerCase()
                    )}"
                    ${product.is_sold_out ? 'disabled aria-disabled="true"' : ''}
                  >
                    ${
                      product.image_url
                        ? `
                          <span class="product-card-image-wrap">
                            <img
                              class="product-card-image"
                              src="${escapeHtml(product.image_url)}"
                              alt="${escapeHtml(product.name)}"
                              loading="lazy"
                            />
                          </span>
                        `
                        : ''
                    }

                    <span class="product-name">${escapeHtml(product.name)}</span>

                    ${
                      screen === 'customer'
                        ? `
                          <div class="customer-product-meta-pills">
                            ${
                              product.tea_type
                                ? `
                                  <span class="customer-product-tea-type ${getTeaTypeBadgeClass(product.tea_type)}">
                                    ${escapeHtml(product.tea_type)}
                                  </span>
                                `
                                : ''
                            }

                            ${
                              product.temperature_label
                                ? `
                                  <span class="customer-product-temperature">
                                    ${escapeHtml(product.temperature_label)}
                                  </span>
                                `
                                : ''
                            }
                          </div>
                        `
                        : ''
                    }

                    ${
                      product.is_sold_out
                        ? `<span class="product-sold-out-badge">Uitverkocht</span>`
                        : ''
                    }
                    ${
                      hasProductDiscount(product)
                        ? `
                          <span class="product-discount-badge">
                            ${escapeHtml(getProductDiscountLabel(product))}
                          </span>

                          <span class="product-price-stack">
                            <span class="product-original-price">
                              € ${Number(product.base_price).toFixed(2)}
                            </span>

                            <span class="product-sale-price">
                              € ${getDiscountedProductPrice(product).toFixed(2)}
                            </span>
                          </span>
                        `
                        : `
                          <span class="product-price">
                            € ${Number(product.base_price).toFixed(2)}
                          </span>
                        `
                    }
                  </button>
                `
              )
              .join('')}
          </div>
        </div>
      `
      }
    )
    .join('')
}

function renderCart(isCustomer: boolean) {
  return `
    <aside class="cart">
      <h2>${isCustomer ? 'Jouw bestelling' : 'Winkelmand'}</h2>

      ${
        cart.length === 0
          ? `<p class="empty-cart">Nog geen items toegevoegd.</p>`
          : `
            <div class="cart-list">
              ${cart
                .map(
                  (item) => `
                    <div class="cart-item">
                      <div class="pos-cart-item-info">
                        <div class="cart-item-name">${escapeHtml(item.product.name)}</div>
                        <div class="cart-item-price">€ ${getCartItemUnitPrice(item).toFixed(2)} per stuk</div>
                        ${item.product.product_type === 'item' ? '' : renderModifierSummary(item.iceLevel, item.sugarLevel, item.toppings, item.cupSize)}
                      </div>

                      <div class="pos-cart-item-controls">
                        <div class="qty-controls">
                          <button data-minus="${item.cartItemId}">-</button>
                          <span>${item.quantity}</span>
                          <button data-plus="${item.cartItemId}">+</button>
                        </div>

                        ${
                          !isCustomer
                            ? `
                              <div class="pos-cart-item-buttons">
                                <button class="pos-cart-edit" data-edit-cart-item="${item.cartItemId}">
                                  Bewerken
                                </button>
                                <button class="pos-cart-remove" data-remove="${item.cartItemId}">
                                  Verwijder
                                </button>
                              </div>
                            `
                            : ''
                        }
                      </div>
                    </div>
                  `
                )
                .join('')}
            </div>
          `
      }

      <div class="cart-footer">
        <div class="total-row">
          <span>Totaal</span>
          <strong>€ ${getTotal().toFixed(2)}</strong>
        </div>

        <div class="checkout-actions">
          <button class="checkout-btn cash" id="checkout-cash-btn" ${cart.length === 0 || isSubmitting ? 'disabled' : ''}>
            ${isSubmitting ? 'Opslaan...' : 'Cash betaald'}
          </button>

          <button class="checkout-btn card" id="checkout-card-btn" ${cart.length === 0 || isSubmitting ? 'disabled' : ''}>
            ${isSubmitting ? 'Opslaan...' : 'Card betaald'}
          </button>
        </div>
      </div>
    </aside>
  `
}


// =============================
// RENDER: CUSTOMER
// =============================

function renderCustomerCategorySidebar(grouped: Record<string, Product[]>) {
  const orderedCategories = getOrderedCategoryNames(grouped)

  if (orderedCategories.length === 0) {
    return ''
  }

  return `
    <aside class="customer-category-sidebar">
      ${orderedCategories
        .map(
          (category, index) => `
            <a 
              class="customer-category-link ${index === 0 ? 'active' : ''}" 
              href="#category-${index}"
              data-category-link="${index}"
            >
              ${escapeHtml(getCategoryDisplayName(category))}
            </a>
          `
        )
        .join('')}
    </aside>
  `
}

function renderCustomerCustomizer() {
  if (!customizerProduct) {
    return ''
  }

  const allowIceCustomization =
    productAllowsIceCustomization(customizerProduct)

  const allowSugarCustomization =
    productAllowsSugarCustomization(customizerProduct)

  const allowedIceLevels =
    getProductAllowedIceLevels(
      customizerProduct,
      customizerCupSize
    )

  const allowedSugarLevels =
    getProductAllowedSugarLevels(customizerProduct)

  const fixedIceLevel =
    getFixedIceLevelForProduct(customizerProduct)

  const availableCupSizes =
    getProductAvailableSizes(customizerProduct)

  const hasMultipleCupSizes = availableCupSizes.length > 1

  const selectionIsValid = isCustomizerSelectionValid()

  return `
    <div class="customer-customizer-overlay ${isCustomerCustomizerOpen ? 'open' : ''}" id="customer-customizer-overlay"></div>

    <section class="customer-customizer ${isCustomerCustomizerOpen ? 'open' : ''}">
      <div class="customer-customizer-header">
        <div>
          <p class="muted">${escapeHtml(t('customizeDrink'))}</p>
          <h2>${escapeHtml(customizerProduct.name)}</h2>

          ${
            hasProductDiscount(customizerProduct)
              ? `
                <div class="customizer-price-discount">
                  <span class="product-original-price">
                    € ${getProductSizePrice(
                      customizerProduct,
                      customizerCupSize ?? getDefaultCupSizeForProduct(customizerProduct)
                    ).toFixed(2)}
                  </span>
                  <strong>
                    € ${getCustomizerCupSizePrice(
                      customizerCupSize ?? getDefaultCupSizeForProduct(customizerProduct)
                    ).toFixed(2)}
                  </strong>
                  <span class="discount-mini-badge">
                    ${escapeHtml(getProductDiscountLabel(customizerProduct))}
                  </span>
                </div>
              `
              : `
                <strong>
                  € ${getProductSizePrice(
                    customizerProduct,
                    customizerCupSize ?? getDefaultCupSizeForProduct(customizerProduct)
                  ).toFixed(2)}
                </strong>
              `
          }
        </div>

        <button class="customer-customizer-close" id="customer-customizer-close">×</button>
      </div>

      <div class="customer-customizer-content">
        <section class="customer-customizer-section">
          <div class="customer-customizer-section-title">
            <h3>Bekergrootte${hasMultipleCupSizes ? ' *' : ''}</h3>
            <span>${hasMultipleCupSizes ? escapeHtml(t('required')) : 'Vast'}</span>
          </div>

          ${
            hasMultipleCupSizes
              ? `
                <div class="customer-size-options">
                  ${availableCupSizes.map(
                    (size) => `
                      <button
                        class="customer-size-option ${customizerCupSize === size ? 'active' : ''}"
                        data-cup-size="${size}"
                        type="button"
                      >
                        <span>${escapeHtml(getCupSizeLabel(size))}</span>
                        <strong>
                          ${
                            size === 'large' && availableCupSizes.includes('medium')
                              ? `+ € ${Math.max(0, getCustomizerCupSizePrice('large') - getCustomizerCupSizePrice('medium')).toFixed(2)}`
                              : 'Inbegrepen'
                          }
                        </strong>
                      </button>
                    `
                  ).join('')}
                </div>
              `
              : `
                <div class="customer-fixed-modifier">
                  <span>${escapeHtml(getCupSizeLabel(availableCupSizes[0]))}</span>
                  <small>Vaste maat voor dit drankje</small>
                </div>
              `
          }
        </section>

        ${
          allowIceCustomization
            ? `
              <section class="customer-customizer-section">
                <div class="customer-customizer-section-title">
                  <h3>${escapeHtml(t('iceLevel'))} *</h3>
                  <span>${escapeHtml(t('required'))}</span>
                </div>

                <div class="customer-modifier-options">
                  ${allowedIceLevels.map(
                    (level) => `
                      <button
                        class="customer-modifier-option ${customizerIceLevel === level ? 'active' : ''}"
                        data-ice-level="${level}"
                      >
                        ${escapeHtml(getIceLevelText(level))}
                      </button>
                    `
                  ).join('')}
                </div>
              </section>
            `
            : fixedIceLevel
              ? `
                <section class="customer-customizer-section">
                  <div class="customer-customizer-section-title">
                    <h3>${escapeHtml(t('iceLevel'))}</h3>
                    <span>Vast</span>
                  </div>

                  <div class="customer-fixed-modifier">
                    <span>${escapeHtml(getIceLevelText(fixedIceLevel))}</span>
                    <small>Dit is de standaard voor dit drankje</small>
                  </div>
                </section>
              `
              : ''
        }

        ${
          allowSugarCustomization
            ? `
              <section class="customer-customizer-section">
                <div class="customer-customizer-section-title">
                  <h3>${escapeHtml(t('sugarLevel'))} *</h3>
                  <span>${escapeHtml(t('required'))}</span>
                </div>

                <div class="customer-modifier-options sugar-options">
                  ${allowedSugarLevels.map(
                    (level) => `
                      <button
                        class="customer-modifier-option ${customizerSugarLevel === level ? 'active' : ''}"
                        data-sugar-level="${level}"
                      >
                        ${escapeHtml(getSugarLevelText(level))}
                      </button>
                    `
                  ).join('')}
                </div>
              </section>
            `
            : ''
        }

        <section class="customer-customizer-section">
          <div class="customer-customizer-section-title">
            <h3>${escapeHtml(t('toppings'))}</h3>
            <span>${escapeHtml(t('multiplePossible'))}</span>
          </div>

          <div class="customer-topping-options">
            ${
              getAllowedToppingsForProduct(customizerProduct.id).length === 0
                ? `<p class="muted">${escapeHtml(t('noToppings'))}</p>`
                : getAllowedToppingsForProduct(customizerProduct.id)
                    .map(
                      (topping) => `
                        <button
                          class="customer-topping-option ${customizerToppingIds.includes(String(topping.id)) ? 'active' : ''}"
                          data-topping-id="${topping.id}"
                        >
                          <span>${escapeHtml(topping.name)}</span>
                          <strong>+ € ${Number(topping.price).toFixed(2)}</strong>
                        </button>
                      `
                    )
                    .join('')
            }
          </div>
        </section>
      </div>

      <div class="customer-customizer-footer">
        <div>
          <span>${escapeHtml(t('total'))}</span>
          <strong>€ ${getCustomizerTotal().toFixed(2)}</strong>
        </div>

        <button
          class="checkout-btn"
          id="customer-customizer-add"
          ${selectionIsValid ? '' : 'disabled'}
        >
          ${
            selectionIsValid
              ? escapeHtml(editingCartItemId ? t('saveChanges') : t('addToOrder'))
              : escapeHtml(t('chooseIceSugar'))
          }
        </button>
      </div>
    </section>
  `
}

function renderCustomerCartButton() {
  const itemCount = getCartItemCount()

  return `
    <button class="customer-cart-button" id="customer-cart-button">
      <span class="customer-cart-icon">🛒</span>

      ${
        itemCount > 0
          ? `<span class="customer-cart-count">${itemCount}</span>`
          : ''
      }
    </button>
  `
}

function renderCustomerCartDrawer() {
  const itemCount = getCartItemCount()
  const drinkWord = itemCount === 1 ? t('drink') : t('drinks')

  return `
    <div class="customer-cart-overlay ${isCustomerCartOpen ? 'open' : ''}" id="customer-cart-overlay"></div>

    <aside class="customer-cart-drawer ${isCustomerCartOpen ? 'open' : ''}">
      <div class="customer-cart-drawer-header">
        <div>
          <h2>${escapeHtml(t('yourOrder'))}</h2>
          <p>${itemCount} ${escapeHtml(drinkWord)}</p>
        </div>

        <button class="customer-cart-close" id="customer-cart-close">
          ×
        </button>
      </div>

      ${
        cart.length === 0
          ? `
            <div class="customer-cart-empty">
              <p>${escapeHtml(t('emptyCart'))}</p>
              <span>${escapeHtml(t('emptyCartHint'))}</span>
            </div>
          `
          : `
            <div class="customer-cart-drawer-list">
              ${cart
                .map(
                  (item) => `
                    <div class="customer-cart-drawer-item">
                      <div>
                        <h3>${escapeHtml(item.product.name)}</h3>
                        <p>€ ${getCartItemUnitPrice(item).toFixed(2)} ${escapeHtml(t('perItem'))}</p>
                        ${item.product.product_type === 'item' ? '' : renderModifierSummary(item.iceLevel, item.sugarLevel, item.toppings, item.cupSize)}
                        <strong>€ ${getCartItemLineTotal(item).toFixed(2)}</strong>
                      </div>

                      <div class="customer-cart-item-actions">
                        <button data-minus="${item.cartItemId}">-</button>
                        <span>${item.quantity}</span>
                        <button data-plus="${item.cartItemId}">+</button>
                      </div>

                      <div
                        class="customer-cart-item-buttons"
                        style="grid-area: remove; align-self: start; justify-self: end; display: flex; flex-direction: column; align-items: flex-end; gap: 8px;"
                      >
                        <button class="customer-cart-remove" data-remove="${item.cartItemId}">
                          ${escapeHtml(t('remove'))}
                        </button>

                        <button class="customer-cart-edit" data-edit-cart-item="${item.cartItemId}">
                          ${escapeHtml(t('edit'))}
                        </button>
                      </div>
                    </div>
                  `
                )
                .join('')}
            </div>
          `
      }

      <div class="customer-cart-drawer-footer">
        <div class="total-row">
          <span>${escapeHtml(t('total'))}</span>
          <strong>€ ${getTotal().toFixed(2)}</strong>
        </div>

        <button class="checkout-btn" id="customer-checkout-btn" ${cart.length === 0 ? 'disabled' : ''}>
          ${escapeHtml(t('continueDetails'))}
        </button>
      </div>
    </aside>
  `
}

function renderCustomerCheckoutScreen() {
  return `
    <div class="customer-checkout-screen ${isCustomerCheckoutOpen ? 'open' : ''}">
      <div class="customer-checkout-header">
        <button class="customer-checkout-back" id="customer-checkout-back">
          ←
        </button>

        <div>
          <h2>${escapeHtml(t('enterDetails'))}</h2>
          <p>${escapeHtml(t('checkoutSubtitle'))}</p>
        </div>

        <button class="customer-checkout-close" id="customer-checkout-close">
          ×
        </button>
      </div>

      <div class="customer-checkout-content">
        ${message ? `<p class="error">${escapeHtml(message)}</p>` : ''}

        <section class="customer-checkout-card">
          <h3>${escapeHtml(t('contactDetails'))}</h3>

          <label class="customer-checkout-label" for="customer-name-input">
            ${escapeHtml(t('name'))}
          </label>
          <input
            id="customer-name-input"
            class="customer-checkout-input"
            type="text"
            placeholder="${escapeHtml(t('namePlaceholder'))}"
            value="${escapeHtml(customerName)}"
          />

          <label class="customer-checkout-label" for="customer-phone-input">
            ${escapeHtml(t('phone'))}
          </label>
          <input
            id="customer-phone-input"
            class="customer-checkout-input"
            type="tel"
            placeholder="${escapeHtml(t('phonePlaceholder'))}"
            value="${escapeHtml(customerPhone)}"
          />
        </section>

        <section class="customer-checkout-card">
          <h3>${escapeHtml(t('paymentMethod'))}</h3>

          <div class="customer-payment-options">
            <button
              class="customer-payment-option ${customerPaymentMethod === 'online_fake' ? 'active' : ''}"
              data-payment-method="online_fake"
            >
              <strong>${escapeHtml(t('onlinePayment'))}</strong>
              <span>${escapeHtml(t('onlinePaymentHint'))}</span>
            </button>

            <button
              class="customer-payment-option ${customerPaymentMethod === 'pay_at_counter' ? 'active' : ''}"
              data-payment-method="pay_at_counter"
            >
              <strong>${escapeHtml(t('payAtCounter'))}</strong>
              <span>${escapeHtml(t('payAtCounterHint'))}</span>
            </button>
          </div>
        </section>

        <section class="customer-checkout-card">
          <h3>${escapeHtml(t('overview'))}</h3>

          <div class="customer-checkout-items">
            ${
              cart.length === 0
                ? `<p class="muted">${escapeHtml(t('noDrinksChosen'))}</p>`
                : cart
                    .map(
                      (item) => `
                        <div class="customer-checkout-item-row customer-checkout-item-with-modifiers">
                          <div>
                            <span>${item.quantity}x ${escapeHtml(item.product.name)}</span>
                            ${item.product.product_type === 'item' ? '' : renderModifierSummary(item.iceLevel, item.sugarLevel, item.toppings, item.cupSize)}
                          </div>
                          <strong>€ ${getCartItemLineTotal(item).toFixed(2)}</strong>
                        </div>
                      `
                    )
                    .join('')
            }
          </div>

          <div class="customer-checkout-total-row">
            <span>${escapeHtml(t('total'))}</span>
            <strong>€ ${getTotal().toFixed(2)}</strong>
          </div>

          <p class="muted">
            ${escapeHtml(t('paymentMethod'))}: ${escapeHtml(getCustomerPaymentMethodText(customerPaymentMethod))}
          </p>
        </section>
      </div>

      <div class="customer-checkout-footer ${isCustomerCheckoutOpen ? 'open' : 'hidden'}">
        <button class="checkout-btn" id="customer-pay-btn" ${cart.length === 0 || isSubmitting ? 'disabled' : ''}>
          ${isSubmitting ? escapeHtml(t('placingOrder')) : escapeHtml(t('placeOrder'))}
        </button>
      </div>
    </div>
  `
}

function renderCustomer() {
  const grouped = groupProductsByCategory()

  if (isCustomerSessionExpired()) {
    clearCustomerSessionStorage()
    resetCustomerStateVariables()
    getCustomerSessionId()
  }

  if (customerOrderPlaced) {
    return `
      <div class="page customer-page customer-success-page">
        <header class="header customer-header">
          <div class="customer-brand">
            <img class="tea-shop-logo" src="/logo.jpg" alt="Tea Shop logo" />

            <div>
              <h1>${escapeHtml(t('orderPlaced'))}</h1>
              <p class="sub">${escapeHtml(t('thankYou'))}</p>
            </div>
          </div>

          ${renderCustomerLanguageSwitcher()}
        </header>

        <section class="customer-success-card">
          <p>${escapeHtml(t('pickupCode'))}</p>
          <h2>${escapeHtml(customerPickupCode)}</h2>

          <div
            class="customer-progress-box customer-progress-box-${customerOrderStatus || 'new'}"
            style="${
              customerOrderStatus === 'ready'
                ? 'background:#dff5e3;border-color:#9fd5aa;'
                : customerOrderStatus === 'preparing'
                  ? 'background:#fff3d8;border-color:#efd08d;'
                  : customerOrderStatus === 'cancelled'
                    ? 'background:#fde8e8;border-color:#efb4b4;'
                    : ''
            }"
          >
            <p class="muted">${escapeHtml(t('status'))}</p>
            <h3>${escapeHtml(getOrderStatusText(customerOrderStatus))}</h3>
            <p>${escapeHtml(getCustomerStatusMessage(customerOrderStatus))}</p>
          </div>

          <div class="customer-drink-status-list">
            <h4>${escapeHtml(t('yourDrinks'))}</h4>

            ${
              customerOrderLabels.length === 0
                ? `<p class="muted">${escapeHtml(t('loadingDrinks'))}</p>`
                : customerOrderLabels
                    .map(
                      (label) => `
                        <div class="customer-drink-status-row">
                          <div>
                            <span>${escapeHtml(label.product_name)}</span>
                            ${renderModifierSummary(label.ice_level, label.sugar_level, label.toppings, label.cup_size)}
                          </div>
                          <strong>${escapeHtml(getCustomerLabelStatusText(label.status))}</strong>
                        </div>
                      `
                    )
                    .join('')
            }
          </div>

          <p class="muted">${escapeHtml(t('autoRefresh'))}</p>

          <button class="checkout-btn" id="new-customer-order-btn">
            ${escapeHtml(t('newOrder'))}
          </button>
        </section>
      </div>
    `
  }

  return `
    <div class="page customer-page">
      <header class="header customer-header">
        <div class="customer-brand">
          <img class="tea-shop-logo" src="/logo.jpg" alt="Tea Shop logo" />

          <div>
            <h1>${escapeHtml(t('orderTitle'))}</h1>
            <p class="sub">${escapeHtml(t('orderSubtitle'))}</p>
          </div>
        </div>

        <div class="customer-header-actions">
          ${renderCustomerCartButton()}
          ${renderCustomerLanguageSwitcher()}
        </div>
      </header>

      ${renderCustomerCustomizer()}
      ${renderCustomerCartDrawer()}
      ${renderCustomerCheckoutScreen()}

      <main class="layout customer-menu-layout">
        ${renderCustomerCategorySidebar(grouped)}

        <section class="products customer-product-list">
          <h2>${escapeHtml(t('chooseDrinks'))}</h2>
          ${renderProductGroups(grouped)}
        </section>
      </main>
    </div>
  `
}



// =============================
// RENDER: ADMIN
// =============================



function getAdminProductAvailableSizes(product?: Product | null): CupSize[] {
  const configuredSizes = Array.isArray(product?.available_sizes)
    ? product.available_sizes
    : []

  const validSizes = configuredSizes.filter(
    (size): size is CupSize => size === 'medium' || size === 'large'
  )

  return validSizes.length > 0 ? validSizes : ['medium']
}

function renderAdminProductSizeFields(product?: Product | null) {
  const availableSizes = getAdminProductAvailableSizes(product)

  const mediumSelected = availableSizes.includes('medium')
  const largeSelected = availableSizes.includes('large')

  const mediumPrice =
    product?.medium_price != null
      ? Number(product.medium_price).toFixed(2)
      : mediumSelected && product
        ? Number(product.base_price).toFixed(2)
        : ''

  const largePrice =
    product?.large_price != null
      ? Number(product.large_price).toFixed(2)
      : largeSelected && product && !mediumSelected
        ? Number(product.base_price).toFixed(2)
        : ''

  return `
    <div class="admin-product-size-field">
      <div class="admin-product-size-header">
        <div>
          <strong>Bekergrootte</strong>
          <span>
            Kies welke maten beschikbaar zijn en geef iedere beschikbare maat een eigen prijs.
          </span>
        </div>
      </div>

      <div class="admin-product-size-grid">
        <label class="admin-size-card ${mediumSelected ? 'selected' : ''}">
          <div class="admin-size-card-top">
            <input
              id="admin-product-size-medium"
              type="checkbox"
              value="medium"
              ${mediumSelected ? 'checked' : ''}
            />
            <span>
              <strong>Medium</strong>
              <small>Normale beker</small>
            </span>
          </div>

          <div class="admin-size-price-row">
            <span>€</span>
            <input
              id="admin-product-medium-price"
              type="number"
              min="0"
              step="0.01"
              inputmode="decimal"
              placeholder="4.50"
              value="${mediumPrice}"
              ${mediumSelected ? '' : 'disabled'}
            />
          </div>
        </label>

        <label class="admin-size-card ${largeSelected ? 'selected' : ''}">
          <div class="admin-size-card-top">
            <input
              id="admin-product-size-large"
              type="checkbox"
              value="large"
              ${largeSelected ? 'checked' : ''}
            />
            <span>
              <strong>Large</strong>
              <small>Grote beker</small>
            </span>
          </div>

          <div class="admin-size-price-row">
            <span>€</span>
            <input
              id="admin-product-large-price"
              type="number"
              min="0"
              step="0.01"
              inputmode="decimal"
              placeholder="5.00"
              value="${largePrice}"
              ${largeSelected ? '' : 'disabled'}
            />
          </div>
        </label>
      </div>

      <p class="admin-product-size-help">
        Bij Medium + Large gebruikt het systeem Medium als basisprijs. Large mag iedere gewenste prijs hebben.
      </p>
    </div>
  `
}

function updateAdminProductBasePriceFromSizes() {
  const mediumToggle =
    document.querySelector<HTMLInputElement>('#admin-product-size-medium')

  const largeToggle =
    document.querySelector<HTMLInputElement>('#admin-product-size-large')

  const mediumPriceInput =
    document.querySelector<HTMLInputElement>('#admin-product-medium-price')

  const largePriceInput =
    document.querySelector<HTMLInputElement>('#admin-product-large-price')

  const basePriceInput =
    document.querySelector<HTMLInputElement>('#admin-product-price')

  if (!basePriceInput) return

  const mediumPrice = Number(mediumPriceInput?.value || 0)
  const largePrice = Number(largePriceInput?.value || 0)

  if (mediumToggle?.checked && Number.isFinite(mediumPrice) && mediumPrice >= 0) {
    basePriceInput.value = mediumPriceInput?.value || ''
    return
  }

  if (largeToggle?.checked && Number.isFinite(largePrice) && largePrice >= 0) {
    basePriceInput.value = largePriceInput?.value || ''
    return
  }

  basePriceInput.value = ''
}


function updateAdminSizeSpecificIceState() {
  const mediumToggle =
    document.querySelector<HTMLInputElement>('#admin-product-size-medium')

  const largeToggle =
    document.querySelector<HTMLInputElement>('#admin-product-size-large')

  const allowIceToggle =
    document.querySelector<HTMLInputElement>('#admin-product-allow-ice')

  const mediumGroup =
    document.querySelector<HTMLElement>('#admin-medium-ice-group')

  const largeGroup =
    document.querySelector<HTMLElement>('#admin-large-ice-group')

  const iceCustomizationEnabled = allowIceToggle?.checked ?? true

  const updateGroup = (
    group: HTMLElement | null,
    sizeEnabled: boolean
  ) => {
    if (!group) return

    group.hidden = !sizeEnabled

    group
      .querySelectorAll<HTMLInputElement>('input[type="checkbox"]')
      .forEach((input) => {
        input.disabled = !sizeEnabled || !iceCustomizationEnabled
      })
  }

  updateGroup(mediumGroup, mediumToggle?.checked ?? false)
  updateGroup(largeGroup, largeToggle?.checked ?? false)
}

function updateAdminProductSizeState() {
  const mediumToggle =
    document.querySelector<HTMLInputElement>('#admin-product-size-medium')

  const largeToggle =
    document.querySelector<HTMLInputElement>('#admin-product-size-large')

  const mediumPriceInput =
    document.querySelector<HTMLInputElement>('#admin-product-medium-price')

  const largePriceInput =
    document.querySelector<HTMLInputElement>('#admin-product-large-price')

  if (mediumPriceInput) {
    mediumPriceInput.disabled = !(mediumToggle?.checked ?? false)
  }

  if (largePriceInput) {
    largePriceInput.disabled = !(largeToggle?.checked ?? false)
  }

  mediumToggle
    ?.closest('.admin-size-card')
    ?.classList.toggle('selected', mediumToggle.checked)

  largeToggle
    ?.closest('.admin-size-card')
    ?.classList.toggle('selected', largeToggle.checked)

  updateAdminSizeSpecificIceState()
  updateAdminProductBasePriceFromSizes()
}

function bindAdminProductSizeControls() {
  const mediumToggle =
    document.querySelector<HTMLInputElement>('#admin-product-size-medium')

  const largeToggle =
    document.querySelector<HTMLInputElement>('#admin-product-size-large')

  const mediumPriceInput =
    document.querySelector<HTMLInputElement>('#admin-product-medium-price')

  const largePriceInput =
    document.querySelector<HTMLInputElement>('#admin-product-large-price')

  mediumToggle?.addEventListener('change', updateAdminProductSizeState)
  largeToggle?.addEventListener('change', updateAdminProductSizeState)

  mediumPriceInput?.addEventListener(
    'input',
    updateAdminProductBasePriceFromSizes
  )

  largePriceInput?.addEventListener(
    'input',
    updateAdminProductBasePriceFromSizes
  )

  updateAdminProductSizeState()
}

function renderAdminProductCustomizationFields(product?: Product | null) {
  const allowIceCustomization = product?.allow_ice_customization ?? true
  const allowSugarCustomization = product?.allow_sugar_customization ?? true

  const selectedIceLevels =
    product?.allowed_ice_levels?.length
      ? product.allowed_ice_levels
      : ICE_LEVELS

  const selectedMediumIceLevels =
    product?.medium_allowed_ice_levels?.length
      ? product.medium_allowed_ice_levels
      : selectedIceLevels

  const selectedLargeIceLevels =
    product?.large_allowed_ice_levels?.length
      ? product.large_allowed_ice_levels
      : selectedIceLevels

  const selectedSugarLevels =
    product?.allowed_sugar_levels?.length
      ? product.allowed_sugar_levels
      : SUGAR_LEVELS

  const defaultIceLevel = product?.default_ice_level ?? ''

  return `
    <div class="admin-product-customization-field">
      <div class="admin-product-customization-header">
        <div>
          <strong>Temperatuur / ijsniveau</strong>
          <span>Bepaal of de klant dit mag kiezen en welke opties beschikbaar zijn.</span>
        </div>

        <label class="admin-customization-toggle">
          <input
            id="admin-product-allow-ice"
            type="checkbox"
            ${allowIceCustomization ? 'checked' : ''}
          />
          <span>Klant mag kiezen</span>
        </label>
      </div>

      <div
        class="${allowIceCustomization ? '' : 'disabled'}"
        id="admin-product-ice-options"
      >
        <div
          class="admin-size-specific-ice-group"
          id="admin-medium-ice-group"
        >
          <div class="admin-product-customization-header">
            <div>
              <strong>Medium</strong>
              <span>Temperatuur / ijsniveau voor de Medium beker.</span>
            </div>
          </div>

          <div class="admin-customization-options">
            ${ICE_LEVELS.map(
              (level) => `
                <label class="admin-customization-option">
                  <input
                    type="checkbox"
                    name="admin-product-ice-level-medium"
                    value="${level}"
                    ${selectedMediumIceLevels.includes(level) ? 'checked' : ''}
                    ${allowIceCustomization ? '' : 'disabled'}
                  />
                  <span>${escapeHtml(ICE_LEVEL_LABELS.nl[level])}</span>
                </label>
              `
            ).join('')}
          </div>
        </div>

        <div
          class="admin-size-specific-ice-group"
          id="admin-large-ice-group"
        >
          <div class="admin-product-customization-header">
            <div>
              <strong>Large</strong>
              <span>Temperatuur / ijsniveau voor de Large beker.</span>
            </div>
          </div>

          <div class="admin-customization-options">
            ${ICE_LEVELS.map(
              (level) => `
                <label class="admin-customization-option">
                  <input
                    type="checkbox"
                    name="admin-product-ice-level-large"
                    value="${level}"
                    ${selectedLargeIceLevels.includes(level) ? 'checked' : ''}
                    ${allowIceCustomization ? '' : 'disabled'}
                  />
                  <span>${escapeHtml(ICE_LEVEL_LABELS.nl[level])}</span>
                </label>
              `
            ).join('')}
          </div>
        </div>
      </div>

      <label class="admin-fixed-modifier-field">
        <span>
          <strong>Vaste temperatuur / ijsniveau</strong>
          <small>
            Gebruik dit als de klant niet mag kiezen. De klant ziet de waarde wel,
            maar kan deze niet aanpassen.
          </small>
        </span>

        <select
          id="admin-product-default-ice"
          ${allowIceCustomization ? 'disabled' : ''}
        >
          <option value="">Niet tonen / niet van toepassing</option>
          ${ICE_LEVELS.map(
            (level) => `
              <option
                value="${level}"
                ${defaultIceLevel === level ? 'selected' : ''}
              >
                ${escapeHtml(ICE_LEVEL_LABELS.nl[level])}
              </option>
            `
          ).join('')}
        </select>
      </label>
    </div>

    <div class="admin-product-customization-field">
      <div class="admin-product-customization-header">
        <div>
          <strong>Sugar level</strong>
          <span>Bepaal of de klant suiker mag kiezen en welke niveaus beschikbaar zijn.</span>
        </div>

        <label class="admin-customization-toggle">
          <input
            id="admin-product-allow-sugar"
            type="checkbox"
            ${allowSugarCustomization ? 'checked' : ''}
          />
          <span>Klant mag kiezen</span>
        </label>
      </div>

      <div
        class="admin-customization-options ${allowSugarCustomization ? '' : 'disabled'}"
        id="admin-product-sugar-options"
      >
        ${SUGAR_LEVELS.map(
          (level) => `
            <label class="admin-customization-option">
              <input
                type="checkbox"
                name="admin-product-sugar-level"
                value="${level}"
                ${selectedSugarLevels.includes(level) ? 'checked' : ''}
                ${allowSugarCustomization ? '' : 'disabled'}
              />
              <span>${escapeHtml(SUGAR_LEVEL_LABELS.nl[level])}</span>
            </label>
          `
        ).join('')}
      </div>
    </div>
  `
}

function updateAdminProductCustomizationState(
  masterSelector: string,
  optionsSelector: string,
  fixedValueSelector?: string
) {
  const master =
    document.querySelector<HTMLInputElement>(masterSelector)

  const options =
    document.querySelector<HTMLElement>(optionsSelector)

  if (!master || !options) return

  const isEnabled = master.checked

  options.classList.toggle('disabled', !isEnabled)

  options
    .querySelectorAll<HTMLInputElement>('input[type="checkbox"]')
    .forEach((input) => {
      input.disabled = !isEnabled
    })

  if (fixedValueSelector) {
    const fixedValueInput =
      document.querySelector<HTMLSelectElement>(fixedValueSelector)

    if (fixedValueInput) {
      fixedValueInput.disabled = isEnabled
    }
  }
}

function bindAdminProductCustomizationToggles() {
  const iceToggle =
    document.querySelector<HTMLInputElement>('#admin-product-allow-ice')

  const sugarToggle =
    document.querySelector<HTMLInputElement>('#admin-product-allow-sugar')

  iceToggle?.addEventListener('change', () => {
    updateAdminProductCustomizationState(
      '#admin-product-allow-ice',
      '#admin-product-ice-options',
      '#admin-product-default-ice'
    )
    updateAdminSizeSpecificIceState()
  })

  sugarToggle?.addEventListener('change', () => {
    updateAdminProductCustomizationState(
      '#admin-product-allow-sugar',
      '#admin-product-sugar-options'
    )
  })

  updateAdminProductCustomizationState(
    '#admin-product-allow-ice',
    '#admin-product-ice-options',
    '#admin-product-default-ice'
  )

  updateAdminProductCustomizationState(
    '#admin-product-allow-sugar',
    '#admin-product-sugar-options'
  )

  updateAdminSizeSpecificIceState()
}

function renderAdminProductForm() {
  const editingProduct = adminEditingProductId
    ? products.find((product) => String(product.id) === String(adminEditingProductId))
    : null

  return `
    <section class="admin-panel">
      <div class="admin-panel-header">
        <div>
          <h2>${editingProduct ? 'Product bewerken' : 'Product toevoegen'}</h2>
          <p class="muted">Beheer naam, categorie, prijs en zichtbaarheid.</p>
        </div>
      </div>

      <div class="admin-form-grid">
        <label>
          <span>Naam</span>
          <input
            id="admin-product-name"
            class="admin-input"
            type="text"
            value="${editingProduct ? escapeHtml(editingProduct.name) : ''}"
            placeholder="Bijv. Matcha Latte"
          />
        </label>

        <label>
          <span>QR product code</span>
          <input
            id="admin-product-qr-code"
            class="admin-input"
            type="text"
            value="${editingProduct?.qr_product_code ? escapeHtml(editingProduct.qr_product_code) : ''}"
            placeholder="Bijv. 102"
            inputmode="numeric"
          />
          <small class="admin-field-help">
            Optioneel. Als je een code invult, moet die uniek zijn.
          </small>
        </label>

        <label>
          <span>Categorie</span>
          <select
            id="admin-product-category"
            class="admin-input admin-select"
          >
            <option value="">Kies een categorie</option>
            ${categories
              .filter(
                (category) =>
                  !isDiscountSystemCategory(category) &&
                  !isBestSellerSystemCategory(category) &&
                  !isHotSystemCategory(category) &&
                  (category.is_active || category.name === editingProduct?.category)
              )
              .map(
                (category) => `
                  <option
                    value="${escapeHtml(category.name)}"
                    ${editingProduct?.category === category.name ? 'selected' : ''}
                  >
                    ${escapeHtml(category.name)}
                  </option>
                `
              )
              .join('')}
          </select>
        </label>


        <div class="admin-product-type-field">
          <div class="admin-product-info-header">
            <div>
              <strong>Producttype</strong>
              <span>
                Drankjes gebruiken maten en modifiers. Een los item gebruikt alleen één vaste prijs.
              </span>
            </div>
          </div>

          <label>
            <span>Type</span>
            <select id="admin-product-type" class="admin-input admin-select">
              <option value="drink" ${(editingProduct?.product_type ?? 'drink') === 'drink' ? 'selected' : ''}>
                Drankje
              </option>
              <option value="item" ${editingProduct?.product_type === 'item' ? 'selected' : ''}>
                Los item
              </option>
            </select>
          </label>
        </div>

        <div class="admin-product-info-field">
          <div class="admin-product-info-header">
            <div>
              <strong>Productinformatie</strong>
              <span>
                Stel de theesoort en het temperatuur-label in dat de klant op het product ziet.
              </span>
            </div>
          </div>

          <div class="admin-product-info-grid">
            <label class="admin-tea-type-field">
              <span>Theesoort</span>
              <select
                id="admin-product-tea-type"
                class="admin-input admin-select"
              >
                ${renderTeaTypeOptions(editingProduct?.tea_type)}
              </select>

              <input
                class="admin-input admin-product-custom-tea-type"
                type="text"
                placeholder="Nieuwe theesoort, bijv. Hojicha"
                hidden
              />

              <small class="admin-field-help">
                Kies een bestaande soort of kies “Anders...” om zelf een nieuwe toe te voegen.
              </small>
            </label>

            <label>
              <span>Temperatuur-label</span>
              <select
                id="admin-product-temperature-label"
                class="admin-input admin-select"
              >
                <option value="">Geen label</option>
                <option value="Ice" ${editingProduct?.temperature_label === 'Ice' ? 'selected' : ''}>Ice</option>
                <option value="Hot" ${editingProduct?.temperature_label === 'Hot' ? 'selected' : ''}>Hot</option>
                <option value="Ice / Hot" ${editingProduct?.temperature_label === 'Ice / Hot' ? 'selected' : ''}>Ice / Hot</option>
              </select>

              <small class="admin-field-help">
                Handmatig label voor de klantweergave. Staat los van de ice-level instellingen.
              </small>
            </label>

          </div>
        </div>

        <label>
          <span>Basisprijs (€)</span>
          <input
            id="admin-product-price"
            class="admin-input admin-base-price-readonly"
            type="number"
            min="0"
            step="0.01"
            value="${editingProduct ? Number(editingProduct.base_price).toFixed(2) : ''}"
            placeholder="Wordt automatisch bepaald"
            readonly
          />
          <small class="admin-field-help">
            Wordt automatisch Medium, of Large als alleen Large beschikbaar is.
          </small>
        </label>

        <label>
          <span>BTW-tarief</span>
          <select
            id="admin-product-vat-rate"
            class="admin-input admin-select"
          >
            <option value="9" ${Number(editingProduct?.vat_rate ?? 9) === 9 ? 'selected' : ''}>9%</option>
            <option value="21" ${Number(editingProduct?.vat_rate ?? 9) === 21 ? 'selected' : ''}>21%</option>
          </select>
          <small class="admin-field-help">
            Voor normale niet-alcoholische drankjes gebruik je meestal 9%.
          </small>
        </label>

        <div class="admin-product-image-field">
          <div class="admin-product-image-heading">
            <strong>Productfoto</strong>
            <span>JPG, PNG, WEBP of HEIC · maximaal 5 MB</span>
          </div>

          <div class="admin-product-image-layout">
            <div class="admin-product-image-preview-box">
              <img
                id="admin-product-image-preview"
                class="admin-product-image-preview"
                src="${editingProduct?.image_url ? escapeHtml(editingProduct.image_url) : ''}"
                alt="Productfoto preview"
                ${editingProduct?.image_url ? '' : 'hidden'}
              />

              <div
                id="admin-product-image-empty"
                class="admin-product-image-empty"
                ${editingProduct?.image_url ? 'hidden' : ''}
              >
                <span>📷</span>
                <strong>Nog geen foto</strong>
              </div>
            </div>

            <div class="admin-product-image-controls">
              <label class="admin-image-upload-btn" for="admin-product-image">
                Foto kiezen
              </label>

              <input
                id="admin-product-image"
                class="admin-product-image-input"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
              />

              <span id="admin-product-image-name" class="admin-product-image-name">
                ${editingProduct?.image_url ? 'Huidige foto' : 'Geen bestand gekozen'}
              </span>

              ${
                editingProduct?.image_url
                  ? `
                    <label class="admin-remove-image-option">
                      <input id="admin-product-remove-image" type="checkbox" />
                      <span>Huidige foto verwijderen</span>
                    </label>
                  `
                  : ''
              }
            </div>
          </div>
        </div>

        ${renderAdminProductSizeFields(editingProduct)}

        ${renderAdminProductCustomizationFields(editingProduct)}

        <div class="admin-product-toppings-field">
          <div class="admin-product-toppings-header">
            <div>
              <strong>Beschikbare toppings</strong>
              <span>Kies welke toppings bij dit drankje besteld kunnen worden.</span>
            </div>

            <button
              type="button"
              class="admin-toppings-all-btn"
              data-action="toggle-all-product-toppings"
            >
              All
            </button>
          </div>

          <div class="admin-product-toppings-grid">
            ${
              toppings.length === 0
                ? `<p class="muted">Nog geen toppings aangemaakt.</p>`
                : toppings
                    .map((topping) => {
                      const isLinked = editingProduct
                        ? productToppingLinks.some(
                            (link) =>
                              String(link.product_id) === String(editingProduct.id) &&
                              String(link.topping_id) === String(topping.id)
                          )
                        : false

                      return `
                        <label class="admin-topping-checkbox ${!topping.is_active ? 'inactive' : ''}">
                          <input
                            type="checkbox"
                            name="admin-product-topping"
                            value="${topping.id}"
                            ${isLinked ? 'checked' : ''}
                          />
                          <span class="admin-topping-checkbox-text">
                            <strong>${escapeHtml(topping.name)}</strong>
                            <small>+ € ${Number(topping.price).toFixed(2)}${!topping.is_active ? ' · Inactief' : ''}</small>
                          </span>
                        </label>
                      `
                    })
                    .join('')
            }
          </div>
        </div>

        <label>
          <span>Kortingstype</span>
          <select
            id="admin-product-discount-type"
            class="admin-input admin-select"
          >
            <option value="none" ${normalizeDiscountType(editingProduct?.discount_type) === 'none' ? 'selected' : ''}>
              Geen korting
            </option>
            <option value="percentage" ${normalizeDiscountType(editingProduct?.discount_type) === 'percentage' ? 'selected' : ''}>
              Percentage
            </option>
            <option value="fixed" ${normalizeDiscountType(editingProduct?.discount_type) === 'fixed' ? 'selected' : ''}>
              Vast bedrag
            </option>
          </select>
        </label>

        <label>
          <span>Kortingswaarde</span>

          <div class="admin-discount-input-wrap">
            <span
              class="admin-discount-input-symbol"
              id="admin-product-discount-symbol"
            ></span>

            <input
              id="admin-product-discount-value"
              class="admin-input admin-discount-value-input"
              type="number"
              min="0"
              step="0.01"
              value="${editingProduct ? Number(editingProduct.discount_value ?? 0) : 0}"
              placeholder="0"
            />
          </div>
        </label>

        <div
          class="admin-live-discount-preview hidden"
          id="admin-product-discount-preview"
        >
          <span>Nieuwe verkoopprijs</span>
          <strong id="admin-product-preview-price">
            € ${editingProduct ? getDiscountedProductPrice(editingProduct).toFixed(2) : '0.00'}
          </strong>
          <small id="admin-product-preview-text"></small>
        </div>


        <div class="admin-product-status-toggle-grid">
          <label class="admin-checkbox-label">
            <input
              id="admin-product-bestseller"
              type="checkbox"
              ${editingProduct?.is_bestseller ? 'checked' : ''}
            />
            <span>Best Seller</span>
          </label>

          <label class="admin-checkbox-label admin-sold-out-checkbox">
            <input
              id="admin-product-sold-out"
              type="checkbox"
              ${editingProduct?.is_sold_out ? 'checked' : ''}
            />
            <span>Uitverkocht</span>
          </label>

          <label class="admin-checkbox-label">
            <input
              id="admin-product-active"
              type="checkbox"
              ${editingProduct ? (editingProduct.is_active ? 'checked' : '') : 'checked'}
            />
            <span>Actief</span>
          </label>

          <label class="admin-checkbox-label admin-pos-only-checkbox">
            <input
              id="admin-product-pos-only"
              type="checkbox"
              ${editingProduct?.pos_only ? 'checked' : ''}
            />
            <span>Alleen POS</span>
          </label>
        </div>
      </div>

      <div class="admin-form-actions">
        <button class="admin-primary-btn" id="admin-save-product">
          ${editingProduct ? 'Wijzigingen opslaan' : 'Product toevoegen'}
        </button>

        ${
          editingProduct
            ? `<button class="admin-secondary-btn" id="admin-cancel-product">Annuleren</button>`
            : ''
        }
      </div>
    </section>
  `
}

function renderAdminProductsList() {
  const filteredProducts = getFilteredAdminProducts()
  const isSearching = adminProductSearch.trim().length > 0

  return `
    <section class="admin-panel">
      <div class="admin-panel-header">
        <div>
          <h2>Producten</h2>

          <div class="admin-product-search-wrap">
            <span class="admin-product-search-icon">⌕</span>
            <input
              id="admin-product-search"
              class="admin-product-search-input"
              type="search"
              placeholder="Zoek een drankje..."
              value="${escapeHtml(adminProductSearch)}"
              autocomplete="off"
            />
          </div>

          <p class="muted">
            ${
              isSearching
                ? `${filteredProducts.length} van ${products.length} producten`
                : `${products.length} producten`
            }
          </p>
        </div>
      </div>

      <div class="admin-list">
        ${
          filteredProducts.length === 0
            ? `<p class="muted">Geen producten gevonden voor "${escapeHtml(adminProductSearch)}".</p>`
            : filteredProducts
                .map(
                  (product) => `
                    <div class="admin-list-item">
                      <div class="admin-list-main admin-product-list-main">
                        ${
                          product.image_url
                            ? `
                              <img
                                class="admin-product-thumb"
                                src="${escapeHtml(product.image_url)}"
                                alt="${escapeHtml(product.name)}"
                                loading="lazy"
                              />
                            `
                            : `<span class="admin-product-thumb admin-product-thumb-placeholder">🧋</span>`
                        }

                        <span class="admin-product-list-copy">
                          <strong>${escapeHtml(product.name)}</strong>
                          <span>${escapeHtml(product.category)}</span>
                        </span>
                      </div>

                      <div class="admin-list-price admin-list-price-with-discount">
                        ${
                          hasProductDiscount(product)
                            ? `
                              <span class="admin-old-price">
                                € ${Number(product.base_price).toFixed(2)}
                              </span>
                              <strong>€ ${getDiscountedProductPrice(product).toFixed(2)}</strong>
                              <small>${escapeHtml(getProductDiscountLabel(product))}</small>
                            `
                            : `
                              <strong>€ ${Number(product.base_price).toFixed(2)}</strong>
                            `
                        }
                      </div>

                      <div class="admin-product-statuses">
                        ${
                          product.is_bestseller
                            ? `<span class="admin-bestseller-badge">Best Seller</span>`
                            : ''
                        }

                        ${
                          product.is_sold_out
                            ? `<span class="admin-sold-out-badge">Uitverkocht</span>`
                            : ''
                        }

                        ${
                          product.pos_only
                            ? `<span class="admin-pos-only-badge">Alleen POS</span>`
                            : ''
                        }

                        <span class="admin-state ${product.is_active ? 'active' : 'inactive'}">
                          ${product.is_active ? 'Actief' : 'Inactief'}
                        </span>
                      </div>

                      <div class="admin-list-actions">
                        <button class="admin-small-btn" data-admin-edit-product="${product.id}">
                          Bewerken
                        </button>
                          <button
                            class="admin-small-btn danger"
                            data-admin-delete-product="${product.id}"
                            type="button"
                          >
                            Verwijderen
                          </button>

                        <button
                          class="admin-small-btn ${product.is_active ? 'danger' : 'success'}"
                          data-admin-toggle-product="${product.id}"
                          data-admin-next-active="${product.is_active ? 'false' : 'true'}"
                        >
                          ${product.is_active ? 'Uitzetten' : 'Activeren'}
                        </button>
                      </div>
                    </div>
                  `
                )
                .join('')
        }
      </div>
    </section>
  `
}

function renderAdminToppingForm() {
  const editingTopping = adminEditingToppingId
    ? toppings.find((topping) => String(topping.id) === String(adminEditingToppingId))
    : null

  return `
    <section class="admin-panel">
      <div class="admin-panel-header">
        <div>
          <h2>${editingTopping ? 'Topping bewerken' : 'Topping toevoegen'}</h2>
          <p class="muted">Beheer toppingnaam, prijs en zichtbaarheid.</p>
        </div>
      </div>

      <div class="admin-form-grid admin-form-grid-topping">
        <label>
          <span>Naam</span>
          <input
            id="admin-topping-name"
            class="admin-input"
            type="text"
            value="${editingTopping ? escapeHtml(editingTopping.name) : ''}"
            placeholder="Bijv. Tapioca"
          />
        </label>

        <label>
          <span>Prijs (€)</span>
          <input
            id="admin-topping-price"
            class="admin-input"
            type="number"
            min="0"
            step="0.01"
            value="${editingTopping ? Number(editingTopping.price).toFixed(2) : ''}"
            placeholder="0.50"
          />
        </label>

        <label class="admin-checkbox-label">
          <input
            id="admin-topping-active"
            type="checkbox"
            ${editingTopping ? (editingTopping.is_active ? 'checked' : '') : 'checked'}
          />
          <span>Actief</span>
        </label>
      </div>

      <div class="admin-form-actions">
        <button class="admin-primary-btn" id="admin-save-topping">
          ${editingTopping ? 'Wijzigingen opslaan' : 'Topping toevoegen'}
        </button>

        ${
          editingTopping
            ? `<button class="admin-secondary-btn" id="admin-cancel-topping">Annuleren</button>`
            : ''
        }
      </div>
    </section>
  `
}

function renderAdminToppingsList() {
  return `
    <section class="admin-panel">
      <div class="admin-panel-header">
        <div>
          <h2>Toppings</h2>
          <p class="muted">${toppings.length} toppings</p>
        </div>
      </div>

      <div class="admin-list">
        ${
          toppings.length === 0
            ? `<p class="muted">Geen toppings gevonden.</p>`
            : toppings
                .map(
                  (topping) => `
                    <div class="admin-list-item admin-list-item-topping">
                      <div class="admin-list-main">
                        <strong>${escapeHtml(topping.name)}</strong>
                      </div>

                      <div class="admin-list-price">
                        € ${Number(topping.price).toFixed(2)}
                      </div>

                      <span class="admin-state ${topping.is_active ? 'active' : 'inactive'}">
                        ${topping.is_active ? 'Actief' : 'Inactief'}
                      </span>

                      <div class="admin-list-actions">
                        <button class="admin-small-btn" data-admin-edit-topping="${topping.id}">
                          Bewerken
                        </button>

                        <button
                          class="admin-small-btn ${topping.is_active ? 'danger' : 'success'}"
                          data-admin-toggle-topping="${topping.id}"
                          data-admin-next-active="${topping.is_active ? 'false' : 'true'}"
                        >
                          ${topping.is_active ? 'Uitzetten' : 'Activeren'}
                        </button>
                      </div>
                    </div>
                  `
                )
                .join('')
        }
      </div>
    </section>
  `
}

function renderAdminDailyStats() {
  const topDrinks = getAdminTopDrinkSales(5)

  return `
    <section class="admin-stats-section">
      <div class="admin-stats-heading">
        <div>
          <h2>Vandaag</h2>
          <p class="muted">${escapeHtml(formatAdminTodayDate())}</p>
        </div>

        <button class="admin-secondary-btn" id="admin-refresh-stats">
          Vernieuwen
        </button>
      </div>

      <div class="admin-stats-grid admin-stats-grid-with-chart">
        <div class="admin-stat-card">
          <span>Bestellingen</span>
          <strong>${getAdminTodayOrderCount()}</strong>
          <small>Niet geannuleerd</small>
        </div>

        <div class="admin-stat-card admin-drink-chart-card">
          <div class="admin-stat-card-top">
            <div>
              <span>Drankjes verkocht</span>
              <strong>${getAdminTodayDrinkCount()}</strong>
              <small>Aantal stuks</small>
            </div>

            <button class="admin-inline-link-btn" id="go-admin-sales">
              Meer info →
            </button>
          </div>

          <div class="admin-drink-chart-content">
            <div
              class="admin-pie-chart"
              style="background: conic-gradient(${getAdminPieGradient()});"
              aria-label="Verkoopverdeling van drankjes"
            >
              <div class="admin-pie-chart-hole">
                <span>Top</span>
                <strong>${topDrinks.length}</strong>
              </div>
            </div>

            <div class="admin-chart-legend">
              ${
                topDrinks.length === 0
                  ? `<p class="muted">Nog geen verkochte drankjes vandaag.</p>`
                  : topDrinks
                      .map(
                        (row, index) => `
                          <div class="admin-chart-legend-row">
                            <span class="admin-chart-dot admin-chart-dot-${index + 1}"></span>
                            <span class="admin-chart-name">${escapeHtml(row.name)}</span>
                            <strong>${row.quantity}x</strong>
                          </div>
                        `
                      )
                      .join('')
              }
            </div>
          </div>
        </div>

        <div class="admin-stat-card admin-stat-card-revenue">
          <span>Omzet vandaag</span>
          <strong>€ ${getAdminTodayRevenue().toFixed(2)}</strong>
          <small>Alleen betaalde orders</small>
        </div>
      </div>
    </section>
  `
}

async function refundAdminPayment(paymentId: string) {
  const payment = paymentRecords.find(
    (item) => String(item.id) === String(paymentId)
  )

  if (!payment) {
    window.alert('Betaling niet gevonden.')
    return
  }

  if (payment.status !== 'paid') {
    window.alert('Alleen een betaalde betaling kan worden terugbetaald.')
    return
  }

  const order = adminTodayOrders.find(
    (item) => String(item.id) === String(payment.order_id)
  )

  const reasonInput = window.prompt(
    `Reden voor terugbetaling van ${formatPaymentAmount(payment.amount)}?`
  )

  if (reasonInput === null) return

  const reason = reasonInput.trim()

  if (!reason) {
    window.alert('Vul een reden voor de terugbetaling in.')
    return
  }

  const confirmed = window.confirm(
    `Weet je zeker dat je ${formatPaymentAmount(payment.amount)} wilt terugbetalen?`
  )

  if (!confirmed) return

  const now = new Date().toISOString()
  const actor = 'staff'

  // Voor een cash-refund moet er een open kassasessie zijn, zodat de
  // terugbetaling ook echt uit de kasadministratie wordt geboekt.
  let cashSessionForRefund: CashSession | null = null

  if (payment.payment_method === 'cash') {
    const { data: cashSessionData, error: cashSessionError } = await supabase
      .from('cash_sessions')
      .select('*')
      .eq('status', 'open')
      .order('opened_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (cashSessionError) {
      window.alert(`Open kas controleren mislukt: ${cashSessionError.message}`)
      return
    }

    if (!cashSessionData) {
      window.alert(
        'Open eerst de kas in Admin voordat je een contante betaling terugbetaalt.'
      )
      return
    }

    cashSessionForRefund = cashSessionData as CashSession
  }

  const { error: paymentError } = await supabase
    .from('payments')
    .update({
      status: 'refunded',
      refund_amount: payment.amount,
      refund_reason: reason,
      refunded_at: now,
      refunded_by: actor,
      updated_at: now,
    })
    .eq('id', payment.id)

  if (paymentError) {
    window.alert(`Terugbetaling opslaan mislukt: ${paymentError.message}`)
    return
  }

  const { error: orderError } = await supabase
    .from('orders')
    .update({
      payment_status: 'refunded',
    })
    .eq('id', payment.order_id)

  if (orderError) {
    window.alert(`Orderstatus bijwerken mislukt: ${orderError.message}`)
    return
  }

  // Een contante refund verlaagt de verwachte kas. We bewaren daarom een
  // negatieve kasbeweging gekoppeld aan dezelfde order en betaling.
  if (payment.payment_method === 'cash' && cashSessionForRefund) {
    const refundAmountCents = Math.abs(Number(payment.amount || 0))

    const { error: cashMovementError } = await supabase
      .from('cash_movements')
      .insert({
        cash_session_id: cashSessionForRefund.id,
        movement_type: 'refund',
        amount: -refundAmountCents,
        order_id: payment.order_id,
        payment_id: payment.id,
        reason: `Contante terugbetaling: ${reason}`,
        actor,
      })

    if (cashMovementError) {
      console.error('Cash refund movement opslaan mislukt:', cashMovementError)
      window.alert(
        `De terugbetaling is geregistreerd, maar de kasbeweging kon niet worden opgeslagen: ${cashMovementError.message}`
      )
      await loadAllAdminData()
      return
    }
  }

  const { error: auditError } = await supabase
    .from('audit_logs')
    .insert({
      event_type: 'PAYMENT_REFUNDED',
      entity_type: 'payment',
      entity_id: String(payment.id),
      old_data: {
        status: payment.status,
        amount: payment.amount,
        order_id: payment.order_id,
      },
      new_data: {
        status: 'refunded',
        refund_amount: payment.amount,
        refunded_at: now,
        order_payment_status: 'refunded',
      },
      reason,
      actor,
    })

  if (auditError) {
    console.error('Refund auditlog opslaan mislukt:', auditError)
  }

  window.alert(
    `Terugbetaling van ${formatPaymentAmount(payment.amount)} is geregistreerd.`
  )

  await loadAllAdminData()
}


function renderAdminPaymentOverview() {
  const todayOrderIds = new Set(
    adminTodayOrders.map((order) => String(order.id))
  )

  const todaysPayments = paymentRecords
    .filter((payment) => todayOrderIds.has(String(payment.order_id)))
    .sort((a, b) => {
      const timeA = new Date(a.created_at || 0).getTime()
      const timeB = new Date(b.created_at || 0).getTime()
      return timeB - timeA
    })

  if (todaysPayments.length === 0) {
    return `
      <section class="admin-payment-panel">
        <div class="admin-payment-panel-header">
          <div>
            <h2>Betalingen vandaag</h2>
            <p class="muted">Betalingen en transactiedetails.</p>
          </div>
        </div>

        <div class="admin-payment-empty">
          Nog geen betalingen vandaag.
        </div>
      </section>
    `
  }

  return `
    <section class="admin-payment-panel">
      <div class="admin-payment-panel-header">
        <div>
          <h2>Betalingen vandaag</h2>
          <p class="muted">
            ${todaysPayments.length} payment${todaysPayments.length === 1 ? '' : 's'} gevonden.
          </p>
        </div>
      </div>

      <div class="admin-payment-list">
        ${todaysPayments
          .map((payment) => {
            const order = adminTodayOrders.find(
              (item) => String(item.id) === String(payment.order_id)
            )

            return `
              <article class="admin-payment-row">
                <div class="admin-payment-row-main">
                  <strong>
                    ${escapeHtml(order?.order_number || `Order ${payment.order_id}`)}
                  </strong>

                  <span>
                    ${escapeHtml(getPaymentProviderLabel(payment))}
                    ·
                    ${escapeHtml(formatPaymentAmount(payment.amount))}
                  </span>
                </div>

                <span class="order-payment-badge ${getPaymentRecordStatusClass(payment)}">
                  ${escapeHtml(getPaymentRecordStatusLabel(payment))}
                </span>

                <div class="admin-payment-row-meta">
                  <span>
                    Provider ID:
                    <strong>${escapeHtml(payment.provider_order_id || '-')}</strong>
                  </span>

                  <span>
                    Transaction:
                    <strong>${escapeHtml(payment.provider_transaction_id || '-')}</strong>
                  </span>

                  <span>
                    Betaald:
                    <strong>${escapeHtml(formatDate(payment.paid_at))}</strong>
                  </span>

                  ${
                    payment.status === 'refunded'
                      ? `
                        <span>
                          Terugbetaald:
                          <strong>${escapeHtml(formatDate(payment.refunded_at))}</strong>
                        </span>

                        <span>
                          Reden:
                          <strong>${escapeHtml(payment.refund_reason || '-')}</strong>
                        </span>
                      `
                      : ''
                  }
                </div>

                ${
                  payment.status === 'paid'
                    ? `
                      <button
                        class="admin-secondary-btn"
                        type="button"
                        data-admin-refund-payment="${escapeHtml(payment.id)}"
                      >
                        Terugbetalen
                      </button>
                    `
                    : ''
                }
              </article>
            `
          })
          .join('')}
      </div>
    </section>
  `
}


function renderAdmin() {
  return `
    <div class="page admin-page admin-luxury-dashboard">
      ${renderNav()}

      <main class="admin-luxury-shell">
        <header class="admin-luxury-header">
          <div class="admin-luxury-brand">
            <img class="tea-shop-logo" src="/logo.jpg" alt="Blue Cup logo" />

            <div>
              <span class="admin-luxury-eyebrow">BLUE CUP ADMIN</span>
              <h1>Dashboard</h1>
              <p>Alles wat je nodig hebt om Blue Cup te beheren.</p>
            </div>
          </div>

          <div class="admin-luxury-date">
            ${escapeHtml(formatAdminTodayDate())}
          </div>
        </header>

        ${adminMessage ? `<p class="success-message">${escapeHtml(adminMessage)}</p>` : ''}
        ${adminError ? `<p class="error admin-error">${escapeHtml(adminError)}</p>` : ''}

        <section class="admin-luxury-section">
          <div class="admin-luxury-section-heading">
            <div>
              <span class="admin-luxury-section-label">VANDAAG</span>
              <h2>Overzicht</h2>
            </div>

            <button class="admin-luxury-refresh" id="admin-refresh-stats" type="button">
              ↻ Vernieuwen
            </button>
          </div>

          ${renderAdminDailyStats()}
        </section>

        <section class="admin-luxury-section">
          <div class="admin-luxury-section-heading">
            <div>
              <span class="admin-luxury-section-label">SNELLE ACTIES</span>
              <h2>Menu & bestellingen</h2>
            </div>
          </div>

          <div class="admin-luxury-action-grid admin-luxury-action-grid-four">
            <button class="admin-dashboard-card" id="go-admin-products">
              <span class="admin-dashboard-card-icon">◫</span>
              <span class="admin-dashboard-card-content">
                <strong>Producten</strong>
                <small>Drankjes, prijzen en beschikbaarheid</small>
              </span>
              <span class="admin-dashboard-card-arrow">›</span>
            </button>

            <button class="admin-dashboard-card" id="go-admin-dashboard-categories">
              <span class="admin-dashboard-card-icon">≡</span>
              <span class="admin-dashboard-card-content">
                <strong>Categorieën</strong>
                <small>Menu-indeling en kortingen beheren</small>
              </span>
              <span class="admin-dashboard-card-arrow">›</span>
            </button>

            <button class="admin-dashboard-card" id="go-admin-dashboard-toppings">
              <span class="admin-dashboard-card-icon">＋</span>
              <span class="admin-dashboard-card-content">
                <strong>Toppings</strong>
                <small>Toppings bekijken en aanpassen</small>
              </span>
              <span class="admin-dashboard-card-arrow">›</span>
            </button>

            <button class="admin-dashboard-card" id="go-admin-order-history">
              <span class="admin-dashboard-card-icon">⌕</span>
              <span class="admin-dashboard-card-content">
                <strong>Orderhistorie</strong>
                <small>Bestellingen van vandaag terugzoeken</small>
              </span>
              <span class="admin-dashboard-card-arrow">›</span>
            </button>
          </div>
        </section>

        <section class="admin-luxury-section">
          <div class="admin-luxury-section-heading">
            <div>
              <span class="admin-luxury-section-label">FINANCIEEL</span>
              <h2>Verkoop & kas</h2>
            </div>
          </div>

          <div class="admin-luxury-action-grid admin-luxury-action-grid-three">
            <button class="admin-dashboard-card" id="go-admin-administration">
              <span class="admin-dashboard-card-icon">↗</span>
              <span class="admin-dashboard-card-content">
                <strong>Verkoopoverzicht</strong>
                <small>Omzet, cups en historische verkoop</small>
              </span>
              <span class="admin-dashboard-card-arrow">›</span>
            </button>

            <button class="admin-dashboard-card" id="go-admin-day-close">
              <span class="admin-dashboard-card-icon">✓</span>
              <span class="admin-dashboard-card-content">
                <strong>Dagafsluiting</strong>
                <small>Controleer cijfers en maak het Z-rapport</small>
              </span>
              <span class="admin-dashboard-card-arrow">›</span>
            </button>

            <button class="admin-dashboard-card" id="go-admin-cash">
              <span class="admin-dashboard-card-icon">€</span>
              <span class="admin-dashboard-card-content">
                <strong>Kas</strong>
                <small>Openen, storten, opnemen en afsluiten</small>
              </span>
              <span class="admin-dashboard-card-arrow">›</span>
            </button>
          </div>
        </section>

        <section class="admin-luxury-section">
          <div class="admin-luxury-section-heading">
            <div>
              <span class="admin-luxury-section-label">SYSTEEM</span>
              <h2>Tools & instellingen</h2>
            </div>
          </div>

          <div class="admin-luxury-action-grid admin-luxury-action-grid-two">
            <button class="admin-dashboard-card" id="go-admin-print-preview">
              <span class="admin-dashboard-card-icon">▣</span>
              <span class="admin-dashboard-card-content">
                <strong>Print test</strong>
                <small>Sticker-preview en Zebra-print testen</small>
              </span>
              <span class="admin-dashboard-card-arrow">›</span>
            </button>

            <button class="admin-dashboard-card" id="go-admin-settings">
              <span class="admin-dashboard-card-icon">⚙</span>
              <span class="admin-dashboard-card-content">
                <strong>Instellingen</strong>
                <small>Pickup-scherm en kassainstellingen beheren</small>
              </span>
              <span class="admin-dashboard-card-arrow">›</span>
            </button>
          </div>
        </section>

        <section class="admin-luxury-section admin-luxury-payments">
          <div class="admin-luxury-section-heading">
            <div>
              <span class="admin-luxury-section-label">ACTIVITEIT</span>
              <h2>Recente betalingen</h2>
            </div>
          </div>

          ${renderAdminPaymentOverview()}
        </section>
      </main>
    </div>
  `
}


function renderAdminDayClosePage() {
  return `
    <div class="page admin-page admin-day-close-page">
      ${renderNav()}

      <header class="header admin-products-header">
        <div class="staff-brand">
          <img class="tea-shop-logo" src="/logo.jpg" alt="Blue Cup logo" />

          <div>
            <h1>Dagafsluiting</h1>
            <p class="sub">Controleer de cijfers van vandaag voordat je de dag afsluit.</p>
          </div>
        </div>

        <button class="admin-secondary-btn" id="back-admin-from-day-close">
          ← Admin dashboard
        </button>
      </header>

      ${adminError ? `<p class="error admin-error">${escapeHtml(adminError)}</p>` : ''}

      ${renderAdminDailyStats()}

      <div class="admin-cash-overview-row" id="admin-cash-section">
        <div class="admin-cash-overview-main">
          ${renderAdminCashSession()}
        </div>

        <div class="admin-cash-overview-setting">
          ${renderCashRegistrationSetting()}
        </div>
      </div>

      ${renderAdminDailyClosing()}
      ${renderAdminDailyClosingHistory()}
      ${renderAdminPaymentOverview()}
    </div>
  `
}

function renderAdminProductEditModal() {
  if (!adminEditingProductId) return ''

  const product = products.find(
    (item) => String(item.id) === String(adminEditingProductId)
  )

  if (!product) return ''

  return `
    <div class="admin-modal-overlay" id="admin-product-modal-overlay">
      <section class="admin-modal">
        <div class="admin-modal-header">
          <div>
            <p class="muted">Product aanpassen</p>
            <h2>${escapeHtml(product.name)}</h2>
          </div>

          <button class="admin-modal-close" id="admin-close-product-modal" type="button">×</button>
        </div>

        <div class="admin-modal-content">
          <label class="admin-modal-field">
            <span>Naam</span>
            <input id="admin-product-name" class="admin-input" type="text" value="${escapeHtml(product.name)}" />
          </label>

          <label class="admin-modal-field">
            <span>QR product code</span>
            <input
              id="admin-product-qr-code"
              class="admin-input"
              type="text"
              value="${product.qr_product_code ? escapeHtml(product.qr_product_code) : ''}"
              placeholder="Bijv. 102"
              inputmode="numeric"
            />
            <small class="admin-field-help">
              Optioneel. Als je een code invult, moet die uniek zijn.
            </small>
          </label>

          <label class="admin-modal-field">
            <span>Categorie</span>
            <select id="admin-product-category" class="admin-input admin-select">
              <option value="">Kies een categorie</option>
              ${categories
                .filter(
                  (category) =>
                    !isDiscountSystemCategory(category) &&
                    !isBestSellerSystemCategory(category) &&
                    (category.is_active || category.name === product.category)
                )
                .map(
                  (category) => `
                    <option
                      value="${escapeHtml(category.name)}"
                      ${product.category === category.name ? 'selected' : ''}
                    >
                      ${escapeHtml(category.name)}
                    </option>
                  `
                )
                .join('')}
            </select>
          </label>


          <div class="admin-product-type-field">
            <div class="admin-product-info-header">
              <div>
                <strong>Producttype</strong>
                <span>
                  Drankjes gebruiken maten en modifiers. Een los item gebruikt alleen één vaste prijs.
                </span>
              </div>
            </div>

            <label class="admin-modal-field">
              <span>Type</span>
              <select id="admin-product-type" class="admin-input admin-select">
                <option value="drink" ${(product.product_type ?? 'drink') === 'drink' ? 'selected' : ''}>
                  Drankje
                </option>
                <option value="item" ${product.product_type === 'item' ? 'selected' : ''}>
                  Los item
                </option>
              </select>
            </label>
          </div>

          <div class="admin-product-info-field">
            <div class="admin-product-info-header">
              <div>
                <strong>Productinformatie</strong>
                <span>
                  Stel de theesoort en het temperatuur-label in dat de klant op het product ziet.
                </span>
              </div>
            </div>

            <div class="admin-product-info-grid">
              <label class="admin-modal-field admin-tea-type-field">
                <span>Theesoort</span>
                <select
                  id="admin-product-tea-type"
                  class="admin-input admin-select"
                >
                  ${renderTeaTypeOptions(product.tea_type)}
                </select>

                <input
                  class="admin-input admin-product-custom-tea-type"
                  type="text"
                  placeholder="Nieuwe theesoort, bijv. Hojicha"
                  hidden
                />

                <small class="admin-field-help">
                  Kies een bestaande soort of kies “Anders...” om zelf een nieuwe toe te voegen.
                </small>
              </label>

              <label class="admin-modal-field">
                <span>Temperatuur-label</span>
                <select
                  id="admin-product-temperature-label"
                  class="admin-input admin-select"
                >
                  <option value="">Geen label</option>
                  <option value="Ice" ${product.temperature_label === 'Ice' ? 'selected' : ''}>Ice</option>
                  <option value="Hot" ${product.temperature_label === 'Hot' ? 'selected' : ''}>Hot</option>
                  <option value="Ice / Hot" ${product.temperature_label === 'Ice / Hot' ? 'selected' : ''}>Ice / Hot</option>
                </select>

                <small class="admin-field-help">
                  Handmatig label voor de klantweergave. Staat los van de ice-level instellingen.
                </small>
              </label>

            </div>
          </div>

          <label class="admin-modal-field">
            <span>Basisprijs (€)</span>
            <input
              id="admin-product-price"
              class="admin-input admin-base-price-readonly"
              type="number"
              min="0"
              step="0.01"
              value="${Number(product.base_price).toFixed(2)}"
              readonly
            />
            <small class="admin-field-help">
              Wordt automatisch Medium, of Large als alleen Large beschikbaar is.
            </small>
          </label>

          <label class="admin-modal-field">
            <span>BTW-tarief</span>
            <select
              id="admin-product-vat-rate"
              class="admin-input admin-select"
            >
              <option value="9" ${Number(product.vat_rate ?? 9) === 9 ? 'selected' : ''}>9%</option>
              <option value="21" ${Number(product.vat_rate ?? 9) === 21 ? 'selected' : ''}>21%</option>
            </select>
            <small class="admin-field-help">
              Dit tarief wordt bij elke verkoop als fiscale snapshot opgeslagen.
            </small>
          </label>

          <div class="admin-product-image-field admin-product-image-modal-field">
            <div class="admin-product-image-heading">
              <strong>Productfoto</strong>
              <span>JPG, PNG, WEBP of HEIC · maximaal 5 MB</span>
            </div>

            <div class="admin-product-image-layout">
              <div class="admin-product-image-preview-box">
                <img
                  id="admin-product-image-preview"
                  class="admin-product-image-preview"
                  src="${product.image_url ? escapeHtml(product.image_url) : ''}"
                  alt="Productfoto preview"
                  ${product.image_url ? '' : 'hidden'}
                />

                <div
                  id="admin-product-image-empty"
                  class="admin-product-image-empty"
                  ${product.image_url ? 'hidden' : ''}
                >
                  <span>📷</span>
                  <strong>Nog geen foto</strong>
                </div>
              </div>

              <div class="admin-product-image-controls">
                <label class="admin-image-upload-btn" for="admin-product-image">
                  ${product.image_url ? 'Foto vervangen' : 'Foto kiezen'}
                </label>

                <input
                  id="admin-product-image"
                  class="admin-product-image-input"
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
                />

                <span id="admin-product-image-name" class="admin-product-image-name">
                  ${product.image_url ? 'Huidige foto' : 'Geen bestand gekozen'}
                </span>

                ${
                  product.image_url
                    ? `
                      <label class="admin-remove-image-option">
                        <input id="admin-product-remove-image" type="checkbox" />
                        <span>Huidige foto verwijderen</span>
                      </label>
                    `
                    : ''
                }
              </div>
            </div>
          </div>

          <div class="admin-discount-fields">
            <label class="admin-modal-field">
              <span>Kortingstype</span>
              <select
                id="admin-product-discount-type"
                class="admin-input admin-select"
              >
                <option value="none" ${normalizeDiscountType(product.discount_type) === 'none' ? 'selected' : ''}>
                  Geen korting
                </option>
                <option value="percentage" ${normalizeDiscountType(product.discount_type) === 'percentage' ? 'selected' : ''}>
                  Percentage
                </option>
                <option value="fixed" ${normalizeDiscountType(product.discount_type) === 'fixed' ? 'selected' : ''}>
                  Vast bedrag
                </option>
              </select>
            </label>

            <label class="admin-modal-field">
              <span>Kortingswaarde</span>

              <div class="admin-discount-input-wrap">
                <span
                  class="admin-discount-input-symbol"
                  id="admin-product-discount-symbol"
                ></span>

                <input
                  id="admin-product-discount-value"
                  class="admin-input admin-discount-value-input"
                  type="number"
                  min="0"
                  step="0.01"
                  value="${Number(product.discount_value ?? 0)}"
                />
              </div>
            </label>
          </div>

          <div
            class="admin-live-discount-preview ${normalizeDiscountType(product.discount_type) === 'none' ? 'hidden' : ''}"
            id="admin-product-discount-preview"
          >
            <span>Nieuwe verkoopprijs</span>
            <strong id="admin-product-preview-price">
              € ${getDiscountedProductPrice(product).toFixed(2)}
            </strong>
            <small id="admin-product-preview-text"></small>
          </div>

          ${renderAdminProductSizeFields(product)}

          ${renderAdminProductCustomizationFields(product)}

          <div class="admin-product-toppings-field admin-product-toppings-modal">
            <div class="admin-product-toppings-header">
              <div>
                <strong>Beschikbare toppings</strong>
                <span>Kies welke toppings bij dit drankje besteld kunnen worden.</span>
              </div>

              <button
                type="button"
                class="admin-toppings-all-btn"
                data-action="toggle-all-product-toppings"
              >
                All
              </button>
            </div>

            <div class="admin-product-toppings-grid">
              ${
                toppings.length === 0
                  ? `<p class="muted">Nog geen toppings aangemaakt.</p>`
                  : toppings
                      .map((topping) => {
                        const isLinked = productToppingLinks.some(
                          (link) =>
                            String(link.product_id) === String(product.id) &&
                            String(link.topping_id) === String(topping.id)
                        )

                        return `
                          <label class="admin-topping-checkbox ${!topping.is_active ? 'inactive' : ''}">
                            <input
                              type="checkbox"
                              name="admin-product-topping"
                              value="${topping.id}"
                              ${isLinked ? 'checked' : ''}
                            />
                            <span class="admin-topping-checkbox-text">
                              <strong>${escapeHtml(topping.name)}</strong>
                              <small>+ € ${Number(topping.price).toFixed(2)}${!topping.is_active ? ' · Inactief' : ''}</small>
                            </span>
                          </label>
                        `
                      })
                      .join('')
              }
            </div>
          </div>

          <div class="admin-product-toggle-row admin-product-status-toggle-grid">
            <label class="admin-checkbox-label admin-modal-checkbox admin-bestseller-checkbox">
              <input
                id="admin-product-bestseller"
                type="checkbox"
                ${product.is_bestseller ? 'checked' : ''}
              />
              <span>Best Seller</span>
            </label>

            <label class="admin-checkbox-label admin-modal-checkbox admin-sold-out-checkbox">
              <input
                id="admin-product-sold-out"
                type="checkbox"
                ${product.is_sold_out ? 'checked' : ''}
              />
              <span>Uitverkocht</span>
            </label>

            <label class="admin-checkbox-label admin-modal-checkbox">
              <input id="admin-product-active" type="checkbox" ${product.is_active ? 'checked' : ''} />
              <span>Actief</span>
            </label>

            <label class="admin-checkbox-label admin-modal-checkbox admin-pos-only-checkbox">
              <input
                id="admin-product-pos-only"
                type="checkbox"
                ${product.pos_only ? 'checked' : ''}
              />
              <span>Alleen POS</span>
            </label>
          </div>
        </div>

        <div class="admin-modal-footer">
          <button class="admin-secondary-btn" id="admin-cancel-product-modal" type="button">
            Annuleren
          </button>

          <button class="admin-primary-btn" id="admin-save-product" type="button">
            Wijzigingen opslaan
          </button>
        </div>
      </section>
    </div>
  `
}

function renderAdminToppingEditModal() {
  if (!adminEditingToppingId) return ''

  const topping = toppings.find(
    (item) => String(item.id) === String(adminEditingToppingId)
  )

  if (!topping) return ''

  return `
    <div class="admin-modal-overlay" id="admin-topping-modal-overlay">
      <section class="admin-modal admin-modal-small">
        <div class="admin-modal-header">
          <div>
            <p class="muted">Topping aanpassen</p>
            <h2>${escapeHtml(topping.name)}</h2>
          </div>

          <button class="admin-modal-close" id="admin-close-topping-modal" type="button">×</button>
        </div>

        <div class="admin-modal-content">
          <label class="admin-modal-field">
            <span>Naam</span>
            <input id="admin-topping-name" class="admin-input" type="text" value="${escapeHtml(topping.name)}" />
          </label>

          <label class="admin-modal-field">
            <span>Prijs (€)</span>
            <input
              id="admin-topping-price"
              class="admin-input"
              type="number"
              min="0"
              step="0.01"
              value="${Number(topping.price).toFixed(2)}"
            />
          </label>

          <label class="admin-checkbox-label admin-modal-checkbox">
            <input id="admin-topping-active" type="checkbox" ${topping.is_active ? 'checked' : ''} />
            <span>Actief</span>
          </label>
        </div>

        <div class="admin-modal-footer">
          <button class="admin-secondary-btn" id="admin-cancel-topping-modal" type="button">
            Annuleren
          </button>

          <button class="admin-primary-btn" id="admin-save-topping" type="button">
            Wijzigingen opslaan
          </button>
        </div>
      </section>
    </div>
  `
}

function renderAdminCategoryEditModal() {
  if (!adminEditingCategoryId) return ''

  const category = categories.find(
    (item) => String(item.id) === String(adminEditingCategoryId)
  )

  if (!category) return ''

  return `
    <div class="admin-modal-overlay" id="admin-category-modal-overlay">
      <section class="admin-modal admin-modal-small">
        <div class="admin-modal-header">
          <div>
            <p class="muted">Categorie aanpassen</p>
            <h2>${escapeHtml(category.name)}</h2>
          </div>

          <button class="admin-modal-close" id="admin-close-category-modal" type="button">×</button>
        </div>

        <div class="admin-modal-content">
          <label class="admin-modal-field">
            <span>Naam</span>
            <input
              id="admin-category-edit-name"
              class="admin-input"
              type="text"
              value="${escapeHtml(category.name)}"
            />
          </label>

          <div class="admin-discount-fields">
            <label class="admin-modal-field">
              <span>Kortingstype</span>
              <select
                id="admin-category-edit-discount-type"
                class="admin-input admin-select"
              >
                <option value="none" ${normalizeDiscountType(category.discount_type) === 'none' ? 'selected' : ''}>
                  Geen korting
                </option>
                <option value="percentage" ${normalizeDiscountType(category.discount_type) === 'percentage' ? 'selected' : ''}>
                  Percentage
                </option>
                <option value="fixed" ${normalizeDiscountType(category.discount_type) === 'fixed' ? 'selected' : ''}>
                  Vast bedrag
                </option>
              </select>
            </label>

            <label class="admin-modal-field">
              <span>Kortingswaarde</span>

              <div class="admin-discount-input-wrap">
                <span
                  class="admin-discount-input-symbol"
                  id="admin-category-edit-discount-symbol"
                ></span>

                <input
                  id="admin-category-edit-discount-value"
                  class="admin-input admin-discount-value-input"
                  type="number"
                  min="0"
                  step="0.01"
                  value="${Number(category.discount_value ?? 0)}"
                />
              </div>
            </label>
          </div>

          <div
            class="admin-live-discount-preview admin-category-live-preview ${normalizeDiscountType(category.discount_type) === 'none' ? 'hidden' : ''}"
            id="admin-category-edit-discount-preview"
          >
            <span>Preview</span>
            <strong>Korting op categorie</strong>
            <small id="admin-category-edit-preview-text"></small>
          </div>

        </div>

        <div class="admin-modal-footer">
          <button class="admin-secondary-btn" id="admin-cancel-category-modal" type="button">
            Annuleren
          </button>

          <button class="admin-primary-btn" id="admin-save-category-edit" type="button">
            Wijzigingen opslaan
          </button>
        </div>
      </section>
    </div>
  `
}

function getFilteredAdminProducts() {
  const search = adminProductSearch.trim().toLowerCase()

  if (!search) {
    return products
  }

  return products.filter((product) => {
    const name = String(product.name ?? '').toLowerCase()
    const category = String(product.category ?? '').toLowerCase()

    return name.includes(search) || category.includes(search)
  })
}

function renderAdminProductsPage() {
  const filteredProducts = getFilteredAdminProducts()
  return `
    <div class="page admin-page">
      ${renderNav()}

      <header class="header admin-products-header">
        <div class="staff-brand">
          <img class="tea-shop-logo" src="/logo.jpg" alt="Blue Cup logo" />

          <div>
            <h1>Productbeheer</h1>
            <p class="sub">Producten en toppings beheren</p>
          </div>
        </div>

        <button class="admin-secondary-btn" id="back-admin-dashboard">
          ← Admin dashboard
        </button>
      </header>

      ${adminMessage ? `<p class="success-message">${escapeHtml(adminMessage)}</p>` : ''}
      ${adminError ? `<p class="error admin-error">${escapeHtml(adminError)}</p>` : ''}

      <section class="admin-manage-actions">
        <button class="admin-manage-action-card" id="go-admin-add-product">
          <span class="admin-manage-action-icon">＋</span>
          <span>
            <strong>Product toevoegen</strong>
            <small>Nieuw drankje aan het menu toevoegen</small>
          </span>
          <span class="admin-manage-action-arrow">→</span>
        </button>

        <button class="admin-manage-action-card" id="go-admin-add-topping">
          <span class="admin-manage-action-icon">＋</span>
          <span>
            <strong>Topping toevoegen</strong>
            <small>Nieuwe topping beschikbaar maken</small>
          </span>
          <span class="admin-manage-action-arrow">→</span>
        </button>

        <button class="admin-manage-action-card" id="go-admin-categories">
          <span class="admin-manage-action-icon">≡</span>
          <span>
            <strong>Categorieën beheren</strong>
            <small>Categorieën toevoegen en aanpassen</small>
          </span>
          <span class="admin-manage-action-arrow">→</span>
        </button>
      </section>

      <main class="admin-layout">
        <div class="admin-column">
          ${renderAdminProductsList()}
        </div>

        <div class="admin-column" id="admin-toppings-section">
          ${renderAdminToppingsList()}
        </div>
      </main>

      ${renderAdminProductEditModal()}
      ${renderAdminToppingEditModal()}
    </div>
  `
}

function renderAdminAddProductPage() {
  return `
    <div class="page admin-page">
      ${renderNav()}

      <header class="header admin-products-header">
        <div class="staff-brand">
          <img class="tea-shop-logo" src="/logo.jpg" alt="Blue Cup logo" />

          <div>
            <h1>Product toevoegen</h1>
            <p class="sub">Voeg een nieuw drankje toe aan Blue Cup</p>
          </div>
        </div>

        <button class="admin-secondary-btn" id="back-admin-products">
          ← Productbeheer
        </button>
      </header>

      ${adminMessage ? `<p class="success-message">${escapeHtml(adminMessage)}</p>` : ''}
      ${adminError ? `<p class="error admin-error">${escapeHtml(adminError)}</p>` : ''}

      <main class="admin-form-page">
        ${renderAdminProductForm()}
      </main>
    </div>
  `
}

function renderAdminAddToppingPage() {
  return `
    <div class="page admin-page">
      ${renderNav()}

      <header class="header admin-products-header">
        <div class="staff-brand">
          <img class="tea-shop-logo" src="/logo.jpg" alt="Blue Cup logo" />

          <div>
            <h1>Topping toevoegen</h1>
            <p class="sub">Voeg een nieuwe topping toe aan Blue Cup</p>
          </div>
        </div>

        <button class="admin-secondary-btn" id="back-admin-products-from-topping">
          ← Productbeheer
        </button>
      </header>

      ${adminMessage ? `<p class="success-message">${escapeHtml(adminMessage)}</p>` : ''}
      ${adminError ? `<p class="error admin-error">${escapeHtml(adminError)}</p>` : ''}

      <main class="admin-form-page">
        ${renderAdminToppingForm()}
      </main>
    </div>
  `
}


function renderAdminCategoryProductsModal() {
  if (!adminViewingCategoryId) {
    return ''
  }

  const isDiscountCategory =
    adminViewingCategoryId === DISCOUNT_CATEGORY_KEY

  const isBestSellerCategory =
    adminViewingCategoryId === BESTSELLER_CATEGORY_KEY

  const isHotCategory =
    adminViewingCategoryId === HOT_CATEGORY_KEY

  const category =
    isDiscountCategory || isBestSellerCategory || isHotCategory
      ? null
      : categories.find(
          (item) => String(item.id) === String(adminViewingCategoryId)
        )

  if (
    !isDiscountCategory &&
    !isBestSellerCategory &&
    !isHotCategory &&
    !category
  ) {
    return ''
  }

  const categoryName = isDiscountCategory
    ? DISCOUNT_CATEGORY_LABEL
    : isBestSellerCategory
      ? BESTSELLER_CATEGORY_LABEL
      : isHotCategory
        ? HOT_CATEGORY_LABEL
        : category!.name

  const categoryProducts = isDiscountCategory
    ? getDiscountedProducts()
    : isBestSellerCategory
      ? getBestSellerProducts()
      : isHotCategory
        ? getHotProducts()
        : products
          .filter((product) => product.category === category!.name)
          .sort((a, b) => a.name.localeCompare(b.name))

  return `
    <div class="admin-modal-overlay" id="admin-category-products-overlay">
      <section class="admin-modal admin-category-products-modal">
        <div class="admin-modal-header">
          <div>
            <p class="muted">Producten in categorie</p>
            <h2>${escapeHtml(categoryName)}</h2>
          </div>

          <button
            class="admin-modal-close"
            id="admin-close-category-products"
            type="button"
            aria-label="Sluiten"
          >
            ×
          </button>
        </div>

        <div class="admin-category-products-summary">
          <span>Aantal producten</span>
          <strong>${categoryProducts.length}</strong>
        </div>

        <div class="admin-category-products-list">
          ${
            categoryProducts.length === 0
              ? `
                <div class="admin-category-products-empty">
                  <strong>Nog geen producten</strong>
                  <span>${
                    isDiscountCategory
                      ? 'Er zijn momenteel geen drankjes met korting.'
                      : isBestSellerCategory
                        ? 'Er zijn nog geen verkochte drankjes om Best Sellers te bepalen.'
                        : isHotCategory
                          ? 'Er zijn momenteel geen drankjes die warm beschikbaar zijn.'
                          : 'Er zijn nog geen drankjes gekoppeld aan deze categorie.'
                  }</span>
                </div>
              `
              : categoryProducts
                  .map(
                    (product) => `
                      <div class="admin-category-product-row">
                        <div class="admin-category-product-main">
                          <strong>${escapeHtml(product.name)}</strong>

                          ${
                            isBestSellerCategory
                              ? `
                                <span class="admin-bestseller-sold-badge">
                                  ${getBestSellerSoldCount(String(product.id))} verkocht
                                </span>
                              `
                              : ''
                          }

                          ${
                            hasProductDiscount(product)
                              ? `
                                <span class="admin-category-product-discount">
                                  ${escapeHtml(getProductDiscountLabel(product))}
                                </span>
                              `
                              : ''
                          }
                        </div>

                        <div class="admin-category-product-price">
                          ${
                            hasProductDiscount(product)
                              ? `
                                <span class="admin-old-price">
                                  € ${Number(product.base_price).toFixed(2)}
                                </span>
                                <strong>
                                  € ${getDiscountedProductPrice(product).toFixed(2)}
                                </strong>
                              `
                              : `
                                <strong>€ ${Number(product.base_price).toFixed(2)}</strong>
                              `
                          }
                        </div>

                        <span class="admin-state ${product.is_active ? 'active' : 'inactive'}">
                          ${product.is_active ? 'Actief' : 'Inactief'}
                        </span>
                      </div>
                    `
                  )
                  .join('')
          }
        </div>

        <div class="admin-modal-footer">
          <button
            class="admin-secondary-btn"
            id="admin-close-category-products-footer"
            type="button"
          >
            Sluiten
          </button>
        </div>
      </section>
    </div>
  `
}

function renderAdminCategoriesPage() {
  const editingCategory = adminEditingCategoryId
    ? categories.find((category) => String(category.id) === String(adminEditingCategoryId))
    : null

  return `
    <div class="page admin-page">
      ${renderNav()}

      <header class="header admin-products-header">
        <div class="staff-brand">
          <img class="tea-shop-logo" src="/logo.jpg" alt="Blue Cup logo" />

          <div>
            <h1>Categorieën beheren</h1>
            <p class="sub">Categorieën voor producten toevoegen en aanpassen</p>
          </div>
        </div>

        <button class="admin-secondary-btn" id="back-admin-products-from-categories">
          ← Productbeheer
        </button>
      </header>

      ${adminMessage ? `<p class="success-message">${escapeHtml(adminMessage)}</p>` : ''}
      ${adminError ? `<p class="error admin-error">${escapeHtml(adminError)}</p>` : ''}

      <main class="admin-category-layout">
        <section class="admin-panel">
          <div class="admin-panel-header">
            <div>
              <h2>Categorie toevoegen</h2>
              <p class="muted">Gebruik deze categorieën bij je producten.</p>
            </div>
          </div>

          <div class="admin-category-form">
            <label>
              <span>Naam</span>
              <input
                id="admin-category-name"
                class="admin-input"
                type="text"
                value="" "
                placeholder="Bijv. Fresh Tea"
              />
            </label>

            <label>
              <span>Kortingstype</span>
              <select
                id="admin-category-discount-type"
                class="admin-input admin-select"
              >
                <option value="none">Geen korting</option>
                <option value="percentage">Percentage</option>
                <option value="fixed">Vast bedrag</option>
              </select>
            </label>

            <label>
              <span>Kortingswaarde</span>

              <div class="admin-discount-input-wrap">
                <span
                  class="admin-discount-input-symbol"
                  id="admin-category-discount-symbol"
                ></span>

                <input
                  id="admin-category-discount-value"
                  class="admin-input admin-discount-value-input"
                  type="number"
                  min="0"
                  step="0.01"
                  value="0"
                  placeholder="0"
                />
              </div>
            </label>

            <div
              class="admin-live-discount-preview admin-category-live-preview hidden"
              id="admin-category-discount-preview"
            >
              <span>Preview</span>
              <strong>Korting op categorie</strong>
              <small id="admin-category-preview-text"></small>
            </div>

          </div>

          <div class="admin-form-actions">
            <button class="admin-primary-btn" id="admin-save-category" type="button">
              Categorie toevoegen
            </button>

          </div>
        </section>

        <section class="admin-panel">
          <div class="admin-panel-header">
            <div>
              <h2>Categorieën</h2>
              <p class="muted">${categories.length} categorieën · sleep om volgorde te wijzigen</p>
            </div>
          </div>

          <div class="admin-list">
            ${
              categories.length === 0
                ? `<p class="muted">Nog geen categorieën gevonden.</p>`
                : categories
                    .map(
                      (category) => `
                        <div
                          class="admin-list-item admin-category-list-item admin-category-draggable ${
                            isDiscountSystemCategory(category)
                              ? 'admin-discount-system-row'
                              : isBestSellerSystemCategory(category)
                                ? 'admin-bestseller-system-row'
                                : isHotSystemCategory(category)
                                  ? 'admin-hot-system-row'
                                  : ''
                          }"
                          draggable="true"
                          data-admin-category-row="${category.id}"
                        >
                          <div
                            class="admin-category-drag-handle"
                            title="Sleep om volgorde te wijzigen"
                            aria-label="Sleep ${escapeHtml(category.name)}"
                          >
                            ⋮⋮
                          </div>

                          <div class="admin-list-main">
                            <strong>${escapeHtml(category.name)}</strong>
                            <span>${
                              isDiscountSystemCategory(category)
                                ? getDiscountedProducts().length
                                : isBestSellerSystemCategory(category)
                                  ? getBestSellerProducts().length
                                  : isHotSystemCategory(category)
                                    ? getHotProducts().length
                                    : getAdminCategoryProductCount(category.name)
                            } producten</span>

                            ${
                              isDiscountSystemCategory(category)
                                ? `<span class="admin-auto-category-label">Automatisch gevuld</span>`
                                : isBestSellerSystemCategory(category)
                                  ? `<span class="admin-auto-category-label">Handmatig geselecteerd</span>`
                                  : isHotSystemCategory(category)
                                    ? `<span class="admin-auto-category-label">Automatisch gevuld</span>`
                                    : ''
                            }

                            ${
                              !isDiscountSystemCategory(category) &&
                              !isBestSellerSystemCategory(category) &&
                              !isHotSystemCategory(category) &&
                              normalizeDiscountType(category.discount_type) !== 'none' &&
                              Number(category.discount_value ?? 0) > 0
                                ? `
                                  <span class="admin-category-discount-label">
                                    ${
                                      normalizeDiscountType(category.discount_type) === 'percentage'
                                        ? `${Math.min(100, Number(category.discount_value))}% korting`
                                        : `€ ${Number(category.discount_value).toFixed(2)} korting`
                                    }
                                  </span>
                                `
                                : ''
                            }
                          </div>

                          <span class="admin-state ${category.is_active ? 'active' : 'inactive'}">
                            ${category.is_active ? 'Actief' : 'Inactief'}
                          </span>

                          <div class="admin-list-actions admin-category-actions">
                            <button
                              type="button"
                              draggable="false"
                              class="admin-small-btn admin-category-products-btn"
                              data-admin-view-category-products="${
                                isDiscountSystemCategory(category)
                                  ? DISCOUNT_CATEGORY_KEY
                                  : isBestSellerSystemCategory(category)
                                    ? BESTSELLER_CATEGORY_KEY
                                    : isHotSystemCategory(category)
                                      ? HOT_CATEGORY_KEY
                                      : category.id
                              }"
                            >
                              Producten (${
                                isDiscountSystemCategory(category)
                                  ? getDiscountedProducts().length
                                  : isBestSellerSystemCategory(category)
                                    ? getBestSellerProducts().length
                                    : isHotSystemCategory(category)
                                      ? getHotProducts().length
                                      : getAdminCategoryProductCount(category.name)
                              })
                            </button>

                            ${
                              isDiscountSystemCategory(category) ||
                              isBestSellerSystemCategory(category) ||
                              isHotSystemCategory(category)
                                ? ''
                                : `
                                  <button
                                    type="button"
                                    draggable="false"
                                    class="admin-small-btn"
                                    data-admin-edit-category="${category.id}"
                                  >
                                    Bewerken
                                  </button>
                                `
                            }

                            <button
                              type="button"
                              draggable="false"
                              class="admin-small-btn ${category.is_active ? 'danger' : 'success'}"
                              data-admin-toggle-category="${category.id}"
                              data-admin-next-category-active="${category.is_active ? 'false' : 'true'}"
                            >
                              ${category.is_active ? 'Uitzetten' : 'Activeren'}
                            </button>

                            ${
                              isDiscountSystemCategory(category) ||
                              isBestSellerSystemCategory(category) ||
                              isHotSystemCategory(category)
                                ? ''
                                : `
                                  <button
                                    type="button"
                                    draggable="false"
                                    class="admin-small-btn danger"
                                    data-admin-delete-category="${category.id}"
                                  >
                                    Verwijderen
                                  </button>
                                `
                            }
                          </div>
                        </div>
                      `
                    )
                    .join('')
            }
          </div>
        </section>
      </main>

      ${renderAdminCategoryEditModal()}
      ${renderAdminCategoryProductsModal()}
    </div>
  `
}

function renderAdminSalesPage() {
  const salesRows = getAdminHistoricalDrinkSalesRows()
  const toppingRows = getAdminHistoricalToppingSalesRows()

  return `
    <div class="page admin-page admin-sales-dashboard-page">
      ${renderNav()}

      <header class="header admin-products-header">
        <div class="staff-brand">
          <img class="tea-shop-logo" src="/logo.jpg" alt="Blue Cup logo" />

          <div>
            <h1>Verkoop & statistieken</h1>
            <p class="sub">${escapeHtml(getAdminSalesRangeLabel())}</p>
          </div>
        </div>

        <button class="admin-secondary-btn" id="back-admin-from-sales">
          ← Admin dashboard
        </button>
      </header>

      ${
        adminError
          ? `<p class="error admin-error">${escapeHtml(adminError)}</p>`
          : ''
      }

      <section class="admin-sales-toolbar">
        <div class="admin-sales-range-tabs">
          ${[
            ['today', 'Vandaag'],
            ['7d', '7 dagen'],
            ['30d', '30 dagen'],
            ['all', 'Alles'],
          ]
            .map(
              ([value, label]) => `
                <button
                  type="button"
                  class="admin-sales-range-btn ${adminSalesRange === value ? 'active' : ''}"
                  data-admin-sales-range="${value}"
                >
                  ${label}
                </button>
              `
            )
            .join('')}
        </div>

        <button
          type="button"
          class="admin-secondary-btn"
          id="refresh-admin-sales"
        >
          Vernieuwen
        </button>
      </section>

      ${
        isLoadingAdminSales
          ? `
            <section class="admin-sales-loading">
              Verkoopstatistieken laden...
            </section>
          `
          : `
            <section class="admin-sales-kpi-grid">
              <article class="admin-sales-kpi admin-sales-kpi-primary">
                <span>Omzet</span>
                <strong>€ ${getAdminSalesRevenue().toFixed(2)}</strong>
                <small>Alleen betaalde orders</small>
              </article>

              <article class="admin-sales-kpi">
                <span>Cups verkocht</span>
                <strong>${getAdminSalesDrinkCount()}</strong>
                <small>Aantal drankjes</small>
              </article>

              <article class="admin-sales-kpi">
                <span>Bestellingen</span>
                <strong>${getAdminSalesOrderCount()}</strong>
                <small>Niet geannuleerd</small>
              </article>

              <article class="admin-sales-kpi">
                <span>Gemiddeld per order</span>
                <strong>€ ${getAdminAverageOrderValue().toFixed(2)}</strong>
                <small>Betaalde orders</small>
              </article>
            </section>

            <div class="admin-sales-history-grid">
              <section class="admin-panel admin-sales-history-panel">
                <div class="admin-panel-header">
                  <div>
                    <h2>Best verkochte drankjes</h2>
                    <p class="muted">Aantal cups en omzet per drankje.</p>
                  </div>
                </div>

                <div class="admin-sales-history-list">
                  ${
                    salesRows.length === 0
                      ? `<p class="muted">Geen verkopen gevonden.</p>`
                      : salesRows
                          .slice(0, 12)
                          .map(
                            (row, index) => `
                              <div class="admin-sales-history-row">
                                <span class="admin-sales-history-rank">
                                  ${index + 1}
                                </span>

                                <div class="admin-sales-history-info">
                                  <strong>${escapeHtml(row.name)}</strong>
                                  <span>€ ${row.revenue.toFixed(2)} omzet</span>
                                </div>

                                <div class="admin-sales-history-value">
                                  <strong>${row.quantity}</strong>
                                  <span>cups</span>
                                </div>
                              </div>
                            `
                          )
                          .join('')
                  }
                </div>
              </section>

              <section class="admin-panel admin-sales-history-panel">
                <div class="admin-panel-header">
                  <div>
                    <h2>Toppings</h2>
                    <p class="muted">Meest verkochte toppings.</p>
                  </div>
                </div>

                <div class="admin-sales-history-list">
                  ${
                    toppingRows.length === 0
                      ? `<p class="muted">Geen toppingverkopen gevonden.</p>`
                      : toppingRows
                          .slice(0, 12)
                          .map(
                            (row, index) => `
                              <div class="admin-sales-history-row">
                                <span class="admin-sales-history-rank">
                                  ${index + 1}
                                </span>

                                <div class="admin-sales-history-info">
                                  <strong>${escapeHtml(row.name)}</strong>
                                  <span>€ ${row.revenue.toFixed(2)} omzet</span>
                                </div>

                                <div class="admin-sales-history-value">
                                  <strong>${row.quantity}</strong>
                                  <span>verkocht</span>
                                </div>
                              </div>
                            `
                          )
                          .join('')
                  }
                </div>
              </section>
            </div>
          `
      }
    </div>
  `
}


function renderPosSettings() {
  const grouped = groupProductsByCategory()

  return `
    <div class="page pos-settings-page staff-footer-page">
      ${renderNav()}

      <header class="header">
        <div class="staff-brand">
          <img class="tea-shop-logo" src="/logo.jpg" alt="Tea Shop logo" />

          <div>
            <p class="eyebrow">POS</p>
            <h1>Instellingen</h1>
            <p class="sub">Beheer instellingen van de kassa en het pickup-scherm.</p>
          </div>
        </div>

        ${message ? `<p class="success-message">${escapeHtml(message)}</p>` : ''}
      </header>

      <main class="pos-settings-content">
        <section class="pos-settings-card">
          <div class="pos-wait-modal-header">
            <div>
              <p class="eyebrow">Pickup</p>
              <h2>Pickup & wachttijd</h2>
            </div>

            <button
              type="button"
              class="secondary-btn"
              id="pos-settings-back"
            >
              ${settingsReturnScreen === 'admin' ? '← Terug naar Admin' : '← Terug naar POS'}
            </button>
          </div>

          <div class="pos-wait-modal-body">
            <div class="pos-settings-section-heading">
              <strong>Wachttijd op pickup-scherm</strong>
              <p>Beheer wat klanten op het pickup-scherm zien.</p>
            </div>

            <div class="pos-wait-setting-row">
              <div>
                <strong>Wachttijd zichtbaar</strong>
                <p>Toon de wachttijd op het scherm aan de voorkant.</p>
              </div>

              <label class="pos-wait-switch">
                <input
                  id="pos-wait-visible"
                  type="checkbox"
                  ${pickupWaitVisible ? 'checked' : ''}
                />
                <span class="pos-wait-switch-track">
                  <span class="pos-wait-switch-thumb"></span>
                </span>
              </label>
            </div>

            <div class="pos-wait-divider"></div>

            <label class="pos-wait-field">
              <span>Geschatte wachttijd</span>

              <div class="pos-wait-input-wrap">
                <input
                  id="pos-wait-minutes"
                  type="number"
                  min="0"
                  max="180"
                  step="1"
                  value="${pickupWaitMinutes}"
                />
                <span>minuten</span>
              </div>

              <small>
                Bijvoorbeeld 15 = ± 15 minuten op het pickup-scherm.
              </small>
            </label>
          </div>

          <div class="pos-wait-modal-footer">
            <button
              type="button"
              class="secondary-btn"
              id="pos-settings-back-bottom"
            >
              Terug
            </button>

            <button
              type="button"
              class="primary-btn"
              id="pos-wait-save"
            >
              Opslaan
            </button>
          </div>
        </section>
      </main>

      ${settingsReturnScreen === 'pos' ? renderStaffBottomBar(grouped) : ''}
    </div>
  `
}

function renderStaffBottomBar(grouped?: Record<string, Product[]>) {
  const categoryButtons = grouped
    ? getOrderedCategoryNames(grouped)
        .filter(
          (category) =>
            category !== DISCOUNT_CATEGORY_KEY &&
            category !== BESTSELLER_CATEGORY_KEY &&
            category !== HOT_CATEGORY_KEY &&
            getCategoryDisplayName(category).trim().toLowerCase() !== 'test'
        )
        .map((category) => {
          const originalIndex = getOrderedCategoryNames(grouped).indexOf(category)

          return `
            <button
              type="button"
              class="pos-footer-category-btn"
              data-pos-footer-category="${originalIndex}"
              title="${escapeHtml(getCategoryDisplayName(category))}"
            >
              <span class="pos-footer-category-icon" aria-hidden="true">🧋</span>
              <strong>${escapeHtml(getCategoryDisplayName(category))}</strong>
            </button>
          `
        })
        .join('')
    : ''

  return `
    <nav class="pos-action-dock" aria-label="POS snelmenu">
      ${
        categoryButtons
          ? `
            <div class="pos-footer-categories" aria-label="Categorieën">
              ${categoryButtons}
            </div>
          `
          : ''
      }

      <div class="pos-footer-actions">
        ${
          screen === 'pos'
            ? `
              <button
                type="button"
                class="pos-action-tile pos-action-tile-availability"
                id="pos-availability-open"
                aria-label="Productstatus"
              >
                <span class="pos-action-icon" aria-hidden="true">📦</span>
                <span class="pos-action-copy">
                  <strong>Productstatus</strong>
                  <small>Producten beheren</small>
                </span>
              </button>
            `
            : ''
        }

        <button
          type="button"
          class="pos-action-tile"
          id="go-order-history"
          aria-label="Orders"
        >
          <span class="pos-action-icon" aria-hidden="true">🧾</span>
          <span class="pos-action-copy">
            <strong>Orders</strong>
            <small>Zoek oude bestellingen</small>
          </span>
        </button>

        <button
          type="button"
          class="pos-action-tile"
          id="pos-wait-settings"
          aria-label="Instellingen"
        >
          <span class="pos-action-icon" aria-hidden="true">⚙️</span>
          <span class="pos-action-copy">
            <strong>Instellingen</strong>
            <small>POS instellingen</small>
          </span>
        </button>
      </div>
    </nav>
  `
}



function applyPosProductSearchFilter() {
  const search = posProductSearch.trim().toLowerCase()

  const cards = Array.from(
    document.querySelectorAll<HTMLElement>(
      '.pos-page .product-card[data-pos-product-search]'
    )
  )

  let visibleCardCount = 0

  cards.forEach((card) => {
    const haystack = card.dataset.posProductSearch || ''
    const matches = !search || haystack.includes(search)

    card.hidden = !matches

    if (matches) {
      visibleCardCount += 1
    }
  })

  document
    .querySelectorAll<HTMLElement>('.pos-page .category-block')
    .forEach((group) => {
      const hasVisibleProduct = Array.from(
        group.querySelectorAll<HTMLElement>(
          '.product-card[data-pos-product-search]'
        )
      ).some((card) => !card.hidden)

      group.hidden = !hasVisibleProduct
    })

  const emptyMessage =
    document.querySelector<HTMLElement>('#pos-product-search-empty')

  if (emptyMessage) {
    emptyMessage.hidden = visibleCardCount > 0
  }
}

// =============================
// RENDER: STAFF POS
// =============================

function renderPosProductStatusPage() {
  const availabilitySource =
    posAvailabilityProducts.length > 0 ? posAvailabilityProducts : products

  const search = posAvailabilitySearch.trim().toLowerCase()
  const filteredProducts = !search
    ? availabilitySource
    : availabilitySource.filter((product) =>
        `${product.name} ${product.category}`.toLowerCase().includes(search)
      )

  return `
    <div class="page pos-product-status-page">
      <header class="pos-product-status-page-header">
        <button
          class="pos-product-status-back"
          id="pos-availability-close"
          type="button"
        >
          ← Terug naar POS
        </button>

        <div>
          <p class="pos-availability-eyebrow">Snel beheer</p>
          <h1>Productstatus</h1>
          <p>
            Beheer theesoorten, toppings en producten zonder popup.
          </p>
        </div>
      </header>

      <main class="pos-product-status-content">
        

        <div class="pos-product-status-columns">
        <div class="pos-product-status-column pos-product-status-products-column">
          <section class="pos-availability-tea-bulk">
          <div class="pos-availability-tea-copy">
            <strong>Theesoort in bulk</strong>
            <span>
              Zet alle drankjes van één theesoort tegelijk op uitverkocht of beschikbaar.
            </span>
          </div>

          <div class="pos-availability-tea-controls">
            <label class="pos-availability-tea-select">
              <span>Theesoort</span>
              <select id="pos-availability-tea-type">
                <option value="">Kies theesoort...</option>
                ${getPosAvailabilityTeaTypes()
                  .map(
                    (teaType) => `
                      <option
                        value="${escapeHtml(teaType)}"
                        ${posAvailabilityTeaType === teaType ? 'selected' : ''}
                      >
                        ${escapeHtml(teaType)}
                      </option>
                    `
                  )
                  .join('')}
              </select>
            </label>

            <div class="pos-availability-tea-actions">
              <button
                class="pos-availability-tea-btn sold-out"
                id="pos-tea-sold-out"
                type="button"
                ${!posAvailabilityTeaType ? 'disabled' : ''}
              >
                Alles uitverkocht
              </button>

              <button
                class="pos-availability-tea-btn restore"
                id="pos-tea-available"
                type="button"
                ${!posAvailabilityTeaType ? 'disabled' : ''}
              >
                Alles beschikbaar
              </button>
            </div>
          </div>

          ${
            posAvailabilityTeaType
              ? `
                <small class="pos-availability-tea-count">
                  ${getPosAvailabilityTeaTypeCount(posAvailabilityTeaType)}
                  drankje${getPosAvailabilityTeaTypeCount(posAvailabilityTeaType) === 1 ? '' : 's'}
                  met ${escapeHtml(posAvailabilityTeaType)}
                </small>
              `
              : ''
          }
        </section>

          
          <section class="pos-product-status-panel">
          <div class="pos-product-status-products-header">
            <div>
              <strong>Producten</strong>
              <span>Zet losse producten op uitverkocht of verberg ze tijdelijk.</span>
            </div>

            <label class="pos-availability-search">
              <span aria-hidden="true">⌕</span>
              <input
                id="pos-availability-search"
                type="search"
                placeholder="Zoek product..."
                autocomplete="off"
                value="${escapeHtml(posAvailabilitySearch)}"
              />
            </label>
          </div>

          <div class="pos-availability-list">
            ${
              isLoadingPosAvailability
                ? `<p class="pos-availability-empty">Producten laden...</p>`
                : filteredProducts.length === 0
                  ? `<p class="pos-availability-empty">Geen producten gevonden.</p>`
                  : filteredProducts
                      .map(
                        (product) => `
                          <article class="pos-availability-row ${!product.is_active ? 'is-hidden' : ''}">
                            <div class="pos-availability-product">
                              <strong>${escapeHtml(product.name)}</strong>
                              <span>${escapeHtml(product.category)}</span>

                              <div class="pos-availability-badges">
                                ${
                                  !product.is_active
                                    ? `<span class="pos-availability-badge hidden">Verborgen</span>`
                                    : product.is_sold_out
                                      ? `<span class="pos-availability-badge sold-out">Uitverkocht</span>`
                                      : `<span class="pos-availability-badge available">Beschikbaar</span>`
                                }
                              </div>
                            </div>

                            <div class="pos-availability-actions">
                              <button
                                class="pos-availability-action ${product.is_sold_out ? 'restore' : 'sold-out'}"
                                type="button"
                                data-pos-sold-out="${product.id}"
                                data-next-sold-out="${product.is_sold_out ? 'false' : 'true'}"
                                ${!product.is_active ? 'disabled' : ''}
                              >
                                ${product.is_sold_out ? 'Weer beschikbaar' : 'Uitverkocht'}
                              </button>

                              <button
                                class="pos-availability-action ${product.is_active ? 'hide' : 'show'}"
                                type="button"
                                data-pos-visible="${product.id}"
                                data-next-visible="${product.is_active ? 'false' : 'true'}"
                              >
                                ${product.is_active ? 'Verbergen' : 'Weergeven'}
                              </button>
                            </div>
                          </article>
                        `
                      )
                      .join('')
            }
          </div>
        </section>
        </div>

        <div class="pos-product-status-column pos-product-status-toppings-column">
          <section class="pos-product-status-panel">
          <div class="pos-availability-toppings-header">
            <div>
              <strong>Toppings</strong>
              <span>Zet toppings tijdelijk op uitverkocht of weer beschikbaar.</span>
            </div>

            <button
              class="pos-availability-refresh"
              id="pos-availability-refresh"
              type="button"
              ${isLoadingPosAvailability ? 'disabled' : ''}
            >
              Vernieuwen
            </button>
          </div>

          ${
            posAvailabilityError
              ? `<p class="pos-availability-error">${escapeHtml(posAvailabilityError)}</p>`
              : ''
          }

          <div class="pos-availability-toppings-list">
            ${
              toppings.length === 0
                ? `<p class="pos-availability-empty">Geen actieve toppings gevonden.</p>`
                : toppings
                    .map(
                      (topping) => `
                        <article class="pos-availability-topping-row">
                          <div class="pos-availability-topping-info">
                            <strong>${escapeHtml(topping.name)}</strong>
                            <span>€ ${Number(topping.price).toFixed(2)}</span>

                            <span class="pos-availability-badge ${topping.is_sold_out === true ? 'sold-out' : 'available'}">
                              ${topping.is_sold_out === true ? 'Uitverkocht' : 'Beschikbaar'}
                            </span>
                          </div>

                          <button
                            class="pos-availability-action ${topping.is_sold_out === true ? 'restore' : 'sold-out'}"
                            type="button"
                            data-pos-topping-sold-out="${topping.id}"
                            data-next-topping-sold-out="${topping.is_sold_out === true ? 'false' : 'true'}"
                          >
                            ${topping.is_sold_out === true ? 'Weer beschikbaar' : 'Uitverkocht'}
                          </button>
                        </article>
                      `
                    )
                    .join('')
            }
          </div>
        </section>
        </div>
      </div>
      </main>
    </div>
  `
}

function renderPos() {
  const grouped = groupProductsByCategory()

  return `
    <div class="page pos-page staff-footer-page">
      ${renderNav()}

      <header class="header">
        <div class="staff-brand">
          <img class="tea-shop-logo" src="/logo.jpg" alt="Tea Shop logo" />

          <div>
            <h1>Blue Cup POS</h1>
            <p class="sub">MVP kassascherm</p>

          </div>
        </div>

        ${message ? `<p class="success-message">${escapeHtml(message)}</p>` : ''}
      </header>

      ${renderCustomerCustomizer()}

      <main class="layout">
        <section class="products">
          <div class="pos-products-header">
            <h2>Producten</h2>

            <div class="pos-products-tools">
              <label class="pos-product-search">
              <span class="pos-product-search-icon" aria-hidden="true">⌕</span>

              <input
                id="pos-product-search"
                type="search"
                placeholder="Zoek product..."
                autocomplete="off"
                value="${escapeHtml(posProductSearch)}"
                aria-label="Zoek product"
              />
              </label>
            </div>
          </div>

          <p
            class="pos-product-search-empty"
            id="pos-product-search-empty"
            hidden
          >
            Geen producten gevonden.
          </p>

          ${renderProductGroups(grouped)}
        </section>

        ${renderCart(false)}
      </main>

      ${renderStaffBottomBar(grouped)}
    </div>
  `
}



function getOrderHistorySearchText(order: Order) {
  const items = getOrderItems(order.id)
  const payment = getPaymentForOrder(order.id)

  return [
    order.order_number,
    order.pickup_code,
    order.customer_name,
    order.customer_phone,
    order.status,
    order.payment_status,
    order.payment_method,
    order.created_at,
    payment?.provider,
    payment?.provider_order_id,
    payment?.provider_transaction_id,
    payment?.status,
    payment?.id,
    ...items.map((item) =>
      item.product_name_snapshot || item.product_name || ''
    ),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
}

function getFilteredOrderHistory() {
  const search = orderHistorySearch.trim().toLowerCase()

  if (!search) {
    return orders
  }

  return orders.filter((order) =>
    getOrderHistorySearchText(order).includes(search)
  )
}

function getEmployeePaymentMethodLabel(method?: PaymentMethod | null) {
  if (method === 'cash') return 'Contant'
  if (method === 'card') return 'Kaart'
  if (method === 'online_fake') return 'Online'
  if (method === 'pay_at_counter') return 'Betalen aan balie'

  return '-'
}

function renderOrderHistoryCard(order: Order) {
  const items = getOrderItems(order.id)
  const payment = getPaymentForOrder(order.id)
  const isAdminView = orderHistoryReturnScreen === 'admin'

  const itemCount = items.reduce(
    (sum, item) => sum + Number(item.quantity ?? 0),
    0
  )

  const customerLabel =
    order.customer_name ||
    order.pickup_code ||
    (order.order_type === 'staff' ? 'Balie / POS' : '-')

  const timeLabel = order.created_at
    ? new Date(order.created_at).toLocaleTimeString('nl-NL', {
        hour: '2-digit',
        minute: '2-digit',
      })
    : '-'

  const isSelected =
    String(selectedOrderHistoryId || '') === String(order.id)

  return `
    <button
      type="button"
      class="history-order-card history-list-row ${isSelected ? 'selected' : ''}"
      data-history-order-id="${escapeHtml(String(order.id))}"
      aria-pressed="${isSelected ? 'true' : 'false'}"
    >
      <div class="history-list-time">
        <strong>${escapeHtml(timeLabel)}</strong>
        <span>${itemCount} ${itemCount === 1 ? 'item' : 'items'}</span>
      </div>

      <div class="history-list-main">
        <div class="history-list-order-line">
          <strong>${escapeHtml(getOrderName(order))}</strong>

          <span class="status-badge status-${order.status}">
            ${escapeHtml(order.status)}
          </span>
        </div>

        <div class="history-list-customer">
          ${escapeHtml(customerLabel)}
          ${
            order.pickup_code && order.customer_name
              ? ` · ${escapeHtml(order.pickup_code)}`
              : ''
          }
        </div>
      </div>

      <div class="history-list-payment">
        <span class="order-payment-badge ${
          payment
            ? getPaymentRecordStatusClass(payment)
            : getPaymentBadgeClass(order)
        }">
          ${escapeHtml(
            payment
              ? getPaymentRecordStatusLabel(payment)
              : getPaymentBadgeText(order)
          )}
        </span>

        <small>
          ${
            isAdminView && payment
              ? escapeHtml(getPaymentProviderLabel(payment))
              : escapeHtml(getEmployeePaymentMethodLabel(order.payment_method))
          }
        </small>
      </div>

      <div class="history-list-total">
        <span>Totaal</span>
        <strong>€ ${getOrderTotal(order).toFixed(2)}</strong>
      </div>

      <span class="history-list-chevron">›</span>
    </button>
  `
}

function renderOrderHistoryDetailPanel() {
  const isAdminView = orderHistoryReturnScreen === 'admin'

  if (!selectedOrderHistoryId) {
    return `
      <aside class="history-detail-panel history-detail-empty">
        <div class="history-detail-empty-icon">☰</div>
        <strong>Selecteer een bestelling</strong>
        <span>
          ${
            isAdminView
              ? 'Klik links op een order om de drankjes en volledige betaalgegevens te bekijken.'
              : 'Klik links op een order om de bestelling te bekijken.'
          }
        </span>
      </aside>
    `
  }

  const order = orders.find(
    (item) => String(item.id) === String(selectedOrderHistoryId)
  )

  if (!order) {
    return `
      <aside class="history-detail-panel history-detail-empty">
        <strong>Bestelling niet gevonden</strong>
      </aside>
    `
  }

  const items = getOrderItems(order.id)
  const payment = getPaymentForOrder(order.id)
  const hasCustomerInfo =
    Boolean(order.customer_name) ||
    Boolean(order.customer_phone) ||
    Boolean(order.pickup_code)

  return `
    <aside class="history-detail-panel open">
      <div class="history-detail-header">
        <div>
          <span>Bestelling</span>
          <h2>${escapeHtml(getOrderName(order))}</h2>
          <p>${escapeHtml(formatDate(order.created_at))}</p>
        </div>

        <button
          type="button"
          class="history-detail-close"
          id="history-detail-close"
          aria-label="Sluiten"
        >
          ×
        </button>
      </div>

      <div class="history-detail-status-row">
        <span class="status-badge status-${order.status}">
          ${escapeHtml(order.status)}
        </span>

        <span class="order-payment-badge ${
          payment
            ? getPaymentRecordStatusClass(payment)
            : getPaymentBadgeClass(order)
        }">
          ${escapeHtml(
            payment
              ? getPaymentRecordStatusLabel(payment)
              : getPaymentBadgeText(order)
          )}
        </span>
      </div>

      ${
        hasCustomerInfo
          ? `
            <div class="history-detail-section">
              <h3>Klant & pickup</h3>

              <div class="history-detail-info-grid">
                ${
                  order.customer_name
                    ? `
                      <div>
                        <span>Naam</span>
                        <strong>${escapeHtml(order.customer_name)}</strong>
                      </div>
                    `
                    : ''
                }

                ${
                  order.customer_phone
                    ? `
                      <div>
                        <span>Telefoon</span>
                        <strong>${escapeHtml(order.customer_phone)}</strong>
                      </div>
                    `
                    : ''
                }

                ${
                  order.pickup_code
                    ? `
                      <div>
                        <span>Pickup code</span>
                        <strong>${escapeHtml(order.pickup_code)}</strong>
                      </div>
                    `
                    : ''
                }

                ${
                  isAdminView
                    ? `
                      <div>
                        <span>Kanaal</span>
                        <strong>${escapeHtml(order.channel || order.order_type || '-')}</strong>
                      </div>
                    `
                    : ''
                }
              </div>
            </div>
          `
          : ''
      }

      <div class="history-detail-section">
        <div class="history-detail-section-title">
          <h3>Drankjes</h3>
          <span>${items.reduce((sum, item) => sum + Number(item.quantity ?? 0), 0)} items</span>
        </div>

        <div class="history-detail-items">
          ${
            items.length === 0
              ? `<div class="history-detail-no-items">Geen orderregels gevonden.</div>`
              : items
                  .map((item) => {
                    const name =
                      item.product_name_snapshot ||
                      item.product_name ||
                      'Onbekend product'

                    return `
                      <div class="history-detail-item">
                        <div class="history-detail-item-main">
                          <strong>${item.quantity}× ${escapeHtml(name)}</strong>

                          ${renderModifierSummary(
                            item.ice_level,
                            item.sugar_level,
                            item.toppings
                          )}
                        </div>

                        <strong class="history-detail-item-price">
                          € ${getOrderItemTotal(item).toFixed(2)}
                        </strong>
                      </div>
                    `
                  })
                  .join('')
          }
        </div>
      </div>

      <div class="history-detail-section">
        <h3>Betaling</h3>

        <div class="history-detail-info-grid">
          <div>
            <span>Betaalmethode</span>
            <strong>
              ${escapeHtml(getEmployeePaymentMethodLabel(order.payment_method))}
            </strong>
          </div>

          ${
            isAdminView
              ? `
                <div>
                  <span>Provider</span>
                  <strong>${escapeHtml(payment ? getPaymentProviderLabel(payment) : '-')}</strong>
                </div>

                <div>
                  <span>Provider order ID</span>
                  <strong class="history-detail-code">
                    ${escapeHtml(payment?.provider_order_id || '-')}
                  </strong>
                </div>

                <div>
                  <span>Transaction ID</span>
                  <strong class="history-detail-code">
                    ${escapeHtml(payment?.provider_transaction_id || '-')}
                  </strong>
                </div>

                <div>
                  <span>Betaald op</span>
                  <strong>${escapeHtml(formatDate(payment?.paid_at || order.paid_at))}</strong>
                </div>

                <div>
                  <span>Payment ID</span>
                  <strong class="history-detail-code">
                    ${escapeHtml(payment?.id || '-')}
                  </strong>
                </div>
              `
              : ''
          }
        </div>
      </div>

      <div class="history-detail-total">
        <span>Totaal</span>
        <strong>€ ${getOrderTotal(order).toFixed(2)}</strong>
      </div>
    </aside>
  `
}

function renderOrderHistory() {
  const filteredOrders = getFilteredOrderHistory()
  const isSearching = orderHistorySearch.trim().length > 0
  const grouped = groupProductsByCategory()

  return `
    <div class="page order-history-page staff-footer-page">
      ${renderNav()}

      <header class="header history-header">
        <div class="staff-brand">
          <img class="tea-shop-logo" src="/logo.jpg" alt="Tea Shop logo" />

          <div>
            <h1>Bonnen & orders van vandaag</h1>
            <p class="sub">Alle bestellingen van vandaag in één overzichtelijke lijst.</p>
          </div>
        </div>

        <button
          type="button"
          class="small-btn"
          id="history-back"
        >
          ${orderHistoryReturnScreen === 'admin' ? '← Terug naar Admin' : '← Terug naar POS'}
        </button>
      </header>

      <section class="history-panel">
        <div class="history-search-row">
          <div class="history-search-wrap">
            <span class="history-search-icon">⌕</span>

            <input
              id="order-history-search"
              type="search"
              placeholder="Zoek in de orders van vandaag..."
              value="${escapeHtml(orderHistorySearch)}"
              autocomplete="off"
            />
          </div>

          <button
            type="button"
            class="small-btn"
            id="refresh-order-history"
          >
            Vernieuwen
          </button>
        </div>

        <div class="history-result-count">
          ${
            isSearching
              ? `${filteredOrders.length} van ${orders.length} orders vandaag`
              : `${orders.length} orders vandaag`
          }
        </div>

        ${
          isLoadingOrderHistory
            ? `<p class="history-empty">Orderhistorie laden...</p>`
            : filteredOrders.length === 0
              ? `
                <div class="history-empty">
                  Geen orders gevonden
                  ${
                    isSearching
                      ? `voor “${escapeHtml(orderHistorySearch)}”`
                      : ''
                  }.
                </div>
              `
              : `
                <div class="history-master-detail">
                  <div class="history-orders-list">
                    ${filteredOrders.map(renderOrderHistoryCard).join('')}
                  </div>

                  ${renderOrderHistoryDetailPanel()}
                </div>
              `
        }
      </section>

      ${renderStaffBottomBar(grouped)}
    </div>
  `
}


// =============================
// RENDER: ORDERS
// =============================


function renderPickupNumberList(status: 'preparing' | 'ready') {
  const pickupOrders =
    status === 'preparing'
      ? orders.filter(
          (order) =>
            order.status === 'new' ||
            order.status === 'preparing'
        )
      : orders.filter((order) => order.status === 'ready')

  if (pickupOrders.length === 0) {
    return `<div class="pickup-empty">Nog geen bestellingen</div>`
  }

  return pickupOrders
    .map(
      (order) => `
        <div class="pickup-number-card">
          ${escapeHtml(order.pickup_code || '----')}
        </div>
      `
    )
    .join('')
}

function renderPickup() {
  return `
    <div class="pickup-page">
      <header class="pickup-header">
        <div class="pickup-brand">
          <img src="/logo.jpg" alt="Blue Cup" class="pickup-logo" />

          <div>
            <h1>Blue Cup</h1>
            <p>Bestelstatus</p>
          </div>
        </div>

        <div class="pickup-live">
          <span></span>
          Live
        </div>
      </header>

      <main class="pickup-board ${pickupWaitVisible ? 'has-wait-time' : 'no-wait-time'}">
        <section class="pickup-column pickup-preparing">
          <div class="pickup-column-title">
            <span class="pickup-step">1</span>
            <div>
              <h2>In voorbereiding</h2>
              <p>Bestelling ontvangen of wordt bereid</p>
            </div>
          </div>

          <div class="pickup-number-list">
            ${renderPickupNumberList('preparing')}
          </div>
        </section>

        <section class="pickup-column pickup-ready">
          <div class="pickup-column-title">
            <span class="pickup-step">2</span>
            <div>
              <h2>Klaar om op te halen</h2>
              <p>Je bestelling staat klaar</p>
            </div>
          </div>

          <div class="pickup-number-list">
            ${renderPickupNumberList('ready')}
          </div>
        </section>

        ${
          pickupWaitVisible
            ? `
              <section class="pickup-column pickup-wait">
                <div class="pickup-column-title">
                  <span class="pickup-step">⏱</span>
                  <div>
                    <h2>Geschatte wachttijd</h2>
                    <p>Voor nieuwe bestellingen</p>
                  </div>
                </div>

                <div class="pickup-wait-content">
                  <div class="pickup-wait-value">
                    <strong>± ${pickupWaitMinutes}</strong>
                    <span>minuten</span>
                  </div>

                  <p class="pickup-wait-note">
                    Dit is een schatting. De werkelijke wachttijd kan iets afwijken.
                  </p>
                </div>
              </section>
            `
            : ''
        }
      </main>
    </div>
  `
}

function renderOrders() {
  const filteredOrders = getFilteredOrders()

  return `
    <div class="page orders-screen-page">
      ${renderNav()}

      <header class="header">
        <div class="staff-brand">
          <img class="tea-shop-logo" src="/logo.jpg" alt="Tea Shop logo" />

          <div>
            <h1>Orders overzicht</h1>
            <p class="sub">Bekijk orders per status.</p>
          </div>
        </div>

        ${message ? `<p class="success-message">${escapeHtml(message)}</p>` : ''}
      </header>

      <section class="orders-page">
        <div class="section-header">
          <h2>Orders</h2>
          <button class="small-btn" id="refresh-orders">Refresh</button>
        </div>

        ${renderOrderFilters()}

        ${isLoadingOrders ? `<p>Orders laden...</p>` : ''}

        ${
          !isLoadingOrders && filteredOrders.length === 0
            ? `<p>Geen orders gevonden voor filter: <strong>${getOrderFilterText(orderFilter)}</strong>.</p>`
            : `
              <div class="orders-list">
                ${filteredOrders.map(renderOrderCard).join('')}
              </div>
            `
        }
      </section>

    </div>
  `
}

function renderOrderCard(order: Order) {
  const items = getOrderItems(order.id)
  const customerText = getCustomerOrderText(order)

  return `
    <div class="order-card">
      <div class="order-card-top">
        <div>
          <h3>${escapeHtml(getOrderName(order))}</h3>
          <p class="muted">${formatDate(order.created_at)}</p>
          <div class="order-payment-row">
            <span class="order-payment-badge ${getPaymentBadgeClass(order)}">
              ${escapeHtml(getPaymentBadgeText(order))}
            </span>

            ${
              order.payment_method
                ? `
                  <span class="order-payment-method">
                    ${escapeHtml(
                      order.payment_method === 'online_fake'
                        ? 'MultiSafepay test'
                        : order.payment_method
                    )}
                  </span>
                `
                : ''
            }
          </div>

          ${customerText ? `<p class="muted">${escapeHtml(customerText)}</p>` : ''}
        </div>

        <div class="order-status-actions">
          <span class="status-badge status-${order.status}">
            ${order.status}
          </span>

          ${
            order.status === 'ready'
              ? `
                <button
                  type="button"
                  class="ready-back-btn"
                  data-status-order="${order.id}"
                  data-next-status="preparing"
                  title="Terug naar voorbereiding"
                >
                  ↩ Terug
                </button>
              `
              : order.status === 'completed'
                ? `
                  <button
                    type="button"
                    class="ready-back-btn completed-back-btn"
                    data-status-order="${order.id}"
                    data-next-status="ready"
                    title="Terug naar pickup"
                  >
                    ↩ Terug naar pickup
                  </button>
                `
                : ''
          }
        </div>
      </div>

      <div class="order-items">
        ${
          items.length === 0
            ? `<p class="muted">Geen orderregels gevonden.</p>`
            : items
                .map((item) => {
                  const name = item.product_name_snapshot || item.product_name || 'Onbekend product'

                  return `
                    <div class="order-item-row order-item-with-modifiers">
                      <div>
                        <span>${item.quantity}x ${escapeHtml(name)}</span>
                        ${renderModifierSummary(item.ice_level, item.sugar_level, item.toppings, item.cup_size)}
                      </div>
                      <span>€ ${getOrderItemTotal(item).toFixed(2)}</span>
                    </div>
                  `
                })
                .join('')
        }
      </div>

      <div class="order-total-row">
        <strong>Totaal</strong>
        <strong>€ ${getOrderTotal(order).toFixed(2)}</strong>
      </div>

      <div class="status-actions">
        ${renderStatusButtons(order)}
      </div>
    </div>
  `
}

function renderStatusButtons(order: Order) {
  if (order.status === 'completed') {
    return `<p class="muted">Order afgerond.</p>`
  }

  if (order.status === 'cancelled') {
    return `
      <div>
        <p class="muted">Order geannuleerd.</p>
        ${
          order.cancel_reason
            ? `<p class="muted"><strong>Reden:</strong> ${escapeHtml(order.cancel_reason)}</p>`
            : ''
        }
      </div>
    `
  }

  return `
    ${
      order.status === 'new'
        ? `<button class="status-btn orange" data-status-order="${order.id}" data-next-status="preparing">Start bereiden</button>`
        : ''
    }

    ${
      order.status === 'preparing'
        ? `<button class="status-btn blue" data-status-order="${order.id}" data-next-status="ready">Klaar voor pickup</button>`
        : ''
    }

    ${
      order.status === 'ready'
        ? `
          <button
            class="status-btn green"
            data-status-order="${order.id}"
            data-next-status="completed"
          >
            Afgerond
          </button>
        `
        : ''
    }

    <button class="status-btn red" data-status-order="${order.id}" data-next-status="cancelled">
      Annuleer
    </button>
  `
}


// =============================
// RENDER: KITCHEN
// =============================

function renderKitchen() {
  const groupedLabels = groupKitchenLabelsByOrder()
  const orderKeys = Object.keys(groupedLabels)

  return `
    <div class="page kitchen-page">
      ${renderNav()}

      <header class="header">
        <div class="staff-brand">
          <img class="tea-shop-logo" src="/logo.jpg" alt="Tea Shop logo" />

          <div>
            <h1>Kitchen labels</h1>
            <p class="sub">Open orders met losse drink-statussen. Refresh automatisch elke 5 seconden.</p>
          </div>
        </div>

        ${message ? `<p class="success-message">${escapeHtml(message)}</p>` : ''}
      </header>

      <section class="orders-page">
        <div class="section-header">
          <h2>Open orders</h2>
          <button class="small-btn" id="refresh-kitchen">Refresh</button>
        </div>

        ${isLoadingKitchen ? `<p>Kitchen labels laden...</p>` : ''}

        ${
          !isLoadingKitchen && orderKeys.length === 0
            ? `<p>Geen open kitchen orders.</p>`
            : `
              <div class="kitchen-order-list">
                ${orderKeys
                  .map((orderKey) => renderKitchenOrderCard(orderKey, groupedLabels[orderKey]))
                  .join('')}
              </div>
            `
        }
      </section>
    </div>
  `
}

function renderKitchenOrderCard(orderKey: string, labels: KitchenLabel[]) {
  const firstLabel = labels[0]
  const orderId = firstLabel.order_id

  const hasNewLabels = labels.some((label) => label.status === 'new')
  const hasPreparingLabels = labels.some((label) => label.status === 'preparing')
  const orderPhase = getKitchenOrderPhase(labels)

  return `
    <div class="kitchen-order-card">
      <div class="order-card-top">
        <div>
          <h3>${escapeHtml(orderKey)}</h3>
          <p class="muted">${formatDate(firstLabel.created_at)}</p>
        </div>

        <div class="order-phase-box">
          <span class="status-badge">
            ${labels.length} drink${labels.length === 1 ? '' : 's'}
          </span>

          <span class="order-phase-text">
            ${orderPhase}
          </span>
        </div>
      </div>

      <div class="whole-order-actions">
        ${
          hasNewLabels
            ? `<button class="status-btn orange" data-whole-order="${orderId}" data-next-whole-label-status="preparing">
                Start order
              </button>`
            : ''
        }

        ${
          hasNewLabels || hasPreparingLabels
            ? `<button class="status-btn green" data-whole-order="${orderId}" data-next-whole-label-status="done">
                Finish order
              </button>`
            : ''
        }
      </div>

      <div class="kitchen-label-list">
        ${labels.map(renderKitchenLabelRow).join('')}
      </div>
    </div>
  `
}

function renderKitchenLabelRow(label: KitchenLabel) {
  return `
    <div class="kitchen-label-row">
      <div class="kitchen-label-info">
        <strong>${escapeHtml(label.product_name)}</strong>
        <span class="muted">Label #${label.label_index}</span>
        ${renderModifierSummary(label.ice_level, label.sugar_level, label.toppings, label.cup_size)}
      </div>

      <span class="status-badge status-${label.status}">
        ${getLabelStatusText(label.status)}
      </span>

      <div class="kitchen-label-actions">
        ${renderKitchenLabelButtons(label)}
      </div>
    </div>
  `
}

function renderKitchenLabelButtons(label: KitchenLabel) {
  if (label.status === 'done') {
    return `<p class="muted">Finished</p>`
  }

  if (label.status === 'cancelled') {
    return `<p class="muted">Cancelled</p>`
  }

  return `
    ${
      label.status === 'new'
        ? `<button class="status-btn orange" data-label-status="${label.id}" data-next-label-status="preparing">Start</button>`
        : ''
    }

    ${
      label.status === 'preparing'
        ? `<button class="status-btn green" data-label-status="${label.id}" data-next-label-status="done">Finish</button>`
        : ''
    }
  `
}


// =============================
// CUSTOMER: CATEGORY SCROLL
// =============================

function getCustomerProductScrollBox() {
  return document.querySelector<HTMLElement>('.customer-product-list')
}

function setActiveCustomerCategory(index: number) {
  const categoryLinks = Array.from(
    document.querySelectorAll<HTMLElement>('.customer-category-link')
  )

  categoryLinks.forEach((link, linkIndex) => {
    if (linkIndex === index) {
      link.classList.add('active')
    } else {
      link.classList.remove('active')
    }
  })
}

function updateActiveCustomerCategory() {
  if (screen !== 'customer') return
  if (customerOrderPlaced) return
  if (isSmoothScrollingToCategory) return

  const scrollBox = getCustomerProductScrollBox()
  if (!scrollBox) return

  const categoryBlocks = Array.from(
    document.querySelectorAll<HTMLElement>('.customer-product-list .category-block')
  )

  if (categoryBlocks.length === 0) return

  const scrollBoxTop = scrollBox.getBoundingClientRect().top

  let activeIndex = 0
  let bestTop = -Number.POSITIVE_INFINITY

  categoryBlocks.forEach((block, index) => {
    const rect = block.getBoundingClientRect()
    const topInsideScrollBox = rect.top - scrollBoxTop

    if (topInsideScrollBox <= 80 && topInsideScrollBox > bestTop) {
      bestTop = topInsideScrollBox
      activeIndex = index
    }
  })

  setActiveCustomerCategory(activeIndex)
}

function bindCustomerCategoryScrollSpy() {
  window.removeEventListener('scroll', updateActiveCustomerCategory)

  const scrollBox = getCustomerProductScrollBox()
  if (!scrollBox) return

  scrollBox.removeEventListener('scroll', updateActiveCustomerCategory)

  if (screen !== 'customer' || customerOrderPlaced) return

  scrollBox.addEventListener('scroll', updateActiveCustomerCategory)
  updateActiveCustomerCategory()
}

function bindCustomerCategoryClicks() {
  const categoryLinks = Array.from(
    document.querySelectorAll<HTMLAnchorElement>('.customer-category-link')
  )

  categoryLinks.forEach((link) => {
    link.addEventListener('click', (event) => {
      event.preventDefault()

      const indexText = link.dataset.categoryLink
      if (!indexText) return

      const index = Number(indexText)
      const scrollBox = getCustomerProductScrollBox()
      const target = document.querySelector<HTMLElement>(`#category-${index}`)

      if (!scrollBox || !target) return

      isSmoothScrollingToCategory = true
      setActiveCustomerCategory(index)

      const scrollBoxTop = scrollBox.getBoundingClientRect().top
      const targetTop = target.getBoundingClientRect().top
      const currentScroll = scrollBox.scrollTop

      const y = currentScroll + targetTop - scrollBoxTop - 10

      scrollBox.scrollTo({
        top: y,
        behavior: 'smooth',
      })

      window.setTimeout(() => {
        isSmoothScrollingToCategory = false
        updateActiveCustomerCategory()
      }, 700)
    })
  })
}



const CUP_SIZE_QR_CODES: Record<CupSize, string> = {
  medium: 'M',
  large: 'L',
}

const SUGAR_QR_CODES: Record<SugarLevel, string> = {
  none: 'S000',
  minimal: 'S030',
  less: 'S050',
  normal: 'S070',
  sweet: 'S100',
}

const ICE_QR_CODES: Partial<Record<IceLevel, string>> = {
  no_ice: 'NOI',
  less_ice: 'LES',
  normal_ice: 'REG',
  warm: 'HOT',
  extra_ice: 'REG',
}

function getQrProductCode(label: KitchenLabel) {
  if (!label.product_id) return ''

  const product = products.find(
    (item) => String(item.id) === String(label.product_id)
  )

  return String(product?.qr_product_code || '').trim()
}

function buildDynamicStickerQrPayload(label: KitchenLabel) {
  const productCode = getQrProductCode(label)

  const sizeCode = label.cup_size
    ? CUP_SIZE_QR_CODES[label.cup_size] || ''
    : ''

  const sugarCode = label.sugar_level
    ? SUGAR_QR_CODES[label.sugar_level] || ''
    : ''

  const iceCode = label.ice_level
    ? ICE_QR_CODES[label.ice_level] || ''
    : ''

  if (!productCode) {
    console.warn(
      `Geen qr_product_code gevonden voor sticker ${label.id} (${label.product_name}).`
    )
    return ''
  }

  const parameters = [sizeCode, sugarCode, iceCode].filter(Boolean)

  return `|${productCode}|${parameters.join(',')}`
}

// =============================
// STICKER PRINT PREVIEW
// Shows the latest real order from Supabase.
// Open with: ?mode=print-preview
// =============================

// Lokale print bridge op dezelfde Mac als de POS.
// De browser kan niet rechtstreeks TCP poort 9100 openen,
// daarom sturen we ZPL via een kleine lokale Node print-service.
const ZEBRA_PRINT_BRIDGE_URL = 'http://127.0.0.1:3001/print'

// 50 mm x 43 mm op 203 dpi ≈ 400 x 344 dots.
const ZEBRA_LABEL_WIDTH_DOTS = 400
const ZEBRA_LABEL_HEIGHT_DOTS = 344

function sanitizeZplText(value: string) {
  return String(value || '')
    .replace(/[\^~]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function truncateZplText(value: string, maxLength: number) {
  const clean = sanitizeZplText(value)

  if (clean.length <= maxLength) {
    return clean
  }

  return `${clean.slice(0, Math.max(0, maxLength - 3))}...`
}

function buildStickerZpl(
  label: KitchenLabel,
  index: number,
  totalLabels: number,
  order?: Order | null
) {
  const stickerTimeSource = order?.created_at || label.created_at

  const time = stickerTimeSource
    ? new Date(stickerTimeSource).toLocaleTimeString('nl-NL', {
        hour: '2-digit',
        minute: '2-digit',
      })
    : '--:--'

  const toppingNames = (label.toppings ?? [])
    .map((topping) => topping.name)
    .filter(Boolean)

  const modifierText = [
    label.cup_size ? getCupSizeLabel(label.cup_size) : '',
    getStickerIceText(label.ice_level),
    getStickerSugarText(label.sugar_level),
    ...toppingNames,
  ]
    .filter(Boolean)
    .join(', ')

  const orderNumber =
    order?.order_number ||
    label.order_number ||
    label.order_id

  const productName = truncateZplText(label.product_name, 24)
  const safeOrderNumber = truncateZplText(orderNumber, 28)
  const safeChannel = truncateZplText(getStickerChannelText(order), 18)
  const safeModifiers = truncateZplText(modifierText, 90)
  const qrValue = sanitizeZplText(buildDynamicStickerQrPayload(label))

  return [
    '^XA',
    `^PW${ZEBRA_LABEL_WIDTH_DOTS}`,
    `^LL${ZEBRA_LABEL_HEIGHT_DOTS}`,
    '^LH0,0',
    '^CI28',

    // Nieuw outline-logo + strakker uitgelijnde header
    '^FO24,18^GFA,176,176,4,000000380000F07C0007F8C4003E0E4C01F0077C0F8001B01C000F0030007E3C2001EF6C600F19FC407C11B8C3E011809F001F80F8000F0047FFFF803F8000C0600000C0C00000C0C00000C040000080400000806000018060000180600001806000018020000100200001003000030030000300300003003000020010000200100006001800060018000600180006001800040008000C0008000C000C000C000600380003FFF00000FFC00000000000^FS',
    '^FO62,19^A0N,16,16^FDBlue Cup^FS',
    `^FO62,39^A0N,19,19^FB230,1,0,L,0^FD#${safeOrderNumber}^FS`,
    `^FO334,19^A0N,22,22^FD${index}/${totalLabels}^FS`,
    `^FO334,45^A0N,17,17^FD${sanitizeZplText(time)}^FS`,
    '^FO22,76^GB356,2,2^FS',

    // Drankinformatie
    `^FO24,90^A0N,32,32^FB352,2,2,L,0^FD${productName}^FS`,
    `^FO24,136^A0N,18,18^FB240,3,4,L,0^FD${safeModifiers}^FS`,

    // Onderkant
    `^FO24,242^A0N,18,18^FD${safeChannel}^FS`,
    qrValue ? `^FO252,178^BQN,2,4^FDLA,${qrValue}^FS` : '',
    '^FO22,306^GB356,1,1^FS',
    '^FO24,318^A0N,13,13^FDPowered by Blue Cup POS^FS',
    '^XZ',
  ]
    .filter(Boolean)
    .join('\n')
}


function buildStickerZplFooterDesign(
  label: KitchenLabel,
  index: number,
  totalLabels: number,
  order?: Order | null,
  flowerGraphicZpl = ''
) {
  const stickerTimeSource = order?.created_at || label.created_at

  const time = stickerTimeSource
    ? new Date(stickerTimeSource).toLocaleTimeString('nl-NL', {
        hour: '2-digit',
        minute: '2-digit',
      })
    : '--:--'

  const toppingNames = (label.toppings ?? [])
    .map((topping) => topping.name)
    .filter(Boolean)

  const modifierText = [
    label.cup_size ? getCupSizeLabel(label.cup_size) : '',
    getStickerIceText(label.ice_level),
    getStickerSugarText(label.sugar_level),
    ...toppingNames,
  ]
    .filter(Boolean)
    .join(', ')

  const orderNumber =
    order?.order_number ||
    label.order_number ||
    label.order_id

  const productName = truncateZplText(label.product_name, 24)
  const safeOrderNumber = truncateZplText(orderNumber, 28)
  const safeChannel = truncateZplText(getStickerChannelText(order), 18)
  const safeModifiers = truncateZplText(modifierText, 90)
  const qrValue = sanitizeZplText(buildDynamicStickerQrPayload(label))

  return [
    '^XA',
    `^PW${ZEBRA_LABEL_WIDTH_DOTS}`,
    `^LL${ZEBRA_LABEL_HEIGHT_DOTS}`,
    '^LH0,0',
    '^CI28',

    // Design 2/3/4: productinformatie bovenin, zonder originele header.
    `^FO24,28^A0N,32,32^FB352,2,2,L,0^FD${productName}^FS`,
    `^FO24,68^A0N,18,18^FB240,3,4,L,0^FD${safeModifiers}^FS`,

    // Kanaal + QR.
    `^FO24,188^A0N,18,18^FD${safeChannel}^FS`,
    qrValue ? `^FO252,122^BQN,2,4^FDLA,${qrValue}^FS` : '',

    // Optionele decoratie voor design 4.
    flowerGraphicZpl,

    // Onderste scheidingslijn en orderinformatie.
    '^FO22,270^GB356,1,1^FS',
    '^FO24,278^GFA,176,176,4,000000380000F07C0007F8C4003E0E4C01F0077C0F8001B01C000F0030007E3C2001EF6C600F19FC407C11B8C3E011809F001F80F8000F0047FFFF803F8000C0600000C0C00000C0C00000C040000080400000806000018060000180600001806000018020000100200001003000030030000300300003003000020010000200100006001800060018000600180006001800040008000C0008000C000C000C000600380003FFF00000FFC00000000000^FS',
    '^FO64,278^A0N,12,12^FDBlue Cup^FS',
    `^FO64,296^A0N,12,12^FB230,1,0,L,0^FD#${safeOrderNumber}^FS`,
    `^FO340,278^A0N,12,12^FD${index}/${totalLabels}^FS`,
    `^FO332,296^A0N,12,12^FD${sanitizeZplText(time)}^FS`,
    '^FO24,320^A0N,13,13^FDPowered by Blue Cup POS^FS',
    '^XZ',
  ]
    .filter(Boolean)
    .join('\n')
}

async function buildFlowerGraphicZpl() {
  const image = new Image()
  image.src = '/flower1-removebg.jpg'

  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve()
    image.onerror = () => reject(new Error('flower1-removebg.jpg kon niet worden geladen.'))
  })

  const width = 54
  const height = 54
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height

  const context = canvas.getContext('2d')
  if (!context) {
    throw new Error('Canvas voor flower-afbeelding kon niet worden gemaakt.')
  }

  context.fillStyle = '#ffffff'
  context.fillRect(0, 0, width, height)
  context.drawImage(image, 0, 0, width, height)

  const pixels = context.getImageData(0, 0, width, height).data
  const bytesPerRow = Math.ceil(width / 8)
  let hex = ''

  for (let y = 0; y < height; y += 1) {
    for (let byteIndex = 0; byteIndex < bytesPerRow; byteIndex += 1) {
      let value = 0

      for (let bit = 0; bit < 8; bit += 1) {
        const x = byteIndex * 8 + bit
        if (x >= width) continue

        const pixelIndex = (y * width + x) * 4
        const red = pixels[pixelIndex]
        const green = pixels[pixelIndex + 1]
        const blue = pixels[pixelIndex + 2]
        const alpha = pixels[pixelIndex + 3]
        const brightness = (red + green + blue) / 3

        if (alpha > 30 && brightness < 210) {
          value |= 1 << (7 - bit)
        }
      }

      hex += value.toString(16).padStart(2, '0').toUpperCase()
    }
  }

  const totalBytes = bytesPerRow * height
  return `^FO198,132^GFA,${totalBytes},${totalBytes},${bytesPerRow},${hex}^FS`
}

async function buildPreviewStickerZpl(
  design: number,
  label: KitchenLabel,
  index: number,
  totalLabels: number,
  order?: Order | null
) {
  // BELANGRIJK: Design 1 blijft exact de bestaande productiesticker gebruiken.
  if (design === 1) {
    return buildStickerZpl(label, index, totalLabels, order)
  }

  // Design 2 gebruikt de footer-layout.
  if (design === 2) {
    return buildStickerZplFooterDesign(label, index, totalLabels, order)
  }

  // Design 3 gebruikt dezelfde footer-layout plus de flower-afbeelding naast de QR.
  if (design === 3) {
    const flowerGraphicZpl = await buildFlowerGraphicZpl()
    return buildStickerZplFooterDesign(
      label,
      index,
      totalLabels,
      order,
      flowerGraphicZpl
    )
  }

  return buildStickerZpl(label, index, totalLabels, order)
}


function isOrderReadyForAutomaticPrint(order: Order) {
  if (order.status === 'cancelled') {
    return false
  }

  // Normale betaalde orders mogen direct naar de keuken.
  if (order.payment_status === 'paid') {
    return true
  }

  // Bij "betalen aan de balie" is unpaid bewust toegestaan:
  // de bestelling moet wel alvast in de keuken terechtkomen.
  if (order.payment_method === 'pay_at_counter') {
    return true
  }

  // Online betalingen die nog pending/failed/cancelled zijn printen we niet.
  return false
}

async function sendZplToPrintBridge(
  label: KitchenLabel,
  zpl: string,
  order?: Order | null
) {
  const response = await fetch(ZEBRA_PRINT_BRIDGE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      labelId: label.id,
      orderNumber:
        order?.order_number ||
        label.order_number ||
        label.order_id,
      zpl,
    }),
  })

  const result = await response.json().catch(() => ({})) as {
    ok?: boolean
    error?: string
  }

  if (!response.ok || !result.ok) {
    throw new Error(result.error || `Print bridge gaf HTTP ${response.status}`)
  }
}

async function claimAndAutoPrintLabel(
  label: KitchenLabel,
  index: number,
  totalLabels: number,
  order: Order
) {
  const nextAttempts = Number(label.print_attempts ?? 0) + 1

  // Atomisch claimen: alleen een label dat nog pending is mag worden opgepakt.
  // Dit voorkomt dubbele prints wanneer meerdere tabs openstaan.
  const { data: claimedRows, error: claimError } = await supabase
    .from('kitchen_labels')
    .update({
      print_status: 'printing',
      print_attempts: nextAttempts,
      printed_at: null,
      print_error: null,
    })
    .eq('id', label.id)
    .eq('print_status', 'pending')
    .select('*')

  if (claimError) {
    console.error('Automatische print claim mislukt:', claimError)
    return
  }

  const claimedLabel = (claimedRows ?? [])[0] as KitchenLabel | undefined

  if (!claimedLabel) {
    // Een andere tab/worker heeft hem al opgepakt.
    return
  }

  try {
    const zpl = buildStickerZpl(
      claimedLabel,
      index,
      totalLabels,
      order
    )

    await sendZplToPrintBridge(claimedLabel, zpl, order)

    const { error: successError } = await supabase
      .from('kitchen_labels')
      .update({
        print_status: 'printed',
        printed_at: new Date().toISOString(),
        print_error: null,
      })
      .eq('id', claimedLabel.id)
      .eq('print_status', 'printing')

    if (successError) {
      throw new Error(
        `Sticker is verstuurd, maar status opslaan mislukt: ${successError.message}`
      )
    }

    console.log(
      `Sticker automatisch geprint: ${order.order_number || order.id} | ${index}/${totalLabels}`
    )
  } catch (error) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : 'Onbekende printerfout'

    await supabase
      .from('kitchen_labels')
      .update({
        print_status: 'failed',
        printed_at: null,
        print_error: errorMessage,
      })
      .eq('id', claimedLabel.id)

    console.error('Automatisch printen mislukt:', errorMessage)
  }
}

async function processPendingPrintJobs() {
  if (isAutoPrintProcessing) {
    return
  }

  isAutoPrintProcessing = true

  try {
    const { data: pendingData, error: pendingError } = await supabase
      .from('kitchen_labels')
      .select('*')
      .eq('print_status', 'pending')
      .order('created_at', { ascending: true })

    if (pendingError) {
      console.error('Pending printlabels laden mislukt:', pendingError)
      return
    }

    const pendingLabels = ((pendingData ?? []) as KitchenLabel[]).filter(
      (label) => !ignoredPendingLabelIds.has(String(label.id))
    )

    if (pendingLabels.length === 0) {
      return
    }

    const orderIds = Array.from(
      new Set(
        pendingLabels
          .map((label) => String(label.order_id))
          .filter(Boolean)
      )
    )

    if (orderIds.length === 0) {
      return
    }

    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .in('id', orderIds)

    if (orderError) {
      console.error('Orders voor automatische print laden mislukt:', orderError)
      return
    }

    const orderMap = new Map(
      ((orderData ?? []) as Order[]).map((order) => [
        String(order.id),
        order,
      ])
    )

    // Per order werken, zodat 1/2, 2/2 enz. altijd klopt.
    for (const orderId of orderIds) {
      const order = orderMap.get(String(orderId))

      if (!order || !isOrderReadyForAutomaticPrint(order)) {
        continue
      }

      const { data: allLabelData, error: allLabelError } = await supabase
        .from('kitchen_labels')
        .select('*')
        .eq('order_id', orderId)
        .order('created_at', { ascending: true })

      if (allLabelError) {
        console.error(
          `Labels van order ${orderId} laden mislukt:`,
          allLabelError
        )
        continue
      }

      const allOrderLabels = (allLabelData ?? []) as KitchenLabel[]

      for (let i = 0; i < allOrderLabels.length; i++) {
        const label = allOrderLabels[i]

        if ((label.print_status || 'pending') !== 'pending') {
          continue
        }

        await claimAndAutoPrintLabel(
          label,
          i + 1,
          allOrderLabels.length,
          order
        )
      }
    }

    if (screen === 'print-preview') {
      await loadPrintPreviewData(false)
    }
  } finally {
    isAutoPrintProcessing = false
  }
}

function scheduleAutomaticPrintCheck() {
  if (autoPrintReloadTimer !== null) {
    window.clearTimeout(autoPrintReloadTimer)
  }

  autoPrintReloadTimer = window.setTimeout(() => {
    autoPrintReloadTimer = null
    void processPendingPrintJobs()
  }, 250)
}

async function startAutomaticPrintWorker() {
  if (autoPrintRealtimeChannel) {
    return
  }

  // Onthoud alleen de labels die AL pending waren vóórdat de worker startte.
  // Nieuwe labels krijgen nieuwe IDs en worden dus wel automatisch geprint.
  const { data: oldPendingData, error: oldPendingError } = await supabase
    .from('kitchen_labels')
    .select('id')
    .eq('print_status', 'pending')

  if (oldPendingError) {
    console.error('Oude pending labels bepalen mislukt:', oldPendingError)
  } else {
    ignoredPendingLabelIds = new Set(
      (oldPendingData ?? []).map((label: { id: string }) => String(label.id))
    )
  }

  console.log(
    `Automatische Zebra printer gestart. ${ignoredPendingLabelIds.size} oude pending label(s) worden genegeerd.`
  )

  autoPrintRealtimeChannel = supabase
    .channel('blue-cup-auto-printer')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'kitchen_labels',
      },
      () => {
        scheduleAutomaticPrintCheck()
      }
    )
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'orders',
      },
      () => {
        // Nodig voor online betaling:
        // zodra payment_status naar paid verandert, printen pending labels alsnog.
        scheduleAutomaticPrintCheck()
      }
    )
    .subscribe((status, error) => {
      if (status === 'SUBSCRIBED') {
        console.log('Automatische Zebra printer verbonden')
        scheduleAutomaticPrintCheck()
      }

      if (error) {
        console.error('Automatische Zebra printer realtime fout:', error)
      }
    })
}

async function printStickerOnZebra(labelId: string, design = 1) {
  const labelIndex = printPreviewLabels.findIndex(
    (item) => String(item.id) === String(labelId)
  )

  if (labelIndex < 0) return

  const label = printPreviewLabels[labelIndex]
  const nextAttempts = Number(label.print_attempts ?? 0) + 1

  // Eerst claimen als printing. Zo zien we in Supabase dat een print bezig is.
  const { error: printingError } = await supabase
    .from('kitchen_labels')
    .update({
      print_status: 'printing',
      print_attempts: nextAttempts,
      printed_at: null,
      print_error: null,
    })
    .eq('id', labelId)

  if (printingError) {
    printPreviewError = `Print starten mislukt: ${printingError.message}`
    render()
    return
  }

  await loadPrintPreviewData(false)

  try {
    const zpl = await buildPreviewStickerZpl(
      design,
      label,
      labelIndex + 1,
      printPreviewLabels.length,
      printPreviewOrder
    )

    const response = await fetch(ZEBRA_PRINT_BRIDGE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        labelId: label.id,
        orderNumber:
          printPreviewOrder?.order_number ||
          label.order_number ||
          label.order_id,
        zpl,
      }),
    })

    const result = await response.json().catch(() => ({})) as {
      ok?: boolean
      error?: string
    }

    if (!response.ok || !result.ok) {
      throw new Error(result.error || `Print bridge gaf HTTP ${response.status}`)
    }

    const { error: successError } = await supabase
      .from('kitchen_labels')
      .update({
        print_status: 'printed',
        printed_at: new Date().toISOString(),
        print_error: null,
      })
      .eq('id', labelId)

    if (successError) {
      throw new Error(`Sticker is verstuurd, maar status opslaan mislukt: ${successError.message}`)
    }
  } catch (error) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : 'Onbekende printerfout'

    await supabase
      .from('kitchen_labels')
      .update({
        print_status: 'failed',
        printed_at: null,
        print_error: errorMessage,
      })
      .eq('id', labelId)

    printPreviewError = `Printen mislukt: ${errorMessage}`
  }

  await loadPrintPreviewData(false)
}

function getStickerIceText(level?: IceLevel | null) {
  if (level === 'no_ice') return 'No ice'
  if (level === 'less_ice') return 'Less ice'
  if (level === 'warm') return 'Warm'

  // Alleen voor oude bestellingen die nog extra_ice bevatten.
  if (level === 'extra_ice') return 'Extra ice'

  return 'Normal ice'
}

function getStickerSugarText(level?: SugarLevel | null) {
  if (level === 'none') return 'No sugar'
  if (level === 'minimal') return 'Minimal sugar'
  if (level === 'less') return 'Less sugar'
  if (level === 'sweet') return 'Sweet'
  return 'Normal sugar'
}

function getStickerChannelText(order?: Order | null) {
  const rawChannel = String(order?.channel || '').trim()
  const channel = rawChannel.toLowerCase()

  if (channel === 'pos' || channel === 'in_store' || channel === 'in-store') {
    return 'in-store'
  }

  if (channel === 'qr') {
    return 'QR'
  }

  if (channel === 'thuisbezorgd') {
    return 'Thuisbezorgd'
  }

  if (channel === 'uber_eats' || channel === 'ubereats' || channel === 'uber') {
    return 'Uber Eats'
  }

  if (rawChannel) {
    return rawChannel
  }

  if (order?.order_type === 'staff') {
    return 'in-store'
  }

  if (order?.order_type === 'customer') {
    return 'QR'
  }

  return 'in-store'
}


function getPrintStatusText(status?: PrintStatus | null) {
  if (status === 'printed') return 'Printed'
  if (status === 'failed') return 'Failed'
  if (status === 'printing') return 'Printing'
  return 'Pending'
}

function getPrintStatusStyle(status?: PrintStatus | null) {
  if (status === 'printed') {
    return 'background:#e3f5e8;color:#1f6b34;border:1px solid #b9dfc2;'
  }

  if (status === 'failed') {
    return 'background:#fde7e7;color:#9a1c1c;border:1px solid #efbcbc;'
  }

  if (status === 'printing') {
    return 'background:#dce8f8;color:#1B478F;border:1px solid #bfd0e8;'
  }

  return 'background:#eef3fa;color:#1B478F;border:1px solid #d1ddec;'
}

async function updateStickerPrintResult(
  labelId: string,
  result: 'success' | 'failed'
) {
  const label = printPreviewLabels.find(
    (item) => String(item.id) === String(labelId)
  )

  if (!label) return

  const nextAttempts = Number(label.print_attempts ?? 0) + 1
  const now = new Date().toISOString()

  const updateData =
    result === 'success'
      ? {
          print_status: 'printed',
          print_attempts: nextAttempts,
          printed_at: now,
          print_error: null,
        }
      : {
          print_status: 'failed',
          print_attempts: nextAttempts,
          printed_at: null,
          print_error: 'Gesimuleerde printerfout',
        }

  const { error } = await supabase
    .from('kitchen_labels')
    .update(updateData)
    .eq('id', labelId)

  if (error) {
    printPreviewError = `Printstatus aanpassen mislukt: ${error.message}`
    render()
    return
  }

  await loadPrintPreviewData(false)
}

async function resetStickerPrintStatus(labelId: string) {
  const { error } = await supabase
    .from('kitchen_labels')
    .update({
      print_status: 'pending',
      printed_at: null,
      print_error: null,
    })
    .eq('id', labelId)

  if (error) {
    printPreviewError = `Sticker opnieuw klaarzetten mislukt: ${error.message}`
    render()
    return
  }

  await loadPrintPreviewData(false)
}

async function loadPrintPreviewData(showLoading = true) {
  if (showLoading) {
    isLoadingPrintPreview = true
    printPreviewError = ''
    render()
  }

  const { data: latestLabelData, error: latestLabelError } = await supabase
    .from('kitchen_labels')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (latestLabelError) {
    isLoadingPrintPreview = false
    printPreviewLabels = []
    printPreviewOrder = null
    printPreviewQrDataUrls = {}
    printPreviewError = `Laatste sticker ophalen mislukt: ${latestLabelError.message}`
    render()
    return
  }

  if (!latestLabelData) {
    isLoadingPrintPreview = false
    printPreviewLabels = []
    printPreviewOrder = null
    printPreviewQrDataUrls = {}
    printPreviewError = ''
    render()
    return
  }

  const latestLabel = latestLabelData as KitchenLabel

  const { data: labelsData, error: labelsError } = await supabase
    .from('kitchen_labels')
    .select('*')
    .eq('order_id', latestLabel.order_id)
    .order('created_at', { ascending: true })

  if (labelsError) {
    isLoadingPrintPreview = false
    printPreviewLabels = []
    printPreviewOrder = null
    printPreviewQrDataUrls = {}
    printPreviewError = `Stickers van de order ophalen mislukt: ${labelsError.message}`
    render()
    return
  }

  const { data: orderData, error: orderError } = await supabase
    .from('orders')
    .select('*')
    .eq('id', latestLabel.order_id)
    .maybeSingle()

  if (orderError) {
    isLoadingPrintPreview = false
    printPreviewLabels = (labelsData ?? []) as KitchenLabel[]
    printPreviewOrder = null
    printPreviewQrDataUrls = {}
    printPreviewError = `Ordergegevens ophalen mislukt: ${orderError.message}`
    render()
    return
  }

  printPreviewLabels = (labelsData ?? []) as KitchenLabel[]
  printPreviewOrder = orderData ? (orderData as Order) : null

  printPreviewQrDataUrls = {}

  for (const label of printPreviewLabels) {
    const qrPayload = buildDynamicStickerQrPayload(label)

    if (!qrPayload) {
      continue
    }

    try {
      printPreviewQrDataUrls[label.id] = await QRCode.toDataURL(
        qrPayload,
        {
          errorCorrectionLevel: 'M',
          margin: 1,
          width: 220,
        }
      )
    } catch (qrError) {
      console.error(
        `QR-code genereren mislukt voor sticker ${label.id}:`,
        qrError
      )
    }
  }

  printPreviewError = ''
  isLoadingPrintPreview = false
  render()
}

function renderStickerPreview(
  label: KitchenLabel,
  index: number,
  totalLabels: number,
  order?: Order | null,
  variant: 'default' | 'footer-info' | 'footer-info-flower' = 'default'
) {
  const stickerTimeSource = order?.created_at || label.created_at

  const time = stickerTimeSource
    ? new Date(stickerTimeSource).toLocaleTimeString('nl-NL', {
        hour: '2-digit',
        minute: '2-digit',
      })
    : '--:--'

  const toppingNames = (label.toppings ?? [])
    .map((topping) => topping.name)
    .filter(Boolean)

  // De browserpreview gebruikt exact dezelfde teksten/truncatie als de ZPL.
  // Alleen deze HTML-preview is aangepast; buildStickerZpl() blijft onaangeraakt.
  const modifierText = [
    label.cup_size ? getCupSizeLabel(label.cup_size) : '',
    getStickerIceText(label.ice_level),
    getStickerSugarText(label.sugar_level),
    ...toppingNames,
  ]
    .filter(Boolean)
    .join(', ')

  const orderNumber =
    order?.order_number ||
    label.order_number ||
    label.order_id

  const productName = truncateZplText(label.product_name, 24)
  const safeOrderNumber = truncateZplText(orderNumber, 28)
  const safeChannel = truncateZplText(getStickerChannelText(order), 18)
  const safeModifiers = truncateZplText(modifierText, 90)
  const printStatus = (label.print_status || 'pending') as PrintStatus
  const attempts = Number(label.print_attempts ?? 0)
  const previewDesign =
    variant === 'default'
      ? 1
      : variant === 'footer-info'
        ? 2
        : 3

  return `
    <div class="sticker-preview-item">
      <!--
        Digitale 1-op-1 layoutweergave van de huidige Zebra ZPL:
        canvas 400 x 344 = 50 x 43 mm @ 203 dpi.
        De x/y-posities hieronder volgen rechtstreeks de bestaande ^FO waarden.
      -->
      <article
        class="drink-sticker"
        style="
          position:relative;
          display:block;
          width:${ZEBRA_LABEL_WIDTH_DOTS}px;
          height:${ZEBRA_LABEL_HEIGHT_DOTS}px;
          min-width:${ZEBRA_LABEL_WIDTH_DOTS}px;
          max-width:${ZEBRA_LABEL_WIDTH_DOTS}px;
          min-height:${ZEBRA_LABEL_HEIGHT_DOTS}px;
          max-height:${ZEBRA_LABEL_HEIGHT_DOTS}px;
          margin:0;
          padding:0;
          overflow:hidden;
          box-sizing:border-box;
          background:#fff;
          color:#000;
          border:1px solid #d4d4d4;
          border-radius:0;
          font-family:Arial,Helvetica,sans-serif;
          box-shadow:none;
        "
      >
        ${
          variant === 'default'
            ? `
              <!-- Originele header -->
              <img
                src="/logo-outline.jpg"
                alt="Blue Cup logo"
                style="
                  position:absolute;
                  left:24px;
                  top:18px;
                  width:32px;
                  height:44px;
                  display:block;
                  object-fit:contain;
                  filter:grayscale(1) contrast(2);
                "
              />

              <div style="position:absolute;left:62px;top:19px;font-size:16px;line-height:16px;font-weight:400;white-space:nowrap;">
                Blue Cup
              </div>

              <div style="position:absolute;left:62px;top:39px;width:230px;height:19px;overflow:hidden;font-size:19px;line-height:19px;font-weight:400;white-space:nowrap;">
                #${escapeHtml(safeOrderNumber)}
              </div>

              <div style="position:absolute;left:334px;top:19px;font-size:22px;line-height:22px;font-weight:400;white-space:nowrap;">
                ${index}/${totalLabels}
              </div>

              <div style="position:absolute;left:334px;top:45px;font-size:17px;line-height:17px;font-weight:400;white-space:nowrap;">
                ${escapeHtml(time)}
              </div>
            `
            : ''
        }

        <!-- ^FO22,76^GB356,2,2 -->
        ${variant === 'footer-info' || variant === 'footer-info-flower' ? '' : '<div style="position:absolute;left:22px;top:76px;width:356px;height:2px;background:#000;"></div>'}

        <!-- ^FO24,90^A0N,32,32^FB352,2,2 -->
        <div style="position:absolute;left:24px;top:${variant === 'footer-info' || variant === 'footer-info-flower' ? 28 : 90}px;width:352px;max-height:68px;overflow:hidden;font-size:32px;line-height:34px;font-weight:400;white-space:normal;overflow-wrap:break-word;">
          ${escapeHtml(productName)}
        </div>

        <!-- ^FO24,136^A0N,18,18^FB240,3,4 -->
        <div style="position:absolute;left:24px;top:${variant === 'footer-info' || variant === 'footer-info-flower' ? 68 : 136}px;width:240px;max-height:66px;overflow:hidden;font-size:18px;line-height:22px;font-weight:400;white-space:normal;overflow-wrap:break-word;">
          ${escapeHtml(safeModifiers)}
        </div>

        <!-- ^FO24,242^A0N,18,18 -->
        <div style="position:absolute;left:24px;top:${variant === 'footer-info' || variant === 'footer-info-flower' ? 188 : 242}px;font-size:18px;line-height:18px;font-weight:400;white-space:nowrap;">
          ${escapeHtml(safeChannel)}
        </div>

        <!-- ^FO252,178^BQN,2,4 -->
        <div
          aria-label="QR code"
          style="
            position:absolute;
            left:252px;
            top:${variant === 'footer-info' || variant === 'footer-info-flower' ? 122 : 178}px;
            width:116px;
            height:116px;
            display:flex;
            align-items:center;
            justify-content:center;
            background:#fff;
            overflow:hidden;
          "
        >
          ${
            printPreviewQrDataUrls[label.id]
              ? `
                <img
                  src="${printPreviewQrDataUrls[label.id]}"
                  alt="QR-code voor sticker"
                  style="width:116px;height:116px;display:block;object-fit:fill;image-rendering:pixelated;background:#fff;"
                />
              `
              : `<span style="font-size:16px;">QR</span>`
          }
        </div>

        ${
          variant === 'footer-info-flower'
            ? `
              <img
                src="/flower1-removebg.jpg"
                alt="Flower decor"
                style="
                  position:absolute;
                  left:202px;
                  top:132px;
                  width:54px;
                  height:54px;
                  display:block;
                  object-fit:contain;
                "
              />
            `
            : ''
        }

        ${
          variant === 'footer-info' || variant === 'footer-info-flower'
            ? `
              <!-- Design 2: zwarte lijn hoger, orderinformatie eronder -->
              <div style="position:absolute;left:22px;top:270px;width:356px;height:1px;background:#000;"></div>

              <div
                style="
                  position:absolute;
                  left:24px;
                  right:24px;
                  top:278px;
                  display:flex;
                  align-items:flex-start;
                  justify-content:space-between;
                  gap:16px;
                "
              >
                <div style="display:flex;align-items:flex-start;gap:8px;min-width:0;">
                  <img
                    src="/logo-outline.jpg"
                    alt="Blue Cup logo"
                    style="
                      width:24px;
                      height:32px;
                      display:block;
                      object-fit:contain;
                      filter:grayscale(1) contrast(2);
                      flex:0 0 auto;
                    "
                  />

                  <div style="display:flex;flex-direction:column;gap:4px;min-width:0;">
                    <div style="font-size:12px;line-height:12px;font-weight:400;white-space:nowrap;">
                      Blue Cup
                    </div>

                    <div style="max-width:210px;overflow:hidden;text-overflow:clip;font-size:12px;line-height:13px;font-weight:400;white-space:nowrap;">
                      #${escapeHtml(safeOrderNumber)}
                    </div>
                  </div>
                </div>

                <div
                  style="
                    display:flex;
                    flex-direction:column;
                    align-items:flex-end;
                    justify-content:flex-start;
                    gap:4px;
                    flex:0 0 auto;
                    min-width:42px;
                  "
                >
                  <div style="font-size:12px;line-height:12px;font-weight:400;white-space:nowrap;">
                    ${index}/${totalLabels}
                  </div>

                  <div style="font-size:12px;line-height:13px;font-weight:400;white-space:nowrap;">
                    ${escapeHtml(time)}
                  </div>
                </div>
              </div>

              <div style="position:absolute;left:24px;top:320px;font-size:13px;line-height:13px;font-weight:400;white-space:nowrap;">
                Powered by Blue Cup POS
              </div>
            `
            : `
              <!-- Originele footer van design 1 -->
              <div style="position:absolute;left:22px;top:306px;width:356px;height:1px;background:#000;"></div>

              <div style="position:absolute;left:24px;top:318px;font-size:13px;line-height:13px;font-weight:400;white-space:nowrap;">
                Powered by Blue Cup POS
              </div>
            `
        }
      </article>

      <div
        class="no-print"
        style="
          margin-top:10px;
          padding:10px;
          border:1px solid #dce4ef;
          border-radius:12px;
          background:#fff;
          font-family:Arial,Helvetica,sans-serif;
        "
      >
        <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:8px;">
          <span
            style="
              display:inline-flex;
              align-items:center;
              padding:5px 8px;
              border-radius:999px;
              font-size:11px;
              font-weight:800;
              ${getPrintStatusStyle(printStatus)}
            "
          >
            ${escapeHtml(getPrintStatusText(printStatus))}
          </span>

          <small style="color:#6f7a8a;">
            Pogingen: ${attempts}
          </small>
        </div>

        ${
          label.print_error
            ? `
              <div style="margin-bottom:8px;color:#9a1c1c;font-size:11px;font-weight:700;">
                ${escapeHtml(label.print_error)}
              </div>
            `
            : ''
        }

        ${
          label.printed_at
            ? `
              <div style="margin-bottom:8px;color:#6f7a8a;font-size:10px;">
                Laatst geprint: ${escapeHtml(formatDate(label.printed_at))}
              </div>
            `
            : ''
        }

        <div style="display:flex;flex-wrap:wrap;gap:6px;">
          ${
            printStatus === 'pending'
              ? `
                <button
                  type="button"
                  class="small-btn"
                  data-real-zebra-print="${label.id}"
                  data-sticker-design="${previewDesign}"
                  style="font-size:11px;padding:7px 10px;background:#1f6b34;"
                >
                  Echt printen op Zebra
                </button>

                <button
                  type="button"
                  class="small-btn"
                  data-simulate-print-failure="${label.id}"
                  style="font-size:11px;padding:7px 10px;background:#c63d3d;"
                >
                  Simuleer fout
                </button>
              `
              : ''
          }

          ${
            printStatus === 'printing'
              ? `
                <button
                  type="button"
                  class="nav-btn"
                  disabled
                  style="font-size:11px;padding:7px 10px;"
                >
                  Bezig met printen...
                </button>
              `
              : ''
          }

          ${
            printStatus === 'failed'
              ? `
                <button
                  type="button"
                  class="small-btn"
                  data-real-zebra-print="${label.id}"
                  data-sticker-design="${previewDesign}"
                  style="font-size:11px;padding:7px 10px;background:#1f6b34;"
                >
                  Opnieuw echt printen
                </button>

                <button
                  type="button"
                  class="nav-btn"
                  data-reset-print-status="${label.id}"
                  style="font-size:11px;padding:7px 10px;"
                >
                  Terug naar pending
                </button>
              `
              : ''
          }

          ${
            printStatus === 'printed'
              ? `
                <button
                  type="button"
                  class="nav-btn"
                  data-real-zebra-print="${label.id}"
                  data-sticker-design="${previewDesign}"
                  style="font-size:11px;padding:7px 10px;"
                >
                  Reprint op Zebra
                </button>
              `
              : ''
          }
        </div>
      </div>
    </div>
  `
}

function renderPrintPreview() {
  const orderTitle =
    printPreviewOrder?.order_number ||
    printPreviewLabels[0]?.order_number ||
    ''

  return `
    <div class="page sticker-preview-page">
      <div class="sticker-preview-toolbar no-print">
        <div>
          <h1>Sticker preview</h1>
          <p class="sub">
            ${
              orderTitle
                ? `Laatste order uit Supabase: ${escapeHtml(orderTitle)}`
                : 'Laatste order uit Supabase.'
            }
          </p>
        </div>

        <div class="sticker-preview-actions">
          <button class="nav-btn" id="print-preview-back" type="button">
            ${printPreviewReturnScreen === 'admin' ? 'Terug naar Admin' : 'Terug naar POS'}
          </button>
          <button class="nav-btn" id="refresh-sticker-preview" type="button">Vernieuwen</button>
          <button
            class="small-btn"
            id="print-sticker-preview"
            type="button"
            ${printPreviewLabels.length === 0 ? 'disabled' : ''}
          >
            Browser print preview
          </button>
        </div>
      </div>

      ${
        isLoadingPrintPreview
          ? `
            <div class="sticker-preview-state no-print">
              Stickers laden uit Supabase...
            </div>
          `
          : printPreviewError
            ? `
              <div class="sticker-preview-state sticker-preview-state-error no-print">
                ${escapeHtml(printPreviewError)}
              </div>
            `
            : printPreviewLabels.length === 0
              ? `
                <div class="sticker-preview-state no-print">
                  Nog geen kitchen labels gevonden. Plaats eerst een testbestelling in de POS.
                </div>
              `
              : `
                <div class="sticker-preview-grid">
                  ${printPreviewLabels
                    .flatMap((label, index) => [
                      renderStickerPreview(
                        label,
                        index + 1,
                        printPreviewLabels.length,
                        printPreviewOrder,
                        'default'
                      ),
                      renderStickerPreview(
                        label,
                        index + 1,
                        printPreviewLabels.length,
                        printPreviewOrder,
                        'footer-info'
                      ),
                      renderStickerPreview(
                        label,
                        index + 1,
                        printPreviewLabels.length,
                        printPreviewOrder,
                        'footer-info-flower'
                      ),
                    ])
                    .join('')}
                </div>
              `
      }
    </div>
  `
}


function renderPaymentTest() {
  const payment = paymentTestPayment
  const order = paymentTestOrder
  const status = payment?.status ?? 'pending'
  const isFinished =
    status === 'paid' ||
    status === 'failed' ||
    status === 'cancelled' ||
    status === 'refunded'

  return `
    <div class="page payment-test-page">
      <main class="payment-test-shell">
        <section class="payment-test-brand">
          <img
            class="payment-test-logo"
            src="/logo.jpg"
            alt="Blue Cup logo"
          />

          <div>
            <span>Blue Cup</span>
            <strong>Payment Simulator</strong>
          </div>

          <span class="payment-test-environment">TEST</span>
        </section>

        ${
          isLoadingPaymentTest
            ? `
              <section class="payment-test-card payment-test-loading">
                Betaling laden...
              </section>
            `
            : paymentTestError
              ? `
                <section class="payment-test-card">
                  <div class="payment-test-error">
                    ${escapeHtml(paymentTestError)}
                  </div>

                  <button
                    class="payment-test-secondary-btn"
                    id="payment-test-back-customer"
                    type="button"
                  >
                    Terug naar bestelling
                  </button>
                </section>
              `
              : payment
                ? `
                  <section class="payment-test-card">
                    <div class="payment-test-heading">
                      <div>
                        <p>MultiSafepay voorbereiding</p>
                        <h1>Online betaling</h1>
                      </div>

                      <span class="payment-test-status ${getPaymentTestStatusClass(status)}">
                        ${escapeHtml(getPaymentTestStatusText(status))}
                      </span>
                    </div>

                    <div class="payment-test-amount">
                      <span>Te betalen</span>
                      <strong>${escapeHtml(formatPaymentAmount(payment.amount))}</strong>
                      <small>${escapeHtml(payment.currency || 'EUR')}</small>
                    </div>

                    <div class="payment-test-details">
                      <div>
                        <span>Order</span>
                        <strong>
                          ${escapeHtml(
                            order?.order_number ||
                            `Order ${payment.order_id}`
                          )}
                        </strong>
                      </div>

                      <div>
                        <span>Provider</span>
                        <strong>MultiSafepay</strong>
                      </div>

                      <div>
                        <span>Provider order ID</span>
                        <strong>
                          ${escapeHtml(payment.provider_order_id || '-')}
                        </strong>
                      </div>

                      <div>
                        <span>Payment ID</span>
                        <strong class="payment-test-id">
                          ${escapeHtml(payment.id)}
                        </strong>
                      </div>
                    </div>

                    ${
                      status === 'pending'
                        ? `
                          <div class="payment-test-info">
                            Dit is nog geen echte MultiSafepay-betaling.
                            Met deze knoppen testen we alvast wat er gebeurt
                            bij een succesvolle, mislukte of geannuleerde betaling.
                          </div>

                          <div class="payment-test-actions">
                            <button
                              class="payment-test-primary-btn"
                              id="payment-test-success"
                              type="button"
                              ${isUpdatingPaymentTest ? 'disabled' : ''}
                            >
                              ✓ Betaling succesvol
                            </button>

                            <button
                              class="payment-test-danger-btn"
                              id="payment-test-failed"
                              type="button"
                              ${isUpdatingPaymentTest ? 'disabled' : ''}
                            >
                              Betaling mislukt
                            </button>

                            <button
                              class="payment-test-secondary-btn"
                              id="payment-test-cancelled"
                              type="button"
                              ${isUpdatingPaymentTest ? 'disabled' : ''}
                            >
                              Annuleren
                            </button>
                          </div>
                        `
                        : `
                          <div class="payment-test-result ${getPaymentTestStatusClass(status)}">
                            <strong>${escapeHtml(getPaymentTestStatusText(status))}</strong>
                            <span>
                              ${
                                status === 'paid'
                                  ? 'De payment én de betaalstatus van de order staan nu op betaald.'
                                  : status === 'failed'
                                    ? 'De testbetaling is als mislukt opgeslagen.'
                                    : status === 'cancelled'
                                      ? 'De testbetaling is geannuleerd.'
                                      : 'De betaling is bijgewerkt.'
                              }
                            </span>
                          </div>

                          <div class="payment-test-actions">
                            ${
                              status !== 'paid' && status !== 'refunded'
                                ? `
                                  <button
                                    class="payment-test-secondary-btn"
                                    id="payment-test-retry"
                                    type="button"
                                    ${isUpdatingPaymentTest ? 'disabled' : ''}
                                  >
                                    Opnieuw proberen
                                  </button>
                                `
                                : ''
                            }

                            <button
                              class="payment-test-primary-btn"
                              id="payment-test-back-customer"
                              type="button"
                            >
                              Terug naar bestelling
                            </button>
                          </div>
                        `
                    }
                  </section>
                `
                : `
                  <section class="payment-test-card">
                    Geen payment gevonden.
                  </section>
                `
        }

        <p class="payment-test-footnote">
          Testomgeving — er wordt geen echt geld afgeschreven.
        </p>
      </main>
    </div>
  `
}


async function ensurePosProductStatusData() {
  if (screen !== 'pos-product-status') return

  await Promise.all([
    loadPosAvailabilityProducts(false),
    loadToppings(),
  ])
}


// =============================
// APP RENDER
// =============================

function render() {
  const app = document.querySelector<HTMLDivElement>('#app')!

  if (screen === 'pos') {
    app.innerHTML = renderPos()
  }

  if (screen === 'pos-product-status') {
    app.innerHTML = renderPosProductStatusPage()
  }

  if (screen === 'pos-settings') {
    app.innerHTML = renderPosSettings()
  }

  if (screen === 'orders') {
    app.innerHTML = renderOrders()
  }

  if (screen === 'kitchen') {
    app.innerHTML = renderKitchen()
  }

  if (screen === 'customer') {
    app.innerHTML = renderCustomer()
  }

  if (screen === 'pickup') {
    app.innerHTML = renderPickup()
  }

  if (screen === 'order-history') {
    app.innerHTML = renderOrderHistory()
  }

  if (screen === 'admin') {
    app.innerHTML = renderAdmin()
  }

  if (screen === 'admin-products') {
    app.innerHTML = renderAdminProductsPage()
  }

  if (screen === 'admin-sales') {
    app.innerHTML = renderAdminSalesPage()
  }

  if (screen === 'admin-day-close') {
    app.innerHTML = renderAdminDayClosePage()
  }

  if (screen === 'admin-add-product') {
    app.innerHTML = renderAdminAddProductPage()
  }

  if (screen === 'admin-add-topping') {
    app.innerHTML = renderAdminAddToppingPage()
  }

  if (screen === 'admin-categories') {
    app.innerHTML = renderAdminCategoriesPage()
  }

  if (screen === 'print-preview') {
    app.innerHTML = renderPrintPreview()
  }

  if (screen === 'payment-test') {
    app.innerHTML = renderPaymentTest()
  }

  bindEvents()
}


// =============================
// EVENTS
// =============================

function bindEvents() {
  document.querySelector<HTMLButtonElement>('#payment-test-success')?.addEventListener('click', () => {
    void updatePaymentTestStatus('paid')
  })

  document.querySelector<HTMLButtonElement>('#payment-test-failed')?.addEventListener('click', () => {
    void updatePaymentTestStatus('failed')
  })

  document.querySelector<HTMLButtonElement>('#payment-test-cancelled')?.addEventListener('click', () => {
    void updatePaymentTestStatus('cancelled')
  })

  document.querySelector<HTMLButtonElement>('#payment-test-retry')?.addEventListener('click', () => {
    void updatePaymentTestStatus('pending')
  })

  document.querySelector<HTMLButtonElement>('#payment-test-back-customer')?.addEventListener('click', () => {
    void returnFromPaymentTestToCustomer()
  })

  document.querySelector<HTMLButtonElement>('#print-sticker-preview')?.addEventListener('click', () => {
    window.print()
  })

  document.querySelector<HTMLButtonElement>('#refresh-sticker-preview')?.addEventListener('click', () => {
    void loadPrintPreviewData()
  })

  document.querySelectorAll<HTMLElement>('[data-real-zebra-print]').forEach((button) => {
    button.addEventListener('click', () => {
      const labelId = button.dataset.realZebraPrint
      const design = Number(button.dataset.stickerDesign || 1)
      if (!labelId) return

      void printStickerOnZebra(labelId, design)
    })
  })

  document.querySelectorAll<HTMLElement>('[data-simulate-print-success]').forEach((button) => {
    button.addEventListener('click', () => {
      const labelId = button.dataset.simulatePrintSuccess
      if (!labelId) return

      void updateStickerPrintResult(labelId, 'success')
    })
  })

  document.querySelectorAll<HTMLElement>('[data-simulate-print-failure]').forEach((button) => {
    button.addEventListener('click', () => {
      const labelId = button.dataset.simulatePrintFailure
      if (!labelId) return

      void updateStickerPrintResult(labelId, 'failed')
    })
  })

  document.querySelectorAll<HTMLElement>('[data-reset-print-status]').forEach((button) => {
    button.addEventListener('click', () => {
      const labelId = button.dataset.resetPrintStatus
      if (!labelId) return

      void resetStickerPrintStatus(labelId)
    })
  })

  document.querySelectorAll<HTMLElement>('[data-customer-language]').forEach((button) => {
    button.addEventListener('click', () => {
      const language = button.dataset.customerLanguage as CustomerLanguage | undefined

      if (!language) return

      setCustomerLanguage(language)
    })
  })

  const posProductSearchInput =
    document.querySelector<HTMLInputElement>('#pos-product-search')

  posProductSearchInput?.addEventListener('input', () => {
    posProductSearch = posProductSearchInput.value
    applyPosProductSearchFilter()
  })

  if (posProductSearchInput) {
    applyPosProductSearchFilter()
  }

  document.querySelector<HTMLButtonElement>('#pos-availability-open')?.addEventListener('click', () => {
    void openPosAvailability()
  })

  document.querySelector<HTMLButtonElement>('#pos-availability-close')?.addEventListener('click', () => {
    closePosAvailability()
  })

  document.querySelector<HTMLButtonElement>('#pos-availability-refresh')?.addEventListener('click', () => {
    void Promise.all([
      loadPosAvailabilityProducts(false),
      loadToppings(),
    ]).then(() => render())
  })

  document.querySelector<HTMLSelectElement>('#pos-availability-tea-type')?.addEventListener('change', (event) => {
    posAvailabilityTeaType = (event.target as HTMLSelectElement).value
    posAvailabilityError = ''
    render()
  })

  document.querySelector<HTMLButtonElement>('#pos-tea-sold-out')?.addEventListener('click', () => {
    void setPosTeaTypeSoldOut(posAvailabilityTeaType, true)
  })

  document.querySelector<HTMLButtonElement>('#pos-tea-available')?.addEventListener('click', () => {
    void setPosTeaTypeSoldOut(posAvailabilityTeaType, false)
  })

  document.querySelector<HTMLInputElement>('#pos-availability-search')?.addEventListener('input', (event) => {
    posAvailabilitySearch = (event.target as HTMLInputElement).value
    render()

    requestAnimationFrame(() => {
      const input = document.querySelector<HTMLInputElement>('#pos-availability-search')
      if (!input) return
      input.focus()
      input.setSelectionRange(input.value.length, input.value.length)
    })
  })

  document.querySelectorAll<HTMLButtonElement>('[data-pos-topping-sold-out]').forEach((button) => {
    button.addEventListener('click', () => {
      const toppingId = button.dataset.posToppingSoldOut
      const nextValue = button.dataset.nextToppingSoldOut === 'true'
      if (!toppingId) return

      void setPosToppingSoldOut(toppingId, nextValue)
    })
  })

  document.querySelectorAll<HTMLButtonElement>('[data-pos-sold-out]').forEach((button) => {
    button.addEventListener('click', () => {
      const productId = button.dataset.posSoldOut
      const nextValue = button.dataset.nextSoldOut === 'true'
      if (!productId) return

      void setPosProductSoldOut(productId, nextValue)
    })
  })

  document.querySelectorAll<HTMLButtonElement>('[data-pos-visible]').forEach((button) => {
    button.addEventListener('click', () => {
      const productId = button.dataset.posVisible
      const nextValue = button.dataset.nextVisible === 'true'
      if (!productId) return

      void setPosProductVisible(productId, nextValue)
    })
  })

  document.querySelectorAll<HTMLButtonElement>('[data-pos-footer-category]').forEach((button) => {
    button.addEventListener('click', () => {
      const categoryIndex = button.dataset.posFooterCategory
      if (categoryIndex === undefined) return

      const target = document.querySelector<HTMLElement>(`#category-${categoryIndex}`)

      if (!target) {
        goToPos()

        requestAnimationFrame(() => {
          const posTarget = document.querySelector<HTMLElement>(`#category-${categoryIndex}`)
          if (!posTarget) return

          posTarget.scrollIntoView({
            behavior: 'smooth',
            block: 'start',
          })
        })

        return
      }

      target.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      })
    })
  })

  document.querySelector<HTMLButtonElement>('#pos-wait-settings')?.addEventListener('click', () => {
    void goToPosSettings('pos')
  })

  document.querySelector<HTMLButtonElement>('#pos-settings-back')?.addEventListener('click', goBackFromSettings)
  document.querySelector<HTMLButtonElement>('#pos-settings-back-bottom')?.addEventListener('click', goBackFromSettings)

  document.querySelector<HTMLButtonElement>('#pos-wait-save')?.addEventListener('click', () => {
    void savePickupWaitSettings()
  })

  document.querySelector<HTMLButtonElement>('#go-pos')?.addEventListener('click', goToPos)

  document.querySelector<HTMLButtonElement>('#go-order-history')?.addEventListener('click', () => {
    void goToOrderHistory('pos')
  })

  document.querySelector<HTMLButtonElement>('#go-admin-order-history')?.addEventListener('click', () => {
    void goToOrderHistory('admin')
  })

  document.querySelector<HTMLButtonElement>('#history-back')?.addEventListener('click', goBackFromOrderHistory)

  document.querySelector<HTMLButtonElement>('#history-back-pos')?.addEventListener('click', goBackFromOrderHistory)

  document.querySelector<HTMLButtonElement>('#refresh-order-history')?.addEventListener('click', () => {
    void loadOrderHistory()
  })

  document.querySelectorAll<HTMLElement>('[data-history-order-id]').forEach((row) => {
    row.addEventListener('click', () => {
      const orderId = row.dataset.historyOrderId
      if (!orderId) return

      selectedOrderHistoryId = orderId
      render()
    })
  })

  document.querySelector<HTMLButtonElement>('#history-detail-close')?.addEventListener('click', () => {
    selectedOrderHistoryId = null
    render()
  })

  document.querySelector<HTMLInputElement>('#order-history-search')?.addEventListener('input', (event) => {
    const input = event.currentTarget as HTMLInputElement
    orderHistorySearch = input.value

    if (
      selectedOrderHistoryId &&
      !getFilteredOrderHistory().some(
        (order) => String(order.id) === String(selectedOrderHistoryId)
      )
    ) {
      selectedOrderHistoryId = null
    }

    const cursorPosition = input.selectionStart ?? orderHistorySearch.length

    render()

    const newInput =
      document.querySelector<HTMLInputElement>('#order-history-search')

    if (newInput) {
      newInput.focus()
      newInput.setSelectionRange(cursorPosition, cursorPosition)
    }
  })

  document.querySelector<HTMLButtonElement>('#go-orders')?.addEventListener('click', goToOrders)
  document.querySelector<HTMLButtonElement>('#go-kitchen')?.addEventListener('click', goToKitchen)
  document.querySelector<HTMLButtonElement>('#go-admin')?.addEventListener('click', goToAdmin)
  document.querySelector<HTMLButtonElement>('#go-admin-products')?.addEventListener('click', goToAdminProducts)
  document.querySelector<HTMLButtonElement>('#go-admin-sales')?.addEventListener('click', goToAdminSales)
  document.querySelector<HTMLButtonElement>('#go-admin-administration')?.addEventListener('click', goToAdminSales)
  document.querySelector<HTMLButtonElement>('#go-admin-day-close')?.addEventListener('click', goToAdminDayClose)

  document.querySelector<HTMLButtonElement>('#go-admin-dashboard-categories')?.addEventListener('click', goToAdminCategories)

  document.querySelector<HTMLButtonElement>('#go-admin-dashboard-toppings')?.addEventListener('click', () => {
    void goToAdminToppings()
  })

  document.querySelector<HTMLButtonElement>('#go-admin-cash')?.addEventListener('click', () => {
    void goToAdminCash()
  })

  document.querySelector<HTMLButtonElement>('#go-admin-print-preview')?.addEventListener('click', () => {
    void goToPrintPreview('admin')
  })

  document.querySelector<HTMLButtonElement>('#go-admin-settings')?.addEventListener('click', () => {
    void goToPosSettings('admin')
  })

  document.querySelector<HTMLButtonElement>('#print-preview-back')?.addEventListener('click', goBackFromPrintPreview)
  document.querySelector<HTMLButtonElement>('#back-admin-from-day-close')?.addEventListener('click', goToAdmin)

  document.querySelector<HTMLButtonElement>('#refresh-admin-sales')?.addEventListener('click', () => {
    void loadAdminSalesData()
  })

  document.querySelectorAll<HTMLButtonElement>('[data-admin-sales-range]').forEach((button) => {
    button.addEventListener('click', () => {
      const range = button.dataset.adminSalesRange as
        | 'today'
        | '7d'
        | '30d'
        | 'all'
        | undefined

      if (range) {
        setAdminSalesRange(range)
      }
    })
  })

  document.querySelector<HTMLButtonElement>('#go-admin-add-product')?.addEventListener('click', goToAdminAddProduct)
  document.querySelector<HTMLButtonElement>('#go-admin-add-topping')?.addEventListener('click', goToAdminAddTopping)
  document.querySelector<HTMLButtonElement>('#go-admin-categories')?.addEventListener('click', goToAdminCategories)

  document.querySelector<HTMLButtonElement>('#back-admin-dashboard')?.addEventListener('click', goToAdmin)
  document.querySelector<HTMLButtonElement>('#back-admin-from-sales')?.addEventListener('click', goToAdmin)
  document.querySelector<HTMLButtonElement>('#back-admin-products')?.addEventListener('click', goToAdminProducts)
  document.querySelector<HTMLButtonElement>('#back-admin-products-from-topping')?.addEventListener('click', goToAdminProducts)
  document.querySelector<HTMLButtonElement>('#back-admin-products-from-categories')?.addEventListener('click', goToAdminProducts)

  document.querySelector<HTMLButtonElement>('#admin-save-category')?.addEventListener('click', saveAdminCategory)
  document.querySelector<HTMLButtonElement>('#admin-save-category-edit')?.addEventListener('click', saveAdminCategory)
  document.querySelector<HTMLButtonElement>('#admin-cancel-category')?.addEventListener('click', cancelAdminCategoryEdit)


  document.querySelectorAll<HTMLElement>('[data-admin-category-row]').forEach((row) => {
    row.addEventListener('dragstart', (event) => {
      const target = event.target as HTMLElement

      if (
        target.closest(
          'button, input, select, textarea, label, a, [data-admin-edit-category], [data-admin-view-category-products], [data-admin-toggle-category], [data-admin-delete-category]'
        )
      ) {
        event.preventDefault()
        return
      }

      const categoryId = row.dataset.adminCategoryRow

      if (!categoryId) return

      handleAdminCategoryDragStart(categoryId)
      row.classList.add('dragging')

      if (event.dataTransfer) {
        event.dataTransfer.effectAllowed = 'move'
        event.dataTransfer.setData('text/plain', categoryId)
      }
    })

    row.addEventListener('dragover', (event) => {
      event.preventDefault()

      if (event.dataTransfer) {
        event.dataTransfer.dropEffect = 'move'
      }

      row.classList.add('drag-over')
    })

    row.addEventListener('dragleave', () => {
      row.classList.remove('drag-over')
    })

    row.addEventListener('drop', async (event) => {
      event.preventDefault()
      row.classList.remove('drag-over')

      const targetCategoryId = row.dataset.adminCategoryRow

      if (!targetCategoryId) return

      await handleAdminCategoryDrop(targetCategoryId)
    })

    row.addEventListener('dragend', () => {
      row.classList.remove('dragging')

      document
        .querySelectorAll<HTMLElement>('[data-admin-category-row]')
        .forEach((item) => {
          item.classList.remove('drag-over')
        })

      handleAdminCategoryDragEnd()
    })
  })

  document.querySelectorAll<HTMLElement>('[data-admin-view-category-products]').forEach((button) => {
    button.addEventListener('click', (event) => {
      event.stopPropagation()

      const categoryId = button.dataset.adminViewCategoryProducts

      if (!categoryId) {
        return
      }

      openAdminCategoryProducts(categoryId)
    })
  })

  document.querySelector<HTMLButtonElement>('#admin-close-category-products')?.addEventListener(
    'click',
    closeAdminCategoryProducts
  )

  document.querySelector<HTMLButtonElement>('#admin-close-category-products-footer')?.addEventListener(
    'click',
    closeAdminCategoryProducts
  )

  document.querySelector<HTMLDivElement>('#admin-category-products-overlay')?.addEventListener(
    'click',
    (event) => {
      if (event.target === event.currentTarget) {
        closeAdminCategoryProducts()
      }
    }
  )

  document.querySelectorAll<HTMLElement>('[data-admin-edit-category]').forEach((button) => {
    button.addEventListener('click', (event) => {
      event.stopPropagation()

      const categoryId = button.dataset.adminEditCategory
      if (categoryId) editAdminCategory(categoryId)
    })
  })


  // Fallback voor category edit clicks binnen draggable rows.
  document.querySelector<HTMLElement>('.admin-category-layout')?.addEventListener('click', (event) => {
    const target = event.target as HTMLElement
    const editButton = target.closest<HTMLElement>('[data-admin-edit-category]')

    if (!editButton) return

    event.preventDefault()
    event.stopPropagation()

    const categoryId = editButton.dataset.adminEditCategory

    if (categoryId) {
      editAdminCategory(categoryId)
    }
  })

  document.querySelectorAll<HTMLElement>('[data-admin-delete-category]').forEach((button) => {
    button.addEventListener('click', async (event) => {
      event.preventDefault()
      event.stopPropagation()

      const categoryId = button.dataset.adminDeleteCategory

      if (!categoryId) return

      await deleteAdminCategory(categoryId)
    })
  })

  document.querySelectorAll<HTMLElement>('[data-admin-toggle-category]').forEach((button) => {
    button.addEventListener('click', async (event) => {
      event.stopPropagation()

      const categoryId = button.dataset.adminToggleCategory
      const nextActive = button.dataset.adminNextCategoryActive === 'true'

      if (!categoryId) return

      await toggleAdminCategory(categoryId, nextActive)
    })
  })

  document.querySelector<HTMLButtonElement>('#admin-close-product-modal')?.addEventListener('click', cancelAdminProductEdit)
  document.querySelector<HTMLButtonElement>('#admin-cancel-product-modal')?.addEventListener('click', cancelAdminProductEdit)

  document.querySelector<HTMLDivElement>('#admin-product-modal-overlay')?.addEventListener('click', (event) => {
    if (event.target === event.currentTarget) {
      cancelAdminProductEdit()
    }
  })

  document.querySelector<HTMLButtonElement>('#admin-close-topping-modal')?.addEventListener('click', cancelAdminToppingEdit)
  document.querySelector<HTMLButtonElement>('#admin-cancel-topping-modal')?.addEventListener('click', cancelAdminToppingEdit)

  document.querySelector<HTMLDivElement>('#admin-topping-modal-overlay')?.addEventListener('click', (event) => {
    if (event.target === event.currentTarget) {
      cancelAdminToppingEdit()
    }
  })

  document.querySelector<HTMLButtonElement>('#admin-close-category-modal')?.addEventListener('click', cancelAdminCategoryEdit)
  document.querySelector<HTMLButtonElement>('#admin-cancel-category-modal')?.addEventListener('click', cancelAdminCategoryEdit)

  document.querySelector<HTMLDivElement>('#admin-category-modal-overlay')?.addEventListener('click', (event) => {
    if (event.target === event.currentTarget) {
      cancelAdminCategoryEdit()
    }
  })

  const adminProductDiscountType = document.querySelector<HTMLSelectElement>('#admin-product-discount-type')
  const adminProductDiscountValue = document.querySelector<HTMLInputElement>('#admin-product-discount-value')
  const adminProductPrice = document.querySelector<HTMLInputElement>('#admin-product-price')

  setupTeaTypeCustomInputs()
  setupAdminProductTypeControls()

  adminProductDiscountType?.addEventListener('change', updateProductDiscountPreview)
  adminProductDiscountValue?.addEventListener('input', updateProductDiscountPreview)
  adminProductPrice?.addEventListener('input', updateProductDiscountPreview)

  const adminCategoryAddDiscountType =
    document.querySelector<HTMLSelectElement>('#admin-category-discount-type')

  const adminCategoryAddDiscountValue =
    document.querySelector<HTMLInputElement>('#admin-category-discount-value')

  const adminCategoryEditDiscountType =
    document.querySelector<HTMLSelectElement>('#admin-category-edit-discount-type')

  const adminCategoryEditDiscountValue =
    document.querySelector<HTMLInputElement>('#admin-category-edit-discount-value')

  // Add-form en edit-modal kunnen tegelijk in de DOM staan.
  // Daarom krijgen beide hun eigen listener.
  adminCategoryAddDiscountType?.addEventListener('change', updateCategoryDiscountPreview)
  adminCategoryAddDiscountValue?.addEventListener('input', updateCategoryDiscountPreview)

  adminCategoryEditDiscountType?.addEventListener('change', updateCategoryDiscountPreview)
  adminCategoryEditDiscountValue?.addEventListener('input', updateCategoryDiscountPreview)

  updateProductDiscountPreview()
  updateCategoryDiscountPreview()

  document.querySelector<HTMLButtonElement>('#admin-refresh-stats')?.addEventListener('click', loadAllAdminData)

  document.querySelector<HTMLInputElement>('#admin-cash-registration-enabled')?.addEventListener('change', async (event) => {
    const enabled = (event.currentTarget as HTMLInputElement).checked
    await saveCashRegistrationSetting(enabled)
  })

  document.querySelector<HTMLButtonElement>('#admin-open-cash-session')?.addEventListener('click', async () => {
    await openCashSession()
  })

  document.querySelector<HTMLButtonElement>('#admin-cash-in')?.addEventListener('click', async () => {
    await addManualCashMovement('cash_in')
  })

  document.querySelector<HTMLButtonElement>('#admin-cash-out')?.addEventListener('click', async () => {
    await addManualCashMovement('cash_out')
  })

  document.querySelector<HTMLButtonElement>('#admin-close-cash-session')?.addEventListener('click', async () => {
    await closeCashSession()
  })

  document.querySelector<HTMLButtonElement>('#admin-create-daily-closing')?.addEventListener('click', async () => {
    await createDailyClosing()
  })

  document.querySelector<HTMLButtonElement>('#admin-export-daily-closing-csv')?.addEventListener('click', () => {
    downloadDailyClosingCsv()
  })

  document.querySelector<HTMLInputElement>('#admin-daily-closing-date-filter')?.addEventListener('change', (event) => {
    adminDailyClosingDateFilter = (event.currentTarget as HTMLInputElement).value
    closeAdminDailyClosingHistoryItem()
  })

  document.querySelector<HTMLButtonElement>('#admin-clear-daily-closing-date-filter')?.addEventListener('click', () => {
    clearAdminDailyClosingDateFilter()
  })

  document.querySelectorAll<HTMLButtonElement>('[data-admin-view-daily-closing]').forEach((button) => {
    button.addEventListener('click', async () => {
      const closingId = button.dataset.adminViewDailyClosing
      if (!closingId) return
      await openAdminDailyClosingHistoryItem(closingId)
    })
  })

  document.querySelectorAll<HTMLButtonElement>('[data-admin-export-history-closing]').forEach((button) => {
    button.addEventListener('click', async () => {
      const closingId = button.dataset.adminExportHistoryClosing
      if (!closingId) return
      await downloadHistoricalDailyClosingCsv(closingId)
    })
  })

  document.querySelector<HTMLButtonElement>('#admin-close-daily-closing-history-detail')?.addEventListener('click', () => {
    closeAdminDailyClosingHistoryItem()
  })

  document.querySelectorAll<HTMLButtonElement>('[data-admin-refund-payment]').forEach((button) => {
    button.addEventListener('click', async () => {
      const paymentId = button.dataset.adminRefundPayment

      if (!paymentId) return

      await refundAdminPayment(paymentId)
    })
  })

  document.querySelectorAll<HTMLButtonElement>('[data-action="toggle-all-product-toppings"]').forEach((button) => {
    button.addEventListener('click', () => {
      toggleAllAdminProductToppings(button)
    })
  })

  document.querySelector<HTMLInputElement>('#admin-product-search')?.addEventListener('input', (event) => {
    const input = event.currentTarget as HTMLInputElement
    adminProductSearch = input.value

    const cursorPosition = input.selectionStart ?? adminProductSearch.length

    render()

    const newInput = document.querySelector<HTMLInputElement>('#admin-product-search')
    if (newInput) {
      newInput.focus()
      newInput.setSelectionRange(cursorPosition, cursorPosition)
    }
  })

  bindAdminProductImagePreview()
  bindAdminProductSizeControls()
  bindAdminProductCustomizationToggles()

  document.querySelector<HTMLButtonElement>('#admin-save-product')?.addEventListener('click', saveAdminProduct)
  document.querySelector<HTMLButtonElement>('#admin-cancel-product')?.addEventListener('click', cancelAdminProductEdit)
  document.querySelector<HTMLButtonElement>('#admin-save-topping')?.addEventListener('click', saveAdminTopping)
  document.querySelector<HTMLButtonElement>('#admin-cancel-topping')?.addEventListener('click', cancelAdminToppingEdit)

  document.querySelectorAll<HTMLElement>('[data-admin-delete-product]').forEach((button) => {
    button.addEventListener('click', async (event) => {
      event.preventDefault()
      event.stopPropagation()

      const productId = button.dataset.adminDeleteProduct
      if (!productId) return

      await deleteAdminProduct(productId)
    })
  })

  document.querySelectorAll<HTMLElement>('[data-admin-edit-product]').forEach((button) => {
    button.addEventListener('click', () => {
      const productId = button.dataset.adminEditProduct
      if (productId) editAdminProduct(productId)
    })
  })

  document.querySelectorAll<HTMLElement>('[data-admin-toggle-product]').forEach((button) => {
    button.addEventListener('click', async () => {
      const productId = button.dataset.adminToggleProduct
      const nextActive = button.dataset.adminNextActive === 'true'

      if (!productId) return

      await toggleAdminProduct(productId, nextActive)
    })
  })

  document.querySelectorAll<HTMLElement>('[data-admin-edit-topping]').forEach((button) => {
    button.addEventListener('click', () => {
      const toppingId = button.dataset.adminEditTopping
      if (toppingId) editAdminTopping(toppingId)
    })
  })

  document.querySelectorAll<HTMLElement>('[data-admin-toggle-topping]').forEach((button) => {
    button.addEventListener('click', async () => {
      const toppingId = button.dataset.adminToggleTopping
      const nextActive = button.dataset.adminNextActive === 'true'

      if (!toppingId) return

      await toggleAdminTopping(toppingId, nextActive)
    })
  })

  document.querySelector<HTMLButtonElement>('#refresh-orders')?.addEventListener('click', loadOrders)
  document.querySelector<HTMLButtonElement>('#refresh-kitchen')?.addEventListener('click', () => loadKitchenLabels())

  document.querySelector<HTMLButtonElement>('#new-customer-order-btn')?.addEventListener('click', startNewCustomerOrder)


  document.querySelector<HTMLButtonElement>('#customer-customizer-close')?.addEventListener('click', closeCustomerCustomizer)
  document.querySelector<HTMLDivElement>('#customer-customizer-overlay')?.addEventListener('click', closeCustomerCustomizer)
  document.querySelector<HTMLButtonElement>('#customer-customizer-add')?.addEventListener('click', confirmCustomerCustomizer)

  document.querySelectorAll<HTMLElement>('[data-cup-size]').forEach((button) => {
    button.addEventListener('click', () => {
      const size = button.dataset.cupSize as CupSize | undefined

      if (size === 'medium' || size === 'large') {
        setCustomizerCupSize(size)
      }
    })
  })

  document.querySelectorAll<HTMLElement>('[data-ice-level]').forEach((button) => {
    button.addEventListener('click', () => {
      const level = button.dataset.iceLevel as IceLevel | undefined
      if (level) setCustomizerIceLevel(level)
    })
  })

  document.querySelectorAll<HTMLElement>('[data-sugar-level]').forEach((button) => {
    button.addEventListener('click', () => {
      const level = button.dataset.sugarLevel as SugarLevel | undefined
      if (level) setCustomizerSugarLevel(level)
    })
  })

  document.querySelectorAll<HTMLElement>('[data-topping-id]').forEach((button) => {
    button.addEventListener('click', () => {
      const toppingId = button.dataset.toppingId
      if (toppingId) toggleCustomizerTopping(toppingId)
    })
  })

  document.querySelector<HTMLButtonElement>('#customer-cart-button')?.addEventListener('click', openCustomerCart)
  document.querySelector<HTMLButtonElement>('#customer-cart-close')?.addEventListener('click', closeCustomerCart)
  document.querySelector<HTMLDivElement>('#customer-cart-overlay')?.addEventListener('click', closeCustomerCart)

  document.querySelector<HTMLButtonElement>('#customer-checkout-btn')?.addEventListener('click', openCustomerCheckout)
  document.querySelector<HTMLButtonElement>('#customer-checkout-back')?.addEventListener('click', backToCustomerCartFromCheckout)
  document.querySelector<HTMLButtonElement>('#customer-checkout-close')?.addEventListener('click', closeCustomerCheckout)

  document.querySelector<HTMLInputElement>('#customer-name-input')?.addEventListener('input', (event) => {
    const input = event.target as HTMLInputElement
    customerName = input.value
    saveCustomerState()
  })

  document.querySelector<HTMLInputElement>('#customer-phone-input')?.addEventListener('input', (event) => {
    const input = event.target as HTMLInputElement
    customerPhone = input.value
    saveCustomerState()
  })

  document.querySelectorAll<HTMLElement>('[data-payment-method]').forEach((button) => {
    button.addEventListener('click', () => {
      const method = button.dataset.paymentMethod as PaymentMethod | undefined

      if (!method) return

      setCustomerPaymentMethod(method)
    })
  })

  document.querySelectorAll<HTMLElement>('[data-order-filter]').forEach((button) => {
    button.addEventListener('click', () => {
      const nextFilter = button.dataset.orderFilter as OrderFilter | undefined

      if (!nextFilter) return

      orderFilter = nextFilter
      render()
    })
  })

  document.querySelectorAll<HTMLElement>('[data-add]').forEach((button) => {
    button.addEventListener('click', () => {
      const id = button.dataset.add
      if (id) addToCart(id)
    })
  })

  document.querySelectorAll<HTMLElement>('[data-minus]').forEach((button) => {
    button.addEventListener('click', () => {
      const id = button.dataset.minus
      if (id) decreaseQty(id)
    })
  })

  document.querySelectorAll<HTMLElement>('[data-plus]').forEach((button) => {
    button.addEventListener('click', () => {
      const id = button.dataset.plus
      if (id) increaseQty(id)
    })
  })

  document.querySelectorAll<HTMLElement>('[data-edit-cart-item]').forEach((button) => {
    button.addEventListener('click', () => {
      const id = button.dataset.editCartItem
      if (id) editCustomerCartItem(id)
    })
  })

  document.querySelectorAll<HTMLElement>('[data-remove]').forEach((button) => {
    button.addEventListener('click', () => {
      const id = button.dataset.remove
      if (id) removeFromCart(id)
    })
  })

  document.querySelectorAll<HTMLElement>('[data-status-order]').forEach((button) => {
    button.addEventListener('click', async () => {
      const orderId = button.dataset.statusOrder
      const nextStatus = button.dataset.nextStatus as OrderStatus | undefined

      if (!orderId || !nextStatus) return

      await updateOrderStatus(orderId, nextStatus)
    })
  })

  document.querySelectorAll<HTMLElement>('[data-label-status]').forEach((button) => {
    button.addEventListener('click', async () => {
      const labelId = button.dataset.labelStatus
      const nextStatus = button.dataset.nextLabelStatus as LabelStatus | undefined

      if (!labelId || !nextStatus) return

      await updateKitchenLabelStatus(labelId, nextStatus)
    })
  })

  document.querySelectorAll<HTMLElement>('[data-whole-order]').forEach((button) => {
    button.addEventListener('click', async () => {
      const orderId = button.dataset.wholeOrder
      const nextLabelStatus = button.dataset.nextWholeLabelStatus as LabelStatus | undefined

      if (!orderId || !nextLabelStatus) return

      await updateWholeKitchenOrder(orderId, nextLabelStatus)
    })
  })

  const checkoutCashBtn = document.querySelector<HTMLButtonElement>('#checkout-cash-btn')
  checkoutCashBtn?.addEventListener('click', () => submitOrder('cash'))

  const checkoutCardBtn = document.querySelector<HTMLButtonElement>('#checkout-card-btn')
  checkoutCardBtn?.addEventListener('click', () => submitOrder('card'))

  const customerPayBtn = document.querySelector<HTMLButtonElement>('#customer-pay-btn')
  customerPayBtn?.addEventListener('click', submitCustomerOrder)

  bindCustomerCategoryScrollSpy()
  bindCustomerCategoryClicks()
}


// =============================
// BROWSER BACK / FORWARD
// =============================

window.addEventListener('popstate', async () => {
  const currentParams = new URLSearchParams(window.location.search)
  const nextScreen = getScreenFromMode(currentParams.get('mode'))

  stopAutoRefresh()
  stopCustomerProgressRefresh()
  removeCustomerScrollListeners()

  screen = nextScreen
  message = ''

  if (screen === 'print-preview') {
    await loadProducts()
    await loadPrintPreviewData()
    return
  }

  if (screen === 'payment-test') {
    await loadPaymentTestData()
    return
  }

  if (screen === 'pickup') {
    await Promise.all([
      loadOrders(),
      loadPickupWaitSettings(),
    ])
    startPickupRealtime()
    return
  }

  if (screen === 'pos-settings') {
    await loadPickupWaitSettings()
    render()
    return
  }

  if (screen === 'order-history') {
    await loadOrderHistory()
    return
  }

  if (screen === 'orders') {
    await loadOrders()
    startOrdersRealtime()
    return
  }

  if (screen === 'kitchen') {
    await loadKitchenLabels()
    startKitchenRealtime()
    return
  }

  if (screen === 'admin-sales') {
    await loadAdminSalesData()
    return
  }

  if (screen === 'admin' || screen === 'admin-products' || screen === 'admin-day-close' || screen === 'admin-add-product' || screen === 'admin-add-topping') {
    await loadAllAdminData()
    return
  }

  if (screen === 'customer' && customerOrderPlaced && customerOrderId) {
    await loadCustomerOrderProgress(false)
    startCustomerProgressRefresh()
  }

  render()
})

// =============================
// START APP
// =============================

getCustomerSessionId()

async function startApp() {
  // Alleen op de shop-computer starten.
  // Customer/payment-test pagina's kunnen op telefoons draaien en mogen niet
  // proberen te verbinden met de lokale printer bridge van de winkel.
  if (screen !== 'customer' && screen !== 'payment-test') {
    void startAutomaticPrintWorker()
  }

  if (screen === 'print-preview') {
    await loadProducts()
    await loadPrintPreviewData()
    return
  }

  if (screen === 'payment-test') {
    await loadPaymentTestData()
    return
  }

  await Promise.all([
    loadProducts(),
    loadToppings(),
    loadProductToppingLinks(),
    loadCategories(),
    loadBestSellerSales(),
    loadPickupWaitSettings(),
  ])

  if (screen === 'pickup') {
    await Promise.all([
      loadOrders(),
      loadPickupWaitSettings(),
    ])
    startPickupRealtime()
    return
  }

  if (screen === 'order-history') {
    await loadOrderHistory()
    return
  }

  if (screen === 'orders') {
    await loadOrders()
    startOrdersRealtime()
    return
  }

  if (screen === 'kitchen') {
    await loadKitchenLabels()
    startKitchenRealtime()
    return
  }

  if (screen === 'admin-sales') {
    await loadAdminSalesData()
    return
  }

  if (screen === 'admin' || screen === 'admin-products' || screen === 'admin-day-close' || screen === 'admin-add-product' || screen === 'admin-add-topping') {
    await loadAllAdminData()
    return
  }

  render()
}

startApp()