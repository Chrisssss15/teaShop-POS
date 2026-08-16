// =============================
// IMPORTS
// =============================

import './style.css'
import { supabase } from './lib/supabase'

// =============================
// TYPES
// =============================

type Screen = 'pos' | 'orders' | 'kitchen' | 'customer' | 'admin' | 'admin-products' | 'admin-sales' | 'admin-add-product' | 'admin-add-topping' | 'admin-categories'

type DiscountType = 'none' | 'percentage' | 'fixed'

type Product = {
  id: string
  name: string
  category: string
  base_price: number
  is_active: boolean
  is_bestseller: boolean
  is_sold_out: boolean
  discount_type: DiscountType
  discount_value: number
}

type Topping = {
  id: string
  name: string
  price: number
  is_active: boolean
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

type IceLevel = 'no_ice' | 'less_ice' | 'normal_ice' | 'extra_ice'
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
  iceLevel: IceLevel
  sugarLevel: SugarLevel
  toppings: SelectedTopping[]
}

type SavedCartItem = {
  cartItemId: string
  productId: string
  quantity: number
  iceLevel: IceLevel
  sugarLevel: SugarLevel
  toppings: SelectedTopping[]
}

type OrderStatus = 'new' | 'preparing' | 'ready' | 'completed' | 'cancelled'
type LabelStatus = 'new' | 'preparing' | 'done' | 'cancelled'
type OrderFilter = 'all' | 'active' | 'preparation' | 'completed'
type PaymentStatus = 'unpaid' | 'paid' | 'refunded'
type PaymentMethod = 'cash' | 'card' | 'online_fake' | 'pay_at_counter'
type CustomerLanguage = 'nl' | 'en' | 'cn'

type Order = {
  id: string
  order_number?: string | null
  status: OrderStatus
  subtotal?: number | null
  total?: number | null
  total_amount?: number | null
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
}

type OrderItem = {
  id?: string
  order_id: string
  product_id?: string | null
  product_name?: string | null
  product_name_snapshot?: string | null
  unit_price?: number | null
  quantity: number
  line_total?: number | null
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
  ice_level?: IceLevel | null
  sugar_level?: SugarLevel | null
  toppings?: SelectedTopping[] | null
  notes?: string | null
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
  'extra_ice',
]

const SUGAR_LEVELS: SugarLevel[] = [
  'none',
  'minimal',
  'less',
  'normal',
  'sweet',
]

