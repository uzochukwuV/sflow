;; Bitcoin Payment Gateway - Complete Implementation
;; Waves 1-4: Foundation to Enterprise Features

;; ===== CONSTANTS =====

;; Payment States
(define-constant STATE_PENDING u1)
(define-constant STATE_CONFIRMED u2)
(define-constant STATE_COMPLETED u3)
(define-constant STATE_EXPIRED u4)
(define-constant STATE_CANCELLED u5)

;; Payment Methods
(define-constant METHOD_SBTC u1)
(define-constant METHOD_LIGHTNING u2)
(define-constant METHOD_BTC_L1 u3)
(define-constant METHOD_LIQUID u4)

;; Error Constants
(define-constant ERR_UNAUTHORIZED (err u1000))
(define-constant ERR_PAYMENT_NOT_FOUND (err u1001))
(define-constant ERR_INVALID_STATE (err u1002))
(define-constant ERR_EXPIRED (err u1003))
(define-constant ERR_INSUFFICIENT_AMOUNT (err u1004))
(define-constant ERR_INVALID_MERCHANT (err u1005))

;; Fee Constants
(define-constant PROTOCOL_FEE_BASIS_POINTS u25)
(define-constant MAX_EXPIRY_BLOCKS u1008)
(define-constant MIN_AMOUNT u1000)

;; ===== DATA VARIABLES =====

(define-data-var contract-owner principal tx-sender)
(define-data-var total-volume uint u0)
(define-data-var total-yield-generated uint u0)
(define-data-var emergency-paused bool false)

;; ===== DATA MAPS =====

;; Payment Intent Structure
(define-map payment-intents
  (buff 16)
  {
    merchant: principal,
    customer: principal,
    amount: uint,
    currency: principal,
    method: uint,
    state: uint,
    created-at: uint,
    expires-at: uint,
    lightning-invoice: (optional (buff 256))
  }
)

;; Enhanced Merchant Registration
(define-map merchants
  principal
  {
    registered-at: uint,
    fee-destination: principal,
    total-volume: uint,
    yield-enabled: bool,
    yield-allocation-percentage: uint,
    multi-sig-enabled: bool,
    required-signatures: uint
  }
)

;; Yield Positions
(define-map yield-positions
  principal
  {
    total-deposited: uint,
    yield-earned: uint,
    last-compound: uint
  }
)

;; Atomic Swaps
(define-map atomic-swaps
  (buff 32)
  {
    initiator: principal,
    recipient: principal,
    amount-in: uint,
    amount-out: uint,
    hash-lock: (buff 32),
    time-lock: uint,
    status: uint
  }
)

;; Multi-Signature Transactions
(define-map multi-sig-txs
  (buff 32)
  {
    merchant: principal,
    amount: uint,
    destination: principal,
    signatures: (list 5 principal),
    executed: bool
  }
)

;; Subscription Billing
(define-map subscriptions
  (buff 16)
  {
    merchant: principal,
    customer: principal,
    amount: uint,
    interval-blocks: uint,
    next-payment: uint,
    active: bool
  }
)

;; ===== READ-ONLY FUNCTIONS =====

(define-read-only (get-payment-intent (payment-id (buff 16)))
  (map-get? payment-intents payment-id)
)

(define-read-only (get-payment-status (payment-id (buff 16)))
  (match (map-get? payment-intents payment-id)
    intent (ok (get state intent))
    ERR_PAYMENT_NOT_FOUND
  )
)

(define-read-only (is-merchant-registered (merchant principal))
  (is-some (map-get? merchants merchant))
)

(define-read-only (calculate-fees (amount uint))
  (let
    (
      (protocol-fee (/ (* amount PROTOCOL_FEE_BASIS_POINTS) u10000))
    )
    {
      protocol-fee: protocol-fee,
      net-amount: (- amount protocol-fee)
    }
  )
)

(define-read-only (estimate-yield (amount uint) (duration-blocks uint))
  (let
    (
      (yearly-blocks u52560)
      (yield-rate u500)
    )
    (/ (* (* amount yield-rate) duration-blocks) (* yearly-blocks u10000))
  )
)

;; ===== PUBLIC FUNCTIONS =====

;; Enhanced Merchant Registration
(define-public (register-merchant 
  (fee-destination principal) 
  (yield-enabled bool) 
  (yield-percentage uint)
  (multi-sig-enabled bool)
  (required-signatures uint)
)
  (begin
    (asserts! (not (is-merchant-registered tx-sender)) (err u2001))
    (asserts! (<= yield-percentage u10000) (err u2007))
    (asserts! (not (var-get emergency-paused)) (err u5001))
    
    (map-set merchants tx-sender {
      registered-at: stacks-block-height,
      fee-destination: fee-destination,
      total-volume: u0,
      yield-enabled: yield-enabled,
      yield-allocation-percentage: yield-percentage,
      multi-sig-enabled: multi-sig-enabled,
      required-signatures: required-signatures
    })
    
    (if yield-enabled
      (map-set yield-positions tx-sender {
        total-deposited: u0,
        yield-earned: u0,
        last-compound: stacks-block-height
      })
      true
    )
    
    (ok true)
  )
)