const translations = {
  nl: {
    languageName: 'Nederlands',
    orderTitle: 'Blue Cup Bestellen',
    orderSubtitle: 'Scan & bestel',
    chooseDrinks: 'Kies je drankjes',
    customizeDrink: 'Maak je drankje persoonlijk',
    required: 'Verplicht',
    multiplePossible: 'Meerdere mogelijk',
    iceLevel: 'Ice level',
    sugarLevel: 'Sugar level',
    toppings: 'Toppings',
    noToppings: 'Geen toppings beschikbaar.',
    total: 'Totaal',
    chooseIceSugar: 'Kies ice & sugar',
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
    iceLevel: 'Ice level',
    sugarLevel: 'Sugar level',
    toppings: 'Toppings',
    noToppings: 'No toppings available.',
    total: 'Total',
    chooseIceSugar: 'Choose ice & sugar',
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
    iceLevel: '冰量',
    sugarLevel: '甜度',
    toppings: '加料',
    noToppings: '暂无可选加料。',
    total: '总计',
    chooseIceSugar: '请选择冰量和甜度',
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
    extra_ice: 'Extra ijs',
  },
  en: {
    no_ice: 'No ice',
    less_ice: 'Less ice',
    normal_ice: 'Normal ice',
    extra_ice: 'Extra ice',
  },
  cn: {
    no_ice: '去冰',
    less_ice: '少冰',
    normal_ice: '正常冰',
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
  if (modeValue === 'orders') return 'orders'
  if (modeValue === 'kitchen') return 'kitchen'
  if (modeValue === 'customer') return 'customer'
  if (modeValue === 'admin') return 'admin'
  if (modeValue === 'admin-products') return 'admin-products'
  if (modeValue === 'admin-sales') return 'admin-sales'
  if (modeValue === 'admin-add-product') return 'admin-add-product'
  if (modeValue === 'admin-add-topping') return 'admin-add-topping'
  if (modeValue === 'admin-categories') return 'admin-categories'

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

let isSubmitting = false
let isLoadingOrders = false
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

let bestSellerSales: Record<string, number> = {}

// Product customizer
let isCustomerCustomizerOpen = false
let customizerProduct: Product | null = null
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

let ordersRealtimeReloadTimer: number | null = null
let kitchenRealtimeReloadTimer: number | null = null
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

  products = (data ?? []) as Product[]

  if (screen === 'customer') {
    loadCustomerStateAfterProducts()

    if (customerOrderPlaced && customerOrderId) {
      await loadCustomerOrderProgress(false)
      startCustomerProgressRefresh()
    }
  }

  render()
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


// =============================
// CART LOGIC: SHARED BY CUSTOMER AND STAFF
// =============================

function makeCartItemId() {
  if (crypto.randomUUID) {
    return crypto.randomUUID()
  }

  return `cart-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

function createDefaultCartItem(product: Product): CartItem {
  return {
    cartItemId: makeCartItemId(),
    product,
    quantity: 1,
    iceLevel: 'normal_ice',
    sugarLevel: 'normal',
    toppings: [],
  }
}

function addToCart(productId: string) {
  const product = products.find((p) => String(p.id) === String(productId))
  if (!product) return

  if (screen === 'customer' || screen === 'pos') {
    openCustomerCustomizer(product)
    return
  }

  const existing = cart.find((item) => {
    return (
      String(item.product.id) === String(productId) &&
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
  return getDiscountedProductPrice(item.product) + getToppingsTotal(item)
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

function getTotal() {
  return cart.reduce((sum, item) => sum + getCartItemLineTotal(item), 0)
}

const DISCOUNT_CATEGORY_KEY = '__discount__'
const DISCOUNT_CATEGORY_LABEL = 'Discount'

const BESTSELLER_CATEGORY_KEY = '__bestseller__'
const BESTSELLER_CATEGORY_LABEL = 'Best Seller'
const BESTSELLER_LIMIT = 5

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

function getCategoryDisplayName(categoryKey: string) {
  if (categoryKey === DISCOUNT_CATEGORY_KEY) {
    return DISCOUNT_CATEGORY_LABEL
  }

  if (categoryKey === BESTSELLER_CATEGORY_KEY) {
    return BESTSELLER_CATEGORY_LABEL
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
  customizerIceLevel = null
  customizerSugarLevel = null
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
  customizerIceLevel = item.iceLevel
  customizerSugarLevel = item.sugarLevel
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
  customizerIceLevel = null
  customizerSugarLevel = null
  customizerToppingIds = []
  editingCartItemId = null

  if (wasEditing && screen === 'customer') {
    isCustomerCartOpen = true
  }

  render()
}

function setCustomizerIceLevel(level: IceLevel) {
  customizerIceLevel = level
  render()
}

function setCustomizerSugarLevel(level: SugarLevel) {
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

  return getDiscountedProductPrice(customizerProduct) + toppingsTotal
}

function confirmCustomerCustomizer() {
  if (!customizerProduct) return

  if (!customizerIceLevel || !customizerSugarLevel) {
    return
  }

  const selectedToppings = getCustomizerSelectedToppings()
  const wasEditing = editingCartItemId !== null

  if (editingCartItemId) {
    const item = cart.find((cartItem) => cartItem.cartItemId === editingCartItemId)

    if (item) {
      item.product = customizerProduct
      item.iceLevel = customizerIceLevel
      item.sugarLevel = customizerSugarLevel
      item.toppings = selectedToppings
    }
  } else {
    const item: CartItem = {
      cartItemId: makeCartItemId(),
      product: customizerProduct,
      quantity: 1,
      iceLevel: customizerIceLevel,
      sugarLevel: customizerSugarLevel,
      toppings: selectedToppings,
    }

    cart.push(item)
  }

  isCustomerCustomizerOpen = false
  customizerProduct = null
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
  selectedToppings?: SelectedTopping[] | null
) {
  const toppingText = (selectedToppings ?? []).map((topping) => topping.name).join(', ')

  return `
    <div class="modifier-summary">
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

  isSubmitting = true
  message = ''
  render()

  const total = getTotal()
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

  const orderItemsPayload = cart.map((item) => ({
    order_id: orderData.id,
    product_id: item.product.id,
    product_name: item.product.name,
    product_name_snapshot: item.product.name,
    unit_price: getCartItemUnitPrice(item),
    quantity: item.quantity,
    line_total: getCartItemLineTotal(item),
    ice_level: item.iceLevel,
    sugar_level: item.sugarLevel,
    toppings: item.toppings,
  }))

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

  const total = getTotal()
  const orderNumber = makeOrderNumber()
  const pickupCode = makePickupCode()
  const now = new Date().toISOString()
  const customerSessionId = getCustomerSessionId()

  const paymentStatus: PaymentStatus =
    customerPaymentMethod === 'online_fake' ? 'paid' : 'unpaid'

  const paidAt = customerPaymentMethod === 'online_fake' ? now : null

  const { data: orderData, error: orderError } = await supabase
    .from('orders')
    .insert({
      order_number: orderNumber,
      status: 'new',
      order_type: 'customer',
      channel: 'qr',
      subtotal: total,
      total: total,
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

  const orderItemsPayload = cart.map((item) => ({
    order_id: orderData.id,
    product_id: item.product.id,
    product_name: item.product.name,
    product_name_snapshot: item.product.name,
    unit_price: getCartItemUnitPrice(item),
    quantity: item.quantity,
    line_total: getCartItemLineTotal(item),
    ice_level: item.iceLevel,
    sugar_level: item.sugarLevel,
    toppings: item.toppings,
  }))

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

  cart = []
  customerOrderId = orderData.id
  customerPickupCode = pickupCode
  customerOrderStatus = 'new'
  customerOrderPlaced = true
  isCustomerCartOpen = false
  isCustomerCheckoutOpen = false
  isSubmitting = false

  saveCustomerState()
  await loadCustomerOrderProgress(false)
  startCustomerProgressRefresh()
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
        ice_level: item.ice_level || null,
        sugar_level: item.sugar_level || null,
        toppings: item.toppings || [],
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

async function updateOrderStatus(orderId: string, nextStatus: OrderStatus) {
  const updateData: Record<string, string> = {
    status: nextStatus,
    updated_at: new Date().toISOString(),
  }

  if (nextStatus === 'completed') {
    updateData.completed_at = new Date().toISOString()
  }

  if (nextStatus === 'cancelled') {
    updateData.cancelled_at = new Date().toISOString()
  }

  const { error } = await supabase
    .from('orders')
    .update(updateData)
    .eq('id', orderId)

  if (error) {
    message = `Status aanpassen mislukt: ${error.message}`
    render()
    return
  }

  message = `Order status aangepast naar ${nextStatus}`

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
  stopAutoRefresh()
  stopCustomerProgressRefresh()
  removeCustomerScrollListeners()

  screen = 'pos'
  message = ''
  updateModeInUrl('pos')
  render()
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
  adminEditingCategoryId = null
  message = ''
  adminMessage = ''
  adminError = ''
  updateModeInUrl('admin-categories')

  await loadAllAdminData()
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

  if (order.payment_status === 'refunded') {
    return 'Refunded'
  }

  return 'Unpaid'
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

async function saveAdminProduct() {
  const nameInput = document.querySelector<HTMLInputElement>('#admin-product-name')
  const categoryInput = document.querySelector<HTMLSelectElement>('#admin-product-category')
  const priceInput = document.querySelector<HTMLInputElement>('#admin-product-price')
  const discountTypeInput = document.querySelector<HTMLSelectElement>('#admin-product-discount-type')
  const discountValueInput = document.querySelector<HTMLInputElement>('#admin-product-discount-value')
  const bestSellerInput = document.querySelector<HTMLInputElement>('#admin-product-bestseller')
  const soldOutInput = document.querySelector<HTMLInputElement>('#admin-product-sold-out')
  const activeInput = document.querySelector<HTMLInputElement>('#admin-product-active')
  const selectedToppingIds = getSelectedAdminToppingIds()

  const name = nameInput?.value.trim() || ''
  const category = categoryInput?.value.trim() || ''
  const basePrice = Number(priceInput?.value || 0)
  const discountType = normalizeDiscountType(discountTypeInput?.value)
  const discountValue =
    discountType === 'none'
      ? 0
      : Math.max(0, Number(discountValueInput?.value || 0))
  const isBestSeller = bestSellerInput?.checked ?? false
  const isSoldOut = soldOutInput?.checked ?? false
  const isActive = activeInput?.checked ?? true

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

  try {
    if (adminEditingProductId) {
      const productId = adminEditingProductId

      const { error } = await supabase
        .from('products')
        .update({
          name,
          category,
          base_price: basePrice,
          discount_type: discountType,
          discount_value: discountValue,
          is_bestseller: isBestSeller,
          is_sold_out: isSoldOut,
          is_active: isActive,
        })
        .eq('id', productId)

      if (error) {
        adminError = `Product aanpassen mislukt: ${error.message}`
        render()
        return
      }

      await saveProductToppingLinks(productId, selectedToppingIds)
      adminMessage = 'Product en toppings aangepast.'
    } else {
      const { data, error } = await supabase
        .from('products')
        .insert({
          name,
          category,
          base_price: basePrice,
          discount_type: discountType,
          discount_value: discountValue,
          is_bestseller: isBestSeller,
          is_sold_out: isSoldOut,
          is_active: isActive,
        })
        .select('id')
        .single()

      if (error) {
        adminError = `Product toevoegen mislukt: ${error.message}`
        render()
        return
      }

      const productId = String(data.id)
      await saveProductToppingLinks(productId, selectedToppingIds)
      adminMessage = 'Product en toppings toegevoegd.'
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

  if (screen === 'admin-add-topping' || screen === 'admin-categories') {
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

  const activeInput = document.querySelector<HTMLInputElement>(
    adminEditingCategoryId
      ? '#admin-category-edit-active'
      : '#admin-category-active'
  )

  const name = nameInput?.value.trim() || ''
  const discountType = normalizeDiscountType(discountTypeInput?.value)
  const discountValue =
    discountType === 'none'
      ? 0
      : Math.max(0, Number(discountValueInput?.value || 0))
  const isActive = activeInput?.checked ?? true

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
  adminEditingCategoryId = categoryId
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
// ADMIN: LOAD ALL DATA
// Admin must also see inactive products/toppings.
// =============================

async function loadAllAdminData() {
  const { startIso, endIso } = getTodayDateRange()

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
  render()
}

// =============================
// RENDER: SHARED UI
// =============================

function renderNav() {
  return `
    <nav class="top-nav">
      <button class="nav-btn ${screen === 'pos' ? 'active' : ''}" id="go-pos">
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
                    class="product-card ${hasProductDiscount(product) ? 'has-discount' : ''} ${product.is_sold_out ? 'sold-out' : ''}"
                    data-add="${product.id}"
                    ${product.is_sold_out ? 'disabled aria-disabled="true"' : ''}
                  >
                    <span class="product-name">${escapeHtml(product.name)}</span>

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
                        ${renderModifierSummary(item.iceLevel, item.sugarLevel, item.toppings)}
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
                    € ${Number(customizerProduct.base_price).toFixed(2)}
                  </span>
                  <strong>€ ${getDiscountedProductPrice(customizerProduct).toFixed(2)}</strong>
                  <span class="discount-mini-badge">
                    ${escapeHtml(getProductDiscountLabel(customizerProduct))}
                  </span>
                </div>
              `
              : `
                <strong>€ ${Number(customizerProduct.base_price).toFixed(2)}</strong>
              `
          }
        </div>

        <button class="customer-customizer-close" id="customer-customizer-close">×</button>
      </div>

      <div class="customer-customizer-content">
        <section class="customer-customizer-section">
          <div class="customer-customizer-section-title">
            <h3>${escapeHtml(t('iceLevel'))} *</h3>
            <span>${escapeHtml(t('required'))}</span>
          </div>

          <div class="customer-modifier-options">
            ${ICE_LEVELS.map(
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

        <section class="customer-customizer-section">
          <div class="customer-customizer-section-title">
            <h3>${escapeHtml(t('sugarLevel'))} *</h3>
            <span>${escapeHtml(t('required'))}</span>
          </div>

          <div class="customer-modifier-options sugar-options">
            ${SUGAR_LEVELS.map(
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
          ${!customizerIceLevel || !customizerSugarLevel ? 'disabled' : ''}
        >
          ${
            !customizerIceLevel || !customizerSugarLevel
              ? escapeHtml(t('chooseIceSugar'))
              : escapeHtml(editingCartItemId ? t('saveChanges') : t('addToOrder'))
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
                        ${renderModifierSummary(item.iceLevel, item.sugarLevel, item.toppings)}
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
                            ${renderModifierSummary(item.iceLevel, item.sugarLevel, item.toppings)}
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
                            ${renderModifierSummary(label.ice_level, label.sugar_level, label.toppings)}
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
    <div class="page customer-page customer-success-page">
      <header class="header customer-header">
        <div class="customer-brand">
          <img class="tea-shop-logo" src="/logo.jpg" alt="Tea Shop logo" />

          <div>
            <h1>${escapeHtml(t('orderTitle'))}</h1>
            <p class="sub">${escapeHtml(t('orderSubtitle'))}</p>
          </div>
        </div>

        ${renderCustomerLanguageSwitcher()}
      </header>

      ${renderCustomerCartButton()}
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

        <label>
          <span>Prijs (€)</span>
          <input
            id="admin-product-price"
            class="admin-input"
            type="number"
            min="0"
            step="0.01"
            value="${editingProduct ? Number(editingProduct.base_price).toFixed(2) : ''}"
            placeholder="4.50"
          />
        </label>

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
                      <div class="admin-list-main">
                        <strong>${escapeHtml(product.name)}</strong>
                        <span>${escapeHtml(product.category)}</span>
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

                        <span class="admin-state ${product.is_active ? 'active' : 'inactive'}">
                          ${product.is_active ? 'Actief' : 'Inactief'}
                        </span>
                      </div>

                      <div class="admin-list-actions">
                        <button class="admin-small-btn" data-admin-edit-product="${product.id}">
                          Bewerken
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

function renderAdmin() {
  return `
    <div class="page admin-page">
      ${renderNav()}

      <header class="header">
        <div class="staff-brand">
          <img class="tea-shop-logo" src="/logo.jpg" alt="Blue Cup logo" />

          <div>
            <h1>Blue Cup Admin</h1>
            <p class="sub">Dashboard en dagoverzicht</p>
          </div>
        </div>

        ${adminMessage ? `<p class="success-message">${escapeHtml(adminMessage)}</p>` : ''}
        ${adminError ? `<p class="error admin-error">${escapeHtml(adminError)}</p>` : ''}
      </header>

      ${renderAdminDailyStats()}

      <section class="admin-dashboard-actions">
        <button class="admin-dashboard-card" id="go-admin-products">
          <span class="admin-dashboard-card-icon">☰</span>

          <span class="admin-dashboard-card-content">
            <strong>Producten beheren</strong>
            <small>Producten, categorieën, prijzen en toppings aanpassen</small>
          </span>

          <span class="admin-dashboard-card-arrow">→</span>
        </button>
      </section>
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

          <label class="admin-modal-field">
            <span>Prijs (€)</span>
            <input
              id="admin-product-price"
              class="admin-input"
              type="number"
              min="0"
              step="0.01"
              value="${Number(product.base_price).toFixed(2)}"
            />
          </label>

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

          <div class="admin-product-toggle-row">
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
            <h2>${escapeHtml(categoryName)}</h2>
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

          <label class="admin-checkbox-label admin-modal-checkbox">
            <input
              id="admin-category-edit-active"
              type="checkbox"
              ${category.is_active ? 'checked' : ''}
            />
            <span>Actief</span>
          </label>
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

        <div class="admin-column">
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

  const category =
    isDiscountCategory || isBestSellerCategory
      ? null
      : categories.find(
          (item) => String(item.id) === String(adminViewingCategoryId)
        )

  if (!isDiscountCategory && !isBestSellerCategory && !category) {
    return ''
  }

  const categoryName = isDiscountCategory
    ? DISCOUNT_CATEGORY_LABEL
    : isBestSellerCategory
      ? BESTSELLER_CATEGORY_LABEL
      : category!.name

  const categoryProducts = isDiscountCategory
    ? getDiscountedProducts()
    : isBestSellerCategory
      ? getBestSellerProducts()
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

            <label class="admin-checkbox-label">
              <input
                id="admin-category-active"
                type="checkbox"
                checked
              />
              <span>Actief</span>
            </label>
          </div>

          <div class="admin-form-actions">
            <button class="admin-primary-btn" id="admin-save-category">
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
                                  : getAdminCategoryProductCount(category.name)
                            } producten</span>

                            ${
                              isDiscountSystemCategory(category)
                                ? `<span class="admin-auto-category-label">Automatisch gevuld</span>`
                                : isBestSellerSystemCategory(category)
                                  ? `<span class="admin-auto-category-label">Handmatig geselecteerd</span>`
                                  : ''
                            }

                            ${
                              !isDiscountSystemCategory(category) &&
                              !isBestSellerSystemCategory(category) &&
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
                              class="admin-small-btn admin-category-products-btn"
                              data-admin-view-category-products="${
                                isDiscountSystemCategory(category)
                                  ? DISCOUNT_CATEGORY_KEY
                                  : isBestSellerSystemCategory(category)
                                    ? BESTSELLER_CATEGORY_KEY
                                    : category.id
                              }"
                            >
                              Producten (${
                                isDiscountSystemCategory(category)
                                  ? getDiscountedProducts().length
                                  : isBestSellerSystemCategory(category)
                                    ? getBestSellerProducts().length
                                    : getAdminCategoryProductCount(category.name)
                              })
                            </button>

                            ${
                              isDiscountSystemCategory(category) || isBestSellerSystemCategory(category)
                                ? ''
                                : `
                                  <button class="admin-small-btn" data-admin-edit-category="${category.id}">
                                    Bewerken
                                  </button>
                                `
                            }

                            <button
                              class="admin-small-btn ${category.is_active ? 'danger' : 'success'}"
                              data-admin-toggle-category="${category.id}"
                              data-admin-next-category-active="${category.is_active ? 'false' : 'true'}"
                            >
                              ${category.is_active ? 'Uitzetten' : 'Activeren'}
                            </button>
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
  const salesRows = getAdminDrinkSalesRows()
  const toppingSalesRows = getAdminToppingSalesRows()

  return `
    <div class="page admin-page">
      ${renderNav()}

      <header class="header admin-products-header">
        <div class="staff-brand">
          <img class="tea-shop-logo" src="/logo.jpg" alt="Blue Cup logo" />

          <div>
            <h1>Verkochte drankjes</h1>
            <p class="sub">${escapeHtml(formatAdminTodayDate())}</p>
          </div>
        </div>

        <button class="admin-secondary-btn" id="back-admin-from-sales">
          ← Admin dashboard
        </button>
      </header>

      <section class="admin-sales-summary">
        <div>
          <span>Totaal verkocht</span>
          <strong>${getAdminTodayDrinkCount()} drankjes</strong>
        </div>

        <div>
          <span>Omzet vandaag</span>
          <strong>€ ${getAdminTodayRevenue().toFixed(2)}</strong>
        </div>
      </section>

      <div class="admin-sales-sections">
        <section class="admin-panel admin-sales-panel">
          <div class="admin-panel-header">
            <div>
              <h2>Verkoop per drankje</h2>
              <p class="muted">Gesorteerd van meest naar minst verkocht.</p>
            </div>
          </div>

          <div class="admin-sales-list">
            ${
              salesRows.length === 0
                ? `<p class="muted">Nog geen verkochte drankjes vandaag.</p>`
                : salesRows
                    .map(
                      (row, index) => `
                        <div class="admin-sales-row">
                          <span class="admin-sales-rank">${index + 1}</span>

                          <div class="admin-sales-product">
                            <strong>${escapeHtml(row.name)}</strong>
                            <span>€ ${row.revenue.toFixed(2)} omzet</span>
                          </div>

                          <div class="admin-sales-quantity">
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

        <section class="admin-panel admin-sales-panel">
          <div class="admin-panel-header">
            <div>
              <h2>Verkoop per topping</h2>
              <p class="muted">Hoe vaak elke topping vandaag is verkocht.</p>
            </div>
          </div>

          <div class="admin-sales-list">
            ${
              toppingSalesRows.length === 0
                ? `<p class="muted">Nog geen toppings verkocht vandaag.</p>`
                : toppingSalesRows
                    .map(
                      (row, index) => `
                        <div class="admin-sales-row">
                          <span class="admin-sales-rank">${index + 1}</span>

                          <div class="admin-sales-product">
                            <strong>${escapeHtml(row.name)}</strong>
                            <span>€ ${row.revenue.toFixed(2)} toppingomzet</span>
                          </div>

                          <div class="admin-sales-quantity">
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
    </div>
  `
}

// =============================
// RENDER: STAFF POS
// =============================

function renderPos() {
  const grouped = groupProductsByCategory()

  return `
    <div class="page">
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
          <h2>Producten</h2>
          ${renderProductGroups(grouped)}
        </section>

        ${renderCart(false)}
      </main>
    </div>
  `
}


// =============================
// RENDER: ORDERS
// =============================

function renderOrders() {
  const filteredOrders = getFilteredOrders()

  return `
    <div class="page">
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
          <p class="muted">${escapeHtml(getPaymentText(order))}</p>
          ${customerText ? `<p class="muted">${escapeHtml(customerText)}</p>` : ''}
        </div>

        <span class="status-badge status-${order.status}">
          ${order.status}
        </span>
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
                        ${renderModifierSummary(item.ice_level, item.sugar_level, item.toppings)}
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
    return `<p class="muted">Order geannuleerd.</p>`
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
        ? `<button class="status-btn green" data-status-order="${order.id}" data-next-status="completed">Afgerond</button>`
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
        ${renderModifierSummary(label.ice_level, label.sugar_level, label.toppings)}
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


// =============================
// APP RENDER
// =============================

function render() {
  const app = document.querySelector<HTMLDivElement>('#app')!

  if (screen === 'pos') {
    app.innerHTML = renderPos()
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

  if (screen === 'admin') {
    app.innerHTML = renderAdmin()
  }

  if (screen === 'admin-products') {
    app.innerHTML = renderAdminProductsPage()
  }

  if (screen === 'admin-sales') {
    app.innerHTML = renderAdminSalesPage()
  }

  if (screen === 'admin-add-product') {
    app.innerHTML = renderAdminAddProductPage()
  }

  if (screen === 'admin-add-topping' || screen === 'admin-categories') {
    app.innerHTML = renderAdminAddToppingPage()
  }

  if (screen === 'admin-categories') {
    app.innerHTML = renderAdminCategoriesPage()
  }

  bindEvents()
}


// =============================
// EVENTS
// =============================

function bindEvents() {
  document.querySelectorAll<HTMLElement>('[data-customer-language]').forEach((button) => {
    button.addEventListener('click', () => {
      const language = button.dataset.customerLanguage as CustomerLanguage | undefined

      if (!language) return

      setCustomerLanguage(language)
    })
  })

  document.querySelector<HTMLButtonElement>('#go-pos')?.addEventListener('click', goToPos)
  document.querySelector<HTMLButtonElement>('#go-orders')?.addEventListener('click', goToOrders)
  document.querySelector<HTMLButtonElement>('#go-kitchen')?.addEventListener('click', goToKitchen)
  document.querySelector<HTMLButtonElement>('#go-admin')?.addEventListener('click', goToAdmin)
  document.querySelector<HTMLButtonElement>('#go-admin-products')?.addEventListener('click', goToAdminProducts)
  document.querySelector<HTMLButtonElement>('#go-admin-sales')?.addEventListener('click', goToAdminSales)
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

      if (target.closest('button')) {
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

  document.querySelector<HTMLButtonElement>('#admin-save-product')?.addEventListener('click', saveAdminProduct)
  document.querySelector<HTMLButtonElement>('#admin-cancel-product')?.addEventListener('click', cancelAdminProductEdit)
  document.querySelector<HTMLButtonElement>('#admin-save-topping')?.addEventListener('click', saveAdminTopping)
  document.querySelector<HTMLButtonElement>('#admin-cancel-topping')?.addEventListener('click', cancelAdminToppingEdit)

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

  if (screen === 'admin' || screen === 'admin-products' || screen === 'admin-sales' || screen === 'admin-add-product' || screen === 'admin-add-topping') {
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
  await Promise.all([
    loadProducts(),
    loadToppings(),
    loadProductToppingLinks(),
    loadCategories(),
    loadBestSellerSales(),
  ])

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

  if (screen === 'admin' || screen === 'admin-products' || screen === 'admin-sales' || screen === 'admin-add-product' || screen === 'admin-add-topping') {
    await loadAllAdminData()
    return
  }

  render()
}

startApp()