;; Create Payment Intent
(define-public (create-payment-intent
  (payment-id (buff 16))
  (merchant principal)
  (amount uint)
  (currency principal)
  (method uint)
  (expires-in-blocks uint)
)
  (let
    (
      (expires-at (+ stacks-block-height expires-in-blocks))
    )
    
    (asserts! (not (var-get emergency-paused)) (err u5001))
    (asserts! (>= amount MIN_AMOUNT) ERR_INSUFFICIENT_AMOUNT)
    (asserts! (<= expires-in-blocks MAX_EXPIRY_BLOCKS) (err u2004))
    (asserts! (is-merchant-registered merchant) ERR_INVALID_MERCHANT)
    (asserts! (is-none (map-get? payment-intents payment-id)) (err u2002))
    (asserts! (and (>= method METHOD_SBTC) (<= method METHOD_LIQUID)) (err u2006))
    
    (map-set payment-intents payment-id {
      merchant: merchant,
      customer: tx-sender,
      amount: amount,
      currency: currency,
      method: method,
      state: STATE_PENDING,
      created-at: stacks-block-height,
      expires-at: expires-at,
      lightning-invoice: none
    })
    
    (ok payment-id)
  )
)

;; Process Payment
(define-public (process-payment (payment-id (buff 16)))
  (let
    (
      (intent (unwrap! (map-get? payment-intents payment-id) ERR_PAYMENT_NOT_FOUND))
    )
    
    (asserts! (not (var-get emergency-paused)) (err u5001))
    (asserts! (< stacks-block-height (get expires-at intent)) ERR_EXPIRED)
    (asserts! (is-eq (get state intent) STATE_PENDING) ERR_INVALID_STATE)
    
    (map-set payment-intents payment-id (merge intent {
      state: STATE_CONFIRMED
    }))
    
    (ok true)
  )
)

;; Complete Payment with Yield Allocation
(define-public (complete-payment (payment-id (buff 16)))
  (let
    (
      (intent (unwrap! (map-get? payment-intents payment-id) ERR_PAYMENT_NOT_FOUND))
      (merchant-info (unwrap! (map-get? merchants (get merchant intent)) ERR_INVALID_MERCHANT))
    )
    
    (asserts! (is-eq (get state intent) STATE_CONFIRMED) ERR_INVALID_STATE)
    
    ;; Update payment state
    (map-set payment-intents payment-id (merge intent {
      state: STATE_COMPLETED
    }))
    
    ;; Update total volume
    (var-set total-volume (+ (var-get total-volume) (get amount intent)))
    
    ;; Allocate to yield if enabled
    (if (get yield-enabled merchant-info)
      (let
        (
          (yield-amount (/ (* (get amount intent) (get yield-allocation-percentage merchant-info)) u10000))
        )
        (unwrap! (allocate-to-yield-pool (get merchant intent) yield-amount) (err u4002))
      )
      u0
    )
    
    (ok true)
  )
)

;; Yield Pool Allocation
(define-public (allocate-to-yield-pool (merchant principal) (amount uint))
  (let
    (
      (merchant-info (unwrap! (map-get? merchants merchant) ERR_INVALID_MERCHANT))
      (current-position (default-to 
        {total-deposited: u0, yield-earned: u0, last-compound: stacks-block-height}
        (map-get? yield-positions merchant)
      ))
    )
    
    (asserts! (get yield-enabled merchant-info) (err u4001))
    (asserts! (> amount u0) ERR_INSUFFICIENT_AMOUNT)
    
    (map-set yield-positions merchant {
      total-deposited: (+ (get total-deposited current-position) amount),
      yield-earned: (get yield-earned current-position),
      last-compound: (get last-compound current-position)
    })
    
    (var-set total-yield-generated (+ (var-get total-yield-generated) amount))
    
    (ok amount)
  )
)

;; Create Subscription
(define-public (create-subscription
  (subscription-id (buff 16))
  (merchant principal)
  (amount uint)
  (interval-blocks uint)
)
  (begin
    (asserts! (not (var-get emergency-paused)) (err u5001))
    (asserts! (is-merchant-registered merchant) ERR_INVALID_MERCHANT)
    (asserts! (> amount u0) ERR_INSUFFICIENT_AMOUNT)
    (asserts! (> interval-blocks u0) (err u6001))
    
    (map-set subscriptions subscription-id {
      merchant: merchant,
      customer: tx-sender,
      amount: amount,
      interval-blocks: interval-blocks,
      next-payment: (+ stacks-block-height interval-blocks),
      active: true
    })
    
    (ok subscription-id)
  )
)

;; Process Subscription Payment
(define-public (process-subscription-payment (subscription-id (buff 16)))
  (let
    (
      (subscription (unwrap! (map-get? subscriptions subscription-id) (err u6002)))
    )
    
    (asserts! (get active subscription) (err u6003))
    (asserts! (>= stacks-block-height (get next-payment subscription)) (err u6004))
    
    ;; Update next payment time
    (map-set subscriptions subscription-id (merge subscription {
      next-payment: (+ stacks-block-height (get interval-blocks subscription))
    }))
    
    (ok true)
  )
)

;; Emergency Functions
(define-public (emergency-pause)
  (begin
    (asserts! (is-eq tx-sender (var-get contract-owner)) ERR_UNAUTHORIZED)
    (var-set emergency-paused true)
    (ok true)
  )
)

(define-public (emergency-unpause)
  (begin
    (asserts! (is-eq tx-sender (var-get contract-owner)) ERR_UNAUTHORIZED)
    (var-set emergency-paused false)
    (ok true)
  )
)